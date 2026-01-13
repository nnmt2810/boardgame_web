import {
  useState,
  useEffect,
  useImperativeHandle,
  forwardRef,
  useCallback,
} from "react";

const ROWS = 15;
const COLS = 15;
const INITIAL_SNAKE = [
  [7, 7],
  [7, 8],
  [7, 9],
];
const INITIAL_DIR = "LEFT";

const SnakeGame = forwardRef(({ onWinnerChange, onCursorChange }, ref) => {
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [dir, setDir] = useState(INITIAL_DIR);
  const [food, setFood] = useState([3, 3]);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);

  // Hàm tạo thức ăn ngẫu nhiên
  const generateFood = useCallback((currentSnake) => {
    let newFood;
    while (true) {
      newFood = [
        Math.floor(Math.random() * ROWS),
        Math.floor(Math.random() * COLS),
      ];
      const isOnSnake = currentSnake.some(
        (seg) => seg[0] === newFood[0] && seg[1] === newFood[1]
      );
      if (!isOnSnake) break;
    }
    setFood(newFood);
  }, []);

  // Logic di chuyển của rắn
  const moveSnake = useCallback(() => {
    if (isGameOver) return;

    setSnake((prevSnake) => {
      const head = prevSnake[0];
      const newHead = [...head];

      if (dir === "UP") newHead[0]--;
      if (dir === "DOWN") newHead[0]++;
      if (dir === "LEFT") newHead[1]--;
      if (dir === "RIGHT") newHead[1]++;

      // Kiểm tra va chạm tường
      if (
        newHead[0] < 0 ||
        newHead[0] >= ROWS ||
        newHead[1] < 0 ||
        newHead[1] >= COLS
      ) {
        setIsGameOver(true);
        onWinnerChange("LOSE");
        return prevSnake;
      }

      // Kiểm tra va chạm thân
      if (
        prevSnake.some((seg) => seg[0] === newHead[0] && seg[1] === newHead[1])
      ) {
        setIsGameOver(true);
        onWinnerChange("LOSE");
        return prevSnake;
      }

      const newSnake = [newHead, ...prevSnake];

      // Kiểm tra ăn mồi
      if (newHead[0] === food[0] && newHead[1] === food[1]) {
        setScore((s) => s + 1);
        generateFood(newSnake);
      } else {
        newSnake.pop(); // Không ăn thì bỏ phần đuôi cũ
      }

      onCursorChange(newHead); // Cập nhật tọa độ đầu rắn lên bảng điều khiển
      return newSnake;
    });
  }, [dir, food, isGameOver, generateFood, onWinnerChange, onCursorChange]);

  // Vòng lặp game (Game Loop)
  useEffect(() => {
    const interval = setInterval(moveSnake, 230);
    return () => clearInterval(interval);
  }, [moveSnake]);

  // Nhận lệnh từ Controller
  useImperativeHandle(ref, () => ({
    handleCommand: (cmd) => {
      if (isGameOver) return;
      // Tránh việc rắn đang đi trái mà bấm phải (quay đầu 180 độ)
      if (cmd === "UP" && dir !== "DOWN") setDir("UP");
      if (cmd === "DOWN" && dir !== "UP") setDir("DOWN");
      if (cmd === "LEFT" && dir !== "RIGHT") setDir("LEFT");
      if (cmd === "RIGHT" && dir !== "LEFT") setDir("RIGHT");
    },
  }));

  const renderButton = (r, c) => {
    const isHead = snake[0][0] === r && snake[0][1] === c;
    const isBody = snake.some(
      (seg, i) => i !== 0 && seg[0] === r && seg[1] === c
    );
    const isFood = food[0] === r && food[1] === c;

    let colorClass = "bg-gray-800";
    if (isHead)
      colorClass =
        "bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.8)] z-10 scale-110";
    else if (isBody) colorClass = "bg-green-700 opacity-80";
    else if (isFood)
      colorClass =
        "bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]";

    return (
      <div
        key={`${r}-${c}`}
        className={`w-6 h-6 sm:w-8 sm:h-8 rounded-sm transition-all duration-100 ${colorClass}`}
      >
        {isHead && <div className="w-1 h-1 bg-black rounded-full" />}
      </div>
    );
  };

  return (
    <div className="bg-black p-4 rounded-3xl border-12 border-gray-800 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
      <div
        className="grid gap-1"
        style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: ROWS }).map((_, r) =>
          Array.from({ length: COLS }).map((_, c) => renderButton(r, c))
        )}
      </div>
      <div className="mt-2 text-center text-green-500 font-mono text-xs">
        SCORE: {score}
      </div>
    </div>
  );
});

export default SnakeGame;
