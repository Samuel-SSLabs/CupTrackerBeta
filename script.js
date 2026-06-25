const URL_PROXY = 'https://cuptracker.sstudioslabs.workers.dev/v4/matches';

const STATUS_LIVE = ['1H', '2H', 'ET', 'P'];
const STATUS_LIVE_COM_HT = ['1H', '2H', 'ET', 'P', 'HT'];
const STATUS_FIM = ['FT', 'AET', 'PEN'];
const STATUS_COM_DETALHES = [...STATUS_LIVE_COM_HT, ...STATUS_FIM];

let placaresAnteriores = {};
let historicoGols = {};
const TEMPO_DESTAQUE_MS = 180000;
let cachePartidas = {};
let atualizacaoDetalhesIntervalo = null;
let fixtureAtualNoModal = null;
let primeiraCargaMain = true;
let cacheDetalhesMemoria = {};

const somGol = new Audio('assets/audio.mp3');

const SIGLAS_FIFA = {
    "Canada": "CAN", "United States": "USA", "Mexico": "MEX",
    "Curacao": "CUW", "Haiti": "HAI", "Panama": "PAN",
    "Argentina": "ARG", "Brazil": "BRA", "Colombia": "COL",
    "Ecuador": "ECU", "Paraguay": "PAR", "Uruguay": "URU",
    "Germany": "GER", "Austria": "AUT", "Belgium": "BEL",
    "Bosnia and Herzegovina": "BIH", "Croatia": "CRO", "Scotland": "SCO",
    "Spain": "ESP", "France": "FRA", "Netherlands": "NED",
    "England": "ENG", "Norway": "NOR", "Portugal": "POR",
    "Czech Republic": "CZE", "Sweden": "SWE", "Switzerland": "SUI",
    "Turkey": "TUR", "Saudi Arabia": "KSA", "Australia": "AUS",
    "Qatar": "QAT", "South Korea": "KOR", "Iran": "IRN",
    "Iraq": "IRQ", "Japan": "JPN", "Jordan": "JOR",
    "Uzbekistan": "UZB", "South Africa": "RSA", "Algeria": "ALG",
    "Cape Verde": "CPV", "Ivory Coast": "CIV", "Egypt": "EGY",
    "Ghana": "GHA", "Morocco": "MAR", "DR Congo": "COD",
    "Senegal": "SEN", "Tunisia": "TUN", "New Zealand": "NZL"
};


// Cores tema oficiais por seleção (primary kit / associação nacional)
const CORES_SELECOES = {
    6:    '#FFD700', // Brasil — amarelo
    26:   '#75AADB', // Argentina — azul celeste
    9:    '#C60B1E', // Espanha — vermelho
    2:    '#003189', // França — azul marinho
    25:   '#000000', // Alemanha — preto
    27:   '#C8102E', // Portugal — vermelho
    10:   '#003090', // Inglaterra — azul
    15:   '#FF0000', // Suíça — vermelho
    1118: '#FF6900', // Holanda — laranja
    12:   '#BC002D', // Japão — vermelho
    8:    '#FCD116', // Colômbia — amarelo
    16:   '#006847', // México — verde
    2384: '#002868', // EUA — azul
    31:   '#C1272D', // Marrocos — vermelho
    1090: '#003087', // Noruega — azul
    5529: '#FF0000', // Canadá — vermelho
    5:    '#006AA7', // Suécia — azul
    3:    '#FF0000', // Croácia — vermelho xadrez
    7:    '#5EB6E4', // Uruguai — azul celeste
    17:   '#C60C30', // Coreia do Sul — vermelho
    22:   '#239F40', // Irã — verde
    32:   '#C8102E', // Egito — vermelho
    1531: '#007A4D', // África do Sul — verde
    20:   '#FFD700', // Austrália — amarelo/dourado
    1108: '#003F87', // Escócia — azul
    1:    '#000000', // Bélgica — preto
    1532: '#006233', // Argélia — verde
    1113: '#002395', // Bósnia — azul
    2380: '#D52B1E', // Paraguai — vermelho
    1533: '#003893', // Cabo Verde — azul
    1504: '#FCD116', // Gana — amarelo
    775:  '#C8102E', // Áustria — vermelho
    1508: '#007FFF', // Congo DR — azul
    2382: '#FFD100', // Equador — amarelo
    5530: '#003087', // Curaçao — azul
    28:   '#C8102E', // Tunísia — vermelho
    1569: '#8D1B3D', // Qatar — vinho
    770:  '#D7141A', // Tchéquia — vermelho
    1548: '#007A3D', // Jordânia — verde
    1567: '#007A3D', // Iraque — verde
    1568: '#1EB53A', // Uzbequistão — verde
    4673: '#00247D', // Nova Zelândia — azul
    2386: '#00209F', // Haiti — azul
    11:   '#005F9E', // Panamá — azul
    777:  '#C8102E', // Turquia — vermelho
    23:   '#006C35', // Arábia Saudita — verde
    13:   '#00853F', // Senegal — verde
    1501: '#F77F00', // Costa do Marfim — laranja
};

