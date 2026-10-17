# PrintCraft — design demo

A minimal, **runnable** re-creation of the PrintCraft UI as a static web app:
HTML, CSS and vanilla JavaScript, no build step and no dependencies.

PrintCraft (`github.com/storytold/printcraft`) is an open-source PDF workbench
written in Rust with an `egui` shell. This demo follows that shell's **look and
feel** — its design tokens, panel grammar and every major component — so the
interface can be reviewed, prototyped against and demonstrated without building
the Rust app. It covers all major elements on realistic data: a 13-page specimen
document with comments, bookmarks, form fields, layers, attachments and a
signature.

> This is a **design demo only**. There is no PDF engine: pages are rendered as
> DOM typography, dialogs are informational, and file operations report through
> toasts. No ArtCraft brand assets or trademarks are included.

## Run it

No toolchain needed. Either open the file directly:

```bash
xdg-open index.html      # macOS: open index.html
```

or serve it (recommended, so relative paths and fonts behave exactly as in a
browser):

```bash
python3 -m http.server 8000
# then open http://localhost:8000/
```

Any static server works (`npx serve`, `caddy file-server`, …).

## What to try

| Try this | See |
|---|---|
| ☾ / ☀ in the tab strip, or **View ▸ Display theme** | Light and dark token sets |
| **Menu ▸ File / Edit / Pages / View / Help** | Popup menus, nested submenus, radio items |
| **All tools** list → click a tool, then **View more** | Tool pages, sections, availability chips |
| Click the orange **comment group** in the quick bar twice | Tool flyout with the current tool checked |
| **Organize pages** (quick bar / left panel / ⌘K) | Page grid, multi-select, page toolbar |
| Rail icons on the right | Comments, Bookmarks, Pages, Fields, Layers, Attachments, Signatures, Search |
| Drag the strip left of the rail | Resizable side panel |
| **⌘K**, type “type” or “organize” | Command palette over commands *and* tools |
| **⌘F**, type “type” | Find bar with `10 of 16`, ⊕/⊖ stepping, options |
| The ✕ on the notice bar, then the rail’s comment icon | Notice bar and comment panel |
| Home button in the tab strip | Home tab: recommended tools, recent files |
| **⌘D** / **ⓘ** / **Help ▸ About** | Dialogs with tabs, grids and footers |

## Files

```
index.html               app shell: tab strip · mode bar · workspace · overlays
css/tokens.css           design tokens, light + dark (ported from theme.rs)
css/app.css              every component style, one block per component
js/icons.js              183 Lucide icons embedded from PrintCraft assets/icons
js/data.js               22-group tool catalogue, commands, showcase document, comments…
js/app.js                state · one renderer per component · actions · shortcuts
docs/UI-COMPONENTS.md    documentation of every UI component and its functionality
```

### Architecture in one paragraph

`js/app.js` keeps the whole UI in one `state` object and renders each component
from it (`renderTabstrip`, `renderModebar`, `renderLeft`, `renderDoc`,
`renderRight`, `renderRail`, `renderOverlays`). Clicks and inputs are handled by
two delegated listeners on `document`, keyed by `data-act` / `data-model`
attributes, so re-rendering a region never leaves stale handlers behind. All
colours and sizes come from `css/tokens.css`, so a component never hard-codes a
value. `window.PC` exposes `{ state, runCommand, renderAll }` for scripting and
tests.

## Fidelity

**Ported 1:1 from the Rust source**

- the design tokens in `crates/ui-egui/src/theme.rs` (`Tokens::for_kind`) —
  exact hex values, radius 6, the three text styles;
- the panel grammar of `lib.rs` (`eframe::App::ui`): tab strip 38 px, mode bar
  48 px, rail 48 px, tool panel 272 px, side panel 330 px (resizable 260–520);
- the 22-group tool catalogue of `crates/engine/src/catalog.rs`, with each
  group's icon, hue, badge, sections, items, command ids and availability
  (Ready / milestone / provider);
- component behaviour from `chrome.rs`, `panels.rs`, `canvas.rs`,
  `comments_panel.rs`, `home.rs`, `palette.rs`, `search_ui.rs`, `dialogs.rs` and
  `widgets.rs` — documented per component in `docs/UI-COMPONENTS.md`;
- the Lucide icon set (the same SVG files that PrintCraft embeds).

**Simplified for a static demo**

- pages are HTML/CSS specimen content rather than engine rasters; zoom uses CSS
  `zoom`; the quick bar does not draw annotations onto pages;
- dialogs and file operations are informational (they toast, or show static
  content);
- no persistence, file system, undo history, automation API, i18n or OS-window
  integration.

**Fonts** — PrintCraft bundles Inter, JetBrains Mono and Dancing Script
(`assets/fonts`, OFL). They are not vendored here; the CSS requests them by name
and falls back to system UI/mono/serif fonts. To match PrintCraft exactly, copy
the TTFs next to the demo and add the corresponding `@font-face` rules in
`css/tokens.css`.

## Documentation

`docs/UI-COMPONENTS.md` documents every component (UI-01 … UI-26) with its
purpose, states, interactions, the tokens it uses, the PrintCraft source it
re-creates, and the demo file/renderer that implements it. It closes with the
keyboard map and the fidelity notes above.

## Credits and licence

- Interface design and behaviour re-created from **PrintCraft** by the ArtCraft
  community (MIT OR Apache-2.0). This demo is an independent, clean-room
  re-creation for design review.
- Icons: **Lucide** (ISC).
- The ArtCraft name and logos are trademarks of the ArtCraft Team and are **not**
  used here.
