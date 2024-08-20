document.addEventListener('DOMContentLoaded', function() {
    const clientesLabels = document.getElementById('clientesLabelsData').textContent.trim();
    const urasPorCliente = document.getElementById('urasPorClienteData').textContent.trim();
    
    const ctx = document.getElementById('chart-uras-por-cliente').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: clientesLabels,
            datasets: [{
                label: 'URAs por Cliente',
                data: urasPorCliente,
                backgroundColor: 'rgba(54, 162, 235, 0.8)',
                borderColor: 'rgba(255, 255, 255, 0.7)',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(tooltipItem) {
                            const total = urasPorCliente.reduce((a, b) => a + b, 0);
                            const value = tooltipItem.raw;
                            const percentage = ((value / total) * 100).toFixed(2);
                            return `${value} URAs (${percentage}%)`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { color: 'rgba(0, 0, 0, 0.8)' }
                },
                y: {
                    beginAtZero: true,
                    grid: { display: false },
                    ticks: {
                        stepSize: 1,
                        color: 'rgba(0, 0, 0, 0.8)'
                    }
                }
            }
        }
    });

    // Configuração para o gráfico de status das URAs
    const ctxStatus = document.getElementById('chart-status-uras').getContext('2d');
    new Chart(ctxStatus, {
        type: 'doughnut',
        data: {
            labels: ['Ativa', 'Inativa'],
            datasets: [{
                data: [JSON.parse(document.getElementById('urasAtivas').textContent), JSON.parse(document.getElementById('urasInativas').textContent)],
                backgroundColor: ['rgba(54, 162, 235, 0.8)', 'rgba(255, 99, 132, 0.8)'],
                borderColor: 'rgba(255, 255, 255, 0.7)',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                    align: 'center'
                },
                tooltip: {
                    callbacks: {
                        label: function(tooltipItem) {
                            const total = tooltipItem.dataset.data.reduce((sum, value) => sum + value, 0);
                            const value = tooltipItem.raw;
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${tooltipItem.label}: ${percentage}%`;
                        }
                    }
                }
            }
        }
    });

    // Exportar a tabela para Excel
    document.getElementById('exportExcel').addEventListener('click', function() {
        var table = document.querySelector('.table');
        var wb = XLSX.utils.table_to_book(table, {sheet: "URAs"});
        XLSX.writeFile(wb, 'uras_clientes.xlsx');
    });
});
