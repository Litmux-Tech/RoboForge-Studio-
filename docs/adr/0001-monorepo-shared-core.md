# ADR-0001 — Monorepo with a shared platform-agnostic core

**Status:** Accepted

## Context

Web, future mobile, the simulator, and the firmware generator all need the same
robot model, the same wire protocol, and the same control behaviors. If each
re-implements them, they drift and the platform's "same logic everywhere" promise
breaks.

## Decision

A single **pnpm monorepo**. A platform-agnostic TypeScript package
**`@roboforge/core`** is the one source of truth for the `RobotProfile`, the
protocol, the `Transport` interface, the `SafetyGuard`, and autonomous
behaviors. Every app and package depends on it; UIs are thin shells.

## Consequences

- One source of truth → no protocol/model drift across surfaces.
- `core` stays free of DOM/Node/React specifics so any shell can consume it.
- Mobile must therefore be JS/TS, not Dart → see [ADR-0005](./0005-react-native-not-flutter.md).
- Slightly more tooling (workspaces, build order) than a single app.
