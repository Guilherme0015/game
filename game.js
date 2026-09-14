const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Configurações do Progresso do Jogo
let faseAtual = 1;
const totalFases = 3;
let statusJogo = "jogando"; 

// Limites da rua (profundidade estilizada)
const limiteSuperiorRua = 200;
const limiteInferiorRua = 380;

// Configurações do Herói (Lutador Estilizado)
const jogador = {
    x: 100,
    y: 300,
    largura: 40,
    altura: 80,
    velocidade: 5.5,
    vida: 100,
    vidaMaxima: 100,
    atacando: false,
    timerAtaque: 0,
    comboStatus: 0, // 0: Nenhum, 1: Soco 1, 2: Soco 2, 3: Gancho Final
    direcao: 'direita',
    estaTomandoDano: false,
    timerDano: 0,
    velX: 0 // Para efeito de empurrão
};

// Lista de inimigos ativos na fase
let listaInimigos = [];

// Gerenciador de teclado
const teclado = {};
window.addEventListener("keydown", (e) => { 
    const tecla = e.key.toLowerCase();
    
    // Sistema de Combo na tecla Z (só ativa se não estiver travado atacando)
    if (tecla === 'z' && statusJogo === "jogando" && !jogador.estaTomandoDano) {
        if (!jogador.atacando) {
            jogador.atacando = true;
            jogador.comboStatus = jogador.comboStatus < 3 ? jogador.comboStatus + 1 : 1;
            jogador.timerAtaque = 10; // Frames do soco
            processarAtaqueJogador();
        }
    }
    teclado[tecla] = true; 
});
window.addEventListener("keyup", (e) => { teclado[e.key.toLowerCase()] = false; });

// Configuração da Fase e Criação dos Punks (Inimigos)
function carregarFase(fase) {
    jogador.x = 100;
    jogador.y = 300;
    jogador.comboStatus = 0;
    jogador.atacando = false;
    listaInimigos = [];
    
    let quantidadeInimigos = fase * 2; 
    
    for (let i = 0; i < quantidadeInimigos; i++) {
        // Punks têm cores de moicano diferentes dependendo da força
        let corMoicano = fase === 1 ? '#ff0055' : (fase === 2 ? '#ff9900' : '#bd00ff');
        
        listaInimigos.push({
            x: 550 + Math.random() * 200,
            y: limiteSuperiorRua + Math.random() * (limiteInferiorRua - limiteSuperiorRua - 80),
            largura: 40,
            altura: 80,
            velocidade: 1.3 + (fase * 0.3),
            vida: 35 + (fase * 10),
            vidaMaxima: 35 + (fase * 10),
            atacando: false,
            timerAtaque: 0,
            direcao: 'esquerda',
            corMoicano: corMoicano,
            estaTomandoDano: false,
            timerDano: 0,
            velX: 0
        });
    }
}

