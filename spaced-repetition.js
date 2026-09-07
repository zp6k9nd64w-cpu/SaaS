// Spaced Repetition System - SM-2 Algorithm
const spacedRepetition = {
  render: () => {
    if (!requireAuth()) return;
    mockDB.init();
    
    const userId = appState.user.id;
    const cards = JSON.parse(localStorage.getItem(`flashcards_${userId}`) || '[]');
    const reviewQueue = getReviewQueue(userId);
    
    const stats = {
      total: cards.length,
      new: cards.filter(c => c.repetitions === 0).length,
      learning: cards.filter(c => c.repetitions > 0 && c.repetitions < 5).length,
      review: cards.filter(c => c.repetitions >= 5).length,
      due: reviewQueue.length
    };
    
    const main = createPageContainer(`
      <div class="page-card">
        <h1>🧠 Spaced Repetition</h1>
        <p>Lernen mit der SM-2 Algorithmus für optimale Retention</p>
      </div>
      
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; margin-top: 1.5rem;">
        <div style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 1.5rem; border-radius: 12px; text-align: center;">
          <div style="font-size: 2rem; font-weight: bold;">${stats.total}</div>
          <p style="margin: 0.5rem 0;">Kartei insgesamt</p>
        </div>
        <div style="background: linear-gradient(135deg, #4facfe, #00f2fe); color: white; padding: 1.5rem; border-radius: 12px; text-align: center;">
          <div style="font-size: 2rem; font-weight: bold;">${stats.new}</div>
          <p style="margin: 0.5rem 0;">Neue Karten</p>
        </div>
        <div style="background: linear-gradient(135deg, #fa709a, #fee140); color: white; padding: 1.5rem; border-radius: 12px; text-align: center;">
          <div style="font-size: 2rem; font-weight: bold;">${stats.due}</div>
          <p style="margin: 0.5rem 0;">Fällig zum Lernen</p>
        </div>
        <div style="background: linear-gradient(135deg, #f093fb, #f5576c); color: white; padding: 1.5rem; border-radius: 12px; text-align: center;">
          <div style="font-size: 2rem; font-weight: bold;">${stats.review}</div>
          <p style="margin: 0.5rem 0;">Im Review</p>
        </div>
      </div>
      
      ${reviewQueue.length > 0 ? `
        <section class="page-card" style="margin-top: 1.5rem;">
          <h2>📚 Lernkarrussell (${reviewQueue.length} fällig)</h2>
          <button class="btn btn-primary" onclick="startStudySession()" style="margin-bottom: 1rem;">▶️ Studium starten</button>
          <div style="display: grid; gap: 1rem;">
            ${reviewQueue.slice(0, 5).map(card => `
              <div class="task-item" style="display: grid; grid-template-columns: 1fr auto; gap: 1rem; align-items: center;">
                <div>
                  <strong>${card.front}</strong>
                  <p style="margin: 0.25rem 0; color: #667eea; font-size: 0.9rem;">🔄 Wiederholung: ${card.repetitions}</p>
                </div>
                <div style="text-align: right;">
                  <span style="background: ${card.interval > 30 ? '#4caf50' : card.interval > 7 ? '#ff9800' : '#f44336'}; color: white; padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.8rem;">
                    ${card.interval} Tage
                  </span>
                </div>
              </div>
            `).join('')}
          </div>
        </section>
      ` : '<section class="page-card" style="margin-top: 1.5rem; text-align: center; padding: 2rem;"><p style="color: #999;">Keine Karten zum Lernen. Erstelle neue!</p></section>'}
      
      <section class="page-card" style="margin-top: 1.5rem;">
        <h2>➕ Neue Kartei erstellen</h2>
        <div class="button-group">
          <button class="btn btn-primary" onclick="showNewCardForm()">📝 Neue Karte</button>
          <button class="btn btn-secondary" onclick="router.navigate('/notes')">📂 Aus Notizen importieren</button>
        </div>
      </section>
      
      <section class="page-card" style="margin-top: 1.5rem; background: linear-gradient(135deg, #667eea15, #764ba215);">
        <h2>💡 Über Spaced Repetition</h2>
        <p>Der SM-2 Algorithmus berechnet optimal wann du Karten wiederholen solltest:</p>
        <ul style="list-style: none; padding: 0;">
          <li style="padding: 0.5rem 0;">🎯 <strong>Tag 1:</strong> Wiederhole sofort nach Erlernen</li>
          <li style="padding: 0.5rem 0;">🎯 <strong>Tag 3:</strong> Wiederhole nach 3 Tagen</li>
          <li style="padding: 0.5rem 0;">🎯 <strong>Woche 1:</strong> Wiederhole nach 1 Woche</li>
          <li style="padding: 0.5rem 0;">🎯 <strong>Monat 1:</strong> Wiederhole nach 1 Monat</li>
          <li style="padding: 0.5rem 0;">🎯 <strong>Dauerhaft:</strong> Karte ist gelernt!</li>
        </ul>
      </section>
    `);
    
    renderPageShell(main);
  }
};

