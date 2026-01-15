import { useState, useEffect, useImperativeHandle, forwardRef, useContext } from "react"; // Thêm useContext ở đây
import { AuthContext } from "../../contexts/AuthContext";
import axiosClient from "../../api/axiosClient";

const ROWS = 15;
const COLS = 15;
// Định nghĩa vùng chơi 4x4 ở giữa
const START_R = 5,
  END_R = 8;
const START_C = 5,
  END_C = 8;

const COLORS = [
  "bg-red-500",
  "bg-blue-500",
  "bg-green-500",
  "bg-yellow-500",
  "bg-purple-500",
  "bg-pink-500",
  "bg-orange-500",
  "bg-cyan-500",
];

const MemoryGame = forwardRef(({ onWinnerChange, onCursorChange }, ref) => {
  const { user } = useContext(AuthContext);
  const [grid, setGrid] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [solved, setSolved] = useState([]); // Các ô đã tìm đúng cặp
  const [cursor, setCursor] = useState([5, 5]);
  const [isLock, setIsLock] = useState(false); // Khóa khi đang đợi lật úp
  const [hasReported, setHasReported] = useState(false);

  // Hàm gửi kết quả thắng lên backend
  const reportWin = async () => {
    if (!user || hasReported) return;

    try {
      setHasReported(true);
      await axiosClient.post("/users/stats/update", {
        stat_type: "win",
        value: 1,
      });
      console.log("✓ Kết quả Memory đã được cập nhật");
    } catch (error) {
      console.error("Lỗi cập nhật Memory:", error);
    }
  };

  // Khởi tạo bàn cờ ngẫu nhiên
  useEffect(() => {
    const pairs = [...COLORS, ...COLORS]; // 8 cặp màu
    const shuffled = pairs.sort(() => Math.random() - 0.5);
    const newGrid = [];
    let k = 0;
    for (let r = 0; r < 4; r++) {
      newGrid[r] = [];
      for (let c = 0; c < 4; c++) {
        newGrid[r][c] = shuffled[k++];
      }
    }
    setGrid(newGrid);
  }, []);

  useImperativeHandle(ref, () => ({
    handleCommand: (cmd) => {
      if (isLock) return;
      let [r, c] = cursor;
      if (cmd === "UP" && r > START_R) r--;
      if (cmd === "DOWN" && r < END_R) r++;
      if (cmd === "LEFT" && c > START_C) c--;
      if (cmd === "RIGHT" && c < END_C) c++;

      if (cmd === "ENTER") {
        const localR = r - START_R;
        const localC = c - START_C;
        const cellKey = `${localR}-${localC}`;

        // Kiểm tra nếu ô đã mở hoặc đã giải xong thì bỏ qua
        if (flipped.includes(cellKey) || solved.includes(cellKey)) return;

        const newFlipped = [...flipped, cellKey];
        setFlipped(newFlipped);

        if (newFlipped.length === 2) {
          setIsLock(true);
          const [firstR, firstC] = newFlipped[0].split("-").map(Number);
          const [secondR, secondC] = newFlipped[1].split("-").map(Number);

          if (grid[firstR][firstC] === grid[secondR][secondC]) {
            // Khớp màu
            setSolved([...solved, newFlipped[0], newFlipped[1]]);
            setFlipped([]);
            setIsLock(false);

            // Kiểm tra thắng cuộc
            if (solved.length + 2 === 16) {
              onWinnerChange("X");
              reportWin();
            }
          } else {
            // Không khớp -> Đợi 1s rồi úp lại
            setTimeout(() => {
              setFlipped([]);
              setIsLock(false);
            }, 800);
          }
        }
      }
      setCursor([r, c]);
      onCursorChange([r, c]);
    },
  }));

  const renderButton = (r, c) => {
    const isCursor = cursor[0] === r && cursor[1] === c;
    const isInPlayArea =
      r >= START_R && r <= END_R && c >= START_C && c <= END_C;
    let colorClass = "bg-gray-900 opacity-20";
    let content = null;

    if (isInPlayArea) {
      const localR = r - START_R;
      const localC = c - START_C;
      const cellKey = `${localR}-${localC}`;
      const isVisible = flipped.includes(cellKey) || solved.includes(cellKey);

      colorClass = isVisible ? grid[localR][localC] : "bg-gray-700";
    }

    return (
      <div
        key={`${r}-${c}`}
        className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${colorClass} ${
          isCursor ? "ring-4 ring-white scale-110 z-10 opacity-100" : ""
        }`}
      >
        {isCursor &&
          !flipped.includes(`${r - START_R}-${c - START_C}`) &&
          !solved.includes(`${r - START_R}-${c - START_C}`) && (
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
          )}
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

export default MemoryGame;
