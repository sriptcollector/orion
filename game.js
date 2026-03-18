/* ═══════════════════════════════════════════════════════════════════════════════════
   VITAL HERO — game.js
   Core game logic: state, onboarding, tabs, shop, character, food logging
   ═══════════════════════════════════════════════════════════════════════════════════ */

'use strict';

// ─── Constants ───────────────────────────────────────────────────────────────────

const SAVE_KEY       = 'heroeVital_v1';
const DECAY_INTERVAL = 60 * 1000;

if (!window.t) window.t = (k) => k;

const CLASE_BONUS = {
  guerrero: { ataque:5, defensa:5, agilidad:1, fuerza:4, hp:0  },
  mago:     { ataque:3, defensa:1, agilidad:2, fuerza:2, hp:0  },
  arquero:  { ataque:4, defensa:2, agilidad:5, fuerza:2, hp:0  },
  sanador:  { ataque:1, defensa:3, agilidad:3, fuerza:1, hp:20 },
};

const CLASS_SPRITE = {
  guerrero: '⚔️', mago: '🔮', arquero: '🏹', sanador: '💚'
};

const CLASS_NAME_EN = {
  guerrero: 'Warrior', mago: 'Mage', arquero: 'Archer', sanador: 'Healer'
};

const CATALOGO = [
  { id:'corona_bronce',   nombre:'Bronze Crown',      desc:'Show your rank to all.',                precio:40,  tipo:'accesorio',  emoji:'👑',  bonusAtaque:0, bonusDefensa:1, bonusHP:0,  bonusAgi:0, bonusFuerza:0 },
  { id:'capa_roja',       nombre:'Scarlet Cape',       desc:'An elegant cape that intimidates.',      precio:60,  tipo:'accesorio',  emoji:'🧣',  bonusAtaque:2, bonusDefensa:0, bonusHP:0,  bonusAgi:0, bonusFuerza:0 },
  { id:'anillo_poder',    nombre:'Ring of Power',      desc:'Increases your magical force.',          precio:80,  tipo:'accesorio',  emoji:'💍',  bonusAtaque:0, bonusDefensa:0, bonusHP:0,  bonusAgi:0, bonusFuerza:3 },
  { id:'amuleto_vida',    nombre:'Life Amulet',        desc:'Grants additional health points.',       precio:100, tipo:'accesorio',  emoji:'📿',  bonusAtaque:0, bonusDefensa:0, bonusHP:20, bonusAgi:0, bonusFuerza:0 },
  { id:'guantes_batalla', nombre:'Battle Gauntlets',   desc:'Increase your close combat hit.',        precio:90,  tipo:'accesorio',  emoji:'🥊',  bonusAtaque:3, bonusDefensa:0, bonusHP:0,  bonusAgi:0, bonusFuerza:0 },
  { id:'espada_hierro',   nombre:'Iron Sword',         desc:'Reliable for every battle.',             precio:120, tipo:'arma',       emoji:'⚔️',  bonusAtaque:5, bonusDefensa:0, bonusHP:0,  bonusAgi:0, bonusFuerza:0 },
  { id:'baston_magico',   nombre:'Magic Staff',        desc:'Channels arcane power.',                 precio:130, tipo:'arma',       emoji:'🪄',  bonusAtaque:3, bonusDefensa:0, bonusHP:0,  bonusAgi:0, bonusFuerza:4 },
  { id:'arco_elfico',     nombre:'Elven Bow',          desc:'Ranged attack with precision.',          precio:140, tipo:'arma',       emoji:'🏹',  bonusAtaque:4, bonusDefensa:0, bonusHP:0,  bonusAgi:3, bonusFuerza:0 },
  { id:'escudo_madera',   nombre:'Wooden Shield',      desc:'Basic but reliable protection.',         precio:80,  tipo:'armadura',   emoji:'🛡️',  bonusAtaque:0, bonusDefensa:4, bonusHP:0,  bonusAgi:0, bonusFuerza:0 },
  { id:'cota_malla',      nombre:'Chain Mail',         desc:'Lightweight chain link armor.',          precio:150, tipo:'armadura',   emoji:'🪖',  bonusAtaque:0, bonusDefensa:6, bonusHP:10, bonusAgi:0, bonusFuerza:0 },
  { id:'armadura_plata',  nombre:'Silver Armor',       desc:'High-level silver protection.',          precio:250, tipo:'armadura',   emoji:'⚜️',  bonusAtaque:0, bonusDefensa:10,bonusHP:20, bonusAgi:0, bonusFuerza:0 },
  { id:'silla_comoda',    nombre:'Comfy Chair',        desc:'For resting between battles.',           precio:30,  tipo:'mueble',     emoji:'🪑',  bonusAtaque:0, bonusDefensa:0, bonusHP:0,  bonusAgi:0, bonusFuerza:0 },
  { id:'mesa_festin',     nombre:'Feast Table',        desc:'A grand table for epic banquets.',       precio:70,  tipo:'mueble',     emoji:'🍽️',  bonusAtaque:0, bonusDefensa:0, bonusHP:0,  bonusAgi:0, bonusFuerza:0 },
  { id:'cama_real',       nombre:'Royal Bed',          desc:'Royal rest for a royal hero.',           precio:120, tipo:'mueble',     emoji:'🛏️',  bonusAtaque:0, bonusDefensa:0, bonusHP:5,  bonusAgi:0, bonusFuerza:0 },
  { id:'estante_trofeos', nombre:'Trophy Stand',       desc:'Display your victories with pride.',     precio:90,  tipo:'mueble',     emoji:'🏆',  bonusAtaque:0, bonusDefensa:0, bonusHP:0,  bonusAgi:0, bonusFuerza:0 },
  { id:'planta_magica',   nombre:'Magic Plant',        desc:'Glows with vital energy.',               precio:35,  tipo:'decoracion', emoji:'🌿',  bonusAtaque:0, bonusDefensa:0, bonusHP:0,  bonusAgi:0, bonusFuerza:0 },
  { id:'cuadro_batalla',  nombre:'Battle Painting',    desc:'An epic painting of your victory.',      precio:55,  tipo:'decoracion', emoji:'🖼️',  bonusAtaque:0, bonusDefensa:0, bonusHP:0,  bonusAgi:0, bonusFuerza:0 },
  { id:'alfombra_dragon', nombre:'Dragon Rug',         desc:'A dragon woven with ancient magic.',     precio:75,  tipo:'decoracion', emoji:'🐉',  bonusAtaque:0, bonusDefensa:0, bonusHP:0,  bonusAgi:0, bonusFuerza:0 },
  { id:'ventana_magica',  nombre:'Magic Window',       desc:'Views to distant and glorious worlds.',  precio:110, tipo:'decoracion', emoji:'🌌',  bonusAtaque:0, bonusDefensa:0, bonusHP:0,  bonusAgi:0, bonusFuerza:0 },
];

