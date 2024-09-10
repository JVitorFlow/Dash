// Importando funções de módulos auxiliares
import { mostrarLoadingSpinner, esconderLoadingSpinner, calcularPercentualAbandono, cumpreMeta } from './helpers.js';
import { getCookie, csrftoken, formatDateToISOStringWithMilliseconds, filterSeries, waitForChartRender } from './utils.js';
import { renderizarGraficoColunas, renderizarGraficoPonteiro, renderizarGraficoTendencia } from './kpi_charts.js';


export let dadosProcessadosPonteiro1104 = {};

export function processarDadosParaGraficoPonteiro1104(dados) {
    // Processar os dados com base na função existente processarDadosKPI1104
    const dadosProcessados = processarDadosKPI1104(dados);

    const resultado = {};

    // Iterando sobre os dados processados por URA
    Object.keys(dadosProcessados.porURA).forEach(ura => {
        // Normaliza o nome da URA para evitar inconsistências
        const uraNormalizada = ura.trim().toUpperCase();

        const uraData = dadosProcessados.porURA[ura];

        // Calcular a porcentagem de chamadas abandonadas com mais de 1 minuto
        const chamadasAbandonadasSuperior1Min = uraData.desistenciasSuperior1Min;
        const porcentagem = uraData.ligacoesRecebidas > 0 
            ? (chamadasAbandonadasSuperior1Min / uraData.ligacoesRecebidas) * 100 
            : 0;

        // Log do cálculo da porcentagem
        // console.log(`[processarDadosParaGraficoPonteiro1104] URA: ${uraNormalizada}, Porcentagem Abandonadas > 1 Min: ${porcentagem.toFixed(2)}%`);

        // Armazenar o resultado para cada hospital/URA
        resultado[uraNormalizada] = {
            ligacoesRecebidas: uraData.ligacoesRecebidas,
            chamadasAbandonadasSuperior1Min: chamadasAbandonadasSuperior1Min,
            porcentagem: porcentagem.toFixed(2) // Armazenar com duas casas decimais
        };
    });

    // Log do final do processamento
    // console.log("[processarDadosParaGraficoPonteiro1104] Processamento concluído. Resultado:", resultado);

    dadosProcessadosPonteiro1104 = resultado;

    // Retorna o resultado para ser usado na função de renderização do gráfico de ponteiro
    return resultado;
}





