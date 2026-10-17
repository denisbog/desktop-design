# PrintCraft design demo — UI components

This document describes **every visible UI component** of the demo in
`../index.html`, what it does, how it is implemented, and which part of the real
PrintCraft codebase it re-creates.

The demo is a static, runnable re-creation of the PrintCraft shell
(`crates/ui-egui`). It has no PDF engine: the catalogue, commands, document and
annotations come from `js/data.js`.

```
index.html          app shell + four mount points
css/tokens.css      design tokens (light/dark) — ported from theme.rs
css/app.css         every component style, one block per component
js/icons.js         Lucide icons embedded from assets/icons (183 icons)
js/data.js          tool catalogue, commands, the 13-page specimen, comments…
js/app.js           state, one renderer per component, actions, shortcuts
```

---

## Contents

| # | Component | Renderer (`js/app.js`) | PrintCraft source |
|---|---|---|---|
| UI-01 | Layout grammar / app shell | `renderAll` | `lib.rs` `eframe::App::ui` |
| UI-02 | Design tokens & theming | `theme.toggle` | `theme.rs` `Tokens::for_kind` |
| UI-03 | Title & tab strip | `renderTabstrip` | `chrome.rs` `tab_strip`, `tab` |
| UI-04 | Mode bar | `renderModebar` | `chrome.rs` `mode_bar` |
| UI-05 | Popup menus | `renderOverlays`, `mainMenu`, `viewMenu` | `chrome.rs` `main_menu`, `commands::registry_menu` |
| UI-06 | Left tool panel — All tools | `renderLeft`, `allTools` | `panels.rs` `left_panel`, `all_tools`, `tool_row` |
| UI-07 | Left tool panel — tool page | `toolDetail` | `panels.rs` `tool_detail`, `stamp_palette`, `format_section` |
| UI-08 | Right rail | `renderRail` | `chrome.rs` `right_rail` |
| UI-09 | Right side panel (frame) | `renderRight` | `panels.rs` `right_panel` |
| UI-10 | Comments panel | `commentsPanel` | `comments_panel.rs` `show` |
| UI-11 | Bookmarks panel | `bookmarksPanel` | `panels.rs` (Bookmarks) |
| UI-12 | Pages panel | `pagesPanel` | `panels.rs` (Pages) |
| UI-13 | Fields / Layers / Attachments / Signatures | `fieldsPanel`… | `panels.rs`, `forms_ui.rs`, `sign_ui.rs` |
| UI-14 | Advanced Search panel | `searchPanel` | `search_ui.rs` `panel` |
| UI-15 | Document area | `renderDoc` | `canvas.rs` `document_area` |
| UI-16 | Notice bar | `noticeHtml` | `canvas.rs` `notices` |
| UI-17 | Quick-action bar | `quickbarHtml` | `canvas.rs` `quick_bar` |
| UI-18 | Find bar | `findbarHtml` | `canvas.rs` `find_bar` |
| UI-19 | Organize pages | `organizeHtml` | `canvas.rs` `organize_grid` |
| UI-20 | Home tab | `homeHtml` | `home.rs` `show` |
| UI-21 | Command palette (⌘K) | `paletteHtml` | `palette.rs` `show` |
| UI-22 | Dialogs | `dialogHtml` | `dialogs.rs` (`egui::Modal`) |
| UI-23 | Toast | `toast` | `widgets.rs` `toast` |
| UI-24 | Tooltips | delegated `mouseover` | `widgets.rs`, `icons.rs` |
| UI-25 | Shared controls (icon/ghost/pill/field) | `iconBtn`, `ghostBtn`, `pill` | `widgets.rs`, `icons.rs` `button` |
| UI-26 | Panel resize handle | boot + `mousemove` | `panels.rs` `.resizable(true)` |

