/* ═══════════════════════════════════════════════════════════════════════════════════
   HÉROE VITAL — game.js
   Core game logic: state, onboarding, tabs, shop, character, food logging
   ═══════════════════════════════════════════════════════════════════════════════════ */

'use strict';

// ─── Constants ───────────────────────────────────────────────────────────────────

const SAVE_KEY   = 'heroeVital_v1';
const DECAY_INTERVAL = 60 * 1000; // 1 minute

const CLASE_BONUS = {
  guerrero: { ataque:5, defensa:5, agilidad:1, fuerza:4, hp:0  },
  mago:     { ataque:3, defensa:1, agilidad:2, fuerza:2, hp:0  },
  arquero:  { ataque:4, defensa:2, agilidad:5, fuerza:2, hp:0  },
  sanador:  { ataque:1, defensa:3, agilidad:3, fuerza:1, hp:20 },
};

const CLASS_SPRITE = {
  guerrero: '⚔️', mago: '🔮', arquero: '🏹', sanador: '💚'
};

const CATALOGO = [
  { id:'corona_bronce',   nombre:'Corona de Bronce',   desc:'Muestra tu rango ante todos.',            precio:40,  tipo:'accesorio',  emoji:'👑',  bonusAtaque:0, bonusDefensa:1, bonusHP:0,  bonusAgi:0, bonusFuerza:0 },
  { id:'capa_roja',       nombre:'Capa Escarlata',      desc:'Una elegante capa que intimida.',         precio:60,  tipo:'accesorio',  emoji:'🧣',  bonusAtaque:2, bonusDefensa:0, bonusHP:0,  bonusAgi:0, bonusFuerza:0 },
  { id:'anillo_poder',    nombre:'Anillo de Poder',     desc:'Aumenta tu fuerza mágica.',               precio:80,  tipo:'accesorio',  emoji:'💍',  bonusAtaque:0, bonusDefensa:0, bonusHP:0,  bonusAgi:0, bonusFuerza:3 },
  { id:'amuleto_vida',    nombre:'Amuleto de Vida',     desc:'Otorga puntos de salud adicionales.',     precio:100, tipo:'accesorio',  emoji:'📿',  bonusAtaque:0, bonusDefensa:0, bonusHP:20, bonusAgi:0, bonusFuerza:0 },
  { id:'guantes_batalla', nombre:'Guantes de Batalla',  desc:'Aumentan el golpe cuerpo a cuerpo.',      precio:90,  tipo:'accesorio',  emoji:'🥊',  bonusAtaque:3, bonusDefensa:0, bonusHP:0,  bonusAgi:0, bonusFuerza:0 },
  { id:'espada_hierro',   nombre:'Espada de Hierro',    desc:'Confiable para todo combate.',             precio:120, tipo:'arma',       emoji:'⚔️',  bonusAtaque:5, bonusDefensa:0, bonusHP:0,  bonusAgi:0, bonusFuerza:0 },
  { id:'baston_magico',   nombre:'Bastón Mágico',       desc:'Canaliza el poder arcano.',                precio:130, tipo:'arma',       emoji:'🪄',  bonusAtaque:3, bonusDefensa:0, bonusHP:0,  bonusAgi:0, bonusFuerza:4 },
  { id:'arco_elfico',     nombre:'Arco Élfico',         desc:'Ataque a distancia con precisión.',       precio:140, tipo:'arma',       emoji:'🏹',  bonusAtaque:4, bonusDefensa:0, bonusHP:0,  bonusAgi:3, bonusFuerza:0 },
  { id:'escudo_madera',   nombre:'Escudo de Madera',    desc:'Protección básica pero confiable.',       precio:80,  tipo:'armadura',   emoji:'🛡️',  bonusAtaque:0, bonusDefensa:4, bonusHP:0,  bonusAgi:0, bonusFuerza:0 },
  { id:'cota_malla',      nombre:'Cota de Malla',       desc:'Armadura ligera de eslabones.',           precio:150, tipo:'armadura',   emoji:'🪖',  bonusAtaque:0, bonusDefensa:6, bonusHP:10, bonusAgi:0, bonusFuerza:0 },
  { id:'armadura_plata',  nombre:'Armadura de Plata',   desc:'Protección plateada de alto nivel.',     precio:250, tipo:'armadura',   emoji:'⚜️',  bonusAtaque:0, bonusDefensa:10,bonusHP:20, bonusAgi:0, bonusFuerza:0 },
  { id:'silla_comoda',    nombre:'Silla Cómoda',        desc:'Para descansar entre batallas.',          precio:30,  tipo:'mueble',     emoji:'🪑',  bonusAtaque:0, bonusDefensa:0, bonusHP:0,  bonusAgi:0, bonusFuerza:0 },
  { id:'mesa_festin',     nombre:'Mesa del Festín',     desc:'Una gran mesa para banquetes épicos.',   precio:70,  tipo:'mueble',     emoji:'🍽️',  bonusAtaque:0, bonusDefensa:0, bonusHP:0,  bonusAgi:0, bonusFuerza:0 },
  { id:'cama_real',       nombre:'Cama Real',           desc:'Descanso real para un héroe real.',      precio:120, tipo:'mueble',     emoji:'🛏️',  bonusAtaque:0, bonusDefensa:0, bonusHP:5,  bonusAgi:0, bonusFuerza:0 },
  { id:'estante_trofeos', nombre:'Estante de Trofeos',  desc:'Exhibe tus victorias con orgullo.',      precio:90,  tipo:'mueble',     emoji:'🏆',  bonusAtaque:0, bonusDefensa:0, bonusHP:0,  bonusAgi:0, bonusFuerza:0 },
  { id:'planta_magica',   nombre:'Planta Mágica',       desc:'Brilla con energía vital.',              precio:35,  tipo:'decoracion', emoji:'🌿',  bonusAtaque:0, bonusDefensa:0, bonusHP:0,  bonusAgi:0, bonusFuerza:0 },
  { id:'cuadro_batalla',  nombre:'Cuadro de Batalla',   desc:'Una pintura épica de tu victoria.',      precio:55,  tipo:'decoracion', emoji:'🖼️',  bonusAtaque:0, bonusDefensa:0, bonusHP:0,  bonusAgi:0, bonusFuerza:0 },
  { id:'alfombra_dragon', nombre:'Alfombra del Dragón', desc:'Un dragón tejido con magia antigua.',   precio:75,  tipo:'decoracion', emoji:'🐉',  bonusAtaque:0, bonusDefensa:0, bonusHP:0,  bonusAgi:0, bonusFuerza:0 },
  { id:'ventana_magica',  nombre:'Ventana Mágica',      desc:'Vistas a mundos lejanos y gloriosos.',  precio:110, tipo:'decoracion', emoji:'🌌',  bonusAtaque:0, bonusDefensa:0, bonusHP:0,  bonusAgi:0, bonusFuerza:0 },
];

