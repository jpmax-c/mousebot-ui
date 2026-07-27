import { useState, useEffect, useRef } from "react";
import "./App.css";

const SIZE = 5;

export default function App() {
  const [mode, setMode] = useState("program");
  const [route, setRoute] = useState([]);
  const [previewRoute, setPreviewRoute] = useState([]);
  const [connected, setConnected] = useState(false);

  // Por defecto usa mousebot.local, pero lo guardamos en localStorage por si acaso
  const [esp32Host, setEsp32Host] = useState(
    localStorage.getItem("esp32_host") || "mousebot.local"
  );

  const ws = useRef(null);

  const [mouse, setMouse] = useState({ row: 0, col: 0 });
  const [cheese, setCheese] = useState({ row: 4, col: 4 });
  const [message, setMessage] = useState("");

  // Conexión WebSocket hacia mousebot.local
  useEffect(() => {
    if (!esp32Host) return;

    localStorage.setItem("esp32_host", esp32Host);

    const connectWS = () => {
      if (ws.current) ws.current.close();

      ws.current = new WebSocket(`ws://${esp32Host}:81/`);

      ws.current.onopen = () => {
        console.log("Conectado exitosamente a la ESP32");
        setConnected(true);
      };

      ws.current.onclose = () => {
        setConnected(false);
      };

      ws.current.onerror = () => {
        setConnected(false);
      };
    };

    connectWS();

    return () => {
      ws.current?.close();
    };
  }, [esp32Host]);

  const sendToESP32 = (cmd) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(cmd);
    }
  };

  const addCommand = (cmd) => {
    const newRoute = [...route, cmd];
    setRoute(newRoute);
    setPreviewRoute(buildPreviewRoute(newRoute));
  };

  const buildPreviewRoute = (routeToBuild) => {
    let row = mouse.row;
    let col = mouse.col;
    const preview = [];

    routeToBuild.forEach((cmd) => {
      if (cmd === "UP" && row > 0) row--;
      if (cmd === "DOWN" && row < SIZE - 1) row++;
      if (cmd === "LEFT" && col > 0) col--;
      if (cmd === "RIGHT" && col < SIZE - 1) col++;
      preview.push({ row, col });
    });

    return preview;
  };

  const clearRoute = () => {
    setRoute([]);
    setPreviewRoute([]);
    setMessage("");
    sendToESP32("STOP");
  };

  const undoCommand = () => {
    const newRoute = route.slice(0, -1);
    setRoute(newRoute);
    setPreviewRoute(buildPreviewRoute(newRoute));
  };

  const resetGame = () => {
    setRoute([]);
    setPreviewRoute([]);
    setMouse({ row: 0, col: 0 });
    setCheese({ row: 4, col: 4 });
    setMessage("");
    sendToESP32("STOP");
  };

  const checkWin = (newRow, newCol) => {
    if (newRow === cheese.row && newCol === cheese.col) {
      setMessage("🎉 ¡Felicidades! El ratoncito encontró el queso 🧀");
    } else {
      setMessage("");
    }
  };

  const moveMouse = (cmd) => {
    sendToESP32(cmd);

    setMouse((prev) => {
      let row = prev.row;
      let col = prev.col;

      if (cmd === "UP" && row > 0) row--;
      if (cmd === "DOWN" && row < SIZE - 1) row++;
      if (cmd === "LEFT" && col > 0) col--;
      if (cmd === "RIGHT" && col < SIZE - 1) col++;

      checkWin(row, col);
      return { row, col };
    });
  };

  const executeRoute = () => {
    setMessage("");

    route.forEach((cmd, index) => {
      setTimeout(() => {
        moveMouse(cmd);
        if (index === route.length - 1) {
          setTimeout(() => sendToESP32("STOP"), 500);
        }
      }, index * 500);
    });
  };

  const createCell = (row, col) => {
    const isMouse = mouse.row === row && mouse.col === col;
    const isCheese = cheese.row === row && cheese.col === col;
    const previewIndex = previewRoute.findIndex(
      (p) => p.row === row && p.col === col
    );

    return (
      <div
        key={`${row}-${col}`}
        className="cell"
        onClick={() => {
          setCheese({ row, col });
          setMessage("");
        }}
      >
        {isMouse && "🐭"}
        {!isMouse && isCheese && "🧀"}
        {!isMouse && !isCheese && previewIndex >= 0 && (
          <span className="preview-step">🐾{previewIndex + 1}</span>
        )}
      </div>
    );
  };

  return (
    <div className="app">
      <h1>🧀 Cheese Chaser</h1>
      <h3>Perseguidor de Queso</h3>

      {/* Host / IP predeterminado: mousebot.local */}
      <div style={{ marginBottom: "15px" }}>
        <label style={{ fontSize: "0.9rem", marginRight: "8px" }}>
          Host ESP32:
        </label>
        <input
          type="text"
          value={esp32Host}
          onChange={(e) => setEsp32Host(e.target.value)}
          placeholder="Ej: mousebot.local"
          style={{
            padding: "6px 12px",
            borderRadius: "8px",
            border: "none",
            fontSize: "0.9rem",
            width: "160px",
            textAlign: "center",
          }}
        />
      </div>

      <div className="wifi-status">
        {connected ? "📶 ESP32 Conectado 🟢" : "📶 ESP32 Desconectado 🔴"}
      </div>

      <div className="maze-grid">
        {Array.from({ length: SIZE }).map((_, row) =>
          Array.from({ length: SIZE }).map((_, col) => createCell(row, col))
        )}
      </div>

      {message && <div className="victory">{message}</div>}

      <div className="mode-selector">
        <button onClick={() => setMode("program")}>🧩 Programación</button>
        <button onClick={() => setMode("remote")}>🎮 Remoto</button>
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
                    {cmd === "UP" && "⬆️ "}
                    {cmd === "DOWN" && "⬇️ "}
                    {cmd === "LEFT" && "⬅️ "}
                    {cmd === "RIGHT" && "➡️ "}
                  </span>
                ))}
          </div>

          <div className="action-buttons">
            <button className="undo-btn" onClick={undoCommand}>
              ↩️ Deshacer
            </button>
            <button className="start-btn" onClick={executeRoute}>
              ▶ Ejecutar
            </button>
            <button className="clear-btn" onClick={clearRoute}>
              🗑 Limpiar Ruta
            </button>
            <button className="reset-btn" onClick={resetGame}>
              🔄 Reiniciar Juego
            </button>
          </div>
        </>
      ) : (
        <>
          <h2>🎮 Control Remoto</h2>

          <div className="remote-pad">
            <button onClick={() => moveMouse("UP")}>⬆️</button>
            <div className="middle-row">
              <button onClick={() => moveMouse("LEFT")}>⬅️</button>
              <button onClick={() => moveMouse("RIGHT")}>➡️</button>
            </div>
            <button onClick={() => moveMouse("DOWN")}>⬇️</button>
          </div>

          <button className="reset-btn" onClick={resetGame}>
            🔄 Reiniciar Juego
          </button>
        </>
      )}
    </div>
  );
}
