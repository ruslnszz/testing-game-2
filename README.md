# English Adventure – Degree of Comparison (Stage 3)

Project continues the existing Stage 1/2 HTML Canvas game. No build process or framework is required.

## Run the game
- Open `index.html` in a modern browser (Chrome/Edge/Firefox).
- If browser file restrictions prevent loading custom images/audio, run a local static server from the project folder, e.g. `python -m http.server 8000`, then open `http://localhost:8000`.
- Select **Play**. The game supports five levels, Lucky Blocks, quizzes, coins, enemies, hazards, lives, score, progress saves and the final victory state.

## Controls
- Keyboard: A/Left, D/Right, Space/W/Up to jump, Esc/P to pause.
- Touch devices: on-screen left, right and jump buttons appear for narrow/coarse-pointer devices.
- Touch buttons use pointer events and support holding movement.

## Folder structure
```text
english-adventure/
  index.html
  README.md
  css/style.css
  js/
    main.js       # gameplay loop, state, quiz flow, score and level progression
    map.js       # map data and canvas drawing
    player.js    # keyboard/touch input, player movement and character rendering
    physics.js   # collision and gravity helpers
    quiz.js      # quiz bank
    ui.js        # menu, HUD, settings and overlay UI
    sound.js     # customizable audio bank and volume/mute control
  assets/
    characters/   # default player and optional custom sprites
    sounds/      # replaceable MP3 files
    backgrounds/ # reserved for future custom background art
    objects/     # reserved for future object art
```

## Custom character
1. Character selection was removed from the main menu. Change the character directly in `js/player.js` by editing `PLAYER_ART_MODE` (`'custom'` to use PNGs, or `'procedural'` to use the built-in pixel hero).
2. Replace files in `assets/characters/` with transparent PNGs. Keep each animation sheet a horizontal row of frames, **48×64 pixels per frame**. `player-run.png` includes four frames; idle/jump/hit can be a single 48×64 frame or a multi-frame strip.
3. Required filenames: `player.png`, `player-idle.png`, `player-run.png`, `player-jump.png`, `player-hit.png`.
4. `player.png` is the static fallback. If an animation is missing/unreadable, the fallback image is used; if the base image also fails, the original procedural pixel character is drawn.
5. Collision size remains **22×30 world pixels** regardless of image dimensions. Character art is drawn inside this fixed footprint.
6. To use the built-in procedural hero, set `PLAYER_ART_MODE = 'procedural'` in `js/player.js`.

## Custom sound effects and music
- Replace MP3 files in `assets/sounds/` without changing game JavaScript.
- Each sound has a dedicated wrapper function in `js/sound.js` (e.g. `GameSound.jump()`, `GameSound.coin()`).
- Sound is unlocked after pressing Play, since browsers block autoplay before a user gesture.
- Settings includes a volume slider and mute toggle. Missing or blocked audio never stops gameplay.
- The included sounds are generated placeholder tones/melody, not professionally recorded effects. Replace them with your own MP3s for the final release.

Files: `jump.mp3`, `coin.mp3`, `lucky-block.mp3`, `correct-answer.mp3`, `wrong-answer.mp3`, `player-hit.mp3`, `game-over.mp3`, `level-complete.mp3`, `background-music.mp3`.

## Add quiz questions
- Open `js/quiz.js` and add a question object to `QuizBank`.
- Keep the object shape consistent with the existing bank: `level`, `q`, `a` (four answer strings), `correct` (zero-based index in the original answers array), and `exp` (explanation).
- Levels 1–5 correspond to Positive, Comparative, Superlative, mixed Grammar Challenge, and Final Challenge.
- Questions are shuffled at presentation time. Avoid HTML in question strings; the quiz displays plain text.

## Add a level
- Map layout and level-specific configuration are handled in `js/map.js` and `js/main.js`.
- Current five-level progression is configured in `js/main.js` (`names`, unlock/complete logic) and `js/map.js` (`GameMap.build` level-scaled blocks, enemies, hazards/background).
- A new level requires adding its name, unlock logic, level-specific map configuration and quiz-bank items. Existing map layout is preserved for this release.

## Local save
The game uses browser LocalStorage key `englishAdventureSave` for unlocked level and best score. Character appearance is controlled directly by the `PLAYER_ART_MODE` code constant and is not stored in LocalStorage. Clearing browser storage resets progress/settings.

## Stage 3 notes
- Canvas game world retains fixed logical resolution 800×480 and scales to the viewport. Touch controls are an overlay on the game stage for mobile. The Show FPS setting/display and Character selector menu were removed; character art is configured directly in `js/player.js`.
- Existing game physics and collision hitboxes are retained. Custom character images do not alter collision dimensions.
- Tested JavaScript syntax and smoke checks; a complete interactive browser playthrough on physical mobile hardware was not performed in this environment.
- Degree of Comparison PPT was not present in the original project package; quiz questions remain based on the provided topic list, not slide-specific examples.

## Landscape & fullscreen on phones
- `js/display.js` fits the canvas to the screen (wider logical view, no black bars), enters fullscreen when Play is pressed on touch devices, and locks orientation to landscape where supported (Android Chrome).
- A "rotate your phone" screen shows in portrait and the game auto-pauses.
- ⛶ button in-game toggles fullscreen. iPhone Safari has no Fullscreen API: use Share → Add to Home Screen (`manifest.json` + meta tags make it open fullscreen).

## Map layout notes
- Lucky blocks are now solid tiles (tile code 7); hitting one from below (head bump) opens the quiz. Used blocks stay solid.
- Spikes only sit on open ground (not in pits, not at pit edges, not under platforms). The moving platform bridges a pit in each level.
