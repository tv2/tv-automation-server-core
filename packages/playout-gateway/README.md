# Sofie: The Modern TV News Studio Automation System (Playout Gateway)

An application for piping data between the [Sofie Server Core](https://github.com/nrkno/tv-automation-server-core) and play-out devices (such as CasparCG Server, ATEM, Lawo, etc..)

This application is a part of the [**Sofie** TV News Studio Automation System](https://github.com/nrkno/Sofie-TV-automation/).

## Usage

```
// Development:
yarn dev -host 127.0.0.1 -port 3000 -log "log.log"
// Production:
yarn start
```

**CLI arguments:**

| Argument | Description            | Environment variable |
| -------- | ---------------------- | -------------------- |
| -host    | Hostname or IP of Core | CORE_HOST            |
| -port    | Port of Core           | CORE_PORT            |
| -log     | Path to output log     | CORE_LOG             |
| -id      | Device ID to use       | DEVICE_ID            |

## Installation for dev

- yarn
- yarn build
- yarn test

## REST listener and local startup

`REST_PORT` selects the gateway lifecycle REST port (default `3009`).
`REST_HOST` optionally selects its bind address. If unset, the existing
all-interface listener behavior is preserved. Set `REST_HOST=127.0.0.1` for local
integration; `CORE_HOST` only controls the outgoing Core connection.

With a unique `DEVICE_ID` and a private `DEVICE_TOKEN` already supplied in the
environment, run the built gateway from this package directory:

```sh
CORE_HOST=127.0.0.1 CORE_PORT=3100 REST_HOST=127.0.0.1 REST_PORT=3009 yarn start
```

A fresh Core device with no `settings.devices` is treated as an empty device
list: gateway registration does not initialize hardware. Adding configured
subdevices later can initialize their connections.

## Local M2L-X integration

The local integration pairs Core `v46.0.4-staging` with gateway `v46.3.7-staging`.
The existing TSR runtime and blueprint types aliases are pinned to
`@tv2media/timeline-state-resolver@3.8.0-m2lx.2` and
`@tv2media/timeline-state-resolver-types@3.8.0-m2lx.2`.
Core supplies devices and mappings dynamically; no gateway CLI mixer configuration is needed.

Add an **M2LX** subdevice with `options.baseUrl` (HTTPS API URL) and
`options.password` (the installation's fixed administrator account password).
Do not put credentials in source control. This Core manifest has no password masking.
Gateway initialization/reinitialization logs contain device identity/type rather
than full options; startup debug logging does not dump subdevice settings. Core
method timeout diagnostics omit all arguments, including the device token.
Keep Core settings and gateway logs private regardless: these changes are not a
general redaction guarantee for third-party errors or arbitrary command payloads.

Optional options:

| Option | Meaning |
| ------ | ------- |
| `eventId` | Stable event ID, not a display name; no surrounding whitespace |
| `eventTimeout` | Positive, finite event stop/start timeout in ms; defaults to `180000` |
| `rejectUnauthorized` | Verify HTTPS/WebSocket certificates; defaults to `true` |
| `authenticationTimeout` | REST authentication timeout in ms |
| `webSocketConnectTimeout` | WebSocket connection timeout in ms |
| `commandTimeout` | Command completion timeout in ms |
| `reconnectBackoff.minDelay`, `reconnectBackoff.maxDelay` | Reconnect delays in ms |

These are under `options`; common `debug`, `disable` and `threadUsage` remain available.
Leave optional fields unset to use TSR defaults. Certificate verification should only
be disabled for an explicitly trusted local installation.

All mappings use device **M2LX** and its configured device ID:

| `mappingType` | Resource fields |
| ------------- | --------------- |
| `mixer` | None |
| `keyer` | `bus`: `program`/`preview`; `keyer.type`: `pip`/`still`/`dsk`; `keyer.index`: native PiP `0–3`, Still `4–7`, DSK `0–1` |
| `audio` | Required `input` with full stream suffix (for example `vtr3.1`); optional `node`, defaults to `audio_mixer` |
| `media_player` | Required `player`, the configured player node |
| `router` | Required `output`; optional `node`, defaults to `router` |

This Core schema has no conditional fields or numeric-range constraints. Resource
fields are optional in the UI so a mixer mapping needs none; supply the required
fields for the chosen mapping type yourself. TSR validates event ID/timeout at
connection construction, but the manifest does not validate resource existence,
conditional mapping completeness or keyer ranges. Invalid mappings may fail during
timeline processing; optional in the UI does not mean optional in the TSR contract.

Initialization authenticates and reads status only. Explicit activation with an
`eventId` must succeed before commands are ready; activating an inactive selected
event may stop another event and start the selected one. Core's makeReady dispatch
is fire-and-forget: it does **not** synchronously guarantee event readiness.
Monitor device status before playout. Gateway makeReady/standDown are forwarded
generically to TSR.

For `mixer.composition.pip`, declare the same owned native indices on every shot:
`{ visible: false }` clears an owned PiP; visible PiPs require complete video source,
translation, scale and crop. Do not add KEYER mappings for composition-owned PiPs
on either bus. TSR stages Preview then performs a native CUT/EFFECT Take, including
same-background changes and cleanup. Unowned keyers and unspecified PiP properties
must match between Program and Preview for the native status guard. Source-only CUT
remains a direct setter; lookahead stages Preview without taking it.

### Returning from private integration builds to released packages

The `.2` dependency pins target the selected-Next composition and independent
DSK corrections previously tested in private integration builds. Older `.1`
packages lack those corrections. Changing pins or rebuilding a checkout does not
replace a frozen private artifact or change its launcher's package resolution.

First commit and push the corrected TSR runtime/types source and obtain green CI.
Publish both packages with matching prerelease versions, then update the existing
runtime/types aliases and lockfiles in this repository and the blueprint types
resolution together. Build and validate from those normal checkouts, including
the actual bundled types capability and executing runtime, not version labels
alone. Do not upgrade the integration/Core release line as part of this pin change.

Before local cutover, preserve private rollback artifacts and back up configuration
securely. Verify the approved target, certificate verification, inactive playlists
and empty command queue. Restart only the affected local service using the installed
package build; confirm its actual process directory, package resolution and GOOD
device status. Rebuild/upload matching blueprints while preserving settings and
migration state. Operator Preview/Take acceptance follows separately.
Never commit device credentials, raw Core snapshots or private launcher tokens.
