import { kpiConfigurations, kpiConfigurationsIndicadorPonteiro, kpiConfigurationsTendencia  } from './objetos_kpis.js'; // Importa as configurações de KPIs




// Função auxiliar para acessar propriedades aninhadas
function getNestedProperty(obj, key) {
    // console.log("[DEBUG] Acessando propriedade aninhada:", key);
    
    // Dividindo a chave pela notação de ponto e reduzindo-a para acessar o valor final
    const result = key.split('.').reduce((o, k) => {
        if (o && o[k] !== undefined) {
            console.log(`[DEBUG] Propriedade encontrada: ${k} -> Valor:`, o[k]);
            return o[k];
        } else {
            console.warn(`[WARN] Propriedade não encontrada: ${k}`);
            return undefined;
        }
    }, obj);
    
    console.log("[DEBUG] Resultado final de getNestedProperty:", result);
    return result;
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

    // console.log('kpiConfig:', kpiConfig);

    // Adicionar Séries Gerais
    kpiConfig.series.forEach(serie => {
        // console.log(`Procurando chave ${serie.dataKey} em dadosProcessados`);
        const valor = getNestedProperty(dadosProcessados, serie.dataKey);
        if (valor !== undefined) {
            console.log(`[DEBUG] Adicionando série geral: ${serie.name} com valor: ${valor}`);
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


// Função para renderizar gráfico de ponteiro (gauge) baseado em um KPI específico
export function renderizarGraficoPonteiro(kpiId, dadosProcessados) {
    const kpiConfig = kpiConfigurationsIndicadorPonteiro[kpiId];

    if (!kpiConfig || !dadosProcessados) {
        console.error('Configuração ou dados processados inválidos');
        return;
    }

    let valorPonteiro;

    if (kpiId === '1101') {
        console.log("[DEBUG] Tentando acessar a chave para KPI 1101:", kpiConfig.gauge.series[0].dataKey);
        valorPonteiro = getNestedProperty(dadosProcessados, kpiConfig.gauge.series[0].dataKey);
        
        if (valorPonteiro === undefined) {
            console.error("[ERROR] Chave não encontrada em dadosProcessados para KPI 1101:", kpiConfig.gauge.series[0].dataKey);
        } else {
            valorPonteiro = parseFloat(valorPonteiro);
            console.log("[INFO] Valor do ponteiro KPI 1101:", valorPonteiro);
            console.log("[DEBUG] Tipo de valor após o parseFloat:", typeof valorPonteiro);
        }
    } else if (kpiId === '1102') {
        const selectedURA = document.getElementById("seriesSelector").value;
    
        if (selectedURA === 'all') {
            console.log("[INFO] URA selecionada é 'all', calculando valor consolidado.");
    
            const totalPercentages = Object.values(dadosProcessados).reduce((acc, uraData) => {
                return acc + parseFloat(uraData.porcentagem);
            }, 0);
    
            const totalURAs = Object.keys(dadosProcessados).length;
            valorPonteiro = totalURAs > 0 ? (totalPercentages / totalURAs).toFixed(2) : NaN;
            valorPonteiro = Number(valorPonteiro) || 0;         
        } else {
            if (!dadosProcessados[selectedURA]) {
                console.error("[ERROR] URA selecionada não encontrada nos dados processados:", selectedURA);
                return;
            }
    
            valorPonteiro = parseFloat(dadosProcessados[selectedURA].porcentagem);
            valorPonteiro = Number(valorPonteiro) || 0;         

        }
    } else if (kpiId === '1104') {
        const selectedURA = document.getElementById("seriesSelector").value;
        // Log para verificar o valor selecionado pelo usuário
        console.log("[DEBUG] URA Selecionada:", selectedURA);

        if (selectedURA === 'all') {
            console.log("[INFO] URA selecionada é 'all', calculando valor consolidado.");
        
            console.log("[DEBUG] Chaves disponíveis em dadosProcessadosPonteiro:", Object.keys(dadosProcessados));
        
            // Calcular a média ponderada de chamadas abandonadas com mais de 1 minuto
            const totalAbandonadas = Object.values(dadosProcessados).reduce((acc, uraData) => {
                return acc + (parseFloat(uraData.chamadasAbandonadasSuperior1Min) || 0);
            }, 0);
        
            const totalRecebidas = Object.values(dadosProcessados).reduce((acc, uraData) => {
                return acc + (parseFloat(uraData.ligacoesRecebidas) || 0);
            }, 0);
        
            valorPonteiro = totalRecebidas > 0 ? ((totalAbandonadas / totalRecebidas) * 100).toFixed(2) : NaN;
            valorPonteiro = Number(valorPonteiro) || 0;
        }
         else {
            if (!dadosProcessados[selectedURA]) {
                console.error("[ERROR] URA selecionada não encontrada nos dados processados:", selectedURA);
                return;
            }

            const uraData = dadosProcessados[selectedURA];
            const abandonadasSuperior1Min = parseFloat(uraData.abandonadasSuperior1Min) || 0;
            const ligacoesRecebidas = parseFloat(uraData.ligacoesRecebidas) || 0;

            valorPonteiro = ligacoesRecebidas > 0 ? ((abandonadasSuperior1Min / ligacoesRecebidas) * 100).toFixed(2) : NaN;
            valorPonteiro = Number(valorPonteiro) || 0;        
            
            // Log para confirmar o valor encontrado
            console.log("[DEBUG] Valor do ponteiro para URA selecionada:", valorPonteiro);
            console.log("[DEBUG] Configuração dos stops do gráfico:", kpiConfig.yAxis.stops);

        }
    } else if (kpiId === '1202') {
        const selectedURA = document.getElementById("seriesSelector").value;
    
        if (selectedURA === 'all') {
            console.log("[INFO] URA selecionada é 'all', calculando valor consolidado.");
    
            const totalPercentages = Object.values(dadosProcessados).reduce((acc, uraData) => {
                return acc + parseFloat(uraData.porcentagem);
            }, 0);
    
            const totalURAs = Object.keys(dadosProcessados).length;
            valorPonteiro = totalURAs > 0 ? (totalPercentages / totalURAs).toFixed(2) : NaN;
            valorPonteiro = Number(valorPonteiro) || 0
            // Log para verificar o valor consolidado
            console.log("[DEBUG] Valor do ponteiro consolidado para todas as URAs:", valorPonteiro);
        } else {
            if (!dadosProcessados[selectedURA]) {
                console.error("[ERROR] URA selecionada não encontrada nos dados processados:", selectedURA);
                return;
            }
    
            // Cálculo do valor específico da URA selecionada
            valorPonteiro = parseFloat(dadosProcessados[selectedURA].porcentagem);
            valorPonteiro = Number(valorPonteiro) || 0;
            
            // Log para confirmar o valor encontrado
            console.log("[DEBUG] Valor do ponteiro para URA selecionada:", valorPonteiro);
        }
    } else if (kpiId === '1204') {
        const selectedURA = document.getElementById("seriesSelector").value;
    
        if (selectedURA === 'all') {
            console.log("[INFO] URA selecionada é 'all', calculando valor consolidado.");
    
            const totalPercentages = Object.values(dadosProcessados).reduce((acc, uraData) => {
                return acc + parseFloat(uraData.porcentagem);
            }, 0);
    
            const totalURAs = Object.keys(dadosProcessados).length;
            valorPonteiro = totalURAs > 0 ? (totalPercentages / totalURAs).toFixed(2) : NaN;
            valorPonteiro = Number(valorPonteiro) || 0
            // Log para verificar o valor consolidado
            console.log("[DEBUG] Valor do ponteiro consolidado para todas as URAs:", valorPonteiro);
        } else {
            if (!dadosProcessados[selectedURA]) {
                console.error("[ERROR] URA selecionada não encontrada nos dados processados:", selectedURA);
                return;
            }
    
            // Cálculo do valor específico da URA selecionada
            valorPonteiro = parseFloat(dadosProcessados[selectedURA].porcentagem);
            valorPonteiro = Number(valorPonteiro) || 0;
            
            // Log para confirmar o valor encontrado
            console.log("[DEBUG] Valor do ponteiro para URA selecionada:", valorPonteiro);
        }
    } else if (kpiId === '1201') {
        const selectedURA = document.getElementById("seriesSelector").value;
    
        if (selectedURA === 'all') {
            console.log("[INFO] URA selecionada é 'all', calculando valor consolidado.");
    
            const totalPercentages = Object.values(dadosProcessados).reduce((acc, uraData) => {
                return acc + parseFloat(uraData.porcentagem);
            }, 0);
    
            const totalURAs = Object.keys(dadosProcessados).length;
            valorPonteiro = totalURAs > 0 ? (totalPercentages / totalURAs).toFixed(2) : NaN;
            valorPonteiro = Number(valorPonteiro) || 0
            // Log para verificar o valor consolidado
            console.log("[DEBUG] Valor do ponteiro consolidado para todas as URAs:", valorPonteiro);
        } else {
            if (!dadosProcessados[selectedURA]) {
                console.error("[ERROR] URA selecionada não encontrada nos dados processados:", selectedURA);
                return;
            }
    
            // Cálculo do valor específico da URA selecionada
            valorPonteiro = parseFloat(dadosProcessados[selectedURA].porcentagem);
            valorPonteiro = Number(valorPonteiro) || 0;
            
            // Log para confirmar o valor encontrado
            console.log("[DEBUG] Valor do ponteiro para URA selecionada:", valorPonteiro);
        }
    }

    if (isNaN(valorPonteiro)) {
        console.error("[ERROR] Valor do ponteiro é NaN, verifique os dados processados e a configuração.");
        return;
    }

    Highcharts.chart('medicaoChartContainer', {
        chart: {
            type: 'solidgauge',
            backgroundColor: kpiConfig.backgroundColor || '#f4f4f4',
            height: 300,
        },
        title: {
            text: kpiConfig.title,
            style: {
                fontSize: '20px',
                fontWeight: 'bold'
            }
        },
        pane: kpiConfig.pane,
        yAxis: {
            min: kpiConfig.gauge.yAxisMin,
            max: kpiConfig.gauge.yAxisMax,
            stops: kpiConfig.yAxis.stops,
            lineWidth: 0,
            tickWidth: 0,
            minorTickInterval: null,
            tickAmount: 2,
            title: {
                text: ''
            },
            labels: {
                y: 16
            }
        },
        series: [{
            name: kpiConfig.gauge.series[0].name,
            data: [valorPonteiro], 
            dataLabels: kpiConfig.gauge.series[0].dataLabels,
            tooltip: {
                valueSuffix: '%'
            }
        }],
        credits: {
            enabled: false
        }
    });
    
    console.log("[INFO] Gráfico de ponteiro renderizado com sucesso.");
}



export function renderizarGraficoTendencia(kpiId, dadosProcessados) {
    const kpiConfig = kpiConfigurationsTendencia[kpiId];

    if (!dadosProcessados || typeof dadosProcessados !== 'object') {
        console.error('Dados processados inválidos:', dadosProcessados);
        return;
    }

    const seriesData = [];
    const categories = Object.keys(dadosProcessados).sort((a, b) => {
        const dateA = new Date(a.split('/').reverse().join('-'));
        const dateB = new Date(b.split('/').reverse().join('-'));
        return dateA - dateB;
    });
    
    console.log("[DEBUG] Categorias do eixo X ordenadas:", categories);

    // Adicionar Séries
    kpiConfig.series.forEach(serie => {
        const valores = categories.map(data => {
            if (serie.dataKey === 'metaDiaria') {
                return serie.fixedValue !== undefined ? serie.fixedValue : 80; // Linha da Meta (Ajustável)
            }
            const valor = dadosProcessados[data][serie.dataKey];
            console.log(`[DEBUG] Valor para ${serie.name} em ${data}:`, valor); // Log dos valores
            return valor !== undefined ? parseFloat(valor) : null;
        });

        seriesData.push({
            name: serie.name,
            data: valores,
            color: serie.color || undefined
        });
    });

    console.log("[INFO] Dados formatados para o gráfico de tendência:", seriesData);

    Highcharts.chart('tendenciaChartContainer', {
        chart: {
            type: 'line',
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
            categories: categories, // Datas como rótulos no eixo X
            crosshair: true
        },
        yAxis: {
            min: 0,
            max: 120, // Ajuste o eixo Y para incluir a meta de 80%
            title: {
                text: kpiConfig.yAxisTitle || 'Disponibilidade (%)'
            }
        },
        tooltip: {
            headerFormat: '<span style="font-size:10px">{point.key}</span><table>',
            pointFormat: '<tr><td style="color:{series.color};padding:0">{series.name}: </td>' +
                '<td style="padding:0"><b>{point.y:.2f}%</b></td></tr>',
            footerFormat: '</table>',
            shared: true,
            useHTML: true
        },
        plotOptions: {
            line: {
                dataLabels: {
                    enabled: true,
                    formatter: function() {
                        return Highcharts.numberFormat(this.y, 2) + '%';
                    },
                    style: {
                        fontWeight: 'bold',
                        color: kpiConfig.dataLabelColor || 'black',
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








