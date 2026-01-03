// ================== TIMINGS ==================
const t_cell = 80;
const t_mod = 120;
const t_letter_gap = 300;
const t_space = 500;

// ================== DOM ==================
const cells = document.querySelectorAll(".cell");
const input = document.getElementById("inputText");
const button = document.getElementById("encryptButton");
const resultContent = document.getElementById("resultContent");
const nextBtn = document.getElementById("nextBtn");
const decryptButton = document.getElementById("decryptButton");
const spaceBtn = document.getElementById("spaceBtn");
const copyButton = document.getElementById("copyButton");

// ================== TRANSLATIONS ==================
const translations = {
  en: {
    "dict-title": "📘 Spatial Dictionary",
    "rules-title": "General Rules",
    "rule-grid": "The grid is a 3×3 matrix indexed from 0 to 8:",
    "rule-center": "The central cell (4) is <b>FORBIDDEN</b> for simple letters. It is reserved for special symbols or separators.",
    "rule-letter": "A letter is defined by:",
    "rule-coords": "a sequence of coordinates",
    "rule-visual": "a logical visual shape",
    "rule-direction": "a simple direction (line, angle, diagonal)",
    "rule-case": "Uppercase letters use EXACTLY the same shape as lowercase letters. Case is handled at the logical level, not spatially.",
    "rule-never": "Letters must NEVER:",
    "rule-backtrack": "backtrack unnecessarily",
    "rule-cross": "cross the grid without visual logic",
    "letters-title": "Letter Patterns",
    "left-column": "left column",
    "top-left": "top left corner",
    "top-line": "top line",
    "right-column": "right column",
    "left-half": "left half block",
    "bottom-left": "bottom left bracket",
    "diagonal-left": "left descending diagonal",
    "column-bar": "column + center bar",
    "vertical-axis": "central vertical axis",
    "bottom-right": "bottom right bracket",
    "branch-diag": "branch + diagonal",
    "column-foot": "left column + foot",
    "double-rise": "double rise",
    "column-diag": "column + diagonal",
    "outer-circle": "outer circle",
    "top-half": "top half loop",
    "loop-tail": "loop + tail",
    "half-leg": "half loop + leg",
    "serpentine": "serpentine",
    "simple-cross": "simplified cross",
    "low-bowl": "low bowl",
    "inverted-v": "inverted V",
    "double-v": "double V",
    "diagonal-cross": "diagonal cross",
    "bifurcation": "bifurcation",
    "full-zigzag": "full zigzag"
  },
  fr: {
    "dict-title": "📘 Dictionnaire Spatial",
    "rules-title": "Règles Générales",
    "rule-grid": "La grille est une matrice 3×3 indexée de 0 à 8 :",
    "rule-center": "La case centrale (4) est <b>INTERDITE</b> pour les lettres simples. Elle est réservée aux symboles spéciaux ou séparateurs.",
    "rule-letter": "Une lettre est définie par :",
    "rule-coords": "une suite de coordonnées",
    "rule-visual": "une forme visuelle logique",
    "rule-direction": "une direction simple (ligne, angle, diagonale)",
    "rule-case": "Les majuscules utilisent EXACTEMENT la même forme que les minuscules. La casse est gérée au niveau logique, pas spatial.",
    "rule-never": "Les lettres ne doivent JAMAIS :",
    "rule-backtrack": "revenir en arrière inutilement",
    "rule-cross": "traverser la grille sans logique visuelle",
    "letters-title": "Motifs des Lettres",
    "left-column": "colonne gauche",
    "top-left": "angle haut gauche",
    "top-line": "ligne supérieure",
    "right-column": "colonne droite",
    "left-half": "demi-bloc gauche",
    "bottom-left": "crochet bas gauche",
    "diagonal-left": "diagonale descendante gauche",
    "column-bar": "colonne + barre centrale",
    "vertical-axis": "axe vertical central",
    "bottom-right": "crochet bas droit",
    "branch-diag": "branche + diagonale",
    "column-foot": "colonne gauche + pied",
    "double-rise": "double montée",
    "column-diag": "colonne + diagonale",
    "outer-circle": "cercle périphérique",
    "top-half": "demi-boucle haute",
    "loop-tail": "boucle + queue",
    "half-leg": "demi-boucle + jambe",
    "serpentine": "serpentin",
    "simple-cross": "croix simplifiée",
    "low-bowl": "cuvette basse",
    "inverted-v": "V inversé",
    "double-v": "double V",
    "diagonal-cross": "croix diagonale",
    "bifurcation": "bifurcation",
    "full-zigzag": "zigzag complet"
  }
};

