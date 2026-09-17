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

// Posições iniciais horizontais fora da área do personagem
let obstaculoX = 600;
let itemX = 800; 

// Força a janela a focar no jogo assim que ele carrega para os comandos funcionarem de primeira
window.focus();

// 1. Comando por Teclado (Espaço ou Seta para Cima)
document.addEventListener('keydown', function(event) {
    if ((event.code === 'Space' || event.code === 'ArrowUp') && jogando) {
        // Evita que a barra de espaço role a página para baixo
        event.preventDefault(); 
        pular();
    }
});

// 2. Comando por Clique do Mouse ou Toque na Tela (Celular/Tablet)
document.addEventListener('click', function(event) {
    // Só pula se o jogo estiver rodando e se o usuário NÃO clicou no botão de reiniciar
    if (jogando && event.target.tagName !== 'BUTTON') {
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

    // Captura a altura do personagem em tempo real
    let personagemBottom = parseFloat(window.getComputedStyle(personagem).getPropertyValue('bottom'));
    
    // Detecção de colisão com o Obstáculo
    if (obstaculoX > 50 && obstaculoX < 90 && personagemBottom < 45) {
        gameOver();
        return; 
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
    
    // Devolve o foco para a janela ao reiniciar
    window.focus();
    loopJogo();
}

// Inicializa o jogo automaticamente
loopJogo();
