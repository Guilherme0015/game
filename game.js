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

// Posições iniciais bem definidas fora da tela de colisão (50px-90px)
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
        setTimeout(() => {
            personagem.classList.remove('pulo');
        }, 600);
    }
}

function loopJogo() {
    if (!jogando) return;

    // Movimentação do obstáculo
    obstaculoX -= velocidade;
    if (obstaculoX < -30) {
        obstaculoX = 600 + Math.random() * 200;
    }
    obstaculo.style.left = obstaculoX + 'px';

    // Movimentação do item
    itemX -= velocidade;
    if (itemX < -30) {
        itemX = 700 + Math.random() * 300;
        item.style.display = 'block';
    }
    item.style.left = itemX + 'px';

    // Pega a altura do personagem em tempo real
    let personagemBottom = parseFloat(window.getComputedStyle(personagem).getPropertyValue('bottom'));
    
    // Detecção precisa de colisão com o Obstáculo
    if (obstaculoX > 50 && obstaculoX < 90 && personagemBottom < 45) {
        gameOver();
        return; // Interrompe o loop imediatamente
    }

    // Detecção de colisão com o Item
    if (itemX > 50 && itemX < 90 && personagemBottom > 60 && item.style.display !== 'none') {
        item.style.display = 'none';
        coletarItem();
    }

    requestAnimationFrame(loopJogo);
}

function coletarItem() {
    qtdItens++;
    if (qtdItens >= 5) {
        faseAtual++;
        qtdItens = 0;
        velocidade += 1.5;
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
    
    // Reinicia o fluxo de frames
    loopJogo();
}

// Inicialização segura
loopJogo();
