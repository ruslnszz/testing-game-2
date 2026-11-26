/* Customizable sound bank. Replace files in assets/sounds without editing game logic. */
const GameSound = (() => {
  const paths = {
    jump: 'assets/sounds/jump.mp3', coin: 'assets/sounds/coin.mp3', luckyBlock: 'assets/sounds/lucky-block.mp3',
    correctAnswer: 'assets/sounds/correct-answer.mp3', wrongAnswer: 'assets/sounds/wrong-answer.mp3',
    playerHit: 'assets/sounds/player-hit.mp3', gameOver: 'assets/sounds/game-over.mp3',
    levelComplete: 'assets/sounds/level-complete.mp3', backgroundMusic: 'assets/sounds/background-music.mp3'
  };
  const audios = new Map();
  let volume = 0.65, muted = false, musicEnabled = true, unlocked = false;
  function get(name) {
    if (!audios.has(name)) { const a = new Audio(paths[name]); a.preload = 'auto'; audios.set(name, a); }
    return audios.get(name);
  }
  function applyVolume(a) { a.volume = muted ? 0 : volume; }
  function unlock() {
    unlocked = true;
    try { const a = get('backgroundMusic'); a.muted = true; a.play().then(() => { a.pause(); a.currentTime = 0; a.muted = false; }).catch(() => { a.muted = false; }); } catch (_) {}
    if (musicEnabled) playBackgroundMusic();
  }
  function play(name) {
    if (!unlocked || muted) return;
    try { const a = get(name); a.pause(); a.currentTime = 0; applyVolume(a); a.play().catch(() => {}); } catch (_) { /* audio missing or blocked: gameplay remains unaffected */ }
  }
  function playBackgroundMusic() {
    if (!unlocked || !musicEnabled || muted) return;
    try { const a = get('backgroundMusic'); a.loop = true; applyVolume(a); if (a.paused) a.play().catch(() => {}); } catch (_) {}
  }
  function stopBackgroundMusic() { try { const a = get('backgroundMusic'); a.pause(); a.currentTime = 0; } catch (_) {} }
  function setVolume(v) { volume = Math.max(0, Math.min(1, Number(v))); audios.forEach(applyVolume); }
  function setMuted(v) { muted = !!v; audios.forEach(applyVolume); if (muted) stopBackgroundMusic(); else playBackgroundMusic(); }
  function setMusicEnabled(v) { musicEnabled = !!v; if (musicEnabled) playBackgroundMusic(); else stopBackgroundMusic(); }
  return { paths, unlock, play, jump:()=>play('jump'), coin:()=>play('coin'), luckyBlock:()=>play('luckyBlock'), correctAnswer:()=>play('correctAnswer'), wrongAnswer:()=>play('wrongAnswer'), playerHit:()=>play('playerHit'), gameOver:()=>play('gameOver'), levelComplete:()=>play('levelComplete'), playBackgroundMusic, stopBackgroundMusic, setVolume, setMuted, setMusicEnabled, getVolume:()=>volume, isMuted:()=>muted };
})();
