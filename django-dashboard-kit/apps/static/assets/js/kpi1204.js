// Importando funções de módulos auxiliares
import { mostrarLoadingSpinner, esconderLoadingSpinner, calcularPercentualAbandono, cumpreMeta } from './helpers.js';
import { getCookie, csrftoken, formatDateToISOStringWithMilliseconds, filterSeries, waitForChartRender } from './utils.js';
import { renderizarGraficoColunas } from './kpi_charts.js';

// Função principal para buscar o indicador de chamadas abandonadas internas
export async function buscarIndicadorChamadasAbandonadasInternas(isManualSearch = false) {
    let startDate, endDate;

    // Se for uma busca manual, usa as datas especificadas
    if (isManualSearch) {
        console.log("[INFO] Realizando busca manual para KPI 1204");

        startDate = document.getElementById('startDateAbandonadasInternasKPI1204').value;
        endDate = document.getElementById('endDateAbandonadasInternasKPI1204').value;

        console.log('[INFO] Datas selecionadas manualmente');
        console.log('[DEBUG] Data de Início original:', startDate);
        console.log('[DEBUG] Data de Fim original:', endDate);

        if (!startDate || !endDate) {
            alert('Por favor, selecione ambas as datas.');
            console.error("[ERROR] Data de início ou fim não selecionada.");
            toggleButtons(true);  // Habilita os botões em caso de erro
            return;
        }

        startDate = formatDateToISOStringWithMilliseconds(startDate);
        endDate = formatDateToISOStringWithMilliseconds(endDate);

        console.log("[DEBUG] Data de Início convertida para ISO:", startDate);
        console.log("[DEBUG] Data de Fim convertida para ISO:", endDate);
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
                console.log('Chamando renderizarTabelaIndicadorAbandonadasInternas');
                const dadosProcessados = processarDadosKPI1204(data.ura_performance);
                renderizarGraficoColunas('1204', dadosProcessados);
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

            if (!resultado.porURA[item.ura]) {
                resultado.porURA[item.ura] = {
                    desistenciasInferior1Min: 0,
                    desistenciasSuperior1Min: 0,
                    ligacoesRecebidas: 0
                };
            }

            resultado.porURA[item.ura].desistenciasInferior1Min += desistenciasInferior1Min;
            resultado.porURA[item.ura].desistenciasSuperior1Min += desistenciasSuperior1Min;
            resultado.porURA[item.ura].ligacoesRecebidas += ligacoesRecebidas;
        }
    });

    console.log("Dados processados para o gráfico KPI 1204:", resultado);
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

// Adiciona os listeners para os botões de filtro e exportação
document.addEventListener('DOMContentLoaded', function() {

    const seriesSelectorContainer = document.getElementById('seriesSelectorContainer');
    const seriesSelector = document.getElementById('seriesSelector');
    const searchButton = document.getElementById('kpiSearchButton');
    const filterButton = document.getElementById('filterAbandonadasInternasButtonKPI1204');


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
                console.error("[ERROR] Elemento 'seriesSelector' não encontrado.");
            }
            
        });
    } else {
        console.error("[ERROR] Elemento 'seriesSelector' não encontrado.");
    }


    // Função para verificar o KPI selecionado e mostrar/esconder o seletor de séries
    function verificarSeletorSeries() {
        // console.log('[DEBUG] Verificando seletor de séries');

        const selectedKPI = kpiSelector.value.trim();

        // Sempre esconde o seletor no início
        seriesSelectorContainer.style.display = 'none';

        // Mostra o seletor apenas se o KPI for o 1102 (ou outros KPIs que necessitem) e após carregar os dados
        if (selectedKPI === '1204') {
            // console.log('[DEBUG] KPI 1102 selecionado');
            seriesSelectorContainer.style.display = 'none'; // Esconde inicialmente
        }
    }

    // Evento para verificar o KPI selecionado
    kpiSelector.addEventListener('change', verificarSeletorSeries);

    // Listener para o botão "Aplicar Filtro" (usa datas manuais)
    filterButton.addEventListener('click', function() {
        toggleButtons(false); // Desabilita os botões enquanto a requisição está em andamento
        buscarIndicadorChamadasAbandonadasInternas(true);
    });

    // Listener para o botão "Buscar" (usa mês e ano)
    searchButton.addEventListener('click', function() {
        toggleButtons(false); // Desabilita os botões enquanto a requisição está em andamento
        buscarIndicadorChamadasAbandonadasInternas(false);
    });

    // Listener para exportar a tabela para Excel
    document.getElementById('exportExcelAbandonadasInternasKPI1204').addEventListener('click', function() {
        const tabela = document.querySelector('#resultadoAbandonadasInternasKPI1204 table');
        const wb = XLSX.utils.table_to_book(tabela, { sheet: "Sheet1" });
        XLSX.writeFile(wb, 'indicadores_abandonadas_internas.xlsx');
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