// ===== DOM =====
const startButton = document.querySelector("#startBtn");
const restartBtn = document.querySelector("#restartBtn");
const playerXInput = document.querySelector("#playerX");
const playerOInput = document.querySelector("#playerO");
const messageEl = document.querySelector("#message");
const playerDisplayEl = document.querySelector("#playerDisplay");
const boardContainer = document.querySelector("#boardContainer");

// ===== Player Factory =====
function playerFactory(playerName, mark) {
  return { playerName, mark };
}

// ===== Gameboard Module =====
const Gameboard = (() => {
  const board = Array(9).fill("");

  const getBoard = () => board;

  const setMark = (index, mark) => {
    if (board[index] !== "") return false;
    board[index] = mark;
    return true;
  };

  const reset = () => {
    board.fill("");
  };

  return { getBoard, setMark, reset };
})();

// ===== Game Logic =====
const Game = (() => {
  const players = [
    playerFactory("Player X", "X"),
    playerFactory("Player O", "O"),
  ];

  let currentPlayer = players[0];
  let gameOver = false;
  let started = false;

  const winCon = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];

  const checkWinner = () => {
    const board = Gameboard.getBoard();

    for (const [a,b,c] of winCon) {
      if (board[a] === "") continue;
      if (board[a] === board[b] && board[a] === board[c]) {
        return board[a]; // "X" or "O"
      }
    }
    return null;
  };

  const getCurrentPlayer = () => currentPlayer;
  const getPlayers = () => players;
  const isStarted = () => started;

  const startGame = (nameX, nameO) => {
    players[0].playerName = nameX.trim();
    players[1].playerName = nameO.trim();

    Gameboard.reset();
    currentPlayer = players[0];
    gameOver = false;
    started = true;
  };

  const playTurn = (index) => {
    if (!started) return { valid: false, reason: "not-started" };
    if (gameOver) return { valid: false, reason: "game-over" };

    const validTurn = Gameboard.setMark(index, currentPlayer.mark);
    if (!validTurn) return { valid: false, reason: "occupied" };

    const winner = checkWinner();
    if (winner) {
      gameOver = true;
      return { valid: true, winner, draw: false };
    }

    const board = Gameboard.getBoard();
    if (!board.includes("")) {
      gameOver = true;
      return { valid: true, winner: null, draw: true };
    }

    currentPlayer = (currentPlayer === players[0]) ? players[1] : players[0];
    return { valid: true, winner: null, draw: false };
  };

  const resetGame = () => {
    gameOver = false;
    Gameboard.reset();
    currentPlayer = players[0];
    // started stays true -> keep names, instant restart
  };

  return {
    playTurn,
    getCurrentPlayer,
    getPlayers,
    isStarted,
    startGame,
    resetGame
  };
})();

// ===== UI Helpers (board state / tints) =====
const setBoardEnabled = (enabled) => {
  boardContainer.classList.toggle("disabled", !enabled);
};

const clearWinnerTint = () => {
  boardContainer.classList.remove("win-x", "win-o");
};

const setWinnerTint = (winnerMark) => {
  clearWinnerTint();
  if (winnerMark === "X") boardContainer.classList.add("win-x");
  if (winnerMark === "O") boardContainer.classList.add("win-o");
};

// ===== Render =====
const render = () => {
  boardContainer.textContent = "";
  const board = Gameboard.getBoard();

  board.forEach((value, index) => {
    const square = document.createElement("div");
    square.classList.add("square");
    square.dataset.index = index;
    square.textContent = value;

    // Color classes for X/O
    square.classList.toggle("is-x", value === "X");
    square.classList.toggle("is-o", value === "O");

    boardContainer.appendChild(square);
  });
};

// ===== Player display + active underline =====
const updatePlayerDisplay = () => {
  const [pX, pO] = Game.getPlayers();

  playerDisplayEl.innerHTML = `
    <span class="player-x">${pX.playerName} (X)</span>
    <span class="vs"> vs </span>
    <span class="player-o">${pO.playerName} (O)</span>
  `;
};

const updateActivePlayerUI = () => {
  const current = Game.getCurrentPlayer().mark; // "X" or "O"
  const xEl = playerDisplayEl.querySelector(".player-x");
  const oEl = playerDisplayEl.querySelector(".player-o");
  if (!xEl || !oEl) return;

  xEl.classList.toggle("active", current === "X");
  oEl.classList.toggle("active", current === "O");
};

const setMessageTurn = () => {
  const p = Game.getCurrentPlayer();
  messageEl.textContent = `${p.playerName}'s turn (${p.mark})`;
};

// sync hover + active name highlight
const syncTurnUI = () => {
  boardContainer.dataset.turn = Game.getCurrentPlayer().mark; // "X" or "O"
  updateActivePlayerUI();
};

// ===== Events =====
boardContainer.addEventListener("click", (e) => {
  if (!e.target.classList.contains("square")) return;

  const index = Number(e.target.dataset.index);
  const result = Game.playTurn(index);

  if (!result.valid) return;

  render();

  if (result.winner) {
    const [pX, pO] = Game.getPlayers();
    const winnerName = result.winner === "X" ? pX.playerName : pO.playerName;

    messageEl.textContent = `${winnerName} wins! (${result.winner})`;
    setWinnerTint(result.winner);
    setBoardEnabled(false);
    return;
  }

  if (result.draw) {
    messageEl.textContent = "Draw!";
    clearWinnerTint();
    setBoardEnabled(false);
    return;
  }

  setMessageTurn();
  syncTurnUI();
});

startButton.addEventListener("click", () => {
  const nameX = playerXInput.value.trim();
  const nameO = playerOInput.value.trim();

  if (!nameX || !nameO) {
    messageEl.textContent = "Please enter both player names to start.";
    return;
  }

  Game.startGame(nameX, nameO);

  // hide inputs + start button after start
  playerXInput.style.display = "none";
  playerOInput.style.display = "none";
  startButton.style.display = "none";

  clearWinnerTint();
  setBoardEnabled(true);

  updatePlayerDisplay();
  render();
  setMessageTurn();
  syncTurnUI();
});

restartBtn.addEventListener("click", () => {
  if (!Game.isStarted()) {
    messageEl.textContent = "Enter names and press Start first.";
    return;
  }

  Game.resetGame();

  clearWinnerTint();
  setBoardEnabled(true);

  render();
  setMessageTurn();
  syncTurnUI();
});

// ===== Init =====
render();
boardContainer.dataset.turn = ""; // no hover highlight before start
messageEl.textContent = "Enter names and press Start.";
