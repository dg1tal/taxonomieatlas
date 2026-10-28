# Vogeltaxonomie – Atlas

First working release, 23 October 2026. Buildless ES modules; `dist/` is the deployed application.

## GitHub Pages

The complete version 33 source is tracked here. `.github/workflows/pages.yml` checks the JavaScript and runs the existing regression tests on every push to `main`, then publishes only `dist/`. The app uses relative asset and data URLs, so it also works at the repository path `/taxonomieatlas/`.

In the GitHub repository settings, select **Pages → Build and deployment → GitHub Actions**. The published address is `https://dg1tal.github.io/taxonomieatlas/`. The original ChatGPT Site remains available independently at `https://vogel-taxonomie-atlas.wurstinnovation.chatgpt.site`.

The repository includes third-party source data and documents with their own attribution and license terms; see the Data section and the app's Quellen panel. No software license is granted by this repository at this time.

## Data

- AviList v2026 official extended workbook, 20 October 2026, CC BY 4.0. 45 orders, 250 families, 2,379 genera, 11,172 species. Subspecies deliberately excluded.
- Barthel & Krüger 2019, Liste der Vögel Deutschlands, version 3.2, PDF linked by DOG. Exactly 527 main-list records extracted, including the domestic Rock Dove form. Appendices D/E excluded. Original category and status tokens preserved.
- 492 identical binomials are **unreviewed candidates**, 35 records unmatched. All 527 taxon concepts still need expert reconciliation against current AviList. No claim of a fully current or fully validated German list. Identical names do not prove identical species circumscriptions.
- German names are enriched from Barthel et al. (2022), Die Vögel der Erde, 3rd edition, DOI 10.17617/2.3418299. Matching uses scientific names; missing species labels may additionally use a unique identical English name and epithet. Label matches do not validate taxon concepts or occurrence status. 45 orders, 247 families and 10,576 species have German labels. All orders, families and species have English AviList labels. No genus-level vernacular names were supplied by these sources; they are explicitly marked as absent from the imported evidence.
- UUID registry is tracked in sources/id-registry.json. Exact names reuse their internal IDs. Renames are not inferred automatically; additions/removals trigger concept review. Cornell codes are source attributes, not primary IDs.

## Rebuild

Python 3 with openpyxl; Poppler pdftotext for DOG extraction. Source files retained for reproducibility.

```
pdftotext -layout sources/germany-2019.pdf sources/germany-2019.txt
python scripts/import_avilist.py --xlsx sources/avilist-2026.xlsx --germany-text sources/germany-2019.txt --version 2026 --output dist/data.json
node scripts/test-engine.mjs
```

For a newer version, use a separate candidate output (never overwrite the published baseline during staging). Review workbook header changes before adapting the importer. Update source URL and citation in the importer for that version. Importer deliberately fails on unknown core columns, inconsistent genus relationships or incomplete DOG extraction.

## Updater

Visitors can check the same-origin release manifest, download a published candidate, verify SHA-256 and structure, inspect changes, then atomically store current/previous snapshots in IndexedDB. IndexedDB failure prevents a persistent takeover. Rollback changes this browser only.

A normalized JSON file can be imported for a temporary local preview. This never edits public data. Structural validation is not a taxonomic endorsement. Reports contain added/removed taxa, name/parent/code changes, ID drift and changes to Germany metadata. Public updates are authored through the repository, not a public upload endpoint.

To prepare a public release:

```
node scripts/release.mjs NEXT.json REVIEW.json
```

The review binds old and new original-source checksums, requires reviewer/evidence/approval, and individual evidenced decisions for added, removed, renamed or reparented taxa. Changes to German records require germany_review. The script writes an immutable package and finally updates the manifest; publish the complete dist directory through Sites. No background external-source polling or scheduled updates are configured yet. There is no protected web admin area yet.

## Implemented

Responsive taxonomy tree, direct-taxon links, search through ancestor names, species details, provisional Germany status filters, proportional SVG icicle with accessible child list, selected-subtree JSON export, update checks/import preview/comparison/report, same-browser update/rollback.

## Verification and limitations

Automated checks passed for complete import, all subtree totals, search, Germany extraction count, missing parents, cycles, duplicates, ID drift and no-op comparisons. JavaScript syntax checks passed. Browser QA was blocked by the browser origin authorization gate; mobile/desktop visual appearance and actual browser interactions remain unverified.

