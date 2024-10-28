document.addEventListener('DOMContentLoaded', function() {
    console.log("Página carregada, iniciando o script...");
    // Selecione o botão de filtro e o formulário
    const filterButton = document.querySelector('#filter-button');
    const form = document.querySelector('#filter-form');
    const progressBar = document.getElementById('progressBar');
    const progressBarContainer = document.getElementById('progressBarContainer');
    const statusMessage = document.getElementById('status-message'); // Mensagem de status

    console.log("ID da task:", taskId);

    // Função para mostrar e atualizar a barra de progresso
    function iniciarBarraProgresso() {
        console.log("Iniciando barra de progresso...");
        progressBar.style.width = '0%';
        progressBarContainer.style.display = 'block';
        let largura = 0;
        const intervalo = setInterval(() => {
            if (largura >= 100) {
                clearInterval(intervalo);
            } else {
                largura += 10; // Aumenta 10% a cada intervalo
                progressBar.style.width = largura + '%';
            }
        }, 500); // A cada 500ms aumenta a barra
    }

    // Função para esconder a barra de progresso quando o carregamento terminar
    function finalizarBarraProgresso() {
        console.log("Finalizando barra de progresso...");
        progressBar.style.width = '100%'; // Completa a barra
        setTimeout(() => {
            progressBarContainer.style.display = 'none'; // Esconde a barra após 1 segundo
        }, 1000);
    }

    // Função para verificar o status da tarefa no Celery
    async function verificarStatusTask(taskId) {
        try {
            console.log("Verificando status da task:", taskId);
            if (!taskId) {
                console.warn("Nenhum taskId disponível para verificação.");
                return;
            }
    
            const response = await fetch(`/relatorios/celery-status/${taskId}/`);
            if (!response.ok) {
                throw new Error(`Erro HTTP! status: ${response.status}`);
            }
    
            const data = await response.json();
            console.log("Dados recebidos para exibir os resultados:", data);
            if (statusMessage) {
                if (data.status === 'SUCCESS') {
                    statusMessage.innerHTML = 'Relatório concluído!';
                    finalizarBarraProgresso();
                    exibirResultados(data.result); // Exibir resultados na tabela usando `data.result`
                } else if (data.status === 'FAILURE') {
                    statusMessage.innerHTML = 'Erro no processamento!';
                    finalizarBarraProgresso();
                } else if (data.status === 'PENDING' || data.status === 'STARTED') {
                    statusMessage.innerHTML = 'Processando relatório...';
                    iniciarBarraProgresso();
                    // Continue verificando após um tempo
                    setTimeout(() => verificarStatusTask(taskId), 2000); // Verifica a cada 2 segundos
                }
            }
        } catch (error) {
            console.error('Erro ao verificar o status da task:', error);
            if (statusMessage) {
                statusMessage.innerHTML = 'Erro ao verificar o status da task.';
            }
        }
    }
    

    // Função para exibir os resultados na tabela
    // Função para exibir os resultados na tabela
    function exibirResultados(data) {
        try {
            console.log("Dados recebidos para exibir os resultados:", data);
    
            // Acessa diretamente os dados de 'abandonos_cognitivos' e 'interrompidas_cliente'
            const abandonosCognitivos = data.abandonos_cognitivos || [];
            const interrompidasCliente = data.interrompidas_cliente || [];
    
            const abandonoCognitivoTable = document.getElementById('abandonoCognitivo');
            const interrompidoClienteTable = document.getElementById('interrompidoCliente');
    
            // Verifica se as tabelas existem no DOM
            if (!abandonoCognitivoTable || !interrompidoClienteTable) {
                console.error("Não foi possível encontrar as tabelas de resultados no DOM.");
                return;
            }
    
            const tbodyAbandono = abandonoCognitivoTable.querySelector('tbody');
            const tbodyInterrompido = interrompidoClienteTable.querySelector('tbody');
    
            if (!tbodyAbandono || !tbodyInterrompido) {
                console.error("Tbody não encontrado para uma ou ambas as tabelas.");
                return;
            }
    
            // Destrói o DataTable antes de atualizar os dados
            if ($.fn.DataTable.isDataTable('#abandonoCognitivo')) {
                $('#abandonoCognitivo').DataTable().destroy();
            }
            if ($.fn.DataTable.isDataTable('#interrompidoCliente')) {
                $('#interrompidoCliente').DataTable().destroy();
            }
    
            // Atualiza o conteúdo da tabela de abandonos cognitivos
            tbodyAbandono.innerHTML = ''; // Limpar o conteúdo existente
            abandonosCognitivos.forEach(chamada => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td data-label="ID Chamada">${chamada.id_chamada}</td>
                    <td data-label="Número Cliente">${chamada.numero_cliente}</td>
                    <td data-label="Data Início">${chamada.data_hora_inicio}</td>
                    <td data-label="Data Fim">${chamada.data_hora_fim}</td>
                    <td data-label="Tipo Abandono">${chamada.tipo_abandono}</td>
                    <td data-label="Nome URA">${chamada.nome_ura}</td>
                `;
                tbodyAbandono.appendChild(row);
            });
    
            // Atualiza o conteúdo da tabela de interrupções pelo cliente
            tbodyInterrompido.innerHTML = ''; // Limpar o conteúdo existente
            interrompidasCliente.forEach(chamada => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td data-label="ID Chamada">${chamada.id_chamada}</td>
                    <td data-label="Número Cliente">${chamada.numero_cliente}</td>
                    <td data-label="Data Início">${chamada.data_hora_inicio}</td>
                    <td data-label="Data Fim">${chamada.data_hora_fim}</td>
                    <td data-label="Tipo Abandono">${chamada.tipo_abandono}</td>
                    <td data-label="Nome URA">${chamada.nome_ura}</td>
                `;
                tbodyInterrompido.appendChild(row);
            });
    
            // Recria o DataTable para Abandonos Cognitivos
            $('#abandonoCognitivo').DataTable({
                "paging": true,
                "searching": true,
                "ordering": true,
                "info": true,
                "pageLength": 10,
                "language": {
                    "lengthMenu": "Exibir _MENU_ registros por página",
                    "zeroRecords": "Nada encontrado - desculpe",
                    "info": "Mostrando página _PAGE_ de _PAGES_",
                    "infoEmpty": "Nenhum registro disponível",
                    "infoFiltered": "(filtrado de _MAX_ registros no total)"
                }
            });
    
            // Recria o DataTable para Interrupções pelo Cliente
            $('#interrompidoCliente').DataTable({
                "paging": true,
                "searching": true,
                "ordering": true,
                "info": true,
                "pageLength": 10,
                "language": {
                    "lengthMenu": "Exibir _MENU_ registros por página",
                    "zeroRecords": "Nada encontrado - desculpe",
                    "info": "Mostrando página _PAGE_ de _PAGES_",
                    "infoEmpty": "Nenhum registro disponível",
                    "infoFiltered": "(filtrado de _MAX_ registros no total)"
                }
            });
    
            // Atualiza a mensagem de status para indicar que o relatório foi concluído
            if (statusMessage) {
                statusMessage.innerHTML = 'Relatório concluído!';
            }
    
            finalizarBarraProgresso();
        } catch (error) {
            console.error('Erro ao exibir os resultados:', error);
            if (statusMessage) {
                statusMessage.innerHTML = 'Erro ao exibir os resultados.';
            }
        }
    }
    

    
    
    

    // Iniciar a verificação do status da task se o taskId estiver disponível
    if (taskId) {
        console.log("Iniciando verificação de task com ID:", taskId);
        verificarStatusTask(taskId);
    } else {
        console.warn("Nenhum taskId disponível para verificação.");
    }

    // Adiciona um listener ao botão de filtro
    filterButton.addEventListener('click', function(event) {
        event.preventDefault();
        const dtStart = document.querySelector('#startDate').value;
        const dtFinish = document.querySelector('#endDate').value;
        const selectPeriodo = document.querySelector('#select-periodo').value;

        if (!selectPeriodo && (!dtStart || !dtFinish)) {
            alert("Por favor, preencha as datas corretamente ou selecione um período.");
            return;
        }

        iniciarBarraProgresso(); // Inicia a barra de progresso
        form.submit(); // Submete o formulário
    });

    // Adiciona funcionalidade para preenchimento automático ao selecionar o período
    document.getElementById('select-periodo').addEventListener('change', function() {
        const periodo = this.value;
        const startDateInput = document.getElementById('startDate');
        const endDateInput = document.getElementById('endDate');
        const now = new Date(); // Data e hora atuais
        let startDate = new Date(); // Data de início
        let endDate = new Date(); // Data de fim, que será sempre hoje às 23:59:59

        switch (periodo) {
            case 'today':
                startDate.setHours(0, 0, 0, 0);
                endDate.setHours(23, 59, 59, 999);
                break;
            case 'yesterday':
                startDate.setDate(now.getDate() - 1);
                startDate.setHours(0, 0, 0, 0);
                endDate.setDate(now.getDate() - 1);
                endDate.setHours(23, 59, 59, 999);
                break;
            case '7':
                startDate.setDate(now.getDate() - 7);
                startDate.setHours(0, 0, 0, 0);
                endDate.setHours(23, 59, 59, 999);
                break;
            case '15':
                startDate.setDate(now.getDate() - 15);
                startDate.setHours(0, 0, 0, 0);
                endDate.setHours(23, 59, 59, 999);
                break;
            case '30':
                startDate.setDate(now.getDate() - 30);
                startDate.setHours(0, 0, 0, 0);
                endDate.setHours(23, 59, 59, 999);
                break;
            default:
                startDate = null;
                endDate = null;
                break;
        }

        if (startDate && endDate) {
            startDateInput.value = ajustarDataLocal(startDate);
            endDateInput.value = ajustarDataLocal(endDate);
        } else {
            startDateInput.value = '';
            endDateInput.value = '';
        }
    });

    // Mostra ou esconde as explicações dos indicadores
    const btnIndicadores = document.getElementById('btn-indicadores');
    if (btnIndicadores) {
        btnIndicadores.addEventListener('click', function() {
            const explicacoes = document.getElementById('explicacoes-indicadores');
            if (explicacoes.style.display === 'none' || explicacoes.style.display === '') {
                explicacoes.style.display = 'block';
            } else {
                explicacoes.style.display = 'none';
            }
        });
    } else {
        console.warn("Elemento 'btn-indicadores' não encontrado.");
    }

    // DataTables para Abandonos Cognitivos e Interrupção pelo Cliente
    $('#abandonoCognitivo').DataTable({
        "paging": true,
        "searching": true,
        "ordering": true,
        "info": true,
        "pageLength": 10,
        "language": {
            "lengthMenu": "Exibir _MENU_ registros por página",
            "zeroRecords": "Nada encontrado - desculpe",
            "info": "Mostrando página _PAGE_ de _PAGES_",
            "infoEmpty": "Nenhum registro disponível",
            "infoFiltered": "(filtrado de _MAX_ registros no total)"
        }
    });

    $('#interrompidoCliente').DataTable({
        "paging": true,
        "searching": true,
        "ordering": true,
        "info": true,
        "pageLength": 10,
        "language": {
            "lengthMenu": "Exibir _MENU_ registros por página",
            "zeroRecords": "Nada encontrado - desculpe",
            "info": "Mostrando página _PAGE_ de _PAGES_",
            "infoEmpty": "Nenhum registro disponível",
            "infoFiltered": "(filtrado de _MAX_ registros no total)"
        }
    });


    document.getElementById('export-excel').addEventListener('click', function() {
        // Crie uma nova planilha (workbook)
        const wb = XLSX.utils.book_new();
        
        // Primeiro: adicione a tabela de Abandonos Cognitivos
        const abandonoCognitivoTable = document.getElementById('abandonoCognitivo');
        const wsAbandono = XLSX.utils.table_to_sheet(abandonoCognitivoTable);
        XLSX.utils.book_append_sheet(wb, wsAbandono, "Abandonos Cognitivos");
        
        // Segundo: adicione a tabela de Interrupções pelo Cliente
        const interrompidoClienteTable = document.getElementById('interrompidoCliente');
        const wsInterrompido = XLSX.utils.table_to_sheet(interrompidoClienteTable);
        XLSX.utils.book_append_sheet(wb, wsInterrompido, "Interrupções Cliente");
        
        // Escreva o arquivo Excel
        XLSX.writeFile(wb, 'relatorio_ura_abandonadas.xlsx');
    });
    

    // Função para exportar para PDF
    document.getElementById('export-pdf').addEventListener('click', function() {
        // Verifica se o jsPDF foi carregado corretamente
        if (typeof window.jspdf === 'undefined') {
            console.error('jsPDF não foi carregado corretamente.');
            return;
        }
        
        const { jsPDF } = window.jspdf; // Acessando a classe jsPDF corretamente
    
        const doc = new jsPDF();
    
        // Adiciona a tabela Abandonos Cognitivos
        doc.autoTable({
            html: '#abandonoCognitivo',
            startY: 20, // Define o espaçamento no PDF
            headStyles: { fillColor: [41, 128, 185] }, // Estilo do cabeçalho
            styles: { fontSize: 8 } // Tamanho da fonte
        });
    
        // Adiciona uma nova página para a segunda tabela (opcional)
        doc.addPage();
    
        // Adiciona a tabela Interrupções Cliente
        doc.autoTable({
            html: '#interrompidoCliente',
            startY: 20, // Define o espaçamento no PDF
            headStyles: { fillColor: [41, 128, 185] }, // Estilo do cabeçalho
            styles: { fontSize: 8 } // Tamanho da fonte
        });
    
        // Salva o arquivo PDF
        doc.save('relatorio_ura_abandonadas.pdf');
    });
    



    // Função para ajustar a data local sem UTC
    function ajustarDataLocal(data) {
        const timezoneOffset = data.getTimezoneOffset() * 60000;
        return new Date(data.getTime() - timezoneOffset).toISOString().slice(0, 16);
    }
});
