// Importando funções de módulos auxiliares
import { mostrarLoadingSpinner, esconderLoadingSpinner, calcularPercentual, cumpreMeta } from './helpers.js';
import { getCookie, csrftoken, formatDateToISOStringWithMilliseconds, filterSeries, waitForChartRender } from './utils.js';
import { renderizarGraficoColunas, renderizarGraficoPonteiro, renderizarGraficoTendencia } from './kpi_charts.js';


export let dadosProcessadosPonteiro = {}; 


export function processarDadosParaGraficoPonteiro(dados) {
    // Primeiro, processa os dados como faz a função `processarDadosParaGrafico`
    const dadosProcessados = processarDadosParaGrafico(dados);

    const resultado = {};

    // Iterando sobre os dados processados por URA
    Object.keys(dadosProcessados.porURA).forEach(ura => {
        const uraData = dadosProcessados.porURA[ura];

        // Calcular a porcentagem de ligações atendidas em mais de 1 minuto
        const atendidasSuperior1Min = uraData.ligacoesRecebidas - uraData.atendidasSuperior1Min;
        const porcentagem = uraData.ligacoesRecebidas > 0 ? (atendidasSuperior1Min / uraData.ligacoesRecebidas) * 100 : 0;

        // Log do cálculo da porcentagem
        console.log(`[processarDadosParaGraficoPonteiro] URA: ${ura}, Porcentagem Atendidas > 1 Min: ${porcentagem.toFixed(2)}%`);

        // Armazenar o resultado para cada hospital/URA
        resultado[ura] = {
            ligacoesRecebidas: uraData.ligacoesRecebidas,
            atendidasSuperior1Min: atendidasSuperior1Min,
            porcentagem: porcentagem.toFixed(2) // Armazenar com duas casas decimais
        };
    });

    // Log do final do processamento
    // console.log("[processarDadosParaGraficoPonteiro] Processamento concluído. Resultado:", resultado);

    dadosProcessadosPonteiro = resultado;

    // Retorna o resultado para ser usado na função de renderização do gráfico de ponteiro
    return resultado;
}


// Função principal para buscar o indicador de tempo de espera
export async function buscarIndicadorTempoEspera(isManualSearch = false) {
    let startDate, endDate;

    if (isManualSearch) {
        startDate = document.getElementById('startDateEsperaKPI1102').value;
        endDate = document.getElementById('endDateEsperaKPI1102').value;

        if (!startDate || !endDate) {
            alert('Por favor, selecione ambas as datas.');
            console.error("[ERROR] Data de início ou fim não selecionada.");
            toggleButtons(true);
            return;
        }

        startDate = formatDateToISOStringWithMilliseconds(startDate);
        endDate = formatDateToISOStringWithMilliseconds(endDate);
    } else {
        const selectedMes = document.getElementById('mesSelector').value;
        const selectedAno = document.getElementById('anoSelector').value;

        if (selectedMes && selectedAno) {
            startDate = `${selectedAno}-${selectedMes}-01T00:00:00`;
            endDate = new Date(selectedAno, selectedMes, 0).toISOString().replace(/T.*/, 'T23:59:59');
        } else {
            alert('Por favor, selecione o mês e o ano.');
            console.error("[ERROR] Mês ou ano não selecionado.");
            toggleButtons(true);
            return;
        }
    }

    try {
        /* console.log("[INFO] Iniciando busca de Indicador de Tempo de Espera");
        console.log("[DEBUG] Data de Início:", startDate);
        console.log("[DEBUG] Data de Fim:", endDate); */

        mostrarLoadingSpinner('loadingSpinnerEsperaKPI1102');
        mostrarLoadingSpinner('loadingSpinnerMedidores');

        const payload = { dtStart: startDate, dtFinish: endDate };
        // console.log("[DEBUG] Payload enviado:", JSON.stringify(payload));

        const urlElement = document.getElementById('tempoEsperaAtendimento1minutoExternoKPI1102');

        if (urlElement) {
            const urlApi = urlElement.textContent.trim();
            // console.log("[INFO] URL da API chamada:", urlApi);

            const response = await fetch(urlApi, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrftoken
                },
                body: JSON.stringify(payload)
            });

            console.log("[DEBUG] Status da resposta da API:", response.status);

            if (response.ok) {
                const data = await response.json();
                console.log("[DEBUG] Dados recebidos da API:", data);

                if (data.errcode === 0) {
                    // console.log("[INFO] Processando dados para o gráfico");
                    const dadosParaGraficoPonteiro = processarDadosParaGraficoPonteiro(data.ura_performance);
                    // console.log("[INFO] Dados processados para o gráfico de ponteiro:", dadosParaGraficoPonteiro);
                    renderizarGraficoPonteiro('1102', dadosParaGraficoPonteiro);

                    const dadosParaGraficoTendencia = processarDadosParaGraficoTendencia(data.ura_performance);
                    renderizarGraficoTendencia('1102', dadosParaGraficoTendencia);

                    const dadosProcessados = processarDadosParaGrafico(data.ura_performance);
                    renderizarGraficoColunas('1102', dadosProcessados);
                    renderizarTabelaIndicadorEspera(data.ura_performance);
                    document.getElementById('exportExcelEsperaKP1102').style.display = 'block';
                    seriesSelectorContainer.style.display = 'block';
                } else {
                    console.error("[ERROR] Erro ao buscar dados:", data.errmsg);
                }
            } else {
                console.error("[ERROR] Falha na resposta da API:", response.status, response.statusText);
            }
        } else {
            console.error("[ERROR] Elemento 'tempoEsperaAtendimento1minutoExternoKPI1102' não encontrado no documento.");
        }
    } catch (error) {
        console.error("[ERROR] Erro na requisição:", error);
    } finally {
        esconderLoadingSpinner('loadingSpinnerEsperaKPI1102');
        esconderLoadingSpinner('loadingSpinnerMedidores');
        toggleButtons(true);
        console.log("[INFO] Finalizando busca de Indicador de Tempo de Espera");
    }
}