Still required: resolve German taxon concepts and 35 unmatched records, authoritative updated German names/status, global German names, subfamilies and other optional ranks with independent provenance, automatic source acquisition, end-to-end browser tests, CSV/SVG/PDF exports, richer migration UI. Existing JSON export is a selection export and is intentionally not an update package.


## Interactive branch view (second release)

The primary view now renders a connected SVG tree with curved branches and expandable cards. Pan by dragging or scrolling, pinch to zoom on touch devices, or use zoom/fit/center controls. A larger view can be opened and closed with Escape. Taxon cards support Enter/Space and arrow-key navigation. An alternative connected list remains available.

There is no child paging. “Alles aufklappen” opens every descendant of the current root; the root breadcrumb or Gesamtbaum returns to Aves. All 13,847 nodes and 11,172 species can be expanded. The order selector accesses every represented order directly. Search results reveal their complete branch path. Nodes keep their screen position when expanded, and the selected ancestor path is highlighted.

The hero introduction and slogan were removed; statistics and filters are compact. Source caveats remain in the data panel and provisional Germany view.

Validation: `node scripts/test-tree.mjs` passed for complete order reachability across pages, the path to Kohlmeise, non-overlapping card geometry, valid branch links, collapse, filtered counts, accessible labels and escaped imported text. Existing engine tests and JavaScript syntax checks passed. Visual browser and touch QA remain unverified because the earlier browser-origin permission was declined; no alternate browser route was used.


## Full expansion and bilingual labels (third release)

Every card now has a rank in German and English, a scientific name, a German label and an English label. Missing labels are distinguished from a scientific name; they are never filled by invented translations. Order Cathartiformes has a separately cited German label. Missing German coverage: three families, 596 species, and all 2,379 genera in the imported sources. Genus-level English vernacular labels are likewise not present in AviList. These gaps remain explicit in the UI. A German name matched from 2022 may describe a different taxon concept; the name association is not a species-limit endorsement.

After the base import, enrich names reproducibly with:

```
pdftotext -layout sources/names-dog-2022.pdf sources/names-dog-2022.txt
python scripts/enrich_names.py
```

The SVG camera renders detailed cards only in the viewport. When zoomed out, the complete tree uses compound SVG paths instead of thousands of text/card elements; clicking an overview node zooms into it. The list uses a scroll window over the complete flat hierarchy. This rendering optimization does not discard or paginate any taxa. Layout tests verify all 13,847 IDs, all leaf counts, full subtree expansion, filter consistency, non-overlap and viewport output. JavaScript checks and existing data tests passed. Browser/touch/visual QA remains unverified under the previous denied browser-origin permission.


## Supplemental genus common names (fifth release)

1,950 of the 2,379 AviList genera now have a supplemental vernacular label: 1,297 German and 1,648 English. Sources: structured Wikidata data (CC0), Wikipedia sitelink titles supplied by Wikidata, iNaturalist preferred valid localized names, and a small set of independently checked LBV/ITIS/USFWS names. No Wikipedia article prose is reproduced.

Matching requires exact AviList scientific name. The Wikidata harvest explicitly restricts rank to genus and parent ancestry to Aves. iNaturalist records must be active genera with Aves in their ancestor IDs. Scientific labels repeated as common names are discarded. Only the first valid iNaturalist name in each locale is considered, because lower-ranked community aliases can refer to subgroups or historically merged genera. Differing names from independently matched sources are retained as attributed source variants. They are vernacular usages, not taxonomic synonyms or guaranteed exclusive names for a rank. The taxonomic hierarchy and Germany occurrence records remain byte-for-byte structurally unchanged; the supplement report includes their checksum.

Preferred common names have field-level evidence (source, URL, field and retrieval date). Taxon details expose both preferred names and alternative source variants. Missing genus names now say “in den Quellen nicht hinterlegt”, not “kein eigener Name belegt”. Search includes the source variants.

Pipeline after base/name import:

```
python scripts/fetch_genus_names.py
python scripts/enrich_genus_names.py
node scripts/test-genus-names.mjs
```

