/* ============================================================================
   PrintCraft design demo — application shell.

   Vanilla JS, no build step, no backend. The file is organised as:
     1. state          — one plain object holding the whole UI state
     2. helpers        — icon/escape/geometry utilities
     3. renderers      — one function per component (renderTabstrip, …)
     4. actions        — runCommand + the delegated click/input handlers
     5. shortcuts      — the keyboard map
     6. boot           — first paint

   Component ↔ renderer map (see docs/UI-COMPONENTS.md):
     UI-01 tab strip      renderTabstrip      UI-09 right panel   renderRight
     UI-02 mode bar       renderModebar       UI-10 home tab      renderDoc
     UI-03 left panel     renderLeft          UI-11 menus         renderOverlays
     UI-04 rail           renderRail          UI-12 palette       renderOverlays
     UI-05 document area  renderDoc           UI-13 dialogs       renderOverlays
     UI-06 notice bar     renderDoc           UI-14 toast/tooltip renderOverlays
     UI-07 quick bar      renderDoc           UI-15 resize handle renderRight
     UI-08 find bar       renderDoc
   ========================================================================== */
(() => {
  "use strict";

  const D = window.PC_DATA;
  const ICONS = window.PC_ICONS;

  /* ── 1. State ───────────────────────────────────────────────────────────── */
  const state = {
    theme: "light",
    view: "doc",                                  // "home" | "doc"
    tabs: [
      { id: "showcase", name: "PrintCraft-Showcase.pdf", dirty: true },
      { id: "w9", name: "Form-W9-filled.pdf", dirty: false },
    ],
    activeTab: "showcase",
    mode: "All tools",                            // Acrobat mode bar
    left: { kind: "all" },                        // {kind:"all"} | {kind:"tool", id}
    leftOpen: true,
    allToolsExpanded: false,
    right: null,                                  // null | comments | bookmarks | …
    rightWidth: 330,
    quickTool: { kind: "select" },                // select | hand | comment | fill | <tool id>
    commentGroupTool: ["note", "highlight", "ink"],
    fillTool: null,
    zoom: 0.85,
    current: 3,                                   // page index
    organize: false,
    selectedPages: new Set(),
    findOpen: false,
    findQuery: "",
    findIndex: 9,                                 // 0-based → “10 of 16”
    findCase: false,
    findWords: false,
    paletteOpen: false,
    paletteQuery: "",
    paletteSel: 0,
    menuStack: [],                                // popup menu stack
    dialog: null,                                 // {type}
    propsTab: "Description",
    toast: null,
    toastTimer: null,
    comments: JSON.parse(JSON.stringify(D.COMMENTS)),
    commentQuery: "",
    commentAdd: "",
    replyDraft: {},
    openBookmarks: new Set([3, 4]),
    layers: JSON.parse(JSON.stringify(D.LAYERS)),
    fields: JSON.parse(JSON.stringify(D.FIELDS)),
    searchPanelQuery: "type",
    searchPanelIndex: 9,
    formPreview: false,
    noticeDismissed: false,
  };

  const $ = (sel) => document.querySelector(sel);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* ── 2. Helpers ─────────────────────────────────────────────────────────── */
  const group = (id) => D.TOOL_GROUPS.find((g) => g.id === id);
  const hue = (g) => D.G_HUES[g.hue];

  /** Inline Lucide SVG, tinted by the current `color`. */
  function ic(name, size = 18, extra = "") {
    const body = ICONS[name] || ICONS.square || "";
    return `<svg class="ic ${extra}" width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true">${body}</svg>`;
  }
  const iconBtn = (name, act, arg, tip, selected = false, size = 18) =>
    `<button class="icon-btn${selected ? " is-selected" : ""}" data-act="${act}" data-arg="${arg ?? ""}" data-tip="${esc(tip)}">${ic(name, size)}</button>`;
  const ghostBtn = (name, label, act, arg, tip = "") =>
    `<button class="ghost-btn" data-act="${act}" data-arg="${arg ?? ""}"${tip ? ` data-tip="${esc(tip)}"` : ""}>${ic(name, 17)}<span>${esc(label)}</span></button>`;
  const pill = (label, act, arg, primary = false, disabled = false) =>
    `<button class="pill${primary ? " is-primary" : ""}" data-act="${act}" data-arg="${arg ?? ""}"${disabled ? " disabled" : ""}>${esc(label)}</button>`;
  const icTint = (name, size, color) => `<span style="color:${color};display:inline-flex">${ic(name, size)}</span>`;

  /** Availability → chip markup + plan label, mirroring panels.rs. */
  function chipHtml(a) {
    if (a === "ready") return `<span class="chip is-ready">Ready</span>`;
    if (a === "ai") return `<span class="chip">AI</span>`;
    return `<span class="chip">${esc(a)}</span>`;
  }
  const isReady = (a) => a === "ready";

  /* ── 3a. UI-01 Title / tab strip ────────────────────────────────────────── */
  function renderTabstrip() {
    const tabs = state.tabs.map((t) =>
      `<div class="tab${state.view === "doc" && state.activeTab === t.id ? " is-active" : ""}${t.dirty ? " is-dirty" : ""}"
            data-act="tab.select" data-arg="${t.id}" data-tip="${esc(t.name)}${t.dirty ? " — unsaved changes" : ""}">
         <span style="color:${state.view === 'doc' && state.activeTab === t.id ? "var(--accent)" : "var(--text-muted)"}">${ic("file-text", 15)}</span>
         <span class="tab__name">${esc(t.name)}</span>
         <span class="tab__dot"></span>
         <button class="tab__close" data-act="tab.close" data-arg="${t.id}" data-tip="Close ${esc(t.name)}">${ic("x", 13)}</button>
       </div>`).join("");

    $("#tabstrip").innerHTML = `
      ${iconBtn("house", "view.home", "", "Home", state.view === "home", 17)}
      ${tabs}
      ${ghostBtn("plus", "Open", "dialog.open", "", "Open a PDF (⌘O)")}
      <div class="spacer"></div>
      ${iconBtn(state.theme === "light" ? "moon" : "sun", "theme.toggle", "", state.theme === "light" ? "Dark gray theme" : "Light theme", false, 17)}
      ${iconBtn("circle-help", "dialog.shortcuts", "", "Keyboard shortcuts", false, 17)}
      <button class="ghost-btn" data-act="help.discord" data-tip="discord.gg/artcraft">${ic("messages-square", 17)}<span>Discord</span></button>`;
  }

  /* ── 3b. UI-02 Mode bar ─────────────────────────────────────────────────── */
  const MODES = ["All tools", "Read", "Edit", "Convert", "E-Sign"];

  function renderModebar() {
    const hasDoc = state.view === "doc";
    const tabs = MODES.map((m) =>
      `<button class="mode-tab${state.mode === m ? " is-active" : ""}" data-act="mode.select" data-arg="${m}">${m}</button>`).join("");

    $("#modebar").innerHTML = `
      ${ghostBtn("panel-left", "Menu", "menu.main", "", "File · Edit · Pages · View · Help")}
      <span class="divider-v modebar__sep"></span>
      ${tabs}
      <div class="spacer"></div>
      ${iconBtn("printer", "run", "file.print", "Print (⌘P)", false, 18).replace("<button", `<button ${hasDoc ? "" : "disabled"}`)}
      ${iconBtn("save", "run", "file.save", "Save (⌘S)", false, 18).replace("<button", `<button ${hasDoc ? "" : "disabled"}`)}
      ${iconBtn("info", "run", "doc.properties", "Document properties (⌘D)", false, 18).replace("<button", `<button ${hasDoc ? "" : "disabled"}`)}
      <button class="searchbox" data-act="palette.open" data-tip="Search tools and commands">
        ${ic("search", 15)}<span>Find tools and commands</span><span class="searchbox__kbd">⌘K</span>
      </button>`;
  }

  /* ── 3c. UI-03 Left tool panel ──────────────────────────────────────────── */
  const COLLAPSED_TOOLS = 14;

  function renderLeft() {
    const el = $("#leftPanel");
    const hidden = state.view !== "doc" || !state.leftOpen || state.mode === "Read";
    el.className = "panel-left" + (hidden ? " is-hidden" : "");
    if (hidden) { el.innerHTML = ""; return; }

    const tool = state.left.kind === "tool" ? group(state.left.id) : null;
    const header = `
      <div class="panel-header">
        ${tool ? iconBtn("chevron-left", "left.back", "", "Back to all tools", false, 16) : ""}
        <span class="panel-header__title">${esc(tool ? tool.label : "All tools")}</span>
        ${iconBtn("x", "left.close", "", "Close panel", false, 16)}
      </div>`;

    el.innerHTML = header + `<div class="panel-body">${tool ? toolDetail(tool) : allTools()}</div>`;
  }

  function allTools() {
    const shown = state.allToolsExpanded ? D.TOOL_GROUPS.length : Math.min(COLLAPSED_TOOLS, D.TOOL_GROUPS.length);
    const rows = D.TOOL_GROUPS.slice(0, shown).map((g) => {
      const avail = g.availability === "ready" ? "Available"
        : g.availability === "ai" ? "Optional: needs an AI provider you configure"
        : `Planned for milestone ${g.availability} — open to see what it will include`;
      return `<button class="tool-row" data-act="left.open" data-arg="${g.id}" data-tip="${esc(avail)}">
        ${icTint(g.icon, 19, hue(g))}
        <span class="tool-row__label">${esc(g.label)}</span>
        ${g.badge ? `<span class="badge">${esc(g.badge)}</span>`
          : !isReady(g.availability) ? `<span class="tool-row__planned">Planned · ${esc(g.availability)}</span>` : ""}
      </button>`;
    }).join("");
    const more = state.allToolsExpanded ? "View less" : "View more";
    return rows + `<div style="padding:8px 6px"><span class="link" data-act="left.expand">${more}</span></div>`;
  }

  function toolDetail(g) {
    let special = "";

    // Prepare a form: Preview / Edit toggle (panels.rs).
    if (g.id === "form") {
      special += `<div style="margin-bottom:8px">${pill(state.formPreview ? "Edit fields" : "Preview", "left.form_preview", "", !!state.formPreview)}</div>`;
    }
    // Add a stamp: the palette (panels.rs::stamp_palette).
    if (g.id === "stamp") {
      special += `<div class="faint" style="font-size:12px;margin-bottom:6px">Choose a stamp, then click on the page to place it.</div>`;
      const stamps = [
        ["Dynamic", ["Approved", "Draft", "Confidential"]],
        ["Sign Here", ["Sign Here"]],
        ["Standard Business", ["Received", "Reviewed", "Paid", "Void"]],
      ];
      const colors = { Approved: "#2d9d5b", Draft: "#e88a1a", Confidential: "#e03e3e", "Sign Here": "#1b63e0", Received: "#3a6fe8", Reviewed: "#8e4ee6", Paid: "#2d9d5b", Void: "#e03e3e" };
      special += stamps.map(([title, list]) => `<div class="section-title">${title}</div>` + list.map((s) =>
        `<button class="tool-item" data-act="quick.stamp" data-arg="${esc(s)}" data-tip="Place the ${esc(s)} stamp">
           <span style="display:inline-flex;padding:2px 6px;border:1.5px solid ${colors[s]};border-radius:5px;color:${colors[s]};font-size:10.5px;font-weight:600;background:${colors[s]}1a">${esc(s)}</span>
         </button>`).join("")).join("");
      return special + calloutIfPlanned(g);
    }

    // Edit a PDF: Format text section (placeholder for the text tools).
    if (g.id === "edit") {
      special += `<div class="section-title">Format text</div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;padding:2px 0 4px">
          ${["bold", "italic", "underline", "align-left", "align-center", "list", "palette"].map((i) => iconBtn(i, "run", "edit.format", i)).join("")}
        </div>`;
    }

    const sections = g.sections.map((s) => {
      const items = s.items.map((it) => {
        const ready = isReady(it.availability);
        const tip = it.command + (ready ? "" : ` — planned ${it.availability}`);
        return `<button class="tool-item" data-act="run" data-arg="${it.command}" data-tip="${esc(tip)}">
          <span style="color:${ready ? hue(g) : "var(--text-faint)"};display:inline-flex">${ic(it.icon, 17)}</span>
          <span class="tool-item__label" style="color:${ready ? "var(--text)" : "var(--text-muted)"}">${esc(it.label)}</span>
          ${chipHtml(it.availability)}
        </button>`;
      }).join("");
      return `<div class="section-title">${esc(s.title)}</div>${items}`;
    }).join("");

    // Redact a PDF has Acrobat's footer: Clear all / Redact all.
    const footer = g.id === "redact" ? `
      <div class="panel-footer" style="margin-top:8px">
        <span class="muted" style="font-size:12px">3 marks</span>
        <div class="spacer"></div>
        ${pill("Clear all", "run", "redact.clear")}
        ${pill("Redact all", "run", "redact.apply", true)}
      </div>` : "";

    return special + calloutIfPlanned(g) + sections + footer;
  }

  const calloutIfPlanned = (g) => isReady(g.availability) ? ""
    : `<div class="callout">Coming in milestone <strong>${esc(g.availability)}</strong>. Items marked <em>Ready</em> work today.</div>`;

  /* ── 3d. UI-04 Right rail ───────────────────────────────────────────────── */
  const RAIL = [
    ["comments", "message-square-text", "Comments"],
    ["bookmarks", "bookmark", "Bookmarks"],
    ["pages", "files", "Page thumbnails"],
    ["fields", "text-cursor-input", "Form fields"],
    ["layers", "layers", "Layers"],
    ["attachments", "paperclip", "Attachments"],
    ["signatures", "signature", "Signatures"],
  ];

  function renderRail() {
    const el = $("#rail");
    const hidden = state.view !== "doc";
    el.className = "rail" + (hidden ? " is-hidden" : "");
    el.style.display = hidden ? "none" : "flex";
    if (hidden) { el.innerHTML = ""; return; }

    const has = { comments: true, bookmarks: true, pages: true, fields: true, layers: true, attachments: true, signatures: true };
    const btns = RAIL.map(([id, icon, tip]) => {
      if (id === "pages") tip = "Page thumbnails";
      const selected = state.right === id;
      return `<button class="icon-btn rail__btn${has[id] && !selected ? " has-content" : ""}${selected ? " is-selected" : ""}"
                data-act="right.toggle" data-arg="${id}" data-tip="${esc(tip)}">${ic(icon, 18)}</button>`;
    }).join("");

    el.innerHTML = `
      ${btns}
      <div class="spacer"></div>
      <div class="rail__zoom">${Math.round(state.zoom * 100)}%</div>
      ${iconBtn("zoom-out", "zoom.out", "", "Zoom out (⌘−)", false, 17)}
      ${iconBtn("zoom-in", "zoom.in", "", "Zoom in (⌘+)", false, 17)}
      ${iconBtn("rotate-cw", "view.rotate", "", "Rotate view clockwise (⇧⌘+)", false, 17)}
      ${iconBtn("columns-2", "view.fit_width", "", "Toggle fit page / fit width", false, 17)}
      <div class="spacer"></div>
      ${iconBtn("chevron-down", "page.next", "", "Next page", false, 16)}
      ${iconBtn("chevron-up", "page.prev", "", "Previous page", false, 16)}
      <div class="rail__pagecount">${D.PAGES.length}</div>
      <input class="rail__pageinput" data-model="pageInput" value="${D.PAGES[state.current].label}"
             data-tip="Current page — type a page number or label and press Enter" />`;
  }

  /* ── 3e. UI-09 Right side panel ─────────────────────────────────────────── */
  const PANEL_TITLES = { comments: "Comments", bookmarks: "Bookmarks", pages: "Pages", fields: "Fields", layers: "Layers", attachments: "Attachments", signatures: "Signatures", search: "Search" };

  function renderRight() {
    const el = $("#rightPanel");
    const hidden = state.view !== "doc" || state.right === null || state.mode === "Read";
    el.className = "panel-right" + (hidden ? " is-hidden" : "");
    if (hidden) { el.innerHTML = ""; return; }
    el.style.width = state.rightWidth + "px";

    const id = state.right;
    const count = id === "comments" ? state.comments.length
      : id === "bookmarks" ? D.BOOKMARKS.length
      : id === "pages" ? D.PAGES.length : null;

    el.innerHTML = `
      <div class="panel-header">
        <span class="panel-header__title">${PANEL_TITLES[id]}${count ? ` <span class="faint" style="font-weight:400">${count}</span>` : ""}</span>
        ${iconBtn("x", "right.close", "", "Close panel", false, 16)}
      </div>
      <div class="panel-body">${rightBody(id)}</div>`;
  }

  function rightBody(id) {
    switch (id) {
      case "comments": return commentsPanel();
      case "bookmarks": return bookmarksPanel();
      case "pages": return pagesPanel();
      case "fields": return fieldsPanel();
      case "layers": return layersPanel();
      case "attachments": return attachmentsPanel();
      case "signatures": return signaturesPanel();
      case "search": return searchPanel();
      default: return "";
    }
  }

  const initials = (n) => n.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

  function commentCardsHtml() {
    const q = state.commentQuery.toLowerCase();
    const list = state.comments
      .map((c, i) => ({ c, i }))
      .filter(({ c }) => !q || [c.author, c.body, c.tool].some((s) => s.toLowerCase().includes(q)));

    let lastPage = null;
    const cards = list.map(({ c, i }) => {
      const pageHead = c.page !== lastPage ? `<div class="comment-group__page">Page ${D.PAGES[c.page].label}</div>` : "";
      lastPage = c.page;
      const replies = c.replies.map((r) => `
        <div class="comment-card" style="margin:6px 0 0;padding:6px 8px">
          <div class="comment-card__head">
            <span class="avatar" style="width:20px;height:20px;font-size:9.5px">${initials(r.author)}</span>
            <span class="comment-card__author">${esc(r.author)}</span>
            <span class="comment-card__time">${esc(r.time)}</span>
          </div>
          <div class="comment-card__body">${r.status ? `<span class="status-badge">Marked</span> ` : ""}${esc(r.body)}</div>
        </div>`).join("");
      return `${pageHead}
        <div class="comment-card${c.selected ? " is-selected" : ""}" data-act="comment.select" data-arg="${i}">
          <div class="comment-card__head">
            <span class="avatar">${initials(c.author)}</span>
            <span class="comment-card__author">${esc(c.author)}</span>
            <span class="comment-card__time">${esc(c.time)}</span>
          </div>
          <div class="comment-card__body">${esc(c.body)}</div>
          <div class="comment-card__meta">
            ${ic("message-square-text", 12)}<span>${esc(c.tool)}</span>
            ${c.state ? `<span class="status-badge">${esc(c.state)}</span>` : ""}
            <span class="spacer"></span>
            ${c.selected ? `<span class="link" data-act="comment.focus" data-arg="${i}">Show on page</span>` : ""}
          </div>
          ${c.selected ? `
            ${replies}
            <div class="reply-box">
              <input class="field" placeholder="Reply" data-model="reply" data-arg="${i}" value="${esc(state.replyDraft[i] || "")}" />
              ${iconBtn("send", "comment.reply", String(i), "Post reply", false, 15)}
            </div>` : ""}
        </div>`;
    }).join("") || `<div class="muted" style="padding:16px 0;text-align:center">No matching comments.</div>`;
    return cards;
  }

  function commentsPanel() {
    return `
      <input class="field" placeholder="Search comments" data-model="commentQuery" value="${esc(state.commentQuery)}" />
      <div style="height:8px"></div>
      <input class="field square" placeholder="Add a comment" data-model="commentAdd" value="${esc(state.commentAdd)}"
             data-tip="Type a note and press Enter to pin it to the current page" />
      <div id="commentsList" style="margin-top:8px">${commentCardsHtml()}</div>`;
  }

  function bookmarksPanel() {
    const rows = [];
    const walk = (items, depth) => items.forEach((b, idx) => {
      const key = depth + ":" + b.label;
      const open = state.openBookmarks.has(key) || depth === 0 && state.openBookmarks.has(b.label);
      const hasKids = b.children.length > 0;
      rows.push(`<button class="tree-row" style="padding-left:${6 + depth * 14}px" data-act="bookmark.go" data-arg="${b.page}">
        <span class="tree-row__twist" data-act="bookmark.twist" data-arg="${esc(key)}">${hasKids ? ic(open ? "chevron-down" : "chevron-right", 13) : ""}</span>
        ${ic("bookmark", 14)}
        <span>${esc(b.label)}</span>
        <span class="tree-row__page">${esc(D.PAGES[b.page].label)}</span>
      </button>`);
      if (hasKids && open) walk(b.children, depth + 1);
    });
    walk(D.BOOKMARKS, 0);
    return rows.join("");
  }

  function pagesPanel() {
    return `<div class="thumb-grid">${D.PAGES.map((p, i) => `
      <div class="thumb${i === state.current ? " is-selected" : ""}" data-act="page.go" data-arg="${i}" data-tip="Go to page ${esc(p.nav)}">
        <div class="thumb__paper" style="display:grid;place-items:center;color:#c9c9d0;font-size:11px">${ic("file-text", 20)}</div>
        <div class="thumb__label">${esc(p.label)} · ${esc(p.nav)}</div>
      </div>`).join("")}</div>`;
  }

  function fieldsPanel() {
    return state.fields.map((f, i) => `
      <button class="list-row" data-act="field.go" data-arg="${f.page}" data-tip="${esc(f.kind)} on page ${esc(D.PAGES[f.page].label)}">
        ${ic(f.kind === "Checkbox" ? "check-circle-2" : f.kind === "Drop-down list" ? "chevron-down" : f.kind === "Digital signature" ? "signature" : "text-cursor-input", 16)}
        <span style="flex:1;min-width:0">
          <div>${esc(f.label)}${f.required ? ` <span class="faint">*</span>` : ""}</div>
          <div class="list-row__sub">${esc(f.name)} · ${esc(f.kind)}</div>
        </span>
        <span class="faint" style="font-size:12px">${esc(f.value)}</span>
      </button>`).join("");
  }

  function layersPanel() {
    return state.layers.map((l, i) => `
      <div class="list-row">
        ${iconBtn(l.visible ? "eye" : "eye-off", "layer.visible", String(i), l.visible ? "Hide layer" : "Show layer", false, 16)}
        <span style="flex:1;min-width:0${l.visible ? "" : ";opacity:.55"}">${esc(l.name)}</span>
        ${iconBtn(l.locked ? "lock" : "lock-open", "layer.lock", String(i), l.locked ? "Unlock layer" : "Lock layer", l.locked, 15)}
      </div>`).join("");
  }

  function attachmentsPanel() {
    return D.ATTACHMENTS.map((a) => `
      <button class="list-row" data-act="attach.open" data-arg="${esc(a.name)}" data-tip="Open or save ${esc(a.name)}">
        ${ic("paperclip", 16)}
        <span style="flex:1;min-width:0">
          <div>${esc(a.name)}</div>
          <div class="list-row__sub">${esc(a.size)} · ${esc(a.desc)}</div>
        </span>
        ${ic("file-down", 15)}
      </button>`).join("");
  }

  function signaturesPanel() {
    return D.SIGNATURES.map((s) => `
      <div class="comment-card">
        <div class="comment-card__head">
          <span class="avatar" style="background:var(--ready-bg);color:var(--ready-fg)">${ic("check", 13)}</span>
          <span class="comment-card__author">${esc(s.signer)}</span>
          <span class="comment-card__time">${esc(s.when)}</span>
        </div>
        <div class="comment-card__body">Signature is <strong>valid</strong> and the document has not changed since signing.</div>
        <div class="comment-card__meta">${ic("badge-check", 12)} ${esc(s.issuer)} · ${esc(s.reason)}</div>
      </div>
      ${pill("Show certificate", "run", "sign.validate")}`).join("");
  }

  function searchPanel() {
    const q = state.searchPanelQuery.toLowerCase();
    const hits = D.SEARCH_HITS.filter(() => true);
    const shown = q ? hits : [];
    let last = null;
    const rows = shown.map((h, i) => {
      const head = h.page !== last ? `<div class="result__page">Page ${D.PAGES[h.page].label}</div>` : "";
      last = h.page;
      const body = q
        ? `…${esc(h.before)}<mark>${esc(h.hit)}</mark>${esc(h.after)}`
        : `…${esc(h.before)}${esc(h.hit)}${esc(h.after)}`;
      return `${head}<button class="result${i === state.searchPanelIndex ? " is-selected" : ""}" data-act="search.go" data-arg="${i}" data-tip="Go to this result">${body}</button>`;
    }).join("");
    return `
      <div class="muted" style="font-size:12.5px;margin-bottom:6px">What word or phrase would you like to search for?</div>
      <input class="field" placeholder="Search" data-model="searchPanelQuery" value="${esc(state.searchPanelQuery)}" />
      <div style="display:flex;gap:12px;margin:8px 0">
        <label class="check"><input type="checkbox" ${state.findWords ? "checked" : ""} data-model="findWords" /> Whole words only</label>
      </div>
      <label class="check" style="margin-bottom:8px"><input type="checkbox" ${state.findCase ? "checked" : ""} data-model="findCase" /> Case-sensitive</label>
      <div style="font-weight:600;font-size:12.5px;margin:6px 0">${q ? `${D.SEARCH_HITS.length} instances` : "Type to search"}</div>
      ${rows}`;
  }

  /* ── 3f. UI-05/06/07/08 Document area ───────────────────────────────────── */
  function renderDoc() {
    const el = $("#docArea");
    if (state.view === "home") { el.innerHTML = `<div class="home">${homeHtml()}</div>`; return; }
    if (state.organize) { el.innerHTML = organizeHtml(); return; }

    const pages = D.PAGES.map((p, i) => `
      <section class="page${i === state.current ? " is-current" : ""}" id="page-${i}"
               style="${i === state.current ? "outline:2px solid var(--accent);outline-offset:2px" : ""}">${D.pageBody(i)}</section>`).join("");

    el.innerHTML = `
      ${noticeHtml()}
      <div class="pages" id="pages" style="--zoom:${state.zoom}">${pages}</div>
      ${quickbarHtml()}
      ${state.findOpen ? findbarHtml() : ""}`;
  }

  function noticeHtml() {
    if (state.noticeDismissed) return "";
    return `
      <div class="notice">
        ${ic("badge-check", 16)}
        <span class="notice__text">Signed by <strong>Sam Whitfield</strong> — signature is valid and the document has not changed since signing.</span>
        ${pill("Signature panel", "right.open", "signatures")}
        ${iconBtn("x", "notice.close", "", "Dismiss", false, 15)}
      </div>`;
  }

  function quickbarHtml() {
    const isTool = (id) => state.quickTool.kind === id;
    const isCommentGroup = (g) => state.quickTool.kind === "comment" && D.COMMENT_GROUPS[g].tools.some((t) => t.id === state.quickTool.id);
    const cur = (g) => D.COMMENT_GROUPS[g].tools.find((t) => t.id === state.commentGroupTool[g]);

    const groups = D.COMMENT_GROUPS.map((g, gi) => {
      const tool = cur(gi);
      const active = isCommentGroup(gi);
      return `<span class="quickbar__group${active ? " is-active" : ""}">
        ${iconBtn(tool.icon, "quick.comment_group", String(gi), tool.label, active, 18)}
      </span>`;
    }).join("");

    const fillActive = state.quickTool.kind === "fill";
    const fillIcon = fillActive ? D.FILL_TOOLS.find((t) => t.id === state.fillTool).icon : "pen-line";

    const singles = D.QUICK_TOOLS.map((t) =>
      iconBtn(t.icon, "quick.tool", t.id, t.label, isTool(t.id), 18)).join("");

    return `
      <div class="quickbar">
        ${iconBtn("mouse-pointer-2", "quick.tool", "select", "Select (V)", isTool("select"), 18)}
        ${iconBtn("hand", "quick.tool", "hand", "Hand (H)", isTool("hand"), 18)}
        ${groups}
        <span class="quickbar__group${fillActive ? " is-active" : ""}">
          ${iconBtn(fillIcon, "quick.fill_group", "", "Fill & Sign", fillActive, 18)}
        </span>
        <div class="quickbar__sep"></div>
        ${singles}
      </div>`;
  }

  function findbarHtml() {
    const status = state.findQuery.trim()
      ? (state.findQuery.toLowerCase().includes("type") ? `${state.findIndex + 1} of ${D.SEARCH_HITS.length}` : "No matches")
      : "";
    return `
      <div class="findbar">
        ${ic("search", 16, "faint")}
        <input id="findInput" placeholder="Find text" data-model="findQuery" value="${esc(state.findQuery)}" />
        <span class="findbar__status">${status}</span>
        ${iconBtn("chevron-up", "find.prev", "", "Previous (⇧⌘G)", false, 15)}
        ${iconBtn("chevron-down", "find.next", "", "Next (⌘G)", false, 15)}
        ${iconBtn("settings-2", "find.options", "", "Find options", state.findCase || state.findWords, 15)}
        ${iconBtn("x", "find.close", "", "Close (Esc)", false, 15)}
      </div>`;
  }

  function organizeHtml() {
    const sel = state.selectedPages.size;
    return `
      <div class="organize">
        <div class="organize__bar">
          ${iconBtn("chevron-left", "organize.exit", "", "Back to the document", false, 16)}
          <span style="font-weight:600;margin-right:6px">Organize pages</span>
          <span class="divider-v"></span>
          ${iconBtn("rotate-cw", "organize.action", "rotate", "Rotate selected pages")}
          ${iconBtn("trash-2", "organize.action", "delete", "Delete selected pages")}
          ${iconBtn("file-output", "organize.action", "extract", "Extract selected pages")}
          ${iconBtn("file-plus-2", "organize.action", "insert", "Insert pages from a file")}
          ${iconBtn("copy-plus", "organize.action", "duplicate", "Duplicate selected pages")}
          <span class="divider-v"></span>
          ${iconBtn("square-dashed", "organize.action", "all", "Select all pages")}
          <span class="muted" style="font-size:12.5px;margin-left:4px">${sel} selected</span>
          <div class="spacer"></div>
          ${pill("Save", "run", "file.save", true)}
          ${pill("Cancel", "organize.exit")}
        </div>
        <div class="organize__grid">
          ${D.PAGES.map((p, i) => `
            <div class="organize__cell${state.selectedPages.has(i) ? " is-selected" : ""}" data-act="organize.select" data-arg="${i}">
              <div class="organize__paper" style="display:grid;place-items:center;color:#c9c9d0">
                ${ic("file-text", 22)}<span class="organize__num">${i + 1}</span>
              </div>
              <div class="organize__label">${esc(p.label)} · ${esc(p.nav)}</div>
            </div>`).join("")}
        </div>
      </div>`;
  }

  /* ── 3g. UI-10 Home tab ─────────────────────────────────────────────────── */
  function homeHtml() {
    const tiles = D.RECOMMENDED.map((id) => {
      const g = group(id);
      const blurb = g.sections[0].items.slice(0, 3).map((i) => i.label).join(" · ");
      return `<button class="tile" data-act="left.open_mode" data-arg="${g.id}">
        <div class="tile__head">${icTint(g.icon, 21, hue(g))}<span>${esc(g.label)}</span></div>
        <div class="tile__blurb">${esc(blurb)}</div>
        <span class="tile__cta">Use now</span>
      </button>`;
    }).join("");
    const openTile = `<button class="tile tile--open" data-act="dialog.open">
      ${ic("folder-open", 26)}<span style="font-weight:600;font-size:13px">Open file</span></button>`;

    const recent = D.RECENT.map((r) => `
      <button class="recent-row" data-act="home.recent" data-arg="${esc(r.path)}">
        ${icTint("file-text", 22, "#e03e3e")}
        <span style="min-width:0">
          <div class="recent-row__name">${esc(r.name)}</div>
          <div class="recent-row__path">${esc(r.path)}</div>
        </span>
        <span class="recent-row__meta">${r.pages} pages · ${esc(r.size)}</span>
      </button>`).join("");

    const links = [["messages-square", "Join our Discord", "help.discord", true], ["globe", "Website", "help.website", false], ["book-open", "Documentation", "help.docs", false]];
    const pills = links.map(([icon, label, act, primary]) =>
      `<button class="pill${primary ? " is-primary" : ""}" data-act="${act}">${ic(icon, 15)}${esc(label)}</button>`).join("");

    return `
      <h1>Welcome to PrintCraft</h1>
      <div class="home__lede">An open-source PDF workbench — local, private, and scriptable.</div>

      <div class="card">
        <div style="display:flex;gap:10px;align-items:center">
          <span style="width:28px;height:28px;border-radius:8px;background:var(--accent);color:#fff;display:grid;place-items:center">${ic("sparkles", 17)}</span>
          <span>
            <div class="card__title">Join the ArtCraft community</div>
            <div class="muted">Get help, share feedback and follow development on Discord.</div>
          </span>
        </div>
        <div class="pill-row">${pills}</div>
      </div>

      <div class="home__gap"></div>
      <div class="card">
        <div class="card__title">Recommended tools</div>
        <div class="tiles">${tiles}${openTile}</div>
      </div>

      <div class="home__gap"></div>
      <div style="font-weight:600;font-size:17px">Recent</div>
      <div style="margin-top:8px">${recent}</div>

      <div class="home__gap"></div>
      <div class="section-title">Privacy</div>
      <div class="muted">PrintCraft works offline. No telemetry, no account, and no cloud processing unless you add a provider.</div>`;
  }

  /* ── 3h. UI-11/12/13/14 Overlays ────────────────────────────────────────── */
  function renderOverlays() {
    const out = [];
    if (state.menuStack.length) out.push(state.menuStack.map(menuHtml).join(""));
    if (state.paletteOpen) out.push(paletteHtml());
    if (state.dialog) out.push(dialogHtml());
    if (state.toast) out.push(`<div class="toast">${esc(state.toast)}</div>`);
    $("#overlays").innerHTML = out.join("");
  }

  function menuHtml(m, i) {
    const items = m.items.map((it) => {
      if (it.type === "sep") return `<div class="menu__sep"></div>`;
      if (it.type === "label") return `<div class="menu__label">${esc(it.label)}</div>`;
      if (it.type === "radio") {
        return `<button class="menu__item${it.disabled ? " is-disabled" : ""}" data-act="menu.radio" data-arg="${esc(it.act)}|${esc(it.arg ?? "")}">
          <span class="menu__radio">${it.checked ? ic("check", 13) : ""}</span><span>${esc(it.label)}</span></button>`;
      }
      if (it.type === "check") {
        return `<button class="menu__item${it.disabled ? " is-disabled" : ""}" data-act="menu.radio" data-arg="${esc(it.act)}|${esc(it.arg ?? "")}">
          <span class="menu__radio">${it.checked ? ic("check", 13) : ""}</span><span>${esc(it.label)}</span></button>`;
      }
      if (it.type === "sub") {
        return `<button class="menu__item menu__item--sub" data-act="menu.sub" data-arg="${esc(it.key)}">${it.icon ? ic(it.icon, 15) : ""}<span>${esc(it.label)}</span></button>`;
      }
      return `<button class="menu__item${it.disabled ? " is-disabled" : ""}" data-act="menu.item" data-arg="${esc(it.act)}">
        ${it.icon ? ic(it.icon, 15) : `<span style="width:15px"></span>`}
        <span>${esc(it.label)}</span>
        ${it.shortcut ? `<span class="menu__shortcut">${esc(it.shortcut)}</span>` : ""}
      </button>`;
    }).join("");
    return `<div class="menu" style="left:${m.x}px;top:${m.y}px;z-index:${60 + i}">${items}</div>`;
  }

  const cmd = (id) => D.COMMANDS.find((c) => c.id === id);
  const menuItem = (id, over = {}) => {
    const c = cmd(id);
    return Object.assign({ type: "item", label: c.label, icon: c.icon, shortcut: c.shortcut, act: id }, over);
  };

  function openMenu(x, y, items) { state.menuStack = [{ x, y, items }]; renderOverlays(); }

  function mainMenu(x, y) {
    openMenu(x, y, [
      { type: "sub", key: "File", label: "File", sub: [
        menuItem("file.open"), menuItem("file.save"), menuItem("file.save_as"), menuItem("file.export"),
        { type: "sep" }, menuItem("file.print"), { type: "sep" }, menuItem("file.revert"), menuItem("file.close"),
      ]},
      { type: "sub", key: "Edit", label: "Edit", sub: [
        menuItem("edit.undo"), menuItem("edit.redo"), { type: "sep" },
        menuItem("edit.copy"), menuItem("edit.select_all"), { type: "sep" },
        menuItem("edit.find"), menuItem("edit.search"), menuItem("edit.snapshot"), { type: "sep" },
        menuItem("edit.preferences"),
      ]},
      { type: "sub", key: "Pages", label: "Pages", sub: [
        menuItem("page.organize"), menuItem("page.rotate"), menuItem("page.delete"), menuItem("page.extract"),
        menuItem("page.insert"), menuItem("page.split"), { type: "sep" }, menuItem("page.number"),
      ]},
      { type: "sub", key: "View", label: "View", sub: viewMenu() },
      { type: "sub", key: "Help", label: "Help", sub: [
        menuItem("help.shortcuts"), menuItem("doc.properties"), { type: "sep" }, menuItem("help.about"), menuItem("help.discord"),
      ]},
    ]);
  }

  function viewMenu() {
    const zoomRadio = (label, act, checked, shortcut) =>
      ({ type: "radio", label, act: "menu.zoom", arg: act, checked, shortcut });
    return [
      { type: "label", label: "Zoom" },
      zoomRadio("Actual size", "actual", Math.abs(state.zoom - 1) < 0.001),
      zoomRadio("Zoom to page level", "page", Math.abs(state.zoom - 0.85) < 0.001),
      zoomRadio("Fit to width", "width", Math.abs(state.zoom - 0.95) < 0.001),
      zoomRadio("Zoom in", "in", false), zoomRadio("Zoom out", "out", false),
      { type: "sep" },
      { type: "label", label: "Page display" },
      { type: "radio", label: "Continuous scrolling", act: "menu.layout", arg: "continuous", checked: true },
      { type: "radio", label: "Two-page view", act: "menu.layout", arg: "twopage", checked: false },
      { type: "radio", label: "Single page", act: "menu.layout", arg: "single", checked: false },
      { type: "sep" },
      { type: "sub", key: "Theme", label: "Display theme", sub: [
        { type: "radio", label: "Use system setting", act: "menu.theme", arg: "system", checked: false },
        { type: "radio", label: "Light gray", act: "menu.theme", arg: "light", checked: state.theme === "light" },
        { type: "radio", label: "Dark gray", act: "menu.theme", arg: "dark", checked: state.theme === "dark" },
      ]},
      { type: "sub", key: "Panels", label: "Side panels", sub: [
        ...RAIL.map(([id, , tip]) => ({ type: "radio", label: tip, act: "menu.panel", arg: id, checked: state.right === id })),
        { type: "radio", label: "Search", act: "menu.panel", arg: "search", checked: state.right === "search" },
      ]},
      { type: "sep" },
      menuItem("view.full_screen"), menuItem("view.read_mode"),
    ];
  }

  /* submenu key → items, for menu.sub */
  const SUBS = {
    File: () => mainMenuItems("File"), Edit: () => mainMenuItems("Edit"),
    Pages: () => mainMenuItems("Pages"), View: () => viewMenu(),
    Help: () => mainMenuItems("Help"),
  };
  function mainMenuItems(which) {
    // Re-derive submenu contents from the same builders used by mainMenu.
    const all = {
      File: [menuItem("file.open"), menuItem("file.save"), menuItem("file.save_as"), menuItem("file.export"), { type: "sep" }, menuItem("file.print"), { type: "sep" }, menuItem("file.revert"), menuItem("file.close")],
      Edit: [menuItem("edit.undo"), menuItem("edit.redo"), { type: "sep" }, menuItem("edit.copy"), menuItem("edit.select_all"), { type: "sep" }, menuItem("edit.find"), menuItem("edit.search"), menuItem("edit.snapshot"), { type: "sep" }, menuItem("edit.preferences")],
      Pages: [menuItem("page.organize"), menuItem("page.rotate"), menuItem("page.delete"), menuItem("page.extract"), menuItem("page.insert"), menuItem("page.split"), { type: "sep" }, menuItem("page.number")],
      Help: [menuItem("help.shortcuts"), menuItem("doc.properties"), { type: "sep" }, menuItem("help.about"), menuItem("help.discord")],
    };
    return all[which];
  }

  /* ── Command palette ────────────────────────────────────────────────────── */
  function score(hay, needle) {
    if (!needle) return 0;
    const h = hay.toLowerCase();
    const p = h.indexOf(needle);
    if (p >= 0) return p;
    let i = 0;
    for (const ch of h) if (ch === needle[i]) i++;
    return i === needle.length ? 100 : -1;
  }

  function paletteHits() {
    const q = state.paletteQuery.trim().toLowerCase();
    const hits = [];
    for (const c of D.COMMANDS) {
      const s = Math.max(score(c.label, q), score(c.id, q) - 20);
      if (s >= 0) hits.push({ s, label: c.label, detail: c.shortcut || c.menu || "Command", icon: c.icon, act: c.id, enabled: true });
    }
    for (const g of D.TOOL_GROUPS) {
      const s = score(g.label, q);
      if (s >= 0) hits.push({ s, label: g.label, detail: "Tool", icon: g.icon, act: "left.open:" + g.id, enabled: isReady(g.availability) });
      for (const sec of g.sections) for (const it of sec.items) {
        const si = Math.max(score(it.label, q), score(it.command, q) - 20);
        if (si >= 0) hits.push({ s: si + 1, label: it.label, detail: g.label, icon: it.icon, act: "run:" + it.command, enabled: isReady(it.availability) });
      }
    }
    hits.sort((a, b) => a.s - b.s || (b.enabled - a.enabled));
    return hits.slice(0, 12);
  }

  function paletteHtml() {
    const hits = paletteHits();
    state.paletteSel = Math.min(state.paletteSel, Math.max(0, hits.length - 1));
    const rows = hits.map((h, i) => `
      <button class="palette__hit${h.enabled ? "" : " is-disabled"}${i === state.paletteSel ? " is-sel" : ""}"
              style="${i === state.paletteSel ? "background:var(--hover)" : ""}"
              data-act="palette.run" data-arg="${esc(h.act)}">
        ${ic(h.icon, 17)}<span style="color:${h.enabled ? "var(--text)" : "var(--text-faint)"}">${esc(h.label)}</span>
        <span class="palette__detail">${esc(h.detail)}</span>
      </button>`).join("") || `<div class="muted" style="padding:8px">No matching tools</div>`;
    return `
      <div class="scrim" data-act="palette.close"></div>
      <div class="palette">
        <div class="palette__input">${ic("search", 18, "faint")}
          <input id="paletteInput" placeholder="Search tools and commands…" data-model="paletteQuery" value="${esc(state.paletteQuery)}" />
        </div>
        <div class="menu__sep"></div>
        ${rows}
      </div>`;
  }

  /* ── Dialogs ────────────────────────────────────────────────────────────── */
  function dialogHtml() {
    const d = state.dialog;
    let title = "", body = "", footer = "", wide = false;
    switch (d.type) {
      case "shortcuts": {
        title = "Keyboard shortcuts";
        body = `<div class="modal__grid">${D.SHORTCUTS.map(([k, v]) =>
          `<span class="modal__key">${esc(k)}</span><span>${esc(v)}</span>`).join("")}</div>`;
        footer = pill("Close", "dialog.close");
        break;
      }
      case "about": {
        title = "";
        wide = false;
        body = `
          <div style="display:flex;gap:12px;align-items:center">
            <span style="width:40px;height:40px;border-radius:10px;background:var(--accent);color:#fff;display:grid;place-items:center">${ic("sparkles", 22)}</span>
            <span><div style="font-size:20px;font-weight:600">PrintCraft</div><div class="muted">Version ${esc(D.DOC.version)}</div></span>
          </div>
          <p>A clean-room, open-source PDF application written in Rust. MIT OR Apache-2.0.</p>
          <p class="faint" style="font-size:11.5px">Rendering: hayro (bootstrap) · UI: egui · Icons: Lucide (ISC) · Fonts: Inter, JetBrains Mono, Dancing Script (OFL)</p>
          <p class="muted">This is a design demo: a static re-creation of the PrintCraft interface with no PDF engine behind it.</p>`;
        footer = pill("Close", "dialog.close");
        break;
      }
      case "properties": {
        title = "Document Properties";
        wide = true;
        const tabs = ["Description", "Initial View", "Security", "Fonts", "Advanced"];
        const rows = {
          Description: [["File", D.DOC.name], ["Title", "PrintCraft Showcase"], ["Author", "The ArtCraft community"], ["Subject", "A 13-page PDF specimen"], ["Keywords", "type, specimen, pdf, showcase"], ["Created", "2026-02-14 09:12"], ["Modified", "2026-02-14 11:48"], ["Application", "PrintCraft 0.2.1"]],
          "Initial View": [["Page layout", "Continuous"], ["Magnification", "Fit width"], ["Open to page", "Cover"], ["Navigation tab", "Bookmarks panel"], ["Hide toolbars", "No"]],
          Security: [["Security method", "Password (AES-256)"], ["Printing", "Allowed"], ["Changing the document", "Not allowed"], ["Commenting", "Allowed"], ["Assembly", "Not allowed"]],
          Fonts: [["Inter", "Embedded subset · TrueType"], ["JetBrainsMono", "Embedded subset · TrueType"], ["DancingScript", "Embedded subset · TrueType"], ["BIZ UDPGothic", "Embedded subset · TrueType"]],
          Advanced: [["PDF version", "2.0"], ["Page count", String(D.PAGES.length)], ["Page size", "612 × 792 pt (Letter)"], ["Fast web view", "Yes"], ["Linearized", "Yes"], ["Repaired", "No"]],
        };
        body = `
          <div class="modal__tabs">${tabs.map((t) => `<button class="modal__tab${state.propsTab === t ? " is-active" : ""}" data-act="props.tab" data-arg="${t}">${t}</button>`).join("")}</div>
          <div class="modal__grid">${rows[state.propsTab].map(([k, v]) => `<span class="muted">${esc(k)}</span><span>${esc(v)}</span>`).join("")}</div>`;
        footer = pill("Close", "dialog.close");
        break;
      }
      case "preferences": {
        title = "Preferences";
        body = `
          <div class="section-title">Identity</div>
          <div class="modal__grid">
            <span class="muted">Author name</span><input class="field square" value="Marta Oliveira" />
            <span class="muted">Comment colour</span><span style="display:flex;gap:6px">
              ${["#1b63e0", "#2d9d5b", "#e88a1a", "#e03e3e", "#8e4ee6"].map((c) => `<span style="width:22px;height:22px;border-radius:50%;background:${c}"></span>`).join("")}
            </span>
          </div>
          <div class="section-title">General</div>
          <label class="check"><input type="checkbox" checked /> Follow the operating system's light / dark setting</label>
          <div style="height:6px"></div>
          <label class="check"><input type="checkbox" checked /> Autosave every minute</label>
          <div style="height:6px"></div>
          <label class="check"><input type="checkbox" /> Check for updates automatically</label>`;
        footer = `${pill("Cancel", "dialog.close")}${pill("Save", "dialog.close", "", true)}`;
        break;
      }
      case "print": {
        title = "Print";
        wide = true;
        body = `
          <div class="modal__grid">
            <span class="muted">Printer</span><span>ArtCraft LaserJet (Default)</span>
            <span class="muted">Pages</span><span>All ${D.PAGES.length} pages</span>
            <span class="muted">Copies</span><span>1</span>
            <span class="muted">Page size</span><span>Letter · 612 × 792 pt</span>
            <span class="muted">Orientation</span><span>Portrait</span>
            <span class="muted">Comments</span><span>Document and marks</span>
          </div>
          <p class="faint" style="font-size:11.5px;margin-top:12px">The original bytes are never modified by printing.</p>`;
        footer = `${pill("Cancel", "dialog.close")}${pill("Print", "dialog.confirm", "Printed to ArtCraft LaserJet", true)}`;
        break;
      }
      case "saveas": {
        title = "Save As";
        body = `<div class="modal__grid">
            <span class="muted">File name</span><input class="field square" value="PrintCraft-Showcase (copy).pdf" />
            <span class="muted">Folder</span><input class="field square" value="~/Documents/printcraft" />
            <span class="muted">Format</span><span>PDF document (*.pdf)</span>
          </div>
          <p class="muted" style="font-size:12px">Every save appends your changes; the original bytes stay intact.</p>`;
        footer = `${pill("Cancel", "dialog.close")}${pill("Save", "dialog.confirm", "Saved a copy", true)}`;
        break;
      }
      case "revert": {
        title = "Revert";
        body = `<p>Revert <strong>${esc(D.DOC.name)}</strong> to the last saved version? All changes since the last save are discarded.</p>`;
        footer = `${pill("Cancel", "dialog.close")}${pill("Revert", "dialog.confirm", "Reverted to the last saved version")}`;
        break;
      }
      case "findoptions": {
        title = "Find options";
        body = `
          <label class="check"><input type="checkbox" ${state.findWords ? "checked" : ""} data-model="findWords" /> Whole words only</label>
          <div style="height:8px"></div>
          <label class="check"><input type="checkbox" ${state.findCase ? "checked" : ""} data-model="findCase" /> Case-sensitive</label>`;
        footer = pill("Done", "dialog.close");
        break;
      }
      default: {
        title = d.title || "PrintCraft";
        body = `<p>${esc(d.body || "")}</p>`;
        footer = pill("Close", "dialog.close");
      }
    }
    return `
      <div class="scrim" data-act="dialog.close"></div>
      <div class="modal-wrap"><div class="modal${wide ? " is-wide" : ""}">
        ${title ? `<div class="modal__title">${esc(title)}</div>` : ""}
        ${body}
        <div class="modal__footer">${footer}</div>
      </div></div>`;
  }

  /* ── Full render ────────────────────────────────────────────────────────── */
  function renderAll() {
    renderTabstrip(); renderModebar(); renderLeft(); renderDoc(); renderRight(); renderRail(); renderOverlays();
  }
  function renderChrome() { renderTabstrip(); renderModebar(); }

  /* ── 4. Actions ─────────────────────────────────────────────────────────── */
  function toast(msg) {
    state.toast = msg;
    clearTimeout(state.toastTimer);
    state.toastTimer = setTimeout(() => { state.toast = null; renderOverlays(); }, 3500);
    renderOverlays();
  }

  function openRight(id) {
    if (state.right === id) return;
    state.right = id;
    renderRight(); renderRail();
    if (id === "comments") toast("Comments panel opened");
  }
  function closeRight() { state.right = null; renderRight(); renderRail(); }

  function setMode(m) {
    state.mode = m;
    state.leftOpen = m !== "Read";
    if (m === "Edit") state.left = { kind: "tool", id: "edit" };
    else if (m === "Convert") state.left = { kind: "tool", id: "export" };
    else if (m === "E-Sign") state.left = { kind: "tool", id: "fill_sign" };
    else if (m === "All tools" && state.left.kind === "tool") state.left = { kind: "all" };
    renderModebar(); renderLeft(); renderDoc(); renderRight(); renderRail();
    toast(`${m} mode`);
  }

  function setZoom(z) {
    state.zoom = Math.max(0.25, Math.min(3, z));
    renderRail(); renderDoc();
  }
  const zoomStep = (inn) => setZoom(state.zoom * (inn ? 1.25 : 1 / 1.25));

  function goPage(i, scroll = true) {
    state.current = Math.max(0, Math.min(D.PAGES.length - 1, i));
    renderRail(); renderRight();
    if (!state.organize) {
      renderDoc();
      if (scroll) requestAnimationFrame(() => {
        const el = document.getElementById("page-" + state.current);
        if (el) el.scrollIntoView({ block: "start", behavior: "smooth" });
      });
    } else renderDoc();
  }

  function goToMatch(i) {
    state.findIndex = (i + D.SEARCH_HITS.length) % D.SEARCH_HITS.length;
    goPage(D.SEARCH_HITS[state.findIndex].page);
    if (state.findOpen) renderDoc();
    if (state.right === "search") { state.searchPanelIndex = state.findIndex; renderRight(); }
  }

  function openPalette() {
    state.paletteOpen = true; state.paletteQuery = ""; state.paletteSel = 0;
    state.menuStack = [];
    renderOverlays();
    requestAnimationFrame(() => { const el = $("#paletteInput"); if (el) el.focus(); });
  }

  function runCommand(id) {
    const c = cmd(id);
    switch (id) {
      case "file.save": state.tabs.forEach((t) => { if (t.id === state.activeTab) t.dirty = false; }); renderTabstrip(); toast("Saved — changes appended, original bytes intact"); break;
      case "file.save_as": state.dialog = { type: "saveas" }; renderOverlays(); break;
      case "file.print": state.dialog = { type: "print" }; renderOverlays(); break;
      case "file.revert": state.dialog = { type: "revert" }; renderOverlays(); break;
      case "file.open": state.dialog = { type: "open" , title: "Open", body: "Choose a PDF to open. In this demo, files are simulated." }; renderOverlays(); break;
      case "file.export": state.leftOpen = true; state.left = { kind: "tool", id: "export" }; renderLeft(); break;
      case "file.close": toast("Close tab — the demo keeps the tab open"); break;
      case "edit.find": state.findOpen = true; renderDoc(); requestAnimationFrame(() => $("#findInput")?.focus()); break;
      case "edit.search": case "panel.search": openRight("search"); break;
      case "edit.preferences": state.dialog = { type: "preferences" }; renderOverlays(); break;
      case "edit.undo": toast("Undo — nothing to undo in the design demo"); break;
      case "edit.redo": toast("Redo — nothing to redo"); break;
      case "edit.copy": toast("Copied the selected text"); break;
      case "edit.select_all": state.selectedPages = new Set(D.PAGES.map((_, i) => i)); renderDoc(); toast(`${D.PAGES.length} pages selected`); break;
      case "edit.snapshot": toast("Snapshot copied to the clipboard"); break;
      case "edit.format": toast("Format text — bold, italic, alignment and lists"); break;
      case "page.organize": state.organize = true; state.leftOpen = true; state.left = { kind: "tool", id: "organize" }; renderAll(); break;
      case "page.rotate": toast("Rotated 1 page"); break;
      case "page.delete": toast("Delete pages — select pages in Organize"); break;
      case "page.number": toast("Number pages — labels i, ii, 1, 2…"); break;
      case "page.crop": state.quickTool = { kind: "crop" }; renderDoc(); toast("Crop pages — drag a rectangle"); break;
      case "view.zoom_in": zoomStep(true); break;
      case "view.zoom_out": zoomStep(false); break;
      case "view.actual_size": setZoom(1); break;
      case "view.fit_page": setZoom(0.85); break;
      case "view.fit_width": setZoom(0.95); break;
      case "view.rotate_cw": case "view.rotate": toast("Rotated the view clockwise"); break;
      case "view.full_screen": toast("Full screen mode (Esc to leave)"); break;
      case "view.read_mode": setMode("Read"); break;
      case "view.marquee_zoom": state.quickTool = { kind: "marquee" }; renderDoc(); break;
      case "doc.properties": state.dialog = { type: "properties" }; renderOverlays(); break;
      case "help.shortcuts": state.dialog = { type: "shortcuts" }; renderOverlays(); break;
      case "help.about": state.dialog = { type: "about" }; renderOverlays(); break;
      case "help.discord": toast("discord.gg/artcraft — joining the community"); break;
      case "help.website": toast("getartcraft.com/apps/printcraft"); break;
      case "help.docs": toast("Documentation — github.com/storytold/printcraft"); break;
      case "sign.digital": case "sign.validate": toast("Digitally sign — choose a certificate"); break;
      case "redact.clear": toast("Cleared all 3 marks"); break;
      case "redact.apply": toast("Redacting 3 marks — this cannot be undone"); break;
      case "protect.password": state.dialog = { type: "open", title: "Protect Using Password", body: "Set a document open password and choose which permissions to allow." }; renderOverlays(); break;
      default:
        if (id.startsWith("comment.")) { state.quickTool = { kind: "comment", id: id.split(".")[1] }; renderDoc(); toast(`${c ? c.label : id.replace("comment.", "")} tool selected`); return; }
        if (id.startsWith("sign.fill.")) { state.fillTool = id.split(".")[2]; state.quickTool = { kind: "fill" }; renderDoc(); toast(`${c ? c.label : id} tool selected`); return; }
        if (id.startsWith("panel.")) { openRight(id.split(".")[1]); return; }
        toast(`${c ? c.label : id} — demo command`);
    }
  }

  /* Add a comment to the current page (comments_panel.rs “Add a comment”). */
  function addComment() {
    const body = state.commentAdd.trim();
    if (!body) return;
    state.comments.unshift({ page: state.current, author: "Marta Oliveira", time: "just now", body, tool: "Note", state: null, replies: [] });
    state.commentAdd = "";
    if (state.right !== "comments") openRight("comments"); else renderRight();
    toast("Comment added to page " + D.PAGES[state.current].label);
  }

  /* ── Delegated events ───────────────────────────────────────────────────── */
  document.addEventListener("click", (e) => {
    const target = e.target.closest("[data-act]");
    const inMenu = e.target.closest(".menu");
    if (!target) {
      if (state.menuStack.length && !inMenu) { state.menuStack = []; renderOverlays(); }
      return;
    }
    const act = target.dataset.act, arg = target.dataset.arg;

    // Nested twister inside a bookmark row: don't also navigate.
    if (act === "bookmark.twist") e.stopPropagation();

    switch (act) {
      case "view.home": state.view = "home"; renderAll(); break;
      case "tab.select": state.view = "doc"; state.activeTab = arg; renderAll(); break;
      case "tab.close": {
        if (state.tabs.length === 1) { toast("Can't close the last tab"); break; }
        state.tabs = state.tabs.filter((t) => t.id !== arg);
        if (state.activeTab === arg) state.activeTab = state.tabs[0].id;
        renderAll(); break;
      }
      case "dialog.open": state.dialog = { type: "open", title: "Open", body: "Choose a PDF to open. In this demo, files are simulated." }; renderOverlays(); break;
      case "theme.toggle": {
        state.theme = state.theme === "light" ? "dark" : "light";
        document.documentElement.dataset.theme = state.theme;
        renderChrome();
        toast(state.theme === "dark" ? "Dark gray theme" : "Light gray theme");
        break;
      }
      case "menu.main": {
        const r = target.getBoundingClientRect();
        mainMenu(r.left, r.bottom + 4);
        break;
      }
      case "menu.sub": {
        // A submenu key may come from the root menu (SUBS) or from a nested menu
        // (View ▸ Display theme, View ▸ Side panels): look in both.
        let subs = SUBS[arg] ? SUBS[arg]() : null;
        if (!subs) {
          for (const m of state.menuStack) {
            const it = m.items.find((x) => x.type === "sub" && x.key === arg);
            if (it && it.sub) { subs = it.sub; break; }
          }
        }
        if (!subs) { toast("Submenu: " + arg); break; }
        const r = target.getBoundingClientRect();
        state.menuStack = [...state.menuStack.slice(0, 1), { x: r.right + 2, y: r.top - 6, items: subs }];
        renderOverlays();
        break;
      }
      case "menu.item": case "menu.radio": {
        state.menuStack = [];
        // Quick-bar flyouts reuse the menu renderer: arg is "flyout|group|tool".
        if (String(arg).startsWith("flyout|")) {
          const [, gid, tid] = String(arg).split("|");
          if (gid === "fill") { state.fillTool = tid; state.quickTool = { kind: "fill" }; }
          else { state.commentGroupTool[Number(gid)] = tid; state.quickTool = { kind: "comment", id: tid }; }
          renderAll();
          break;
        }
        const [a, b] = act === "menu.radio" ? arg.split("|") : [arg, ""];
        if (a === "menu.zoom") { ({ actual: () => setZoom(1), page: () => setZoom(0.85), width: () => setZoom(0.95), in: () => zoomStep(true), out: () => zoomStep(false) })[b](); renderOverlays(); break; }
        if (a === "menu.layout") { toast(`Page display: ${b}`); renderOverlays(); break; }
        if (a === "menu.theme") {
          state.theme = b === "system" ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light") : b;
          document.documentElement.dataset.theme = state.theme;
          renderAll(); toast(b === "system" ? "Following the system setting" : (state.theme === "dark" ? "Dark gray theme" : "Light gray theme")); break;
        }
        if (a === "menu.panel") { openRight(b); renderOverlays(); break; }
        renderOverlays(); runCommand(a); break;
      }
      case "mode.select": setMode(arg); break;
      case "left.open": state.left = { kind: "tool", id: arg }; renderLeft(); renderModebar(); break;
      case "left.open_mode": state.view = "doc"; state.leftOpen = true; state.left = { kind: "tool", id: arg }; renderAll(); break;
      case "left.back": state.left = { kind: "all" }; state.mode = "All tools"; renderLeft(); renderModebar(); break;
      case "left.close": state.leftOpen = false; renderLeft(); break;
      case "left.expand": state.allToolsExpanded = !state.allToolsExpanded; renderLeft(); break;
      case "left.form_preview": state.formPreview = !state.formPreview; renderLeft(); break;
      case "right.toggle": state.right === arg ? closeRight() : openRight(arg); break;
      case "right.open": openRight(arg); break;
      case "right.close": closeRight(); break;
      case "quick.tool": state.quickTool = { kind: arg }; renderDoc(); toast(`${target.dataset.tip} tool selected`); break;
      case "quick.stamp": state.quickTool = { kind: "stamp", label: arg }; renderDoc(); toast(`${arg} stamp — click the page to place it`); break;
      case "quick.comment_group": {
        const gi = Number(arg), g = D.COMMENT_GROUPS[gi];
        if (state.quickTool.kind === "comment" && g.tools.some((t) => t.id === state.quickTool.id)) {
          openToolFlyout(g, target);
        } else {
          const t = g.tools.find((x) => x.id === state.commentGroupTool[gi]);
          state.quickTool = { kind: "comment", id: t.id }; renderDoc(); toast(`${t.label} tool selected`);
        }
        break;
      }
      case "quick.fill_group": {
        if (state.quickTool.kind === "fill") openToolFlyout({ name: "Fill & Sign", tools: D.FILL_TOOLS }, target);
        else { state.fillTool = state.fillTool || "text"; state.quickTool = { kind: "fill" }; renderDoc(); toast("Fill & Sign tool selected"); }
        break;
      }
      case "run": state.menuStack = []; runCommand(arg); break;
      case "palette.open": openPalette(); break;
      case "palette.close": state.paletteOpen = false; renderOverlays(); break;
      case "palette.run": {
        state.paletteOpen = false; renderOverlays();
        if (arg.startsWith("left.open:")) { state.left = { kind: "tool", id: arg.split(":")[1] }; renderLeft(); }
        else if (arg.startsWith("run:")) runCommand(arg.slice(4));
        else runCommand(arg);
        break;
      }
      case "notice.close": state.noticeDismissed = true; renderDoc(); break;
      case "find.next": goToMatch(state.findIndex + 1); break;
      case "find.prev": goToMatch(state.findIndex - 1); break;
      case "find.options": state.dialog = { type: "findoptions" }; renderOverlays(); break;
      case "find.close": state.findOpen = false; renderDoc(); break;
      case "zoom.in": zoomStep(true); break;
      case "zoom.out": zoomStep(false); break;
      case "view.rotate": toast("Rotated the view clockwise"); break;
      case "view.fit_width": setZoom(Math.abs(state.zoom - 0.95) < 0.001 ? 0.85 : 0.95); break;
      case "page.next": goPage(state.current + 1); break;
      case "page.prev": goPage(state.current - 1); break;
      case "page.go": goPage(Number(arg)); break;
      case "bookmark.go": goPage(Number(arg)); break;
      case "bookmark.twist": {
        const on = state.openBookmarks.has(arg);
        on ? state.openBookmarks.delete(arg) : state.openBookmarks.add(arg);
        renderRight(); break;
      }
      case "comment.select": {
        state.comments.forEach((c, i) => { c.selected = i === Number(arg); });
        renderRight(); const p = state.comments[Number(arg)]; if (p) goPage(p.page); break;
      }
      case "comment.focus": goPage(state.comments[Number(arg)].page); break;
      case "comment.reply": {
        const i = Number(arg), text = (state.replyDraft[i] || "").trim();
        if (!text) break;
        state.comments[i].replies.push({ author: "Marta Oliveira", time: "just now", body: text });
        state.replyDraft[i] = ""; renderRight(); toast("Reply posted"); break;
      }
      case "comment.add": addComment(); break;
      case "field.go": goPage(Number(arg)); break;
      case "layer.visible": state.layers[Number(arg)].visible = !state.layers[Number(arg)].visible; renderRight(); break;
      case "layer.lock": state.layers[Number(arg)].locked = !state.layers[Number(arg)].locked; renderRight(); break;
      case "attach.open": toast(`Opening ${arg}`); break;
      case "search.go": {
        const i = Number(arg); state.searchPanelIndex = i; goToMatch(i); renderRight(); break;
      }
      case "organize.exit": state.organize = false; renderAll(); break;
      case "organize.select": {
        const i = Number(arg);
        if (e.shiftKey || e.metaKey || e.ctrlKey) state.selectedPages.has(i) ? state.selectedPages.delete(i) : state.selectedPages.add(i);
        else state.selectedPages = new Set([i]);
        renderDoc(); break;
      }
      case "organize.action": {
        if (arg === "all") { state.selectedPages = new Set(D.PAGES.map((_, i) => i)); renderDoc(); break; }
        const n = state.selectedPages.size;
        if (!n) { toast("Select pages first"); break; }
        const verbs = { rotate: "Rotated", delete: "Deleted", extract: "Extracted", insert: "Inserted pages before", duplicate: "Duplicated" };
        toast(`${verbs[arg]} ${n} page${n === 1 ? "" : "s"}`);
        if (arg === "delete") { state.selectedPages.clear(); renderDoc(); }
        break;
      }
      case "dialog.close": state.dialog = null; renderOverlays(); break;
      case "dialog.confirm": state.dialog = null; renderOverlays(); toast(arg || "Done"); break;
      case "props.tab": state.propsTab = arg; renderOverlays(); break;
      case "help.discord": case "help.website": case "help.docs": runCommand(act); break;
      default: break;
    }
  });

  /* Quick-bar flyouts (clicking an active group, or right-clicking any group). */
  function openToolFlyout(g, anchor) {
    const r = anchor.getBoundingClientRect();
    const isFill = g.name === "Fill & Sign";
    const gi = D.COMMENT_GROUPS.indexOf(D.COMMENT_GROUPS.find((x) => x.name === g.name));
    const items = g.tools.map((t) => ({
      type: "item", label: t.label, icon: t.icon,
      act: `flyout|${isFill ? "fill" : gi}|${t.id}`,
      checked: isFill ? state.fillTool === t.id : (state.quickTool.kind === "comment" && state.quickTool.id === t.id),
    }));
    state.menuStack = [{ x: r.right + 6, y: r.top - 4, items: items.map((it) => ({ ...it, type: "check" })) }];
    renderOverlays();
  }

  /* Input handling: values land in state; only the affected sub-view re-renders. */
  document.addEventListener("input", (e) => {
    const el = e.target.closest("[data-model]");
    if (!el) return;
    const model = el.dataset.model;
    const val = el.type === "checkbox" ? el.checked : el.value;

    switch (model) {
      case "findQuery":
        state.findQuery = val;
        // Only the status line changes while typing — the input keeps focus.
        if (state.findQuery.toLowerCase().includes("type")) state.findIndex = 9;
        renderFindStatus();
        break;
      case "paletteQuery":
        state.paletteQuery = val; state.paletteSel = 0; renderOverlays();
        requestAnimationFrame(() => { const i = $("#paletteInput"); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } });
        break;
      case "commentQuery": state.commentQuery = val; renderCommentsList(); break;
      case "commentAdd": state.commentAdd = val; break;
      case "reply": state.replyDraft[el.dataset.arg] = val; break;
      case "searchPanelQuery": state.searchPanelQuery = val; renderRight(); requestAnimationFrame(() => focusRightInput()); break;
      case "findWords": state.findWords = val; break;
      case "findCase": state.findCase = val; break;
      default: break;
    }
  });

  function renderFindStatus() {
    const s = $(".findbar__status");
    if (s) s.textContent = state.findQuery.trim() ? (state.findQuery.toLowerCase().includes("type") ? `${state.findIndex + 1} of ${D.SEARCH_HITS.length}` : "No matches") : "";
  }
  function renderCommentsList() {
    // Only the card list is rebuilt while typing, so the search field keeps focus.
    const el = $("#commentsList");
    if (el) el.innerHTML = commentCardsHtml();
  }
  function focusRightInput() {
    const el = $('[data-model="searchPanelQuery"]');
    if (el && document.activeElement !== el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); }
  }

  /* Enter commits: page input, add-comment box, reply boxes. */
  document.addEventListener("keydown", (e) => {
    const el = e.target instanceof Element ? e.target.closest("[data-model]") : null;
    if (el && e.key === "Enter") {
      const m = el.dataset.model;
      if (m === "pageInput") {
        const typed = el.value.trim();
        const idx = D.PAGES.findIndex((p) => p.label.toLowerCase() === typed.toLowerCase());
        const num = Number(typed);
        goPage(idx >= 0 ? idx : (Number.isFinite(num) && num >= 1 ? num - 1 : state.current));
        el.blur();
        return;
      }
      if (m === "commentAdd") { addComment(); return; }
      if (m === "reply") { document.querySelector(`[data-act="comment.reply"][data-arg="${el.dataset.arg}"]`)?.click(); return; }
      if (m === "searchPanelQuery") { el.blur(); return; }
    }
    // Palette Enter runs the top hit.
    if (state.paletteOpen && e.key === "Enter") {
      const hits = paletteHits();
      if (hits[state.paletteSel]) { const h = hits[state.paletteSel]; state.paletteOpen = false; renderOverlays(); h.act.startsWith("left.open:") ? (state.left = { kind: "tool", id: h.act.split(":")[1] }, renderLeft()) : runCommand(h.act.startsWith("run:") ? h.act.slice(4) : h.act); }
      e.preventDefault();
      return;
    }
    if (state.paletteOpen && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      state.paletteSel = Math.max(0, state.paletteSel + (e.key === "ArrowDown" ? 1 : -1));
      renderOverlays(); e.preventDefault(); return;
    }
  }, true);

  /* ── 5. Keyboard shortcuts ──────────────────────────────────────────────── */
  document.addEventListener("keydown", (e) => {
    const mod = e.metaKey || e.ctrlKey;
    const typing = /^(INPUT|TEXTAREA)$/.test(document.activeElement?.tagName);
    if (e.key === "Escape") {
      if (state.dialog) { state.dialog = null; renderOverlays(); return; }
      if (state.menuStack.length) { state.menuStack = []; renderOverlays(); return; }
      if (state.paletteOpen) { state.paletteOpen = false; renderOverlays(); return; }
      if (state.findOpen) { state.findOpen = false; renderDoc(); return; }
      if (state.quickTool.kind !== "select") { state.quickTool = { kind: "select" }; renderDoc(); }
      return;
    }
    if (mod && e.key.toLowerCase() === "k") { e.preventDefault(); openPalette(); return; }
    if (mod && e.key.toLowerCase() === "f") { e.preventDefault(); state.findOpen = true; renderDoc(); requestAnimationFrame(() => $("#findInput")?.focus()); return; }
    if (mod && e.shiftKey && e.key.toLowerCase() === "f") { e.preventDefault(); openRight("search"); return; }
    if (mod && e.key.toLowerCase() === "g") { e.preventDefault(); goToMatch(state.findIndex + (e.shiftKey ? -1 : 1)); return; }
    if (mod && e.key.toLowerCase() === "s") { e.preventDefault(); runCommand(e.shiftKey ? "file.save_as" : "file.save"); return; }
    if (mod && e.key.toLowerCase() === "o") { e.preventDefault(); runCommand("file.open"); return; }
    if (mod && e.key.toLowerCase() === "p") { e.preventDefault(); runCommand("file.print"); return; }
    if (mod && e.key.toLowerCase() === "d") { e.preventDefault(); runCommand("doc.properties"); return; }
    if (mod && e.key === ",") { e.preventDefault(); runCommand("edit.preferences"); return; }
    if (mod && e.key === "1") { e.preventDefault(); setZoom(1); return; }
    if (mod && e.key === "0") { e.preventDefault(); setZoom(0.85); return; }
    if (mod && e.key === "2") { e.preventDefault(); setZoom(0.95); return; }
    if (mod && (e.key === "=" || e.key === "+")) { e.preventDefault(); zoomStep(true); return; }
    if (mod && e.key === "-") { e.preventDefault(); zoomStep(false); return; }
    if (mod && e.key === "l") { e.preventDefault(); runCommand("view.full_screen"); return; }
    if (mod && e.key === "ArrowRight") { e.preventDefault(); goPage(state.current + 1); return; }
    if (mod && e.key === "ArrowLeft") { e.preventDefault(); goPage(state.current - 1); return; }
    if (typing) return;
    if (e.key === "v") { state.quickTool = { kind: "select" }; renderDoc(); }
    if (e.key === "h") { state.quickTool = { kind: "hand" }; renderDoc(); }
    if (e.key === "Home") goPage(0);
    if (e.key === "End") goPage(D.PAGES.length - 1);
  });

  /* ── Tooltips (widgets.rs: 0.35 s delay) ────────────────────────────────── */
  let tipEl = null, tipTimer = null;
  document.addEventListener("mouseover", (e) => {
    const el = e.target.closest("[data-tip]");
    clearTimeout(tipTimer);
    if (!el || !el.dataset.tip) return;
    const r = el.getBoundingClientRect();
    tipTimer = setTimeout(() => {
      tipEl = document.createElement("div");
      tipEl.className = "tooltip";
      tipEl.textContent = el.dataset.tip;
      tipEl.style.left = Math.min(window.innerWidth - 330, r.left) + "px";
      tipEl.style.top = (r.bottom + 6) + "px";
      document.body.appendChild(tipEl);
    }, 350);
  });
  document.addEventListener("mouseout", (e) => {
    if (e.target.closest("[data-tip]")) { clearTimeout(tipTimer); tipEl?.remove(); tipEl = null; }
  });

  /* ── Right-panel resize handle (UI-15) ──────────────────────────────────── */
  let resizing = false;
  document.addEventListener("mousedown", (e) => {
    const h = e.target.closest(".panel-resize");
    if (!h) return;
    resizing = true; e.preventDefault();
    document.body.style.cursor = "col-resize";
  });
  document.addEventListener("mousemove", (e) => {
    if (!resizing) return;
    state.rightWidth = Math.max(260, Math.min(520, window.innerWidth - e.clientX));
    const el = $("#rightPanel"); if (el) el.style.width = state.rightWidth + "px";
  });
  document.addEventListener("mouseup", () => { resizing = false; document.body.style.cursor = ""; });

  /* ── 6. Boot ────────────────────────────────────────────────────────────── */
  document.documentElement.dataset.theme = state.theme;
  // A resize handle between the document area and the right panel (UI-15).
  const handle = document.createElement("div");
  handle.className = "panel-resize";
  document.getElementById("workspace").insertBefore(handle, document.getElementById("rail"));
  renderAll();

  // Focus the find input when the find bar first opens (keyboard flow).

  // Expose a minimal API for the docs/tests: PC.state, PC.runCommand.
  window.PC = { state, runCommand, renderAll };
})();
