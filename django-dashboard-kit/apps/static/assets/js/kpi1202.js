// Importando funções de módulos auxiliares
import { mostrarLoadingSpinner, esconderLoadingSpinner, calcularPercentual, cumpreMeta } from './helpers.js';
import { getCookie, csrftoken, formatDateToISOStringWithMilliseconds, filterSeries, waitForChartRender } from './utils.js';
import { renderizarGraficoColunas } from './kpi_charts.js';

// Função principal para buscar o indicador de tempo de espera
export async function buscarIndicadorTempoEsperaKPI1202(isManualSearch = false) {
    let startDate, endDate;

    if (isManualSearch) {
        // console.log("[INFO] Realizando busca manual");

        startDate = document.getElementById('startDateEsperaKPI1202').value;
        endDate = document.getElementById('endDateEsperaKPI1202').value;

        if (!startDate || !endDate) {
            alert('Por favor, selecione ambas as datas.');
            console.error("[ERROR] Data de início ou fim não selecionada.");
            toggleButtons(true);  // Habilita os botões em caso de erro
            return;
        }

        startDate = formatDateToISOStringWithMilliseconds(startDate);
        endDate = formatDateToISOStringWithMilliseconds(endDate);
    } else {
        // console.log("[INFO] Realizando busca automática");

        const selectedMes = document.getElementById('mesSelector').value;
        const selectedAno = document.getElementById('anoSelector').value;

        if (selectedMes && selectedAno) {
            startDate = `${selectedAno}-${selectedMes}-01T00:00:00`;
            endDate = new Date(selectedAno, selectedMes, 0).toISOString().replace(/T.*/, 'T23:59:59');

            // console.log("[INFO] Datas geradas automaticamente para o KPI 12.02");
        } else {
            alert('Por favor, selecione o mês e o ano.');
            console.error("[ERROR] Mês ou ano não selecionado.");
            toggleButtons(true);  // Habilita os botões em caso de erro
            return;
        }
    }

    try {
        // console.log("[DEBUG] Data de Início:", startDate);
        // console.log("[DEBUG] Data de Fim:", endDate);

        mostrarLoadingSpinner('loadingSpinnerEsperaKPI1202');
        mostrarLoadingSpinner('loadingSpinnerMedidores');

        const payload = { dtStart: startDate, dtFinish: endDate };
        const urlElement = document.getElementById('tempoEsperaAtendimento1minutoInternoKPI1202');

        if (urlElement) {
            const urlApi = urlElement.textContent.trim();
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
                // console.log('Chamando renderizarTabelaIndicadorEspera');
                const dadosProcessados = processarDadosParaGraficoKPI1202(data.ura_performance);
                renderizarGraficoColunas('1202', dadosProcessados);
                renderizarTabelaIndicadorEspera(data.ura_performance);
                document.getElementById('exportExcelEsperaKPI1202').style.display = 'block';
                seriesSelectorContainer.style.display = 'block';
            } else {
                console.error('Erro ao buscar dados:', data.errmsg);
            }
        } else {
            console.error("[ERROR] Elemento 'tempoEsperaAtendimento1minutoInternoKPI1202' não encontrado no documento.");
        }
    } catch (error) {
        //console.error('Erro na requisição:', error);
    } finally {
        esconderLoadingSpinner('loadingSpinnerEsperaKPI1202');
        esconderLoadingSpinner('loadingSpinnerMedidores');
        toggleButtons(true);
    }
}


