// Combined Components
class Navbar {
  render() {
    const nav = document.createElement('nav');
    nav.className = 'navbar';
    const userLabel = typeof appState !== 'undefined' && appState.user ? `${appState.user.username}` : 'Login';
    const userLink = appState && appState.user ? '#/profil' : '#/login';
    
    nav.innerHTML = `
      <div class="logo">📚 SAAS</div>
      
      <!-- Hamburger Menu -->
      <div class="burger">
        <div class="line1"></div>
        <div class="line2"></div>
        <div class="line3"></div>
      </div>

      <!-- Mobile/Slide Menu -->
      <div class="slide-menu">
        <!-- Quick Links -->
        <div class="quick-links">
          <a href="#/" class="quick-link">🏠 Home</a>
          <a href="#/dashboard" class="quick-link">📊 Dashboard</a>
          <a href="${userLink}" class="quick-link user-link">👤 ${userLabel}</a>
          <button class="quick-link dark-mode-btn" onclick="toggleDarkMode()">🌙 Dark Mode</button>
        </div>

        <!-- Central Menu Dropdown inside Slide Menu -->
        <div class="slide-menu-content">
          
          <!-- Learning Section -->
          <div class="menu-section">
            <div class="menu-header">📚 LERNEN</div>
            <a href="#/quiz" class="dropdown-item">🎯 Quiz</a>
            <a href="#/exam-simulator" class="dropdown-item">📝 Prüfungen</a>
            <a href="#/spaced-repetition" class="dropdown-item">🧠 Flashcards</a>
            <a href="#/notes" class="dropdown-item">📝 Notizen</a>
            <a href="#/aufgaben" class="dropdown-item">✅ Aufgaben</a>
            <a href="#/habits" class="dropdown-item">🎯 Gewohnheiten</a>
            <a href="#/faecher" class="dropdown-item">📚 Fächer</a>
            <a href="#/study-plans" class="dropdown-item">📋 Pläne</a>
          </div>

          <!-- Analytics Section -->
          <div class="menu-section">
            <div class="menu-header">📈 ANALYTICS</div>
            <a href="#/analytics" class="dropdown-item">📊 Meine Statistiken</a>
            <a href="#/comparative-analytics" class="dropdown-item">🔄 Vergleich</a>
            <a href="#/reports" class="dropdown-item">📋 Reports</a>
            <a href="#/streak-calendar" class="dropdown-item">🔥 Streaks</a>
            <a href="#/activity-feed" class="dropdown-item">📰 Activity Feed</a>
          </div>

          <!-- Gamification Section -->
          <div class="menu-section">
            <div class="menu-header">🎮 SPIELE & BELOHNUNGEN</div>
            <a href="#/daily-rewards" class="dropdown-item">🎁 Tägliche Belohnungen</a>
            <a href="#/achievements" class="dropdown-item">🎖️ Achievements</a>
            <a href="#/badge-shop" class="dropdown-item">🏅 Badge Shop</a>
            <a href="#/leaderboard" class="dropdown-item">🏆 Leaderboard</a>
            <a href="#/tournaments" class="dropdown-item">🏆 Turniere</a>
            <a href="#/skill-tree" class="dropdown-item">⚔️ Skill Tree</a>
            <a href="#/challenges" class="dropdown-item">⚡ Challenges</a>
          </div>

          <!-- Social Section -->
          <div class="menu-section">
            <div class="menu-header">👥 SOZIAL & COMMUNITY</div>
            <a href="#/friends" class="dropdown-item">👥 Freunde</a>
            <a href="#/messages" class="dropdown-item">💬 Nachrichten</a>
            <a href="#/study-groups" class="dropdown-item">📚 Gruppen</a>
            <a href="#/mentorship" class="dropdown-item">👨‍🏫 Mentoring</a>
            <a href="#/notifications" class="dropdown-item">🔔 Benachrichtigungen</a>
          </div>

          <!-- Tools Section -->
          <div class="menu-section">
            <div class="menu-header">🛠️ TOOLS & RESSOURCEN</div>
            <a href="#/timer" class="dropdown-item">⏱️ Timer</a>
            <a href="#/ai-coach" class="dropdown-item">🤖 AI Coach</a>
            <a href="#/resource-library" class="dropdown-item">📚 Resources</a>
            <a href="#/media-library" class="dropdown-item">🎥 Videos</a>
            <a href="#/certifications" class="dropdown-item">🎓 Zertifikate</a>
          </div>

          <!-- Settings Section -->
          <div class="menu-section">
            <div class="menu-header">⚙️ EINSTELLUNGEN</div>
            <a href="#/theme-customization" class="dropdown-item">🎨 Themes</a>
            <a href="#/privacy-settings" class="dropdown-item">🔐 Privacy</a>
            <a href="#/email-notifications" class="dropdown-item">📧 E-Mail</a>
            <a href="#/subscription-plans" class="dropdown-item">💳 Abos</a>
          </div>
        </div>
      </div>
    `;

    const burger = nav.querySelector('.burger');
    const slideMenu = nav.querySelector('.slide-menu');
    
    // Hamburger Menu Toggle
    burger.addEventListener('click', (e) => {
      e.stopPropagation();
      slideMenu.classList.toggle('active');
      burger.classList.toggle('toggle');
    });

    // Close menu when link is clicked
    nav.querySelectorAll('.dropdown-item, .quick-link').forEach(item => {
      item.addEventListener('click', () => {
        slideMenu.classList.remove('active');
        burger.classList.remove('toggle');
      });
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!nav.contains(e.target)) {
        slideMenu.classList.remove('active');
        burger.classList.remove('toggle');
      }
    });

    // Dark Mode auf Startup anwenden
    if (localStorage.getItem('darkMode') === 'true') {
      applyDarkMode(true);
    }

    return nav;
  }
}

class Card {
  constructor(title, content) {
    this.title = title;
    this.content = content;
  }

  render() {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <h3>${this.title}</h3>
      <p>${this.content}</p>
    `;
    return card;
  }
}

class Button {
  constructor(text, onClick) {
    this.text = text;
    this.onClick = onClick;
  }

  render() {
    const button = document.createElement('button');
    button.className = 'btn';
    button.textContent = this.text;
    button.addEventListener('click', this.onClick);
    return button;
  }
}