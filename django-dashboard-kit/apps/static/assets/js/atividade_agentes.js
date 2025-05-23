import { mostrarLoadingSpinner, esconderLoadingSpinner, calcularPercentual, cumpreMeta } from './helpers.js';
import { getCookie, csrftoken, formatDateToISOStringWithMilliseconds } from './utils.js';
import { renderizarGraficoColunas, renderizarGraficoPonteiro, renderizarGraficoTendencia } from './kpi_charts.js';

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
            toggleButtons(true);
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

    // console.log("[DEBUG] Data de Início (sem ajuste para UTC):", startDate);
    // console.log("[DEBUG] Data de Fim (sem ajuste para UTC):", endDate);


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
            console.error("[ERROR] Falha ao parsear a URL da API:", e);
            toggleButtons(true);
            esconderLoadingSpinner('loadingSpinner');
            esconderLoadingSpinner('loadingSpinnerMedidores');
            return;
        }
    } else {
        console.error("[ERROR] Elemento 'atividadesAgentesUrlData' não encontrado no documento.");
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
            console.log("[INFO] Dados da API válidos. Processando...");
            const dadosProcessados = processarDadosParaGrafico(data.agent_activity_list);
            
            
            const dadosConsolidados = consolidarDadosPorAgenteEData(data.agent_activity_list);
            // console.log("[INFO] Dados consolidados:", dadosConsolidados);
            const disponibilidadePorDia = calcularDisponibilidadeDiariaPorAgente(dadosConsolidados);
            // console.log("[INFO] Dados processados para o gráfico TENDENCIA:", disponibilidadePorDia);
            // console.log("[INFO] Disponibilidade por dia:", disponibilidadePorDia);
            renderizarGraficoTendencia('1101', disponibilidadePorDia);

            // Renderizar o gráfico de colunas
            // console.log("[INFO] Dados processados para o gráfico:", dadosProcessados);
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
        const tempoLogadoEfetivoFormatado = formatarHorasEmHHMMSS(tempoLogadoEfetivoSegundos);

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
    const emailsParaIgnorar = ["homolog.inovasaude@mail.com", "yara.bezerra@wtime.com.br"];

    dados.forEach(item => {

        // Verificar se o item tem os campos necessários
        if (!item || !item.login || !item.logoff || !item.nome) {
            console.warn('[AVISO] Item com dados inválidos:', item);
            return; // Ignora este item
        }


        if (emailsParaIgnorar.includes(item.nome)) {
            console.warn('[AVISO] Ignorando dados do usuário:', item.nome);
            return;
        }

        if (!item.login || !item.logoff || item.login === item.logoff || item.login === "0" || item.logoff === "0") {
            console.warn('[AVISO] Login ou logoff inválido para:', item.nome);
            return;
        }

        let loginDate = new Date(item.login);
        let logoffDate = new Date(item.logoff);

        if (isNaN(loginDate.getTime()) || isNaN(logoffDate.getTime())) {
            console.warn('[AVISO] Datas inválidas para:', item.nome);
            return;
        }

        // Regra de tolerância de 15 minutos para logoff
        const toleranciaLogoff = 15 * 60 * 1000; // 15 minutos em milissegundos
        const inicioDiaSeguinte = new Date(logoffDate);
        inicioDiaSeguinte.setHours(0, 0, 0, 0); // Define 00:00:00 no dia do logoff

        const limiteToleranciaLogoff = new Date(inicioDiaSeguinte.getTime() + toleranciaLogoff);

        // Se o logoff for até 00:15:00, ajusta para o dia anterior
        if (logoffDate <= limiteToleranciaLogoff) {
            // Ajusta a data de logoff para o dia anterior
            logoffDate.setDate(logoffDate.getDate() - 1);
            logoffDate.setHours(23, 59, 59, 999); // Define 23:59:59 no dia anterior
        }

        // Usando a data de logoff para determinar o KPI
        const data = logoffDate.toLocaleDateString('pt-BR');
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
                todosPeriodos: new Set()
            };
            agentesConsolidados.push(agenteExistente);
        }

        // Adicionando período de login e logoff ao registro
        agenteExistente.periodosLogin.push({ loginDate, logoffDate });

        // Tratando pausas (se houver)
        if (Array.isArray(item.agent_pause_list)) {
            item.agent_pause_list.forEach(pause => {
                let pauseStart = new Date(pause.pause);
                let pauseEnd = new Date(pause.unpause);
                let pauseDurationSeconds = (pauseEnd - pauseStart) / 1000;

                // Verifica se a pausa atravessa a meia-noite
                if (pauseStart.toLocaleDateString('pt-BR') !== pauseEnd.toLocaleDateString('pt-BR')) {
                    // Dividindo a pausa entre os dois dias
                    const fimDiaPausa = new Date(pauseStart);
                    fimDiaPausa.setHours(23, 59, 59, 999);

                    const comecoDiaSeguinte = new Date(pauseEnd);
                    comecoDiaSeguinte.setHours(0, 0, 0, 0);

                    const pausaDia1Segundos = (fimDiaPausa - pauseStart) / 1000;
                    const pausaDia2Segundos = (pauseEnd - comecoDiaSeguinte) / 1000;

                    // Dividindo a pausa para o primeiro dia
                    agenteExistente.tempoTotalPausaSegundos += pausaDia1Segundos;

                    const detalhePausa1 = `${pauseStart.toLocaleTimeString('pt-BR')} - 23:59:59: ${pause.motivo_pause}`;
                    if (!agenteExistente.detalhesPausas.has(detalhePausa1)) {
                        agenteExistente.detalhesPausas.add(detalhePausa1);
                        agenteExistente.quantidadePausas += 1;
                    }

                    // Processando a pausa do segundo dia (encontrar o agente do segundo dia)
                    let agenteDia2 = agentesConsolidados.find(ag => ag.nome === item.nome && ag.data === pauseEnd.toLocaleDateString('pt-BR'));
                    if (!agenteDia2) {
                        agenteDia2 = {
                            nome: item.nome || 'N/A',
                            data: pauseEnd.toLocaleDateString('pt-BR'),
                            periodosLogin: [],
                            tempoTotalPausaSegundos: 0,
                            tempoExcedentePausaSegundos: 0,
                            quantidadePausas: 0,
                            detalhesPausas: new Set(),
                            todosPeriodos: new Set()
                        };
                        agentesConsolidados.push(agenteDia2);
                    }

                    agenteDia2.tempoTotalPausaSegundos += pausaDia2Segundos;
                    const detalhePausa2 = `00:00:00 - ${pauseEnd.toLocaleTimeString('pt-BR')}: ${pause.motivo_pause}`;
                    if (!agenteDia2.detalhesPausas.has(detalhePausa2)) {
                        agenteDia2.detalhesPausas.add(detalhePausa2);
                        agenteDia2.quantidadePausas += 1;
                    }
                } else {
                    // Caso a pausa não cruze a meia-noite
                    const detalhePausa = `${pauseStart.toLocaleTimeString('pt-BR')} - ${pauseEnd.toLocaleTimeString('pt-BR')}: ${pause.motivo_pause}`;
                    if (!agenteExistente.detalhesPausas.has(detalhePausa)) {
                        agenteExistente.detalhesPausas.add(detalhePausa);
                        agenteExistente.tempoTotalPausaSegundos += pauseDurationSeconds;
                        agenteExistente.quantidadePausas += 1;
                    }
                }
            });
        }
    });

    // Processamento final para cada agente
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

            const logoffComData = periodo.loginDate.toLocaleDateString('pt-BR') !== periodo.logoffDate.toLocaleDateString('pt-BR') ?
                `${periodo.logoffDate.toLocaleDateString('pt-BR')} ${periodo.logoffDate.toLocaleTimeString('pt-BR')}` :
                `${periodo.logoffDate.toLocaleTimeString('pt-BR')}`;

            ag.todosPeriodos.add(`${periodo.loginDate.toLocaleDateString('pt-BR')} ${periodo.loginDate.toLocaleTimeString('pt-BR')} - ${logoffComData}`);
        });

        const TEMPO_EFETIVO_ATENDIMENTO_SEGUNDOS = 320 * 60; // 320 minutos = 5h20min
        const tempoLogadoEfetivoSegundos = tempoTotalLogadoSegundos - ag.tempoTotalPausaSegundos;

        const tempoLogadoEfetivoHoras = tempoLogadoEfetivoSegundos / 3600;
        const tempoLogadoEfetivoFormatado = formatarHorasEmHHMMSS(tempoLogadoEfetivoSegundos);

        const ocupacaoPercentual = ((tempoLogadoEfetivoSegundos / TEMPO_EFETIVO_ATENDIMENTO_SEGUNDOS) * 100).toFixed(2);

        ag.tempoTotalLogin = `${tempoLogadoEfetivoHoras.toFixed(6)} horas`;
        ag.tempoTotalLoginHoras = tempoLogadoEfetivoHoras.toFixed(6);
        ag.tempoTotalLoginFormatado = tempoLogadoEfetivoFormatado;
        ag.tempoTotalPausa = formatarHorasEmHHMMSS(ag.tempoTotalPausaSegundos);
        ag.horarioDeLogin = ag.periodosLogin[0].loginDate.toLocaleTimeString('pt-BR');
        ag.horarioDeLogoff = ag.periodosLogin[ag.periodosLogin.length - 1].logoffDate.toLocaleTimeString('pt-BR');
        ag.ocupacaoPercentual = ocupacaoPercentual;
        ag.todosPeriodosFormatados = Array.from(ag.todosPeriodos).join('<br>');
    });

    return agentesConsolidados;
}


