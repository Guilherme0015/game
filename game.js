const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Configurações do Progresso do Jogo
let faseAtual = 1;
const totalFases = 3;
let statusJogo = "jogando"; // "jogando", "gameover", "vitoria"

// Limites da rua (profundidade estilo Final Fight)
const limiteSuperiorRua = 220;
const limiteInferiorRua = 380;

// Configurações do Herói (Jogador)
const jogador = {
    x: 100,
    y: 300,
    largura: 40,
    altura: 80,
    velocidade: 4,
    vida: 100,
    vidaMaxima: 100,
    atacando: false,
    timerAtaque: 0,
    direcao: 'direita', // 'esquerda' ou 'direita'
    cor: '#00AAFF'
};

// Lista de inimigos ativos na fase
let listaInimigos = [];

// Gerenciador de teclas pressionadas
const teclado = {};
window.addEventListener("keydown", (e) => { teclado[e.key.toLowerCase()] = true; });
window.addEventListener("keyup", (e) => { teclado[e.key.toLowerCase()] = false; });

// Função para gerar inimigos e configurar a fase
function carregarFase(fase) {
    jogador.x = 100;
    jogador.y = 300;
    listaInimigos = [];
    
    // A quantidade de capangas cresce a cada fase
    let quantidadeInimigos = fase * 2; 
    
    for (let i = 0; i < quantidadeInimigos; i++) {
        listaInimigos.push({
            x: 500 + Math.random() * 250,
            y: limiteSuperiorRua + Math.random() * (limiteInferiorRua - limiteSuperiorRua - 80),
            largura: 40,
            altura: 80,
            velocidade: 1.2 + (fase * 0.3),
            vida: 30 + (fase * 10),
            vidaMaxima: 30 + (fase * 10),
            atacando: false,
            timerAtaque: 0,
            direcao: 'esquerda',
            cor: `hsl(${fase * 50}, 85%, 45%)` // Muda a cor dos vilões por fase
        });
    }
}

