# App icons

The manifest references three PNGs that must live in this folder for full PWA
installability (browsers require raster icons for the "Add to Home Screen" prompt):

- `icon-192.png` — 192×192
- `icon-512.png` — 512×512
- `icon-maskable-512.png` — 512×512, with safe padding for maskable shape

Generate them from `../../src/app/icon.svg` (or your final brand logo). Quick options:

```bash
# with sharp-cli (npm i -g sharp-cli)
sharp -i ../../src/app/icon.svg -o icon-192.png resize 192 192
sharp -i ../../src/app/icon.svg -o icon-512.png resize 512 512
sharp -i ../../src/app/icon.svg -o icon-maskable-512.png resize 512 512
```

Or use any icon generator (e.g. https://realfavicongenerator.net) and drop the
outputs here. Until then the app still runs; only the install icon is missing.
