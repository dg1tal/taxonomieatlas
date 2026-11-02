# Browserbefunde vom 27.10.2026

| ID | Befund | Umsetzung | Prüfung |
| --- | --- | --- | --- |
| B01 | Erster Listenklick verschluckt | Fokus setzt nur den aktiven Nachfahren; ersetzt keine Zeilen vor dem Klick | Regressionstest + Desktop-Browser bestanden |
| B02 | Arbeitsfläche zu klein | Kompakter Kopf, Filter einklappbar, Quellennotiz im Filter, Arbeitsplatz füllt Desktopfenster | Desktop-Browser bestanden |
| B03 | Liste zu hoch | 120 statt 168 px pro Zeile bei unverändert lesbaren Namen | Navigationstest + Desktop-Browser bestanden |
| B04 | Schrittweise doppelte Karten und Leerfläche | Kompakte Sprungliste, ausführliche Karten als responsives Raster | Desktop-Browser bestanden |
| B05 | Pfad wechselt Position | Pfad vor Ansichtsschaltern in allen Darstellungen | Renderer + Desktop-Browser bestanden |
| B06 | Verschachtelte Scrollbereiche | Ein Hauptscrollbereich für Schrittweise, feststehender Suchbereich/Elternknoten, kompakte Sprungliste | Desktop-Browser bestanden |
| B07 | Übersicht wird zum Strich | Lokale Umgebung als Standard, wahlweise Gesamtbaum, vergrößerbare Karte; einheitlicher Maßstab | Geometrietests + Desktop-Browser bestanden |
| B08 | Details verdecken Baum | Eigene rechte Spalte ab 1100 px, mobile Detailfläche unten | Desktop bestanden; echte Mobilbedienung offen |
| B09 | Suche unklar / Rücksprung erzwingt Baum | Globale Suche klar beschriftet, Treffer öffnen in aktueller Ansicht | Regressionstest + Desktop-Browser bestanden |
| B10 | Doppelte Alle-Aktion | Trefferaktion nur bei Suchbegriff; Nulltreffer deaktiviert | Desktop-Browser bestanden |
| B11 | Technische Angaben zu prominent | Quellenprüfsumme in aufklappbaren technischen Quelldetails | Renderer + Desktop-Browser bestanden |

Kein bestätigter Dark-Mode-Defekt. Keine Taxa, Namen oder Deutschlandzuordnungen geändert.

Noch separat offen: echte Touchbedienung und Screenreaderprüfung; schmale Browserfenster, sofern die verfügbare Browseroberfläche deren Einstellung ermöglicht.

## Messungen und Browserabläufe

- Desktop: 1363 × 936 px. Arbeitsbereich beginnt bei rund 435 statt 580 px; Steuerung und Footer liegen im Fenster.
- Liste: erster echter Mausklick auf Strauße wählt sofort aus. Etwa vier statt zwei Zeilen im sichtbaren Bereich.
- Detailspalten: Baumrechteck und Detailspalte berühren sich ohne Überlappung; Listen- und Detailbereiche enden innerhalb des Fensters. Lange Details sind unabhängig scrollbar.
- Schrittweise: kompakte Sprungliste und bis zu drei Kartenspalten; Pfad oberhalb der Ansichtsschalter. Elternkarte und Suchbereich bleiben beim Hauptscrollen erreichbar.
- Globale Suche aus Schrittweise nach Turdus torquatus: „In Ansicht öffnen“ erhält Schrittweise und zeigt den Treffer mit Details.
- Ordnungsfilter: ohne Suchbegriff nur Alle/Keine; Suche Strigi zeigt „1 gefundene auswählen“. Suchfeld hat einen expliziten zugänglichen Namen.
- Übersicht: Umgebung, Gesamtbaum und Vergrößern/Verkleinern im Browser geprüft. Seitenverhältnis bleibt einheitlich skaliert.
- Dark Mode: fertiger Zustand geprüft. Daten & Updates: technische Prüfsumme eingeklappt.