const CPU_OPPONENTS = [
  { id:'cpu1', nombre:'Entrenador Novato',   clase:'guerrero', nivel:1, ataque:8,  defensa:6,  agilidad:6,  fuerza:7,  hpMax:80,  monedas:20,  racha:0, power:'★☆☆☆☆' },
  { id:'cpu2', nombre:'Guardiana del Bosque',clase:'arquero',  nivel:2, ataque:12, defensa:9,  agilidad:14, fuerza:8,  hpMax:90,  monedas:40,  racha:2, power:'★★☆☆☆' },
  { id:'cpu3', nombre:'Mago del Vacío',      clase:'mago',     nivel:3, ataque:18, defensa:8,  agilidad:12, fuerza:10, hpMax:100, monedas:75,  racha:4, power:'★★★☆☆' },
  { id:'cpu4', nombre:'Caballero de Hierro', clase:'guerrero', nivel:5, ataque:22, defensa:20, agilidad:10, fuerza:18, hpMax:150, monedas:130, racha:8, power:'★★★★☆' },
  { id:'cpu5', nombre:'Archimaga Celestial', clase:'sanador',  nivel:7, ataque:15, defensa:25, agilidad:18, fuerza:12, hpMax:200, monedas:250, racha:15,power:'★★★★★' },
];

// ─── State ───────────────────────────────────────────────────────────────────────

let G = null; // Game state

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
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(G)); } catch(e) {}
}

function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) return JSON.parse(raw);
  } catch(e) {}
  return null;
}

// ─── Hunger / Thirst Decay ────────────────────────────────────────────────────────

function applyDecay() {
  if (!G || !G.char) return;
  const now   = Date.now();
  const secs  = (now - G.char.ultimoSave) / 1000;
  if (secs < 30) return;

  // Hunger: -10 per 10800s (3h)
  const hambreLoss = (secs / 10800) * 10;
  // Thirst: -10 per 7200s (2h)
  const sedLoss    = (secs / 7200) * 10;

  G.char.hambre = Math.max(0, G.char.hambre - hambreLoss);
  G.char.sed    = Math.max(0, G.char.sed    - sedLoss);

  // HP damage if both at 0
  if (G.char.hambre === 0 && G.char.sed === 0) {
    const hpLoss = Math.floor(secs / 3600);
    G.char.hp = Math.max(1, G.char.hp - hpLoss);
  }

  G.char.ultimoSave = now;
}

// ─── Onboarding state ────────────────────────────────────────────────────────────

