const kpiConfigurations = {
    '1101': {
        title: 'KPI 11.01 - % Ocupação por atendente',
        categories: ['Carga Horária', 'Horas Trabalhadas', 'Horas Pausa'],
        series: [
            {
                name: 'Carga Horária',
                dataKey: 'carga_horaria'
            },
            {
                name: 'Horas Pausa',
                dataKey: 'horas_pausa'
            },
            {
                name: 'Horas Trabalhadas',
                dataKey: 'horas_trabalhadas'
            }
        ]
    },
    '1102': {
        title: 'KPI 11.02 - Tempo de Espera para Iniciar Atendimento em até 1 minuto (Externo) ',
        categories: ['Ligações Recebidas', 'Atendidas Inferior a 1 Minuto', 'Atendidas Superior a 1 Minuto'],
        series: [
            {
                name: 'Ligações Recebidas',
                dataKey: 'geral.ligacoesRecebidas'
            },
            {
                name: 'Atendidas Inferior a 1 Minuto',
                dataKey: 'geral.atendidasInferior1Min'
            },
            {
                name: 'Atendidas Superior a 1 Minuto',
                dataKey: 'geral.atendidasSuperior1Min'
            }
        ],
        // Seção para URAs individuais
        seriesPorURA: (ura) => [
            {
                name: `Ligações Recebidas - ${ura}`,
                dataKey: `porURA.${ura}.ligacoesRecebidas`
            },
            {
                name: `Atendidas Inferior a 1 Minuto - ${ura}`,
                dataKey: `porURA.${ura}.atendidasInferior1Min`
            },
            {
                name: `Atendidas Superior a 1 Minuto - ${ura}`,
                dataKey: `porURA.${ura}.atendidasSuperior1Min`
            }
        ]
    },
    '1104': {
        title: 'KPI 11.04 - % de abandono de chamadas externas',
        categories: ['Desist. Inferior a 1 Minuto', 'Desist. Superior a 1 Minuto', 'Ligações Recebidas'],
        series: [
            {
                name: 'Desist. Inferior a 1 Minuto',
                dataKey: 'geral.desistenciasInferior1Min'
            },
            {
                name: 'Desist. Superior a 1 Minuto',
                dataKey: 'geral.desistenciasSuperior1Min'
            },
            {
                name: 'Ligações Recebidas',
                dataKey: 'geral.ligacoesRecebidas'
            }
        ],
        // Seção para URAs individuais
        seriesPorURA: (ura) => [
            {
                name: `Desist. Inferior a 1 Minuto - ${ura}`,
                dataKey: `porURA.${ura}.desistenciasInferior1Min`
            },
            {
                name: `Desist. Superior a 1 Minuto - ${ura}`,
                dataKey: `porURA.${ura}.desistenciasSuperior1Min`
            },
            {
                name: `Ligações Recebidas - ${ura}`,
                dataKey: `porURA.${ura}.ligacoesRecebidas`
            }
        ]
    },
    '1201': {
        title: 'KPI 12.01 - tempo médio de 03 minutos de atendimento por atendente',
        categories: ['Tempo médio(s)', 'Total ligações'],
        series: [
            {
                name: 'Tempo médio(s)',
                dataKey: 'geral.tempoMedio'
            },
            {
                name: 'Total ligações',
                dataKey: 'geral.totalLigacoes'
            }
        ],
        seriesPorURA: (ura) => [
            {
                name: `Tempo médio(s) - ${ura}`,
                dataKey: `porURA.${ura}.tempoMedio`
            },
            {
                name: `Total ligações - ${ura}`,
                dataKey: `porURA.${ura}.totalLigacoes`
            }
        ]
    },
    '1202': {
        title: 'KPI 12.02 - tempo de espera para iniciar atendimento em até 1 minuto (Interno)',
        categories: ['Ligações Recebidas', 'Atendidas Inferior a 1 Minuto', 'Atendidas Superior a 1 Minuto'],
        series: [
            {
                name: 'Ligações Recebidas',
                dataKey: 'geral.ligacoesRecebidas'
            },
            {
                name: 'Atendidas Inferior a 1 Minuto',
                dataKey: 'geral.atendidasInferior1Min'
            },
            {
                name: 'Atendidas Superior a 1 Minuto',
                dataKey: 'geral.atendidasSuperior1Min'
            }
        ],
        seriesPorURA: (ura) => [
            {
                name: `Ligações Recebidas - ${ura}`,
                dataKey: `porURA.${ura}.ligacoesRecebidas`
            },
            {
                name: `Atendidas Inferior a 1 Minuto - ${ura}`,
                dataKey: `porURA.${ura}.atendidasInferior1Min`
            },
            {
                name: `Atendidas Superior a 1 Minuto - ${ura}`,
                dataKey: `porURA.${ura}.atendidasSuperior1Min`
            }
        ]
    },
    '1204': {
        title: 'KPI 12.04 - % de abandono de chamadas internas',
        categories: ['Desist. Inferior a 1 Minuto', 'Desist. Superior a 1 Minuto', 'Ligações Recebidas'],
        series: [
            {
                name: 'Desist. Inferior a 1 Minuto',
                dataKey: 'geral.desistenciasInferior1Min'
            },
            {
                name: 'Desist. Superior a 1 Minuto',
                dataKey: 'geral.desistenciasSuperior1Min'
            },
            {
                name: 'Ligações Recebidas',
                dataKey: 'geral.ligacoesRecebidas'
            }
        ],
        // Seção para URAs individuais
        seriesPorURA: (ura) => [
            {
                name: `Desist. Inferior a 1 Minuto - ${ura}`,
                dataKey: `porURA.${ura}.desistenciasInferior1Min`
            },
            {
                name: `Desist. Superior a 1 Minuto - ${ura}`,
                dataKey: `porURA.${ura}.desistenciasSuperior1Min`
            },
            {
                name: `Ligações Recebidas - ${ura}`,
                dataKey: `porURA.${ura}.ligacoesRecebidas`
            }
        ]
    }
};


