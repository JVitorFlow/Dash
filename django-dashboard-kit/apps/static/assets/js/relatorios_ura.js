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
    // Inicializa os totais para cada URA
    let totaisPorURA = {
        HM: {
            recebidas: 0,
            direcionadas_humano: 0,
            direcionadas_ramal: 0,
            ligacoes_interrompidas_pelo_cliente: 0,
            tempo_total_ligacao: 0,
            tempo_total_espera: 0,
            total_uras: 0
        },
        HSJC: {
            recebidas: 0,
            direcionadas_humano: 0,
            direcionadas_ramal: 0,
            ligacoes_interrompidas_pelo_cliente: 0,
            tempo_total_ligacao: 0,
            tempo_total_espera: 0,
            total_uras: 0
        },
        HSOR: {
            recebidas: 0,
            direcionadas_humano: 0,
            direcionadas_ramal: 0,
            ligacoes_interrompidas_pelo_cliente: 0,
            tempo_total_ligacao: 0,
            tempo_total_espera: 0,
            total_uras: 0
        }
    };

    // Itera sobre todas as URAs e soma os valores por cada URA
    uraPerformance.forEach(ura => {
        const key = ura.ura; // 'HM', 'HSJC', ou 'HSOR'
        if (totaisPorURA[key]) {
            totaisPorURA[key].recebidas += ura.recebidas || 0;
            totaisPorURA[key].direcionadas_humano += ura.direcionadas_humano || 0;
            totaisPorURA[key].direcionadas_ramal += ura.direcionadas_ramal || 0;
            totaisPorURA[key].ligacoes_interrompidas_pelo_cliente += ura.ligacoes_interrompidas_pelo_cliente || 0;
            totaisPorURA[key].tempo_total_ligacao += ura.tempo_total_ligacao || 0;
            totaisPorURA[key].tempo_total_espera += ura.tempo_total_espera || 0;
            totaisPorURA[key].total_uras += 1;
        }
    });

    // Calcula as médias para cada URA
    Object.keys(totaisPorURA).forEach(uraKey => {
        const ura = totaisPorURA[uraKey];
        if (ura.total_uras > 0) {
            ura.tempo_medio_ligacao = ura.tempo_total_ligacao / ura.total_uras;
            ura.tempo_medio_espera = ura.tempo_total_espera / ura.total_uras;
        } else {
            ura.tempo_medio_ligacao = 0;
            ura.tempo_medio_espera = 0;
        }

        // Cálculo da Resolução de Primeiro Contato para cada URA
        if (ura.recebidas > 0) {
            ura.resolucao_primeiro_contato = (
                (ura.recebidas - ura.direcionadas_humano - ura.ligacoes_interrompidas_pelo_cliente)
                / ura.recebidas
            ) * 100;
        } else {
            ura.resolucao_primeiro_contato = 0;  // Evita divisão por zero
        }
    });

    return totaisPorURA;
}


// Função para manipular os dados somados e atualizar o HTML
function atualizarDadosNaInterface(totaisPorURA) {
    // Atualizar dados da URA HM
    document.querySelector('.processadas-hm').innerText = totaisPorURA.HM.recebidas || 0;
    document.querySelector('.resolucao-hm').innerText = `${totaisPorURA.HM.resolucao_primeiro_contato.toFixed(2)}%` || '0%';
    document.querySelector('.direcionadas-humano-hm').innerText = totaisPorURA.HM.direcionadas_humano || 0;
    document.querySelector('.direcionadas-ramal-hm').innerText = totaisPorURA.HM.direcionadas_ramal || 0;
    document.querySelector('.abandonadas-hm').innerText = totaisPorURA.HM.ligacoes_interrompidas_pelo_cliente || 0;


    // Atualizar dados da URA HSJC
    document.querySelector('.processadas-hsjc').innerText = totaisPorURA.HSJC.recebidas || 0;
    document.querySelector('.resolucao-hsjc').innerText = `${totaisPorURA.HSJC.resolucao_primeiro_contato.toFixed(2)}%` || '0%';
    document.querySelector('.direcionadas-humano-hsjc').innerText = totaisPorURA.HSJC.direcionadas_humano || 0;
    document.querySelector('.direcionadas-ramal-hsjc').innerText = totaisPorURA.HSJC.direcionadas_ramal || 0;
    document.querySelector('.abandonadas-hsjc').innerText = totaisPorURA.HSJC.ligacoes_interrompidas_pelo_cliente || 0;

    // Atualizar dados da URA HSOR
    document.querySelector('.processadas-hsor').innerText = totaisPorURA.HSOR.recebidas || 0;
    document.querySelector('.resolucao-hsor').innerText = `${totaisPorURA.HSOR.resolucao_primeiro_contato.toFixed(2)}%` || '0%';
    document.querySelector('.direcionadas-humano-hsor').innerText = totaisPorURA.HSOR.direcionadas_humano || 0;
    document.querySelector('.direcionadas-ramal-hsor').innerText = totaisPorURA.HSOR.direcionadas_ramal || 0;
    document.querySelector('.abandonadas-hsor').innerText = totaisPorURA.HSOR.ligacoes_interrompidas_pelo_cliente || 0;
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