Interactive behaviour is listed per component under **Functionality**. Keyboard
shortcuts are collected in [§27](#27-keyboard-map).

---

## UI-01 · Layout grammar / app shell

**File** `index.html`, `js/app.js` (`renderAll`) · **Source** `lib.rs` `eframe::App::ui`

Four stacked bands reproduce the egui panel order exactly:

```
┌──────────────────────────────────────────────────────────────┐
│ tab strip (38 px, --titlebar)                                │  UI-03
├──────────────────────────────────────────────────────────────┤
│ mode bar (48 px, --chrome)                                   │  UI-04
├───────────┬───────────────────────────────────┬─────────┬────┤
│ left tool │ document area                     │ side    │rail│  UI-06/07
│ panel     │ (--pasteboard, pages on it)       │ panel   │    │  UI-15
│ 272 px    │                                   │ 330 px  │48px│  UI-08/09
└───────────┴───────────────────────────────────┴─────────┴────┘
```

**Functionality** — `.workspace` is a flex row (`min-height:0` so children
scroll); the document area flexes, the panels are fixed (`--left-w`,
`--right-w`, `--rail-w`). Overlays (menus, palette, dialogs, toast, tooltips)
live outside the workspace in `#overlays` so they never affect layout.

---

## UI-02 · Design tokens & theming

**File** `css/tokens.css` · **Source** `theme.rs` `Tokens::for_kind`, `apply`

Every colour, radius, panel size and font is a CSS custom property on
`[data-theme="light"]` / `[data-theme="dark"]`. Components never use literals, so
one attribute flips the whole app.

| Token | Light | Dark | Used by |
|---|---|---|---|
| `--titlebar` | `#E9E9EB` | `#1B1B1E` | tab strip |
| `--chrome` | `#FFFFFF` | `#26262A` | mode bar, rail |
| `--panel` | `#FFFFFF` | `#26262A` | side panels |
| `--pasteboard` | `#F1F1F3` | `#19191C` | behind pages |
| `--card` | `#FFFFFF` | `#2E2E33` | cards, floating bars, menus |
| `--border` / `--divider` | `#DADADE` / `#E8E8EB` | `#3C3C43` / `#333339` | outlines, separators |
| `--text` / `--text-muted` / `--text-faint` | `#222226` / `#5E5E66` / `#6B6B73` | `#ECECEF` / `#AEAEB6` / `#97979E` | three text weights |
| `--icon` | `#44444B` | `#D4D4DA` | icon tint |
| `--hover` / `--pressed` / `--selected` | `#F0F0F3` / `#E4E4E9` / `#E6EEFD` | `#34343A` / `#3E3E45` / `#233A63` | interaction states |
| `--accent` / `--accent-text` / `--accent-soft` | `#1B63E0` / `#1755C4` / `#E3ECFD` | `#4B8BF5` / `#8CB6FA` / `#243657` | the one accent |
| `--field` | `#FFFFFF` | `#1E1E22` | inputs |
| `--badge-new` | `#1B63E0` | `#3D7DEE` | "Optional" badge |

Geometry: `--radius:6px` (`tokens.radius`), tab strip 38, mode bar 48, rail 48,
left panel 272, right panel 330 (resizable 260–520). Typography: Inter for the
UI, JetBrains Mono for keys/code, Body 13, Small 11, Heading 17 — the same three
styles `theme.rs` installs. Text/faint colours meet WCAG AA (4.5:1) on every
surface, as `theme.rs` asserts in its test.

**Functionality** — the moon/sun button in the tab strip toggles the theme; the
View ▸ Display theme menu offers *Use system setting*, *Light gray*, *Dark gray*.
Both set `document.documentElement.dataset.theme`.

---

## UI-03 · Title & tab strip

**File** `js/app.js` `renderTabstrip` · **CSS** `.tabstrip`, `.tab*` · **Source** `chrome.rs` `tab_strip`

**Functionality**

- **Home button** (`house`) — returns to the Home tab (`state.view = "home"`).
  Highlighted while Home is shown, exactly like `app.active = None` in PrintCraft.
- **Document tab** — one per open file: file icon (accent when active), name
  truncated to 28 characters, close button. Hovering shows the full name.
  - **Dirty dot**: an unsaved document shows a dot where the close button sits;
    hovering swaps it for the ✕ (`tab()` in `chrome.rs`).
- **＋ Open** — opens the file dialog (⌘O).
- **Theme toggle** — moon/sun (UI-02).
- **Keyboard shortcuts** (`circle-help`) — opens the shortcuts dialog.
- **Discord** — community link with the server URL as tooltip.

Double-clicking the strip is the window-drag region in PrintCraft; the demo has
no OS window, so this is omitted.

---

## UI-04 · Mode bar

**File** `js/app.js` `renderModebar` · **CSS** `.modebar`, `.mode-tab`, `.searchbox` · **Source** `chrome.rs` `mode_bar`

**Functionality**

- **Menu** — opens the main menu (UI-05).
- **Mode tabs** — `All tools · Read · Edit · Convert · E-Sign`. The active tab is
  semibold with a 2.5 px underline (`widgets::mode_tab`). Selecting a mode
  re-targets the left panel: Edit ▸ *Edit a PDF*, Convert ▸ *Export a PDF*,
  E-Sign ▸ *Fill & Sign*; **Read** hides both side panels for distraction-free
  reading.
- **Print / Save / Document properties** — icon buttons, disabled while the Home
  tab is showing (`ui.add_enabled_ui(has_doc, …)`).
- **Find tools and commands** — a field-shaped button that opens the ⌘K command
  palette; the trailing `⌘K` is the shortcut hint.

---

## UI-05 · Popup menus

**File** `js/app.js` `mainMenu`, `viewMenu`, `menuHtml`, `SUBS` · **CSS** `.menu*` · **Source** `chrome.rs` `main_menu`, `commands::registry_menu`

**Functionality**

- Five top-level menus: **File, Edit, Pages, View, Help**, each a click-to-open
  submenu; a second-level menu opens beside it (the stack in `state.menuStack`).
- Item kinds: **command** (icon, label, right-aligned shortcut), **separator**,
  **section label**, **radio** (check mark + label), and **submenu** (`›`).
- **View** carries the long form of the zoom/page-display logic: Actual size,
  Zoom to page level, Fit to width, Zoom in/out; Page display (Continuous /
  Two-page / Single); Display theme; Side panels (one radio per panel).
- Clicking a command runs it through `runCommand`; clicking outside closes the
  menu; `Esc` closes it.

---

## UI-06 · Left tool panel — All tools

**File** `js/app.js` `renderLeft`, `allTools` · **CSS** `.panel-left`, `.tool-row`, `.badge` · **Source** `panels.rs` `left_panel`, `all_tools`, `tool_row`

**Functionality**

- Panel header: title **All tools** and a close ✕ (`left_open`).
- **Tool list** — the 22 groups of the engine catalogue (`catalog.rs`
  `TOOL_GROUPS`), each row: a hue-tinted icon (Acrobat colour-codes tool
  families), the label, and
  - a blue **badge** when the group has one (*AI assistant → Optional*),
  - a quiet **“Planned · M⁶…”** hint on hover for groups that are not ready.
- Tooltips state availability: *Available* / *Planned for milestone M…* /
  *Optional: needs an AI provider you configure*.
- **View more / View less** — expands from the first 14 groups to all 22
  (`COLLAPSED_TOOLS`).
- Clicking a row opens that tool page (UI-07).

---

## UI-07 · Left tool panel — tool page

**File** `js/app.js` `toolDetail` · **CSS** `.tool-item`, `.chip`, `.callout`, `.panel-footer` · **Source** `panels.rs` `tool_detail`, `stamp_palette`, `format_section`

**Functionality**

- Header with a **back** chevron (returns to All tools and resets the mode) and
  the ✕ close button.
- **Planned callout** — for a group that is not ready, an accent-soft banner
  naming the milestone.
- **Sections and items** — every item row shows the tool hue (ready) or faint
  icon (planned), the label, and a chip: `Ready` (green) / `M…` / `AI`. The
  tooltip is the *command id* the item will dispatch, mirroring the real
  behaviour where every item carries its command.
- **Special pages** (as in PrintCraft):
  - *Prepare a form* → **Preview / Edit fields** toggle.
  - *Add a stamp* → the stamp palette (Dynamic, Sign Here, Standard Business)
    with the colour-coded stamp chips; picking one arms the stamp tool.
  - *Edit a PDF* → **Format text** icon row (bold, italic, alignment, lists).
  - *Redact a PDF* → a footer with the marks count plus **Clear all** and
    **Redact all** (primary pill).
- Clicking an item runs its command: page operations, panel switches, tool
  arming, or a demo toast.

---

## UI-08 · Right rail

**File** `js/app.js` `renderRail` · **CSS** `.rail*` · **Source** `chrome.rs` `right_rail`

**Functionality**

- **Panel buttons**: Comments, Bookmarks, Page thumbnails, Form fields, Layers,
  Attachments, Signatures. A panel that has content shows a small **accent dot**
  when not selected; the selected panel gets the accent wash.
- **Page-navigation cluster** (bottom, added bottom-up as in Acrobat):
  zoom out, zoom in, rotate view clockwise, fit-page/fit-width toggle, the zoom
  percentage, next/previous page, the page count, and a **page input** that
  accepts a number *or* the document's own label (`iv`, `Cover`) and jumps on
  Enter.
- The rail is hidden on the Home tab, matching `if self.active.is_some()`.

---

## UI-09 · Right side panel (frame)

**File** `js/app.js` `renderRight`, `PANEL_TITLES` · **CSS** `.panel-right`, `.panel-header` · **Source** `panels.rs` `right_panel`

**Functionality** — a consistent frame for every side panel: title with a
muted **count** for Comments/Bookmarks/Pages, a close ✕, and a scrolling body.
Only one panel is open at a time (`state.right`); toggling the rail button
closes it. The panel is hidden in Read mode. A **4 px resize handle** (UI-26)
sits between the document area and the rail.

---

## UI-10 · Comments panel

**File** `js/app.js` `commentsPanel`, `commentCardsHtml` · **CSS** `.comment-card`, `.avatar`, `.status-badge`, `.reply-box` · **Source** `comments_panel.rs` `show`

**Functionality**

- **Search comments** — filters on author, body and tool type as you type; the
  list re-renders without stealing focus.
- **Add a comment** — typing and pressing **Enter** pins a sticky note on the
  current page (new card, newest first) and toasts the page label.
- **Cards grouped by page** — a `Page <label>` divider before the first card of
  each page, using the document's own page labels.
- Each card: author avatar with initials, name, relative time, body, the
  annotation **type** (Note, Highlight, Text box, Rectangle, Oval …), a
  **status badge** (*Resolved*, *Marked*) when set, and — when selected —
  *Show on page*, the reply thread and a **reply box**.
- **Selection** — clicking a card selects it, draws the `#0165DD` accent bar
  (`comments_panel.rs` `CARD_ACCENT`), and navigates to the comment's page.
- Status replies render as a `Marked` badge (the “latest checkmark reply” rule,
  `is_marked`).

---

## UI-11 · Bookmarks panel

**File** `js/app.js` `bookmarksPanel` · **CSS** `.tree-row` · **Source** `panels.rs` (Bookmarks)

**Functionality** — the document outline as a tree: chevron twisty for parents
(expanded state in `state.openBookmarks`), bookmark icon, title, and the
document's **page label** (`Cover`, `i`, `1`…). Clicking a row jumps to that
page; clicking the twisty only expands/collapses.

---

## UI-12 · Pages panel

**File** `js/app.js` `pagesPanel` · **CSS** `.thumb-grid`, `.thumb*` · **Source** `panels.rs` (Pages)

**Functionality** — a two-column grid of page thumbnails with the page label and
chapter name; the current page is outlined in the accent. Clicking a thumbnail
navigates. (PrintCraft requests real rasters from the render pool; the demo
draws a placeholder page icon.)

---

## UI-13 · Fields, Layers, Attachments, Signatures

**Files** `js/app.js` `fieldsPanel`, `layersPanel`, `attachmentsPanel`, `signaturesPanel` · **Source** `panels.rs`, `forms_ui.rs`, `sign_ui.rs`

- **Fields** — one row per form field: label, `name · kind` sub-line, the current
  value, and a `*` for required fields. Clicking jumps to the field's page.
- **Layers** — optional-content groups with two toggles: **eye** (visibility,
  dims the name) and **lock**. Both mutate local state and re-render.
- **Attachments** — file rows with name, size and description plus a save icon;
  clicking toasts the file name.
- **Signatures** — a validity card (signer, time, issuer, signing reason) and a
  **Show certificate** pill.

---

## UI-14 · Advanced Search panel

**File** `js/app.js` `searchPanel` · **CSS** `.result`, `.result__page` · **Source** `search_ui.rs` `panel`

**Functionality** — the side-panel form of Find (Edit ▸ Advanced Search, ⇧⌘F):
the question line, a search input, **Whole words only** and **Case-sensitive**
check boxes, an `N instances` status, and results grouped by page. Each result
shows ~36 characters of context on each side with the hit in a yellow
highlight (`TextFormat.background`), and the current result is selected.
Clicking a result jumps to it and keeps the find bar's match index in sync.

---

## UI-15 · Document area

**File** `js/app.js` `renderDoc`, `D.pageBody` · **CSS** `.docarea`, `.pages`, `.page` · **Source** `canvas.rs` `document_area`

**Functionality**

- The pasteboard (`--pasteboard`) holds white **page cards** with a soft shadow;
  the current page carries an accent outline.
- Pages render as real typographic content — the 13-page *PrintCraft Showcase*
  specimen: cover with swatches, foreword with a drop cap and pull quote, a
  contents page, a chapter with a code listing and a gradient figure, a
  twelve-script specimen, and so on.
- **Zoom** — the page stack uses `zoom: var(--zoom)`, driven by `state.zoom`
  (0.25–3.0). All zoom entry points (rail, ⌘+/⌘−, ⌘1/⌘0/⌘2, View menu, pinch) go
  through `setZoom`, so the rail readout, the menu radios and the pages stay in
  agreement.
- **Page navigation** — `goPage` clamps, re-renders the rail and panels, and
  smooth-scrolls the target page into view.
- The quick-action bar and find bar float over this area, as in PrintCraft
  (`Order::Middle` areas anchored to the document rect).

---

## UI-16 · Notice bar

**File** `js/app.js` `noticeHtml` · **CSS** `.notice` · **Source** `canvas.rs` `notices`

**Functionality** — the accent-soft band above the pages, in PrintCraft's
priority order: signature status first, then security, forms and repairs. The
demo shows the signature bar (“Signed by Sam Whitfield — signature is valid and
the document has not changed since signing.”) with a **Signature panel** pill
that opens the Signatures panel, and a ✕ that dismisses the bar for the session.

---

## UI-17 · Quick-action bar

**File** `js/app.js` `quickbarHtml`, `openToolFlyout` · **CSS** `.quickbar*` · **Source** `canvas.rs` `quick_bar`

**Functionality** — the floating vertical strip at the top-left of the pages,
grouped exactly as Acrobat/PrintCraft group it:

1. **Select** (V) and **Hand** (H) — single tools; the hand turns drag-scrolling
   on in PrintCraft.
2. **Comment**, **Highlight**, **Draw** — tool *groups*. The button shows the
   group's last-used tool; clicking it selects that tool, clicking again opens
   the **flyout** with every tool in the group (a check marks the current one).
   Right-click opens the flyout directly. A corner triangle marks a group.
3. **Fill & Sign** — same behaviour with the eight fill tools (text, checkmark,
   cross, dot, line, date, signature, initials).
4. A separator, then the single tools: Crop, Redact, Edit text & images,
   Add text, Link, Digitally sign, Marquee zoom, Take a snapshot.

Selecting a tool highlights it with the accent wash; each button carries its
name (and shortcut) as a tooltip.

---

## UI-18 · Find bar

**File** `js/app.js` `findbarHtml`, `renderFindStatus` · **CSS** `.findbar` · **Source** `canvas.rs` `find_bar`

**Functionality** — the floating card at the top-right of the pages: a search
icon, the query field (focused on open), the **match status**
(`10 of 16`, `Searching… n/m`, `No matches`), previous/next buttons
(⇧⌘G / ⌘G), a **settings** button whose popup holds *Whole words only* and
*Case-sensitive*, and ✕ to close (also `Esc`). Typing updates only the status
line, so the field keeps focus.

---

## UI-19 · Organize pages

**File** `js/app.js` `organizeHtml` · **CSS** `.organize*` · **Source** `canvas.rs` `organize_grid`

**Functionality** — opened from the left panel (Organize pages → Page grid),
the Pages ▸ Organize Pages menu, or ⌘K. Shows every page as a numbered tile in
a flow grid with its label and chapter name.

- **Selection** — click selects one; ⇧/⌘/Ctrl-click extends/reduces the set.
- **Toolbar** — back to the document, then Rotate, Delete, Extract, Insert,
  Duplicate, Select all, the selection count, and Save / Cancel pills. Actions
  require a selection and toast the outcome (Delete also clears the selection).
- The page label under each tile mirrors the document's own page labels.

---

## UI-20 · Home tab

**File** `js/app.js` `homeHtml` · **CSS** `.home`, `.card`, `.tile`, `.recent-row` · **Source** `home.rs` `show`

**Functionality** — shown by the home button in the tab strip:

- **Welcome** heading and the one-line description.
- **Community card** — the ArtCraft mark, Discord invite text, and primary /
  secondary link pills (Discord, Website, Documentation).
- **Recommended tools** — the five tools PrintCraft recommends (`organize`,
  `comment`, `form`, `edit`, `protect`) as 190×104 tiles: hue-tinted icon, name,
  the first three item labels as a blurb, and a *Use now* call to action; plus
  an **Open file** tile. Clicking a tile opens that tool page.
- **Recent** — file rows with name, path, page count and size (local only, as
  PrintCraft stresses).
- **Privacy** — the offline / no-telemetry statement.

---

## UI-21 · Command palette (⌘K)

**File** `js/app.js` `paletteHtml`, `paletteHits`, `score` · **CSS** `.palette*`, `.scrim` · **Source** `palette.rs` `show`

**Functionality** — the centered overlay over a scrim, 560 px wide and 96 px
from the top.

- The input is auto-focused; typing filters with a substring first, then a
  subsequence fallback (`score`). Results mix **registered commands** (with
  their shortcut as the detail) and **tool-catalogue entries** (with the group
  name as the detail). Ready entries sort before planned ones; planned entries
  are dimmed.
- Twelve results maximum; **↑/↓** move the selection, **Enter** runs the top hit,
  clicking a row runs it directly, **Esc** or the scrim closes.
- Running a command either performs it or opens the corresponding tool page /
  side panel.

---

## UI-22 · Dialogs

**File** `js/app.js` `dialogHtml` · **CSS** `.modal*`, `.scrim` · **Source** `dialogs.rs` (`egui::Modal`)

**Functionality** — a centered modal (520 px, or 640 px for Properties/Print)
over a scrim, with a title, body and a right-aligned footer of pills.

| Dialog | Opened by | Contents |
|---|---|---|
| **Keyboard shortcuts** | `circle-help`, Help ▸ Keyboard Shortcuts | the shortcut table (monospace keys + description) |
| **About PrintCraft** | Help ▸ About | mark, name, version, licence, engine/UI/icon/font credits |
| **Document Properties** | ⌘D, mode bar ⓘ | five **tabs** (Description, Initial View, Security, Fonts, Advanced) and a two-column label/value grid |
| **Preferences** | ⌘, | identity, comment colour, follow-system-theme, autosave, updates |
| **Print** | ⌘P | printer, pages, copies, page size, orientation, comments |
| **Save As** | ⇧⌘S | file name, folder, format, incremental-save note |
| **Revert** | File ▸ Revert | destructive confirmation |
| **Find options** | find bar ⚙ | whole words / case-sensitive |
| **Open / Protect / generic** | many commands | informational body with a Close pill |

Confirm-style dialogs use `dialog.confirm` to close and toast their outcome.

---

## UI-23 · Toast

**File** `js/app.js` `toast` · **CSS** `.toast` · **Source** `widgets.rs` `toast`

**Functionality** — a transient message at the bottom centre (dark pill in the
light theme, light pill in the dark theme, matching `widgets.rs`). One toast at a
time; it replaces the previous and auto-dismisses after 3.5 s. `toast()` is the
demo's honest feedback channel for commands that have no engine behind them.

---

## UI-24 · Tooltips

**File** `js/app.js` delegated `mouseover`/`mouseout` · **CSS** `.tooltip` · **Source** `widgets.rs` (`tooltip_delay = 0.35`)

**Functionality** — any element with `data-tip` shows a small dark tooltip after
350 ms, positioned below it and clamped to the viewport; it disappears on
mouse-out. Shortcut hints are included in the tip text (e.g. *Zoom in (⌘+)*), as
in PrintCraft.

---

## UI-25 · Shared controls

**File** `js/app.js` `iconBtn`, `ghostBtn`, `pill`, `.field` · **CSS** *Shared controls* · **Source** `widgets.rs`, `icons.rs` `button`

| Control | Behaviour |
|---|---|
| `.icon-btn` | square icon button; transparent → `--hover` → `--pressed`; `.is-selected` gets the accent-soft wash and accent icon |
| `.ghost-btn` | icon + label; transparent until hovered (Menu, Open, Discord) |
| `.pill` | rounded pill; `.is-primary` filled with the accent; `disabled` at 40 % opacity |
| `.field` | rounded input (`--field`, `--border`); squarer variant for panel inputs |
| `.section-title` | uppercase, letterspaced, faint section label |
| `.badge` / `.chip` | blue "new/optional" badge and availability chips (`Ready` green, milestone, `AI`) |
| `.avatar` | initials disc for comment authors |
| `.divider-v` | 1 px vertical separator (mode bar, organize toolbar) |

---

## UI-26 · Panel resize handle

**File** `js/app.js` (`mousedown/mousemove/mouseup`) · **CSS** `.panel-resize` · **Source** `panels.rs` `.resizable(true).size_range(260.0..=520.0)`

**Functionality** — the 4 px strip between the document area and the rail turns
into a `col-resize` cursor; dragging sets `state.rightWidth`, clamped to
260–520 px, which is applied to the right panel.

---

## 27 · Keyboard map

Implemented in `js/app.js` (§5). The full list is also shown in the in-app
Keyboard shortcuts dialog.

| Keys | Action |
|---|---|
| ⌘K | Command palette |
| ⌘F / ⇧⌘F | Find bar / Advanced Search panel |
| ⌘G / ⇧⌘G | Next / previous match |
| ⌘S / ⇧⌘S | Save / Save As |
| ⌘O, ⌘P | Open, Print |
| ⌘D, ⌘, | Document Properties, Preferences |
| ⌘1 / ⌘0 / ⌘2 | Actual size / fit page / fit width |
| ⌘+ / ⌘− | Zoom in / out |
| ⌘L | Full screen (reported) |
| ⌘← / ⌘→, Home / End | Page navigation |
| V, H | Select, Hand |
| Esc | Close dialog / menu / palette / find, else Select tool |

---

## 28 · Fidelity notes

- **Faithful**: tokens (exact hex values from `theme.rs`), panel geometry, mode
  bar and rail composition, the 22-group tool catalogue with hue, badge and
  availability, quick-bar grouping with flyouts, comment card anatomy and its
  `#0165DD` selection bar, floating find bar and quick bar, notice bar priority,
  home-tab content, and the Lucide icon set (the same 183 SVGs).
- **Simplified**: pages are DOM-rendered specimen content, not rasterised by an
  engine; the quick bar does not draw on pages; zoom uses CSS `zoom`; dialogs
  are informational; no persistence, no file system, no rendering pool, no undo
  history.
- **Omitted deliberately**: OS window integration (drag region, traffic lights),
  the ArtCraft trademark logo (the demo uses a neutral mark), i18n, and the
  automation/control API.
- **Fonts**: Inter, JetBrains Mono and Dancing Script are not bundled here. The
  CSS asks for them by name and falls back to the system UI/monospace/serif
  stacks, so the metrics shift slightly when they are not installed. Drop the
  OFL TTFs from `assets/fonts/` next to the demo and add `@font-face` rules to
  match PrintCraft 1:1.
- **Credits**: icons are Lucide (ISC). The demo contains no ArtCraft brand
  assets or trademark.
