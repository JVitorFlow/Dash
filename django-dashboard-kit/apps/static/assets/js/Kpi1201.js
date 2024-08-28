import { mostrarLoadingSpinner, esconderLoadingSpinner, calcularPercentual, cumpreMeta } from './helpers.js';
import { renderizarGraficoColunas, renderizarGraficoPonteiro } from './kpi_charts.js';
import { getCookie, csrftoken, formatDateToISOStringWithMilliseconds, filterSeries, waitForChartRender } from './utils.js';



export let dadosProcessadosPonteiro1201 = {};

export function processarDadosParaGraficoPonteiroKPI1201(dados) {
    console.log("[DEBUG] Dados recebidos na função processarDadosParaGraficoPonteiroKPI1201:", dados);

    // Processar os dados usando a função de processamento que criamos
    const dadosProcessados = processarDadosParaGraficoBarrasKPI1201(dados);
    console.log("[DEBUG] Dados processados por processarDadosParaGraficoBarrasKPI1201:", dadosProcessados);

    const resultado = {};

    // Iterando sobre os dados processados por URA
    Object.keys(dadosProcessados.porURA).forEach(ura => {
        const uraData = dadosProcessados.porURA[ura];
        console.log(`[DEBUG] Processando dados da URA: ${ura}`, uraData);

        // Calcular o tempo médio de atendimento em segundos
        const tempoMedio = uraData.totalLigacoes > 0 ? (uraData.tempoTotal / uraData.totalLigacoes).toFixed(2) : 0;

        // Calcular a porcentagem baseada no tempo médio
        let porcentagem;
        if (tempoMedio <= 180) {
            // Dentro da meta
            porcentagem = 100;
        } else {
            // Fora da meta
            porcentagem = (180 / tempoMedio) * 100;
        }

        // Log do cálculo do tempo médio e da porcentagem
        console.log(`[processarDadosParaGraficoPonteiroKPI1201] URA: ${ura}, Tempo Médio (segundos): ${tempoMedio}, Porcentagem: ${porcentagem.toFixed(2)}%`);

        // Armazenar o resultado para cada hospital/URA
        resultado[ura] = {
            totalLigacoes: uraData.totalLigacoes,
            tempoMedio: tempoMedio, // Armazenar o tempo médio com duas casas decimais
            porcentagem: porcentagem.toFixed(2) // Armazenar a porcentagem com duas casas decimais
        };
    });

    // Log do final do processamento
    console.log("[processarDadosParaGraficoPonteiroKPI1201] Processamento concluído. Resultado:", resultado);

    // Armazenando o resultado na variável global
    dadosProcessadosPonteiro1201 = resultado;
    console.log("[DEBUG] Variável global dadosProcessadosPonteiro1201 após processamento:", dadosProcessadosPonteiro1201);

    // Retorna o resultado para ser usado na função de renderização do gráfico de colunas
    return resultado;
}



// Função principal para buscar o indicador de tempo médio por atendente
export function buscarIndicadorTempoMedio(isManualSearch = false) {
    let startDate, endDate;

    // Caso a busca seja manual, utilize as datas dos campos manuais
    if (isManualSearch) {
        console.log("[INFO] Realizando busca manual");
        startDate = document.getElementById('startDateKPI1201').value;
        endDate = document.getElementById('endDateKPI1201').value;

        if (!startDate || !endDate) {
            alert('Por favor, selecione ambas as datas.');
            console.error("[ERROR] Data de início ou fim não selecionada.");
            return;
        }

        // Formatar as datas para ISO 8601 com milissegundos
        startDate = formatDateToISOStringWithMilliseconds(startDate);
        endDate = formatDateToISOStringWithMilliseconds(endDate);
    } else {
        // Caso não seja busca manual, considere o KPI 1201 com mês/ano
        const selectedKPI = document.getElementById('kpiSelector').value;
        //console.log("[INFO] KPI Selecionado:", selectedKPI);

        if (selectedKPI !== '1201') {
            //console.log("[INFO] KPI não é 1201, abortando buscarIndicadorTempoMedio.");
            return;
        }

        console.log("[INFO] Entrou no bloco de lógica para KPI 1201 (busca automática)");
        
        const selectedMes = document.getElementById('mesSelector').value;
        const selectedAno = document.getElementById('anoSelector').value;

        if (selectedMes && selectedAno) {
            startDate = `${selectedAno}-${selectedMes}-01T00:00:00`;
            endDate = new Date(selectedAno, selectedMes, 0).toISOString().replace(/T.*/, 'T23:59:59');

            // console.log("[INFO] Datas geradas para o KPI 12.01");
            // console.log("[DEBUG] Data de Início:", startDate);
            // console.log("[DEBUG] Data de Fim:", endDate);
        } else {
            //console.error("[ERROR] Mês ou ano não selecionado.");
            alert('Por favor, selecione o mês e o ano.');
            toggleButtons(true);  // Habilita os botões em caso de erro
            return;
        }
    }

    // console.log("[DEBUG] Data de Início:", startDate);
    // console.log("[DEBUG] Data de Fim:", endDate);

    mostrarLoadingSpinner('loadingSpinnerKPI1201');

    const payload = {
        dtStart: startDate,
        dtFinish: endDate
    };

    const urlElement = document.getElementById('tempoChamadasAbandonadasKPI1104');
    if (urlElement) {
        const urlApi = urlElement.textContent.trim();
        // console.log("[INFO] URL da API carregada:", urlApi);

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
                console.log('Chamando renderizarTabelaIndicadorTempoMedio');
                renderizarTabelaIndicadorTempoMedio(data.ura_performance);
                

                const dadosProcessados = processarDadosParaGraficoBarrasKPI1201(data.ura_performance);
                renderizarGraficoColunas('1201', dadosProcessados);

                const dadosProcessadosPonteiro = processarDadosParaGraficoPonteiroKPI1201(data.ura_performance);
                renderizarGraficoPonteiro('1201', dadosProcessadosPonteiro);

                document.getElementById('exportExcelKPI1201').style.display = 'block';
                seriesSelectorContainer.style.display = 'block';
            } else {
                console.error('Erro ao buscar dados:', data.errmsg);
            }
        })
        .catch(error => {
            console.error('Erro na requisição:', error);
        })
        .finally(() => {
            esconderLoadingSpinner('loadingSpinnerKPI1201');
            toggleButtons(true); // Habilita os botões após a requisição
        });
    } else {
        console.error("[ERROR] Elemento 'tempoMedioServicoAtendenteUrlData' não encontrado no documento.");
        toggleButtons(true); // Habilita os botões em caso de erro
    }
}


