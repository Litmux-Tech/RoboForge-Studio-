/**
 * RoboForge runtime firmware (ESP32) — 4WD car.
 *
 * Flash once. Brings up a WiFi access point + WebSocket server and speaks the
 * same JSON protocol as packages/core/src/protocol.ts:
 *
 *   App  -> {"t":"drv","thr":..,"str":..}   drive (throttle/steer -1..1)
 *           {"t":"cmd","a":"estop"}          stop
 *           {"t":"manifest?"}                request manifest
 *   Robot-> {"t":"manifest",...}             on connect
 *           {"t":"tel","ts":..,"s":{...}}    telemetry @ ~10 Hz
 *
 * Drivers implemented: L298N motor control (LEDC PWM), HC-SR04 ultrasonic,
 * MPU6050 yaw (raw I2C gyro integration), on-device deadman.
 *
 * Pin map matches createEsp32FourWheelCar(); each side's two motors share one
 * L298N channel. (Arduino-ESP32 core 2.x LEDC API.)
 */

#include <Arduino.h>
#include <WiFi.h>
#include <WebSocketsServer.h>
#include <ArduinoJson.h>
#include <Wire.h>

// ── Pin map (ESP32 + L298N) ─────────────────────────────────────────────────
#define IN1_L 26
#define IN2_L 27
#define EN_L 14   // left channel (front_left + rear_left)
#define IN1_R 25
#define IN2_R 33
#define EN_R 12   // right channel (front_right + rear_right)
#define TRIG 5
#define ECHO 18
#define SDA_PIN 21
#define SCL_PIN 22
#define MPU_ADDR 0x68
#define BATT_ADC 34
#define BATT_SCALE 0.0f // set to your voltage-divider ratio; 0 = don't report

// LEDC PWM
#define CH_L 0
#define CH_R 1
#define PWM_FREQ 20000
#define PWM_RES 8 // 0..255

static const char* AP_SSID = "RoboForge-Car";
static const char* AP_PASS = "roboforge";
static const uint16_t WS_PORT = 81;
static const uint32_t CMD_TIMEOUT_MS = 400; // on-device deadman

WebSocketsServer ws(WS_PORT);
static uint32_t lastCmdMs = 0;
static uint32_t lastImuMs = 0;
static float yawRad = 0;
static bool mpuOk = false;

// ── Motors (L298N) ──────────────────────────────────────────────────────────
void setSide(int in1, int in2, int ch, float v) {
  const bool fwd = v >= 0;
  digitalWrite(in1, fwd ? HIGH : LOW);
  digitalWrite(in2, fwd ? LOW : HIGH);
  int duty = (int)(fabsf(v) * 255.0f);
  if (duty > 255) duty = 255;
  ledcWrite(ch, duty);
}

void driveMotors(float thr, float str) {
  float l = thr + str;
  float r = thr - str;
  const float m = fmaxf(fabsf(l), fabsf(r));
  if (m > 1.0f) { l /= m; r /= m; } // keep within ±1
  setSide(IN1_L, IN2_L, CH_L, l);
  setSide(IN1_R, IN2_R, CH_R, r);
}
void stopMotors() { driveMotors(0, 0); }

// ── HC-SR04 ─────────────────────────────────────────────────────────────────
float readUltrasonicCm() {
  digitalWrite(TRIG, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG, LOW);
  const long us = pulseIn(ECHO, HIGH, 25000); // ~4.3 m timeout
  if (us == 0) return 400.0f;
  const float cm = us / 58.0f;
  return cm > 400 ? 400.0f : cm;
}

