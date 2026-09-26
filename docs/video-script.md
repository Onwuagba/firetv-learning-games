# Demo video script (target 3:00)

TODO-verify: the hackathon's video length limit and required elements on the submission page.
Record from the Fire TV emulator or device if you have one; otherwise the web target (`npm run app:web`, 1920x1080 window, keyboard as the remote) and **say so**. Native has NOT been run. Fresh start: clear site data so the Welcome screen shows. Every beat below has a matching screenshot from `npm run screenshots`.

| Time | Screen (shot) | Voiceover | Action |
|---|---|---|---|
| 0:00 | Title card | "Kids learn best where the family already is: the living room TV. Learn and Play turns the Fire TV remote into a learning toy." | Logo, one line pitch |
| 0:12 | Welcome, new player (01-03) | "Every child gets their own profile. No system keyboard, just the D-pad." | OK on Add player, type "Ada" on the on-screen keyboard, Done |
| 0:30 | Home (04, 05) | "Home is built from the curriculum: a tile per topic, a daily challenge, streak and stars." | Move focus across tiles: spring lift and glow. Point at the hero scene and the Daily banner |
| 0:45 | Abacus (07, 10, 12) | "Left and right pick a rod, up and down slide beads, OK checks. Two right in a row and you level up." | Build a number, get it right twice, confetti and "Level up!". Next round shows target mode: "Make 3" |
| 1:15 | Balance scales (15, 16, 18) | "The scale never solves itself. You set x, watch the beam tilt, and press Check." | Up twice, beam eases, OK on a wrong x: "Not balanced yet", then the right x: green beam, "Balanced!" |
| 1:45 | Map quiz (19-24) | "Region focus and zoom. Capitals, continents, a highlighted country, or a flag." | Zoom button cycles World, Region, Close-up. Wrong answer auto-zooms to the answer. Flag question |
| 2:10 | Results, daily, progress (28-30) | "Every round ends with stars. The daily challenge mixes all topics. Badges, streaks and a level map keep kids coming back." | Finish the daily challenge, show stars and new badges, open My progress, then Level map |
| 2:35 | Parent gate, settings (31-34) | "Settings sit behind a grown-up math gate. Progress is saved on the TV first and syncs when the coach is reachable. Motion can be reduced." | Solve the gate, show sync state, coach server keyboard, Reduced motion On |
| 2:50 | Coach link, close | "Practise by voice with the Alexa+ Learning Coach and it shows up here." | Split screen: TV app with `EXPO_PUBLIC_COACH_URL`, run `python scripts/demo_tv.py --child ada --answers 2` in the coach repo (stands in for Alexa+, say so unless you have real Alexa+ footage). Level flips within 8 s. End card |

Notes
- Do not claim device features you did not test (emulator, Fire TV Stick model, audio on device, voice).
- If you can hear audio in the recording, say the sounds and music are synthesised and can be muted (speaker button on Home, or Settings).
- Keep captions on: large type is part of the design story.
- The two `coach-sync-*-legacy-ui.png` shots are from the old UI; do not use them as current visuals.
