import React, { useState, useImperativeHandle, forwardRef, useContext, useEffect } from "react";
import { AuthContext } from "../../contexts/AuthContext";
import axiosClient from "../../api/axiosClient";
import useGameTimer from "../../hooks/useGameTimer";

const ROWS = 15;
const COLS = 15;
const START_R = 6,
  END_R = 8;
const START_C = 6,
  END_C = 8;

const TicTacToeGame = forwardRef(({ onWinnerChange, onCursorChange }, ref) => {
  const { user, setUser } = useContext(AuthContext);
  const [board, setBoard] = useState(
    Array(3)
      .fill()
      .map(() => Array(3).fill(null)),
  );
  const [winner, setWinner] = useState(null);
  const [cursor, setCursor] = useState([7, 7]);
  const [hasReported, setHasReported] = useState(false);
  const { timeElapsed, isRunning, start, pause, reset, load, formatTime } = useGameTimer();

  const checkWin = (b) => {
    const lines = [
      ...b,
      [b[0][0], b[1][0], b[2][0]],
      [b[0][1], b[1][1], b[2][1]],
      [b[0][2], b[1][2], b[2][2]],
      [b[0][0], b[1][1], b[2][2]],
      [b[0][2], b[1][1], b[2][0]],
    ];
    for (let line of lines) {
      if (line[0] && line[0] === line[1] && line[0] === line[2]) return line[0];
    }
    if (b.flat().every((cell) => cell !== null)) return "DRAW";
    return null;
  };

  // Gửi thắng lên backend
  const reportWin = async () => {
    if (!user || hasReported) return;
    setHasReported(true);
    try {
      try {
        const resp = await axiosClient.post("/users/stats/update", {
          stat_type: "win",
          value: 1,
          game_code: "tictactoe",
        });
        if (resp?.data?.user && typeof setUser === "function") {
          try {
            setUser(resp.data.user);
          } catch (err) {
            console.warn("Không thể setUser từ response:", err);
          }
        }
      } catch (err) {
        console.warn("Cập nhật stats user thất bại:", err);
      }

      // Cập nhật bảng xếp hạng game
      try {
        await axiosClient.post("/games/update-score", {
          game_id: "tictactoe",
          win: true,
        });
      } catch (err) {
        console.warn("Cập nhật ranking thất bại (games/update-score):", err);
      }

      try {
        window.dispatchEvent(
          new CustomEvent("leaderboard:refresh", { detail: { gameId: "tictactoe" } })
        );
      } catch (err) {
        console.warn("Không thể dispatch leaderboard:refresh:", err);
      }

      console.log("✓ Trận thắng Tic Tac Toe đã được cập nhật");
    } catch (error) {
      console.error("Lỗi cập nhật trận thắng:", error);
      setHasReported(false);
    }
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
    const win = checkWin(newBoard);
    if (win) {
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

    // Dừng timer khi game kết thúc
    pause();

    if (winner === "X") {
      reportWin();
    }
  }, [winner]);

  useImperativeHandle(ref, () => ({
    handleCommand: (cmd) => {
      if (winner) return;
      let [r, c] = cursor;
      if (cmd === "UP" && r > START_R) r--;
      if (cmd === "DOWN" && r < END_R) r++;
      if (cmd === "LEFT" && c > START_C) c--;
      if (cmd === "RIGHT" && c < END_C) c++;

      if (cmd === "ENTER") {
        const boardR = r - START_R;
        const boardC = c - START_C;
        if (!board[boardR][boardC]) {
          const newBoard = board.map((row) => [...row]);
          newBoard[boardR][boardC] = "X";
          setBoard(newBoard);

          // Bắt đầu timer ở nước đi đầu tiên của người chơi
          if (!isRunning && timeElapsed === 0) start();

          const win = checkWin(newBoard);
          if (win) {
            setWinner(win);
            // report xử lý trong useEffect
          } else {
            setTimeout(() => aiMove(newBoard), 400);
          }
        }
      }

      if (cmd === "BACK") {
        // Pause timer khi thoát
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
        console.error("Lỗi loadState TicTacToe:", err);
      }
    },
    startTimer: () => start(),
    pauseTimer: () => pause(),
    resetTimer: () => reset(),
    getTime: () => timeElapsed,
  }));

  const renderButton = (r, c) => {
    const isCursor = cursor[0] === r && cursor[1] === c;
    const isInPlayArea =
      r >= START_R && r <= END_R && c >= START_C && c <= END_C;

    let colorClass = "bg-gray-900 opacity-20";
    let content = null;

    if (isInPlayArea) {
      const val = board[r - START_R][c - START_C];
      colorClass =
        val === "X"
          ? "bg-green-500"
          : val === "O"
            ? "bg-red-500"
            : "bg-gray-700";
      if (val)
        content = <span className="text-white font-bold text-xs">{val}</span>;
    }

    return (
      <div
        key={`${r}-${c}`}
        className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all ${colorClass} ${
          isCursor ? "ring-4 ring-white scale-110 z-10 opacity-100" : ""
        }`}
      >
        {content ||
          (isCursor && (
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
          ))}
      </div>
    );
  };

  return (
    <div className="bg-black p-4 rounded-3xl border-12 border-gray-800 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
      <div className="mb-3 text-xs text-gray-300">
        Time: {formatTime ? formatTime(timeElapsed) : (timeElapsed / 1000).toFixed(1)} {isRunning ? "(running)" : winner ? "(stopped)" : "(paused)"}
      </div>

      <div
        className="grid gap-1.5"
        style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: ROWS }).map((_, r) =>
          Array.from({ length: COLS }).map((_, c) => renderButton(r, c)),
        )}
      </div>
    </div>
  );
});

export default TicTacToeGame;