Die schmale Darstellung ist implementiert, aber mangels dokumentierter Größenumschaltung der Browseroberfläche nicht als visuell geprüft markiert. Echte Touch- und Screenreaderprüfungen sind nicht durch Maus-/DOM-Tests ersetzt.

## Prüfung anhand der Usability-Prinzipien vom 01.11.2026

Prüfung am lokalen Repositorystand, ohne Änderung des fachlichen Datenbestands.

| Prinzip | Konkreter Befund / Ergebnis |
| --- | --- |
| Aufgabenorientierter Einstieg | Namenssuche mit Beispielen vorhanden; Platzhalter macht die Suchfunktion jetzt ausdrücklich erkennbar. Suche nach Kohlmeise und Öffnen im Kontext im Browser geprüft. |
| Schrittweise Offenlegung | Quellen und Varianten bereits aufklappbar. Beschreibender Unterarthinweis wird nun bei Such-/Rangwechseln aktualisiert und nur bei relevanter Unterartanzeige gezeigt. |
| Orientierung | Kontext und Pfad vorhanden. Bestand, Status, Ordnungen, Anzeigeoptionen und Suchebene sind jetzt außerhalb des geschlossenen Filterdialogs als einzeln entfernbare Chips sichtbar. Deutschland zählt als aktive Einschränkung. |
| Vorhersehbare Ansichtswechsel | Auswahl der Kohlmeise beim Wechsel zu Schrittweise im Browser erhalten; vorhandene Tests decken Baum/Liste/Schrittweise und Rücknavigation ab. |
| Verständliche Filter / leere Ergebnisse | Keine Treffer auf Ebene Familie bei Suche Kohlmeise reproduziert. Direkte Aktionen heben die Suchebene bzw. Status-/Ordnungsfilter auf, ohne den Suchbegriff zu verlieren. Deutschland lässt sich separat auf Weltweit erweitern. |
| Erkennbare Bedienung | Suche jederzeit explizit beendbar; „Auswahl zentrieren“ benennt das Ziel. Mobile Treffer bei 390 px hatten stark gequetschte Namen: Name nun über volle Breite, Anzahl und Aktion darunter. Auch bei 320 px kein horizontaler Seitenüberlauf im geprüften Suchzustand. |
| Reversibilität | Einzelne Filteränderungen nutzen den vorhandenen Ansichtsverlauf. Regressionen prüfen Entfernung, Rückgängig, leere Ordnungsauswahl und Suchabschluss. Neue Suchen starten ohne versteckte Rangbeschränkung. Suchbegriff und Suchebene aktualisieren die aktuelle URL; beide bleiben nach Neuladen erhalten (im Browser geprüft). |
| Datenvertrauen | Historische Deutschlandquelle und ungeprüftes Artkonzept in den Details vorhanden. Quellencheck und fachlicher Prüfstand bleiben getrennt. Keine fachlichen Änderungen. |
| Tastatur / Touch | Filterbereich jetzt als modaler Dialog mit inaktivem Hintergrund und eingeschlossenem Fokus. Shift+Tab vom ersten zum letzten Element sowie Escape mit Fokus zurück zur Filtertaste im Browser geprüft. Mobile Chips und Trefferaktionen mindestens 44 px hoch. |

Verifikation: alle JavaScript-Syntaxprüfungen und alle `scripts/test-*.mjs`
erfolgreich; neue Interaktionsregressionen in `test-ux.mjs`.
Browserprüfung bei 320 und 390 px sowie Desktop, einschließlich Suche,
Suchebene ohne Treffer, Deutschland-/Statusfilter, Filterchips, Detailansicht
und Ansichtswechsel. Dies ersetzt keine Prüfung mit echtem Touchgerät,
Screenreader oder Nutzertests. Eine vollständige WCAG-Konformitätsprüfung
ist nicht durchgeführt.

## Interaktive Baumdarstellung – Umsetzung vom 01.11.2026

