document.addEventListener("DOMContentLoaded", function () {
    try {
        // Captura o conteúdo JSON dos elementos <script>
        var clientesDataScript = document.getElementById('clientes-data').textContent.trim();
        var servicosDataScript = document.getElementById('servicos-por-cliente-data').textContent.trim();

        console.log("Raw JSON from clientes-data:", clientesDataScript);
        console.log("Raw JSON from servicos-por-cliente-data:", servicosDataScript);

        // Converte para JSON usando JSON.parse
        var originalLabels = JSON.parse(clientesDataScript);
        var servicosPorCliente = JSON.parse(servicosDataScript);

        // Cria o gráfico
        var ctx1 = document.getElementById('chart-servicos-por-cliente').getContext('2d');
        var chart1 = new Chart(ctx1, {
            type: 'bar',
            data: {
                labels: originalLabels.map(label => abbreviateLabel(label)),
                datasets: [{
                    label: 'Serviços por Cliente',
                    data: servicosPorCliente,
                    backgroundColor: [
                        'rgba(54, 162, 235, 0.7)',
                        'rgba(255, 99, 132, 0.7)',
                        'rgba(75, 192, 192, 0.7)',
                        'rgba(153, 102, 255, 0.7)',
                        'rgba(255, 159, 64, 0.7)',
                        'rgba(255, 206, 86, 0.7)',
                        'rgba(231, 233, 237, 0.7)',
                        'rgba(75, 192, 192, 0.7)',
                        'rgba(54, 162, 235, 0.7)',
                        'rgba(255, 99, 132, 0.7)',
                        'rgba(75, 192, 192, 0.7)',
                        'rgba(153, 102, 255, 0.7)',
                        'rgba(255, 159, 64, 0.7)',
                        'rgba(255, 206, 86, 0.7)',
                        'rgba(231, 233, 237, 0.7)',
                    ],
                    borderColor: [
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 99, 132, 1)',
                        'rgba(75, 192, 192, 1)',
                        'rgba(153, 102, 255, 1)',
                        'rgba(255, 159, 64, 1)',
                        'rgba(255, 206, 86, 1)',
                        'rgba(231, 233, 237, 1)',
                        'rgba(75, 192, 192, 1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 99, 132, 1)',
                        'rgba(75, 192, 192, 1)',
                        'rgba(153, 102, 255, 1)',
                        'rgba(255, 159, 64, 1)',
                        'rgba(255, 206, 86, 1)',
                        'rgba(231, 233, 237, 1)',
                    ],
                    borderWidth: 1,
                    barThickness: 20,
                }]
            },
            options: {
                scales: {
                    x: {
                        ticks: {
                            maxRotation: 45,
                            minRotation: 45,
                            font: {
                                size: 10,
                            },
                        }
                    },
                    y: {
                        beginAtZero: true,
                        suggestedMax: Math.max(...servicosPorCliente) + 1,
                        stepSize: 1,
                        ticks: {
                            precision: 0
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false,
                    },
                    title: {
                        display: true,
                        text: 'Serviços por Cliente'
                    },
                    tooltip: {
                        callbacks: {
                            title: function(context) {
                                return originalLabels[context[0].dataIndex];
                            }
                        }
                    }
                }
            }
        });

        console.log("Chart Instance:", chart1);
    } catch (error) {
        console.error("Erro ao processar os dados JSON:", error);
    }
});
