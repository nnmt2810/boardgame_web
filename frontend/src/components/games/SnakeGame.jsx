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

const ROWS = 15;
const COLS = 15;
const INITIAL_SNAKE = [
  [7, 7],
  [7, 8],
  [7, 9],
];
const INITIAL_DIR = "LEFT";

const SnakeGame = forwardRef(({ onWinnerChange, onCursorChange }, ref) => {
  const { user } = useContext(AuthContext);
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [dir, setDir] = useState(INITIAL_DIR);
  const [food, setFood] = useState([3, 3]);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [hasReported, setHasReported] = useState(false);

  // 1. Chỉ gọi API khi Game Over
  const reportScore = useCallback(
    async (finalScore) => {
      if (!user || hasReported || finalScore === 0) return;

      try {
        setHasReported(true); // Đánh dấu đã gửi ngay lập tức
        await axiosClient.post("/users/stats/update", {
          stat_type: "snake_score",
          value: finalScore,
        });
        console.log("✓ Điểm Snake đã được cập nhật:", finalScore);
      } catch (error) {
        console.error("Lỗi cập nhật điểm Snake:", error);
        setHasReported(false); // Reset nếu lỗi để có thể thử lại
      }
    },
    [user, hasReported],
  );

  // 2. Tách biệt việc theo dõi Game Over để gửi điểm (Tránh lỗi Side Effect trong render)
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

    setSnake((prevSnake) => {
      const head = prevSnake[0];
      const newHead = [...head];

      if (dir === "UP") newHead[0]--;
      if (dir === "DOWN") newHead[0]++;
      if (dir === "LEFT") newHead[1]--;
      if (dir === "RIGHT") newHead[1]++;

      // Kiểm tra va chạm
      if (
        newHead[0] < 0 ||
        newHead[0] >= ROWS ||
        newHead[1] < 0 ||
        newHead[1] >= COLS ||
        prevSnake.some((seg) => seg[0] === newHead[0] && seg[1] === newHead[1])
      ) {
        setIsGameOver(true);
        onWinnerChange("LOSE");
        return prevSnake;
      }

      const newSnake = [newHead, ...prevSnake];

      // Ăn mồi
      if (newHead[0] === food[0] && newHead[1] === food[1]) {
        setScore((s) => s + 1);
        generateFood(newSnake);
      } else {
        newSnake.pop();
      }

      onCursorChange(newHead);
      return newSnake;
    });
  }, [dir, food, isGameOver, generateFood, onWinnerChange, onCursorChange]);

  useEffect(() => {
    const interval = setInterval(moveSnake, 230);
    return () => clearInterval(interval);
  }, [moveSnake]);

  useImperativeHandle(ref, () => ({
    handleCommand: (cmd) => {
      // Logic Reset thủ công khi nhấn ENTER sau khi chết
      if (isGameOver && cmd === "ENTER") {
        setSnake(INITIAL_SNAKE);
        setDir(INITIAL_DIR);
        setIsGameOver(false);
        setScore(0);
        setHasReported(false); // Reset flag cho ván mới
        return;
      }
      if (isGameOver) return;
      if (cmd === "UP" && dir !== "DOWN") setDir("UP");
      if (cmd === "DOWN" && dir !== "UP") setDir("DOWN");
      if (cmd === "LEFT" && dir !== "RIGHT") setDir("LEFT");
      if (cmd === "RIGHT" && dir !== "LEFT") setDir("RIGHT");
    },
    getState: async () => {
      return {
        matrix_state: {
          snake,
          food,
          dir,
        },
        current_score: score,
        time_elapsed: 0,
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
      } catch (err) {
        console.error("Lỗi loadState Snake:", err);
      }
    }
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
