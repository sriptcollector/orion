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
  avatarData: null, rawPhotoData: null,
  pesoUnit: 'kg', alturaUnit: 'cm',
};

window.setWeightUnit = function(unit, btn) {
  ob.pesoUnit = unit;
  document.querySelectorAll('.unit-toggle .unit-btn').forEach(b => {
    if (b.textContent === 'kg' || b.textContent === 'lbs') b.classList.remove('active');
  });
  btn.classList.add('active');
  const inp = document.getElementById('ob-peso');
  const val = parseFloat(inp.value);
  if (val) {
    inp.value = unit === 'lbs' ? Math.round(val * 2.20462) : Math.round(val / 2.20462);
  }
  inp.placeholder = unit === 'kg' ? '70' : '154';
};

window.setHeightUnit = function(unit, btn) {
  ob.alturaUnit = unit;
  document.querySelectorAll('.unit-toggle .unit-btn').forEach(b => {
    if (b.textContent === 'cm' || b.textContent === 'ft·in') b.classList.remove('active');
  });
  btn.classList.add('active');
  const cmInp = document.getElementById('ob-altura');
  const ftRow = document.getElementById('ob-altura-ft-row');
  if (unit === 'ft') {
    const cm = parseFloat(cmInp.value) || 170;
    const totalIn = Math.round(cm / 2.54);
    document.getElementById('ob-altura-ft').value = Math.floor(totalIn / 12);
    document.getElementById('ob-altura-in').value = totalIn % 12;
    cmInp.style.display = 'none';
    ftRow.style.display = 'flex';
  } else {
    const ft  = parseFloat(document.getElementById('ob-altura-ft').value) || 5;
    const inc = parseFloat(document.getElementById('ob-altura-in').value) || 7;
    cmInp.value = Math.round((ft * 12 + inc) * 2.54);
    cmInp.style.display = '';
    ftRow.style.display = 'none';
  }
};

window.triggerAvatarCamera = function() {
  document.getElementById('avatar-input-camera').click();
};

window.triggerAvatarLibrary = function() {
  document.getElementById('avatar-input-library').click();
};

window.handleAvatarPhoto = function(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    ob.rawPhotoData = ev.target.result;
    // Quick pixelated preview during onboarding
    pixelatePreview(ev.target.result, 16, previewData => {
      ob.avatarData = previewData;
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
      img.src = previewData;
    });
  };
  reader.readAsDataURL(file);
};

// Quick pixelated preview (mosaic style)
function pixelatePreview(src, pixelSize, callback) {
  const img = new Image();
  img.onload = () => {
    const small = document.createElement('canvas');
    small.width = small.height = pixelSize;
    const c1 = small.getContext('2d');
    c1.imageSmoothingEnabled = false;
    c1.drawImage(img, 0, 0, pixelSize, pixelSize);
    const large = document.createElement('canvas');
    large.width = large.height = 96;
    const c2 = large.getContext('2d');
    c2.imageSmoothingEnabled = false;
    c2.drawImage(small, 0, 0, 96, 96);
    callback(large.toDataURL());
  };
  img.onerror = () => callback(null);
  img.src = src;
}

