# SAAS Lernplattform

Eine moderne Lernplattform mit Aufgabenverwaltung, Leistungsübersicht, Kalender, KI-Unterstützung und einem strukturierten Frontend-Backend-Setup.

## Lokal starten

1. Installiere Node.js 20 oder neuer.
2. Führe im Projektordner `npm install` und anschließend `npm start` aus.
3. Öffne `http://localhost:3000`. Ohne `DATABASE_URL` verwendet die lokale Entwicklung SQLite.

## Vercel bereitstellen

Das Frontend wird statisch ausgeliefert; `api/[...path].js` stellt die Express-API als Vercel-Serverless-Function unter derselben Domain bereit. Für gehostete Bereitstellungen ist eine persistente PostgreSQL-Datenbank erforderlich; Vercel-Funktionsdateien sind nicht als dauerhafter Datenbankspeicher geeignet.

1. Verbinde das Repository in Vercel.
2. Verbinde ein PostgreSQL-Angebot, z. B. Neon, und setze `DATABASE_URL` in den Vercel-Umgebungsvariablen für Production und Preview. Verwende die TLS-gesicherte Verbindungsadresse und teile sie niemals öffentlich.
3. Deploye erneut und prüfe `/api/health`. Die Antwort muss `"database":"postgres"` enthalten.

Produktiv verweigert der Server den Start, wenn `DATABASE_URL` fehlt, anstatt unzuverlässig auf lokale SQLite-Dateien zurückzufallen. Konten erhalten serverseitige, zufällige HTTP-only-Sitzungscookies. Soziale Funktionen sind standardmäßig privat bzw. nur für bestätigte Freunde sichtbar; globale Ranglisten sind Opt-in.

Frontend und API müssen unter derselben Origin laufen; GitHub-Pages-Frontend und eine separate Vercel-API werden absichtlich nicht als gemeinsamer Login unterstützt.

## Tests

`npm test` führt die Backend-API-Tests aus.

## Struktur

- [frontend](frontend) enthält die Benutzeroberfläche und die Seitenlogik.
- [backend](backend) enthält die API und die Datenbankanbindung.
- [service-worker.js](service-worker.js) sorgt für einen Offline-Cache.

## Hinweise

- Die App enthält zentrale Fehlerbehandlung sowie ein clientseitiges Routing.
- Browser-Benachrichtigungen funktionieren nur nach Erlaubnis und während die Seite geöffnet ist. Echte Hintergrundbenachrichtigungen brauchen zusätzlich einen Push-Dienst.
- Sichere Vercel-Bereitstellung erfordert das Einrichten von PostgreSQL und `DATABASE_URL`; diese Zugangsdaten werden nicht mit dem Quellcode ausgeliefert.
