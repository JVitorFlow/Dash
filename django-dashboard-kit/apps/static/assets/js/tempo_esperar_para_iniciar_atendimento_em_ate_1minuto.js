// Importando funções de módulos auxiliares
import { mostrarLoadingSpinner, esconderLoadingSpinner, calcularPercentual, cumpreMeta } from './helpers.js';
import { getCookie, csrftoken, formatDateToISOStringWithMilliseconds, filterSeries, waitForChartRender } from './utils.js';
import { renderizarGraficoColunas, renderizarGraficoPonteiro } from './kpi_charts.js';


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
    console.log("[processarDadosParaGraficoPonteiro] Processamento concluído. Resultado:", resultado);

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
        // console.log("[DEBUG] Data de Início:", startDate);
        // console.log("[DEBUG] Data de Fim:", endDate);

        mostrarLoadingSpinner('loadingSpinnerEsperaKPI1102');
        mostrarLoadingSpinner('loadingSpinnerMedidores');

        const payload = { dtStart: startDate, dtFinish: endDate };
        const urlElement = document.getElementById('tempoEsperaAtendimento1minutoExternoKPI1102');

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
                // console.log("[DEBUG] Processando dados para o gráfico");
                const dadosParaGraficoPonteiro = processarDadosParaGraficoPonteiro(data.ura_performance);
                console.log("[INFO] Dados processados para o gráfico de ponteiro:", dadosParaGraficoPonteiro);
                renderizarGraficoPonteiro('1102', dadosParaGraficoPonteiro);


                const dadosProcessados = processarDadosParaGrafico(data.ura_performance);
                renderizarGraficoColunas('1102', dadosProcessados);
                renderizarTabelaIndicadorEspera(data.ura_performance);
                document.getElementById('exportExcelEsperaKP1102').style.display = 'block';
                seriesSelectorContainer.style.display = 'block';
            } else {
                console.error('Erro ao buscar dados:', data.errmsg);
            }
        } else {
            console.error("[ERROR] Elemento 'tempoEsperaAtendimento1minutoExternoKPI1102' não encontrado no documento.");
        }
    } catch (error) {
        console.error('Erro na requisição:', error);
    } finally {
        esconderLoadingSpinner('loadingSpinnerEsperaKPI1102');
        esconderLoadingSpinner('loadingSpinnerMedidores');
        toggleButtons(true);
    }
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
            resultado.geral.atendidasInferior1Min += item.atendidas_cognitiva_ate_um_minuto || 0;
            resultado.geral.atendidasSuperior1Min += item.atendidas_cognitiva_acima_um_minuto || 0;

            // Processamento por URA
            let uraKey = item.ura;

            // Se a URA for "HSOR v3" ou "HSOR", combinar os dados em uma única chave "HSOR"
            if (uraKey === "HSOR v3" || uraKey === "HSOR") {
                uraKey = "HSOR";
            }

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
    console.log('Estrutura final de dados processados:', JSON.stringify(resultado, null, 2));
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
        if (selectedKPI === '1102') {
            // console.log('[DEBUG] KPI 1102 selecionado');
            seriesSelectorContainer.style.display = 'none'; // Esconde inicialmente
        }
    }

    // Evento para verificar o KPI selecionado
    kpiSelector.addEventListener('change', verificarSeletorSeries);

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

    // Chama a verificação inicial ao carregar a página
    verificarSeletorSeries();
});