// Cores alternativas (segundo uniforme / away kit)
const CORES_ALT = {
    6:    '#003087', // Brasil — azul
    26:   '#FFFFFF', // Argentina — branco
    9:    '#003087', // Espanha — azul
    2:    '#FFFFFF', // França — branco
    25:   '#FFFFFF', // Alemanha — branco
    27:   '#006600', // Portugal — verde
    10:   '#FFFFFF', // Inglaterra — branco
    15:   '#003087', // Suíça — azul
    1118: '#003087', // Holanda — azul
    12:   '#003087', // Japão — azul
    8:    '#003087', // Colômbia — azul
    16:   '#C8102E', // México — vermelho
    2384: '#C8102E', // EUA — vermelho
    31:   '#006233', // Marrocos — verde
    1090: '#C8102E', // Noruega — vermelho
    5529: '#000000', // Canadá — preto
    5:    '#FFD700', // Suécia — amarelo
    3:    '#003087', // Croácia — azul
    7:    '#000000', // Uruguai — preto
    17:   '#003087', // Coreia do Sul — azul
    22:   '#FFFFFF', // Irã — branco
    32:   '#000000', // Egito — preto
    1531: '#FFD700', // África do Sul — amarelo
    20:   '#003087', // Austrália — azul
    1108: '#C8102E', // Escócia — vermelho
    1:    '#C8102E', // Bélgica — vermelho
    1532: '#C8102E', // Argélia — vermelho
    1113: '#FFD700', // Bósnia — amarelo
    2380: '#003087', // Paraguai — azul
    1533: '#C8102E', // Cabo Verde — vermelho
    1504: '#C60B1E', // Gana — vermelho
    775:  '#FFFFFF', // Áustria — branco
    1508: '#FFD100', // Congo DR — amarelo
    2382: '#003087', // Equador — azul
};

function corSelecao(homeId, awayId) {
    const corH = CORES_SELECOES[homeId] || 'var(--green-1)';
    if (awayId === undefined) return corH; // chamada simples
    const corA = CORES_SELECOES[awayId] || 'var(--amber)';

    // Detectar conflito: mesma cor ou cores muito parecidas
    const conflito = corH.toLowerCase() === corA.toLowerCase();
    const corHFinal = corH;
    const corAFinal = conflito
        ? (CORES_ALT[awayId] || 'var(--amber)')
        : corA;
    return { home: corHFinal, away: corAFinal };
}

document.getElementById('btn-teste-audio').addEventListener('click', () => {
    somGol.currentTime = 0;
    somGol.play().catch(() => {});
});

function sigla(nome) {
    return SIGLAS_FIFA[nome] || nome.substring(0, 3).toUpperCase();
}

function temDetalhes(statusShort) {
    return STATUS_COM_DETALHES.includes(statusShort);
}

async function abrirMenuDetalhes(fixtureId) {
    const match = cachePartidas[fixtureId];
    if (!match || !temDetalhes(match.fixture.status.short)) return;

    const modal = document.getElementById('modal-detalhes');
    const conteudo = document.getElementById('conteudo-estatisticas');
    fixtureAtualNoModal = fixtureId;
    modal.classList.add('visivel');

    if (!cacheDetalhesMemoria[fixtureId]) {
        conteudo.innerHTML = '<div class="modal-loading"><div class="spinner"></div><span>Carregando...</span></div>';
    } else {
        renderizarDetalhes(fixtureId, cacheDetalhesMemoria[fixtureId]);
    }

    await carregarDetalhes(fixtureId);

    if (fixtureAtualNoModal !== fixtureId) return;

    const s = cachePartidas[fixtureId]?.fixture?.status?.short ?? '';
    if (STATUS_LIVE_COM_HT.includes(s)) {
        clearInterval(atualizacaoDetalhesIntervalo);
        atualizacaoDetalhesIntervalo = setInterval(() => {
            if (fixtureAtualNoModal === fixtureId) carregarDetalhes(fixtureId);
        }, 15000);
    }
}

