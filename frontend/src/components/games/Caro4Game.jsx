import { useState, useImperativeHandle, forwardRef, useContext, useEffect } from "react";
import { AuthContext } from "../../contexts/AuthContext";
import axiosClient from "../../api/axiosClient";
import useGameTimer from "../../hooks/useGameTimer";

const ROWS = 15;
const COLS = 15;

const Caro4Game = forwardRef(({ onWinnerChange, onCursorChange }, ref) => {
  // Lấy cả setUser nếu AuthContext có export để cập nhật profile sau khi report
  const { user, setUser } = useContext(AuthContext);

  const [board, setBoard] = useState(
    Array(ROWS)
      .fill()
      .map(() => Array(COLS).fill(null)),
  );
  const [winner, setWinner] = useState(null);
  const [cursor, setCursor] = useState([7, 7]);
  const [hasReported, setHasReported] = useState(false);
  const { timeElapsed, isRunning, start, pause, reset, load, formatTime } = useGameTimer();

  // Hàm báo cáo chiến thắng về Backend
  const reportWin = async () => {
    if (!user || hasReported) return;
    setHasReported(true);
    try {
      const statResp = await axiosClient.post("/users/stats/update", {
        stat_type: "win",
        value: 1,
        game_code: "caro4",
      });

      // Nếu backend trả updated user, cập nhật AuthContext nếu setUser có tồn tại
      if (statResp?.data?.user && typeof setUser === "function") {
        try {
          setUser(statResp.data.user);
        } catch (err) {
          console.warn("Không thể setUser từ response:", err);
        }
      }

      // Cập nhật bảng xếp hạng (win-based)
      try {
        await axiosClient.post("/games/update-score", {
          game_id: "caro4",
          win: true,
        });
      } catch (err) {
        console.warn("Cập nhật ranking thất bại (games/update-score):", err);
      }

      try {
        window.dispatchEvent(
          new CustomEvent("leaderboard:refresh", {
            detail: { gameId: "caro4" },
          }),
        );
      } catch (err) {
        console.warn("Không thể dispatch leaderboard:refresh:", err);
      }

      console.log("✓ Trận thắng Caro 4 đã được cập nhật");
    } catch (error) {
      console.error("Lỗi cập nhật trận thắng Caro 4:", error);
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
      setWinner(win);
    }
  };

  // useEffect xử lý khi winner thay đổi
  useEffect(() => {
    if (!winner) return;

    try {
      onWinnerChange && onWinnerChange(winner);
    } catch (err) {
      console.warn("onWinnerChange error:", err);
    }

    // Dừng timer khi game kết thúc
    pause();

    // Nếu người chơi thắng thì report lên backend
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

        // Bắt đầu timer khi người chơi đánh nước đầu tiên
        if (!isRunning && timeElapsed === 0) start();

        const win = checkWinner(newBoard, r, c);
        if (win) {
          setWinner(win);
        } else {
          setTimeout(() => aiMove(newBoard), 300);
        }
      }

      if (cmd === "BACK") {
        // pause timer khi thoát
        pause();
      }

      setCursor([r, c]);
      onCursorChange([r, c]);
    },
    getState: async () => {
      return {
        matrix_state: board,
        current_score: 0,
        time_elapsed: timeElapsed, // trả thời gian đã trôi qua (ms)
      };
    },
    loadState: (session) => {
      try {
        const parsed =
          typeof session.matrix_state === "string"
            ? JSON.parse(session.matrix_state)
            : session.matrix_state;
        if (parsed) setBoard(parsed);
        if (session.time_elapsed != null) {
          load(Number(session.time_elapsed) || 0, false);
        }
      } catch (err) {
        console.error("Lỗi loadState Caro4:", err);
      }
    },
    startTimer: () => start(),
    pauseTimer: () => pause(),
    resetTimer: () => reset(),
    getTime: () => timeElapsed,
  }));

  return (
    <div className="bg-black p-4 rounded-3xl border-12 border-gray-800">
      {/* Hiển thị thời gian liên tục */}
      <div className="mb-3 text-xs text-gray-300">Time: {formatTime ? formatTime(timeElapsed) : (timeElapsed / 1000).toFixed(1)} {isRunning ? "(running)" : winner ? "(stopped)" : "(paused)"}</div>

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
                  ? "bg-blue-500"
                  : cell === "O"
                    ? "bg-red-500"
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

export default Caro4Game;