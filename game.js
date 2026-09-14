const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Configurações do Progresso do Jogo
let faseAtual = 1;
const totalFases = 3;
let statusJogo = "jogando"; 

// Limites da rua (profundidade estilizada)
const limiteSuperiorRua = 210;
const limiteInferiorRua = 390;

// Configurações do Herói (Lutador Ninja/Marcial)
const jogador = {
    x: 100,
    y: 300,
    largura: 50,
    altura: 70,
    velocidade: 6,
    vida: 100,
    vidaMaxima: 100,
    atacando: false,
    timerAtaque: 0,
    comboStatus: 0, 
    direcao: 'direita',
    estaTomandoDano: false,
    timerDano: 0,
    velX: 0 
};

// Lista de inimigos ativos na fase
let listaInimigos = [];

// Gerenciador de teclado
const teclado = {};
window.addEventListener("keydown", (e) => { 
    const tecla = e.key.toLowerCase();
    
    // Ataque na tecla Z com combo
    if (tecla === 'z' && statusJogo === "jogando" && !jogador.estaTomandoDano) {
        if (!jogador.atacando) {
            jogador.atacando = true;
            jogador.comboStatus = jogador.comboStatus < 3 ? jogador.comboStatus + 1 : 1;
            jogador.timerAtaque = 12; 
            processarAtaqueJogador();
        }
    }
    teclado[tecla] = true; 
});
window.addEventListener("keyup", (e) => { teclado[e.key.toLowerCase()] = false; });

// Configuração da Fase e Criação dos Inimigos
function carregarFase(fase) {
    jogador.x = 100;
    jogador.y = 300;
    jogador.comboStatus = 0;
    jogador.atacando = false;
    listaInimigos = [];
    
    let quantidadeInimigos = fase * 2; 
    
    for (let i = 0; i < quantidadeInimigos; i++) {
        listaInimigos.push({
            x: 600 + Math.random() * 180,
            y: limiteSuperiorRua + Math.random() * (limiteInferiorRua - limiteSuperiorRua - 70),
            largura: 50,
            altura: 70,
            velocidade: 1.5 + (fase * 0.4),
            vida: 35 + (fase * 10),
            vidaMaxima: 35 + (fase * 10),
            atacando: false,
            timerAtaque: 0,
            direcao: 'esquerda',
            estaTomandoDano: false,
            timerDano: 0,
            velX: 0
        });
    }
}

// Mecânicas, IA e Física de Combate
function atualizarFisica() {
    if (statusJogo !== "jogando") return;

    // Física de empurrão do Jogador
    jogador.x += jogador.velX;
    jogador.velX *= 0.85;
    if (jogador.x < 0) jogador.x = 0;
    if (jogador.x > canvas.width - jogador.largura) jogador.x = canvas.width - jogador.largura;

    // Movimentação livre do Jogador
    if (!jogador.atacando && !jogador.estaTomandoDano) {
        if (teclado["arrowleft"] && jogador.x > 0) {
            jogador.x -= jogador.velocidade;
            jogador.direcao = 'esquerda';
        }
        if (teclado["arrowright"] && jogador.x < canvas.width - jogador.largura) {
            jogador.x += jogador.velocidade;
            jogador.direcao = 'direita';
        }
        if (teclado["arrowup"] && jogador.y > limiteSuperiorRua) {
            jogador.y -= jogador.velocidade;
        }
        if (teclado["arrowdown"] && jogador.y < limiteInferiorRua - jogador.altura) {
            jogador.y += jogador.velocidade;
        }
    }

    // Timers de animação do herói
    if (jogador.atacando) {
        jogador.timerAtaque--;
        if (jogador.timerAtaque <= 0) {
            jogador.atacando = false;
            setTimeout(() => { if (!jogador.atacando) jogador.comboStatus = 0; }, 250);
        }
    }
    if (jogador.estaTomandoDano) {
        jogador.timerDano--;
        if (jogador.timerDano <= 0) jogador.estaTomandoDano = false;
    }

    // IA e Movimento dos Capangas
    listaInimigos.forEach(inimigo => {
        inimigo.x += inimigo.velX;
        inimigo.velX *= 0.85;

        if (inimigo.x < 0) inimigo.x = 0;
        if (inimigo.x > canvas.width - inimigo.largura) inimigo.x = canvas.width - inimigo.largura;

        if (inimigo.estaTomandoDano) {
            inimigo.timerDano--;
            if (inimigo.timerDano <= 0) inimigo.estaTomandoDano = false;
            return; 
        }

        // Perseguição em X e Y
        let alvoX = jogador.x + (inimigo.x > jogador.x ? 40 : -40);
        if (inimigo.x < alvoX - 5) {
            inimigo.x += inimigo.velocidade;
            inimigo.direcao = 'direita';
        } else if (inimigo.x > alvoX + 5) {
            inimigo.x -= inimigo.velocidade;
            inimigo.direcao = 'esquerda';
        }

        if (inimigo.y < jogador.y) {
            inimigo.y += inimigo.velocidade;
        } else if (inimigo.y > jogador.y) {
            inimigo.y -= inimigo.velocidade;
        }

        // Sistema de ataque do inimigo
        let distX = Math.abs(inimigo.x - jogador.x);
        let distY = Math.abs(inimigo.y - jogador.y);

        if (distX < 55 && distY < 15 && !inimigo.atacando && !jogador.estaTomandoDano) {
            inimigo.atacando = true;
            inimigo.timerAtaque = 25;
            
            jogador.vida -= 8;
            jogador.estaTomandoDano = true;
            jogador.timerDano = 15;
            jogador.velX = inimigo.direcao === 'direita' ? 8 : -8;

            if (jogador.vida <= 0) {
                jogador.vida = 0;
                statusJogo = "gameover";
            }
        }

        if (inimigo.atacando) {
            inimigo.timerAtaque--;
            if (inimigo.timerAtaque <= 0) inimigo.atacando = false;
        }
    });

    listaInimigos = listaInimigos.filter(i => i.vida > 0);

    if (listaInimigos.length === 0) {
        if (faseAtual < totalFases) {
            faseAtual++;
            carregarFase(faseAtual);
        } else {
            statusJogo = "vitoria";
        }
    }
}

