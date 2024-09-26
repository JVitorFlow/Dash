import { csrftoken } from './utils.js';

function formatDateToLocalISOString(dateString) {
    if (!dateString) {
        console.error("Data inválida fornecida:", dateString);
        return null;
    }

    const date = new Date(dateString);

    // Formata manualmente a data sem converter para UTC
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    // Retorna a data formatada preservando o fuso horário local
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
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
                tempo_total_ligacao_cognitiva: 0,
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
                tempo_total_ligacao_cognitiva: 0,
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
                tempo_total_ligacao_cognitiva: 0,
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
                tempo_total_ligacao_cognitiva: 0,
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
                tempo_total_ligacao_cognitiva: 0,
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
                tempo_total_ligacao_cognitiva: 0,
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
                tempo_total_ligacao_cognitiva: 0,
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
                tempo_total_ligacao_cognitiva: 0,
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
                tempo_total_ligacao_cognitiva: 0,
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
            
            totaisPorURA[key][tipo].tempo_total_ligacao_cognitiva  += ura.tempo_total_ligacao_cognitiva || 0;
            totaisPorURA[key][tipo].tempo_total_espera += ura.tempo_total_espera || 0;
            totaisPorURA[key][tipo].total_uras += 1;
        }
    });
    
    

    // Calcula as médias para cada URA
    Object.keys(totaisPorURA).forEach(uraKey => {
        const ura = totaisPorURA[uraKey];
        
        ['interno', 'externo', 'geral'].forEach(tipo => {
            const totals = ura[tipo];

            const somaAtendidasCognitiva = totals.atendidas_cognitiva;
            const somaTempoTotalLigacaoCognitiva = totals.tempo_total_ligacao_cognitiva;
            
            // Calcula o tempo médio de ligação cognitiva
            totals.tempo_medio_ligacao_cognitiva = somaAtendidasCognitiva > 0 
                ? somaTempoTotalLigacaoCognitiva / somaAtendidasCognitiva 
                : 0;

            // Exibe o resultado
            //console.log(`URA: ${uraKey}, Tipo: ${tipo}`);
            //console.log(`  Tempo Médio Ligação Cognitiva: ${totals.tempo_medio_ligacao_cognitiva.toFixed(2)} segundos`);
        });
    });
    
    // console.log(totaisPorURA);
    return totaisPorURA;

}

function formatTime(seconds) {
    // Verifica se o valor é válido ou é zero
    if (seconds === 0 || isNaN(seconds)) {
        return "0 min 0s";
    }

    const mins = Math.floor(seconds / 60); // Calcula os minutos inteiros
    const secs = Math.floor(seconds % 60); // Calcula os segundos restantes

    // Retorna a string formatada com minutos e segundos
    return `${mins} min ${secs}s`;
}


