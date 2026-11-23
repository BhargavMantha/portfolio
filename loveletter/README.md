# A to B

A private anniversary site: seven chapters of photos and words, joined by a sunlit morning forest you ride through, glade to glade, on a unicorn.

## Why the content is encrypted

This code lives in a public repository and is served as public static files. The photos and the words are therefore stored **encrypted** (`public/enc/`, AES-256-GCM). The key is derived in the browser from the name and password typed on the first screen (PBKDF2-SHA256, 600,000 rounds). Neither is stored anywhere in the repository or the build.

The protection is only as strong as the password. Anyone can download the encrypted files and try guesses offline, so a short or guessable password can be broken.

## Layout

| Path | What | In git |
|---|---|---|
| `src/` | The site | yes |
| `public/enc/` | Encrypted photos and words | yes |
| `content/picks.json` | Which original photos are used | yes |
| `content/words.private.json` | All the words, in plain text | **no** |
| `.private/` | Plain web copies of photos, credentials | **no** |

## Changing photos or words

Needs the original photos on disk and `.private/credentials.json` (`{ "user": "…", "pass": "…" }`).

```
python3 scripts/resolve_picks.py .   # after editing content/picks.json
npm run content                      # resize, then encrypt into public/enc/
```

Edit `content/words.private.json` for text, then run `npm run content`. Commit the new `public/enc/`.

`content/words.private.json` exists only on the machine that made it. Keep a copy.

## Develop

```
npm install
npm run dev      # http://localhost:5173/loveletter/
npm test
```

## Credits

- `public/models/horse.glb`: the galloping horse from the three.js examples (`examples/models/gltf/Horse.glb` in github.com/mrdoob/three.js). Check its terms before reusing it elsewhere.
