# ADR-0005 — Mobile is React Native, not Flutter

**Status:** Accepted

## Context

The vision doc suggested Flutter for the mobile app. But the platform's value
rests on a shared TypeScript `core` (protocol, transports, behaviors,
`RobotProfile`). Flutter is **Dart** and cannot consume that core — it would mean
re-implementing the brain of the platform in a second language and keeping the
two in sync forever.

## Decision

Mobile is **React Native / Expo**, reusing `@roboforge/core` verbatim. Flutter is
rejected.

## Consequences

- One shared "brain" across web and mobile; behaviors/protocol written once.
- Platform-specific transports differ (Web Bluetooth on web vs
  `react-native-ble-plx` on mobile) but hide behind the same `Transport`
  interface, so the shared code doesn't care.
- We forgo Flutter's single-codebase desktop story; Tauri covers desktop instead
  (see [ADR-0006](./0006-firmware-build-strategy.md)).