function getReviewQueue(userId) {
  const cards = JSON.parse(localStorage.getItem(`flashcards_${userId}`) || '[]');
  const today = new Date();
  
  return cards.filter(card => {
    if (card.nextReview) {
      const nextReviewDate = new Date(card.nextReview);
      return nextReviewDate <= today;
    }
    return card.repetitions === 0; // New cards
  }).sort((a, b) => {
    // New cards first, then by next review date
    if (!a.nextReview) return -1;
    if (!b.nextReview) return 1;
    return new Date(a.nextReview) - new Date(b.nextReview);
  });
}

function showNewCardForm() {
  const modal = document.createElement('div');
  modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;';
  
  modal.innerHTML = `
    <div style="background: white; padding: 2rem; border-radius: 12px; max-width: 500px; width: 90%; max-height: 80vh; overflow-y: auto;">
      <h2>Neue Lernkarte erstellen</h2>
      <input type="text" id="card-front" placeholder="Frage/Begriff (Vorderseite)" style="width: 100%; padding: 0.75rem; margin: 1rem 0; border: 1px solid #ddd; border-radius: 8px;">
      <textarea id="card-back" placeholder="Antwort/Erklärung (Rückseite)" style="width: 100%; padding: 0.75rem; margin: 1rem 0; border: 1px solid #ddd; border-radius: 8px; min-height: 100px; resize: vertical;"></textarea>
      <select id="card-deck" style="width: 100%; padding: 0.75rem; margin: 1rem 0; border: 1px solid #ddd; border-radius: 8px;">
        <option value="">Kartei wählen...</option>
        <option value="Mathe">Mathe</option>
        <option value="Englisch">Englisch</option>
        <option value="Deutsch">Deutsch</option>
        <option value="Geschichte">Geschichte</option>
        <option value="Biologie">Biologie</option>
        <option value="Chemie">Chemie</option>
        <option value="Sonstiges">Sonstiges</option>
      </select>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1.5rem;">
        <button class="btn btn-primary" onclick="saveFlashcard()">✅ Speichern</button>
        <button class="btn btn-secondary" onclick="this.parentElement.parentElement.remove()">Abbrechen</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
}

function saveFlashcard() {
  const front = document.getElementById('card-front').value;
  const back = document.getElementById('card-back').value;
  const deck = document.getElementById('card-deck').value;
  
  if (!front || !back || !deck) {
    alert('Bitte alle Felder ausfüllen!');
    return;
  }
  
  const userId = appState.user.id;
  let cards = JSON.parse(localStorage.getItem(`flashcards_${userId}`) || '[]');
  
  cards.push({
    id: Date.now().toString(),
    front,
    back,
    deck,
    repetitions: 0,
    interval: 0,
    easeFactor: 2.5,
    nextReview: new Date().toISOString(),
    createdAt: new Date().toISOString()
  });
  
  localStorage.setItem(`flashcards_${userId}`, JSON.stringify(cards));
  
  // Award XP
  addXP(10, 'flashcard_created');
  
  alert('✅ Karte hinzugefügt!');
  document.body.querySelector('[style*="position: fixed"]')?.remove();
  spacedRepetition.render();
}

function startStudySession() {
  const userId = appState.user.id;
  const reviewQueue = getReviewQueue(userId);
  
  if (reviewQueue.length === 0) {
    alert('Keine Karten zum Lernen!');
    return;
  }
  
  // Store session
  sessionStorage.setItem('flashcardSession', JSON.stringify({
    cards: reviewQueue,
    currentIndex: 0,
    correct: 0,
    total: reviewQueue.length
  }));
  
  router.navigate('/flashcard-study');
}
