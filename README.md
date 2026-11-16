# LinGua

LinGua is a Node.js/Express app that serves the original LinGua HTML screens
without changing their design or interactions.

## Requirements

- Node.js 18 or newer
- npm

## Run locally

```sh
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000). Set `PORT` to use a
different port. For automatic restarts during development, use `npm run dev`.

## Enable the Gemini tutor

1. Create a Gemini API key in Google AI Studio.
2. Copy `.env.example` to `.env` and set `GEMINI_API_KEY` to your key.
3. Restart the server.

The key is only read by the Node server and is sent to Google in a request
header; it is never included in browser code. Do not commit `.env`. The Ask
Koko tutor explains lessons and vocabulary using the selected learning
language. Without a key, the rest of the app still works and the tutor reports
that it is unavailable. Tutor requests are limited to 30 per IP every 15
minutes by the app's in-memory limiter.

Speech playback uses the browser's built-in speech voices. Pronunciation
practice uses browser speech recognition and requires microphone permission;
recognition support and available voices depend on the browser and operating
system. Microphone audio is not sent to LinGua or Gemini.

## Routes

| Route | Screen |
| --- | --- |
| `/` | Original landing-page redirect |
| `/welcome` | Landing page |
| `/onboarding/language` | Language selection |
| `/onboarding/profile` | Profile setup |
| `/onboarding/ready` | Onboarding complete |
| `/learn` | Learning map |
| `/stage-1` | Stage 1 |
| `/learn/stage-1` | Stage 1 (legacy clean URL) |
| `/lesson` | Lesson player |
| `/lesson/vowels` | Lesson player (legacy clean URL) |
| `/lesson/complete` | Lesson complete |
| `/practice` | Practice hub |
| `/start` | Landing page (legacy clean URL) |
| `/health` | Server health (legacy URL) |
| `/api/health` | Server health |

Original file paths and their relative links remain available. The HTML
screens and images are in `public/`; the Express app and server entry point are
in `src/`.

For a public deployment, configure `GEMINI_API_KEY` and `PORT` as server
environment variables, and use HTTPS so microphone access is available.

## Tests

```sh
npm test
```
