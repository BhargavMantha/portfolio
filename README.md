# Bhargav Mantha - Portfolio

> A space-flight portfolio: fly a starship between planets, where each planet is a chapter of my career.

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://bhargavmantha.dev)
[![Built with React](https://img.shields.io/badge/React-18.2-61DAFB?logo=react)](https://react.dev)
[![Powered by Vite](https://img.shields.io/badge/Vite-4.4-646CFF?logo=vite)](https://vitejs.dev)

## Features

- **Fly the story**: steer with WASD, drag with the mouse or a finger, or press Space for autopilot to the next stop
- **Planets as chapters**: arrive at a planet and its chapter opens; a route bar jumps to any stop
- **Collect skills**: skill orbs along the route fill in the capability map
- **Plain version**: a "Skip to portfolio" button, and phones, reduced-motion users and browsers without WebGL get a fast scrolling page automatically (`?view=classic` / `?view=game` force either)
- **All procedural**: ship, planets, station and nebula are generated in code, so there are no model downloads

## Tech Stack

- **Frontend**: React 18, TypeScript
- **3D**: Three.js with bloom post-processing and custom GLSL shaders
- **Styling**: CSS (Montserrat, navy and sky blue), Tailwind base
- **Build Tool**: Vite
- **Deployment**: Netlify / Vercel

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/BhargavMantha/portfolio.git
cd portfolio

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

## 🏗️ Build

```bash
# Create production build
npm run build

# Preview production build
npm run preview
```

## 📝 Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run format` - Format code with Prettier

## Project Structure

```
src/
├── App.tsx                  # picks the game or the plain page
└── space/
    ├── content.ts           # all copy: hero, stops, skills, contact (edit the story here)
    ├── engine.ts            # renderer, flight model, autopilot, docking, skill pickups
    ├── world.ts             # procedural ship, planets, station, beacon, stars, nebula
    ├── SpaceExperience.tsx  # game HUD, intro, chapter panels, route bar
    ├── Classic.tsx          # plain scrolling portfolio
    └── space.css
```

### Private pages (`/plan`, `/syllabus`)

`/plan` and `/syllabus` are static sub-pages served from `public/<page>/index.html`.
Each ships as **ciphertext**: the page content is AES-256-GCM encrypted, and the
key is derived in the browser from a username + password via PBKDF2-SHA256.
There is no server check — without the credentials the file is unreadable, so
nothing sensitive sits in the repo or on the CDN in the clear.

The plaintext for each page lives in a gitignored folder (`plan-source/`,
`syllabus-source/`) holding `content.html` (markup + CSS) and `behaviour.js`.
To edit and republish a page:

```bash
PAGE_USER='...' PAGE_PASS='...' node scripts/encrypt-page.mjs syllabus   # or: plan
```

That regenerates `public/<page>/index.html` from `scripts/private-gate.template.html`.
Re-running it with different credentials is all it takes to change the password.
New pages are added to the `PAGES` map in the script, plus a rewrite in
`vercel.json` and `netlify.toml`.

Because the ciphertext is downloadable, its security is exactly the strength of
the passphrase plus the PBKDF2 work factor (`ITERATIONS` in the script). Prefer a
long passphrase over a short complex one.

### The private `/dojo` page

`/dojo` is the DSA + CKA/CKS rule book and progress tracker. It uses the same
scheme as `/plan`: `public/dojo/index.html` ships as AES-256-GCM ciphertext and
the plaintext lives in `dojo-source/` (gitignored).

```bash
# edit dojo-source/content.html (markup + CSS) or dojo-source/behaviour.js
DOJO_USER='...' DOJO_PASS='...' node scripts/encrypt-dojo.mjs
```

That regenerates `public/dojo/index.html` from `scripts/dojo-gate.template.html`
and `netlify/functions/dojo-progress/token-hash.mjs`. Commit both.

Progress is stored in Netlify Blobs by the `dojo-progress` function
(`/.netlify/functions/dojo-progress`, needs `@netlify/blobs`). The browser
derives an API token from the decryption key and the function checks it against
the committed hash, so there are no environment variables to set. Re-running the
script rotates the token and keeps the saved progress. This part is
Netlify-only; on Vercel the page works but saves to the browser alone.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 👤 Author

**Bhargav Mantha**
- Website: [bhargavmantha.dev](https://bhargavmantha.dev)
- GitHub: [@BhargavMantha](https://github.com/BhargavMantha)
- LinkedIn: [bhargavmantha](https://linkedin.com/in/bhargavmantha)
- Blog: [dev.to/bhargavmantha](https://dev.to/bhargavmantha)

---

Built with ❤️ and ⚡ by Bhargav Mantha
