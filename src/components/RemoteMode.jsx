export default function RemoteMode() {
  const sendCommand = (cmd) => {
    console.log(cmd);

    // aquí luego irá el ESP32
  };

  return (
    <>
      <h2>🎮 Control Remoto</h2>

      <div className="remote-pad">

        <button
          onClick={() =>
            sendCommand("UP")
          }
        >
          ⬆️
        </button>

        <div className="middle-row">

          <button
            onClick={() =>
              sendCommand("LEFT")
            }
          >
            ⬅️
          </button>

          <button
            onClick={() =>
              sendCommand("RIGHT")
            }
          >
            ➡️
          </button>

        </div>

        <button
          onClick={() =>
            sendCommand("DOWN")
          }
        >
          ⬇️
        </button>

      </div>
    </>
  );
}