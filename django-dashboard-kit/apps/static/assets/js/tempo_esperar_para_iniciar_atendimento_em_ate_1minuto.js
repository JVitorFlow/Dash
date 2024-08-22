// Importando funções de módulos auxiliares
import { mostrarLoadingSpinner, esconderLoadingSpinner, calcularPercentual, cumpreMeta } from './helpers.js';
import { getCookie, csrftoken, formatDateToISOStringWithMilliseconds } from './utils.js';
import { renderizarGraficoColunas } from './kpi_charts.js';



export function filterSeries() {
    const selectedSeries = document.getElementById("seriesSelector").value;
    const chart = Highcharts.charts.find(chart => chart.renderTo.id === 'colunasChartContainer');
    
    chart.series.forEach(function(series) {
        if (selectedSeries === 'all') {
            series.setVisible(true, false);
        } else {
            series.setVisible(series.name.includes(selectedSeries), false);
        }
    });
    chart.redraw();
}

// Função principal para buscar o indicador de tempo de espera
export function buscarIndicadorTempoEspera(isManualSearch = false) {
    let startDate, endDate;

    if (isManualSearch) {
        // Busca manual, utiliza as datas especificadas manualmente
        console.log("[INFO] Realizando busca manual");

        startDate = document.getElementById('startDateEsperaKPI1102').value;
        endDate = document.getElementById('endDateEsperaKPI1102').value;

        if (!startDate || !endDate) {
            alert('Por favor, selecione ambas as datas.');
            console.error("[ERROR] Data de início ou fim não selecionada.");
            toggleButtons(true);  // Habilita os botões em caso de erro
            return;
        }

        startDate = formatDateToISOStringWithMilliseconds(startDate);
        endDate = formatDateToISOStringWithMilliseconds(endDate);
    } else {
        // Busca automática, utiliza mês/ano para gerar as datas
        console.log("[INFO] Realizando busca automática");

        const selectedMes = document.getElementById('mesSelector').value;
        const selectedAno = document.getElementById('anoSelector').value;

        if (selectedMes && selectedAno) {
            startDate = `${selectedAno}-${selectedMes}-01T00:00:00`;
            endDate = new Date(selectedAno, selectedMes, 0).toISOString().replace(/T.*/, 'T23:59:59');

            console.log("[INFO] Datas geradas automaticamente para o KPI 1102");
        } else {
            alert('Por favor, selecione o mês e o ano.');
            console.error("[ERROR] Mês ou ano não selecionado.");
            toggleButtons(true);  // Habilita os botões em caso de erro
            return;
        }
    }

    console.log("[DEBUG] Data de Início:", startDate);
    console.log("[DEBUG] Data de Fim:", endDate);

    mostrarLoadingSpinner('loadingSpinnerEsperaKPI1102');
    mostrarLoadingSpinner('loadingSpinnerMedidores');
    
    const payload = {
        dtStart: startDate,
        dtFinish: endDate
    };


    const urlElement = document.getElementById('tempoEsperaAtendimento1minutoExternoKPI1102');
    if (urlElement) {
        const urlApi = urlElement.textContent.trim();
        console.log("[INFO] URL da API carregada:", urlApi);

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
            console.log('Dados recebidos do JSON:', JSON.stringify(data, null, 2));

            if (data.errcode === 0) {

                console.log('Chamando processarDadosParaGrafico');
                const dadosProcessados = processarDadosParaGrafico(data.ura_performance);
                console.log('Dados processados para o gráfico:', dadosProcessados);

                
                renderizarGraficoColunas('1102', dadosProcessados);

                console.log('Chamando renderizarTabelaIndicadorEspera');
                renderizarTabelaIndicadorEspera(data.ura_performance);
                document.getElementById('exportExcelEsperaKP1102').style.display = 'block';
                // Após carregar os dados, mostrar o seletor de séries se necessário
                seriesSelectorContainer.style.display = 'block';
            } else {
                console.error('Erro ao buscar dados:', data.errmsg);
            }
        })
        .catch(error => {
            console.error('Erro na requisição:', error);
        })
        .finally(() => {
            esconderLoadingSpinner('loadingSpinnerEsperaKPI1102');
            esconderLoadingSpinner('loadingSpinnerMedidores');
            
            toggleButtons(true); // Habilita os botões após a requisição
        });
    } else {
        console.error("[ERROR] Elemento 'tempoEsperaAtendimento1minutoExternoKPI1102' não encontrado no documento.");
        toggleButtons(true); // Habilita os botões em caso de erro
    }
}

