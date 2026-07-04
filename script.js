const boardElement = document.getElementById('board');
const statusText = document.getElementById('statusText');
const timerText = document.getElementById('timerText');
const solveBtn = document.getElementById('solveBtn');
const clearBtn = document.getElementById('clearBtn');
const sampleBtn = document.getElementById('sampleBtn');
const themeToggle = document.getElementById('themeToggle');
const difficultySelect = document.getElementById('difficulty');

const samplePuzzles = {
  easy: [
    [5, 3, 0, 0, 7, 0, 0, 0, 0],
    [6, 0, 0, 1, 9, 5, 0, 0, 0],
    [0, 9, 8, 0, 0, 0, 0, 6, 0],
    [8, 0, 0, 0, 6, 0, 0, 0, 3],
    [4, 0, 0, 8, 0, 3, 0, 0, 1],
    [7, 0, 0, 0, 2, 0, 0, 0, 6],
    [0, 6, 0, 0, 0, 0, 2, 8, 0],
    [0, 0, 0, 4, 1, 9, 0, 0, 5],
    [0, 0, 0, 0, 8, 0, 0, 7, 9],
  ],
  medium: [
    [0, 0, 0, 2, 6, 0, 7, 0, 1],
    [6, 8, 0, 0, 7, 0, 0, 9, 0],
    [1, 9, 0, 0, 0, 4, 5, 0, 0],
    [8, 2, 0, 1, 0, 0, 0, 4, 0],
    [0, 0, 4, 6, 0, 2, 9, 0, 0],
    [0, 5, 0, 0, 0, 3, 0, 2, 8],
    [0, 0, 9, 3, 0, 0, 0, 7, 4],
    [0, 4, 0, 0, 5, 0, 0, 3, 6],
    [7, 0, 3, 0, 1, 8, 0, 0, 0],
  ],
  hard: [
    [0, 0, 0, 6, 0, 0, 4, 0, 0],
    [7, 0, 0, 0, 0, 3, 6, 0, 0],
    [0, 0, 0, 0, 9, 1, 0, 8, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 5, 0, 1, 8, 0, 0, 0, 3],
    [0, 0, 0, 3, 0, 6, 0, 4, 5],
    [0, 0, 0, 0, 0, 0, 0, 1, 0],
    [0, 6, 0, 0, 0, 0, 2, 0, 0],
    [0, 0, 0, 0, 0, 8, 0, 0, 0],
  ],
};

let board = Array.from({ length: 9 }, () => Array(9).fill(0));
let givenCells = Array.from({ length: 9 }, () => Array(9).fill(false));
let timerInterval = null;
let startTime = null;

function initialize() {
  renderBoard();
  solveBtn.addEventListener('click', solveCurrentBoard);
  clearBtn.addEventListener('click', clearBoard);
  sampleBtn.addEventListener('click', loadSamplePuzzle);
  themeToggle.addEventListener('click', toggleTheme);
  difficultySelect.addEventListener('change', () => {
    setStatus('Difficulty updated. Load a sample puzzle to try a new board.', 'info');
  });
}

function renderBoard() {
  boardElement.innerHTML = '';
  const fragment = document.createDocumentFragment();

  board.forEach((row, rowIndex) => {
    row.forEach((value, colIndex) => {
      const input = document.createElement('input');
      input.className = 'cell';
      input.type = 'text';
      input.inputMode = 'numeric';
      input.maxLength = 1;
      input.dataset.row = rowIndex;
      input.dataset.col = colIndex;
      input.value = value === 0 ? '' : value;
      input.readOnly = givenCells[rowIndex][colIndex];

      if (givenCells[rowIndex][colIndex]) {
        input.classList.add('given');
      } else if (value !== 0) {
        input.classList.add('user');
      }

      input.addEventListener('input', handleCellInput);
      fragment.appendChild(input);
    });
  });

  boardElement.appendChild(fragment);
}

function handleCellInput(event) {
  const input = event.target;
  const row = Number(input.dataset.row);
  const col = Number(input.dataset.col);

  if (givenCells[row][col]) {
    input.value = board[row][col] === 0 ? '' : board[row][col];
    return;
  }

  const sanitized = input.value.replace(/[^1-9]/g, '').slice(-1);
  input.value = sanitized;
  board[row][col] = sanitized ? Number(sanitized) : 0;

  input.classList.remove('user', 'solved', 'error');
  if (sanitized) {
    input.classList.add('user');
  }

  setStatus('Puzzle updated. Press Solve when you are ready.', 'info');
}

function setBoardFromPuzzle(puzzle, fixedEntries = null) {
  board = puzzle.map((row) => [...row]);
  givenCells = Array.from({ length: 9 }, () => Array(9).fill(false));

  if (fixedEntries) {
    fixedEntries.forEach((row, rowIndex) => {
      row.forEach((isFixed, colIndex) => {
        if (isFixed) {
          givenCells[rowIndex][colIndex] = true;
        }
      });
    });
  } else {
    board.forEach((row, rowIndex) => {
      row.forEach((value, colIndex) => {
        if (value !== 0) {
          givenCells[rowIndex][colIndex] = true;
        }
      });
    });
  }

  renderBoard();
  resetTimer();
}

function clearBoard() {
  board = Array.from({ length: 9 }, () => Array(9).fill(0));
  givenCells = Array.from({ length: 9 }, () => Array(9).fill(false));
  renderBoard();
  setStatus('Board cleared. Enter a new puzzle or load a sample.', 'info');
  resetTimer();
}

