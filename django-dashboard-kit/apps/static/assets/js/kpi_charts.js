import { kpiConfigurations } from './objetos_kpis.js'; // Importa as configurações de KPIs

// Função auxiliar para acessar propriedades aninhadas
function getNestedProperty(obj, key) {
    return key.split('.').reduce((o, k) => (o && o[k] !== 'undefined') ? o[k] : undefined, obj);
}

// Função para renderizar gráfico de colunas baseado em um KPI específico
export function renderizarGraficoColunas(kpiId, dadosProcessados) {
    const kpiConfig = kpiConfigurations[kpiId];

    if (!dadosProcessados || typeof dadosProcessados !== 'object') {
        console.error('Dados processados inválidos:', dadosProcessados);
        return;
    }

    const seriesData = [];
    const categories = [];

    console.log('kpiConfig:', kpiConfig);

    // Adicionar Séries Gerais
    kpiConfig.series.forEach(serie => {
        console.log(`Procurando chave ${serie.dataKey} em dadosProcessados`);
        const valor = getNestedProperty(dadosProcessados, serie.dataKey);
        if (valor !== undefined) {
            seriesData.push({
                name: serie.name,
                data: [valor],
                color: serie.color || undefined
            });
            categories.push('Geral'); // Adiciona a categoria "Geral"
        } else {
            console.warn(`Chave ${serie.dataKey} não encontrada em dadosProcessados`);
        }
    });

    // Adicionar Séries por URA
    if (kpiConfig.seriesPorURA && dadosProcessados.porURA && typeof dadosProcessados.porURA === 'object') {
        Object.keys(dadosProcessados.porURA).forEach(ura => {
            const seriesPorURA = kpiConfig.seriesPorURA(ura);
            seriesPorURA.forEach(serie => {
                console.log(`Procurando chave ${serie.dataKey} para URA ${ura}`);
                const valor = getNestedProperty(dadosProcessados, serie.dataKey);
                if (valor !== undefined) {
                    seriesData.push({
                        name: serie.name,
                        data: [valor],
                        color: serie.color || undefined
                    });
                    categories.push(ura); // Adiciona a categoria da URA
                } else {
                    console.warn(`Chave ${serie.dataKey} não encontrada para URA ${ura}`);
                }
            });
        });
    } else {
        console.warn('Estrutura porURA ausente ou inválida em dadosProcessados:', dadosProcessados.porURA);
    }

    console.log('Dados formatados para o Highcharts:', seriesData);

    Highcharts.chart('colunasChartContainer', {
        chart: {
            type: 'column',
            height: 500,
            backgroundColor: kpiConfig.backgroundColor || '#f4f4f4',
            borderRadius: 5
        },
        title: {
            text: kpiConfig.title,
            style: {
                fontSize: '20px',
                fontWeight: 'bold'
            }
        },
        xAxis: {
            categories: categories, // Categorias dinâmicas baseadas em "Geral" e URAs
            crosshair: true
        },
        yAxis: {
            min: 0,
            title: {
                text: kpiConfig.yAxisTitle || 'Valores'
            }
        },
        tooltip: {
            headerFormat: '<span style="font-size:10px">{point.key}</span><table>',
            pointFormat: '<tr><td style="color:{series.color};padding:0">{series.name}: </td>' +
                '<td style="padding:0"><b>{point.y:.0f}</b></td></tr>',
            footerFormat: '</table>',
            shared: true,
            useHTML: true
        },
        plotOptions: {
            column: {
                pointPadding: 0.2,
                borderWidth: 0,
                grouping: true, // Agrupamento de colunas
                dataLabels: {
                    enabled: true,
                    formatter: function() {
                        return Highcharts.numberFormat(this.y, 0);
                    },
                    style: {
                        fontWeight: 'bold',
                        color: kpiConfig.dataLabelColor || 'black',
                        borderWidth: kpiConfig.dataLabelBorderWidth || 0,
                        borderColor: kpiConfig.dataLabelBorderColor || 'transparent'
                    }
                }
            }
        },
        series: seriesData,
        credits: {
            enabled: false
        }
    });
}