let ob = {
  nombre: '', heroeNombre: '',
  peso: 0, altura: 0, edad: 0, sexo: 'M',
  objetivo: '', actividad: '', clase: ''
};

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
    ob.nombre = document.getElementById('ob-nombre').value.trim();
    ob.heroeNombre = document.getElementById('ob-heroe-nombre').value.trim();
    if (!ob.nombre || !ob.heroeNombre) { showToast('¡Ingresa tu nombre y el nombre del héroe!'); return; }
  }
  if (step === 2) {
    ob.peso   = parseFloat(document.getElementById('ob-peso').value)   || 0;
    ob.altura = parseFloat(document.getElementById('ob-altura').value) || 0;
    ob.edad   = parseInt(document.getElementById('ob-edad').value)     || 0;
    ob.sexo   = document.getElementById('ob-sexo').value;
    if (ob.peso < 30 || ob.altura < 100 || ob.edad < 10) { showToast('¡Completa todos los datos físicos!'); return; }
  }
  if (step === 3 && !ob.objetivo)  { showToast('¡Elige tu objetivo!');        return; }
  if (step === 4 && !ob.actividad) { showToast('¡Elige tu nivel de actividad!'); return; }
  if (step === 5 && !ob.clase)     { showToast('¡Elige tu clase de personaje!'); return; }
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
  document.getElementById('ob-summary').innerHTML = `
    <div>👤 <strong>Jugador:</strong> ${ob.nombre}</div>
    <div>${CLASS_SPRITE[ob.clase]} <strong>Héroe:</strong> ${ob.heroeNombre} (${ob.clase.toUpperCase()})</div>
    <div>⚖️ <strong>Peso:</strong> ${ob.peso} kg | Altura: ${ob.altura} cm | Edad: ${ob.edad}</div>
    <div>🎯 <strong>Objetivo:</strong> ${formatObjetivo(ob.objetivo)}</div>
    <div>🏃 <strong>Actividad:</strong> ${formatActividad(ob.actividad)}</div>
    <hr style="border-color:#3a3a7a;margin:10px 0">
    <div>🔥 <strong>Meta calórica:</strong> ${metas.calorias} kcal/día</div>
    <div>🥩 <strong>Meta proteína:</strong> ${metas.proteina}g/día</div>
    <div>💧 <strong>Meta agua:</strong> ${metas.aguaMl} ml/día</div>
    <hr style="border-color:#3a3a7a;margin:10px 0">
    <div>⚔️ <strong>Stats iniciales:</strong> ATQ ${10 + (bonus.ataque||0)} | DEF ${10 + (bonus.defensa||0)} | AGI ${10 + (bonus.agilidad||0)} | FUE ${10 + (bonus.fuerza||0)} | PS ${100 + (bonus.hp||0)}</div>
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
  };
  G.char.ataque  += (bonus.ataque   || 0);
  G.char.defensa += (bonus.defensa  || 0);
  G.char.agilidad+= (bonus.agilidad || 0);
  G.char.fuerza  += (bonus.fuerza   || 0);
  G.char.hpMax   += (bonus.hp       || 0);
  G.char.hp       = G.char.hpMax;
  G.onboarding    = true;
  saveGame();
  initMainGame();
}

// ─── Meta Calculations ───────────────────────────────────────────────────────────

function calcMetas(p) {
  const tmb = p.sexo === 'M'
    ? 10 * p.peso + 6.25 * p.altura - 5 * p.edad + 5
    : 10 * p.peso + 6.25 * p.altura - 5 * p.edad - 161;

  const mult = { sedentario:1.2, ligeramenteActivo:1.375, moderadamenteActivo:1.55, muyActivo:1.725, atletico:1.9 };
  const tdee = tmb * (mult[p.actividad] || 1.55);

  const calDelta = { perderPeso:-500, definirse:-200, mantenerse:0, ganarMasa:350, ganarFuerza:200 };
  const protMult = { perderPeso:1.6, definirse:1.8, mantenerse:1.4, ganarMasa:2.0, ganarFuerza:2.2 };

  return {
    calorias: Math.round(tdee + (calDelta[p.objetivo] || 0)),
    proteina: Math.round(p.peso * (protMult[p.objetivo] || 1.6)),
    aguaMl:   Math.round(p.peso * 33),
  };
}

function formatObjetivo(v) {
  const m = { perderPeso:'Perder Peso', definirse:'Definirse', mantenerse:'Mantenerse', ganarMasa:'Ganar Masa', ganarFuerza:'Ganar Fuerza' };
  return m[v] || v;
}

function formatActividad(v) {
  const m = { sedentario:'Sedentario', ligeramenteActivo:'Ligeramente Activo', moderadamenteActivo:'Moderadamente Activo', muyActivo:'Muy Activo', atletico:'Atlético' };
  return m[v] || v;
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

  // Start decay timer
  setInterval(() => {
    applyDecay();
    saveGame();
    renderHUD();
    renderHomeChar();
  }, DECAY_INTERVAL);

  showTab('inicio');
}

// ─── Tab Navigation ───────────────────────────────────────────────────────────────

function showTab(name) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + name).classList.add('active');
  document.getElementById('tab-btn-' + name).classList.add('active');

  if (name === 'inicio')   renderHomeTab();
  if (name === 'registro') renderLogTab();
  if (name === 'amigos')   renderFriendsTab();
  if (name === 'tienda')   renderShopTab(null);
  if (name === 'libre')    renderLibreTab();
}

// ─── HUD ─────────────────────────────────────────────────────────────────────────

function renderHUD() {
  if (!G || !G.profile) return;
  const c = G.char;

  document.getElementById('hud-player-name').textContent = G.profile.heroeNombre.toUpperCase();
  document.getElementById('hud-level').textContent       = c.nivel;
  document.getElementById('hud-sprite').textContent      = CLASS_SPRITE[G.profile.clase];
  document.getElementById('hud-coins').textContent       = c.monedas;
  document.getElementById('hud-streak').textContent      = c.racha;

  // HP bar
  const hpPct = (c.hp / c.hpMax) * 100;
  const hpBar = document.getElementById('bar-hp');
  hpBar.style.width    = hpPct + '%';
  hpBar.style.background = hpPct > 50 ? 'var(--hp-green)' : hpPct > 25 ? 'var(--hp-yellow)' : 'var(--hp-red)';
  document.getElementById('val-hp').textContent = c.hp + '/' + c.hpMax;

  // Hunger
  const hPct = c.hambre;
  const hungerBar = document.getElementById('bar-hunger');
  hungerBar.style.width = hPct + '%';
  hungerBar.style.background = hPct > 50 ? 'var(--hunger-full)' : hPct > 25 ? 'var(--hp-yellow)' : 'var(--hp-red)';
  document.getElementById('val-hunger').textContent = Math.round(hPct) + '%';

  // Thirst
  const sPct = c.sed;
  const thirstBar = document.getElementById('bar-thirst');
  thirstBar.style.width = sPct + '%';
  thirstBar.style.background = sPct > 50 ? 'var(--thirst-full)' : sPct > 25 ? 'var(--hp-yellow)' : 'var(--hp-red)';
  document.getElementById('val-thirst').textContent = Math.round(sPct) + '%';

  // XP
  const xpPct = (c.exp / c.expNext) * 100;
  document.getElementById('bar-xp').style.width = xpPct + '%';
  document.getElementById('val-xp').textContent = c.exp + '/' + c.expNext;

  // Daily progress
  const today = todayRegistros();
  const cal   = today.reduce((s,r)=>s+r.calorias,0);
  const agua  = today.reduce((s,r)=>s+(r.agua||0),0);
  document.getElementById('hud-meta-cal').textContent  = `🍽️ ${cal}/${G.profile.calorias} cal`;
  document.getElementById('hud-meta-agua').textContent = `💧 ${agua}/${G.profile.aguaMl} ml`;

  // Alerts
  const alerts = document.getElementById('hud-alerts');
  alerts.innerHTML = '';
  if (c.hambre < 30) alerts.innerHTML += `<span class="hud-alert hunger">¡HAMBRE!</span>`;
  if (c.sed < 30)    alerts.innerHTML += `<span class="hud-alert thirst">¡SED!</span>`;
  if (c.hp < c.hpMax * 0.25) alerts.innerHTML += `<span class="hud-alert weak">¡DEBILITADO!</span>`;
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
  const c = G.char;
  const el = document.getElementById('char-in-house');
  const sprite = CLASS_SPRITE[G.profile.clase];

  let state = '😊';
  if (c.hambre < 20 && c.sed < 20) state = '😵';
  else if (c.hambre < 30)          state = '😩';
  else if (c.sed < 30)             state = '😰';
  else if (c.hp < c.hpMax * 0.25)  state = '😤';
  else if (c.hambre > 70 && c.sed > 70 && c.hp > c.hpMax * 0.7) state = '😄';

  el.innerHTML = `<div style="font-size:56px;line-height:1">${sprite}</div><div style="font-size:18px;margin-top:-8px">${state}</div>`;

  const speech = document.getElementById('house-speech');
  let msg = '';
  if (c.hambre < 25)             msg = '¡Tengo mucha hambre! 🍗';
  else if (c.sed < 25)           msg = '¡Necesito agua! 💧';
  else if (c.hp < c.hpMax * 0.3) msg = '¡Estoy debilitado...';
  else if (c.nivel >= 5)         msg = '¡Soy muy poderoso! ⚡';
  else                           msg = '¡Cuídame bien!';

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
  const c = G.char;
  const el = document.getElementById('stat-grid');
  const stats = [
    { label:'⚔️ ATAQUE',   value: c.ataque,   bar: c.ataque  / 50, color:'var(--red)'    },
    { label:'🛡️ DEFENSA',  value: c.defensa,  bar: c.defensa / 50, color:'var(--blue)'   },
    { label:'⚡ AGILIDAD', value: c.agilidad, bar: c.agilidad/ 50, color:'var(--green)'  },
    { label:'💪 FUERZA',   value: c.fuerza,   bar: c.fuerza  / 50, color:'var(--gold)'   },
    { label:'❤️ PS',        value: c.hp + '/' + c.hpMax, bar: c.hp/c.hpMax, color:'var(--hp-green)'  },
    { label:'⚡ PODER',    value: c.ataque+c.defensa+c.agilidad+c.fuerza, bar: (c.ataque+c.defensa+c.agilidad+c.fuerza)/200, color:'var(--purple)' },
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
  const cal    = today.reduce((s,r)=>s+r.calorias,0);
  const prot   = today.reduce((s,r)=>s+(r.proteinas||0),0);
  const agua   = today.reduce((s,r)=>s+(r.agua||0),0);
  const calPct = Math.min(1, cal  / G.profile.calorias);
  const proPct = Math.min(1, prot / G.profile.proteina);
  const aguPct = Math.min(1, agua / G.profile.aguaMl);

  const el = document.getElementById('daily-goals');
  el.innerHTML = `
    ${goalRow('🍽️ Calorías', calPct, `${cal}/${G.profile.calorias} kcal`)}
    ${goalRow('🥩 Proteína',  proPct, `${Math.round(prot)}/${G.profile.proteina}g`)}
    ${goalRow('💧 Agua',      aguPct, `${agua}/${G.profile.aguaMl}ml`)}
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
  if (!G.batallas.length) { el.textContent = 'Sin batallas aún.'; return; }
  el.innerHTML = G.batallas.slice(0,5).map(b => `
    <div class="battle-history-item">
      <span class="bhi-result ${b.resultado}">${b.resultado === 'victoria' ? '🏆 VICTORIA' : b.resultado === 'derrota' ? '💀 DERROTA' : '🤝 EMPATE'}</span>
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
  const tipo   = document.getElementById('food-type').value;
  const desc   = document.getElementById('food-desc').value.trim();
  const cal    = parseInt(document.getElementById('food-cal').value)  || 0;
  const prot   = parseFloat(document.getElementById('food-prot').value)  || 0;
  const carbs  = parseFloat(document.getElementById('food-carbs').value) || 0;
  const agua   = parseInt(document.getElementById('food-agua').value) || 0;

  if (!desc) { showToast('¡Describe qué comiste o bebiste!'); return; }

  // Calculate stat impacts
  const calPct    = G.profile ? cal / G.profile.calorias : 0.1;
  const hambre    = tipo === 'agua' ? 0 : Math.min(40, calPct * 70);
  const sed       = Math.min(35, (agua / 500) * 45) + (tipo === 'bebida' ? 5 : 0) + (tipo === 'agua' ? 40 : 0);
  const hpGain    = Math.round(hambre / 6) + Math.round(prot / 8);
  const expGain   = Math.round(calPct * 25) + Math.round(prot / 4) + (agua > 200 ? 8 : 0);
  const moneBase  = tipo === 'agua' ? 4 : cal > 0 ? 3 : 1;
  const moneBonus = prot > 20 ? 4 : 0;
  const monedas   = moneBase + moneBonus;

  const reg = {
    id:       Date.now(),
    fecha:    Date.now(),
    tipo, desc, calorias: cal, proteinas: prot,
    carbohidratos: carbs, agua, foto: pendingPhotoData,
    hambreImpact: hambre, sedImpact: sed,
    hpGain, expGain, monedas,
  };

  G.registros.unshift(reg);

  G.char.hambre  = Math.min(100, G.char.hambre + hambre);
  G.char.sed     = Math.min(100, G.char.sed    + sed);
  G.char.hp      = Math.min(G.char.hpMax, G.char.hp + hpGain);
  G.char.exp    += expGain;
  G.char.monedas += monedas;

  checkLevelUp();
  checkDailyGoal();
  saveGame();
  renderHUD();
  renderLogTab();
  renderHomeChar();

  // Reset form
  document.getElementById('food-desc').value  = '';
  document.getElementById('food-cal').value   = '';
  document.getElementById('food-prot').value  = '';
  document.getElementById('food-carbs').value = '';
  document.getElementById('food-agua').value  = '';
  pendingPhotoData = null;
  document.getElementById('food-photo').classList.add('hidden');
  document.getElementById('photo-preview-inner').classList.remove('hidden');
  document.getElementById('camera-input').value = '';

  showToast(`+${expGain} EXP | +${monedas} 🪙 | ${hpGain > 0 ? '+' + hpGain + ' PS' : ''}`);
}

function renderLogTab() {
  if (!G || !G.profile) return;
  const today = todayRegistros();
  const cal   = today.reduce((s,r)=>s+r.calorias,0);
  const prot  = today.reduce((s,r)=>s+(r.proteinas||0),0);
  const carbs = today.reduce((s,r)=>s+(r.carbohidratos||0),0);
  const agua  = today.reduce((s,r)=>s+(r.agua||0),0);

  // Totals
  document.getElementById('log-totals').innerHTML = `
    <div class="total-box"><div class="total-box-label">CALORÍAS</div><div class="total-box-val">${cal}</div><div class="total-box-goal">/${G.profile.calorias}</div></div>
    <div class="total-box"><div class="total-box-label">PROTEÍNA</div><div class="total-box-val">${Math.round(prot)}g</div><div class="total-box-goal">/${G.profile.proteina}g</div></div>
    <div class="total-box"><div class="total-box-label">CARBS</div><div class="total-box-val">${Math.round(carbs)}g</div></div>
    <div class="total-box"><div class="total-box-label">AGUA</div><div class="total-box-val">${agua}ml</div><div class="total-box-goal">/${G.profile.aguaMl}</div></div>
  `;

  // List
  const listEl = document.getElementById('log-list');
  if (!today.length) { listEl.innerHTML = '<div class="empty-state">No hay registros hoy. ¡Empieza a comer!</div>'; return; }
  listEl.innerHTML = today.map(r => {
    const tipoEmoji = { comida:'🍽️', agua:'💧', bebida:'🥤', snack:'🍎', suplemento:'💊' }[r.tipo] || '🍽️';
    return `<div class="log-item">
      ${r.foto
        ? `<img class="log-item-photo" src="${r.foto}" alt="foto">`
        : `<div class="log-item-photo-placeholder">${tipoEmoji}</div>`
      }
      <div class="log-item-info">
        <div class="log-item-name">${r.desc}</div>
        <div class="log-item-meta">
          ${r.calorias>0?r.calorias+' kcal | ':''}
          ${r.proteinas>0?r.proteinas+'g prot | ':''}
          ${r.agua>0?r.agua+'ml agua':''}
        </div>
        <div class="log-item-gains">
          ${r.hpGain>0?`<span class="log-gain-hp">+${r.hpGain} PS</span>`:''}
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
    G.char.exp    -= G.char.expNext;
    G.char.expNext = Math.round(G.char.expNext * 1.5);
    G.char.nivel++;
    G.char.hpMax  += 15;
    G.char.hp      = G.char.hpMax;
    G.char.ataque  += 2;
    G.char.defensa += 2;
    G.char.agilidad+= 1;
    G.char.fuerza  += 2;
    G.char.monedas += 30;
    showModal(`
      <span class="big-emoji">🌟</span>
      <h2>¡SUBISTE DE NIVEL!</h2>
      <div style="color:var(--gold);font-size:20px;margin:12px 0">NIVEL ${G.char.nivel}</div>
      <div style="line-height:2.5">
        ⚔️ ATQ +2 | 🛡️ DEF +2<br>
        ⚡ AGI +1 | 💪 FUE +2<br>
        ❤️ PS MAX +15 | 🪙 +30
      </div>
    `);
  }
}

