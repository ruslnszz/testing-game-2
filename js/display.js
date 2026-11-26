/* Display: fills the whole screen in landscape, handles fullscreen + orientation lock. */
const Display = (() => {
  const BASE_H = 480, MIN_AR = 5 / 3, MAX_AR = 7 / 3;
  const canvas = document.getElementById('game');
  const stage = document.getElementById('stage');
  const isTouch = () => window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
  const isPortrait = () => window.innerHeight > window.innerWidth;

  // Resize the logical canvas width to the screen's aspect ratio so there are no black bars.
  function fit() {
    const vw = window.innerWidth, vh = window.innerHeight;
    const ar = Math.max(MIN_AR, Math.min(MAX_AR, vw / vh));
    const w = Math.round(BASE_H * ar);
    if (canvas.width !== w) canvas.width = w;
    canvas.height = BASE_H;
    const cssW = Math.min(vw, vh * ar);
    stage.style.width = cssW + 'px';
    stage.style.height = (cssW / ar) + 'px';
    window.dispatchEvent(new Event('viewchange'));
  }

  const fsElement = () => document.fullscreenElement || document.webkitFullscreenElement;

  async function enterFullscreen() {
    const el = document.documentElement;
    try {
      if (!fsElement()) {
        const req = el.requestFullscreen || el.webkitRequestFullscreen;
        if (req) await req.call(el, { navigationUI: 'hide' });
      }
    } catch (_) { /* iOS iPhone: no Fullscreen API, use Add to Home Screen instead */ }
    try { if (screen.orientation && screen.orientation.lock) await screen.orientation.lock('landscape'); } catch (_) {}
  }

  function exitFullscreen() {
    const ex = document.exitFullscreen || document.webkitExitFullscreen;
    if (fsElement() && ex) ex.call(document);
  }

  function toggleFullscreen() { fsElement() ? exitFullscreen() : enterFullscreen(); }

  function init() {
    fit();
    ['resize', 'orientationchange'].forEach(ev => addEventListener(ev, () => setTimeout(fit, ev === 'orientationchange' ? 200 : 0)));
    if (window.visualViewport) visualViewport.addEventListener('resize', fit);
    document.getElementById('btn-fs').addEventListener('click', e => { e.currentTarget.blur(); toggleFullscreen(); });
    // Enter fullscreen from the Play button (needs a user gesture) on touch devices.
    document.getElementById('btn-play').addEventListener('click', () => { if (isTouch()) enterFullscreen(); });
    // Block pinch-zoom / double-tap zoom / pull-to-refresh gestures.
    ['gesturestart', 'gesturechange'].forEach(ev => document.addEventListener(ev, e => e.preventDefault()));
    document.addEventListener('touchmove', e => { if (e.touches.length > 1) e.preventDefault(); }, { passive: false });
    document.addEventListener('dblclick', e => e.preventDefault());
    const syncFs = () => document.body.classList.toggle('is-fullscreen', !!fsElement());
    document.addEventListener('fullscreenchange', syncFs);
    document.addEventListener('webkitfullscreenchange', syncFs);
  }

  init();
  return { fit, enterFullscreen, exitFullscreen, toggleFullscreen, isTouch, isPortrait };
})();