const CPU_OPPONENTS = [
  { id:'cpu1', nombre:'Rookie Trainer',   clase:'guerrero', nivel:1, ataque:8,  defensa:6,  agilidad:6,  fuerza:7,  hpMax:80,  monedas:20,  racha:0, power:'★☆☆☆☆' },
  { id:'cpu2', nombre:'Forest Guardian', clase:'arquero',  nivel:2, ataque:12, defensa:9,  agilidad:14, fuerza:8,  hpMax:90,  monedas:40,  racha:2, power:'★★☆☆☆' },
  { id:'cpu3', nombre:'Void Mage',       clase:'mago',     nivel:3, ataque:18, defensa:8,  agilidad:12, fuerza:10, hpMax:100, monedas:75,  racha:4, power:'★★★☆☆' },
  { id:'cpu4', nombre:'Iron Knight',     clase:'guerrero', nivel:5, ataque:22, defensa:20, agilidad:10, fuerza:18, hpMax:150, monedas:130, racha:8, power:'★★★★☆' },
  { id:'cpu5', nombre:'Celestial Mage',  clase:'sanador',  nivel:7, ataque:15, defensa:25, agilidad:18, fuerza:12, hpMax:200, monedas:250, racha:15,power:'★★★★★' },
];

// ─── State ───────────────────────────────────────────────────────────────────────

let G = null;

function defaultState() {
  return {
    profile:       null,
    char: {
      nivel:      1,
      exp:        0,
      expNext:    100,
      hp:         100,
      hpMax:      100,
      ataque:     10,
      defensa:    10,
      agilidad:   10,
      fuerza:     10,
      hambre:     90,
      sed:        90,
      monedas:    75,
      racha:      0,
      mejorRacha: 0,
      accesorios: [],
      casaItems:  [],
      ganadasTotal: 0,
      perdidasTotal:0,
      ultimoSave:   Date.now(),
      ultimoDiaMeta: null,
    },
    registros:     [],
    amigos:        [],
    batallas:      [],
    comprados:     [],
    onboarding:    false,
  };
}

// ─── Persistence ─────────────────────────────────────────────────────────────────

function saveGame() {
  if (!G) return;
  G.char.ultimoSave = Date.now();
  const key = window.getUserSaveKey ? window.getUserSaveKey() : SAVE_KEY;
  try { localStorage.setItem(key, JSON.stringify(G)); } catch(e) {}
}

function loadGame() {
  const key = window.getUserSaveKey ? window.getUserSaveKey() : SAVE_KEY;
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch(e) {}
  return null;
}

// ─── Hunger / Thirst Decay ────────────────────────────────────────────────────────

function applyDecay() {
  if (!G || !G.char) return;
  const now  = Date.now();
  const secs = (now - G.char.ultimoSave) / 1000;
  if (secs < 30) return;

  G.char.hambre = Math.max(0, G.char.hambre - (secs / 10800) * 10);
  G.char.sed    = Math.max(0, G.char.sed    - (secs / 7200)  * 10);

  if (G.char.hambre === 0 && G.char.sed === 0) {
    G.char.hp = Math.max(1, G.char.hp - Math.floor(secs / 3600));
  }

  G.char.ultimoSave = now;
}

// ─── Avatar Pixelation ────────────────────────────────────────────────────────────

let ob = {
  nombre: '', heroeNombre: '',
  peso: 0, altura: 0, edad: 0, sexo: 'M',
  objetivo: '', actividad: '', clase: '',
  avatarData: null,
};

window.triggerAvatarCamera = function() {
  document.getElementById('avatar-input').click();
};

window.handleAvatarPhoto = function(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    pixelateImage(ev.target.result, 24, pixelData => {
      ob.avatarData = pixelData;
      // Show preview in onboarding
      const canvas = document.getElementById('avatar-canvas');
      const img    = new Image();
      img.onload = () => {
        canvas.width  = 72;
        canvas.height = 72;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, 0, 0, 72, 72);
        canvas.classList.remove('hidden');
        document.getElementById('avatar-placeholder').style.display = 'none';
      };
      img.src = pixelData;
    });
  };
  reader.readAsDataURL(file);
};

function pixelateImage(src, pixelSize, callback) {
  const img = new Image();
  img.onload = () => {
    // Step 1: shrink to pixelSize × pixelSize
    const small = document.createElement('canvas');
    small.width  = pixelSize;
    small.height = pixelSize;
    const c1 = small.getContext('2d');
    c1.imageSmoothingEnabled = false;
    c1.drawImage(img, 0, 0, pixelSize, pixelSize);

    // Step 2: scale back up to 96×96
    const large = document.createElement('canvas');
    large.width  = 96;
    large.height = 96;
    const c2 = large.getContext('2d');
    c2.imageSmoothingEnabled = false;
    c2.drawImage(small, 0, 0, 96, 96);

    callback(large.toDataURL());
  };
  img.onerror = () => callback(null);
  img.src = src;
}

// ─── Onboarding ──────────────────────────────────────────────────────────────────

function selectGoal(el) {
  document.querySelectorAll('.goal-card').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  ob.objetivo = el.dataset.goal;
}

function selectActivity(el) {
  document.querySelectorAll('.act-card').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  ob.actividad = el.dataset.act;
}

function selectClass(el) {
  document.querySelectorAll('.class-card').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  ob.clase = el.dataset.class;
}

