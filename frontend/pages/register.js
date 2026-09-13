// Register Page
const register = {
  render: () => {
    const main = createPageContainer(`
      <section class="auth-shell">
        <div class="page-card auth-card">
          <div class="auth-card__header">
            <span class="eyebrow">Create Account</span>
            <h1>Erstelle dein Profil</h1>
            <p>Starte mit einem starken Setup für Lernen, Fokus und Wachstum.</p>
          </div>
          <form id="register-form" class="auth-form">
            <label class="field-label" for="reg-username">Benutzername</label>
            <input type="text" id="reg-username" placeholder="Benutzername" required>
            <label class="field-label" for="reg-email">E-Mail</label>
            <input type="email" id="reg-email" placeholder="E-Mail" required>
            <label class="field-label" for="reg-password">Passwort</label>
            <input type="password" id="reg-password" placeholder="Passwort" required>
            <label class="field-label" for="reg-password-confirm">Passwort bestätigen</label>
            <input type="password" id="reg-password-confirm" placeholder="Passwort bestätigen" required>
            <label class="field-label" for="reg-school-type">Schulart</label>
            <select id="reg-school-type" required>
              <option value="">Schulart wählen</option>
              <option value="Gymnasium">Gymnasium</option>
              <option value="Realschule">Realschule</option>
              <option value="Hauptschule">Hauptschule</option>
              <option value="Gesamtschule">Gesamtschule</option>
              <option value="Berufsschule">Berufsschule</option>
            </select>
            <label class="field-label" for="reg-school-class">Klasse</label>
            <input type="text" id="reg-school-class" placeholder="Klasse (z. B. 10A)" required>
            <label class="field-label" for="reg-birthdate">Geburtsdatum</label>
            <input type="date" id="reg-birthdate" placeholder="Geburtsdatum" required>
            <button type="submit" class="btn">Registrieren</button>
          </form>
          <p class="auth-switch">Schon dabei? <a href="#/login">Zum Login</a></p>
          <div id="auth-message" class="auth-message"></div>
        </div>
        <div class="page-card auth-highlight">
          <h2>Ihr Lern-Setup beginnt hier</h2>
          <ul>
            <li>Professioneller Einstieg in die Plattform</li>
            <li>Nahtlose Weiterarbeit in deinem Dashboard</li>
            <li>Skalierbare Lern- und Produktfunktionen</li>
          </ul>
        </div>
      </section>
    `);
    renderPageShell(main);
    document.getElementById('register-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('reg-username').value;
      const email = document.getElementById('reg-email').value;
      const password = document.getElementById('reg-password').value;
      const passwordConfirm = document.getElementById('reg-password-confirm').value;
      const schoolType = document.getElementById('reg-school-type').value;
      const schoolClass = document.getElementById('reg-school-class').value;
      const birthdate = document.getElementById('reg-birthdate').value;
      const message = document.getElementById('auth-message');
      message.classList.remove('success', 'error');
      if (password !== passwordConfirm) {
        message.textContent = 'Die Passwörter stimmen nicht überein.';
        message.classList.add('error');
        return;
      }
      const result = await apiPost('/register', { username, email, password, schoolType, schoolClass, birthdate });
      if (result && result.success) {
        message.textContent = 'Registrierung erfolgreich. Weiterleitung...';
        message.classList.add('success');
        setUser(result.user);
        setTimeout(() => router.navigate('/dashboard'), 500);
      } else {
        message.textContent = (result && result.message) || 'Registrierung fehlgeschlagen';
        message.classList.add('error');
      }
    });
  }
};
