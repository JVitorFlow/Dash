const kpiConfigurations = {
    '1101': {
        title: 'Validação KPI - Gráfico de colunas',
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
            },
        ]
    },
    '1102': {
        title: 'Validação KPI - Gráfico de colunas',
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
        title: 'Validação KPI - Gráfico de colunas',
        categories: ['Desist. inferior 1 minuto', 'Desist. superior 1 minuto', 'Ligações recebidas'],
        series: [
            {
                name: 'Desist. inferior 1 minuto',
                dataKey: 'desistenciaInferior1minuto'
            },
            {
                name: 'Desist. superior 1 minuto',
                dataKey: 'desistenciaSuperior1minuto'
            },
            {
                name: 'Ligações recebidas',
                dataKey: 'ligacoesRecebidas'
            }
        ]
    },
    '1201': {
        title: 'Validação KPI - Gráfico de colunas',
        categories: ['Tempo médio(s)', 'Total ligações'],
        series: [
            {
                name: 'Tempo médio(s)',
                dataKey: 'tempoMedio'
            },
            {
                name: 'Total ligações',
                dataKey: 'totalLigacoes'
            }
        ]
    },
    '1202': {
        title: 'Validação KPI - Gráfico de colunas',
        categories: ['Ligações Recebidas', 'Atendidas Inferior a 1 Minuto', 'Atendidas Superior a 1 Minuto'],
        series: [
            {
                name: 'Ligações Recebidas',
                dataKey: 'ligacoesRecebidas'
            },
            {
                name: 'Atendidas Inferior a 1 Minuto',
                dataKey: 'atendidasInferior1Min'
            },
            {
                name: 'Atendidas Superior a 1 Minuto',
                dataKey: 'atendidasSuperior1Min'
            }
        ]
    },
    '1204': {
        title: 'Validação KPI - Gráfico de colunas',
        categories: ['Desist. inferior 1 minuto', 'Desist. superior 1 minuto', 'Ligações recebidas'],
        series: [
            {
                name: 'Desist. inferior 1 minuto',
                dataKey: 'desistenciaInferior1minuto'
            },
            {
                name: 'Desist. superior 1 minuto',
                dataKey: 'desistenciaSuperior1minuto'
            },
            {
                name: 'Ligações recebidas',
                dataKey: 'ligacoesRecebidas'
            }
        ]
    },
};

// Exportar a configuração para ser utilizada em outros módulos
export { kpiConfigurations };