function checkDailyGoal() {
  if (!G.profile) return;
  const today  = new Date(); today.setHours(0,0,0,0);
  if (G.char.ultimoDiaMeta) {
    const last = new Date(G.char.ultimoDiaMeta); last.setHours(0,0,0,0);
    if (last.getTime() === today.getTime()) return;
  }
  const todayRegs = todayRegistros();
  const cal   = todayRegs.reduce((s,r)=>s+r.calorias,0);
  const prot  = todayRegs.reduce((s,r)=>s+(r.proteinas||0),0);
  const agua  = todayRegs.reduce((s,r)=>s+(r.agua||0),0);
  const metasCumplidas =
    (cal  / G.profile.calorias  >= 0.9 ? 1 : 0) +
    (prot / G.profile.proteina  >= 0.9 ? 1 : 0) +
    (agua / G.profile.aguaMl    >= 0.9 ? 1 : 0);

  if (metasCumplidas >= 2) {
    const bonus = 10 + metasCumplidas * 5;
    G.char.monedas += bonus;
    G.char.racha++;
    G.char.mejorRacha = Math.max(G.char.mejorRacha, G.char.racha);
    G.char.ultimoDiaMeta = Date.now();
    showToast(`🎉 ¡${metasCumplidas}/3 metas cumplidas! +${bonus} 🪙 | Racha: ${G.char.racha} días`);
  }
}

