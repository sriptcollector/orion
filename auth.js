/* ═══════════════════════════════════════════════════════════════════════════════════
   VITAL HERO — auth.js
   Account creation, login, session management.
   Accounts stored in localStorage. Username = PeerID base.
   PeerID = "hv_" + username
   ═══════════════════════════════════════════════════════════════════════════════════ */

'use strict';

const AUTH_KEY       = 'hv_accounts';   // { username: { passHash, email, createdAt } }
const SESSION_KEY    = 'hv_session';    // current logged-in username
const SAVE_KEY_BASE  = 'hv_save_';     // hv_save_{username} → game data

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

  function register(username, password, confirmPassword, email) {
    username = username.trim();
    email    = (email || '').trim();
    if (!username || !password)         return { ok: false, msg: 'Please fill in all fields!' };
    if (username.length < 3)            return { ok: false, msg: 'Username must be at least 3 characters' };
    if (password.length < 4)            return { ok: false, msg: 'Password must be at least 4 characters' };
    if (password !== confirmPassword)   return { ok: false, msg: 'Passwords do not match!' };

    const accs = getAccounts();
    if (accs[username.toLowerCase()])   return { ok: false, msg: 'Username already taken!' };

    // Basic email validation if provided
    if (email && !email.includes('@'))  return { ok: false, msg: 'Enter a valid email address' };

    accs[username.toLowerCase()] = {
      displayName: username,
      passHash:    simpleHash(password),
      email:       email || null,
      createdAt:   Date.now(),
    };
    saveAccounts(accs);
    localStorage.setItem(SESSION_KEY, username.toLowerCase());
    return { ok: true, username: username.toLowerCase(), displayName: username, email: email || null };
  }

  // ─── Login ─────────────────────────────────────────────────────────────────────

  function login(username, password) {
    username = username.trim().toLowerCase();
    if (!username || !password) return { ok: false, msg: 'Please fill in all fields!' };

    const accs = getAccounts();
    if (!accs[username])                         return { ok: false, msg: 'User not found!' };
    if (accs[username].passHash !== simpleHash(password))
                                                 return { ok: false, msg: 'Wrong password!' };

    localStorage.setItem(SESSION_KEY, username);
    return { ok: true, username, displayName: accs[username].displayName || username, email: accs[username].email || null };
  }

  // ─── Guest / offline session ───────────────────────────────────────────────────

  function playOffline() {
    const guest = 'guest_' + Date.now().toString(36);
    localStorage.setItem(SESSION_KEY, guest);
    return { ok: true, username: guest, displayName: 'Guest', isGuest: true };
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
      email:       accs[u] ? (accs[u].email || null) : null,
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
    document.getElementById('auth-title').textContent     = isReg ? 'CREATE ACCOUNT' : 'LOGIN';
    document.getElementById('auth-confirm-row').style.display = isReg ? 'block' : 'none';
    document.getElementById('auth-email-row').style.display   = isReg ? 'block' : 'none';
    document.getElementById('auth-btn-submit').textContent = isReg ? 'REGISTER' : 'ENTER';
    document.getElementById('auth-btn-toggle').textContent = isReg ? 'Have an account? Log in' : 'No account? Sign up here';
    document.getElementById('auth-error').textContent      = '';
  }

  function handleSubmit() {
    const username = document.getElementById('auth-username').value.trim();
    const password = document.getElementById('auth-password').value;
    const confirm  = document.getElementById('auth-confirm').value;
    const email    = document.getElementById('auth-email').value;

    let result;
    if (authMode === 'register') {
      result = register(username, password, confirm, email);
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
      email:       session.email || null,
      isGuest:     session.isGuest || false,
      peerId:      peerIdFromUsername(session.username),
      saveKey:     SAVE_KEY_BASE + session.username,
    };

    // Clear form
    document.getElementById('auth-username').value = '';
    document.getElementById('auth-password').value = '';
    document.getElementById('auth-confirm').value  = '';
    document.getElementById('auth-email').value    = '';

    if (!session.isGuest) {
      showToast('Welcome, ' + session.displayName + '!');
    }

    document.getElementById('screen-auth').classList.remove('active');
    window.bootGame();
  }

  // Public-facing button handlers (called from HTML onclick)
  window.authSubmit  = function() { handleSubmit(); };
  window.authToggle  = function() {
    authMode = authMode === 'login' ? 'register' : 'login';
    renderAuthScreen();
  };
  window.authOffline = function() { onAuthSuccess(playOffline()); };
  window.authKeydown = function(e) { if (e.key === 'Enter') handleSubmit(); };

  window.logoutUser  = function() {
    logout();
    showToast('Logged out!');
  };

  // ─── Boot sequence ─────────────────────────────────────────────────────────────

  window.bootAuth = function() {
    // Always English – skip language screen entirely
    localStorage.setItem('hv_lang', 'en');
    window.LANG_CODE = 'en';

    const sess = currentSession();

    // Has active session? Go straight to game
    if (sess) {
      window.currentUser = {
        username:    sess.username,
        displayName: sess.displayName,
        email:       sess.email || null,
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

// ─── Per-user save key ────────────────────────────────────────────────────────────
window.getUserSaveKey = function() {
  return window.currentUser ? window.currentUser.saveKey : 'hv_save_default';
};