async function carregarDetalhes(fixtureId) {
    const conteudo = document.getElementById('conteudo-estatisticas');
    try {
        const res = await fetch(`${URL_PROXY}?action=detalhes&fixtureId=${fixtureId}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const dados = await res.json();
        if (dados.erro) throw new Error(dados.erro);

        cacheDetalhesMemoria[fixtureId] = dados;
        if (fixtureAtualNoModal === fixtureId) renderizarDetalhes(fixtureId, dados);

    } catch (e) {
        if (fixtureAtualNoModal !== fixtureId) return;
        if (!cacheDetalhesMemoria[fixtureId]) {
            conteudo.innerHTML = '<div class="modal-erro">Não foi possível carregar os detalhes.</div>';
        }
    }
}

function renderizarDetalhes(fixtureId, dados) {
    const conteudo = document.getElementById('conteudo-estatisticas');
    const match = cachePartidas[fixtureId];
    let htmlPlacar = '';

    if (match) {
        const nomeA = match.teams.home.name;
        const nomeB = match.teams.away.name;
        const siglaA = sigla(nomeA);
        const siglaB = sigla(nomeB);
        const logoA = match.teams.home.logo;
        const logoB = match.teams.away.logo;
        const golA = match.goals.home !== null ? match.goals.home : '-';
        const golB = match.goals.away !== null ? match.goals.away : '-';
        const statusShort = match.fixture.status.short;
        const isLive = STATUS_LIVE.includes(statusShort);
        const elapsed = match.fixture.status.elapsed;
        // Cores tema para as barras de estatística
        const cores = corSelecao(match.teams.home.id, match.teams.away.id);
        const corHome = cores.home;
        const corAway = cores.away;
        // Injetar CSS vars dinamicamente para as barras
        document.getElementById('conteudo-estatisticas').style.setProperty('--bar-home', corHome);
        document.getElementById('conteudo-estatisticas').style.setProperty('--bar-away', corAway);

        let statusTexto = '';
        let dotHtml = '';
        if (isLive) {
            dotHtml = '<span class="live-dot"></span>';
            const extra = match.fixture.status.extra;
            statusTexto = elapsed ? (extra ? `${elapsed}+${extra}' — Ao Vivo` : `${elapsed}' — Ao Vivo`) : 'Ao Vivo';
        } else if (statusShort === 'HT') {
            statusTexto = 'Intervalo';
        } else if (STATUS_FIM.includes(statusShort)) {
            statusTexto = 'Encerrado';
        }

        htmlPlacar = `
            <div class="modal-placar ${isLive ? 'live' : ''}">
                <div class="modal-team-side">
                    <img src="${logoA}" class="modal-team-logo" alt="${siglaA}">
                    <span class="modal-tla">${siglaA}</span>
                </div>
                <div class="modal-center">
                    <span class="modal-score">${golA} x ${golB}</span>
                    <span class="modal-status">${dotHtml}${statusTexto}</span>
                </div>
                <div class="modal-team-side">
                    <img src="${logoB}" class="modal-team-logo" alt="${siglaB}">
                    <span class="modal-tla">${siglaB}</span>
                </div>
            </div>`;
    }

    let htmlStats = '';
    const stats = dados.statistics;
    if (Array.isArray(stats) && stats.length === 2) {
        const statsHome = {};
        const statsAway = {};
        (stats[0]?.statistics ?? []).forEach(s => { statsHome[s.type] = s.value; });
        (stats[1]?.statistics ?? []).forEach(s => { statsAway[s.type] = s.value; });

        const listaStats = [
            { chave: 'Ball Possession', label: 'Posse de Bola' },
            { chave: 'Shots on Goal', label: 'Chutes no Gol' },
            { chave: 'Total Shots', label: 'Total de Chutes' },
            { chave: 'Corner Kicks', label: 'Escanteios' },
            { chave: 'Fouls', label: 'Faltas' },
            { chave: 'Yellow Cards', label: 'Cartões Amarelos' },
            { chave: 'Red Cards', label: 'Cartões Vermelhos' },
        ];

        const rowsHtml = listaStats.map(item => {
            const rawH = statsHome[item.chave];
            const rawA = statsAway[item.chave];
            if (rawH === null && rawA === null) return '';
            if (rawH === undefined && rawA === undefined) return '';

            let vH = rawH ?? 0;
            let vA = rawA ?? 0;
            if (typeof vH === 'string' && vH.includes('%')) vH = parseInt(vH);
            if (typeof vA === 'string' && vA.includes('%')) vA = parseInt(vA);
            vH = Number(vH) || 0;
            vA = Number(vA) || 0;

            const total = vH + vA || 1;
            const pctH = Math.round((vH / total) * 100);
            const pctA = 100 - pctH;
            const exibeH = rawH !== null && rawH !== undefined ? rawH : '—';
            const exibeA = rawA !== null && rawA !== undefined ? rawA : '—';

            return `
                <div class="stat-row">
                    <span class="stat-val">${exibeH}</span>
                    <div class="stat-col-center">
                        <span class="stat-nome">${item.label}</span>
                        <div class="stat-barra-container">
                            <div class="stat-barra-home" style="width:${pctH}%"></div>
                            <div class="stat-barra-away" style="width:${pctA}%"></div>
                        </div>
                    </div>
                    <span class="stat-val right">${exibeA}</span>
                </div>`;
        }).filter(Boolean).join('');

        if (rowsHtml) {
            htmlStats = `<div class="secao-titulo">Estatísticas</div>${rowsHtml}`;
        }
    }

    let htmlEventos = '';
    const eventos = dados.events;
    if (Array.isArray(eventos) && eventos.length > 0) {
        const relevantes = eventos.filter(e => ['Goal', 'Card'].includes(e.type));
        if (relevantes.length > 0) {
            const idHome = match?.teams?.home?.id;
            const siglaHome = match ? sigla(match.teams.home.name) : '???';
            const siglaAway = match ? sigla(match.teams.away.name) : '???';

            const itens = relevantes.map(e => {
                const minuto = e.time?.elapsed != null ? `${e.time.elapsed}'` : '—';
                const isHome = e.team?.id === idHome;
                let icone = '⚽';
                let detalhe = '';

                if (e.type === 'Goal') {
                    if (e.detail === 'Own Goal') detalhe = '(contra)';
                    else if (e.detail === 'Penalty') detalhe = '(pen.)';
                } else if (e.type === 'Card') {
                    if (e.detail === 'Yellow Card') icone = '🟨';
                    else if (e.detail === 'Red Card') icone = '🟥';
                    else if (e.detail === 'Yellow Red Card') icone = '🟧';
                }

                const desc = e.player?.name || '—';

                // Minuto sempre à esquerda.
                // Casa  → [min'] | [icone] nome  | (vazio)
                // Fora  → [min'] | (vazio)        | nome [icone]
                const conteudoHome = isHome
                    ? `<span class="evento-icone">${icone}</span><span class="evento-nome">${desc}${detalhe ? ` <span class="evento-detalhe">${detalhe}</span>` : ''}</span>`
                    : '';
                const conteudoAway = !isHome
                    ? `<span class="evento-nome">${desc}${detalhe ? ` <span class="evento-detalhe">${detalhe}</span>` : ''}</span><span class="evento-icone">${icone}</span>`
                    : '';

                return `
                    <div class="evento-item">
                        <div class="evento-col home">${conteudoHome}</div>
                        <span class="evento-minuto">${minuto}</span>
                        <div class="evento-col away">${conteudoAway}</div>
                    </div>`;
            }).join('');

            const cabecalho = `
                <div class="secao-titulo eventos-header">
                    <span class="eventos-header-time">${siglaHome}</span>
                    <span>Gols &amp; Cartões</span>
                    <span class="eventos-header-time">${siglaAway}</span>
                </div>`;
            htmlEventos = cabecalho + itens;
        }
    }

    if (!htmlStats && !htmlEventos) {
        htmlEventos = '<div class="modal-erro" style="padding-top:20px;">Sem dados disponíveis para esta partida.</div>';
    }

    conteudo.innerHTML = htmlPlacar + htmlStats + htmlEventos;
}

