(() => {
  const canvas = document.querySelector('#game');
  const ctx = canvas.getContext('2d');
  const ui = {
    eggs: document.querySelector('#eggCount'), distance: document.querySelector('#distance'), best: document.querySelector('#best'),
    start: document.querySelector('#startScreen'), over: document.querySelector('#gameOverScreen'), final: document.querySelector('#finalLine'),
    toast: document.querySelector('#toast'), sound: document.querySelector('#soundButton'), healthBar:document.querySelector('#healthBar'), healthFill:document.querySelector('#healthFill'),
    demo:document.querySelector('#demoScreen'),demoCharacter:document.querySelector('#demoCharacter'),demoPrevious:document.querySelector('#demoPrevious'),demoName:document.querySelector('#demoName'),deathAnimal:document.querySelector('#deathAnimal'),recordSplash:document.querySelector('#recordSplash'),
    startEyebrow:document.querySelector('#startEyebrow'),startIntro:document.querySelector('#startIntro'),startBurst:document.querySelector('#startBurst'),overEyebrow:document.querySelector('#overEyebrow'),shopEyebrow:document.querySelector('#shopEyebrow'),shopIntro:document.querySelector('#shopIntro'),demoEyebrow:document.querySelector('#demoEyebrow')
  };
  const sprites = {};
  const spriteFiles={festivalStallRed:'festival-stall-red.png',festivalStallBlue:'festival-stall-blue.png',pigRunningFront:'pig-running-front.png',pigRunningSheet:'pigs running 2.png',festivalFoodStall:'festival-food-stall.png',goat:'goat-clean.png',goatStride:'goat-stride.png',goatRightA:'goat-right-a.png',goatRightB:'goat-right-b.png',goatPink:'goat-pink.png',goatStridePink:'goat-stride-pink.png',goatRightAPink:'goat-right-a-pink.png',goatRightBPink:'goat-right-b-pink.png',goatCartWhite:'goat-cart-white.png',goatCartPink:'goat-cart-pink.png',goatCartRightWhite:'goat-cart-right-white.png',goatCartRightPink:'goat-cart-right-pink.png',goatCarWhite:'goat-car-white.png',goatCarPink:'goat-car-pink.png',goatCarRightWhite:'goat-car-right-white.png',goatCarRightPink:'goat-car-right-pink.png',chick1:'chick-1.png',chick2:'chick-2.png',chick3:'chick-3.png',chick4:'chick-4.png',regularChicken1:'regular-chicken-1.png',regularChicken2:'regular-chicken-2.png',regularChicken3:'regular-chicken-3.png',regularChicken4:'regular-chicken-4.png',buffChicken1:'buff-chicken-1.png',buffChicken2:'buff-chicken-2.png',buffChicken3:'buff-chicken-3.png',buffChicken4:'buff-chicken-4.png',farmBackground:'farm-background-plate.png',barnForeground:'barn-foreground.png',farmCloud:'farm-cloud.png',cow3d:'cow-3d.png',highlandCowHappy3d:'highland-cow-3d.png',highlandCowShaggy3d:'highland-cow-shaggy-3d.png',horse3d:'horse-3d.png',pig3d:'pig-3d.png',llama3d:'llama-3d.png',egg:'egg-3d.png',goldCrown3d:'gold-crown-3d.png',farmer3d:'farmer-angry-3d.png',farmWife3d:'farmers-wife-muffins-3d.png',farmersAngryPose3d:'farmers-angry-pose-3d.png',blingShadesBack:'bling-shades-back.png',blingShades45:'bling-shades-45.png',blingChainBack:'bling-chain-back.png',blingChain45:'bling-chain-45.png',blingMohawkBack:'bling-mohawk-back.png',blingMohawk45:'bling-mohawk-45.png',blingCrownBack:'bling-crown-back.png',blingCrown45:'bling-crown-45.png'};
  const chainEmblems=['angular','rounded','paw'];
  let chainEmblemIndex=0;
  for(const emblem of chainEmblems)for(const view of ['Back','45'])spriteFiles[`chain_${emblem}_${view}`]=`bling-chain-${emblem}-${view.toLowerCase()}.png`;
  for (const [name,file] of Object.entries(spriteFiles)) { const img=new Image(); img.src=`assets/${file}`; sprites[name]=img; }
  const chickenTypes={
    chick:{frames:['chick1','chick2','chick3','chick4'],width:58,height:74,footPadding:0},
    regular:{frames:['regularChicken1','regularChicken2','regularChicken3','regularChicken4'],width:88,height:118,footPadding:0},
    pig:{frames:['pigRunningFront'],width:92,height:138,footPadding:0},
    buff:{frames:['buffChicken1','buffChicken2','buffChicken3','buffChicken4'],width:118,height:177,footPadding:43}
  };

  let W=0,H=0,dpr=1,last=0,state='menu',distance=0,runEggs=0,health=100,bank=Number(localStorage.getItem('goatEggs')||0),best=Number(localStorage.getItem('goatBest')||0),speed=18;
  const LANES=[-.8,-.4,0,.4,.8];
  let level=1,confetti=[];
  const levelLength=()=>500+(level-1)*150;
  const levelHud=document.querySelector('#levelHud'),levelLabel=document.querySelector('#levelLabel'),levelProgress=document.querySelector('#levelProgress'),festival=document.querySelector('#festivalScreen');
  function finishLevel(){
    if(state!=='playing')return;
    cancelDemo();distance=levelLength();checkMilestones();state='festival';syncStateScreens();input.jumpHeld=false;objects=[];player.y=0;player.vy=0;
    const reward=10+level*5;bank+=reward;saveShop();ui.eggs.textContent=bank;
    best=Math.max(best,Math.floor(distance));localStorage.setItem('goatBest',best);ui.best.textContent=best;
    ui.distance.textContent=Math.floor(distance);levelProgress.value=100;
    document.querySelector('#festivalResult').textContent=`Level ${level} complete! ${Math.floor(distance)}m of farm chaos. +${reward} festival eggs!`;
    document.querySelector('#nextLevelButton').textContent=`LEVEL ${level+1} — ${level===1?'PIGS ON THE LOOSE!':'MORE FARM CHAOS!'}`;
    festival.classList.remove('hidden');document.querySelector('#nextLevelButton').focus();
    confetti=Array.from({length:360},()=>({x:Math.random(),y:-Math.random(),speed:.12+Math.random()*.2,spin:Math.random()*6,color:['#ffe166','#ff7849','#8bd450','#f768bf','#76dfff'][Math.floor(Math.random()*5)]}));
    beep(880,.25,'sine');
  }
  function nextLevel(){level++;reset(true);}
  document.querySelector('#nextLevelButton').onclick=nextLevel;
  document.querySelector('#festivalShopButton').onclick=()=>openShop();
  function drawFestival(t){
    const remaining=levelLength()-distance;
    if(state!=='festival'&&!(state==='playing'&&remaining<180))return;
    const approach=Math.max(0,1-remaining/180),offset=(1-approach)*.85;
    const colors=['#ff7849','#ffe166','#76dfff','#f768bf'];
    ctx.save();ctx.globalAlpha=Math.min(1,approach*5);
    // Every prop shares the track projection: distant stalls and fences grow as we enter.
    function point(x,z,height=0){const p=project(x,z+offset);return {x:p.x,y:p.y-height*p.s,s:p.s};}
    function beam(a,b,width,color){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}
    function polygon(points,color){ctx.fillStyle=color;ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fill();}
    function stall(side,z){
      const name=side<0?'festivalStallBlue':'festivalStallRed',p=point(side<0?-.82:1.15,z),img=sprites[name];
      if(!img.complete||!img.naturalWidth)return;
      const width=Math.min(W*.42,325*p.s*Math.min(1.25,W/760)),height=width*img.naturalHeight/img.naturalWidth,edge=width*.52+8;
      p.x=Math.max(edge,Math.min(W-edge,p.x));
      ctx.fillStyle='rgba(35,23,10,.2)';ctx.beginPath();ctx.ellipse(p.x,p.y,width*.47,width*.07,0,0,7);ctx.fill();
      drawSprite(name,p.x,p.y,width,height);
    }
    // Draw far to near so the festival has real depth and overlap.
    for(let row=5;row>=0;row--){const z=.05+row*.13;
      for(const side of [-1,1]){
        const a=point(side*1.06,z),b=point(side*1.06,z+.13);
        for(const h of [20,43])beam({x:a.x,y:a.y-h*a.s},{x:b.x,y:b.y-h*b.s},Math.max(2,5*a.s),'#e6bd7b');
        beam(a,{x:a.x,y:a.y-62*a.s},Math.max(3,9*a.s),'#91603a');
        beam({x:a.x-2*a.s,y:a.y-60*a.s},{x:a.x-2*a.s,y:a.y-5*a.s},Math.max(1,2*a.s),'#ffdc99');
      }
      if(row===3){stall(-1,z);stall(1,z);}

      const cast=['cow3d','pig3d','chick2','highlandCowHappy3d','farmWife3d','farmer3d'];
      for(const side of [-1,1]){const p=point(side*(.7+(row%2)*.08),z-.04),name=cast[(row+(side>0?2:0))%cast.length],img=sprites[name],phoneScale=W<=600?.7:1,height=(name==='chick2'?72:132)*p.s*phoneScale,bob=Math.abs(Math.sin(t*.005+row+side))*5*p.s;drawSprite(name,p.x,p.y-bob,height*(img.naturalWidth/img.naturalHeight||1),height,side<0);}
    }
    const left=point(-1,.18,190),right=point(1,.18,190);
    for(const side of [-1,1]){const base=point(side,.18);beam(base,point(side,.18,207),Math.max(4,12*base.s),'#89532b');}
    beam(left,right,Math.max(2,3*left.s),'#fff9e8');
    for(let i=0;i<14;i++){const f=i/14,x=left.x+(right.x-left.x)*f,y=left.y+Math.sin(f*Math.PI)*13*left.s,w=(right.x-left.x)/14;polygon([{x,y},{x:x+w,y},{x:x+w/2,y:y+25*left.s}],colors[i%4]);}
    if(approach>.65){const pieces=state==='festival'?confetti:Array.from({length:100},(_,i)=>({x:(i*.618)%1,y:(i*.37)%1,speed:.2,spin:i,color:colors[i%4]}));for(const p of pieces){const y=((t*.0001*p.speed+p.y)%1.2+1.2)%1.2;ctx.save();ctx.translate(p.x*W,y*H);ctx.rotate(t*.002+p.spin);ctx.fillStyle=p.color;ctx.fillRect(-4,-3,8,6);ctx.restore();}}
    ctx.restore();
  }
  const milestoneUI = {
    banner:document.querySelector('#milestone'), title:document.querySelector('#milestoneTitle'),
    detail:document.querySelector('#milestoneDetail'), reward:document.querySelector('#milestoneReward')
  };
  const milestones = [
    {id:'jumps',title:'LICENSE TO FLY!',detail:'Jumped over 5 chickens.',reward:5,reached:()=>runMilestones.jumps>=5},
    {id:'clean',title:'UNTOUCHABLE BLEAT!',detail:'500m without a scratch.',reward:10,reached:()=>distance-runMilestones.lastDamage>=500},
    {id:'eggs',title:'THE YOLK HEIST!',detail:'Collected 10 eggs in one run.',reward:5,reached:()=>runEggs>=10},
    {id:'distance',title:'CERTIFIED FARM MENACE!',detail:'Ran 1,000m. Still no insurance.',reward:10,reached:()=>distance>=1000}
  ];
  let runMilestones={jumps:0,lastDamage:0,bonus:0,earned:new Set()}, milestoneQueue=[], milestoneTimer=0;
  function resetMilestones(){
    clearTimeout(milestoneTimer);milestoneTimer=0;milestoneQueue=[];
    runMilestones={jumps:0,lastDamage:0,bonus:0,earned:new Set()};
    milestoneUI.banner.classList.add('hidden');
  }
  function showNextMilestone(){
    if(!milestoneQueue.length){milestoneTimer=0;milestoneUI.banner.classList.add('hidden');return;}
    const goal=milestoneQueue.shift();
    milestoneUI.title.textContent=goal.title;milestoneUI.detail.textContent=goal.detail;
    milestoneUI.reward.textContent=`+${goal.reward} EGGS`;
    milestoneUI.banner.classList.add('hidden');void milestoneUI.banner.offsetWidth;
    milestoneUI.banner.classList.remove('hidden');beep(880,.16,'sine');
    milestoneTimer=setTimeout(showNextMilestone,3400);
  }
  function checkMilestones(){
    for(const goal of milestones){
      if(runMilestones.earned.has(goal.id)||!goal.reached())continue;
      runMilestones.earned.add(goal.id);runMilestones.bonus+=goal.reward;bank+=goal.reward;
      saveShop();ui.eggs.textContent=bank;milestoneQueue.push(goal);
    }
    if(!milestoneTimer&&milestoneQueue.length)showNextMilestone();
  }
  const input={jumpHeld:false};
  const splashPairs=[['assets/highland-cow-shaggy-3d.png','assets/cow-3d.png'],['assets/highland-cow-3d.png','assets/pig-3d.png'],['assets/horse-3d.png','assets/llama-3d.png'],['assets/cow-3d.png','assets/highland-cow-3d.png'],['assets/pig-3d.png','assets/highland-cow-shaggy-3d.png'],['assets/farmer-angry-3d.png','assets/farmers-wife-muffins-3d.png']];
  const splashA=document.querySelector('#splashAnimalA'),splashB=document.querySelector('#splashAnimalB'),splashGroup=splashA.parentElement;let highlandRunNumber=Number(localStorage.getItem('goatHighlandRun')||0),currentHighlandSprite=highlandRunNumber%2?'highlandCowHappy3d':'highlandCowShaggy3d';
  function cycleSplashAnimals(){const previous=Number(localStorage.getItem('goatSplashPair')??-1),next=(previous+1)%splashPairs.length;localStorage.setItem('goatSplashPair',next);[splashA.src,splashB.src]=splashPairs[next];splashGroup.classList.toggle('farmer-pair',next===splashPairs.length-1);}
  function cycleHighland(){highlandRunNumber++;localStorage.setItem('goatHighlandRun',highlandRunNumber);currentHighlandSprite=highlandRunNumber%2?'highlandCowHappy3d':'highlandCowShaggy3d';}
  cycleSplashAnimals();
  const screenCopy={
    start:[
      ['NO GOATS WERE CONSULTED','Run first. Think later. Send the repair bill to the chickens.','BAAA-D IDEA!'],
      ['FARM SAFETY HAS LEFT THE CHAT','Five lanes. Too many chickens. One goat with absolutely no insurance.','EGGSCUSE ME!'],
      ["THE WORLD'S LEAST SANCTIONED FARM SPORT",'Collect eggs, dodge poultry, and maintain a completely undeserved confidence.','BAGAWK!'],
      ['TRAINED BY ABSOLUTELY NOBODY','The goat has a plan. Unfortunately, the plan is mostly running.','HOOF IT!'],
      ['A TERRIBLE DAY TO BE A FENCE','Speed, eggs, feathers, and agricultural consequences.','OH, CLUCK!']
    ],
    over:[
      ['THE CHICKEN HAS LAWYERED UP'],['OFFICIAL RACE INCIDENT REPORT'],['THAT WENT BAA-DLY'],['CAUSE OF CRASH: FARM'],['THE ROAD HAS BEEN PECKED CLEAN'],['FEATHERS HAVE BEEN NOTIFIED']
    ],
    shop:[
      ['FINANCIALLY IRRESPONSIBLE FASHION','Turn stolen eggs into accessories of questionable agricultural value.'],
      ['NO RECEIPTS. ONLY REGRETS.','Dress for the job you want: regional goat celebrity.'],
      ['FARM-FRESH DRIP','Because being fast is temporary. Looking ridiculous is forever.'],
      ['THE CHICKENS PAID FOR THIS','Premium goat fashion. Ethics department currently out to lunch.'],
      ['COUTURE, BUT WITH HAY','Every purchase is final. Especially the mohawk.']
    ],
    demo:[['NO GOATS WERE CONSULTED'],['PLEASE DO NOT FEED THE CAST'],['LIVE FROM AN UNDISCLOSED BARN'],['ANIMALS MAY BE LARGER THAN SHOWN'],['THE FARMERS DENY EVERYTHING']]
  };
  const copyIndex={start:-1,over:-1,shop:-1,demo:-1};
  function nextCopy(screen){const choices=screenCopy[screen],index=copyIndex[screen]=(copyIndex[screen]+1)%choices.length;return choices[index];}
  function cycleScreenCopy(screen){const copy=nextCopy(screen);if(screen==='start'){[ui.startEyebrow.textContent,ui.startIntro.textContent,ui.startBurst.textContent]=copy;}else if(screen==='over')ui.overEyebrow.textContent=copy[0];else if(screen==='shop'){ui.shopEyebrow.textContent=copy[0];ui.shopIntro.textContent=copy[1];}else if(screen==='demo')ui.demoEyebrow.textContent=copy[0];}
  cycleScreenCopy('start');
  const demoCharacters=[['cow3d','THE COW'],['highlandCowHappy3d','THE HIGHLAND COW'],['horse3d','THE HORSE'],['pig3d','THE PIG'],['llama3d','THE LLAMA'],['chick2','THE TINY MENACE'],['regularChicken2','THE CHICKEN'],['buffChicken2','THE ABSOLUTE UNIT'],['farmer3d','THE FARMER'],['farmWife3d','THE MUFFIN BOSS']];
  let demoTimer=0,demoInterval=0,demoIndex=0,demoGeneration=0;
  function cancelDemo(){demoGeneration++;clearTimeout(demoTimer);clearInterval(demoInterval);demoTimer=0;demoInterval=0;}
  function syncStateScreens(){const menu=state==='menu',demo=state==='demo',over=state==='over',atFestival=state==='festival';ui.start.classList.toggle('hidden',!menu);ui.demo.classList.toggle('hidden',!demo);ui.demo.setAttribute('aria-hidden',String(!demo));ui.over.classList.toggle('hidden',!over);festival.classList.toggle('hidden',!atFestival);}
  function scheduleDemo(){clearTimeout(demoTimer);const generation=++demoGeneration;if(state==='menu')demoTimer=setTimeout(()=>enterDemo(generation),11000);}
  function rotateDemo(){const previous=demoCharacters[demoIndex%demoCharacters.length],next=demoCharacters[(++demoIndex)%demoCharacters.length];ui.demoPrevious.src=sprites[previous[0]].src;ui.demoPrevious.classList.remove('demo-previous');void ui.demoPrevious.offsetWidth;ui.demoPrevious.classList.add('demo-previous');ui.demoCharacter.src=sprites[next[0]].src;ui.demoCharacter.style.animation='none';void ui.demoCharacter.offsetWidth;ui.demoCharacter.style.animation='';ui.demoName.textContent=next[1];}
  function enterDemo(generation=demoGeneration){if(generation!==demoGeneration||state!=='menu'||!festival.classList.contains('hidden'))return;if(!shop.screen.classList.contains('hidden'))return scheduleDemo();state='demo';cycleScreenCopy('demo');syncStateScreens();demoIndex=0;ui.demoPrevious.src=sprites[demoCharacters.at(-1)[0]].src;ui.demoCharacter.src=sprites[demoCharacters[0][0]].src;ui.demoName.textContent=demoCharacters[0][1];demoInterval=setInterval(rotateDemo,2400);}
  function exitDemo(){if(state!=='demo')return;cancelDemo();state='menu';cycleScreenCopy('start');syncStateScreens();scheduleDemo();}
  scheduleDemo();
  let player={lane:2,x:0,targetX:0,depth:.025,targetDepth:.025,y:0,vy:0,jumpHold:0,turnDir:0,turnUntil:0}, objects=[], particles=[], spawnClock=0, audioMode=localStorage.getItem('goatAudioMode')||'music', audioCtx, lastBleat=-1;
  if(!['music','sounds','none'].includes(audioMode))audioMode='music';const musicEnabled=()=>audioMode==='music',soundsEnabled=()=>audioMode!=='none';ui.sound.textContent=`AUDIO: ${audioMode.toUpperCase()}`;
  const goatJumpSounds=[1,2,3,4].map(n=>{const audio=new Audio(`assets/audio/goat-jump-${n}.wav`);audio.preload='auto';audio.volume=.42;return audio;});
  const roosterStartSound=new Audio('assets/audio/rooster-start.wav');roosterStartSound.preload='auto';roosterStartSound.volume=.5;
  const chickenWaveSound=new Audio('assets/audio/chicken-clucking.wav');chickenWaveSound.preload='auto';chickenWaveSound.volume=.3;
  const chickWaveSound=new Audio('assets/audio/baby-chicks-chirp.wav');chickWaveSound.preload='auto';chickWaveSound.volume=.34;
  const chickenAmbience=new Audio('assets/audio/chicken-clucking.wav');chickenAmbience.preload='auto';chickenAmbience.loop=true;chickenAmbience.volume=.16;
  const deathSound=new Audio('assets/audio/death-sad-trombone.mp3');deathSound.preload='auto';deathSound.volume=.55;
  const music={empacotatron:new Audio('assets/audio/empacotatron.ogg')};
  Object.values(music).forEach(track=>{track.preload='auto';track.loop=true;});music.empacotatron.volume=.2;
  const lastWaveSound={chick:-Infinity,chicken:-Infinity};let waveSoundsReadyAt=0,musicStartTimer=0;
  const shop = {
    screen:document.querySelector('#shopScreen'), grid:document.querySelector('#shopGrid'), wallet:document.querySelector('#shopEggCount'), message:document.querySelector('#shopMessage'),
    items:[
      {id:'shades',name:'Mega Shades',desc:'Instant celebrity. Zero UV testing.',price:5,icon:'😎',slot:'face'},
      {id:'chain',name:'Golden Bling',desc:'Three emblems. A new one each run.',price:9,icon:'🏅',slot:'neck'},
      {id:'mohawk',name:'Rad Mohawk',desc:'Aerodynamic? Absolutely not.',price:12,icon:'🪮',slot:'hair'},
      {id:'crown',name:'Golden Goat Crown',desc:'Polished gold. Royal nonsense.',price:20,icon:'👑',slot:'hair'},
      {id:'pink',name:'Pretty Pink Fur',desc:'Soft pink. Still barn-safe-ish.',price:14,icon:'🩷',slot:'fur'},
      {id:'blue',name:'Electric Blue Fur',desc:'Visible from adjacent farms.',price:18,icon:'💙',slot:'fur'},
      {id:'cart',name:'Wobbly Cart',desc:'Four wheels. Roughly.',price:28,icon:'🛒',slot:'ride'},
      {id:'car',name:'Goatmobile',desc:'Zero doors. Maximum horsepower.',price:55,icon:'🏎️',slot:'ride'}
    ],
    owned:JSON.parse(localStorage.getItem('goatOwned')||'[]'), equipped:JSON.parse(localStorage.getItem('goatEquipped')||'{}')
  };
  ui.best.textContent=best;ui.eggs.textContent=bank;

  function saveShop(){localStorage.setItem('goatEggs',bank);localStorage.setItem('goatOwned',JSON.stringify(shop.owned));localStorage.setItem('goatEquipped',JSON.stringify(shop.equipped));}
  function updateHealth(){ui.healthFill.style.width=`${health}%`;ui.healthFill.style.background=health>50?'var(--green)':health>25?'var(--yellow)':'var(--orange)';ui.healthBar.setAttribute('aria-valuenow',health);}
  function renderShop(){
    ui.eggs.textContent=bank;shop.wallet.textContent=bank;
    shop.grid.innerHTML=shop.items.map(item=>{const owned=shop.owned.includes(item.id),equipped=shop.equipped[item.slot]===item.id;return `<article class="shop-card ${equipped?'equipped':''}"><div class="preview">${item.icon}</div><h3>${item.name}</h3><p>${item.desc}</p><button data-buy="${item.id}">${equipped?'REMOVE':owned?'EQUIP':`${item.price} EGGS`}</button></article>`}).join('');
  }
  function openShop(){if(state==='playing')return;cycleScreenCopy('shop');renderShop();shop.screen.classList.remove('hidden');}
  function closeShop(){shop.screen.classList.add('hidden');}
  document.querySelector('#shopButton').onclick=openShop;document.querySelector('#gameOverShopButton').onclick=openShop;document.querySelector('#closeShopButton').onclick=closeShop;
  shop.grid.onclick=e=>{const btn=e.target.closest('[data-buy]');if(!btn)return;const item=shop.items.find(x=>x.id===btn.dataset.buy);if(shop.equipped[item.slot]===item.id){delete shop.equipped[item.slot];shop.message.textContent=`REMOVED: ${item.name}. Back to the natural look.`;saveShop();renderShop();return;}if(!shop.owned.includes(item.id)){if(bank<item.price){shop.message.textContent=`NEED ${item.price-bank} MORE EGG${item.price-bank===1?'':'S'} FOR ${item.name.toUpperCase()}.`;return;}bank-=item.price;shop.owned.push(item.id);shop.message.textContent=`PURCHASED: ${item.name}. The fashion police have been notified.`;beep(620,.08);setTimeout(()=>beep(880,.1),90);}else{shop.message.textContent=`EQUIPPED: ${item.name}. Stunning. Concerning.`;}shop.equipped[item.slot]=item.id;saveShop();renderShop();};

  function resize(){
    const r=canvas.getBoundingClientRect(); dpr=Math.min(devicePixelRatio||1,2); W=r.width; H=r.height;
    const pixelW=Math.max(1,Math.round(W*dpr)),pixelH=Math.max(1,Math.round(H*dpr));
    if(canvas.width===pixelW&&canvas.height===pixelH)return;
    canvas.width=pixelW;canvas.height=pixelH;ctx.setTransform(dpr,0,0,dpr,0,0);
  }
  addEventListener('resize',resize);new ResizeObserver(resize).observe(canvas);resize();

  function beep(freq=440,dur=.08,type='square'){
    if(!soundsEnabled())return; audioCtx ||= new (window.AudioContext||window.webkitAudioContext)();
    const o=audioCtx.createOscillator(),g=audioCtx.createGain(); o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(.055,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+dur);o.connect(g).connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+dur);
  }
  function playGoatBleat(){
    if(!soundsEnabled())return;
    let next=Math.floor(Math.random()*goatJumpSounds.length);
    if(next===lastBleat)next=(next+1+Math.floor(Math.random()*(goatJumpSounds.length-1)))%goatJumpSounds.length;
    lastBleat=next;const sound=goatJumpSounds[next];sound.currentTime=0;sound.play().catch(()=>{});
  }
  function playRooster(){if(soundsEnabled()){roosterStartSound.currentTime=0;roosterStartSound.play().catch(()=>{});}}
  let musicNeedsGesture=false,musicAttempt=0;
  function startMusic(){
    if(!musicEnabled())return;
    const attempt=++musicAttempt;
    music.empacotatron.muted=false;
    music.empacotatron.play().then(()=>{
      if(attempt!==musicAttempt)return;
      musicNeedsGesture=false;ui.sound.textContent='AUDIO: MUSIC';ui.sound.title='Change audio mode';
    }).catch(error=>{
      if(attempt!==musicAttempt||!musicEnabled())return;
      musicNeedsGesture=true;ui.sound.textContent='RETRY MUSIC';
      ui.sound.title=error.name==='NotAllowedError'?'Tap to allow music playback':'Music could not play. Tap to retry.';
      console.warn('Goat music playback failed:',error.name,error.message);
    });
  }
  function retryMusic(){
    if(!musicNeedsGesture||!musicEnabled())return;
    if(music.empacotatron.error)music.empacotatron.load();
    startMusic();
  }
  addEventListener('pointerdown',e=>{if(e.target!==ui.sound&&(state==='playing'||state==='festival'))retryMusic();});
  addEventListener('keydown',e=>{if(e.target!==ui.sound&&(state==='playing'||state==='festival'))retryMusic();});
  function stopMusic(resetTime=false){musicAttempt++;musicNeedsGesture=false;Object.values(music).forEach(track=>{track.pause();if(resetTime)track.currentTime=0;});}
  function updateMusic(){music.empacotatron.volume=.2;}
  function startChickenAmbience(){if(soundsEnabled()&&(state==='menu'||state==='over'))chickenAmbience.play().catch(()=>{});}
  function stopChickenAmbience(){chickenAmbience.pause();chickenAmbience.currentTime=0;}
  function playChickenWaveSound(type){
    if(!soundsEnabled())return;const kind=type==='chick'?'chick':'chicken',now=performance.now(),cooldown=kind==='chick'?4000:12000;if(now<waveSoundsReadyAt)return;
    if(now-lastWaveSound[kind]<cooldown)return;lastWaveSound[kind]=now;const sound=kind==='chick'?chickWaveSound:chickenWaveSound;sound.currentTime=0;sound.play().catch(()=>{});
  }
  function reset(useRooster=false){
    if(shop.equipped.neck==='chain'){
      const saved=Number(localStorage.getItem('goatChainEmblemNext')||0);
      chainEmblemIndex=Number.isInteger(saved)&&saved>=0?saved%chainEmblems.length:0;
      localStorage.setItem('goatChainEmblemNext',(chainEmblemIndex+1)%chainEmblems.length);
    }
    festival.classList.add('hidden');confetti=[];levelHud.classList.remove('hidden');levelLabel.textContent=`LEVEL ${level} · ${levelLength()}m TO THE FESTIVAL`;levelProgress.value=0;
    resetMilestones();
    const roosterDelay=useRooster&&soundsEnabled();cancelDemo();clearTimeout(musicStartTimer);deathSound.pause();deathSound.currentTime=0;stopChickenAmbience();cycleHighland();distance=0;runEggs=0;health=100;updateHealth();speed=18;objects=[];particles=[];spawnClock=0;input.jumpHeld=false;lastWaveSound.chick=-Infinity;lastWaveSound.chicken=-Infinity;waveSoundsReadyAt=performance.now()+(roosterDelay?2350:0);player={lane:2,x:0,targetX:0,targetDepth:.025,depth:.025,y:0,vy:0,jumpHold:0,turnDir:0,turnUntil:0};
    ui.eggs.textContent=bank;ui.distance.textContent='0';closeShop();state='playing';syncStateScreens();canvas.focus();stopMusic(true);updateMusic();startMusic();if(roosterDelay){playRooster();}else{beep(220,.1);setTimeout(()=>beep(440,.12),110);}
  }
  document.querySelector('#startButton').onclick=()=>reset(true); document.querySelector('#restartButton').onclick=()=>reset(true);
  ui.sound.onclick=()=>{if(musicNeedsGesture&&musicEnabled()){retryMusic();return;}const modes=['music','sounds','none'];audioMode=modes[(modes.indexOf(audioMode)+1)%modes.length];localStorage.setItem('goatAudioMode',audioMode);ui.sound.textContent=`AUDIO: ${audioMode.toUpperCase()}`;stopMusic();[...goatJumpSounds,roosterStartSound,chickenWaveSound,chickWaveSound,chickenAmbience,deathSound].forEach(sound=>{sound.pause();sound.currentTime=0;});if(musicEnabled()&&state==='playing')startMusic();if(soundsEnabled()){beep(520,.05);startChickenAmbience();}};
  addEventListener('pointerdown',()=>startChickenAmbience(),{once:true});addEventListener('keydown',()=>startChickenAmbience(),{once:true});

  function steer(dir){if(state==='playing'){const next=Math.max(0,Math.min(4,player.lane+dir));if(next!==player.lane){player.lane=next;player.targetX=LANES[player.lane];player.turnDir=dir;player.turnUntil=performance.now()+280;}}}
  function edgeForward(dir){if(state==='playing')player.targetDepth=Math.max(.01,Math.min(.13,player.targetDepth+dir*.04));}
  function jump(){if(state==='playing'&&player.y===0){player.vy=5.4;player.jumpHold=.22;playGoatBleat();}}
  addEventListener('keydown',e=>{if(state==='demo'){e.preventDefault();exitDemo();return;}if(state==='menu')scheduleDemo();if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space','KeyA','KeyD','KeyW','KeyS'].includes(e.code))e.preventDefault();if(e.code==='ArrowLeft'||e.code==='KeyA')steer(-1);if(e.code==='ArrowRight'||e.code==='KeyD')steer(1);if(e.code==='ArrowUp'||e.code==='KeyW')edgeForward(1);if(e.code==='ArrowDown'||e.code==='KeyS')edgeForward(-1);if(e.code==='Space'){if(!input.jumpHeld)jump();input.jumpHeld=true;}if(e.code==='Enter'&&!e.repeat&&e.target===canvas){if(state==='festival')nextLevel();else if(state==='over'||state==='menu')reset(true);}});
  addEventListener('keyup',e=>{if(e.code==='Space')input.jumpHeld=false;});
  document.querySelectorAll('[data-control]').forEach(b=>{b.addEventListener('pointerdown',e=>{e.preventDefault();const c=b.dataset.control;if(c==='jump'){input.jumpHeld=true;jump();}else steer(c==='left'?-1:1)});b.addEventListener('pointerup',()=>input.jumpHeld=false);b.addEventListener('pointercancel',()=>input.jumpHeld=false);});
  let touchX=0,touchY=0;canvas.addEventListener('pointerdown',e=>{touchX=e.clientX;touchY=e.clientY});canvas.addEventListener('pointerup',e=>{const dx=e.clientX-touchX,dy=e.clientY-touchY;if(Math.abs(dy)>Math.abs(dx)&&Math.abs(dy)>28)edgeForward(dy<0?1:-1);else if(Math.abs(dx)>28)steer(Math.sign(dx));else jump();});
  ui.demo.addEventListener('pointerdown',exitDemo);addEventListener('pointerdown',()=>{if(state==='menu')scheduleDemo();});

  function spawn(){
    const laneIndex=Math.floor(Math.random()*LANES.length),lane=LANES[laneIndex];
    const eggChance=Math.random()<.34;
    const goldenEgg=eggChance&&Math.random()<.07;
    const pickChicken=()=>{const r=Math.random(),pressure=Math.min(1,(distance+(level-1)*250)/1200);if(level>=2&&r<Math.min(.38,.12+level*.035))return 'pig';if(distance<140)return r<.88?'chick':'regular';if(distance<380)return r<.32?'chick':'regular';return r<.12*(1-pressure)?'chick':r<.18+pressure*.56?'buff':'regular';};
    const firstType=eggChance?(goldenEgg?'goldenEgg':'egg'):pickChicken();objects.push({type:firstType,lane:laneIndex,x:lane,z:1.08,wobble:Math.random()*6.28,animOffset:Math.random()*500,barnSpawn:!eggChance&&laneIndex===0&&Math.random()<.65,hit:false});
    if(chickenTypes[firstType]&&firstType!=='pig')playChickenWaveSound(firstType);
    const occupied=new Set([laneIndex]),addChicken=(z)=>{let next;do next=Math.floor(Math.random()*LANES.length);while(occupied.has(next));occupied.add(next);const type=pickChicken();objects.push({type,lane:next,x:LANES[next],z,wobble:Math.random()*6.28,animOffset:Math.random()*500,barnSpawn:next===0&&Math.random()<.65,hit:false});if(type!=='pig')playChickenWaveSound(type);};
    const doubleChance=Math.min(.78,.28+distance/1800+(level-1)*.06);if(!eggChance&&Math.random()<doubleChance)addChicken(1.16);
    const tripleChance=Math.max(0,Math.min(.48,(distance-420+(level-1)*160)/1350));if(!eggChance&&occupied.size===2&&Math.random()<tripleChance)addChicken(1.23);
  }
  function project(x,z){const horizon=H*.49,depth=Math.max(-.12,Math.min(1,z)),curveDepth=Math.max(0,depth),p=1-depth,curve=Math.sin(distance*.015+curveDepth*4.8)*W*.105*curveDepth*(.35+curveDepth*.65);return {x:W/2+curve+x*(W*.055+p*W*.39),y:horizon+p*p*(H-horizon),s:.15+p*.9};}
  function crash(hitType='regular'){if(state!=='playing')return;cancelDemo();state='over';syncStateScreens();cycleScreenCopy('over');clearTimeout(musicStartTimer);stopMusic();startChickenAmbience();if(soundsEnabled()){deathSound.currentTime=0;deathSound.play().catch(()=>{});}const score=Math.floor(distance),newRecord=score>best;best=Math.max(best,score);localStorage.setItem('goatBest',best);ui.best.textContent=best;ui.final.textContent=`You ran ${score}m and banked ${runEggs+runMilestones.bonus} egg${runEggs+runMilestones.bonus===1?'':'s'}.${runMilestones.bonus?` Including ${runMilestones.bonus} bonus eggs.`:''}`;const hitSprite={chick:'chick3',regular:'regularChicken3',buff:'buffChicken1',pig:'pigRunningFront'}[hitType]||'regularChicken3';ui.deathAnimal.src=sprites[hitSprite].src;ui.deathAnimal.classList.toggle('buff-hit',hitType==='buff');ui.deathAnimal.style.animation='none';void ui.deathAnimal.offsetWidth;ui.deathAnimal.style.animation='';ui.recordSplash.classList.toggle('hidden',!newRecord);}
  function update(dt){
    if(state!=='playing')return;
    speed=Math.min(42,18+(level-1)*2+distance/150);distance=Math.min(levelLength(),distance+speed*dt);levelProgress.value=distance/levelLength()*100;updateMusic();ui.distance.textContent=Math.floor(distance);player.x+=(player.targetX-player.x)*Math.min(1,dt*9);player.depth+=(player.targetDepth-player.depth)*Math.min(1,dt*7);
    if(player.y>0||player.vy>0){player.y+=player.vy*dt;const extending=input.jumpHeld&&player.jumpHold>0&&player.vy>0;player.vy-=(extending?7:15)*dt;player.jumpHold=Math.max(0,(player.jumpHold||0)-dt);if(player.y<=0){player.y=0;player.vy=0;player.jumpHold=0;}}
    spawnClock-=dt;if(spawnClock<=0&&distance<levelLength()-45){spawn();spawnClock=Math.max(.19,.69-speed*.012)+Math.random()*(.25-Math.min(.1,distance/9000));}
    for(const o of objects){o.z-=speed*dt*.035*(o.type==='pig'?.85:1);const screen=project(o.x,o.z),isEgg=o.type==='egg'||o.type==='goldenEgg',halfWidth=(isEgg?29:chickenTypes[o.type].width*.5)*screen.s,visible=screen.x+halfWidth>0&&screen.x-halfWidth<W&&screen.y>0&&screen.y<H;if(!o.hit&&visible&&Math.abs(o.z-player.depth)<.075&&o.lane===player.lane){o.hit=true;if(o.type==='goldenEgg'){const restored=Math.min(50,100-health);health=Math.min(100,health+50);updateHealth();ui.toast.textContent=restored?`GOLDEN GLOW! +${restored}%`:'HEALTH ALREADY FULL!';ui.toast.classList.add('show');setTimeout(()=>ui.toast.classList.remove('show'),650);beep(620,.09,'sine');setTimeout(()=>beep(930,.14,'sine'),85);for(let i=0;i<14;i++)particles.push({x:player.x,z:player.depth,y:.12,vx:(Math.random()-.5)*2,vy:Math.random()*2.7+1.2,life:.95});}else if(o.type==='egg'){runEggs++;bank++;saveShop();ui.eggs.textContent=bank;ui.toast.textContent=['EGGCELLENT!','SHELL YEAH!','YOLK HERO!','OVAL ACHIEVER!'][runEggs%4];ui.toast.classList.add('show');setTimeout(()=>ui.toast.classList.remove('show'),500);beep(740,.07,'sine');for(let i=0;i<8;i++)particles.push({x:player.x,z:player.depth,y:.1,vx:(Math.random()-.5)*1.5,vy:Math.random()*2+1,life:.7});}else if(player.y<.62){runMilestones.lastDamage=distance;const damage={chick:25,regular:50,buff:100,pig:40}[o.type];health=Math.max(0,health-damage);updateHealth();ui.toast.textContent=`OUCH! -${damage}%`;ui.toast.classList.add('show');setTimeout(()=>ui.toast.classList.remove('show'),500);beep(150,.12,'sawtooth');if(health===0)crash(o.type);}else if(o.type!=='pig'){runMilestones.jumps++;}}
    }
    if(state==='playing'){checkMilestones();if(distance>=levelLength())finishLevel();}
    objects=objects.filter(o=>o.z>-.045&&!o.hit);for(const p of particles){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy-=4*dt;}particles=particles.filter(p=>p.life>0);
  }
  function line(x1,y1,x2,y2,w,color){ctx.strokeStyle=color;ctx.lineWidth=w;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();}
  const smoothstep=(a,b,v)=>{v=Math.max(0,Math.min(1,(v-a)/(b-a)));return v*v*(3-2*v);};
  function dayLighting(){
    const phase=(distance%900)/900,sunrise=(1-smoothstep(.09,.21,phase))+smoothstep(.965,1,phase),sunset=smoothstep(.50,.62,phase)*(1-smoothstep(.69,.76,phase)),night=smoothstep(.67,.76,phase)*(1-smoothstep(.975,1,phase));
    return {phase,sunrise:Math.min(1,sunrise),sunset,night};
  }
  function drawCelestial(t,light){
    const {phase,sunrise,sunset,night}=light,h=H*.49,dayArc=Math.min(1,Math.max(0,(phase-.02)/.72)),sunX=W*(.1+dayArc*.8),sunY=h*(.72-Math.sin(dayArc*Math.PI)*.58),sunGlow=Math.max(sunrise,sunset,1-night*.95),sunVisibility=smoothstep(.015,.105,phase)*(1-smoothstep(.68,.79,phase));
    if(night>.08){ctx.save();ctx.globalAlpha=night;for(let i=0;i<42;i++){const x=((i*197)%997)/997*W,y=14+((i*83)%431)/431*h*.78,r=.7+(i%4)*.36;ctx.fillStyle=`rgba(255,249,213,${.45+Math.sin(t*.003+i)*.25})`;ctx.beginPath();ctx.arc(x,y,r,0,7);ctx.fill();}const moonArc=Math.max(0,Math.min(1,(phase-.69)/.31)),moonX=W*(.1+moonArc*.8),moonY=h*(.72-Math.sin(moonArc*Math.PI)*.58);ctx.shadowColor='#d9ecff';ctx.shadowBlur=22;ctx.fillStyle='#fff8d2';ctx.beginPath();ctx.arc(moonX,moonY,Math.max(15,W*.019),0,7);ctx.fill();ctx.fillStyle='rgba(180,199,218,.38)';ctx.beginPath();ctx.arc(moonX+5,moonY-5,Math.max(3,W*.004),0,7);ctx.fill();ctx.restore();}
    if(sunVisibility>.01){ctx.save();ctx.globalAlpha=sunVisibility*(.35+.65*sunGlow);ctx.shadowColor=sunset>.2?'#ff6a28':'#ffe67a';ctx.shadowBlur=35+sunset*28;ctx.fillStyle=sunset>.25?'#ffba47':'#fff3a4';ctx.beginPath();ctx.arc(sunX,sunY,Math.max(18,W*.022),0,7);ctx.fill();ctx.restore();}
  }
  function drawEveningFarmers(t,light){
    const {phase}=light,appear=smoothstep(.595,.62,phase),vanish=1-smoothstep(.875,.895,phase),visible=appear*vanish;if(visible<=.01)return;
    const outward=smoothstep(.60,.69,phase),homeward=smoothstep(.79,.88,phase),travel=outward*(1-homeward),scale=(.84+travel*.18)*(1-homeward*.72),bob=Math.abs(Math.sin(t*.011))*2*visible*(1-homeward),doorX=W*.305,doorY=H*.515;
    ctx.save();ctx.globalAlpha=visible;ctx.shadowColor='rgba(255,137,48,.55)';ctx.shadowBlur=12;
    const farmerH=Math.min(H*.235,W*.15)*scale,farmerW=farmerH*(2/3),wifeH=farmerH*.98,wifeW=wifeH*(2/3),wifeX=doorX+W*.012*(1-homeward)+travel*W*.052,farmerX=doorX-W*.004*(1-homeward)+travel*W*.022,wifeY=doorY+travel*H*.052,farmerY=doorY+travel*H*.068;
    drawSprite('farmWife3d',wifeX,wifeY+bob,wifeW,wifeH,homeward>.08);
    drawSprite('farmer3d',farmerX,farmerY-bob*.35,farmerW,farmerH,homeward>.08);
    ctx.restore();
  }
  function drawBackground(t){
    const h=H*.49,light=dayLighting(),bg=sprites.farmBackground;if(bg.complete&&bg.naturalWidth){ctx.drawImage(bg,0,0,W,H);}else{let g=ctx.createLinearGradient(0,0,0,h);g.addColorStop(0,'#71d7ff');g.addColorStop(1,'#d8f7ff');ctx.fillStyle=g;ctx.fillRect(0,0,W,h);ctx.fillStyle='#8bd450';ctx.fillRect(0,h,W,H-h);}
    if(light.sunrise>.01||light.sunset>.01){const warm=Math.max(light.sunrise*.72,light.sunset),g=ctx.createLinearGradient(0,0,0,h);if(light.sunset>.08){g.addColorStop(0,`rgba(73,30,126,${light.sunset*.68})`);g.addColorStop(.3,`rgba(157,42,132,${light.sunset*.64})`);g.addColorStop(.58,`rgba(235,54,103,${light.sunset*.6})`);g.addColorStop(.8,`rgba(255,83,46,${light.sunset*.66})`);g.addColorStop(1,`rgba(255,166,48,${light.sunset*.58})`);}else{g.addColorStop(0,`rgba(255,121,111,${warm*.42})`);g.addColorStop(.68,`rgba(255,112,55,${warm*.47})`);g.addColorStop(1,`rgba(255,211,117,${warm*.32})`);}ctx.fillStyle=g;ctx.fillRect(0,0,W,h);if(light.sunset>.08){const glow=ctx.createRadialGradient(W*.72,h*.88,0,W*.72,h*.88,W*.52);glow.addColorStop(0,`rgba(255,197,70,${light.sunset*.7})`);glow.addColorStop(.25,`rgba(255,82,49,${light.sunset*.45})`);glow.addColorStop(.58,`rgba(232,42,113,${light.sunset*.25})`);glow.addColorStop(1,'rgba(99,35,139,0)');ctx.fillStyle=glow;ctx.fillRect(0,0,W,h);}}
    if(light.night>.01){const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,`rgba(5,14,48,${light.night*.84})`);g.addColorStop(.55,`rgba(15,31,67,${light.night*.7})`);g.addColorStop(1,`rgba(4,18,31,${light.night*.61})`);ctx.fillStyle=g;ctx.fillRect(0,0,W,H);}
    drawCelestial(t,light);
    const cloud=sprites.farmCloud;if(cloud.complete&&cloud.naturalWidth){ctx.save();ctx.filter=light.night>.15?`brightness(${1-light.night*.56}) saturate(${1-light.night*.35}) hue-rotate(18deg)`:light.sunset>.08?`sepia(${light.sunset*.92}) saturate(${1+light.sunset*4.2}) hue-rotate(${light.sunset*-28}deg) brightness(${1-light.sunset*.12})`:light.sunrise>.08?`sepia(${light.sunrise*.42}) saturate(${1+light.sunrise*1.35}) hue-rotate(-9deg)`:'none';for(let i=0;i<6;i++){let base=Math.max(105,Math.min(260,W*.18)),cloudWidth=base*(.72+(i%3)*.24),span=W+cloudWidth+100,drift=t*(.008+i*.0015),x=((i*293+drift-distance*.22)%span+span)%span-cloudWidth-45,y=28+(i%3)*45+Math.sin(t*.0007+i)*5;ctx.globalAlpha=(.86+(i%3)*.06)*(1-light.night*.18);ctx.drawImage(cloud,x,y,cloudWidth,cloudWidth*(cloud.naturalHeight/cloud.naturalWidth));}ctx.restore();}
    for(let lane=0;lane<5;lane++){const left=-1+lane*.4,right=left+.4;ctx.fillStyle=lane%2?'rgba(255,246,177,.055)':'rgba(31,122,37,.055)';ctx.beginPath();for(let i=0;i<=28;i++){let p=project(left,1-i/28);i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y)}for(let i=28;i>=0;i--){let p=project(right,1-i/28);ctx.lineTo(p.x,p.y)}ctx.closePath();ctx.fill();}
    ctx.strokeStyle='rgba(255,249,213,.58)';ctx.lineWidth=2.5;ctx.setLineDash([11,20]);ctx.lineDashOffset=(distance*2.4)%31;for(let l of [-.6,-.2,.2,.6]){ctx.beginPath();for(let i=0;i<30;i++){let z=i/30,p=project(l,z);i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y)}ctx.stroke();}ctx.setLineDash([]);ctx.lineDashOffset=0;
    const fieldAnimals=[['cow3d',.23,.49,.072,false],['horse3d',.5724,.4562,.088,true],['pig3d',.73,.50,.058,false],[currentHighlandSprite,.45,.43,.078,true],['pig3d',.65,.435,.048,true],['llama3d',.81,.52,.105,false]];for(let i=0;i<fieldAnimals.length;i++){const [animal,x,y,height,flip]=fieldAnimals[i],img=sprites[animal],drawH=H*height,idle=Math.sin(t*.0015+i*1.7)*1.2,drawW=img&&img.naturalHeight?drawH*(img.naturalWidth/img.naturalHeight):drawH;drawSprite(animal,W*x,H*y+idle,drawW,drawH,flip);}
    const barn=sprites.barnForeground;if(barn.complete&&barn.naturalWidth)ctx.drawImage(barn,0,0,W,H);drawEveningFarmers(t,light);
    if(light.night>.01){const vignette=ctx.createRadialGradient(W*.5,H*.46,Math.min(W,H)*.18,W*.5,H*.48,Math.max(W,H)*.72);vignette.addColorStop(0,'rgba(4,9,24,0)');vignette.addColorStop(1,`rgba(1,5,18,${light.night*.38})`);ctx.fillStyle=vignette;ctx.fillRect(0,0,W,H);}
  }
  function drawSprite(name,x,y,w,h,flip=false){ctx.save();ctx.translate(x,y);if(flip)ctx.scale(-1,1);if(sprites[name].complete)ctx.drawImage(sprites[name],-w/2,-h,w,h);ctx.restore();}
  function drawRunningPig(frame,x,y,w,h){
    if(frame===0){drawSprite('pigRunningFront',x,y,w,h);return;}
    const sheet=sprites.pigRunningSheet;
    if(!sheet.complete||!sheet.naturalWidth)return;
    const frameHeight=sheet.naturalHeight/2,sourceWidth=sheet.naturalWidth*.67,sourceX=(sheet.naturalWidth-sourceWidth)/2;
    ctx.drawImage(sheet,sourceX,(frame-1)*frameHeight,sourceWidth,frameHeight,x-w/2,y-h,w,h);
  }
  function drawGoatBling(scale,turnDir=0){
    const face=shop.equipped.face,hair=shop.equipped.hair,angled=turnDir!==0,side=angled?Math.sign(turnDir):0,flip=turnDir<0,suffix=angled?'45':'Back';ctx.save();ctx.translate(side*6*scale,0);
    if(shop.equipped.neck==='chain')drawSprite(`chain_${chainEmblems[chainEmblemIndex]}_${suffix}`,side*5*scale,-44*scale,57*scale,36*scale,flip);
    if(face==='shades')drawSprite(`blingShades${suffix}`,side*5*scale,-77*scale,(angled?62:65)*scale,40*scale,flip);
    if(hair==='mohawk')drawSprite(`blingMohawk${suffix}`,side*(angled?-5:7)*scale,(angled?-68:-73)*scale,(angled?36:24)*scale,56*scale,flip);
    if(hair==='crown')drawSprite(`blingCrown${suffix}`,side*(angled?3:8)*scale,(angled?-86:-87.8)*scale,(angled?65:45.5)*scale,(angled?44:30.8)*scale,flip);ctx.restore();
  }
  function drawCarExhaust(t,w,h,turnDir=0){
    if(state!=='playing')return;
    const outlets=turnDir?[-.34,.1]:[-.255,.255],mirror=turnDir<0?-1:1;
    for(const outlet of outlets)for(let i=0;i<4;i++){
      const side=Math.sign(outlet),phase=((t*.0019+i*.245+(outlet>0?.12:0))%1),radius=(5+phase*15)*Math.min(1.2,w/230),x=outlet*w*mirror+side*mirror*phase*8+Math.sin(t*.006+i*2.4)*2,y=-h*(turnDir?.125:.07)+phase*35;
      ctx.fillStyle=`rgba(238,242,237,${(1-phase)*.62})`;ctx.beginPath();ctx.arc(x,y,radius,0,7);ctx.fill();
      ctx.fillStyle=`rgba(190,199,195,${(1-phase)*.22})`;ctx.beginPath();ctx.arc(x-radius*.22,y-radius*.12,radius*.62,0,7);ctx.fill();
    }
  }
  function draw(t){
    ctx.clearRect(0,0,W,H);drawBackground(t);drawFestival(t);
    [...objects].sort((a,b)=>b.z-a.z).forEach(o=>{let p=project(o.x,o.z);if(o.barnSpawn&&o.z>.8){const mix=Math.max(0,Math.min(1,(1.08-o.z)/.28));p={x:W*.305*(1-mix)+p.x*mix,y:H*.51*(1-mix)+p.y*mix,s:.14*(1-mix)+p.s*mix};}if(o.type==='egg'||o.type==='goldenEgg'){let bob=Math.sin(t*.006+o.wobble)*2*p.s,size=58*p.s*(W<=600?.5:1);if(o.type==='goldenEgg'){ctx.save();ctx.shadowColor='#ffb300';ctx.shadowBlur=(28+Math.sin(t*.009)*10)*p.s;ctx.fillStyle='rgba(255,183,0,.46)';ctx.beginPath();ctx.arc(p.x,p.y+bob-size*.56,size*.84,0,7);ctx.fill();ctx.filter='sepia(1) saturate(20) hue-rotate(350deg) brightness(.98) contrast(1.28)';drawSprite('egg',p.x,p.y+bob,size*1.1,size*1.38);ctx.restore();}else drawSprite('egg',p.x,p.y+bob,size,size*1.25);}else{const breed=chickenTypes[o.type],phoneScale=W<=600?(o.type==='chick'?.65:.5):1,anim=Math.floor((t+o.animOffset)/(o.type==='pig'?180:130)),bob=Math.abs(Math.sin((t+o.animOffset)*(o.type==='pig'?.018:.014)))*(o.type==='pig'?10:4)*p.s*phoneScale;ctx.save();ctx.translate(p.x,p.y+bob+breed.footPadding*p.s*phoneScale);if(o.type==='pig'){ctx.rotate(Math.sin((t+o.animOffset)*.018)*.045);drawRunningPig(anim%3,0,0,breed.width*p.s*phoneScale,breed.height*p.s*phoneScale);}else{const frame=breed.frames[anim%breed.frames.length];drawSprite(frame,0,0,breed.width*p.s*phoneScale,breed.height*p.s*phoneScale,o.lane>2);}ctx.restore();}});
    for(const p of particles){let q=project(p.x,p.z);ctx.fillStyle=`rgba(255,225,102,${p.life})`;ctx.beginPath();ctx.arc(q.x,q.y-p.y*80,5,0,7);ctx.fill();}
    if(state==='menu'||state==='demo')return;
    const goatPoint=project(player.x,player.depth),ground=goatPoint.y,goatScale=Math.min(1.3,W/720),goatX=goatPoint.x,jumpHeight=player.y*112,runPhase=t*.018,isRunning=state==='playing',ride=shop.equipped.ride,vehicleTurning=isRunning&&ride&&t<player.turnUntil,runBob=isRunning&&player.y===0?Math.abs(Math.sin(runPhase))*(ride?2.2:4):0,turning=isRunning&&!ride&&t<player.turnUntil,baseFrame=!isRunning?'goat':turning?(Math.floor(t/140)%2?'goatRightA':'goatRightB'):(Math.floor(t/145)%2?'goat':'goatStride'),pinkFrames={goat:'goatPink',goatStride:'goatStridePink',goatRightA:'goatRightAPink',goatRightB:'goatRightBPink'},goatFrame=shop.equipped.fur==='pink'?pinkFrames[baseFrame]:baseFrame,mirrorGoat=turning&&player.turnDir<0,framePadding=(baseFrame==='goatStride'?64:48)*goatScale,sway=isRunning?Math.sin(runPhase)*(ride?.7:1.5):0;ctx.save();ctx.translate(goatX,ground);ctx.fillStyle=`rgba(24,23,15,${Math.max(.07,.22-player.y*.06)})`;ctx.beginPath();ctx.ellipse(isRunning?Math.sin(runPhase)*2:0,8,Math.max(30,(ride?53:64)-player.y*10-runBob*.35)*goatScale,Math.max(8,17-player.y*2)*goatScale,0,0,7);ctx.fill();ctx.translate(sway,-jumpHeight-runBob);if(isRunning)ctx.rotate(Math.sin(runPhase)*(ride?.007:.014));if(ride){const pink=shop.equipped.fur==='pink',vehicleFrame=ride==='car'?(vehicleTurning?(pink?'goatCarRightPink':'goatCarRightWhite'):(pink?'goatCarPink':'goatCarWhite')):(vehicleTurning?(pink?'goatCartRightPink':'goatCartRightWhite'):(pink?'goatCartPink':'goatCartWhite')),vehicleHeight=(ride==='car'?193:213)*goatScale,img=sprites[vehicleFrame],vehicleWidth=img.naturalHeight?vehicleHeight*img.naturalWidth/img.naturalHeight:161*goatScale,vehicleMirror=vehicleTurning&&player.turnDir<0;if(ride==='car')drawCarExhaust(t,vehicleWidth,vehicleHeight,vehicleTurning?player.turnDir:0);drawSprite(vehicleFrame,0,8,vehicleWidth,vehicleHeight,vehicleMirror);}else{if(shop.equipped.fur==='blue'){ctx.save();ctx.filter='sepia(.25) saturate(5) hue-rotate(155deg) brightness(.86)';drawSprite(goatFrame,0,8+framePadding,176*goatScale,230*goatScale,mirrorGoat);ctx.restore();}else drawSprite(goatFrame,0,8+framePadding,176*goatScale,230*goatScale,mirrorGoat);drawGoatBling(goatScale*1.18,turning?player.turnDir:0);}ctx.restore();
  }
  function frame(t){let dt=Math.min(.035,(t-last)/1000||0);last=t;syncStateScreens();update(dt);draw(t);requestAnimationFrame(frame);}requestAnimationFrame(frame);
})();
