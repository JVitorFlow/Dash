import { csrftoken } from './utils.js';

// Função para formatar data sem os milissegundos
function formatDateToISOStringWithoutTimezone(dateString, isStartOfDay = true) {
    if (!dateString) {
        console.error("Data inválida fornecida:", dateString);
        return null;
    }

    const date = new Date(dateString);

    if (isStartOfDay) {
        // Manter as horas selecionadas pelo usuário
        date.setHours(0, 0, 0, 0);
    } else {
        date.setHours(23, 59, 59, 999);
    }

    // Formata manualmente a data sem aplicar o UTC
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    // Retorna no formato desejado
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.000Z`;
}



function somarMetricasPorURA(uraPerformance) {
    // Inicializa os totais para cada URA com distinção de "Interno" e "Externo"
    let totaisPorURA = {
        HM: {
            interno: {
                recebidas: 0,
                atendidas_cognitiva: 0,
                atendidas_tradicional: 0,
                abandonadas_cognitiva_ate_um_minuto: 0,
                abandonadas_cognitiva_acima_um_minuto: 0,
                direcionadas_humano: 0,
                direcionadas_ramal: 0,
                ligacoes_interrompidas_pelo_cliente: 0,
                tempo_total_ligacao: 0,
                tempo_total_espera: 0,
                total_uras: 0
            },
            externo: {
                recebidas: 0,
                atendidas_cognitiva: 0,
                atendidas_tradicional: 0,
                abandonadas_cognitiva_ate_um_minuto: 0,
                abandonadas_cognitiva_acima_um_minuto: 0,
                direcionadas_humano: 0,
                direcionadas_ramal: 0,
                ligacoes_interrompidas_pelo_cliente: 0,
                tempo_total_ligacao: 0,
                tempo_total_espera: 0,
                total_uras: 0
            },
            geral: {   // Adicionando a chave "geral" para tratar os casos de `tipo_atendimento` vazio
                recebidas: 0,
                atendidas_cognitiva: 0,
                atendidas_tradicional: 0,
                abandonadas_cognitiva_ate_um_minuto: 0,
                abandonadas_cognitiva_acima_um_minuto: 0,
                direcionadas_humano: 0,
                direcionadas_ramal: 0,
                ligacoes_interrompidas_pelo_cliente: 0,
                tempo_total_ligacao: 0,
                tempo_total_espera: 0,
                total_uras: 0
            }
        },
        HSJC: {
            interno: {
                recebidas: 0,
                atendidas_cognitiva: 0,
                atendidas_tradicional: 0,
                abandonadas_cognitiva_ate_um_minuto: 0,
                abandonadas_cognitiva_acima_um_minuto: 0,
                direcionadas_humano: 0,
                direcionadas_ramal: 0,
                ligacoes_interrompidas_pelo_cliente: 0,
                tempo_total_ligacao: 0,
                tempo_total_espera: 0,
                total_uras: 0
            },
            externo: {
                recebidas: 0,
                atendidas_cognitiva: 0,
                atendidas_tradicional: 0,
                abandonadas_cognitiva_ate_um_minuto: 0,
                abandonadas_cognitiva_acima_um_minuto: 0,
                direcionadas_humano: 0,
                direcionadas_ramal: 0,
                ligacoes_interrompidas_pelo_cliente: 0,
                tempo_total_ligacao: 0,
                tempo_total_espera: 0,
                total_uras: 0
            },
            geral: {   // Adicionando a chave "geral" para tratar os casos de `tipo_atendimento` vazio
                recebidas: 0,
                atendidas_cognitiva: 0,
                atendidas_tradicional: 0,
                abandonadas_cognitiva_ate_um_minuto: 0,
                abandonadas_cognitiva_acima_um_minuto: 0,
                direcionadas_humano: 0,
                direcionadas_ramal: 0,
                ligacoes_interrompidas_pelo_cliente: 0,
                tempo_total_ligacao: 0,
                tempo_total_espera: 0,
                total_uras: 0
            }
        },
        HSOR: {
            interno: {
                recebidas: 0,
                atendidas_cognitiva: 0,
                atendidas_tradicional: 0,
                abandonadas_cognitiva_ate_um_minuto: 0,
                abandonadas_cognitiva_acima_um_minuto: 0,
                direcionadas_humano: 0,
                direcionadas_ramal: 0,
                ligacoes_interrompidas_pelo_cliente: 0,
                tempo_total_ligacao: 0,
                tempo_total_espera: 0,
                total_uras: 0
            },
            externo: {
                recebidas: 0,
                atendidas_cognitiva: 0,
                atendidas_tradicional: 0,
                abandonadas_cognitiva_ate_um_minuto: 0,
                abandonadas_cognitiva_acima_um_minuto: 0,
                direcionadas_humano: 0,
                direcionadas_ramal: 0,
                ligacoes_interrompidas_pelo_cliente: 0,
                tempo_total_ligacao: 0,
                tempo_total_espera: 0,
                total_uras: 0
            },
            geral: {   // Adicionando a chave "geral" para tratar os casos de `tipo_atendimento` vazio
                recebidas: 0,
                atendidas_cognitiva: 0,
                atendidas_tradicional: 0,
                abandonadas_cognitiva_ate_um_minuto: 0,
                abandonadas_cognitiva_acima_um_minuto: 0,
                direcionadas_humano: 0,
                direcionadas_ramal: 0,
                ligacoes_interrompidas_pelo_cliente: 0,
                tempo_total_ligacao: 0,
                tempo_total_espera: 0,
                total_uras: 0
            }
        }
    };

    // Itera sobre todas as URAs e classifica por tipo de atendimento (Interno ou Externo)
    uraPerformance.forEach(ura => {
        const key = ura.ura; // 'HM', 'HSJC', ou 'HSOR'
        let tipo = (ura.tipo_atendimento || "").toLowerCase(); // Garante que seja string

    
        // Se o tipo de atendimento for vazio, trate como "geral"
        if (!tipo) {
            tipo = 'geral';
        }
    
        if (totaisPorURA[key] && totaisPorURA[key][tipo]) {
            totaisPorURA[key][tipo].recebidas += ura.recebidas || 0;
            totaisPorURA[key][tipo].atendidas_cognitiva += ura.atendidas_cognitiva || 0;
            totaisPorURA[key][tipo].atendidas_tradicional += (ura.recebidas || 0) - (ura.atendidas_cognitiva || 0);
            totaisPorURA[key][tipo].abandonadas_cognitiva_ate_um_minuto += ura.abandonadas_cognitiva_ate_um_minuto || 0;
            totaisPorURA[key][tipo].abandonadas_cognitiva_acima_um_minuto += ura.abandonadas_cognitiva_acima_um_minuto || 0;
            totaisPorURA[key][tipo].direcionadas_humano += ura.direcionadas_humano || 0;
            totaisPorURA[key][tipo].direcionadas_ramal += ura.direcionadas_ramal || 0;
            totaisPorURA[key][tipo].ligacoes_interrompidas_pelo_cliente += ura.ligacoes_interrompidas_pelo_cliente || 0;
            totaisPorURA[key][tipo].tempo_total_ligacao += ura.tempo_total_ligacao || 0;
            totaisPorURA[key][tipo].tempo_total_espera += ura.tempo_total_espera || 0;
            totaisPorURA[key][tipo].total_uras += 1;
        }
    });
    

    // Calcula as médias para cada URA
    Object.keys(totaisPorURA).forEach(uraKey => {
        const ura = totaisPorURA[uraKey];
    
        // Somar as métricas de "interno", "externo" e casos sem "tipo_atendimento"
        const somaRecebidas = (ura.interno.recebidas || 0) + (ura.externo.recebidas || 0) + (ura.geral.recebidas || 0);
        const somaDirecionadasHumano = (ura.interno.direcionadas_humano || 0) + (ura.externo.direcionadas_humano || 0) + (ura.geral.direcionadas_humano || 0);
        const somaLigacoesInterrompidas = (ura.interno.ligacoes_interrompidas_pelo_cliente || 0) + (ura.externo.ligacoes_interrompidas_pelo_cliente || 0) + (ura.geral.ligacoes_interrompidas_pelo_cliente || 0);
        const somaTempoTotalLigacao = (ura.interno.tempo_total_ligacao || 0) + (ura.externo.tempo_total_ligacao || 0) + (ura.geral.tempo_total_ligacao || 0);
        const somaTempoTotalEspera = (ura.interno.tempo_total_espera || 0) + (ura.externo.tempo_total_espera || 0) + (ura.geral.tempo_total_espera || 0);
        const totalUras = (ura.interno.total_uras || 0) + (ura.externo.total_uras || 0) + (ura.geral.total_uras || 0);
    
        // Calcular o tempo médio de ligação e espera
        if (totalUras > 0) {
            ura.tempo_medio_ligacao = somaTempoTotalLigacao / totalUras;
            ura.tempo_medio_espera = somaTempoTotalEspera / totalUras;
        } else {
            ura.tempo_medio_ligacao = 0;
            ura.tempo_medio_espera = 0;
        }
    
        // Cálculo da Resolução de Primeiro Contato para cada URA
        if (somaRecebidas > 0) {
            ura.resolucao_primeiro_contato = (
                (somaRecebidas - somaDirecionadasHumano - somaLigacoesInterrompidas)
                / somaRecebidas
            ) * 100;
        } else {
            ura.resolucao_primeiro_contato = 0;
        }
    
        // Log para verificar os cálculos
        //console.log(`URA: ${uraKey}, Resolucao: ${ura.resolucao_primeiro_contato}`);
    });
    
    
    

    // console.log(totaisPorURA);
    return totaisPorURA;

}


// Função para manipular os dados somados e atualizar o HTML
function atualizarDadosNaInterface(totaisPorURA) {
    // Função para somar valores de "interno", "externo" e "geral" para cada métrica
    function somarInternoExternoGeral(ura) {
        return {
            recebidas: (ura.interno?.recebidas || 0) + (ura.externo?.recebidas || 0) + (ura.geral?.recebidas || 0),
            atendidas_cognitiva: (ura.interno?.atendidas_cognitiva || 0) + (ura.externo?.atendidas_cognitiva || 0) + (ura.geral?.atendidas_cognitiva || 0),
            atendidas_tradicional: (ura.interno?.atendidas_tradicional || 0) + (ura.externo?.atendidas_tradicional || 0) + (ura.geral?.atendidas_tradicional || 0),
            direcionadas_humano: (ura.interno?.direcionadas_humano || 0) + (ura.externo?.direcionadas_humano || 0) + (ura.geral?.direcionadas_humano || 0),
            direcionadas_ramal: (ura.interno?.direcionadas_ramal || 0) + (ura.externo?.direcionadas_ramal || 0) + (ura.geral?.direcionadas_ramal || 0),
            ligacoes_interrompidas_pelo_cliente: (ura.interno?.ligacoes_interrompidas_pelo_cliente || 0) + (ura.externo?.ligacoes_interrompidas_pelo_cliente || 0) + (ura.geral?.ligacoes_interrompidas_pelo_cliente || 0),
            abandonadas_cognitiva_ate_um_minuto: (ura.interno?.abandonadas_cognitiva_ate_um_minuto || 0) + (ura.externo?.abandonadas_cognitiva_ate_um_minuto || 0) + (ura.geral?.abandonadas_cognitiva_ate_um_minuto || 0),
            abandonadas_cognitiva_acima_um_minuto: (ura.interno?.abandonadas_cognitiva_acima_um_minuto || 0) + (ura.externo?.abandonadas_cognitiva_acima_um_minuto || 0) + (ura.geral?.abandonadas_cognitiva_acima_um_minuto || 0),
            resolucao_primeiro_contato: ura.resolucao_primeiro_contato || 0 // Pegar diretamente da métrica calculada
        };
    }

    // Atualizar dados da URA HM
    const totaisHM = somarInternoExternoGeral(totaisPorURA.HM);
    document.querySelector('.processadas-hm').innerText = totaisHM.recebidas;
    document.querySelector('.atendidas-cognitiva-hm').innerText = totaisHM.atendidas_cognitiva;
    document.querySelector('.atendidas-tradicional-hm').innerText = totaisHM.atendidas_tradicional;
    document.querySelector('.direcionadas-humano-hm').innerText = totaisHM.direcionadas_humano;
    document.querySelector('.direcionadas-ramal-hm').innerText = totaisHM.direcionadas_ramal;
    document.querySelector('.abandonadas-hm').innerText = totaisHM.ligacoes_interrompidas_pelo_cliente;
    document.querySelector('.resolucao-hm').innerText = `${totaisHM.resolucao_primeiro_contato.toFixed(2)}%`;

    // Atualizar abandonadas cognitivas para HM
    document.querySelector('.abandonadas-cognitiva-ate-um-minuto-interno-hm').innerText = totaisPorURA.HM.interno.abandonadas_cognitiva_ate_um_minuto || 0;
    document.querySelector('.abandonadas-cognitiva-ate-um-minuto-externo-hm').innerText = totaisPorURA.HM.externo.abandonadas_cognitiva_ate_um_minuto || 0;
    document.querySelector('.abandonadas-cognitiva-acima-um-minuto-interno-hm').innerText = totaisPorURA.HM.interno.abandonadas_cognitiva_acima_um_minuto || 0;
    document.querySelector('.abandonadas-cognitiva-acima-um-minuto-externo-hm').innerText = totaisPorURA.HM.externo.abandonadas_cognitiva_acima_um_minuto || 0;

    // Atualizar dados da URA HSJC
    const totaisHSJC = somarInternoExternoGeral(totaisPorURA.HSJC);
    document.querySelector('.processadas-hsjc').innerText = totaisHSJC.recebidas;
    document.querySelector('.atendidas-cognitiva-hsjc').innerText = totaisHSJC.atendidas_cognitiva;
    document.querySelector('.atendidas-tradicional-hsjc').innerText = totaisHSJC.atendidas_tradicional;
    document.querySelector('.direcionadas-humano-hsjc').innerText = totaisHSJC.direcionadas_humano;
    document.querySelector('.direcionadas-ramal-hsjc').innerText = totaisHSJC.direcionadas_ramal;
    document.querySelector('.abandonadas-hsjc').innerText = totaisHSJC.ligacoes_interrompidas_pelo_cliente;
    document.querySelector('.resolucao-hsjc').innerText = `${totaisHSJC.resolucao_primeiro_contato.toFixed(2)}%`;

    // Atualizar abandonadas cognitivas para HSJC
    document.querySelector('.abandonadas-cognitiva-ate-um-minuto-interno-hsjc').innerText = totaisPorURA.HSJC.interno.abandonadas_cognitiva_ate_um_minuto || 0;
    document.querySelector('.abandonadas-cognitiva-ate-um-minuto-externo-hsjc').innerText = totaisPorURA.HSJC.externo.abandonadas_cognitiva_ate_um_minuto || 0;
    document.querySelector('.abandonadas-cognitiva-acima-um-minuto-interno-hsjc').innerText = totaisPorURA.HSJC.interno.abandonadas_cognitiva_acima_um_minuto || 0;
    document.querySelector('.abandonadas-cognitiva-acima-um-minuto-externo-hsjc').innerText = totaisPorURA.HSJC.externo.abandonadas_cognitiva_acima_um_minuto || 0;

    // Atualizar dados da URA HSOR
    const totaisHSOR = somarInternoExternoGeral(totaisPorURA.HSOR);
    document.querySelector('.processadas-hsor').innerText = totaisHSOR.recebidas;
    document.querySelector('.atendidas-cognitiva-hsor').innerText = totaisHSOR.atendidas_cognitiva;
    document.querySelector('.atendidas-tradicional-hsor').innerText = totaisHSOR.atendidas_tradicional;
    document.querySelector('.direcionadas-humano-hsor').innerText = totaisHSOR.direcionadas_humano;
    document.querySelector('.direcionadas-ramal-hsor').innerText = totaisHSOR.direcionadas_ramal;
    document.querySelector('.abandonadas-hsor').innerText = totaisHSOR.ligacoes_interrompidas_pelo_cliente;
    document.querySelector('.resolucao-hsor').innerText = `${totaisHSOR.resolucao_primeiro_contato.toFixed(2)}%`;

    // Atualizar abandonadas cognitivas para HSOR
    document.querySelector('.abandonadas-cognitiva-ate-um-minuto-interno-hsor').innerText = totaisPorURA.HSOR.interno.abandonadas_cognitiva_ate_um_minuto || 0;
    document.querySelector('.abandonadas-cognitiva-ate-um-minuto-externo-hsor').innerText = totaisPorURA.HSOR.externo.abandonadas_cognitiva_ate_um_minuto || 0;
    document.querySelector('.abandonadas-cognitiva-acima-um-minuto-interno-hsor').innerText = totaisPorURA.HSOR.interno.abandonadas_cognitiva_acima_um_minuto || 0;
    document.querySelector('.abandonadas-cognitiva-acima-um-minuto-externo-hsor').innerText = totaisPorURA.HSOR.externo.abandonadas_cognitiva_acima_um_minuto || 0;
}




document.getElementById('filtroRelatorioUra').addEventListener('click', function() {
    // Desativa o botão de filtrar e exibe o spinner
    const filterButton = document.getElementById('filtroRelatorioUra');
    filterButton.disabled = true; // Desativar o botão


    // Capturar os valores de data
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;

    // Verificar se as datas foram selecionadas
    if (!startDate || !endDate) {
        alert('Por favor, selecione as datas de início e fim.');
        return;
    }



    // Formatar as datas no formato ISO 8601
    const startISO = formatDateToISOStringWithoutTimezone(startDate, true);
    const endISO = formatDateToISOStringWithoutTimezone(endDate, false);

    //console.log("Data de Início:", startISO);
    // console.log("Data de Fim:", endISO);

    // Criar o payload
    const payload = {
        dtStart: startISO,
        dtFinish: endISO
    };

    // Log para depuração
    // console.log("Payload para API:", payload);

    const urlElement = document.getElementById('indicadorDeDesempenhoURL');
    const urlApi = urlElement.textContent.trim();

    const spinner = document.getElementById('loadingSpinner');
    spinner.style.display = 'block';

    const tableContent = document.getElementById('tableMetrics');
    if (tableContent) {
        tableContent.style.display = 'none';
    }

    // Enviar a requisição para a API
    fetch(urlApi, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken
        },
        body: JSON.stringify(payload)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Erro na requisição: ' + response.status);
        }
        return response.json();
    })
    .then(data => {
        //console.log("Dados recebidos do backend:", data);
        // Chamar a função para somar as métricas por URA
        const totaisPorURA = somarMetricasPorURA(data.ura_performance);
        
        // Atualizar a interface com os dados
        atualizarDadosNaInterface(totaisPorURA);

        // Reativar o botão de filtrar e ocultar o spinner após o carregamento dos dados
        filterButton.disabled = false;
        // Ocultar o spinner de carregamento e mostrar a tabela
        spinner.style.display = 'none';
        if (tableContent) {
            tableContent.style.display = 'block';
        }
    })
    .catch(error => {
        console.error("Erro ao buscar dados:", error);
        alert('Ocorreu um erro ao buscar os dados. Tente novamente mais tarde.');
        filterButton.disabled = false;
        spinner.style.display = 'none';
    });
});

// Função para tratar a seleção do período e atualizar as datas
document.getElementById('select-periodo').addEventListener('change', function() {
    const periodo = this.value;
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    
    const now = new Date(); // Data e hora atuais
    let startDate = new Date(); // Data de início

    // Define o intervalo de acordo com a seleção
    switch (periodo) {
        case 'today':
            startDate.setHours(0, 0, 0, 0); // Começa à meia-noite
            break;
        case '7':
            startDate.setDate(now.getDate() - 7);
            startDate.setHours(0, 0, 0, 0); // Ajuste para começar à meia-noite
            break;
        case '15':
            startDate.setDate(now.getDate() - 15);
            startDate.setHours(0, 0, 0, 0); // Ajuste para começar à meia-noite
            break;
        case '30':
            startDate.setDate(now.getDate() - 30);
            startDate.setHours(0, 0, 0, 0); // Ajuste para começar à meia-noite
            break;
        default:
            startDate = null; // Caso selecione "Selecione", deixa os campos vazios
            break;
    }

    // Função auxiliar para formatar a data no padrão esperado (YYYY-MM-DDTHH:MM)
    function formatDateToLocal(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    }

    // Atualiza os valores dos campos de data
    if (startDate) {
        const formattedStartDate = formatDateToLocal(startDate); // Formato compatível com input datetime-local
        const formattedEndDate = formatDateToLocal(now);

        startDateInput.value = formattedStartDate;
        endDateInput.value = formattedEndDate;
    } else {
        startDateInput.value = '';
        endDateInput.value = '';
    }
});

