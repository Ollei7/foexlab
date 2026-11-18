# foeXlab Lab-Server: Einrichten und Betreiben

Stand: 11.11.2026 · Gilt für Raspberry Pi 4/5 mit Raspberry Pi OS Lite (64-bit; eingerichtet am 11.11.2026 auf Debian 13 „Trixie“) und eine Fritzbox als Laborrouter. Mit einem anderen Router ändert sich nur der Adressbereich (GL.iNet: `192.168.8.x`).

## Überblick

```
iPads / Handys ──WLAN „foeXlab“──> Fritzbox (192.168.178.1, vergibt Adressen)
                                        │ LAN-Kabel
                                        ▼
                                  Raspberry Pi (192.168.178.10)
                                  ├─ Caddy: Seiten aus /srv/foexlab
                                  └─ Abholdienst: PDFs nur im Arbeitsspeicher, 12 h
```

## 1 SD-Karte vorbereiten (am Mac, einmalig)

1. Raspberry Pi Imager starten, „Raspberry Pi OS Lite (64-bit)“ wählen.
2. Unter „Einstellungen bearbeiten“:
   - Hostname `foexlab`;
   - Benutzer `pi` mit eigenem Passwort;
   - **SSH aktivieren**;
   - WLAN **nicht** einrichten.
3. Karte schreiben, in den Pi stecken.

## 2 Router einrichten (einmalig)

1. Router einschalten, mit seinem WLAN verbinden. Die Zugangsdaten stehen auf dem Etikett.
2. `http://fritz.box` bzw. `http://192.168.178.1` öffnen und ein Admin-Passwort vergeben.
3. **WLAN:** Name `foeXlab`, Verschlüsselung WPA2, eigenes Passwort. Das 5-GHz- und das 2,4-GHz-Netz bekommen denselben Namen.
4. **Internet/WAN:** nichts anschließen. Der Router bleibt im normalen Router-Modus, ohne Internet. Den Modus „Access Point“ nicht verwenden: Dann vergibt der Router keine Adressen.
5. Pi per LAN-Kabel an einen LAN-Anschluss des Routers stecken und einschalten.
6. **Feste Adresse:** Unter Heimnetz → Netzwerk den Pi (`foexlab`) suchen und bearbeiten: Adresse `192.168.178.10` eintragen und „Diesem Netzwerkgerät immer die gleiche IPv4-Adresse zuweisen“ ankreuzen. Pi einmal neu starten.

## 3 Pi einrichten (einmalig, ca. 10 Minuten)

> Für `apt-get` braucht der Pi **einmal Internet**. Dafür den Router kurz per WAN-Kabel an ein Netz mit Internet hängen, oder den Pi direkt an ein solches Netz anschließen. Danach läuft alles offline.

Am Mac im Ordner `foexlab`:

```bash
scp -r server pi@192.168.178.10:~/foexlab-server
ssh pi@192.168.178.10 "sudo bash ~/foexlab-server/install.sh"
```

Danach das WAN-Kabel wieder abziehen.

## 4 Inhalte aktualisieren (nach jeder Änderung)

Nicht während eines Labortags: Geänderte Überschriften trennen die Verbindung zu bereits gespeicherten Eingaben.

```bash
python3 engine/build.py --alle
rsync -av --delete dist/ pi@192.168.178.10:/srv/foexlab/
```

Der Mac muss dafür im WLAN „foeXlab“ sein.

Danach prüfen (läuft ohne Internet, Ergebnis auch in `pi-pruefung.txt`):

```bash
python3 tools/pi_pruefen.py http://192.168.178.10
```

Geprüft werden Startseite und Kurse, alle eingebundenen Dateien und der Abholdienst.

## 5 Aufsteller drucken

1. `server.example.yml` nach `server.local.yml` kopieren und das WLAN-Passwort eintragen. Die Datei bleibt außerhalb von Git.
2. Pro Experiment ein SVG erzeugen:

```bash
python3 tools/aufsteller.py kurse/mzi
```

3. Das SVG im Browser öffnen und auf A5 quer drucken.

## 6 Was tun, wenn …

| Problem | Prüfen |
|---|---|
| Seite lädt nicht | Ist das Gerät im WLAN „foeXlab“? Am Handy die mobilen Daten ausschalten. Läuft der Pi? Leuchtet die LED am LAN-Anschluss? |
| „Keine Internetverbindung“-Meldung | Ist normal. „Trotzdem verbunden bleiben“ bzw. „Ohne Internet verwenden“ wählen. |
| Abholcode schlägt fehl | Ist der Abholdienst aktiv? `ssh pi@192.168.178.10 systemctl status foexlab-abholdienst`. Neustart mit `sudo systemctl restart foexlab-abholdienst`. Achtung: Ein Neustart löscht alle abgelegten PDFs. |
| iPad zeigt alte Fassung | Seite neu laden. Hilft das nicht: Safari-Tab schließen und den QR-Code erneut scannen. |
| Viele Geräte, Verbindung bricht ab | Mehr als etwa 30 Geräte gleichzeitig vermeiden. Labor-iPads, die gerade nicht gebraucht werden, aus dem WLAN nehmen. |

## Datenschutz

- Eingaben der Schülerinnen und Schüler bleiben im Browser des jeweiligen Geräts.
- Der Pi sieht ein Protokoll nur, wenn eine Gruppe einen Abholcode erzeugt. Das PDF liegt dann im Arbeitsspeicher, höchstens 12 Stunden oder bis zum Ausschalten.
- Caddy und der Abholdienst schreiben keine Zugriffsprotokolle. Die Systemprotokolle liegen nur im Arbeitsspeicher.