// ─── FRIENDS TAB ─────────────────────────────────────────────────────────────────

function renderFriendsTab() {
  if (!G) return;
  document.getElementById('friends-count').textContent = G.amigos.length;

  // Battle stats
  document.getElementById('my-battle-stats').innerHTML = `
    <div><strong>${G.char.ganadasTotal}</strong> victorias</div>
    <div><strong>${G.char.perdidasTotal}</strong> derrotas</div>
    <div><strong>${G.char.racha}</strong> días de racha</div>
    <div><strong>${G.char.monedas}</strong> 🪙 monedas</div>
  `;

  const list = document.getElementById('friends-list');
  if (!G.amigos.length) { list.innerHTML = '<div class="empty-state">Sin amigos aún.<br>¡Comparte tu ID para jugar!</div>'; return; }
  list.innerHTML = G.amigos.map(f => `
    <div class="friend-card">
      <div class="friend-sprite">${CLASS_SPRITE[f.clase] || '🧙'}</div>
      <div class="friend-info">
        <div class="friend-name">${f.nombre}</div>
        <div class="friend-char">${f.heroeNombre || f.nombre} LV.${f.nivel || 1}</div>
        <div class="friend-stats">
          ⚔️ ${f.ataque || 10} | 🛡️ ${f.defensa || 10} | 🪙 ${f.monedas || 0}
        </div>
      </div>
      <div class="friend-actions">
        <button class="btn-primary btn-sm" onclick="iniciarBatallaContra('${f.id}', false)">⚔️ BATALLAR</button>
        <button class="btn-secondary btn-sm" onclick="eliminarAmigo('${f.id}')">✕</button>
      </div>
    </div>`).join('');
}