// Mecânicas, IA e Física de Combate
function atualizarFisica() {
    if (statusJogo !== "jogando") return;

    // Reduz efeito de empurrão (Inércia) do Jogador
    jogador.x += jogador.velX;
    jogador.velX *= 0.8;

    // Movimento do Jogador (Apenas se não estiver atacando ou paralisado por dano)
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

    // Timers do Jogador
    if (jogador.atacando) {
        jogador.timerAtaque--;
        if (jogador.timerAtaque <= 0) {
            jogador.atacando = false;
            // Se demorar muito para apertar de novo, quebra o combo
            setTimeout(() => { if (!jogador.atacando) jogador.comboStatus = 0; }, 200);
        }
    }
    if (jogador.estaTomandoDano) {
        jogador.timerDano--;
        if (jogador.timerDano <= 0) jogador.estaTomandoDano = false;
    }

    // IA e Física dos Inimigos (Punks)
    listaInimigos.forEach(inimigo => {
        // Aplica empurrão físico se tomou golpe
        inimigo.x += inimigo.velX;
        inimigo.velX *= 0.8;

        // Se o inimigo sair dos limites horizontais pelo empurrão, corrige
        if (inimigo.x < 0) inimigo.x = 0;
        if (inimigo.x > canvas.width - inimigo.largura) inimigo.x = canvas.width - inimigo.largura;

        if (inimigo.estaTomandoDano) {
            inimigo.timerDano--;
            if (inimigo.timerDano <= 0) inimigo.estaTomandoDano = false;
            return; // Travado na animação de dor, não age
        }

        // Perseguição Inteligente
        let margemX = inimigo.atacando ? 15 : 35;
        if (inimigo.x < jogador.x - margemX) {
            inimigo.x += inimigo.velocidade;
            inimigo.direcao = 'direita';
        } else if (inimigo.x > jogador.x + margemX) {
            inimigo.x -= inimigo.velocidade;
            inimigo.direcao = 'esquerda';
        }

        if (inimigo.y < jogador.y) {
            inimigo.y += inimigo.velocidade;
        } else if (inimigo.y > jogador.y) {
            inimigo.y -= inimigo.velocidade;
        }

        // Ataque do Inimigo
        let distX = Math.abs(inimigo.x - jogador.x);
        let distY = Math.abs(inimigo.y - jogador.y);

        if (distX < 45 && distY < 12 && !inimigo.atacando && !jogador.estaTomandoDano) {
            inimigo.atacando = true;
            inimigo.timerAtaque = 20;
            
            // Dano no Jogador com leve empurrão
            jogador.vida -= 7;
            jogador.estaTomandoDano = true;
            jogador.timerDano = 12;
            jogador.velX = inimigo.direcao === 'direita' ? 6 : -6;

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

    // Remover mortos
    listaInimigos = listaInimigos.filter(i => i.vida > 0);

    // Progresso de Fase
    if (listaInimigos.length === 0) {
        if (faseAtual < totalFases) {
            faseAtual++;
            carregarFase(faseAtual);
        } else {
            statusJogo = "vitoria";
        }
    }
}

// Processa o Ataque com o Novo Sistema de Combos e Knockback
function processarAtaqueJogador() {
    listaInimigos.forEach(inimigo => {
        let alcanceSoco = 55;
        let acertouHorizontal = false;
        
        if (jogador.direcao === 'direita' && inimigo.x > jogador.x && inimigo.x < jogador.x + jogador.largura + alcanceSoco) {
            acertouHorizontal = true;
        }
        if (jogador.direcao === 'esquerda' && inimigo.x < jogador.x && inimigo.x > jogador.x - alcanceSoco) {
            acertouHorizontal = true;
        }

        let acertouProfundidade = Math.abs(jogador.y - inimigo.y) < 18;

        if (acertouHorizontal && acertouProfundidade) {
            inimigo.estaTomandoDano = true;
            inimigo.timerDano = 15;

            // Define dano e empurrão com base no soco atual do combo
            let direcaoForca = jogador.direcao === 'direita' ? 1 : -1;
            
            if (jogador.comboStatus === 3) {
                // Gancho Final: Alto dano e grande empurrão
                inimigo.vida -= 20;
                inimigo.velX = direcaoForca * 15; 
            } else {
                // Socos normais (1 e 2): Dano padrão e leve travada
                inimigo.vida -= 10;
                inimigo.velX = direcaoForca * 5;
            }
        }
    });
}

// Desenha Personagens Vetoriais Identificáveis
function desenharPersonagem(ctx, p, tipo) {
    ctx.save();
    
    // Inverte o desenho caso esteja olhando para a esquerda
    if (p.direcao === 'esquerda') {
        ctx.translate(p.x + p.largura/2, p.y + p.altura/2);
        ctx.scale(-1, 1);
        ctx.translate(-(p.x + p.largura/2), -(p.y + p.altura/2));
    }

    let x = p.x;
    let y = p.y;

    // Se tomou dano, pisca em vermelho
    if (p.estaTomandoDano && Math.floor(Date.now() / 50) % 2 === 0) {
        ctx.fillStyle = "#ff3333";
        ctx.fillRect(x, y, p.largura, p.altura);
        ctx.restore();
        return;
    }

    if (tipo === 'jogador') {
        // --- DESIGN DO HERÓI (Jaqueta azul, calça jeans e bandana) ---
        // Pernas (Jeans)
        ctx.fillStyle = "#2b5cb3";
        ctx.fillRect(x + 8, y + 45, 10, 35);
        ctx.fillRect(x + 22, y + 45, 10, 35);
        // Sapatos
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(x + 6, y + 74, 13, 6);
        ctx.fillRect(x + 21, y + 74, 13, 6);
        // Tronco (Jaqueta Aberta)
        ctx.fillStyle = "#1a3c80";
        ctx.fillRect(x + 5, y + 18, 30, 28);
        ctx.fillStyle = "#ffffff"; // Camiseta interna
        ctx.fillRect(x + 13, y + 18, 14, 28);
        // Cabeça e Pele
        ctx.fillStyle = "#ffdbac";
        ctx.fillRect(x + 12, y + 2, 16, 16);
        // Bandana Vermelha
        ctx.fillStyle = "#ff0044";
        ctx.fillRect(x + 10, y, 20, 5); 
        ctx.fillRect(x + 8, y + 3, 5, 5); // Ponta amarrada
        // Braço / Soco
        ctx.fillStyle = "#1a3c80";
        if (p.atacando) {
            ctx.fillStyle = "#ffdbac"; // Mão estendida
            if (p.comboStatus === 3) { // Gancho para cima
                ctx.fillRect(x + 28, y - 2, 14, 14);
            } else { // Soco direto
                ctx.fillRect(x + 28, y + 18, 20, 12);
            }
        } else {
            ctx.fillRect(x + 28, y + 18, 10, 20); // Braço em repouso
        }

    } else {
        // --- DESIGN DO INIMIGO (Punk de Moicano) ---
        // Pernas (Calça Rasgada)
        ctx.fillStyle = "#333333";
        ctx.fillRect(x + 8, y + 45, 10, 35);
        ctx.fillRect(x + 22, y + 45, 10, 35);
        // Botas escuras
        ctx.fillStyle = "#111111";
        ctx.fillRect(x + 6, y + 74, 12, 7);
        ctx.fillRect(x + 22, y + 74, 12, 7);
