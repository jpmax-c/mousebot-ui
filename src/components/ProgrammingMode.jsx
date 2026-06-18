export default function ProgrammingMode({
  route,
  addCommand,
  clearRoute,
  executeRoute,
}) {
  return (
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
          {route.length
            ? route.join(" ")
            : "Aún no hay movimientos"}
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
  );
}