function fecharModal() {
    document.getElementById('modal-detalhes').classList.remove('visivel');
    clearInterval(atualizacaoDetalhesIntervalo);
    atualizacaoDetalhesIntervalo = null;
    fixtureAtualNoModal = null;
}

function criarBlocoPartida(match, isLive, quemMarcou) {
    isLive = isLive || false;
    quemMarcou = quemMarcou || null;

    const nomeA = match.teams.home.name;
    const nomeB = match.teams.away.name;
    const siglaA = sigla(nomeA);
    const siglaB = sigla(nomeB);
    const logoA = match.teams.home.logo;
    const logoB = match.teams.away.logo;
    const golA = match.goals.home !== null ? match.goals.home : '-';
    const golB = match.goals.away !== null ? match.goals.away : '-';
    const corGolA = quemMarcou === 'home' ? '#00FF00' : '#FFF';
    const corGolB = quemMarcou === 'away' ? '#00FF00' : '#FFF';

    const dataJogo = new Date(match.fixture.date);
    const dia = String(dataJogo.getDate()).padStart(2, '0');
    const mes = String(dataJogo.getMonth() + 1).padStart(2, '0');
    const horaMinuto = dataJogo.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const statusShort = match.fixture.status.short;
    const isLiveStatus = STATUS_LIVE.includes(statusShort);
    const isPaused = statusShort === 'HT';
    const isFinished = STATUS_FIM.includes(statusShort);
    const podeClicar = temDetalhes(statusShort);

    let infoCentral = '';
    let infoMinuto = '';
    if (isLiveStatus) {
        const elapsed = match.fixture.status.elapsed;
        const extra = match.fixture.status.extra;
        infoMinuto = elapsed ? (extra ? `${elapsed}+${extra}'` : `${elapsed}'`) : '';
        infoCentral = '<span class="live-dot"></span> Ao Vivo';
    } else if (isPaused) {
        infoMinuto = 'HT';
        infoCentral = 'Intervalo';
    } else if (isFinished) {
        infoCentral = `${dia}/${mes} - Fim`;
    } else {
        infoCentral = `${dia}/${mes} ${horaMinuto}`;
    }

    const onclickAttr = podeClicar ? `onclick="abrirMenuDetalhes(${match.fixture.id})"` : '';
    const classesExtra = [
        isLive ? 'live' : '',
        quemMarcou ? 'gol-ativo' : '',
        podeClicar ? 'clicavel' : ''
    ].filter(Boolean).join(' ');

    return `
        <div class="match-block ${classesExtra}" ${onclickAttr}>
            <div class="team-side">
                <img src="${logoA}" class="team-logo" alt="${siglaA}">
                <span class="tla">${siglaA}</span>
            </div>
            <div class="center-info">
                <span class="match-minute">${infoMinuto}</span>
                <div class="score-row">
                    <span class="score-num ${quemMarcou === 'home' ? 'gol-marcado' : ''}" style="color:${corGolA};">${golA}</span>
                    <span class="score-sep">x</span>
                    <span class="score-num ${quemMarcou === 'away' ? 'gol-marcado' : ''}" style="color:${corGolB};">${golB}</span>
                </div>
                <span class="status-time">${infoCentral}</span>
            </div>
            <div class="team-side right">
                <span class="tla">${siglaB}</span>
                <img src="${logoB}" class="team-logo" alt="${siglaB}">
            </div>
        </div>`;
}

