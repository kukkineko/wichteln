# Wichteln

Kleine Wichtel-Seite: Auslosung, private Links per WhatsApp, Wunschzettel mit Live-Sync. Node ohne Abhaengigkeiten, Daten in `/data/data.json`.

## Docker
    docker build -t wichteln .
    docker run -d -p 8085:80 -e ADMIN_PASSWORD=geheim -v wichteln-data:/data wichteln

Organisator: Startseite oeffnen, Admin-Passwort eingeben. Teilnehmer bekommen `?t=<token>`-Links.

## TrueNAS
Apps -> Discover -> Custom App: Image `ghcr.io/<user>/wichteln`, Tag `latest`, Port 8085 -> 80,
Umgebungsvariable `ADMIN_PASSWORD`, Storage: Host Path (z.B. /mnt/nas/wichteln) -> `/data`.
Fuer die Links an die Gruppe muss die Seite von aussen erreichbar sein (Reverse Proxy / Cloudflare Tunnel, am besten mit HTTPS).
