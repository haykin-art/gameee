document.addEventListener("DOMContentLoaded",()=>{

//========================================
// CANVAS
//========================================

const canvas=document.getElementById("gameCanvas");
const ctx=canvas.getContext("2d");

canvas.width=1200;
canvas.height=630;

const WIDTH=canvas.width;
const HEIGHT=canvas.height;

//========================================
// UI
//========================================

const hpBar=document.getElementById("hpBar");
const mpBar=document.getElementById("mpBar");

const hpDisplay=document.getElementById("hpDisplay");
const mpDisplay=document.getElementById("mpDisplay");

const scoreDisplay=document.getElementById("scoreDisplay");
const timerDisplay=document.getElementById("timerDisplay");

const startScreen=document.getElementById("startScreen");
const gameScreen=document.getElementById("gameScreen");
const endScreen=document.getElementById("endScreen");

const pauseScreen=document.getElementById("pauseScreen");

const startBtn=document.getElementById("startBtn");
const restartBtn=document.getElementById("restartBtn");

const playerName=document.getElementById("playerName");

//========================================
// GAME
//========================================

let gameRunning=false;
let paused=false;

let score=0;
let gameSeconds=0;

const keys={};

const world={

    width:7000,

    height:HEIGHT,

    ground:HEIGHT-90,

    cameraX:0

};

//========================================
// PLAYER
//========================================

const player={

    x:180,

    y:world.ground,

    width:44,

    height:74,

    speed:5,

    direction:1,

    hp:100,

    maxHp:100,

    mp:100,

    maxMp:100,

    shield:false,

    invincible:false,

    attackCooldown:0

};

//========================================
// ARRAYS
//========================================

const enemies=[];
const arrows=[];
const rainArrows=[];
const particles=[];

//========================================
// COOLDOWNS
//========================================

const cooldowns={

    shot:0,

    shield:0,

    triple:0,

    rain:0

};

//========================================
// ENEMY TYPES
//========================================

const enemyTypes={

    goblin:{

        hp:25,

        speed:2.4,

        damage:4,

        color:"#43A047",

        width:34,

        height:42,

        score:1

    },

    orc:{

        hp:55,

        speed:1.8,

        damage:7,

        color:"#8D6E63",

        width:44,

        height:52,

        score:2

    },

    troll:{

        hp:100,

        speed:1,

        damage:12,

        color:"#7E57C2",

        width:58,

        height:66,

        score:4

    }

};

//========================================
// UPDATE UI
//========================================

function updateUI(){

    hpBar.style.width=(player.hp/player.maxHp*100)+"%";
    mpBar.style.width=(player.mp/player.maxMp*100)+"%";

    hpDisplay.textContent=Math.round(player.hp);
    mpDisplay.textContent=Math.round(player.mp);

    scoreDisplay.textContent=score;

}

//========================================
// BACKGROUND
//========================================

function drawBackground(){

    const sky=ctx.createLinearGradient(
        0,
        0,
        0,
        HEIGHT
    );

    sky.addColorStop(0,"#86D8FF");
    sky.addColorStop(.7,"#B3EB80");
    sky.addColorStop(1,"#5AB642");

    ctx.fillStyle=sky;
    ctx.fillRect(0,0,WIDTH,HEIGHT);

    drawMountains();
    drawForest();
    drawGround();

}

function drawMountains(){

    ctx.fillStyle="#6B8A73";

    for(let i=-1;i<8;i++){

        const x=i*520-(world.cameraX*.18)%520;

        ctx.beginPath();

        ctx.moveTo(x,HEIGHT);

        ctx.lineTo(x+220,180);

        ctx.lineTo(x+440,HEIGHT);

        ctx.fill();

    }

}

function drawForest(){

    for(let i=0;i<90;i++){

        const x=i*170-world.cameraX*.55;

        if(x<-120||x>WIDTH+120) continue;

        ctx.fillStyle="#5A3825";

        ctx.fillRect(x+18,250,18,120);

        ctx.fillStyle="#2E7D32";

        ctx.beginPath();
        ctx.arc(x+26,220,48,0,Math.PI*2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(x-2,240,38,0,Math.PI*2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(x+55,240,38,0,Math.PI*2);
        ctx.fill();

    }

}

function drawGround(){

    ctx.fillStyle="#3C7E2E";

    ctx.fillRect(
        0,
        world.ground,
        WIDTH,
        HEIGHT-world.ground
    );

    ctx.fillStyle="#5BAF42";

    for(let i=0;i<WIDTH;i+=18){

        ctx.fillRect(

            i,

            world.ground+
            Math.sin((i+world.cameraX)/18)*2,

            10,

            4

        );

    }

}
//========================================
// PLAYER
//========================================

function updatePlayer(){

    if(keys["ArrowLeft"]){

        player.direction=-1;
        player.x-=player.speed;

    }

    if(keys["ArrowRight"]){

        player.direction=1;
        player.x+=player.speed;

    }

    player.x=Math.max(
        0,
        Math.min(
            world.width-player.width,
            player.x
        )
    );

    if(player.x>WIDTH/2){

        world.cameraX=Math.min(

            player.x-WIDTH/2,

            world.width-WIDTH

        );

    }else{

        world.cameraX=0;

    }

    player.hp=Math.min(
        player.maxHp,
        player.hp+0.015
    );

    player.mp=Math.min(
        player.maxMp,
        player.mp+0.03
    );

    if(player.attackCooldown>0)
        player.attackCooldown--;

}

//========================================
// PLAYER DRAW
//========================================

function drawPlayer(){

    const x=player.x-world.cameraX;

    ctx.save();

    ctx.translate(x,player.y);

    if(player.direction==-1){

        ctx.scale(-1,1);
        ctx.translate(-player.width,0);

    }

    // щит

    if(player.shield){

        ctx.beginPath();

        ctx.arc(22,30,42,0,Math.PI*2);

        ctx.fillStyle="rgba(80,180,255,.20)";
        ctx.fill();

        ctx.strokeStyle="#7ad7ff";
        ctx.lineWidth=3;
        ctx.stroke();

    }

    // плащ

    ctx.fillStyle="#1f8b4d";
    ctx.fillRect(6,18,30,48);

    // ноги

    ctx.fillStyle="#5c4033";
    ctx.fillRect(10,66,8,8);
    ctx.fillRect(26,66,8,8);

    // голова

    ctx.fillStyle="#f1c89d";

    ctx.beginPath();
    ctx.arc(21,8,14,0,Math.PI*2);
    ctx.fill();

    // волосы

    ctx.fillStyle="#795548";
    ctx.fillRect(5,-2,34,6);

    // глаза

    ctx.fillStyle="#222";

    ctx.beginPath();
    ctx.arc(17,7,1.5,0,Math.PI*2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(25,7,1.5,0,Math.PI*2);
    ctx.fill();

    // лук

    ctx.strokeStyle="#8b5a2b";
    ctx.lineWidth=3;

    ctx.beginPath();
    ctx.arc(43,26,18,-1.2,1.2);
    ctx.stroke();

    ctx.restore();

}

//========================================
// SPAWN ENEMY
//========================================

function spawnEnemy(typeName){

    const type=enemyTypes[typeName];

    enemies.push({

        type:typeName,

        x:player.x+WIDTH+Math.random()*800,

        y:world.ground,

        width:type.width,

        height:type.height,

        color:type.color,

        hp:type.hp,

        maxHp:type.hp,

        damage:type.damage,

        speed:type.speed,

        score:type.score,

        attackTimer:0

    });

}

//========================================
// RANDOM SPAWN
//========================================

let spawnTimer=180;

function updateSpawner(){

    spawnTimer--;

    if(spawnTimer>0) return;

    spawnTimer=90+Math.random()*120;

    if(enemies.length>=10) return;

    const r=Math.random();

    if(r<0.55){

        spawnEnemy("goblin");

    }else if(r<0.85){

        spawnEnemy("orc");

    }else{

        spawnEnemy("troll");

    }

}

//========================================
// ENEMIES
//========================================

function updateEnemies(){

    for(let i=enemies.length-1;i>=0;i--){

        const e=enemies[i];

        if(e.x>player.x){

            e.x-=e.speed;

        }else{

            e.x+=e.speed;

        }

        if(Math.abs(e.x-player.x)<40){

            if(e.attackTimer<=0){

                if(!player.shield){

                    player.hp-=e.damage;

                }

                e.attackTimer=45;

            }

        }

        if(e.attackTimer>0)
            e.attackTimer--;

        if(e.hp<=0){

            score+=e.score;

            createDeathEffect(e);

            enemies.splice(i,1);

        }

    }

}

//========================================
// DRAW ENEMIES
//========================================

function drawEnemies(){

    enemies.forEach(e=>{

        const x=e.x-world.cameraX;

        ctx.fillStyle=e.color;

        ctx.fillRect(

            x,

            e.y-e.height,

            e.width,

            e.height

        );

        // глаза

        ctx.fillStyle="white";

        ctx.fillRect(
            x+8,
            e.y-e.height+12,
            5,
            5
        );

        ctx.fillRect(
            x+20,
            e.y-e.height+12,
            5,
            5
        );

        // hp bar

        ctx.fillStyle="#333";

        ctx.fillRect(
            x,
            e.y-e.height-14,
            e.width,
            6
        );

        ctx.fillStyle="#ff3d3d";

        ctx.fillRect(

            x,

            e.y-e.height-14,

            e.width*(e.hp/e.maxHp),

            6

        );

    });

}
//========================================
// PARTICLES
//========================================

function createHit(x,y){

    for(let i=0;i<10;i++){

        particles.push({

            x:x,

            y:y,

            vx:(Math.random()-.5)*5,

            vy:(Math.random()-.5)*5,

            life:25,

            color:"#ffd54f"

        });

    }

}

function createDeathEffect(enemy){

    for(let i=0;i<25;i++){

        particles.push({

            x:enemy.x+enemy.width/2,

            y:enemy.y-enemy.height/2,

            vx:(Math.random()-.5)*8,

            vy:(Math.random()-.5)*8,

            life:40,

            color:enemy.color

        });

    }

}

function updateParticles(){

    for(let i=particles.length-1;i>=0;i--){

        const p=particles[i];

        p.x+=p.vx;
        p.y+=p.vy;

        p.vy+=0.15;

        p.life--;

        if(p.life<=0){

            particles.splice(i,1);

        }

    }

}

function drawParticles(){

    particles.forEach(p=>{

        ctx.globalAlpha=p.life/40;

        ctx.fillStyle=p.color;

        ctx.beginPath();

        ctx.arc(

            p.x-world.cameraX,

            p.y,

            3,

            0,

            Math.PI*2

        );

        ctx.fill();

    });

    ctx.globalAlpha=1;

}

//========================================
// ARROWS
//========================================

function shootArrow(offsetY=0){

    arrows.push({

        x:player.x+20,

        y:player.y-40+offsetY,

        speed:12,

        damage:30

    });

}

function updateArrows(){

    for(let i=arrows.length-1;i>=0;i--){

        const a=arrows[i];

        a.x+=a.speed;

        let removed=false;

        for(let j=enemies.length-1;j>=0;j--){

            const e=enemies[j];

            if(

                a.x+18>e.x &&

                a.x<e.x+e.width &&

                a.y+4>e.y-e.height &&

                a.y<e.y

            ){

                e.hp-=a.damage;

                createHit(a.x,a.y);

                arrows.splice(i,1);

                removed=true;

                break;

            }

        }

        if(removed) continue;

        if(a.x>world.width){

            arrows.splice(i,1);

        }

    }

}

function drawArrows(){

    ctx.strokeStyle="#ffe082";

    ctx.lineWidth=3;

    arrows.forEach(a=>{

        ctx.beginPath();

        ctx.moveTo(

            a.x-world.cameraX,

            a.y

        );

        ctx.lineTo(

            a.x-world.cameraX-18,

            a.y

        );

        ctx.stroke();

    });

}

//========================================
// RAIN OF ARROWS
//========================================

function updateRain(){

    for(let i=rainArrows.length-1;i>=0;i--){

        const r=rainArrows[i];

        r.y+=r.speed;

        enemies.forEach(e=>{

            if(

                Math.abs(r.x-e.x)<30 &&

                Math.abs(r.y-(e.y-25))<35

            ){

                e.hp-=55;

            }

        });

        if(r.y>HEIGHT+50){

            rainArrows.splice(i,1);

        }

    }

}

function drawRain(){

    ctx.strokeStyle="#fff59d";

    ctx.lineWidth=3;

    rainArrows.forEach(r=>{

        ctx.beginPath();

        ctx.moveTo(

            r.x-world.cameraX,

            r.y

        );

        ctx.lineTo(

            r.x-world.cameraX-12,

            r.y-24

        );

        ctx.stroke();

    });

}

//========================================
// SKILLS
//========================================

function useSkill(id){

    switch(id){

        case 1:

            if(player.mp<5) return;
            if(cooldowns.shot>0) return;

            player.mp-=5;

            cooldowns.shot=18;

            shootArrow();

        break;

        case 2:

            if(player.mp<20) return;
            if(cooldowns.shield>0) return;

            player.mp-=20;

            cooldowns.shield=600;

            player.shield=true;

            setTimeout(()=>{

                player.shield=false;

            },5000);

        break;

        case 3:

            if(player.mp<25) return;
            if(cooldowns.triple>0) return;

            player.mp-=25;

            cooldowns.triple=180;

            shootArrow(-15);
            shootArrow(0);
            shootArrow(15);

        break;

        case 4:

            if(player.mp<40) return;
            if(cooldowns.rain>0) return;

            player.mp-=40;

            cooldowns.rain=900;

            for(let i=0;i<45;i++){

                rainArrows.push({

                    x:player.x-250+Math.random()*500,

                    y:-Math.random()*600,

                    speed:10+Math.random()*6

                });

            }

        break;

    }

}
//========================================
// COOLDOWNS
//========================================

function updateCooldowns(){

    for(const key in cooldowns){

        if(cooldowns[key]>0){

            cooldowns[key]--;

        }

    }

}

//========================================
// TIMER
//========================================

setInterval(()=>{

    if(!gameRunning) return;

    if(paused) return;

    gameSeconds++;

    const m=Math.floor(gameSeconds/60);
    const s=gameSeconds%60;

    timerDisplay.textContent=

        String(m).padStart(2,"0")+

        ":"+

        String(s).padStart(2,"0");

},1000);

//========================================
// GAME LOOP
//========================================

function gameLoop(){

    if(!gameRunning) return;

    if(paused){

        requestAnimationFrame(gameLoop);

        return;

    }

    updatePlayer();

    updateSpawner();

    updateEnemies();

    updateArrows();

    updateRain();

    updateParticles();

    updateCooldowns();

    updateUI();

    drawBackground();

    drawEnemies();

    drawPlayer();

    drawArrows();

    drawRain();

    drawParticles();

    if(player.hp<=0){

        endGame(false);

        return;

    }

    requestAnimationFrame(gameLoop);

}

//========================================
// START GAME
//========================================

function startGame(){

    score=0;

    gameSeconds=0;

    player.hp=player.maxHp;

    player.mp=player.maxMp;

    player.x=180;

    player.shield=false;

    enemies.length=0;

    arrows.length=0;

    rainArrows.length=0;

    particles.length=0;

    startScreen.classList.remove("active");

    endScreen.classList.remove("active");

    gameScreen.classList.add("active");

    gameRunning=true;

    paused=false;

    gameLoop();

}

//========================================
// END GAME
//========================================

function endGame(win){

    gameRunning=false;

    gameScreen.classList.remove("active");

    endScreen.classList.add("active");

    const result=document.getElementById("gameResult");

    const container=document.getElementById("resultsContainer");

    result.textContent=

        win ?

        "🏆 Победа" :

        "💀 Поражение";

    container.innerHTML=

    `
    <p><b>Игрок:</b> ${playerName.value}</p>
    <p><b>Убийств:</b> ${score}</p>
    <p><b>Время:</b> ${timerDisplay.textContent}</p>
    `;

}

//========================================
// INPUT
//========================================

document.addEventListener("keydown",e=>{

    keys[e.key]=true;

    if(e.key==="Escape"){

        if(!gameRunning) return;

        paused=!paused;

        pauseScreen.classList.toggle("active");

    }

    if(e.key==="1") useSkill(1);

    if(e.key==="2") useSkill(2);

    if(e.key==="3") useSkill(3);

    if(e.key==="4") useSkill(4);

});

document.addEventListener("keyup",e=>{

    keys[e.key]=false;

});

//========================================
// BUTTONS
//========================================

playerName.addEventListener("input",()=>{

    startBtn.disabled=

        playerName.value.trim().length===0;

});

startBtn.addEventListener("click",startGame);

restartBtn.addEventListener("click",()=>{

    location.reload();

});

//========================================
// FIRST UI UPDATE
//========================================

updateUI();

});
