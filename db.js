// Mock-Datenbank im localStorage
const mockDB = {
  init() {
    if (!localStorage.getItem('saasDB_users')) {
      localStorage.setItem('saasDB_users', JSON.stringify([
        { id: 1, username: 'testuser', email: 'testuser@example.com', password: 'Test1234!', subscription: 'Core', schoolType: 'Gymnasium', schoolClass: '10A', birthdate: '2008-05-15' }
      ]));
    }
    if (!localStorage.getItem('saasDB_tasks')) {
      localStorage.setItem('saasDB_tasks', JSON.stringify([]));
    }
    if (!localStorage.getItem('saasDB_grades')) {
      localStorage.setItem('saasDB_grades', JSON.stringify([]));
    }
  },
  getUsers() {
    return JSON.parse(localStorage.getItem('saasDB_users') || '[]');
  },
  userExists(username, email) {
    const users = this.getUsers();
    return users.some(u => u.username === username || u.email === email);
  },
  createUser(username, email, password, schoolType, schoolClass, birthdate) {
    const users = this.getUsers();
    const id = (Math.max(...users.map(u => u.id || 0), 0) + 1);
    const newUser = { id, username, email, password, subscription: 'Free', schoolType, schoolClass, birthdate };
    users.push(newUser);
    localStorage.setItem('saasDB_users', JSON.stringify(users));
    return newUser;
  },
  findUser(username, password) {
    const users = this.getUsers();
    return users.find(u => u.username === username && u.password === password);
  },
  updateUser(userId, updates) {
    const users = this.getUsers();
    const user = users.find(u => u.id === userId);
    if (user) {
      Object.assign(user, updates);
      localStorage.setItem('saasDB_users', JSON.stringify(users));
    }
    return user;
  },
  getTasks(userId) {
    const tasks = JSON.parse(localStorage.getItem('saasDB_tasks') || '[]');
    return tasks.filter(t => t.user_id === userId || !userId);
  },
  createTask(userId, title, description, dueDate, priority) {
    const tasks = this.getTasks();
    const id = (Math.max(...tasks.map(t => t.id || 0), 0) + 1);
    tasks.push({ id, user_id: userId, title, description, due_date: dueDate, priority, completed: 0 });
    localStorage.setItem('saasDB_tasks', JSON.stringify(tasks));
  },
  getGrades(userId) {
    const grades = JSON.parse(localStorage.getItem('saasDB_grades') || '[]');
    return grades.filter(g => g.user_id === userId || !userId);
  },
  createGrade(userId, subject, grade, date) {
    const grades = this.getGrades();
    const id = (Math.max(...grades.map(g => g.id || 0), 0) + 1);
    grades.push({ id, user_id: userId, subject, grade, date });
    localStorage.setItem('saasDB_grades', JSON.stringify(grades));
  },
  // Goals
  getGoals(userId) {
    const goals = JSON.parse(localStorage.getItem('saasDB_goals') || '[]');
    return goals.filter(g => g.user_id === userId || !userId);
  },
  createGoal(userId, title, target, frequency, dueDate) {
    if (!localStorage.getItem('saasDB_goals')) {
      localStorage.setItem('saasDB_goals', JSON.stringify([]));
    }
    const goals = JSON.parse(localStorage.getItem('saasDB_goals') || '[]');
    const id = (Math.max(...goals.map(g => g.id || 0), 0) + 1);
    goals.push({ id, user_id: userId, title, target, frequency, dueDate, progress: 0, completed: 0 });
    localStorage.setItem('saasDB_goals', JSON.stringify(goals));
  },
  updateGoal(goalId, updates) {
    const goals = JSON.parse(localStorage.getItem('saasDB_goals') || '[]');
    const goal = goals.find(g => g.id === goalId);
    if (goal) {
      Object.assign(goal, updates);
      localStorage.setItem('saasDB_goals', JSON.stringify(goals));
    }
    return goal;
  },
  deleteGoal(goalId) {
    let goals = JSON.parse(localStorage.getItem('saasDB_goals') || '[]');
    goals = goals.filter(g => g.id !== goalId);
    localStorage.setItem('saasDB_goals', JSON.stringify(goals));
  },
  // Badges
  getBadges(userId) {
    const badges = JSON.parse(localStorage.getItem('saasDB_badges') || '[]');
    return badges.filter(b => b.user_id === userId || !userId);
  },
  createBadge(userId, name, icon, description, unlockedDate) {
    if (!localStorage.getItem('saasDB_badges')) {
      localStorage.setItem('saasDB_badges', JSON.stringify([]));
    }
    const badges = JSON.parse(localStorage.getItem('saasDB_badges') || '[]');
    if (!badges.some(b => b.user_id === userId && b.name === name)) {
      badges.push({ user_id: userId, name, icon, description, unlockedDate });
      localStorage.setItem('saasDB_badges', JSON.stringify(badges));
    }
  },
  // Streaks
  getStreak(userId) {
    const streaks = JSON.parse(localStorage.getItem('saasDB_streaks') || '{}');
    return streaks[userId] || { count: 0, lastDate: null };
  },
  updateStreak(userId, count, lastDate) {
    const streaks = JSON.parse(localStorage.getItem('saasDB_streaks') || '{}');
    streaks[userId] = { count, lastDate };
    localStorage.setItem('saasDB_streaks', JSON.stringify(streaks));
  },
  // Reminders (basierend auf Tasks)
  getReminders(userId) {
    const tasks = this.getTasks(userId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return tasks.filter(t => {
      const dueDate = new Date(t.due_date);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate >= today && !t.completed;
    }).sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
  },
  // Offline-Daten speichern
  getOfflineData(userId) {
    return {
      tasks: this.getTasks(userId),
      grades: this.getGrades(userId),
      goals: this.getGoals(userId),
      badges: this.getBadges(userId),
      timestamp: new Date().toISOString()
    };
  }
};
