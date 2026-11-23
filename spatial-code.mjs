export const CENTER = 4;
export const CELLS = [0, 1, 2, 3, 4, 5, 6, 7, 8];
export const MAX_LENGTH = 40;

// The order drives the animation. Manual decoding matches the set of cells.
export const LETTERS = {
  a: [0, 3, 6],
  b: [0, 1, 3],
  c: [0, 1, 2],
  d: [2, 5, 8],
  e: [0, 1, 3, 6],
  f: [0, 3, 6, 7],
  g: [1, 3, 6],
  h: [0, 3, 6, 5],
  i: [1, 7],
  j: [2, 5, 8, 7],
  k: [0, 3, 1, 5, 8],
  l: [0, 3, 6, 7, 8],
  m: [0, 3, 1, 5],
  n: [6, 3, 0, 1, 2, 5, 8],
  o: [0, 1, 2, 5, 8, 7, 6],
  p: [0, 1, 2, 3],
  q: [0, 1, 2, 5, 8, 7],
  r: [6, 3, 0, 1, 5, 8],
  s: [2, 1, 0, 3, 6, 7, 8],
  t: [1, 7, 3],
  u: [3, 6, 7, 8, 5],
  v: [2, 7, 6],
  w: [2, 5, 8, 7, 6],
  x: [0, 2, 6, 8],
  y: [1, 5, 7],
  z: [0, 1, 2, 3, 7, 8],
};

function signature(indices) {
  return [...indices].sort((first, second) => first - second).join(',');
}

const patterns = new Map();
for (const [letter, indices] of Object.entries(LETTERS)) {
  patterns.set(signature(indices), letter);
  patterns.set(signature([...indices, CENTER]), letter.toUpperCase());
}
patterns.set(signature(CELLS), ' ');

export function encodeText(text) {
  if (/^ *$/.test(text)) {
    throw new Error('Enter a message to animate.');
  }
  if (text.length > MAX_LENGTH) {
    throw new Error(`Keep your message to ${MAX_LENGTH} characters.`);
  }
  const unsupported = [...text].find(character => !/^[A-Za-z ]$/.test(character));
  if (unsupported !== undefined) {
    throw new Error(`${JSON.stringify(unsupported)} is unsupported. Use A–Z, a–z and spaces.`);
  }

  return [...text].map(character => {
    if (character === ' ') return { cells: CELLS, isSpace: true };

    const lower = character.toLowerCase();
    const indices = LETTERS[lower];
    return {
      cells: character === lower ? indices : [...indices, CENTER],
      isSpace: false,
    };
  });
}

export function decodePattern(indices) {
  return patterns.get(signature(indices)) ?? null;
}
