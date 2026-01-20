import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef, useContext } from "react";
import axiosClient from "../../api/axiosClient";
import { AuthContext } from "../../contexts/AuthContext";

/**
 * Match3Game (Ghép hàng 3, simple)
 *
 * - Grid 8x8, nhiều màu (COLORS)
 * - Dùng keyboard để điều khiển:
 *    UP/DOWN/LEFT/RIGHT di chuyển con trỏ
 *    ENTER: chọn/hoán đổi ô (select / swap)
 *    BACK: thoát (khi thoát nếu score>0 sẽ gửi reportScore)
 * - Exposed methods via ref:
 *    handleCommand(cmd), getState(), loadState(session)
 * - getState trả về { matrix_state, current_score, time_elapsed }
 * - loadState chấp nhận matrix_state từ save
 *
 * - Khi người chơi thoát (BACK), component sẽ gửi điểm cuối lên backend:
 *    POST /games/update-score { game_id: "match3", score }
 *   và dispatch event 'leaderboard:refresh' để làm mới leaderboard.
 *
 * Đây là game bản mẫu, logic là đủ để chơi cơ bản (swap, match, collapse, refill).
 */

const ROWS = 8;
const COLS = 8;
const COLORS = ["red","blue","green","yellow","purple","orange"]; // có thể map tới class tailwind nếu cần

const getRandomTile = () => COLORS[Math.floor(Math.random() * COLORS.length)];

const createGrid = () => {
  const g = Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => getRandomTile()));
  return g;
};

