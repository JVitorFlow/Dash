import { dadosProcessadosPonteiro } from './tempo_esperar_para_iniciar_atendimento_em_ate_1minuto.js';
import { dadosProcessadosPonteiro1104 } from './abandono_de_chamadas_externas.js';
import { dadosProcessadosPonteiro1204 } from './kpi1204.js';
import { dadosProcessadosPonteiro1201 } from './Kpi1201.js';

// Função para obter o valor de um cookie específico
export function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

// Constante para armazenar o token CSRF
export const csrftoken = getCookie('csrftoken');


// Função para converter uma data em string para ISO format com milissegundos sem converter para UTC
export function formatDateToISOStringWithMilliseconds(dateString) {
    const [datePart, timePart] = dateString.split(' ');
    const [day, month, year] = datePart.split('/');
    const [hour, minute] = timePart.split(':');

    // Manualmente construir a string no formato ISO
    const formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hour.padStart(2, '0')}:${minute.padStart(2, '0')}:00.000`;

    return formattedDate;
}




export function filterSeries() {
    
    const chartColunas = Highcharts.charts ? Highcharts.charts.find(chart => chart && chart.renderTo && chart.renderTo.id === 'colunasChartContainer') : undefined;
    const chartPonteiro = Highcharts.charts ? Highcharts.charts.find(chart => chart && chart.renderTo && chart.renderTo.id === 'medicaoChartContainer') : undefined;

    if (!chartColunas && !chartPonteiro) {
        console.warn("Gráficos 'colunasChartContainer' e 'medicaoChartContainer' não encontrados. Verifique se eles foram carregados corretamente.");
        return;
    }

    const selectedSeries = document.getElementById("seriesSelector").value;
    const kpiSelecionado = document.getElementById('kpiSelector').value;

    // Função auxiliar para calcular a média das porcentagens de um conjunto de dados
    function calcularMediaPorcentagem(dadosProcessados) {
        const totalPercentages = Object.values(dadosProcessados).reduce((acc, uraData) => {
            return acc + parseFloat(uraData.porcentagem);
        }, 0);
        const totalURAs = Object.keys(dadosProcessados).length;
        return totalURAs > 0 ? (totalPercentages / totalURAs).toFixed(2) : NaN;
    }

    // Atualiza a visibilidade das séries no gráfico de colunas
    if (chartColunas) {
        chartColunas.series.forEach(function (series) {
            series.setVisible(selectedSeries === 'all' || series.name.includes(selectedSeries), false);
        });
        chartColunas.redraw();
    }

    // Atualiza o valor do ponteiro no gráfico de medição
    if (chartPonteiro) {
        let valorPonteiro;
        let dadosSelecionados;

        // Centraliza a lógica de obtenção de dados com base no KPI selecionado
        switch (kpiSelecionado) {
            case '1102':
                dadosSelecionados = dadosProcessadosPonteiro;
                break;
            case '1104':
                dadosSelecionados = dadosProcessadosPonteiro1104;
                break;
            case '1202':
                dadosSelecionados = window.dadosProcessadosPonteiro1202;
                if (!dadosSelecionados || Object.keys(dadosSelecionados).length === 0) {
                    // Se estiver vazio, chame a função para processar os dados
                    dadosSelecionados = window.dadosProcessadosPonteiro1202;
                }
                break;
            case '1204':
                dadosSelecionados = dadosProcessadosPonteiro1204;
                break;
            case '1201':
                dadosSelecionados = dadosProcessadosPonteiro1201;
                break;
            default:
                console.error("KPI não suportado:", kpiSelecionado);
                return;
        }

        /* // Verificação adicional para garantir que dadosSelecionados não sejam nulos ou indefinidos
        if (!dadosSelecionados || Object.keys(dadosSelecionados).length === 0) {
            console.error("[ERROR] Nenhum dado encontrado para o KPI selecionado:", kpiSelecionado);
            return;
        } */

        console.log("[DEBUG] Chaves disponíveis em dadosSelecionados:", Object.keys(dadosSelecionados));

        
        const normalizedSelectedSeries = selectedSeries.trim().toUpperCase();
        const normalizedKeys = Object.keys(dadosSelecionados).reduce((acc, key) => {
            acc[key.trim().toUpperCase()] = key;
            return acc;
        }, {});

        if (normalizedSelectedSeries === 'ALL') {
            // Cálculo individual de média para o KPI selecionado
            valorPonteiro = calcularMediaPorcentagem(dadosSelecionados);
        } else if (normalizedKeys.hasOwnProperty(normalizedSelectedSeries)) {
            const originalKey = normalizedKeys[normalizedSelectedSeries];
            valorPonteiro = parseFloat(dadosSelecionados[originalKey].porcentagem);
        } else {
            console.warn("Dados da URA/KPI selecionada não encontrados.");
            return;
        }

        if (isNaN(valorPonteiro)) {
            console.error("[ERROR] Valor do ponteiro é NaN. Verifique os dados.");
            return;
        }

        console.log("[DEBUG] Valor ponteiro:", valorPonteiro);

        chartPonteiro.series[0].setData([valorPonteiro], true);
        chartPonteiro.redraw();
    }
}



export function waitForChartRender(callback) {
    const interval = setInterval(() => {
        const chart = Highcharts.charts.find(chart => chart && chart.renderTo && chart.renderTo.id === 'colunasChartContainer');
        if (chart) {
            clearInterval(interval);
            callback();  // Chama a função filterSeries
        }
    }, 100);

    setTimeout(() => {
        clearInterval(interval);
    }, 5000);  // Timeout de 5 segundos
}

export function formatarHorasEmHHMMSS(segundosTotais) {
    const horas = Math.floor(segundosTotais / 3600);
    const minutos = Math.floor((segundosTotais % 3600) / 60);
    const segundos = Math.floor(segundosTotais % 60);

    return [horas, minutos, segundos]
        .map(valor => valor < 10 ? `0${valor}` : valor)
        .join(':');
}