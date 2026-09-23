import test from 'node:test';
import assert from 'node:assert/strict';
import { planets, position, elements, parseDate, MIN_DATE, MAX_DATE, DAY } from '../orbits.js';
import { JPL_MAX, utcDate, formatDate, sliderToTime, timeToSlider } from '../timeline.js';

test('every planet stays on its orbital ellipse throughout the fitted and displayed dates', () => {
  for (const planet of planets) for (const year of [-999, 0, 1000, 2000, 3000, 5000, 10000]) {
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

test('calendar spans 1000 BCE to 10000 CE without year zero', () => {
  assert.equal(parseDate('1000-01-01 BCE'), MIN_DATE);
  assert.equal(parseDate('10000-12-31 CE'), MAX_DATE);
  assert.equal(formatDate(parseDate('0001-12-31 BCE') + DAY), '0001-01-01 CE');
  assert.equal(formatDate(parseDate('0044-03-15 BCE')), '0044-03-15 BCE');
  for (const invalid of ['1001-01-01 BCE','10001-01-01 CE','0000-01-01 CE','2026-02-30','1900-02-29','abc','2026-13-01']) assert.equal(parseDate(invalid), null);
  assert.notEqual(parseDate('2000-02-29'), null);
});

test('slider covers both calendar endpoints and shareable dates', () => {
  assert.equal(sliderToTime(0), MIN_DATE);
  assert.equal(sliderToTime(100000), MAX_DATE);
  for (const date of [MIN_DATE,parseDate('0044-03-15 BCE'),utcDate(2000),JPL_MAX,MAX_DATE]) {
    assert(Math.abs(sliderToTime(timeToSlider(date))-date)<DAY);
  }
});

test('Earth J2000 coordinates pass an independent approximate sanity check', () => {
  const earth = position(planets.find(p => p.id === 'earth'), Date.UTC(2000, 0, 1, 12));
  assert(Math.abs(earth[0] + 0.17717) < 0.001);
  assert(Math.abs(earth[1] - 0.96721) < 0.001);
});
