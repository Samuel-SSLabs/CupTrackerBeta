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
    if (!match) return;
    if (!temDetalhes(match.fixture.status.short)) return;

    const modal = document.getElementById('modal-detalhes');
    const conteudo = document.getElementById('conteudo-estatisticas');
    fixtureAtualNoModal = fixtureId;
    modal.classList.add('visivel');
    conteudo.innerHTML = '<div class="modal-loading"><div class="spinner"></div><span>Carregando...</span></div>';

    await carregarDetalhes(fixtureId);

    if (fixtureAtualNoModal !== fixtureId) return;

    const s = cachePartidas[fixtureId]?.fixture?.status?.short ?? '';
    if (STATUS_LIVE_COM_HT.includes(s)) {
        clearInterval(atualizacaoDetalhesIntervalo);
        atualizacaoDetalhesIntervalo = setInterval(() => {
            if (fixtureAtualNoModal === fixtureId) carregarDetalhes(fixtureId);
        }, 30000);
    }
}

async function carregarDetalhes(fixtureId) {
    const conteudo = document.getElementById('conteudo-estatisticas');
    try {
        const res = await fetch(`${URL_PROXY}?action=detalhes&fixtureId=${fixtureId}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const dados = await res.json();
        if (dados.erro) throw new Error(dados.erro);

        if (fixtureAtualNoModal !== fixtureId) return;

        renderizarDetalhes(fixtureId, dados);
    } catch (e) {
        if (fixtureAtualNoModal !== fixtureId) return;
        conteudo.innerHTML = '<div class="modal-erro">Não foi possível carregar os detalhes desta partida.</div>';
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

        let statusTexto = '';
        let dotHtml = '';
        if (isLive) {
            dotHtml = '<span class="live-dot"></span>';
            statusTexto = elapsed ? `${elapsed}' — Ao Vivo` : 'Ao Vivo';
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
                    <div style="flex:1;display:flex;flex-direction:column;gap:3px;">
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
                const siglaTime = isHome ? siglaHome : siglaAway;

                /*
                 * Layout:
                 *   Casa  → [SIGLA] [ícone] [min']  |  nome centralizado  |  (vazio)
                 *   Fora  → (vazio)                  |  nome centralizado  |  [min'] [ícone] [SIGLA]
                 */
                const colunaEsq = isHome
                    ? `<span class="evento-sigla">${siglaTime}</span><span class="evento-icone">${icone}</span><span class="evento-minuto">${minuto}</span>`
                    : '';
                const colunaDir = !isHome
                    ? `<span class="evento-minuto">${minuto}</span><span class="evento-icone">${icone}</span><span class="evento-sigla">${siglaTime}</span>`
                    : '';

                return `
                    <div class="evento-item">
                        <div class="evento-col-side left">${colunaEsq}</div>
                        <div class="evento-desc">
                            ${desc}${detalhe ? `<span class="evento-detalhe"> ${detalhe}</span>` : ''}
                        </div>
                        <div class="evento-col-side right">${colunaDir}</div>
                    </div>`;
            }).join('');
            htmlEventos = `<div class="secao-titulo">Gols &amp; Cartões</div>${itens}`;
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
        infoMinuto = match.fixture.status.elapsed ? `${match.fixture.status.elapsed}'` : '';
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

    const fmtData = (d) =>
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

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
                const destaqueAtivo = (historicoGols[m.fixture.id] &&
                    hoje.getTime() - historicoGols[m.fixture.id].timestamp < TEMPO_DESTAQUE_MS)
                    ? historicoGols[m.fixture.id].time
                    : null;
                return criarBlocoPartida(m, STATUS_LIVE.includes(m.fixture.status.short), destaqueAtivo);
            }).join('');
        }

        historyContent.innerHTML = encerrados.length > 0
            ? criarBlocoPartida(encerrados[0])
            : '<div style="color:var(--text-muted);text-align:center;font-size:12px;">Sem resultados</div>';

        const temJogoAoVivo = aoVivo.length > 0;
        const tempoProximaBusca = temJogoAoVivo ? 15000 : 60000;
        
        if (window.timerAtualizacao) clearTimeout(window.timerAtualizacao);
        window.timerAtualizacao = setTimeout(atualizarPainel, tempoProximaBusca);

    } catch (e) {
        debugLog.innerText = 'Erro de conexão';
        if (mainQueue.innerHTML.includes('Carregando')) {
            mainQueue.innerHTML = '<div class="sem-jogos">Erro ao carregar.<br>Tentando novamente...</div>';
        }
        
        if (window.timerAtualizacao) clearTimeout(window.timerAtualizacao);
        window.timerAtualizacao = setTimeout(atualizarPainel, 60000);
    }
}

atualizarPainel();
