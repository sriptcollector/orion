/* ═══════════════════════════════════════════════════════════════════════════════════
   VITAL HERO — music.js
   Web Audio API chiptune music system
   Pokémon Black & White inspired tracks
   ═══════════════════════════════════════════════════════════════════════════════════ */

'use strict';

window.Music = (() => {

  let ctx = null;
  let masterGain = null;
  let currentTrack = null;
  let loopTimer = null;
  let playing = false;
  const VOL = 0.07;

  // Note frequencies
  const N = {
    R:    0,
    D3:   146.83, E3: 164.81, G3:  196.00, A3:  220.00, B3:  246.94,
    C4:   261.63, D4: 293.66, Eb4: 311.13, E4:  329.63, F4:  349.23,
    Fs4:  369.99, G4: 392.00, Ab4: 415.30, A4:  440.00, Bb4: 466.16,
    B4:   493.88, C5: 523.25, Cs5: 554.37, D5:  587.33, Eb5: 622.25,
    E5:   659.25, F5: 698.46, Fs5: 739.99, G5:  783.99, Ab5: 830.61,
    A5:   880.00, Bb5:932.33, B5:  987.77, C6: 1046.50,
  };

  // ─── Tracks ───────────────────────────────────────────────────────────────────
  // Format: [freq, beats]  (1 beat = quarter note at given BPM)

  const TRACKS = {

    // Overworld: G major, calm adventure feel, 120 BPM
    overworld: {
      bpm: 120,
      melody: [
        [N.G4,0.5],[N.R,0.25],[N.G4,0.25],[N.A4,0.5],[N.B4,0.5],
        [N.D5,1  ],[N.R,0.5 ],[N.B4,0.25],[N.A4,0.25],
        [N.G4,0.5],[N.A4,0.5],[N.B4,0.5 ],[N.G4,0.5 ],
        [N.E4,1  ],[N.R,0.5 ],[N.E4,0.25],[N.Fs4,0.25],
        [N.G4,0.5],[N.R,0.25],[N.G4,0.25],[N.A4,0.5],[N.B4,0.5],
        [N.C5,0.5],[N.B4,0.5],[N.A4,0.5 ],[N.G4,0.5 ],
        [N.Fs4,0.5],[N.E4,0.5],[N.D4,0.5],[N.E4,0.5 ],
        [N.G4,2  ],
        [N.E5,0.5],[N.D5,0.5],[N.C5,0.5 ],[N.B4,0.5 ],
        [N.A4,0.5],[N.B4,0.5],[N.C5,0.5 ],[N.D5,0.5 ],
        [N.E5,1  ],[N.R,0.5 ],[N.D5,0.5 ],
        [N.C5,0.5],[N.B4,0.5],[N.A4,1   ],
        [N.G4,0.5],[N.A4,0.5],[N.B4,0.5 ],[N.C5,0.5 ],
        [N.D5,2  ],
      ],
      bass: [
        [N.G3,1],[N.D3,1],[N.G3,1],[N.E3,1],
        [N.G3,1],[N.D3,1],[N.G3,1],[N.B3,1],
        [N.G3,1],[N.D3,1],[N.E3,1],[N.G3,1],
        [N.G3,1],[N.D3,1],[N.G3,2],
        [N.C4,1],[N.G3,1],[N.A3,1],[N.D3,1],
        [N.G3,2],[N.D3,2],
      ],
    },

    // Battle: G minor, intense, 155 BPM
    battle: {
      bpm: 155,
      melody: [
        [N.G4, 0.25],[N.R,  0.25],[N.G4, 0.25],[N.R,  0.25],
        [N.Bb4,0.25],[N.R,  0.25],[N.G4, 0.25],[N.R,  0.25],
        [N.F4, 0.5 ],[N.Eb4,0.25],[N.D4, 0.25],
        [N.Eb4,0.5 ],[N.R,  0.5 ],
        [N.G4, 0.25],[N.Ab4,0.25],[N.G4, 0.25],[N.F4, 0.25],
        [N.Eb4,0.5 ],[N.D4, 0.25],[N.Eb4,0.25],
        [N.F4, 0.5 ],[N.G4, 0.5 ],
        [N.Bb4,0.25],[N.R,  0.25],[N.Bb4,0.5 ],
        [N.Ab4,0.5 ],[N.G4, 0.5 ],
        [N.F4, 0.25],[N.Eb4,0.25],[N.D4, 0.5 ],
        [N.Eb4,0.25],[N.F4, 0.25],[N.G4, 0.5 ],
        [N.G4, 0.25],[N.R,  0.25],[N.G4, 0.25],[N.R,  0.25],
        [N.Bb4,0.25],[N.R,  0.25],[N.Ab4,0.25],[N.G4, 0.25],
        [N.F4, 1   ],[N.R,  1   ],
      ],
      bass: [
        [N.G3, 0.5],[N.R, 0.5],[N.G3, 0.5],[N.D3, 0.5],
        [N.Eb3?N.Eb4:N.D3, 0.5],[N.R, 0.5],[N.D3, 1],
        [N.G3, 0.5],[N.R, 0.5],[N.Bb3?N.Bb3:N.G3, 0.5],[N.G3, 0.5],
        [N.F3?N.F4:N.E3, 0.5],[N.R, 0.5],[N.G3, 1],
      ],
    },

    // Victory fanfare: bright and triumphant
    victory: {
      bpm: 150,
      loop: false,
      melody: [
        [N.C5, 0.25],[N.C5, 0.25],[N.C5, 0.5 ],
        [N.C5, 0.5 ],[N.E5, 0.5 ],
        [N.G5, 1   ],[N.R,  0.5 ],
        [N.A5, 0.25],[N.G5, 0.25],[N.A5, 0.5 ],
        [N.B5, 1   ],[N.R,  0.5 ],
        [N.G5, 0.25],[N.Fs5,0.25],[N.G5, 0.5 ],
        [N.C6, 2   ],
      ],
      bass: [],
    },
  };

  // ─── Engine ───────────────────────────────────────────────────────────────────

  function initCtx() {
    if (ctx) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = ctx.createGain();
    masterGain.gain.value = VOL;
    masterGain.connect(ctx.destination);
  }

  function playNote(freq, start, dur, wave, gain) {
    if (!ctx || freq <= 0) return;
    const osc = ctx.createOscillator();
    const g   = ctx.createGain();
    osc.type = wave || 'square';
    osc.frequency.value = freq;
    g.gain.setValueAtTime(gain, start);
    g.gain.exponentialRampToValueAtTime(0.001, start + dur * 0.85);
    osc.connect(g);
    g.connect(masterGain);
    osc.start(start);
    osc.stop(start + dur);
  }

  function schedulePattern(track, isBass) {
    if (!ctx) return 0;
    const notes = isBass ? (track.bass || []) : track.melody;
    if (!notes.length) return 0;
    const beatLen = 60 / track.bpm;
    let t = ctx.currentTime + 0.05;
    notes.forEach(([freq, beats]) => {
      const dur = beats * beatLen;
      playNote(freq, t, dur, isBass ? 'triangle' : 'square', isBass ? 0.06 : 0.09);
      t += dur;
    });
    return (t - ctx.currentTime) * 1000;
  }

  function startLoop(name) {
    const track = TRACKS[name];
    if (!track) return;
    const melDur = schedulePattern(track, false);
    schedulePattern(track, true);
    const loop = track.loop !== false;
    if (loop) {
      loopTimer = setTimeout(() => {
        if (playing && currentTrack === name) startLoop(name);
      }, melDur - 80);
    }
  }

  // ─── Public API ───────────────────────────────────────────────────────────────

  function play(name) {
    initCtx();
    stop();
    if (ctx.state === 'suspended') ctx.resume();
    playing = true;
    currentTrack = name;
    startLoop(name);
    updateMusicBtn();
  }

  function stop() {
    playing = false;
    if (loopTimer) { clearTimeout(loopTimer); loopTimer = null; }
    // Fade out master gain then reset
    if (masterGain && ctx) {
      masterGain.gain.setTargetAtTime(0, ctx.currentTime, 0.15);
      setTimeout(() => {
        if (masterGain) masterGain.gain.value = VOL;
      }, 600);
    }
    updateMusicBtn();
  }

  function toggle() {
    if (playing) stop();
    else play(currentTrack || 'overworld');
    return playing;
  }

  function isPlaying() { return playing; }

  function setVolume(v) {
    if (masterGain) masterGain.gain.value = v;
  }

  function updateMusicBtn() {
    const btn = document.getElementById('music-toggle-btn');
    if (btn) btn.textContent = playing ? '🔊 MUSIC: ON' : '🔇 MUSIC: OFF';
  }

  // Start overworld on first user interaction
  document.addEventListener('click', function startOnce() {
    document.removeEventListener('click', startOnce);
    if (!playing) play('overworld');
  }, { once: true });

  return { play, stop, toggle, isPlaying, setVolume };

})();