function agregarAmigo() {
  const nombre = document.getElementById('add-friend-name').value.trim();
  const peerId = document.getElementById('add-friend-peer').value.trim();
  if (!nombre) { showToast('¡Ingresa el nombre del amigo!'); return; }

  // Add as local friend entry (peer data fetched via online.js when available)
  const newFriend = {
    id:         peerId || ('local_' + Date.now()),
    nombre:     nombre,
    heroeNombre:nombre,
    clase:      'guerrero',
    nivel:      1,
    ataque:     10, defensa:10, agilidad:10, fuerza:10,
    hpMax:      100, monedas:50, racha:0,
    peerId:     peerId,
    online:     false,
  };

  // If online and peerId given, request their actual stats
  if (peerId && window.onlineModule) {
    window.onlineModule.requestFriendData(peerId, newFriend);
  }

  G.amigos.push(newFriend);
  saveGame();
  renderFriendsTab();
  document.getElementById('add-friend-name').value = '';
  document.getElementById('add-friend-peer').value = '';
  showToast(`¡${nombre} agregado como amigo!`);
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
    filterTipo ? filterTipo.toUpperCase() : 'TODOS LOS OBJETOS';

  const grid = document.getElementById('tienda-grid');
  grid.innerHTML = items.map(item => {
    const owned     = G.comprados.includes(item.id);
    const canAfford = G.char.monedas >= item.precio;
    const bonuses   = [
      item.bonusAtaque  > 0 ? `⚔️ +${item.bonusAtaque} ATQ`  : '',
      item.bonusDefensa > 0 ? `🛡️ +${item.bonusDefensa} DEF`  : '',
      item.bonusHP      > 0 ? `❤️ +${item.bonusHP} PS`         : '',
      item.bonusAgi     > 0 ? `⚡ +${item.bonusAgi} AGI`        : '',
      item.bonusFuerza  > 0 ? `💪 +${item.bonusFuerza} FUE`    : '',
    ].filter(Boolean).join(' | ');
    return `
    <div class="shop-item ${owned?'owned':''} ${!canAfford&&!owned?'cant-afford':''}"
         onclick="${owned?'':canAfford?`comprarItem('${item.id}')`:''}">
      <div class="shop-emoji">${item.emoji}</div>
      <div class="shop-name">${item.nombre}</div>
      <div class="shop-desc">${item.desc}</div>
      ${bonuses ? `<div class="shop-bonus">${bonuses}</div>` : ''}
      <div class="shop-price ${owned?'owned-tag':''}">${owned ? '✅ OBTENIDO' : `🪙 ${item.precio}`}</div>
    </div>`;
  }).join('');

  // Owned items list
  const owned = G.comprados.map(id => CATALOGO.find(i => i.id === id)).filter(Boolean);
  document.getElementById('owned-items').innerHTML = owned.length
    ? owned.map(i => `<div>${i.emoji} ${i.nombre}</div>`).join('')
    : 'Nada aún';
}