async function atualizarPainel() {
    const debugLog = document.getElementById('debug-log');
    const mainQueue = document.getElementById('main-queue');
    const historyContent = document.getElementById('history-content');

    const fmtData = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    const hoje = new Date();
    const dataInicio = new Date(hoje);
    dataInicio.setDate(hoje.getDate() - 1);
    const dataFim = new Date(hoje);
    dataFim.setDate(hoje.getDate() + 3);

    const urlFinal = `${URL_PROXY}?dateFrom=${fmtData(dataInicio)}&dateTo=${fmtData(dataFim)}`;

    try {
        const response = await fetch(urlFinal);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();
        if (data.erro) throw new Error(data.erro);
        if (!data.response || !Array.isArray(data.response)) throw new Error('Formato inesperado');

        debugLog.innerText = 'Online';

        const aoVivo = [], proximos = [], encerrados = [];

        data.response.forEach(m => {
            cachePartidas[m.fixture.id] = m;
            const s = m.fixture.status.short;
            const isLiveStatus = STATUS_LIVE_COM_HT.includes(s);
            const isFinished = STATUS_FIM.includes(s);

            if (isLiveStatus) {
                aoVivo.push(m);
                const golsCasa = m.goals.home ?? 0;
                const golsFora = m.goals.away ?? 0;

                if (placaresAnteriores[m.fixture.id]) {
                    const prev = placaresAnteriores[m.fixture.id];
                    if (golsCasa > prev.home) {
                        historicoGols[m.fixture.id] = { time: 'home', timestamp: hoje.getTime() };
                        somGol.play().catch(() => {});
                    } else if (golsFora > prev.away) {
                        historicoGols[m.fixture.id] = { time: 'away', timestamp: hoje.getTime() };
                        somGol.play().catch(() => {});
                    }
                }
                placaresAnteriores[m.fixture.id] = { home: golsCasa, away: golsFora };
            } else if (isFinished) {
                encerrados.push(m);
            } else {
                proximos.push(m);
            }
        });

        proximos.sort((a, b) => new Date(a.fixture.date) - new Date(b.fixture.date));
        encerrados.sort((a, b) => new Date(b.fixture.date) - new Date(a.fixture.date));

        const fila = [...aoVivo, ...proximos.slice(0, 5)];

        if (fila.length === 0) {
            mainQueue.innerHTML = '<div class="sem-jogos">Nenhum jogo<br>nos próximos dias.</div>';
        } else {
            mainQueue.innerHTML = fila.map(m => {
                const destaqueAtivo = (historicoGols[m.fixture.id] && hoje.getTime() - historicoGols[m.fixture.id].timestamp < TEMPO_DESTAQUE_MS)
                    ? historicoGols[m.fixture.id].time : null;
                return criarBlocoPartida(m, STATUS_LIVE.includes(m.fixture.status.short), destaqueAtivo);
            }).join('');
        }

        // Em modo torneio mostra os 3 últimos, caso contrário só 1
        const modoTorneio = document.getElementById('app-layout').classList.contains('modo-torneio');
        const qtdEncerrados = modoTorneio ? 3 : 1;
        const tituloHistory = document.getElementById('history-title-label');
        if (tituloHistory) tituloHistory.innerText = modoTorneio ? 'Últimos Resultados' : 'Último Resultado';

        historyContent.innerHTML = encerrados.length > 0
            ? encerrados.slice(0, qtdEncerrados).map(m => criarBlocoPartida(m)).join('')
            : '<div style="color:var(--text-muted);text-align:center;font-size:12px;">Sem resultados</div>';

        primeiraCargaMain = false;

        const temJogoAoVivo = aoVivo.length > 0;
        const tempoProximaBusca = temJogoAoVivo ? 15000 : 60000;
        
        if (window.timerAtualizacao) clearTimeout(window.timerAtualizacao);
        window.timerAtualizacao = setTimeout(atualizarPainel, tempoProximaBusca);

    } catch (e) {
        debugLog.innerText = 'Instabilidade na rede';
        
        if (primeiraCargaMain) {
            mainQueue.innerHTML = '<div class="sem-jogos">Falha ao carregar.<br>Tentando novamente...</div>';
        }
        
        if (window.timerAtualizacao) clearTimeout(window.timerAtualizacao);
        window.timerAtualizacao = setTimeout(atualizarPainel, 15000);
    }
}

