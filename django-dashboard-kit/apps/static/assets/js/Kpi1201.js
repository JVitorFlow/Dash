import { mostrarLoadingSpinner, esconderLoadingSpinner } from './helpers.js';
import { getCookie, csrftoken, formatDateToISOStringWithMilliseconds } from './utils.js';

// Função principal para buscar o indicador de tempo médio por atendente
export function buscarIndicadorTempoMedio(isManualSearch = false) {
    let startDate, endDate;

    // Caso a busca seja manual, utilize as datas dos campos manuais
    if (isManualSearch) {
        console.log("[INFO] Realizando busca manual");

        startDate = document.getElementById('startDateKPI1201').value;
        endDate = document.getElementById('endDateKPI1201').value;

        if (!startDate || !endDate) {
            alert('Por favor, selecione ambas as datas.');
            console.error("[ERROR] Data de início ou fim não selecionada.");
            return;
        }

        // Formatar as datas para ISO 8601 com milissegundos
        startDate = formatDateToISOStringWithMilliseconds(startDate);
        endDate = formatDateToISOStringWithMilliseconds(endDate);
    } else {
        // Caso não seja busca manual, considere o KPI 1201 com mês/ano
        const selectedKPI = document.getElementById('kpiSelector').value;
        console.log("[INFO] KPI Selecionado:", selectedKPI);

        if (selectedKPI !== '1201') {
            console.log("[INFO] KPI não é 1201, abortando buscarIndicadorTempoMedio.");
            return;
        }

        console.log("[INFO] Entrou no bloco de lógica para KPI 1201 (busca automática)");
        
        const selectedMes = document.getElementById('mesSelector').value;
        const selectedAno = document.getElementById('anoSelector').value;

        if (selectedMes && selectedAno) {
            startDate = `${selectedAno}-${selectedMes}-01T00:00:00`;
            endDate = new Date(selectedAno, selectedMes, 0).toISOString().replace(/T.*/, 'T23:59:59');

            console.log("[INFO] Datas geradas para o KPI 12.01");
            console.log("[DEBUG] Data de Início:", startDate);
            console.log("[DEBUG] Data de Fim:", endDate);
        } else {
            console.error("[ERROR] Mês ou ano não selecionado.");
            alert('Por favor, selecione o mês e o ano.');
            toggleButtons(true);  // Habilita os botões em caso de erro
            return;
        }
    }

    console.log("[DEBUG] Data de Início:", startDate);
    console.log("[DEBUG] Data de Fim:", endDate);

    mostrarLoadingSpinner('loadingSpinnerKPI1201');

    const payload = {
        dtStart: startDate,
        dtFinish: endDate
    };

    const urlElement = document.getElementById('tempoChamadasAbandonadasKPI1104');
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
                console.log('Chamando renderizarTabelaIndicadorTempoMedio');
                renderizarTabelaIndicadorTempoMedio(data.ura_performance);
                document.getElementById('exportExcelKPI1201').style.display = 'block';
            } else {
                console.error('Erro ao buscar dados:', data.errmsg);
            }
        })
        .catch(error => {
            console.error('Erro na requisição:', error);
        })
        .finally(() => {
            esconderLoadingSpinner('loadingSpinnerKPI1201');
            toggleButtons(true); // Habilita os botões após a requisição
        });
    } else {
        console.error("[ERROR] Elemento 'tempoMedioServicoAtendenteUrlData' não encontrado no documento.");
        toggleButtons(true); // Habilita os botões em caso de erro
    }
}


// Função para desabilitar/habilitar botões
function toggleButtons(enable) {
    const searchButton = document.getElementById('kpiSearchButton');
    const filterButton = document.getElementById('filterButton');
    searchButton.disabled = !enable;
    filterButton.disabled = !enable;
}

// Função para renderizar a tabela de indicadores de tempo médio
function renderizarTabelaIndicadorTempoMedio(dados) {
    const resultado = document.getElementById('resultadoTempoMedioKPI1201');
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

    dados.forEach(item => {
        if (item.tipo_atendimento === "Interno") {
            const tempoTotal = item.tempo_total_ligacao_cognitiva || 0;
            const atendidas = item.atendidas_cognitiva || 0;
            const tempoMedio = atendidas > 0 ? (tempoTotal / atendidas).toFixed(2) : 0;
            const cumpreMeta = tempoMedio <= 120 ? 'SIM' : 'NÃO';  // Considerando 2 minutos (120 segundos) como meta

            const uraName = item.ura.replace(' v3', '');
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${uraName || 'N/A'}</td>
                <td>${item.tipo_atendimento || 'N/A'}</td>
                <td>ATENDENTE: ${item.ura || 'N/A'}</td>
                <td>${item.data || 'N/A'}</td>
                <td>${item.data || 'N/A'}</td>
                <td>Ligações: ${atendidas} / Tempo médio: ${new Date(tempoMedio * 1000).toISOString().substr(11, 8)}</td>
                <td>${cumpreMeta}</td>
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

// Listeners para botões
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('filterTempoMedioButtonKPI1201').addEventListener('click', function() {
        toggleButtons(false);
        buscarIndicadorTempoMedio(true);
    });

    document.getElementById('exportExcelKPI1201').addEventListener('click', function() {
        const tabela = document.querySelector('#resultadoTempoMedioKPI1201 table');
        const wb = XLSX.utils.table_to_book(tabela, { sheet: "Sheet1" });
        XLSX.writeFile(wb, 'indicadores_tempo_medio.xlsx');
    });

    flatpickr("#startDateKPI1201", {
        enableTime: true,
        dateFormat: "d/m/Y H:i",
        time_24hr: true,
        allowInput: true,
        locale: "pt"
    });

    flatpickr("#endDateKPI1201", {
        enableTime: true,
        dateFormat: "d/m/Y H:i",
        time_24hr: true,
        allowInput: true,
        locale: "pt"
    });
});
