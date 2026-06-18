export default function Maze({
  mousePosition,
  cheesePosition,
  setCheesePosition,
}) {
  const rows = 8;
  const cols = 8;

  const cells = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const isMouse =
        mousePosition.row === row &&
        mousePosition.col === col;

      const isCheese =
        cheesePosition.row === row &&
        cheesePosition.col === col;

      cells.push(
        <div
          key={`${row}-${col}`}
          className="cell"
          onClick={() =>
            setCheesePosition({ row, col })
          }
        >
          {isMouse && "🐭"}
          {isCheese && "🧀"}
        </div>
      );
    }
  }

  return (
    <div className="maze-grid">
      {cells}
    </div>
  );
}