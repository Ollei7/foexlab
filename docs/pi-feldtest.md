# Feldtest USB-Aktualisierung auf dem echten Pi

Für Oliver: einmal nach der Einrichtung (Abschnitt 3 der [Pi-Anleitung](pi-anleitung.md)) und nach jeder Änderung an `server/` durchgehen. Die Befehle laufen per `ssh pi@192.168.178.10`. Für jeden Punkt notieren: klappt / klappt nicht, mit Datum.

| Nr. | Was prüfen | Wie | Erwartet |
|---|---|---|---|
| 1 | udev-Regel greift nur für Sticks | `sudo udevadm monitor --property`, dann FAT32-, exFAT- und ext4-Stick einstecken | Dienst startet bei FAT32 und exFAT; bei ext4 und bei der SD-Karte nicht |
| 2 | Dienst läuft und meldet sich | `systemctl status foexlab-usb-update@sda1`, `journalctl -u 'foexlab-usb-update@*'` | Lauf ohne Fehler, Ergebnis „OK: …“ im Journal |
| 3 | Stick sicher eingehängt | `findmnt /run/foexlab-usb/sda1` während des Laufs | Optionen `noexec,nosuid,nodev`; nach dem Lauf ausgehängt |
| 4 | Unit-Härtung: Update läuft trotzdem | `systemctl show foexlab-usb-update@sda1 -p ProtectSystem -p PrivateNetwork -p NoNewPrivileges`, danach Update per Stick | Werte `strict`, `yes`, `yes`; Update „OK“, Kurse neu, `update.txt` geschrieben, Sicherung `/srv/foexlab.vorher` da |
| 5 | Umlaut-Dateinamen auf FAT32 | Kurs mit Umlaut im Dateinamen per Stick einspielen | Namen auf dem Pi intakt, Seite lädt das Bild |
| 6 | Besitzer bleibt richtig | Nach dem Update `ls -ld /srv/foexlab` | Login-Nutzer (z. B. `pi`); Laptop-`rsync` klappt weiter |
| 7 | Kein Neustart nötig | iPad lädt die Seiten direkt nach dem Tausch | Neue Fassung ohne Caddy-Neustart |
| 8 | Stick mitten im Kopieren abziehen | Großes Update starten, nach 10 s abziehen | Alter Stand bleibt; nächstes Update räumt `/srv/foexlab.neu` auf |
| 9 | Schreibgeschützter oder voller Stick | Stick mit Schreibschutz bzw. ohne freien Platz | Update läuft trotzdem, Ergebnis im Journal |
| 10 | Neustart mit gestecktem Stick | Pi mit Stick neu starten | Kein doppelter Lauf; zweiter Lauf meldet „Schon aktuell“ |
| 11 | Zweiter Stick wartet / wird abgewiesen | Zwei Update-Sticks kurz nacheinander einstecken | Auf dem zweiten steht erst „Ein anderes Update läuft gerade … wartet“, danach sein eigenes Ergebnis; nie zwei Kopien gleichzeitig (nach mehr als 10 Minuten Warten: „Fehler: Ein anderes Update lief zu lange …“) |
| 12 | Dauer messen | Volles Update mit allen Kursen, Zeit von Einstecken bis „OK“ in `update.txt` | Unter 5 Minuten; Zeit in der Anleitung (Abschnitt 5, Schritt 3) nachtragen, wenn länger |
| 13 | Zip entpacken unter Windows und Mac | `foexlab-update.zip` auf beiden Systemen entpacken und auf den Stick ziehen | `foexlab-update/index.html` liegt direkt im Hauptverzeichnis des Sticks |
