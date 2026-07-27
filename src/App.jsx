import { useState } from "react";
import "./App.css";

const SIZE = 5;

export default function App() {
  const [mode, setMode] = useState("program");
  const [editTool, setEditTool] = useState("wall");

  const [route, setRoute] = useState([]);
  const [previewRoute, setPreviewRoute] = useState([]);
  const [isExecuting, setIsExecuting] = useState(false);

  const [mouse, setMouse] = useState({ row: 0, col: 0 });
  const [cheese, setCheese] = useState({ row: 4, col: 4 });
  const [walls, setWalls] = useState([]);
  const [message, setMessage] = useState("");

  const isWall = (r, c) => walls.some((w) => w.row === r && w.col === c);

  const isValidMove = (r, c) => {
    if (r < 0 || r >= SIZE || c < 0 || c >= SIZE) return false;
    if (isWall(r, c)) return false;
    return true;
  };

  const buildPreviewRoute = (routeToBuild, currentMouse = mouse) => {
    let row = currentMouse.row;
    let col = currentMouse.col;
    const preview = [];

    routeToBuild.forEach((cmd) => {
      let nextRow = row;
      let nextCol = col;

      if (cmd === "UP") nextRow--;
      if (cmd === "DOWN") nextRow++;
      if (cmd === "LEFT") nextCol--;
      if (cmd === "RIGHT") nextCol++;

      if (isValidMove(nextRow, nextCol)) {
        row = nextRow;
        col = nextCol;
      }
      preview.push({ row, col });
    });

    return preview;
  };

  const addCommand = (cmd) => {
    if (isExecuting) return;
    const newRoute = [...route, cmd];
    setRoute(newRoute);
    setPreviewRoute(buildPreviewRoute(newRoute));
  };

  const clearRoute = () => {
    if (isExecuting) return;
    setRoute([]);
    setPreviewRoute([]);
    setMessage("");
  };

  const undoCommand = () => {
    if (isExecuting) return;
    const newRoute = route.slice(0, -1);
    setRoute(newRoute);
    setPreviewRoute(buildPreviewRoute(newRoute));
  };

  const resetGame = () => {
    if (isExecuting) return;
    setRoute([]);
    setPreviewRoute([]);
    setMouse({ row: 0, col: 0 });
    setCheese({ row: 4, col: 4 });
    setWalls([]);
    setMessage("");
  };

  const moveMouseStep = (cmd, currentMouse) => {
    let nextRow = currentMouse.row;
    let nextCol = currentMouse.col;

    if (cmd === "UP") nextRow--;
    if (cmd === "DOWN") nextRow++;
    if (cmd === "LEFT") nextCol--;
    if (cmd === "RIGHT") nextCol++;

    if (isValidMove(nextRow, nextCol)) {
      if (nextRow === cheese.row && nextCol === cheese.col) {
        setMessage("🎉 ¡Felicidades! El ratoncito encontró el queso 🧀");
      } else {
        setMessage("");
      }
      return { row: nextRow, col: nextCol };
    }

    return currentMouse;
  };

  const executeRoute = async () => {
    if (isExecuting || route.length === 0) return;
    setIsExecuting(true);
    setMessage("");

    let currentPos = { ...mouse };

    for (let i = 0; i < route.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 400));
      currentPos = moveMouseStep(route[i], currentPos);
      setMouse(currentPos);
    }

    setPreviewRoute([]);
    setIsExecuting(false);
  };

  const handleCellClick = (row, col) => {
    if (isExecuting) return;

    if (editTool === "mouse") {
      if (isWall(row, col) || (row === cheese.row && col === cheese.col)) return;
      setMouse({ row, col });
      setRoute([]);
      setPreviewRoute([]);
    } else if (editTool === "cheese") {
      if (isWall(row, col) || (row === mouse.row && col === mouse.col)) return;
      setCheese({ row, col });
    } else if (editTool === "wall") {
      if ((row === mouse.row && col === mouse.col) || (row === cheese.row && col === cheese.col)) {
        return;
      }

      if (isWall(row, col)) {
        setWalls(walls.filter((w) => !(w.row === row && w.col === col)));
      } else {
        setWalls([...walls, { row, col }]);
      }
      setRoute([]);
      setPreviewRoute([]);
    }
  };

  const createCell = (row, col) => {
    const isMouseHere = mouse.row === row && mouse.col === col;
    const isCheeseHere = cheese.row === row && cheese.col === col;
    const isWallHere = isWall(row, col);
    const previewIndex = previewRoute.findIndex((p) => p.row === row && p.col === col);

    let cellClass = "cell";
    if (isWallHere) cellClass += " cell-wall";

    return (
      <div
        key={`${row}-${col}`}
        className={cellClass}
        onClick={() => handleCellClick(row, col)}
      >
        {isMouseHere && "🐭"}
        {!isMouseHere && isCheeseHere && "🧀"}
        {!isMouseHere && !isCheeseHere && isWallHere && "🧱"}
        {!isMouseHere && !isCheeseHere && !isWallHere && previewIndex >= 0 && (
          <span className="preview-step">🐾{previewIndex + 1}</span>
        )}
      </div>
    );
  };

  return (
    <div className="app">
      <header className="header-title">
        <h1>🧀 Cheese Chaser</h1>
        <h3>Perseguidor de Queso</h3>
      </header>

      {/* Barra compacta de controles principales */}
      <div className="top-controls">
        <div className="wifi-status">📶 ESP32 Desconectado</div>

        <div className="edit-tools-dropdown">
          <label htmlFor="tool-select">Herramienta:</label>
          <select
            id="tool-select"
            value={editTool}
            onChange={(e) => setEditTool(e.target.value)}
          >
            <option value="wall">🧱 Pared</option>
            <option value="mouse">🐭 Ratón</option>
            <option value="cheese">🧀 Queso</option>
          </select>
        </div>
      </div>

      <div className="main-layout">
        <div className="maze-grid">
          {Array.from({ length: SIZE }).map((_, row) =>
            Array.from({ length: SIZE }).map((_, col) => createCell(row, col))
          )}
        </div>
      </div>

      {message && (
        <div className="modal-overlay" onClick={() => setMessage("")}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>¡Victoria! 🏆</h2>
            <p>{message}</p>
            <button className="close-modal-btn" onClick={() => setMessage("")}>
              Continuar 🎮
            </button>
          </div>
        </div>
      )}

      <div className="mode-selector">
        <button onClick={() => setMode("program")} disabled={isExecuting}>
          🧩 Programación
        </button>
        <button onClick={() => setMode("remote")} disabled={isExecuting}>
          🎮 Remoto
        </button>
      </div>

      {mode === "program" ? (
        <>
          <h2>🧩 Modo Programación</h2>

          <div className="buttons">
            <button onClick={() => addCommand("UP")}>⬆️</button>
            <button onClick={() => addCommand("LEFT")}>⬅️</button>
            <button onClick={() => addCommand("RIGHT")}>➡️</button>
            <button onClick={() => addCommand("DOWN")}>⬇️</button>
          </div>

          <div className="route-box">
            {route.length === 0
              ? "Sin movimientos"
              : route.map((cmd, i) => (
                  <span key={i}>
                    {cmd === "UP" && "⬆️"}
                    {cmd === "DOWN" && "⬇️"}
                    {cmd === "LEFT" && "⬅️"}
                    {cmd === "RIGHT" && "➡️"}
                  </span>
                ))}
          </div>

          <div className="action-buttons">
            <button className="undo-btn" onClick={undoCommand} disabled={isExecuting}>
              ↩️ Deshacer
            </button>
            <button className="start-btn" onClick={executeRoute} disabled={isExecuting}>
              ▶ {isExecuting ? "Ejecutando..." : "Ejecutar"}
            </button>
            <button className="clear-btn" onClick={clearRoute} disabled={isExecuting}>
              🗑 Limpiar
            </button>
            <button className="reset-btn" onClick={resetGame} disabled={isExecuting}>
              🔄 Reiniciar
            </button>
          </div>
        </>
      ) : (
        <>
          <h2>🎮 Control Remoto</h2>
          <div className="remote-pad">
            <button onClick={() => setMouse((prev) => moveMouseStep("UP", prev))}>⬆️</button>
            <div className="middle-row">
              <button onClick={() => setMouse((prev) => moveMouseStep("LEFT", prev))}>⬅️</button>
              <button onClick={() => setMouse((prev) => moveMouseStep("RIGHT", prev))}>➡️</button>
            </div>
            <button onClick={() => setMouse((prev) => moveMouseStep("DOWN", prev))}>⬇️</button>
          </div>
          <button className="reset-btn" onClick={resetGame}>
            🔄 Reiniciar Tablero
          </button>
        </>
      )}
    </div>
  );
}
