/* ==========================================================================
   Anne OS Kids — os.js
   Núcleo do sistema: boot, login/perfis, desktop, bloqueio, desligar/reiniciar
   ========================================================================== */

class AnneOS {
  constructor() {
    this.selectedAvatar = AVATAR_CHOICES ? AVATAR_CHOICES[0] : '🧒';
    this.selectedColor = COLOR_CHOICES ? COLOR_CHOICES[0] : '#8c6fff';
  }

  showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
  }

  async init() {
    this.showScreen('boot-screen');
    await this._runBootSequence();
    await db.init();
    await this._ensureSeedData();
    notificationManager.init();
    this._bindLoginEvents();
    this._bindPowerAndLockEvents();
    await this.showLogin();
  }

  _runBootSequence() {
    return new Promise((resolve) => {
      const fill = document.getElementById('boot-bar-fill');
      const status = document.getElementById('boot-status');
      const steps = [
        [10, 'Inicializando...'],
        [35, 'Carregando módulos do sistema...'],
        [60, 'Preparando área de trabalho...'],
        [85, 'Ajustando as cores do arco-íris...'],
        [100, 'Tudo pronto!']
      ];
      try { soundManager.boot(); } catch (e) {}
      let i = 0;
      const tick = () => {
        if (i >= steps.length) { setTimeout(resolve, 350); return; }
        const [pct, text] = steps[i++];
        fill.style.width = pct + '%';
        status.textContent = text;
        setTimeout(tick, 420);
      };
      tick();
    });
  }

  async _ensureSeedData() {
    const users = await userManager.listUsers();
    if (!users.length) {
      await userManager.createUser({ nome: 'Criança', avatar: '🧒', cor: COLOR_CHOICES[0] });
    }
  }

  /* ---------------- LOGIN / PERFIS ---------------- */

  async showLogin() {
    await this._renderProfiles();
    this.showScreen('login-screen');
  }

  async _renderProfiles() {
    const list = document.getElementById('profile-list');
    const users = await userManager.listUsers();
    list.innerHTML = '';
    users.forEach(u => {
      const card = document.createElement('div');
      card.className = 'profile-card';
      card.style.borderColor = u.cor;
      card.innerHTML = `
        <button class="delete-profile" title="Excluir perfil">✕</button>
        <span class="avatar">${u.avatar}</span>
        <div class="pname">${u.nome}</div>
        <div class="pstars">⭐ ${u.estrelas || 0}</div>
      `;
      card.addEventListener('click', (e) => {
        if (e.target.closest('.delete-profile')) return;
        soundManager.click();
        this.loginAs(u.id);
      });
      card.querySelector('.delete-profile').addEventListener('click', async (e) => {
        e.stopPropagation();
        if (!confirm(`Excluir o perfil de ${u.nome}? Isso apaga desenhos, notas e pontuações.`)) return;
        await userManager.deleteUser(u.id);
        await this._renderProfiles();
      });
      list.appendChild(card);
    });
  }

  async loginAs(userId) {
    const user = await userManager.setCurrentUser(userId);
    if (!user) return;
    await settingsManager.load(userId);
    await achievementManager.loadUnlocked();
    desktopManager.init();
    desktopManager.updateProfileHeader(user);
    this.showScreen('desktop-screen');
    setTimeout(() => notificationManager.show(`Bem-vindo(a) de volta, ${user.nome}! 🎉`, user.avatar, 3500), 400);
    await achievementManager.checkAndUnlock();
  }

  _bindLoginEvents() {
    document.getElementById('btn-new-profile').addEventListener('click', () => {
      soundManager.click();
      this._openNewProfileForm();
    });
  }

  _openNewProfileForm() {
    document.getElementById('np-name').value = '';
    const avatarPicker = document.getElementById('np-avatar-picker');
    const colorPicker = document.getElementById('np-color-picker');
    avatarPicker.innerHTML = '';
    colorPicker.innerHTML = '';
    this.selectedAvatar = AVATAR_CHOICES[0];
    this.selectedColor = COLOR_CHOICES[0];

    AVATAR_CHOICES.forEach((a, i) => {
      const span = document.createElement('span');
      span.className = 'avatar-choice' + (i === 0 ? ' selected' : '');
      span.textContent = a;
      span.addEventListener('click', () => {
        soundManager.click();
        this.selectedAvatar = a;
        avatarPicker.querySelectorAll('.avatar-choice').forEach(x => x.classList.remove('selected'));
        span.classList.add('selected');
      });
      avatarPicker.appendChild(span);
    });

    COLOR_CHOICES.forEach((c, i) => {
      const span = document.createElement('span');
      span.className = 'color-choice' + (i === 0 ? ' selected' : '');
      span.style.background = c;
      span.addEventListener('click', () => {
        soundManager.click();
        this.selectedColor = c;
        colorPicker.querySelectorAll('.color-choice').forEach(x => x.classList.remove('selected'));
        span.classList.add('selected');
      });
      colorPicker.appendChild(span);
    });

    this.showScreen('new-profile-screen');

    const cancelBtn = document.getElementById('np-cancel');
    const saveBtn = document.getElementById('np-save');
    const newCancel = cancelBtn.cloneNode(true);
    const newSave = saveBtn.cloneNode(true);
    cancelBtn.replaceWith(newCancel);
    saveBtn.replaceWith(newSave);

    newCancel.addEventListener('click', () => { soundManager.click(); this.showLogin(); });
    newSave.addEventListener('click', async () => {
      const name = document.getElementById('np-name').value.trim();
      if (!name) { notificationManager.show('Digite um nome para o perfil!', '⚠️', 2500); return; }
      soundManager.success();
      const user = await userManager.createUser({ nome: name, avatar: this.selectedAvatar, cor: this.selectedColor });
      await this.loginAs(user.id);
    });
  }

  /* ---------------- BLOQUEIO / DESLIGAR / REINICIAR ---------------- */

  _bindPowerAndLockEvents() {
    document.getElementById('lock-screen').addEventListener('click', () => {
      soundManager.click();
      this.showLogin();
    });
  }

  lockScreen() {
    windowManager.closeAll();
    desktopManager.closeStartMenu();
    this.showScreen('lock-screen');
  }

  async restart() {
    windowManager.closeAll();
    this.showScreen('power-screen');
    document.getElementById('power-icon').textContent = '🔄';
    document.getElementById('power-text').textContent = 'Reiniciando...';
    await new Promise(r => setTimeout(r, 1400));
    this.showScreen('boot-screen');
    document.getElementById('boot-bar-fill').style.width = '0%';
    await this._runBootSequence();
    await this.showLogin();
  }

  async shutdown() {
    windowManager.closeAll();
    this.showScreen('power-screen');
    document.getElementById('power-icon').textContent = '🌙';
    document.getElementById('power-text').textContent = 'Desligando...';
    await new Promise(r => setTimeout(r, 1400));
    document.getElementById('power-text').innerHTML = 'Até logo! 💤<br><br><button class="btn-primary" id="power-on-btn">🔆 Ligar novamente</button>';
    document.getElementById('power-on-btn').addEventListener('click', () => {
      soundManager.click();
      this.showScreen('boot-screen');
      document.getElementById('boot-bar-fill').style.width = '0%';
      this._runBootSequence().then(() => this.showLogin());
    });
  }
}

const anneOS = new AnneOS();

document.addEventListener('DOMContentLoaded', () => {
  try {
    anneOS.init();
  } catch (err) {
    console.error('Erro ao iniciar o Anne OS Kids:', err);
    const status = document.getElementById('boot-status');
    if (status) status.textContent = 'Ops! Algo deu errado. Recarregue a página. 🙏';
  }
});

window.addEventListener('error', (e) => {
  console.error('Anne OS Kids — erro:', e.error || e.message);
});
