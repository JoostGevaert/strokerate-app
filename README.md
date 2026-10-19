# strokerate-app
Offline, (ad-)free on-water rowing computer for your phone: stroke rate, split and more

## Design mock-ups

`site/` holds a static mock-up of the on-water screen: five layouts and six colour themes with simulated numbers. Open `site/index.html` in a browser, or see it at https://strokerate.app once GitHub Pages is set up. Link to a specific combination with a hash, e.g. `#four-daylight` or `#classic-night-orange`.

Pushes to `main` that touch `site/` deploy it via `.github/workflows/pages.yml`. Installed copies update themselves: the service worker (`site/sw.js`) loads the page from the network whenever the phone is online, so the first launch after a deploy shows the new version, and falls back to its cached copy when offline. Nothing needs bumping for a release.

## Working with Claude Code

`.claude/settings.json` enables [Matt Pocock's skills](https://github.com/mattpocock/skills) plugin (`mattpocock-skills` from the official Claude plugin marketplace). Claude Code offers to install it when you trust this folder. Run `/setup-matt-pocock-skills` once to tell it which issue tracker and labels to use.
