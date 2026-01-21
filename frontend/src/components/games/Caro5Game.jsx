import { useState, useImperativeHandle, forwardRef, useContext, useEffect } from "react";
import { AuthContext } from "../../contexts/AuthContext";
import axiosClient from "../../api/axiosClient";
import useGameTimer from "../../hooks/useGameTimer";

const ROWS = 15;
const COLS = 15;

const Caro5Game = forwardRef(({ onWinnerChange, onCursorChange }, ref) => {
  const { user, setUser } = useContext(AuthContext);
  const [board, setBoard] = useState(
    Array(ROWS)
      .fill()
      .map(() => Array(COLS).fill(null)),
  );
  const [winner, setWinner] = useState(null);
  const [cursor, setCursor] = useState([7, 7]);
  const [hasReported, setHasReported] = useState(false);
  const { timeElapsed, isRunning, start, pause, reset, load } = useGameTimer();

  // Hàm báo cáo chiến thắng về Backend và cập nhật profile trong AuthContext
  const reportWin = async () => {
    if (!user || hasReported) return;
    setHasReported(true);
    try {
      // Cập nhật bảng xếp hạng (win-based)
      try {
        await axiosClient.post("/games/update-score", {
          game_id: "caro5",
          win: true,
        });
      } catch (err) {
        console.warn("Cập nhật ranking thất bại (games/update-score):", err);
      }
      try {
        window.dispatchEvent(
          new CustomEvent("leaderboard:refresh", { detail: { gameId: "caro5" } })
        );
      } catch (err) {
        console.warn("Không thể dispatch leaderboard:refresh:", err);
      }
      console.log("✓ Trận thắng Caro 5 đã được cập nhật");
    } catch (error) {
      console.error("Lỗi cập nhật trận thắng Caro 5:", error);
      setHasReported(false);
    }
  };

  const checkWinner = (b, r, c) => {
    const directions = [
      [0, 1],
      [1, 0],
      [1, 1],
      [1, -1],
    ];
    const player = b[r][c];
    for (let [dr, dc] of directions) {
      let count = 1;
      for (let i = 1; i < 5; i++) {
        if (b[r + dr * i]?.[c + dc * i] === player) count++;
        else break;
      }
      for (let i = 1; i < 5; i++) {
        if (b[r - dr * i]?.[c - dc * i] === player) count++;
        else break;
      }
      if (count >= 5) return player;
    }
    if (b.flat().every((cell) => cell !== null)) return "DRAW";
    return null;
  };

  const aiMove = (currentBoard) => {
    const empty = [];
    currentBoard.forEach((row, r) =>
      row.forEach((cell, c) => {
        if (!cell) empty.push([r, c]);
      }),
    );
    if (empty.length === 0) return;
    const [r, c] = empty[Math.floor(Math.random() * empty.length)];
    const newBoard = currentBoard.map((row) => [...row]);
    newBoard[r][c] = "O";
    setBoard(newBoard);
    const win = checkWinner(newBoard, r, c);
    if (win) {
      // chỉ set winner; useEffect sẽ xử lý onWinnerChange/report
      setWinner(win);
    }
  };

  useEffect(() => {
    if (!winner) return;

    try {
      onWinnerChange && onWinnerChange(winner);
    } catch (err) {
      console.warn("onWinnerChange error:", err);
    }

    pause();

    // Nếu người chơi là X thắng thì report
    if (winner === "X") {
      reportWin();
    }
  }, [winner]);

  useImperativeHandle(ref, () => ({
    handleCommand: (cmd) => {
      if (winner) return;
      let [r, c] = cursor;
      if (cmd === "UP" && r > 0) r--;
      if (cmd === "DOWN" && r < ROWS - 1) r++;
      if (cmd === "LEFT" && c > 0) c--;
      if (cmd === "RIGHT" && c < COLS - 1) c++;

      if (cmd === "ENTER" && !board[r][c]) {
        const newBoard = board.map((row) => [...row]);
        newBoard[r][c] = "X";
        setBoard(newBoard);

        // Bắt đầu tính giờ khi đi bước đầu tiên
        if (!isRunning && timeElapsed === 0) {
          start();
        }

        const win = checkWinner(newBoard, r, c);
        if (win) {
          setWinner(win);
          if (win === "X") {

          }
        } else {
          setTimeout(() => aiMove(newBoard), 300);
        }
      }

      if (cmd === "BACK") {
        pause();
      }

      setCursor([r, c]);
      onCursorChange([r, c]);
    },

    // getState trả về board và time_elapsed
    getState: async () => {
      return {
        matrix_state: board,
        current_score: 0,
        time_elapsed: timeElapsed,
      };
    },

    // Loadstate từ session, bao gồm board và time_elapsed
    loadState: (session) => {
      try {
        const parsed =
          typeof session.matrix_state === "string"
            ? JSON.parse(session.matrix_state)
            : session.matrix_state;
        if (parsed) setBoard(parsed);
        if (session.current_score != null) {
        }
        if (session.time_elapsed != null) {
          load(Number(session.time_elapsed) || 0, false);
        }
      } catch (err) {
        console.error("Lỗi loadState Caro5:", err);
      }
    },

    startTimer: () => start(),
    pauseTimer: () => pause(),
    resetTimer: () => reset(),
    getTime: () => timeElapsed,
  }));

  return (
    <div className="bg-black p-4 rounded-3xl border-12 border-gray-800 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
      <div className="mb-3 text-xs text-gray-300">Time: {(timeElapsed / 1000).toFixed(1)}s</div>
      <div
        className="grid gap-1"
        style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}
      >
        {board.map((row, r) =>
          row.map((cell, c) => (
            <div
              key={`${r}-${c}`}
              className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all ${
                cell === "X"
                  ? "bg-blue-600"
                  : cell === "O"
                    ? "bg-red-600"
                    : "bg-gray-700"
              } ${cursor[0] === r && cursor[1] === c ? "ring-4 ring-white scale-110 z-10" : "opacity-80"}`}
            >
              {cell && (
                <span className="text-white font-bold text-xs">{cell}</span>
              )}
              {cursor[0] === r && cursor[1] === c && !cell && (
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              )}
            </div>
          )),
        )}
      </div>
    </div>
  );
});

export default Caro5Game;