// Função para manipular os dados somados e atualizar o HTML
function atualizarDadosNaInterface(totaisPorURA) {
    // Função para somar valores de "interno", "externo" e "geral" para cada métrica
    function somarInternoExternoGeral(ura) {
        console.log("Processando URA:", ura);
        

        const tempoTotalEsperaInterno = ura.interno?.tempo_total_espera || 0;
        const tempoTotalEsperaExterno = ura.externo?.tempo_total_espera || 0;

        const chamadasInterno = ura.interno?.recebidas || 0;
        const chamadasExterno = ura.externo?.recebidas || 0;

        // Cálculo do tempo médio de espera unificado entre interno e externo com base no tempo total de espera
        const tempoMediaEsperaUnificado = 
            (chamadasInterno + chamadasExterno) > 0 
            ? (tempoTotalEsperaInterno + tempoTotalEsperaExterno) / (chamadasInterno + chamadasExterno)
            : 0;

        console.log(`Interno: ${tempoTotalEsperaInterno}, Externo: ${tempoTotalEsperaExterno}, Unificado: ${tempoMediaEsperaUnificado}`);

        return {
            recebidas: (ura.interno?.recebidas || 0) + (ura.externo?.recebidas || 0) + (ura.geral?.recebidas || 0),
            atendidas_cognitiva: (ura.interno?.atendidas_cognitiva || 0) + (ura.externo?.atendidas_cognitiva || 0) + (ura.geral?.atendidas_cognitiva || 0),
            atendidas_tradicional: (ura.interno?.atendidas_tradicional || 0) + (ura.externo?.atendidas_tradicional || 0) + (ura.geral?.atendidas_tradicional || 0),
            direcionadas_humano: (ura.interno?.direcionadas_humano || 0) + (ura.externo?.direcionadas_humano || 0) + (ura.geral?.direcionadas_humano || 0),
            direcionadas_ramal: (ura.interno?.direcionadas_ramal || 0) + (ura.externo?.direcionadas_ramal || 0) + (ura.geral?.direcionadas_ramal || 0),
            ligacoes_interrompidas_pelo_cliente: (ura.interno?.ligacoes_interrompidas_pelo_cliente || 0) + (ura.externo?.ligacoes_interrompidas_pelo_cliente || 0) + (ura.geral?.ligacoes_interrompidas_pelo_cliente || 0),
            //abandonadas_cognitiva_ate_um_minuto: (ura.interno?.abandonadas_cognitiva_ate_um_minuto || 0) + (ura.externo?.abandonadas_cognitiva_ate_um_minuto || 0) + (ura.geral?.abandonadas_cognitiva_ate_um_minuto || 0),
            abandonadas_cognitiva_acima_um_minuto: (ura.interno?.abandonadas_cognitiva_acima_um_minuto || 0) + (ura.externo?.abandonadas_cognitiva_acima_um_minuto || 0) + (ura.geral?.abandonadas_cognitiva_acima_um_minuto || 0),
            
            tempo_media_espera_interno: chamadasInterno > 0 ? tempoTotalEsperaInterno / chamadasInterno : 0,
            tempo_media_espera_externo: chamadasExterno > 0 ? tempoTotalEsperaExterno / chamadasExterno : 0,
            tempo_media_espera_unificado: tempoMediaEsperaUnificado
        };
    }

    // Função para pegar o tempo médio de ligação cognitiva apenas para o tipo "interno".
    function pegarTempoMedioCognitivoInterno(ura) {
        return ura.interno?.tempo_medio_ligacao_cognitiva || 0;
    }

    // Função para pegar o tempo médio de espera para "interno", "externo" e "geral"
    function pegarTempoMedioEspera(ura) {
        return {
            interno: ura.interno?.tempo_media_espera || 0,
            externo: ura.externo?.tempo_media_espera || 0,
            geral: ura.geral?.tempo_media_espera || 0
        };
    }

    // Atualizar dados da URA HM
    const totaisHM = somarInternoExternoGeral(totaisPorURA.HM);
    const tempoMedioCognitivoInternoHM = pegarTempoMedioCognitivoInterno(totaisPorURA.HM);
    
    const percentageTradicionalHM = totaisHM.recebidas > 0 
    ? ((totaisHM.atendidas_tradicional / totaisHM.recebidas) * 100).toFixed(2) 
    : 0;

    const percentageCognitivaHM = totaisHM.recebidas > 0 
        ? ((totaisHM.atendidas_cognitiva / totaisHM.recebidas) * 100).toFixed(2) 
        : 0;
    
    const percentageHumanoHM = totaisHM.recebidas > 0 
        ? ((totaisHM.direcionadas_humano / totaisHM.recebidas) * 100).toFixed(2) 
        : 0;

    const percentageRamalHM = totaisHM.recebidas > 0 
        ? ((totaisHM.direcionadas_ramal / totaisHM.recebidas) * 100).toFixed(2) 
        : 0;

    const percentagePacienteInterrompeu = totaisHM.recebidas > 0 
        ? ((totaisHM.ligacoes_interrompidas_pelo_cliente / totaisHM.recebidas) * 100).toFixed(2) 
        : 0;

    document.querySelector('.processadas-hm').innerText = totaisHM.recebidas;

    document.querySelector('.atendidas-cognitiva-hm').innerText = totaisHM.atendidas_cognitiva;
    document.querySelector('.percentage-cognitiva-hm').textContent = `${percentageCognitivaHM}%`;

    document.querySelector('.atendidas-tradicional-hm').innerText = totaisHM.atendidas_tradicional;
    document.querySelector('.percentage-text-hm').textContent = `${percentageTradicionalHM}%`;

    document.querySelector('.direcionadas-humano-hm').innerText = totaisHM.direcionadas_humano;
    document.querySelector('.percentage-humano-hm').textContent = `${percentageHumanoHM}%`;

    
    document.querySelector('.direcionadas-ramal-hm').innerText = totaisHM.direcionadas_ramal;
    document.querySelector('.percentage-ramal-hm').textContent = `${percentageRamalHM}%`;

    document.querySelector('.abandonadas-hm').innerText = totaisHM.ligacoes_interrompidas_pelo_cliente;
    document.querySelector('.percentage-abandonadas-hm').textContent = `${percentagePacienteInterrompeu}%`;

    document.querySelector('.tempo-medio-cognitiva-hm').innerText = formatTime(tempoMedioCognitivoInternoHM);

    document.querySelector('.tempo-medio-espera-unificado-hm').innerText = formatTime(totaisHM.tempo_media_espera_unificado);
    document.querySelector('.tempo-medio-espera-interno-hm').innerText = formatTime(totaisHM.tempo_media_espera_interno);
    document.querySelector('.tempo-medio-espera-externo-hm').innerText = formatTime(totaisHM.tempo_media_espera_externo);

    // Atualizar abandonadas cognitivas para HM
    // document.querySelector('.abandonadas-cognitiva-ate-um-minuto-interno-hm').innerText = totaisPorURA.HM.interno.abandonadas_cognitiva_ate_um_minuto || 0;
    // document.querySelector('.abandonadas-cognitiva-ate-um-minuto-externo-hm').innerText = totaisPorURA.HM.externo.abandonadas_cognitiva_ate_um_minuto || 0;
    document.querySelector('.abandonadas-cognitiva-acima-um-minuto-interno-hm').innerText = totaisPorURA.HM.interno.abandonadas_cognitiva_acima_um_minuto || 0;
    document.querySelector('.abandonadas-cognitiva-acima-um-minuto-externo-hm').innerText = totaisPorURA.HM.externo.abandonadas_cognitiva_acima_um_minuto || 0;

    // Atualizar dados da URA HSJC
    const totaisHSJC = somarInternoExternoGeral(totaisPorURA.HSJC);
    const tempoMedioCognitivoInternoHSJC = pegarTempoMedioCognitivoInterno(totaisPorURA.HSJC);

    const percentageTradicionalHSJC = totaisHSJC.recebidas > 0 
    ? ((totaisHSJC.atendidas_tradicional / totaisHSJC.recebidas) * 100).toFixed(2) 
    : 0;

    const percentageCognitivaHSJC = totaisHSJC.recebidas > 0 
        ? ((totaisHSJC.atendidas_cognitiva / totaisHSJC.recebidas) * 100).toFixed(2) 
        : 0;
    
    const percentageHumanoHSJC = totaisHSJC.recebidas > 0 
        ? ((totaisHSJC.direcionadas_humano / totaisHSJC.recebidas) * 100).toFixed(2) 
        : 0;

    const percentageRamalHSJC = totaisHSJC.recebidas > 0 
        ? ((totaisHSJC.direcionadas_ramal / totaisHSJC.recebidas) * 100).toFixed(2) 
        : 0;

    const percentagePacienteInterrompeuHSJC = totaisHSJC.recebidas > 0 
        ? ((totaisHSJC.ligacoes_interrompidas_pelo_cliente / totaisHSJC.recebidas) * 100).toFixed(2) 
        : 0;


    document.querySelector('.processadas-hsjc').innerText = totaisHSJC.recebidas;
    
    document.querySelector('.atendidas-cognitiva-hsjc').innerText = totaisHSJC.atendidas_cognitiva;
    document.querySelector('.percentage-cognitiva-hsjc').innerText = `${percentageCognitivaHSJC}%`;

    document.querySelector('.atendidas-tradicional-hsjc').innerText = totaisHSJC.atendidas_tradicional;
    document.querySelector('.percentage-tradicional-hsjc').innerText = `${percentageTradicionalHSJC}%`;

    document.querySelector('.direcionadas-humano-hsjc').innerText = totaisHSJC.direcionadas_humano;
    document.querySelector('.percentage-humano-hsjc').innerText = `${percentageHumanoHSJC}%`;

    document.querySelector('.direcionadas-ramal-hsjc').innerText = totaisHSJC.direcionadas_ramal;
    document.querySelector('.percentage-ramal-hsjc').innerText = `${percentageRamalHSJC}%`;

    
    document.querySelector('.abandonadas-hsjc').innerText = totaisHSJC.ligacoes_interrompidas_pelo_cliente;
    document.querySelector('.percentage-abandonadas-hsjc').innerText = `${percentagePacienteInterrompeuHSJC}%`;

    document.querySelector('.tempo-medio-cognitiva-hsjc').innerText = formatTime(tempoMedioCognitivoInternoHSJC);



    document.querySelector('.tempo-medio-espera-unificado-hsjc').innerText = formatTime(totaisHM.tempo_media_espera_unificado);
    document.querySelector('.tempo-medio-espera-interno-hsjc').innerText = formatTime(totaisHM.tempo_media_espera_interno);
    document.querySelector('.tempo-medio-espera-externo-hsjc').innerText = formatTime(totaisHM.tempo_media_espera_externo);

    // Atualizar abandonadas cognitivas para HSJC
    // document.querySelector('.abandonadas-cognitiva-ate-um-minuto-interno-hsjc').innerText = totaisPorURA.HSJC.interno.abandonadas_cognitiva_ate_um_minuto || 0;
    // document.querySelector('.abandonadas-cognitiva-ate-um-minuto-externo-hsjc').innerText = totaisPorURA.HSJC.externo.abandonadas_cognitiva_ate_um_minuto || 0;
    document.querySelector('.abandonadas-cognitiva-acima-um-minuto-interno-hsjc').innerText = totaisPorURA.HSJC.interno.abandonadas_cognitiva_acima_um_minuto || 0;
    document.querySelector('.abandonadas-cognitiva-acima-um-minuto-externo-hsjc').innerText = totaisPorURA.HSJC.externo.abandonadas_cognitiva_acima_um_minuto || 0;

    // Atualizar dados da URA HSOR
    const totaisHSOR = somarInternoExternoGeral(totaisPorURA.HSOR);
    const tempoMedioCognitivoInternoHSOR = pegarTempoMedioCognitivoInterno(totaisPorURA.HSOR);

    const percentageTradicionalHSOR = totaisHSOR.recebidas > 0 
    ? ((totaisHSOR.atendidas_tradicional / totaisHSOR.recebidas) * 100).toFixed(2) 
    : 0;

    const percentageCognitivaHSOR = totaisHSOR.recebidas > 0 
        ? ((totaisHSOR.atendidas_cognitiva / totaisHSOR.recebidas) * 100).toFixed(2) 
        : 0;
    
    const percentageHumanoHSOR = totaisHSOR.recebidas > 0 
        ? ((totaisHSOR.direcionadas_humano / totaisHSOR.recebidas) * 100).toFixed(2) 
        : 0;

    const percentageRamalHSOR = totaisHSOR.recebidas > 0 
        ? ((totaisHSOR.direcionadas_ramal / totaisHSOR.recebidas) * 100).toFixed(2) 
        : 0;

    const percentagePacienteInterrompeuHSOR = totaisHSOR.recebidas > 0 
        ? ((totaisHSOR.ligacoes_interrompidas_pelo_cliente / totaisHSOR.recebidas) * 100).toFixed(2) 
        : 0;

    document.querySelector('.processadas-hsor').innerText = totaisHSOR.recebidas;
    
    document.querySelector('.atendidas-cognitiva-hsor').innerText = totaisHSOR.atendidas_cognitiva;
    document.querySelector('.percentage-cognitiva-hsor').innerText = `${percentageCognitivaHSOR}%`;
    
    document.querySelector('.atendidas-tradicional-hsor').innerText = totaisHSOR.atendidas_tradicional;
    document.querySelector('.percentage-tradicional-hsor').innerText = `${percentageTradicionalHSOR}%`;

    document.querySelector('.direcionadas-humano-hsor').innerText = totaisHSOR.direcionadas_humano;
    document.querySelector('.percentage-humano-hsor').innerText = `${percentageHumanoHSOR}%`;
    
    document.querySelector('.direcionadas-ramal-hsor').innerText = totaisHSOR.direcionadas_ramal;
    document.querySelector('.percentage-ramal-hsor').innerText = `${percentageRamalHSOR}%`;
    
    document.querySelector('.abandonadas-hsor').innerText = totaisHSOR.ligacoes_interrompidas_pelo_cliente;
    document.querySelector('.percentage-abandonadas-hsor').innerText = `${percentagePacienteInterrompeuHSOR}%`;
    
    document.querySelector('.tempo-medio-cognitiva-hsor').innerText = formatTime(tempoMedioCognitivoInternoHSOR);

    document.querySelector('.tempo-medio-espera-unificado-hsor').innerText = formatTime(totaisHM.tempo_media_espera_unificado);
    document.querySelector('.tempo-medio-espera-interno-hsor').innerText = formatTime(totaisHM.tempo_media_espera_interno);
    document.querySelector('.tempo-medio-espera-externo-hsor').innerText = formatTime(totaisHM.tempo_media_espera_externo);


    // Atualizar abandonadas cognitivas para HSOR
    // document.querySelector('.abandonadas-cognitiva-ate-um-minuto-interno-hsor').innerText = totaisPorURA.HSOR.interno.abandonadas_cognitiva_ate_um_minuto || 0;
    // document.querySelector('.abandonadas-cognitiva-ate-um-minuto-externo-hsor').innerText = totaisPorURA.HSOR.externo.abandonadas_cognitiva_ate_um_minuto || 0;
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
    const startISO = formatDateToLocalISOString(startDate);
    const endISO = formatDateToLocalISOString(endDate);

    // console.log("Data de Início:", startISO);
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
        console.log("Dados recebidos do backend:", data);

        // Verificar se há dados retornados
        if (data.ura_performance && data.ura_performance.length > 0) {
            // Chamar a função para somar as métricas por URA
            const totaisPorURA = somarMetricasPorURA(data.ura_performance);
            
            // Atualizar a interface com os dados
            atualizarDadosNaInterface(totaisPorURA);
            
            // Mostrar a tabela de métricas
            if (tableContent) {
                tableContent.style.display = 'block';
            }

            noDataMessage.style.display = 'none'; // Ocultar mensagem de "Nenhum dado encontrado"
        } else {
            // Se não houver dados, mostrar a mensagem
            noDataMessage.style.display = 'block';
            if (tableContent) {
                tableContent.style.display = 'none';
            }
        }

        // Reativar o botão de filtrar e ocultar o spinner após o carregamento dos dados
        filterButton.disabled = false;
        spinner.style.display = 'none';
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

document.getElementById('download-png').addEventListener('click', function() {
    const downloadButton = this;
    downloadButton.disabled = true; // Desabilitar o botão durante a captura

    const reportSection = document.getElementById('tableMetrics');

    // Salvar estilos originais
    const originalStyles = {
        width: reportSection.style.width,
        transform: reportSection.style.transform,
        zoom: reportSection.style.zoom,
        position: reportSection.style.position,
        left: reportSection.style.left,
        top: reportSection.style.top,
    };

    // Definir estilos fixos para captura
    reportSection.style.width = '1920px'; // Largura fixa
    reportSection.style.transform = 'scale(1)'; // Remover transformações de escala
    reportSection.style.zoom = 1; // Garantir zoom 1:1
    reportSection.style.position = 'relative'; // Garantir que a posição seja relativa
    reportSection.style.left = '0';
    reportSection.style.top = '0';

    // Rolagem para o topo
    window.scrollTo(0, 0);

    // Aguarde um pequeno intervalo para garantir que os estilos sejam aplicados
    setTimeout(function() {
        html2canvas(reportSection, {
            scrollX: -window.scrollX,
            scrollY: -window.scrollY,
            scale: 3, // Aumentar para melhorar a resolução (tente 3, 4 ou 5)
            useCORS: true,
            allowTaint: false,
            backgroundColor: null,
        }).then(function(canvas) {
            // Restaurar estilos originais
            Object.assign(reportSection.style, originalStyles);

            // Converter o canvas em imagem e iniciar o download
            const imgData = canvas.toDataURL('image/png');

            // Criar um link temporário para download
            const link = document.createElement('a');
            link.href = imgData;
            link.download = 'dashboard.png';

            // Adicionar o link ao documento e simular o clique
            document.body.appendChild(link);
            link.click();

            // Remover o link do documento
            document.body.removeChild(link);

            downloadButton.disabled = false; // Reabilitar o botão
        }).catch(function(error) {
            console.error("Erro ao capturar a tela:", error);

            // Restaurar estilos originais em caso de erro
            Object.assign(reportSection.style, originalStyles);

            downloadButton.disabled = false; // Reabilitar o botão em caso de erro
        });
    }, 500); // Intervalo de 500ms para garantir que os estilos sejam aplicados
});




// Seleciona todos os botões "Ver detalhes"
document.querySelectorAll('.toggle-details').forEach(button => {
    button.addEventListener('click', function() {
        const details = this.previousElementSibling; // Seleciona a div de detalhes anterior ao botão
        if (details.style.display === 'none' || details.style.display === '') {
            details.style.display = 'block';
            this.textContent = 'Ocultar detalhes'; // Troca o texto do botão
        } else {
            details.style.display = 'none';
            this.textContent = 'Ver detalhes'; // Retorna ao texto original
        }
    });
});

