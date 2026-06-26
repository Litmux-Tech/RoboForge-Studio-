# ADR-0007 — Circuit Builder is a typed node-graph (React Flow)

**Status:** Accepted (Phase 2 — spec'd now because it produces the netlist)

## Context

We want a circuit builder that's *more responsive* than Tinkercad and that feeds
the rest of the pipeline. Tinkercad is heavy because it does two expensive things
we don't need: photorealistic breadboard rendering and live analog (SPICE)
simulation.

## Decision

Build a **schematic-style node graph with React Flow** (already in the stack):

- Components = **nodes** with **typed pins** carrying electrical metadata
  (`{ type, dir, vMax, iMax }`).
- Wires = **edges**. The whole graph **is the netlist** — the same
  `RobotProfile`/netlist the validator, codegen, and sim consume.
- **Smart Wiring validation** is a rules engine over the typed pins (e.g. "motor
  draws 800 mA, GPIO sources ~12 mA → use a driver"), and it *teaches why*.

Skip the skeuomorphic breadboard view and analog SPICE simulation — neither
serves the robotics→firmware pipeline.

## Consequences

- Fast (10–30 nodes render trivially) and professional; maps 1:1 to a netlist.
- The validator — not the canvas — is the differentiator and the educational hook.
- Not a general analog-electronics simulator. That's a non-goal.
- If thousands of parts are ever needed, the upgrade path is a WebGL canvas
  (PixiJS) — premature now.