atualizarPainel();

/* =============================================
   PAINEL DE TORNEIO
   ============================================= */
let torneioCarregado = false;

document.getElementById('btn-toggle-torneio').addEventListener('click', async function () {
    const layout = document.getElementById('app-layout');
    const ativo = layout.classList.toggle('modo-torneio');
    document.body.classList.toggle('modo-torneio-ativo', ativo);
    this.innerHTML = ativo
        ? '←'
        : '<img src="assets/trophy-icon.png" alt="Torneio" class="btn-icon-img">';
    this.style.color = ativo ? '#fff' : '';

    if (!ativo) {
        // Volta history para 1 partida ao fechar
        const tituloLabel = document.getElementById('history-title-label');
        if (tituloLabel) tituloLabel.innerText = 'Último Resultado';
        const historyContent = document.getElementById('history-content');
        const encerrados = Object.values(cachePartidas)
            .filter(m => STATUS_FIM.includes(m.fixture.status.short))
            .sort((a, b) => new Date(b.fixture.date) - new Date(a.fixture.date));
        if (historyContent && encerrados.length > 0) {
            historyContent.innerHTML = criarBlocoPartida(encerrados[0]);
        }
        return;
    }

    if (ativo) {
        renderizarRecentesTorneio();

        if (torneioCarregado) {
            renderizarBracket(null); // atualiza com cache de partidas existente
        }

        if (!torneioCarregado) {
            document.getElementById('grupos-rodape').innerHTML =
                '<span style="color:var(--text-muted);font-size:11px;padding:10px;display:block;text-align:center;">Carregando grupos...</span>';
            await buscarEConstruirTorneio();
        }
    }
});

async function buscarEConstruirTorneio() {
    try {
        const res = await fetch(`${URL_PROXY}?action=standings`);
        if (!res.ok) throw new Error('Erro na rede');
        const data = await res.json();
        if (!data.response || data.response.length === 0) throw new Error('Sem dados');

        const todasEntradas = data.response[0].league.standings;

        // "Group Stage" = tabela de 3ºs já ordenada pela FIFA (rank 1-8 avançam)
        const tabelaTerceiros = todasEntradas.find(g => g[0]?.group === 'Group Stage') ?? [];
        const top8TerceiroIds = new Set(
            tabelaTerceiros.filter(t => t.rank <= 8).map(t => t.team.id)
        );

        renderizarGrupos(todasEntradas, top8TerceiroIds);
        renderizarBracket(todasEntradas);
        torneioCarregado = true;
    } catch (e) {
        console.error('Falha ao carregar torneio:', e);
        document.getElementById('grupos-rodape').innerHTML =
            '<span style="color:var(--amber);font-size:11px;padding:10px;display:block;text-align:center;">Falha ao carregar. Tente novamente.</span>';
        torneioCarregado = false;
    }
}

function renderizarRecentesTorneio() {
    // Atualiza o history-content do painel principal para mostrar 3 partidas
    const historyContent = document.getElementById('history-content');
    const tituloLabel = document.getElementById('history-title-label');
    if (tituloLabel) tituloLabel.innerText = 'Últimos Resultados';

    const encerrados = Object.values(cachePartidas)
        .filter(m => STATUS_FIM.includes(m.fixture.status.short))
        .sort((a, b) => new Date(b.fixture.date) - new Date(a.fixture.date))
        .slice(0, 3);

    if (historyContent) {
        historyContent.innerHTML = encerrados.length > 0
            ? encerrados.map(m => criarBlocoPartida(m, false, null)).join('')
            : '<div style="color:var(--text-muted);font-size:11px;text-align:center;padding:6px 0;">Sem resultados recentes</div>';
    }
}

