// 1. Ждём загрузки страницы
document.addEventListener('DOMContentLoaded', function() {
    console.log("Скрипт загружен!");

    // 2. Получаем элементы со страницы
    const startScreen = document.getElementById('startScreen');
    const gameScreen = document.getElementById('gameScreen');
    const endScreen = document.getElementById('endScreen');
    const startBtn = document.getElementById('startBtn');
    const playerNameInput = document.getElementById('playerName');
    const canvas = document.getElementById('gameCanvas');
    
    // *** Проверка: нашли ли мы Canvas? ***
    if (!canvas) {
        console.error("❌ Ошибка: Не найден Canvas с id='gameCanvas'!");
        return;
    }
    
    if (!startBtn) {
        console.error("❌ Ошибка: Не найдена кнопка startBtn!");
        return;
    }

    // 3. Настраиваем контекст рисования
    const ctx = canvas.getContext('2d');
    const CANVAS_WIDTH = 800;
    const CANVAS_HEIGHT = 400;

    // Устанавливаем реальный размер холста
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    console.log("✅ Canvas найден и настроен:", canvas.width, 'x', canvas.height);

    // 4. Создаём игрока
    const player = {
        x: 100,
        y: CANVAS_HEIGHT - 100,
        width: 40,
        height: 60,
        speed: 4,
        facing: 'right'
    };

    // 5. Создаём камеру и клавиши
    let cameraX = 0;
    let gameRunning = false;
    let animationId = null;
    const keys = {
        left: false,
        right: false
    };
    // ========================================
// 5.5. ВРАГИ
// ========================================
let enemies = [];
let score = 0;
let hp = 100;
let mp = 100;
let spawnTimer = 0;
const MAX_ENEMIES = 10;
const WORLD_END = 2500;

// ========================================
// 5.8. УМЕНИЯ
// ========================================
const skills = {
    shot: {
        name: 'Выстрел',
        key: '1',
        mpCost: 0,
        cooldown: 0,
        damage: 15,
        description: 'Обычный выстрел'
    },
    shield: {
        name: 'Блок',
        key: '2',
        mpCost: 5,
        cooldown: 0,
        duration: 60, // кадров
        description: 'Блокирует урон на 1 секунду'
    },
    tripleShot: {
        name: 'Три стрелы',
        key: '3',
        mpCost: 10,
        cooldown: 120, // 2 секунды
        damage: 40,
        description: 'Выпускает 3 стрелы'
    },
    rainOfArrows: {
        name: 'Град стрел',
        key: '4',
        mpCost: 30,
        cooldown: 600, // 10 секунд
        damage: 100,
        description: 'Уничтожает всех врагов в радиусе'
    }
};

// Состояние умений
let skillCooldowns = {
    shot: 0,
    shield: 0,
    tripleShot: 0,
    rainOfArrows: 0
};

let shieldActive = false;
let shieldTimer = 0;

// ========================================
// 5.9. ПАУЗА
// ========================================
let isPaused = false;

// ========================================
// 5.10. РЕГЕНЕРАЦИЯ
// ========================================
let regenTimer = 0;
const HP_REGEN = 2;    // 2 HP в секунду
const MP_REGEN = 5;    // 5 MP в секунду

// ========================================
// 5.11. ТАЙМЕР
// ========================================
let gameTime = 0;
let timerInterval = null;

// Типы врагов
const ENEMY_TYPES = {
    goblin: {
        name: 'Гоблин',
        hp: 15,
        damage: 2,
        speed: 1.2,
        width: 30,
        height: 35,
        color: '#2ecc71',
        score: 1
    },
    troll: {
        name: 'Тролль',
        hp: 30,
        damage: 5,
        speed: 0.8,
        width: 40,
        height: 45,
        color: '#8e44ad',
        score: 2
    },
    orc: {
        name: 'Орк',
        hp: 60,
        damage: 10,
        speed: 0.6,
        width: 35,
        height: 40,
        color: '#c0392b',
        score: 3
    }
};

function spawnEnemy() {
    if (enemies.length >= MAX_ENEMIES) return;
    if (cameraX >= WORLD_END - CANVAS_WIDTH) return;

    const types = ['goblin', 'troll', 'orc'];
    const typeName = types[Math.floor(Math.random() * types.length)];
    const type = ENEMY_TYPES[typeName];
    
    // Враг появляется справа за границей экрана
    const x = CANVAS_WIDTH + 50 + Math.random() * 100;
    const y = CANVAS_HEIGHT - 80 - Math.random() * 40;

    enemies.push({
        type: typeName,
        x: x,                    // Локальная координата относительно холста
        y: y,
        hp: type.hp,
        maxHp: type.hp,
        speed: type.speed + (Math.random() - 0.5) * 0.3,
        damage: type.damage,
        width: type.width,
        height: type.height,
        color: type.color,
        score: type.score,
        name: type.name,
        attackCooldown: 0
    });
}

// Обновление врагов
function updateEnemies() {
    const centerX = CANVAS_WIDTH / 2;
    const playerWorldX = player.x + cameraX;

    enemies.forEach((enemy, index) => {
        // Движение врага к игроку (в мировых координатах)
        const enemyWorldX = enemy.x + cameraX;
        const dx = playerWorldX - enemyWorldX;
        
        // Если враг слева от игрока — идёт вправо, если справа — влево
        if (Math.abs(dx) > 20) {
            enemy.x += Math.sign(dx) * enemy.speed;
        }

        // Атака игрока
        if (Math.abs(dx) < 40) {
            if (enemy.attackCooldown <= 0) {
                hp -= enemy.damage;
                enemy.attackCooldown = 60; // 1 секунда при 60 FPS
                updateUI();
                if (hp <= 0) {
                    endGame(false);
                }
            }
        }
        if (enemy.attackCooldown > 0) {
            enemy.attackCooldown--;
        }
    });

    // Удаляем врагов, которые ушли слишком далеко влево
    enemies = enemies.filter(enemy => {
        const enemyWorldX = enemy.x + cameraX;
        return enemyWorldX > -200;
    });
}

// Отрисовка врагов
function drawEnemies() {
    enemies.forEach(enemy => {
        const drawX = enemy.x;
        
        ctx.save();
        ctx.translate(drawX, enemy.y);

        // Тело врага
        ctx.fillStyle = enemy.color;
        ctx.shadowColor = 'rgba(0,0,0,0.3)';
        ctx.shadowBlur = 10;
        ctx.fillRect(0, 0, enemy.width, enemy.height);
        
        // Глаза
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(8, 10, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(enemy.width - 8, 10, 4, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.arc(10, 11, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(enemy.width - 6, 11, 2, 0, Math.PI * 2);
        ctx.fill();

        // Полоска HP
        const hpPercent = enemy.hp / enemy.maxHp;
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(0, enemy.height + 5, enemy.width, 5);
        ctx.fillStyle = hpPercent > 0.5 ? '#2ecc71' : hpPercent > 0.2 ? '#f1c40f' : '#e74c3c';
        ctx.fillRect(0, enemy.height + 5, enemy.width * hpPercent, 5);

        ctx.restore();
    });
}

// ========================================
// СТРЕЛЬБА (ФИНАЛЬНАЯ ВЕРСИЯ С БОЛЬШИМ РАДИУСОМ)
// ========================================
let arrows = [];
let arrowCooldown = 0;

function shootArrow() {
    if (arrowCooldown > 0) return;
    if (!gameRunning) return;
    
    const startX = player.x + (player.facing === 'right' ? player.width : -10);
    const startY = player.y + 20; // Стрела летит из центра персонажа
    
    const arrow = {
        x: startX,
        y: startY,
        speed: 9,
        direction: player.facing === 'right' ? 1 : -1,
        width: 25,
        height: 8,
        damage: 15,
        worldX: startX + cameraX,
        worldY: startY,
        active: true
    };
    arrows.push(arrow);
    arrowCooldown = 15;
}

function updateArrows() {
    if (arrowCooldown > 0) arrowCooldown--;

    for (let i = arrows.length - 1; i >= 0; i--) {
        const arrow = arrows[i];
        if (!arrow.active) {
            arrows.splice(i, 1);
            continue;
        }

        // Двигаем стрелу
        arrow.x += arrow.speed * arrow.direction;
        arrow.worldX = arrow.x + cameraX;

        let hit = false;

        // Проверка попадания по всем врагам
        for (let j = enemies.length - 1; j >= 0; j--) {
            const enemy = enemies[j];
            const enemyWorldX = enemy.x + cameraX;
            
            // РАСШИРЕННАЯ ПРОВЕРКА ПОПАДАНИЯ
            // dx - расстояние по горизонтали (с большим запасом)
            const dx = Math.abs(arrow.worldX - enemyWorldX);
            // dy - расстояние по вертикали (с большим запасом)
            const dy = Math.abs(arrow.y - enemy.y);
            
            // Увеличил радиус проверки до 60 пикселей по X и 50 по Y
            // Это гарантирует попадание даже если враг "выше" или "ниже"
            if (dx < 60 && dy < 50) {
                // Наносим урон
                enemy.hp -= arrow.damage;
                hit = true;
                updateUI();

                // Если враг убит
                if (enemy.hp <= 0) {
                    score += enemy.score;
                    enemies.splice(j, 1);
                    updateUI();
                }
                break;
            }
        }

        // Удаляем стрелу после попадания или вылета за границу
        if (hit || arrow.x < -50 || arrow.x > CANVAS_WIDTH + 50) {
            arrows.splice(i, 1);
        }
    }
}

function drawArrows() {
    arrows.forEach(arrow => {
        ctx.save();
        ctx.translate(arrow.x, arrow.y);
        ctx.fillStyle = '#f39c12';
        ctx.shadowColor = '#f39c12';
        ctx.shadowBlur = 10;
        ctx.fillRect(0, 0, arrow.width, arrow.height);
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#d35400';
        ctx.beginPath();
        ctx.moveTo(arrow.direction > 0 ? arrow.width : 0, -3);
        ctx.lineTo(arrow.direction > 0 ? arrow.width : 0, 8);
        ctx.lineTo(arrow.direction > 0 ? arrow.width + 8 : -8, 2.5);
        ctx.fill();
        ctx.restore();
    });
}

// ========================================
// 5.7. ОБНОВЛЕНИЕ UI
// ========================================
function updateUI() {
    document.getElementById('hpDisplay').textContent = Math.round(hp);
    document.getElementById('mpDisplay').textContent = Math.round(mp);
    document.getElementById('scoreDisplay').textContent = score;
}

    // 6. Функция для показа игрового экрана
    function showGameScreen() {
        // Скрываем стартовый экран
        if (startScreen) {
            startScreen.classList.remove('active');
            startScreen.style.display = 'none';
        }
        // Показываем игровой экран
        if (gameScreen) {
            gameScreen.classList.add('active');
            gameScreen.style.display = 'flex';
        }
        console.log("✅ Игровой экран показан");
    }

    // 7. Рисуем игрока
    function drawPlayer() {
        const drawX = player.x - cameraX;
        
        ctx.save();
        ctx.translate(drawX, player.y);

        // Разворот влево
        if (player.facing === 'left') {
            ctx.scale(-1, 1);
            ctx.translate(-player.width, 0);
        }

        // Тело
        ctx.fillStyle = '#27ae60';
        ctx.fillRect(0, 0, player.width, player.height);
        
        // Голова
        ctx.fillStyle = '#f5cba7';
        ctx.beginPath();
        ctx.arc(player.width / 2, -5, 18, 0, Math.PI * 2);
        ctx.fill();
        
        // Волосы
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.arc(player.width / 2 - 12, -10, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(player.width / 2 + 12, -10, 10, 0, Math.PI * 2);
        ctx.fill();
        
        // Глаза
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(player.width / 2 - 7, -7, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(player.width / 2 + 7, -7, 5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#2c3e50';
        ctx.beginPath();
        ctx.arc(player.width / 2 - 5, -5, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(player.width / 2 + 9, -5, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Ноги
        ctx.fillStyle = '#2980b9';
        ctx.fillRect(5, player.height - 12, 10, 12);
        ctx.fillRect(player.width - 15, player.height - 12, 10, 12);
        
        // Сапоги
        ctx.fillStyle = '#5d4037';
        ctx.fillRect(2, player.height - 4, 16, 4);
        ctx.fillRect(player.width - 18, player.height - 4, 16, 4);

        ctx.restore();
    }

    // 8. Рисуем фон
    function drawBackground() {
        // Небо
        const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(0.7, '#4a7c59');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Земля
        ctx.fillStyle = '#5d8a3c';
        ctx.fillRect(0, CANVAS_HEIGHT - 40, CANVAS_WIDTH, 40);

        // Трава (полоски)
        ctx.strokeStyle = '#4a7c59';
        ctx.lineWidth = 2;
        for (let i = 0; i < CANVAS_WIDTH + 20; i += 15) {
            const offset = (i - cameraX * 0.5) % 30;
            ctx.beginPath();
            ctx.moveTo(i, CANVAS_HEIGHT - 40);
            ctx.lineTo(i - 5 + offset, CANVAS_HEIGHT - 50);
            ctx.stroke();
        }

        // Деревья
        const treePositions = [100, 400, 700, 1100, 1500, 1900, 2300, 2700];
        treePositions.forEach(pos => {
            const drawX = pos - cameraX;
            if (drawX > -60 && drawX < CANVAS_WIDTH + 60) {
                // Ствол
                ctx.fillStyle = '#5d4037';
                ctx.fillRect(drawX + 12, CANVAS_HEIGHT - 80, 12, 40);
                // Крона
                ctx.fillStyle = '#2d5016';
                ctx.beginPath();
                ctx.arc(drawX + 18, CANVAS_HEIGHT - 95, 30, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#3a6b1e';
                ctx.beginPath();
                ctx.arc(drawX + 5, CANVAS_HEIGHT - 105, 22, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(drawX + 30, CANVAS_HEIGHT - 105, 22, 0, Math.PI * 2);
                ctx.fill();
            }
        });

        // Облака
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        const cloudPositions = [150, 500, 900, 1300, 1800, 2300];
        cloudPositions.forEach(pos => {
            const drawX = pos - cameraX * 0.3;
            if (drawX > -100 && drawX < CANVAS_WIDTH + 100) {
                ctx.beginPath();
                ctx.arc(drawX, 50, 35, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(drawX + 40, 40, 28, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(drawX + 80, 50, 35, 0, Math.PI * 2);
                ctx.fill();
            }
        });
    }

    function update() {
    if (isPaused) return;
    
    // Движение игрока
    let moveX = 0;
    if (keys.left) {
        moveX = -player.speed;
        player.facing = 'left';
    } else if (keys.right) {
        moveX = player.speed;
        player.facing = 'right';
    }

    if (moveX !== 0) {
        const centerX = CANVAS_WIDTH / 2 - player.width / 2;
        if (player.x + moveX < centerX && cameraX > 0) {
            cameraX = Math.max(0, cameraX + moveX);
        } else if (player.x + moveX > centerX && cameraX < 2000) {
            cameraX = Math.min(2000, cameraX + moveX);
        } else {
            const newX = player.x + moveX;
            if (newX >= 0 && newX + player.width <= CANVAS_WIDTH) {
                player.x = newX;
            }
        }
    }

    // Регенерация HP и MP
    regenTimer++;
    if (regenTimer >= 60) { // каждую секунду
        hp = Math.min(100, hp + HP_REGEN);
        mp = Math.min(100, mp + MP_REGEN);
        regenTimer = 0;
        updateUI();
    }

    // Кулдауны умений
    for (let key in skillCooldowns) {
        if (skillCooldowns[key] > 0) {
            skillCooldowns[key]--;
        }
    }

    // Обновление щита
    if (shieldActive) {
        shieldTimer--;
        if (shieldTimer <= 0) {
            shieldActive = false;
        }
    }

    // Проверка конца карты (победа)
    if (cameraX >= 2000 && player.x >= CANVAS_WIDTH / 2 - player.width / 2) {
        endGame(true);
    }
}

    function gameLoop() {
    if (!gameRunning) return;

    // Очищаем холст
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Рисуем фон
    drawBackground();

    // Генерация врагов
    if (spawnTimer <= 0) {
        spawnEnemy();
        spawnTimer = 60 + Math.random() * 120;
    } else {
        spawnTimer--;
    }

    // Обновляем врагов
    updateEnemies();

    // Обновляем стрелы
    updateArrows();

    // Рисуем врагов
    drawEnemies();

    // Рисуем стрелы
    drawArrows();

    // Рисуем игрока
    drawPlayer();

    // Отладочная информация
    ctx.fillStyle = 'white';
    ctx.font = '16px Arial';
    ctx.fillText('Игрок X: ' + Math.round(player.x), 10, 30);
    ctx.fillText('Камера X: ' + Math.round(cameraX), 10, 50);
    ctx.fillText('Врагов: ' + enemies.length, 10, 70);
    ctx.fillText('Счёт: ' + score, 10, 90);

    // Обновляем логику
    update();

    // Запрашиваем следующий кадр
    animationId = requestAnimationFrame(gameLoop);
}

    // 11. Запуск игры
    function startGame() {
        playerName = name;
        gameRunning = true;
        isPaused = false;
        gameTime = 0;
        hp = 100;
        mp = 100;
        score = 0;
        enemies = [];
        arrows = [];
        
        // Запускаем таймер
        if (timerInterval) clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            if (!isPaused && gameRunning) {
                gameTime++;
                document.getElementById('timerDisplay').textContent = formatTime(gameTime);
            }
        }, 1000);

        console.log('🚀 Игра запускается...');
        gameRunning = true;
        
        // Показываем игровой экран
        showGameScreen();
        
        // Сброс состояния
        player.x = 100;
        player.y = CANVAS_HEIGHT - 100;
        cameraX = 0;
        keys.left = false;
        keys.right = false;

        // Запускаем игровой цикл
        if (animationId) cancelAnimationFrame(animationId);
        gameLoop();

        console.log('✅ Игровой цикл запущен!');
    }
    // ========================================
    // ЗАВЕРШЕНИЕ ИГРЫ
    // ========================================
    function endGame(win) {
        gameRunning = false;
        if (animationId) cancelAnimationFrame(animationId);
        if (timerInterval) clearInterval(timerInterval);
        
        // Останавливаем игровой цикл
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
        
        // Скрываем игровой экран
        if (gameScreen) {
            gameScreen.classList.remove('active');
            gameScreen.style.display = 'none';
        }
        
        // Показываем экран результатов
        if (endScreen) {
            endScreen.classList.add('active');
            endScreen.style.display = 'flex';
        }
        
        // Обновляем заголовок
        const message = win ? '🎉 Вы победили!' : '💀 Вы проиграли!';
        const titleElement = document.querySelector('#endScreen h2');
        if (titleElement) {
            titleElement.textContent = message;
        }
        
        // Показываем статистику
        const container = document.getElementById('resultsContainer');
        if (container) {
            container.innerHTML = `
                <p>👤 Игрок: ${playerName || 'Гость'}</p>
                <p>⚔️ Убийства: ${score}</p>
                <p>⏱️ Время: ${formatTime(gameTime)}</p>
                <p>❤️ HP: ${Math.round(hp)}</p>
                <hr>
                <p style="color: #ffd700;">🏆 Ваш результат сохранён!</p>
            `;
        }
        
        console.log('Игра окончена! Результат:', { playerName, score, time: gameTime });
    }

    function formatTime(seconds) {
    const mins = String(Math.floor(seconds / 60)).padStart(2, '0');
    const secs = String(seconds % 60).padStart(2, '0');
    return `${mins}:${secs}`;
    }

    // 12. Обработчик кнопки "Начать"
    startBtn.addEventListener('click', function() {
        const name = playerNameInput.value.trim();
        if (name) {
            console.log('Игрок:', name);
            startGame();
        }
    });

    // 13. Активация кнопки при вводе имени
    playerNameInput.addEventListener('input', function() {
        startBtn.disabled = this.value.trim() === '';
    });

    // 14. Обработчики клавиш
    document.addEventListener('keydown', function(e) {
        if (e.key === 'ArrowLeft') {
            keys.left = true;
            e.preventDefault();
        } else if (e.key === 'ArrowRight') {
            keys.right = true;
            e.preventDefault();
        }
        if (e.key === ' ' || e.key === 'Space') {
            shootArrow();
            e.preventDefault();
        }
        // ===== УМЕНИЯ =====
        if (e.key === '1') {
            useSkill('shot');
            e.preventDefault();
        }
        if (e.key === '2') {
            useSkill('shield');
            e.preventDefault();
        }
        if (e.key === '3') {
            useSkill('tripleShot');
            e.preventDefault();
        }
        if (e.key === '4') {
            useSkill('rainOfArrows');
            e.preventDefault();
        }

        // ===== ПАУЗА =====
        if (e.key === 'Escape') {
            togglePause();
            e.preventDefault();
        }
    });

    document.addEventListener('keyup', function(e) {
        if (e.key === 'ArrowLeft') {
            keys.left = false;
            e.preventDefault();
        } else if (e.key === 'ArrowRight') {
            keys.right = false;
            e.preventDefault();
        }
    });

    // 15. Кнопка перезапуска
    const restartBtn = document.getElementById('restartBtn');
    if (restartBtn) {
        restartBtn.addEventListener('click', function() {
        endScreen.classList.remove('active');
        endScreen.style.display = 'none';
        startScreen.classList.add('active');
        startScreen.style.display = 'flex';
        playerNameInput.value = '';
        startBtn.disabled = true;
        gameRunning = false;
        if (animationId) cancelAnimationFrame(animationId);
        if (timerInterval) clearInterval(timerInterval);
        });
    }

    // ========================================
    // ИСПОЛЬЗОВАНИЕ УМЕНИЙ
    // ========================================
    function useSkill(skillName) {
        if (isPaused) return;
        if (!gameRunning) return;
        
        const skill = skills[skillName];
        const cooldown = skillCooldowns[skillName];
        
        // Проверка: достаточно ли MP
        if (mp < skill.mpCost) {
            console.log('Недостаточно MP!');
            return;
        }
        
        // Проверка: готово ли умение
        if (cooldown > 0) {
            console.log('Умение на перезарядке!');
            return;
        }
        
        // Списываем MP
        mp -= skill.mpCost;
        
        // Применяем эффект
        switch (skillName) {
            case 'shot':
                // Обычный выстрел
                shootArrow();
                skillCooldowns.shot = 0;
                break;
                
            case 'shield':
                // Блок — активируем щит
                shieldActive = true;
                shieldTimer = skill.duration;
                skillCooldowns.shield = 0;
                console.log('🛡️ Щит активирован!');
                break;
                
            case 'tripleShot':
                // Три стрелы
                for (let i = 0; i < 3; i++) {
                    setTimeout(() => {
                        shootArrow();
                    }, i * 100);
                }
                skillCooldowns.tripleShot = skill.cooldown;
                break;
                
            case 'rainOfArrows':
                // Град стрел — уничтожает всех врагов в радиусе
                const radius = 200;
                let killed = 0;
                for (let i = enemies.length - 1; i >= 0; i--) {
                    const enemy = enemies[i];
                    const enemyWorldX = enemy.x + cameraX;
                    const playerWorldX = player.x + cameraX;
                    const dx = Math.abs(enemyWorldX - playerWorldX);
                    if (dx < radius) {
                        score += enemy.score;
                        enemies.splice(i, 1);
                        killed++;
                    }
                }
                skillCooldowns.rainOfArrows = skill.cooldown;
                console.log(`☄️ Уничтожено ${killed} врагов!`);
                updateUI();
                break;
        }
        
        updateUI();
    }
    // ========================================
    // ПАУЗА
    // ========================================
    function togglePause() {
        isPaused = !isPaused;
        
        // Показываем/скрываем сообщение о паузе
        const pauseMessage = document.getElementById('pauseMessage');
        if (!pauseMessage) {
            const div = document.createElement('div');
            div.id = 'pauseMessage';
            div.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                color: #ffd700;
                font-size: 3rem;
                font-weight: bold;
                text-shadow: 0 0 20px rgba(0,0,0,0.8);
                z-index: 100;
                background: rgba(0,0,0,0.7);
                padding: 30px 60px;
                border-radius: 20px;
                border: 2px solid #ffd700;
            `;
            div.textContent = '⏸️ ПАУЗА';
            document.getElementById('gameWorld').appendChild(div);
        } else {
            pauseMessage.style.display = isPaused ? 'block' : 'none';
        }
    }
    console.log('✅ Скрипт полностью загружен! Ожидаем старта.');
});
