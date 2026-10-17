/* ============================================================================
   Demo data for the PrintCraft design demo.
   Mirrors the engine catalogue (crates/engine/src/catalog.rs) and the shape of
   a real session (a 13-page specimen PDF with comments, bookmarks and fields).
   Nothing here talks to a backend: it exists so every UI component can be seen
   in a realistic state.
   ========================================================================== */
window.PC_DATA = (() => {
  "use strict";

  /* ── Tool catalogue ──────────────────────────────────────────────────────
     id,label,icon,hue,availability,sections[]. Named after TOOL_GROUPS.
     availability: "ready" | "M6".."M13" (planned) | "ai" (optional provider). */
  const G = (id, label, icon, hue, availability, sections, badge = null) =>
    ({ id, label, icon, hue, availability, badge, sections });
  const S = (title, items) => ({ title, items });
  const it = (label, icon, command, availability) => ({ label, icon, command, availability });

  const G_HUES = {
    red: "#e03e3e", purple: "#8e4ee6", blue: "#3a6fe8",
    green: "#2d9d5b", orange: "#e88a1a", teal: "#149ca8", pink: "#d63b8f",
  };

  const TOOL_GROUPS = [
    G("export", "Export a PDF", "file-output", "blue", "ready", [S("Export to", [
      it("Microsoft Word (.docx)", "file-text", "export.docx", "ready"),
      it("Spreadsheet (.xlsx)", "grid-3x3", "export.xlsx", "M10"),
      it("Presentation (.pptx)", "presentation", "export.pptx", "M10"),
      it("Image (PNG)", "image", "export.image", "ready"),
      it("Export all images", "image", "export.all_images", "ready"),
      it("HTML web page", "file-symlink", "export.html", "ready"),
      it("Rich Text Format (.rtf)", "file-text", "export.rtf", "ready"),
      it("Text (plain)", "type", "export.text", "ready"),
      it("PostScript / EPS", "file-down", "export.ps", "M10"),
    ])]),
    G("fill_sign", "Fill & Sign", "pen-line", "purple", "ready", [S("Fill", [
      it("Add text", "type", "sign.fill.text", "ready"),
      it("Checkmark", "check", "sign.fill.check", "ready"),
      it("Cross", "x", "sign.fill.cross", "ready"),
      it("Dot", "circle-dot", "sign.fill.dot", "ready"),
      it("Line", "minus", "sign.fill.line", "ready"),
      it("Date", "clock-3", "sign.fill.date", "ready"),
      it("Signature", "signature", "sign.fill.signature", "ready"),
      it("Initials", "signature", "sign.fill.initials", "ready"),
    ])]),
    G("edit", "Edit a PDF", "file-pen-line", "pink", "M7", [
      S("Modify page", [
        it("Rotate pages", "rotate-cw", "page.rotate", "ready"),
        it("Insert pages", "file-plus-2", "page.insert", "ready"),
        it("Delete pages", "trash-2", "page.delete", "ready"),
        it("Extract pages", "file-output", "page.extract", "ready"),
        it("Organize pages", "layout-grid", "page.organize", "ready"),
      ]),
      S("Add content", [
        it("Edit text & images", "text-cursor-input", "edit.edit_text", "ready"),
        it("Text", "type", "edit.text", "ready"),
        it("Image", "image-plus", "edit.image", "ready"),
        it("Header and footer", "heading", "edit.header_footer", "ready"),
        it("Watermark", "stamp", "edit.watermark", "ready"),
        it("Link", "link-2", "edit.link", "ready"),
        it("Bates numbering", "hash", "edit.bates", "ready"),
        it("Background", "palette", "edit.background", "ready"),
        it("Attach file", "paperclip", "edit.attach", "M12"),
      ]),
    ]),
    G("create", "Create a PDF", "file-plus-2", "red", "ready", [S("Create from", [
      it("Single file", "file-input", "create.file", "ready"),
      it("Multiple files", "files", "create.multiple", "M10"),
      it("Images", "image", "create.images", "ready"),
      it("Clipboard", "copy-plus", "create.clipboard", "ready"),
      it("Blank page", "file-plus-2", "create.blank", "ready"),
    ])]),
    G("combine", "Combine files", "files", "blue", "ready", [
      S("Combine", [it("Add files to combine", "files", "page.combine", "ready")]),
    ]),
    G("organize", "Organize pages", "layout-grid", "green", "ready", [
      S("Page options", [
        it("Page grid", "layout-grid", "page.organize", "ready"),
        it("Rotate", "rotate-cw", "page.rotate", "ready"),
        it("Delete", "trash-2", "page.delete", "ready"),
        it("Extract", "file-output", "page.extract", "ready"),
        it("Insert", "file-plus-2", "page.insert", "ready"),
        it("Replace", "replace", "page.replace", "ready"),
        it("Split", "scissors", "page.split", "ready"),
      ]),
      S("More", [
        it("Set page boxes", "square-dashed-mouse-pointer", "page.boxes", "ready"),
        it("Crop pages", "crop", "page.crop", "ready"),
        it("Duplicate pages", "copy-plus", "page.duplicate", "ready"),
        it("Page labels", "tag", "page.number", "ready"),
        it("Page transitions", "presentation", "page.transitions", "M4"),
      ]),
    ]),
    G("comment", "Add comments", "message-square-text", "orange", "ready", [
      S("Markup", [
        it("Sticky note", "sticky-note", "comment.note", "ready"),
        it("Highlight text", "highlighter", "comment.highlight", "ready"),
        it("Underline", "underline", "comment.underline", "ready"),
        it("Strikethrough", "strikethrough", "comment.strikeout", "ready"),
        it("Squiggly underline", "spline", "comment.squiggly", "ready"),
        it("Text box", "type", "comment.freetext", "ready"),
      ]),
      S("Drawing", [
        it("Draw freehand", "pencil", "comment.ink", "ready"),
        it("Rectangle", "square", "comment.square", "ready"),
        it("Oval", "circle", "comment.circle", "ready"),
        it("Line", "minus", "comment.line", "ready"),
        it("Arrow", "move-right", "comment.arrow", "ready"),
        it("Cloud", "cloud", "comment.cloud", "M5"),
        it("Stamp", "stamp", "comment.stamp", "M5"),
      ]),
      S("Review", [
        it("Comment list", "message-square-text", "comment.list", "ready"),
        it("Flatten comments", "layers", "comment.flatten", "ready"),
      ]),
    ]),
    G("scan", "Scan & OCR", "scan-text", "green", "ready", [S("Recognize text", [
      it("In this file", "scan-text", "ocr.recognize", "ready"),
      it("In multiple files", "files", "ocr.recognize_batch", "ready"),
      it("Enhance scanned file", "sparkles", "ocr.enhance", "M10"),
      it("Correct recognized text", "text-select", "ocr.correct", "M10"),
    ])]),
    G("protect", "Protect a PDF", "shield-check", "blue", "M8", [
      S("Protect", [
        it("Protect with password", "lock", "protect.password", "ready"),
        it("Remove hidden information", "eye-off", "protect.remove_hidden", "ready"),
      ]),
      S("Advanced options", [
        it("Encrypt with certificate", "file-lock-2", "protect.certificate", "M8"),
        it("Security properties", "shield-check", "protect.properties", "ready"),
        it("Remove security", "lock-open", "protect.remove", "ready"),
      ]),
    ]),
    G("redact", "Redact a PDF", "rectangle-horizontal", "red", "ready", [S("Redact", [
      it("Redact text and images", "rectangle-horizontal", "redact.mark", "ready"),
      it("Redact pages", "file-x", "redact.pages", "ready"),
      it("Find text and redact", "file-search", "redact.search", "ready"),
      it("Set properties", "settings-2", "redact.properties", "ready"),
      it("Sanitize document", "sparkles", "redact.sanitize", "ready"),
    ])]),
    G("compress", "Compress a PDF", "file-down", "red", "ready", [S("Optimize", [
      it("Reduce file size", "file-down", "optimize.reduce", "ready"),
      it("Advanced optimization", "settings-2", "optimize.advanced", "ready"),
      it("Audit space usage", "gauge", "optimize.audit", "M11"),
    ])]),
    G("form", "Prepare a form", "text-cursor-input", "purple", "ready", [
      S("Fields", [
        it("Field list", "list", "form.fields", "ready"),
        it("Detect form fields", "scan", "form.detect", "ready"),
        it("Clear form", "eraser", "form.clear", "ready"),
        it("Field properties", "settings-2", "form.field.properties", "ready"),
        it("Tab order by rows", "rows-3", "form.tab_order.row", "ready"),
        it("Tab order by columns", "columns-3", "form.tab_order.column", "ready"),
        it("Flatten form fields", "layers", "form.flatten", "ready"),
        it("Import data", "file-input", "form.import_data", "ready"),
        it("Export data", "file-output", "form.export_data", "ready"),
      ]),
      S("Add form components", [
        it("Text field", "text-cursor-input", "form.add.text", "ready"),
        it("Checkbox", "check-circle-2", "form.add.checkbox", "ready"),
        it("Radio button", "circle", "form.add.radio", "ready"),
        it("Drop-down list", "chevron-down", "form.add.combo", "ready"),
        it("List box", "list", "form.add.list", "ready"),
        it("Button", "square", "form.add.button", "ready"),
        it("Image field", "image", "form.add.image", "ready"),
        it("Date field", "clock-3", "form.add.date", "ready"),
        it("Digital signature", "signature", "form.add.signature", "ready"),
      ]),
    ]),
    G("stamp", "Add a stamp", "stamp", "purple", "ready", [
      S("Stamps", [it("Stamp palette", "stamp", "comment.stamp", "ready")]),
    ]),
    G("certificate", "Use a certificate", "badge-check", "teal", "ready", [S("Certificates", [
      it("Digitally sign", "signature", "sign.digital", "ready"),
      it("Timestamp", "clock-3", "sign.timestamp", "M9"),
      it("Validate all signatures", "badge-check", "sign.validate", "ready"),
      it("Certify (visible signature)", "badge-check", "sign.certify", "ready"),
      it("Certify (invisible signature)", "badge-check", "sign.certify_invisible", "ready"),
    ])]),
    G("print_production", "Use print production", "printer", "purple", "M11", [S("Print production", [
      it("Output preview", "layers", "prepress.output_preview", "M11"),
      it("Preflight", "file-check", "preflight.run", "M11"),
      it("Convert colors", "palette", "prepress.convert_colors", "M11"),
      it("Set page boxes", "square-dashed-mouse-pointer", "page.boxes", "ready"),
      it("Add printer marks", "ruler", "prepress.marks", "M11"),
      it("Fix hairlines", "minus", "prepress.hairlines", "M11"),
    ])]),
    G("measure", "Measure objects", "ruler", "pink", "M12", [S("Measure", [
      it("Measuring tool", "ruler", "measure.distance", "M12"),
      it("Geospatial location", "compass", "measure.geo", "M12"),
    ])]),
    G("compare", "Compare files", "git-compare", "pink", "ready", [
      S("Compare", [it("Select files to compare", "git-compare", "doc.compare", "ready")]),
    ]),
    G("actions", "Use guided actions", "list-checks", "purple", "ready", [S("Actions list", [
      it("Action Wizard", "list-checks", "actions.wizard", "ready"),
      it("Make accessible", "accessibility", "actions.make_accessible", "M13"),
      it("Prepare for distribution", "send", "actions.distribution", "ready"),
      it("Optimize scanned documents", "scan-text", "actions.optimize_scans", "ready"),
      it("Archive documents", "file-check", "actions.archive", "M13"),
    ])]),
    G("accessibility", "Prepare for accessibility", "accessibility", "purple", "ready", [S("Accessibility", [
      it("Automatically tag PDF", "tag", "a11y.autotag", "M12"),
      it("Change reading options", "book-open", "a11y.reading_options", "ready"),
      it("Check for accessibility", "accessibility", "a11y.check", "ready"),
      it("Open accessibility report", "file-text", "a11y.report", "ready"),
      it("Add alternate text", "image", "a11y.alt_text", "ready"),
      it("Fix reading order", "list-ordered", "a11y.reading_order", "M12"),
    ])]),
    G("standards", "Apply PDF standards", "file-check", "red", "ready", [S("Standards", [
      it("Save as PDF/A", "file-check", "standards.pdfa", "ready"),
      it("Save as PDF/X", "file-check", "standards.pdfx", "M11"),
      it("Save as PDF/UA", "accessibility", "standards.pdfua", "M11"),
      it("Preflight", "file-check", "preflight.run", "M11"),
    ])]),
    G("search_index", "Add search index", "file-search", "green", "M12", [
      S("Index", [it("Manage embedded index", "file-search", "search.index", "M12")]),
    ]),
    G("javascript", "Use JavaScript", "braces", "blue", "M6", [S("JavaScript", [
      it("Console", "braces", "js.console", "M6"),
      it("Document JavaScripts", "file-text", "js.document", "M6"),
      it("Document actions", "list-checks", "js.actions", "M6"),
    ])]),
    G("ai", "AI assistant", "sparkles", "pink", "ai", [S("Bring your own model (off by default)", [
      it("Summarize", "sparkles", "ai.summary", "ai"),
      it("Ask about this document", "message-circle-reply", "ai.ask", "ai"),
      it("Translate", "languages", "ai.translate", "ai"),
    ])], "Optional"),
  ];

  /* The five tools the Home tab recommends, in PrintCraft's order. */
  const RECOMMENDED = ["organize", "comment", "form", "edit", "protect"];

  /* ── The quick-action bar ────────────────────────────────────────────────
     Vertical floating strip; groups open a flyout on second click / right-click. */
  const COMMENT_GROUPS = [
    { name: "Comment", icon: "message-square-text", tools: [
      { id: "note", label: "Sticky note", icon: "sticky-note", command: "comment.note" },
      { id: "textbox", label: "Text box", icon: "type", command: "comment.freetext" },
      { id: "callout", label: "Callout", icon: "message-square-quote", command: "comment.callout" },
      { id: "attach", label: "Attach file", icon: "paperclip", command: "comment.attach" },
    ]},
    { name: "Highlight", icon: "highlighter", tools: [
      { id: "highlight", label: "Highlight text", icon: "highlighter", command: "comment.highlight" },
      { id: "underline", label: "Underline", icon: "underline", command: "comment.underline" },
      { id: "strikeout", label: "Strikethrough", icon: "strikethrough", command: "comment.strikeout" },
      { id: "squiggly", label: "Squiggly underline", icon: "spline", command: "comment.squiggly" },
      { id: "caret", label: "Insert text", icon: "text-select", command: "comment.caret" },
      { id: "replace", label: "Replace text", icon: "replace", command: "comment.replace" },
    ]},
    { name: "Draw", icon: "pencil", tools: [
      { id: "ink", label: "Draw freehand", icon: "pencil", command: "comment.ink" },
      { id: "line", label: "Line", icon: "minus", command: "comment.line" },
      { id: "arrow", label: "Arrow", icon: "move-right", command: "comment.arrow" },
      { id: "rect", label: "Rectangle", icon: "square", command: "comment.square" },
      { id: "oval", label: "Oval", icon: "circle", command: "comment.circle" },
      { id: "polyline", label: "Polyline", icon: "pen-tool", command: "comment.polyline" },
      { id: "polygon", label: "Polygon", icon: "pentagon", command: "comment.polygon" },
      { id: "cloud", label: "Cloud", icon: "cloud", command: "comment.cloud" },
      { id: "eraser", label: "Eraser", icon: "eraser", command: "comment.eraser" },
    ]},
  ];

  const FILL_TOOLS = [
    { id: "text", label: "Add text", icon: "type", command: "sign.fill.text" },
    { id: "check", label: "Checkmark", icon: "check", command: "sign.fill.check" },
    { id: "cross", label: "Cross", icon: "x", command: "sign.fill.cross" },
    { id: "dot", label: "Dot", icon: "circle-dot", command: "sign.fill.dot" },
    { id: "line", label: "Line", icon: "minus", command: "sign.fill.line" },
    { id: "date", label: "Date", icon: "clock-3", command: "sign.fill.date" },
    { id: "signature", label: "Signature", icon: "signature", command: "sign.fill.signature" },
    { id: "initials", label: "Initials", icon: "signature", command: "sign.fill.initials" },
  ];

  /* Single-tool buttons after the Fill & Sign group (canvas.rs::quick_bar). */
  const QUICK_TOOLS = [
    { id: "crop", label: "Crop pages", icon: "crop", command: "page.crop" },
    { id: "redact", label: "Redact text and images", icon: "rectangle-horizontal", command: "redact.mark" },
    { id: "editText", label: "Edit text & images", icon: "text-cursor-input", command: "edit.edit_text" },
    { id: "addText", label: "Add text", icon: "type", command: "edit.text" },
    { id: "link", label: "Link", icon: "link-2", command: "edit.link" },
    { id: "sign", label: "Digitally sign", icon: "signature", command: "sign.digital" },
    { id: "marquee", label: "Marquee zoom", icon: "maximize-2", command: "view.marquee_zoom" },
    { id: "snapshot", label: "Take a snapshot", icon: "camera", command: "edit.snapshot" },
  ];

  /* ── Registered commands ─────────────────────────────────────────────────
     Drives the ⌘K palette, the menus and the shortcuts dialog. `enabled`
     marks the commands the demo actually performs. */
  const COMMANDS = [
    { id: "file.open", label: "Open…", menu: "File", icon: "folder-open", shortcut: "⌘O", enabled: true },
    { id: "file.save", label: "Save", menu: "File", icon: "save", shortcut: "⌘S", enabled: true },
    { id: "file.save_as", label: "Save As…", menu: "File", icon: "save", shortcut: "⇧⌘S", enabled: true },
    { id: "file.export", label: "Export a PDF…", menu: "File", icon: "file-output", enabled: true },
    { id: "file.print", label: "Print…", menu: "File", icon: "printer", shortcut: "⌘P", enabled: true },
    { id: "file.revert", label: "Revert", menu: "File", icon: "rotate-ccw", enabled: true },
    { id: "file.close", label: "Close", menu: "File", icon: "x", shortcut: "⌘W", enabled: true },
    { id: "edit.undo", label: "Undo", menu: "Edit", icon: "undo-2", shortcut: "⌘Z", enabled: true },
    { id: "edit.redo", label: "Redo", menu: "Edit", icon: "redo-2", shortcut: "⇧⌘Z", enabled: true },
    { id: "edit.copy", label: "Copy", menu: "Edit", icon: "copy", shortcut: "⌘C", enabled: true },
    { id: "edit.select_all", label: "Select All", menu: "Edit", icon: "square-dashed", shortcut: "⌘A", enabled: true },
    { id: "edit.find", label: "Find…", menu: "Edit", icon: "search", shortcut: "⌘F", enabled: true },
    { id: "edit.search", label: "Advanced Search…", menu: "Edit", icon: "search", shortcut: "⇧⌘F", enabled: true },
    { id: "edit.snapshot", label: "Take a Snapshot", menu: "Edit", icon: "camera", enabled: true },
    { id: "edit.preferences", label: "Preferences…", menu: "Edit", icon: "settings", shortcut: "⌘,", enabled: true },
    { id: "page.organize", label: "Organize Pages", menu: "Pages", icon: "layout-grid", enabled: true },
    { id: "page.rotate", label: "Rotate Pages…", menu: "Pages", icon: "rotate-cw", enabled: true },
    { id: "page.delete", label: "Delete Pages", menu: "Pages", icon: "trash-2", enabled: true },
    { id: "page.extract", label: "Extract Pages…", menu: "Pages", icon: "file-output", enabled: true },
    { id: "page.insert", label: "Insert Pages…", menu: "Pages", icon: "file-plus-2", enabled: true },
    { id: "page.split", label: "Split Document…", menu: "Pages", icon: "scissors", enabled: true },
    { id: "page.number", label: "Number Pages…", menu: "Pages", icon: "tag", enabled: true },
    { id: "view.zoom_in", label: "Zoom In", menu: "View", icon: "zoom-in", shortcut: "⌘+", enabled: true },
    { id: "view.zoom_out", label: "Zoom Out", menu: "View", icon: "zoom-out", shortcut: "⌘−", enabled: true },
    { id: "view.actual_size", label: "Actual Size", menu: "View", icon: "maximize-2", shortcut: "⌘1", enabled: true },
    { id: "view.fit_page", label: "Zoom to Page Level", menu: "View", icon: "columns-2", shortcut: "⌘0", enabled: true },
    { id: "view.fit_width", label: "Fit to Width", menu: "View", icon: "maximize", shortcut: "⌘2", enabled: true },
    { id: "view.rotate_cw", label: "Rotate View Clockwise", menu: "View", icon: "rotate-cw", shortcut: "⇧⌘+", enabled: true },
    { id: "view.full_screen", label: "Full Screen Mode", menu: "View", icon: "app-window", shortcut: "⌘L", enabled: true },
    { id: "view.read_mode", label: "Read Mode", menu: "View", icon: "book-open", enabled: true },
    { id: "doc.properties", label: "Document Properties…", menu: "Help", icon: "info", shortcut: "⌘D", enabled: true },
    { id: "help.shortcuts", label: "Keyboard Shortcuts", menu: "Help", icon: "circle-help", enabled: true },
    { id: "help.about", label: "About PrintCraft", menu: "Help", icon: "info", enabled: true },
    { id: "help.discord", label: "Join our Discord", menu: "Help", icon: "messages-square", enabled: true },
    /* Sub-panels, mirroring the rail. */
    { id: "panel.comments", label: "Comments", menu: null, icon: "message-square-text", enabled: true },
    { id: "panel.bookmarks", label: "Bookmarks", menu: null, icon: "bookmark", enabled: true },
    { id: "panel.pages", label: "Page Thumbnails", menu: null, icon: "files", enabled: true },
    { id: "panel.fields", label: "Form Fields", menu: null, icon: "text-cursor-input", enabled: true },
    { id: "panel.layers", label: "Layers", menu: null, icon: "layers", enabled: true },
    { id: "panel.attachments", label: "Attachments", menu: null, icon: "paperclip", enabled: true },
    { id: "panel.signatures", label: "Signatures", menu: null, icon: "signature", enabled: true },
    { id: "panel.search", label: "Advanced Search", menu: null, icon: "search", enabled: true },
  ];

  /* ── The open document (the PrintCraft Showcase specimen) ────────────────
     Page labels are the document's own (Cover, i, ii, 1…), as in the README. */
  const PAGES = [
    { label: "Cover", nav: "Cover" },
    { label: "i", nav: "Foreword" },
    { label: "ii", nav: "Contents" },
    { label: "1", nav: "Setting Text" },
    { label: "2", nav: "Expressive Type" },
    { label: "3", nav: "Scripts of the World" },
    { label: "4", nav: "Code and Images" },
    { label: "5", nav: "Color and Transparency" },
    { label: "6", nav: "Forms and Layers" },
    { label: "7", nav: "Accessibility" },
    { label: "8", nav: "Signatures" },
    { label: "9", nav: "Security" },
    { label: "10", nav: "Colophon" },
  ];

  const BOOKMARKS = [
    { label: "Cover", page: 0, children: [] },
    { label: "Foreword", page: 1, children: [] },
    { label: "Contents", page: 2, children: [] },
    { label: "Setting Text", page: 3, children: [
      { label: "Drop caps and pull quotes", page: 3, children: [] },
      { label: "Kerning and ligatures", page: 3, children: [] },
    ]},
    { label: "Expressive Type", page: 4, children: [
      { label: "Display faces", page: 4, children: [] },
    ]},
    { label: "Scripts of the World", page: 5, children: [] },
    { label: "Code and Images", page: 6, children: [] },
    { label: "Color and Transparency", page: 7, children: [] },
    { label: "Forms and Layers", page: 8, children: [] },
    { label: "Accessibility", page: 9, children: [] },
    { label: "Signatures", page: 10, children: [] },
    { label: "Security", page: 11, children: [] },
    { label: "Colophon", page: 12, children: [] },
  ];

  /* 20 threaded comments across the specimen (counts include replies). */
  const COMMENTS = [
    { page: 3, author: "Marta Oliveira", time: "2 min ago", body: "The drop cap sits a hair low against the first line. Nudge the baseline by 1 pt?", tool: "Note", selected: true, state: null,
      replies: [
        { author: "Sam Whitfield", time: "1 min ago", body: "Agreed — I'll re-align it in the master." },
        { author: "Marta Oliveira", time: "just now", body: "Marked", status: true },
      ]},
    { page: 3, author: "Sam Whitfield", time: "12 min ago", body: "Kerning between “Ty” and “pe” reads tight at 125%.", tool: "Highlight", state: "Resolved", replies: [] },
    { page: 3, author: "Priya Nair", time: "26 min ago", body: "Can we set the pull quote in the display face?", tool: "Text box", state: null, replies: [] },
    { page: 4, author: "Marta Oliveira", time: "38 min ago", body: "This specimen line is a good candidate for the cover.", tool: "Highlight", state: null, replies: [] },
    { page: 4, author: "Luis Ferreira", time: "41 min ago", body: "Add a note about the optical size axis.", tool: "Note", state: null, replies: [] },
    { page: 5, author: "Priya Nair", time: "1 h ago", body: "Vertical Japanese is rendered on its own layer — please check the reading order.", tool: "Highlight", state: "Resolved", replies: [] },
    { page: 5, author: "Sam Whitfield", time: "1 h ago", body: "Devanagari shaping looks correct now.", tool: "Underline", state: null, replies: [] },
    { page: 6, author: "Luis Ferreira", time: "2 h ago", body: "The listing needs a 4-space tab stop.", tool: "Note", state: null, replies: [] },
    { page: 6, author: "Marta Oliveira", time: "2 h ago", body: "Fractal image: export at 600 dpi for print.", tool: "Rectangle", state: null, replies: [] },
    { page: 7, author: "Priya Nair", time: "3 h ago", body: "Transparency group flattens correctly against the gradient.", tool: "Oval", state: null, replies: [] },
    { page: 8, author: "Sam Whitfield", time: "3 h ago", body: "Tab order runs left-to-right, top-to-bottom. Good.", tool: "Highlight", state: "Resolved", replies: [] },
    { page: 8, author: "Luis Ferreira", time: "4 h ago", body: "Add a required marker to the email field.", tool: "Note", state: null, replies: [] },
    { page: 9, author: "Marta Oliveira", time: "4 h ago", body: "Alt text for the figure is missing.", tool: "Highlight", state: null, replies: [] },
    { page: 9, author: "Priya Nair", time: "5 h ago", body: "Tags read in the right order; the table needs headers.", tool: "Underline", state: null, replies: [] },
    { page: 10, author: "Sam Whitfield", time: "5 h ago", body: "Signature is valid and the certificate chain is complete.", tool: "Note", state: "Resolved", replies: [] },
    { page: 10, author: "Luis Ferreira", time: "6 h ago", body: "Add a visible signature line on the colophon.", tool: "Text box", state: null, replies: [] },
    { page: 11, author: "Priya Nair", time: "6 h ago", body: "Permissions: printing allowed, assembly restricted.", tool: "Note", state: null, replies: [] },
    { page: 12, author: "Marta Oliveira", time: "1 d ago", body: "Colophon: credit Lucide and the OFL fonts.", tool: "Highlight", state: null, replies: [] },
    { page: 12, author: "Sam Whitfield", time: "1 d ago", body: "Version line should read 0.2.1.", tool: "Note", state: "Resolved", replies: [] },
    { page: 12, author: "Priya Nair", time: "1 d ago", body: "Ship it.", tool: "Note", state: null, replies: [] },
  ];

  const FIELDS = [
    { name: "full_name", label: "Full name", kind: "Text field", page: 8, value: "Marta Oliveira", required: true },
    { name: "email", label: "Email", kind: "Text field", page: 8, value: "marta@example.org" },
    { name: "subscribe", label: "Subscribe", kind: "Checkbox", page: 8, value: "Off" },
    { name: "plan", label: "Plan", kind: "Drop-down list", page: 8, value: "Studio" },
    { name: "signature", label: "Signature", kind: "Digital signature", page: 10, value: "—" },
  ];

  const LAYERS = [
    { name: "Body text", visible: true, locked: false },
    { name: "Captions", visible: true, locked: false },
    { name: "Artwork", visible: true, locked: true },
    { name: "Japanese vertical", visible: true, locked: false },
    { name: "Printer marks", visible: false, locked: false },
  ];

  const ATTACHMENTS = [
    { name: "showcase-data.csv", size: "18 KB", desc: "The tables in this specimen" },
    { name: "Inter-OFL.txt", size: "4 KB", desc: "Font licence" },
    { name: "brand-kit.pdf", size: "1.2 MB", desc: "Logos and colour chips" },
  ];

  const SIGNATURES = [
    { signer: "Sam Whitfield", when: "Today, 09:14", valid: true, reason: "I am the author of this document", issuer: "ArtCraft Test CA" },
  ];

  /* 16 hits for “type”, current match 10 — as the README's screenshot shows. */
  const SEARCH_HITS = [
    { page: 3, before: "…setting ", hit: "type", after: " is a matter of rhythm…" },
    { page: 3, before: "…the ", hit: "type", after: " sits on a 12 pt baseline grid…" },
    { page: 3, before: "…optical sizes let the ", hit: "type", after: " breathe at display sizes…" },
    { page: 4, before: "…expressive ", hit: "type", after: " needs a display face…" },
    { page: 4, before: "…contrast in ", hit: "type", after: " design…" },
    { page: 4, before: "…a ", hit: "type", after: "face with a large x-height…" },
    { page: 5, before: "…every writing system has its own ", hit: "type", after: " traditions…" },
    { page: 6, before: "…set code in a monospaced ", hit: "type", after: " face…" },
    { page: 6, before: "…the ", hit: "type", after: " of a variable font…" },
    { page: 7, before: "…colour and ", hit: "type", after: " interact…", current: true },
    { page: 7, before: "…registration of ", hit: "type", after: " over images…" },
    { page: 8, before: "…form fields use the interface ", hit: "type", after: " face…" },
    { page: 9, before: "…readable ", hit: "type", after: " for screen readers…" },
    { page: 10, before: "…the certificate names the ", hit: "type", after: " of signature…" },
    { page: 11, before: "…permissions depend on the ", hit: "type", after: " of protection…" },
    { page: 12, before: "…this ", hit: "type", after: " specimen was set in…" },
  ];

  /* ── Home tab: recent files ─────────────────────────────────────────────── */
  const RECENT = [
    { name: "PrintCraft-Showcase.pdf", path: "~/Documents/printcraft/showcase.pdf", pages: 13, size: "2.4 MB" },
    { name: "Expressive-Type-Specimen.pdf", path: "~/Documents/printcraft/specimen.pdf", pages: 24, size: "8.1 MB" },
    { name: "Form-W9-filled.pdf", path: "~/Downloads/form-w9-filled.pdf", pages: 2, size: "184 KB" },
    { name: "Annual-Report-2026.pdf", path: "~/Work/annual-report-2026.pdf", pages: 96, size: "31 MB" },
  ];

  /* ── Keyboard shortcuts (the Help ▸ Keyboard Shortcuts dialog) ──────────── */
  const SHORTCUTS = [
    ["⌘O", "Open…"], ["⌘S", "Save"], ["⇧⌘S", "Save As…"], ["⌘P", "Print…"],
    ["⌘Z", "Undo"], ["⇧⌘Z", "Redo"], ["⌘C", "Copy selected text"], ["⌘A", "Select all pages (Organize)"],
    ["⌘F", "Find"], ["⇧⌘F", "Advanced Search"], ["⌘G / ⇧⌘G", "Next / previous match"],
    ["⌘K", "Command palette"], ["⌘D", "Document properties"], ["⌘,", "Preferences"],
    ["⌘1", "Actual size"], ["⌘0", "Zoom to page level"], ["⌘2", "Fit to width"], ["⌘3", "Fit visible"],
    ["⌘+ / ⌘−", "Zoom in / out (also pinch or ⌘-scroll)"], ["⇧⌘+ / ⇧⌘−", "Rotate view"],
    ["Home / End", "First / last page"], ["⌘← / ⌘→", "Previous / next page"],
    ["V", "Select tool"], ["H", "Hand tool"], ["Delete", "Delete selected pages (Organize)"],
    ["Esc", "Clear selection / close find"], ["⌘L", "Full screen"], ["Double-click", "Select a word"],
  ];

  /* ── Page bodies (the specimen's own content) ───────────────────────────── */
  const pageBody = (i) => {
    const footer = (label) => `<div class="page__footer"><span>PrintCraft Showcase</span><span>${label}</span></div>`;
    switch (i) {
      case 0: return `
        <div class="kicker">An ArtCraft specimen</div>
        <h1>PrintCraft<br/>Showcase</h1>
        <p class="lede">Thirteen pages that exercise the parts of PDF that make a page feel right: world scripts, kerning, ligatures, gradients, transparency, forms and signatures.</p>
        <div class="pullquote">“Every save appends your changes and leaves the original bytes untouched.”</div>
        <div class="swatch-row">
          <div class="swatch" style="background:#1b63e0"></div>
          <div class="swatch" style="background:#149ca8"></div>
          <div class="swatch" style="background:#2d9d5b"></div>
          <div class="swatch" style="background:#e88a1a"></div>
          <div class="swatch" style="background:#e03e3e"></div>
        </div>
        ${footer("Cover")}`;
      case 1: return `
        <div class="kicker">Foreword</div><h2>Foreword</h2>
        <p class="lede">PrintCraft is a PDF workbench: it reads, organizes, combines, splits and secures PDFs in a fast, native app — with no account, no telemetry and no cloud.</p>
        <p>This specimen exists so every surface of the application can be exercised against a document that behaves like the real thing: nested bookmarks, threaded comments, form fields, optional content, attachments and a digital signature.</p>
        <div class="cols">
          <p>Deep zoom stays sharp because large pages render in tiles, so text stays crisp at any magnification. Pages render in isolation, and damaged documents are repaired rather than rejected.</p>
          <p>Layouts cover every task: continuous, single page, two-up, view rotation, full screen and a distraction-free Read mode. Both light and dark themes are designed for long sessions.</p>
        </div>
        ${footer("i")}`;
      case 2: return `
        <div class="kicker">Contents</div><h2>Contents</h2>
        <p>Cover · Foreword · Contents</p>
        <p>1 Setting Text — drop caps, kerning and ligatures<br/>
        2 Expressive Type — display faces and optical sizes<br/>
        3 Scripts of the World — twelve writing systems<br/>
        4 Code and Images — listings and rasters<br/>
        5 Color and Transparency — shadings and soft masks<br/>
        6 Forms and Layers — optional content<br/>
        7 Accessibility — tags and reading order<br/>
        8 Signatures — certificates and validation<br/>
        9 Security — permissions and encryption<br/>
        10 Colophon</p>
        ${footer("ii")}`;
      case 3: return `
        <div class="kicker">Chapter one</div><h2>Setting Text</h2>
        <p class="lede">Type sits on a baseline grid; the page is a rhythm before it is a picture. Set the measure first, then the leading, then the size — in that order, and the page holds together at any zoom.</p>
        <p>Kerning and ligatures are applied from the font's own tables. Where a run is right-to-left, or set vertically, the reading order follows the script rather than the page.</p>
        <div class="pullquote">Set the measure, then the leading, then the size.</div>
        <p class="specimen">Hamburgefonstiv — fi fl ffi ffl · Ty, To, Wa, AV</p>
        ${footer("1")}`;
      case 4: return `
        <div class="kicker">Chapter two</div><h2>Expressive Type</h2>
        <p class="lede">A display face earns its place by what it does to a short line. At 125% the counters close, the stems carry weight, and the line becomes a shape.</p>
        <p class="specimen" style="font-family:'Dancing Script',cursive;font-size:44px">Expressive Type</p>
        <p>Optical size axes let one family do the work of three: caption, text and display, each with the contrast its size demands.</p>
        ${footer("2")}`;
      case 5: return `
        <div class="kicker">Chapter three</div><h2>Scripts of the World</h2>
        <p class="lede">Twelve writing systems on one page, plus vertical Japanese in the right margin.</p>
        <p class="specimen">العربية · עברית · देवनागरी · ไทย · Ελληνικά · Кириллица<br/>中文 · 한국어 · IPA · Հայերեն · ქართული · தமிழ்</p>
        <p>Vertical CJK, colour emoji and complex script shaping all render the way the author intended, at any magnification.</p>
        ${footer("3")}`;
      case 6: return `
        <div class="kicker">Chapter four</div><h2>Code and Images</h2>
        <p>Set code in a monospaced type face; set prose in a text face. The listing below is syntax-coloured and survives copy and paste in the right reading order.</p>
        <pre>fn main() -&gt; Result&lt;(), Error&gt; {
    let doc = Document::open("showcase.pdf")?;
    for page in doc.pages() {
        println!("{} — {} pt", page.label(), page.width());
    }
    Ok(())
}</pre>
        <figure>
          <div style="height:180px;border-radius:6px;background:radial-gradient(circle at 30% 40%,#1b63e0,#243657 60%,#19191c)"></div>
          <figcaption>Figure 1 — a raster draws through a shader; the surrounding text keeps its own colour.</figcaption>
        </figure>
        ${footer("4")}`;
      case 7: return `
        <div class="kicker">Chapter five</div><h2>Color and Transparency</h2>
        <p class="lede">Shadings, blend modes and soft masks compose in the order the file declares them, not the order a viewer happens to draw.</p>
        <div class="swatch-row">
          <div class="swatch" style="background:linear-gradient(120deg,#1b63e0,#149ca8)"></div>
          <div class="swatch" style="background:linear-gradient(120deg,#e88a1a,#e03e3e)"></div>
          <div class="swatch" style="background:linear-gradient(120deg,#2d9d5b,#149ca8)"></div>
          <div class="swatch" style="background:linear-gradient(120deg,#8e4ee6,#d63b8f)"></div>
        </div>
        <p>A transparency group flattens only where it must; a soft mask keeps its own alpha channel.</p>
        ${footer("5")}`;
      case 8: return `
        <div class="kicker">Chapter six</div><h2>Forms and Layers</h2>
        <p class="lede">Prepare a form once: name the fields, order the tabs, flatten when the data is in. Optional content groups let one file carry several printed versions.</p>
        <p><strong>Fields in this document</strong><br/>Full name · Email · Subscribe · Plan · Signature</p>
        <p><strong>Layers</strong><br/>Body text · Captions · Artwork · Japanese vertical · Printer marks</p>
        ${footer("6")}`;
      case 9: return `
        <div class="kicker">Chapter seven</div><h2>Accessibility</h2>
        <p class="lede">A tagged PDF reads in the order the author intends, on screen readers and in the copy buffer alike.</p>
        <p>Headings nest, figures carry alternate text and tables name their headers. Run the accessibility checker to see what remains.</p>
        ${footer("7")}`;
      case 10: return `
        <div class="kicker">Chapter eight</div><h2>Signatures</h2>
        <p class="lede">A signature is a byte range plus a certificate. Validation is a verification of both, and of the chain behind it.</p>
        <p><strong>Signed by</strong> Sam Whitfield · Today, 09:14<br/><strong>Reason</strong> I am the author of this document<br/><strong>Issuer</strong> ArtCraft Test CA</p>
        <p>DocMDP permissions recorded with the signature: form filling and commenting allowed, assembly restricted.</p>
        ${footer("8")}`;
      case 11: return `
        <div class="kicker">Chapter nine</div><h2>Security</h2>
        <p class="lede">Open a protected document and respect its rules: printing may be allowed while assembly is not.</p>
        <p>Encryption is standard security handler revision 6, AES-256. The original bytes are never rewritten in place.</p>
        ${footer("9")}`;
      default: return `
        <div class="kicker">Colophon</div><h2>Colophon</h2>
        <p>PrintCraft Showcase — set in Inter and JetBrains Mono, with Dancing Script for the display page.</p>
        <p>Rendering: hayro · UI: egui · Icons: Lucide (ISC) · Fonts: Inter, JetBrains Mono, Dancing Script (OFL).</p>
        <p>Version 0.2.1 · MIT OR Apache-2.0</p>
        ${footer("10")}`;
    }
  };

  return {
    G_HUES, TOOL_GROUPS, RECOMMENDED, COMMENT_GROUPS, FILL_TOOLS, QUICK_TOOLS,
    COMMANDS, PAGES, BOOKMARKS, COMMENTS, FIELDS, LAYERS, ATTACHMENTS,
    SIGNATURES, SEARCH_HITS, RECENT, SHORTCUTS, pageBody,
    DOC: { name: "PrintCraft-Showcase.pdf", dirty: true, version: "0.2.1" },
  };
})();
