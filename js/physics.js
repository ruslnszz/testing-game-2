/* Physics: konstanta dunia + deteksi tabrakan tile (sumbu X dan Y dipisah). */
const Physics = {
  GRAVITY: 2200,        // px/s²
  MAX_FALL: 900,        // kecepatan jatuh maksimum (px/s)
  MOVE_SPEED: 230,      // kecepatan lari maksimum (px/s)
  ACCEL: 1800,          // percepatan gerak
  FRICTION: 2200,       // perlambatan saat tombol dilepas
  JUMP_VELOCITY: -720,  // tinggi lompatan (±117px)
  JUMP_CUT: 0.45,       // lompatan lebih pendek jika tombol dilepas lebih awal
  COYOTE_TIME: 0.08,    // toleransi lompat sesaat setelah meninggalkan tepi
  JUMP_BUFFER: 0.1,     // toleransi tombol lompat ditekan sesaat sebelum mendarat

  /** Gerak horizontal + tabrakan. body: {x,y,w,h,vx,vy} */
  moveX(b, map, dt) {
    b.x += b.vx * dt;
    const T = map.TILE;
    const r0 = Math.floor(b.y / T), r1 = Math.floor((b.y + b.h - 0.01) / T);
    const c0 = Math.floor(b.x / T), c1 = Math.floor((b.x + b.w - 0.01) / T);
    for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
      if (!map.isSolid(c, r)) continue;
      if (b.vx > 0) b.x = c * T - b.w; else if (b.vx < 0) b.x = (c + 1) * T;
      b.vx = 0;
      return;
    }
  },

  /** Gerak vertikal + tabrakan. Mengisi b.onGround. */
  moveY(b, map, dt) {
    b.hitHeadBlock = null;
    b.y += b.vy * dt;
    b.onGround = false;
    const T = map.TILE;
    const c0 = Math.floor(b.x / T), c1 = Math.floor((b.x + b.w - 0.01) / T);
    const r0 = Math.floor(b.y / T), r1 = Math.floor((b.y + b.h - 0.01) / T);
    for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
      if (!map.isSolid(c, r)) continue;
      if (b.vy > 0) { b.y = r * T - b.h; b.onGround = true; }
      else if (b.vy < 0) { b.y = (r + 1) * T; b.hitHeadBlock = {c, r}; }
      b.vy = 0;
      return;
    }
  },

  overlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }
};
