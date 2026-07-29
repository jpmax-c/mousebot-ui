import { useState, useEffect, useRef } from "react";
import "./App.css";

const SIZE = 5;

export default function App() {
  const [mode, setMode] = useState("program");
  const [editTool, setEditTool] = useState("wall");

  // Dirección IP o mDNS por defecto del ESP32
  const [robotIp, setRobotIp] = useState("192.168.100.94");
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);

  const [route, setRoute] = useState([]);
  const [previewRoute, setPreviewRoute] = useState([]);
  const [isExecuting, setIsExecuting] = useState(false);

  const [mouse, setMouse] = useState({ row: 0, col: 0 });
  const [cheese, setCheese] = useState({ row: 4, col: 4 });
  const [walls, setWalls] = useState([]);
  const [message, setMessage] = useState("");

  // ---------------- CONEXIÓN WEBSOCKET ----------------
  const connectWebSocket = (targetIp) => {
    if (socketRef.current) {
      socketRef.current.close();
    }

    // Formatear dirección limpia sin http:// ni slashes
    const cleanIp = targetIp.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    const wsUrl = `ws://${cleanIp}:81`;

    console.log("Intentando conectar a:", wsUrl);
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      console.log("¡Conectado exitosamente por WebSocket!");
      setIsConnected(true);
    };

    socket.onclose = () => {
      console.log("WebSocket desconectado");
      setIsConnected(false);
    };

    socket.onerror = (err) => {
      console.error("Error en WebSocket:", err);
      setIsConnected(false);
    };
  };

  useEffect(() => {
    connectWebSocket(robotIp);

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  // Función para enviar órdenes en tiempo real por WebSocket
  const sendToESP32 = (cmd) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(cmd);
      console.log("Enviado a ESP32:", cmd);
    } else {
      console.warn("WebSocket no está listo para enviar:", cmd);
    }
  };

  // ---------------- LÓGICA DEL TABLERO Y JUEGO ----------------
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
    sendToESP32("RESET");
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

  // MODO PROGRAMACIÓN: Sincronización Paso a Paso con los motores
  const executeRoute = async () => {
    if (isExecuting || route.length === 0) return;
    setIsExecuting(true);
    setMessage("");

    let currentPos = { ...mouse };

    for (let i = 0; i < route.length; i++) {
      const cmd = route[i];

      // Envío de la orden al robot
      sendToESP32(cmd);

      await new Promise((resolve) => setTimeout(resolve, 800));
      currentPos = moveMouseStep(cmd, currentPos);
      setMouse(currentPos);
    }

    setPreviewRoute([]);
    setIsExecuting(false);
  };

  // MODO REMOTO: Movimiento Instantáneo
  const handleRemoteMove = (cmd) => {
    setMouse((prev) => moveMouseStep(cmd, prev));
    sendToESP32(cmd);
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

      {/* --- BARRA SUPERIOR CON ESTADO Y CONTROL DE IP --- */}
      <div className="top-controls" style={{ display: "flex", gap: "10px", alignItems: "center", justifyContent: "center", marginBottom: "15px" }}>
        <div className={`wifi-status ${isConnected ? "online" : "offline"}`}>
          {isConnected ? "🟢 WebSocket Listo" : "🔴 ESP32 Buscando..."}
        </div>

        <input
          type="text"
          value={robotIp}
          onChange={(e) => setRobotIp(e.target.value)}
          placeholder="IP o mousebot.local"
          style={{
            padding: "5px 8px",
            borderRadius: "8px",
            border: "1px solid #ccc",
            fontSize: "0.85rem",
            width: "150px",
            textAlign: "center"
          }}
        />

        <button
          onClick={() => connectWebSocket(robotIp)}
          style={{
            padding: "5px 10px",
            borderRadius: "8px",
            border: "none",
            backgroundColor: "#4A90E2",
            color: "#fff",
            cursor: "pointer",
            fontSize: "0.85rem"
          }}
        >
          Reconectar
        </button>

        <div className="edit-tools-dropdown">
          <label htmlFor="tool-select">Herramienta: </label>
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

      {/* --- TABLERO --- */}
      <div className="main-layout">
        <div className="maze-grid">
          {Array.from({ length: SIZE }).map((_, row) =>
            Array.from({ length: SIZE }).map((_, col) => createCell(row, col))
          )}
        </div>
      </div>

      {/* --- MODAL DE VICTORIA --- */}
      {message && (
        <div className="modal-overlay" onClick={() => setMessage("")}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>¡Victoria! 🏆</h2>
            <p>{message}</p>
            <button className="close-modal-btn" onClick={resetGame}>
              Continuar 🎮
            </button>
          </div>
        </div>
      )}

      {/* --- SELECTOR DE MODO (PROGRAMACIÓN / REMOTO) --- */}
      <div className="mode-selector">
        <button 
          className={mode === "program" ? "active" : ""}
          onClick={() => setMode("program")} 
          disabled={isExecuting}
        >
          🧩 Programación
        </button>
        <button 
          className={mode === "remote" ? "active" : ""}
          onClick={() => setMode("remote")} 
          disabled={isExecuting}
        >
          🎮 Remoto
        </button>
      </div>

      {/* --- INTERFAZ SEGÚN MODO SELECCIONADO --- */}
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
            <button onClick={() => handleRemoteMove("UP")}>⬆️</button>
            <div className="middle-row">
              <button onClick={() => handleRemoteMove("LEFT")}>⬅️</button>
              <button onClick={() => handleRemoteMove("RIGHT")}>➡️</button>
            </div>
            <button onClick={() => handleRemoteMove("DOWN")}>⬇️</button>
          </div>
          <button className="reset-btn" onClick={resetGame} style={{ marginTop: "15px" }}>
            🔄 Reiniciar Tablero
          </button>
        </>
      )}
    </div>
  );
}