// Helper: deep clone grid
const cloneGrid = (g) => g.map(row => [...row]);

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

  // Report final score to backend when leaving/explicit call
  const reportScore = async (finalScore) => {
    if (!user || hasReported || !finalScore || finalScore <= 0) return;
    try {
      setHasReported(true);
      // Try update user stats (optional)
      try {
        await axiosClient.post("/users/stats/update", {
          stat_type: "match3_score",
          value: finalScore,
        });
      } catch (e) {
        // ignore
      }
      // Update ranking (score-based game)
      try {
        await axiosClient.post("/games/update-score", {
          game_id: "match3",
          score: finalScore,
        });
      } catch (e) {
        console.warn("Cập nhật ranking match3 thất bại", e);
      }
      // Dispatch event to refresh leaderboard
      try {
        window.dispatchEvent(new CustomEvent("leaderboard:refresh", { detail: { gameId: "match3" } }));
      } catch (e) {}
      console.log("✓ Match3 score reported:", finalScore);
    } catch (err) {
      console.error("Lỗi reportScore match3:", err);
      setHasReported(false);
    }
  };

  // Find all matches (>=3) and return array of positions to remove
  const findMatches = (g) => {
    const remove = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
    // horizontal
    for (let r = 0; r < ROWS; r++) {
      let count = 1;
      for (let c = 1; c <= COLS; c++) {
        if (c < COLS && g[r][c] && g[r][c] === g[r][c-1]) {
          count++;
        } else {
          if (count >= 3) {
            for (let k = 0; k < count; k++) remove[r][c-1-k] = true;
          }
          count = 1;
        }
      }
    }
    // vertical
    for (let c = 0; c < COLS; c++) {
      let count = 1;
      for (let r = 1; r <= ROWS; r++) {
        if (r < ROWS && g[r][c] && g[r][c] === g[r-1][c]) {
          count++;
        } else {
          if (count >= 3) {
            for (let k = 0; k < count; k++) remove[r-1-k][c] = true;
          }
          count = 1;
        }
      }
    }
    const positions = [];
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (remove[r][c]) positions.push([r,c]);
    return positions;
  };

  // Collapse columns after removal and refill top with random tiles
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

  // Run a single resolve cycle: find matches, remove them, update score, collapse/refill. Repeat until no matches.
  const resolveMatchesCycle = async (startGrid) => {
    setIsResolving(true);
    let g = cloneGrid(startGrid);
    let totalRemoved = 0;
    while (true) {
      const matches = findMatches(g);
      if (!matches.length) break;
      totalRemoved += matches.length;
      // remove
      for (const [r,c] of matches) g[r][c] = null;
      // score: e.g., 10 points per tile (can scale)
      setScore(prev => prev + matches.length * 10);
      // collapse & refill
      collapseAndRefill(g);
      // small delay to show effect (non-blocking)
      // We await a timeout to allow UI update
      // eslint-disable-next-line no-await-in-loop
      await new Promise(res => setTimeout(res, 180));
    }
    setGrid(g);
    setIsResolving(false);
    return totalRemoved;
  };

  // Swap two tiles and resolve
  const swapAndResolve = async (a, b) => {
    if (!areAdjacent(a,b)) return false;
    const g = cloneGrid(grid);
    const tmp = g[a[0]][a[1]];
    g[a[0]][a[1]] = g[b[0]][b[1]];
    g[b[0]][b[1]] = tmp;
    setGrid(g);
    // check if swap produces any match; if not, swap back
    const matches = findMatches(g);
    if (matches.length === 0) {
      // revert after short delay to show swap
      await new Promise(res => setTimeout(res, 120));
      const revert = cloneGrid(g);
      revert[a[0]][a[1]] = revert[b[0]][b[1]];
      revert[b[0]][b[1]] = tmp;
      setGrid(revert);
      return false;
    }
    // else resolve until no more matches
    await resolveMatchesCycle(g);
    return true;
  };

  // handle keyboard commands
  useImperativeHandle(ref, () => ({
    handleCommand: (cmd) => {
      if (isResolving) return;
      if (cmd === "BACK") {
        // call onWinnerChange? For match3 we treat exit as finalize: report score
        if (typeof onWinnerChange === "function") onWinnerChange("EXIT");
        reportScore(score);
        return;
      }
      if (cmd === "UP") {
        setCursor(([r,c]) => {
          const nr = Math.max(0, r-1);
          onCursorChange && onCursorChange([nr, c]);
          return [nr,c];
        });
      } else if (cmd === "DOWN") {
        setCursor(([r,c]) => {
          const nr = Math.min(ROWS-1, r+1);
          onCursorChange && onCursorChange([nr, c]);
          return [nr,c];
        });
      } else if (cmd === "LEFT") {
        setCursor(([r,c]) => {
          const nc = Math.max(0, c-1);
          onCursorChange && onCursorChange([r, nc]);
          return [r,nc];
        });
      } else if (cmd === "RIGHT") {
        setCursor(([r,c]) => {
          const nc = Math.min(COLS-1, c+1);
          onCursorChange && onCursorChange([r, nc]);
          return [r,nc];
        });
      } else if (cmd === "ENTER") {
        const cur = cursor;
        if (!selected) {
          setSelected(cur);
        } else {
          // try swap if adjacent
          const success = (async () => {
            const a = selected;
            const b = cur;
            setSelected(null);
            const swapped = await swapAndResolve(a, b);
            if (!swapped) {
              // maybe provide feedback
            }
          })();
        }
      }
    },
    getState: async () => {
      return {
        matrix_state: { grid, cursor, selected },
        current_score: score,
        time_elapsed: 0,
      };
    },
    loadState: (session) => {
      try {
        const parsed = typeof session.matrix_state === "string" ? JSON.parse(session.matrix_state) : session.matrix_state;
        if (parsed?.grid) setGrid(parsed.grid);
        if (parsed?.cursor) setCursor(parsed.cursor);
        if (parsed?.selected) setSelected(parsed.selected);
        if (typeof session.current_score === "number") setScore(session.current_score);
      } catch (err) {
        console.error("Lỗi loadState Match3:", err);
      }
    }
  }), [grid, cursor, selected, score, isResolving, user]);

  useEffect(() => {
    // auto-resolve initial accidental matches on mount
    // small timeout to allow mount
    resolveTimeoutRef.current = setTimeout(() => {
      resolveMatchesCycle(grid);
    }, 80);
    return () => clearTimeout(resolveTimeoutRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Render tile with color
  const tileStyle = (color) => {
    const base = "w-8 h-8 sm:w-10 sm:h-10 rounded-md flex items-center justify-center text-xs font-bold";
    const colorClass = {
      red: "bg-red-500",
      blue: "bg-blue-500",
      green: "bg-green-500",
      yellow: "bg-yellow-400",
      purple: "bg-purple-500",
      orange: "bg-orange-400"
    }[color] || "bg-gray-700";
    return `${base} ${colorClass}`;
  };

  return (
    <div className="p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="font-bold text-sm">Ghép hàng 3</div>
        <div className="text-xs text-gray-300 font-mono">Score: {score}</div>
      </div>

      <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${COLS}, min-content)` }}>
        {grid.map((row, r) =>
          row.map((cell, c) => {
            const isCursor = cursor[0] === r && cursor[1] === c;
            const isSelected = selected && selected[0] === r && selected[1] === c;
            return (
              <div
                key={`${r}-${c}`}
                className={`relative`}
                style={{ width: 36, height: 36 }}
              >
                <div className={`${tileStyle(cell)} ${isCursor ? "ring-4 ring-white scale-110 z-10" : ""} ${isSelected ? "border-2 border-white" : ""}`} />
              </div>
            );
          })
        )}
      </div>

      <div className="mt-3 text-xs text-gray-400">
        Hướng dẫn: Dùng phím di chuyển để chọn ô. ENTER chọn/hoán đổi. BACK để thoát và ghi điểm.
      </div>
    </div>
  );
});

export default Match3Game;