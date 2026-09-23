# Solar Atlas

Explore the solar system in 3D, from **AD 1000 to AD 3000**. Follow the eight planets, visit Earth's Moon, and optionally show Pluto's illustrative orbit.

[**Open Solar Atlas**](https://dcr6174.github.io/solar-atlas/) · [Support the project](https://buymeacoffee.com/dcr6174)

![Solar Atlas social preview, with the Sun and orbiting planets](social-preview.jpg)

## Screenshots and recording

A desktop and mobile recording will be added after a browser with WebGL2 rendering captures the scene. The image above is promotional artwork, not a screenshot of the app.

## Explore

- Drag, swipe, or use **W A S D** to rotate the camera; scroll or pinch to zoom. Click a body or choose it from the list.
- Follow a body up close, then switch between overview, inner planets, and top views.
- Choose an exact UTC date, use the 2,000-year slider, or jump to Apollo 11 and Voyager mission dates. Play or reverse time at adjustable speeds.
- Copy the browser URL to share the selected body and date, for example [`#date=1969-07-20&body=earth`](https://dcr6174.github.io/solar-atlas/#date=1969-07-20&body=earth).
- Toggle Pluto, orbital paths, labels, and stars. Choose compact or proportional orbital distance.
- Install the progressive web app from a supported browser; once the app has loaded online, its core interface and planet textures can open offline.
- Optionally support the project through the corner card linking to [Buy Me a Coffee](https://buymeacoffee.com/dcr6174).

## Run locally

Requires Node.js 18 or newer. No install, build step, account, or API key is needed.

```bash
git clone https://github.com/dcr6174/solar-atlas.git
cd solar-atlas
npm start
```

Open **http://localhost:8080** in a WebGL2 capable browser. Use a local server: opening `index.html` through `file://` prevents JavaScript modules and offline features from working correctly.

The [GitHub Pages site](https://dcr6174.github.io/solar-atlas/) publishes from `main` at the repository root. `.nojekyll` and relative asset paths support project Pages hosting.

## Controls

| Action | Control |
| --- | --- |
| Orbit camera | Drag or swipe; **W A S D** when a text control is not focused |
| Zoom | Mouse wheel, pinch, or + / − buttons |
| Pan | Right-drag or two fingers |
| Select a body | Click its sphere or name |
| Follow a body | Explore up close or double-click its sphere |
| Play / pause | Space when a text control is not focused |
| Step one day | Left / right arrow keys when a text control is not focused |
| Reset camera | R |
| Leave close-up | Escape |

## Common problems

- **The 3D view could not start:** Enable hardware acceleration and WebGL2, update the browser, then reload. Some remote browsers cannot create a WebGL context.
- **Planets fail to load:** Check your connection on the first visit, reload, or clear site data if a previous offline cache is stuck.
- **An old version appears:** Hard refresh the page, or clear the site's stored data. Versioned CSS/JS and the service worker normally update on a return visit.
- **The page does not work from a local file:** Use `npm start` and open `http://localhost:8080`.
- **Orbit positions look unusual on historical dates:** Positions are approximate; see the scientific scope below.

## Validation

```bash
npm test
npm run check
```

Tests cover the eight planets' orbital bounds across AD 1000–3000, date and leap-year validation, and an Earth J2000 sanity check. Browser visual behavior requires a WebGL2 browser and is separate from these checks.

## Scientific scope

The eight planet positions use [NASA JPL's long-range approximate Keplerian elements](https://ssd.jpl.nasa.gov/planets/approx_pos.html), including Jupiter–Neptune corrections. Earth uses the Earth–Moon barycenter. The Moon's position around Earth and Pluto's orbit are **illustrative**, outside this eight-planet JPL model. Their size and spacing are enlarged so they remain visible.

This educational visualization is not a precision ephemeris or eclipse predictor. Dates use the proleptic Gregorian calendar and UTC as an approximation for ephemeris time. Compact mode compresses distances; rotations, orientations, surface maps, and ancient appearances are illustrative.

## Files and credits

- `index.html`, `style.css`, `app.js`, `orbits.js`: app and orbital model.
- `manifest.webmanifest`, `sw.js`: installation and offline cache.
- `assets/`: compressed WebP planet textures, ring texture, bundled Three.js and OrbitControls.
- `tools/serve.mjs`, `tests/orbits.test.mjs`: local server and orbital checks.
- `THIRD_PARTY_NOTICES.md`: texture and dependency attribution.

Code is available under the [MIT License](LICENSE). Three.js r170 and OrbitControls are bundled under MIT. Solar System Scope / INOVE surface textures are licensed under CC BY 4.0; retain their attribution when sharing. See [third-party notices](THIRD_PARTY_NOTICES.md).