Source snapshots and the enrichment report are retained under sources/. For fully offline reproduction use the retained snapshots and run only enrich_genus_names.py. No visitor-side source scraping and no background automatic refresh are configured. Browser/touch QA remains unverified under the prior browser-origin denial. Existing engine/layout tests and the new source/provenance/alias/update tests pass.


## Order multi-select (sixth release)

The old single-order navigation dropdown is replaced by a shared checkbox filter, alphabetically sorted by scientific order name. All/none controls, a live selection count and removable chips are provided. The popup is a bounded dropdown on desktop and a larger bottom sheet on small screens. No secondary search is needed for the 45-order list. Options display scientific/German/English names and counts for the current scope/status before order/query filtering; zero-count options remain visible so selections can persist when changing scope.

The default `null` selection means all orders, while an empty Set explicitly means none. Selected orders form a union; scope, occurrence status and search intersect that union. The same index drives the tree, proportional overview, search results, descendant totals and JSON export. An order change returns the display to Aves with the selected orders as parallel branches. Taxon/subtree navigation remains available inside the graph. Switching tree/overview or global/Germany retains the selection. Reset restores all orders. Export metadata records the chosen order IDs/names; empty selection exports zero species. A source taxonomy is never reordered or rewritten by the filter.

Verification: `node scripts/test-order-filter.mjs` covers all/none, a multi-order union, single-order counts, intersection with Germany and every status, positive/negative searches, subtree sums, complete expanded filtered trees and deduplicated exportable leaves. Existing data, tree and genus-name tests pass. Browser/touch QA remains unverified under the earlier denied preview-origin authorization.

## UI review (24 October 2026)

The header totals explicitly describe the entire data set; the selection summary reports filtered counts and active conditions. Large order selections are collapsed into an edit control. Search results rank exact species names ahead of prefixes and substring matches. The distribution renders only one hierarchy level at a time with a searchable, sortable child list; empty results no longer display a blank chart. The release check is labeled as an app-data check, distinct from supervised AviList source import. Singular species and branch labels are handled in the graph.

## Wide layout and distribution (24 October 2026)

The page and header use the available monitor width with responsive side padding. Distribution uses labeled horizontal bars with a common root denominator, counts and percentages; twelve bars are shown initially and the remaining groups can be expanded. The complete child list remains searchable and sortable, and chart and list share those controls.

## Optional major clades (24 October 2026)

The phylogenetic toggle overlays Palaeognathae, Neognathae, Galloanserae and Neoaves between Aves and AviList orders. It is separately sourced to Stiller et al. (2024), DOI 10.1038/s41586-024-07323-1, and never alters the imported source or permanent IDs. Every v2026 order has an explicit mapping; an unknown or renamed order disables the overlay pending review rather than inferring its placement. Search, filters, distribution, tree, and export derive counts from the temporary view. The default remains the AviList hierarchy.


## Navigation update (v16)

- Search siblings in scientific, German and English names, sorted by scientific name and respecting the current filters and optional clade parents. The detail panel shows position and previous/next navigation; result height stays fixed.
- A bounded 50-view history restores filters, clades, focus, selection, expanded nodes, list position and camera. Deliberate taxon jumps create entries; pan/zoom updates the current view when leaving it.
- Toggleable minimap of the expanded tree with viewport and selection markers, click-to-pan, directional pan controls, and readable main-rank labels when zoomed out. Mobile defaults closed; explicit preference is remembered.
- The virtual list uses a single Tab stop, active descendant, explicit treeitem level/position/set size and expanded/selected state. Arrow keys, Home/End, Enter/Space and multilingual type-ahead are supported. SVG nodes are reached through the canvas rather than thousands of Tab stops; details provide subtree actions.
- Regression checks: `node scripts/test-navigation.mjs`, `test-tree.mjs`, `test-clades.mjs`, `test-order-filter.mjs`, `test-engine.mjs`, `test-genus-names.mjs`.
- Browser preview QA was blocked by a saved browser permission. Automated tests cover navigation state, virtual-list key handlers and camera/minimap operations using test doubles; visual layout and assistive-technology behavior still need real-browser verification.

## Adaptive workspace height (v17)

The branch and virtual-list views now use a flex layout through the page's available dynamic viewport height, accounting for the real header, filters, controls and footer. Removed the canvas's 720px ceiling and the list's fixed 620px/70vh height. Small windows retain a readable minimum work-area height and page scrolling; fullscreen has no mobile height cap. The camera's existing ResizeObserver updates the SVG bounds without resetting the camera. Detail overlays follow the panel height.