// Função para renderizar a tabela de resultados
function renderizarTabelaIndicadorEspera(dados) {
    console.log('Executando renderizarTabelaIndicadorEspera com dados:', dados);
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
            console.log(`Processando ligação externa para URA: ${item.ura}, Data: ${item.data}`);

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

// Função para processar os dados para o gráfico
function processarDadosParaGrafico(dados) {
    const resultado = {
        geral: {
            ligacoesRecebidas: 0,
            atendidasInferior1Min: 0,
            atendidasSuperior1Min: 0
        },
        porURA: {}
    };

    dados.forEach(item => {
        if (item.tipo_atendimento === "Externo") {
            const ligacoesRecebidas = (item.atendidas_cognitiva || 0) + (item.abandonadas_cognitiva || 0);

            // Processamento Geral
            resultado.geral.ligacoesRecebidas += ligacoesRecebidas;
            resultado.geral.atendidasInferior1Min += item.quantidade_ligacoes_atendidas_ate_um_minuto || 0;
            resultado.geral.atendidasSuperior1Min += item.quantidade_ligacoes_atendidas_acima_um_minuto || 0;

            // Processamento por URA
            if (!resultado.porURA[item.ura]) {
                resultado.porURA[item.ura] = {
                    ligacoesRecebidas: 0,
                    atendidasInferior1Min: 0,
                    atendidasSuperior1Min: 0
                };
            }

            resultado.porURA[item.ura].ligacoesRecebidas += ligacoesRecebidas;
            resultado.porURA[item.ura].atendidasInferior1Min += item.quantidade_ligacoes_atendidas_ate_um_minuto || 0;
            resultado.porURA[item.ura].atendidasSuperior1Min += item.quantidade_ligacoes_atendidas_acima_um_minuto || 0;
        }
    });

    // Debug da estrutura
    console.log('Estrutura final de dados processados:', JSON.stringify(resultado, null, 2));
    return resultado;
}




// Função para habilitar/desabilitar botões
function toggleButtons(enable = true) {
    const buttons = document.querySelectorAll('#filterEspera1minutoButton');
    buttons.forEach(button => {
        button.disabled = !enable;
    });
}

document.addEventListener('DOMContentLoaded', function() {


    const seriesSelectorContainer = document.getElementById('seriesSelectorContainer');

    // Função para verificar o KPI selecionado e mostrar/esconder o seletor de séries
    function verificarSeletorSeries() {
        const selectedKPI = document.getElementById('kpiSelector').value.trim();

        // Sempre esconde o seletor no início
        seriesSelectorContainer.style.display = 'none';

        // Mostra o seletor apenas se o KPI for o 1102 (ou outros KPIs que necessitem) e após carregar os dados
        if (selectedKPI === '1102') {
            seriesSelectorContainer.style.display = 'none'; // Esconde inicialmente
        }

    }

    // Verifica o KPI selecionado no carregamento da página
    verificarSeletorSeries();
    // Adiciona o evento para verificar o KPI selecionado
    document.getElementById('kpiSelector').addEventListener('change', verificarSeletorSeries);

    // Evento para filtrar as séries
    document.getElementById('seriesSelector').addEventListener('change', filterSeries);

    // Evento para o botão de buscar
    const filterButton = document.getElementById('filterEspera1minutoButton');
    filterButton.addEventListener('click', function() {
        toggleButtons(false); // Desabilita os botões enquanto a requisição está em andamento
        buscarIndicadorTempoEspera(true);
    });

    document.getElementById('exportExcelEsperaKP1102').addEventListener('click', function() {
        const tabela = document.querySelector('#resultadoEsperaKPI1102 table');
        const wb = XLSX.utils.table_to_book(tabela, { sheet: "Sheet1" });
        XLSX.writeFile(wb, 'indicadores_espera.xlsx');
    });

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

});