// Função para formatar tempo em HH:MM:SS
function formatarHorasEmHHMMSS(segundosTotais) {
    if (segundosTotais <= 0) return "00:00:00";

    const horas = Math.floor(segundosTotais / 3600);
    const minutos = Math.floor((segundosTotais % 3600) / 60);
    const segundos = Math.floor(segundosTotais % 60);

    return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;
}



function processarDadosParaGrafico(dados) {
    const resultado = {
        carga_horaria: 0,
        horas_trabalhadas: 0,
        horas_pausa: 0,
        horas_trabalhadas_formatadas: '',
        horas_pausa_formatadas: ''
    };

    const TEMPO_TRABALHO_ESPERADO_HORAS = 6;
    const agentesConsolidados = consolidarDadosPorAgenteEData(dados);

    // Dicionário para armazenar o número de pessoas que logaram em cada dia
    const pessoasPorDia = {};

    let totalSegundosTrabalhados = 0;
    let totalSegundosPausa = 0;

    agentesConsolidados.forEach(agente => {
        // Considera apenas dias onde o agente fez login
        if (agente.periodosLogin.length > 0) {
            if (!pessoasPorDia[agente.data]) {
                pessoasPorDia[agente.data] = new Set();
            }
            pessoasPorDia[agente.data].add(agente.nome);
        }

        // Somar as horas trabalhadas (tempo logado efetivo)
        totalSegundosTrabalhados += parseFloat(agente.tempoTotalLoginHoras) * 3600; // Converte para segundos

        // Somar o tempo de pausa (em segundos)
        totalSegundosPausa += agente.tempoTotalPausaSegundos;

        // Log para verificar os valores
        console.log(`[LOG] Agente: ${agente.nome} | Horas Trabalhadas: ${agente.tempoTotalLoginHoras} horas | Horas Pausa: ${agente.tempoTotalPausa}`);
    });

    // Cálculo da carga horária para o gráfico
    for (const dia in pessoasPorDia) {
        resultado.carga_horaria += pessoasPorDia[dia].size * TEMPO_TRABALHO_ESPERADO_HORAS;
    }

    // Formatar horas trabalhadas e horas de pausa em "HH:MM:SS"
    resultado.horas_trabalhadas_formatadas = formatarHorasEmHHMMSS_Grafico(totalSegundosTrabalhados);
    resultado.horas_pausa_formatadas = formatarHorasEmHHMMSS_Grafico(totalSegundosPausa);

    // Converter o total de segundos trabalhados e pausados para horas decimais
    resultado.horas_trabalhadas = parseFloat((totalSegundosTrabalhados / 3600).toFixed(2));
    resultado.horas_pausa = parseFloat((totalSegundosPausa / 3600).toFixed(2));
    resultado.carga_horaria = parseFloat(resultado.carga_horaria.toFixed(2));

    // Log final para verificar os resultados
    // console.log("[LOG] Resultado Final para Gráfico:", resultado);

    return resultado;
}

