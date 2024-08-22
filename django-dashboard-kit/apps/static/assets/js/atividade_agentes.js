import { mostrarLoadingSpinner, esconderLoadingSpinner, calcularPercentual, cumpreMeta } from './helpers.js';
import { getCookie, csrftoken, formatDateToISOStringWithMilliseconds } from './utils.js';
import { renderizarGraficoColunas } from './kpi_charts.js';

// Função principal para buscar os dados de atividade dos agentes
export function buscarDadosAgentes(isManualSearch = false) {
    let startDate, endDate;

    // Caso a busca seja manual, utilize as datas dos campos manuais
    if (isManualSearch) {
        // console.log("[INFO] Realizando busca manual");

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
        // console.log("[INFO] KPI Selecionado:", selectedKPI);

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
            // console.log("[INFO] KPI não é 1101 ou é uma busca manual. Aborting.");
            toggleButtons(true);
            return;
        }
    }

    /* console.log("[DEBUG] Data de Início:", startDate);
    console.log("[DEBUG] Data de Fim:", endDate); */

    mostrarLoadingSpinner('loadingSpinnerMedidores');
    mostrarLoadingSpinner('loadingSpinner');


    const payload = {
        dtStart: startDate,
        dtFinish: endDate
    };

    // console.log("[INFO] Payload enviado:", payload);

    const urlElement = document.getElementById('atividadesAgentesUrlData');
    let atividadesAgentesUrl = null;

    if (urlElement) {
        try {
            atividadesAgentesUrl = urlElement.textContent.trim();
            // console.log("[INFO] URL da API carregada:", atividadesAgentesUrl);
        } catch (e) {
            // console.error("[ERROR] Falha ao parsear a URL da API:", e);
            toggleButtons(true);
            esconderLoadingSpinner('loadingSpinner');
            esconderLoadingSpinner('loadingSpinnerMedidores');
            return;
        }
    } else {
        // console.error("[ERROR] Elemento 'atividadesAgentesUrlData' não encontrado no documento.");
        toggleButtons(true);
        esconderLoadingSpinner('loadingSpinner');
        esconderLoadingSpinner('loadingSpinnerMedidores');
        return;
    }

    if (!atividadesAgentesUrl) {
        // console.error("[ERROR] URL da API não foi definida.");
        esconderLoadingSpinner('loadingSpinner');
        esconderLoadingSpinner('loadingSpinnerMedidores');
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
        // console.log("[INFO] HTTP Status da resposta:", response.status);
        return response.json();
    })
    .then(data => {
        // console.log("[INFO] Dados recebidos do JSON:", data);
        if (data.errcode === 0) {
            const dadosProcessados = processarDadosParaGrafico(data.agent_activity_list);
            // Renderizar o gráfico de colunas
            renderizarGraficoColunas('1101', dadosProcessados);
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
        esconderLoadingSpinner('loadingSpinnerMedidores');
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

// Função para preencher a tabela com dados dos agentes
function preencherTabelaAgentes(dados) {
    const table = $('#tabelaAgentes').DataTable();

    table.clear();

    const agentesConsolidados = consolidarDadosPorAgenteEData(dados);

    const TEMPO_TRABALHO_ESPERADO_HORAS = 6;

    agentesConsolidados.forEach(agente => {
        let tempoTotalLoginHoras = parseFloat(agente.tempoTotalLogin.split(' ')[0]);

        let tempoPausasParticulares = 0;

        agente.detalhesPausas.forEach(pausa => {
            if (!pausa.includes('Desc') && !pausa.includes('Café')) {
                const [inicio, fimCompleto] = pausa.split(' - ');
                const fim = fimCompleto.split(': ')[0].trim();

                if (!inicio || !fim) {
                    //console.error("Erro: Hora de início ou fim inválida para a pausa:", pausa);
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

        const tempoLogadoEfetivo = tempoTotalLoginHoras - tempoPausasParticulares;
        const ocupacaoPercentual = ((tempoLogadoEfetivo / TEMPO_TRABALHO_ESPERADO_HORAS) * 100).toFixed(2);
        const tempoLogadoEfetivoFormatado = formatarHorasEmHHMMSS(tempoLogadoEfetivo);

        const medicao = `${tempoLogadoEfetivoFormatado} - Ocupação: ${ocupacaoPercentual}%`;

        // Aqui, altere o tempo de pausa para o formato HH:mm:ss em vez de minutos
        table.row.add([
            agente.nome || 'N/A',
            agente.data || 'N/A',
            agente.tempoTotalLogin,
            agente.tempoTotalPausa, // Já no formato HH:mm:ss
            agente.quantidadePausas || 0,
            agente.horarioDeLogin || 'N/A',
            agente.horarioDeLogoff || 'N/A',
            agente.detalhesPausas.length ? agente.detalhesPausas.join('<br>') : 'Nenhuma pausa',
            medicao
        ]);
    });

    table.draw();
}



function consolidarDadosPorAgenteEData(dados) {
    const agentesConsolidados = [];

    dados.forEach(item => {
        if (!item.login || !item.logoff || item.login === item.logoff || item.login === "0" || item.logoff === "0") {
            //console.warn('Login ou Logoff inválido ou iguais para:', item.nome);
            return;
        }

        const loginDate = new Date(item.login);
        const logoffDate = new Date(item.logoff);

        if (isNaN(loginDate.getTime()) || isNaN(logoffDate.getTime())) {
            //console.warn('Datas inválidas para:', item.nome);
            return;
        }

        const data = loginDate.toLocaleDateString('pt-BR');
        let agenteExistente = agentesConsolidados.find(ag => ag.nome === item.nome && ag.data === data);

        if (!agenteExistente) {
            agenteExistente = {
                nome: item.nome || 'N/A',
                data: data,
                periodosLogin: [],
                tempoTotalPausaSegundos: 0,  // Tempo total de pausas
                tempoExcedentePausaSegundos: 0,  // Tempo excedente das pausas que será subtraído do tempo de login
                quantidadePausas: 0,
                detalhesPausas: new Set()
            };
            agentesConsolidados.push(agenteExistente);
        }

        // Adicionando período de login
        agenteExistente.periodosLogin.push({ loginDate, logoffDate });

        if (Array.isArray(item.agent_pause_list)) {
            item.agent_pause_list.forEach(pause => {
                const pauseDurationSeconds = pause.tempo_pause; // Tempo em segundos
                if (pauseDurationSeconds < 0) {
                    console.warn('Duração de pausa negativa para:', pause);
                    return;
                }

                // Log da pausa original
                //console.log(`[INFO] Pausa original para ${item.nome}: ${pause.motivo_pause}, Duração: ${pauseDurationSeconds / 60} minutos`);

                let tempoExcedenteSegundos = 0;

                // Ajuste apenas para fins de subtração do tempo excedente do login total
                if (pause.motivo_pause.includes('Desc') && pauseDurationSeconds > 600) { // 10 minutos = 600 segundos
                    tempoExcedenteSegundos = pauseDurationSeconds - 600;
                } else if (pause.motivo_pause.includes('Café') && pauseDurationSeconds > 1200) { // 20 minutos = 1200 segundos
                    tempoExcedenteSegundos = pauseDurationSeconds - 1200;
                }

                const detalhePausa = `${new Date(pause.pause).toLocaleTimeString('pt-BR')} - ${new Date(pause.unpause).toLocaleTimeString('pt-BR')}: ${pause.motivo_pause}`;

                if (!agenteExistente.detalhesPausas.has(detalhePausa)) {
                    agenteExistente.detalhesPausas.add(detalhePausa);
                    agenteExistente.tempoTotalPausaSegundos += pauseDurationSeconds;  // Somando tempo total de pausa sem ajustes
                    agenteExistente.tempoExcedentePausaSegundos += tempoExcedenteSegundos;  // Somando tempo excedente para ajustar login
                    agenteExistente.quantidadePausas += 1;
                }
            });
        }
    });

    agentesConsolidados.forEach(ag => {
        ag.detalhesPausas = Array.from(ag.detalhesPausas);

        // Consolidar períodos de login para evitar sobreposição
        ag.periodosLogin.sort((a, b) => a.loginDate - b.loginDate);

        let tempoTotalLogado = 0;
        let lastLogoff = null;

        ag.periodosLogin.forEach(periodo => {
            if (lastLogoff && periodo.loginDate < lastLogoff) {
                // Se o login atual começa antes do último logoff, há uma sobreposição
                tempoTotalLogado += Math.max(0, periodo.logoffDate - lastLogoff);
            } else {
                tempoTotalLogado += periodo.logoffDate - periodo.loginDate;
            }
            lastLogoff = Math.max(lastLogoff || 0, periodo.logoffDate);
        });

        const tempoTotalHoras = (tempoTotalLogado / 3600000).toFixed(2);

        // Subtrair o tempo excedente das pausas do tempo total de login
        const tempoLogadoEfetivo = ((tempoTotalLogado - ag.tempoExcedentePausaSegundos * 1000) / 3600000).toFixed(2);

        ag.tempoTotalLogin = `${tempoLogadoEfetivo} horas`;
        ag.tempoTotalPausa = formatarTempoEmHHMMSS(ag.tempoTotalPausaSegundos); // Formatar tempo total de pausa em HH:mm:ss
        ag.horarioDeLogin = ag.periodosLogin[0].loginDate.toLocaleTimeString('pt-BR');
        ag.horarioDeLogoff = ag.periodosLogin[ag.periodosLogin.length - 1].logoffDate.toLocaleTimeString('pt-BR');

        //console.log(`[INFO] Tempo total de login calculado para ${ag.nome} no dia ${ag.data}: ${ag.tempoTotalLogin}`);
        //console.log(`[INFO] Tempo total de pausa calculado para ${ag.nome} no dia ${ag.data}: ${ag.tempoTotalPausa}`);
    });

    return agentesConsolidados;
}

function formatarTempoEmHHMMSS(segundosTotais) {
    const horas = Math.floor(segundosTotais / 3600);
    const minutos = Math.floor((segundosTotais % 3600) / 60);
    const segundos = segundosTotais % 60;

    return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;
}



function processarDadosParaGrafico(dados) {
    const resultado = {
        carga_horaria: 0,
        horas_trabalhadas: 0,
        horas_pausa: 0
    };

    const TEMPO_TRABALHO_ESPERADO_HORAS = 6;
    const agentesConsolidados = consolidarDadosPorAgenteEData(dados);

    // Dicionário para armazenar o número de pessoas que logaram em cada dia
    const pessoasPorDia = {};

    agentesConsolidados.forEach(agente => {
        // Considera apenas dias onde o agente fez login
        if (agente.periodosLogin.length > 0) {
            if (!pessoasPorDia[agente.data]) {
                pessoasPorDia[agente.data] = new Set();
            }
            pessoasPorDia[agente.data].add(agente.nome);
        }

        resultado.horas_trabalhadas += parseFloat(agente.tempoTotalLogin); // Tempo logado efetivo em horas
        resultado.horas_pausa += parseFloat(agente.tempoTotalPausaSegundos / 3600); // Tempo de pausa convertido para horas
    });

    // Cálculo da carga horária para o gráfico
    for (const dia in pessoasPorDia) {
        resultado.carga_horaria += pessoasPorDia[dia].size * TEMPO_TRABALHO_ESPERADO_HORAS;
    }

    return resultado;
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
