document.addEventListener('DOMContentLoaded', function () {
    // Selecione o botão de filtro e o formulário
    const filterButton = document.querySelector('#filter-button');
    const form = document.querySelector('#filter-form');
    const progressBar = document.getElementById('progressBar');
    const progressBarContainer = document.getElementById('progressBarContainer');
    const statusMessage = document.getElementById('statusMessage');
    const downloadExcelButton = document.getElementById('download-excel');

    // Ao carregar a página, restaure os valores salvos no sessionStorage
    const selectPeriodo = document.getElementById('select-periodo');
    const selectHospital = document.getElementById('select-hospital');
    const startDate = document.getElementById('startDate');
    const endDate = document.getElementById('endDate');

    // Restaura os valores
    if (sessionStorage.getItem('selectPeriodo')) {
        selectPeriodo.value = sessionStorage.getItem('selectPeriodo');
    }

    if (sessionStorage.getItem('selectHospital')) {
        selectHospital.value = sessionStorage.getItem('selectHospital');
    }

    if (sessionStorage.getItem('startDate')) {
        startDate.value = sessionStorage.getItem('startDate');
    }

    if (sessionStorage.getItem('endDate')) {
        endDate.value = sessionStorage.getItem('endDate');
    }

    // Salvar os valores no sessionStorage ao clicar no botão de filtro
    filterButton.addEventListener('click', function (event) {
        // Salva os valores no sessionStorage
        sessionStorage.setItem('selectPeriodo', selectPeriodo.value);
        sessionStorage.setItem('selectHospital', selectHospital.value);
        sessionStorage.setItem('startDate', startDate.value);
        sessionStorage.setItem('endDate', endDate.value);

        // Continue o envio do formulário
        form.submit();
    });
    
    
    // Acessando o taskId diretamente
    if (typeof taskId !== 'undefined' && taskId) {
        console.log("Task ID:", taskId);  // Verifique se o taskId está correto
        verificarStatusTask(taskId);  // Chame a função para verificar o status da task
    } else {
        console.warn("Nenhum Task ID foi encontrado.");
    }

    // Função para mostrar e atualizar a barra de progresso
    function iniciarBarraProgresso() {
        progressBar.style.width = '0%';
        progressBarContainer.style.display = 'block';
        let largura = 0;
        const intervalo = setInterval(() => {
            if (largura >= 100) {
                clearInterval(intervalo);
            } else {
                largura += 10;
                progressBar.style.width = largura + '%';
            }
        }, 500); // Incrementa 10% a cada 500ms
        // Mostrar a mensagem de carregamento
        document.getElementById('loadingMessage').style.display = 'block';
    }

    // Função para esconder a barra de progresso quando o carregamento terminar
    function finalizarBarraProgresso() {
        progressBar.style.width = '100%';
        setTimeout(() => {
            progressBarContainer.style.display = 'none';
            // Esconder a mensagem de carregamento
            document.getElementById('loadingMessage').style.display = 'none';
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
                    console.log('Task concluída com sucesso. Exibindo os resultados...');
                    statusMessage.innerHTML = 'Relatório concluído!';
                    finalizarBarraProgresso();
                    exibirResultados(data.result); // Exibir resultados na tabela usando `data.result`
                } else if (data.status === 'FAILURE') {
                    console.log('Erro no processamento da task.');
                    statusMessage.innerHTML = 'Erro no processamento!';
                    finalizarBarraProgresso();
                } else if (data.status === 'PENDING' || data.status === 'STARTED') {
                    console.log('Task ainda em processamento...');
                    statusMessage.innerHTML = 'Processando seu relatório...';
                    iniciarBarraProgresso();
                    // Continue verificando após um tempo
                    setTimeout(() => verificarStatusTask(taskId), 2000); // Verifica a cada 2 segundos
                }
            } else {
                console.warn("Elemento statusMessage não foi encontrado.");
            }
        } catch (error) {
            console.error('Erro ao verificar o status da task:', error);
            const statusMessage = document.getElementById('statusMessage');
            if (statusMessage) {
                statusMessage.innerHTML = 'Erro ao verificar o status da task.';
            }
        }
    }

    // Função para exibir os resultados na tabela
    function exibirResultados(data) {
        console.log('Exibindo os resultados na tabela:', data);

        document.getElementById('loadingMessage').style.display = 'block';

        const tbody = document.getElementById('jornadaUraBody');
        const selectHospital = document.getElementById('select-hospital');
        const hospitalSelecionado = selectHospital.options[selectHospital.selectedIndex].text;

        if (!tbody) {
            console.error("Tabela 'jornadaUraBody' não encontrada no DOM.");
            return;
        }

        // Destruir o DataTable se já estiver inicializado
        if ($.fn.DataTable.isDataTable('#jornadaUraTable')) {
            $('#jornadaUraTable').DataTable().clear().destroy();
        }

        // Limpar a tabela antes de inserir novos dados
        tbody.innerHTML = '';

        // Inserir as novas linhas de dados
        data.jornadas.forEach(jornada => {
            const row = document.createElement('tr');

            // Calculando a duração da chamada
            const dataInicio = new Date(jornada.data_hora_inicio);
            const dataFim = new Date(jornada.data_hora_fim);
            const duracaoMs = dataFim - dataInicio;
            const duracaoSegundos = Math.floor(duracaoMs / 1000);
            const duracaoMinutos = Math.floor(duracaoSegundos / 60);
            const duracaoFormatada = `${duracaoMinutos} min ${duracaoSegundos % 60} s`;

            // Formatar as datas de início e fim com o tempo no UTC
            const dataFormatada = dataInicio.toLocaleDateString('pt-BR', {
                day: '2-digit', month: '2-digit', year: 'numeric',
            });
            const horaInicio = `${dataInicio.getUTCHours().toString().padStart(2, '0')}:${dataInicio.getUTCMinutes().toString().padStart(2, '0')}:${dataInicio.getUTCSeconds().toString().padStart(2, '0')}`;
            const horaFim = `${dataFim.getUTCHours().toString().padStart(2, '0')}:${dataFim.getUTCMinutes().toString().padStart(2, '0')}:${dataFim.getUTCSeconds().toString().padStart(2, '0')}`;

            const dataComTempo = `${dataFormatada} ${horaInicio} - ${horaFim}`;

            // Definir ícone e cor para o tipo de URA
            let tipoUraHtml;
            if (jornada.tipo_ura === "Tradicional") {
                tipoUraHtml = '<i class="fas fa-keyboard" style="color: blue;"></i> Tradicional';
            } else {
                tipoUraHtml = '<i class="fas fa-microphone" style="color: green;"></i> Cognitiva';
            }

            // Populando as colunas de acordo com a nova ordem
            row.innerHTML = `
                <td>${dataComTempo}</td> <!-- Data de início e fim -->
                <td>${jornada.did_number || 'N/A'}</td> <!-- Did -->
                <td>${jornada.numero_cliente}</td> <!-- Telefone -->
                <td>${jornada.tipo_atendimento || 'N/A'}</td> <!-- Tipo de Atendimento -->
                <td>${jornada.id_chamada}</td> <!-- ID Único da Chamada -->
                <td>${isNaN(duracaoMs) ? 'N/A' : duracaoFormatada}</td> <!-- Duração -->
                <td>${jornada.destino_transferencia || 'N/A'}</td> <!-- Transferido Para -->
                <td>${tipoUraHtml}</td> <!-- Tipo de URA com ícone -->
                <td>${jornada.ramal || 'N/A'}</td> <!-- Ramal -->
                <td>${jornada.setor || 'N/A'}</td> <!-- Setor -->
                <td>${jornada.audio_capturado ? jornada.audio_capturado : 'Sem áudio capturado'}</td> <!-- Audio Capturado -->
                <td>${hospitalSelecionado}</td> <!-- Hospital pesquisado -->
                <td>
                    <button class="btn btn-primary detalhes-btn" data-id="${jornada.id_chamada}" data-jornada='${JSON.stringify(jornada)}'>Detalhes</button>
                </td>
            `;

            tbody.appendChild(row);
        });

        // Vincular eventos ao botão de detalhes
        document.querySelectorAll('.detalhes-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const jornada = JSON.parse(this.getAttribute('data-jornada'));
                exibirDetalhes(jornada);  // Passa a jornada diretamente para exibir os detalhes
            });
        });

        // Reinicializar o DataTable após adicionar os novos dados
        $('#jornadaUraTable').DataTable({
            "paging": true,
            "searching": true,
            "ordering": true,
            "info": true,
            "pageLength": 10,
            "language": {
                "url": "https://cdn.datatables.net/plug-ins/1.10.24/i18n/Portuguese-Brasil.json"
            },
            "columnDefs": [
                { "orderable": true, "targets": 0 },  // Permite ordenação na coluna de Data
                { "width": "15%", "targets": 0 },     // Ajusta a largura da coluna de Data
                { "width": "15%", "targets": 4 }
            ],
            "order": [[0, 'asc']],  // Ordena a primeira coluna (Data) em ordem ascendente por padrão
            "orderMulti": false     // Desativa múltipla ordenação
        });
    }



    

    // Função para exibir os detalhes da jornada
    function exibirDetalhes(jornada) {
        console.log("Exibindo detalhes para a chamada:", jornada);
    
        const detalhesJornada = document.getElementById('detalhesJornada');
        if (!detalhesJornada) {
            console.error("Elemento 'detalhesJornada' não encontrado.");
            return;
        }
    
        // Limpar o conteúdo anterior
        detalhesJornada.innerHTML = '';
    
        // Criar uma lista ordenada para os eventos
        const ol = document.createElement('ol');
        ol.style.paddingLeft = "20px";  // Para criar espaço à esquerda
    
        jornada.eventos.forEach(evento => {
            const li = document.createElement('li');
            li.innerHTML = `
                <div>
                    <strong>Etapa:</strong> ${evento.step_name} <br>
                    <strong>Data:</strong> ${new Date(evento.executed_at).toLocaleString()} <br>
                    <hr>
                </div>
            `;
            ol.appendChild(li);
        });
    
        detalhesJornada.appendChild(ol);
    
        // Exibir o modal
        const modal = new bootstrap.Modal(document.getElementById('detalhesModal'));
        modal.show();
    }


    document.getElementById('filter-button').addEventListener('click', function () {
        const selectHospital = document.getElementById('select-hospital').value;
        const hospitalError = document.getElementById('hospital-error');
    
        // Verifica se o hospital foi selecionado
        if (selectHospital === "") {
            // Mostra a mensagem de erro
            hospitalError.classList.remove('d-none');
        } else {
            // Oculta a mensagem de erro (caso esteja visível)
            hospitalError.classList.add('d-none');
            
            // Enviar o formulário
            document.getElementById('filter-form').submit();
        }
    });
    
    
    
    
    // Adiciona funcionalidade para preenchimento automático ao selecionar o período
    document.getElementById('select-periodo').addEventListener('change', function () {
        const periodo = this.value;
        const startDateInput = document.getElementById('startDate');
        const endDateInput = document.getElementById('endDate');
        const now = new Date();
        let startDate = new Date();
        let endDate = new Date();

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

    // Função para ajustar a data local sem UTC
    function ajustarDataLocal(data) {
        const timezoneOffset = data.getTimezoneOffset() * 60000;
        return new Date(data.getTime() - timezoneOffset).toISOString().slice(0, 16);
    }

    // Adiciona um listener ao botão de filtro
    filterButton.addEventListener('click', function (event) {
        event.preventDefault();
        const dtStart = document.querySelector('#startDate').value;
        const dtFinish = document.querySelector('#endDate').value;
        const selectPeriodo = document.querySelector('#select-periodo').value;

        if (!selectPeriodo && (!dtStart || !dtFinish)) {
            alert("Por favor, preencha as datas corretamente ou selecione um período.");
            return;
        }

        iniciarBarraProgresso();
        form.submit(); // Envia o formulário
    });

    $('#jornadaUraTable').DataTable({
        "paging": true,
        "searching": true,
        "ordering": true,
        "info": true,
        "pageLength": 10,
        "language": {
            "url": "https://cdn.datatables.net/plug-ins/1.10.24/i18n/Portuguese-Brasil.json"
        },
        "columnDefs": [
            { "orderable": true, "targets": 0 },  // Permite ordenação na coluna de Data
            { "width": "15%", "targets": 0 },     // Ajusta a largura da coluna de Data
            { "width": "15%", "targets": 4 }
        ],
        "order": [[0, 'asc']],  // Ordena a primeira coluna (Data) em ordem ascendente por padrão
        "orderMulti": false     // Desativa múltipla ordenação
    });
    
    
    

    // Função para baixar o relatório em Excel
    downloadExcelButton.addEventListener('click', function () {
        alert('Função de download de relatório em Excel ainda não implementada.');
    });

    // Iniciar a verificação do status da task se o taskId estiver disponível
    if (taskId) {
        verificarStatusTask(taskId);
    }
});