function filterShop(tipo, btn) {
  document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderShopTab(tipo);
}

function comprarItem(id) {
  const item = CATALOGO.find(i => i.id === id);
  if (!item || G.comprados.includes(id)) return;
  if (G.char.monedas < item.precio) { showToast('¡No tienes suficientes monedas!'); return; }

  G.char.monedas -= item.precio;
  G.comprados.push(id);

  // Apply stat bonuses
  G.char.ataque  += item.bonusAtaque  || 0;
  G.char.defensa += item.bonusDefensa || 0;
  G.char.agilidad+= item.bonusAgi     || 0;
  G.char.fuerza  += item.bonusFuerza  || 0;
  G.char.hpMax   += item.bonusHP      || 0;
  G.char.hp = Math.min(G.char.hp + (item.bonusHP || 0), G.char.hpMax);

  // Add to house if furniture/decoration
  if (item.tipo === 'mueble' || item.tipo === 'decoracion') {
    G.char.casaItems.push(id);
  } else {
    G.char.accesorios.push(id);
  }

  saveGame();
  renderHUD();
  renderShopTab(null);
  renderHouseItems();
  showToast(`¡${item.emoji} ${item.nombre} comprado!`);
}

// ─── LIBRE TAB ────────────────────────────────────────────────────────────────────