function renderizarBracket(standingsData) {
    // ── helpers ──────────────────────────────────────────────────────────────
    const slotReal = (m) => {
        const d = new Date(m.fixture.date);
        const dia = String(d.getDate()).padStart(2,'0');
        const mes = String(d.getMonth()+1).padStart(2,'0');
        const hora = d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
        const golH = m.goals.home, golA = m.goals.away;
        const temGol = golH !== null && golA !== null;
        const wH = m.teams.home.winner === true;
        const wA = m.teams.away.winner === true;
        return `<div class="match-slot">
            <div class="slot-team-row${wH ? ' slot-winner' : ''}">
                <img src="${m.teams.home.logo}" class="slot-logo">
                <span class="slot-sig">${sigla(m.teams.home.name)}</span>
                ${temGol ? `<span class="slot-score${wH ? ' slot-score-win' : ''}">${golH}</span>` : ''}
            </div>
            <div class="slot-team-row${wA ? ' slot-winner' : ''}">
                <img src="${m.teams.away.logo}" class="slot-logo">
                <span class="slot-sig">${sigla(m.teams.away.name)}</span>
                ${temGol ? `<span class="slot-score${wA ? ' slot-score-win' : ''}">${golA}</span>` : ''}
            </div>
            <span class="slot-data">${dia}/${mes} ${hora}</span>
        </div>`;
    };

    const slotClassificados = (tA, tB) => {
        const rowA = tA
            ? `<img src="${tA.team.logo}" class="slot-logo"><span class="slot-sig">${sigla(tA.team.name)}</span>`
            : `<span class="slot-sig tbd">TBD</span>`;
        const rowB = tB
            ? `<img src="${tB.team.logo}" class="slot-logo"><span class="slot-sig">${sigla(tB.team.name)}</span>`
            : `<span class="slot-sig tbd">TBD</span>`;
        return `<div class="match-slot">
            <div class="slot-team-row">${rowA}</div>
            <div class="slot-team-row">${rowB}</div>
            <span class="slot-data">A definir</span>
        </div>`;
    };

    const slotTbd = () => `<div class="match-slot slot-tbd">
        <div class="slot-team-row"><span class="slot-sig tbd">TBD</span></div>
        <div class="slot-team-row"><span class="slot-sig tbd">TBD</span></div>
        <span class="slot-data">—</span>
    </div>`;

    const coluna = (slots) => {
        const qtd = slots.length;
        return `<div class="bracket-col" data-slots="${qtd}">${slots.join('')}</div>`;
    };

    // ── 1. Partidas eliminatórias reais por fase ──────────────────────────────
    const todasElim = Object.values(cachePartidas)
        .filter(m => !((m.league?.round ?? '').toLowerCase().includes('group')))
        .sort((a, b) => new Date(a.fixture.date) - new Date(b.fixture.date));

    // Classificar por fase com base no round
    const porFase = { r32: [], r16: [], qf: [], sf: [], final: [], third: [] };
    todasElim.forEach(m => {
        const r = (m.league?.round ?? '').toLowerCase();
        if (r.includes('32') || r.includes('round of 32') || r.includes('16 avos')) porFase.r32.push(m);
        else if (r.includes('16') || r.includes('round of 16') || r.includes('oitavas')) porFase.r16.push(m);
        else if (r.includes('quarter') || r.includes('quartas')) porFase.qf.push(m);
        else if (r.includes('semi') || r.includes('semis')) porFase.sf.push(m);
        else if (r.includes('3rd') || r.includes('terceiro') || r.includes('third')) porFase.third.push(m);
        else if (r.includes('final')) porFase.final.push(m);
    });

    // ── 2. Times classificados (para r32 quando não há partidas reais) ────────
    const classificadosPorGrupo = {};
    if (standingsData) {
        standingsData
            .filter(g => /^Group [A-L]$/i.test(g[0]?.group ?? ''))
            .forEach(g => {
                const letra = g[0].group.replace('Group ', '');
                classificadosPorGrupo[letra] = g.filter(t => t.description === 'Round of 32').slice(0, 2);
            });
    }

    // Monta lista de 32 classificados: pares por grupo A…L + 8 terceiros
    // Cada par [1ºX, 2ºX] vira um slot; os 8 terceiros são colocados em slots opostos
    // seguindo a ordem da tabela Group Stage da API
    const grupoOrdem = ['A','B','C','D','E','F','G','H','I','J','K','L'];
    // 24 classificados diretos (2 por grupo) em pares
    const paresDiretos = grupoOrdem.map(l => {
        const g = classificadosPorGrupo[l] || [];
        return [g[0] || null, g[1] || null];
    }); // 12 pares

    // 8 terceiros classificados
    let terceiros = [];
    if (standingsData) {
        const gs = standingsData.find(g => g[0]?.group === 'Group Stage') ?? [];
        terceiros = gs.filter(t => t.description === 'Round of 32'); // rank 1-8
    }
    // 8 slots de terceiros (emparelhados com 1ºs de grupos opostos — sorteio ainda não feito)
    // Por ora: terceiro[i] faz par com 1º do grupo oposto no slot
    // Layout: lado esquerdo = slots 1-8, lado direito = slots 9-16
    // Montamos 16 slots de r32 no total
    // Slots L: par(A), par(B), par(C), par(D), par(E), par(F), par(G), par(H) → 8 slots left
    // Slots R: par(I), par(J), par(K), par(L), + 4 slots com terceiros cada → 8 slots right
    // Simplificado: 16 slots, cada um com 2 times. Lados iguais.

    const gerarSlotsR32 = (pares, tercs, inicio, fim) => {
        // Se há partidas reais para r32, usa elas
        if (porFase.r32.length >= fim) {
            return porFase.r32.slice(inicio, fim).map(m => slotReal(m));
        }
        // Senão monta com classificados
        const slots = [];
        for (let i = inicio; i < fim; i++) {
            // Para slots 0-11: par de grupo direto
            if (i < 12) {
                const par = pares[i] || [null, null];
                slots.push(slotClassificados(par[0], par[1]));
            } else {
                // Slots 12-15: terceiros (emparelhar 1º grupo com 3º)
                const t = tercs[i - 12] || null;
                const oponenteIdx = i - 12; // simplificado
                const oponente = pares[oponenteIdx] ? pares[oponenteIdx][0] : null;
                slots.push(slotClassificados(oponente, t));
            }
        }
        return slots;
    };

    // ── 3. Gerar slots por fase ───────────────────────────────────────────────
    const slotsR32L  = gerarSlotsR32(paresDiretos, terceiros, 0, 8);
    const slotsR32R  = gerarSlotsR32(paresDiretos, terceiros, 8, 16);

    const faseSlots = (fase, qtd, lado) => {
        const arr = porFase[fase];
        const offset = lado === 'L' ? 0 : qtd;
        return Array.from({length: qtd}, (_, i) => {
            const m = arr[offset + i];
            return m ? slotReal(m) : slotTbd();
        });
    };

    // ── 4. Montar lados ───────────────────────────────────────────────────────
    const leftHtml =
        coluna(slotsR32L) +
        coluna(faseSlots('r16', 4, 'L')) +
        coluna(faseSlots('qf',  2, 'L')) +
        coluna(faseSlots('sf',  1, 'L'));

    const rightHtml =
        coluna(faseSlots('sf',  1, 'R')) +
        coluna(faseSlots('qf',  2, 'R')) +
        coluna(faseSlots('r16', 4, 'R')) +
        coluna(slotsR32R);

    document.getElementById('bracket-left').innerHTML  = leftHtml;
    document.getElementById('bracket-right').innerHTML = rightHtml;

    // ── 5. Final e 3º lugar ───────────────────────────────────────────────────
    const finalEl = document.querySelector('#bracket-final .match-slot');
    const thirdEl = document.querySelector('#bracket-bronze .match-slot');
    if (finalEl) {
        const mF = porFase.final[0];
        finalEl.outerHTML = mF ? slotReal(mF) : slotTbd().replace('slot-tbd','final-slot');
    }
    if (thirdEl) {
        const mT = porFase.third[0];
        thirdEl.outerHTML = mT ? slotReal(mT) : slotTbd();
    }
}

