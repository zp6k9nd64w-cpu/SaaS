// Main app shell and shared UI behavior.
function initializeAppUI() {
  const body = document.body;
  if (!body) {
    console.warn('⚠️ Body element not available for UI initialization');
    return;
  }

  const existingFab = document.querySelector('.fab');
  if (!existingFab) {
    const fab = document.createElement('button');
    fab.className = 'fab';
    fab.type = 'button';
    fab.innerHTML = '➕';
    fab.title = 'Neue Aufgabe erstellen';
    fab.setAttribute('aria-label', 'Neue Aufgabe erstellen');
    fab.onclick = () => {
      if (typeof router !== 'undefined' && typeof router.navigate === 'function') {
        router.navigate('/aufgaben');
      } else {
        window.location.hash = '/aufgaben';
      }
    };
    body.appendChild(fab);
  }

  window.appState = window.appState || {};
  window.appState.uiReady = true;
}

window.initializeAppUI = initializeAppUI;
