# SAAS Lernplattform

Eine moderne Lernplattform mit Aufgabenverwaltung, Leistungsübersicht, Kalender, KI-Unterstützung und einem strukturierten Frontend-Backend-Setup.

## Schnellstart

1. Öffne die Datei [index.html](index.html) im Browser oder stelle den Ordner lokal über einen einfachen Webserver bereit.
2. Für die Backend-API kann der Server über Node.js gestartet werden:
   - Wechsel in den Ordner [backend](backend)
   - Führe `npm install` aus
   - Starte den Server mit `node server.js`

## Struktur

- [frontend](frontend) enthält die Benutzeroberfläche und die Seitenlogik.
- [backend](backend) enthält die API und die Datenbankanbindung.
- [service-worker.js](service-worker.js) sorgt für einen Offline-Cache.

## Hinweise

- Die App ist bewusst robust aufgebaut und enthält zentrale Fehlerbehandlung sowie ein professionelles Routing.
- Für eine Produktionsreife sollten später echte Authentifizierung, Datenbank-Backup und Deployment-Umgebungen ergänzt werden.
