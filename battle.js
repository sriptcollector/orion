/* ═══════════════════════════════════════════════════════════════════════════════════
   VITAL HERO — battle.js
   Pokémon B&W-style turn-based battle with chat, flash effects, and particles
   ═══════════════════════════════════════════════════════════════════════════════════ */

'use strict';

// ─── Battle State ─────────────────────────────────────────────────────────────────

let BT = {
  active:     false,
  enemy:      null,
  playerHP:   0, playerHPMax: 0,
  enemyHP:    0, enemyHPMax:  0,
  playerAtk:  0, playerDef:   0,
  enemyAtk:   0, enemyDef:    0,
  defending:  false,
  playerTurn: true,
  processing: false,
  onlineMode: false,
  onlineConn: null,
};

const MOVE_NAMES = {
  normal:  ['Direct Strike', 'Charge', 'Quick Attack', 'Power Slam'],
  special: ['Ancestral Ray', 'Fatal Blow', 'Dark Magic', 'Elemental Fury'],
  defend:  ['Defensive Stance', 'Arcane Barrier', 'Tactical Shield', 'Total Guard'],
};

const CPU_TRASH_TALK = [
  "Ha! Is that all you got? 😏",
  "Pathetic! Come on!",
  "I've been waiting for this!",
  "You can't stop me! 💪",
  "Getting tired already? 😂",
  "My grandma fights harder than that!",
  "Better luck next time!",
  "Your moves are SO predictable!",
  "GG? More like EZ! 😎",
  "Fight for real!",
  "Ouch! That actually hurt a little...",
  "Is that your best move?! 🤣",
];

const CPU_REACTION_HIT = [
  "Ooh, that stings! 😤",
  "Lucky shot! Won't happen again!",
  "I felt that one...",
  "You got me! But I'm not done!",
  "Impressive... for a beginner! 😒",
];

// ─── Start Battle ─────────────────────────────────────────────────────────────────

window.startBattle = function(enemy) {
  if (!G || !G.profile) return;
  const c = G.char;

  // Penalties for hunger/thirst
  const penalty = (c.hambre < 30 ? 3 : 0) + (c.sed < 30 ? 2 : 0);

  BT = {
    active:      true,
    enemy,
    playerHP:    c.hp,
    playerHPMax: c.hpMax,
    enemyHP:     enemy.hpMax,
    enemyHPMax:  enemy.hpMax,
    playerAtk:   Math.max(1, c.ataque  - penalty),
    playerDef:   Math.max(1, c.defensa - Math.floor(penalty/2)),
    enemyAtk:    enemy.ataque,
    enemyDef:    enemy.defensa,
    defending:   false,
    playerTurn:  true,
    processing:  false,
    onlineMode:  false,
    onlineConn:  null,
  };

  // Switch screens
  document.getElementById('screen-game').classList.remove('active');
  document.getElementById('screen-battle').classList.add('active');

  // Setup sprites
  document.getElementById('b-player-name').textContent  = G.profile.heroeNombre.toUpperCase();
  document.getElementById('b-player-lv').textContent    = c.nivel;
  document.getElementById('b-enemy-name').textContent   = enemy.nombre.toUpperCase();
  document.getElementById('b-enemy-lv').textContent     = enemy.nivel || 1;
  document.getElementById('b-player-sprite').textContent = CLASS_SPRITE[G.profile.clase] || '⚔️';
  document.getElementById('b-enemy-sprite').textContent  = CLASS_SPRITE[enemy.clase]     || '🧙';

  // Clear chat
  const chatLog = document.getElementById('chat-log');
  if (chatLog) chatLog.innerHTML = '';

  updateBattleHPBars();
  enableBattleMoves(true);

  // Switch to battle music
  if (window.Music) window.Music.play('battle');

  // Bind buttons
  document.getElementById('btn-attack-normal').onclick  = () => playerMove('normal');
  document.getElementById('btn-attack-special').onclick = () => playerMove('special');
  document.getElementById('btn-defend').onclick         = () => playerMove('defend');
  document.getElementById('btn-flee').onclick           = () => playerFlee();

  // Entrance: battle flash
  setTimeout(() => flashScreen(), 100);
  setTimeout(() => setBattleMessage(`${enemy.nombre} wants to battle!`), 200);
  setTimeout(() => setBattleMessage('The battle begins!'), 1900);

  // CPU says something at battle start
  setTimeout(() => {
    addChatMsg(enemy.nombre, rnd(CPU_TRASH_TALK), 'enemy');
  }, 2500);
};