const kpiConfigurationsIndicadorPonteiro = {
    '1101': {
        title: 'KPI 11.01 - % Ocupação por Atendente',
        chartType: 'gauge',
        gauge: {
            yAxisMin: 0,
            yAxisMax: 100,
            greenThreshold: 80,
            yellowThreshold: 80,
            redThreshold: 0,
            series: [{
                name: 'Ocupação',
                dataKey: 'ocupacaoPercentual',
                dataLabels: {
                    format: '{y}%',
                    style: {
                        fontSize: '24px',
                        color: 'black'
                    }
                },
                dial: {
                    radius: '100%',
                    baseWidth: 10,
                    baseLength: '0%', 
                    rearLength: '0%',
                    backgroundColor: 'black',
                    borderColor: 'silver',
                    borderWidth: 1
                },
                pivot: {
                    backgroundColor: 'black',
                    radius: 6
                }
            }]
        },
        pane: {
            center: ['50%', '85%'],
            size: '140%',
            startAngle: -90,
            endAngle: 90,
            background: {
                backgroundColor: '#EEE',
                innerRadius: '60%',
                outerRadius: '100%',
                shape: 'arc'
            }
        },
        yAxis: {
            min: 0,
            max: 100,
            stops: [
                [0.8, '#DF5353'], // Vermelho até 80%
                [0.8, '#55BF3B'], // Verde a partir de 80%
            ],
            lineWidth: 0,
            tickWidth: 0,
            minorTickInterval: null,
            tickAmount: 2,
            title: {
                y: -70
            },
            labels: {
                y: 16
            }
        },
        series: [{
            name: 'Ocupação',
            data: [],
            tooltip: {
                valueSuffix: ' %'
            }
        }]
    },
    '1102': {
        title: 'KPI 11.02 - % de Atendimentos Iniciados em até 1 Minuto',
        chartType: 'gauge',
        gauge: {
            yAxisMin: 0,
            yAxisMax: 100,
            greenThreshold: 95,  // Meta de 95% ou mais
            yellowThreshold: 85, // Abaixo de 95% e até 85% (amarelo)
            redThreshold: 85,    // Abaixo de 85% (vermelho)
            series: [{
                name: 'Atendimentos em < 1min',
                dataKey: 'porcentagem',
                dataLabels: {
                    format: '{y}%',
                    style: {
                        fontSize: '24px',
                        color: 'black'
                    }
                },
                dial: {
                    radius: '100%',
                    baseWidth: 10,
                    baseLength: '0%', 
                    rearLength: '0%',
                    backgroundColor: 'black',
                    borderColor: 'silver',
                    borderWidth: 1
                },
                pivot: {
                    backgroundColor: 'black',
                    radius: 6
                }
            }]
        },
        pane: {
            center: ['50%', '85%'],
            size: '140%',
            startAngle: -90,
            endAngle: 90,
            background: {
                backgroundColor: '#EEE',
                innerRadius: '60%',
                outerRadius: '100%',
                shape: 'arc'
            }
        },
        yAxis: {
            min: 0,
            max: 100,
            stops: [
                [0.8, '#DF5353'], // Vermelho até 80%
                [0.8, '#55BF3B']  // Verde acima de 80%
            ],
            lineWidth: 0,
            tickWidth: 0,
            minorTickInterval: null,
            tickAmount: 2,
            title: {
                y: -70
            },
            labels: {
                y: 16
            }
        },
        series: [{
            name: 'Atendimentos em < 1min',
            data: [],
            tooltip: {
                valueSuffix: ' %'
            }
        }]
    },
    '1104': {
        title: 'KPI 11.04 - % Abandono de chamada externas',
        chartType: 'gauge',
        gauge: {
            yAxisMin: 0,
            yAxisMax: 100,
            greenThreshold: 10,  // Meta: até 10% de abandono
            redThreshold: 10,    // Acima de 10% será vermelho
            series: [{
                name: 'Abandono > 1min',
                dataKey: 'porcentagem',
                dataLabels: {
                    format: '{y}%',
                    style: {
                        fontSize: '24px',
                        color: 'black'
                    }
                },
                dial: {
                    radius: '100%',
                    baseWidth: 10,
                    baseLength: '0%',
                    rearLength: '0%',
                    backgroundColor: 'black',
                    borderColor: 'silver',
                    borderWidth: 1
                },
                pivot: {
                    backgroundColor: 'black',
                    radius: 6
                }
            }]
        },
        pane: {
            center: ['50%', '85%'],
            size: '140%',
            startAngle: -90,
            endAngle: 90,
            background: {
                backgroundColor: '#EEE',
                innerRadius: '60%',
                outerRadius: '100%',
                shape: 'arc'
            }
        },
        yAxis: {
            min: 0,
            max: 100,
            stops: [
                [0.001, '#55BF3B'], // Verde em 0% até 10%
                [0.0, '#55BF3B'], // Verde para 0%
                [0.1, '#55BF3B'], // Verde até 10%
                [0.1, '#DF5353']  // Vermelho acima de 10%
            ],
            lineWidth: 0,
            tickWidth: 0,
            minorTickInterval: null,
            tickAmount: 2,
            title: {
                y: -70
            },
            labels: {
                y: 16
            }
        },
        series: [{
            name: 'Abandono > 1min',
            data: [],
            tooltip: {
                valueSuffix: ' %'
            }
        }]
    },
    '1202': {
        title: 'KPI 12.02 - Tempo de espera para iniciar atendimento em até 1 minuto',
        chartType: 'gauge',
        gauge: {
            yAxisMin: 0,
            yAxisMax: 100,
            greenThreshold: 95,  // Meta de 95% ou mais
            yellowThreshold: 85, // Abaixo de 95% e até 85% (amarelo)
            redThreshold: 85,    // Abaixo de 85% (vermelho)
            series: [{
                name: 'Atendimentos em < 1min',
                dataKey: 'porcentagem',
                dataLabels: {
                    format: '{y}%',
                    style: {
                        fontSize: '24px',
                        color: 'black'
                    }
                },
                dial: {
                    radius: '100%',
                    baseWidth: 10,
                    baseLength: '0%', 
                    rearLength: '0%',
                    backgroundColor: 'black',
                    borderColor: 'silver',
                    borderWidth: 1
                },
                pivot: {
                    backgroundColor: 'black',
                    radius: 6
                }
            }]
        },
        pane: {
            center: ['50%', '85%'],
            size: '140%',
            startAngle: -90,
            endAngle: 90,
            background: {
                backgroundColor: '#EEE',
                innerRadius: '60%',
                outerRadius: '100%',
                shape: 'arc'
            }
        },
        yAxis: {
            min: 0,
            max: 100,
            stops: [
                [0.9, '#DF5353'], // Vermelho até 90%
                [0.9, '#55BF3B']  // Verde acima de 90%
            ],
            lineWidth: 0,
            tickWidth: 0,
            minorTickInterval: null,
            tickAmount: 2,
            title: {
                y: -70
            },
            labels: {
                y: 16
            }
        },
        series: [{
            name: 'Atendimentos em < 1min',
            data: [],
            tooltip: {
                valueSuffix: ' %'
            }
        }]
    },
    '1204': {
        title: 'KPI 12.04 - % Abandono de chamada internas',
        chartType: 'gauge',
        gauge: {
            yAxisMin: 0,
            yAxisMax: 100,
            greenThreshold: 10,  // Meta: até 10% de abandono
            redThreshold: 10,    // Acima de 10% será vermelho
            series: [{
                name: 'Abandono > 1min',
                dataKey: 'porcentagem',
                dataLabels: {
                    format: '{y}%',
                    style: {
                        fontSize: '24px',
                        color: 'black'
                    }
                },
                dial: {
                    radius: '100%',
                    baseWidth: 10,
                    baseLength: '0%',
                    rearLength: '0%',
                    backgroundColor: 'black',
                    borderColor: 'silver',
                    borderWidth: 1
                },
                pivot: {
                    backgroundColor: 'black',
                    radius: 6
                }
            }]
        },
        pane: {
            center: ['50%', '85%'],
            size: '140%',
            startAngle: -90,
            endAngle: 90,
            background: {
                backgroundColor: '#EEE',
                innerRadius: '60%',
                outerRadius: '100%',
                shape: 'arc'
            }
        },
        yAxis: {
            min: 0,
            max: 100,
            stops: [
                [0.001, '#55BF3B'], // Verde em 0% até 10%
                [0.0, '#55BF3B'], // Verde para 0%
                [0.1, '#55BF3B'], // Verde até 10%
                [0.1, '#DF5353']  // Vermelho acima de 10%
            ],
            lineWidth: 0,
            tickWidth: 0,
            minorTickInterval: null,
            tickAmount: 2,
            title: {
                y: -70
            },
            labels: {
                y: 16
            }
        },
        series: [{
            name: 'Abandono > 1min',
            data: [],
            tooltip: {
                valueSuffix: ' %'
            }
        }]
    },
    '1201': {
        title: 'KPI 12.01 - Tempo Médio de Atendimento por Atendente',
        chartType: 'gauge',
        gauge: {
            yAxisMin: 0,
            yAxisMax: 100, // A porcentagem vai de 0 a 100%
            greenThreshold: 100, // Verde para 100%
            yellowThreshold: 80, // Amarelo para valores entre 80% e 100%
            redThreshold: 0, // Vermelho para valores abaixo de 80%
            series: [{
                name: 'Eficiência',
                dataKey: 'porcentagem',
                dataLabels: {
                    format: '{y}%', // Exibe o valor em porcentagem
                    style: {
                        fontSize: '24px',
                        color: 'black'
                    }
                },
                dial: {
                    radius: '100%',
                    baseWidth: 10,
                    baseLength: '0%', 
                    rearLength: '0%',
                    backgroundColor: 'black',
                    borderColor: 'silver',
                    borderWidth: 1
                },
                pivot: {
                    backgroundColor: 'black',
                    radius: 6
                }
            }]
        },
        pane: {
            center: ['50%', '85%'],
            size: '140%',
            startAngle: -90,
            endAngle: 90,
            background: {
                backgroundColor: '#EEE',
                innerRadius: '60%',
                outerRadius: '100%',
                shape: 'arc'
            }
        },
        yAxis: {
            min: 0,
            max: 100,
            stops: [
                [0.8, '#DF5353'], // Vermelho até 80%
                [0.8, '#55BF3B'], // Verde a partir de 80% até 100%
            ],
            lineWidth: 0,
            tickWidth: 0,
            minorTickInterval: null,
            tickAmount: 2,
            title: {
                y: -70
            },
            labels: {
                y: 16
            }
        },
        series: [{
            name: 'Eficiência',
            data: [],
            tooltip: {
                valueSuffix: ' %'
            }
        }]
    }
};


