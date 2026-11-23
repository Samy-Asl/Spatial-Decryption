import test from 'node:test';
import assert from 'node:assert/strict';
import { CELLS, CENTER, LETTERS, MAX_LENGTH, decodePattern, encodeText } from '../spatial-code.mjs';

function roundTrip(text) {
  return encodeText(text).map(({ cells }) => decodePattern([...cells].reverse())).join('');
}

test('all 53 symbols round-trip even when selected in reverse order', () => {
  const text = 'abcdefghijklmnopqrstuvwxyz ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  assert.equal(roundTrip(text.slice(0, 27)) + roundTrip(text.slice(27)), text);
  assert.equal(decodePattern(CELLS), ' ');
});

test('each letter uses a unique subset of peripheral cells and uppercase adds the center', () => {
  const usedPatterns = new Set();
  for (const [letter, indices] of Object.entries(LETTERS)) {
    assert.ok(indices.length > 0 && indices.length < CELLS.length - 1, letter);
    assert.equal(new Set(indices).size, indices.length, letter);
    assert.ok(indices.every(index => CELLS.includes(index) && index !== CENTER), letter);
    usedPatterns.add([...indices].sort().join(','));
    assert.deepEqual(encodeText(letter.toUpperCase())[0].cells, [...indices, CENTER]);
  }
  assert.equal(usedPatterns.size, 26);
});

test('messages preserve case, repeated characters and surrounding spaces', () => {
  assert.equal(roundTrip(' Salut  O Bonjour Samy '), ' Salut  O Bonjour Samy ');
  assert.equal(roundTrip('O'.repeat(MAX_LENGTH)), 'O'.repeat(MAX_LENGTH));
});

test('unsupported text and invalid selections get explicit errors', () => {
  for (const text of ['', '   ', 'Été', 'A1', 'A!', 'A\nB', 'A🙂']) {
    assert.throws(() => encodeText(text), Error, JSON.stringify(text));
  }
  assert.throws(() => encodeText('A'.repeat(MAX_LENGTH + 1)), /40/);
  for (const selection of [[], [CENTER], [0, 0, 3, 6], [0, 3, 6, 9]]) {
    assert.equal(decodePattern(selection), null);
  }
});
