const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Estado do Jogo
const game = {
    gravity: 0.6,
    floorY: 340,
    score: 0,
    wave: 1,
    gameOver: false
};

// Teclas pressionadas
const keys = {
    ArrowLeft: false,
    ArrowRight: false,
    z: false,
    x: false
};

// Entidade Base (Jogador e Inimigos)
class Character {
    constructor(x, y, color, isPlayer = false) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 70;
        this.color = color;
        this.speed = isPlayer ? 4 : 2;
        this.vx = 0;
        this.vy = 0;
        this.isGrounded = true;
        this.health = isPlayer ? 100 : 30;
        this.maxHealth = this.health;
        this.facing = 1; // 1 = Direita, -1 = Esquerda
        this.isAttacking = false;
        this.attackTimer = 0;
        this.isHit = false;
        this.hitTimer = 0;
        this.isPlayer = isPlayer;
    }

    update() {
        // Gravidade
        if (!this.isGrounded) {
            this.vy += game.gravity;
            this.y += this.vy;
            if (this.y >= game.floorY - this.height) {
                this.y = game.floorY - this.height;
                this.vy = 0;
                this.isGrounded = true;
            }
        }

        // Recuperação de dano
        if (this.isHit) {
            this.hitTimer--;
            if (this.hitTimer <= 0) this.isHit = false;
        }

        // Ataque temporizado
        if (this.isAttacking) {
            this.attackTimer--;
            if (this.attackTimer <= 0) this.isAttacking = false;
        }
    }

    draw() {
        ctx.save();
        
        // Estilo Neon / Silhueta
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        
        if (this.isHit) {
            ctx.fillStyle = '#ffffff';
        } else {
            ctx.fillStyle = this.color;
        }

        // Corpo principal
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Olhos estilizados (direção)
        ctx.fillStyle = '#000';
        const eyeOffset = this.facing === 1 ? this.width - 12 : 4;
        ctx.fillRect(this.x + eyeOffset, this.y + 12, 8, 5);

        // Desenhar braço atacando
        if (this.isAttacking) {
            ctx.fillStyle = this.color;
            const punchX = this.facing === 1 ? this.x + this.width : this.x - 20;
            ctx.fillRect(punchX, this.y + 20, 20, 10);
        }

        ctx.restore();
    }

    jump() {
        if (this.isGrounded) {
            this.vy = -12;
            this.isGrounded = false;
        }
    }

    attack() {
        if (!this.isAttacking && !this.isHit) {
            this.isAttacking = true;
            this.attackTimer = 15; // Duração do soco em frames
            return true;
        }
        return false;
    }

    takeDamage(amount, knockbackDir) {
        if (this.isHit) return;
        this.health -= amount;
        this.isHit = true;
        this.hitTimer = 20;
        this.x += knockbackDir * 15; // Pequeno empurrão ao levar dano
        if (this.health < 0) this.health = 0;
    }
}

// Inicializar Jogador
const player = new Character(100, game.floorY - 70, '#00f0ff', true);

// Lista de Inimigos
const enemies = [];

