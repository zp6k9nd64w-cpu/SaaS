// Subscription / upgrade page
const DEFAULT_PLAN = 'Core';
const TOAST_TIMEOUT_MS = 3800;
const UPGRADE_PAGE_STATE = {
    isProcessing: false,
    feedback: '',
    feedbackType: 'info'
};

const abo = {
    render: () => {
        const subscriptions = getSubscriptions();

        if (!subscriptions.length) {
            renderPageShell(createPageContainer(`
                <section class="page-card">
                    <h1>💎 Upgrade dein Abonnement</h1>
                    <p>Zurzeit sind keine Abonnements verfügbar.</p>
                </section>
            `));
            return;
        }

        const selectedPlan = getSafePlanName(getSelectedPlanFromRouterOrState(), subscriptions);

        if (typeof appState !== 'undefined') {
            appState.selectedPlan = selectedPlan;
        }

        const currentPlan = typeof appState !== 'undefined' ? appState?.subscription : null;
        const main = createPageContainer(`
            <section class="page-card page-hero">
                <div class="page-hero__content">
                    <span class="eyebrow">Enterprise Subscription</span>
                    <h1>💎 Upgrade dein Abonnement</h1>
                    <p>Wähle den Plan, der am besten zu deinem Wachstum, deiner Sicherheit und deinen Team-Workflows passt.</p>
                </div>
                <div class="page-hero__meta">
                    <div class="plan-summary">
                        <span class="plan-summary__label">Aktueller Plan</span>
                        <strong>${escapeHtml(currentPlan || DEFAULT_PLAN)}</strong>
                        <span class="plan-summary__hint">Auswahl und Upgrade sind jederzeit möglich.</span>
                    </div>
                </div>
            </section>

            ${renderFeedbackMarkup()}

            <section class="plan-highlights" aria-label="Warum Nutzer dieses Upgrade wählen">
                <div class="plan-highlights__item">
                    <span>⚡</span>
                    <div><strong>Sofort aktiv</strong><p>Dein Upgrade wird direkt nach der Bestätigung aktiviert.</p></div>
                </div>
                <div class="plan-highlights__item">
                    <span>🔒</span>
                    <div><strong>Enterprise-Grade</strong><p>Vertrauliche Workflows, sichere Abläufe und hochwertige Prozesse.</p></div>
                </div>
                <div class="plan-highlights__item">
                    <span>📈</span>
                    <div><strong>Skalierbar</strong><p>Die Pläne wachsen mit deinem Team und deinem Bedarf.</p></div>
                </div>
            </section>

            <section class="plans-grid" aria-label="Verfügbare Abonnements">
                ${subscriptions.map((subscription) => renderSubscriptionCard(subscription, selectedPlan)).join('')}
            </section>

            <section class="page-card faq-card">
                <h3>❓ Häufig gestellte Fragen</h3>
                <p><strong>Kann ich mein Abonnement jederzeit upgraden?</strong> Ja! Du kannst jederzeit zu einem höheren Plan wechseln und profitierst sofort von den neuen Features.</p>
                <p><strong>Wird mit eine Gebühr berechnet?</strong> Im Demo-Modus ist das Upgrade kostenlos. In einer echten Anwendung würde eine Kreditkartenverifizierung erfolgen.</p>
                <p><strong>Was ist der Unterschied zwischen den Plänen?</strong> Der Free-Plan bietet Grundfunktionen, Core umfasst KI-Features und Elite bietet Offline-Modus + Premium-Support.</p>
            </section>
        `);

        renderPageShell(main);
    }
};

function getSubscriptions() {
    if (typeof mockData === 'undefined' || !Array.isArray(mockData?.subscriptions)) {
        return [];
    }

    return mockData.subscriptions.filter((subscription) => subscription && typeof subscription === 'object' && subscription.name);
}

