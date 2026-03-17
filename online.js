/* ═══════════════════════════════════════════════════════════════════════════════════
   HÉROE VITAL — online.js
   PeerJS P2P multiplayer: friend presence, battle challenges, real-time sync
   Uses the free peerjs.com signaling server (no server required)
   ═══════════════════════════════════════════════════════════════════════════════════ */

'use strict';

window.onlineModule = (() => {

  // ─── State ─────────────────────────────────────────────────────────────────────

  let peer        = null;
  let myPeerId    = null;
  let connections = {};  // peerId → DataConnection
  let pendingChallenge = null;  // incoming challenge info

  // ─── Init ──────────────────────────────────────────────────────────────────────

  function init() {
    if (typeof Peer === 'undefined') {
      console.warn('PeerJS not loaded — online features disabled');
      setStatus('offline');
      return;
    }

    setStatus('connecting');

    // Use username-based deterministic PeerID (from auth.js)
    // hv_{username} — same formula used in agregarAmigo()
    const base = window.currentUser
      ? window.currentUser.peerId
      : 'hv_guest_' + Math.random().toString(36).slice(2, 8);

    // Destroy previous peer if reinitializing
    if (peer) { try { peer.destroy(); } catch(e) {} }

    peer = new Peer(base, {
      debug: 0,
    });

    peer.on('open', id => {
      myPeerId = id;
      setStatus('connected');
      updatePeerIdDisplay(id);
      console.log('Online: connected as', id);
    });

    peer.on('connection', conn => {
      handleIncomingConnection(conn);
    });

    peer.on('error', err => {
      console.warn('PeerJS error:', err.type, err.message);
      if (err.type === 'peer-unavailable') {
        showToast('Rival no encontrado. Verifica el ID.');
      } else if (err.type === 'network' || err.type === 'server-error') {
        setStatus('offline');
        showToast('Error de conexión online.');
      }
    });

    peer.on('disconnected', () => {
      setStatus('connecting');
      setTimeout(() => { if (peer) peer.reconnect(); }, 3000);
    });

    peer.on('close', () => {
      setStatus('offline');
    });
  }

  // ─── Incoming connection handler ───────────────────────────────────────────────

  function handleIncomingConnection(conn) {
    conn.on('open', () => {
      connections[conn.peer] = conn;
    });

    conn.on('data', data => {
      if (!data || !data.type) return;

      switch (data.type) {

        case 'profile_request': {
          // Someone wants our profile data
          conn.send({ type: 'profile_data', profile: buildShareProfile() });
          break;
        }

        case 'profile_data': {
          // Update friend with their real data
          updateFriendData(conn.peer, data.profile);
          break;
        }

        case 'challenge': {
          // Incoming battle challenge
          pendingChallenge = { conn, enemyProfile: data.profile, isLibre: !!data.isLibre };
          showIncomingChallenge(data.profile, !!data.isLibre);
          break;
        }

        case 'challenge_accepted': {
          // They accepted our challenge — start battle
          const enemyForBattle = {
            id:       conn.peer,
            nombre:   data.profile ? data.profile.heroeNombre : 'Rival Online',
            clase:    data.profile ? data.profile.clase        : 'guerrero',
            nivel:    data.profile ? data.profile.nivel        : 1,
            ataque:   data.profile ? data.profile.ataque       : 12,
            defensa:  data.profile ? data.profile.defensa      : 10,
            agilidad: data.profile ? data.profile.agilidad     : 10,
            fuerza:   data.profile ? data.profile.fuerza       : 10,
            hpMax:    data.profile ? data.profile.hpMax        : 100,
            monedas:  data.profile ? data.profile.monedas      : 50,
            esLibre:  !!data.isLibre,
          };
          showToast('¡Rival aceptó! Comenzando batalla...');
          setTimeout(() => window.startOnlineBattle(enemyForBattle, conn), 1000);
          break;
        }

        case 'challenge_rejected': {
          showToast('El rival rechazó tu desafío.');
          hideIncomingChallenge();
          break;
        }

        case 'move': {
          // Online battle: received opponent's move
          if (window.receiveOnlineMove) window.receiveOnlineMove(data.move);
          break;
        }

        case 'battle_end': {
          // Sync battle result from opponent
          break;
        }

        case 'friend_add': {
          // Someone added us as friend
          showToast(`¡${data.nombre || 'Alguien'} te agregó como amigo!`);
          break;
        }
      }
    });

    conn.on('close', () => {
      delete connections[conn.peer];
      updateFriendOnlineStatus(conn.peer, false);
    });

    conn.on('error', err => {
      console.warn('Connection error:', err);
    });
  }

  // ─── Outgoing challenge ────────────────────────────────────────────────────────

  function sendChallenge(peerId, isLibre) {
    if (!peer || !myPeerId) { showToast('Conéctate online primero'); return; }

    const conn = peer.connect(peerId, { reliable: true });
    conn.on('open', () => {
      connections[peerId] = conn;
      conn.send({
        type:    'challenge',
        profile: buildShareProfile(),
        isLibre: !!isLibre,
      });
      handleIncomingConnection(conn);
    });
    conn.on('error', () => showToast('No se pudo conectar con ese rival'));
  }

  // ─── Accept / reject challenge ─────────────────────────────────────────────────

  window.acceptChallenge = function() {
    if (!pendingChallenge) return;
    const { conn, enemyProfile, isLibre } = pendingChallenge;
    pendingChallenge = null;
    hideIncomingChallenge();

    conn.send({ type: 'challenge_accepted', profile: buildShareProfile(), isLibre });

    const enemyForBattle = {
      id:       conn.peer,
      nombre:   enemyProfile ? enemyProfile.heroeNombre : 'Rival Online',
      clase:    enemyProfile ? enemyProfile.clase        : 'guerrero',
      nivel:    enemyProfile ? enemyProfile.nivel        : 1,
      ataque:   enemyProfile ? enemyProfile.ataque       : 12,
      defensa:  enemyProfile ? enemyProfile.defensa      : 10,
      agilidad: enemyProfile ? enemyProfile.agilidad     : 10,
      fuerza:   enemyProfile ? enemyProfile.fuerza       : 10,
      hpMax:    enemyProfile ? enemyProfile.hpMax        : 100,
      monedas:  enemyProfile ? enemyProfile.monedas      : 50,
      esLibre:  !!isLibre,
    };

    setTimeout(() => window.startOnlineBattle(enemyForBattle, conn), 600);
  };

  window.rejectChallenge = function() {
    if (!pendingChallenge) return;
    pendingChallenge.conn.send({ type: 'challenge_rejected' });
    pendingChallenge = null;
    hideIncomingChallenge();
    showToast('Desafío rechazado.');
  };

  // ─── Friend data sync ──────────────────────────────────────────────────────────

  function requestFriendData(peerId, localFriend) {
    if (!peer) return;
    const conn = peer.connect(peerId, { reliable: true });
    conn.on('open', () => {
      conn.send({ type: 'profile_request' });
      connections[peerId] = conn;
      handleIncomingConnection(conn);
    });
  }

  function updateFriendData(peerId, profile) {
    if (!G || !profile) return;
    const friend = G.amigos.find(a => a.peerId === peerId || a.id === peerId);
    if (friend) {
      friend.nombre      = profile.nombre      || friend.nombre;
      friend.heroeNombre = profile.heroeNombre || friend.heroeNombre;
      friend.clase       = profile.clase       || friend.clase;
      friend.nivel       = profile.nivel       || friend.nivel;
      friend.ataque      = profile.ataque      || friend.ataque;
      friend.defensa     = profile.defensa     || friend.defensa;
      friend.agilidad    = profile.agilidad    || friend.agilidad;
      friend.fuerza      = profile.fuerza      || friend.fuerza;
      friend.hpMax       = profile.hpMax       || friend.hpMax;
      friend.monedas     = profile.monedas     || friend.monedas;
      friend.online      = true;
      saveGame();
      renderFriendsTab();
    }
  }

  function updateFriendOnlineStatus(peerId, online) {
    if (!G) return;
    const friend = G.amigos.find(a => a.peerId === peerId || a.id === peerId);
    if (friend) {
      friend.online = online;
      renderFriendsTab();
    }
  }

  // ─── Build shareable profile ───────────────────────────────────────────────────

  function buildShareProfile() {
    if (!G || !G.profile || !G.char) return {};
    return {
      nombre:      window.currentUser ? window.currentUser.displayName : G.profile.nombre,
      heroeNombre: G.profile.heroeNombre,
      clase:       G.profile.clase,
      nivel:       G.char.nivel,
      ataque:      G.char.ataque,
      defensa:     G.char.defensa,
      agilidad:    G.char.agilidad,
      fuerza:      G.char.fuerza,
      hpMax:       G.char.hpMax,
      monedas:     G.char.monedas,
      racha:       G.char.racha,
      peerId:      window.currentUser ? window.currentUser.peerId : null,
    };
  }

  // ─── UI helpers ────────────────────────────────────────────────────────────────

  function setStatus(state) {
    // Main online indicator (libre tab)
    const dot  = document.getElementById('libre-dot');
    const text = document.getElementById('libre-conn-text');
    if (!dot || !text) return;

    dot.className = 'online-dot';
    if (state === 'connected') {
      dot.classList.add('connected');
      text.textContent = (window.t ? t('free.online.c') : 'Connected ✓');
    } else if (state === 'connecting') {
      dot.classList.add('connecting');
      text.textContent = (window.t ? t('free.online.cn') : 'Connecting...');
    } else {
      dot.classList.add('offline');
      text.textContent = (window.t ? t('free.online.dc') : 'Not connected');
    }
  }

  function updatePeerIdDisplay(id) {
    // Show username-based ID in friends tab
    const el = document.getElementById('my-peer-id');
    if (el && window.currentUser) el.textContent = window.currentUser.peerId;
    else if (el) el.textContent = id;
  }

  function showIncomingChallenge(profile, isLibre) {
    const box  = document.getElementById('incoming-challenge');
    const text = document.getElementById('challenge-alert-text');
    if (!box || !text) return;

    const name = profile ? (profile.heroeNombre || profile.nombre || 'Alguien') : 'Alguien';
    const tipo = isLibre
      ? (window.t ? t('free.libre_type') : '(FREE BATTLE)')
      : (window.t ? t('free.coins_type') : '(WITH COINS)');
    text.textContent = window.t
      ? t('free.incoming', { name, type: tipo })
      : `${name} challenges you! ${tipo}`;
    box.classList.remove('hidden');
    // Also update button labels
    const acceptBtn = document.querySelector('#incoming-challenge .btn-primary');
    const rejectBtn = document.querySelector('#incoming-challenge .btn-secondary');
    if (acceptBtn) acceptBtn.textContent = window.t ? t('free.accept') : '✅ ACCEPT';
    if (rejectBtn) rejectBtn.textContent = window.t ? t('free.reject') : '❌ REJECT';
  }

  function hideIncomingChallenge() {
    const box = document.getElementById('incoming-challenge');
    if (box) box.classList.add('hidden');
  }

  // ─── Public API ────────────────────────────────────────────────────────────────

  return {
    init,
    sendChallenge,
    requestFriendData,
    getMyPeerId: () => myPeerId,
  };

})();

// ─── Auto-init when game starts ───────────────────────────────────────────────────

// We hook into the initMainGame flow by observing screen changes
// Hook into initMainGame to start P2P connection once game is running
const _origInitMain = window.initMainGame;
window.initMainGame = function() {
  _origInitMain && _origInitMain();
  // Delay to ensure G + currentUser are ready
  setTimeout(() => window.onlineModule.init(), 600);
};