function obNext(step) {
  if (step === 1) {
    ob.nombre      = document.getElementById('ob-nombre').value.trim();
    ob.heroeNombre = document.getElementById('ob-heroe-nombre').value.trim();
    if (!ob.nombre || !ob.heroeNombre) { showToast('Enter your name and hero name!'); return; }
  }
  if (step === 2) {
    ob.peso   = parseFloat(document.getElementById('ob-peso').value)   || 0;
    ob.altura = parseFloat(document.getElementById('ob-altura').value) || 0;
    ob.edad   = parseInt(document.getElementById('ob-edad').value)     || 0;
    ob.sexo   = document.getElementById('ob-sexo').value;
    if (ob.peso < 30 || ob.altura < 100 || ob.edad < 10) { showToast('Fill in all physical data!'); return; }
  }
  if (step === 3 && !ob.objetivo)  { showToast('Choose your goal!');           return; }
  if (step === 4 && !ob.actividad) { showToast('Choose your activity level!'); return; }
  if (step === 5 && !ob.clase)     { showToast('Choose your character class!'); return; }
  if (step === 5) { buildSummary(); }

  document.getElementById('ob-step-' + step).classList.remove('active');
  document.getElementById('ob-step-' + (step + 1)).classList.add('active');
}

function obBack(step) {
  document.getElementById('ob-step-' + step).classList.remove('active');
  document.getElementById('ob-step-' + (step - 1)).classList.add('active');
}

function buildSummary() {
  const metas = calcMetas(ob);
  const bonus = CLASE_BONUS[ob.clase] || {};
  const goalMap = { perderPeso:'Lose Weight', definirse:'Get Lean', mantenerse:'Maintain', ganarMasa:'Bulk Up', ganarFuerza:'Gain Strength' };
  const actMap  = { sedentario:'Sedentary', ligeramenteActivo:'Lightly Active', moderadamenteActivo:'Moderately Active', muyActivo:'Very Active', atletico:'Athlete' };
  document.getElementById('ob-summary').innerHTML = `
    <div>👤 <strong>Player:</strong> ${ob.nombre}</div>
    <div>${CLASS_SPRITE[ob.clase]} <strong>Hero:</strong> ${ob.heroeNombre} (${(CLASS_NAME_EN[ob.clase]||ob.clase).toUpperCase()})</div>
    <div>⚖️ <strong>Weight:</strong> ${ob.peso} kg | Height: ${ob.altura} cm | Age: ${ob.edad}</div>
    <div>🎯 <strong>Goal:</strong> ${goalMap[ob.objetivo]||ob.objetivo}</div>
    <div>🏃 <strong>Activity:</strong> ${actMap[ob.actividad]||ob.actividad}</div>
    <hr style="border-color:#343470;margin:10px 0">
    <div>🔥 <strong>Calorie goal:</strong> ${metas.calorias} kcal/day</div>
    <div>🥩 <strong>Protein goal:</strong> ${metas.proteina}g/day</div>
    <div>💧 <strong>Water goal:</strong> ${metas.aguaMl} ml/day</div>
    <hr style="border-color:#343470;margin:10px 0">
    <div>⚔️ <strong>Starting stats:</strong> ATK ${10+(bonus.ataque||0)} | DEF ${10+(bonus.defensa||0)} | AGI ${10+(bonus.agilidad||0)} | STR ${10+(bonus.fuerza||0)} | HP ${100+(bonus.hp||0)}</div>
  `;
}

function startGame() {
  const metas = calcMetas(ob);
  const bonus = CLASE_BONUS[ob.clase] || {};

  G = defaultState();
  G.profile = {
    nombre:     ob.nombre,
    heroeNombre:ob.heroeNombre,
    clase:      ob.clase,
    peso:       ob.peso,
    altura:     ob.altura,
    edad:       ob.edad,
    sexo:       ob.sexo,
    objetivo:   ob.objetivo,
    actividad:  ob.actividad,
    calorias:   metas.calorias,
    proteina:   metas.proteina,
    aguaMl:     metas.aguaMl,
    avatarData: ob.avatarData || null,
  };
  G.char.ataque   += (bonus.ataque   || 0);
  G.char.defensa  += (bonus.defensa  || 0);
  G.char.agilidad += (bonus.agilidad || 0);
  G.char.fuerza   += (bonus.fuerza   || 0);
  G.char.hpMax    += (bonus.hp       || 0);
  G.char.hp        = G.char.hpMax;
  G.onboarding     = true;
  saveGame();
  initMainGame();
}

// ─── Meta Calculations ───────────────────────────────────────────────────────────

function calcMetas(p) {
  const tmb = p.sexo === 'M'
    ? 10 * p.peso + 6.25 * p.altura - 5 * p.edad + 5
    : 10 * p.peso + 6.25 * p.altura - 5 * p.edad - 161;

  const mult    = { sedentario:1.2, ligeramenteActivo:1.375, moderadamenteActivo:1.55, muyActivo:1.725, atletico:1.9 };
  const tdee    = tmb * (mult[p.actividad] || 1.55);
  const calDelta= { perderPeso:-500, definirse:-200, mantenerse:0, ganarMasa:350, ganarFuerza:200 };
  const protMult= { perderPeso:1.6, definirse:1.8, mantenerse:1.4, ganarMasa:2.0, ganarFuerza:2.2 };

  return {
    calorias: Math.round(tdee + (calDelta[p.objetivo] || 0)),
    proteina: Math.round(p.peso * (protMult[p.objetivo] || 1.6)),
    aguaMl:   Math.round(p.peso * 33),
  };
}

// ─── Main Game Init ───────────────────────────────────────────────────────────────

function initMainGame() {
  document.getElementById('screen-onboarding').classList.remove('active');
  document.getElementById('screen-game').classList.add('active');

  applyDecay();
  renderHUD();
  renderHomeTab();
  renderLogTab();
  renderFriendsTab();
  renderShopTab(null);
  renderLibreTab();

  setInterval(() => {
    applyDecay();
    saveGame();
    renderHUD();
    renderHomeChar();
  }, DECAY_INTERVAL);

  showTab('inicio');

  // Start overworld music
  if (window.Music) setTimeout(() => window.Music.play('overworld'), 500);
}

// ─── Tab Navigation ───────────────────────────────────────────────────────────────

function showTab(name) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));

  const contentEl = document.getElementById('tab-' + name);
  const btnEl     = document.getElementById('tab-btn-' + name);
  if (contentEl) contentEl.classList.add('active');
  if (btnEl)     btnEl.classList.add('active');

  if (name === 'inicio')     renderHomeTab();
  if (name === 'registro')   renderLogTab();
  if (name === 'world')      { renderFriendsTab(); renderLibreTab(); }
  if (name === 'menu-main')  renderShopTab(null);
}

