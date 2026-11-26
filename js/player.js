/* Keyboard + touch input and player physics. Character art is replaceable; hitbox dimensions stay fixed. */
// CHARACTER ART MODE: set to 'custom' to use assets/characters PNGs, or 'procedural' for the built-in pixel hero. Change this here—no menu selector.
const PLAYER_ART_MODE = 'custom';
const Input = {
  LEFT: ['KeyA', 'ArrowLeft'], RIGHT: ['KeyD', 'ArrowRight'], JUMP: ['Space', 'KeyW', 'ArrowUp'],
  keys: new Set(), jumpPressed: false, enabled: false,
  init() {
    addEventListener('keydown', e => {
      if (!this.enabled) return;
      if ([...this.LEFT, ...this.RIGHT, ...this.JUMP].includes(e.code)) e.preventDefault();
      if (e.repeat) return; this.keys.add(e.code); if (this.JUMP.includes(e.code)) this.jumpPressed = true;
    });
    addEventListener('keyup', e => this.keys.delete(e.code)); addEventListener('blur', () => this.clear());
    document.querySelectorAll('.touch-btn').forEach(btn => {
      const key = btn.dataset.key, code = key==='left'?'ArrowLeft':key==='right'?'ArrowRight':'Space';
      const down=e=>{e.preventDefault();if(!this.enabled)return;this.keys.add(code);if(key==='jump')this.jumpPressed=true;try{btn.setPointerCapture(e.pointerId)}catch(_){} };
      const up=e=>{e.preventDefault();this.keys.delete(code)};
      btn.addEventListener('pointerdown',down);['pointerup','pointercancel','pointerleave','lostpointercapture'].forEach(ev=>btn.addEventListener(ev,up));
    });
  },
  down(list) { return list.some(k => this.keys.has(k)); }, clear() { this.keys.clear(); this.jumpPressed = false; }
};

class Player {
  constructor(x,y) { this.w=22; this.h=30; this.reset(x,y); this.characterMode=PLAYER_ART_MODE; this.images={}; this.loadCharacterImages(); }
  reset(x,y) { Object.assign(this,{x,y,vx:0,vy:0,onGround:false,facing:1,coyote:0,jumpBuf:0,jumping:false,animTime:0,hitTimer:0}); }
  loadCharacterImages() {
    const files={base:'player.png',idle:'player-idle.png',run:'player-run.png',jump:'player-jump.png',hit:'player-hit.png'};
    for(const [key,file] of Object.entries(files)){const im=new Image();im.src='assets/characters/'+file;im.onload=()=>this.images[key]=im;im.onerror=()=>{this.images[key]=null;};}
  }
  update(dt,map) {
    const P=Physics, dir=(Input.down(Input.RIGHT)?1:0)-(Input.down(Input.LEFT)?1:0), jumpHeld=Input.down(Input.JUMP);
    if(dir){this.facing=dir;this.vx+=dir*P.ACCEL*dt;this.vx=Math.max(-P.MOVE_SPEED,Math.min(P.MOVE_SPEED,this.vx));}else{const f=P.FRICTION*dt;this.vx=Math.abs(this.vx)<=f?0:this.vx-Math.sign(this.vx)*f;}
    this.coyote=this.onGround?P.COYOTE_TIME:this.coyote-dt;this.jumpBuf=Input.jumpPressed?P.JUMP_BUFFER:this.jumpBuf-dt;Input.jumpPressed=false;
    if(this.jumpBuf>0&&this.coyote>0){this.vy=P.JUMP_VELOCITY;this.jumpBuf=0;this.coyote=0;this.jumping=true;if(this.onJump)this.onJump();}
    if(this.jumping&&!jumpHeld&&this.vy<0){this.vy*=P.JUMP_CUT;this.jumping=false;}
    this.vy=Math.min(this.vy+P.GRAVITY*dt,P.MAX_FALL);Physics.moveX(this,map,dt);Physics.moveY(this,map,dt);
    if(this.onGround)this.jumping=false;this.x=Math.max(0,Math.min(map.width-this.w,this.x));this.animTime+=Math.abs(this.vx)*dt;this.hitTimer=Math.max(0,this.hitTimer-dt);
  }
  draw(ctx,camX) {
    const px=Math.round(this.x-camX)-1,py=Math.round(this.y), moving=Math.abs(this.vx)>10, air=!this.onGround;
    if(this.characterMode==='custom'){
      let key=this.hitTimer>0?'hit':air?'jump':moving?'run':'idle', img=this.images[key];
      if(!img||!img.complete||!img.naturalWidth)img=this.images.base;
      if(img&&img.complete&&img.naturalWidth){const fh=img.naturalHeight, fw=48, frames=Math.max(1,Math.floor(img.naturalWidth/fw)), frame=frames>1?Math.floor(this.animTime/14)%frames:0;
        ctx.save();ctx.translate(px+this.w/2,py);if(this.facing<0)ctx.scale(-1,1);ctx.drawImage(img,frame*fw,0,fw,fh,-this.w/2,-1,this.w,this.h+2);ctx.restore();return;}
    }
    ctx.save();ctx.translate(px+12,py);if(this.facing<0)ctx.scale(-1,1);ctx.translate(-12,0);
    const r=(c,x,y,w,h)=>{ctx.fillStyle=c;ctx.fillRect(x*2,y*2,w*2,h*2);}, f=Math.floor(this.animTime/14)%4;
    r('#c0392b',3,0,6,2);r('#c0392b',3,1,8,1);r('#6b3a12',2,2,2,3);r('#ffc08a',4,2,6,4);r('#1d1230',8,3,1,2);r('#6b3a12',8,5,3,1);r('#2d9cdb',3,6,6,5);r('#ffcf33',4,7,1,1);r('#ffcf33',7,7,1,1);
    if(air){r('#ffc08a',1,4,2,3);r('#ffc08a',9,4,2,3)}else{const s=moving?(f%2?1:-1):0;r('#ffc08a',1+s,7,2,3);r('#ffc08a',9-s,7,2,3)}
    const boot='#5a2d0c',pant='#2457a6';r(pant,3,11,6,2);if(air){r(boot,1,12,4,3);r(boot,8,13,4,2)}else if(!moving){r(boot,3,13,3,2);r(boot,6,13,3,2)}else if(f===0){r(boot,2,13,3,2);r(boot,7,12,3,2)}else if(f===2){r(boot,2,12,3,2);r(boot,7,13,3,2)}else{r(boot,4,13,4,2)}ctx.restore();
  }
}
