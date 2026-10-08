window.addEventListener('load', () => {
    const personagem = document.getElementById('personagem');
    const cenario = document.getElementById('cenario');
    const txtFase = document.getElementById('fase');
    const txtDistancia = document.getElementById('distancia');
    const txtMoedas = document.getElementById('moedas');
    const telaGameOver = document.getElementById('tela-gameover');
    const telaVitoria = document.getElementById('tela-vitoria');
    const btnReiniciar = document.getElementById('btn-reiniciar');
    const btnProximo = document.getElementById('btn-proximo');
    const linhaChegada = document.getElementById('linha-chegada');

    // Configurações do Motor Vector
    let jogando = false; 
    let idAnimacaoLoop = null;
    let faseAtual = 1;
    let moedasColetadas = 0;
    let progressoFase = 0;
    const tamanhoFase = 3000; 
    
    // Física do Personagem
    let yPersonagem = 0;
    let velocidadeY = 0;
    const gravidade = 1.2;
    const forcaPulo = 17;
    let estahAgachado = false;

    // Listas dinâmicas de renderização
    let listaObstaculos = [];
    let listaMoedas = [];
    let proximoSpawnObstaculo = 400;

    function obterVelocidade() {
        return 6 + (faseAtual * 1.5);
    }

    // Input do teclado
    window.addEventListener('keydown', (e) => {
        if (!jogando) return;
        
        if ((e.code === 'Space' || e.code === 'ArrowUp') && yPersonagem === 0 && !estahAgachado) {
            e.preventDefault();
            velocidadeY = forcaPulo;
            personagem.classList.add('pulo');
        }
        if (e.code === 'ArrowDown' && yPersonagem === 0) {
            e.preventDefault();
            estahAgachado = true;
            personagem.classList.add('slide');
        }
    });

    window.addEventListener('keyup', (e) => {
        if (e.code === 'ArrowDown') {
            estahAgachado = false;
            personagem.classList.remove('slide');
        }
    });

    function limparCenariodeItens() {
        document.querySelectorAll('.obstaculo-chao, .obstaculo-alto, .moeda').forEach(el => el.remove());
        listaObstaculos = [];
        listaMoedas = [];
    }

    function inicializarFase() {
        if (idAnimacaoLoop) {
            cancelAnimationFrame(idAnimacaoLoop);
        }
        
        jogando = true;
        progressoFase = 0;
        yPersonagem = 0;
        velocidadeY = 0;
        estahAgachado = false;
        proximoSpawnObstaculo = 500;
        
        personagem.className = '';
        personagem.style.bottom = '0px';
        linhaChegada.style.display = 'none';
        
        telaGameOver.style.display = 'none';
        telaVitoria.style.display = 'none';
        
        txtFase.innerText = faseAtual;
        txtMoedas.innerText = moedasColetadas;
        limparCenariodeItens();
        
        idAnimacaoLoop = requestAnimationFrame(loopJogo);
    }

    function spawnarElementos() {
        if (progressoFase > tamanhoFase - 800) return;

        if (progressoFase >= proximoSpawnObstaculo) {
            const tipoAlto = Math.random() > 0.5;
            const obs = document.createElement('div');
            
            if (tipoAlto) {
                obs.className = 'obstaculo-alto';
                obs.style.left = '850px';
                cenario.appendChild(obs);
                listaObstaculos.push({ elemento: obs, x: 800, tipo: 'alto', largura: 60, altura: 240 });
            } else {
                obs.className = 'obstaculo-chao';
                obs.style.left = '850px';
                cenario.appendChild(obs);
                listaObstaculos.push({ elemento: obs, x: 800, tipo: 'chao', largura: 30, altura: 40 });
            }

            if (Math.random() > 0.3) {
                const m = document.createElement('div');
                m.className = 'moeda';
                m.style.left = '1000px';
                m.style.bottom = tipoAlto ? '20px' : '110px';
                cenario.appendChild(m);
                listaMoedas.push({ elemento: m, x: 1000, y: tipoAlto ? 20 : 110 });
            }

            proximoSpawnObstaculo += 300 + Math.random() * 250;
        }
    }

    function loopJogo() {
        if (!jogando) return;

        const velAtual = obterVelocidade();
        progressoFase += velAtual;

        let pct = Math.floor((progressoFase / tamanhoFase) * 100);
        txtDistancia.innerText = Math.min(pct, 100);

        // Física do Pulo corrigida
        if (yPersonagem > 0 || velocidadeY !== 0) {
            velocidadeY -= gravidade;
            yPersonagem += velocidadeY;

            if (yPersonagem <= 0) {
                yPersonagem = 0;
                velocidadeY = 0;
                personagem.classList.remove('pulo');
            }
            personagem.style.bottom = yPersonagem + 'px';
        }

        // Processar Obstáculos
        for (let i = listaObstaculos.length - 1; i >= 0; i--) {
            let obs = listaObstaculos[i];
            obs.x -= velAtual;
            obs.elemento.style.left = obs.x + 'px';

            let pLargura = estahAgachado ? 50 : 30;
            let pAltura = estahAgachado ? 25 : 55;
            let pEsquerda = 80;
            let pDireita = pEsquerda + pLargura;
            let pBaixo = yPersonagem;
            let pTopo = yPersonagem + pAltura;

            let oEsquerda = obs.x;
            let oDireita = obs.x + obs.largura;
            
            if (obs.tipo === 'chao') {
                if (pDireita > oEsquerda && pEsquerda < oDireita && pBaixo < obs.altura) {
                    finalizarJogo(false);
                    return;
                }
            } else if (obs.tipo === 'alto') {
                if (pDireita > oEsquerda && pEsquerda < oDireita && pTopo > 80) {
                    finalizarJogo(false);
                    return;
                }
            }

            if (obs.x < -100) {
                obs.elemento.remove();
                listaObstaculos.splice(i, 1);
            }
        }

        // Processar Moedas
        for (let i = listaMoedas.length - 1; i >= 0; i--) {
            let moeda = listaMoedas[i];
            moeda.x -= velAtual;
            moeda.elemento.style.left = moeda.x + 'px';

            let pLargura = estahAgachado ? 50 : 30;
            let pAltura = estahAgachado ? 25 : 55;
            
            if (moeda.x > 80 && moeda.x < 80 + pLargura && 
                moeda.y > yPersonagem && moeda.y < yPersonagem + pAltura) {
                
                moedasColetadas++;
                txtMoedas.innerText = moedasColetadas;
                moeda.elemento.remove();
                listaMoedas.splice(i, 1);
            } else if (moeda.x < -50) {
                moeda.elemento.remove();
                listaMoedas.splice(i, 1);
            }
        }

        if (progressoFase >= tamanhoFase) {
            linhaChegada.style.display = 'block';
            let xChegada = 800 - (progressoFase - tamanhoFase);
            linhaChegada.style.left = xChegada + 'px';

            if (xChegada <= 80) {
                finalizarJogo(true);
                return;
            }
        } else {
            spawnarElementos();
        }

        idAnimacaoLoop = requestAnimationFrame(loopJogo);
    }

    function finalizarJogo(vitoria) {
        jogando = false;
        if (idAnimacaoLoop) cancelAnimationFrame(idAnimacaoLoop);
        
        if (vitoria) {
            telaVitoria.style.display = 'block';
        } else {
            telaGameOver.style.display = 'block';
        }
    }

    btnReiniciar.addEventListener('click', (e) => {
        e.stopPropagation();
        inicializarFase();
    });

    btnProximo.addEventListener('click', (e) => {
        e.stopPropagation();
        faseAtual++;
        inicializarFase();
    });

    inicializarFase();
});
