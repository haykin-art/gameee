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

    // 9. Обновление логики
    function update() {
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
    }

    // 10. Главный игровой цикл
    function gameLoop() {
        if (!gameRunning) return;

        // Очищаем холст
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Рисуем фон
        drawBackground();

        // Рисуем игрока
        drawPlayer();

        // Отладочная информация
        ctx.fillStyle = 'white';
        ctx.font = '16px Arial';
        ctx.fillText('Игрок X: ' + Math.round(player.x), 10, 30);
        ctx.fillText('Камера X: ' + Math.round(cameraX), 10, 50);
        ctx.fillText('Нажми ← и → для движения', 10, 70);

        // Обновляем логику
        update();

        // Запрашиваем следующий кадр
        animationId = requestAnimationFrame(gameLoop);
    }

    // 11. Запуск игры
    function startGame() {
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
            // Скрываем экран результатов
            if (endScreen) {
                endScreen.classList.remove('active');
                endScreen.style.display = 'none';
            }
            // Показываем стартовый экран
            if (startScreen) {
                startScreen.classList.add('active');
                startScreen.style.display = 'flex';
            }
            // Сбрасываем поле ввода
            playerNameInput.value = '';
            startBtn.disabled = true;
            gameRunning = false;
            if (animationId) cancelAnimationFrame(animationId);
        });
    }

    console.log('✅ Скрипт полностью загружен! Ожидаем старта.');
});