// Função principal para buscar o indicador de chamadas abandonadas
export function buscarIndicadorChamadasAbandonadas(isManualSearch = false) {
    let startDate, endDate;

    // Se for uma busca manual, usa as datas especificadas
    if (isManualSearch) {
        console.log("[INFO] Realizando busca manual para KPI 1104");

        startDate = document.getElementById('startDateAbandonadasKPI1104').value;
        endDate = document.getElementById('endDateAbandonadasKPI1104').value;

        // console.log('[INFO] Datas selecionadas manualmente');
        // console.log('[DEBUG] Data de Início original:', startDate);
        // console.log('[DEBUG] Data de Fim original:', endDate);

        if (!startDate || !endDate) {
            alert('Por favor, selecione ambas as datas.');
            console.error("[ERROR] Data de início ou fim não selecionada.");
            toggleButtons(true);  // Habilita os botões em caso de erro
            return;
        }

        startDate = formatDateToISOStringWithMilliseconds(startDate);
        endDate = formatDateToISOStringWithMilliseconds(endDate);

        //console.log("[DEBUG] Data de Início convertida para ISO:", startDate);
        //console.log("[DEBUG] Data de Fim convertida para ISO:", endDate);
    } else {
        // Caso contrário, usa mês e ano para gerar as datas automaticamente
        const selectedKPI = document.getElementById('kpiSelector').value;
        //console.log("[INFO] KPI Selecionado:", selectedKPI);

        if (selectedKPI === '1104') {
            console.log("[INFO] Realizando busca automática para KPI 1104");

            const selectedMes = document.getElementById('mesSelector').value;
            const selectedAno = document.getElementById('anoSelector').value;

            if (selectedMes && selectedAno) {
                startDate = `${selectedAno}-${selectedMes}-01T00:00:00`;
                endDate = new Date(selectedAno, selectedMes, 0).toISOString().replace(/T.*/, 'T23:59:59');

                //console.log("[INFO] Datas geradas para o KPI 11.04");
                //console.log("[DEBUG] Data de Início:", startDate);
                //console.log("[DEBUG] Data de Fim:", endDate);
            } else {
                alert('Por favor, selecione o mês e o ano.');
                console.error("[ERROR] Mês ou ano não selecionado.");
                toggleButtons(true);  // Habilita os botões em caso de erro
                return;
            }
        } else {
            // console.log("[INFO] KPI não é 1104, abortando buscarIndicadorChamadasAbandonadas.");
            toggleButtons(true); // Habilita os botões se o KPI não for 1104
            return;
        }
    }

    // console.log("[DEBUG] Iniciando requisição para buscar dados de chamadas abandonadas");

    mostrarLoadingSpinner('loadingSpinnerAbandonadasKPI1104');
    mostrarLoadingSpinner('loadingSpinnerMedidores');

    const payload = {
        dtStart: startDate,
        dtFinish: endDate
    };

    const urlElement = document.getElementById('tempoChamadasAbandonadasKPI1104');
    if (urlElement) {
        const urlApi = urlElement.textContent.trim();
        //console.log("[INFO] URL da API carregada:", urlApi);

        fetch(urlApi, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken
            },
            body: JSON.stringify(payload)
        })
        .then(response => response.json())
        .then(data => {
            // console.log('Dados recebidos do JSON:', JSON.stringify(data, null, 2));

            if (data.errcode === 0) {
                console.log("Processando os dados para o gráfico KPI 1104")
                const dadosProcessados = processarDadosKPI1104(data.ura_performance);
                // Renderizando o gráfico KPI 1104 (passo seguinte)
                renderizarGraficoColunas('1104',dadosProcessados);

                // Processando os dados para o gráfico de ponteiro KPI 1104
                const dadosProcessadosPonteiro = processarDadosParaGraficoPonteiro1104(data.ura_performance);
                renderizarGraficoPonteiro('1104', dadosProcessadosPonteiro);


                const dadosProcessadostendencia1104 = processarDadosParaGraficoTendencia1104(data.ura_performance);
                // Renderizar o gráfico de tendência para o KPI 1104
                renderizarGraficoTendencia('1104', dadosProcessadostendencia1104);


                //console.log('Chamando renderizarTabelaIndicadorAbandonadas');
                renderizarTabelaIndicadorAbandonadas(data.ura_performance);
                document.getElementById('exportExcelAbandonadasKP1104').style.display = 'block';
                seriesSelectorContainer.style.display = 'block';
            } else {
                console.error('Erro ao buscar dados:', data.errmsg);
            }
        })
        .catch(error => {
            //console.error('Erro na requisição:', error);
        })
        .finally(() => {
            esconderLoadingSpinner('loadingSpinnerAbandonadasKPI1104');
            esconderLoadingSpinner('loadingSpinnerMedidores');
            toggleButtons(true); // Habilita os botões após a requisição
        });
    } else {
        //console.error("[ERROR] Elemento 'tempoChamadasAbandonadasKPI1104' não encontrado no documento.");
        toggleButtons(true); // Habilita os botões em caso de erro
    }
}

function processarDadosKPI1104(dados) {
    const resultado = {
        geral: {
            desistenciasInferior1Min: 0,
            desistenciasSuperior1Min: 0,
            ligacoesRecebidas: 0,
        },
        porURA: {}
    };

    dados.forEach(item => {
        if (item.tipo_atendimento === "Externo") {
            const desistenciasInferior1Min = item.abandonadas_cognitiva_ate_um_minuto || 0;
            const desistenciasSuperior1Min = item.abandonadas_cognitiva_acima_um_minuto || 0;

            // Calculando ligações recebidas como a soma de atendidas e abandonadas
            const ligacoesAtendidas = item.atendidas_cognitiva || 0;
            const ligacoesRecebidas = ligacoesAtendidas + (item.abandonadas_cognitiva || 0);

            // Atualizando os totais gerais
            resultado.geral.desistenciasInferior1Min += desistenciasInferior1Min;
            resultado.geral.desistenciasSuperior1Min += desistenciasSuperior1Min;
            resultado.geral.ligacoesRecebidas += ligacoesRecebidas;

            // Normalizando as URAs para agrupamento
            let uraNormalizada;
            if (item.ura.startsWith("HSOR")) {
                uraNormalizada = "HSOR";
            } else if (item.ura.startsWith("HM")) {
                uraNormalizada = "HM v3";
            } else if (item.ura.startsWith("HSJC")) {
                uraNormalizada = "HSJC v3";
            } else {
                uraNormalizada = item.ura; // Mantém o nome original se não for uma das URAs listadas
            }

            if (!resultado.porURA[uraNormalizada]) {
                resultado.porURA[uraNormalizada] = {
                    desistenciasInferior1Min: 0,
                    desistenciasSuperior1Min: 0,
                    ligacoesRecebidas: 0
                };
            }

            resultado.porURA[uraNormalizada].desistenciasInferior1Min += desistenciasInferior1Min;
            resultado.porURA[uraNormalizada].desistenciasSuperior1Min += desistenciasSuperior1Min;
            resultado.porURA[uraNormalizada].ligacoesRecebidas += ligacoesRecebidas;
        }
    });

    // console.log("Dados processados para o gráfico KPI 1104:", resultado);
    return resultado;
}



