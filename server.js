const express = require('express');
const path = require('node:path');

const app = express();
const port = Number.parseInt(process.env.PORT || '3000', 10);
const host = process.env.HOST || '0.0.0.0';
const rootDir = __dirname;

const pages = {
  home: path.join(rootDir, 'app', 'landing', 'index.html'),
  language: path.join(rootDir, 'app', 'onboarding', 'language.html'),
  profile: path.join(rootDir, 'app', 'onboarding', 'profile.html'),
  ready: path.join(rootDir, 'app', 'onboarding', 'ready.html'),
  learn: path.join(rootDir, 'app', 'learn', 'index.html'),
  stage: path.join(rootDir, 'app', 'learn', 'stage-1.html'),
  lesson: path.join(rootDir, 'app', 'lesson', 'vowels.html'),
  complete: path.join(rootDir, 'app', 'lesson', 'complete.html'),
  practice: path.join(rootDir, 'app', 'practice', 'index.html'),
};

app.disable('x-powered-by');

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', app: 'LinGua' });
});

app.get('/', (_req, res) => {
  res.sendFile(pages.home);
});

app.get('/start', (_req, res) => res.sendFile(pages.home));
app.get('/onboarding/language', (_req, res) => res.sendFile(pages.language));
app.get('/onboarding/profile', (_req, res) => res.sendFile(pages.profile));
app.get('/onboarding/ready', (_req, res) => res.sendFile(pages.ready));
app.get('/learn', (_req, res) => res.sendFile(pages.learn));
app.get('/learn/stage-1', (_req, res) => res.sendFile(pages.stage));
app.get('/lesson/vowels', (_req, res) => res.sendFile(pages.lesson));
app.get('/lesson/complete', (_req, res) => res.sendFile(pages.complete));
app.get('/practice', (_req, res) => res.sendFile(pages.practice));

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