// ─── Online battle ────────────────────────────────────────────────────────────────

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

  if (type === 'defend') {
    setBattleMessage(`${G.profile.heroeNombre} uses ${moveName}! Defense raised.`);
    animateSprite('player', 'attack');
    setTimeout(() => enemyTurn(), 1500);
    BT.processing = false;
    return;
  }

  const isCrit = Math.random() < 0.1;
  const mult   = type === 'special' ? 1.5 : 1.0;
  const damage = Math.max(1, Math.round((BT.playerAtk * mult - BT.enemyDef * 0.4 + rndInt(1,8)) * (isCrit ? 2 : 1)));

  BT.enemyHP = Math.max(0, BT.enemyHP - damage);

  const msg = isCrit
    ? `${G.profile.heroeNombre} uses ${moveName}! CRITICAL HIT! -${damage} HP ⚡`
    : `${G.profile.heroeNombre} uses ${moveName}! -${damage} HP to enemy.`;

  animateSprite('player', 'attack');

  setTimeout(() => {
    animateSprite('enemy', 'shake');
    spawnDamageNumber(damage, false, isCrit);
    setBattleMessage(msg);
    updateBattleHPBars();
    flashScreen(isCrit ? 'gold' : null);

    if (type === 'special') {
      spawnParticles(72, 35, 10, isCrit ? '#ffaa00' : '#8844ff');
    }

    // CPU reacts to getting hit
    if (Math.random() < 0.35) {
      setTimeout(() => addChatMsg(BT.enemy.nombre, rnd(CPU_REACTION_HIT), 'enemy'), 400);
    }

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
  const damage = Math.max(1, Math.round((BT.enemyAtk - BT.playerDef * 0.35 + rndInt(1,6)) * (isCrit ? 2 : 1) * defMult));

  BT.playerHP = Math.max(0, BT.playerHP - damage);

  const msg = isCrit
    ? `${BT.enemy.nombre} uses ${move}! CRITICAL! -${damage} HP ⚡`
    : `${BT.enemy.nombre} uses ${move}! -${damage} HP to ${G.profile.heroeNombre}.`;

  animateSprite('enemy', 'attack');

  setTimeout(() => {
    animateSprite('player', 'shake');
    spawnDamageNumber(damage, true, isCrit);
    setBattleMessage(msg);
    updateBattleHPBars();
    flashScreen('red');
    shakeScreen();

    if (type === 'special') {
      spawnParticles(28, 65, 8, isCrit ? '#ffaa00' : '#ff3355');
    }

    // CPU trash talk after hitting
    if (Math.random() < 0.3) {
      setTimeout(() => addChatMsg(BT.enemy.nombre, rnd(CPU_TRASH_TALK), 'enemy'), 400);
    }

    BT.defending  = false;
    BT.playerTurn = true;
    BT.processing = false;

    setTimeout(() => {
      if (BT.playerHP <= 0) {
        battleEnd('derrota');
      } else {
        enableBattleMoves(true);
      }
    }, 900);
  }, 400);
}

// ─── Online received move ─────────────────────────────────────────────────────────

window.receiveOnlineMove = function(move) {
  if (!BT.active || BT.onlineMode) return;
  executeMovePlayer(move);
};

// ─── Flee ─────────────────────────────────────────────────────────────────────────

function playerFlee() {
  if (!BT.active || !BT.playerTurn || BT.processing) return;
  if (Math.random() < 0.5) {
    setBattleMessage(`${G.profile.heroeNombre} flees the battle... 😨`);
    addChatMsg(BT.enemy.nombre, "Running away already?! 😂 Coward!", 'enemy');
    setTimeout(() => endBattleScreen('empate'), 1500);
  } else {
    setBattleMessage("Can't escape! 😱");
    addChatMsg(BT.enemy.nombre, "You're not going anywhere! 😈", 'enemy');
    setTimeout(() => { BT.processing = false; enableBattleMoves(true); }, 1200);
  }
}

// ─── Battle End ───────────────────────────────────────────────────────────────────

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

  G.char.hp = Math.max(1, Math.round(BT.playerHP * 0.7 + BT.playerHPMax * 0.1));

  const expGain = resultado === 'victoria' ? 20 + (enemy.nivel||1)*6
                : resultado === 'derrota'  ? 5
                : 8;
  G.char.exp += expGain;

  const msgs = {
    victoria: `${G.profile.heroeNombre} WON THE BATTLE! 🏆`,
    derrota:  `${G.profile.heroeNombre} was defeated... 💀`,
    empate:   'The battle ended in a draw! 🤝',
  };
  setBattleMessage(msgs[resultado]);

  // End chat message
  const endTalk = {
    victoria: ["Good game! You're strong. 🏆", "Well played! You beat me fair and square.", "I'll get you next time! 😤"],
    derrota:  ["GG! Better luck next time! 😂", "Easy! Come back when you're stronger!", "Maybe eat more before next battle? 😏"],
    empate:   ["That was intense! 🤝", "A draw? I'll take it!", "We're evenly matched!"],
  };
  setTimeout(() => addChatMsg(enemy.nombre, rnd(endTalk[resultado]), 'enemy'), 500);

  if (window.onlineModule && BT.onlineConn) {
    BT.onlineConn.send({ type: 'battle_end', resultado });
  }

  // Play victory music
  if (resultado === 'victoria' && window.Music) {
    setTimeout(() => window.Music.play('victory'), 200);
  }

  setTimeout(() => endBattleScreen(resultado, monedasGanadas, monedasPerdidas, expGain), 2500);
}

