import { mostrarLoadingSpinner, esconderLoadingSpinner, calcularPercentual, cumpreMeta } from './helpers.js';
import { getCookie, csrftoken, formatDateToISOStringWithMilliseconds } from './utils.js';

// Função para formatar horas decimais em HH:mm:ss
function formatarHorasEmHHMMSS(horasDecimais) {
    const horas = Math.floor(horasDecimais);
    const minutosDecimais = (horasDecimais - horas) * 60;
    const minutos = Math.floor(minutosDecimais);
    const segundos = Math.round((minutosDecimais - minutos) * 60);
    
    return [
        horas.toString().padStart(2, '0'),
        minutos.toString().padStart(2, '0'),
        segundos.toString().padStart(2, '0')
    ].join(':');
}

// Função principal para buscar os dados de atividade dos agentes
export function buscarDadosAgentes(isManualSearch = false) {
    let startDate, endDate;

    // Caso a busca seja manual, utilize as datas dos campos manuais
    if (isManualSearch) {
        console.log("[INFO] Realizando busca manual");

        startDate = document.getElementById('startDate').value;
        endDate = document.getElementById('endDate').value;

        if (!startDate || !endDate) {
            alert('Por favor, selecione ambas as datas.');
            console.error("[ERROR] Data de início ou fim não selecionada.");
            return;
        }

        // Formatar as datas para ISO 8601 com milissegundos
        startDate = formatDateToISOStringWithMilliseconds(startDate);
        endDate = formatDateToISOStringWithMilliseconds(endDate);
    } else {
        // Caso não seja busca manual, considere o KPI 1101 com mês/ano
        const selectedKPI = document.getElementById('kpiSelector').value;
        console.log("[INFO] KPI Selecionado:", selectedKPI);

        if (selectedKPI === '1101') {
            const selectedMes = document.getElementById('mesSelector').value;
            const selectedAno = document.getElementById('anoSelector').value;

            if (selectedMes && selectedAno) {
                startDate = `${selectedAno}-${selectedMes}-01T00:00:00`;
                endDate = new Date(selectedAno, selectedMes, 0).toISOString().replace(/T.*/, 'T23:59:59');
                console.log("[INFO] Datas geradas automaticamente para o KPI 11.01");
            } else {
                alert('Por favor, selecione o mês e o ano.');
                console.error("[ERROR] Mês ou ano não selecionado.");
                toggleButtons(true);
                return;
            }
        } else {
            console.log("[INFO] KPI não é 1101 ou é uma busca manual. Aborting.");
            toggleButtons(true);
            return;
        }
    }

    console.log("[DEBUG] Data de Início:", startDate);
    console.log("[DEBUG] Data de Fim:", endDate);

    mostrarLoadingSpinner('loadingSpinner');

    const payload = {
        dtStart: startDate,
        dtFinish: endDate
    };

    console.log("[INFO] Payload enviado:", payload);

    const urlElement = document.getElementById('atividadesAgentesUrlData');
    let atividadesAgentesUrl = null;

    if (urlElement) {
        try {
            atividadesAgentesUrl = urlElement.textContent.trim();
            console.log("[INFO] URL da API carregada:", atividadesAgentesUrl);
        } catch (e) {
            console.error("[ERROR] Falha ao parsear a URL da API:", e);
            toggleButtons(true);
            esconderLoadingSpinner('loadingSpinner');
            return;
        }
    } else {
        console.error("[ERROR] Elemento 'atividadesAgentesUrlData' não encontrado no documento.");
        toggleButtons(true);
        esconderLoadingSpinner('loadingSpinner');
        return;
    }

    if (!atividadesAgentesUrl) {
        console.error("[ERROR] URL da API não foi definida.");
        esconderLoadingSpinner('loadingSpinner');
        toggleButtons(true);
        return;
    }

    fetch(atividadesAgentesUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken
        },
        body: JSON.stringify(payload)
    })
    .then(response => {
        console.log("[INFO] HTTP Status da resposta:", response.status);
        return response.json();
    })
    .then(data => {
        console.log("[INFO] Dados recebidos do JSON:", data);
        if (data.errcode === 0) {
            preencherTabelaAgentes(data.agent_activity_list);
            document.getElementById('exportExcel').style.display = data.agent_activity_list.length > 0 ? 'block' : 'none';
        } else {
            console.error("[ERROR] Erro ao buscar dados:", data.errmsg);
            document.getElementById('exportExcel').style.display = 'none';
        }
        esconderLoadingSpinner('loadingSpinner');
    })
    .catch(error => {
        console.error("[ERROR] Erro na requisição:", error);
        esconderLoadingSpinner('loadingSpinner');
        document.getElementById('exportExcel').style.display = 'none';
    })
    .finally(() => {
        esconderLoadingSpinner('loadingSpinner');
        toggleButtons(true); // Reabilita os botões após a requisição
    });
}


