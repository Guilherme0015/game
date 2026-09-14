const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Configurações do Progresso do Jogo
let faseAtual = 1;
const totalFases = 3;
let statusJogo = "jogando"; 

// Limites da rua (profundidade estilizada)
const limiteSuperiorRua = 200;
const limiteInferiorRua = 380;

// Configurações do Herói (Jogador - Visual Ciano Neon)
const jogador = {
    x: 100,
    y: 300,
    largura: 35,
    altura: 75,
    velocidade: 5,
    vida: 100,
    vidaMaxima: 100,
    atacando: false,
    timerAtaque: 0,
    direcao: 'direita',
    cor: '#00ffcc' // Ciano Neon
};

// Lista de inimigos ativos na fase
let listaInimigos = [];

// Gerenciador de teclado
const teclado = {};
window.addEventListener("keydown", (e) => { teclado[e.key.toLowerCase()] = true; });
window.addEventListener("keyup", (e) => { teclado[e.key.toLowerCase()] = false; });

// Configuração da Fase
function carregarFase(fase) {
    jogador.x = 100;
    jogador.y = 300;
    listaInimigos = [];
    
    let quantidadeInimigos = fase * 2; 
    
    for (let i = 0; i < quantidadeInimigos; i++) {
        // Cores vibrantes diferentes por fase para os inimigos
        let corInimigo = fase === 1 ? '#ff0055' : (fase === 2 ? '#ff9900' : '#bd00ff');
        
        listaInimigos.push({
            x: 500 + Math.random() * 250,
            y: limiteSuperiorRua + Math.random() * (limiteInferiorRua - limiteSuperiorRua - 75),
            largura: 35,
            altura: 75,
            velocidade: 1.5 + (fase * 0.4),
            vida: 30 + (fase * 10),
            vidaMaxima: 30 + (fase * 10),
            atacando: false,
            timerAtaque: 0,
            direcao: 'esquerda',
            cor: corInimigo
        });
    }
}

