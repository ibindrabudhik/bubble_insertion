# SortLab

An oscilloscope-styled visualizer for **bubble sort** and **insertion sort**. Step through the array while the **pseudocode** and **Python** light up line-by-line, so you can trace exactly what the code is doing at every move.

## Features

- Two algorithms (bubble / insertion) running on the **same array** for easy comparison.
- Bars highlight roles live: **compare**, **swap/shift**, **key**, **sorted**.
- Synced code tracing — the active line glows in *both* the pseudocode and the Python panels on every step.
- Step forward/back, play/pause with adjustable **speed**, and adjustable **array size**.
- Live readout of `i`, `j`, `key`, and running **compare** / **write** counters.
- Keyboard: `Space` play/pause · `←` `→` step · `N` new array.

## Run locally

It's a plain static site — no build step. Just open `index.html`, or serve it:

```bash
python3 -m http.server 8000   # then visit http://localhost:8000
```

## Deploy to Netlify

- **Drag & drop:** zip this folder (or drag it) into the Netlify dashboard.
- **Git:** connect the repo. `netlify.toml` already sets `publish = "."` with no build command.
- **CLI:** `netlify deploy --prod`

## Files

| File | Purpose |
|------|---------|
| `index.html` | Markup / layout |
| `styles.css` | Theme, scope screen, code panels |
| `app.js` | Step-trace engine + UI controller |
| `netlify.toml` | Static publish config |
