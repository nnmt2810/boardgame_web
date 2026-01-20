import { useState, useRef, useEffect, useContext } from "react";
import Controller from "../components/Controller";
import Caro5Game from "../components/games/Caro5Game";
import Caro4Game from "../components/games/Caro4Game";
import SnakeGame from "../components/games/SnakeGame";
import TicTacToeGame from "../components/games/TicTacToeGame";
import MemoryGame from "../components/games/MemoryGame";
import Match3Game from "../components/games/Match3Game";
import DrawingGame from "../components/games/DrawingGame";
import SaveLoadModal from "../components/SaveLoadModal";
import { HelpCircle } from "lucide-react";
import { AuthContext } from "../contexts/AuthContext";
import { saveToLocal, loadFromLocal, deleteLocal } from "../utils/localSaves";
import LeaderboardPanel from "../components/LeaderboardPanel";

const ROWS = 15;
const COLS = 15;

const GAMES_LIST = [
  {
    id: "caro5",
    name: "CARO HÀNG 5",
    color: "bg-blue-500",
    pos: [3, 3],
    hint: "Xếp đủ 5 quân cờ cùng hàng (ngang, dọc, chéo) để thắng. AI sẽ chặn bạn rất kỹ đấy!",
  },
  {
    id: "caro4",
    name: "CARO HÀNG 4",
    color: "bg-cyan-500",
    pos: [3, 7],
    hint: "Xếp đủ 4 quân cờ cùng hàng (ngang, dọc, chéo) để thắng. AI sẽ chặn bạn rất kỹ đấy!",
  },
  {
    id: "tictactoe",
    name: "TIC-TAC-TOE",
    color: "bg-green-500",
    pos: [3, 11],
    hint: "Trò chơi 3x3 kinh điển. Hãy tạo một hàng ngang, dọc hoặc chéo gồm 3 quân X trước AI. Nếu cả hai cùng đánh đúng, kết quả thường là Hòa!",
  },
  {
    id: "snake",
    name: "RẮN SĂN MỒI",
    color: "bg-red-500",
    pos: [7, 3],
    hint: "Dùng các nút điều hướng để ăn mồi. Đâm vào tường hoặc thân mình sẽ thua. Điểm cao nhất sẽ được lưu!",
  },
  {
    id: "memory",
    name: "CỜ TRÍ NHỚ",
    color: "bg-yellow-500",
    pos: [7, 7],
    hint: "Lật các thẻ bài để tìm cặp hình giống nhau. Bạn cần ghi nhớ vị trí các thẻ đã lật. Trò chơi kết thúc khi bạn tìm được tất cả các cặp bài trùng khớp!",
  },
  {
    id: "match3",
    name: "GHÉP HÀNG 3",
    color: "bg-pink-500",
    pos: [7, 11],
    hint: "Ghép thành hàng 3 trở lên để ghi điểm. ENTER để chọn/hoán đổi ô kề nhau. BACK để thoát và ghi điểm.",
  },
  {
    id: "drawing",
    name: "BẢNG VẼ",
    color: "bg-gray-500",
    pos: [11, 7],
    hint: "Bảng vẽ tự do: vẽ, undo, clear và lưu bản vẽ của bạn. Không tính điểm.",
  },
];

