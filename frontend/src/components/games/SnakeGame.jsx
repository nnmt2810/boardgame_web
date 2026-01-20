import {
  useState,
  useEffect,
  useImperativeHandle,
  forwardRef,
  useCallback,
  useContext,
} from "react";
import { AuthContext } from "../../contexts/AuthContext";
import axiosClient from "../../api/axiosClient";
import useGameTimer from "../../hooks/useGameTimer";

const ROWS = 15;
const COLS = 15;
const INITIAL_SNAKE = [
  [7, 7],
  [7, 8],
  [7, 9],
];
const INITIAL_DIR = "LEFT";

const SnakeGame = forwardRef(({ onWinnerChange, onCursorChange }, ref) => {
  const { user, setUser } = useContext(AuthContext);
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [dir, setDir] = useState(INITIAL_DIR);
  const [food, setFood] = useState([3, 3]);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [hasReported, setHasReported] = useState(false);
  const { timeElapsed, isRunning, start, pause, reset, load, formatTime } = useGameTimer();

  // Report điểm về backend
  const reportScore = useCallback(
    async (finalScore) => {
      if (!user || hasReported || finalScore <= 0) return;
      setHasReported(true);
      try {
        const resp = await axiosClient.post("/users/stats/update", {
          stat_type: "snake_score",
          value: finalScore,
          game_code: "snake",
        });

        if (resp?.data?.user && typeof setUser === "function") {
          try {
            setUser(resp.data.user);
          } catch (err) {
            console.warn("Không thể setUser từ response:", err);
          }
        }

        try {
          await axiosClient.post("/games/update-score", {
            game_id: "snake",
            score: finalScore,
          });
        } catch (err) {
          console.warn("Cập nhật ranking thất bại (games/update-score):", err);
        }

        try {
          window.dispatchEvent(
            new CustomEvent("leaderboard:refresh", { detail: { gameId: "snake" } })
          );
        } catch (err) {
          console.warn("Không thể dispatch leaderboard:refresh:", err);
        }

        console.log("✓ Điểm Snake đã được cập nhật:", finalScore);
      } catch (error) {
        console.error("Lỗi cập nhật điểm Snake:", error);
        setHasReported(false);
      }
    },
    [user, hasReported, setUser],
  );

  useEffect(() => {
    if (!isGameOver) return;

    // Tạm dừng timer
    pause();

    try {
      onWinnerChange && onWinnerChange("LOSE");
    } catch (e) {
      console.warn("onWinnerChange error:", e);
    }

    // Report khi điểm > 0
    if (score > 0) {
      reportScore(score);
    }
  }, [isGameOver]);

  // Đảm bảo chỉ report 1 lần khi game over
  useEffect(() => {
    if (isGameOver && score > 0 && !hasReported) {
      reportScore(score);
    }
  }, [isGameOver, score, hasReported, reportScore]);

  const generateFood = useCallback((currentSnake) => {
    let newFood;
    while (true) {
      newFood = [
        Math.floor(Math.random() * ROWS),
        Math.floor(Math.random() * COLS),
      ];
      if (
        !currentSnake.some(
          (seg) => seg[0] === newFood[0] && seg[1] === newFood[1],
        )
      )
        break;
    }
    setFood(newFood);
  }, []);

  const moveSnake = useCallback(() => {
    if (isGameOver) return;

    let newHeadLocal = null;

    setSnake((prevSnake) => {
      const head = prevSnake[0];
      const newHead = [...head];

      if (dir === "UP") newHead[0]--;
      if (dir === "DOWN") newHead[0]++;
      if (dir === "LEFT") newHead[1]--;
      if (dir === "RIGHT") newHead[1]++;

      newHeadLocal = newHead;

      // Kiểm tra va chạm
      if (
        newHead[0] < 0 ||
        newHead[0] >= ROWS ||
        newHead[1] < 0 ||
        newHead[1] >= COLS ||
        prevSnake.some((seg) => seg[0] === newHead[0] && seg[1] === newHead[1])
      ) {
        setIsGameOver(true);
        return prevSnake;
      }

      const newSnake = [newHead, ...prevSnake];

      if (newHead[0] === food[0] && newHead[1] === food[1]) {
        setScore((s) => s + 1);
        generateFood(newSnake);
      } else {
        newSnake.pop();
      }

      return newSnake;
    });

    if (newHeadLocal && typeof onCursorChange === "function") {
      setTimeout(() => {
        try {
          onCursorChange(newHeadLocal);
        } catch (e) {
          console.warn("onCursorChange error:", e);
        }
      }, 0);
    }

    // Bắt đầu timer khi di chuyển lần đầu
    if (!isRunning && timeElapsed === 0) {
      start();
    }
  }, [dir, food, isGameOver, generateFood, isRunning, timeElapsed, start, onCursorChange]);

  useEffect(() => {
    const interval = setInterval(moveSnake, 230);
    return () => clearInterval(interval);
  }, [moveSnake]);

  useImperativeHandle(ref, () => ({
    handleCommand: (cmd) => {
      // Reset on ENTER after death
      if (isGameOver && cmd === "ENTER") {
        setSnake(INITIAL_SNAKE);
        setDir(INITIAL_DIR);
        setIsGameOver(false);
        setScore(0);
        setHasReported(false);
        reset();
        return;
      }
      if (isGameOver) return;

      if (cmd === "UP" && dir !== "DOWN") setDir("UP");
      if (cmd === "DOWN" && dir !== "UP") setDir("DOWN");
      if (cmd === "LEFT" && dir !== "RIGHT") setDir("LEFT");
      if (cmd === "RIGHT" && dir !== "LEFT") setDir("RIGHT");

      if (!isRunning && timeElapsed === 0) {
        start();
      }
    },
    getState: async () => {
      return {
        matrix_state: {
          snake,
          food,
          dir,
        },
        current_score: score,
        time_elapsed: timeElapsed,
      };
    },
    loadState: (session) => {
      try {
        const parsed =
          typeof session.matrix_state === "string"
            ? JSON.parse(session.matrix_state)
            : session.matrix_state;
        if (parsed) {
          if (parsed.snake) setSnake(parsed.snake);
          if (parsed.food) setFood(parsed.food);
          if (parsed.dir) setDir(parsed.dir);
        }
        if (session.current_score != null) setScore(session.current_score);
        if (session.time_elapsed != null) {
          load(Number(session.time_elapsed) || 0, false);
        }
      } catch (err) {
        console.error("Lỗi loadState Snake:", err);
      }
    },
    startTimer: () => start(),
    pauseTimer: () => pause(),
    resetTimer: () => {
      reset();
      setHasReported(false);
    },
    getTime: () => timeElapsed,
  }));

  const renderButton = (r, c) => {
    const isHead = snake[0][0] === r && snake[0][1] === c;
    const isBody = snake.some(
      (seg, i) => i !== 0 && seg[0] === r && seg[1] === c,
    );
    const isFood = food[0] === r && food[1] === c;
    let colorClass = isHead
      ? "bg-green-400 z-10 scale-110"
      : isBody
        ? "bg-green-700 opacity-80"
        : isFood
          ? "bg-red-500 animate-pulse"
          : "bg-gray-800";
    return (
      <div
        key={`${r}-${c}`}
        className={`w-6 h-6 sm:w-8 sm:h-8 rounded-sm ${colorClass}`}
      />
    );
  };

  return (
    <div className="bg-black p-4 rounded-3xl border-12 border-gray-800 shadow-2xl">
      <div className="mb-2 text-center text-gray-300 text-xs">
        Time: {formatTime ? formatTime(timeElapsed) : (timeElapsed / 1000).toFixed(1)}{" "}
        {isRunning ? "(running)" : isGameOver ? "(stopped)" : "(paused)"}
      </div>

      <div
        className="grid gap-1"
        style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: ROWS }).map((_, r) =>
          Array.from({ length: COLS }).map((_, c) => renderButton(r, c)),
        )}
      </div>
      <div className="mt-2 text-center text-green-500 font-mono text-xs uppercase tracking-widest">
        Score: {score}
      </div>
    </div>
  );
});

export default SnakeGame;
