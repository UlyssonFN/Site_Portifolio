/* ==========================================================================
   Anne OS Kids — notifications.js
   NotificationManager: notificações temporárias no canto da tela
   ========================================================================== */

class NotificationManager {
  constructor() {
    this.area = null;
  }

  init() {
    this.area = document.getElementById('notification-area');
  }

  show(text, icon = '🔔', duration = 3800) {
    if (!this.area) this.init();
    if (!this.area) return;
    try { soundManager.notification(); } catch (e) {}

    const el = document.createElement('div');
    el.className = 'notification';
    el.innerHTML = `<span class="n-icon">${icon}</span><span class="n-text">${text}</span>`;
    this.area.appendChild(el);

    setTimeout(() => {
      el.classList.add('leaving');
      setTimeout(() => el.remove(), 350);
    }, duration);
  }

  achievement(name) { this.show(`Conquista desbloqueada: <b>${name}</b>!`, '🏆', 4500); }
  stars(amount) { this.show(`Você ganhou <b>+${amount} ⭐</b>!`, '⭐', 2800); }
  record() { this.show('Novo recorde! 🎉', '🥇', 3200); }
}

const notificationManager = new NotificationManager();