function getSafePlanName(planName, subscriptions = getSubscriptions()) {
    const normalizedPlan = typeof planName === 'string' ? planName.trim().toLowerCase() : '';

    if (!normalizedPlan) {
        return subscriptions[1]?.name || subscriptions[0]?.name || DEFAULT_PLAN;
    }

    const matchingPlan = subscriptions.find((subscription) => subscription.name.toLowerCase() === normalizedPlan);
    return matchingPlan?.name || subscriptions[1]?.name || subscriptions[0]?.name || DEFAULT_PLAN;
}

function getSelectedPlanFromRouterOrState() {
    const queryPlan = typeof router !== 'undefined' && router?.getQueryParams?.().get('plan');
    if (typeof queryPlan === 'string' && queryPlan.trim()) {
        return queryPlan;
    }

    return typeof appState !== 'undefined' ? appState?.selectedPlan : null;
}

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function renderFeedbackMarkup() {
    const state = getUpgradePageState();
    if (!state.feedback) {
        return '';
    }

    const icon = state.feedbackType === 'success' ? '✓' : state.feedbackType === 'error' ? '!' : 'i';

    return `
        <div class="feedback feedback--${state.feedbackType}" role="status" aria-live="polite">
            <span class="feedback__icon">${escapeHtml(icon)}</span>
            <span>${escapeHtml(state.feedback)}</span>
        </div>
    `;
}

function getUpgradePageState() {
    return UPGRADE_PAGE_STATE;
}

function setUpgradePageState(partialState) {
    Object.assign(UPGRADE_PAGE_STATE, partialState);
}

function renderSubscriptionCard(subscription, selectedPlan) {
    const isSelected = selectedPlan === subscription.name;
    const isCurrentPlan = typeof appState !== 'undefined' && appState?.subscription === subscription.name;
    const uiState = getUpgradePageState();
    const isProcessing = Boolean(uiState.isProcessing);
    const buttonLabel = isProcessing ? '⏳ Wird verarbeitet…' : isCurrentPlan ? '✅ Aktuell' : '🚀 Auswählen';
    const isDisabled = isProcessing || isCurrentPlan;
    const features = Array.isArray(subscription.features) ? subscription.features : [];
    const cardLabel = isSelected ? 'Empfohlen' : 'Flexible Skalierung';

    return `
        <article class="subscription-card ${isSelected ? 'subscription-card--selected' : ''}" data-plan="${escapeHtml(subscription.name)}">
            <div
                class="subscription-card__header"
                role="button"
                tabindex="0"
                onclick="selectPlan(${JSON.stringify(subscription.name)})"
                onkeydown="handlePlanSelectionKey(event, ${JSON.stringify(subscription.name)})"
                aria-label="Plan ${escapeHtml(subscription.name)} auswählen"
            >
                <div class="subscription-card__badge">${escapeHtml(cardLabel)}</div>
                <h2 class="subscription-card__title">${escapeHtml(subscription.name)}</h2>
                <div class="subscription-card__price">${escapeHtml(subscription.price)}</div>
            </div>

            <ul class="subscription-card__features">
                ${features.map((feature) => `
                    <li class="subscription-card__feature">
                        <span class="subscription-card__check" aria-hidden="true">✓</span>
                        <span>${escapeHtml(feature)}</span>
                    </li>
                `).join('')}
            </ul>

            <button
                class="btn ${isSelected ? 'btn-primary' : 'btn-secondary'} subscription-card__button"
                type="button"
                onclick="selectAndUpgrade(${JSON.stringify(subscription.name)})"
                ${isDisabled ? 'disabled' : ''}
            >
                ${buttonLabel}
            </button>
        </article>
    `;
}

function handlePlanSelectionKey(event, planName) {
    if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        selectPlan(planName);
    }
}

function ensureToastHost() {
    if (typeof document === 'undefined') {
        return null;
    }

    let host = document.getElementById('app-toasts');
    if (!host) {
        host = document.createElement('div');
        host.id = 'app-toasts';
        host.className = 'app-toasts';
        host.setAttribute('aria-live', 'polite');
        host.setAttribute('aria-atomic', 'true');
        document.body.appendChild(host);
    }

    return host;
}

