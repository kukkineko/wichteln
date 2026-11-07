# Wichteln

Kleine statische Wichtel-Seite (Auslosung, private Links per WhatsApp, Wunschzettel). Kein Backend.

## Docker
    docker build -t wichteln .
    docker run -d -p 8085:80 wichteln

Auf GitHub baut die Action das Image nach `ghcr.io/<user>/wichteln:latest`.

## TrueNAS
Apps -> Discover -> Custom App: Image `ghcr.io/<user>/wichteln`, Tag `latest`, Port 8085 -> 80.
Bei privatem Repo/Paket: Registry-Zugang mit GitHub-Token (read:packages) hinterlegen.
Fuer die Links an die Gruppe muss die Seite von aussen erreichbar sein (Reverse Proxy / Cloudflare Tunnel).
