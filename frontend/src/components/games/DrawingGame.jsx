import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef, useContext } from "react";
import { AuthContext } from "../../contexts/AuthContext";
import axiosClient from "../../api/axiosClient";

const CANVAS_W = 480;
const CANVAS_H = 360;

const DrawingGame = forwardRef(({ onWinnerChange, onCursorChange }, ref) => {
  const { user } = useContext(AuthContext);
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const drawingRef = useRef(false);
  const [color, setColor] = useState("#ffffff");
  const [brush, setBrush] = useState(6);
  const [history, setHistory] = useState([]); // store dataURLs for undo
  const [hasReported, setHasReported] = useState(false); // not used here but kept for parity

  useEffect(() => {
    const cvs = canvasRef.current;
    cvs.width = CANVAS_W;
    cvs.height = CANVAS_H;
    const ctx = cvs.getContext("2d");
    ctx.fillStyle = "#0f172a"; // dark background
    ctx.fillRect(0,0,cvs.width,cvs.height);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctxRef.current = ctx;
    // capture initial state
    pushHistory();
  }, []);

  const pushHistory = () => {
    try {
      const data = canvasRef.current.toDataURL();
      setHistory(prev => {
        const next = [...prev, data].slice(-20); // limit history to 20
        return next;
      });
    } catch (e) {
      console.warn("pushHistory failed", e);
    }
  };

  const startDrawing = (e) => {
    drawingRef.current = true;
    const pos = getPos(e);
    const ctx = ctxRef.current;
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = brush;
  };

  const draw = (e) => {
    if (!drawingRef.current) return;
    const pos = getPos(e);
    const ctx = ctxRef.current;
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    try { ctxRef.current.closePath(); } catch (e) {}
    pushHistory();
  };

  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const clearCanvas = () => {
    const ctx = ctxRef.current;
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0,0,canvasRef.current.width, canvasRef.current.height);
    pushHistory();
  };

  const undo = () => {
    if (history.length <= 1) return;
    // remove last state and draw previous
    setHistory(prev => {
      const next = prev.slice(0, prev.length - 1);
      const last = next[next.length - 1];
      const img = new Image();
      img.onload = () => {
        ctxRef.current.drawImage(img, 0, 0);
      };
      img.src = last;
      return next;
    });
  };

  // Expose methods
  useImperativeHandle(ref, () => ({
    handleCommand: (cmd) => {
      // Support some simple commands
      if (cmd === "CLEAR") {
        clearCanvas();
      } else if (cmd === "UNDO") {
        undo();
      } else if (cmd === "BACK") {
        // nothing special — parent will handle navigation
      } else if (cmd === "COLOR_R") {
        setColor("#ef4444");
      } else if (cmd === "COLOR_G") {
        setColor("#10b981");
      } else if (cmd === "COLOR_W") {
        setColor("#ffffff");
      }
    },
    getState: async () => {
      // return dataURL as matrix_state
      const dataUrl = canvasRef.current.toDataURL();
      return {
        matrix_state: { dataUrl },
        current_score: 0,
        time_elapsed: 0
      };
    },
    loadState: (session) => {
      try {
        const parsed = typeof session.matrix_state === "string" ? JSON.parse(session.matrix_state) : session.matrix_state;
        if (parsed?.dataUrl) {
          const img = new Image();
          img.onload = () => {
            ctxRef.current.drawImage(img, 0, 0);
            pushHistory();
          };
          img.src = parsed.dataUrl;
        }
      } catch (err) {
        console.error("Lỗi loadState DrawingBoard:", err);
      }
    }
  }), [color, brush, history]);

  return (
    <div className="p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="font-bold text-sm">Bảng vẽ tự do</div>
        <div className="text-xs text-gray-300 font-mono">Tools</div>
      </div>

      <div className="bg-slate-800 p-3 rounded">
        <canvas
          ref={canvasRef}
          className="block w-full border border-slate-700 rounded"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          style={{ touchAction: "none", width: "100%", height: "auto", maxWidth: CANVAS_W }}
        />

        <div className="mt-3 flex items-center gap-3">
          <div className="flex items-center gap-1">
            <button onClick={() => setColor("#ffffff")} className="w-6 h-6 rounded" style={{ background: "#ffffff" }} />
            <button onClick={() => setColor("#ef4444")} className="w-6 h-6 rounded" style={{ background: "#ef4444" }} />
            <button onClick={() => setColor("#10b981")} className="w-6 h-6 rounded" style={{ background: "#10b981" }} />
            <button onClick={() => setColor("#f59e0b")} className="w-6 h-6 rounded" style={{ background: "#f59e0b" }} />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-300">Brush</label>
            <input type="range" min="1" max="30" value={brush} onChange={(e) => setBrush(Number(e.target.value))} />
            <div className="text-xs text-gray-300 w-8 text-right">{brush}</div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button onClick={undo} className="px-2 py-1 bg-gray-700 rounded text-xs">Undo</button>
            <button onClick={clearCanvas} className="px-2 py-1 bg-red-600 rounded text-xs">Clear</button>
          </div>
        </div>
      </div>

      <div className="mt-2 text-xs text-gray-400">
        Vẽ bằng chuột hoặc chạm. Dùng phím UNDO/CLEAR từ menu để thao tác nhanh.
      </div>
    </div>
  );
});

export default DrawingGame;