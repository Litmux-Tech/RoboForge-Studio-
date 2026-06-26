/**
 * RoboForge runtime firmware (ESP32).
 *
 * Flash this ONCE. It brings up a WiFi access point + a WebSocket server, then
 * waits for the app to push a robot config (pins, sensors) and drive commands.
 * It speaks the SAME JSON protocol as packages/core/src/protocol.ts:
 *
 *   App  -> {"t":"drv","thr":..,"str":..}   drive (throttle/steer -1..1)
 *           {"t":"cmd","a":"estop"}          stop
 *           {"t":"cfg","sensors":[...]}      runtime config
 *   Robot-> {"t":"manifest",...}             on connect
 *           {"t":"tel","ts":..,"s":{...}}    telemetry @ ~10 Hz
 *
 * STATUS: skeleton. Motor + sensor drivers are stubbed (see TODO markers); the
 * transport, protocol, deadman, and telemetry loop are wired.
 */

#include <Arduino.h>
#include <WiFi.h>
#include <WebSocketsServer.h>
#include <ArduinoJson.h>

static const char* AP_SSID = "RoboForge-Car";
static const char* AP_PASS = "roboforge";
static const uint16_t WS_PORT = 81;

// Deadman: cut the motors if no command arrives within this window. This is
// enforced on-device, independent of the app's own SafetyGuard, so a crashed
// app or a dropped WiFi link also stops the robot.
static const uint32_t CMD_TIMEOUT_MS = 400;
static uint32_t lastCmdMs = 0;

WebSocketsServer ws(WS_PORT);

// ── Motor control (L298N) ────────────────────────────────────────────────────
void driveMotors(float thr, float str) {
  // TODO: map thr/str -> per-side PWM using the pushed config pin map.
  (void)thr;
  (void)str;
}
void stopMotors() { driveMotors(0.0f, 0.0f); }

// ── Telemetry ────────────────────────────────────────────────────────────────
void sendTelemetry() {
  JsonDocument doc;
  doc["t"] = "tel";
  doc["ts"] = millis();
  JsonObject s = doc["s"].to<JsonObject>();
  // TODO: read configured sensors (HC-SR04 trig/echo timing, MPU6050 over I2C).
  s["dist_front"] = 0;
  doc["batt"] = 0;
  String out;
  serializeJson(doc, out);
  ws.broadcastTXT(out);
}

void sendManifest(uint8_t client) {
  JsonDocument doc;
  doc["t"] = "manifest";
  doc["board"] = "esp32";
  doc["fw"] = "roverlib-0.1.0";
  doc["drive"] = "diff4wd";
  JsonArray drivers = doc["drivers"].to<JsonArray>();
  drivers.add("hcsr04");
  drivers.add("mpu6050");
  String out;
  serializeJson(doc, out);
  ws.sendTXT(client, out);
}

// ── WebSocket events ─────────────────────────────────────────────────────────
void onWsEvent(uint8_t client, WStype_t type, uint8_t* payload, size_t len) {
  if (type == WStype_CONNECTED) {
    sendManifest(client);
    return;
  }
  if (type != WStype_TEXT) return;

  JsonDocument doc;
  if (deserializeJson(doc, payload, len)) return; // ignore malformed
  const char* t = doc["t"] | "";

  if (!strcmp(t, "drv")) {
    lastCmdMs = millis();
    driveMotors(doc["thr"] | 0.0f, doc["str"] | 0.0f);
  } else if (!strcmp(t, "cmd")) {
    const char* a = doc["a"] | "";
    if (!strcmp(a, "estop") || !strcmp(a, "stop")) stopMotors();
  } else if (!strcmp(t, "cfg")) {
    // TODO: store sensor/pin config and (re)initialise the drivers.
  }
}

// ── Arduino entrypoints ──────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  WiFi.softAP(AP_SSID, AP_PASS);
  Serial.print("AP IP: ");
  Serial.println(WiFi.softAPIP()); // usually 192.168.4.1
  ws.begin();
  ws.onEvent(onWsEvent);
}

void loop() {
  ws.loop();

  if (millis() - lastCmdMs > CMD_TIMEOUT_MS) stopMotors();

  static uint32_t lastTel = 0;
  if (millis() - lastTel >= 100) { // 10 Hz
    lastTel = millis();
    sendTelemetry();
  }
}
