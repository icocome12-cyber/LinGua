const express = require('express');
const { rateLimit } = require('express-rate-limit');
const path = require('node:path');

const app = express();
const publicDirectory = path.join(__dirname, '..', 'public');
const supportedLanguages = {
  english: 'English',
  twi: 'Twi',
  german: 'German',
  dutch: 'Dutch',
  spanish: 'Spanish'
};

const pages = {
  '/welcome': 'lingua_start_from_abcd._end_with_confidence._coral_cta/code.html',
  '/start': 'lingua_start_from_abcd._end_with_confidence._coral_cta/code.html',
  '/onboarding/language': 'choose_your_language_lingua_onboarding/code.html',
  '/onboarding/profile': 'your_profile_lingua_step_2_of_3/code.html',
  '/onboarding/ready': 'you_re_ready_lingua_onboarding_step_3_of_3/code.html',
  '/learn': 'lingua_home_stage_map_stage_1_alphabet_elevated/code.html',
  '/stage-1': 'lingua_stage_1_alphabet_core_phonics_fast_track/code.html',
  '/learn/stage-1': 'lingua_stage_1_alphabet_core_phonics_fast_track/code.html',
  '/lesson': 'lingua_lesson_player_cluster_1_core_vowels_exercise_engine/code.html',
  '/lesson/vowels': 'lingua_lesson_player_cluster_1_core_vowels_exercise_engine/code.html',
  '/lesson/complete': 'lingua_lesson_complete_core_vowels_mastered/code.html',
  '/practice': 'lingua_practice_hub_polished_focused/code.html'
};

const tutorRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'You have reached the tutor request limit. Please try again later.' }
});

app.get('/health', (_request, response) => {
  response.json({ status: 'ok', app: 'LinGua' });
});

app.get('/api/health', (_request, response) => {
  response.json({
    status: 'ok',
    aiAvailable: Boolean(process.env.GEMINI_API_KEY)
  });
});

app.use(express.json({ limit: '16kb' }));

app.post('/api/tutor', tutorRateLimit, async (request, response) => {
  const { message, language = 'twi', history = [] } = request.body || {};
  const apiKey = process.env.GEMINI_API_KEY;

  if (typeof message !== 'string' || !message.trim() || message.length > 1200) {
    return response.status(400).json({ error: 'Message must contain 1–1200 characters.' });
  }

  if (!Object.hasOwn(supportedLanguages, language)) {
    return response.status(400).json({ error: 'Choose a supported learning language.' });
  }

  if (
    !Array.isArray(history) ||
    history.length > 10 ||
    history.some((turn) =>
      !turn ||
      !['user', 'model'].includes(turn.role) ||
      typeof turn.text !== 'string' ||
      !turn.text.trim() ||
      turn.text.length > 1200
    )
  ) {
    return response.status(400).json({ error: 'Conversation history is invalid or too long.' });
  }

  if (!apiKey) {
    return response.status(503).json({
      error: 'The AI tutor is not configured. Add GEMINI_API_KEY to .env and restart the app.'
    });
  }

  const model = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
  const endpoint = new URL(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`
  );
  const contents = history.map((turn) => ({
    role: turn.role,
    parts: [{ text: turn.text }]
  }));
  contents.push({ role: 'user', parts: [{ text: message.trim() }] });

  let upstream;
  try {
    upstream = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{
            text: `You are Koko, a warm and precise language tutor in LinGua. Help the learner practice ${supportedLanguages[language]}. Give short, encouraging explanations and useful examples. For pronunciation, use simple phonetic hints; do not claim to provide audio. Preserve the correct spelling and diacritics of Twi. If you are unsure about a translation or dialect, say so instead of guessing.`
          }]
        },
        contents,
        generationConfig: {
          maxOutputTokens: 512,
          temperature: 0.5
        }
      }),
      signal: AbortSignal.timeout(20000)
    });
  } catch (error) {
    if (error.name === 'TimeoutError' || error.name === 'AbortError') {
      return response.status(504).json({ error: 'The AI tutor took too long to respond. Please try again.' });
    }

    console.error('Unable to reach the Gemini API:', error.message);
    return response.status(502).json({ error: 'The AI tutor could not be reached. Please try again.' });
  }

  if (!upstream.ok) {
    console.error(`Gemini API returned HTTP ${upstream.status}.`);
    const status = upstream.status === 429 ? 429 : 502;
    return response.status(status).json({
      error: upstream.status === 429
        ? 'The AI tutor is busy. Please wait a moment and try again.'
        : 'The AI tutor could not complete that request. Check the Gemini API key and try again.'
    });
  }

  let result;
  try {
    result = await upstream.json();
  } catch (error) {
    console.error('Gemini API returned an invalid response:', error.message);
    return response.status(502).json({ error: 'The AI tutor returned an invalid response. Please try again.' });
  }

  const reply = result.candidates
    ?.flatMap((candidate) => candidate.content?.parts || [])
    .map((part) => part.text || '')
    .join('')
    .trim();

  if (!reply) {
    return response.status(502).json({ error: 'The AI tutor returned an empty response. Please try again.' });
  }

  return response.json({ reply });
});

for (const [route, page] of Object.entries(pages)) {
  app.get(route, (_request, response, next) => {
    response.sendFile(path.join(publicDirectory, page), (error) => {
      if (error) next(error);
    });
  });
}

app.use(express.static(publicDirectory));

app.use((_request, response) => {
  response.status(404).type('text').send('Page not found');
});

module.exports = app;
