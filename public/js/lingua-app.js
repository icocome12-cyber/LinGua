(() => {
  const languageVoices = {
    english: 'en-US',
    twi: 'ak-GH',
    german: 'de-DE',
    dutch: 'nl-NL',
    spanish: 'es-ES'
  };
  const audioPhrases = {
    pitch: 'Bana. Listen for the changing pitch.',
    numbers: 'One, two, three, four, five, six, seven, eight, nine, ten.'
  };
  const conversation = [];
  let aiAvailable = false;

  function speak(text) {
    if (!text || !('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) {
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const language = localStorage.getItem('lingua_lang') || 'english';
    const locale = languageVoices[language] || languageVoices.english;
    const voices = window.speechSynthesis.getVoices();
    utterance.lang = locale;
    utterance.rate = 0.86;
    utterance.voice =
      voices.find((voice) => voice.lang.toLowerCase() === locale.toLowerCase()) ||
      voices.find((voice) => voice.lang.toLowerCase().startsWith(locale.slice(0, 2))) ||
      null;
    window.speechSynthesis.speak(utterance);
  }

  function appendMessage(role, text) {
    const messages = document.getElementById('lingua-tutor-messages');
    const bubble = document.createElement('div');
    bubble.className = 'lingua-tutor-message';
    bubble.dataset.role = role;
    const content = document.createElement('span');
    content.textContent = text;
    bubble.appendChild(content);
    if (role === 'model') {
      const listenButton = document.createElement('button');
      listenButton.className = 'lingua-tutor-speak';
      listenButton.type = 'button';
      listenButton.dataset.audio = text;
      listenButton.setAttribute('aria-label', 'Read tutor response aloud');
      listenButton.textContent = '🔊 Listen';
      bubble.appendChild(listenButton);
    }
    messages.appendChild(bubble);
    messages.scrollTop = messages.scrollHeight;
  }

  function setStatus(text) {
    document.getElementById('lingua-tutor-status').textContent = text;
  }

  function createTutor() {
    if (window.location.pathname.includes('lingua_practice_hub')) {
      document.title = 'Practice Hub — LinGua';
    }

    const stylesheet = document.createElement('link');
    stylesheet.rel = 'stylesheet';
    stylesheet.href = '/styles/lingua-app.css';
    document.head.appendChild(stylesheet);

    const toggle = document.createElement('button');
    toggle.className = 'lingua-tutor-toggle';
    toggle.type = 'button';
    toggle.textContent = '✦ Ask Koko';
    toggle.setAttribute('aria-controls', 'lingua-tutor-panel');
    toggle.setAttribute('aria-expanded', 'false');

    const panel = document.createElement('section');
    panel.className = 'lingua-tutor-panel';
    panel.id = 'lingua-tutor-panel';
    panel.setAttribute('aria-label', 'AI language tutor');
    panel.innerHTML = `
      <header class="lingua-tutor-header">
        <div>
          <h2>Koko's AI Tutor</h2>
          <p>Ask about a word, sound, or lesson.</p>
        </div>
        <button class="lingua-tutor-close" type="button" aria-label="Close tutor">×</button>
      </header>
      <div class="lingua-tutor-messages" id="lingua-tutor-messages" aria-live="polite">
        <div class="lingua-tutor-message" data-role="model">Hi! I'm Koko. What would you like to practice?</div>
      </div>
      <p class="lingua-tutor-status" id="lingua-tutor-status" role="status">Connecting to the tutor…</p>
      <form class="lingua-tutor-form" id="lingua-tutor-form">
        <input class="lingua-tutor-input" id="lingua-tutor-input" name="message" maxlength="1200" placeholder="Type a question…" autocomplete="off" required>
        <button class="lingua-tutor-send" type="submit">Send</button>
      </form>
    `;

    document.body.append(toggle, panel);

    if (document.getElementById('checkBtn')) document.body.classList.add('lesson-page');

    const closeButton = panel.querySelector('.lingua-tutor-close');
    function setOpen(open) {
      panel.dataset.open = String(open);
      toggle.setAttribute('aria-expanded', String(open));
      if (open) document.getElementById('lingua-tutor-input').focus();
    }

    toggle.addEventListener('click', () => setOpen(panel.dataset.open !== 'true'));
    closeButton.addEventListener('click', () => setOpen(false));
    panel.querySelector('form').addEventListener('submit', sendMessage);

    const feedbackPanel = document.getElementById('feedbackPanel');
    if (feedbackPanel) {
      const feedbackObserver = new MutationObserver(() => {
        document.body.classList.toggle('lesson-feedback-open', feedbackPanel.classList.contains('is-open'));
      });
      feedbackObserver.observe(feedbackPanel, { attributes: true, attributeFilter: ['class'] });
    }

    fetch('/api/health')
      .then((response) => {
        if (!response.ok) throw new Error('Health check failed');
        return response.json();
      })
      .then((health) => {
        aiAvailable = health.aiAvailable;
        setStatus(aiAvailable
          ? 'Ready to help.'
          : 'Add GEMINI_API_KEY to .env on the server to enable AI tutoring.');
      })
      .catch(() => setStatus('Tutor status unavailable. Check your connection and try again.'));
  }

  async function sendMessage(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const input = document.getElementById('lingua-tutor-input');
    const sendButton = form.querySelector('button[type="submit"]');
    const message = input.value.trim();

    if (!message) return;
    if (!aiAvailable) {
      setStatus('The Gemini tutor is not configured on this server yet.');
      return;
    }

    appendMessage('user', message);
    conversation.push({ role: 'user', text: message });
    input.value = '';
    sendButton.disabled = true;
    setStatus('Koko is thinking…');

    try {
      const response = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          message,
          language: localStorage.getItem('lingua_lang') || 'twi',
          history: conversation.slice(0, -1).slice(-10)
        })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'The tutor could not answer.');

      appendMessage('model', result.reply);
      conversation.push({ role: 'model', text: result.reply });
      if (conversation.length > 10) conversation.splice(0, conversation.length - 10);
      setStatus('Ready when you are.');
    } catch (error) {
      conversation.pop();
      appendMessage('model', error.message);
      setStatus('Your message was not sent. You can try again.');
    } finally {
      sendButton.disabled = false;
      input.focus();
    }
  }

  document.addEventListener('click', (event) => {
    const audioButton = event.target.closest('[data-audio], #letterGrid button');
    if (!audioButton) return;

    const phrase = audioButton.dataset.audio;
    const text = audioPhrases[phrase] || phrase || audioButton.textContent.trim();
    speak(text);
  }, true);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createTutor, { once: true });
  } else {
    createTutor();
  }
})();
