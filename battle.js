/* ═══════════════════════════════════════════════════════════════════════════════════
   HÉROE VITAL — battle.js
   Pokemon B&W2-style turn-based battle system
   ═══════════════════════════════════════════════════════════════════════════════════ */

'use strict';

// ─── Battle State ─────────────────────────────────────────────────────────────────

let BT = {
  active:    false,
  enemy:     null,
  playerHP:  0,  playerHPMax: 0,
  enemyHP:   0,  enemyHPMax:  0,
  playerAtk: 0,  playerDef:   0,
  enemyAtk:  0,  enemyDef:    0,
  defending: false,
  playerTurn:true,
  queue:     [],    // queued message steps
  processing:false,
  onlineMode:false,
  onlineConn:null,
};

const MOVE_NAMES = {
  normal:  ['Golpe Directo', 'Embestida', 'Ataque Rápido', 'Carga'],
  special: ['Rayo Ancestral', 'Golpe Fatal', 'Magia Oscura', 'Furia Elemental'],
  defend:  ['Postura Defensiva', 'Barrera Arcana', 'Escudo Táctico', 'Guardia Total'],
};

// ─── Start Battle ─────────────────────────────────────────────────────────────────

window.startBattle = function(enemy) {
  if (!G || !G.profile) return;
  const c = G.char;

  // Penalty for hunger/thirst
  const penalty = (c.hambre < 30 ? 3 : 0) + (c.sed < 30 ? 2 : 0);

  BT = {
    active:     true,
    enemy,
    playerHP:   c.hp,
    playerHPMax:c.hpMax,
    enemyHP:    enemy.hpMax,
    enemyHPMax: enemy.hpMax,
    playerAtk:  Math.max(1, c.ataque  - penalty),
    playerDef:  Math.max(1, c.defensa - Math.floor(penalty/2)),
    enemyAtk:   enemy.ataque,
    enemyDef:   enemy.defensa,
    defending:  false,
    playerTurn: true,
    queue:      [],
    processing: false,
    onlineMode: false,
    onlineConn: null,
  };

  // Show battle screen
  document.getElementById('screen-game').classList.remove('active');
  document.getElementById('screen-battle').classList.add('active');

  // Setup UI
  document.getElementById('b-player-name').textContent = G.profile.heroeNombre.toUpperCase();
  document.getElementById('b-player-lv').textContent   = c.nivel;
  document.getElementById('b-enemy-name').textContent  = enemy.nombre.toUpperCase();
  document.getElementById('b-enemy-lv').textContent    = enemy.nivel || 1;

  document.getElementById('b-player-sprite').textContent = CLASS_SPRITE[G.profile.clase] || '⚔️';
  document.getElementById('b-enemy-sprite').textContent  = CLASS_SPRITE[enemy.clase]     || '🧙';

  updateBattleHPBars();
  enableBattleMoves(true);

  const startMsg = window.t ? t('battle.start', {name: enemy.nombre}) : `¡${enemy.nombre} quiere combatir!`;
  setTimeout(() => setBattleMessage(startMsg), 100);
  setTimeout(() => setBattleMessage(window.t ? t('battle.begin') : '¡Comienza la batalla!'), 1800);

  // Bind buttons
  document.getElementById('btn-attack-normal').onclick  = () => playerMove('normal');
  document.getElementById('btn-attack-special').onclick = () => playerMove('special');
  document.getElementById('btn-defend').onclick         = () => playerMove('defend');
  document.getElementById('btn-flee').onclick           = () => playerFlee();
};

// ─── Online battle entry ─────────────────────────────────────────────────────────

window.startOnlineBattle = function(enemy, conn) {
  window.startBattle(enemy);
  BT.onlineMode = true;
  BT.onlineConn = conn;
  enableBattleMoves(true);
};

// ─── Player Move ─────────────────────────────────────────────────────────────────

function playerMove(type) {
  if (!BT.active || !BT.playerTurn || BT.processing) return;
  BT.processing = true;
  enableBattleMoves(false);

  if (BT.onlineMode && BT.onlineConn) {
    BT.onlineConn.send({ type: 'move', move: type });
  }

  executeMovePlayer(type);
}