function endBattleScreen(resultado, mGanadas=0, mPerdidas=0, expGain=0) {
  const enemy       = BT.enemy;
  const isLibre     = enemy && enemy.esLibre;
  const resultEmoji = { victoria:'🏆', derrota:'💀', empate:'🤝' }[resultado];
  const resultText  = { victoria:'VICTORY!', derrota:'DEFEAT', empate:'DRAW' }[resultado];
  const resultColor = { victoria:'var(--green)', derrota:'var(--red)', empate:'var(--gold)' }[resultado];

  let rewardsHtml = '';
  if (!isLibre) {
    if (resultado === 'victoria') {
      rewardsHtml = `<div style="color:var(--gold)">+${mGanadas} 🪙 coins stolen</div>`;
    } else if (resultado === 'derrota') {
      rewardsHtml = `<div style="color:var(--red)">-${mPerdidas} 🪙 coins lost</div>`;
    }
  } else {
    rewardsHtml = `<div style="color:var(--blue)">⚡ FREE BATTLE — No stakes</div>`;
  }

  showModal(`
    <span class="big-emoji">${resultEmoji}</span>
    <div class="result-${resultado}" style="color:${resultColor}">${resultText}</div>
    <div style="margin:14px 0;font-size:8px;line-height:2.6">
      vs <span style="color:var(--gold)">${enemy ? enemy.nombre : 'Rival'}</span><br>
      ${rewardsHtml}
      <div style="color:var(--xp-color)">+${expGain} EXP</div>
    </div>
  `);

  if (window.onBattleEnd) {
    window.onBattleEnd(resultado, enemy, mGanadas, mPerdidas);
  }

  setTimeout(() => {
    document.getElementById('screen-battle').classList.remove('active');
    document.getElementById('screen-game').classList.add('active');
    // Return to overworld music
    if (window.Music) window.Music.play('overworld');
    checkLevelUp();
    renderHUD();
  }, 500);
}