| Bereich | Umsetzung und Nachweis |
| --- | --- |
| Layoutstabilität | Bestehendes Layout unverändert. Der betätigte Knoten bleibt beim Öffnen/Schließen verankert; Sichtbarkeitskorrekturen verschieben die Kamera nur bei Bedarf. Ein deterministischer Kameratest prüft höchstens 1 px Abweichung bei 0, 90 und 180 ms. |
| Detailstufen | Vollkarten ab 85 %, kompakte Karten ab 50 %, darunter Übersicht; bestehende Stufen erhalten einen Hysteresebereich von 3 Prozentpunkten. Kompakte Texte sind mindestens 12 Bildschirm-Pixel groß und vollständig zugänglich benannt. IDs, Positionen und Zweigzustände ändern sich durch Zoomen nicht. |
| Orientierung | Auswahlfüllung, gestrichelte Fokuslinie und Vorfahrenpfad sind unterscheidbar. Die Minikarte zeigt Auswahlpunkt, Pfad und gestrichelten Ausschnitt. Übersichtsbeschriftungen priorisieren Fokus und Auswahl vor sichtbaren Vorfahren und Hauptgruppen und vermeiden gegenseitige Überlappungen. |
| Knotenaktionen | Beschriftete Aktionen für Untergruppen, Teilbaumwechsel und Schließen anderer Zweige; letzteres erhält den gewählten Teilbaum und seinen Vorfahrenpfad. Öffnen/Schließen, Kartenauswahl und weitere strukturelle Aktionen sind über den Verlauf rückgängig. Auswahl per Karte und Tastatur aktualisiert auch den Ansichtslink und bleibt nach Neuladen erhalten (im Browser geprüft). Beim Schließen eines ausgewählten Nachfahren wird der Elternknoten ausgewählt; Rückgängig stellt die alte Auswahl wieder her. „Alles aufklappen“ liegt unter „Weitere Baumaktionen“. |
| Gesten | Bis 800 px gilt im normalen Baum `touch-action: pan-y`: ein Finger scrollt die Seite, zwei rechtzeitig aufgesetzte Finger bedienen den Baum. Bereits vom Browser übernommene Scrollfolgen werden nicht zurückgeholt. In der großen Ansicht gilt direkte Einfingersteuerung. Zoom-/Richtungstasten bleiben verfügbar; Symbol-Trefferflächen sind auf Touch mindestens 44 × 44 Bildschirm-Pixel. Native Geräteprüfung weiterhin offen. |
| Tastatur | Home/End bei kompakten Karten und Übersicht im Browser geprüft. Die Details bleiben beim bloßen Fokuswechsel unverändert; ein Tab-Einstieg bleibt auch nach Wechseln der Zoomstufe erhalten. Bestehende Pfeiltasten-, Namenssuch- und Listenregressionen bestehen. |
| Bewegung und Aufräumen | Layoutänderungen und gezielte Kamerasprünge verwenden unterbrechbare Übergänge von 180 ms. Direkte Gesten steuern die Kamera unmittelbar. Reduzierte Bewegung schaltet Übergänge aus; Kamera-Listener, Beobachter und Animationsframes werden beim Verlassen entfernt. Automatisierte Tests prüfen Unterbrechung, reduzierte Bewegung, Pointer-Abbruch und Cleanup. |
| Arbeitsfläche | Lange Detailtexte scrollen in der rechten Desktopspalte und vergrößern nicht mehr die Zeichenfläche. „Sichtbaren Baum einpassen“ berücksichtigt alle aufgeklappten Knoten; Zentrieren ändert den Zoom nicht. |

Automatisierte Verifikation: JavaScript-Syntaxprüfungen und alle
`scripts/test-*.mjs`, einschließlich `test-tree-interaction.mjs` und erweiterten
UX-/Navigationsregressionen. Keine taxonomischen Daten oder Quellen geändert;
Ansichtslinks und gespeicherte Ansichten behalten ihr bisheriges Format.