function executeMovePlayer(type) {
  BT.defending = (type === 'defend');
  const moveName = rnd(MOVE_NAMES[type] || MOVE_NAMES.normal);

  let damage = 0;
  let msg    = '';

  if (type === 'defend') {
    msg = `${G.profile.heroeNombre} usa ${moveName}! Defensa aumentada.`;
    setBattleMessage(msg);
    animateSprite('player', 'attack');
    setTimeout(() => enemyTurn(), 1500);
    BT.processing = false;
    return;
  }

  const isCrit = Math.random() < 0.1;
  const mult   = type === 'special' ? 1.5 : 1.0;
  damage = Math.max(1, Math.round((BT.playerAtk * mult - BT.enemyDef * 0.4 + rndInt(1,8)) * (isCrit ? 2 : 1)));

  BT.enemyHP = Math.max(0, BT.enemyHP - damage);

  msg = isCrit
    ? `¡${G.profile.heroeNombre} usa ${moveName}! ¡GOLPE CRÍTICO! -${damage} PS ⚡`
    : `${G.profile.heroeNombre} usa ${moveName}! -${damage} PS al enemigo.`;

  animateSprite('player', 'attack');
  setTimeout(() => {
    animateSprite('enemy', 'shake');
    spawnDamageNumber(damage, false, isCrit);
    setBattleMessage(msg);
    updateBattleHPBars();
    setTimeout(() => {
      if (BT.enemyHP <= 0) {
        battleEnd('victoria');
      } else {
        BT.processing = false;
        setTimeout(() => enemyTurn(), 800);
      }
    }, 900);
  }, 400);
}

// ─── Enemy Turn ──────────────────────────────────────────────────────────────────

function enemyTurn() {
  if (!BT.active) return;
  BT.playerTurn = false;

  const type   = Math.random() < 0.2 ? 'special' : 'normal';
  const move   = rnd(MOVE_NAMES[type]);
  const isCrit = Math.random() < 0.08;
  const defMult= BT.defending ? 0.5 : 1.0;
  let damage   = Math.max(1, Math.round((BT.enemyAtk - BT.playerDef * 0.35 + rndInt(1,6)) * (isCrit ? 2 : 1) * defMult));

  BT.playerHP = Math.max(0, BT.playerHP - damage);

  const msg = isCrit
    ? `¡${BT.enemy.nombre} usa ${move}! ¡CRÍTICO! -${damage} PS ⚡`
    : `${BT.enemy.nombre} usa ${move}! -${damage} PS a ${G.profile.heroeNombre}.`;

  animateSprite('enemy', 'attack');
  setTimeout(() => {
    animateSprite('player', 'shake');
    spawnDamageNumber(damage, true, isCrit);
    setBattleMessage(msg);
    updateBattleHPBars();
    BT.defending   = false;
    BT.playerTurn  = true;
    BT.processing  = false;

    setTimeout(() => {
      if (BT.playerHP <= 0) {
        battleEnd('derrota');
      } else {
        enableBattleMoves(true);
      }
    }, 900);
  }, 400);
}

// ─── Online received move ────────────────────────────────────────────────────────

window.receiveOnlineMove = function(move) {
  if (!BT.active || BT.onlineMode) return;
  // In online mode, the "enemy" move is their player's choice
  executeMovePlayer(move);
};

// ─── Flee ────────────────────────────────────────────────────────────────────────

function playerFlee() {
  if (!BT.active || !BT.playerTurn || BT.processing) return;
  if (Math.random() < 0.5) {
    setBattleMessage(`${G.profile.heroeNombre} huye de la batalla... 😨`);
    setTimeout(() => endBattleScreen('empate'), 1500);
  } else {
    setBattleMessage('¡No puedes escapar! 😱');
    setTimeout(() => { BT.processing = false; enableBattleMoves(true); }, 1200);
  }
}

// ─── Battle End ──────────────────────────────────────────────────────────────────

function battleEnd(resultado) {
  BT.active = false;
  enableBattleMoves(false);

  const enemy = BT.enemy;
  let monedasGanadas = 0, monedasPerdidas = 0;

  if (!enemy.esLibre) {
    if (resultado === 'victoria') {
      monedasGanadas = Math.max(5, Math.round(enemy.monedas * (Math.random() * 0.07 + 0.08)));
    } else if (resultado === 'derrota') {
      monedasPerdidas = Math.max(3, Math.round(G.char.monedas * (Math.random() * 0.07 + 0.05)));
    }
  }

  // HP after battle
  G.char.hp = Math.max(1, Math.round(BT.playerHP * 0.7 + BT.playerHPMax * 0.1));

  const expGain = resultado === 'victoria' ? 20 + (enemy.nivel||1)*6
                : resultado === 'derrota'  ? 5
                : 8;
  G.char.exp += expGain;

  const hn = G.profile.heroeNombre;
  const msgs = {
    victoria: window.t ? t('battle.victory',{name:hn}) : `¡${hn} GANÓ LA BATALLA! 🏆`,
    derrota:  window.t ? t('battle.defeat', {name:hn}) : `${hn} fue derrotado... 💀`,
    empate:   window.t ? t('battle.draw')               : '¡La batalla terminó en empate! 🤝',
  };
  setBattleMessage(msgs[resultado]);

  if (window.onlineModule && BT.onlineConn) {
    BT.onlineConn.send({ type: 'battle_end', resultado });
  }

  setTimeout(() => endBattleScreen(resultado, monedasGanadas, monedasPerdidas, expGain), 2000);
}

