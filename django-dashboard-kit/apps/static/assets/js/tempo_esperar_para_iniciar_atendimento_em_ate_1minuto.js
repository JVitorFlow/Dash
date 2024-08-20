// Importando funções de módulos auxiliares
import { mostrarLoadingSpinner, esconderLoadingSpinner, calcularPercentual, cumpreMeta } from './helpers.js';
import { getCookie, csrftoken, formatDateToISOStringWithMilliseconds } from './utils.js';

// Função principal para buscar o indicador de tempo de espera
export function buscarIndicadorTempoEspera(isManualSearch = false) {
    let startDate, endDate;

    if (isManualSearch) {
        // Busca manual, utiliza as datas especificadas manualmente
        console.log("[INFO] Realizando busca manual");

        startDate = document.getElementById('startDateEsperaKPI1102').value;
        endDate = document.getElementById('endDateEsperaKPI1102').value;

        if (!startDate || !endDate) {
            alert('Por favor, selecione ambas as datas.');
            console.error("[ERROR] Data de início ou fim não selecionada.");
            toggleButtons(true);  // Habilita os botões em caso de erro
            return;
        }

        startDate = formatDateToISOStringWithMilliseconds(startDate);
        endDate = formatDateToISOStringWithMilliseconds(endDate);
    } else {
        // Busca automática, utiliza mês/ano para gerar as datas
        console.log("[INFO] Realizando busca automática");

        const selectedMes = document.getElementById('mesSelector').value;
        const selectedAno = document.getElementById('anoSelector').value;

        if (selectedMes && selectedAno) {
            startDate = `${selectedAno}-${selectedMes}-01T00:00:00`;
            endDate = new Date(selectedAno, selectedMes, 0).toISOString().replace(/T.*/, 'T23:59:59');

            console.log("[INFO] Datas geradas automaticamente para o KPI 1102");
        } else {
            alert('Por favor, selecione o mês e o ano.');
            console.error("[ERROR] Mês ou ano não selecionado.");
            toggleButtons(true);  // Habilita os botões em caso de erro
            return;
        }
    }

    console.log("[DEBUG] Data de Início:", startDate);
    console.log("[DEBUG] Data de Fim:", endDate);

    mostrarLoadingSpinner('loadingSpinnerEsperaKPI1102');

    const payload = {
        dtStart: startDate,
        dtFinish: endDate
    };

    const urlElement = document.getElementById('tempoEsperaAtendimento1minutoExternoKPI1102');
    if (urlElement) {
        const urlApi = urlElement.textContent.trim();
        console.log("[INFO] URL da API carregada:", urlApi);

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
            console.log('Dados recebidos do JSON:', JSON.stringify(data, null, 2));

            if (data.errcode === 0) {
                console.log('Chamando renderizarTabelaIndicadorEspera');
                renderizarTabelaIndicadorEspera(data.ura_performance);
                document.getElementById('exportExcelEsperaKP1102').style.display = 'block';
            } else {
                console.error('Erro ao buscar dados:', data.errmsg);
            }
        })
        .catch(error => {
            console.error('Erro na requisição:', error);
        })
        .finally(() => {
            esconderLoadingSpinner('loadingSpinnerEsperaKPI1102');
            toggleButtons(true); // Habilita os botões após a requisição
        });
    } else {
        console.error("[ERROR] Elemento 'tempoEsperaAtendimento1minutoExternoKPI1102' não encontrado no documento.");
        toggleButtons(true); // Habilita os botões em caso de erro
    }
}

// Função para renderizar a tabela de resultados
function renderizarTabelaIndicadorEspera(dados) {
    console.log('Executando renderizarTabelaIndicadorEspera com dados:', dados);
    const resultado = document.getElementById('resultadoEsperaKPI1102');
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

    // Filtra e processa apenas ligações externas
    dados.forEach(item => {
        if (item.tipo_atendimento === "Externo") {
            console.log(`Processando ligação externa para URA: ${item.ura}, Data: ${item.data}`);

            const percentual = calcularPercentual(item.atendidas_cognitiva_ate_um_minuto, item.atendidas_cognitiva);
            const metaCumprida = cumpreMeta(percentual);

            const uraName = item.ura.replace(' v3', '');

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${uraName || 'N/A'}</td>
                <td>${item.tipo_atendimento || 'N/A'}</td>
                <td>Dia: ${item.data || 'N/A'}</td>
                <td>Qtd Espera Superior 1min: ${item.atendidas_cognitiva_acima_um_minuto || 0}</td>
                <td>Qtd Espera Inf.1min / Atend direto: ${item.atendidas_cognitiva_ate_um_minuto || 0}</td>
                <td>Ligações atendidas: ${item.atendidas_cognitiva || 0} / Atingimento: ${percentual}%</td>
                <td>${metaCumprida}</td>
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

// Função para habilitar/desabilitar botões
function toggleButtons(enable = true) {
    const buttons = document.querySelectorAll('#filterEspera1minutoButton');
    buttons.forEach(button => {
        button.disabled = !enable;
    });
}

document.addEventListener('DOMContentLoaded', function() {
    const filterButton = document.getElementById('filterEspera1minutoButton');

    filterButton.addEventListener('click', function() {
        toggleButtons(false); // Desabilita os botões enquanto a requisição está em andamento
        buscarIndicadorTempoEspera(true);
    });

    document.getElementById('exportExcelEsperaKP1102').addEventListener('click', function() {
        const tabela = document.querySelector('#resultadoEsperaKPI1102 table');
        const wb = XLSX.utils.table_to_book(tabela, { sheet: "Sheet1" });
        XLSX.writeFile(wb, 'indicadores_espera.xlsx');
    });

    flatpickr("#startDateEsperaKPI1102", {
        enableTime: true,
        dateFormat: "d/m/Y H:i",
        time_24hr: true,
        allowInput: true,
        locale: "pt"
    });

    flatpickr("#endDateEsperaKPI1102", {
        enableTime: true,
        dateFormat: "d/m/Y H:i",
        time_24hr: true,
        allowInput: true,
        locale: "pt"
    });
});
