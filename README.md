# LinGua Node.js app

LinGua now has a Node.js/Express runtime while keeping the original HTML screens, JavaScript interactions, screenshots, and design notes intact. The repository root is the app folder; the existing screen directories are deliberately preserved because the original pages link to each other using relative paths.

## Requirements

- Node.js 18 or newer
- npm

## Run locally

```bash
npm install
npm start
```

Open <http://localhost:3000>. To use a different port, set `PORT` before starting the server:

```bash
PORT=8080 npm start
```

Development mode restarts the server when the Node.js entry point changes:

```bash
npm run dev
```

The original HTML pages continue to work at their existing paths. For example, the onboarding and lesson screens remain under their original screen directories. `GET /health` returns a small JSON health response.

## Project layout

- `server.js` — Express server and static-file routing
- `package.json` — Node.js metadata and run scripts
- `lingua_*/code.html` and other original screen directories — preserved original app code and assets
- `warm_sprout_learning/` — original design-system notes

This migration adds a Node.js server without rewriting the existing front end, so the existing localStorage-based onboarding and learning interactions are retained.