Validation: navigation/camera regression tests and CSS diff checks. Browser QA remains unavailable due to the previously observed saved browser permission; the supplied user screenshot identified the height cap directly.

## Appearance preference (v18)

Header appearance selector: System (default), Light, Dark. A small synchronous `theme.js` applies the preference before styles load, follows OS changes while in System mode, and stores the choice separately from navigation under `taxonomy-theme`. Storage failures leave the control usable for the session. Theme updates do not rerender or reset the tree. Dark styling includes forms, details, tree SVG cards/branches/semantic labels, minimap, distribution bars, focus/selection states and update panels; native controls use the matching color scheme. The tested main and secondary text palette exceeds 4.5:1 against the dark surfaces. `node scripts/test-theme.mjs` covers preference behavior and these palette contrasts. Visual browser QA remains blocked by the previously observed saved browser permission.

## Tree card typography (v19)

Cards keep their 300px width and now use the full 268px inner text area. Small DE/EN suffixes follow the last name line rather than occupying a separate left column. Line wrapping uses cached canvas text measurements with the actual font instead of character limits, and scientific names can wrap too. Each block has at most two lines; exceptionally long text is ellipsized by measured width and remains complete in the card's accessible label/title and detail panel. German names use 16px, scientific/English names 14px, metadata 12px. Card height grows from 150px to 180px to keep these blocks separate. The subtree button only occupies the header (44×28px); initial and overview-entry zoom is 100%. Existing cameras and navigation states remain intact.

Validation: tree test covers measured width constraints for every taxon's names, word-width differences, suffix space, all-node layout without overlaps and unchanged card width; navigation/camera and dark-theme tests pass. Browser visual QA remains blocked by the previously observed saved browser permission.

## Optional subspecies (v20)

- The exact existing `sources/avilist-2026.xlsx` contains 19,852 subspecies. Import now retains these below their source species, with authority, range, Avibase ID and extinction marker. Existing 13,847 taxa/IDs/names and the entire DOG dataset were preserved at node/record level. New total: 33,699 taxa including 11,172 species. `sources/reviews/` contains source-bound per-taxon migration evidence.
- `Unterarten anzeigen` is off by default. Enabling it preserves camera, expanded branches and selection; disabling a focused/selected subspecies moves to its parent species. The option is part of view history and works with the clade overlay. Monotypic species do not acquire synthetic subspecies.
- Counts use unique species ancestors, not leaves. Subspecies carry a separate count; distribution charts do not assign multiple species shares to the subspecies of one species. Exports separate species and subspecies.
- Search includes trinomials and sourced subspecies names even with the option off; revealing a subspecies enables its tree level. Deep links to subspecies enable the level as well.
- Missing common names use the species name plus subspecies epithet, marked `DE*`/`EN*` and explicitly described as generated displays in details. They are not stored as source common names. The specific `Alpenringdrossel` name and English equivalent have Avibase evidence in `sources/subspecies-name-supplement.json`.
- DOG 2019 supplies species records only. No subspecies are inferred as occurring in Germany. The Germany view explains this limitation and provides a deliberate switch to the species' worldwide subspecies view.
- Reproduction from the v19 species-only baseline: `python scripts/add_subspecies.py`, `python scripts/prepare_subspecies_review.py`, then `scripts/release.mjs` with `sources/next-subspecies.json` and `sources/subspecies-review.json`; copy the verified bundle to `dist/data.json` after preparing the immutable release. Future source imports include subspecies by default and retain IDs via the registry. Apply existing genus/species name enrichment and the attributed subspecies supplement separately.
- Tests: `test-subspecies.mjs` verifies full layouts with/without clades, no overlaps, unique counts, trinomial search, monotypic species, name evidence and zero inherited Germany subspecies; `test-navigation.mjs` additionally exercises toggle/selection/history handlers. Existing tree/engine/filter/name/theme regressions remain applicable. Visual browser QA remains blocked by the previously observed saved browser permission.

## German subspecies evidence (v21)