const MainGame = () => {
  const { user } = useContext(AuthContext);
  const userId = user?.id;
  const [cursor, setCursor] = useState([3, 3]);
  const [view, setView] = useState("MENU");
  const [selectedGame, setSelectedGame] = useState(null);
  const [winner, setWinner] = useState(null);
  const [showHint, setShowHint] = useState(false);
  const gameRef = useRef(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [savedSession, setSavedSession] = useState(null);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [loadedFromSession, setLoadedFromSession] = useState(false);

  // Thông báo tạm thời khi game bị đóng bảo trì
  const [maintenanceNotice, setMaintenanceNotice] = useState(null);

  const handleWinUpdate = async (gameId, result) => {
    setWinner(result);
    if (result && loadedFromSession && selectedGame) {
      deleteLocal(userId, selectedGame.id);
      setSavedSession(null);
      setLoadedFromSession(false);
      console.log("Deleted local saved session for", selectedGame.id);
    }
  };

  const resetGame = () => {
    setWinner(null);
  };

  const handleCommand = (cmd) => {
    if (cmd === "HINT") {
      setShowHint((prev) => !prev);
      return;
    }
    if (showHint) {
      if (cmd === "BACK") setShowHint(false);
      return;
    }
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
        case "ENTER":
          const game = GAMES_LIST.find((g) => g.pos[0] === r && g.pos[1] === c);
          if (game) selectGameWithLoadCheck(game);
          break;
      }
      setCursor([r, c]);
    } else if (view === "IN_GAME") {
      // Nếu game đang đóng bảo trì thì chặn mọi lệnh điều khiển
      if (selectedGame && selectedGame.is_active === false) {
        setMaintenanceNotice(`"${selectedGame.name}" đang được đóng để bảo trì. Không thể chơi hiện tại.`);
        setTimeout(() => setMaintenanceNotice(null), 4000);
        return;
      }

      if (cmd === "BACK") {
        setView("MENU");
        setSelectedGame(null);
        resetGame();
        setSavedSession(null);
        setLoadedFromSession(false);
      } else if (gameRef.current) {
        if (typeof gameRef.current.handleCommand === "function") {
          gameRef.current.handleCommand(cmd);
        }
      }
    }
  };

  // Khi chọn game: nếu đã có session lưu local => hỏi load; nếu game disabled => show notice & không vào IN_GAME
  const selectGameWithLoadCheck = (game) => {
    // Nếu game bị đóng (is_active === false) -> không cho vào chế độ chơi, show thông báo
    if (game && game.is_active === false) {
      setSelectedGame(game);
      setView("MENU");
      setMaintenanceNotice(`"${game.name}" đang được đóng để bảo trì.`);
      setTimeout(() => setMaintenanceNotice(null), 4000);
      return;
    }

    const local = loadFromLocal(userId, game.id);
    if (local) {
      setSavedSession(local);
      setSelectedGame(game);
      setShowLoadModal(true);
      return;
    }
    setSelectedGame(game);
    setView("IN_GAME");
    resetGame();
  };

  const renderButton = (r, c) => {
    const isCursor = cursor[0] === r && cursor[1] === c;
    const gameTarget = GAMES_LIST.find((g) => g.pos[0] === r && g.pos[1] === c);
    // Nếu gameTarget có is_active === false thì hiển thị kiểu disabled
    let colorClass = gameTarget
      ? gameTarget.is_active === false
        ? "bg-gray-600" // màu tối cho disabled
        : gameTarget.color
      : "bg-gray-800";

    return (
      <div
        key={`${r}-${c}`}
        className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full transition-all duration-150 flex items-center justify-center ${colorClass} ${
          isCursor
            ? "ring-4 ring-white scale-125 z-10 shadow-lg shadow-white/50"
            : "opacity-60"
        }`}
      >
        {isCursor && (
          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
        )}
        {/* Nếu là ô game và game disabled */}
        {gameTarget && gameTarget.is_active === false && (
          <div className="absolute text-[9px] text-white font-bold mt-6">{/* reserved for badge if needed */}</div>
        )}
      </div>
    );
  };

  const hoverGame = GAMES_LIST.find(
    (g) => g.pos[0] === cursor[0] && g.pos[1] === cursor[1],
  );

  const saveIfNeeded = async () => {
    if (!selectedGame) return;
    if (!gameRef.current || typeof gameRef.current.getState !== "function")
      return;
    // Nếu game đang bị disable, không cho save (không cần)
    if (selectedGame && selectedGame.is_active === false) {
      setMaintenanceNotice(`"${selectedGame.name}" đang được đóng để bảo trì. Không thể lưu.`);
      setTimeout(() => setMaintenanceNotice(null), 3000);
      return;
    }
    try {
      const state = await gameRef.current.getState();
      if (winner) return;
      setSaving(true);
      const session = {
        matrix_state: state.matrix_state,
        current_score: state.current_score ?? 0,
        time_elapsed: state.time_elapsed ?? 0,
        created_at: Date.now(),
      };
      const ok = saveToLocal(userId, selectedGame.id, session);
      if (ok) {
        setSavedSession(session);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 1400);
      }
    } catch (err) {
      console.error("Error saving game to localStorage:", err);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (
      view === "IN_GAME" &&
      savedSession &&
      gameRef.current &&
      typeof gameRef.current.loadState === "function"
    ) {
      try {
        gameRef.current.loadState(savedSession);
      } catch (err) {
        console.error("Error calling loadState on game component:", err);
      }
    }
  }, [view, savedSession]);

  const handleLoadFromModal = () => {
    if (savedSession) setLoadedFromSession(true);
    setShowLoadModal(false);
    setView("IN_GAME");
  };

  const handleNewFromModal = () => {
    setShowLoadModal(false);
    setSavedSession(null);
    setLoadedFromSession(false);
    setView("IN_GAME");
    resetGame();
  };

  // Khi render game area, nếu selectedGame.is_active === false thì hiển thị thông báo bảo trì thay vì mount component
  const renderGameArea = () => {
    if (!selectedGame) return null;

    if (selectedGame.is_active === false) {
      return (
        <div className="p-6 bg-yellow-50 rounded-lg border border-yellow-200 text-yellow-900">
          <p className="font-semibold">Game: {selectedGame.name}</p>
          <p className="mt-2">Trò chơi hiện đang đóng để bảo trì. Vui lòng thử lại sau.</p>
        </div>
      );
    }

    return (
      <>
        {selectedGame?.id === "caro5" && (
          <Caro5Game
            ref={gameRef}
            onWinnerChange={(res) => handleWinUpdate("caro5", res)}
            onCursorChange={setCursor}
          />
        )}
        {selectedGame?.id === "caro4" && (
          <Caro4Game
            ref={gameRef}
            onWinnerChange={(res) => handleWinUpdate("caro4", res)}
            onCursorChange={setCursor}
          />
        )}
        {selectedGame?.id === "snake" && (
          <SnakeGame
            ref={gameRef}
            onWinnerChange={(res) => handleWinUpdate("snake", res)}
            onCursorChange={setCursor}
          />
        )}
        {selectedGame?.id === "tictactoe" && (
          <TicTacToeGame
            ref={gameRef}
            onWinnerChange={(res) => handleWinUpdate("tictactoe", res)}
            onCursorChange={setCursor}
          />
        )}
        {selectedGame?.id === "memory" && (
          <MemoryGame
            ref={gameRef}
            onWinnerChange={(res) => handleWinUpdate("memory", res)}
            onCursorChange={setCursor}
          />
        )}
        {selectedGame?.id === "match3" && (
          <Match3Game
            ref={gameRef}
            onWinnerChange={(res) => handleWinUpdate("match3", res)}
            onCursorChange={setCursor}
          />
        )}
        {selectedGame?.id === "drawing" && (
          <DrawingGame
            ref={gameRef}
            onWinnerChange={(res) => handleWinUpdate("drawing", res)}
            onCursorChange={setCursor}
          />
        )}
      </>
    );
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-64px)] bg-gray-50/50">
      <div className="flex flex-col md:flex-row items-center md:items-start justify-center gap-12 p-6">
        <div className="flex flex-col items-center relative">
          <div className="relative bg-black p-4 rounded-3xl border-12 border-gray-800 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden">
            {view === "MENU" ? (
              <div
                className="grid gap-1.5"
                style={{
                  gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`,
                }}
              >
                {Array.from({ length: ROWS }).map((_, r) =>
                  Array.from({ length: COLS }).map((_, c) =>
                    renderButton(r, c),
                  ),
                )}
              </div>
            ) : (
              <div className="relative">
                {renderGameArea()}
              </div>
            )}

            {showHint && (
              <div className="absolute inset-0 bg-black/90 z-50 flex items-center justify-center p-6 animate-in fade-in zoom-in duration-200">
                <div className="bg-gray-900 border-2 border-yellow-500 p-6 rounded-2xl max-w-70 shadow-[0_0_30px_rgba(234,179,8,0.3)]">
                  <div className="flex items-center gap-2 mb-4">
                    <HelpCircle className="text-yellow-500" size={24} />
                    <h3 className="text-yellow-500 font-black text-lg uppercase tracking-tighter">
                      {view === "MENU"
                        ? hoverGame
                          ? hoverGame.name
                          : "Hệ thống"
                        : selectedGame?.name}
                    </h3>
                  </div>

                  <p className="text-gray-300 text-xs leading-relaxed mb-6 italic">
                    {view === "MENU"
                      ? hoverGame
                        ? hoverGame.hint
                        : "Sử dụng phím điều hướng để chọn game, nhấn ENTER để chơi."
                      : selectedGame?.hint}
                  </p>

                  <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                    <p className="text-[10px] text-yellow-500/50 font-bold uppercase mb-1">
                      Mục tiêu thắng
                    </p>
                    <p className="text-white text-[11px] font-medium">
                      {view === "MENU"
                        ? hoverGame
                          ? (hoverGame.id === "snake"
                              ? "Ghi điểm càng cao càng tốt để lưu kỷ lục!"
                              : "Đánh bại AI hoặc hoàn thành thử thách trước!")
                          : "Sử dụng phím điều hướng để chơi."
                        : selectedGame?.hint}
                    </p>
                  </div>

                  <button
                    onClick={() => setShowHint(false)}
                    className="mt-6 w-full py-2 bg-yellow-500 text-black font-black text-[10px] rounded-lg uppercase transition-all active:scale-95"
                  >
                    Đã hiểu (BACK)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col justify-center h-full pt-10 min-w-75">
          <Controller onCommand={handleCommand} />

          <div className="mt-6 w-full bg-gray-900 p-5 rounded-xl border-t-2 border-indigo-500 shadow-xl">
            <div className="flex justify-between items-start text-white">
              <div className="flex-1">
                <p className="text-indigo-400 text-[10px] font-mono mb-1 tracking-widest uppercase">
                  {showHint ? "Viewing_Hint" : "System_Status"}
                </p>
                <h2 className="text-xl font-black uppercase tracking-tighter truncate">
                  {view === "MENU"
                    ? hoverGame?.name || "IDLE MODE"
                    : selectedGame?.name}
                </h2>

                {winner && (
                  <div className="mt-3 py-2 px-3 bg-white/5 rounded-lg border border-white/10">
                    <p className="text-yellow-400 text-sm font-black animate-pulse uppercase flex items-center gap-2">
                      {winner === "LOSE"
                        ? "💀 GAME OVER"
                        : winner === "DRAW"
                          ? "🤝 DRAW GAME!"
                          : "🏆 GAME WIN!"}
                    </p>
                  </div>
                )}
              </div>

              <div className="text-right pl-4">
                <p className="text-gray-500 text-[10px] font-mono uppercase">
                  Location
                </p>
                <p className="font-mono text-sm font-bold text-indigo-300">
                  {cursor[0]}:{cursor[1]}
                </p>

                {view === "IN_GAME" && selectedGame && (
                  <div className="mt-3">
                    <button
                      onClick={() => saveIfNeeded()}
                      disabled={saving || (selectedGame && selectedGame.is_active === false)}
                      className={`px-3 py-2 rounded-lg font-semibold transform transition-all duration-200 inline-flex items-center justify-center gap-2 ${
                        saving
                          ? "bg-yellow-300 text-black scale-95 opacity-90"
                          : saveSuccess
                            ? "bg-green-500 text-white shadow-lg scale-105"
                            : "bg-yellow-400 text-black hover:scale-105 hover:shadow-xl active:scale-95"
                      }`}
                    >
                      {saving && (
                        <span className="w-4 h-4 border-2 border-t-transparent border-black rounded-full animate-spin" />
                      )}
                      {!saving && saveSuccess && (
                        <svg
                          className="w-4 h-4 text-white"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      )}
                      {!saving && !saveSuccess && <span>Save</span>}
                      {!saving && saveSuccess && <span>Saved</span>}
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            {/* Leaderboard */}
            <div className="mt-4">
              <LeaderboardPanel gameId={selectedGame?.id ?? null} compact={true} />
            </div>

          </div>
        </div>
      </div>

      <SaveLoadModal
        isOpen={showLoadModal}
        onClose={() => setShowLoadModal(false)}
        onLoad={handleLoadFromModal}
        onNew={handleNewFromModal}
      />

      {/* Maintenance toast */}
      {maintenanceNotice && (
        <div className="fixed bottom-6 right-6 bg-yellow-100 border border-yellow-300 text-yellow-900 px-4 py-3 rounded shadow">
          {maintenanceNotice}
        </div>
      )}
    </div>
  );
};

export default MainGame;