// ── MPU6050 (raw I2C) ───────────────────────────────────────────────────────
bool mpuBegin() {
  Wire.begin(SDA_PIN, SCL_PIN);
  Wire.beginTransmission(MPU_ADDR);
  Wire.write(0x6B); // PWR_MGMT_1
  Wire.write(0);    // wake
  return Wire.endTransmission() == 0;
}
float readGyroZ() { // deg/s
  Wire.beginTransmission(MPU_ADDR);
  Wire.write(0x47); // GYRO_ZOUT_H
  if (Wire.endTransmission(false) != 0) return 0;
  Wire.requestFrom(MPU_ADDR, 2);
  if (Wire.available() < 2) return 0;
  const int16_t raw = (Wire.read() << 8) | Wire.read();
  return raw / 131.0f; // ±250 dps default scale
}

float readBatteryV() {
  if (BATT_SCALE <= 0) return 0;
  return (analogRead(BATT_ADC) / 4095.0f) * 3.3f * BATT_SCALE;
}

// ── Protocol ────────────────────────────────────────────────────────────────
void sendManifest(uint8_t client) {
  JsonDocument d;
  d["t"] = "manifest";
  d["board"] = "esp32";
  d["fw"] = "roverlib-0.2.0";
  d["drive"] = "diff4wd";
  JsonArray drivers = d["drivers"].to<JsonArray>();
  drivers.add("hcsr04");
  drivers.add("mpu6050");
  String out;
  serializeJson(d, out);
  ws.sendTXT(client, out);
}

void sendTelemetry() {
  JsonDocument d;
  d["t"] = "tel";
  d["ts"] = millis();
  JsonObject s = d["s"].to<JsonObject>();
  s["dist_front"] = readUltrasonicCm();
  JsonObject imu = s["imu"].to<JsonObject>();
  imu["yaw"] = yawRad;
  imu["pitch"] = 0;
  imu["roll"] = 0;
  const float bv = readBatteryV();
  if (bv > 0) d["batt"] = bv;
  String out;
  serializeJson(d, out);
  ws.broadcastTXT(out);
}

void onWsEvent(uint8_t client, WStype_t type, uint8_t* payload, size_t len) {
  if (type == WStype_CONNECTED) {
    sendManifest(client);
    return;
  }
  if (type != WStype_TEXT) return;
  JsonDocument d;
  if (deserializeJson(d, payload, len)) return;
  const char* t = d["t"] | "";
  if (!strcmp(t, "drv")) {
    lastCmdMs = millis();
    driveMotors(d["thr"] | 0.0f, d["str"] | 0.0f);
  } else if (!strcmp(t, "cmd")) {
    const char* a = d["a"] | "";
    if (!strcmp(a, "estop") || !strcmp(a, "stop")) stopMotors();
  } else if (!strcmp(t, "manifest?")) {
    sendManifest(client);
  }
}

// ── Entrypoints ─────────────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  pinMode(IN1_L, OUTPUT);
  pinMode(IN2_L, OUTPUT);
  pinMode(IN1_R, OUTPUT);
  pinMode(IN2_R, OUTPUT);
  pinMode(TRIG, OUTPUT);
  pinMode(ECHO, INPUT);
  ledcSetup(CH_L, PWM_FREQ, PWM_RES);
  ledcAttachPin(EN_L, CH_L);
  ledcSetup(CH_R, PWM_FREQ, PWM_RES);
  ledcAttachPin(EN_R, CH_R);
  stopMotors();

  mpuOk = mpuBegin();
  lastImuMs = millis();

  WiFi.softAP(AP_SSID, AP_PASS);
  Serial.print("AP IP: ");
  Serial.println(WiFi.softAPIP()); // usually 192.168.4.1
  ws.begin();
  ws.onEvent(onWsEvent);
}

void loop() {
  ws.loop();
  const uint32_t nowMs = millis();

  if (nowMs - lastCmdMs > CMD_TIMEOUT_MS) stopMotors(); // deadman

  if (mpuOk) {
    const float dt = (nowMs - lastImuMs) / 1000.0f;
    yawRad += readGyroZ() * (PI / 180.0f) * dt;
    lastImuMs = nowMs;
  }

  static uint32_t lastTel = 0;
  if (nowMs - lastTel >= 100) { // 10 Hz
    lastTel = nowMs;
    sendTelemetry();
  }
}
