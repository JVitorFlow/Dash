// Importando funções de módulos auxiliares
import { mostrarLoadingSpinner, esconderLoadingSpinner, calcularPercentualAbandono, cumpreMeta } from './helpers.js';
import { getCookie, csrftoken, formatDateToISOStringWithMilliseconds, filterSeries, waitForChartRender } from './utils.js';
import { renderizarGraficoColunas, renderizarGraficoPonteiro, renderizarGraficoTendencia } from './kpi_charts.js';


export let dadosProcessadosPonteiro1204 = {};

export function processarDadosParaGraficoPonteiro1204(dados) {
    // Processar os dados com base na função existente processarDadosKPI1204
    const dadosProcessados = processarDadosKPI1204(dados);

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
        console.log(`[processarDadosParaGraficoPonteiro1204] URA: ${uraNormalizada}, Porcentagem Abandonadas > 1 Min: ${porcentagem.toFixed(2)}%`);

        // Armazenar o resultado para cada hospital/URA
        resultado[uraNormalizada] = {
            ligacoesRecebidas: uraData.ligacoesRecebidas,
            chamadasAbandonadasSuperior1Min: chamadasAbandonadasSuperior1Min,
            porcentagem: porcentagem.toFixed(2) // Armazenar com duas casas decimais
        };
    });

    // Log do final do processamento
    // console.log("[processarDadosParaGraficoPonteiro1204] Processamento concluído. Resultado:", resultado);

    dadosProcessadosPonteiro1204 = resultado;

    // Retorna o resultado para ser usado na função de renderização do gráfico de ponteiro
    return resultado;
}




