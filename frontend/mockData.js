// Mock data for development
const mockData = {
  user: {
    id: 1,
    name: 'Max Mustermann',
    email: 'max@example.com',
    subscription: 'Core'
  },
  tasks: [
    { id: 1, title: 'Mathe Hausaufgabe', description: 'Kapitel 5 lösen', dueDate: '2023-10-01', priority: 'high', completed: false },
    { id: 2, title: 'Englisch Vokabeln', description: '50 neue Wörter lernen', dueDate: '2023-10-02', priority: 'medium', completed: true }
  ],
  grades: [
    { id: 1, subject: 'Mathe', grade: 'A', date: '2023-09-15' },
    { id: 2, subject: 'Englisch', grade: 'B+', date: '2023-09-16' }
  ],
  subscriptions: [
    {
      name: 'Free',
      price: '0 €',
      features: ['5–10 Fragen/Tag', 'Max. 10 Hausaufgaben', 'Basisfunktionen', 'Einfache Push-Nachrichten', 'FAQ-Support']
    },
    {
      name: 'Core',
      price: '16,99 € / Monat',
      features: ['50–100 Fragen/Tag', 'Unbegrenzte Hausaufgaben', 'Dynamische Tests', 'Adaptive Lernplanung', 'Analyse', 'Erweiterte Push-Nachrichten', 'E-Mail + Chat Support']
    },
    {
      name: 'Elite',
      price: '24,99 € / Monat',
      features: ['Unbegrenzte Nutzung', 'Personalisierte Lernpläne', 'Tiefgehende Analysen', 'Vorlernen', 'AI-Zusammenfassungen', 'Vollständige Motivation', 'VIP Support']
    }
  ],
  team: [
    { name: 'Lena Fischer', role: 'Bildungsdesignerin', description: 'Entwickelt lernpsychologisch fundierte Lernpfade.' },
    { name: 'Jonas Weber', role: 'KI-Architekt', description: 'Baute den AI-Assistenten für adaptive Übungsempfehlungen.' },
    { name: 'Sara Klein', role: 'UX-Designerin', description: 'Sorgt dafür, dass die Plattform jugendlich, modern und einfach nutzbar ist.' }
  ],
  testimonials: [
    { name: 'Anna S.', text: 'Diese Plattform hat meine Noten verbessert!' },
    { name: 'Tom K.', text: 'Der AI-Assistent ist super hilfreich.' }
  ]
};