// Generate Pokémon-style pixel character from photo traits + class colors
function generatePixelCharacter(src, classe, callback) {
  const img = new Image();
  img.onload = () => {
    // Sample colors from photo
    const S = 32;
    const sc = document.createElement('canvas');
    sc.width = sc.height = S;
    const sctx = sc.getContext('2d');
    sctx.drawImage(img, 0, 0, S, S);
    const d = sctx.getImageData(0, 0, S, S).data;

    function avgRgb(x0, y0, x1, y1) {
      let r=0,g=0,b=0,n=0;
      for (let y=y0; y<y1; y++) for (let x=x0; x<x1; x++) {
        const i=(y*S+x)*4;
        if (d[i+3] < 50) continue;
        r+=d[i]; g+=d[i+1]; b+=d[i+2]; n++;
      }
      return n ? [r/n|0, g/n|0, b/n|0] : [140,100,70];
    }

    const hair = avgRgb(10, 0, 22, 7);
    const skin = avgRgb(10, 9, 22, 22);
    const eye  = avgRgb(11, 10, 16, 14);
    const dk   = ([r,g,b], f=0.6) => [r*f|0, g*f|0, b*f|0];
    const md   = ([r,g,b], f=0.82) => [r*f|0, g*f|0, b*f|0];

    // Class outfit colors
    const OUTFITS = {
      guerrero: [[190,30,30],[120,12,12]],
      mago:     [[110,30,210],[65,12,140]],
      arquero:  [[35,150,60],[18,95,38]],
      sanador:  [[200,240,225],[140,195,175]],
    };
    const [oMain, oDark] = OUTFITS[classe] || OUTFITS.guerrero;

    // Color palette by index
    const P = {
      1: hair, 2: skin, 3: eye,
      4: oMain, 5: oDark,
      6: [52,36,20],       // boots
      7: md(skin),         // skin shadow
      8: [16,8,8],         // outline
      9: dk(hair),         // hair shadow
    };

    // 12×20 sprite template
    const T = [
      [0,0,0,8,1,1,1,1,8,0,0,0],
      [0,0,8,1,1,1,1,1,1,8,0,0],
      [0,8,9,1,1,1,1,1,1,9,8,0],
      [0,8,2,2,2,2,2,2,2,2,8,0],
      [0,8,2,3,2,2,2,2,3,2,8,0],
      [0,8,2,2,2,2,2,2,2,2,8,0],
      [0,8,2,7,2,2,2,2,7,2,8,0],
      [0,0,8,2,2,2,2,2,2,8,0,0],
      [0,0,0,8,2,8,8,2,8,0,0,0],
      [0,0,0,0,2,2,2,2,0,0,0,0],
      [0,8,4,4,4,4,4,4,4,4,8,0],
      [0,4,4,5,4,4,4,4,5,4,4,0],
      [0,4,4,5,4,4,4,4,5,4,4,0],
      [0,4,4,4,4,4,4,4,4,4,4,0],
      [0,0,5,5,0,0,0,0,5,5,0,0],
      [0,0,5,5,0,0,0,0,5,5,0,0],
      [0,0,5,5,0,0,0,0,5,5,0,0],
      [0,0,6,6,0,0,0,0,6,6,0,0],
      [0,6,6,6,0,0,0,0,6,6,6,0],
      [0,8,8,8,0,0,0,0,8,8,8,0],
    ];

    const SCALE = 5; // 60×100 output
    const out = document.createElement('canvas');
    out.width = 12 * SCALE; out.height = 20 * SCALE;
    const octx = out.getContext('2d');
    octx.imageSmoothingEnabled = false;
    octx.clearRect(0, 0, out.width, out.height);

    T.forEach((row, ri) => row.forEach((ci, ci2) => {
      if (!ci) return;
      const c = P[ci]; if (!c) return;
      octx.fillStyle = `rgb(${c[0]},${c[1]},${c[2]})`;
      octx.fillRect(ci2 * SCALE, ri * SCALE, SCALE, SCALE);
    }));

    callback(out.toDataURL());
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
    // Height — convert imperial to cm if needed
    if (ob.alturaUnit === 'ft') {
      const ft  = parseFloat(document.getElementById('ob-altura-ft').value) || 0;
      const inc = parseFloat(document.getElementById('ob-altura-in').value) || 0;
      ob.altura = Math.round((ft * 12 + inc) * 2.54);
    } else {
      ob.altura = parseFloat(document.getElementById('ob-altura').value) || 0;
    }
    // Weight — convert lbs to kg if needed
    const rawPeso = parseFloat(document.getElementById('ob-peso').value) || 0;
    ob.peso = ob.pesoUnit === 'lbs' ? Math.round(rawPeso / 2.20462) : rawPeso;
    ob.edad = parseInt(document.getElementById('ob-edad').value) || 0;
    ob.sexo = document.getElementById('ob-sexo').value;
    if (ob.peso < 20 || ob.altura < 100 || ob.edad < 10) { showToast('Fill in all physical data!'); return; }
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

  // Generate Pokémon-style pixel character if photo was taken
  if (ob.rawPhotoData) {
    generatePixelCharacter(ob.rawPhotoData, ob.clase, charData => {
      if (charData) {
        G.profile.avatarData  = charData;
        G.profile.rawPhotoData = ob.rawPhotoData;
        saveGame();
      }
      initMainGame();
    });
  } else {
    initMainGame();
  }
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
  renderMiniHUD();
  renderCharacterPage();
  renderFriendsTab();
  renderLibreTab();
  renderDiscoverFeed();

  setInterval(() => {
    applyDecay();
    saveGame();
    renderMiniHUD();
    renderCharacterPage();
  }, DECAY_INTERVAL);

  showPage('main');
  if (window.Music) setTimeout(() => window.Music.play('overworld'), 500);
}

// ─── Page Navigation ──────────────────────────────────────────────────────────────

const TOP_PAGES = ['main','battle','friends','discover','settings'];

window.showPage = function(name) {
  // Hide all pages
  document.querySelectorAll('.game-page').forEach(p => p.classList.remove('active'));
  // Deactivate all nav buttons
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

  // Find the page
  const pageEl = document.getElementById('page-' + name);
  if (pageEl) pageEl.classList.add('active');

  // Highlight nav button for top-level pages
  const navBtn = document.getElementById('nav-btn-' + name);
  if (navBtn) navBtn.classList.add('active');

  // Render content
  if (name === 'main')             renderCharacterPage();
  if (name === 'friends')          { renderFriendsTab(); renderLeaderboard(); }
  if (name === 'discover')         renderDiscoverFeed();
  if (name === 'battle')           renderLibreTab();
  if (name === 'settings')         renderSettingsAccount();
  if (name === 'settings-account') renderSettingsAccount();
  if (name === 'settings-avatar')  renderSettingsAvatarPage();
  if (name === 'settings-shop')    renderShopTab(null);
};

window.showBattleSub = function(sub) {
  document.getElementById('battle-choice-grid').classList.add('hidden');
  document.querySelectorAll('.battle-sub').forEach(s => s.classList.add('hidden'));
  const el = document.getElementById('battle-sub-' + sub);
  if (el) el.classList.remove('hidden');
};

window.hideBattleSub = function() {
  document.getElementById('battle-choice-grid').classList.remove('hidden');
  document.querySelectorAll('.battle-sub').forEach(s => s.classList.add('hidden'));
};

window.showLeaderboard = function() {
  renderLeaderboard();
  document.getElementById('leaderboard-overlay').classList.remove('hidden');
};

window.hideLeaderboard = function() {
  document.getElementById('leaderboard-overlay').classList.add('hidden');
};

// ─── Mini HUD ─────────────────────────────────────────────────────────────────────

function renderMiniHUD() {
  if (!G || !G.profile) return;
  const c = G.char;

  document.getElementById('mhud-name').textContent    = G.profile.heroeNombre.toUpperCase();
  document.getElementById('mhud-level').textContent   = c.nivel;
  document.getElementById('mhud-coins').textContent   = c.monedas;
  document.getElementById('mhud-streak').textContent  = c.racha;

  const mhudAv = document.getElementById('mhud-avatar');
  if (G.profile.avatarData) {
    mhudAv.innerHTML = `<img src="${G.profile.avatarData}" style="width:32px;height:32px;image-rendering:pixelated">`;
  } else {
    mhudAv.innerHTML = `<span style="font-size:22px">${CLASS_SPRITE[G.profile.clase]}</span>`;
  }

  // HP bar
  const hpPct = c.hp / c.hpMax;
  const hpBar = document.getElementById('bar-hp');
  hpBar.style.width      = (hpPct * 100) + '%';
  hpBar.style.background = hpPct > 0.5 ? 'var(--hp-green)' : hpPct > 0.25 ? 'var(--hp-yellow)' : 'var(--hp-red)';
  document.getElementById('val-hp').textContent = c.hp + '/' + c.hpMax;

  // XP bar
  const xpPct = c.exp / c.expNext;
  document.getElementById('bar-xp').style.width = (xpPct * 100) + '%';
  document.getElementById('val-xp').textContent = c.exp + '/' + c.expNext;
}

// ─── Character Page ────────────────────────────────────────────────────────────────

function renderCharacterPage() {
  if (!G || !G.profile) return;
  const c = G.char;

  // Big character display
  const disp = document.getElementById('char-display');
  if (G.profile.avatarData) {
    disp.innerHTML = `<img src="${G.profile.avatarData}" class="char-big-img" alt="character">`;
  } else {
    disp.innerHTML = `<div class="char-big-emoji">${CLASS_SPRITE[G.profile.clase]}</div>`;
  }

  document.getElementById('char-hero-name').textContent  = G.profile.heroeNombre.toUpperCase();
  document.getElementById('char-class-tag').textContent  = (CLASS_NAME_EN[G.profile.clase]||'').toUpperCase();

  // Mood
  let mood = '😊';
  if (c.hambre < 20 && c.sed < 20) mood = '😵';
  else if (c.hambre < 30)           mood = '😩';
  else if (c.sed < 30)              mood = '😰';
  else if (c.hp < c.hpMax * 0.25)  mood = '😤';
  else if (c.hambre > 70 && c.sed > 70 && c.hp > c.hpMax * 0.7) mood = '😄';
  document.getElementById('char-mood').textContent = mood;

  // Stats strip
  document.getElementById('char-stats-strip').innerHTML = `
    <span>⚔️ ${c.ataque}</span>
    <span>🛡️ ${c.defensa}</span>
    <span>⚡ ${c.agilidad}</span>
    <span>💪 ${c.fuerza}</span>
    <span>🪙 ${c.monedas}</span>
  `;

  renderDailyGoals();
  renderBattleHistoryMini();
}

// Old renderHUD stub for battle.js compatibility
function renderHUD() { renderMiniHUD(); }

function renderHomeTab() { renderCharacterPage(); }
function renderHomeChar() { renderCharacterPage(); }

function renderHouseItems() {} // no-op (house removed)


// ─── HOME TAB (redirects to character page) ────────────────────────────────────────

function renderDailyGoals() {
  const el = document.getElementById('daily-goals');
  if (!el || !G || !G.profile) return;
  // Show achievement count for today
  const todayAch = (G.achievements || []).filter(a => {
    const d = new Date(a.fecha); d.setHours(0,0,0,0);
    const t = new Date(); t.setHours(0,0,0,0);
    return d.getTime() === t.getTime();
  });
  const totalCoinsToday = todayAch.reduce((s,a) => s + a.coins, 0);
  el.innerHTML = `
    <div class="goal-row"><span>🌟 Today's achievements</span><strong>${todayAch.length}</strong></div>
    <div class="goal-row"><span>🪙 Coins earned today</span><strong>+${totalCoinsToday}</strong></div>
    <div class="goal-row"><span>🏆 Total battles won</span><strong>${G.char.ganadasTotal}</strong></div>
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

// ─── Achievement / Earn Coins System ─────────────────────────────────────────────

let earnPhotoData = null;

window.triggerEarnCamera = function() { document.getElementById('earn-input-camera').click(); };
window.triggerEarnLibrary = function() { document.getElementById('earn-input-library').click(); };

window.handleEarnPhoto = function(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    earnPhotoData = ev.target.result;
    const prev = document.getElementById('earn-preview');
    prev.src = earnPhotoData;
    prev.classList.remove('hidden');
  };
  reader.readAsDataURL(file);
};

// Points awarded per category
const EARN_POINTS = {
  sport: { coins: 80, xp: 60, label: '🏆 Sport' },
  healthy_food: { coins: 30, xp: 25, label: '🥗 Healthy Eating' },
  workout: { coins: 50, xp: 40, label: '💪 Workout' },
  adventure: { coins: 70, xp: 55, label: '🌍 Adventure' },
  social: { coins: 25, xp: 20, label: '🎉 Social' },
  skill: { coins: 45, xp: 35, label: '🎨 Skill' },
  other: { coins: 20, xp: 15, label: '⚡ Activity' },
};

window.submitAchievement = function() {
  const type = document.getElementById('earn-type').value;
  const desc = document.getElementById('earn-desc').value.trim();
  if (!desc) { showToast('Describe your achievement!'); return; }

  const pts = EARN_POINTS[type] || EARN_POINTS.other;
  // Bonus if photo attached
  const photoBonus = earnPhotoData ? Math.round(pts.coins * 0.3) : 0;
  const totalCoins = pts.coins + photoBonus;
  const totalXP    = pts.xp + (earnPhotoData ? Math.round(pts.xp * 0.3) : 0);

  // Apply rewards
  G.char.monedas += totalCoins;
  G.char.exp     += totalXP;
  G.char.hp       = Math.min(G.char.hpMax, G.char.hp + 5);
  G.char.racha    = Math.max(0, G.char.racha);

  // Save achievement to feed
  const achievement = {
    id: Date.now(),
    user: G.profile ? G.profile.nombre : 'Player',
    heroName: G.profile ? G.profile.heroeNombre : 'Hero',
    clase: G.profile ? G.profile.clase : 'guerrero',
    avatarData: G.profile ? G.profile.avatarData : null,
    type, category: pts.label,
    desc, photo: earnPhotoData,
    coins: totalCoins, xp: totalXP,
    fecha: Date.now(),
  };

  // Store in achievements list
  if (!G.achievements) G.achievements = [];
  G.achievements.unshift(achievement);

  // Also add to global discover feed (localStorage)
  try {
    const feed = JSON.parse(localStorage.getItem('hv_discover_feed') || '[]');
    feed.unshift(achievement);
    if (feed.length > 50) feed.length = 50;
    localStorage.setItem('hv_discover_feed', JSON.stringify(feed));
  } catch(e) {}

  checkLevelUp();
  saveGame();
  renderMiniHUD();
  renderCharacterPage();
  renderDiscoverFeed();

  // Reset form
  document.getElementById('earn-desc').value = '';
  document.getElementById('earn-preview').classList.add('hidden');
  earnPhotoData = null;
  document.getElementById('earn-input-camera').value = '';
  document.getElementById('earn-input-library').value = '';

  showModal(`
    <span style="font-size:40px">🌟</span>
    <h2 style="color:var(--gold);margin:12px 0">ACHIEVEMENT LOGGED!</h2>
    <div style="line-height:2.4;margin:8px 0">
      ${pts.label}<br>
      +${totalCoins} 🪙 coins<br>
      +${totalXP} ⚡ EXP<br>
      ${photoBonus > 0 ? `<span style="color:var(--green)">📸 Photo bonus included!</span>` : ''}
    </div>
    <div style="font-size:7px;color:var(--gray)">Keep living cool — the world is watching!</div>
  `);

  hideBattleSub();
};

// ─── Discover Feed ────────────────────────────────────────────────────────────────

function renderDiscoverFeed() {
  const el = document.getElementById('discover-feed');
  if (!el) return;
  let feed = [];
  try { feed = JSON.parse(localStorage.getItem('hv_discover_feed') || '[]'); } catch(e) {}

  if (!feed.length) {
    el.innerHTML = '<div class="empty-state">No achievements yet.<br>Be the first to post!</div>';
    return;
  }

  el.innerHTML = feed.map(a => {
    const timeAgo = formatTimeAgo(a.fecha);
    return `
    <div class="feed-card">
      <div class="feed-card-header">
        <div class="feed-avatar">
          ${a.avatarData
            ? `<img src="${a.avatarData}" style="width:36px;height:36px;image-rendering:pixelated">`
            : `<span style="font-size:22px">${CLASS_SPRITE[a.clase]||'⚔️'}</span>`}
        </div>
        <div class="feed-user-info">
          <div class="feed-username">${a.heroName || a.user}</div>
          <div class="feed-meta">${a.category} · ${timeAgo}</div>
        </div>
        <div class="feed-coins">+${a.coins} 🪙</div>
      </div>
      <div class="feed-desc">${a.desc}</div>
      ${a.photo ? `<img class="feed-photo" src="${a.photo}" alt="achievement">` : ''}
    </div>`;
  }).join('');
}

function formatTimeAgo(ts) {
  const diff = Date.now() - ts;
  if (diff < 60000)   return 'just now';
  if (diff < 3600000) return Math.floor(diff/60000) + 'm ago';
  if (diff < 86400000) return Math.floor(diff/3600000) + 'h ago';
  return Math.floor(diff/86400000) + 'd ago';
}

// ─── Leaderboard ─────────────────────────────────────────────────────────────────

function renderLeaderboard() {
  const el = document.getElementById('leaderboard-list');
  if (!el) return;

  // Collect all known accounts from localStorage
  const accounts = [];
  try {
    const accs = JSON.parse(localStorage.getItem('hv_accounts') || '{}');
    Object.values(accs).forEach(acc => {
      const saveKey = 'heroeVital_v1_' + acc.displayName;
      const altKey  = 'heroeVital_v1';
      let save = null;
      try { save = JSON.parse(localStorage.getItem(saveKey)); } catch(e) {}
      if (!save) try { save = JSON.parse(localStorage.getItem(altKey)); } catch(e) {}
      if (save && save.profile) {
        accounts.push({
          username: acc.displayName,
          heroName: save.profile.heroeNombre || acc.displayName,
          clase: save.profile.clase || 'guerrero',
          nivel: save.char ? save.char.nivel : 1,
          monedas: save.char ? save.char.monedas : 0,
          wins: save.char ? save.char.ganadasTotal : 0,
          avatarData: save.profile.avatarData || null,
          achievements: (save.achievements || []).length,
        });
      }
    });
  } catch(e) {}

  // Sort by nivel then coins
  accounts.sort((a,b) => b.nivel !== a.nivel ? b.nivel - a.nivel : b.monedas - a.monedas);

  if (!accounts.length) {
    el.innerHTML = '<div class="empty-state">No players yet.<br>Be the first!</div>';
    return;
  }

  const medals = ['🥇','🥈','🥉'];
  el.innerHTML = accounts.map((a, i) => `
    <div class="leaderboard-card ${i < 3 ? 'lb-top-'+i : ''}">
      <div class="lb-rank">${medals[i] || '#'+(i+1)}</div>
      <div class="lb-avatar">
        ${a.avatarData
          ? `<img src="${a.avatarData}" style="width:40px;height:40px;image-rendering:pixelated">`
          : `<span style="font-size:26px">${CLASS_SPRITE[a.clase]||'⚔️'}</span>`}
      </div>
      <div class="lb-info">
        <div class="lb-name">${a.heroName}</div>
        <div class="lb-stats">LV.${a.nivel} | 🪙 ${a.monedas} | 🏆 ${a.wins} wins</div>
      </div>
      <div class="lb-badge">⭐×${a.achievements}</div>
    </div>`).join('');
}

// ─── Settings Renders ─────────────────────────────────────────────────────────────

function renderSettingsAccount() {
  const el = document.getElementById('settings-account-content');
  if (!el || !window.currentUser) return;
  el.innerHTML = `
    <div class="panel" style="max-width:400px;margin:12px auto">
      <div class="panel-title">👤 YOUR ACCOUNT</div>
      <div class="profile-row"><span>USERNAME</span><strong>${window.currentUser.displayName}</strong></div>
      <div class="profile-row"><span>EMAIL</span><strong>${window.currentUser.email || 'Not linked'}</strong></div>
      <div class="profile-row"><span>ONLINE ID</span><strong style="font-size:7px;color:var(--blue)">${window.currentUser.peerId || '—'}</strong></div>
      <hr class="panel-divider">
      <div class="panel-title">📊 HERO STATS</div>
      ${G && G.profile ? `
        <div class="profile-row"><span>HERO</span><strong>${G.profile.heroeNombre}</strong></div>
        <div class="profile-row"><span>CLASS</span><strong>${(CLASS_NAME_EN[G.profile.clase]||'').toUpperCase()}</strong></div>
        <div class="profile-row"><span>LEVEL</span><strong>${G.char.nivel}</strong></div>
        <div class="profile-row"><span>COINS</span><strong>🪙 ${G.char.monedas}</strong></div>
        <div class="profile-row"><span>WINS</span><strong>🏆 ${G.char.ganadasTotal}</strong></div>
        <div class="profile-row"><span>STREAK</span><strong>🔥 ${G.char.racha} days</strong></div>
      ` : ''}
    </div>
  `;
}

function renderSettingsAvatarPage() {
  const el = document.getElementById('settings-avatar-preview');
  if (!el || !G || !G.profile) return;
  if (G.profile.avatarData) {
    el.innerHTML = `<img src="${G.profile.avatarData}" class="settings-avatar-img" alt="avatar">`;
  } else {
    el.innerHTML = `<div style="font-size:72px">${CLASS_SPRITE[G.profile.clase]}</div>`;
  }
}

window.triggerSettingsCamera = function() { document.getElementById('settings-avatar-camera').click(); };
window.triggerSettingsLibrary = function() { document.getElementById('settings-avatar-library').click(); };

window.handleSettingsAvatarPhoto = function(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    const rawData = ev.target.result;
    generatePixelCharacter(rawData, G.profile.clase, charData => {
      if (charData) {
        G.profile.avatarData   = charData;
        G.profile.rawPhotoData = rawData;
        saveGame();
        renderSettingsAvatarPage();
        renderMiniHUD();
        renderCharacterPage();
        showToast('Avatar updated!');
      }
    });
  };
  reader.readAsDataURL(file);
};

window.toggleMusic = function() {
  if (window.Music) {
    const on = window.Music.toggle();
    const btn = document.getElementById('music-toggle-btn');
    if (btn) btn.textContent = on ? 'ON' : 'OFF';
  }
};

window.logoutGame = function() {
  if (window.logoutUser) window.logoutUser();
};

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
      <span style="font-size:40px">🌟</span>
      <h2 style="color:var(--gold);margin:12px 0">LEVEL UP!</h2>
      <div style="color:var(--gold);font-size:18px;margin:8px 0">LEVEL ${G.char.nivel}</div>
      <div style="line-height:2.5">
        ⚔️ ATK +2 | 🛡️ DEF +2<br>
        ⚡ AGI +1 | 💪 STR +2<br>
        ❤️ HP MAX +15 | 🪙 +30
      </div>
    `);
  }
}

function todayRegistros() {
  if (!G) return [];
  const today = new Date(); today.setHours(0,0,0,0);
  return (G.registros || []).filter(r => {
    const d = new Date(r.fecha); d.setHours(0,0,0,0);
    return d.getTime() === today.getTime();
  });
}

function checkDailyGoal() { /* no-op — replaced by achievement system */ }


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
  renderMiniHUD();
  renderShopTab(null);
  showToast(`${item.emoji} ${item.nombre} purchased!`);
}

// ─── LIBRE TAB ────────────────────────────────────────────────────────────────────

function renderLibreTab() {
  if (!G || !G.profile) return;
  const list = document.getElementById('opponents-list');
  if (!list) return;
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
  renderMiniHUD();
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
