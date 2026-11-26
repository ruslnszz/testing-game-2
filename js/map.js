/* GameMap: data level 1 (dunia rumput), pengecekan solid, dan rendering dunia. */
class GameMap {
  constructor(level = 1) {
    this.level = level;
    this.TILE = 32; this.cols = 160; this.rows = 15;
    this.width = this.cols * this.TILE; this.height = this.rows * this.TILE;
    this.tiles = new Uint8Array(this.cols * this.rows); // 0 kosong, 1 tanah, 2 blok, 3-6 pipa
    this.coins = [];
    this.goalX = 154 * this.TILE;
    this.spawn = { x: 2 * this.TILE, y: 12 * this.TILE };
    this.bushes = [5, 12, 19, 31, 45, 52, 72, 81, 97, 105, 127, 139, 150];
    this.build();
  }

  set(c, r, v) { this.tiles[r * this.cols + c] = v; }
  get(c, r) { return this.tiles[r * this.cols + c]; }

  build() {
    const holes = [[28, 29], [58, 60], [88, 90], [118, 120]];
    for (let c = 0; c < this.cols; c++) {
      if (holes.some(h => c >= h[0] && c <= h[1])) continue;
      this.set(c, 13, 1); this.set(c, 14, 1);
    }
    // [kolom, baris, panjang]
    const platforms = [[8,10,4],[14,10,2],[17,8,3],[33,10,4],[39,8,3],[44,10,3],[50,8,3],[62,10,4],[68,8,3],
      [73,10,2],[79,8,4],[95,10,4],[101,8,3],[107,10,3],[113,8,3],[124,10,5],[130,8,3],[136,10,4],[142,8,3]];
    for (const [c, r, n] of platforms) {
      for (let i = 0; i < n; i++) { this.set(c + i, r, 2); this.coins.push(this.makeCoin(c + i, r - 1)); }
    }
    // [kolom kiri, tinggi dalam tile]
    for (const [c, h] of [[22,2],[36,3],[55,2],[66,2],[84,3],[92,2],[111,3],[122,2],[146,3]]) {
      const top = 13 - h;
      for (let r = top; r < 13; r++) {
        this.set(c, r, r === top ? 3 : 5); this.set(c + 1, r, r === top ? 4 : 6);
      }
    }
    for (const [a, b] of holes) for (let c = a; c <= b; c++) this.coins.push(this.makeCoin(c, 10));
    for (const c of [4, 6, 25, 47, 75, 100, 133, 150]) this.coins.push(this.makeCoin(c, 12));
    // Lucky blocks and hazards scale by level. A block is a solid tile, but can trigger once from below.
    this.luckyBlocks = [12, 26, 42, 67, 96, 132].slice(0, 2 + this.level).map(c => ({x:c*32, y:8*32, w:32, h:32, used:false}));
    // Enemy spawn positions are resolved to the nearest walkable surface below each spawn column.
    for (const b of this.luckyBlocks) this.set(b.x / this.TILE, b.y / this.TILE, 7); // solid; ditembus hanya dari bawah lewat deteksi kepala
    this.enemies = [20, 49, 77, 104, 143].slice(0, this.level + 1).map((c,i)=>{
      const e={x:c*32,y:0,w:24,h:24,vx:(i%2? -1:1)*70,vy:0,lo:c*32-55,hi:c*32+55,dead:false,onGround:false};
      e.y=this.findEnemySpawnY(e.x,e.w,e.h,12*this.TILE);
      return e;
    });
    this.spikes = [32, 50, 81, 103, 151].slice(0, this.level).map(c=>({x:c*32,y:13*32-10,w:32,h:10}));
    this.movingPlatform = {x: [27, 58, 88, 118, 58][this.level-1]*32, y:9*32, w:96,h:16,baseY:9*32,phase:0};
    this.totalCoins = this.coins.length;
  }

  // Returns the top of the nearest solid surface below the requested spawn baseline.
  findEnemySpawnY(x, w, h, fromY) {
    const T=this.TILE, c0=Math.floor(x/T), c1=Math.floor((x+w-0.01)/T);
    for(let r=Math.max(0,Math.floor(fromY/T));r<this.rows;r++){
      let supported=false;
      for(let c=c0;c<=c1;c++) if(this.isSolid(c,r)){supported=true;break;}
      if(supported) return r*T-h;
    }
    return this.height-h;
  }

  makeCoin(c, r) { return { x: c * 32 + 8, y: r * 32 + 6, w: 16, h: 20, got: false }; }

  isSolid(c, r) {
    if (c < 0 || c >= this.cols) return true;   // dinding tak terlihat di kiri & kanan
    if (r < 0 || r >= this.rows) return false;  // atas bebas, bawah = lubang
    return this.get(c, r) !== 0;
  }

