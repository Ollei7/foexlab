#!/bin/bash
# Richtet den foeXlab Lab-Server auf Raspberry Pi OS Lite (Bookworm) ein. Mehrfach ausführbar.
# Aufruf auf dem Pi:  sudo bash install.sh
set -euo pipefail
[ "$(id -u)" = 0 ] || { echo "Bitte mit sudo ausführen: sudo bash install.sh"; exit 1; }
HIER="$(cd "$(dirname "$0")" && pwd)"
NUTZER="${SUDO_USER:-pi}"

apt-get update
apt-get install -y caddy python3 rsync exfatprogs

install -d -m 755 /opt/foexlab
install -d -m 755 -o "$NUTZER" -g "$NUTZER" /srv/foexlab
install -m 644 "$HIER/abholdienst.py" /opt/foexlab/abholdienst.py
install -m 644 "$HIER/usb_update.py" /opt/foexlab/usb_update.py
install -m 644 "$HIER/foexlab-usb-update@.service" "/etc/systemd/system/foexlab-usb-update@.service"
install -m 644 "$HIER/99-foexlab-usb.rules" /etc/udev/rules.d/99-foexlab-usb.rules
install -m 644 "$HIER/Caddyfile" /etc/caddy/Caddyfile
install -m 644 "$HIER/foexlab-abholdienst.service" /etc/systemd/system/foexlab-abholdienst.service

# Systemprotokolle nur im Arbeitsspeicher
install -d /etc/systemd/journald.conf.d
printf '[Journal]\nStorage=volatile\n' > /etc/systemd/journald.conf.d/foexlab.conf

systemctl daemon-reload
udevadm control --reload
systemctl enable --now foexlab-abholdienst
systemctl restart foexlab-abholdienst systemd-journald
systemctl enable caddy
systemctl restart caddy

echo
echo "Fertig. Inhalte vom Mac kopieren mit:"
echo "  rsync -av --delete dist/ $NUTZER@<IP-des-Pi>:/srv/foexlab/"
