import test from 'node:test';
import assert from 'node:assert/strict';
import { planets, position, elements, parseDate, MIN_DATE, MAX_DATE, DAY } from '../orbits.js';

test('every planet stays on its orbital ellipse throughout the supported era', () => {
  for (const planet of planets) for (const year of [1000, 1250, 1500, 1750, 2000, 2250, 2500, 2750, 3000]) {
    const time = Date.UTC(year, 0, 1);
    const coordinates = position(planet, time);
    const { a, e } = elements(planet, time);
    const radius = Math.hypot(...coordinates);
    assert(coordinates.every(Number.isFinite), `${planet.id} ${year}: finite coordinates`);
    assert(radius >= a * (1 - e) - 1e-9 && radius <= a * (1 + e) + 1e-9, `${planet.id} ${year}: ellipse bounds`);
    const tomorrow = position(planet, time + DAY);
    assert(Math.hypot(...coordinates.map((v, i) => v - tomorrow[i])) > 1e-6, `${planet.id} ${year}: moves with time`);
  }
});

test('dates enforce the AD 1000–3000 range and Gregorian calendar', () => {
  assert.equal(parseDate('1000-01-01'), MIN_DATE);
  assert.equal(parseDate('3000-12-31'), MAX_DATE);
  for (const invalid of ['0999-12-31', '3001-01-01', '2026-02-30', '1900-02-29', 'abc', '2026-13-01']) assert.equal(parseDate(invalid), null);
  assert.notEqual(parseDate('2000-02-29'), null);
});

test('Earth J2000 coordinates pass an independent approximate sanity check', () => {
  const earth = position(planets.find(p => p.id === 'earth'), Date.UTC(2000, 0, 1, 12));
  assert(Math.abs(earth[0] + 0.17717) < 0.001);
  assert(Math.abs(earth[1] - 0.96721) < 0.001);
});
