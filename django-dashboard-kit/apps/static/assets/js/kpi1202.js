import { mostrarLoadingSpinner, esconderLoadingSpinner, calcularPercentual, cumpreMeta } from './helpers.js';
import { renderizarGraficoColunas, renderizarGraficoPonteiro, renderizarGraficoTendencia } from './kpi_charts.js';
import { getCookie, csrftoken, formatDateToISOStringWithMilliseconds, filterSeries, waitForChartRender } from './utils.js';


export let dadosProcessadosPonteiro1202 = {};

export function processarDadosParaGraficoPonteiro1202(dados) {
    //console.log("[DEBUG] Dados recebidos na função processarDadosParaGraficoPonteiro1202:", dados);

    // Processar os dados com base na função existente processarDadosParaGraficoKPI1202
    const dadosProcessados = processarDadosParaGraficoKPI1202(dados);
    //console.log("[DEBUG] Dados processados por processarDadosParaGraficoKPI1202:", dadosProcessados);

    const resultado = {};

    // Iterando sobre os dados processados por URA
    Object.keys(dadosProcessados.porURA).forEach(ura => {
        const uraData = dadosProcessados.porURA[ura];
        console.log(`[DEBUG] Processando dados da URA: ${ura}`, uraData);

        // Calcular a porcentagem de atendimentos realizados em menos de 1 minuto
        const atendidasInferior1Min = uraData.atendidasInferior1Min;
        const totalLigacoesRelevantes = uraData.ligacoesRecebidas
        
        let porcentagem;
        if (uraData.atendidasSuperior1Min > 0) {
            // Se houver atendidas superiores a 1 minuto, calcula a porcentagem excluindo essas
            porcentagem = totalLigacoesRelevantes > 0 ? (atendidasInferior1Min / (totalLigacoesRelevantes - uraData.atendidasSuperior1Min)) * 100 : 0;
        } else {
            // Caso contrário, a porcentagem é 100%
            porcentagem = 100;
        }

        // Log do cálculo da porcentagem
        console.log(`[processarDadosParaGraficoPonteiro1202] URA: ${ura}, Porcentagem Atendidas < 1 Min: ${porcentagem.toFixed(2)}%`);

        // Armazenar o resultado para cada hospital/URA
        resultado[ura] = {
            ligacoesRecebidas: uraData.ligacoesRecebidas,
            atendidasInferior1Min: atendidasInferior1Min,
            porcentagem: porcentagem.toFixed(2) // Armazenar com duas casas decimais
        };
    });

    // Log do final do processamento
    //console.log("[processarDadosParaGraficoPonteiro1202] Processamento concluído. Resultado:", resultado);

    // Armazenando o resultado na variável global
    window.dadosProcessadosPonteiro1202 = resultado;
    // console.log("[DEBUG] Variável global dadosProcessadosPonteiro1202 após processamento:", window.dadosProcessadosPonteiro1202);

    // Retorna o resultado para ser usado na função de renderização do gráfico de ponteiro
    return resultado;
}



// Função principal para buscar o indicador de tempo de espera
export function buscarIndicadorTempoEsperaKPI1202(isManualSearch = false) {
    let startDate, endDate;

    if (isManualSearch) {
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
        const selectedKPI = document.getElementById('kpiSelector').value;
        if (selectedKPI === '1202') {
            const selectedMes = document.getElementById('mesSelector').value;
            const selectedAno = document.getElementById('anoSelector').value;

            if (selectedMes && selectedAno) {
                startDate = `${selectedAno}-${selectedMes}-01T00:00:00`;
                endDate = new Date(selectedAno, selectedMes, 0).toISOString().replace(/T.*/, 'T23:59:59');
            } else {
                alert('Por favor, selecione o mês e o ano.');
                console.error("[ERROR] Mês ou ano não selecionado.");
                toggleButtons(true);  // Habilita os botões em caso de erro
                return;
            }
        } else {
            toggleButtons(true); // Habilita os botões se o KPI não for 1202
            return;
        }
    }

    try {
        mostrarLoadingSpinner('loadingSpinnerEsperaKPI1202');
        mostrarLoadingSpinner('loadingSpinnerMedidores');

        const payload = { dtStart: startDate, dtFinish: endDate };
        const urlElement = document.getElementById('tempoEsperaAtendimento1minutoInternoKPI1202');

        if (urlElement) {
            const urlApi = urlElement.textContent.trim();

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
                if (data.errcode === 0) {
                    console.log('Dados recebidos do JSON:', JSON.stringify(data, null, 2));

                    const dadosProcessados = processarDadosParaGraficoKPI1202(data.ura_performance);
                    renderizarGraficoColunas('1202', dadosProcessados);

                    renderizarTabelaIndicadorEspera(data.ura_performance);

                    const dadosProcessadosPonteiro = processarDadosParaGraficoPonteiro1202(data.ura_performance);
                    renderizarGraficoPonteiro('1202', dadosProcessadosPonteiro);


                    const dadosParaGraficoTendencia1202 = processarDadosParaGraficoTendencia(data.ura_performance);
                    renderizarGraficoTendencia('1202', dadosParaGraficoTendencia1202);


                    document.getElementById('exportExcelEsperaKPI1202').style.display = 'block';
                    seriesSelectorContainer.style.display = 'block';
                } else {
                    console.error('Erro ao buscar dados:', data.errmsg);
                }
            })
            .catch(error => {
                console.error('Erro na requisição:', error);
            })
            .finally(() => {
                esconderLoadingSpinner('loadingSpinnerEsperaKPI1202');
                esconderLoadingSpinner('loadingSpinnerMedidores');
                toggleButtons(true);
            });
        } else {
            console.error("[ERROR] Elemento 'tempoEsperaAtendimento1minutoInternoKPI1202' não encontrado no documento.");
            esconderLoadingSpinner('loadingSpinnerEsperaKPI1202');
            esconderLoadingSpinner('loadingSpinnerMedidores');
            toggleButtons(true);
        }
    } catch (error) {
        console.error('Erro na requisição:', error);
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

            // Processamento por URA
            if (!resultado.porURA[uraNormalizada]) {
                resultado.porURA[uraNormalizada] = {
                    ligacoesRecebidas: 0,
                    atendidasInferior1Min: 0,
                    atendidasSuperior1Min: 0
                };
            }

            resultado.porURA[uraNormalizada].ligacoesRecebidas += ligacoesRecebidas;
            resultado.porURA[uraNormalizada].atendidasInferior1Min += item.atendidas_cognitiva_ate_um_minuto || 0;
            resultado.porURA[uraNormalizada].atendidasSuperior1Min += item.atendidas_cognitiva_acima_um_minuto || 0;
        }
    });

    //console.log('Dados processados para o gráfico KPI 1202:', JSON.stringify(resultado, null, 2));
    return resultado;
}


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
        if (item.tipo_atendimento === "Interno") {
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
    console.log('Estrutura final de dados processados para tendência 1202:', JSON.stringify(resultadoTendencia, null, 2));
    return resultadoTendencia;
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
                console.log('[DEBUG] Evento de mudança de série vinculado');
            } else {
               // console.error("[ERROR] Elemento 'seriesSelector' não encontrado.");
            }
            
        });
    } else {
       // console.error("[ERROR] Elemento 'seriesSelector' não encontrado.");
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
        XLSX.writeFile(wb, 'KPI1202 - Têndencia Espera Telefônica (Interno - 1 min).xlsx');
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