// Função para desabilitar/habilitar botões
function toggleButtons(enable) {
    const searchButton = document.getElementById('kpiSearchButton');
    const filterButton = document.getElementById('filterButton');
    searchButton.disabled = !enable;
    filterButton.disabled = !enable;
}



// Função para preencher a tabela com dados dos agentes
function preencherTabelaAgentes(dados) {
    const table = $('#tabelaAgentes').DataTable();

    table.clear();

    console.log('Dados para preencher a tabela:', dados);

    const agentesConsolidados = consolidarDadosPorAgenteEData(dados);

    const TEMPO_TRABALHO_ESPERADO_HORAS = 6;

    agentesConsolidados.forEach(agente => {
        console.log("-----------");
        console.log("Processando agente:", agente.nome, "Data:", agente.data);

        let tempoTotalLoginHoras = parseFloat(agente.tempoTotalLogin.split(' ')[0]);

        let tempoPausasParticulares = 0;

        agente.detalhesPausas.forEach(pausa => {
            if (!pausa.includes('Desc') && !pausa.includes('Café')) {
                const [inicio, fimCompleto] = pausa.split(' - ');
                const fim = fimCompleto.split(': ')[0].trim();

                if (!inicio || !fim) {
                    console.error("Erro: Hora de início ou fim inválida para a pausa:", pausa);
                    return;
                }

                try {
                    const tempoPausa = (new Date(`1970-01-01T${fim}Z`) - new Date(`1970-01-01T${inicio}Z`)) / 3600000;

                    if (!isNaN(tempoPausa) && tempoPausa >= 0) {
                        tempoPausasParticulares += tempoPausa;
                    }
                } catch (e) {
                    console.error("Erro ao processar a pausa:", e);
                }
            }
        });

        console.log("Tempo total de pausas particulares (horas):", tempoPausasParticulares);

        const tempoLogadoEfetivo = tempoTotalLoginHoras - tempoPausasParticulares;
        const ocupacaoPercentual = ((tempoLogadoEfetivo / TEMPO_TRABALHO_ESPERADO_HORAS) * 100).toFixed(2);

        console.log("Ocupação percentual calculada:", ocupacaoPercentual);
        const tempoLogadoEfetivoFormatado = formatarHorasEmHHMMSS(tempoLogadoEfetivo);
        console.log("Tempo logado efetivo formatado (HH:mm:ss):", tempoLogadoEfetivoFormatado);

        const medicao = `${tempoLogadoEfetivoFormatado} - Ocupação: ${ocupacaoPercentual}%`;
        console.log("Medição formatada:", medicao);

        table.row.add([
            agente.nome || 'N/A',
            agente.data || 'N/A',
            agente.tempoTotalLogin,
            agente.tempoTotalPausa.toFixed(2) + ' minutos',
            agente.quantidadePausas || 0,
            agente.horarioDeLogin || 'N/A',
            agente.horarioDeLogoff || 'N/A',
            agente.detalhesPausas.length ? agente.detalhesPausas.join('<br>') : 'Nenhuma pausa',
            medicao
        ]);
        console.log("-----------");
    });

    table.draw();
}