// Função principal para buscar o indicador de chamadas abandonadas internas
export async function buscarIndicadorChamadasAbandonadasInternas(isManualSearch = false) {
    let startDate, endDate;

    // Se for uma busca manual, usa as datas especificadas
    if (isManualSearch) {
        console.log("[INFO] Realizando busca manual para KPI 1204");

        startDate = document.getElementById('startDateAbandonadasInternasKPI1204').value;
        endDate = document.getElementById('endDateAbandonadasInternasKPI1204').value;

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

        // console.log("[DEBUG] Data de Início convertida para ISO:", startDate);
        // console.log("[DEBUG] Data de Fim convertida para ISO:", endDate);
    } else {
        // Caso contrário, usa mês e ano para gerar as datas automaticamente
        const selectedKPI = document.getElementById('kpiSelector').value;
        console.log("[INFO] KPI Selecionado:", selectedKPI);

        if (selectedKPI === '1204') {
            console.log("[INFO] Realizando busca automática para KPI 1204");

            const selectedMes = document.getElementById('mesSelector').value;
            const selectedAno = document.getElementById('anoSelector').value;

            if (selectedMes && selectedAno) {
                startDate = `${selectedAno}-${selectedMes}-01T00:00:00`;
                endDate = new Date(selectedAno, selectedMes, 0).toISOString().replace(/T.*/, 'T23:59:59');

                console.log("[INFO] Datas geradas para o KPI 12.04");
                console.log("[DEBUG] Data de Início:", startDate);
                console.log("[DEBUG] Data de Fim:", endDate);
            } else {
                alert('Por favor, selecione o mês e o ano.');
                console.error("[ERROR] Mês ou ano não selecionado.");
                toggleButtons(true);  // Habilita os botões em caso de erro
                return;
            }
        } else {
            console.log("[INFO] KPI não é 1204, abortando buscarIndicadorChamadasAbandonadasInternas.");
            toggleButtons(true); // Habilita os botões se o KPI não for 1204
            return;
        }
    }

    try {
        mostrarLoadingSpinner('loadingSpinnerAbandonadasInternasKPI1204');
        mostrarLoadingSpinner('loadingSpinnerMedidores');

        const payload = {
            dtStart: startDate,
            dtFinish: endDate
        };

        const urlElement = document.getElementById('tempoChamadasAbandonadasInternasKPI1204');
        if (urlElement) {
            const urlApi = urlElement.textContent.trim();
            console.log("[INFO] URL da API carregada:", urlApi);

            const response = await fetch(urlApi, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrftoken
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (data.errcode === 0) {
                console.log('Dados recebidos do JSON:', JSON.stringify(data, null, 2));
                console.log('Chamando renderizarTabelaIndicadorAbandonadasInternas');

                const dadosProcessados = processarDadosKPI1204(data.ura_performance);
                renderizarGraficoColunas('1204', dadosProcessados);

                const dadosProcessadosPonteiro = processarDadosParaGraficoPonteiro1204(data.ura_performance);
                renderizarGraficoPonteiro('1204', dadosProcessadosPonteiro);

                const dadosProcessadostendencia1204 = processarDadosParaGraficoTendencia1204(data.ura_performance);
                // Renderizar o gráfico de tendência para o KPI 1104
                renderizarGraficoTendencia('1204', dadosProcessadostendencia1204);

                renderizarTabelaIndicadorAbandonadasInternas(data.ura_performance);
                document.getElementById('exportExcelAbandonadasInternasKPI1204').style.display = 'block';
                seriesSelectorContainer.style.display = 'block';
            } else {
                console.error('Erro ao buscar dados:', data.errmsg);
            }
        } else {
            console.error("[ERROR] Elemento 'tempoChamadasAbandonadasInternasKPI1204' não encontrado no documento.");
        }
    } catch (error) {
        console.error('Erro na requisição:', error);
    } finally {
        esconderLoadingSpinner('loadingSpinnerAbandonadasInternasKPI1204');
        esconderLoadingSpinner('loadingSpinnerMedidores');
        toggleButtons(true); // Habilita os botões após a requisição
    }
}

function processarDadosKPI1204(dados) {
    const resultado = {
        geral: {
            desistenciasInferior1Min: 0,
            desistenciasSuperior1Min: 0,
            ligacoesRecebidas: 0,
        },
        porURA: {}
    };

    dados.forEach(item => {
        if (item.tipo_atendimento === "Interno") {
            const desistenciasInferior1Min = item.abandonadas_cognitiva_ate_um_minuto || 0;
            const desistenciasSuperior1Min = item.abandonadas_cognitiva_acima_um_minuto || 0;

            // Calculando ligações recebidas como a soma de atendidas e abandonadas
            const ligacoesAtendidas = item.atendidas_cognitiva || 0;
            const ligacoesRecebidas = ligacoesAtendidas + (item.abandonadas_cognitiva || 0);

            // Atualizando os totais gerais
            resultado.geral.desistenciasInferior1Min += desistenciasInferior1Min;
            resultado.geral.desistenciasSuperior1Min += desistenciasSuperior1Min;
            resultado.geral.ligacoesRecebidas += ligacoesRecebidas;


            // Normalizando as URAs para serem agrupadas
            let uraNormalizada;
            if (item.ura.startsWith("HM")) {
                uraNormalizada = "HM v3";
            } else if (item.ura.startsWith("HSJC")) {
                uraNormalizada = "HSJC v3";
            } else if (item.ura.startsWith("HSOR")) {
                uraNormalizada = "HSOR";
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

    // console.log("Dados processados para o gráfico KPI 1204:", resultado);
    return resultado;
}



// Função para desabilitar/habilitar botões
function toggleButtons(enable) {
    const searchButton = document.getElementById('kpiSearchButton');
    const filterButton = document.getElementById('filterAbandonadasInternasButtonKPI1204');
    searchButton.disabled = !enable;
    filterButton.disabled = !enable;
}

// Função para renderizar a tabela de resultados
function renderizarTabelaIndicadorAbandonadasInternas(dados) {
    const resultado = document.getElementById('resultadoAbandonadasInternasKPI1204');

    // Destrói a tabela existente antes de criar uma nova
    if ($.fn.DataTable.isDataTable('#resultadoAbandonadasInternasKPI1204 table')) {
        $('#resultadoAbandonadasInternasKPI1204 table').DataTable().clear().destroy();
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

    // Filtra e processa apenas ligações internas
    dados.forEach(item => {
        if (item.tipo_atendimento === "Interno") {
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


function processarDadosParaGraficoTendencia1204(dados) {
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
        if (item.tipo_atendimento === "Interno") {
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

    // console.log('Estrutura final de dados processados para tendência 1204:', JSON.stringify(resultadoTendencia, null, 2));
    return resultadoTendencia;
}

// Adiciona os listeners para os botões de filtro e exportação
document.addEventListener('DOMContentLoaded', function() {

    const seriesSelectorContainer = document.getElementById('seriesSelectorContainer');
    const seriesSelector = document.getElementById('seriesSelector');
    const searchButton = document.getElementById('kpiSearchButton');
    const filterButton = document.getElementById('filterAbandonadasInternasButtonKPI1204');
    const exportButton = document.getElementById('exportExcelAbandonadasInternasKPI1204'); // Botão de exportação

    // Função para exportar a tabela para Excel
    function exportToExcel() {
        const tabela = document.querySelector('#resultadoAbandonadasInternasKPI1204 table');
        const wb = XLSX.utils.table_to_book(tabela, { sheet: "Sheet1" });
        XLSX.writeFile(wb, 'KPI1204_indicadores_abandonadas_internas.xlsx');
    }

    // Remove event listener de exportação se já estiver adicionado
    exportButton.replaceWith(exportButton.cloneNode(true)); // Remove qualquer listener duplicado
    const newExportButton = document.getElementById('exportExcelAbandonadasInternasKPI1204');

    // Adiciona o listener de clique para exportar para Excel (somente uma vez)
    newExportButton.addEventListener('click', exportToExcel);

    // Evento para o seletor de série
    if (seriesSelector) {
        seriesSelector.addEventListener('change', function() {
            if (seriesSelector) {
                seriesSelector.addEventListener('change', function() {
                    waitForChartRender(filterSeries);  // Chama filterSeries quando o gráfico estiver pronto
                });
            } else {
                console.error("[ERROR] Elemento 'seriesSelector' não encontrado.");
            }
        });
    } else {
        console.error("[ERROR] Elemento 'seriesSelector' não encontrado.");
    }

    // Função para verificar o KPI selecionado e mostrar/esconder o seletor de séries
    function verificarSeletorSeries() {
        const selectedKPI = kpiSelector.value.trim();
        seriesSelectorContainer.style.display = 'none';

        if (selectedKPI === '1204') {
            seriesSelectorContainer.style.display = 'none';
        }
    }

    // Verificar seletor de séries ao mudar o KPI selecionado
    kpiSelector.addEventListener('change', verificarSeletorSeries);

    // Listener para o botão "Aplicar Filtro" (usa datas manuais)
    filterButton.addEventListener('click', function() {
        toggleButtons(false);
        buscarIndicadorChamadasAbandonadasInternas(true);
    });

    // Listener para o botão "Buscar" (usa mês e ano)
    searchButton.addEventListener('click', function() {
        toggleButtons(false);
        buscarIndicadorChamadasAbandonadasInternas(false);
    });

    // Inicializando o Flatpickr para a seleção de datas
    flatpickr("#startDateAbandonadasInternasKPI1204", {
        enableTime: true,
        dateFormat: "d/m/Y H:i",
        time_24hr: true,
        allowInput: true,
        locale: "pt"
    });

    flatpickr("#endDateAbandonadasInternasKPI1204", {
        enableTime: true,
        dateFormat: "d/m/Y H:i",
        time_24hr: true,
        allowInput: true,
        locale: "pt"
    });
});