function showToast(message, type = 'info') {
    const host = ensureToastHost();
    if (!host) {
        return;
    }

    const toast = document.createElement('div');
    toast.className = `app-toasts__item app-toasts__item--${type}`;
    toast.innerHTML = `<span>${escapeHtml(message)}</span>`;
    host.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.add('app-toasts__item--visible');
    });

    window.setTimeout(() => {
        toast.classList.remove('app-toasts__item--visible');
        window.setTimeout(() => toast.remove(), 220);
    }, TOAST_TIMEOUT_MS);
}

function selectPlan(planName) {
    const subscriptions = getSubscriptions();
    const nextPlan = getSafePlanName(planName, subscriptions);

    if (typeof appState !== 'undefined') {
        appState.selectedPlan = nextPlan;
    }

    setUpgradePageState({ feedback: '', feedbackType: 'info' });

    if (typeof router !== 'undefined' && typeof router.navigate === 'function') {
        router.navigate(`/abo?plan=${encodeURIComponent(nextPlan)}`);
    }
}

async function selectAndUpgrade(planName) {
    const subscriptions = getSubscriptions();
    const nextPlan = getSafePlanName(planName, subscriptions);

    if (typeof appState !== 'undefined') {
        appState.selectedPlan = nextPlan;
    }

    if (typeof appState !== 'undefined' && appState?.subscription === nextPlan) {
        setUpgradePageState({ feedback: `Du verwendest bereits den ${nextPlan}-Plan.`, feedbackType: 'info' });
        showToast(`Du verwendest bereits den ${nextPlan}-Plan.`, 'info');
        abo.render();
        return;
    }

    await processUpgrade(nextPlan);
}

async function processUpgrade(planName = DEFAULT_PLAN) {
    if (typeof requireAuth !== 'function' || !requireAuth()) {
        return;
    }

    const subscriptions = getSubscriptions();
    const nextPlan = getSafePlanName(planName, subscriptions);

    if (typeof appState === 'undefined' || !appState?.user?.id) {
        setUpgradePageState({ isProcessing: false, feedback: 'Bitte melde dich zuerst an, um dein Abo zu aktualisieren.', feedbackType: 'error' });
        showToast('Bitte melde dich zuerst an, um dein Abo zu aktualisieren.', 'error');
        abo.render();
        return;
    }

    if (typeof apiPost !== 'function') {
        setUpgradePageState({ isProcessing: false, feedback: 'Upgrade konnte nicht abgeschlossen werden.', feedbackType: 'error' });
        showToast('Upgrade konnte nicht abgeschlossen werden.', 'error');
        abo.render();
        return;
    }

    setUpgradePageState({ isProcessing: true, feedback: 'Upgrade wird vorbereitet…', feedbackType: 'info' });
    abo.render();

    try {
        const result = await apiPost('/Upgrade', { userId: appState.user.id, plan: nextPlan });

        if (result?.success) {
            appState.subscription = nextPlan;
            appState.user.subscription = nextPlan;

            if (typeof saveAppState === 'function') {
                saveAppState();
            }

            setUpgradePageState({ isProcessing: false, feedback: `Upgrade zu ${nextPlan} war erfolgreich.`, feedbackType: 'success' });
            showToast(`Upgrade zu ${nextPlan} war erfolgreich.`, 'success');
            abo.render();

            if (typeof router !== 'undefined' && typeof router.navigate === 'function') {
                router.navigate('/profil');
            }
        } else {
            setUpgradePageState({ isProcessing: false, feedback: 'Upgrade konnte nicht abgeschlossen werden.', feedbackType: 'error' });
            showToast('Upgrade konnte nicht abgeschlossen werden.', 'error');
            abo.render();
        }
    } catch (error) {
        console.error('Upgrade failed:', error);
        setUpgradePageState({ isProcessing: false, feedback: 'Upgrade konnte nicht abgeschlossen werden.', feedbackType: 'error' });
        abo.render();
    }
}
