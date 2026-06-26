/**
 * RobotProfile — THE SPINE.
 *
 * One data model that every module reads or writes:
 *   Circuit Builder  writes the wiring/pins
 *   Validator        reads the pins + electrical metadata
 *   Simulator        reads the geometry (mounts, wheel radius)
 *   Control / Dash   reads the drivers + transports
 *   Codegen          compiles it into firmware
 *
 * If it isn't expressible in a RobotProfile, it isn't part of a robot.
 */

export type BoardId = 'esp32' | 'esp8266' | 'arduino-uno' | 'pi-pico' | 'stm32';

export type DriveKind =
  | 'diff2wd'
  | 'diff4wd'
  | 'ackermann'
  | 'mecanum'
  | 'tank'
  | 'omni';

export type MotorDriverChip = 'l298n' | 'tb6612' | 'bts7960' | 'drv8833';

export type SensorDriver =
  | 'hcsr04' //   ultrasonic distance (trig/echo)
  | 'vl53l0x' //  time-of-flight distance (I2C)
  | 'dht22' //    temperature + humidity
  | 'mpu6050' //  6-axis IMU (I2C)
  | 'ina219' //   voltage + current (I2C)
  | 'ir-line' //  reflective line sensor (analog/digital)
  | 'gps-neo6m'; // GPS (UART)

/** A GPIO number, or a named bus pin (e.g. an I2C bus). */
export type PinId = number | string;

/** Pose relative to the chassis centre. Metres + radians. Used by the simulator. */
export interface Pose {
  x?: number;
  y?: number;
  z?: number;
  yaw?: number;
  pitch?: number;
  roll?: number;
}

export interface SensorConfig {
  /** stable id, e.g. "dist_front" — telemetry is keyed by this */
  id: string;
  label?: string;
  driver: SensorDriver;
  /** role -> pin, e.g. { trig: 5, echo: 18 } or { sda: 21, scl: 22 } */
  pins: Record<string, PinId>;
  mount?: Pose;
  /** per-sensor tuning (poll rate, thresholds, ...) */
  options?: Record<string, number | string | boolean>;
}

export interface MotorChannel {
  /** e.g. "front_left" */
  id: string;
  /** driver input pins, e.g. L298N { in1: 26, in2: 27, en: 14 } */
  pins: Record<string, PinId>;
  mount?: Pose;
  reversed?: boolean;
}

export interface DriveConfig {
  kind: DriveKind;
  driverChip: MotorDriverChip;
  motors: MotorChannel[];
  /** geometry the sim + control scaling need (metres / m·s⁻¹) */
  wheelRadius?: number;
  wheelBase?: number;
  trackWidth?: number;
  maxSpeed?: number;
}

export type TransportKind =
  | 'sim'
  | 'wifi-ws'
  | 'ble'
  | 'bt-classic'
  | 'usb-serial'
  | 'esp-now'
  | 'mqtt';

export interface RobotProfile {
  /** profile schema version — bump on breaking changes */
  schema: 1;
  id: string;
  name: string;
  board: BoardId;
  drive: DriveConfig;
  sensors: SensorConfig[];
  /** transports this robot can speak; the app picks one at connect time */
  transports: TransportKind[];
  meta?: Record<string, unknown>;
}

/**
 * The V1 reference robot: ESP32 4WD car with an L298N driver, a front
 * ultrasonic and an IMU. Pins follow a common ESP32 + L298N wiring (each side's
 * two motors share one L298N channel).
 */
export function createEsp32FourWheelCar(
  overrides: Partial<RobotProfile> = {},
): RobotProfile {
  return {
    schema: 1,
    id: 'esp32-4wd-explorer',
    name: '4WD Explorer Bot',
    board: 'esp32',
    drive: {
      kind: 'diff4wd',
      driverChip: 'l298n',
      wheelRadius: 0.033,
      wheelBase: 0.16,
      trackWidth: 0.15,
      maxSpeed: 1.5,
      motors: [
        { id: 'front_left', pins: { in1: 26, in2: 27, en: 14 }, mount: { x: 0.08, y: 0.075 } },
        { id: 'rear_left', pins: { in1: 26, in2: 27, en: 14 }, mount: { x: -0.08, y: 0.075 } },
        { id: 'front_right', pins: { in1: 25, in2: 33, en: 12 }, mount: { x: 0.08, y: -0.075 }, reversed: true },
        { id: 'rear_right', pins: { in1: 25, in2: 33, en: 12 }, mount: { x: -0.08, y: -0.075 }, reversed: true },
      ],
    },
    sensors: [
      { id: 'dist_front', label: 'Front Ultrasonic', driver: 'hcsr04', pins: { trig: 5, echo: 18 }, mount: { x: 0.1, z: 0.04 } },
      { id: 'imu', label: 'IMU', driver: 'mpu6050', pins: { sda: 21, scl: 22 } },
    ],
    transports: ['sim', 'wifi-ws', 'ble'],
    ...overrides,
  };
}