The previous blanket lack of country subspecies data is superseded by the DOG full checklist (Barthel & Krüger 2018, Vogelwarte 56:171–203), as of 30 June 2018. The existing 2019 species dataset is unchanged. This is a historical source baseline, not a claim that Germany's 2026 subspecies list has been comprehensively updated.

`python scripts/import_germany_subspecies.py` reads the source PDF using word coordinates, groups source rows, expands genus/species abbreviations within the source species, retains the original row/species row and printed/PDF page, and asserts all 527 source species and 377 source subspecies were extracted. `sources/germany-subspecies-2018.json` is the reproducible extraction. The published bundle includes it as `germany_subspecies_source`.

330 source trinomials have an exact AviList subspecies/parent match. 39 non-exact matches remain open (including possible genus changes, splits, lumps and monotypic species), and 8 entries marked (?) in the source remain uncertain even when the name matches. Neither group passes the confirmed-occurrence filter. Possible targets in the audit are suggestions within the source family, never inferred occurrences. No taxonomy or existing species-country assignments were changed.

Status precedence follows the full source legend pp174–175: an explicit subspecies status row replaces the general species status row; if no subspecies status is given, the species row applies. Import retains both the raw and effective status. The explicit row for T. t. torquatus has passage Z and no breeding status; T. t. alpestris defaults to R3 Z. Blank overrides are not filled individually, which would incorrectly assign breeding to torquatus. Historical/escape annotations are retained; no individual specimen validation is claimed.

The Germany view shows 330 matched source subspecies when enabled (including historical/introduced statuses under the matching filters). World/details distinguish confirmed, taxonomically open, source-uncertain and not-yet-evaluated. Absence from the dataset never means absence from Germany. Country details link to the exact source PDF page and show the source date/status rule. The data tab exposes all 47 open or uncertain entries. Forty-one quoted German subspecies labels are imported as informal common names, explicitly not official names.

Later evidence belongs in `germany_subspecies_source.later_records`, separately attributed with its own source URL, SHA-256, citation and as-of date; it is not silently folded into the 2018 source. No later records have yet been systematically evaluated. Candidate mappings require explicit source-bound evidence; splits/lumps/rank changes must not be transferred automatically.

Release preparation uses `scripts/release.mjs` and a `germany_review` explaining the source extraction/status precedence and unchanged 2019 data. The final source-bound review is retained in `sources/reviews/`. Tests: `test-germany-subspecies.mjs`, updated `test-subspecies.mjs`, navigation/UI handler tests, and all existing regressions. Visual browser QA remains blocked by the previously observed saved browser permission.

## UI/UX follow-through (v22)

All 23 findings from the v21 audit are tracked in `UI_UX_CHECKLIST.md`, including their implementation and verification. The four visual viewport/theme checks and a real-browser assistive-technology check remain open because of the previously observed saved browser permission.

- Search is a separate view: no-match results do not discard the tree; closing search restores its focus, selection, expanded nodes and camera. Direct order/family/genus/etc. matches, rank counts and a rank filter are provided. Names normalize accents and ß consistently. Germany no-match messages explicitly distinguish missing evaluation from missing occurrence and offer worldwide lookup.
- Filter changes preserve valid taxa and open nodes and participate in history. Browser Back and in-app Back use stable history keys. Resetting filters preserves the workspace; Standardansicht resets the view and can be undone.
- Ansichtslinks include scope, status, order selection, rank/visibility options, query, focus and camera. Open-all is compactly represented; up to 80 explicit open nodes are included, otherwise the focal path is shared. Separate taxon links intentionally open an unfiltered taxon view. Browser-local last-view persistence preserves the full open set. Storage denial cannot block startup; clipboard denial exposes a selectable link.
- Canvas centering uses the actual side/bottom detail geometry. Card selection is independent of port expansion, and ensureVisible avoids unnecessary camera movement. Detail evidence precedes an optional sibling disclosure; mobile details can expand and avoid nested sibling scrolling.
- Controls/list/search/metadata typography and light-mode secondary contrast are raised; mobile text inputs are 16px. Breadcrumbs retain all languages inside a compact ancestor disclosure. Country text spells out Deutschland; a consolidated source stamp and human-readable status legend explain source ages and codes. Data revision metadata is distinct from AviList taxonomy version.
- Fullscreen and the mobile order popup contain focus, temporarily inert their background, restore focus, and close through layered Escape (popup, details, fullscreen). Graph keyboard focus uses one roving tab stop. This is not a claim of screenreader certification without real assistive-technology testing.