// Função para formatar segundos em "HH:MM:SS"
function formatarHorasEmHHMMSS_Grafico(segundos) {
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const segundosRestantes = Math.floor(segundos % 60);

    return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}:${segundosRestantes.toString().padStart(2, '0')}`;
}


function calcularDisponibilidadeDiariaPorAgente(dadosConsolidados) {
    const cargaHorariaAgente = 6 * 3600; // Convertendo carga horária de horas para segundos
    console.log("[DEBUG] Carga horária por agente (segundos):", cargaHorariaAgente);

    const resultadoPorDia = {};

    dadosConsolidados.forEach((agente, index) => {
        console.log(`[DEBUG] Estrutura do agente ${index}:`, agente);

        const data = agente.data;
        const tempoLogado = parseFloat(agente.tempoTotalLoginHoras) * 3600; // Convertendo tempo logado de horas para segundos
        const tempoPausa = agente.tempoTotalPausaSegundos || 0;  // Pausa já está em segundos

        console.log(`[DEBUG] Processando agente: Data=${data}, TempoLogado=${tempoLogado}, TempoPausa=${tempoPausa}`);

        if (!resultadoPorDia[data]) {
            resultadoPorDia[data] = {
                tempoLogadoTotal: 0,
                tempoPausaTotal: 0,
                cargaHorariaTotal: 0,
                agentes: new Set()
            };
        }

        resultadoPorDia[data].tempoLogadoTotal += tempoLogado;
        resultadoPorDia[data].tempoPausaTotal += tempoPausa;
        resultadoPorDia[data].agentes.add(agente.nome);

        // console.log(`[DEBUG] Acumulado para ${data}: TempoLogadoTotal=${resultadoPorDia[data].tempoLogadoTotal}, TempoPausaTotal=${resultadoPorDia[data].tempoPausaTotal}, Agentes=${resultadoPorDia[data].agentes.size}`);
    });

    // Após agregar os dados, calculamos a carga horária e a disponibilidade diária
    Object.keys(resultadoPorDia).forEach(data => {
        const diaData = resultadoPorDia[data];
        diaData.cargaHorariaTotal = cargaHorariaAgente * diaData.agentes.size;

        // Revisando a fórmula de disponibilidade
        const tempoDisponivel = diaData.cargaHorariaTotal - diaData.tempoPausaTotal;
        const disponibilidadePercentual = tempoDisponivel > 0 ? ((diaData.tempoLogadoTotal / tempoDisponivel) * 100) : 0;
        diaData.disponibilidadePercentual = disponibilidadePercentual.toFixed(2);

        // console.log(`[DEBUG] Resultados para ${data}: CargaHorariaTotal=${diaData.cargaHorariaTotal}, TempoDisponivel=${tempoDisponivel}, DisponibilidadePercentual=${diaData.disponibilidadePercentual}`);
    });

    // console.log("[DEBUG] Resultado final por dia:", resultadoPorDia);
    return resultadoPorDia;
}






// Listeners de evento e configuração inicial
document.addEventListener('DOMContentLoaded', function() {
    const searchButton = document.getElementById('kpiSearchButton');
    if (searchButton) {
        searchButton.addEventListener('click', function() {
            toggleButtons(false);
            buscarDadosAgentes(false);
        });
    }
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
        XLSX.writeFile(wb, 'KPI1101 - % Ocupação.xlsx');
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