  collectCoins(player) {
    let n = 0;
    for (const c of this.coins) if (!c.got && Physics.overlap(player, c)) { c.got = true; n++; }
    return n;
  }

  /* ---------- Rendering ---------- */
  draw(ctx, camX, view, time) {
    ctx.fillStyle = ['#5c94fc','#66b35a','#b5a4dd','#db8850','#354f7d'][this.level-1] || '#5c94fc'; ctx.fillRect(0, 0, view.w, view.h);
    this.drawClouds(ctx, camX, time);
    this.drawHills(ctx, camX);
    const T = this.TILE, c0 = Math.floor(camX / T), c1 = c0 + Math.ceil(view.w / T) + 1;
    for (const b of this.bushes) this.drawBush(ctx, Math.round(b * T - camX), 13 * T);
    for (let r = 0; r < this.rows; r++) for (let c = c0; c <= c1 && c < this.cols; c++) {
      const t = this.get(c, r);
      if (t && t !== 7) this.drawTile(ctx, t, Math.round(c * T - camX), r * T, r === 13);
    }
    this.drawCoins(ctx, camX, time);
    this.drawHazards(ctx, camX, time);
    this.drawLuckyBlocks(ctx, camX, time);
    this.drawFlag(ctx, Math.round(camX), time);
  }

  drawClouds(ctx, camX, time) {
    const span = 1500;
    for (let i = 0; i < 9; i++) {
      const bx = i * 170 + (i * 53 % 90), y = 30 + (i * 47 % 110), u = 8 * (1 + (i % 3) * .5);
      const x = Math.round(((bx - camX * 0.25 + time * 6) % span + span) % span - 200);
      ctx.fillStyle = '#fff';
      ctx.fillRect(x + u * 2, y, u * 4, u); ctx.fillRect(x + u, y + u, u * 7, u); ctx.fillRect(x, y + u * 2, u * 9, u);
      ctx.fillStyle = '#cfe0ff'; ctx.fillRect(x, y + u * 3 - 2, u * 9, 2);
    }
  }

  drawHills(ctx, camX) {
    const span = 1280;
    for (let i = 0; i < 6; i++) {
      const w = i % 2 ? 224 : 320, h = i % 2 ? 96 : 144;
      const x = Math.round(((i * 300 + 60 - camX * 0.4) % span + span) % span - 320);
      for (let k = 0; k < h / 16; k++) {
        ctx.fillStyle = k % 2 ? '#3fa634' : '#4fc13a';
        ctx.fillRect(x + k * 16, 416 - (k + 1) * 16, w - k * 32, 16);
      }
    }
  }

  drawBush(ctx, x, y) {
    ctx.fillStyle = '#2f8a2a'; ctx.fillRect(x, y - 16, 96, 16); ctx.fillRect(x + 16, y - 32, 64, 16);
    ctx.fillStyle = '#5bb83a'; ctx.fillRect(x + 4, y - 14, 88, 12); ctx.fillRect(x + 20, y - 30, 56, 12);
  }

  drawTile(ctx, t, x, y, topRow) {
    const T = this.TILE;
    if (t === 1) {
      ctx.fillStyle = '#b5651d'; ctx.fillRect(x, y, T, T);
      ctx.fillStyle = '#8b4a12'; ctx.fillRect(x + 6, y + 14, 4, 4); ctx.fillRect(x + 20, y + 22, 4, 4); ctx.fillRect(x + 22, y + 16, 4, 4);
      if (topRow) {
        ctx.fillStyle = '#2f8a2a'; ctx.fillRect(x, y, T, 10); ctx.fillRect(x + 4, y + 10, 6, 4); ctx.fillRect(x + 18, y + 10, 6, 6);
        ctx.fillStyle = '#5bb83a'; ctx.fillRect(x, y, T, 6);
      }
    } else if (t === 2) {
      ctx.fillStyle = '#6e3a0e'; ctx.fillRect(x, y, T, T);
      ctx.fillStyle = '#e0a030'; ctx.fillRect(x + 2, y + 2, T - 4, T - 4);
      ctx.fillStyle = '#f7d16b'; ctx.fillRect(x + 2, y + 2, T - 4, 4);
      ctx.fillStyle = '#6e3a0e';
      for (const [dx, dy] of [[4,4],[T-8,4],[4,T-8],[T-8,T-8]]) ctx.fillRect(x + dx, y + dy, 4, 4);
    } else {
      const left = t === 3 || t === 5, top = t === 3 || t === 4;
      ctx.fillStyle = '#0e6b1a'; ctx.fillRect(x, y, T, T);
      ctx.fillStyle = '#2fbf3c'; ctx.fillRect(x + (left ? 4 : 0), y + (top ? 4 : 0), T - 4, T - (top ? 4 : 0));
      if (left) { ctx.fillStyle = '#8ef08f'; ctx.fillRect(x + 8, y + (top ? 8 : 0), 5, T - (top ? 8 : 0)); }
      if (top) { ctx.fillStyle = '#0e6b1a'; ctx.fillRect(x, y + 24, T, 4); }
    }
  }

