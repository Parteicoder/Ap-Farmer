# AP-Farmer

Foundry-VTT-Modul für [DSA5](https://github.com/Plushtoast/dsa5-foundryVTT).

Gruppen-AP-System: Stirbt ein Spielercharakter oder wird ein Gegner besiegt,
erhält nach Freigabe durch die Spielleitung (SL) die **gesamte Gruppe**
denselben AP-Betrag pauschal gutgeschrieben.

## Voraussetzungen

- Foundry VTT v11+
- System: [DSA5](https://foundryvtt.com/packages/dsa5)

## Ablauf

1. Auf jedem Actor (Spielerheld *und* Gegner) lässt sich über den Button
   **„AP-Wert“** im Fenster-Header des Charakterbogens ein AP-Wert für
   „Tod/Niederlage“ hinterlegen:
   - Spieler tragen selbst ein, was der Tod ihres Helden wert ist.
   - Die SL trägt bei Gegnern ein, wie viel AP ein Sieg über sie bringt.
2. Wechselt ein Actor in den Status **„Tot“** (der Foundry-Standardstatus,
   z. B. über das Token-HUD oder automatisiert durch das System), wird das
   erkannt – unabhängig vom Actor-Typ.
3. Die aktuell aktive SL bekommt einen Freigabe-Dialog mit Name, Typ
   (Spieler/Gegner) und AP-Betrag (editierbar, für den Fall dass kein Wert
   hinterlegt war).
4. Nach Freigabe („Vergeben“) bekommen **alle spielereigenen Charaktere**
   (Actor-Typ `character` mit Spieler-Besitzer) den Betrag pauschal auf
   `system.details.experience.total` gutgeschrieben.
5. Ein Chat-Log-Eintrag dokumentiert Quelle, Betrag und die Empfänger.

Bei mehreren besiegten Gegnern im selben Kampf öffnet sich für jeden Tod
sofort ein eigener Freigabe-Dialog.

## Einstellungen

- **Standard-AP-Wert für Gegner**: Fallback-Betrag, der im Freigabe-Dialog
  vorausgefüllt wird, wenn beim besiegten Gegner kein individueller AP-Wert
  hinterlegt wurde (Weltweit-Einstellung, änderbar in den Moduleinstellungen).

## Designentscheidungen

- **Trigger nur bei tatsächlichem Tod** (nicht bei „bewusstlos/kampfunfähig“),
  über den Foundry-Standardstatus `CONFIG.specialStatusEffects.DEFEATED`.
- **Keine Sockets nötig**: Der Freigabe-Dialog und die Verteilung laufen
  ausschließlich auf dem Client der aktiven SL (`game.users.activeGM`).
  Da GMs immer Schreibrechte auf alle Actors haben, ist kein
  Socket-Request an einen anderen Client erforderlich – die SL muss beim
  Ereignis online sein.
- **Keine zusätzliche Gruppen-AP-Anzeige** in v1 – die Nachvollziehbarkeit
  erfolgt über den Chat-Log-Eintrag, die Gutschrift direkt im DSA5-Bogen.

## Datenmodell

- `flags.ap-farmer.deathApAmount` – AP-Wert bei Tod/Niederlage, auf jedem
  Actor (PC und Gegner).