function loadSamplePuzzle() {
  const selectedDifficulty = difficultySelect.value;
  const puzzle = samplePuzzles[selectedDifficulty];
  setBoardFromPuzzle(puzzle);
  setStatus(`Loaded a ${selectedDifficulty} sample puzzle.`, 'info');
}

function validateBoard(currentBoard) {
  let filledCount = 0;

  for (let row = 0; row < 9; row += 1) {
    for (let col = 0; col < 9; col += 1) {
      const value = currentBoard[row][col];

      if (value === 0) {
        continue;
      }

      filledCount += 1;

      if (value < 1 || value > 9) {
        return { ok: false, message: 'Only numbers 1-9 are allowed.' };
      }
    }
  }

  if (filledCount === 0) {
    return { ok: false, message: 'Please enter a Sudoku puzzle.' };
  }

  for (let index = 0; index < 9; index += 1) {
    const rowSet = new Set();
    const colSet = new Set();
    const boxSet = new Set();

    for (let offset = 0; offset < 9; offset += 1) {
      const rowValue = currentBoard[index][offset];
      const colValue = currentBoard[offset][index];
      const boxRow = Math.floor(index / 3) * 3 + Math.floor(offset / 3);
      const boxCol = (index % 3) * 3 + (offset % 3);
      const boxValue = currentBoard[boxRow][boxCol];

      if (rowValue !== 0) {
        if (rowSet.has(rowValue)) {
          return { ok: false, message: 'Duplicate number found in a row.' };
        }
        rowSet.add(rowValue);
      }

      if (colValue !== 0) {
        if (colSet.has(colValue)) {
          return { ok: false, message: 'Duplicate number found in a column.' };
        }
        colSet.add(colValue);
      }

      if (boxValue !== 0) {
        if (boxSet.has(boxValue)) {
          return { ok: false, message: 'Duplicate number found in a box.' };
        }
        boxSet.add(boxValue);
      }
    }
  }

  return { ok: true, message: 'Board is valid.' };
}

function findEmptyCell(currentBoard) {
  for (let row = 0; row < 9; row += 1) {
    for (let col = 0; col < 9; col += 1) {
      if (currentBoard[row][col] === 0) {
        return [row, col];
      }
    }
  }
  return null;
}

function isSafe(currentBoard, row, col, value) {
  for (let index = 0; index < 9; index += 1) {
    if (currentBoard[row][index] === value || currentBoard[index][col] === value) {
      return false;
    }
  }

  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;

  for (let r = boxRow; r < boxRow + 3; r += 1) {
    for (let c = boxCol; c < boxCol + 3; c += 1) {
      if (currentBoard[r][c] === value) {
        return false;
      }
    }
  }

  return true;
}

function pause(duration) {
  return new Promise((resolve) => setTimeout(resolve, duration));
}

function updateCell(row, col, value, state) {
  const input = boardElement.querySelector(`[data-row="${row}"][data-col="${col}"]`);
  if (!input) {
    return;
  }

  input.value = value === 0 ? '' : value;
  input.classList.remove('given', 'user', 'solved', 'error');

  if (givenCells[row][col]) {
    input.classList.add('given');
    input.readOnly = true;
    return;
  }

  input.readOnly = false;

  if (state === 'solved') {
    input.classList.add('solved');
  } else if (state === 'error') {
    input.classList.add('error');
  } else {
    input.classList.add('user');
  }
}

async function solveCurrentBoard() {
  const validation = validateBoard(board);
  if (!validation.ok) {
    setStatus(validation.message, 'error');
    return;
  }

  const solvingBoard = board.map((row) => [...row]);
  setStatus('Solving puzzle...', 'info');
  startTimer();
  solveBtn.disabled = true;
  clearBtn.disabled = true;
  sampleBtn.disabled = true;

  const solved = await solveBoard(solvingBoard, 110);
  stopTimer();

  solveBtn.disabled = false;
  clearBtn.disabled = false;
  sampleBtn.disabled = false;

  if (!solved) {
    setStatus('No valid solution exists.', 'error');
    return;
  }

  board = solvingBoard;
  renderBoard();
  setStatus('Puzzle solved successfully!', 'success');
}

async function solveBoard(currentBoard, delay) {
  const emptyCell = findEmptyCell(currentBoard);
  if (!emptyCell) {
    return true;
  }

  const [row, col] = emptyCell;

  for (let value = 1; value <= 9; value += 1) {
    if (!isSafe(currentBoard, row, col, value)) {
      continue;
    }

    currentBoard[row][col] = value;
    updateCell(row, col, value, 'solved');
    await pause(delay);

    if (await solveBoard(currentBoard, delay)) {
      return true;
    }

    currentBoard[row][col] = 0;
    updateCell(row, col, 0, '');
  }

  return false;
}

function startTimer() {
  resetTimer();
  startTime = performance.now();
  timerInterval = window.setInterval(() => {
    const elapsed = ((performance.now() - startTime) / 1000).toFixed(2);
    timerText.textContent = `${elapsed}s`;
  }, 100);
}

function stopTimer() {
  if (timerInterval) {
    window.clearInterval(timerInterval);
    timerInterval = null;
  }
}

function resetTimer() {
  stopTimer();
  startTime = null;
  timerText.textContent = '0.00s';
}

function setStatus(message, tone) {
  statusText.textContent = message;
  statusText.className = `status-text ${tone}`;
}

function toggleTheme() {
  document.body.classList.toggle('light-theme');
  const isLight = document.body.classList.contains('light-theme');
  themeToggle.textContent = isLight ? '☀️ Light Mode' : '🌙 Dark Mode';
}

window.addEventListener('DOMContentLoaded', initialize);