  drawCoins(ctx, camX, time) {
    this.coins.forEach((c, i) => {
      if (c.got || c.x - camX < -32 || c.x - camX > 2000) return;
      const w = Math.max(4, Math.round(Math.abs(Math.cos(time * 4 + i)) * 4) * 4);
      const x = Math.round(c.x - camX + (16 - w) / 2), y = Math.round(c.y + Math.sin(time * 3 + i) * 2);
      ctx.fillStyle = '#b8860b'; ctx.fillRect(x, y, w, 20);
      if (w > 4) { ctx.fillStyle = '#ffcf33'; ctx.fillRect(x + 2, y + 2, w - 4, 16); ctx.fillStyle = '#fff0a0'; ctx.fillRect(x + 2, y + 2, 2, 10); }
    });
  }


  drawLuckyBlocks(ctx, camX, time) {
    for (const b of this.luckyBlocks) {
      const x=Math.round(b.x-camX); if(x < -40 || x > 2000) continue;
      const bob=b.used?0:Math.round(Math.sin(time*5+b.x*.01)*2), by=b.y+bob;
      ctx.fillStyle=b.used?'#9a741e':'#ffcf33'; ctx.fillRect(x+2,by+2,28,28);
      ctx.fillStyle='#fff0a0'; ctx.fillRect(x+4,by+4,24,5); ctx.fillStyle='#6e3a0e'; ctx.fillRect(x,by,32,4);ctx.fillRect(x,by+28,32,4);ctx.fillRect(x,by,4,32);ctx.fillRect(x+28,by,4,32);
      ctx.fillStyle=b.used?'#6e3a0e':'#fff'; ctx.font='bold 22px monospace';ctx.textAlign='center';ctx.fillText(b.used?'✓':'?',x+16,by+24);
    }
  }
  drawHazards(ctx,camX,time) {
    const p=this.movingPlatform; p.phase=time; p.y=p.baseY+Math.sin(time*1.4)*55;
    let x=Math.round(p.x-camX); if(x>-120&&x<2000){ctx.fillStyle='#7143c4';ctx.fillRect(x,p.y,p.w,p.h);ctx.fillStyle='#bca4ff';ctx.fillRect(x,p.y,p.w,5);}
    for(const sp of this.spikes){x=Math.round(sp.x-camX); if(x>-40&&x<2000){ctx.fillStyle='#ddd'; for(let k=0;k<4;k++){ctx.beginPath();ctx.moveTo(x+k*8,sp.y+10);ctx.lineTo(x+k*8+4,sp.y);ctx.lineTo(x+k*8+8,sp.y+10);ctx.fill();}ctx.fillStyle='#f44';ctx.fillRect(x,sp.y+10,32,2);}}
    for(const e of this.enemies){if(e.dead)continue;x=Math.round(e.x-camX);if(x>-40&&x<2000){ctx.fillStyle='#8c2c20';ctx.fillRect(x,e.y+8,24,16);ctx.fillStyle='#f4a261';ctx.fillRect(x+3,e.y,18,10);ctx.fillStyle='#fff';ctx.fillRect(x+6,e.y+4,4,4);ctx.fillRect(x+15,e.y+4,4,4);ctx.fillStyle='#211';ctx.fillRect(x+7,e.y+5,2,2);ctx.fillRect(x+16,e.y+5,2,2);}}
  }

  drawFlag(ctx, camX, time) {
    const x = this.goalX - camX, base = 13 * 32;
    if (x < -64 || x > 2000) return;
    ctx.fillStyle = '#6e3a0e'; ctx.fillRect(x - 12, base - 32, 32, 32);
    ctx.fillStyle = '#e0a030'; ctx.fillRect(x - 10, base - 30, 28, 28);
    ctx.fillStyle = '#eeeeee'; ctx.fillRect(x, base - 32 - 256, 8, 256);
    ctx.fillStyle = '#ffcf33'; ctx.fillRect(x - 4, base - 32 - 268, 16, 16);
    const wave = Math.round(Math.sin(time * 5) * 2) * 2;
    ctx.fillStyle = '#e52521';
    for (let k = 0; k < 5; k++) ctx.fillRect(x - 40 + wave, base - 32 - 248 + k * 8, 40 - k * 8, 8);
  }
}
