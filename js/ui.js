/* UI navigation, persistent audio controls, HUD and game overlays. */
const UI = {
  settings:{sound:true}, $:id=>document.getElementById(id),
  init(handlers){this.h=handlers;const go=(id,fn)=>this.$(id).addEventListener('click',()=>{document.activeElement.blur();fn();});
    go('btn-play',()=>handlers.play());go('btn-howto',()=>this.show('howto'));go('btn-settings',()=>this.show('settings'));document.querySelectorAll('.back').forEach(b=>b.addEventListener('click',()=>this.show('menu')));
    go('set-sound',()=>{this.settings.sound=!this.settings.sound;GameSound.setMuted(!this.settings.sound);this.syncSettings();});go('set-mute',()=>{GameSound.setMuted(!GameSound.isMuted());this.syncSettings();});
    const vol=this.$('set-volume');if(vol){vol.value=Math.round(GameSound.getVolume()*100);vol.addEventListener('input',()=>GameSound.setVolume(+vol.value/100));}
    go('ov-menu',()=>handlers.menu());this.syncSettings();
  },
  show(name){document.querySelectorAll('.screen').forEach(s=>s.classList.toggle('active',s.id==='screen-'+name));},
  syncSettings(){this.$('set-sound').textContent=this.settings.sound?'On':'Off';this.$('set-mute').textContent=GameSound.isMuted()?'Unmute':'Mute';},
  setCoins(n,total){this.$('hud-coins').textContent=n;this.$('hud-total').textContent=total;},
  setHud(score,lives,level,best){this.$('hud-score').textContent=score;this.$('hud-lives').textContent=lives;this.$('hud-level').textContent=level;this.$('hud-levelname').textContent=['Positive World','Comparative Forest','Superlative Mountain','Grammar Challenge','Final Challenge'][level-1]||'';this.$('hud-best').textContent=best;},
  overlay(title,text,label,fn){this.$('ov-title').textContent=title;this.$('ov-text').textContent=text;const m=this.$('ov-main');m.textContent=label;m.onclick=()=>{m.blur();fn();};this.$('overlay').classList.remove('hidden');},hideOverlay(){this.$('overlay').classList.add('hidden');},
  beep(freq,dur=.08,type='square',slideTo=null){if(!this.settings.sound||GameSound.isMuted())return;try{const a=this._ctx||(this._ctx=new(window.AudioContext||window.webkitAudioContext)());const o=a.createOscillator(),g=a.createGain();o.type=type;o.frequency.setValueAtTime(freq,a.currentTime);if(slideTo)o.frequency.exponentialRampToValueAtTime(slideTo,a.currentTime+dur);g.gain.setValueAtTime(.05,a.currentTime);g.gain.exponentialRampToValueAtTime(.001,a.currentTime+dur);o.connect(g).connect(a.destination);o.start();o.stop(a.currentTime+dur);}catch(_){}}
};
