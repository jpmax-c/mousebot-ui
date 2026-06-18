import { useState } from "react";
import "./App.css";

const SIZE = 6;

export default function App() {
  const [mode, setMode] = useState("program");

  const [route, setRoute] = useState([]);

  const [mouse, setMouse] = useState({
    row: 0,
    col: 0,
  });

  const [cheese, setCheese] = useState({
    row: 4,
    col: 5,
  });

  const [message, setMessage] = useState("");

  const addCommand = (cmd) => {
    setRoute((prev) => [...prev, cmd]);
  };

  const clearRoute = () => {
  setRoute([]);
  setMessage("");
  };

  const resetGame = () => {
  setRoute([]);

  setMouse({
    row: 0,
    col: 0,
  });

  setCheese({
    row: 4,
    col: 5,
  });

  setMessage("");
  };

  const checkWin = (newRow, newCol) => {

  if (
    newRow === cheese.row &&
    newCol === cheese.col
  ) {
    setMessage(
      "🎉 ¡Felicidades! El ratoncito encontró el queso 🧀"
    );
  } else {
    setMessage("");
  }

  };

  const moveMouse = (cmd) => {
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
      }, index * 500);
    });
  };

  const createCell = (row, col) => {
    const isMouse =
      mouse.row === row &&
      mouse.col === col;

    const isCheese =
      cheese.row === row &&
      cheese.col === col;

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
      </div>
    );
  };

  return (
    <div className="app">

      <h1>🧀 Cheese Chaser</h1>

      <h3>Perseguidor de Queso</h3>

      <div className="wifi-status">
        📶 ESP32 Desconectado
      </div>

      <div className="maze-grid">
        {Array.from({ length: SIZE }).map(
          (_, row) =>
            Array.from({
              length: SIZE,
            }).map((_, col) =>
              createCell(row, col)
            )
        )}
      </div>

      {message && (
        <div className="victory">
          {message}
        </div>
      )}

      <div className="mode-selector">
        <button
          onClick={() =>
            setMode("program")
          }
        >
          🧩 Programación
        </button>

        <button
          onClick={() =>
            setMode("remote")
          }
        >
          🎮 Remoto
        </button>
      </div>

      {mode === "program" ? (
        <>
          <h2>🧩 Modo Programación</h2>

          <div className="buttons">
            <button
              onClick={() =>
                addCommand("UP")
              }
            >
              ⬆️
            </button>

            <button
              onClick={() =>
                addCommand("LEFT")
              }
            >
              ⬅️
            </button>

            <button
              onClick={() =>
                addCommand("RIGHT")
              }
            >
              ➡️
            </button>

            <button
              onClick={() =>
                addCommand("DOWN")
              }
            >
              ⬇️
            </button>
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
            🗑 Limpiar Ruta
          </button>

          <button
            className="reset-btn"
            onClick={resetGame}
          >
            🔄 Reiniciar Juego
          </button>
        </div>
        </>
      ) : (
        <>
          <h2>🎮 Control Remoto</h2>

          <div className="remote-pad">

            <button
              onClick={() =>
                moveMouse("UP")
              }
            >
              ⬆️
            </button>

            <div className="middle-row">

              <button
                onClick={() =>
                  moveMouse("LEFT")
                }
              >
                ⬅️
              </button>

              <button
                onClick={() =>
                  moveMouse("RIGHT")
                }
              >
                ➡️
              </button>

            </div>

            <button
              onClick={() =>
                moveMouse("DOWN")
              }
            >
              ⬇️
            </button>

          </div>
          
          <button
            className="reset-btn"
            onClick={resetGame}
          >
            🔄 Reiniciar Juego
          </button>
        </>
      )}
    </div>
  );
}