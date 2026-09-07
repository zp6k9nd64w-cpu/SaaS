// Landing Page
const mainsite = {
  render: () => {
    const main = createPageContainer(`
      <section class="hero">
        <div class="hero-inner">
          <div>
            <span class="eyebrow">Enterprise-grade learning experience</span>
            <h1>SAAS — Die Premium-Lernplattform für konzentriertes, intelligentes Wachstum</h1>
            <p>Strukturierte Aufgaben, leistungsstarke Analytik, AI-gestützte Lernbegleitung und eine Oberfläche, die sich wie eine moderne Unternehmenslösung anfühlt.</p>
            <div class="hero-actions">
              <button class="btn" onclick="router.navigate('/login')">Jetzt starten</button>
              <button class="btn btn-secondary" onclick="router.navigate('/abo')">Abo vergleichen</button>
            </div>
          </div>
          <div class="hero-cards">
            <div class="stat-card">
              <strong>+75%</strong>
              <span>mehr Fokus durch strukturierte Planung</span>
            </div>
            <div class="stat-card">
              <strong>3×</strong>
              <span>schnelleres Lernen mit KI-Unterstützung</span>
            </div>
            <div class="stat-card">
              <strong>100%</strong>
              <span>mobile-first, zuverlässig und modern</span>
            </div>
          </div>
        </div>
      </section>

      <section class="feature-grid">
        <div class="feature-card">
          <h2>AI-Lern-Assistent</h2>
          <p>Adaptive Schritt-für-Schritt-Erklärungen, persönliche Lernempfehlungen und sofortige Unterstützung.</p>
        </div>
        <div class="feature-card">
          <h2>Leistungsanalyse</h2>
          <p>Automatisierte Tests, klare Fortschrittsanalysen und datenbasierte Lernberatung.</p>
        </div>
        <div class="feature-card">
          <h2>Aufgaben & Planung</h2>
          <p>Deadlines, Prioritäten, Kalender und intelligente Erinnerungen zentral organisiert.</p>
        </div>
      </section>

      <section class="subscriptions">
        <div class="section-heading">
          <h2>Abonnements</h2>
          <p>Wähle die Ebene, die am besten zu deinem Lernstil und deinem Anspruch passt.</p>
        </div>
        <div class="subs">
          ${mockData.subscriptions.map(sub => `
            <div class="card subscription-card">
              <h3>${sub.name}</h3>
              <p class="price">${sub.price}</p>
              <ul>
                ${sub.features.map(f => `<li>${f}</li>`).join('')}
              </ul>
              <button class="btn" onclick="selectPlan('${sub.name}')">Jetzt upgraden</button>
            </div>
          `).join('')}
        </div>
      </section>

      <section class="about-grid">
        <div class="page-card">
          <h2>Warum SAAS?</h2>
          <p>Wir verbinden Lernstrategie, moderne Technologie und UX-Design zu einer Plattform, die echte Produktqualität liefert.</p>
        </div>
        <div class="page-card">
          <h2>Unser Versprechen</h2>
          <p>Saubere Bedienung, zuverlässige Performance und eine digitale Umgebung, die motiviert, organisiert und stärkt.</p>
        </div>
      </section>

      <section class="team-grid">
        <div class="section-heading">
          <h2>Unser Team</h2>
        </div>
        <div class="team-cards">
          ${mockData.team.map(member => `
            <div class="team-card">
              <strong>${member.name}</strong>
              <span>${member.role}</span>
              <p>${member.description}</p>
            </div>
          `).join('')}
        </div>
      </section>

      <section class="testimonials">
        <div class="section-heading">
          <h2>Erfolge</h2>
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
    `);
    renderPageShell(main);
  }
};
