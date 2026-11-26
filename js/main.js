/* Integrated stage-two gameplay: levels, quiz blocks, lives, enemies, and persistent progress. */
(() => {
  const canvas=document.getElementById('game'), ctx=canvas.getContext('2d'), VIEW={w:canvas.width,h:canvas.height}, STEP=1/60;
  const names=['Positive World','Comparative Forest','Superlative Mountain','Grammar Challenge','Final Challenge'];
  const saved=(()=>{try{return JSON.parse(localStorage.getItem('englishAdventureSave')||'{}')}catch{return {}}})();
  const game={state:'menu',level:Math.max(1,Math.min(5,saved.level||1)),unlocked:Math.max(1,Math.min(5,saved.unlocked||1)),high:saved.high||0,score:0,lives:3,coins:0,map:null,player:null,camX:0,time:0,acc:0,last:0,damageLock:0,quizBlock:null,usedQuestions:[],pendingQuiz:null};
  const save=()=>{try{localStorage.setItem('englishAdventureSave',JSON.stringify({level:game.level,unlocked:game.unlocked,high:game.high,score:game.score}))}catch{}};
  const levelName=()=>names[game.level-1];
  function start(level=game.level){game.level=level;game.map=new GameMap(level);game.player=new Player(game.map.spawn.x,game.map.spawn.y);game.player.onJump=()=>GameSound.jump();game.coins=0;game.lives=3;game.camX=0;game.acc=0;game.damageLock=0;game.usedQuestions=[];game.score=game.score||0;UI.setCoins(0,game.map.totalCoins);UI.hideOverlay();UI.show('game');Input.clear();Input.enabled=true;game.state='playing';UI.setHud(game.score,game.lives,game.level,game.high);GameSound.unlock();GameSound.playBackgroundMusic();}
  function menu(){game.state='menu';Input.enabled=false;Input.clear();closeQuiz();UI.hideOverlay();UI.show('menu');}
  function pause(){if(game.state!=='playing')return;game.state='paused';Input.enabled=false;Input.clear();UI.overlay('Paused','Game paused sementara.','Resume',resume);}
  function resume(){UI.hideOverlay();Input.enabled=true;game.state='playing';game.last=performance.now();}
  function showQuiz(block){game.quizBlock=block;game.state='quiz';Input.enabled=false;Input.clear();const pool=QuizBank.filter(q=>q.level===game.level);let unused=pool.filter(q=>!game.usedQuestions.includes(q));if(!unused.length){game.usedQuestions=[];unused=pool;}const q=unused[Math.floor(Math.random()*unused.length)];game.usedQuestions.push(q);const order=q.a.map((v,i)=>({v,i}));for(let i=order.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[order[i],order[j]]=[order[j],order[i]];}game.pendingQuiz={q,order,answered:false};const modal=document.getElementById('quiz-modal');modal.innerHTML=`<div class="quiz-card"><div class="quiz-tag">${levelName()} • Lucky Block</div><h2>Question!</h2><p class="quiz-question">${q.q}</p><div class="quiz-answers">${order.map((o,i)=>`<button class="quiz-answer" data-choice="${i}"><b>${'ABCD'[i]}.</b> ${o.v}</button>`).join('')}</div><div id="quiz-feedback" class="quiz-feedback"></div><button id="quiz-close" class="btn" disabled>Continue</button></div>`;modal.classList.remove('hidden');modal.querySelectorAll('.quiz-answer').forEach(b=>b.onclick=()=>answerQuiz(+b.dataset.choice));document.getElementById('quiz-close').onclick=closeQuiz;}
  function answerQuiz(choice){const p=game.pendingQuiz;if(!p||p.answered)return;p.answered=true;const right=p.order[choice].i===p.q.correct;const fb=document.getElementById('quiz-feedback');if(right){game.score+=100;game.high=Math.max(game.high,game.score);fb.innerHTML='<strong class="correct">Correct! +100 points</strong><p>'+p.q.exp+'</p>';GameSound.correctAnswer();}else{damage(1);game.high=Math.max(game.high,game.score);fb.innerHTML='<strong class="wrong">Not quite!</strong><p>'+p.q.exp+'</p>';GameSound.wrongAnswer();}game.map.luckyBlocks.forEach(b=>{if(b===game.quizBlock)b.used=true;});p.order.forEach((o,i)=>{const btn=document.querySelector(`[data-choice="${i}"]`);btn.disabled=true;if(o.i===p.q.correct)btn.classList.add('answer-correct');else if(i===choice)btn.classList.add('answer-wrong');});document.getElementById('quiz-close').disabled=false;UI.setHud(game.score,game.lives,game.level,game.high);save();}
  function closeQuiz(){const modal=document.getElementById('quiz-modal');if(modal)modal.classList.add('hidden');game.pendingQuiz=null;game.quizBlock=null;if(game.state==='quiz'){if(game.lives<=0)gameOver();else{game.state='playing';Input.enabled=true;game.last=performance.now();}}}
  function damage(n=1){if(game.damageLock>0||!['playing','quiz'].includes(game.state))return;game.lives=Math.max(0,game.lives-n);game.damageLock=1.15;game.player.vy=-260;game.player.hitTimer=.45;GameSound.playerHit();UI.setHud(game.score,game.lives,game.level,game.high);if(game.lives<=0)gameOver();}
  function gameOver(){game.state='over';GameSound.gameOver();Input.enabled=false;Input.clear();const qm=document.getElementById('quiz-modal');if(qm)qm.classList.add('hidden');game.high=Math.max(game.high,game.score);save();UI.overlay('Game Over',`Score: ${game.score} • Best: ${game.high}`,'Restart',()=>{game.score=0;start(game.level);});}
  function levelComplete(){game.state='complete';GameSound.levelComplete();Input.enabled=false;Input.clear();game.high=Math.max(game.high,game.score);if(game.level===5){save();UI.overlay('Victory!',`You finished all five worlds! Score: ${game.score} • Best: ${game.high}`,'Play Again',()=>{game.level=1;game.score=0;game.unlocked=1;save();start(1);});}else{game.unlocked=Math.max(game.unlocked,game.level+1);save();UI.overlay('Level Complete!',`${levelName()} cleared! Score: ${game.score}`,'Next Level',()=>start(game.level+1));}}
  function update(dt){const map=game.map,p=game.player;game.damageLock=Math.max(0,game.damageLock-dt);const oldY=p.y,oldVy=p.vy;map.movingPlatform.phase=game.time;map.movingPlatform.y=map.movingPlatform.baseY+Math.sin(game.time*1.4)*55;
    p.update(dt,map);
    // Head-bump trigger: one-shot block, overlapping player horizontally as they hit its underside.
    const hb=p.hitHeadBlock,hit=hb&&map.luckyBlocks.find(b=>!b.used&&b.x/map.TILE===hb.c&&b.y/map.TILE===hb.r);if(hit&&game.state==='playing'){GameSound.luckyBlock();showQuiz(hit);}
    // Moving platform support
    const mp=map.movingPlatform;if(p.vy>=0&&oldY+p.h<=mp.y+3&&p.y+p.h>=mp.y&&p.x+p.w>mp.x&&p.x<mp.x+mp.w){p.y=mp.y-p.h;p.vy=0;p.onGround=true;}
    const got=map.collectCoins(p);if(got){game.coins+=got;game.score+=got*10;game.high=Math.max(game.high,game.score);UI.setCoins(game.coins,map.totalCoins);UI.setHud(game.score,game.lives,game.level,game.high);GameSound.coin();}
    // Hazards and enemies; invulnerability lock prevents repeated loss on one contact.
    for(const sp of map.spikes)if(Physics.overlap(p,sp))damage();
    for(const e of map.enemies){
      if(e.dead)continue;
      // Enemy vertical physics uses world coordinates and the same tile collision as the player.
      const prevBottom=e.y+e.h;
      e.vy=Math.min((e.vy||0)+Physics.GRAVITY*dt,Physics.MAX_FALL);
      Physics.moveY(e,map,dt);
      // Also land on the moving platform (crossing its top while falling).
      const mp=map.movingPlatform;
      if(e.vy>=0&&prevBottom<=mp.y+3&&e.y+e.h>=mp.y&&e.x+e.w>mp.x&&e.x<mp.x+mp.w){e.y=mp.y-e.h;e.vy=0;e.onGround=true;}
      // Patrol only while supported: turn at patrol bounds, walls, or an unsupported edge.
      const dir=e.vx>=0?1:-1, speed=Math.abs(e.vx)||70, nextX=e.x+dir*speed*dt;
      const edgeX=dir>0?nextX+e.w-1:nextX;
      const edgeCol=Math.floor(edgeX/map.TILE), footRow=Math.floor((e.y+e.h+2)/map.TILE);
      const wallRow0=Math.floor((e.y+2)/map.TILE), wallRow1=Math.floor((e.y+e.h-2)/map.TILE);
      let wall=false;for(let r=wallRow0;r<=wallRow1;r++)if(map.isSolid(edgeCol,r)){wall=true;break;}
      const hasSupport=map.isSolid(edgeCol,footRow)|| (e.y+e.h<=mp.y+2&&e.y+e.h+2>=mp.y&&edgeX>mp.x&&edgeX<mp.x+mp.w);
      if(nextX<e.lo||nextX>e.hi-e.w||wall||!hasSupport){e.vx=-dir*speed;}else{e.x=nextX;}
      if(Physics.overlap(p,e)){if(oldY+p.h<=e.y+8&&p.vy>0){e.dead=true;p.vy=-390;GameSound.coin();game.score+=150;game.high=Math.max(game.high,game.score);save();UI.setHud(game.score,game.lives,game.level,game.high);}else damage();}
    }
    if(p.y>map.height+64){damage();if(game.state==='playing'){p.reset(map.spawn.x,map.spawn.y);game.camX=0;}}
    if(game.state!=='playing')return;
    if(p.x+p.w>map.goalX)levelComplete();const target=p.x+p.w/2-VIEW.w*.4;game.camX=Math.max(0,Math.min(map.width-VIEW.w,game.camX+(target-game.camX)*.12));
  }
  function render(){if(!game.map)return;game.map.draw(ctx,game.camX,VIEW,game.time);game.player.draw(ctx,Math.round(game.camX));}
  function loop(now){requestAnimationFrame(loop);const frame=Math.min((now-game.last)/1000,.1);game.last=now;if(game.state==='playing'){game.acc+=frame;while(game.acc>=STEP&&game.state==='playing'){update(STEP);game.acc-=STEP;game.time+=STEP;}}if(game.state!=='menu')render();}
  addEventListener('keydown',e=>{if(e.code==='Escape'||e.code==='KeyP'){if(game.state==='playing')pause();else if(game.state==='paused')resume();}});
  addEventListener('viewchange',()=>{VIEW.w=canvas.width;VIEW.h=canvas.height;ctx.imageSmoothingEnabled=false;});
  const checkOrientation=()=>{if(Display.isTouch()&&Display.isPortrait()&&game.state==='playing')pause();};
  addEventListener('resize',checkOrientation);addEventListener('orientationchange',checkOrientation);
  Input.init();UI.init({play:()=>{game.score=0;game.level=game.unlocked;start(game.level);},menu});
  const touchStage=()=>document.getElementById('stage').classList.toggle('mobile-controls',window.innerWidth<=850||window.matchMedia('(pointer: coarse)').matches);touchStage();addEventListener('resize',touchStage);ctx.imageSmoothingEnabled=false;requestAnimationFrame(t=>{game.last=t;loop(t);});
})();
