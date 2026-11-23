import { CELLS, CENTER } from './spatial-code.mjs';

const WIDTH = 960;
const HEIGHT = 540;
const HALF_WIDTH = 88;
const HALF_DEPTH = 41;
const BASE_HEIGHT = 12;
const RISE_HEIGHT = 94;
const STEP_TIME = 100;
const RISE_TIME = 150;
const HOLD_TIME = 410;
const FALL_TIME = 160;
const GAP_TIME = 190;

// Draw from the back of the grid to the front so the near faces overlap correctly.
const tiles = CELLS.map(index => {
  const row = Math.floor(index / 3);
  const column = index % 3;
  return {
    index,
    x: WIDTH / 2 + (column - row) * 126,
    y: 307 + (column + row - 2) * 70,
  };
}).sort((first, second) => first.y - second.y);

function face(context, color, points) {
  context.fillStyle = color;
  context.beginPath();
  context.moveTo(...points[0]);
  for (const point of points.slice(1)) context.lineTo(...point);
  context.closePath();
  context.fill();
}

function drawTile(context, { index, x, y }, amount) {
  const top = y - BASE_HEIGHT - RISE_HEIGHT * amount;
  const back = [x, top - HALF_DEPTH];
  const right = [x + HALF_WIDTH, top];
  const front = [x, top + HALF_DEPTH];
  const left = [x - HALF_WIDTH, top];
  const bottomFront = [x, y + HALF_DEPTH];
  const isCenter = index === CENTER;

  let colors = isCenter
    ? ['#24354d', '#141c2b', '#19263a']
    : ['#242932', '#151820', '#1b2028'];
  if (amount > 0) {
    colors = isCenter
      ? ['#438bff', '#16449b', '#2a63d6']
      : ['#f3f6fa', '#858e9e', '#bcc5d2'];
  }

  const [topColor, leftColor, rightColor] = colors;
  face(context, leftColor, [left, front, bottomFront, [x - HALF_WIDTH, y]]);
  face(context, rightColor, [front, right, [x + HALF_WIDTH, y], bottomFront]);
  face(context, topColor, [back, right, front, left]);
  context.beginPath();
  context.arc(x, top, 27, 0, 2 * Math.PI);
  context.fillStyle = isCenter ? '#112749' : '#11151c';
  context.fill();
  context.fillStyle = isCenter ? '#d0e1ff' : '#f3f6fa';
  context.fillText(String(index), x, top + 1);
}

function clamp(value) {
  return Math.max(0, Math.min(1, value));
}

export function createGrid(canvas) {
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const context = canvas.getContext('2d');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let selectionFrame;
  let currentAmounts;

  function render(amounts) {
    currentAmounts = amounts;
    context.fillStyle = '#090b0f';
    context.fillRect(0, 0, WIDTH, HEIGHT);
    context.font = '750 42px system-ui, sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';

    for (const tile of tiles) drawTile(context, tile, amounts[tile.index]);
  }

  function draw(selected = [], animate = false) {
    cancelAnimationFrame(selectionFrame);
    const target = CELLS.map(index => Number(selected.includes(index)));
    if (!animate || reducedMotion.matches) {
      render(target);
      return;
    }

    const from = currentAmounts;
    const start = performance.now();
    function update(time) {
      const progress = clamp((time - start) / RISE_TIME);
      const eased = 1 - (1 - progress) ** 2;
      render(target.map((amount, index) => from[index] + (amount - from[index]) * eased));
      if (progress < 1) selectionFrame = requestAnimationFrame(update);
    }
    selectionFrame = requestAnimationFrame(update);
  }

  function playPattern(pattern, signal) {
    const step = pattern.isSpace ? 0 : STEP_TIME;
    const holdStart = (pattern.cells.length - 1) * step + RISE_TIME;
    const fallStart = holdStart + HOLD_TIME;
    const end = fallStart + FALL_TIME + GAP_TIME;
    let frame;
    let start;

    return new Promise(resolve => {
      function finish(completed) {
        cancelAnimationFrame(frame);
        signal.removeEventListener('abort', abort);
        draw();
        resolve(completed);
      }

      function abort() {
        finish(false);
      }

      function update(time) {
        start ??= time;
        const elapsed = time - start;
        if (elapsed >= end) {
          finish(true);
          return;
        }

        const amounts = CELLS.map(() => 0);
        for (const [position, index] of pattern.cells.entries()) {
          const rise = clamp((elapsed - position * step) / RISE_TIME);
          const fall = clamp((elapsed - fallStart) / FALL_TIME);
          amounts[index] = reducedMotion.matches ? Number(rise > 0 && fall === 0) : (1 - (1 - rise) ** 2) * (1 - fall ** 2);
        }
        render(amounts);
        frame = requestAnimationFrame(update);
      }

      if (signal.aborted) {
        resolve(false);
        return;
      }
      signal.addEventListener('abort', abort, { once: true });
      frame = requestAnimationFrame(update);
    });
  }

  async function play(patterns, signal, onProgress) {
    for (const [index, pattern] of patterns.entries()) {
      if (signal.aborted) return false;
      onProgress(index + 1);
      if (!(await playPattern(pattern, signal))) return false;
    }
    return true;
  }

  draw();
  return { draw, play };
}

export function recordGrid(canvas) {
  if (!canvas.captureStream || typeof MediaRecorder === 'undefined') return null;

  const mimeType = ['video/webm;codecs=vp8', 'video/webm', 'video/mp4'].find(type =>
    MediaRecorder.isTypeSupported(type)
  );
  if (!mimeType) return null;

  const stream = canvas.captureStream(30);
  const stopTracks = () => stream.getTracks().forEach(track => track.stop());

  try {
    const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 2_000_000 });
    const chunks = [];
    recorder.addEventListener('dataavailable', event => {
      if (event.data.size > 0) chunks.push(event.data);
    });
    const finished = new Promise(resolve => {
      recorder.addEventListener('stop', () => {
        resolve(new Blob(chunks, { type: recorder.mimeType || mimeType }));
      }, { once: true });
      recorder.addEventListener('error', () => resolve(null), { once: true });
    });
    recorder.start();

    return async function finishRecording() {
      try {
        if (recorder.state !== 'inactive') recorder.stop();
        return await finished;
      } finally {
        stopTracks();
      }
    };
  } catch (error) {
    stopTracks();
    throw error;
  }
}
