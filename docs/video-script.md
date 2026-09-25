# Demo video script (DRAFT, target about 2:30)

TODO-verify: hackathon video length limit and required elements on the submission page.
Record from the Fire TV emulator or device if available; otherwise the React Native app's web target (`npm run app:web`, http://localhost:8082, 1920x1080 window) with the keyboard standing in for the remote. Say which one you used. As of this draft the native build has NOT been run.

| Time | Screen | Voiceover | Action |
|---|---|---|---|
| 0:00 | Title card | "Kids learn best when practice sits where the family already is: the living room TV." | Logo, one line pitch |
| 0:12 | Home | "Three games, one curriculum, driven entirely by the remote. No typing." | Move focus across the tiles with the D-pad. Show the yellow focus ring and the level badges. Point out spatial navigation (react-tv-space-navigation) |
| 0:30 | Abacus | "Left and right choose a rod. Up and down slide beads. OK checks the answer." | Beads are on screen: Left/Right picks a rod, Up/Down slides beads. Solve a 2-digit sum, wrong answer once, then right. Show the streak dots filling toward level-up (3 in a row) |
| 1:00 | Map Quiz | "Countries and capitals, four big choices in a 2x2 grid." | A real map highlights the country. Answer 3 in a row, show the level-up message |
| 1:25 | Balance Scales | "Algebra as a see-saw. Change x until the scales balance." | Show the beam tilting, then balancing |
| 1:55 | Coach link | "Practice by voice with the Alexa+ Learning Coach shows up here, and the reverse." | Show progress on home tiles. Only claim what is real: currently a mock adapter (TODO: swap in coach API) |
| 2:15 | Back home + close | "Same content, both surfaces. Built for the Fire TV track." | BACK (Esc/Backspace on web, remote BACK on device) returns home from anywhere; the focus lands on the tile you left |

Notes
- Do not claim device features you did not test (emulator, Fire TV Stick model, voice).
- Keep captions on, large text is part of the design story.
