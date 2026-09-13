// Login Page
const login = {
  render: () => {
    const main = createPageContainer(`
      <section class="auth-shell">
        <div class="page-card auth-card">
          <div class="auth-card__header">
            <span class="eyebrow">Secure Access</span>
            <h1>Wilkommen zurück</h1>
            <p>Melde dich an und fahre dort fort, wo du aufgehört hast.</p>
          </div>
          <form id="login-form" class="auth-form">
            <label class="field-label" for="username">Benutzername</label>
            <input type="text" id="username" placeholder="Benutzername" required>
            <label class="field-label" for="password">Passwort</label>
            <input type="password" id="password" placeholder="Passwort" required>
            <button type="submit" class="btn">Anmelden</button>
          </form>
          <p class="auth-switch">Neu hier? <a href="#/register">Konto anlegen</a></p>
          <div id="auth-message" class="auth-message"></div>
        </div>
        <div class="page-card auth-highlight">
          <h2>Warum SAAS?</h2>
          <ul>
            <li>Klare Lernstruktur und intelligenter Fokus</li>
            <li>KI-gestützte Lernbegleitung</li>
            <li>Professionelle Produkt-Erfahrung auf allen Geräten</li>
          </ul>
        </div>
      </section>
    `);
    renderPageShell(main);
    document.getElementById('login-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;
      const result = await apiPost('/login', { username, password });
      const message = document.getElementById('auth-message');
      message.classList.remove('success', 'error');
      if (result && result.success) {
        message.textContent = 'Login erfolgreich. Weiterleitung...';
        message.classList.add('success');
        setUser(result.user);
        setTimeout(() => router.navigate('/dashboard'), 500);
      } else {
        message.textContent = (result && result.message) || 'Login fehlgeschlagen';
        message.classList.add('error');
      }
    });
  }
};