// Função para renderizar a tabela de resultados
function renderizarTabelaIndicadorEspera(dados) {
    // console.log('Executando renderizarTabelaIndicadorEspera com dados:', dados);
    const resultado = document.getElementById('resultadoEsperaKPI1202');
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
            // console.log(`Processando ligação interna para URA: ${item.ura}, Data: ${item.data}`);

            const percentual = calcularPercentual(item.atendidas_cognitiva_ate_um_minuto, item.atendidas_cognitiva);
            const metaCumprida = cumpreMeta(percentual);

            const uraName = item.ura.replace(' v3', '');

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${uraName || 'N/A'}</td>
                <td>${item.tipo_atendimento || 'N/A'}</td>
                <td>Dia: ${item.data || 'N/A'}</td>
                <td>Qtd Espera Superior 1min: ${item.atendidas_cognitiva_acima_um_minuto || 0}</td>
                <td>Qtd Espera Inf. 1min / Atend direto: ${item.atendidas_cognitiva_ate_um_minuto || 0}</td>
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

// Função para processar os dados para o gráfico do KPI 1202
function processarDadosParaGraficoKPI1202(dados) {
    const resultado = {
        geral: {
            ligacoesRecebidas: 0,
            atendidasInferior1Min: 0,
            atendidasSuperior1Min: 0
        },
        porURA: {}
    };

    dados.forEach(item => {
        if (item.tipo_atendimento === "Interno") {
            const ligacoesRecebidas = (item.atendidas_cognitiva || 0) + (item.abandonadas_cognitiva || 0);

            // Processamento Geral
            resultado.geral.ligacoesRecebidas += ligacoesRecebidas;
            resultado.geral.atendidasInferior1Min += item.atendidas_cognitiva_ate_um_minuto || 0;
            resultado.geral.atendidasSuperior1Min += item.atendidas_cognitiva_acima_um_minuto || 0;

            // Processamento por URA
            if (!resultado.porURA[item.ura]) {
                resultado.porURA[item.ura] = {
                    ligacoesRecebidas: 0,
                    atendidasInferior1Min: 0,
                    atendidasSuperior1Min: 0
                };
            }

            resultado.porURA[item.ura].ligacoesRecebidas += ligacoesRecebidas;
            resultado.porURA[item.ura].atendidasInferior1Min += item.atendidas_cognitiva_ate_um_minuto || 0;
            resultado.porURA[item.ura].atendidasSuperior1Min += item.atendidas_cognitiva_acima_um_minuto || 0;
        }
    });

    // console.log('Dados processados para o gráfico KPI 1202:', JSON.stringify(resultado, null, 2));
    return resultado;
}


// Função para habilitar/desabilitar botões
function toggleButtons(enable = true) {
    const buttons = document.querySelectorAll('#filterEsperaKPI1202Button');
    buttons.forEach(button => {
        button.disabled = !enable;
    });
}

document.addEventListener('DOMContentLoaded', function() {

    const seriesSelectorContainer = document.getElementById('seriesSelectorContainer');
    const seriesSelector = document.getElementById('seriesSelector');
    const kpiSelector = document.getElementById('kpiSelector');
    const filterButton = document.getElementById('filterEsperaKPI1202Button');


    // Evento para o seletor de série
    if (seriesSelector) {
        seriesSelector.addEventListener('change', function() {
            // console.log('[DEBUG] Série selecionada:', seriesSelector.value);
            // Certifique-se de que o seletor de séries existe e vincule o evento
            if (seriesSelector) {
                seriesSelector.addEventListener('change', filterSeries);
                // // console.log('[DEBUG] Evento de mudança de série vinculado');
            } else {
                console.error("[ERROR] Elemento 'seriesSelector' não encontrado.");
            }
            
        });
    } else {
        console.error("[ERROR] Elemento 'seriesSelector' não encontrado.");
    }

    // Função para verificar o KPI selecionado e mostrar/esconder o seletor de séries
    function verificarSeletorSeries() {
        // // console.log('[DEBUG] Verificando seletor de séries');

        const selectedKPI = kpiSelector.value.trim();

        // Sempre esconde o seletor no início
        seriesSelectorContainer.style.display = 'none';

        // Mostra o seletor apenas se o KPI for o 1102 (ou outros KPIs que necessitem) e após carregar os dados
        if (selectedKPI === '1202') {
            // // console.log('[DEBUG] KPI 1102 selecionado');
            seriesSelectorContainer.style.display = 'none'; // Esconde inicialmente
        }
    }

    // Evento para verificar o KPI selecionado
    kpiSelector.addEventListener('change', verificarSeletorSeries);

    filterButton.addEventListener('click', function() {
        toggleButtons(false); // Desabilita os botões enquanto a requisição está em andamento
        buscarIndicadorTempoEsperaKPI1202(true);
    });

    document.getElementById('exportExcelEsperaKPI1202').addEventListener('click', function() {
        const tabela = document.querySelector('#resultadoEsperaKPI1202 table');
        const wb = XLSX.utils.table_to_book(tabela, { sheet: "Sheet1" });
        XLSX.writeFile(wb, 'indicadores_espera.xlsx');
    });

    flatpickr("#startDateEsperaKPI1202", {
        enableTime: true,
        dateFormat: "d/m/Y H:i",
        time_24hr: true,
        allowInput: true,
        locale: "pt"
    });

    flatpickr("#endDateEsperaKPI1202", {
        enableTime: true,
        dateFormat: "d/m/Y H:i",
        time_24hr: true,
        allowInput: true,
        locale: "pt"
    });
});