// Função para desabilitar/habilitar botões
function toggleButtons(enable) {
    const searchButton = document.getElementById('kpiSearchButton');
    const filterButton = document.getElementById('filterButton');
    searchButton.disabled = !enable;
    filterButton.disabled = !enable;
}

// Função para renderizar a tabela de indicadores de tempo médio
function renderizarTabelaIndicadorTempoMedio(dados) {
    const resultado = document.getElementById('resultadoTempoMedioKPI1201');
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

    dados.forEach(item => {
        if (item.tipo_atendimento === "Interno") {
            const tempoTotal = item.tempo_total_ligacao_cognitiva || 0;
            const atendidas = item.atendidas_cognitiva || 0;
            const tempoMedio = atendidas > 0 ? (tempoTotal / atendidas).toFixed(2) : 0;
            const cumpreMeta = tempoMedio <= 180 ? 'SIM' : 'NÃO';  // Considerando 3 minutos (180 segundos) como meta

            const uraName = item.ura.replace(' v3', '');
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${uraName || 'N/A'}</td>
                <td>${item.tipo_atendimento || 'N/A'}</td>
                <td>ATENDENTE: ${item.ura || 'N/A'}</td>
                <td>${item.data || 'N/A'}</td>
                <td>${item.data || 'N/A'}</td>
                <td>Ligações: ${atendidas} / Tempo médio: ${new Date(tempoMedio * 1000).toISOString().substr(11, 8)}</td>
                <td>${cumpreMeta}</td>
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


function processarDadosParaGraficoBarrasKPI1201(dados) {
    const resultado = {
        geral: {
            tempoTotal: 0,
            totalLigacoes: 0,
            tempoMedio: 0
        },
        porURA: {}
    };

    dados.forEach(item => {
        if (item.tipo_atendimento === "Interno") {
            const tempoTotal = item.tempo_total_ligacao_cognitiva || 0;
            const atendidas = item.atendidas_cognitiva || 0;

            // Processamento Geral
            resultado.geral.tempoTotal += tempoTotal;
            resultado.geral.totalLigacoes += atendidas;

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
                    tempoTotal: 0,
                    totalLigacoes: 0,
                    tempoMedio: 0
                };
            }

            resultado.porURA[uraNormalizada].tempoTotal += tempoTotal;
            resultado.porURA[uraNormalizada].totalLigacoes += atendidas;
        }
    });

    // Calcular o tempo médio geral
    resultado.geral.tempoMedio = resultado.geral.totalLigacoes > 0 
        ? resultado.geral.tempoTotal / resultado.geral.totalLigacoes
        : 0;

    // Calcular o tempo médio por URA
    Object.keys(resultado.porURA).forEach(ura => {
        const uraData = resultado.porURA[ura];
        uraData.tempoMedio = uraData.totalLigacoes > 0 
            ? uraData.tempoTotal / uraData.totalLigacoes
            : 0;
    });

    console.log('Dados processados para o gráfico KPI 1201:', JSON.stringify(resultado, null, 2));
    return resultado;
}



// Listeners para botões
document.addEventListener('DOMContentLoaded', function() {
    const seriesSelectorContainer = document.getElementById('seriesSelectorContainer');
    const seriesSelector = document.getElementById('seriesSelector');
    const kpiSelector = document.getElementById('kpiSelector');
    const filterButton = document.getElementById('filterTempoMedioButtonKPI1201');

    // Evento para o seletor de série
    if (seriesSelector) {
        seriesSelector.addEventListener('change', function() {
            // console.log('[DEBUG] Série selecionada:', seriesSelector.value);
            // Certifique-se de que o seletor de séries existe e vincule o evento
            if (seriesSelector) {
                seriesSelector.addEventListener('change', filterSeries);
                console.log('[DEBUG] Evento de mudança de série vinculado');
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
        if (selectedKPI === '1201') {
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

    document.getElementById('exportExcelKPI1201').addEventListener('click', function() {
        const tabela = document.querySelector('#resultadoTempoMedioKPI1201 table');
        const wb = XLSX.utils.table_to_book(tabela, { sheet: "Sheet1" });
        XLSX.writeFile(wb, 'indicadores_tempo_medio.xlsx');
    });

    flatpickr("#startDateKPI1201", {
        enableTime: true,
        dateFormat: "d/m/Y H:i",
        time_24hr: true,
        allowInput: true,
        locale: "pt"
    });

    flatpickr("#endDateKPI1201", {
        enableTime: true,
        dateFormat: "d/m/Y H:i",
        time_24hr: true,
        allowInput: true,
        locale: "pt"
    });
});
