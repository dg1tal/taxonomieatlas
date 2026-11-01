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