Browser: 1280 × 900 sowie 390 × 844 und 320 × 740; helle und dunkle Darstellung,
Kohlmeise suchen/öffnen, Teilbaum erkunden, kompakte/Übersichtsdarstellung,
Tastaturfokus, große Ansicht und Escape sowie Rücknavigation geprüft.
Der angebotene Browser übernimmt die getestete Tastenkombination zum
Browserzoom nicht (Viewport und Pixeldichte blieben unverändert).
**Echter 200-%-Browserzoom bleibt daher ungeprüft.** Echte Touchgeräte und
Screenreader wurden nicht getestet; synthetische Gestentests und schmale
Browserfenster sind kein Ersatz dafür.

## Korrektur: verlorene Baumklicks bei Layoutübergängen

Die vorherigen Prüfungen erfassten keine schnelle Folge aus Aufklappen und
einem weiteren Mausklick während des laufenden Übergangs. Dabei gab es zwei
Fehler: Die Animation ersetzte SVG-Knoten zwischen `pointerdown` und `click`,
und neue Kinderkarten starteten über der Elternkarte und überdeckten deren
Klickfläche.

Korrektur: SVG-Elemente bleiben während eines gedrückten Zeigers und bis zur
Klickauswertung erhalten. Layoutübergänge pausieren dabei; Ziehen kann weiterhin
den Ausschnitt aktualisieren. Unverändertes Markup wird nicht neu eingesetzt.
Neue Kinder erscheinen an ihren eigenen Positionen; bestehende Knoten können
weiterhin animiert verschoben werden. Eine während des Übergangs ausgewählte
Karte erhält einen eigenen Kameraanker. Abgebrochene Zeigerfolgen und fehlende
Klickereignisse geben die Pause wieder frei; Listener, Timer und Frames werden
beim Verlassen entfernt.

Nachweis im Browser mit nativen Koordinatenklicks und 250 ms gedrückter
Maustaste, ohne automatisches Scrollen der Locator-Hilfe: Dieselbe Folge
„Casuariiformes öffnen, sofort am selben Plus/Minus wieder schließen“ lässt
in der unveränderten Vorversion 47 sichtbare Knoten und den Zweig offen;
in der korrigierten Version verbleiben erwartungsgemäß 46 Knoten und der
Zweig ist geschlossen. Das Aufklappen über Casuariidae und Casuarius bis zur
Art Casuarius casuarius sowie deren Auswahl und Erhalt beim Wechsel zwischen
Baum, Schrittweise und Liste wurden ebenfalls geprüft.

Neue Regressionen prüfen den unveränderten SVG-Knoten während gedrückter
Maustaste einschließlich der Zeit zwischen `pointerup` und `click`, die
Fortsetzung des Übergangs sowie die Startposition neuer Kinder und das
Ausbleiben unnötiger DOM-Ersetzungen. Der Test für den gedrückten Knoten
schlug vor der Korrektur fehl. Alle JavaScript-Prüfungen und Regressionstests
bestehen. Native Touch-/Screenreaderprüfung bleibt weiterhin offen.

## Systematische Nachprüfung der Baum-Navigation (2. November 2026)

Erneut im lokalen Chromium-Browser mit nativen Mausaktionen sowie Tastatur
geprüft. Zwei weitere Fehler wurden reproduziert und korrigiert:

- Unter 1100 px überlagerte das feste Detailblatt in der großen Baumansicht
  Zoom-, Richtungs- und Schließen-Tasten. Die große Ansicht verwendet jetzt
  getrennte Rasterzeilen für Aktionen, Zeichenfläche und Steuerung. Das
  scrollbar begrenzte Detailblatt liegt ausschließlich in der Zeichenfläche;
  auch vergrößerte Details verdecken keine Navigationstasten. Der zusätzliche
  Hinweis über der Zeichenfläche entfällt dort, weil er Kartennamen verdeckte.
