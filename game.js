// Aguarda o carregamento completo da janela para mapear o DOM com segurança
window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    const txtFase = document.getElementById('fase');
    const txtDistancia = document.getElementById('distancia');
    const txtMoedas = document.getElementById('moedas');
    const telaGameOver = document.getElementById('tela-gameover');
    const telaVitoria = document.getElementById('tela-vitoria');
    const btnReiniciar = document.getElementById('btn-reiniciar');
    const btnProximo = document.getElementById('btn-proximo');

    // Estados do Motor do Jogo
    let jogando = false;
    let idAnimacaoLoop = null;
    let faseAtual = 1;
    let moedasColetadas = 0;
    let progressoFase = 0;
    const tamanhoFase = 3000; 
    let velocidade = 7;

    const alturaChao = 40;
    const yChao = canvas.height - alturaChao;

    // Estrutura física do Atleta (Silhueta)
    const jogador = {
        x: 100,
        y: 0,
        largura: 30,
        alturaOriginal: 60,
        altura: 60,
        velocidadeY: 0,
        gravidade: 1.0,
        forcaPulo: -16,
        noChao: true,
        deslizando: false
    };

    let obstaculos = [];
    let moedas = [];
    let timerSpawn = 0;

    // Escuta de comandos nativa do teclado
    const teclas = {};
    window.addEventListener('keydown', (e) => {
        teclas[e.code] = true;
        if (['Space', 'ArrowUp', 'ArrowDown'].includes(e.code)) {
            e.preventDefault(); 
        }
    });
    window.addEventListener('keyup', (e) => {
        teclas[e.code] = false;
    });

    function iniciarFase() {
        if (idAnimacaoLoop) {
            cancelAnimationFrame(idAnimacaoLoop);
            idAnimacaoLoop = null;
        }

        jogando = true;
        progressoFase = 0;
        velocidade = 6 + (faseAtual * 1.2);
        timerSpawn = 0;
        
        jogador.altura = jogador.alturaOriginal;
        jogador.y = yChao - jogador.altura;
        jogador.velocidadeY = 0;
        jogador.noChao = true;
        jogador.deslizando = false;

        obstaculos = [];
        moedas = [];

        txtFase.innerText = faseAtual;
        txtMoedas.innerText = moedasColetadas;
        txtDistancia.innerText = "0";

        telaGameOver.style.display = 'none';
        telaVitoria.style.display = 'none';

        // Dispara o loop estável de atualização gráfica
        idAnimacaoLoop = requestAnimationFrame(loop);
    }

    function spawnarElementos() {
        if (progressoFase > tamanhoFase - 600) return;

        timerSpawn++;
        if (timerSpawn > (75 - faseAtual) + Math.random() * 40) {
            timerSpawn = 0;
            const tipoAlto = Math.random() > 0.5;

            if (tipoAlto) {
                obstaculos.push({
                    x: canvas.width,
                    y: 0,
                    largura: 50,
                    altura: yChao - 55,
                    tipo: 'alto',
                    ativo: true
                });
                moedas.push({
                    x: canvas.width + 15,
                    y: yChao - 20,
                    raio: 8,
                    ativo: true
                });
            } else {
                obstaculos.push({
                    x: canvas.width,
                    y: yChao - 40,
                    largura: 30,
                    altura: 40,
                    tipo: 'chao',
                    ativo: true
                });
                moedas.push({
                    x: canvas.width + 6,
                    y: yChao - 110,
                    raio: 8,
                    ativo: true
                });
            }
        }
    }

    function atualizar() {
        if (!jogando) return;

        progressoFase += velocidade;
        let pct = Math.floor((progressoFase / tamanhoFase) * 100);
        txtDistancia.innerText = Math.min(pct, 100);

        // Ações de Pulo
        if ((teclas['Space'] || teclas['ArrowUp']) && jogador.noChao && !jogador.deslizando) {
            jogador.velocidadeY = jogador.forcaPulo;
            jogador.noChao = false;
        }

        // Ações de Deslizar
        if (teclas['ArrowDown'] && jogador.noChao) {
            jogador.deslizando = true;
            jogador.altura = 25;
            jogador.y = yChao - jogador.altura;
        } else {
            if (jogador.deslizando) {
                jogador.deslizando = false;
                jogador.altura = jogador.alturaOriginal;
                jogador.y = yChao - jogador.altura;
            }
        }

        // Simulação da gravidade
        if (!jogador.noChao) {
            jogador.velocidadeY += jogador.gravidade;
            jogador.y += jogador.velocidadeY;

            if (jogador.y >= yChao - jogador.altura) {
                jogador.y = yChao - jogador.altura;
                jogador.velocidadeY = 0;
                jogador.noChao = true;
            }
        }

        spawnarElementos();

        // Movimentação e colisão de obstáculos
        for (let i = 0; i < obstaculos.length; i++) {
            let obs = obstaculos[i];
            obs.x -= velocidade;

            if (jogador.x < obs.x + obs.largura &&
                jogador.x + jogador.largura > obs.x &&
                jogador.y < obs.y + obs.altura &&
                jogador.y + jogador.altura > obs.y) {
                
                finalizarJogo(false);
                return;
            }

            if (obs.x + obs.largura < 0) {
                obs.ativo = false;
            }
        }
        obstaculos = obstaculos.filter(obs => obs.ativo);

        // Movimentação e colisão de moedas
        for (let i = 0; i < moedas.length; i++) {
            let m = moedas[i];
            m.x -= velocidade;

            if (jogador.x < m.x + m.raio &&
                jogador.x + jogador.largura > m.x - m.raio &&
                jogador.y < m.y + m.raio &&
                jogador.y + jogador.altura > m.y - m.raio) {
                
                m.ativo = false;
                moedasColetadas++;
                txtMoedas.innerText = moedasColetadas;
            }

            if (m.x + m.raio < 0) {
                m.ativo = false;
            }
        }
        moedas = moedas.filter(m => m.ativo);

        if (progressoFase >= tamanhoFase) {
            finalizarJogo(true);
        }
    }

    function desenhar() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Cidade ao fundo (Parallax)
        ctx.fillStyle = "rgba(25, 30, 41, 0.4)";
        for (let i = 0; i < canvas.width + 80; i += 80) {
            let desc = (i % 3 === 0) ? 120 : 160;
            ctx.fillRect(i - (progressoFase * 0.2 % 80), canvas.height - desc, 60, desc);
        }

        // Linha do chão Neon
        ctx.fillStyle = "#161920";
        ctx.fillRect(0, yChao, canvas.width, alturaChao);
        ctx.fillStyle = "#00d2ff";
        ctx.fillRect(0, yChao, canvas.width, 3);

        // Desenho dos obstáculos
        obstaculos.forEach(obs => {
            ctx.fillStyle = "#000000";
            ctx.strokeStyle = obs.tipo === 'chao' ? "#ff0055" : "#ffcc00";
            ctx.lineWidth = 2;
            ctx.fillRect(obs.x, obs.y, obs.largura, obs.altura);
            ctx.strokeRect(obs.x, obs.y, obs.largura, obs.altura);
        });

        // Desenho das moedas
        moedas.forEach(m => {
            ctx.beginPath();
            ctx.arc(m.x, m.y, m.raio, 0, Math.PI * 2);
            ctx.fillStyle = "#ffe600";
            ctx.fill();
        });

        // Faixa de chegada
        if (progressoFase > tamanhoFase - 500) {
            let xChegada = canvas.width - (progressoFase - (tamanhoFase - 500));
            ctx.fillStyle = "#00ff88";
            ctx.fillRect(xChegada, 0, 15, yChao);
        }

        // Desenho do Jogador (Silhueta Vector)
        ctx.fillStyle = "#000000";
        ctx.fillRect(jogador.x, jogador.y, jogador.largura, jogador.altura);

        // Detalhe Neon Azul no personagem
        ctx.fillStyle = "#00d2ff";
        let offsetOlhoY = jogador.deslizando ? 8 : 12;
        ctx.fillRect(jogador.x + 20, jogador.y + offsetOlhoY, 4, 4);
    }

    function loop() {
        if (!jogando) return;
        atualizar();
        desenhar();
        idAnimacaoLoop = requestAnimationFrame(loop);
    }

    function finalizarJogo(vitoria) {
        jogando = false;
        if (idAnimacaoLoop) {
            cancelAnimationFrame(idAnimacaoLoop);
            idAnimacaoLoop = null;
        }
        
        if (vitoria) {
            telaVitoria.style.display = 'block';
        } else {
            telaGameOver.style.display = 'block';
        }
    }

    btnReiniciar.addEventListener('click', (e) => {
        e.stopPropagation();
        iniciarFase();
    });

    btnProximo.addEventListener('click', (e) => {
        e.stopPropagation();
        faseAtual++;
        iniciarFase();
    });

    // Inicializa o motor de forma limpa
    iniciarFase();
});
