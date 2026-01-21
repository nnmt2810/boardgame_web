import React, {
  useState,
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
  useContext,
} from "react";
import axiosClient from "../../api/axiosClient";
import { AuthContext } from "../../contexts/AuthContext";
import useGameTimer from "../../hooks/useGameTimer";

const ROWS = 8;
const COLS = 8;
const COLORS = ["red", "blue", "green", "yellow", "purple", "orange"];

const getRandomTile = () => COLORS[Math.floor(Math.random() * COLORS.length)];

const createGrid = () => {
  const g = Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => getRandomTile()),
  );
  return g;
};

const cloneGrid = (g) => g.map((row) => [...row]);

const areAdjacent = (a, b) => {
  const dr = Math.abs(a[0] - b[0]);
  const dc = Math.abs(a[1] - b[1]);
  return (dr === 1 && dc === 0) || (dr === 0 && dc === 1);
};

const Match3Game = forwardRef(({ onWinnerChange, onCursorChange }, ref) => {
  const { user } = useContext(AuthContext);
  const [grid, setGrid] = useState(() => createGrid());
  const [cursor, setCursor] = useState([0, 0]);
  const [selected, setSelected] = useState(null); // [r,c] or null
  const [score, setScore] = useState(0);
  const [isResolving, setIsResolving] = useState(false);
  const [hasReported, setHasReported] = useState(false);

  const resolveTimeoutRef = useRef(null);
  const { timeElapsed, isRunning, start, pause, reset, load, formatTime } =
    useGameTimer();

  // Report điểm về backend
  const reportScore = async (finalScore) => {
    if (!user || hasReported || !finalScore || finalScore <= 0) return;
    try {
      setHasReported(true);
      // Cập nhật ranking
      await axiosClient.post("/games/update-score", {
        game_id: "match3",
        score: finalScore,
      });
      // Kích hoạt refresh bảng xếp hạng toàn cục
      try {
        window.dispatchEvent(
          new CustomEvent("leaderboard:refresh", {
            detail: { gameId: "match3" },
          }),
        );
      } catch (e) {}
      console.log("✓ Match3 score reported:", finalScore);
    } catch (err) {
      console.error("Lỗi reportScore match3:", err);
      setHasReported(false);
    }
  };

  // Tìm tất cả các ô khớp (hàng/ cột >=3)
  const findMatches = (g) => {
    const remove = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
    // horizontal
    for (let r = 0; r < ROWS; r++) {
      let count = 1;
      for (let c = 1; c <= COLS; c++) {
        if (c < COLS && g[r][c] && g[r][c] === g[r][c - 1]) {
          count++;
        } else {
          if (count >= 3) {
            for (let k = 0; k < count; k++) remove[r][c - 1 - k] = true;
          }
          count = 1;
        }
      }
    }
    // vertical
    for (let c = 0; c < COLS; c++) {
      let count = 1;
      for (let r = 1; r <= ROWS; r++) {
        if (r < ROWS && g[r][c] && g[r][c] === g[r - 1][c]) {
          count++;
        } else {
          if (count >= 3) {
            for (let k = 0; k < count; k++) remove[r - 1 - k][c] = true;
          }
          count = 1;
        }
      }
    }
    const positions = [];
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++) if (remove[r][c]) positions.push([r, c]);
    return positions;
  };

  const collapseAndRefill = (g) => {
    for (let c = 0; c < COLS; c++) {
      let write = ROWS - 1;
      for (let r = ROWS - 1; r >= 0; r--) {
        if (g[r][c]) {
          g[write][c] = g[r][c];
          write--;
        }
      }
      for (let r = write; r >= 0; r--) {
        g[r][c] = getRandomTile();
      }
    }
  };

  // Chạy vòng lặp tìm & xử lý khớp liên tục
  const resolveMatchesCycle = async (startGrid) => {
    setIsResolving(true);
    let g = cloneGrid(startGrid);
    let totalRemoved = 0;
    while (true) {
      const matches = findMatches(g);
      if (!matches.length) break;
      totalRemoved += matches.length;
      // xóa ô khớp
      for (const [r, c] of matches) g[r][c] = null;
      // điểm số
      setScore((prev) => prev + matches.length * 10);
      // collapse and refill
      collapseAndRefill(g);
      await new Promise((res) => setTimeout(res, 180));
    }
    setGrid(g);
    setIsResolving(false);
    return totalRemoved;
  };

  // Di chuyển 2 ô và xử lý khớp
  const swapAndResolve = async (a, b) => {
    if (!areAdjacent(a, b)) return false;
    const g = cloneGrid(grid);
    const tmp = g[a[0]][a[1]];
    g[a[0]][a[1]] = g[b[0]][b[1]];
    g[b[0]][b[1]] = tmp;
    setGrid(g);
    // kiểm tra khớp
    const matches = findMatches(g);
    if (matches.length === 0) {
      await new Promise((res) => setTimeout(res, 120));
      const revert = cloneGrid(g);
      revert[a[0]][a[1]] = revert[b[0]][b[1]];
      revert[b[0]][b[1]] = tmp;
      setGrid(revert);
      return false;
    }
    await resolveMatchesCycle(g);
    return true;
  };

  useImperativeHandle(
    ref,
    () => ({
      handleCommand: (cmd) => {
        if (isResolving) return;

        if (cmd !== "BACK" && !isRunning && timeElapsed === 0) {
          start();
        }

        if (cmd === "BACK") {
          // Tạm dừng đồng hồ và gọi onWinnerChange
          pause();
          if (typeof onWinnerChange === "function") onWinnerChange("EXIT");
          reportScore(score);
          return;
        }
        if (cmd === "UP") {
          setCursor(([r, c]) => {
            const nr = Math.max(0, r - 1);
            setTimeout(() => {
              onCursorChange && onCursorChange([nr, c]);
            }, 0);
            return [nr, c];
          });
        } else if (cmd === "DOWN") {
          setCursor(([r, c]) => {
            const nr = Math.min(ROWS - 1, r + 1);
            setTimeout(() => {
              onCursorChange && onCursorChange([nr, c]);
            }, 0);
            return [nr, c];
          });
        } else if (cmd === "LEFT") {
          setCursor(([r, c]) => {
            const nc = Math.max(0, c - 1);
            setTimeout(() => {
              onCursorChange && onCursorChange([r, nc]);
            }, 0);
            return [r, nc];
          });
        } else if (cmd === "RIGHT") {
          setCursor(([r, c]) => {
            const nc = Math.min(COLS - 1, c + 1);
            setTimeout(() => {
              onCursorChange && onCursorChange([r, nc]);
            }, 0);
            return [r, nc];
          });
        } else if (cmd === "ENTER") {
          const cur = cursor;
          if (!selected) {
            setSelected(cur);
          } else {
            (async () => {
              const a = selected;
              const b = cur;
              setSelected(null);
              const swapped = await swapAndResolve(a, b);
              if (!swapped) {
                // không khớp, không làm gì thêm
              }
            })();
          }
        }
      },
      getState: async () => {
        return {
          matrix_state: { grid, cursor, selected },
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
          if (parsed?.grid) setGrid(parsed.grid);
          if (parsed?.cursor) setCursor(parsed.cursor);
          if (parsed?.selected) setSelected(parsed.selected);
          if (typeof session.current_score === "number")
            setScore(session.current_score);
          if (session.time_elapsed != null) {
            load(Number(session.time_elapsed) || 0, false);
          }
        } catch (err) {
          console.error("Lỗi loadState Match3:", err);
        }
      },
    }),
    [
      grid,
      cursor,
      selected,
      score,
      isResolving,
      user,
      isRunning,
      timeElapsed,
      start,
      pause,
      load,
    ],
  );

  useEffect(() => {
    resolveTimeoutRef.current = setTimeout(() => {
      resolveMatchesCycle(grid);
    }, 80);
    return () => clearTimeout(resolveTimeoutRef.current);
  }, []);

  const tileStyle = (color) => {
    const base =
      "w-8 h-8 sm:w-10 sm:h-10 rounded-md flex items-center justify-center text-xs font-bold";
    const colorClass =
      {
        red: "bg-red-500",
        blue: "bg-blue-500",
        green: "bg-green-500",
        yellow: "bg-yellow-400",
        purple: "bg-purple-500",
        orange: "bg-orange-400",
      }[color] || "bg-gray-700";
    return `${base} ${colorClass}`;
  };

  return (
    <div className="p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="font-bold text-sm">Ghép hàng 3</div>
        <div className="flex items-center gap-4">
          <div className="text-xs text-gray-300 font-mono">Score: {score}</div>
          <div className="text-xs text-gray-300 font-mono">
            Time:{" "}
            {formatTime
              ? formatTime(timeElapsed)
              : (timeElapsed / 1000).toFixed(1)}{" "}
            {isRunning ? "(running)" : "(paused)"}
          </div>
        </div>
      </div>

      <div
        className="grid gap-1"
        style={{ gridTemplateColumns: `repeat(${COLS}, min-content)` }}
      >
        {grid.map((row, r) =>
          row.map((cell, c) => {
            const isCursor = cursor[0] === r && cursor[1] === c;
            const isSelected =
              selected && selected[0] === r && selected[1] === c;
            return (
              <div
                key={`${r}-${c}`}
                className={`relative`}
                style={{ width: 36, height: 36 }}
              >
                <div
                  className={`${tileStyle(cell)} ${isCursor ? "ring-4 ring-white scale-110 z-10" : ""} ${isSelected ? "border-2 border-white" : ""}`}
                />
              </div>
            );
          }),
        )}
      </div>

      <div className="mt-3 text-xs text-gray-400">
        Hướng dẫn: Dùng phím di chuyển để chọn ô. ENTER chọn/hoán đổi. BACK để
        thoát và ghi điểm.
      </div>
    </div>
  );
});

export default Match3Game;