function endBattleScreen(resultado, mGanadas=0, mPerdidas=0, expGain=0) {
  const enemy    = BT.enemy;
  const isLibre  = enemy && enemy.esLibre;

  const resultColor = { victoria:'var(--green)', derrota:'var(--red)', empate:'var(--gold)' }[resultado];
  const resultEmoji = { victoria:'🏆', derrota:'💀', empate:'🤝' }[resultado];
  const resultText  = { victoria:'¡VICTORIA!', derrota:'DERROTA', empate:'EMPATE' }[resultado];

  let rewardsHtml = '';
  if (!isLibre) {
    if (resultado === 'victoria') {
      rewardsHtml = `<div style="color:var(--gold)">+${mGanadas} 🪙 monedas robadas</div>`;
    } else if (resultado === 'derrota') {
      rewardsHtml = `<div style="color:var(--red)">-${mPerdidas} 🪙 monedas perdidas</div>`;
    }
  } else {
    rewardsHtml = `<div style="color:var(--blue)">⚡ BATALLA LIBRE - Sin apuestas</div>`;
  }

  showModal(`
    <span class="big-emoji">${resultEmoji}</span>
    <div class="result-${resultado}" style="color:${resultColor}">${resultText}</div>
    <div style="margin:14px 0;font-size:8px;line-height:2.5">
      vs <span style="color:var(--gold)">${enemy ? enemy.nombre : 'Rival'}</span><br>
      ${rewardsHtml}
      <div style="color:var(--xp-color)">+${expGain} EXP</div>
    </div>
  `);

  // Notify game.js
  if (window.onBattleEnd) {
    window.onBattleEnd(resultado, enemy, mGanadas, mPerdidas);
  }

  // Return to game screen
  setTimeout(() => {
    document.getElementById('screen-battle').classList.remove('active');
    document.getElementById('screen-game').classList.add('active');
    checkLevelUp();
    renderHUD();
  }, 500);
}

// ─── UI Helpers ──────────────────────────────────────────────────────────────────

function setBattleMessage(msg) {
  const el = document.getElementById('battle-message');
  el.textContent = '';
  // Typewriter effect
  let i = 0;
  const type = () => {
    if (i < msg.length) { el.textContent += msg[i++]; setTimeout(type, 25); }
  };
  type();
}

function updateBattleHPBars() {
  const pPct = Math.max(0, BT.playerHP / BT.playerHPMax);
  const ePct = Math.max(0, BT.enemyHP  / BT.enemyHPMax);

  const pBar = document.getElementById('b-player-hp-bar');
  const eBar = document.getElementById('b-enemy-hp-bar');

  pBar.style.width = (pPct * 100) + '%';
  eBar.style.width = (ePct * 100) + '%';

  pBar.style.background = pPct > 0.5 ? 'var(--hp-green)' : pPct > 0.25 ? 'var(--hp-yellow)' : 'var(--hp-red)';
  eBar.style.background = ePct > 0.5 ? 'var(--hp-green)' : ePct > 0.25 ? 'var(--hp-yellow)' : 'var(--hp-red)';

  document.getElementById('b-player-hp-val').textContent = BT.playerHP + '/' + BT.playerHPMax;
  document.getElementById('b-enemy-hp-val').textContent  = BT.enemyHP  + '/' + BT.enemyHPMax;
}

function enableBattleMoves(on) {
  ['btn-attack-normal','btn-attack-special','btn-defend','btn-flee'].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) btn.disabled = !on;
  });
}

function animateSprite(who, anim) {
  const id  = who === 'player' ? 'b-player-sprite' : 'b-enemy-sprite';
  const el  = document.getElementById(id);
  if (!el) return;
  el.classList.remove('shake','attack');
  void el.offsetWidth; // reflow
  el.classList.add(anim);
  setTimeout(() => el.classList.remove(anim), 400);
}

function spawnDamageNumber(dmg, isPlayer, isCrit) {
  const arena = document.querySelector('.battle-arena');
  if (!arena) return;
  const el = document.createElement('div');
  el.className = `damage-number ${isPlayer ? 'player-dmg' : 'enemy-dmg'} ${isCrit ? 'critical' : ''}`;
  el.textContent = isCrit ? `💥 ${dmg}!` : `-${dmg}`;
  el.style.left = isPlayer ? '25%' : '65%';
  el.style.top  = '40%';
  arena.appendChild(el);
  setTimeout(() => el.remove(), 1000);
}

// ─── Utilities ────────────────────────────────────────────────────────────────────

function rnd(arr)     { return arr[Math.floor(Math.random() * arr.length)]; }
function rndInt(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