// ─── UI Helpers ───────────────────────────────────────────────────────────────────

function setBattleMessage(msg) {
  const el = document.getElementById('battle-message');
  el.textContent = '';
  let i = 0;
  const type = () => {
    if (i < msg.length) { el.textContent += msg[i++]; setTimeout(type, 22); }
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
  const id = who === 'player' ? 'b-player-sprite' : 'b-enemy-sprite';
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove('shake', 'attack');
  void el.offsetWidth;
  el.classList.add(anim);
  setTimeout(() => el.classList.remove(anim), 500);
}

function spawnDamageNumber(dmg, isPlayer, isCrit) {
  const arena = document.querySelector('.battle-arena');
  if (!arena) return;
  const el = document.createElement('div');
  el.className = `damage-number ${isPlayer ? 'player-dmg' : 'enemy-dmg'} ${isCrit ? 'critical' : ''}`;
  el.textContent = isCrit ? `💥 ${dmg}!` : `-${dmg}`;
  el.style.left  = isPlayer ? '20%' : '65%';
  el.style.top   = '35%';
  arena.appendChild(el);
  setTimeout(() => el.remove(), 1100);
}

function flashScreen(type) {
  const bg = document.getElementById('battle-bg');
  if (!bg) return;
  bg.classList.remove('flash', 'shake');
  void bg.offsetWidth;
  bg.classList.add('flash');
  setTimeout(() => bg.classList.remove('flash'), 300);
}

function shakeScreen() {
  const bg = document.getElementById('battle-bg');
  if (!bg) return;
  bg.classList.remove('shake');
  void bg.offsetWidth;
  bg.classList.add('shake');
  setTimeout(() => bg.classList.remove('shake'), 400);
}

function spawnParticles(xPct, yPct, count, color) {
  const arena = document.querySelector('.battle-arena');
  if (!arena) return;
  const colors = [color, '#ffffff', '#ffcc00', color];
  for (let i = 0; i < count; i++) {
    const p     = document.createElement('div');
    p.className = 'battle-particle';
    const angle = (Math.PI * 2 * i) / count + (Math.random() * 0.5);
    const dist  = 30 + Math.random() * 60;
    p.style.left       = xPct + '%';
    p.style.top        = yPct + '%';
    p.style.background = colors[i % colors.length];
    p.style.setProperty('--dx', (Math.cos(angle) * dist) + 'px');
    p.style.setProperty('--dy', (Math.sin(angle) * dist) + 'px');
    arena.appendChild(p);
    setTimeout(() => p.remove(), 600);
  }
}

// ─── Battle Chat ──────────────────────────────────────────────────────────────────

window.sendChatMsg = function(msg) {
  if (!BT.active || !G || !G.profile) return;
  addChatMsg(G.profile.heroeNombre, msg, 'player');
  // CPU responds sometimes
  if (Math.random() < 0.65) {
    setTimeout(() => {
      if (BT.active) addChatMsg(BT.enemy.nombre, rnd(CPU_TRASH_TALK), 'enemy');
    }, 700 + Math.random() * 1300);
  }
};

window.sendChatFromInput = function() {
  const input = document.getElementById('chat-input');
  const msg   = (input.value || '').trim();
  if (!msg) return;
  window.sendChatMsg(msg);
  input.value = '';
};

function addChatMsg(name, msg, type) {
  const log = document.getElementById('chat-log');
  if (!log) return;
  const el        = document.createElement('div');
  el.className    = `chat-msg chat-${type}`;
  el.innerHTML    = `<span class="chat-name">${name}:</span>${msg}`;
  log.appendChild(el);
  log.scrollTop   = log.scrollHeight;
}

// ─── Utilities ────────────────────────────────────────────────────────────────────

function rnd(arr)     { return arr[Math.floor(Math.random() * arr.length)]; }
function rndInt(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