function renderizarGrupos(todasEntradas, top8TerceiroIds) {
    const scroller = document.getElementById('grupos-rodape');
    const cores = [
        '#FF4A7A','#00E5FF','#A020F0','#4CAF50','#FF9800','#03A9F4',
        '#FF4A7A','#00E5FF','#A020F0','#4CAF50','#FF9800','#03A9F4'
    ];

    // Filtra apenas grupos reais (Group A … Group L)
    const gruposValidos = todasEntradas.filter(grupo =>
        /^Group\s+[A-L]$/i.test(grupo[0]?.group ?? '')
    );

    scroller.innerHTML = gruposValidos.map((grupo, i) => {
        const nomeGrupo = grupo[0].group.replace(/Group/i, 'Grupo');
        const linhasTime = grupo.map((time, idx) => {
            const top2 = idx < 2;
            const top4Terceiro = idx === 2 && (top8TerceiroIds?.has(time.team.id) ?? false);
            let corBorda = 'transparent';
            let corNome = 'var(--text-muted)';
            let pesoFonte = '400';
            if (top2) { corBorda = 'var(--green-1)'; corNome = 'var(--text-primary)'; pesoFonte = '700'; }
            else if (top4Terceiro) { corBorda = 'var(--amber)'; corNome = 'var(--amber)'; pesoFonte = '600'; }

            return `
                <div class="grupo-linha-time" style="border-left-color:${corBorda}">
                    <div class="grupo-linha-esq">
                        <span class="grupo-rank">${time.rank}</span>
                        <img src="${time.team.logo}" class="grupo-logo" alt="${time.team.name}">
                        <span class="grupo-sigla" style="color:${corNome};font-weight:${pesoFonte};">${sigla(time.team.name)}</span>
                    </div>
                    <span class="grupo-pts">${time.points}</span>
                </div>`;
        }).join('');

        return `
            <div class="grupo-card">
                <div class="grupo-card-titulo">${nomeGrupo}</div>
                ${linhasTime}
            </div>`;
    }).join('');
}
