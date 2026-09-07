// AI Assistant Page
const aiAssistent = {
  render: () => {
    const main = createPageContainer(`
      <div class="page-card">
        <h1>AI-Lern-Assistent</h1>
        <p>Stelle deine Frage. Unsere KI liefert dir eine strukturierte Antwort mit Lernhilfe.</p>
        <div class="chat-panel">
          <div id="conversation" class="conversation"></div>
          <div class="chat-input">
            <input type="text" id="ai-question" placeholder="Was möchtest du lernen?">
            <button class="btn" onclick="sendAIQuestion()">Senden</button>
          </div>
        </div>
      </div>
    `);
    renderPageShell(main);
    if (appState.conversation.length === 0) {
      appState.conversation.push({ sender: 'ai', text: 'Hi! Ich bin dein Lern-Assistent. Frag mich etwas zu Mathe, Englisch oder jedem anderen Fach.' });
    }
    renderConversation();
  }
};