// Função para processar dados para o gráfico de tendência (KPI 1102)
function processarDadosParaGraficoTendencia(dados) {
    const resultadoTendencia = [];

    // Mapeamento das URAs para combinar dados, mas mantendo o sufixo "v3" nas chaves finais
    const mapeamentoURAs = {
        "HM": "HM v3",
        "HM v3": "HM v3",
        "HSJC": "HSJC v3",
        "HSJC v3": "HSJC v3",
        "HSOR v3": "HSOR",
        "HSOR": "HSOR"
    };

    // Inicializa um objeto para armazenar os dados por data
    const dadosPorData = {};

    dados.forEach(item => {
        if (item.tipo_atendimento === "Externo") {
            const data = item.data;  // Aqui assumimos que `data` está presente e no formato desejado
            const uraKey = mapeamentoURAs[item.ura] || item.ura;

            if (!dadosPorData[data]) {
                dadosPorData[data] = {
                    data,
                    ligacoesRecebidas: 0,
                    atendidasInferior1Min: 0,
                    atendidasSuperior1Min: 0
                };
            }

            const ligacoesRecebidas = (item.atendidas_cognitiva || 0) + (item.abandonadas_cognitiva || 0);

            dadosPorData[data].ligacoesRecebidas += ligacoesRecebidas;
            dadosPorData[data].atendidasInferior1Min += item.atendidas_cognitiva_ate_um_minuto || 0;
            dadosPorData[data].atendidasSuperior1Min += item.atendidas_cognitiva_acima_um_minuto || 0;
        }
    });

    // Converte o objeto para um array de resultados
    for (const data in dadosPorData) {
        const item = dadosPorData[data];
        const percentual = (item.atendidasInferior1Min / item.ligacoesRecebidas) * 100 || 0;
        resultadoTendencia.push({
            data: item.data,
            percentual: percentual.toFixed(2) // Arredondar para duas casas decimais
        });
    }

    // Ordena o array de resultados por data
    resultadoTendencia.sort((a, b) => new Date(a.data) - new Date(b.data));

    // Debug da estrutura final
    //console.log('Estrutura final de dados processados para tendência 1102:', JSON.stringify(resultadoTendencia, null, 2));
    return resultadoTendencia;
}


