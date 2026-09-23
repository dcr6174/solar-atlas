import test from 'node:test';
import assert from 'node:assert/strict';
import { planets, position, elements, parseDate, MIN_DATE, MAX_DATE, DAY } from '../orbits.js';
import { MAX_AGE, START_AGE, PIVOT, JPL_MIN, JPL_MAX, utcDate, formatDate, sliderToTime, timeToSlider } from '../timeline.js';

test('every planet stays on its orbital ellipse throughout the supported era', () => {
  for (const planet of planets) for (const year of [-2999, -1000, 0, 1000, 2000, 3000]) {
    const time = utcDate(year);
    const coordinates = position(planet, time);
    const { a, e } = elements(planet, time);
    const radius = Math.hypot(...coordinates);
    assert(coordinates.every(Number.isFinite), `${planet.id} ${year}: finite coordinates`);
    assert(radius >= a * (1 - e) - 1e-9 && radius <= a * (1 + e) + 1e-9, `${planet.id} ${year}: ellipse bounds`);
    const tomorrow = position(planet, time + DAY);
    assert(Math.hypot(...coordinates.map((v, i) => v - tomorrow[i])) > 1e-6, `${planet.id} ${year}: moves with time`);
  }
});

test('calendar spans 10000 BCE to 10000 CE without year zero', () => {
  assert.equal(parseDate('10000-01-01 BCE'), MIN_DATE);
  assert.equal(parseDate('10000-12-31 CE'), MAX_DATE);
  assert.equal(formatDate(parseDate('0001-12-31 BCE') + DAY), '0001-01-01 CE');
  assert.equal(formatDate(parseDate('0044-03-15 BCE')), '0044-03-15 BCE');
  for (const invalid of ['10001-01-01 BCE', '10001-01-01 CE', '0000-01-01 CE', '2026-02-30', '1900-02-29', 'abc', '2026-13-01']) assert.equal(parseDate(invalid), null);
  assert.notEqual(parseDate('2000-02-29'), null);
});

test('deep-time slider reaches Earth formation and connects to calendar time', () => {
  assert.equal(sliderToTime(0).age, MAX_AGE);
  assert.equal(sliderToTime(PIVOT).date, MIN_DATE);
  assert.equal(sliderToTime(100000).date, MAX_DATE);
  for (const age of [MAX_AGE, 2_400_000_000, 541_000_000, 66_000_000, START_AGE * 1.1]) {
    const point = timeToSlider(0, age);
    assert(Math.abs(sliderToTime(point).age / age - 1) < 1e-10);
  }
  assert.equal(JPL_MIN, parseDate('3000-01-01 BCE'));
  assert.equal(JPL_MAX, parseDate('3000-12-31 CE'));
});

test('Earth J2000 coordinates pass an independent approximate sanity check', () => {
  const earth = position(planets.find(p => p.id === 'earth'), Date.UTC(2000, 0, 1, 12));
  assert(Math.abs(earth[0] + 0.17717) < 0.001);
  assert(Math.abs(earth[1] - 0.96721) < 0.001);
});
