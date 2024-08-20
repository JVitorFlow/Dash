// Importando funções de módulos auxiliares
import { mostrarLoadingSpinner, esconderLoadingSpinner, calcularPercentual, cumpreMeta } from './helpers.js';
import { getCookie, csrftoken, formatDateToISOStringWithMilliseconds } from './utils.js';

// Função principal para buscar o indicador de chamadas abandonadas
export function buscarIndicadorChamadasAbandonadas(isManualSearch = false) {
    let startDate, endDate;

    // Se for uma busca manual, usa as datas especificadas
    if (isManualSearch) {
        console.log("[INFO] Realizando busca manual para KPI 1104");

        startDate = document.getElementById('startDateAbandonadasKPI1104').value;
        endDate = document.getElementById('endDateAbandonadasKPI1104').value;

        console.log('[INFO] Datas selecionadas manualmente');
        console.log('[DEBUG] Data de Início original:', startDate);
        console.log('[DEBUG] Data de Fim original:', endDate);

        if (!startDate || !endDate) {
            alert('Por favor, selecione ambas as datas.');
            console.error("[ERROR] Data de início ou fim não selecionada.");
            toggleButtons(true);  // Habilita os botões em caso de erro
            return;
        }

        startDate = formatDateToISOStringWithMilliseconds(startDate);
        endDate = formatDateToISOStringWithMilliseconds(endDate);

        console.log("[DEBUG] Data de Início convertida para ISO:", startDate);
        console.log("[DEBUG] Data de Fim convertida para ISO:", endDate);
    } else {
        // Caso contrário, usa mês e ano para gerar as datas automaticamente
        const selectedKPI = document.getElementById('kpiSelector').value;
        console.log("[INFO] KPI Selecionado:", selectedKPI);

        if (selectedKPI === '1104') {
            console.log("[INFO] Realizando busca automática para KPI 1104");

            const selectedMes = document.getElementById('mesSelector').value;
            const selectedAno = document.getElementById('anoSelector').value;

            if (selectedMes && selectedAno) {
                startDate = `${selectedAno}-${selectedMes}-01T00:00:00`;
                endDate = new Date(selectedAno, selectedMes, 0).toISOString().replace(/T.*/, 'T23:59:59');

                console.log("[INFO] Datas geradas para o KPI 11.04");
                console.log("[DEBUG] Data de Início:", startDate);
                console.log("[DEBUG] Data de Fim:", endDate);
            } else {
                alert('Por favor, selecione o mês e o ano.');
                console.error("[ERROR] Mês ou ano não selecionado.");
                toggleButtons(true);  // Habilita os botões em caso de erro
                return;
            }
        } else {
            console.log("[INFO] KPI não é 1104, abortando buscarIndicadorChamadasAbandonadas.");
            toggleButtons(true); // Habilita os botões se o KPI não for 1104
            return;
        }
    }

    mostrarLoadingSpinner('loadingSpinnerAbandonadasKPI1104');

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
                console.log('Chamando renderizarTabelaIndicadorAbandonadas');
                renderizarTabelaIndicadorAbandonadas(data.ura_performance);
                document.getElementById('exportExcelAbandonadasKP1104').style.display = 'block';
            } else {
                console.error('Erro ao buscar dados:', data.errmsg);
            }
        })
        .catch(error => {
            console.error('Erro na requisição:', error);
        })
        .finally(() => {
            esconderLoadingSpinner('loadingSpinnerAbandonadasKPI1104');
            toggleButtons(true); // Habilita os botões após a requisição
        });
    } else {
        console.error("[ERROR] Elemento 'tempoChamadasAbandonadasKPI1104' não encontrado no documento.");
        toggleButtons(true); // Habilita os botões em caso de erro
    }
}



// Função para desabilitar/habilitar botões
function toggleButtons(enable) {
    const searchButton = document.getElementById('kpiSearchButton');
    const filterButton = document.getElementById('filterAbandonadasButtonKPI1104');
    searchButton.disabled = !enable;
    filterButton.disabled = !enable;
}

// Função para renderizar a tabela de resultados
function renderizarTabelaIndicadorAbandonadas(dados) {
    const resultado = document.getElementById('resultadoAbandonadasKPI1104');

    // Destrói a tabela existente antes de criar uma nova
    if ($.fn.DataTable.isDataTable('#resultadoAbandonadasKPI1104 table')) {
        $('#resultadoAbandonadasKPI1104 table').DataTable().clear().destroy();
    }

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
            const tr = document.createElement('tr');
            const abandonadasAteUmMinuto = item.abandonadas_cognitiva_ate_um_minuto || 0;
            const abandonadasAcimaUmMinuto = item.abandonadas_cognitiva_acima_um_minuto || 0;

            // Usa "atendidas_cognitiva" como "ligações recebidas"
            const totalRecebidas = item.atendidas_cognitiva || 0;

            const percentualAtendidas = calcularPercentual(totalRecebidas, totalRecebidas); // O percentual aqui considera atendidas como recebidas
            const metaCumprida = cumpreMeta(percentualAtendidas);

            tr.innerHTML = `
                <td>${item.ura.replace(' v3', '') || 'N/A'}</td>
                <td>${item.tipo_atendimento || 'N/A'}</td>
                <td>${item.data || 'N/A'}</td>
                <td>Abandonadas Sup. 1min: ${abandonadasAcimaUmMinuto}</td>
                <td>Abandonadas Inf. 1min: ${abandonadasAteUmMinuto}</td>
                <td>Ligações atendidas: ${totalRecebidas} / Ligações recebidas: ${totalRecebidas} / Atingimento: ${percentualAtendidas}%</td>
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

// Adiciona os listeners para os botões de filtro e exportação
document.addEventListener('DOMContentLoaded', function() {
    const searchButton = document.getElementById('kpiSearchButton');
    const filterButton = document.getElementById('filterAbandonadasButtonKPI1104');

    // Listener para o botão "Aplicar Filtro" (usa datas manuais)
    filterButton.addEventListener('click', function() {
        toggleButtons(false); // Desabilita os botões enquanto a requisição está em andamento
        buscarIndicadorChamadasAbandonadas(true);
    });

    // Listener para o botão "Buscar" (usa mês e ano)
    searchButton.addEventListener('click', function() {
        toggleButtons(false); // Desabilita os botões enquanto a requisição está em andamento
        buscarIndicadorChamadasAbandonadas(false);
    });

    // Listener para exportar a tabela para Excel
    document.getElementById('exportExcelAbandonadasKP1104').addEventListener('click', function() {
        const tabela = document.querySelector('#resultadoAbandonadasKPI1104 table');
        const wb = XLSX.utils.table_to_book(tabela, { sheet: "Sheet1" });
        XLSX.writeFile(wb, 'indicadores_abandonadas.xlsx');
    });

    // Inicializando o Flatpickr para a seleção de datas
    flatpickr("#startDateAbandonadasKPI1104", {
        enableTime: true,
        dateFormat: "d/m/Y H:i",
        time_24hr: true,
        allowInput: true,
        locale: "pt"
    });

    flatpickr("#endDateAbandonadasKPI1104", {
        enableTime: true,
        dateFormat: "d/m/Y H:i",
        time_24hr: true,
        allowInput: true,
        locale: "pt"
    });
});

