import { useState } from "react";
import "./App.css";

export default function App() {
  const [route, setRoute] = useState([]);

  const addCommand = (cmd) => {
    setRoute([...route, cmd]);
  };

  const clearRoute = () => {
    setRoute([]);
  };

  return (
    <div className="app">
      <div className="background-stars"></div>

      <h1>🐭 MouseBot Explorer 🧀</h1>

      <div className="maze-container">
        <div className="mouse">🐭</div>
        <div className="cheese">🧀</div>
      </div>

      <h2>Modo Programación</h2>

      <div className="buttons">
        <button onClick={() => addCommand("⬆️")}>⬆️</button>
        <button onClick={() => addCommand("↩️")}>↩️</button>
        <button onClick={() => addCommand("↪️")}>↪️</button>
        <button onClick={() => addCommand("⬇️")}>⬇️</button>
      </div>

      <div className="route-box">
        <h3>Ruta Programada</h3>
        <p>{route.length ? route.join(" ") : "Aún no hay movimientos"}</p>
      </div>

      <div className="action-buttons">
        <button className="start-btn">▶ Iniciar</button>
        <button className="clear-btn" onClick={clearRoute}>
          🗑 Borrar
        </button>
      </div>
    </div>
  );
}