Validation: `node scripts/test-ux.mjs` exercises all main state/interaction regressions with DOM test doubles, plus the existing navigation/tree/subspecies/Germany/filter/naming/theme suites. No taxonomic or occurrence records changed; the canonical bundle adds only `dataset_revision: 2026-10-25.22` and is released through the source-bound workflow.

### v27: Schrittweise Navigation

Die zusätzliche Ansicht „Schrittweise“ zeigt nur direkte Untergruppen. Die Seitenliste ist alphabetisch nach wissenschaftlichem Namen sortiert und auf Deutsch, Englisch und wissenschaftlich durchsuchbar. Die Zweigansicht zeigt zunächst zwölf passende Untergruppen; weitere lassen sich ergänzen. Alle Treffer bleiben über die Seitenliste erreichbar. Auf kleinen Bildschirmen ist die Suchliste ein aufklappbarer Bereich. Der Pfad und „Eine Ebene höher“ erlauben Rücksprünge; Endknoten öffnen Details, Arten öffnen bei aktivierten Unterarten ihre Untergruppen.

Schrittweiser Fokus, lokale Suche, Listen-/Inhaltsscrollposition und geöffnete Suchliste werden getrennt vom vollen Baum gespeichert. Der Wechsel übernimmt beim ersten Einstieg das ausgewählte Taxon bzw. dessen Elternknoten. Rückkehr zum vollen Baum erhält Fokus, offene Zweige, Kamera und Zoom. Lokale Navigation, Browser-/App-Verlauf und Ansichtslinks enthalten den schrittweisen Zustand. Bestehende Filter gelten auch hier; ungültige Taxa fallen auf verfügbare Vorfahren zurück. „Voller Baum“ bleibt der Standard. Automatische Navigation beim bloßen Ansichtswechsel entfällt.

Validierung: `test-ux.mjs` prüft Ansichtswechsel, erhaltene Kamera/offene Zweige, Namenssuche, leere Treffer, Details, Unterarten/fachliche Filter und Snapshot-Wiederherstellung; bestehende Navigations-, Kladen- und Ordnungsfiltertests bestehen.

### v29: Auswahl über alle drei Darstellungen synchronisieren

Beim Wechsel zu „Schrittweise“ wird die aktuelle Auswahl jedes Mal übernommen. Endknoten erscheinen im Kontext ihres Elternknotens; eine veraltete lokale Suche blendet die neue Auswahl nicht aus. Navigation in „Schrittweise“ wird beim Wechsel zu Baum/Liste als Auswahl übernommen: fehlende Vorfahren werden geöffnet, die Liste bzw. der Baum zeigen das Taxon. Unveränderte Rundwechsel erhalten Kamera und offene Zweige. Der Einstiegspunkt zur Erkennung neuer Navigation wird mit gespeichert, damit dies auch nach Neuladen funktioniert. Tests decken wiederholte Wechsel, andere Familien, Endknoten, Elternpfade und Neuladen ab.

### v31–v33: Browserbefunde umsetzen

Die elf Befunde der erneuten visuellen Prüfung sind in `UI_UX_BROWSER_FIXES.md` mit Umsetzung und Prüfstatus dokumentiert. Erstklick auf Listenzeilen korrigiert; Listenhöhe 120 px; einklappbare Filter und kompakter Kopfbereich; gleiche Position der Pfad-/Ansichtsnavigation; kompakte Sprungliste und Kartenraster in Schrittweise; gemeinsamer Hauptscrollbereich; lokale oder globale und vergrößerbare Übersicht; eigene Detailspalte auf breiten Fenstern; Suchtreffer erhalten ihre Darstellung; redundante Alle-Aktion ausgeblendet; technische Quellenangaben nachgeordnet.

Automatische Regressionen: Navigation (einschließlich Fokus/Erstklick), UX (einschließlich Suchrückkehr in alle drei Modi), Baumgeometrie, Theme und Ordnungsfilter. Desktop-Browserprüfung abgeschlossen, echte schmale Mobil-/Touch-/Screenreaderprüfung bleibt ausdrücklich offen. Datenbestand unverändert.
