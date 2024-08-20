document.addEventListener('DOMContentLoaded', function () {
    let barChartInstance;  // Variável para armazenar a instância do gráfico
    let lastFetchedData;   // Variável para armazenar os dados recuperados da API

    function formatDateToISOStringWithMilliseconds(dateString) {
        const [datePart, timePart] = dateString.split(' ');
        const [day, month, year] = datePart.split('/');
        const [hour, minute] = timePart.split(':');
        const localDate = new Date(year, month - 1, day, hour, minute);
        return localDate.toISOString();
    }

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

    function mostrarLoadingSpinnerEspera() {
        document.getElementById('loadingSpinnerEspera').style.display = 'block';
    }

    function esconderLoadingSpinnerEspera() {
        document.getElementById('loadingSpinnerEspera').style.display = 'none';
    }

    function mostrarMensagemSemDados() {
        document.getElementById('noDataMessage').style.display = 'block';
        document.getElementById('barChart').style.display = 'none';
        document.getElementById('exportExcelButton').style.display = 'none';
    }

    function esconderMensagemSemDados() {
        document.getElementById('noDataMessage').style.display = 'none';
        document.getElementById('barChart').style.display = 'block';
        document.getElementById('exportExcelButton').style.display = 'block';
    }

    function buscarIndicadorTempoEspera() {
        const startDate = document.getElementById('startDateEspera').value;
        const endDate = document.getElementById('endDateEspera').value;

        if (!startDate || !endDate) {
            alert('Por favor, selecione ambas as datas.');
            return;
        }

        mostrarLoadingSpinnerEspera(); // Mostra o loading spinner

        const payload = {
            dtStart: formatDateToISOStringWithMilliseconds(startDate),
            dtFinish: formatDateToISOStringWithMilliseconds(endDate)
        };

        // console.log('Informações enviadas para a API:', JSON.stringify(payload, null, 2));

        // Captura a URL da API a partir do elemento script
        const urlElement = document.getElementById('indicadorDesempenhoFilaUrlData');
        if (urlElement) {
            const indicadorDesempenhoFilaUrl = urlElement.textContent.trim();;
            console.log("[INFO] URL da API carregada:", indicadorDesempenhoFilaUrl);

            fetch(indicadorDesempenhoFilaUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrftoken
                },
                body: JSON.stringify(payload)
            })
            .then(response => response.json())
            .then(data => {
                console.log('Dados recebidos da API:', JSON.stringify(data, null, 2));

                if (data.errcode === 0) {
                    if (!data.queue_internal_calls || data.queue_internal_calls.length === 0) {
                        mostrarMensagemSemDados();
                    } else {
                        esconderMensagemSemDados();
                        renderizarGraficoBarras(data);
                        renderizarTabela(data);  // Adiciona esta linha para preencher a tabela
                        lastFetchedData = data;  // Armazena os dados para exportação

                        // Mostra o botão "Baixar Gráfico" após o gráfico ser gerado
                        document.getElementById('downloadChart').style.display = 'block';
                    }
                } else {
                    console.error('Erro ao buscar dados:', data.errmsg);
                }
                esconderLoadingSpinnerEspera(); // Esconde o loading spinner quando terminar
            })
            .catch(error => {
                console.error('Erro na requisição:', error);
                esconderLoadingSpinnerEspera(); // Esconde o loading spinner em caso de erro
            });
        } else {
            console.error("[ERROR] Elemento 'indicadorDesempenhoFilaUrlData' não encontrado no documento.");
        }
    }

    function renderizarGraficoBarras(data) {
        const ctx = document.getElementById('barChart').getContext('2d');
        const labels = data.queue_internal_calls.map(queue => queue.nome_fila || 'Sem Nome de Fila');
        const chamadasRecebidas = data.queue_internal_calls.map(queue => queue.recebidas);
        const chamadasAtendidas = data.queue_internal_calls.map(queue => queue.atendidas);
        const chamadasNaoAtendidas = data.queue_internal_calls.map(queue => queue.nao_atendidas);
        const tempoTotalEspera = data.queue_internal_calls.map(queue => queue.tempo_total_espera);
        const tempoTotalConversa = data.queue_internal_calls.map(queue => queue.tempo_total_conversa);
        const tempoMedioEspera = data.queue_internal_calls.map(queue => queue.tempo_medio_espera);
        const tempoMedioConversa = data.queue_internal_calls.map(queue => queue.tempo_medio_conversa);
    
        // Destrua o gráfico existente, se houver
        if (barChartInstance) {
            barChartInstance.destroy();
        }
    
        // Crie um novo gráfico de barras
        barChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Chamadas Recebidas',
                        data: chamadasRecebidas,
                        backgroundColor: 'rgba(75, 192, 192, 0.8)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1,
                        yAxisID: 'y1',
                    },
                    {
                        label: 'Chamadas Atendidas',
                        data: chamadasAtendidas,
                        backgroundColor: 'rgba(54, 162, 235, 0.8)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 1,
                        yAxisID: 'y1',
                    },
                    {
                        label: 'Chamadas Não Atendidas',
                        data: chamadasNaoAtendidas,
                        backgroundColor: 'rgba(255, 99, 132, 0.8)',
                        borderColor: 'rgba(255, 99, 132, 1)',
                        borderWidth: 1,
                        yAxisID: 'y1',
                    },
                    {
                        label: 'Tempo Total de Espera (segundos)',
                        data: tempoTotalEspera,
                        backgroundColor: 'rgba(255, 159, 64, 0.8)',
                        borderColor: 'rgba(255, 159, 64, 1)',
                        borderWidth: 1,
                        yAxisID: 'y2',
                        type: 'line'
                    },
                    {
                        label: 'Tempo Total de Conversa (segundos)',
                        data: tempoTotalConversa,
                        backgroundColor: 'rgba(153, 102, 255, 0.8)',
                        borderColor: 'rgba(153, 102, 255, 1)',
                        borderWidth: 1,
                        yAxisID: 'y2',
                        type: 'line'
                    },
                    {
                        label: 'Tempo Médio de Espera (minutos)',
                        data: tempoMedioEspera,
                        backgroundColor: 'rgba(255, 205, 86, 0.8)',
                        borderColor: 'rgba(255, 205, 86, 1)',
                        borderWidth: 1,
                        yAxisID: 'y2',
                        type: 'line'
                    },
                    {
                        label: 'Tempo Médio de Conversa (minutos)',
                        data: tempoMedioConversa,
                        backgroundColor: 'rgba(75, 192, 192, 0.8)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1,
                        yAxisID: 'y2',
                        type: 'line'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    zoom: {
                        zoom: {
                            wheel: {
                                enabled: true, // Habilita zoom com scroll do mouse
                            },
                            pinch: {
                                enabled: true, // Habilita zoom com pinch em dispositivos móveis
                            },
                            mode: 'xy', // Permite zoom nos eixos x e y
                        },
                        pan: {
                            enabled: true,
                            mode: 'xy', // Permite pan nos eixos x e y
                        }
                    },
                    legend: {
                        position: 'top',
                    },
                    tooltip: {
                        mode: 'nearest', // Captura o ponto mais próximo
                        intersect: false, // Permite capturar a tooltip mesmo quando o mouse está próximo
                        padding: 10, // Aumenta o padding para facilitar a interação
                        callbacks: {
                            label: function(tooltipItem) {
                                return `${tooltipItem.dataset.label}: ${tooltipItem.raw}`;
                            }
                        }
                    }
                },
                hover: {
                    mode: 'nearest', // Captura o ponto mais próximo durante o hover
                    intersect: true // Permite capturar o ponto mesmo quando é pequeno
                },
                scales: {
                    y1: {
                        beginAtZero: true,
                        position: 'left',
                        ticks: {
                            stepSize: 10,
                        },
                        title: {
                            display: true,
                            text: 'Número de Chamadas',
                        }
                    },
                    y2: {
                        beginAtZero: true,
                        position: 'right',
                        grid: {
                            drawOnChartArea: false,
                        },
                        ticks: {
                            stepSize: 50,
                        },
                        title: {
                            display: true,
                            text: 'Tempo (segundos / minutos)',
                        }
                    },
                    x: {
                        beginAtZero: true,
                        ticks: {
                            autoSkip: false,
                            maxRotation: 45,
                            minRotation: 0
                        }
                    }
                },
                aspectRatio: 2.5
            }
        });
    }

    function renderizarTabela(data) {
        const tableBody = document.querySelector("#dataTable tbody");
        tableBody.innerHTML = ''; // Limpa a tabela antes de adicionar novas linhas
    
        console.log("Dados recebidos para renderização:", data.queue_internal_calls);
    
        // Verifica se há dados disponíveis
        if (!data.queue_internal_calls || data.queue_internal_calls.length === 0) {
            console.log("Nenhum dado encontrado para a tabela.");
            if ($.fn.DataTable.isDataTable('#dataTable')) {
                $('#dataTable').DataTable().clear().destroy(); // Destrói o DataTable existente se não houver dados
            }
            $('#dataTable').html('<tr><td colspan="8">Nenhum dado disponível</td></tr>'); // Exibe uma mensagem na tabela se não houver dados
            return;
        }
    
        // Adiciona novas linhas à tabela
        data.queue_internal_calls.forEach(queue => {
            // console.log("Adicionando fila:", queue.nome_fila);
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${queue.nome_fila || 'Sem Nome de Fila'}</td>
                <td>${queue.recebidas || 0}</td>
                <td>${queue.atendidas || 0}</td>
                <td>${queue.nao_atendidas || 0}</td>
                <td>${queue.tempo_total_espera || 0}</td>
                <td>${queue.tempo_total_conversa || 0}</td>
                <td>${queue.tempo_medio_espera || 0}</td>
                <td>${queue.tempo_medio_conversa || 0}</td>
            `;
            tableBody.appendChild(row);
        });
    
        // Inicializa ou reinicializa o DataTable
        if ($.fn.DataTable.isDataTable('#dataTable')) {
            console.log("DataTable existente encontrado, destruindo...");
            $('#dataTable').DataTable().clear().destroy(); // Limpa e destrói o DataTable existente
        }
    
        // console.log("Inicializando DataTable com novos dados.");
        $('#dataTable').DataTable({
            responsive: true,
            autoWidth: false,
            pageLength: 10,
            data: data.queue_internal_calls, // DataTable deve usar os dados fornecidos
            columns: [
                { title: "Nome da Fila", data: 'nome_fila' },
                { title: "Chamadas Recebidas", data: 'recebidas' },
                { title: "Chamadas Atendidas", data: 'atendidas' },
                { title: "Chamadas Não Atendidas", data: 'nao_atendidas' },
                { title: "Tempo Total de Espera (segundos)", data: 'tempo_total_espera' },
                { title: "Tempo Total de Conversa (segundos)", data: 'tempo_total_conversa' },
                { title: "Tempo Médio de Espera (minutos)", data: 'tempo_medio_espera' },
                { title: "Tempo Médio de Conversa (minutos)", data: 'tempo_medio_conversa' }
            ]
        });
    }
    
    
            

    function exportarParaExcel() {
        if (!lastFetchedData || !lastFetchedData.queue_internal_calls) {
            alert('Nenhum dado disponível para exportação.');
            return;
        }

        const headers = ["Nome da Fila", "Chamadas Recebidas", "Chamadas Atendidas", "Chamadas Não Atendidas", "Tempo Total de Espera (segundos)", "Tempo Total de Conversa (segundos)", "Tempo Médio de Espera (minutos)", "Tempo Médio de Conversa (minutos)"];

        const rows = lastFetchedData.queue_internal_calls.map(queue => [
            queue.nome_fila || 'Sem Nome de Fila',
            queue.recebidas || 0,
            queue.atendidas || 0,
            queue.nao_atendidas || 0,
            queue.tempo_total_espera || 0,
            queue.tempo_total_conversa || 0,
            queue.tempo_medio_espera || 0,
            queue.tempo_medio_conversa || 0
        ]);

        const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Indicador_Tempo_Espera");

        XLSX.writeFile(wb, 'Indicador_Tempo_Espera.xlsx');
    }

    function downloadChartAsImage() {
        const link = document.createElement('a');
        link.href = barChartInstance.toBase64Image();
        link.download = 'grafico.png';
        link.click();
    }

    document.getElementById('downloadChart').addEventListener('click', function() {
        const link = document.createElement('a');
        link.href = barChartInstance.toBase64Image();
        link.download = 'grafico.png';
        link.click();
    });
    

    document.getElementById('filterEsperaButton').addEventListener('click', function() {
        buscarIndicadorTempoEspera();
    });

    document.getElementById('exportExcelButton').addEventListener('click', function() {
        exportarParaExcel();
    });

    flatpickr("#startDateEspera", {
        enableTime: true,
        dateFormat: "d/m/Y H:i",
        time_24hr: true,
        allowInput: true,
        locale: "pt"
    });
    
    flatpickr("#endDateEspera", {
        enableTime: true,
        dateFormat: "d/m/Y H:i",
        time_24hr: true,
        allowInput: true,
        locale: "pt"
    });
}); 