# Drittdaten, Quellen und Nutzungsbedingungen

Prüfstand: 1. November 2026. Die [MIT-Lizenz](LICENSE) gilt für den eigenen
Programmcode und die eigene Dokumentation. Sie gilt **nicht** für übernommene
Daten, Publikationen, API-Antworten oder sonstige Inhalte Dritter.

Das betrifft insbesondere `sources/`, `dist/data.json`, die Datenpakete unter
`dist/releases/` und aus ihnen erzeugte Exporte. Diese enthalten Material aus
mehreren Quellen; die Lizenzangabe `source.license` im Datenpaket bezeichnet
die AviList-Grundlage, nicht sämtliche Namens- und Deutschlandergänzungen.
Auch eine technische Konvertierung oder Zusammenführung erteilt keine
zusätzlichen Nutzungsrechte. Es gibt keine pauschale freie Lizenz für das
gesamte Datenpaket.

## AviList v2026

- **Urheber/Zitat:** AviList Core Team. 2026. *AviList: The Global Avian
  Checklist, v2026.* [DOI: 10.2173/avilist.v2026](https://doi.org/10.2173/avilist.v2026).
  © 2026 AviList Core Team.
- **Quelle und Lizenznachweis:** [Offizielle Checkliste v2026](https://www.avilist.org/checklist/v2026/),
  veröffentlicht am 20. Oktober 2026;
  [Creative Commons Attribution 4.0 International (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/).
- **Verwendet:** `sources/avilist-2026.xlsx`, archivierte Quellenseite,
  taxonomische Hierarchie, wissenschaftliche/englische Namen, Unterarten und
  weitere importierte Attribute in den Datenpaketen.
- **Bearbeitung:** Auswahl von Spalten, Konvertierung nach JSON, interne IDs,
  Verknüpfung mit separat belegten Namen und Deutschlanddaten. Die optionale
  Kladenansicht ist eine eigene Ergänzung.
- **Weitergabe:** Urheber, Quelle und Lizenz nennen, Lizenz verlinken und
  Änderungen kennzeichnen; vorhandene Rechtehinweise erhalten. Dies gilt
  auch bei kommerzieller Nutzung. Keine Unterstützung durch AviList behaupten.

## DOG: Artenliste Deutschlands 2018 und Kurzfassung 2019

- **Zitate:** Peter H. Barthel & Thorsten Krüger (2018): *Artenliste der Vögel
  Deutschlands*. Vogelwarte 56: 171–203, Version 3.1, Stand 30. Juni 2018;
  © DO-G, IfV, MPG 2018. Peter H. Barthel & Thorsten Krüger (2019): *Liste der
  Vögel Deutschlands*, Version 3.2; © Deutsche Ornithologen-Gesellschaft,
  Radolfzell 2019.
- **Quelle:** [DOG – Kommission Artenliste, mit beiden Publikationen](https://www.do-g.de/dog/kommission-artenliste).
- **Verwendet:** `sources/germany-2018.pdf`, `germany-2019.pdf`, zugehörige
  Textextraktionen, `germany-subspecies-2018.json` sowie Art-/Unterartbelege,
  historische Statusangaben und offene Zuordnungen in den Datenpaketen.
- **Bedingungen:** Die archivierten Dokumente tragen Copyrightvermerke;
  eine allgemeine offene Nachnutzungslizenz wurde dort nicht festgestellt.
  Kostenloser Download ist keine pauschale Erlaubnis zur Weiterverbreitung.
  Insbesondere für die Weitergabe vollständiger PDFs, umfangreicher
  Extraktionen oder Datenbestände sind die erforderlichen Rechte mit den
  Rechteinhabern zu klären. Die MIT-Lizenz erteilt diese Rechte nicht.

## DOG: Deutsche Vogelnamen 2022

- **Zitat:** Peter H. Barthel, Christine Barthel, Einhard Bezzel, Pascal
  Eckhoff, Renate van den Elzen, Christoph Hinkelmann & Frank D. Steinheimer
  (2022): *Die Vögel der Erde – Arten, Unterarten, Verbreitung und deutsche
  Namen*. 3. Auflage. Vogelwarte 60, Sonderheft: 1–540.
  [DOI: 10.17617/2.3418299](https://doi.org/10.17617/2.3418299).
  © Deutsche Ornithologen-Gesellschaft, Radolfzell 2022.
- **Quelle:** [DOG – Kommission Vogelnamen](https://www.do-g.de/dog/kommission-vogelnamen).
- **Verwendet:** `sources/names-dog-2022.pdf`, Textextraktion und zugeordnete
  deutsche Ordnungs-, Familien- und Artnamen.
- **Bedingungen:** Laut Impressum der archivierten PDF ist das Werk
  urheberrechtlich geschützt. Die kommerzielle Verwertung des Gesamtwerks
  oder längerer Auszüge ist untersagt; wissenschaftliche Benutzung der
  deutschen Namenliste wird empfohlen. Das ist keine CC- oder MIT-Lizenz.
  Eine kommerzielle Weiterverwendung des angereicherten Datenbestands ist
  daher nicht pauschal freigegeben; die erforderlichen Rechte sind zu klären.

## Wikidata und Wikipedia-Verknüpfungen

- **Quelle:** [Wikidata](https://www.wikidata.org/),
  [Lizenzregelung für strukturierte Daten](https://www.wikidata.org/wiki/Wikidata:Licensing),
  [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/).
- **Verwendet:** `sources/wikidata-bird-genera.json`, strukturierte Labels,
  Gebrauchsnamen und Wikipedia-Sitelinktitel im Gattungsnamenssupplement;
  Abruf am 23. Oktober 2026. Einzelnachweise enthalten Wikidata-Entitätslinks.
- **Bedingungen:** Diese strukturierten Daten stehen unter CC0. Die Herkunft
  bleibt zur Nachvollziehbarkeit genannt. Wikipedia-Artikeltexte und Bilder
  werden nicht in die App übernommen; deren Lizenzen sind separat zu prüfen.

## iNaturalist

- **Quelle:** [iNaturalist](https://www.inaturalist.org/),
  [API](https://api.inaturalist.org/v1/docs/),
  [Nutzungsbedingungen](https://www.inaturalist.org/pages/terms).
- **Verwendet:** `sources/inat-bird-genera.json`, gültige lokalisierte
  Gattungsnamen und Quellenlinks im Supplement; Abruf am 23. Oktober 2026.
- **Bedingungen:** Die Nutzungsbedingungen sehen für Nutzerinhalte ohne
  abweichende Angabe grundsätzlich CC BY-NC vor. Eine spezifische offene
  Lizenz für die hier abgerufenen Taxonnamen/API-Antworten ist im Snapshot
  nicht dokumentiert. Deshalb wird weder CC0 noch eine andere pauschale
  Freigabe behauptet. Vor Weiterverwendung sind die einschlägigen Rechte
  zu klären. Lizenzen für Beobachtungen, Fotos und Tonaufnahmen dürfen nicht
  ungeprüft auf Taxonnamen übertragen werden. Der archivierte API-Snapshot
  kann zusätzliche Medienmetadaten und Verweise enthalten; verlinkte Medien
  sind nicht Teil einer Freigabe durch dieses Projekt.

## Einzelne ergänzende Namensbelege

Die genauen Beleg-URLs und Abrufdaten stehen in
`sources/genus-name-supplement.json`, `sources/subspecies-name-supplement.json`
und den jeweiligen Taxonmetadaten.

| Quelle | Übernommener Umfang | Rechtehinweis / Bedingungen |
| --- | --- | --- |
| [LBV](https://www.lbv.de/), [Impressum](https://www.lbv.de/impressum/) | Deutsche Gattungsnamen für *Turdus*, *Corvus*, *Falco* | Fotos und Artikel sind laut LBV geschützt; keine allgemeine offene Lizenz für diese Belege festgestellt. Nur einzelne Namen übernommen, keine Artikel oder Fotos. |
| [ITIS](https://www.itis.gov/), [Rechtehinweise](https://itis.gov/privacy.html), [Datenfreigabe](https://itis.gov/about_itis.html) | Englische Gattungsnamen für *Corvus* und *Falco* | ITIS-eigene Daten sind Public Domain; die Datenbank wird als CC0 angeboten. Fremdmaterial auf ITIS-Seiten kann abweichend geschützt sein. |
| [U.S. Fish & Wildlife Service](https://www.fws.gov/species/dabbling-ducks-anas), [Copyright-Hinweise](https://www.fws.gov/disclaimer) | Englischer Gattungsname für *Anas* | Hinweise des USFWS und ggf. abweichende Rechte Dritter beachten; keine pauschale Lizenzierung der gesamten Website durch dieses Projekt. |
| [Avibase – Denis Lepage / Birds Canada](https://avibase.bsc-eoc.org/about.jsp), [konkreter Beleg](https://avibase.bsc-eoc.org/species.jsp?avibaseid=186DAC2F2799520F) | Namen für *Turdus torquatus alpestris*, Abruf 25. Oktober 2026 | Keine offene Lizenz im lokalen Beleg dokumentiert; keine pauschale Freigabe der Avibase-Datenbank. |
| [FU Berlin / Refubium, im Importer hinterlegter Anhang](https://refubium.fu-berlin.de/bitstream/handle/fub188/3616/09_kap7.pdf) | Deutscher Ordnungsname „Neuweltgeier“ für Cathartiformes | Bibliografische Zuordnung und Lizenz dieses Einzelbelegs sind noch zu verifizieren; keine offene Lizenz behauptet. |

## Optionale Kladenansicht

- **Zitat:** Josefin Stiller et al. (2024): *Complexity of avian evolution
  revealed by family-level genomes*. Nature 629: 851–860.
  [DOI: 10.1038/s41586-024-07323-1](https://doi.org/10.1038/s41586-024-07323-1).
- **Lizenznachweis:** [Originalartikel als PDF](https://www.nature.com/articles/s41586-024-07323-1.pdf),
  CC BY 4.0. Urheber und Quelle nennen, Lizenz verlinken, Änderungen angeben;
  gesondert gekennzeichnetes Fremdmaterial ist ausgenommen.
- **Verwendet/Bearbeitung:** Fachlicher Beleg für die selbst erstellte
  Zuordnung der Ordnungen zu vier Großgruppen in `dist/clades.mjs`.
  Keine Übernahme von Abbildungen oder Genomdaten. Die Zuordnung ist eine
  vereinfachte ergänzende Ansicht und kein Bestandteil der AviList-Quelle.

## Weiterverwendung und Pflege

Quellenangaben und Einzelnachweise bei Weitergabe erhalten; für AviList und
den Stiller-Artikel auch die CC-BY-Pflichten erfüllen. Bei Auszügen muss
erkennbar bleiben, welche Quelle welche Felder liefert. Ein bloßer Verweis
auf MIT reicht für Datenexporte nicht aus.

Offene Rechtefragen betreffen insbesondere die DOG-Publikationen und
Extraktionen, die iNaturalist-Taxonnamen sowie die nicht offen lizenzierten
Einzelbelege. Diese Aufstellung dokumentiert die vorgefundenen Bedingungen;
sie ersetzt keine fehlende Erlaubnis. Vor einer entsprechend betroffenen
Weiterverbreitung oder kommerziellen Nutzung Rechte einholen oder die
betroffenen Inhalte durch nachweislich nutzbare Quellen ersetzen.

Bei neuen Quellen oder Versionen diese Datei samt veröffentlichter Kopie
`dist/third-party-notices.txt` aktualisieren. Originalnachweise, Abrufdatum,
Lizenzstand und Bearbeitungen festhalten; fehlende Angaben als ungeklärt
kennzeichnen. Quelldateien und unveränderliche Releasepakete behalten ihre
jeweiligen ursprünglichen Rechtehinweise.
