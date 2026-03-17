/* ═══════════════════════════════════════════════════════════════════════════════════
   HÉROE VITAL — auth.js
   Account creation, login, session management.
   Accounts are stored in localStorage per device; username doubles as PeerID base.
   PeerID = "hv_" + username  →  friends can connect by username alone.
   ═══════════════════════════════════════════════════════════════════════════════════ */

'use strict';

const AUTH_KEY       = 'hv_accounts';   // { username: { passHash, createdAt } }
const SESSION_KEY    = 'hv_session';    // current logged-in username
const SAVE_KEY_BASE  = 'hv_save_';     // hv_save_{username}  → game data

window.Auth = (() => {

  // ─── Helpers ───────────────────────────────────────────────────────────────────

  function simpleHash(str) {
    let h = 5381;
    for (let i = 0; i < str.length; i++) {
      h = ((h << 5) + h) ^ str.charCodeAt(i);
      h = h >>> 0;
    }
    return h.toString(36);
  }

  function getAccounts() {
    try { return JSON.parse(localStorage.getItem(AUTH_KEY)) || {}; } catch(e) { return {}; }
  }

  function saveAccounts(accs) {
    localStorage.setItem(AUTH_KEY, JSON.stringify(accs));
  }

  function peerIdFromUsername(u) {
    return 'hv_' + u.toLowerCase().replace(/[^a-z0-9_]/g, '');
  }

  // ─── Register ──────────────────────────────────────────────────────────────────

  function register(username, password, confirmPassword) {
    username = username.trim();
    if (!username || !password)              return { ok: false, msg: t('auth.err.fill') };
    if (username.length < 3)                 return { ok: false, msg: t('auth.err.shortuser') };
    if (password.length < 4)                 return { ok: false, msg: t('auth.err.shortpass') };
    if (password !== confirmPassword)        return { ok: false, msg: t('auth.err.passmatch') };

    const accs = getAccounts();
    if (accs[username.toLowerCase()])        return { ok: false, msg: t('auth.err.taken') };

    accs[username.toLowerCase()] = {
      displayName: username,
      passHash:    simpleHash(password),
      createdAt:   Date.now(),
    };
    saveAccounts(accs);
    localStorage.setItem(SESSION_KEY, username.toLowerCase());
    return { ok: true, username: username.toLowerCase(), displayName: username };
  }

  // ─── Login ─────────────────────────────────────────────────────────────────────

  function login(username, password) {
    username = username.trim().toLowerCase();
    if (!username || !password) return { ok: false, msg: t('auth.err.fill') };

    const accs = getAccounts();
    if (!accs[username])                     return { ok: false, msg: t('auth.err.nouser') };
    if (accs[username].passHash !== simpleHash(password))
                                             return { ok: false, msg: t('auth.err.wrongpass') };

    localStorage.setItem(SESSION_KEY, username);
    return { ok: true, username, displayName: accs[username].displayName || username };
  }

  // ─── Guest / offline session ───────────────────────────────────────────────────

  function playOffline() {
    const guest = 'guest_' + Date.now().toString(36);
    localStorage.setItem(SESSION_KEY, guest);
    return { ok: true, username: guest, displayName: 'Invitado', isGuest: true };
  }

  // ─── Logout ────────────────────────────────────────────────────────────────────

  function logout() {
    localStorage.removeItem(SESSION_KEY);
    window.G = null;
    window.currentUser = null;
    showAuthScreen();
  }

  // ─── Session check ─────────────────────────────────────────────────────────────

  function currentSession() {
    const u = localStorage.getItem(SESSION_KEY);
    if (!u) return null;
    const accs = getAccounts();
    return {
      username:    u,
      displayName: accs[u] ? (accs[u].displayName || u) : u,
      isGuest:     !accs[u],
      peerId:      peerIdFromUsername(u),
      saveKey:     SAVE_KEY_BASE + u,
    };
  }

  // ─── Auth Screen ───────────────────────────────────────────────────────────────

  let authMode = 'login'; // 'login' | 'register'

  function showAuthScreen() {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('screen-auth').classList.add('active');
    renderAuthScreen();
  }

  function renderAuthScreen() {
    const isReg = authMode === 'register';
    document.getElementById('auth-title').textContent     = t(isReg ? 'auth.register' : 'auth.login');
    document.getElementById('auth-confirm-row').style.display = isReg ? 'block' : 'none';
    document.getElementById('auth-btn-submit').textContent = t(isReg ? 'auth.btn.register' : 'auth.btn.login');
    document.getElementById('auth-btn-toggle').textContent = t(isReg ? 'auth.switch.login' : 'auth.switch.register');
    document.getElementById('auth-btn-offline').textContent = t('auth.offline');
    document.getElementById('auth-lbl-user').textContent   = t('auth.username');
    document.getElementById('auth-lbl-pass').textContent   = t('auth.password');
    document.getElementById('auth-lbl-confirm').textContent= t('auth.confirm');
    document.getElementById('auth-error').textContent      = '';
  }

  function handleSubmit() {
    const username = document.getElementById('auth-username').value.trim();
    const password = document.getElementById('auth-password').value;
    const confirm  = document.getElementById('auth-confirm').value;

    let result;
    if (authMode === 'register') {
      result = register(username, password, confirm);
    } else {
      result = login(username, password);
    }

    if (!result.ok) {
      document.getElementById('auth-error').textContent = result.msg;
      return;
    }

    onAuthSuccess(result);
  }

  function onAuthSuccess(session) {
    window.currentUser = {
      username:    session.username,
      displayName: session.displayName,
      isGuest:     session.isGuest || false,
      peerId:      peerIdFromUsername(session.username),
      saveKey:     SAVE_KEY_BASE + session.username,
    };

    // Clear form
    document.getElementById('auth-username').value = '';
    document.getElementById('auth-password').value = '';
    document.getElementById('auth-confirm').value  = '';

    // Show toast
    if (!session.isGuest) {
      showToast(t('auth.welcome') + ' ' + session.displayName + '!');
    }

    // Transition to game
    document.getElementById('screen-auth').classList.remove('active');
    window.bootGame();
  }

  // Public-facing button handlers (called from HTML onclick)
  window.authSubmit = function() { handleSubmit(); };
  window.authToggle = function() {
    authMode = authMode === 'login' ? 'register' : 'login';
    renderAuthScreen();
  };
  window.authOffline = function() { onAuthSuccess(playOffline()); };

  window.authKeydown = function(e) { if (e.key === 'Enter') handleSubmit(); };

  window.logoutUser = function() {
    logout();
    showToast(t('auth.logged_out'));
  };

  // ─── Language screen ───────────────────────────────────────────────────────────

  window.chooseLang = function(code) {
    setLang(code);
    document.getElementById('screen-lang').classList.remove('active');
    showAuthScreen();
  };

  // ─── Boot sequence ─────────────────────────────────────────────────────────────

  window.bootAuth = function() {
    const lang = localStorage.getItem('hv_lang');
    const sess = currentSession();

    // First time: always show language screen
    if (!lang) {
      document.getElementById('screen-lang').classList.add('active');
      return;
    }

    // Has session? Go straight to game
    if (sess) {
      window.currentUser = {
        username:    sess.username,
        displayName: sess.displayName,
        isGuest:     sess.isGuest,
        peerId:      peerIdFromUsername(sess.username),
        saveKey:     SAVE_KEY_BASE + sess.username,
      };
      window.bootGame();
      return;
    }

    // Show auth screen
    showAuthScreen();
  };

  // Public API
  return {
    peerIdFromUsername,
    currentSession,
    showAuthScreen,
    logout,
  };
})();

// ─── Override global SAVE_KEY in game.js to use per-user key ─────────────────────
// game.js uses `SAVE_KEY` constant; we override save/load to use currentUser's key

window.getUserSaveKey = function() {
  return window.currentUser ? window.currentUser.saveKey : 'hv_save_default';
};
