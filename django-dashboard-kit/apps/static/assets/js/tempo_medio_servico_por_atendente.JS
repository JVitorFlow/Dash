document.addEventListener('DOMContentLoaded', function() {
    let chartInstance; // Variável para armazenar a instância do gráfico

    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    const csrftoken = getCookie('csrftoken');

    function formatDateToISOStringWithMilliseconds(dateString) {
        const [datePart, timePart] = dateString.split(' ');
        const [day, month, year] = datePart.split('/');
        const [hour, minute] = timePart.split(':');

        const localDate = new Date(year, month - 1, day, hour, minute);
        return localDate.toISOString();
    }

    function mostrarLoadingSpinner() {
        document.getElementById('loadingSpinnerAtendente').style.display = 'block';
    }

    function esconderLoadingSpinner() {
        document.getElementById('loadingSpinnerAtendente').style.display = 'none';
    }

    function buscarTempoMedioServicoPorAtendente() {
        const startDate = document.getElementById('startDateAtendente').value;
        const endDate = document.getElementById('endDateAtendente').value;

        if (!startDate || !endDate) {
            alert('Por favor, selecione ambas as datas.');
            return;
        }

        mostrarLoadingSpinner();

        const payload = {
            dtStart: formatDateToISOStringWithMilliseconds(startDate),
            dtFinish: formatDateToISOStringWithMilliseconds(endDate)
        };

        // console.log('Informações enviadas no filtro:', JSON.stringify(payload, null, 2));]

        // Captura a URL da API a partir do elemento script
        const urlElement = document.getElementById('tempoMedioServicoAtendenteUrlData');
        
        if (urlElement) {
            const tempoMedioServicoAtendenteUrl = urlElement.textContent.trim();
            // console.log("[INFO] URL da API carregada:", tempoMedioServicoAtendenteUrl);

            fetch(tempoMedioServicoAtendenteUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrftoken
                },
                body: JSON.stringify(payload)
            })
            .then(response => response.json())
            .then(data => {
                // console.log('Dados recebidos do JSON:', JSON.stringify(data, null, 2));

                if (data.errcode === 0) {
                    // console.log('Chamando renderizarTabelaTempoMedio');
                    renderizarTabelaTempoMedio(data.queue_internal_calls); // Renderiza a tabela
                    renderizarGraficoPolar(data.queue_internal_calls);     // Renderiza o gráfico polar
                } else {
                    console.error('Erro ao buscar dados:', data.errmsg);
                }
                esconderLoadingSpinner();
            })
            .catch(error => {
                console.error('Erro na requisição:', error);
                esconderLoadingSpinner();
            });
        } else {
            console.error("[ERROR] Elemento 'tempoMedioServicoAtendenteUrlData' não encontrado no documento.");
        }
    }

    function renderizarTabelaTempoMedio(dados) {

        // console.log('Executando renderizarTabelaTempoMedio com dados:', dados);
        const resultado = document.getElementById('resultadoAtendente');
        resultado.innerHTML = ''; // Limpa o conteúdo anterior
    
        if (!dados || dados.length === 0) {
            resultado.innerHTML = '<p>Nenhum dado encontrado para o intervalo de datas selecionado.</p>';
            return;
        }
    
        // Cria a tabela
        const table = document.createElement('table');
        table.classList.add('table', 'table-striped', 'table-hover', 'table-bordered');
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Número do Ramal</th>
                    <th>Nome do Atendente</th>
                    <th>Nome da Fila</th>
                    <th>Chamadas Atendidas</th>
                    <th>Tempo Total de Conversa (s)</th>
                    <th>Tempo Médio de Conversa (s)</th>
                </tr>
            </thead>
            <tbody>
            </tbody>
        `;
    
        const tbody = table.querySelector('tbody');
    
        // Preenche os dados na tabela
        dados.forEach(item => {
            console.log('Adicionando linha para:', item);
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${item.numero || 'Sem Ramal'}</td>
                <td>${item.nome || 'Sem Nome'}</td>
                <td>${item.nome_fila || 'Sem Nome de Fila'}</td>
                <td>${item.atendidas || 0}</td>
                <td>${item.tempo_total_conversa || 0}</td>
                <td>${item.tempo_medio_conversa || 0}</td>
            `;
            tbody.appendChild(tr);
        });
    
        // Anexa a tabela ao container
        resultado.appendChild(table);

        // Inicializa o DataTables na tabela
        $(table).DataTable({
            "pageLength": 14,  // Número de linhas por página
            "lengthMenu": [5, 10, 25, 50, 100], // Opções de linhas por página
            "language": {
                "url": "https://cdn.datatables.net/plug-ins/1.11.5/i18n/Portuguese-Brasil.json" // Tradução para Português
            }
        });
    }

    // Definição da função renderizarGraficoPolar
    function renderizarGraficoPolar(dados) {
        const ctx = document.getElementById('polarAreaChart').getContext('2d');
        const labels = [];
        const tempoMedioConversa = [];
        const backgroundColors = [
            'rgba(255, 99, 132, 0.8)',
            'rgba(75, 192, 192, 0.8)',
            'rgba(255, 205, 86, 0.8)',
            'rgba(201, 203, 207, 0.8)',
            'rgba(54, 162, 235, 0.8)'
        ];

        dados.forEach(item => {
            const numero = item.numero || 'Sem Ramal';
            const nome = item.nome || 'Sem Nome';
            labels.push(`${numero} - ${nome}`);
            tempoMedioConversa.push(item.tempo_medio_conversa || 0);
        });

        if (chartInstance) {
            chartInstance.destroy(); // Destrua o gráfico existente, se houver
        }

        chartInstance = new Chart(ctx, {
            type: 'polarArea',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Tempo Médio de Conversa (s)',
                    data: tempoMedioConversa,
                    backgroundColor: backgroundColors.slice(0, labels.length), // Adapta o número de cores ao número de labels
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false, // Evita que o gráfico expanda indefinidamente
                scales: {
                    r: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Tempo Médio de Conversa (s)'
                        }
                    }
                }
            }
        });
    }
         
    document.getElementById('filterAtendenteButton').addEventListener('click', function() {
        buscarTempoMedioServicoPorAtendente();
    });

    flatpickr("#startDateAtendente", {
        enableTime: true,
        dateFormat: "d/m/Y H:i",
        time_24hr: true,
        allowInput: true,
        locale: "pt"
    });
    
    flatpickr("#endDateAtendente", {
        enableTime: true,
        dateFormat: "d/m/Y H:i",
        time_24hr: true,
        allowInput: true,
        locale: "pt"
    });
});