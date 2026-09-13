// Flashcard Study Session Page
const flashcardStudy = {
  render: () => {
    if (!requireAuth()) return;
    
    const session = JSON.parse(sessionStorage.getItem('flashcardSession') || 'null');
    if (!session) {
      renderPageShell(createPageContainer('<p>Keine aktive Study-Session. <a href="#/spaced-repetition">Zurück</a></p>'));
      return;
    }
    
    const card = session.cards[session.currentIndex];
    const isFlipped = sessionStorage.getItem('cardFlipped') === 'true';
    
    if (!card) {
      // Session beendet
      const percentage = Math.round((session.correct / session.total) * 100);
      const xpReward = Math.floor(50 + (percentage / 2));
      const result = addXP(xpReward, 'study_session_completed');
      
      const main = createPageContainer(`
        <div class="page-card" style="text-align: center;">
          <h1>🎓 Lernsession abgeschlossen!</h1>
          <div style="font-size: 3rem; color: #667eea; margin: 1rem 0;">${percentage}%</div>
          <p style="font-size: 1.2rem;">Du hattest ${session.correct}/${session.total} Karten richtig</p>
          <p style="font-size: 1.2rem; color: #4caf50; font-weight: bold; margin-top: 1rem;">+${xpReward} XP ${result.levelUp ? '🎉 LEVEL UP!' : ''}</p>
          
          <div style="margin: 2rem 0; background: linear-gradient(135deg, #667eea15, #764ba215); padding: 1.5rem; border-radius: 12px;">
            <h3>📊 Statistiken</h3>
            <p>⏱️ <strong>Dauer:</strong> ${Math.round((new Date() - new Date(sessionStorage.getItem('sessionStart'))) / 1000 / 60)} Minuten</p>
            <p>✅ <strong>Richtig:</strong> ${session.correct}</p>
            <p>❌ <strong>Falsch:</strong> ${session.total - session.correct}</p>
            <p>📈 <strong>Erfolgsquote:</strong> ${percentage}%</p>
          </div>
          
          <div class="button-group">
            <button class="btn btn-primary" onclick="router.navigate('/spaced-repetition')">Zurück</button>
            <button class="btn btn-secondary" onclick="startStudySession()">🔄 Neue Session</button>
          </div>
        </div>
      `);
      
      renderPageShell(main);
      
      // Update flashcards with SM-2 algorithm
      updateFlashcardsAfterSession(session);
      sessionStorage.removeItem('flashcardSession');
      return;
    }
    
    const main = createPageContainer(`
      <div class="page-card">
        <h1>📚 Lernkarten Studium</h1>
        <div style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 1rem; border-radius: 12px;">
          <p style="margin: 0;">Karte ${session.currentIndex + 1} von ${session.total}</p>
          <div style="width: 100%; height: 8px; background: rgba(255,255,255,0.3); border-radius: 4px; margin-top: 0.5rem;">
            <div style="width: ${((session.currentIndex + 1) / session.total) * 100}%; height: 100%; background: white; border-radius: 4px; transition: width 0.3s ease;"></div>
          </div>
        </div>
      </div>
      
      <section class="page-card" style="margin-top: 2rem;">
        <div style="perspective: 1000px; cursor: pointer;" onclick="toggleFlipCard()" style="min-height: 300px;">
          <div style="
            background: linear-gradient(135deg, ${isFlipped ? '#764ba2' : '#667eea'}, ${isFlipped ? '#f093fb' : '#764ba2'});
            color: white;
            padding: 2rem;
            border-radius: 12px;
            text-align: center;
            min-height: 300px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            transition: all 0.6s ease;
            cursor: pointer;
            user-select: none;
          ">
            <div style="font-size: 0.9rem; opacity: 0.7; margin-bottom: 1rem;">
              ${isFlipped ? '✅ ANTWORT' : '❓ FRAGE'}
            </div>
            <div style="font-size: 1.5rem; font-weight: bold; margin-bottom: 2rem; max-width: 100%; word-wrap: break-word;">
              ${isFlipped ? card.back : card.front}
            </div>
            <div style="font-size: 0.85rem; opacity: 0.7;">
              💡 Klicke zum ${isFlipped ? 'Verbergen' : 'Umblättern'}
            </div>
          </div>
        </div>
      </section>
      
      <section class="page-card" style="margin-top: 1.5rem;">
        <h3>Wie gut konntest du die Antwort erinnern?</h3>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem;">
          <button class="btn" style="background: #f44336; color: white; padding: 1.5rem;" onclick="recordAnswer(0)">
            <div style="font-size: 1.5rem;">❌</div>
            <div style="font-size: 0.9rem;">Vergessen</div>
          </button>
          <button class="btn" style="background: #ff9800; color: white; padding: 1.5rem;" onclick="recordAnswer(1)">
            <div style="font-size: 1.5rem;">⚠️</div>
            <div style="font-size: 0.9rem;">Schwierig</div>
          </button>
          <button class="btn" style="background: #4caf50; color: white; padding: 1.5rem;" onclick="recordAnswer(2)">
            <div style="font-size: 1.5rem;">✅</div>
            <div style="font-size: 0.9rem;">Richtig!</div>
          </button>
        </div>
      </section>
    `);
    
    renderPageShell(main);
  }
};

function toggleFlipCard() {
  sessionStorage.setItem('cardFlipped', sessionStorage.getItem('cardFlipped') === 'true' ? 'false' : 'true');
  flashcardStudy.render();
}

function recordAnswer(quality) {
  const session = JSON.parse(sessionStorage.getItem('flashcardSession'));
  
  if (quality === 2) {
    session.correct++;
  }
  
  session.currentIndex++;
  sessionStorage.setItem('flashcardSession', JSON.stringify(session));
  sessionStorage.setItem('cardFlipped', 'false');
  
  flashcardStudy.render();
}

function updateFlashcardsAfterSession(session) {
  const userId = appState.user.id;
  let cards = JSON.parse(localStorage.getItem(`flashcards_${userId}`) || '[]');
  
  session.cards.forEach((sessionCard, idx) => {
    const cardIndex = cards.findIndex(c => c.id === sessionCard.id);
    if (cardIndex >= 0) {
      const card = cards[cardIndex];
      const quality = idx < session.correct ? 2 : 0; // Simplified for demo
      
      // SM-2 Algorithm
      if (quality < 3) {
        card.repetitions = 0;
        card.interval = 1;
      } else {
        if (card.repetitions === 0) {
          card.interval = 1;
        } else if (card.repetitions === 1) {
          card.interval = 3;
        } else {
          card.interval = Math.round(card.interval * card.easeFactor);
        }
        card.repetitions++;
      }
      
      card.easeFactor = Math.max(1.3, card.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));
      
      const nextReview = new Date();
      nextReview.setDate(nextReview.getDate() + card.interval);
      card.nextReview = nextReview.toISOString();
    }
  });
  
  localStorage.setItem(`flashcards_${userId}`, JSON.stringify(cards));
}