// Processamento de Socos e Knockback
function processarAtaqueJogador() {
    listaInimigos.forEach(inimigo => {
        let alcanceSoco = 65;
        let acertouHorizontal = false;
        
        if (jogador.direcao === 'direita' && inimigo.x > jogador.x && inimigo.x < jogador.x + jogador.largura + alcanceSoco) {
            acertouHorizontal = true;
        }
        if (jogador.direcao === 'esquerda' && inimigo.x < jogador.x && inimigo.x > jogador.x - alcanceSoco) {
            acertouHorizontal = true;
        }

        let acertouProfundidade = Math.abs(jogador.y - inimigo.y) < 22;

        if (acertouHorizontal && acertouProfundidade) {
            inimigo.estaTomandoDano = true;
            inimigo.timerDano = 18;

            let ladoEmpurrão = jogador.direcao === 'direita' ? 1 : -1;
            
            if (jogador.comboStatus === 3) {
                inimigo.vida -= 22;
                inimigo.velX = ladoEmpurrão * 20; // Super soco joga longe
            } else {
                inimigo.vida -= 12;
                inimigo.velX = ladoEmpurrão * 8;
            }
        }
    });
}

// Renderização dos Personagens Estilizados em Emojis
function desenharSprite(p, tipo) {
    ctx.save();
    
    // Inverte o lado para onde o personagem está olhando
    if (p.direcao === 'esquerda') {
        ctx.translate(p.x + p.largura/2, p.y + p.altura/2);
        ctx.scale(-1, 1);
        ctx.translate(-(p.x + p.largura/2), -(p.y + p.altura/2));
    }

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    
    let centroX = p.x + p.largura / 2;
    let centroY = p.y + p.altura / 2;

    if (tipo === 'jogador') {
        // --- DESIGN DO JOGADOR ---
        if (p.estaTomandoDano) {
            ctx.font = "45px Arial";
            ctx.fillText("🤕", centroX, centroY); // Rosto machucado
        } else if (p.atacando) {
            ctx.font = "45px Arial";
            ctx.fillText("🥷", centroX, centroY); // Base ninja
            ctx.font = "24px Arial";
            // Desenha a luva de boxe estendida no soco
            if (p.comboStatus === 3) {
                ctx.fillText("🥊", centroX + 25, centroY - 20); // Gancho pra cima
            } else {
                ctx.fillText("🥊", centroX + 32, centroY + 5);  // Soco direto
            }
        } else {
            // Visual em repouso pronto para a luta
            ctx.font = "45px Arial";
            ctx.fillText("🥷", centroX, centroY);
            ctx.font = "18px Arial";
            ctx.fillText("🥊", centroX + 18, centroY + 12);
        }
    } else {
        // --- DESIGN DOS INIMIGOS ---
        if (p.estaTomandoDano) {
            ctx.font = "45px Arial";
            ctx.fillText("💥", centroX, centroY - 10); // Efeito de explosão do golpe
            ctx.font = "42px Arial";
            ctx.fillText("😵", centroX, centroY); 
        } else if (p.atacando) {
            ctx.font = "42px Arial";
            ctx.fillText("🧌", centroX, centroY);
            ctx.font = "22px Arial";
            ctx.fillText("🪓", centroX + 25, centroY); // Arma do capanga
        } else {
            ctx.font = "42px Arial";
            ctx.fillText("🧌", centroX, centroY); // Visual padrão do monstro punk
        }
    }

    ctx.restore();
}

// Renderização Geral das Telas e Cenário Neon
function renderizarJogo() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Cenário Urbano Retro/Neon
    ctx.fillStyle = "#0a0b12"; 
    ctx.fillRect(0, 0, canvas.width, limiteSuperiorRua);
    ctx.fillStyle = "#161322"; 
    ctx.fillRect(0, limiteSuperiorRua, canvas.width, canvas.height - limiteSuperiorRua);

    // Linha do horizonte Neon Rosa
    ctx.strokeStyle = "#ff007f";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, limiteSuperiorRua);
    ctx.lineTo(canvas.width, limiteSuperiorRua);
    ctx.stroke();

    // Linhas de perspectiva de rua
    ctx.strokeStyle = "rgba(255, 0, 127, 0.1)";
    ctx.lineWidth = 2;
    for (let i = -200; i <= canvas.width + 200; i += 100) {
        ctx.beginPath();
        ctx.moveTo(i, limiteSuperiorRua);
        ctx.lineTo(i + (i - canvas.width/2) * 0.8, canvas.height);
        ctx.stroke();
    }

    // 2. Renderizar Entidades Ordenadas por Profundidade (Y)
