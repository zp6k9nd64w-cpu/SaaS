// Landing Page
const mainsite = {
  render: () => {
    const main = createPageContainer(`
      <section class="hero">
        <div class="hero-inner">
          <div>
            <span class="eyebrow">Für Schüler:innen aller Altersstufen</span>
            <h1>Lernen ohne Überforderung. Mehr Fokus. Bessere Ergebnisse.</h1>
            <p>SAAS hilft dir, einfacher, strukturierter und motivierter zu lernen – für Hausaufgaben, Prüfungen und deine täglichen Ziele. Starte kostenlos und sieh sofort, was als Nächstes wichtig ist.</p>
            <div class="hero-actions">
              <button class="btn" onclick="router.navigate('/login')">Kostenlos starten</button>
              <button class="btn btn-secondary" onclick="router.navigate('/abo')">Pläne ansehen</button>
            </div>
          </div>
          <div class="hero-cards">
            <div class="stat-card">
              <strong>1</strong>
              <span>klarer Lernort für Aufgaben, Ziele und Fortschritt</span>
            </div>
            <div class="stat-card">
              <strong>24/7</strong>
              <span>verständliche Hilfe, wenn du nicht weiterkommst</span>
            </div>
            <div class="stat-card">
              <strong>Jeden Tag</strong>
              <span>kleine Schritte, die dich deinem Ziel näherbringen</span>
            </div>
          </div>
        </div>
      </section>

      <section class="feature-grid">
        <div class="feature-card">
          <h2>Sofortige Hilfe</h2>
          <p>Wenn du nicht weiterkommst, bekommst du verständliche Erklärungen und nächste Schritte – passend zu deinem Thema.</p>
        </div>
        <div class="feature-card">
          <h2>Dein persönlicher Lernplan</h2>
          <p>Teile große Ziele in machbare Aufgaben auf und lerne in deinem Tempo – unabhängig von Alter und Schulstufe.</p>
        </div>
        <div class="feature-card">
          <h2>Alles im Blick</h2>
          <p>Aufgaben, Prioritäten, Deadlines und Erinnerungen sind an einem Ort, damit du nichts Wichtiges verpasst.</p>
        </div>
        <div class="feature-card">
          <h2>Fortschritt, den du siehst</h2>
          <p>Erkenne deine Erfolge, entdecke Lernlücken und weiß immer, worauf du dich als Nächstes konzentrieren solltest.</p>
        </div>
        <div class="feature-card">
          <h2>Mehr Motivation</h2>
          <p>Klare Tagesziele und sichtbare Fortschritte machen Lernen überschaubar und helfen dir, dranzubleiben.</p>
        </div>
        <div class="feature-card">
          <h2>Für jede Schulstufe</h2>
          <p>Ob Grundschule, Mittelstufe oder Oberstufe: Du entscheidest, was du lernst und wie schnell du vorankommst.</p>
        </div>
      </section>

      <section class="about-grid">
        <div class="page-card">
          <h2>So einfach funktioniert es</h2>
          <p><strong>1. Ziel festlegen:</strong> Wähle Fach, Thema oder Prüfung.</p>
          <p><strong>2. Plan starten:</strong> SAAS macht daraus klare, machbare Schritte.</p>
          <p><strong>3. Gemeinsam lernen:</strong> Bearbeite Aufgaben und frage nach, wenn etwas unklar ist.</p>
          <p><strong>4. Fortschritt sehen:</strong> Feiere Erfolge und passe deinen Plan jederzeit an.</p>
        </div>
        <div class="page-card">
          <h2>Weniger Stress, mehr Klarheit</h2>
          <p>Du musst nicht alles auf einmal schaffen. SAAS zeigt dir den nächsten sinnvollen Schritt und hilft dir, aus Lernen eine Gewohnheit zu machen.</p>
          <button class="btn" onclick="router.navigate('/login')">Jetzt kostenlos ausprobieren</button>
        </div>
      </section>

      <section class="subscriptions">
        <div class="section-heading">
          <h2>Starte kostenlos. Wähle später, was du brauchst.</h2>
          <p>Beginne ohne Risiko und entscheide selbst, ob du mehr Unterstützung, Analysen und Lernmöglichkeiten möchtest.</p>
        </div>
        <div class="subs">
          ${mockData.subscriptions.map((sub, index) => `
            <div class="card subscription-card">
              ${index === 1 ? '<span class="badge">Beliebtester Plan</span>' : ''}
              <h3>${sub.name}</h3>
              <p>${index === 0 ? 'Zum Kennenlernen und Ausprobieren' : index === 1 ? 'Für regelmäßiges, fokussiertes Lernen' : 'Für maximale Unterstützung und Fortschritt'}</p>
              <p class="price">${sub.price}</p>
              <ul>
                ${sub.features.map(f => `<li>${f}</li>`).join('')}
              </ul>
              <button class="btn" onclick="selectPlan('${sub.name}')">${index === 0 ? 'Kostenlos starten' : 'Plan auswählen'}</button>
            </div>
          `).join('')}
        </div>
      </section>

      <section class="testimonials">
        <div class="section-heading">
          <h2>Eine Lernhilfe, die zu dir passt</h2>
          <p>Einfach genug für den Einstieg und leistungsstark genug für große Ziele.</p>
        </div>
        <div class="testimonial-grid">
          ${mockData.testimonials.map(t => `
            <div class="testimonial-card">
              <p>“${t.text}”</p>
              <strong>${t.name}</strong>
            </div>
          `).join('')}
        </div>
      </section>

      <section class="about-grid">
        <div class="page-card">
          <h2>Warum SAAS?</h2>
          <p>Weil Lernen nicht an fehlender Motivation scheitern sollte. Du bekommst Struktur, Unterstützung und einen klaren nächsten Schritt – statt noch mehr Stress.</p>
        </div>
        <div class="page-card">
          <h2>Häufige Fragen</h2>
          <p><strong>Für wen ist SAAS?</strong><br>Für Schüler:innen jeder Altersstufe und jedes Lernniveaus.</p>
          <p><strong>Kann ich kostenlos starten?</strong><br>Ja. Der Free-Plan gibt dir einen einfachen Einstieg ohne Zahlungsrisiko.</p>
          <p><strong>Kann ich später wechseln?</strong><br>Ja. Du kannst jederzeit einen anderen Plan auswählen.</p>
        </div>
      </section>

      <section class="page-card" style="text-align: center; margin-top: 2rem;">
        <h2>Bereit, entspannter zu lernen?</h2>
        <p>Erstelle deinen ersten Lernplan und finde heraus, wie viel leichter Lernen mit Struktur sein kann.</p>
        <button class="btn" onclick="router.navigate('/login')">Kostenlos starten</button>
      </section>
    `);
    renderPageShell(main);
  }
};