function consolidarDadosPorAgenteEData(dados) {
    const agentesConsolidados = [];

    dados.forEach(item => {
        if (!item.login || !item.logoff || item.login === "0" || item.logoff === "0") {
            console.warn('Login ou Logoff inválido para:', item.nome);
            return;
        }

        const loginDate = new Date(item.login);
        const logoffDate = new Date(item.logoff);

        if (isNaN(loginDate.getTime()) || isNaN(logoffDate.getTime())) {
            console.warn('Datas inválidas para:', item.nome);
            return;
        }

        const data = loginDate.toLocaleDateString('pt-BR');
        let agenteExistente = agentesConsolidados.find(ag => ag.nome === item.nome && ag.data === data);

        if (!agenteExistente) {
            agenteExistente = {
                nome: item.nome || 'N/A',
                data: data,
                primeiroLogin: loginDate,
                ultimoLogoff: logoffDate,
                tempoTotalPausa: 0,
                quantidadePausas: 0,
                detalhesPausas: new Set()
            };
            agentesConsolidados.push(agenteExistente);
        } else {
            if (loginDate < agenteExistente.primeiroLogin) {
                agenteExistente.primeiroLogin = loginDate;
            }
            if (logoffDate > agenteExistente.ultimoLogoff) {
                agenteExistente.ultimoLogoff = logoffDate;
            }
        }

        if (Array.isArray(item.agent_pause_list)) {
            item.agent_pause_list.forEach(pause => {
                const pauseDuration = pause.tempo_pause / 60;
                if (pauseDuration < 0) {
                    console.warn('Duração de pausa negativa para:', pause);
                    return;
                }
                const detalhePausa = `${new Date(pause.pause).toLocaleTimeString('pt-BR')} - ${new Date(pause.unpause).toLocaleTimeString('pt-BR')}: ${pause.motivo_pause}`;
                if (!agenteExistente.detalhesPausas.has(detalhePausa)) {
                    agenteExistente.detalhesPausas.add(detalhePausa);
                    agenteExistente.tempoTotalPausa += pauseDuration;
                    agenteExistente.quantidadePausas += 1;
                }
            });
        }
    });

    agentesConsolidados.forEach(ag => {
        ag.detalhesPausas = Array.from(ag.detalhesPausas);
        if (ag.primeiroLogin && ag.ultimoLogoff) {
            const tempoTotalMs = ag.ultimoLogoff.getTime() - ag.primeiroLogin.getTime();
            const tempoTotalHoras = (tempoTotalMs / 3600000).toFixed(2);

            ag.tempoTotalLogin = tempoTotalHoras + ' horas';
            ag.horarioDeLogin = ag.primeiroLogin.toLocaleTimeString('pt-BR');
            ag.horarioDeLogoff = ag.ultimoLogoff.toLocaleTimeString('pt-BR');
        } else {
            ag.tempoTotalLogin = 'Dados de login incompletos';
            ag.horarioDeLogin = 'N/A';
            ag.horarioDeLogoff = 'N/A';
        }
    });

    return agentesConsolidados;
}

// Listeners de evento e configuração inicial
document.addEventListener('DOMContentLoaded', function() {
    const searchButton = document.getElementById('kpiSearchButton');
    const filterButton = document.getElementById('filterButton');

    filterButton.addEventListener('click', function() {
        toggleButtons(false); // Desabilita os botões enquanto a requisição está em andamento
        buscarDadosAgentes(true);
    });

    searchButton.addEventListener('click', function() {
        toggleButtons(false); // Desabilita os botões enquanto a requisição está em andamento
        buscarDadosAgentes(false);
    });

    document.getElementById('exportExcel').addEventListener('click', function() {
        const table = document.getElementById('tabelaAgentes');
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.table_to_sheet(table, { raw: true });
        XLSX.utils.book_append_sheet(wb, ws, "Atividade_Agentes");
        XLSX.writeFile(wb, 'atividade_agentes.xlsx');
    });

    flatpickr("#startDate", {
        enableTime: true,
        dateFormat: "d/m/Y H:i",
        time_24hr: true,
        allowInput: true,
        locale: "pt"
    });

    flatpickr("#endDate", {
        enableTime: true,
        dateFormat: "d/m/Y H:i",
        time_24hr: true,
        allowInput: true,
        locale: "pt"
    });
});
