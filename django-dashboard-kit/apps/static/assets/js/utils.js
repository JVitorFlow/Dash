import { dadosProcessadosPonteiro } from './tempo_esperar_para_iniciar_atendimento_em_ate_1minuto.js';

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

// Função para converter uma data em string para ISO format com milissegundos
export function formatDateToISOStringWithMilliseconds(dateString) {
    const [datePart, timePart] = dateString.split(' ');
    const [day, month, year] = datePart.split('/');
    const [hour, minute] = timePart.split(':');

    const localDate = new Date(year, month - 1, day, hour, minute);
    return localDate.toISOString();
}


export function filterSeries() {
    const chartColunas = Highcharts.charts ? Highcharts.charts.find(chart => chart && chart.renderTo && chart.renderTo.id === 'colunasChartContainer') : undefined;
    const chartPonteiro = Highcharts.charts ? Highcharts.charts.find(chart => chart && chart.renderTo && chart.renderTo.id === 'medicaoChartContainer') : undefined;

    if (!chartColunas && !chartPonteiro) {
        console.warn("Gráficos 'colunasChartContainer' e 'medicaoChartContainer' não encontrados. Verifique se eles foram carregados corretamente.");
        return;
    }

    const selectedSeries = document.getElementById("seriesSelector").value;

    // Atualiza a visibilidade das séries no gráfico de colunas
    if (chartColunas) {
        chartColunas.series.forEach(function(series) {
            series.setVisible(selectedSeries === 'all' || series.name.includes(selectedSeries), false);
        });
        chartColunas.redraw();
    }

    // Atualiza o valor do ponteiro no gráfico de medição
    if (chartPonteiro) {
        let valorPonteiro;

        if (selectedSeries === 'all') {
            const totalPercentages = Object.values(dadosProcessadosPonteiro).reduce((acc, uraData) => {
                return acc + parseFloat(uraData.porcentagem);
            }, 0);
            const totalURAs = Object.keys(dadosProcessadosPonteiro).length;
            valorPonteiro = totalURAs > 0 ? (totalPercentages / totalURAs).toFixed(2) : NaN;
        } else {
            if (dadosProcessadosPonteiro[selectedSeries]) {
                valorPonteiro = parseFloat(dadosProcessadosPonteiro[selectedSeries].porcentagem);
            } else {
                console.warn("Dados da URA selecionada não encontrados.");
                return;
            }
        }

        if (isNaN(valorPonteiro)) {
            console.error("[ERROR] Valor do ponteiro é NaN. Verifique os dados.");
            return;
        }

        // Atualiza o gráfico de ponteiro
        chartPonteiro.series[0].setData([valorPonteiro], true);
        chartPonteiro.redraw();
    }
}







export function waitForChartRender(callback) {
    const interval = setInterval(() => {
        const chart = Highcharts.charts.find(chart => chart && chart.renderTo && chart.renderTo.id === 'colunasChartContainer');
        if (chart) {
            clearInterval(interval);
            // console.log("[DEBUG] Gráfico 'colunasChartContainer' carregado.");
            callback();  // Chama a função filterSeries
        }
    }, 100);

    setTimeout(() => {
        clearInterval(interval);
        // console.error("[ERROR] Gráfico 'colunasChartContainer' não carregou a tempo.");
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
