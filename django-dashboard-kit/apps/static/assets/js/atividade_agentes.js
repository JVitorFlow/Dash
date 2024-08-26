import { mostrarLoadingSpinner, esconderLoadingSpinner, calcularPercentual, cumpreMeta } from './helpers.js';
import { getCookie, csrftoken, formatDateToISOStringWithMilliseconds } from './utils.js';
import { renderizarGraficoColunas, renderizarGraficoPonteiro } from './kpi_charts.js';

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
                // console.log("[INFO] Datas geradas automaticamente para o KPI 11.01");
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
        console.log("[INFO] Dados recebidos do JSON:", data);
        if (data.errcode === 0) {
            const dadosProcessados = processarDadosParaGrafico(data.agent_activity_list);
            // Renderizar o gráfico de colunas
            console.log("[INFO] Dados processados para o gráfico:", dadosProcessados);
            renderizarGraficoColunas('1101', dadosProcessados);
            preencherTabelaAgentes(data.agent_activity_list);
            calcularOcupacaoTotalEExibir(data.agent_activity_list);
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

function calcularOcupacaoTotalEExibir(dados) {
    // Utilize a função processarDadosParaGrafico para obter os dados já calculados
    const resultado = processarDadosParaGrafico(dados);

    // Subtraindo as horas de pausa da carga horária para obter o tempo disponível
    const horasDisponiveis = resultado.carga_horaria - resultado.horas_pausa;

    // Calculando a ocupação com base nas horas trabalhadas e nas horas disponíveis
    const ocupacaoTotalPercent = ((resultado.horas_trabalhadas / horasDisponiveis) * 100).toFixed(2);
    console.log("(calcularOcupacaoTotalEExibir)[INFO] Ocupação total calculada (percentual):", ocupacaoTotalPercent);

    // Enviando o valor formatado dentro de um objeto para o gráfico de ponteiro
    const dadosParaGraficoPonteiro = { ocupacaoPercentual: ocupacaoTotalPercent };
    renderizarGraficoPonteiro('1101', dadosParaGraficoPonteiro);
}



function preencherTabelaAgentes(dados) {
    const table = $('#tabelaAgentes').DataTable();

    table.clear();

    const agentesConsolidados = consolidarDadosPorAgenteEData(dados);

    agentesConsolidados.forEach(agente => {
        // Aqui, utilize o valor em segundos para os cálculos
        const tempoLogadoEfetivoSegundos = (parseFloat(agente.tempoTotalLoginHoras) * 3600); // Mantém a precisão em segundos
        const ocupacaoPercentual = agente.ocupacaoPercentual;

        // Converte o tempo logado efetivo para o formato HH:MM:SS para exibição
        const tempoLogadoEfetivoFormatado = formatarHorasEmHHMMSS_nova(tempoLogadoEfetivoSegundos);

        table.row.add([
            agente.nome || 'N/A',
            agente.data || 'N/A',
            tempoLogadoEfetivoFormatado,  // Exibindo no formato HH:MM:SS
            agente.tempoTotalPausa,
            agente.quantidadePausas || 0,
            agente.horarioDeLogin || 'N/A',
            agente.horarioDeLogoff || 'N/A',
            agente.todosPeriodosFormatados || 'N/A',
            agente.detalhesPausas.length ? agente.detalhesPausas.join('<br>') : 'Nenhuma pausa',
            `${tempoLogadoEfetivoFormatado} - Ocupação: ${ocupacaoPercentual}%`
        ]);
    });

    table.draw();
}

function consolidarDadosPorAgenteEData(dados) {
    const agentesConsolidados = [];

    dados.forEach(item => {
        if (!item.login || !item.logoff || item.login === item.logoff || item.login === "0" || item.logoff === "0") {
            console.warn('[AVISO] Login ou logoff inválido para:', item.nome);
            return;
        }

        const loginDate = new Date(item.login);
        const logoffDate = new Date(item.logoff);

        if (isNaN(loginDate.getTime()) || isNaN(logoffDate.getTime())) {
            console.warn('[AVISO] Datas inválidas para:', item.nome);
            return;
        }

        const data = loginDate.toLocaleDateString('pt-BR');
        let agenteExistente = agentesConsolidados.find(ag => ag.nome === item.nome && ag.data === data);

        if (!agenteExistente) {
            agenteExistente = {
                nome: item.nome || 'N/A',
                data: data,
                periodosLogin: [],
                tempoTotalPausaSegundos: 0,
                tempoExcedentePausaSegundos: 0,
                quantidadePausas: 0,
                detalhesPausas: new Set(),
                todosPeriodos: []
            };
            agentesConsolidados.push(agenteExistente);
        }

        // Adicionando período de login ao registro geral e à lista de todos os períodos
        agenteExistente.periodosLogin.push({ loginDate, logoffDate });

        // Tratando as pausas
        if (Array.isArray(item.agent_pause_list)) {
            item.agent_pause_list.forEach(pause => {
                const pauseStart = new Date(pause.pause);
                const pauseEnd = new Date(pause.unpause);
                const pauseDurationSeconds = (pauseEnd - pauseStart) / 1000; // Tempo em segundos

                let tempoExcedenteSegundos = 0;

                // Ajuste do tempo excedente para pausas de descanso e café
                if (pause.motivo_pause.includes('Desc') && pauseDurationSeconds > 600) { // 10 minutos para descanso
                    tempoExcedenteSegundos = pauseDurationSeconds - 600;
                } else if (pause.motivo_pause.includes('Café') && pauseDurationSeconds > 1200) { // 20 minutos para café
                    tempoExcedenteSegundos = pauseDurationSeconds - 1200;
                }

                const detalhePausa = `${pauseStart.toLocaleTimeString('pt-BR')} - ${pauseEnd.toLocaleTimeString('pt-BR')}: ${pause.motivo_pause}`;

                if (!agenteExistente.detalhesPausas.has(detalhePausa)) {
                    agenteExistente.detalhesPausas.add(detalhePausa);
                    agenteExistente.tempoTotalPausaSegundos += pauseDurationSeconds;
                    agenteExistente.tempoExcedentePausaSegundos += tempoExcedenteSegundos;
                    agenteExistente.quantidadePausas += 1;
                }
            });
        }
    });

    agentesConsolidados.forEach(ag => {
        ag.detalhesPausas = Array.from(ag.detalhesPausas);

        ag.periodosLogin.sort((a, b) => a.loginDate - b.loginDate);

        let tempoTotalLogadoSegundos = 0;
        let lastLogoff = null;

        ag.periodosLogin.forEach(periodo => {
            const periodoLoginSegundos = (periodo.logoffDate - periodo.loginDate) / 1000;

            if (lastLogoff && periodo.loginDate < lastLogoff) {
                tempoTotalLogadoSegundos += Math.max(0, (periodo.logoffDate - lastLogoff) / 1000);
            } else {
                tempoTotalLogadoSegundos += periodoLoginSegundos;
            }

            lastLogoff = Math.max(lastLogoff || 0, periodo.logoffDate);

            ag.todosPeriodos.push(`${periodo.loginDate.toLocaleDateString('pt-BR')} ${periodo.loginDate.toLocaleTimeString('pt-BR')} - ${periodo.logoffDate.toLocaleTimeString('pt-BR')}`);
        });

        // Considerando que 5h20min é o tempo efetivo esperado
        const TEMPO_EFETIVO_ATENDIMENTO_SEGUNDOS = 320 * 60; // 320 minutos = 5h20min

        // Subtraindo todo o tempo de pausa (incluindo o tempo excedente) do tempo total logado
        const tempoLogadoEfetivoSegundos = tempoTotalLogadoSegundos - ag.tempoTotalPausaSegundos;

        // Aqui, armazena tanto o valor em horas (para cálculos) quanto no formato "HH:MM:SS"
        const tempoLogadoEfetivoHoras = tempoLogadoEfetivoSegundos / 3600; // Armazena em horas (para cálculos)
        const tempoLogadoEfetivoFormatado = formatarHorasEmHHMMSS_nova(tempoLogadoEfetivoSegundos); // Armazena em "HH:MM:SS"

        // Calcula a ocupação baseada no tempo efetivo de 5h20min
        const ocupacaoPercentual = ((tempoLogadoEfetivoSegundos / TEMPO_EFETIVO_ATENDIMENTO_SEGUNDOS) * 100).toFixed(2);

        ag.tempoTotalLogin = `${tempoLogadoEfetivoHoras.toFixed(6)} horas`; // Mantém o valor em horas para cálculos futuros
        ag.tempoTotalLoginHoras = tempoLogadoEfetivoHoras.toFixed(6); // Valor em horas para cálculos
        ag.tempoTotalLoginFormatado = tempoLogadoEfetivoFormatado; // Formato "HH:MM:SS"
        ag.tempoTotalPausa = formatarHorasEmHHMMSS_nova(ag.tempoTotalPausaSegundos);
        ag.horarioDeLogin = ag.periodosLogin[0].loginDate.toLocaleTimeString('pt-BR');
        ag.horarioDeLogoff = ag.periodosLogin[ag.periodosLogin.length - 1].logoffDate.toLocaleTimeString('pt-BR');
        ag.ocupacaoPercentual = ocupacaoPercentual;
        ag.todosPeriodosFormatados = ag.todosPeriodos.join('<br>');
    });

    return agentesConsolidados;
}



// Função auxiliar para formatar tempo em HH:MM:SS
function formatarHorasEmHHMMSS_nova(segundosTotais) {
    const horas = Math.floor(segundosTotais / 3600);
    const minutos = Math.floor((segundosTotais % 3600) / 60);
    const segundos = Math.floor(segundosTotais % 60);

    return [horas, minutos, segundos]
        .map(valor => valor < 10 ? `0${valor}` : valor) // Adiciona zero à esquerda se necessário
        .join(':');
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

        // Somar as horas trabalhadas (tempo logado efetivo)
        resultado.horas_trabalhadas += parseFloat(agente.tempoTotalLogin);

        // Somar o tempo de pausa (convertido de segundos para horas)
        const horasPausa = parseFloat((agente.tempoTotalPausaSegundos / 3600).toFixed(2));
        resultado.horas_pausa += horasPausa;

        // Log para verificar os valores
        console.log(`[LOG] Agente: ${agente.nome} | Horas Trabalhadas: ${agente.tempoTotalLogin} | Horas Pausa: ${horasPausa}`);
    });

    // Cálculo da carga horária para o gráfico
    for (const dia in pessoasPorDia) {
        resultado.carga_horaria += pessoasPorDia[dia].size * TEMPO_TRABALHO_ESPERADO_HORAS;
    }

    // Formatar resultado final com duas casas decimais
    resultado.horas_trabalhadas = parseFloat(resultado.horas_trabalhadas.toFixed(2));
    resultado.horas_pausa = parseFloat(resultado.horas_pausa.toFixed(2));
    resultado.carga_horaria = parseFloat(resultado.carga_horaria.toFixed(2));

    // Log final para verificar os resultados
    console.log("[LOG] Resultado Final para Gráfico:", resultado);

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
