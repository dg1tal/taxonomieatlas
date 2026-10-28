# UI/UX audit implementation

Every finding from the v21 audit is tracked here. Automated verification does not replace visual/browser/assistive-technology verification.

| ID | Requirement | Implementation | Verification |
|---|---|---|---|
| U01 | Search without results preserves the tree | Implemented: changeSearch + separate searchOrigin | test-ux: no-result search/clear restores focus, selection, open and camera |
| U02 | Order/scope/status changes preserve valid focus and branches | Implemented: filterChange + reconcileView | test-ux: selecting current order retains selection; excluded focus falls back |
| U03 | Mobile camera accounts for bottom details | Implemented: freeCanvasArea + center/ensureVisible | test-ux: bottom/side overlay geometry; V01/V03 still open |
| U04 | Storage-blocked startup and preferences work | Implemented: safeRead/safeWrite; optional persistence | test-ux: throwing storage and view storage round trip |
| U05 | Germany empty results explain missing evaluation | Implemented: country-aware empty state + worldwide action | test-ux: unassessed amicorum is not described as absent |
| U06 | C/E status label matches actual filter | Implemented: Gebietsfremde Vorkommen (C/E) | label/code review; existing Germany/status regressions |
| U07 | Separate card selection/expansion; minimal camera movement | Implemented: card selects; port toggles; ensureVisible | test-ux: separate card/port actions and stable camera |
| U08 | Direct search hits for every rank | Implemented: searchTaxa across all available ranks; normalized names | test-ux: direct genus/family/order hits and accent-insensitive lookup |
| U09 | Search counts by rank and optional rank filter | Implemented: rank counts + rank select | test-ux: rank-filtered results; render/code review |
| U10 | Filter/reset operations in view history | Implemented: filter/reset snapshots + stable browser history keys | test-ux: filter undo, default reset undo, mixed Back navigation |
| U11 | Share complete filter view; separate taxon link; browser navigation | Implemented: view link + taxon link + popstate | test-ux: URL round trip, browser Back; share open-all or up to 80 explicit branches, otherwise focal path |
| U12 | Select all vs found orders explicit | Implemented: All 45 vs found orders | test-ux: found-order button and retained current-order view |
| U13 | Restore last working view; default-view action | Implemented: safe view persistence + standard-view action | test-ux: stored snapshot restore and reset/undo; pagehide guard |
| U14 | Readable non-card text at all breakpoints | Implemented: 14–16px primary text; 12px secondary; 168px list rows | CSS review; mobile inputs 16px; V01/V02/V04 open |
| U15 | Improve light-mode secondary-text contrast | Implemented: light secondary #52664b; dark tokens retained | contrast 6.19:1 / 5.46:1 / 5.41:1 on light surfaces; theme regressions; V04 open |
| U16 | Core taxon/country evidence before sibling navigation | Implemented: details/evidence before collapsed sibling disclosure | test-ux: evidence occurs before sibling navigation |
| U17 | Mobile details: expandable single-scroll area | Implemented: expandable mobile details; sibling list uses outer scroll | DOM/CSS review; V01 open |
| U18 | Compact multilingual breadcrumbs with expandable ancestors | Implemented: compact path with native expandable middle ancestors | test-ux: multilingual ancestor disclosure |
| U19 | Distinguish German language DE from country Deutschland | Implemented: Deutschland spelled out in card footer | template/code review; DE/EN remain language suffixes |
| U20 | Human-readable statuses and accessible legend | Implemented: readableStatus + source status legend | test-ux: breeding/passage/winter translations and legend |
| U21 | Consolidated source-version display | Implemented: single sourceStamp; source detail behind disclosure | test-ux: source summary/legend; duplicate filter notes removed |
| U22 | Separate dataset revision from taxonomy version in updates | Implemented: dataset_revision + same-taxonomy update wording | test-ux: same-taxonomy revision; metadata-only immutable release |
| U23 | Modal focus containment, restoration and layered Escape | Implemented: trapLayer/inert, roving graph focus, layered Escape | test-ux: focus lifecycle and Escape order; real-browser/AT verification open |
| V01 | 320–430px widths, keyboard and details | Prepared; verification open | browser permission blocked |
| V02 | 200% browser zoom and wrapped controls | Prepared; verification open | browser permission blocked |
| V03 | Wide/tall viewport geometry | Prepared; verification open | browser permission blocked |
| V04 | Both themes: focus, selection, disabled and source hints | Prepared; verification open | browser permission blocked |
| V05 | Real browser keyboard and screenreader behavior | Prepared; verification open | browser permission blocked; no claim of AT certification |

No taxonomy or occurrence records changed in this UI release. Only dataset_revision metadata was added.
The visual/browser and assistive-technology checks are deliberately not marked passed.