// Função para renderizar a tabela de resultados
function renderizarTabelaIndicadorEspera(dados) {
    // console.log('Executando renderizarTabelaIndicadorEspera com dados:', dados);
    const resultado = document.getElementById('resultadoEsperaKPI1102');
    resultado.innerHTML = ''; // Limpa o conteúdo anterior

    if (!dados || dados.length === 0) {
        resultado.innerHTML = '<p>Nenhum dado encontrado para o intervalo de datas selecionado.</p>';
        return;
    }

    const table = document.createElement('table');
    table.classList.add('table', 'table-striped', 'table-hover', 'table-bordered');
    table.innerHTML = `
        <thead>
            <tr>
                <th>URA</th>
                <th>Localidade</th>
                <th>Detalhamento</th>
                <th>Início</th>
                <th>Fim</th>
                <th>Medição</th>
                <th>Cumpre Meta?</th>
            </tr>
        </thead>
        <tbody></tbody>
    `;

    const tbody = table.querySelector('tbody');

    // Filtra e processa apenas ligações externas
    dados.forEach(item => {
        if (item.tipo_atendimento === "Externo") {
            // console.log(`Processando ligação externa para URA: ${item.ura}, Data: ${item.data}`);

            const percentual = calcularPercentual(item.atendidas_cognitiva_ate_um_minuto, item.atendidas_cognitiva);
            const metaCumprida = cumpreMeta(percentual);

            const uraName = item.ura.replace(' v3', '');

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${uraName || 'N/A'}</td>
                <td>${item.tipo_atendimento || 'N/A'}</td>
                <td>Dia: ${item.data || 'N/A'}</td>
                <td>Qtd Espera Superior 1min: ${item.atendidas_cognitiva_acima_um_minuto || 0}</td>
                <td>Qtd Espera Inf.1min / Atend direto: ${item.atendidas_cognitiva_ate_um_minuto || 0}</td>
                <td>Ligações atendidas: ${item.atendidas_cognitiva || 0} / Atingimento: ${percentual}%</td>
                <td>${metaCumprida}</td>
            `;
            tbody.appendChild(tr);
        }
    });

    resultado.appendChild(table);

    try {
        $(table).DataTable({
            "pageLength": 14,
            "lengthMenu": [5, 10, 25, 50, 100]
        });
    } catch (error) {
        console.error('Erro ao inicializar DataTables:', error);
    }
}

function processarDadosParaGrafico(dados) {
    const resultado = {
        geral: {
            ligacoesRecebidas: 0,
            atendidasInferior1Min: 0,
            atendidasSuperior1Min: 0
        },
        porURA: {}
    };

    // Mapeamento das URAs para combinar dados, mas mantendo o sufixo "v3" nas chaves finais
    const mapeamentoURAs = {
        "HM": "HM v3",
        "HM v3": "HM v3",
        "HSJC": "HSJC v3",
        "HSJC v3": "HSJC v3",
        "HSOR v3": "HSOR",
        "HSOR": "HSOR"
    };

    dados.forEach(item => {
        if (item.tipo_atendimento === "Externo") {
            const ligacoesRecebidas = (item.atendidas_cognitiva || 0) + (item.abandonadas_cognitiva || 0);

            // Processamento Geral
            resultado.geral.ligacoesRecebidas += ligacoesRecebidas;
            resultado.geral.atendidasInferior1Min += item.atendidas_cognitiva_ate_um_minuto || 0;
            resultado.geral.atendidasSuperior1Min += item.atendidas_cognitiva_acima_um_minuto || 0;

            // Processamento por URA
            let uraKey = item.ura;

            // Ajusta a chave URA usando o mapeamento para combinações, mas mantendo o sufixo "v3" quando aplicável
            uraKey = mapeamentoURAs[uraKey] || uraKey;

            if (!resultado.porURA[uraKey]) {
                resultado.porURA[uraKey] = {
                    ligacoesRecebidas: 0,
                    atendidasInferior1Min: 0,
                    atendidasSuperior1Min: 0
                };
            }

            resultado.porURA[uraKey].ligacoesRecebidas += ligacoesRecebidas;
            resultado.porURA[uraKey].atendidasInferior1Min += item.atendidas_cognitiva_ate_um_minuto || 0;
            resultado.porURA[uraKey].atendidasSuperior1Min += item.atendidas_cognitiva_acima_um_minuto || 0;
        }
    });

    // Debug da estrutura final
    // console.log('Estrutura final de dados processados:', JSON.stringify(resultado, null, 2));
    return resultado;
}



// Função para habilitar/desabilitar botões
function toggleButtons(enable = true) {
    // console.log('[DEBUG] toggleButtons chamado com enable:', enable);
    
    const buttons = document.querySelectorAll('#filterEspera1minutoButton');
    buttons.forEach(button => {
        button.disabled = !enable;
    });
}

document.addEventListener('DOMContentLoaded', function() {
    // console.log('[DEBUG] DOMContentLoaded disparado');

    const seriesSelectorContainer = document.getElementById('seriesSelectorContainer');
    const seriesSelector = document.getElementById('seriesSelector');
    const kpiSelector = document.getElementById('kpiSelector');
    const filterButton = document.getElementById('filterEspera1minutoButton');

    // Evento para o seletor de série
    if (seriesSelector) {
        seriesSelector.addEventListener('change', function() {
            // console.log('[DEBUG] Série selecionada:', seriesSelector.value);
            // Certifique-se de que o seletor de séries existe e vincule o evento
            if (seriesSelector) {
                seriesSelector.addEventListener('change', filterSeries);
                // console.log('[DEBUG] Evento de mudança de série vinculado');
            } else {
               // console.error("[ERROR] Elemento 'seriesSelector' não encontrado.");
            }
        });
    } else {
       // console.error("[ERROR] Elemento 'seriesSelector' não encontrado.");
    }

    // Função para verificar o KPI selecionado e mostrar/esconder o seletor de séries
    function verificarSeletorSeries() {
        // console.log('[DEBUG] Verificando seletor de séries');

        const selectedKPI = kpiSelector.value.trim();

        // Sempre esconde o seletor no início
        seriesSelectorContainer.style.display = 'none';

        // Mostra o seletor apenas se o KPI for o 1102 (ou outros KPIs que necessitem) e após carregar os dados
        if (selectedKPI === '1102') {
            // console.log('[DEBUG] KPI 1102 selecionado');
            seriesSelectorContainer.style.display = 'none'; // Esconde inicialmente
        }
    }

    // Evento para verificar o KPI selecionado
    if (kpiSelector) {
        kpiSelector.addEventListener('change', verificarSeletorSeries);
    } else {
        //console.error('Elemento kpiSelector não encontrado.');
    }

    // Evento para o botão de buscar
    filterButton.addEventListener('click', function() {
        // console.log('[DEBUG] Botão de buscar clicado');
        toggleButtons(false); // Desabilita os botões enquanto a requisição está em andamento
        buscarIndicadorTempoEspera(true); // Função que carrega os dados
    });

    // Inicializa o flatpickr
    flatpickr("#startDateEsperaKPI1102", {
        enableTime: true,
        dateFormat: "d/m/Y H:i",
        time_24hr: true,
        allowInput: true,
        locale: "pt"
    });

    flatpickr("#endDateEsperaKPI1102", {
        enableTime: true,
        dateFormat: "d/m/Y H:i",
        time_24hr: true,
        allowInput: true,
        locale: "pt"
    });

    // Evento para exportar a tabela para Excel
    document.getElementById('exportExcelEsperaKP1102').addEventListener('click', function() {
        const tabela = document.querySelector('#resultadoEsperaKPI1102 table');
        if (tabela) {
            const wb = XLSX.utils.table_to_book(tabela, { sheet: "Indicadores KPI 1102" });
            XLSX.writeFile(wb, 'KPI1102 - Atendimento em Menos de 1 Minuto.xlsx');
        } else {
            console.error("[ERROR] Tabela 'resultadoEsperaKPI1102' não encontrada.");
        }
    });

    // Chama a verificação inicial ao carregar a página
    verificarSeletorSeries();
});