- Nach dem Schließen der großen Ansicht mit Escape blieben Symbol und
  zugänglicher Tastenname auf „Schließen“. Taste und Escape verwenden jetzt
  dieselbe Zustandsänderung einschließlich Kameramodus und Fokus-Rückgabe.
  Der bestehende Escape-Regressionstest prüft auch Tastenname und Symbol.

| Browserprüfung | Ergebnis |
| --- | --- |
| Kohlmeise suchen, im Baum öffnen, Auswahl zentrieren | bestanden |
| Zehn native Plus/Minus-Klicks auf Parus | jeder Wechsel korrekt: 4/1 Knoten |
| Zehn native Plus/Minus-Klicks auf Casuariiformes im Gesamtbaum, abwechselnd sofort/100 ms gehalten | jeder Wechsel korrekt: 47/46 Knoten; tatsächliche Layoutübergänge |
| Aufklappen und sofort folgende Kartenauswahl mit 250 ms gedrückter Maus | Casuariiformes ausgewählt und weiterhin aufgeklappt |
| Auswahl, Aufklappen, Teilbaum erkunden und Vorfahrenpfad | bestanden |
| Zwei Gattungen öffnen, andere Zweige schließen, Zurück | 22 → 19 → 22 Knoten |
| Zoomtasten über Voll-/Kompakt-/Übersichtsstufe; Auswahl zentrieren; Einpassen | bestanden; Auswahl erhalten |
| Fläche nativ um 100/60 px ziehen; danach Karte anklicken | Kameraverschiebung exakt 100/60 px; korrekte Auswahl |
| Mausrad vor Aktivierung / nach bewusstem Klick in den Baum | Seite / Baum verschoben |
| Minikarte anklicken, Umgebung/Gesamtbaum wechseln, Kamerasprung mit Richtungstaste unterbrechen | bestanden |
| Pfeile, End und Enter bei Übersichtszoom | Fokuswechsel ohne Detailwechsel; Enter wählt die fokussierte Art |
| Listenalternative per Namensanfang, Pfeilen und Enter | bestanden |
| Liste, Schrittweise, Verteilung und voller Baum wechseln | Artauswahl erhalten |
| Neuladen einer gespeicherten Baumansicht | Auswahl, geöffnete Zweige und Kamera wiederhergestellt |
| Alles aufklappen und einpassen; letzte Art per End/Enter erreichen | 13.847 Knoten; Stilpnia cayana erreichbar und auswählbar |
| Große Ansicht öffnen, Details vergrößern, Zoom/Richtungstasten bedienen, schließen und wieder öffnen | bestanden |
| Escape zuerst für Details, danach große Ansicht; anschließend wieder öffnen | Zustand, Tastenname und Symbol konsistent |
| 320×740, 390×844 und 1280×900, jeweils hell/dunkel | kein horizontaler Überlauf; Zoom- und Richtungstasten bedienbar; Details überdecken keine Steuerelemente der großen Ansicht |
| Zusätzliche Tabletprüfung bei 900×800 | Detailblatt bleibt oberhalb der Steuerung |
| Browserkonsole | keine Fehler oder Warnungen |

Gemessener Abstand zwischen Detailblatt und Steuerung in der großen Ansicht:
bei 320/390 px jeweils 8 px. Alle bestehenden `scripts/test-*.mjs` bestanden;
der ergänzte UX-Test wurde nach der Escape-Korrektur erneut erfolgreich
ausgeführt. Syntaxprüfungen aller Browsermodule und Testskripte sowie
`git diff --check` bestanden.

Bildnachweise im lokalen Arbeitsartefakt-Verzeichnis:
`atlas-navigation-390-dark.jpg` und `atlas-navigation-320-light.jpg`.
Native Ein-/Zweifinger-Gesten auf einem echten Touchgerät, Screenreader und
200 % Browserzoom wurden in dieser Nachprüfung nicht bestätigt. Die bestehenden
synthetischen Kamera-/Gestentests einschließlich Pointer-Abbruch und reduzierter
Bewegung bestehen; sie ersetzen diese Geräteprüfungen nicht.
