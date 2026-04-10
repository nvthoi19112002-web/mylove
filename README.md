# mylove

## Development Progress

- Completed core engine in `src/core/SceneManager.js`: Three.js scene management, camera, renderer, responsive resize, galaxy particle background, and `UnrealBloomPass` glow.
- Completed level 1 logic in `src/entities/HeartCollector.js`: falling heart meshes, raycast click detection, GSAP explode-to-particles effect, score accumulation, and `levelComplete()` trigger at 100 points.
- Added shared utilities in `src/utils/threeUtils.js`: random range math and normalized device coordinate conversion.
- Created `assets/` placeholder for future story imagery and audio assets.
- Added `src/entities/CrystalHeart.js` with a custom GLSL iridescent shader and GSAP levitation.
- Added `src/core/UIManager.js` with glassmorphism start screen, caption fly-up effects, and level completion fade.
- Added `src/core/Level2Manager.js` and `src/entities/MemoryFrame.js` for the Memory Gallery, reflective floor, and interactive photo frames.

## Project Structure

- `src/core/SceneManager.js` — core Three.js setup, renderer, scene, camera, bloom, and resize handling.
- `src/core/Level2Manager.js` — level 2 environment, reflective gallery floor, and transition logic.
- `src/core/UIManager.js` — DOM overlay for start screen, captions, skip controls, and story detail.
- `src/entities/HeartCollector.js` — game entity logic for hearts, collisions, particles, and score.
- `src/entities/CrystalHeart.js` — central iridescent heart with custom GLSL and GSAP levitation.
- `src/entities/MemoryFrame.js` — interactive photo frames with hover, click, and story expansion.
- `src/utils/threeUtils.js` — reusable math helpers and pointer normalization utilities.
- `src/utils/audioUtils.js` — lightweight soft click audio helper.
- `assets/` — story image assets used by `MemoryFrame` frames.

## Current Status

- Game status: Level 1 heart collection is implemented and functional.
- Added central `CrystalHeart` with iridescent shader visuals and subtle levitation.
- Added story-driven UI with `Start` overlay, caption popups, and level completion fade.
- Added Level 2 `Memory Gallery` support with reflective floor, photo wall frames, and narrative camera path.
- Added `MemoryFrame` interactions: hover glow, lookAt behavior, click-to-expand story detail.
- Added Level 3 `Infinite Flight` with a shader tunnel, beat-synced rings, and bass-reactive neon motion.
- Softened Level 3 particles to star-shaped sprites and reduced particle size for a gentler look.
- Added spatial audio support for gallery memories, including position-based volume and fallback tone generation.
- Added the Grand Finale flow with particle text, fireworks, and an interactive gift button / QR card reveal.
- Added a digital gift card modal with animated snow/petal overlay for the final surprise.

## Level 3 Infinite Flight
- `src/core/Level3Manager.js` builds the tube tunnel environment with `THREE.TubeGeometry` and a shader-based speed-line effect.
- User input is mapped from mouse movement and arrow keys to camera steering inside the tunnel.
- `THREE.AudioAnalyser` is used to sample bass energy from the level music and trigger ring pulses, screen flash, and color shifts.
- Motion blur is simulated by applying a subtle blur filter to the renderer canvas as speed and bass increase.
- On audio completion, the tunnel explodes into light particles and hands control back to the Grand Finale.

## Spatial Audio System
- `src/core/SceneManager.js` attaches a single `THREE.AudioListener` to the camera.
- `src/entities/MemoryFrame.js` creates a `THREE.PositionalAudio` object for each memory frame.
- `src/utils/assetLoader.js` caches audio loads and avoids repeated network requests.
- Each frame fades sound volume based on camera distance, giving a sense of proximity in the gallery.

## Transition Logic
- `src/core/SceneManager.js` now includes warp transition support from Level 2 to Level 3.
- When Level 2 ends, all `MemoryFrame` groups and the reflective floor shrink toward the `CrystalHeart` position.
- Camera FOV is smoothly animated from 75 to 120 to create a fisheye acceleration effect.
- A white flash overlay hides the environment swap before `initLevel3()` is called.

## Grand Finale Logic
- `src/core/GrandFinale.js` converts the final gallery frames into a particle bloom.
- Particles animate from frame geometry into the text message `'YÊU EM'`.
- Digital fireworks are spawned around the text using a `THREE.Group` of animated spark meshes.
- `FIREWORK_DENSITY` and `EXPLOSION_POWER` control effect scale and intensity.

## Bloom & Visual Tuning
- `STRENGTH: 0.6` — calmer bloom intensity for softer highlights.
- `THRESHOLD: 0.9` — reduces over-bright flare by limiting bloom to the strongest pixels.
- `RADIUS: 0.8` — keeps bloom spread gentle while maintaining dreamy glow.

## Final Review
- Start the game and collect hearts until Level 1 completes.
- Verify Level 2 camera tour visits all memory frames and the sounds shift with proximity.
- Confirm the Grand Finale triggers after the gallery tour and reveals the final gift button.
- Open the gift card modal and ensure the snow/petal overlay appears correctly.

## Technical Context

- `CrystalHeart` uses a custom GLSL shader that shifts hue based on the view angle and normal direction.
- The shader combines a base pink tone with angle-dependent iridescent color blends to simulate soap-film reflections.
- `UIManager` controls DOM overlays, glassmorphism start screen, caption animations, and level complete transition.

## Notes for tuning

- `SPEED_FACTOR = 0.12` — controls initial falling speed of hearts; higher means faster drop.
- `GRAVITY = 0.05` — controls downward acceleration for hearts and particles; higher means quicker fall.
- `IRIDESCENCE_INTENSITY = 1.25` — controls the strength of the iridescent shimmer on `CrystalHeart`.
- `CAMERA_SPEED` — controls how quickly the gallery tour camera moves between frames; lower is slower and more cinematic.
- `ZOOM_DISTANCE` — decides how close the camera stops to each `MemoryFrame`; larger values keep the camera farther from the frame.
- `FLIGHT_SPEED = 0.12` — controls how fast the camera travels through the Level 3 tunnel; increasing it makes the flight feel more urgent.
- `BEAT_SENSITIVITY = 0.24` — adjusts how strongly bass energy affects ring pulse intensity and tunnel color shifts.
- Adjust `UnrealBloomPass` `strength` and `radius` in `src/core/SceneManager.js` for a more glowing ambience.