// Mecânicas e Movimentação
function atualizarFisica() {
    if (statusJogo !== "jogando") return;

    // Movimento do Jogador (Setas)
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

    // Ataque Simples (Tecla Z)
    if (teclado["z"] && !jogador.atacando) {
        jogador.atacando = true;
        jogador.timerAtaque = 6; 
        processarAtaqueJogador();
    }

    if (jogador.atacando) {
        jogador.timerAtaque--;
        if (jogador.timerAtaque <= 0) jogador.atacando = false;
    }

    // IA dos Inimigos
    listaInimigos.forEach(inimigo => {
        if (inimigo.x < jogador.x - 30) {
            inimigo.x += inimigo.velocidade;
            inimigo.direcao = 'direita';
        } else if (inimigo.x > jogador.x + 30) {
            inimigo.x -= inimigo.velocidade;
            inimigo.direcao = 'esquerda';
        }

        if (inimigo.y < jogador.y) {
            inimigo.y += inimigo.velocidade;
        } else if (inimigo.y > jogador.y) {
            inimigo.y -= inimigo.velocidade;
        }

        let distX = Math.abs(inimigo.x - jogador.x);
        let distY = Math.abs(inimigo.y - jogador.y);

        if (distX < 40 && distY < 15 && !inimigo.atacando) {
            inimigo.atacando = true;
            inimigo.timerAtaque = 15;
            jogador.vida -= 6;
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

function processarAtaqueJogador() {
    listaInimigos.forEach(inimigo => {
        let alcanceSoco = 50;
        let acertouHorizontal = false;
        
        if (jogador.direcao === 'direita' && inimigo.x > jogador.x && inimigo.x < jogador.x + jogador.largura + alcanceSoco) {
            acertouHorizontal = true;
        }
        if (jogador.direcao === 'esquerda' && inimigo.x < jogador.x && inimigo.x > jogador.x - alcanceSoco) {
            acertouHorizontal = true;
        }

        let acertouProfundidade = Math.abs(jogador.y - inimigo.y) < 20;

        if (acertouHorizontal && acertouProfundidade) {
            inimigo.vida -= 15;
        }
    });
}

// Renderização Estilizada (Estilo Neon/Synthwave)
function renderizarJogo() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Fundo do Cenário (Céu Noturno Escuro)
    ctx.fillStyle = "#090a10"; 
    ctx.fillRect(0, 0, canvas.width, limiteSuperiorRua);

    // 2. Chão Estilizado (Roxo Escuro com Grade Eletrônica)
    ctx.fillStyle = "#161224"; 
    ctx.fillRect(0, limiteSuperiorRua, canvas.width, canvas.height - limiteSuperiorRua);

    // Linha do horizonte brilhante (Neon Rosa)
    ctx.strokeStyle = "#ff007f";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, limiteSuperiorRua);
    ctx.lineTo(canvas.width, limiteSuperiorRua);
    ctx.stroke();

    // Linhas de perspectiva estilizadas no chão
    ctx.strokeStyle = "rgba(255, 0, 127, 0.15)";
    ctx.lineWidth = 2;
    for (let i = -200; i <= canvas.width + 200; i += 80) {
        ctx.beginPath();
        ctx.moveTo(i, limiteSuperiorRua);
        ctx.lineTo(i + (i - canvas.width/2), canvas.height);
        ctx.stroke();
    }

    // 3. Personagens Ordenados por Eixo Y (Profundidade)
    const todosOsPersonagens = [jogador, ...listaInimigos];
    todosOsPersonagens.sort((a, b) => a.y - b.y);

    todosOsPersonagens.forEach(personagem => {
        // Sombra de luz negra sob os pés
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.beginPath();
        ctx.ellipse(personagem.x + personagem.largura/2, personagem.y + personagem.altura, 18, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Corpo em formato de Bloco Minimalista Estilizado
        ctx.fillStyle = personagem.cor;
        ctx.fillRect(personagem.x, personagem.y, personagem.largura, personagem.altura);
        
        // Detalhe de "Olhos Visor" brilhantes para dar estilo
        ctx.fillStyle = "#ffffff";
        if (personagem.direcao === 'direita') {
            ctx.fillRect(personagem.x + personagem.largura - 12, personagem.y + 12, 10, 4);
        } else {
            ctx.fillRect(personagem.x + 2, personagem.y + 12, 10, 4);
        }

        // Punho de Ataque Neon Elétrico
        if (personagem.atacando) {
            ctx.fillStyle = "#ffffff";
            if (personagem.direcao === 'direita') {
                ctx.fillRect(personagem.x + personagem.largura, personagem.y + 22, 15, 12);
            } else {
                ctx.fillRect(personagem.x - 15, personagem.y + 22, 15, 12);
            }
        }

        // Barras de Vida Simples sobre a cabeça
        ctx.fillStyle = "rgba(255,255,255,0.1)";
        ctx.fillRect(personagem.x, personagem.y - 12, personagem.largura, 4);
        ctx.fillStyle = personagem.cor;
        ctx.fillRect(personagem.x, personagem.y - 12, personagem.largura * (personagem.vida / personagem.vidaMaxima), 4);
    });

    // 4. INTERFACE DO USUÁRIO (UI Neon)
    ctx.fillStyle = "#00ffcc";
    ctx.font = "bold 14px 'Courier New'";
    ctx.fillText(`STAGE 0${faseAtual}`, 25, 35);
    ctx.fillStyle = "#8a8da4";
    ctx.fillText(`FOES: ${listaInimigos.length}`, 25, 55);

    // Barra de Vida Principal do Player (Design Limpo Superior Direito)
    ctx.fillStyle = "#161224";
    ctx.fillRect(550, 20, 220, 18);
    ctx.fillStyle = "#00ffcc";
    ctx.fillRect(550, 20, 220 * (jogador.vida / jogador.vidaMaxima), 18);
    ctx.strokeStyle = "#ff007f";
    ctx.strokeRect(550, 20, 220, 18);
    ctx.fillStyle = "#0d0e15";
    ctx.font = "bold 11px Arial";
    ctx.fillText("P1 LIFE", 560, 33);

    // Telas de Fim de Jogo Estilizadas
    if (statusJogo === "gameover") {
        ctx.fillStyle = "rgba(13, 14, 21, 0.95)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#ff0055";
        ctx.font = "bold 36px 'Courier New'";
        ctx.fillText("P1 DEFEATED", 280, 210);
    }

    if (statusJogo === "vitoria") {
        ctx.fillStyle = "rgba(13, 14, 21, 0.95)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#00ffcc";
        ctx.font = "bold 32px 'Courier New'";
        ctx.fillText("STREETS CLEARED", 250, 200);
    }
}

// Loop do Jogo
function loopJogo() {
    atualizarFisica();
    renderizarJogo();
    requestAnimationFrame(loopJogo);
}

// Início
carregarFase(faseAtual);
loopJogo();
