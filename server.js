const express = require('express');
const path = require('node:path');

const app = express();
const port = Number.parseInt(process.env.PORT || '3000', 10);
const host = process.env.HOST || '0.0.0.0';
const rootDir = __dirname;
const landingPage = path.join(
  rootDir,
  'lingua_start_from_abcd._end_with_confidence._coral_cta',
  'code.html',
);

app.disable('x-powered-by');

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', app: 'LinGua' });
});

// Serve the original landing page at the app root. The existing screen
// directories remain in place so their relative navigation and assets work.
app.get('/', (_req, res) => {
  res.sendFile(landingPage);
});

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
