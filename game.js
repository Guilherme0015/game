const personagem = document.getElementById('personagem');
const obstaculo = document.getElementById('obstaculo');
const item = document.getElementById('item');
const txtFase = document.getElementById('fase');
const txtItens = document.getElementById('itens');
const msgGameOver = document.getElementById('mensagem-gameover');

let jogando = true;
let qtdItens = 0;
let faseAtual = 1;
let velocidade = 4;

// Posições iniciais horizontais
let obstaculoX = 600;
let itemX = 800; 

// Captura comandos do teclado
document.addEventListener('keydown', function(event) {
    if ((event.code === 'Space' || event.code === 'ArrowUp') && jogando) {
        pular();
    }
});

function pular() {
    if (!personagem.classList.contains('pulo')) {
        personagem.classList.add('pulo');
        // Remove a classe após o término da animação do CSS (600ms)
        setTimeout(() => {
            personagem.classList.remove('pulo');
        }, 600);
    }
}

// Loop principal do jogo executado a cada frame
function loopJogo() {
    if (!jogando) return;

    // Movimentação do obstáculo
    obstaculoX -= velocidade;
    if (obstaculoX < -30) {
        obstaculoX = 600 + Math.random() * 200; // Gera posição aleatória fora da tela
    }
    obstaculo.style.left = obstaculoX + 'px';

    // Movimentação do item
    itemX -= velocidade;
    if (itemX < -30) {
        itemX = 700 + Math.random() * 300; // Gera posição aleatória fora da tela
        item.style.display = 'block'; // Mostra o item novamente na tela
    }
    item.style.left = itemX + 'px';

    // Coleta a altura atual do personagem (pulo)
    let personagemBottom = parseFloat(window.getComputedStyle(personagem).getPropertyValue('bottom'));
    
    // 1. Detecção de colisão com o Obstáculo (Fim de jogo)
    if (obstaculoX > 50 && obstaculoX < 90 && personagemBottom < 45) {
        gameOver();
    }

    // 2. Detecção de colisão com o Item (Coleta)
    if (itemX > 50 && itemX < 90 && personagemBottom > 60 && item.style.display !== 'none') {
        item.style.display = 'none';
        coletarItem();
    }

    requestAnimationFrame(loopJogo);
}

function coletarItem() {
    qtdItens++;
    
    // Avança de fase ao coletar 5 itens
    if (qtdItens >= 5) {
        faseAtual++;
        qtdItens = 0;
        velocidade += 1.5; // Deixa o jogo mais rápido e difícil
    }

    txtFase.innerText = faseAtual;
    txtItens.innerText = qtdItens;
}

function gameOver() {
    jogando = false;
    msgGameOver.style.display = 'block';
}

function reiniciarJogo() {
    jogando = true;
    qtdItens = 0;
    faseAtual = 1;
    velocidade = 4;
    obstaculoX = 600;
    itemX = 800;
    
    txtFase.innerText = faseAtual;
    txtItens.innerText = qtdItens;
    msgGameOver.style.display = 'none';
    item.style.display = 'block';
    
    loopJogo();
}

// Inicializa o jogo automaticamente ao carregar
loopJogo();