function spawnEnemy() {
    const side = Math.random() > 0.5 ? canvas.width + 20 : -50;
    const colors = ['#ff0055', '#ff9900', '#aa00ff'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const enemy = new Character(side, game.floorY - 70, randomColor, false);
    enemy.health = 20 + game.wave * 5; // Inimigos ficam mais fortes a cada wave
    enemies.push(enemy);
}

// Escuta das teclas pressionadas
window.addEventListener('keydown', (e) => {
    if (game.gameOver && e.key.toLowerCase() === 'r') {
        restartGame();
        return;
    }
    if (e.key in keys) keys[e.key] = true;
    if (e.key === 'z' || e.key === 'Z') {
        if (player.attack()) {
            checkHits();
        }
    }
    if (e.key === 'x' || e.key === 'X') player.jump();
});

window.addEventListener('keyup', (e) => {
    if (e.key in keys) keys[e.key] = false;
});

function checkHits() {
    // Área de alcance do soco do jogador
    const attackRange = 25;
    const attackBox = {
        y: player.y,
        height: player.height,
        x: player.facing === 1 ? player.x + player.width : player.x - attackRange,
        width: attackRange
    };

    enemies.forEach(enemy => {
        if (
            attackBox.x < enemy.x + enemy.width &&
            attackBox.x + attackBox.width > enemy.x &&
            attackBox.y < enemy.y + enemy.height &&
            attackBox.y + attackBox.height > enemy.y
        ) {
            enemy.takeDamage(10, player.facing);
            if (enemy.health <= 0) game.score += 100;
        }
    });
}

function restartGame() {
    player.health = 100;
    player.x = 100;
    player.y = game.floorY - player.height;
    enemies.length = 0;
    game.score = 0;
    game.wave = 1;
    game.gameOver = false;
}

// Loop Principal do Jogo
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // --- CENÁRIO DE FUNDO ---
    // Prédios estilizados (Silhuetas)
    ctx.fillStyle = '#222230';
    ctx.fillRect(50, 100, 120, 300);
    ctx.fillRect(250, 50, 160, 350);
    ctx.fillRect(500, 150, 100, 250);
    ctx.fillRect(680, 80, 100, 320);

    // Chão neon
    ctx.fillStyle = '#0d0d13';
    ctx.fillRect(0, game.floorY, canvas.width, canvas.height - game.floorY);
    ctx.strokeStyle = '#ff007f';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, game.floorY);
    ctx.lineTo(canvas.width, game.floorY);
    ctx.stroke();

    if (!game.gameOver) {
        // Movimento do Jogador
        player.vx = 0;
        if (keys.ArrowLeft) {
            player.vx = -player.speed;
            player.facing = -1;
        }
        if (keys.ArrowRight) {
            player.vx = player.speed;
            player.facing = 1;
        }
        player.x += player.vx;
        
        // Limites da tela para o jogador
        if (player.x < 0) player.x = 0;
        if (player.x > canvas.width - player.width) player.x = canvas.width - player.width;

        player.update();

        // Gerenciar Waves e Inimigos
        if (enemies.length === 0) {
            game.wave++;
            for (let i = 0; i < game.wave + 1; i++) {
                setTimeout(spawnEnemy, i * 800);
            }
        }

        // Lógica dos Inimigos
        for (let i = enemies.length - 1; i >= 0; i--) {
            const enemy = enemies[i];
            
            if (enemy.health <= 0) {
                enemies.splice(i, 1);
                continue;
            }

            // IA Simples: Anda em direção ao jogador
            if (!enemy.isHit && !enemy.isAttacking) {
                if (enemy.x < player.x - 25) {
                    enemy.x += enemy.speed;
                    enemy.facing = 1;
                } else if (enemy.x > player.x + 25) {
                    enemy.x -= enemy.speed;
                    enemy.facing = -1;
                } else {
                    // Ataca aleatoriamente se estiver perto
                    if (Math.random() < 0.05) {
                        enemy.attack();
                        if (!player.isHit && Math.abs(player.y - enemy.y) < 20) {
                            player.takeDamage(15, enemy.facing);
                            if (player.health <= 0) {
                                game.gameOver = true;
                            }
                        }
                    }
                }
            }

            enemy.update();
            enemy.draw();
        }

        player.draw();

    } else {
        // Tela de Game Over
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.font = '40px Courier New';
        ctx.fillStyle = '#ff0055';
        ctx.textAlign = 'center';
        ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 20);
        
        ctx.font = '20px Courier New';
        ctx.fillStyle = '#fff';
        ctx.fillText("Pressione R para Recomeçar", canvas.width / 2, canvas.height / 2 + 30);
    }

    // --- INTERFACE (HUD) ---
    // Barra de Vida
    ctx.fillStyle = '#333';
    ctx.fillRect(20, 20, 200, 20);
    ctx.fillStyle = '#00f0ff';
    ctx.fillRect(20, 20, (player.health / 100) * 200, 20);
    ctx.font = '14px Courier New';
    ctx.fillStyle = '#fff';
    ctx.fillText("PLAYER", 20, 15);

    // Pontuação e Waves
    ctx.textAlign = 'right';
    ctx.fillText(`SCORE: ${game.score}`, canvas.width - 20, 30);
    ctx.fillText(`WAVE: ${game.wave - 1}`, canvas.width - 20, 50);
    ctx.textAlign = 'left'; // Reset

    requestAnimationFrame(gameLoop);
}

// Iniciar
for (let i = 0; i < 2; i++) spawnEnemy();
gameLoop();
