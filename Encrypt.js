import { CELLS, LETTERS, MAX_LENGTH, decodePattern, encodeText } from './spatial-code.mjs';
import { createGrid, recordGrid } from './spatial-grid.mjs';

const form = document.getElementById('playForm');
const input = document.getElementById('inputText');
const playButton = document.getElementById('encryptButton');
const stopButton = document.getElementById('stopButton');
const exampleButton = document.getElementById('exampleButton');
const download = document.getElementById('downloadVideo');
const videoPreview = document.getElementById('videoPreview');
const recordedVideo = document.getElementById('recordedVideo');
const playStatus = document.getElementById('playStatus');
const decodeButton = document.getElementById('decryptButton');
const decodeControls = document.getElementById('decodeControls');
const cells = [...document.querySelectorAll('.cell')];
const decodeResult = document.getElementById('decryptResult');
const decodedOutput = document.getElementById('resultContent');
const resultPlaceholder = document.getElementById('resultPlaceholder');
const decodeStatus = document.getElementById('decodeStatus');
const copyButton = document.getElementById('copyButton');
const clearResultButton = document.getElementById('clearResult');
const stage = document.getElementById('gridStage');
const canvas = document.getElementById('gridCanvas');
const grid = createGrid(canvas);
const selection = new Set();

let mode = 'idle';
let playback;
let decoded = '';

function setMode(nextMode) {
  mode = nextMode;
  const playing = mode === 'playing';
  const decoding = mode === 'decoding';
  input.readOnly = playing;
  exampleButton.disabled = playing;
  playButton.disabled = playing;
  playButton.hidden = playing;
  stopButton.hidden = !playing;
  stopButton.disabled = !playing;
  stage.classList.toggle('playing', playing);
  decodeButton.disabled = playing;
  clearResultButton.disabled = playing || decoded === '';
  decodeButton.textContent = decoding ? 'Exit decoding' : 'Start decoding';
  decodeButton.setAttribute('aria-expanded', decoding);
  decodeControls.hidden = !decoding;
  if (decoding) decodeResult.hidden = false;
}

function showStatus(element, message, isError = false) {
  element.textContent = message;
  element.classList.toggle('error', isError);
}

function drawSelection(animate = false) {
  for (const [index, cell] of cells.entries()) {
    cell.setAttribute('aria-pressed', selection.has(index));
  }
  grid.draw([...selection], animate);
}

function clearSelection() {
  selection.clear();
  drawSelection();
}

function clearVideo() {
  if (download.hasAttribute('href')) {
    recordedVideo.pause();
    recordedVideo.removeAttribute('src');
    recordedVideo.load();
    URL.revokeObjectURL(download.href);
  }
  download.removeAttribute('href');
  download.removeAttribute('download');
  download.setAttribute('aria-disabled', 'true');
  videoPreview.open = false;
  videoPreview.hidden = true;
}

function offerVideo(blob) {
  const extension = blob.type.startsWith('video/mp4') ? 'mp4' : 'webm';
  download.href = URL.createObjectURL(blob);
  download.download = `spatial-decryption.${extension}`;
  download.removeAttribute('aria-disabled');
  recordedVideo.src = download.href;
  videoPreview.hidden = false;
}

async function playMessage(patterns) {
  const focusWasInPlayback = [playButton, input].includes(document.activeElement);
  clearVideo();
  clearSelection();
  showStatus(decodeStatus, '');
  playback = new AbortController();
  setMode('playing');
  if (focusWasInPlayback) stopButton.focus();

  let finishRecording;
  try {
    finishRecording = recordGrid(canvas);
  } catch (error) {
    console.warn('Unable to record the grid:', error);
  }

  try {
    const completed = await grid.play(patterns, playback.signal, position => {
      showStatus(playStatus, `Playing character ${position} of ${patterns.length}…`);
    });
    const abortMessage = playback.signal.reason;
    stopButton.disabled = true;
    if (completed && finishRecording) showStatus(playStatus, 'Preparing your video…');

    const video = await finishRecording?.();
    if (completed && video?.size) {
      offerVideo(video);
      showStatus(playStatus, 'Video ready. Replay it here or download it to decode it later.');
    } else if (completed) {
      showStatus(playStatus, 'This browser could not record the animation. Try another browser to save a video.', true);
    } else {
      showStatus(playStatus, abortMessage);
    }
  } catch (error) {
    console.error('Unable to finish playback:', error);
    showStatus(playStatus, 'Something went wrong during playback. Try playing the message again.', true);
  } finally {
    const returnFocus = document.activeElement === stopButton || document.activeElement === document.body;
    playback = undefined;
    setMode('idle');
    grid.draw();
    if (returnFocus) playButton.focus();
  }
}

form.addEventListener('submit', event => {
  event.preventDefault();
  if (mode === 'playing') return;

  let patterns;
  try {
    patterns = encodeText(input.value);
  } catch (error) {
    input.setAttribute('aria-invalid', 'true');
    showStatus(playStatus, error.message, true);
    input.focus();
    return;
  }

  input.removeAttribute('aria-invalid');
  playMessage(patterns);
});

input.addEventListener('input', () => {
  if (input.hasAttribute('aria-invalid')) {
    input.removeAttribute('aria-invalid');
    showStatus(playStatus, '');
  }
});