const kpiConfigurationsTendencia = {
    '1101': {
        title: 'KPI 11.01 - Tendência de Disponibilidade Diária',
        chartType: 'line',
        xAxisTitle: 'Data',
        yAxisTitle: 'Disponibilidade (%)',
        series: [
            {
                name: 'Meta',
                dataKey: 'metaDiaria',
                color: '#007bff', // Azul
                fixedValue: 80 // Meta ajustável para 1101
            },
            {
                name: 'Acumulado do Dia',
                dataKey: 'disponibilidadePercentual',
                color: '#ff0000' // Vermelho
            }
        ]
    },
    '1102': {
        title: 'KPI 11.02 - Tendência de Atendimento em Menos de 1 Minuto',
        chartType: 'line',
        xAxisTitle: 'Data',
        yAxisTitle: 'Atendimento (%)',
        series: [
            {
                name: 'Meta',
                dataKey: 'metaDiaria',
                color: '#007bff', // Azul
                fixedValue: 100 // Meta de 100% para KPI 1102
            },
            {
                name: 'Acumulado do Dia',
                dataKey: 'percentual',
                color: '#ff0000' // Vermelho
            }
        ]
    },
    '1104': {
        title: 'KPI 11.04 - Tendência de abandono (Externo)',
        chartType: 'line',
        xAxisTitle: 'Data',
        yAxisTitle: 'Eficiência (%)',
        series: [
            {
                name: 'Meta',
                dataKey: 'metaDiaria',
                color: '#007bff', // Azul
                fixedValue: 95 // Meta de 100% para KPI 1104
            },
            {
                name: 'Eficiência Acumulada',
                dataKey: 'percentual',
                color: '#00ff00' // Verde
            }
        ]
    },
    '1201': {
        title: 'KPI 12.01 - Tendência de Tempo Médio de 03 minutos de atendimento',
        chartType: 'line',
        xAxisTitle: 'Data',
        yAxisTitle: 'Eficiência (%)',
        series: [
            {
                name: 'Meta',
                dataKey: 'metaDiaria',
                color: '#ff0000', // Vermelho para a linha de meta
                fixedValue: 80 // Meta de 80% de eficiência
            },
            {
                name: 'Eficiência Acumulada',
                dataKey: 'eficienciaPercentual',
                color: '#00ff00' // Verde para a eficiência acumulada
            }
        ]
    },
    '1202': {
        title: 'KPI 12.02 - Têndencia Espera Telefônica (Interno - 1 min)',
        chartType: 'line',
        xAxisTitle: 'Data',
        yAxisTitle: 'Atendimento (%)',
        series: [
            {
                name: 'Meta',
                dataKey: 'metaDiaria',
                color: '#007bff', // Azul
                fixedValue: 100 // Meta de 100% para KPI 1102
            },
            {
                name: 'Acumulado do Dia',
                dataKey: 'percentual',
                color: '#ff0000' // Vermelho
            }
        ]
    },
    '1204': {
        title: 'KPI 12.04 - Tendência de abandono (Interno)',
        chartType: 'line',
        xAxisTitle: 'Data',
        yAxisTitle: 'Atendimento (%)',
        series: [
            {
                name: 'Meta',
                dataKey: 'metaDiaria',
                color: '#007bff', // Azul
                fixedValue: 95 // Meta de 95% para KPI 1102
            },
            {
                name: 'Eficiência Acumulada',
                dataKey: 'percentual',
                color: '#ff0000' // Vermelho
            }
        ]
    }
    
};




// Exportar a configuração para ser utilizada em outros módulos
export { kpiConfigurations, kpiConfigurationsIndicadorPonteiro, kpiConfigurationsTendencia };