// ================== LETTER DICTIONARY ==================
const LETTERS = {
  a: { coords: [0,3,6], desc: "left-column" },
  b: { coords: [0,1,3], desc: "top-left" },
  c: { coords: [0,1,2], desc: "top-line" },
  d: { coords: [2,5,8], desc: "right-column" },
  e: { coords: [0,1,3,6], desc: "left-half" },
  f: { coords: [0,3,6,7], desc: "bottom-left" },
  g: { coords: [1,3,6], desc: "diagonal-left" },
  h: { coords: [0,3,6,5], desc: "column-bar" },
  i: { coords: [1,7], desc: "vertical-axis" },
  j: { coords: [2,5,8,7], desc: "bottom-right" },
  k: { coords: [0,3,1,5,8], desc: "branch-diag" },
  l: { coords: [0,3,6,7], desc: "column-foot" },
  m: { coords: [0,3,1,5], desc: "double-rise" },
  n: { coords: [0,3,1,5], desc: "column-diag" },
  o: { coords: [0,1,2,5,8,7,6,3], desc: "outer-circle" },
  p: { coords: [0,1,2,3], desc: "top-half" },
  q: { coords: [0,1,2,5,8,7], desc: "loop-tail" },
  r: { coords: [0,1,3,5], desc: "half-leg" },
  s: { coords: [2,1,0,3,6,7,8], desc: "serpentine" },
  t: { coords: [1,7,3], desc: "simple-cross" },
  u: { coords: [3,6,7,8,5], desc: "low-bowl" },
  v: { coords: [2,7,6], desc: "inverted-v" },
  w: { coords: [2,5,8,7,6], desc: "double-v" },
  x: { coords: [0,2,6,8], desc: "diagonal-cross" },
  y: { coords: [1,5,7], desc: "bifurcation" },
  z: { coords: [0,1,2,3,6,7,8], desc: "full-zigzag" }
};

// ================== LANGUAGE SYSTEM ==================
let currentLang = 'en';

function translatePage() {
  document.querySelectorAll('[data-translate]').forEach(el => {
    const key = el.getAttribute('data-translate');
    if (translations[currentLang][key]) {
      el.innerHTML = translations[currentLang][key];
    }
  });
  generateLetterGrid();
}

function generateLetterGrid() {
  const grid = document.getElementById('letterGrid');
  if (!grid) return;
  
  grid.innerHTML = '';
  
  for (const [letter, data] of Object.entries(LETTERS)) {
    const item = document.createElement('div');
    item.className = 'letter-item';
    
    const char = document.createElement('span');
    char.className = 'letter-char';
    char.textContent = letter;
    
    const coords = document.createElement('span');
    coords.className = 'letter-coords';
    coords.textContent = `[${data.coords.join(',')}]`;
    
    const desc = document.createElement('span');
    desc.className = 'letter-desc';
    desc.textContent = translations[currentLang][data.desc] || data.desc;
    
    item.appendChild(char);
    item.appendChild(coords);
    item.appendChild(desc);
    grid.appendChild(item);
  }
}

// Language switch
document.querySelectorAll('.lang-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentLang = btn.getAttribute('data-lang');
    translatePage();
  });
});

// ================== UTILS ==================
function clearGrid() {
  cells.forEach(c => c.classList.remove("active", "space-flash"));
}

function activateCell(i) {
  cells[i]?.classList.add("active");
}

function activateAll() {
  cells.forEach(c => c.classList.add("active"));
}

function wait(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ================== ENCRYPT ==================
async function animateLetter(char) {
  clearGrid();

  if (char === " ") {
    activateAll();
    cells.forEach(c => c.classList.add("space-flash"));
    await wait(t_space);
    clearGrid();
    return;
  }

  const isUpper = char === char.toUpperCase();
  const letter = LETTERS[char.toLowerCase()];
  if (!letter) return;

  for (const i of letter.coords) {
    activateCell(i);
    await wait(t_cell);
  }

  if (isUpper) {
    await wait(t_mod);
    activateCell(4);
  }

  await wait(t_letter_gap);
  clearGrid();
}

async function encryptText(text) {
  for (const c of text) {
    await animateLetter(c);
  }
}

button.addEventListener("click", () => {
  encryptText(input.value);
});

// ================== DECRYPT ==================
let decryptMode = false;
let decrypted = "";

decryptButton?.addEventListener("click", () => {
  decryptMode = true;
  decrypted = "";
  resultContent.textContent = "";
  clearGrid();
});

cells.forEach((cell, i) => {
  cell.addEventListener("click", () => {
    if (decryptMode) cell.classList.toggle("active");
  });
});

spaceBtn?.addEventListener("click", () => {
  if (!decryptMode) return;
  cells.forEach(c => c.classList.add("active"));
});

nextBtn?.addEventListener("click", () => {
  if (!decryptMode) return;

  const active = [...cells]
    .map((c, i) => c.classList.contains("active") ? i : null)
    .filter(i => i !== null);

  if (active.length === 9) {
    decrypted += " ";
    resultContent.textContent = decrypted;
    clearGrid();
    return;
  }

  let isUpper = active.includes(4);
  const filtered = active.filter(i => i !== 4).sort((a,b) => a-b);

  for (const [letter, data] of Object.entries(LETTERS)) {
    const sorted = [...data.coords].sort((a,b) => a-b);
    if (arraysEqual(sorted, filtered)) {
      decrypted += isUpper ? letter.toUpperCase() : letter;
      break;
    }
  }

  resultContent.textContent = decrypted || "...";
  clearGrid();
});

function arraysEqual(a, b) {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

// ================== COPY BUTTON ==================
copyButton?.addEventListener("click", () => {
  const text = resultContent.textContent;
  if (text && !text.includes("appear here")) {
    navigator.clipboard.writeText(text).then(() => {
      copyButton.innerHTML = "<span>✅ Copied!</span>";
      setTimeout(() => {
        copyButton.innerHTML = "<span>Copy</span>";
      }, 2000);
    });
  }
});

// Initialize
translatePage();