// Função para desabilitar/habilitar botões
function toggleButtons(enable) {
    const searchButton = document.getElementById('kpiSearchButton');
    const filterButton = document.getElementById('filterAbandonadasButtonKPI1104');
    searchButton.disabled = !enable;
    filterButton.disabled = !enable;
}

// Função para renderizar a tabela de resultados
function renderizarTabelaIndicadorAbandonadas(dados) {
    const resultado = document.getElementById('resultadoAbandonadasKPI1104');

    // Destrói a tabela existente antes de criar uma nova
    if ($.fn.DataTable.isDataTable('#resultadoAbandonadasKPI1104 table')) {
        $('#resultadoAbandonadasKPI1104 table').DataTable().clear().destroy();
    }

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
            const tr = document.createElement('tr');
            const abandonadasAteUmMinuto = item.abandonadas_cognitiva_ate_um_minuto || 0;
            const abandonadasAcimaUmMinuto = item.abandonadas_cognitiva_acima_um_minuto || 0;

            
            // Calcula as ligações atendidas e recebidas separadamente
            const ligacoesAtendidas = item.atendidas_cognitiva || 0;
            const ligacoesRecebidas = ligacoesAtendidas + (item.abandonadas_cognitiva || 0);

            // **Novo Cálculo de Percentual de Abandono**
            const percentualAbandono = calcularPercentualAbandono(abandonadasAcimaUmMinuto, ligacoesRecebidas);

            const metaAbandono = 1;
            const metaCumprida = percentualAbandono < metaAbandono ? 'SIM' : 'NÃO';


            tr.innerHTML = `
                <td>${item.ura.replace(' v3', '') || 'N/A'}</td>
                <td>${item.tipo_atendimento || 'N/A'}</td>
                <td>${item.data || 'N/A'}</td>
                <td>Abandonadas Sup. 1min: ${abandonadasAcimaUmMinuto}</td>
                <td>Abandonadas Inf. 1min: ${abandonadasAteUmMinuto}</td>
                <td>Ligações atendidas: ${ligacoesAtendidas} / Ligações recebidas: ${ligacoesRecebidas} / Percentual de Abandono (Sup. 1 min): ${percentualAbandono}%</td>
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

function processarDadosParaGraficoTendencia1104(dados) {
    const resultadoTendencia = [];

    // Mapeamento das URAs para combinar dados com e sem o sufixo "v3"
    const mapeamentoURAs = {
        "HM": "HM v3",
        "HM v3": "HM v3",
        "HSJC": "HSJC v3",
        "HSJC v3": "HSJC v3",
        "HSOR v3": "HSOR",
        "HSOR": "HSOR"
    };

    // Inicializa um objeto para armazenar os dados agregados por data
    const dadosPorData = {};

    dados.forEach(item => {
        if (item.tipo_atendimento === "Externo") {
            const data = item.data;
            const uraKey = mapeamentoURAs[item.ura] || item.ura;

            // Inicializa os contadores para a data específica, se ainda não existir
            if (!dadosPorData[data]) {
                dadosPorData[data] = {
                    data,
                    ligacoesRecebidas: 0,
                    desistenciasSuperior1Min: 0
                };
            }

            // Calcula o número de ligações recebidas e atualiza os contadores
            const ligacoesRecebidas = (item.atendidas_cognitiva || 0) + (item.abandonadas_cognitiva || 0);
            dadosPorData[data].ligacoesRecebidas += ligacoesRecebidas;
            dadosPorData[data].desistenciasSuperior1Min += item.abandonadas_cognitiva_acima_um_minuto || 0;
        }
    });

    // Calcula o percentual de eficiência para cada data
    for (const data in dadosPorData) {
        const item = dadosPorData[data];
        const percentual = item.desistenciasSuperior1Min === 0 
            ? 100 // Se não houver desistências, a eficiência é 100%
            : 100 - ((item.desistenciasSuperior1Min / item.ligacoesRecebidas) * 100);

        // Adiciona o resultado ao array final
        resultadoTendencia.push({
            data: item.data,
            percentual: percentual.toFixed(2) // Arredonda para duas casas decimais
        });
    }

    // Ordena os resultados por data
    resultadoTendencia.sort((a, b) => new Date(a.data) - new Date(b.data));

    //console.log('Estrutura final de dados processados para tendência 1104:', JSON.stringify(resultadoTendencia, null, 2));
    return resultadoTendencia;
}



// Adiciona os listeners para os botões de filtro e exportação
document.addEventListener('DOMContentLoaded', function() {

    const seriesSelectorContainer = document.getElementById('seriesSelectorContainer');
    const seriesSelector = document.getElementById('seriesSelector');
    const searchButton = document.getElementById('kpiSearchButton');
    const filterButton = document.getElementById('filterAbandonadasButtonKPI1104');


    // Evento para o seletor de série
    if (seriesSelector) {
        seriesSelector.addEventListener('change', function() {
            // console.log('[DEBUG] Série selecionada:', seriesSelector.value);
            // Certifique-se de que o seletor de séries existe e vincule o evento
            if (seriesSelector) {
                seriesSelector.addEventListener('change', function() {
                    waitForChartRender(filterSeries);  // Chama filterSeries quando o gráfico estiver pronto
                });
            } else {
               // console.error("[ERROR] Elemento 'seriesSelector' não encontrado.");
            }
            
        });
    } else {
        //console.error("[ERROR] Elemento 'seriesSelector' não encontrado.");
    }


    // Função para verificar o KPI selecionado e mostrar/esconder o seletor de séries
    function verificarSeletorSeries() {
        // console.log('[DEBUG] Verificando seletor de séries');

        const selectedKPI = kpiSelector.value.trim();

        // Sempre esconde o seletor no início
        seriesSelectorContainer.style.display = 'none';

        // Mostra o seletor apenas se o KPI for o 1102 (ou outros KPIs que necessitem) e após carregar os dados
        if (selectedKPI === '1104') {
            // console.log('[DEBUG] KPI 1102 selecionado');
            seriesSelectorContainer.style.display = 'none'; // Esconde inicialmente
        }
    }

    // Evento para verificar o KPI selecionado
    const kpiSelector = document.getElementById('kpiSelector');
    if (kpiSelector) {
        kpiSelector.addEventListener('change', verificarSeletorSeries);
    } else {
        // console.error('Elemento kpiSelector não encontrado.');
    }


    // Listener para o botão "Aplicar Filtro" (usa datas manuais)
    filterButton.addEventListener('click', function() {
        toggleButtons(false); // Desabilita os botões enquanto a requisição está em andamento
        buscarIndicadorChamadasAbandonadas(true);
    });

    // Listener para o botão "Buscar" (usa mês e ano)
    searchButton.addEventListener('click', function() {
        toggleButtons(false); // Desabilita os botões enquanto a requisição está em andamento
        buscarIndicadorChamadasAbandonadas(false);
    });

    // Listener para exportar a tabela para Excel
    document.getElementById('exportExcelAbandonadasKP1104').addEventListener('click', function() {
        const tabela = document.querySelector('#resultadoAbandonadasKPI1104 table');
        const wb = XLSX.utils.table_to_book(tabela, { sheet: "Sheet1" });
        XLSX.writeFile(wb, 'KPI1104 - % Abandono de chamadas externas.xlsx');
    });

    // Inicializando o Flatpickr para a seleção de datas
    flatpickr("#startDateAbandonadasKPI1104", {
        enableTime: true,
        dateFormat: "d/m/Y H:i",
        time_24hr: true,
        allowInput: true,
        locale: "pt"
    });

    flatpickr("#endDateAbandonadasKPI1104", {
        enableTime: true,
        dateFormat: "d/m/Y H:i",
        time_24hr: true,
        allowInput: true,
        locale: "pt"
    });
});

