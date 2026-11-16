# LinGua

LinGua is a beginner-first language-learning prototype built from HTML screens and a small Express server.

## Run locally

Requirements: Node.js 18+ and npm.

```bash
npm install
npm start
```

Open <http://localhost:3000>. Use `PORT=8080 npm start` to select another port, or `npm run dev` to restart the server when `server.js` changes.

## Clean app URLs

The Express server provides readable entry URLs for the existing screens:

| URL | Screen |
| --- | --- |
| `/` or `/start` | Landing page |
| `/onboarding/language` | Choose a language |
| `/onboarding/profile` | Learner profile and daily goal |
| `/onboarding/ready` | Onboarding complete |
| `/learn` | Learning map |
| `/learn/stage-1` | Stage 1 overview |
| `/lesson/vowels` | Core vowels lesson |
| `/lesson/complete` | Lesson completion |
| `/practice` | Practice hub |
| `/health` | Server health check (JSON) |

These URLs redirect to the original screen files. Keeping the original paths as the destination preserves existing relative navigation and assets.

## Repository layout

The screen directories currently have generated, descriptive names and each contains its HTML screen (and, for most screens, a screenshot). The server now offers short URLs so those internal paths do not need to be used by learners. Other root files:

- `index.html` — static-hosting entry point
- `server.js` — Express server, URL aliases, and static-file hosting
- `package.json` — Node.js metadata and scripts
- `warm_sprout_learning/` — design notes

The original screen files and screenshots are retained to avoid breaking links. A physical move/removal of those directories should be done as a dedicated filesystem refactor that updates every relative link and asset reference together.
