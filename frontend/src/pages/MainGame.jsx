import { useState, useRef } from "react";
import Controller from "../components/Controller";
import Caro5Game from "../components/games/Caro5Game";

const ROWS = 15;
const COLS = 15;

const GAMES_LIST = [
  { id: "caro5", name: "CARO HÀNG 5", color: "bg-blue-500", pos: [3, 3] },
  { id: "caro4", name: "CARO HÀNG 4", color: "bg-cyan-500", pos: [3, 7] },
  { id: "tictactoe", name: "TIC-TAC-TOE", color: "bg-green-500", pos: [3, 11] },
  { id: "snake", name: "RẮN SĂN MỒI", color: "bg-red-500", pos: [7, 3] },
  { id: "memory", name: "CỜ TRÍ NHỚ", color: "bg-yellow-500", pos: [7, 7] },
  { id: "draw", name: "BẢNG VẼ", color: "bg-purple-500", pos: [7, 11] },
];

const MainGame = () => {
  const [cursor, setCursor] = useState([3, 3]);
  const [view, setView] = useState("MENU");
  const [selectedGame, setSelectedGame] = useState(null);
  const [winner, setWinner] = useState(null);
  const caroRef = useRef(null); // Ref cho CaroGame

  // Hàm reset game
  const resetGame = () => {
    setWinner(null);
  };

  // Hàm điều khiển lệnh từ Controller
  const handleCommand = (cmd) => {
    if (view === "MENU") {
      let [r, c] = cursor;
      switch (cmd) {
        case "UP":
          if (r > 0) r--;
          break;
        case "DOWN":
          if (r < ROWS - 1) r++;
          break;
        case "LEFT":
          if (c > 0) c--;
          break;
        case "RIGHT":
          if (c < COLS - 1) c++;
          break;
        case "BACK":
          break;
        case "ENTER":
          const game = GAMES_LIST.find((g) => g.pos[0] === r && g.pos[1] === c);
          if (game) {
            setSelectedGame(game);
            setView("IN_GAME");
            resetGame();
          }
          break;
        default:
          break;
      }
      setCursor([r, c]);
    } else if (view === "IN_GAME") {
      if (cmd === "BACK") {
        setView("MENU");
        setSelectedGame(null);
        resetGame();
      } else {
        if (selectedGame?.id === "caro5" && caroRef.current) {
          caroRef.current.handleCommand(cmd);
        }
      }
    }
  };

  // Render button cho menu
  const renderButton = (r, c) => {
    const isCursor = cursor[0] === r && cursor[1] === c;
    let colorClass = "bg-gray-800";
    const gameTarget = GAMES_LIST.find((g) => g.pos[0] === r && g.pos[1] === c);
    if (gameTarget) colorClass = gameTarget.color;

    return (
      <div
        key={`${r}-${c}`}
        className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full transition-all duration-150 flex items-center justify-center
          ${colorClass} 
          ${
            isCursor
              ? "ring-4 ring-white scale-125 z-10 shadow-lg shadow-white/50"
              : "opacity-60"
          }
        `}
      >
        {isCursor && (
          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col md:flex-row items-center md:items-start justify-center gap-12 p-6 min-h-[calc(100vh-64px)]">
      <div className="flex flex-col items-center">
        {view === "MENU" ? (
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
        ) : selectedGame?.id === "caro5" ? (
          <Caro5Game
            ref={caroRef}
            onWinnerChange={setWinner}
            onCursorChange={setCursor}
          />
        ) : null}
      </div>

      <div className="flex flex-col justify-center h-full pt-10">
        <div className="relative">
          <Controller onCommand={handleCommand} />
        </div>
        <div className="mt-6 w-full bg-gray-900 p-4 rounded-xl border-t-2 border-indigo-500 shadow-lg">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-indigo-500 text-[10px] font-mono leading-none mb-1">
                SYSTEM_STATUS
              </p>
              <h2 className="text-xl font-black text-white uppercase tracking-tighter">
                {view === "MENU"
                  ? GAMES_LIST.find(
                      (g) => g.pos[0] === cursor[0] && g.pos[1] === cursor[1]
                    )?.name || "SELECT GAME"
                  : selectedGame?.name}
              </h2>
              {winner && (
                <p className="text-yellow-400 text-sm mt-2">
                  Winner: {winner === "X" ? "You" : "AI"}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-gray-500 text-[10px] font-mono">COORD</p>
              <p className="text-white font-mono text-sm">
                {cursor[0]},{cursor[1]}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainGame;
