const express = require('express');
const path = require('node:path');

const app = express();
const port = Number.parseInt(process.env.PORT || '3000', 10);
const host = process.env.HOST || '0.0.0.0';
const rootDir = __dirname;

// Keep the original screen files in place for compatibility, but expose a
// small, readable URL map so users and future code do not need the old folder names.
const pages = {
  home: 'lingua_start_from_abcd._end_with_confidence._coral_cta/code.html',
  language: 'choose_your_language_lingua_onboarding/code.html',
  profile: 'your_profile_lingua_step_2_of_3/code.html',
  ready: 'you_re_ready_lingua_onboarding_step_3_of_3/code.html',
  learn: 'lingua_home_stage_map_stage_1_alphabet_elevated/code.html',
  stage: 'lingua_stage_1_alphabet_core_phonics_fast_track/code.html',
  lesson: 'lingua_lesson_player_cluster_1_core_vowels_exercise_engine/code.html',
  complete: 'lingua_lesson_complete_core_vowels_mastered/code.html',
  practice: 'lingua_practice_hub_polished_focused/code.html',
};

app.disable('x-powered-by');

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', app: 'LinGua' });
});

// Short URLs redirect to the original files rather than serving them directly.
// This preserves each page's existing relative links and assets.
app.get('/', (_req, res) => res.redirect(302, '/start'));
app.get('/start', (_req, res) => res.redirect(302, `/${pages.home}`));
app.get('/onboarding/language', (_req, res) => res.redirect(302, `/${pages.language}`));
app.get('/onboarding/profile', (_req, res) => res.redirect(302, `/${pages.profile}`));
app.get('/onboarding/ready', (_req, res) => res.redirect(302, `/${pages.ready}`));
app.get('/learn', (_req, res) => res.redirect(302, `/${pages.learn}`));
app.get('/learn/stage-1', (_req, res) => res.redirect(302, `/${pages.stage}`));
app.get('/lesson/vowels', (_req, res) => res.redirect(302, `/${pages.lesson}`));
app.get('/lesson/complete', (_req, res) => res.redirect(302, `/${pages.complete}`));
app.get('/practice', (_req, res) => res.redirect(302, `/${pages.practice}`));

app.use(
  express.static(rootDir, {
    dotfiles: 'deny',
    index: 'index.html',
    fallthrough: true,
    etag: true,
    maxAge: process.env.NODE_ENV === 'production' ? '1h' : 0,
  }),
);

app.use((_req, res) => {
  res.status(404).type('text').send('Page not found');
});

app.listen(port, host, () => {
  console.log(`LinGua is running at http://${host}:${port}`);
});
