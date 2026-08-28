# Ingoizer's World — Technical Roadmap

*Updated August 2026*

This document tracks current engineering opportunities. Earlier recommendations
for saves, death checkpoints, quest progress, day/night play, the Worldtree,
Cloudlands, the Clubhouse, touch controls, and related progression have been
removed because those features are now live.

## Completed in the August runtime pass

### One owned animation loop

The game now owns and cancels its pending animation-frame request. Loading a
save or returning to the title screen invalidates the previous loop generation
before another loop can begin. This prevents repeated loads from multiplying
updates, rendering work, and game speed.

### State-driven HUD rendering

HUD elements are cached once by `UIManager`. A compact state signature prevents
unchanged health, inventory, quest, realm, companion, and equipment values from
being written back to the DOM every frame.

### Capped minimap rendering

The main canvas still follows the display refresh rate, while the minimap is
capped at 12 frames per second. Resets and viewport changes mark it dirty so the
next frame is immediate. This removes repeated fog, landmark, and marker work
without making navigation feel delayed.

## Recommended next work

### 1. Split runtime responsibilities incrementally

`Game`, `World`, `UIManager`, and the entity module remain large and tightly
coupled. Avoid a big-bang rewrite. Extract systems behind the current public
interfaces in this order:

1. `GameLoop` for frame scheduling and timing.
2. `RealmManager` for surface, cave, and Cloudlands transitions.
3. `QuestSystem` for progression flags and interaction rules.
4. `SpawnSystem` for monsters, animals, and encounter limits.
5. `Renderer` for canvas composition and depth ordering.

This will make changes easier to test without destabilizing saved games or the
existing content pipeline.

### 2. Adopt ES modules and a production build

The page currently loads all runtime files as ordered global scripts. Move one
dependency group at a time to ES modules, then add a small production build for
minification, hashed assets, and dead-code elimination. Defer code splitting
until module boundaries are stable; lore, shops, and secondary realms are good
eventual lazy-load candidates.

### 3. Add fast logic tests and automated checks

Playwright provides strong player-flow and save-compatibility coverage, but it
is too slow for exhaustive combat and world-rule cases. Add unit tests for:

- Combat damage, elemental effects, and kill rewards.
- Quest state transitions and out-of-order player actions.
- Seeded world generation invariants.
- Save migrations and malformed save handling.

Add linting, formatting, and GitHub Actions checks alongside those tests. Keep
the browser suite for integration behavior and visual layout.

### 4. Reduce initial download size

The title logo and title background PNGs account for roughly 4.2 MB. Produce
WebP or AVIF variants and size them for their actual display dimensions. Keep a
fallback only where browser support requires it. This is the clearest remaining
startup-time improvement.

Large development-binder images and generated PDFs should stay out of the
deployed artifact once a build pipeline exists, even if they remain versioned
for project history.

### 5. Reduce per-frame allocations and offscreen work

The renderer currently builds wrapper objects and closures for renderable
entities, sorts them, and then relies on individual drawing code for visibility
decisions. Cull entities against the camera first and sort reusable entity
references directly. Profile before introducing spatial partitioning; a simple
uniform grid is worthwhile only if future encounters materially raise entity
counts.

### 6. Make delayed sequences session-aware

Several story and victory sequences use standalone timers. A timer created by
an old run can survive a load or restart and later open a dialog in the new run.
Route delayed callbacks through a session-owned scheduler and cancel the group
whenever state is reset, loaded, or returned to the title screen.

### 7. Cache static map metadata

Terrain layers are already cached, but landmark arrays and some map labels are
still reconstructed during minimap/world-map draws. Cache static landmarks and
invalidate only when discoveries or permanent world events change them. The
new minimap cap lowers the urgency, so this should follow profiling rather than
precede architecture and test work.

### 8. Establish performance budgets

Add a small automated performance scenario with a representative crowded scene.
Track:

- Initial transferred bytes.
- Time from navigation to usable title screen.
- Main-loop frame time at the 95th percentile.
- Minimap render count and duration.
- Long tasks and unexpected layout work.

Budgets turn future optimization decisions into measurable tradeoffs and guard
against regressions as new realms and enemies are added.

## Suggested delivery order

- **Next maintenance pass:** session-aware timers, unit-test foundation, linting,
  and CI.
- **Next performance pass:** title-image conversion, static map metadata cache,
  and camera-first entity culling.
- **Architecture pass:** ES modules followed by the incremental system
  extractions above.

Preserve save compatibility throughout. New persistent fields should continue
to use explicit versioning and migration behavior, with a round-trip browser
test added for every player-visible piece of state.
