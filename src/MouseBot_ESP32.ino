#include <WiFi.h>
#include <WebServer.h>
#include <WebSocketsServer.h>

// Definición de pines para los LEDs / Motores
const int LED_ADELANTE  = 13;
const int LED_ATRAS     = 27;
const int LED_DERECHA   = 25;
const int LED_IZQUIERDA = 32;

WebServer server(80);
WebSocketsServer webSocket = WebSocketsServer(81);

// Interfaz Web incrustada en la memoria de la ESP32
const char HTML_INTERFACE[] PROGMEM = R"rawliteral(
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MouseBot Controller</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { background: linear-gradient(135deg, #59c3ff, #7b68ee); font-family: Arial, sans-serif; min-height:100vh; color:white; text-align:center; padding:20px; }
    h1 { font-size:2rem; margin-bottom:5px; }
    .status { background: rgba(255,255,255,0.2); display:inline-block; padding:6px 16px; border-radius:20px; margin: 10px 0; font-weight:bold; }
    .grid { display:grid; grid-template-columns: repeat(5, 50px); gap:5px; justify-content:center; margin:15px auto; }
    .cell { width:50px; height:50px; background:white; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:1.5rem; color:black; }
    .controls { margin-top:15px; display:flex; flex-direction:column; align-items:center; gap:10px; }
    .row { display:flex; gap:10px; }
    button { width:65px; height:65px; border:none; border-radius:15px; background:#ffd700; font-size:1.5rem; cursor:pointer; font-weight:bold; box-shadow: 0 4px 10px rgba(0,0,0,0.2); }
    button:active { background:#e6b800; transform:scale(0.95); }
  </style>
</head>
<body>
  <h1>🧀 MouseBot Controller</h1>
  <div id="status" class="status">📶 Conectando...</div>

  <div class="grid" id="grid"></div>

  <div class="controls">
    <button onclick="send('UP')">⬆️</button>
    <div class="row">
      <button onclick="send('LEFT')">⬅️</button>
      <button onclick="send('DOWN')">⬇️</button>
      <button onclick="send('RIGHT')">➡️</button>
    </div>
  </div>

  <script>
    let ws;
    let mRow = 0, mCol = 0;

    function connect() {
      ws = new WebSocket('ws://' + window.location.hostname + ':81/');
      
      ws.onopen = () => {
        document.getElementById('status').innerText = '📶 ESP32 Conectado 🟢';
        document.getElementById('status').style.background = 'rgba(0, 230, 118, 0.4)';
      };

      ws.onclose = () => {
        document.getElementById('status').innerText = '📶 ESP32 Desconectado 🔴';
        document.getElementById('status').style.background = 'rgba(255, 82, 82, 0.4)';
        setTimeout(connect, 2000);
      };
    }

    function send(cmd) {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(cmd);
      }
      move(cmd);
    }

    function move(cmd) {
      if(cmd==='UP' && mRow>0) mRow--;
      if(cmd==='DOWN' && mRow<4) mRow++;
      if(cmd==='LEFT' && mCol>0) mCol--;
      if(cmd==='RIGHT' && mCol<4) mCol++;
      render();
    }

    function render() {
      const grid = document.getElementById('grid');
      grid.innerHTML = '';
      for(let r=0; r<5; r++){
        for(let c=0; c<5; c++){
          const cell = document.createElement('div');
          cell.className = 'cell';
          if(r === mRow && c === mCol) cell.innerText = '🐭';
          else if(r === 4 && c === 4) cell.innerText = '🧀';
          grid.appendChild(cell);
        }
      }
    }

    render();
    connect();
  </script>
</body>
</html>
)rawliteral";

void apagarLeds() {
  digitalWrite(LED_ADELANTE, LOW);
  digitalWrite(LED_ATRAS, LOW);
  digitalWrite(LED_DERECHA, LOW);
  digitalWrite(LED_IZQUIERDA, LOW);
}

void webSocketEvent(uint8_t num, WStype_t type, uint8_t * payload, size_t length) {
  if (type == WStype_TEXT) {
    String command = String((char*)payload);
    apagarLeds();

    if (command == "UP") digitalWrite(LED_ADELANTE, HIGH);
    else if (command == "DOWN") digitalWrite(LED_ATRAS, HIGH);
    else if (command == "LEFT") digitalWrite(LED_IZQUIERDA, HIGH);
    else if (command == "RIGHT") digitalWrite(LED_DERECHA, HIGH);
  }
}

void setup() {
  pinMode(LED_ADELANTE, OUTPUT);
  pinMode(LED_ATRAS, OUTPUT);
  pinMode(LED_DERECHA, OUTPUT);
  pinMode(LED_IZQUIERDA, OUTPUT);
  apagarLeds();

  // 1. Crear Punto de Acceso Wi-Fi propio
  WiFi.softAP("MouseBot", "");

  // 2. Servir la página Web
  server.on("/", []() {
    server.send(200, "text/html", HTML_INTERFACE);
  });
  server.begin();

  // 3. Servidor de WebSocket para controlar los LEDs
  webSocket.begin();
  webSocket.onEvent(webSocketEvent);
}

void loop() {
  server.handleClient();
  webSocket.loop();
}