window.showWorldSub = function(sub) {
  document.querySelectorAll('.world-sub').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('#tab-world .subnav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('world-sub-' + sub).classList.add('active');
  document.getElementById('world-btn-' + sub).classList.add('active');
  if (sub === 'friends') renderFriendsTab();
  if (sub === 'battle')  renderLibreTab();
};

window.showMenuSub = function(sub) {
  document.querySelectorAll('.menu-sub').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('#tab-menu-main .subnav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('menu-sub-' + sub).classList.add('active');
  document.getElementById('menu-btn-' + sub).classList.add('active');
  if (sub === 'shop')    renderShopTab(null);
  if (sub === 'profile') renderProfileTab();
};

// ─── HUD ─────────────────────────────────────────────────────────────────────────

function renderHUD() {
  if (!G || !G.profile) return;
  const c = G.char;

  document.getElementById('hud-player-name').textContent = G.profile.heroeNombre.toUpperCase();
  document.getElementById('hud-level').textContent       = c.nivel;
  document.getElementById('hud-coins').textContent       = c.monedas;
  document.getElementById('hud-streak').textContent      = c.racha;

  // Avatar in HUD
  const hudAvatar = document.getElementById('hud-avatar');
  if (G.profile.avatarData) {
    hudAvatar.innerHTML = `<img src="${G.profile.avatarData}" alt="avatar">`;
  } else {
    hudAvatar.innerHTML = `<span class="hud-avatar-emoji">${CLASS_SPRITE[G.profile.clase]}</span>`;
  }

  // HP bar
  const hpPct = c.hp / c.hpMax;
  const hpBar = document.getElementById('bar-hp');
  hpBar.style.width      = (hpPct * 100) + '%';
  hpBar.style.background = hpPct > 0.5 ? 'var(--hp-green)' : hpPct > 0.25 ? 'var(--hp-yellow)' : 'var(--hp-red)';
  document.getElementById('val-hp').textContent = c.hp + '/' + c.hpMax;

  // Hunger
  const hPct     = c.hambre;
  const hungerBar = document.getElementById('bar-hunger');
  hungerBar.style.width      = hPct + '%';
  hungerBar.style.background = hPct > 50 ? 'var(--hunger-full)' : hPct > 25 ? 'var(--hp-yellow)' : 'var(--hp-red)';
  document.getElementById('val-hunger').textContent = Math.round(hPct) + '%';

  // Thirst
  const sPct     = c.sed;
  const thirstBar = document.getElementById('bar-thirst');
  thirstBar.style.width      = sPct + '%';
  thirstBar.style.background = sPct > 50 ? 'var(--thirst-full)' : sPct > 25 ? 'var(--hp-yellow)' : 'var(--hp-red)';
  document.getElementById('val-thirst').textContent = Math.round(sPct) + '%';

  // XP
  const xpPct = c.exp / c.expNext;
  document.getElementById('bar-xp').style.width = (xpPct * 100) + '%';
  document.getElementById('val-xp').textContent = c.exp + '/' + c.expNext;

  // Daily progress
  const today = todayRegistros();
  const cal   = today.reduce((s,r) => s + r.calorias, 0);
  const agua  = today.reduce((s,r) => s + (r.agua||0), 0);
  document.getElementById('hud-meta-cal').textContent  = `🍽️ ${cal}/${G.profile.calorias} cal`;
  document.getElementById('hud-meta-agua').textContent = `💧 ${agua}/${G.profile.aguaMl} ml`;

  // Alerts
  const alerts = document.getElementById('hud-alerts');
  alerts.innerHTML = '';
  if (c.hambre < 30) alerts.innerHTML += `<span class="hud-alert hunger">HUNGRY!</span>`;
  if (c.sed    < 30) alerts.innerHTML += `<span class="hud-alert thirst">THIRSTY!</span>`;
  if (c.hp < c.hpMax * 0.25) alerts.innerHTML += `<span class="hud-alert weak">WEAKENED!</span>`;
}

// ─── HOME TAB ─────────────────────────────────────────────────────────────────────

function renderHomeTab() {
  if (!G || !G.profile) return;
  renderHomeChar();
  renderHouseItems();
  renderStatGrid();
  renderDailyGoals();
  renderBattleHistoryMini();
}

function renderHomeChar() {
  if (!G || !G.profile) return;
  const c  = G.char;
  const el = document.getElementById('char-in-house');

  let mood = '😊';
  if (c.hambre < 20 && c.sed < 20) mood = '😵';
  else if (c.hambre < 30)          mood = '😩';
  else if (c.sed < 30)             mood = '😰';
  else if (c.hp < c.hpMax * 0.25) mood = '😤';
  else if (c.hambre > 70 && c.sed > 70 && c.hp > c.hpMax * 0.7) mood = '😄';

  if (G.profile.avatarData) {
    el.innerHTML = `
      <div style="position:relative;display:inline-block">
        <img src="${G.profile.avatarData}" style="width:56px;height:56px;image-rendering:pixelated;image-rendering:crisp-edges;display:block;">
        <div style="font-size:16px;position:absolute;bottom:-8px;right:-6px">${mood}</div>
      </div>`;
  } else {
    el.innerHTML = `<div style="font-size:52px;line-height:1">${CLASS_SPRITE[G.profile.clase]}</div><div style="font-size:18px;margin-top:-6px">${mood}</div>`;
  }

  const speech = document.getElementById('house-speech');
  let msg = '';
  if (c.hambre < 25)             msg = "I'm so hungry! 🍗";
  else if (c.sed < 25)           msg = 'I need water! 💧';
  else if (c.hp < c.hpMax * 0.3) msg = "I feel weakened...";
  else if (c.nivel >= 5)         msg = 'I am very powerful! ⚡';
  else                           msg = 'Take good care of me!';

  speech.textContent = msg;
  speech.classList.add('visible');
  setTimeout(() => speech.classList.remove('visible'), 4000);
}

function renderHouseItems() {
  const container = document.getElementById('house-items');
  container.innerHTML = '';
  G.char.casaItems.forEach(itemId => {
    const item = CATALOGO.find(i => i.id === itemId);
    if (item) {
      const d = document.createElement('div');
      d.className = 'house-item';
      d.textContent = item.emoji;
      d.title = item.nombre;
      container.appendChild(d);
    }
  });
}

function renderStatGrid() {
  const c  = G.char;
  const el = document.getElementById('stat-grid');
  const stats = [
    { label:'⚔️ ATTACK',   value: c.ataque,   bar: c.ataque  / 50, color:'var(--red)'      },
    { label:'🛡️ DEFENSE',  value: c.defensa,  bar: c.defensa / 50, color:'var(--blue)'     },
    { label:'⚡ AGILITY',  value: c.agilidad, bar: c.agilidad/ 50, color:'var(--green)'    },
    { label:'💪 STRENGTH', value: c.fuerza,   bar: c.fuerza  / 50, color:'var(--gold)'     },
    { label:'❤️ HP',        value: c.hp+'/'+c.hpMax, bar: c.hp/c.hpMax, color:'var(--hp-green)'   },
    { label:'⚡ POWER',    value: c.ataque+c.defensa+c.agilidad+c.fuerza, bar:(c.ataque+c.defensa+c.agilidad+c.fuerza)/200, color:'var(--purple)' },
  ];
  el.innerHTML = stats.map(s => `
    <div class="stat-item">
      <div class="stat-item-label">${s.label}</div>
      <div class="stat-item-value">${s.value}</div>
      <div class="stat-item-bar">
        <div class="bar-track">
          <div class="bar-fill" style="width:${Math.min(100,s.bar*100)}%;background:${s.color}"></div>
        </div>
      </div>
    </div>`).join('');
}

function renderDailyGoals() {
  if (!G.profile) return;
  const today  = todayRegistros();
  const cal    = today.reduce((s,r) => s + r.calorias, 0);
  const prot   = today.reduce((s,r) => s + (r.proteinas||0), 0);
  const agua   = today.reduce((s,r) => s + (r.agua||0), 0);
  const calPct = Math.min(1, cal  / G.profile.calorias);
  const proPct = Math.min(1, prot / G.profile.proteina);
  const aguPct = Math.min(1, agua / G.profile.aguaMl);

  document.getElementById('daily-goals').innerHTML = `
    ${goalRow('🍽️ Calories', calPct, `${cal}/${G.profile.calorias} kcal`)}
    ${goalRow('🥩 Protein',  proPct, `${Math.round(prot)}/${G.profile.proteina}g`)}
    ${goalRow('💧 Water',    aguPct, `${agua}/${G.profile.aguaMl}ml`)}
  `;
}

function goalRow(label, pct, text) {
  const color = pct >= 1 ? 'var(--green)' : pct >= 0.7 ? 'var(--gold)' : pct >= 0.4 ? 'var(--hunger-full)' : 'var(--red)';
  return `<div class="goal-row">
    <div class="goal-row-label">${label}</div>
    <div class="bar-track"><div class="bar-fill" style="width:${pct*100}%;background:${color}"></div></div>
    <div class="goal-row-pct">${text}</div>
  </div>`;
}

function renderBattleHistoryMini() {
  const el = document.getElementById('battle-history-mini');
  if (!G.batallas.length) { el.textContent = 'No battles yet.'; return; }
  const resultLabel = { victoria:'🏆 VICTORY', derrota:'💀 DEFEAT', empate:'🤝 DRAW' };
  el.innerHTML = G.batallas.slice(0,5).map(b => `
    <div class="battle-history-item">
      <span class="bhi-result ${b.resultado}">${resultLabel[b.resultado]||b.resultado}</span>
      <span>vs ${b.enemigoNombre}</span>
      <span style="margin-left:auto;color:${b.resultado==='victoria'?'var(--gold)':'var(--red)'}">
        ${b.resultado==='victoria'?'+'+b.monedasGanadas:'‑'+b.monedasPerdidas} 🪙
      </span>
    </div>`).join('');
}

// ─── LOG TAB ─────────────────────────────────────────────────────────────────────

let pendingPhotoData = null;

function triggerCamera() { document.getElementById('camera-input').click(); }

function handlePhoto(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    pendingPhotoData = ev.target.result;
    const img = document.getElementById('food-photo');
    img.src = pendingPhotoData;
    img.classList.remove('hidden');
    document.getElementById('photo-preview-inner').classList.add('hidden');
  };
  reader.readAsDataURL(file);
}

function registrarAlimento() {
  const tipo  = document.getElementById('food-type').value;
  const desc  = document.getElementById('food-desc').value.trim();
  const cal   = parseInt(document.getElementById('food-cal').value)    || 0;
  const prot  = parseFloat(document.getElementById('food-prot').value) || 0;
  const carbs = parseFloat(document.getElementById('food-carbs').value)|| 0;
  const agua  = parseInt(document.getElementById('food-agua').value)   || 0;

  if (!desc) { showToast('Describe what you ate or drank!'); return; }

  const calPct = G.profile ? cal / G.profile.calorias : 0.1;
  const hambre = tipo === 'agua' ? 0 : Math.min(40, calPct * 70);
  const sed    = Math.min(35, (agua / 500) * 45) + (tipo === 'bebida' ? 5 : 0) + (tipo === 'agua' ? 40 : 0);
  const hpGain = Math.round(hambre / 6) + Math.round(prot / 8);
  const expGain= Math.round(calPct * 25) + Math.round(prot / 4) + (agua > 200 ? 8 : 0);
  const monedas= (tipo === 'agua' ? 4 : cal > 0 ? 3 : 1) + (prot > 20 ? 4 : 0);

  const reg = {
    id: Date.now(), fecha: Date.now(),
    tipo, desc, calorias: cal, proteinas: prot,
    carbohidratos: carbs, agua, foto: pendingPhotoData,
    hambreImpact: hambre, sedImpact: sed,
    hpGain, expGain, monedas,
  };

  G.registros.unshift(reg);
  G.char.hambre   = Math.min(100, G.char.hambre + hambre);
  G.char.sed      = Math.min(100, G.char.sed    + sed);
  G.char.hp       = Math.min(G.char.hpMax, G.char.hp + hpGain);
  G.char.exp     += expGain;
  G.char.monedas += monedas;

  checkLevelUp();
  checkDailyGoal();
  saveGame();
  renderHUD();
  renderLogTab();
  renderHomeChar();

  // Reset form
  ['food-desc','food-cal','food-prot','food-carbs','food-agua'].forEach(id => {
    document.getElementById(id).value = '';
  });
  pendingPhotoData = null;
  document.getElementById('food-photo').classList.add('hidden');
  document.getElementById('photo-preview-inner').classList.remove('hidden');
  document.getElementById('camera-input').value = '';

  showToast(`+${expGain} EXP | +${monedas} 🪙 | ${hpGain > 0 ? '+' + hpGain + ' HP' : ''}`);
}

function renderLogTab() {
  if (!G || !G.profile) return;
  const today = todayRegistros();
  const cal   = today.reduce((s,r) => s + r.calorias, 0);
  const prot  = today.reduce((s,r) => s + (r.proteinas||0), 0);
  const carbs = today.reduce((s,r) => s + (r.carbohidratos||0), 0);
  const agua  = today.reduce((s,r) => s + (r.agua||0), 0);

  document.getElementById('log-totals').innerHTML = `
    <div class="total-box"><div class="total-box-label">CALORIES</div><div class="total-box-val">${cal}</div><div class="total-box-goal">/${G.profile.calorias}</div></div>
    <div class="total-box"><div class="total-box-label">PROTEIN</div><div class="total-box-val">${Math.round(prot)}g</div><div class="total-box-goal">/${G.profile.proteina}g</div></div>
    <div class="total-box"><div class="total-box-label">CARBS</div><div class="total-box-val">${Math.round(carbs)}g</div></div>
    <div class="total-box"><div class="total-box-label">WATER</div><div class="total-box-val">${agua}ml</div><div class="total-box-goal">/${G.profile.aguaMl}</div></div>
  `;

  const listEl = document.getElementById('log-list');
  if (!today.length) { listEl.innerHTML = '<div class="empty-state">No logs today. Start eating!</div>'; return; }
  listEl.innerHTML = today.map(r => {
    const emoji = { comida:'🍽️', agua:'💧', bebida:'🥤', snack:'🍎', suplemento:'💊' }[r.tipo] || '🍽️';
    return `<div class="log-item">
      ${r.foto
        ? `<img class="log-item-photo" src="${r.foto}" alt="food">`
        : `<div class="log-item-photo-placeholder">${emoji}</div>`
      }
      <div class="log-item-info">
        <div class="log-item-name">${r.desc}</div>
        <div class="log-item-meta">
          ${r.calorias>0?r.calorias+' kcal | ':''}
          ${r.proteinas>0?r.proteinas+'g protein | ':''}
          ${r.agua>0?r.agua+'ml water':''}
        </div>
        <div class="log-item-gains">
          ${r.hpGain>0?`<span class="log-gain-hp">+${r.hpGain} HP</span>`:''}
          <span class="log-gain-xp">+${r.expGain} EXP</span>
          <span class="log-gain-coin">+${r.monedas} 🪙</span>
        </div>
      </div>
    </div>`;
  }).join('');
}

function todayRegistros() {
  const today = new Date(); today.setHours(0,0,0,0);
  return G.registros.filter(r => {
    const d = new Date(r.fecha); d.setHours(0,0,0,0);
    return d.getTime() === today.getTime();
  });
}

// ─── Level Up ─────────────────────────────────────────────────────────────────────

function checkLevelUp() {
  while (G.char.exp >= G.char.expNext) {
    G.char.exp     -= G.char.expNext;
    G.char.expNext  = Math.round(G.char.expNext * 1.5);
    G.char.nivel++;
    G.char.hpMax   += 15;
    G.char.hp       = G.char.hpMax;
    G.char.ataque  += 2;
    G.char.defensa += 2;
    G.char.agilidad+= 1;
    G.char.fuerza  += 2;
    G.char.monedas += 30;
    showModal(`
      <span class="big-emoji">🌟</span>
      <h2>LEVEL UP!</h2>
      <div style="color:var(--gold);font-size:18px;margin:12px 0">LEVEL ${G.char.nivel}</div>
      <div style="line-height:2.5">
        ⚔️ ATK +2 | 🛡️ DEF +2<br>
        ⚡ AGI +1 | 💪 STR +2<br>
        ❤️ HP MAX +15 | 🪙 +30
      </div>
    `);
  }
}

function checkDailyGoal() {
  if (!G.profile) return;
  const today = new Date(); today.setHours(0,0,0,0);
  if (G.char.ultimoDiaMeta) {
    const last = new Date(G.char.ultimoDiaMeta); last.setHours(0,0,0,0);
    if (last.getTime() === today.getTime()) return;
  }
  const todayRegs = todayRegistros();
  const cal  = todayRegs.reduce((s,r) => s + r.calorias, 0);
  const prot = todayRegs.reduce((s,r) => s + (r.proteinas||0), 0);
  const agua = todayRegs.reduce((s,r) => s + (r.agua||0), 0);
  const met  =
    (cal  / G.profile.calorias >= 0.9 ? 1 : 0) +
    (prot / G.profile.proteina >= 0.9 ? 1 : 0) +
    (agua / G.profile.aguaMl   >= 0.9 ? 1 : 0);

  if (met >= 2) {
    const bonus = 10 + met * 5;
    G.char.monedas += bonus;
    G.char.racha++;
    G.char.mejorRacha = Math.max(G.char.mejorRacha, G.char.racha);
    G.char.ultimoDiaMeta = Date.now();
    showToast(`🎉 ${met}/3 goals met! +${bonus} 🪙 | Streak: ${G.char.racha} days`);
  }
}

// ─── FRIENDS TAB ─────────────────────────────────────────────────────────────────

function renderFriendsTab() {
  if (!G) return;
  document.getElementById('friends-count').textContent = G.amigos.length;

  if (window.currentUser) {
    document.getElementById('my-peer-id').textContent = window.currentUser.peerId;
  }

  document.getElementById('my-battle-stats').innerHTML = `
    <div><strong>${G.char.ganadasTotal}</strong> wins</div>
    <div><strong>${G.char.perdidasTotal}</strong> losses</div>
    <div><strong>${G.char.racha}</strong> day streak</div>
    <div><strong>${G.char.monedas}</strong> 🪙 coins</div>
  `;

  const list = document.getElementById('friends-list');
  if (!G.amigos.length) {
    list.innerHTML = `<div class="empty-state">No friends yet.<br>Share your ID to play!</div>`;
    return;
  }
  list.innerHTML = G.amigos.map(f => `
    <div class="friend-card">
      <div class="friend-sprite">${CLASS_SPRITE[f.clase] || '🧙'}</div>
      <div class="friend-info">
        <div class="friend-name">${f.nombre}</div>
        <div class="friend-char">${f.heroeNombre || f.nombre} LV.${f.nivel || 1}</div>
        <div class="friend-stats">⚔️ ${f.ataque||10} | 🛡️ ${f.defensa||10} | 🪙 ${f.monedas||0}</div>
        <div style="font-size:6px;color:var(--gray);margin-top:2px">ID: ${f.peerId||f.id}</div>
      </div>
      <div class="friend-actions">
        <button class="btn-primary btn-sm" onclick="iniciarBatallaContra('${f.id}', false)">⚔️ BATTLE</button>
        <button class="btn-secondary btn-sm" onclick="eliminarAmigo('${f.id}')">✕ REMOVE</button>
      </div>
    </div>`).join('');
}

function agregarAmigo() {
  const username = document.getElementById('add-friend-name').value.trim();
  if (!username) { showToast('Enter the friend\'s username!'); return; }

  const peerId = 'hv_' + username.toLowerCase().replace(/[^a-z0-9_]/g, '');

  if (window.currentUser && peerId === window.currentUser.peerId) {
    showToast("You can't add yourself!");
    return;
  }
  if (G.amigos.find(a => a.peerId === peerId)) {
    showToast('That friend is already on your list!');
    return;
  }

  const newFriend = {
    id: peerId, nombre: username, heroeNombre: username,
    clase: 'guerrero', nivel: 1,
    ataque: 10, defensa: 10, agilidad: 10, fuerza: 10,
    hpMax: 100, monedas: 50, racha: 0, peerId, online: false,
  };

  if (window.onlineModule) window.onlineModule.requestFriendData(peerId, newFriend);

  G.amigos.push(newFriend);
  saveGame();
  renderFriendsTab();
  document.getElementById('add-friend-name').value = '';
  showToast(`${username} added as friend!`);
}

function eliminarAmigo(id) {
  G.amigos = G.amigos.filter(a => a.id !== id);
  saveGame();
  renderFriendsTab();
}

// ─── SHOP TAB ─────────────────────────────────────────────────────────────────────

function renderShopTab(filterTipo) {
  if (!G) return;
  document.getElementById('tienda-coins').textContent = G.char.monedas;

  const items = filterTipo ? CATALOGO.filter(i => i.tipo === filterTipo) : CATALOGO;
  document.getElementById('tienda-cat-title').textContent =
    filterTipo ? filterTipo.toUpperCase() : 'ALL ITEMS';

  const grid = document.getElementById('tienda-grid');
  grid.innerHTML = items.map(item => {
    const owned     = G.comprados.includes(item.id);
    const canAfford = G.char.monedas >= item.precio;
    const bonuses   = [
      item.bonusAtaque  > 0 ? `⚔️ +${item.bonusAtaque} ATK`  : '',
      item.bonusDefensa > 0 ? `🛡️ +${item.bonusDefensa} DEF`  : '',
      item.bonusHP      > 0 ? `❤️ +${item.bonusHP} HP`         : '',
      item.bonusAgi     > 0 ? `⚡ +${item.bonusAgi} AGI`        : '',
      item.bonusFuerza  > 0 ? `💪 +${item.bonusFuerza} STR`    : '',
    ].filter(Boolean).join(' | ');
    return `
    <div class="shop-item ${owned?'owned':''} ${!canAfford&&!owned?'cant-afford':''}"
         onclick="${owned?'':canAfford?`comprarItem('${item.id}')`:''}">
      <div class="shop-emoji">${item.emoji}</div>
      <div class="shop-name">${item.nombre}</div>
      <div class="shop-desc">${item.desc}</div>
      ${bonuses ? `<div class="shop-bonus">${bonuses}</div>` : ''}
      <div class="shop-price ${owned?'owned-tag':''}">${owned ? '✅ OWNED' : `🪙 ${item.precio}`}</div>
    </div>`;
  }).join('');

  const owned = G.comprados.map(id => CATALOGO.find(i => i.id === id)).filter(Boolean);
  document.getElementById('owned-items').innerHTML = owned.length
    ? owned.map(i => `<div>${i.emoji} ${i.nombre}</div>`).join('')
    : 'Nothing yet';
}

function filterShop(tipo, btn) {
  document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderShopTab(tipo);
}

function comprarItem(id) {
  const item = CATALOGO.find(i => i.id === id);
  if (!item || G.comprados.includes(id)) return;
  if (G.char.monedas < item.precio) { showToast('Not enough coins!'); return; }

  G.char.monedas -= item.precio;
  G.comprados.push(id);

  G.char.ataque   += item.bonusAtaque  || 0;
  G.char.defensa  += item.bonusDefensa || 0;
  G.char.agilidad += item.bonusAgi     || 0;
  G.char.fuerza   += item.bonusFuerza  || 0;
  G.char.hpMax    += item.bonusHP      || 0;
  G.char.hp = Math.min(G.char.hp + (item.bonusHP || 0), G.char.hpMax);

  if (item.tipo === 'mueble' || item.tipo === 'decoracion') {
    G.char.casaItems.push(id);
  } else {
    G.char.accesorios.push(id);
  }

  saveGame();
  renderHUD();
  renderShopTab(null);
  renderHouseItems();
  showToast(`${item.emoji} ${item.nombre} purchased!`);
}

// ─── PROFILE TAB ─────────────────────────────────────────────────────────────────

function renderProfileTab() {
  if (!G || !window.currentUser) return;
  const el = document.getElementById('profile-content');
  el.innerHTML = `
    <div class="profile-panel panel">
      <div class="panel-title">👤 PROFILE</div>
      <div class="profile-avatar">
        ${G.profile.avatarData
          ? `<img src="${G.profile.avatarData}" class="pixel-avatar-display" alt="avatar">`
          : `<div class="avatar-no-photo">${CLASS_SPRITE[G.profile.clase]}</div>`
        }
      </div>
      <div class="profile-info">
        <div class="profile-row"><span>PLAYER</span><strong>${G.profile.nombre}</strong></div>
        <div class="profile-row"><span>HERO</span><strong>${G.profile.heroeNombre}</strong></div>
        <div class="profile-row"><span>CLASS</span><strong>${(CLASS_NAME_EN[G.profile.clase]||G.profile.clase).toUpperCase()}</strong></div>
        <div class="profile-row"><span>LEVEL</span><strong>${G.char.nivel}</strong></div>
        <div class="profile-row"><span>ACCOUNT</span><strong>${window.currentUser.displayName}</strong></div>
        ${window.currentUser.email ? `<div class="profile-row"><span>EMAIL</span><strong>${window.currentUser.email}</strong></div>` : ''}
        <div class="profile-row"><span>ONLINE ID</span><strong style="font-size:7px;color:var(--blue)">${window.currentUser.peerId}</strong></div>
      </div>
      <hr class="panel-divider">
      <div class="panel-title">📊 BATTLE STATS</div>
      <div class="battle-stats-box">
        <div><strong>${G.char.ganadasTotal}</strong> wins</div>
        <div><strong>${G.char.perdidasTotal}</strong> losses</div>
        <div><strong>${G.char.racha}</strong> day streak (best: ${G.char.mejorRacha})</div>
        <div><strong>${G.char.monedas}</strong> 🪙 coins</div>
      </div>
      <hr class="panel-divider">
      <div class="panel-title">🔊 MUSIC</div>
      <button class="btn-secondary btn-full" id="music-toggle-btn" onclick="if(window.Music){window.Music.toggle();this.textContent=window.Music.isPlaying()?'🔊 MUSIC: ON':'🔇 MUSIC: OFF'}">🔇 MUSIC: OFF</button>
      <hr class="panel-divider">
      <button class="btn-red btn-sm btn-full" onclick="logoutUser()">🚪 LOG OUT</button>
    </div>
  `;
  // Update music button state
  const btn = document.getElementById('music-toggle-btn');
  if (btn && window.Music) btn.textContent = window.Music.isPlaying() ? '🔊 MUSIC: ON' : '🔇 MUSIC: OFF';
}

// ─── LIBRE TAB ────────────────────────────────────────────────────────────────────

function renderLibreTab() {
  if (!G || !G.profile) return;
  const c = G.char;

  document.getElementById('libre-my-char').innerHTML = `
    <div style="font-size:34px">${CLASS_SPRITE[G.profile.clase]}</div>
    <div style="font-size:8px;color:var(--gold);margin-top:6px">${G.profile.heroeNombre}</div>
    <div style="font-size:7px;color:var(--gray)">LV.${c.nivel} | ⚡ ${c.ataque+c.defensa+c.agilidad+c.fuerza} POWER</div>
  `;

  const list = document.getElementById('opponents-list');
  list.innerHTML = CPU_OPPONENTS.map(op => `
    <div class="opponent-card">
      <div class="opponent-sprite">${CLASS_SPRITE[op.clase]}</div>
      <div class="opponent-info">
        <div class="opponent-name">${op.nombre}</div>
        <div class="opponent-power">
          LV.${op.nivel} | ⚡ ${op.ataque+op.defensa+op.agilidad+op.fuerza} power
          <br><span class="power-stars">${op.power}</span>
        </div>
      </div>
      <button class="btn-primary btn-sm" onclick="iniciarBatallaContra('${op.id}', true)">⚔️ FIGHT</button>
    </div>`).join('');
}

function librarChallenge() {
  const peerId = document.getElementById('libre-peer-id').value.trim();
  if (!peerId) { showToast("Enter your rival's ID!"); return; }
  if (window.onlineModule) {
    window.onlineModule.sendChallenge(peerId, true);
    showToast('Challenge sent! Waiting for response...');
  } else {
    showToast('Online connection not available');
  }
}

// ─── Battle Launch ────────────────────────────────────────────────────────────────

function iniciarBatallaContra(id, esLibre) {
  let enemy = CPU_OPPONENTS.find(o => o.id === id);
  if (!enemy) enemy = G.amigos.find(a => a.id === id);
  if (!enemy) { showToast('Opponent not found'); return; }

  const normalizedEnemy = {
    id:       enemy.id,
    nombre:   enemy.nombre || enemy.heroeNombre || 'Rival',
    clase:    enemy.clase  || 'guerrero',
    nivel:    enemy.nivel  || 1,
    ataque:   enemy.ataque  || 10,
    defensa:  enemy.defensa || 10,
    agilidad: enemy.agilidad|| 10,
    fuerza:   enemy.fuerza  || 10,
    hpMax:    enemy.hpMax   || 100,
    monedas:  enemy.monedas || 0,
    esLibre:  !!esLibre,
  };

  window.startBattle(normalizedEnemy);
}

// ─── Utilities ────────────────────────────────────────────────────────────────────

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.remove('hidden');
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => t.classList.add('hidden'), 3000);
}

