# D0!TY0UR3$3LF
D0!TY0UR3$3LF is a farmer-friendly tractor diagnostics platform for vehicle fault detection and analysis.

## Open source

D0!TY0UR3$3LF is open source under the MIT License. See `/LICENSE` for the full license text.

## Platform architecture

```text
Farmer's Tractor
        │
CAN / J1939 / ISOBUS / OBD
        │
USB or Bluetooth CAN Adapter
        │
Virtual Hardware Layer
        │
Universal Diagnostics Engine
        │
AI Fault Detection & Analysis
        │
Farmer-Friendly Mobile App / Desktop App (separate builds)
```

## API surface

- `GET /health` - service health plus active product profile
- `GET /api/v1` - API status and product description
- `GET /api/v1/platform-profile` - tractor integration and client build targets