exampleButton.addEventListener('click', () => {
  input.value = 'Salut O';
  input.removeAttribute('aria-invalid');
  showStatus(playStatus, 'Play the example, then replay its video to decode it.');
  playButton.focus();
});

stopButton.addEventListener('click', () => playback?.abort('Playback stopped. Play again to save a complete video.'));
document.addEventListener('visibilitychange', () => {
  if (document.hidden && !stopButton.disabled) {
    playback?.abort('Playback stopped when the tab was hidden. Keep this tab open during recording.');
  }
});

decodeButton.addEventListener('click', () => {
  clearSelection();
  showStatus(decodeStatus, '');
  if (mode === 'decoding') {
    setMode('idle');
  } else {
    setMode('decoding');
    cells[0].focus();
  }
});

for (const [index, cell] of cells.entries()) {
  cell.addEventListener('click', () => {
    if (selection.has(index)) selection.delete(index);
    else selection.add(index);
    showStatus(decodeStatus, '');
    drawSelection(true);
  });
}

document.getElementById('spaceBtn').addEventListener('click', () => {
  CELLS.forEach(index => selection.add(index));
  showStatus(decodeStatus, 'Space selected. Choose Add character to confirm.');
  drawSelection(true);
});

document.getElementById('clearPattern').addEventListener('click', () => {
  clearSelection();
  showStatus(decodeStatus, 'Selection cleared.');
  cells[0].focus();
});

function updateResult() {
  decodedOutput.textContent = decoded;
  decodedOutput.hidden = decoded === '';
  resultPlaceholder.hidden = decoded !== '';
  copyButton.disabled = decoded === '';
  clearResultButton.disabled = decoded === '';
}

document.getElementById('nextBtn').addEventListener('click', () => {
  const character = decodePattern(selection);
  if (character === null) {
    const message = selection.size ? 'Unknown pattern. Check the dictionary and adjust your selection.' : 'Select at least one cell first.';
    showStatus(decodeStatus, message, true);
    return;
  }

  if (decoded.length === MAX_LENGTH) {
    showStatus(decodeStatus, `The message has ${MAX_LENGTH} characters. Copy it or reset the result.`, true);
    return;
  }

  decoded += character;
  updateResult();
  clearSelection();
  showStatus(decodeStatus, '');
  cells[0].focus();
});

clearResultButton.addEventListener('click', () => {
  decoded = '';
  updateResult();
  clearSelection();
  showStatus(decodeStatus, 'Result cleared.');
  if (mode === 'decoding') cells[0].focus();
  else decodeButton.focus();
});

copyButton.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(decoded);
    showStatus(decodeStatus, 'Message copied.');
  } catch {
    showStatus(decodeStatus, 'Could not copy automatically. Select the decoded text to copy it.', true);
  }
});

document.getElementById('logoLink').addEventListener('click', async () => {
  const notification = document.getElementById('copyNotif');
  try {
    await navigator.clipboard.writeText(new URL('.', location.href).href);
    showStatus(notification, 'Page link copied.');
  } catch {
    showStatus(notification, 'Could not copy the page link.', true);
  }
});

const translations = {
  en: {
    title: 'Spatial dictionary',
    grid: 'Read the grid from left to right and top to bottom.',
    order: 'For decoding, select the same numbered cells in any order.',
    center: 'Add the blue center (4) for uppercase.',
    space: 'Select all nine cells for a space.',
    patterns: 'Letter patterns',
  },
  fr: {
    title: 'Dictionnaire spatial',
    grid: 'Lis la grille de gauche à droite et de haut en bas.',
    order: 'Pour décoder, sélectionne les mêmes cases dans l’ordre de ton choix.',
    center: 'Ajoute la case centrale bleue (4) pour une majuscule.',
    space: 'Sélectionne les neuf cases pour un espace.',
    patterns: 'Motifs des lettres',
  },
};

const languageButtons = [...document.querySelectorAll('.lang-btn')];
for (const button of languageButtons) {
  button.addEventListener('click', () => {
    const lang = button.dataset.lang;
    document.getElementById('dictionaryDetails').lang = lang;
    for (const item of languageButtons) {
      item.setAttribute('aria-pressed', item === button);
    }
    for (const element of document.querySelectorAll('[data-translate]')) {
      element.textContent = translations[lang][element.dataset.translate];
    }
  });
}

const dictionary = document.getElementById('letterGrid');
for (const [letter, indices] of Object.entries(LETTERS)) {
  const item = document.createElement('div');
  item.className = 'letter-item';
  const character = document.createElement('span');
  character.className = 'letter-char';
  character.textContent = letter;
  const coordinates = document.createElement('span');
  coordinates.className = 'letter-coords';
  coordinates.textContent = indices.join(' · ');
  const miniGrid = document.createElement('span');
  miniGrid.className = 'mini-grid';
  miniGrid.setAttribute('aria-hidden', 'true');
  for (const index of CELLS) {
    const dot = document.createElement('span');
    dot.classList.toggle('filled', indices.includes(index));
    miniGrid.append(dot);
  }
  item.append(character, coordinates, miniGrid);
  dictionary.append(item);
}
