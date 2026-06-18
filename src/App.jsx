import { useState } from "react";
import "./App.css";

export default function App() {
  const [mode, setMode] = useState("program");

  const [route, setRoute] = useState([]);

  const [mousePos, setMousePos] = useState({
    x: 40,
    y: 90,
  });

  const cheesePos = {
    x: 550,
    y: 90,
  };

  const addCommand = (cmd) => {
    setRoute((prev) => [...prev, cmd]);
  };

  const clearRoute = () => {
    setRoute([]);
    setMousePos({
      x: 40,
      y: 90,
    });
  };

  const move = (cmd) => {
    setMousePos((prev) => {
      let x = prev.x;
      let y = prev.y;

      const step = 50;

      if (cmd === "UP") y -= step;
      if (cmd === "DOWN") y += step;
      if (cmd === "LEFT") x -= step;
      if (cmd === "RIGHT") x += step;

      x = Math.max(0, Math.min(600, x));
      y = Math.max(0, Math.min(180, y));

      return { x, y };
    });
  };

  const executeRoute = () => {
    route.forEach((cmd, index) => {
      setTimeout(() => {
        move(cmd);
      }, index * 500);
    });
  };

  const remoteMove = (cmd) => {
    move(cmd);
  };

  return (
    <div className="app">
      <h1>🧀 Cheese Chaser</h1>

      <h3>Perseguidor de Queso</h3>

      <div className="wifi-status">
        📶 ESP32 Desconectado
      </div>

      <div className="maze-container">
        <div
          className="mouse"
          style={{
            left: `${mousePos.x}px`,
            top: `${mousePos.y}px`,
          }}
        >
          🐭
        </div>

        <div
          className="cheese"
          style={{
            left: `${cheesePos.x}px`,
            top: `${cheesePos.y}px`,
          }}
        >
          🧀
        </div>
      </div>

      <div className="mode-selector">
        <button onClick={() => setMode("program")}>
          🧩 Programación
        </button>

        <button onClick={() => setMode("remote")}>
          🎮 Remoto
        </button>
      </div>

      {mode === "program" ? (
        <>
          <h2>🧩 Modo Programación</h2>

          <div className="buttons">
            <button onClick={() => addCommand("UP")}>
              ⬆️
            </button>

            <button onClick={() => addCommand("LEFT")}>
              ⬅️
            </button>

            <button onClick={() => addCommand("RIGHT")}>
              ➡️
            </button>

            <button onClick={() => addCommand("DOWN")}>
              ⬇️
            </button>
          </div>

          <div className="route-box">
            <h3>Ruta Programada</h3>

            <p>
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
            </p>
          </div>

          <div className="action-buttons">
            <button
              className="start-btn"
              onClick={executeRoute}
            >
              ▶ Ejecutar
            </button>

            <button
              className="clear-btn"
              onClick={clearRoute}
            >
              🗑 Limpiar
            </button>
          </div>
        </>
      ) : (
        <>
          <h2>🎮 Control Remoto</h2>

          <div className="remote-pad">
            <button
              onClick={() =>
                remoteMove("UP")
              }
            >
              ⬆️
            </button>

            <div className="middle-row">
              <button
                onClick={() =>
                  remoteMove("LEFT")
                }
              >
                ⬅️
              </button>

              <button
                onClick={() =>
                  remoteMove("RIGHT")
                }
              >
                ➡️
              </button>
            </div>

            <button
              onClick={() =>
                remoteMove("DOWN")
              }
            >
              ⬇️
            </button>
          </div>
        </>
      )}
    </div>
  );
}