import { useState, useImperativeHandle, forwardRef, useContext } from "react";
import { AuthContext } from "../../contexts/AuthContext";
import axiosClient from "../../api/axiosClient";

const ROWS = 15;
const COLS = 15;

const Caro4Game = forwardRef(({ onWinnerChange, onCursorChange }, ref) => {
  const { user } = useContext(AuthContext);
  const [board, setBoard] = useState(Array(ROWS).fill().map(() => Array(COLS).fill(null)));
  const [winner, setWinner] = useState(null);
  const [cursor, setCursor] = useState([7, 7]);
  const [hasReported, setHasReported] = useState(false);

  // Hàm báo cáo chiến thắng về Backend
  const reportWin = async () => {
    if (!user || hasReported) return;
    try {
      setHasReported(true);
      await axiosClient.post("http://localhost:5000/api/users/stats/update", {
        stat_type: "win",
        value: 1,
      });
      console.log("✓ Trận thắng Caro 4 đã được cập nhật");
    } catch (error) {
      console.error("Lỗi cập nhật trận thắng Caro 4:", error);
    }
  };

  const checkWinner = (b, r, c) => {
    const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
    const player = b[r][c];
    for (let [dr, dc] of directions) {
      let count = 1;
      for (let i = 1; i < 4; i++) {
        if (b[r + dr * i]?.[c + dc * i] === player) count++;
        else break;
      }
      for (let i = 1; i < 4; i++) {
        if (b[r - dr * i]?.[c - dc * i] === player) count++;
        else break;
      }
      if (count >= 4) return player;
    }
    if (b.flat().every(cell => cell !== null)) return "DRAW";
    return null;
  };

  const aiMove = (currentBoard) => {
    const empty = [];
    currentBoard.forEach((row, r) => row.forEach((cell, c) => {
      if (!cell) empty.push([r, c]);
    }));
    if (empty.length === 0) return;
    const [r, c] = empty[Math.floor(Math.random() * empty.length)];
    const newBoard = currentBoard.map(row => [...row]);
    newBoard[r][c] = "O";
    setBoard(newBoard);
    const win = checkWinner(newBoard, r, c);
    if (win) {
      setWinner(win);
      onWinnerChange(win);
    }
  };

  useImperativeHandle(ref, () => ({
    handleCommand: (cmd) => {
      if (winner) return;
      let [r, c] = cursor;
      if (cmd === "UP" && r > 0) r--;
      if (cmd === "DOWN" && r < ROWS - 1) r++;
      if (cmd === "LEFT" && c > 0) c--;
      if (cmd === "RIGHT" && c < COLS - 1) c++;

      if (cmd === "ENTER" && !board[r][c]) {
        const newBoard = board.map(row => [...row]);
        newBoard[r][c] = "X";
        setBoard(newBoard);
        const win = checkWinner(newBoard, r, c);
        if (win) {
          setWinner(win);
          onWinnerChange(win);
          if (win === "X") reportWin(); // Người chơi thắng
        } else {
          setTimeout(() => aiMove(newBoard), 300);
        }
      }
      setCursor([r, c]);
      onCursorChange([r, c]);
    }
  }));

  return (
    <div className="bg-black p-4 rounded-3xl border-12 border-gray-800">
      <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}>
        {board.map((row, r) => row.map((cell, c) => (
          <div key={`${r}-${c}`} className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all ${
            cell === "X" ? "bg-blue-500" : cell === "O" ? "bg-red-500" : "bg-gray-700"
          } ${cursor[0] === r && cursor[1] === c ? "ring-4 ring-white scale-110 z-10" : "opacity-80"}`}>
            {cell && <span className="text-white font-bold text-xs">{cell}</span>}
            {cursor[0] === r && cursor[1] === c && !cell && <div className="w-2 h-2 bg-white rounded-full animate-pulse" />}
          </div>
        )))}
      </div>
    </div>
  );
});

export default Caro4Game;