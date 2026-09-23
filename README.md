# Solar Atlas

An interactive 3D solar system built with JavaScript and Three.js. Explore all eight planets, follow a world up close, and travel through time from **AD 1000 to AD 3000**.

[View the live Solar Atlas](https://dcr6174.github.io/solar-atlas/) · [Support this project](https://buymeacoffee.com/dcr6174)

## Features

- Textured 3D planets, a glowing Sun, Saturn's rings, and Earth's atmosphere.
- Drag to orbit, scroll or pinch to zoom, and pan with right-drag or two fingers.
- Click a planet for facts; choose **Explore up close** to follow its orbit.
- Exact-date picker, a 2,000-year timeline, and one-day steps.
- Pause, play, reverse time, and choose speeds from real time to ten years per second.
- Overview, inner-planet, and top-down camera views.
- Compact or proportional orbital distances.
- Toggle orbit lines, labels, and stars.
- Responsive controls, fullscreen, keyboard shortcuts, and reduced-motion support.
- Optional WebMCP integration when supported by the browser.

## Run locally

Requires Node.js 18 or newer. No package installation, API key, or build step is needed.

```bash
npm start
```

Open **http://localhost:8080** in a browser with WebGL2 enabled. Alternatively, use VS Code's Live Server extension on `index.html`.

Do not open `index.html` directly with a `file://` URL: JavaScript modules should be served over HTTP.

## Repository

This project is maintained at [dcr6174/solar-atlas](https://github.com/dcr6174/solar-atlas). Clone it with:

```bash
git clone https://github.com/dcr6174/solar-atlas.git
cd solar-atlas
npm start
```

## GitHub Pages

The site is published from `main` at the repository root. Open [the live app](https://dcr6174.github.io/solar-atlas/). The site uses relative asset paths and includes `.nojekyll`.

[GitHub Pages publishing instructions](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)

## Controls

| Action | Control |
| --- | --- |
| Orbit camera | Drag |
| Zoom | Mouse wheel, pinch, or + / − buttons |
| Pan | Right-drag or two fingers |
| Select a planet | Click its sphere or name |
| Follow a planet | Explore up close; or double-click its sphere |
| Play / pause | Space, with the scene focused |
| Step one day | Left / right arrows, with the scene focused |
| Reset camera | R |
| Leave close-up | Escape |

## Project structure

- `index.html` — interface and metadata.
- `style.css` — responsive layout and visual theme.
- `app.js` — Three.js scene, camera, interactions, and time controls.
- `orbits.js` — orbital elements, Kepler solver, and date validation.
- `assets/` — all planet textures and locally bundled Three.js dependencies.
- `tools/serve.mjs` — dependency-free local development server.
- `tests/orbits.test.mjs` — mathematical and date-boundary checks.
- `THIRD_PARTY_NOTICES.md` — source and licensing credits.

## Validation

```bash
npm test
npm run check
```

Orbital checks cover all eight planets across nine dates from AD 1000 to 3000, finite coordinates, ellipse bounds, daily movement, Gregorian date limits and leap years, and an Earth J2000 sanity check. These checks do not replace browser or visual testing. Full browser interaction testing was not performed in the creation environment.

## Scientific scope

Positions use NASA JPL's long-range approximate Keplerian elements (Tables 2a and 2b), with the additional correction terms for Jupiter through Neptune. Earth is represented by the Earth–Moon barycenter.

This is an educational visualization, not a precision ephemeris or an eclipse predictor. Dates use the proleptic Gregorian calendar. UTC dates approximate the ephemeris timescale. Planet sizes are enlarged, compact mode compresses orbit distances, and surface rotation and axial orientation are illustrative. Textures are not historical surface reconstructions.

Orbital source: https://ssd.jpl.nasa.gov/planets/approx_pos.html

## Dependencies and credits

Three.js r170 and OrbitControls are bundled locally under the MIT license. Texture maps are by Solar System Scope / INOVE under CC BY 4.0. Keep their notices and attribution when sharing the project. Google Fonts are optional; system fonts are used when they are unavailable. See `THIRD_PARTY_NOTICES.md`.

The project does not contain credentials, require paid APIs, or depend on the original hosting platform.