function renderLibreTab() {
  if (!G || !G.profile) return;
  const c = G.char;

  document.getElementById('libre-my-char').innerHTML = `
    <div style="font-size:36px">${CLASS_SPRITE[G.profile.clase]}</div>
    <div style="font-size:8px;color:var(--gold);margin-top:6px">${G.profile.heroeNombre}</div>
    <div style="font-size:7px;color:var(--gray)">LV.${c.nivel} | ⚡ ${c.ataque+c.defensa+c.agilidad+c.fuerza} PODER</div>
  `;

  const list = document.getElementById('opponents-list');
  list.innerHTML = CPU_OPPONENTS.map(op => `
    <div class="opponent-card">
      <div class="opponent-sprite">${CLASS_SPRITE[op.clase]}</div>
      <div class="opponent-info">
        <div class="opponent-name">${op.nombre}</div>
        <div class="opponent-power">
          LV.${op.nivel} | ⚡ ${op.ataque+op.defensa+op.agilidad+op.fuerza} poder
          <br><span class="power-stars">${op.power}</span>
        </div>
      </div>
      <button class="btn-primary btn-sm" onclick="iniciarBatallaContra('${op.id}', true)">⚔️ LUCHAR</button>
    </div>`).join('');
}

function librarChallenge() {
  const peerId = document.getElementById('libre-peer-id').value.trim();
  if (!peerId) { showToast('¡Ingresa el ID de tu rival!'); return; }
  if (window.onlineModule) {
    window.onlineModule.sendChallenge(peerId, true);
    showToast('¡Desafío enviado! Esperando respuesta...');
  } else {
    showToast('Conexión online no disponible');
  }
}

// ─── Battle Launch ────────────────────────────────────────────────────────────────

function iniciarBatallaContra(id, esLibre) {
  // Find opponent
  let enemy = CPU_OPPONENTS.find(o => o.id === id);
  if (!enemy) enemy = G.amigos.find(a => a.id === id);
  if (!enemy) { showToast('Oponente no encontrado'); return; }

  // Normalize enemy object
  const normalizedEnemy = {
    id:         enemy.id,
    nombre:     enemy.nombre || enemy.heroeNombre || 'Rival',
    clase:      enemy.clase  || 'guerrero',
    nivel:      enemy.nivel  || 1,
    ataque:     enemy.ataque  || 10,
    defensa:    enemy.defensa || 10,
    agilidad:   enemy.agilidad|| 10,
    fuerza:     enemy.fuerza  || 10,
    hpMax:      enemy.hpMax   || 100,
    monedas:    enemy.monedas || 0,
    esLibre:    !!esLibre,
  };

  window.startBattle(normalizedEnemy);
}

// ─── Utilities ────────────────────────────────────────────────────────────────────

function showTab_and(name) { showTab(name); }

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
  if (id && id !== 'Conectando...') {
    navigator.clipboard.writeText(id).then(() => showToast('¡ID copiado al portapapeles!')).catch(()=>{});
  }
}

// ─── After-battle callback (called by battle.js) ────────────────────────────────

function onBattleEnd(resultado, enemy, monedasGanadas, monedasPerdidas) {
  G.char.ganadasTotal  += resultado === 'victoria' ? 1 : 0;
  G.char.perdidasTotal += resultado === 'derrota'  ? 1 : 0;

  if (!enemy.esLibre) {
    G.char.monedas += monedasGanadas - monedasPerdidas;
    G.char.monedas  = Math.max(0, G.char.monedas);
  }

  G.batallas.unshift({
    resultado, enemigoNombre: enemy.nombre,
    monedasGanadas: enemy.esLibre ? 0 : monedasGanadas,
    monedasPerdidas: enemy.esLibre ? 0 : monedasPerdidas,
    fecha: Date.now(),
  });

  saveGame();
  renderHUD();
  renderBattleHistoryMini();
  renderFriendsTab();
}

// ─── Boot ─────────────────────────────────────────────────────────────────────────

window.addEventListener('DOMContentLoaded', () => {
  const saved = loadGame();

  // Render sprite previews in onboarding
  document.querySelectorAll('.sprite-preview[data-type]').forEach(el => {
    el.textContent = CLASS_SPRITE[el.dataset.type] || '⚔️';
    el.style.fontSize = '48px';
    el.style.display = 'flex';
    el.style.alignItems = 'center';
    el.style.justifyContent = 'center';
  });

  if (saved && saved.onboarding) {
    G = saved;
    applyDecay();
    initMainGame();
  } else {
    document.getElementById('screen-onboarding').classList.add('active');
  }
});