// Atualiza a física e os movimentos a cada frame
function atualizarFisica() {
    if (statusJogo !== "jogando") return;

    // Movimentação do Jogador pelas setas
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

    // Ataque do Jogador (Tecla Z)
    if (teclado["z"]) {
        if (!jogador.atacando) {
            jogador.atacando = true;
            jogador.timerAtaque = 8; // Duração do soco em frames
            processarAtaqueJogador();
        }
    }

    if (jogador.atacando) {
        jogador.timerAtaque--;
        if (jogador.timerAtaque <= 0) jogador.atacando = false;
    }

    // Inteligência Artificial dos Inimigos
    listaInimigos.forEach(inimigo => {
        // Seguir o jogador no eixo X
        if (inimigo.x < jogador.x - 35) {
            inimigo.x += inimigo.velocidade;
            inimigo.direcao = 'direita';
        } else if (inimigo.x > jogador.x + 35) {
            inimigo.x -= inimigo.velocidade;
            inimigo.direcao = 'esquerda';
        }

        // Seguir o jogador no eixo Y (Profundidade)
        if (inimigo.y < jogador.y) {
            inimigo.y += inimigo.velocidade;
        } else if (inimigo.y > jogador.y) {
            inimigo.y -= inimigo.velocidade;
        }

        // Lógica de ataque do inimigo por proximidade
        let distX = Math.abs(inimigo.x - jogador.x);
        let distY = Math.abs(inimigo.y - jogador.y);

        // Se estiver colado e alinhado na profundidade da rua, ele bate
        if (distX < 45 && distY < 15 && !inimigo.atacando) {
            inimigo.atacando = true;
            inimigo.timerAtaque = 20;
            
            // Aplica dano ao herói
            jogador.vida -= 8;
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

    // Remove da lista os inimigos que ficaram sem vida
    listaInimigos = listaInimigos.filter(i => i.vida > 0);

    // Sistema de Avanço de Fase (Se limpar a tela)
    if (listaInimigos.length === 0) {
        if (faseAtual < totalFases) {
            faseAtual++;
            carregarFase(faseAtual);
        } else {
            statusJogo = "vitoria";
        }
    }
}

// Verifica se o golpe do jogador atingiu algum capanga
function processarAtaqueJogador() {
    listaInimigos.forEach(inimigo => {
        let alcanceSoco = 55;
        let acertouHorizontal = false;
        
        // Verifica se o inimigo está posicionado na frente do soco
        if (jogador.direcao === 'direita' && inimigo.x > jogador.x && inimigo.x < jogador.x + jogador.largura + alcanceSoco) {
            acertouHorizontal = true;
        }
        if (jogador.direcao === 'esquerda' && inimigo.x < jogador.x && inimigo.x > jogador.x - alcanceSoco) {
            acertouHorizontal = true;
        }

        // Alinhamento de profundidade 2.5D (Eixo Y)
        let acertouProfundidade = Math.abs(jogador.y - inimigo.y) < 20;

        if (acertouHorizontal && acertouProfundidade) {
            inimigo.vida -= 15; // Dano do soco
        }
    });
}

// Renderiza tudo visualmente no Canvas
function renderizarJogo() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Desenho do Cenário: Fundo/Prédios e Calçada
    ctx.fillStyle = "#1e1e24"; 
    ctx.fillRect(0, 0, canvas.width, limiteSuperiorRua);
    ctx.fillStyle = "#3a3a42"; // Chão de asfalto
    ctx.fillRect(0, limiteSuperiorRua, canvas.width, canvas.height - limiteSuperiorRua);
    
    // Faixa pintada na rua (Linha do Horizonte)
    ctx.strokeStyle = "#50505a";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, limiteSuperiorRua);
    ctx.lineTo(canvas.width, limiteSuperiorRua);
    ctx.stroke();

    // Ordenação por profundidade (Efeito Y do Beat 'em Up)
    const todosOsPersonagens = [jogador, ...listaInimigos];
    todosOsPersonagens.sort((a, b) => a.y - b.y);

    todosOsPersonagens.forEach(personagem => {
        // Sombra oval abaixo do personagem
        ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
        ctx.beginPath();
        ctx.ellipse(personagem.x + personagem.largura/2, personagem.y + personagem.altura, 22, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Desenho do Corpo
        ctx.fillStyle = personagem.cor;
        ctx.fillRect(personagem.x, personagem.y, personagem.largura, personagem.altura);

        // Extensão do Punho em combate
        if (personagem.atacando) {
            ctx.fillStyle = "#ffcc00";
            if (personagem.direcao === 'direita') {
                ctx.fillRect(personagem.x + personagem.largura, personagem.y + 25, 15, 10);
            } else {
                ctx.fillRect(personagem.x - 15, personagem.y + 25, 15, 10);
            }
        }

        // Mini barra de vida flutuante sobre a cabeça
        ctx.fillStyle = "#cc0000";
        ctx.fillRect(personagem.x, personagem.y - 12, personagem.largura, 5);
        ctx.fillStyle = "#00cc44";
        ctx.fillRect(personagem.x, personagem.y - 12, personagem.largura * (personagem.vida / personagem.vidaMaxima), 5);
    });

    // RENDERIZAR USER INTERFACE (UI)
    ctx.fillStyle = "#FFF";
    ctx.font = "bold 18px Arial";
    ctx.fillText(`FASE: ${faseAtual} / ${totalFases}`, 25, 40);
    ctx.font = "14px Arial";
    ctx.fillStyle = "#aaa";
    ctx.fillText(`Capangas Restantes: ${listaInimigos.length}`, 25, 65);

    // Barra de Vida Principal do Jogador (Canto Superior Direito)
    ctx.fillStyle = "#444";
    ctx.fillRect(530, 25, 240, 22);
    ctx.fillStyle = "#00AAFF";
    ctx.fillRect(530, 25, 240 * (jogador.vida / jogador.vidaMaxima), 22);
    ctx.strokeStyle = "#fff";
    ctx.strokeRect(530, 25, 240, 22);
    ctx.fillStyle = "#FFF";
    ctx.font = "bold 12px Arial";
    ctx.fillText("PLAYER 1", 540, 41);

    // Telas de Fim de Jogo
    if (statusJogo === "gameover") {
        ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#ff3333";
        ctx.font = "bold 45px Arial";
        ctx.fillText("GAME OVER", 270, 210);
    }

    if (statusJogo === "vitoria") {
        ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#ffcc00";
        ctx.font = "bold 40px Arial";
        ctx.fillText("VOCÊ LIMPOU AS RUAS!", 170, 190);
        ctx.font = "20px Arial";
        ctx.fillStyle = "#fff";
        ctx.fillText("Parabéns, campeão!", 310, 230);
    }
}

// Loop Principal do Jogo
function loopJogo() {
    atualizarFisica();
    renderizarJogo();
    requestAnimationFrame(loopJogo);
}

// Inicializa a primeira fase do jogo
carregarFase(faseAtual);
loopJogo();
</script> <!-- Note: esta tag fecha o escopo de execução básica se usado inline, em arquivos .js puros ela não é necessária, mas mantive o padrão limpo -->