function showModal(html) {
  document.getElementById('modal-content').innerHTML = html;
  document.getElementById('modal-overlay').classList.remove('hidden');
}

function closeModal(e) {
  if (!e || e.target === document.getElementById('modal-overlay')) {
    document.getElementById('modal-overlay').classList.add('hidden');
  }
}

function copyPeerId() {
  const id = document.getElementById('my-peer-id').textContent;
  if (id && id !== 'Connecting...') {
    navigator.clipboard.writeText(id).then(() => showToast('ID copied to clipboard!')).catch(()=>{});
  }
}

// ─── After-battle callback ────────────────────────────────────────────────────────

function onBattleEnd(resultado, enemy, monedasGanadas, monedasPerdidas) {
  G.char.ganadasTotal  += resultado === 'victoria' ? 1 : 0;
  G.char.perdidasTotal += resultado === 'derrota'  ? 1 : 0;

  if (!enemy.esLibre) {
    G.char.monedas += monedasGanadas - monedasPerdidas;
    G.char.monedas  = Math.max(0, G.char.monedas);
  }

  G.batallas.unshift({
    resultado, enemigoNombre: enemy.nombre,
    monedasGanadas:  enemy.esLibre ? 0 : monedasGanadas,
    monedasPerdidas: enemy.esLibre ? 0 : monedasPerdidas,
    fecha: Date.now(),
  });

  saveGame();
  renderHUD();
  renderBattleHistoryMini();
  renderFriendsTab();
}

// ─── Boot ─────────────────────────────────────────────────────────────────────────

window.bootGame = function() {
  // Render sprite previews in onboarding
  document.querySelectorAll('.sprite-preview[data-type]').forEach(el => {
    el.textContent  = CLASS_SPRITE[el.dataset.type] || '⚔️';
    el.style.fontSize = '44px';
  });

  const saved = loadGame();
  if (saved && saved.onboarding) {
    G = saved;
    applyDecay();
    initMainGame();
  } else {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('screen-onboarding').classList.add('active');
  }
};
