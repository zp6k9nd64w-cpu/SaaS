// Tests Page
const tests = {
  render: async () => {
    const main = createPageContainer(`
      <div class="page-card">
        <h1>Testgenerator & Analyse</h1>
        <p>Erhalte einen personalisierten Übungstest und eine Schwächenanalyse.</p>
        <div class="form-card test-form">
          <label for="test-subject">Fach wählen</label>
          <select id="test-subject">
            <option value="Mathe">Mathe</option>
            <option value="Englisch">Englisch</option>
            <option value="Deutsch">Deutsch</option>
            <option value="Biologie">Biologie</option>
            <option value="Geschichte">Geschichte</option>
          </select>
          <button class="btn" onclick="generateTest(document.getElementById('test-subject').value)">Test generieren</button>
        </div>
        <div id="test-content" class="analysis-card"></div>
      </div>
    `);
    renderPageShell(main);
  }
};
