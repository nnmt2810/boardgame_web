import { useState, useImperativeHandle, forwardRef } from "react";

const ROWS = 15;
const COLS = 15;

// Hàm kiểm tra thắng (di chuyển từ Caro.jsx)
const checkWin = (board, r, c, player, rows, cols) => {
  const directions = [
    [[0, 1], [0, -1]], // Ngang
    [[1, 0], [-1, 0]], // Dọc
    [[1, 1], [-1, -1]], // Chéo thuận
    [[1, -1], [-1, 1]], // Chéo ngược
  ];

  for (let dir of directions) {
    let count = 1;
    for (let [dr, dc] of dir) {
      let nr = r + dr, nc = c + dc;
      while (nr >= 0 && nr < rows && nc >= 0 && nc < cols && board[nr][nc] === player) {
        count++;
        nr += dr;
        nc += dc;
      }
    }
    if (count >= 5) return true;
  }
  return false;
};

// Hàm AI tìm nước đi
const getComputerMove = (board, rows, cols) => {
  const emptyCells = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!board[r][c]) emptyCells.push([r, c]);
    }
  }

  // Tìm nước đi để thắng ngay lập tức
  for (let [r, c] of emptyCells) {
    if (checkWin(board, r, c, 'O', rows, cols)) return [r, c];
  }

  // Tìm nước đi để CHẶN người chơi
  for (let [r, c] of emptyCells) {
    if (checkWin(board, r, c, 'X', rows, cols)) return [r, c];
  }

  // Nếu không có gì nguy hiểm, đánh random cạnh các quân đã có
  return emptyCells[Math.floor(Math.random() * emptyCells.length)];
};

const Caro5Game = forwardRef(({ onWinnerChange, onCursorChange }, ref) => {
  const [board, setBoard] = useState(Array(ROWS).fill().map(() => Array(COLS).fill(null)));
  const [winner, setWinner] = useState(null);
  const [cursor, setCursor] = useState([7, 7]);

  // Expose handleCommand cho MainGame gọi từ Controller
  useImperativeHandle(ref, () => ({
    handleCommand: (cmd) => {
      let [r, c] = cursor;

      switch (cmd) {
        case "UP":
          if (r > 0) r--;
          break;
        case "DOWN":
          if (r < ROWS - 1) r++;
          break;
        case "LEFT":
          if (c > 0) c--;
          break;
        case "RIGHT":
          if (c < COLS - 1) c++;
          break;
        case "ENTER":
          if (!winner && !board[r][c]) {
            const newBoard = board.map(row => [...row]);
            newBoard[r][c] = 'X';
            setBoard(newBoard);
            if (checkWin(newBoard, r, c, 'X', ROWS, COLS)) {
              setWinner('X');
              onWinnerChange('X');
            } else {
              const [aiR, aiC] = getComputerMove(newBoard, ROWS, COLS);
              if (aiR !== undefined && aiC !== undefined) {
                newBoard[aiR][aiC] = 'O';
                setBoard(newBoard);
                if (checkWin(newBoard, aiR, aiC, 'O', ROWS, COLS)) {
                  setWinner('O');
                  onWinnerChange('O');
                }
              }
            }
          }
          break;
        default:
          break;
      }
      setCursor([r, c]);
      onCursorChange([r, c]); // Cập nhật cursor cho system status nếu cần
    },
  }));

  // Render button cho caro
  const renderButton = (r, c) => {
    const isCursor = cursor[0] === r && cursor[1] === c;
    let colorClass = "bg-gray-700";
    let content = null;

    if (board[r][c] === 'X') {
      colorClass = "bg-blue-500";
      content = <span className="text-white font-bold text-xs">X</span>;
    } else if (board[r][c] === 'O') {
      colorClass = "bg-red-500";
      content = <span className="text-white font-bold text-xs">O</span>;
    }

    return (
      <div
        key={`${r}-${c}`}
        className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full transition-all duration-150 flex items-center justify-center
          ${colorClass} 
          ${
            isCursor
              ? "ring-4 ring-white scale-125 z-10 shadow-lg shadow-white/50"
              : "opacity-60"
          }
        `}
      >
        {content || (isCursor && !content && (
          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
        ))}
      </div>
    );
  };

  return (
    <div className="bg-black p-4 rounded-3xl border-12 border-gray-800 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
      <div
        className="grid gap-1.5"
        style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: ROWS }).map((_, r) =>
          Array.from({ length: COLS }).map((_, c) => renderButton(r, c))
        )}
      </div>
    </div>
  );
});

export default Caro5Game;