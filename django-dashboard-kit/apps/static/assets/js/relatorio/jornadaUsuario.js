document.addEventListener('DOMContentLoaded', () => {
    // Global State
    const globalState = {
        data: null,
        hospitalSelected: null
    };
    
    // DOM Elements
    const elements = {
        filterButton: document.querySelector('#filter-button'),
        form: document.querySelector('#filter-form'),
        progressBar: document.getElementById('progressBar'),
        progressBarContainer: document.getElementById('progressBarContainer'),
        statusMessage: document.getElementById('statusMessage'),
        downloadExcelButton: document.getElementById('download-excel'),
        selectPeriodo: document.getElementById('select-periodo'),
        selectHospital: document.getElementById('select-hospital'),
        startDate: document.getElementById('startDate'),
        endDate: document.getElementById('endDate'),
        loadingMessage: document.getElementById('loadingMessage')
    };

    // Initialize Session Storage after Page Load
    const SESSION_KEYS = ['selectPeriodo', 'selectHospital', 'startDate', 'endDate'];

    // Function to restore session storage state
    const restoreSessionStorage = (keys) => {
        keys.forEach(key => {
            if (sessionStorage.getItem(key)) {
                elements[key].value = sessionStorage.getItem(key);
            }
        });
    };

    restoreSessionStorage(SESSION_KEYS);

    // Save and Submit Form on Button Click
    elements.filterButton.addEventListener('click', () => {
        SESSION_KEYS.forEach(key => {
            if (elements[key].value) sessionStorage.setItem(key, elements[key].value);
        });
        elements.form.submit();
    });

    // Progress bar functions
    const updateProgressBar = (width, showLoading = false) => {
        elements.progressBar.style.width = width;
        elements.progressBarContainer.style.display = width === '100%' ? 'none' : 'block';
        elements.loadingMessage.style.display = showLoading ? 'block' : 'none';
    };

    const iniciarBarraProgresso = () => updateProgressBar('0%', true);
    const finalizarBarraProgresso = () => setTimeout(() => updateProgressBar('100%'), 1000);

    // Refactored Async Function to Check Task Status
    const verificarStatusTask = async (taskId) => {
        try {
            const response = await fetch(`/relatorios/celery-status/${taskId}/`);
            if (!response.ok) throw new Error(`Erro HTTP! status: ${response.status}`);
            const data = await response.json();

            elements.statusMessage.innerHTML = {
                'SUCCESS': 'Relatório concluído!',
                'FAILURE': 'Erro no processamento!',
                'PENDING': 'Processando seu relatório...',
                'STARTED': 'Processando seu relatório...'
            }[data.status];

            if (data.status === 'SUCCESS') {
                finalizarBarraProgresso();
                exibirResultados(data.result);
            } else if (['PENDING', 'STARTED'].includes(data.status)) {
                iniciarBarraProgresso();
                setTimeout(() => verificarStatusTask(taskId), 2000);
            } else {
                finalizarBarraProgresso();
            }
        } catch (error) {
            console.error('Erro ao verificar o status da task:', error);
            elements.statusMessage.innerHTML = 'Erro ao verificar o status da task.';
        }
    };

    if (typeof taskId !== 'undefined' && taskId) {
        console.log("Task ID:", taskId);
        verificarStatusTask(taskId);
    } else {
        console.warn("Nenhum Task ID foi encontrado.");
    }


    const exibirResultados = (data) => {
        console.log('Exibindo os resultados na tabela:', data);
    
        // Salvando os dados no globalState para serem usados na contagem de transferências
        globalState.data = data;
        globalState.hospitalSelected = document.getElementById('select-hospital').value;
    
        const tbody = document.getElementById('jornadaUraBody');
        if (!tbody) return console.error("Tabela 'jornadaUraBody' não encontrada no DOM.");
    
        // Preservar o estado atual da tabela antes de destruí-la
        const state = preserveTableState('#jornadaUraTable');
    
        if ($.fn.DataTable.isDataTable('#jornadaUraTable')) {
            $('#jornadaUraTable').DataTable().clear().destroy();
        }
    
        tbody.innerHTML = '';
    
        data.jornadas.forEach(jornada => {
            const row = document.createElement('tr');
            
            // Função para exibir datas em UTC no formato desejado
            const formatToUTC = (dateString) => {
                if (!dateString) return 'Data Inválida';
                const date = new Date(dateString);
                return date.toISOString().replace('T', ' ').slice(0, 19); // Formato: AAAA-MM-DD HH:MM:SS
            };
    
            // Usando os nomes corretos das propriedades da API
            const dataInicio = formatToUTC(jornada.data_hora_inicio);
            const dataFim = formatToUTC(jornada.data_hora_fim);
            const dataComTempo = `${dataInicio} - ${dataFim}`;
    
            // Calcular a duração em milissegundos, se as datas forem válidas
            const duracaoMs = dataInicio !== 'Data Inválida' && dataFim !== 'Data Inválida' 
                              ? new Date(jornada.data_hora_fim) - new Date(jornada.data_hora_inicio) 
                              : NaN;
            const duracaoFormatada = !isNaN(duracaoMs) ? `${Math.floor(duracaoMs / 60000)} min ${(duracaoMs / 1000) % 60} s` : 'N/A';
    
            const tipoUraHtml = jornada.tipo_ura === "Tradicional"
                ? '<i class="fas fa-keyboard" style="color: blue;"></i> Tradicional'
                : '<i class="fas fa-microphone" style="color: green;"></i> Cognitiva';
    
            const ramal = jornada.ramal || ajustarRamalPorHospital(elements.selectHospital.value, jornada.destino_transferencia);
    
            row.innerHTML = `
                <td>${dataComTempo}</td>
                <td>${jornada.did_number || 'N/A'}</td>
                <td>${jornada.numero_cliente}</td>
                <td>${jornada.tipo_atendimento || 'N/A'}</td>
                <td>${jornada.id_chamada}</td>
                <td>${duracaoFormatada}</td>
                <td>${jornada.destino_transferencia || 'N/A'}</td>
                <td>${tipoUraHtml}</td>
                <td>${ramal}</td>
                <td>${jornada.setor || 'N/A'}</td>
                <td>${jornada.audio_capturado ? jornada.audio_capturado : 'Sem áudio capturado'}</td>
                <td>${elements.selectHospital.value}</td>
                <td><button class="btn btn-primary detalhes-btn" data-jornada='${JSON.stringify(jornada)}'>Detalhes</button></td>
            `;
    
            tbody.appendChild(row);
        });
    
        // Reinicializa a DataTable com a opção deferRender e sem destruir o estado anterior
        const table = $('#jornadaUraTable').DataTable({
            paging: true,
            searching: true,
            ordering: true,
            info: true,
            pageLength: 10,
            deferRender: true, // Melhorar performance
            language: {
                url: "https://cdn.datatables.net/plug-ins/1.10.24/i18n/Portuguese-Brasil.json"
            },
            columnDefs: [
                { orderable: true, targets: 0 },
                { width: "15%", targets: [0, 4] }
            ],
            order: [[0, 'asc']],
            orderMulti: false
        });
    
        // Restaurar o estado da tabela após a atualização dos dados
        restoreTableState('#jornadaUraTable', state);
    
        // Adicionar eventos de clique nos botões de detalhes
        document.querySelectorAll('.detalhes-btn').forEach(btn => {
            btn.addEventListener('click', function () {
                exibirDetalhes(JSON.parse(this.getAttribute('data-jornada')));
            });
        });
    };
    
    

    // Vincular eventos ao botão de detalhes
    document.querySelectorAll('.detalhes-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const jornada = JSON.parse(this.getAttribute('data-jornada'));
            exibirDetalhes(jornada);  // Passa a jornada diretamente para exibir os detalhes
        });
    });

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

    // Adiciona funcionalidade para preenchimento automático ao selecionar o período
    elements.selectPeriodo.addEventListener('change', function () {
        const periodo = this.value;
        const now = new Date();
        let startDate = new Date();
        let endDate = new Date();

        switch (periodo) {
            case 'today':
                startDate.setHours(0, 0, 0, 0);
                endDate = now;
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
            elements.startDate.value = ajustarDataLocal(startDate);
            elements.endDate.value = ajustarDataLocal(endDate);
        } else {
            elements.startDate.value = '';
            elements.endDate.value = '';
        }
    });

    // Função para ajustar a data local sem UTC
    function ajustarDataLocal(data) {
        const timezoneOffset = data.getTimezoneOffset() * 60000;
        return new Date(data.getTime() - timezoneOffset).toISOString().slice(0, 16);
    }



    const ajustarRamalPorHospital = (hospitalSelecionado, destinoTransferencia) => {
        const ramais = {
            HM: {
                TransfAgendamentos: 11650,
                TransfReclamacoesElogios: 11651,
                TransfTrabalharConosco: 11653,
                TransfVitimaViolencia: 11652
            },
            HSOR: {
                TransfOuvidoria: 15700,
                TransfFilaCirurgica: 15300,
                TransfAgendamentos: 15200,
                TransfAmbulatorio: 15400
            },
            HSJC: {
                TransfAdministracaoISG: 12700,
                TransfComprasISG: 12800,
                TransfGestaoPessoasISG: 12650,
                TransfAdministracaoRHInova: 12400,
                TransfOuvidoria: 12900,
                TransfAgendamentos: 12200,
                TransfResultadoExames: 12300
            }
        };
        return ramais[hospitalSelecionado]?.[destinoTransferencia] || 'N/A';
    };
    

    // Função para preservar o estado da tabela
    const preserveTableState = (tableId) => {
        const table = $(tableId).DataTable();
        return {
            page: table.page.info().page,
            order: table.order(),
            search: table.search(),
            length: table.page.len()
        };
    };

    // Função para restaurar o estado da tabela
    const restoreTableState = (tableId, state) => {
        const table = $(tableId).DataTable();
        table.page(state.page)
            .order(state.order)
            .search(state.search)
            .page.len(state.length)
            .draw(false); // false evita o recarregamento completo
    };

    // Função de inicialização das tabelas com DataTables
    const initializeDataTables = () => {
        // Inicializar DataTables com a opção deferRender
        $('#tabelaRamal, #tabelaSetor, #tabelaDestino').DataTable({
            paging: true,
            pageLength: 5,
            searching: false,
            lengthChange: false,
            ordering: true,
            deferRender: true // Melhorar performance com deferRender
        });

        // Inicializar a tabela jornadaUra com tradução e configuração
        $('#jornadaUraTable').DataTable({
            paging: true,
            searching: true,
            ordering: true,
            info: true,
            pageLength: 10,
            deferRender: true, // Melhorar performance
            language: {
                url: "https://cdn.datatables.net/plug-ins/1.10.24/i18n/Portuguese-Brasil.json"
            },
            columnDefs: [
                { orderable: true, targets: 0 },
                { width: "15%", targets: [0, 4] }
            ],
            order: [[0, 'asc']],
            orderMulti: false
        });
    };

    // Chamar a função de inicialização das tabelas
    initializeDataTables();


    // Export table to Excel using SheetJS
    const exportTableToExcel = (tableID, filename = 'relatorio_jornada_ura.xlsx') => {
        const table = $('#' + tableID).DataTable();
        const rows = table.rows({ search: 'applied' }).data().toArray();

        let dataToExport = [];
        const headers = Array.from(document.querySelectorAll(`#${tableID} thead th`))
            .slice(0, -1)
            .map(th => th.innerText.trim());
        dataToExport.push(headers);

        rows.forEach(rowData => {
            const row = Object.values(rowData)
                .slice(0, -1)
                .map(value => String(value).replace(/<[^>]+>/g, '').trim());
            dataToExport.push(row);
        });

        const worksheet = XLSX.utils.aoa_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Relatório");
        XLSX.writeFile(workbook, filename);
    };

    elements.downloadExcelButton.addEventListener('click', () => exportTableToExcel('jornadaUraTable'));

    // Event listener for opening the transfer modal and generating transfer data
    document.getElementById('abrirModalTransferencias').addEventListener('click', () => {
        console.log('Dados no globalState:', globalState);
        if (globalState.data && globalState.hospitalSelected) {
            gerarContagemTransferencias(globalState.data, globalState.hospitalSelected);
        } else {
            console.warn('Os dados de transferências não estão disponíveis.');
        }
        // Certifique-se de que o modal está sendo aberto corretamente
        const modalElement = document.getElementById('transferenciasModal');
        const transferenciasModal = new bootstrap.Modal(modalElement);
        transferenciasModal.show();  // Isso deve abrir o modal
    });

    // Function to generate transfer counts
    const gerarContagemTransferencias = (data, hospitalSelecionado) => {

        // Garantindo que globalState tenha os dados corretos
        if (!globalState.data || !globalState.hospitalSelected) {
            console.warn('Os dados de transferências não estão disponíveis.');
            return;
        }
    
        const transferenciasPorRamal = {}; 
        const transferenciasPorSetor = {};
        const transferenciasPorDestinoTradicional = {};
    
        globalState.data.jornadas.forEach(jornada => {
            let ramal = jornada.ramal || 'N/A';
            let setor = jornada.setor || 'N/A';
    
            setor = setor.includes(':') ? setor.split(':')[0].trim() : setor.split('-')[0].trim();
            const tipoUra = jornada.tipo_ura;
            const destino = jornada.destino_transferencia || 'N/A';
    
            // Corrigir Ramal N/A para URA Tradicional
            if (tipoUra === 'Tradicional' && (ramal === 'N/A' || !ramal)) {
                ramal = mapRamal(hospitalSelecionado, destino);
            }
    
            // Update counts for Ramal, Setor, and Destino
            transferenciasPorRamal[ramal] = transferenciasPorRamal[ramal] || { Cognitiva: 0, Tradicional: 0 };
            transferenciasPorRamal[ramal][tipoUra] += 1;
    
            if (tipoUra === 'Cognitiva') {
                transferenciasPorSetor[setor] = transferenciasPorSetor[setor] || { total: 0, ramal };
                transferenciasPorSetor[setor].total += 1;
            }
    
            if (tipoUra === 'Tradicional') {
                transferenciasPorDestinoTradicional[destino] = (transferenciasPorDestinoTradicional[destino] || 0) + 1;
            }
        });
    
        exibirContagemTransferencias(transferenciasPorRamal, transferenciasPorSetor, transferenciasPorDestinoTradicional);
        encontrarRecorrenciasDeChamadas(globalState.data.jornadas);
    };
    

    // Function to map ramal based on hospital and destination
    const mapRamal = (hospital, destino) => {
        const ramalMapping = {
            'HM': { 'TransfAgendamentos': 11650, 'TransfReclamacoesElogios': 11651, 'TransfTrabalharConosco': 11653, 'TransfVitimaViolencia': 11652 },
            'HSOR': { 'TransfOuvidoria': 15700, 'TransfFilaCirurgica': 15300, 'TransfAgendamentos': 15200, 'TransfAmbulatorio': 15400 },
            'HSJC': { 'TransfAdministracaoISG': 12700, 'TransfComprasISG': 12800, 'TransfGestaoPessoasISG': 12650, 'TransfAdministracaoRHInova': 12400, 'TransfOuvidoria': 12900, 'TransfAgendamentos': 12200, 'TransfResultadoExames': 12300 }
        };
        return ramalMapping[hospital]?.[destino] || 'N/A';
    };

    // Function to display transfer counts in the tables
    const exibirContagemTransferencias = (transferenciasPorRamal, transferenciasPorSetor, transferenciasPorDestinoTradicional) => {
        const tabelaRamalBody = document.getElementById('tabelaRamalBody');
        const tabelaSetorBody = document.getElementById('tabelaSetorBody');
        const tabelaDestinoBody = document.getElementById('tabelaDestinoBody');
        
        // Função para capturar e restaurar o estado do DataTable
        const preserveTableState = (tableId) => {
            const table = $(tableId).DataTable();
            const page = table.page.info().page; // Captura a página atual
            const order = table.order(); // Captura a ordenação
            const search = table.search(); // Captura a pesquisa
            const length = table.page.len(); // Captura o número de registros por página
            
            return { page, order, search, length };
        };
        
        // Função para restaurar o estado do DataTable
        const restoreTableState = (tableId, state) => {
            const table = $(tableId).DataTable();
            table.page(state.page).order(state.order).search(state.search).page.len(state.length).draw(false);
        };
    
        const updateDataTable = (tableId, data, columns) => {
            const tableBody = document.getElementById(tableId + 'Body'); // Corrigir para pegar o corpo da tabela corretamente
            if (tableBody) {
                const table = $('#' + tableId).DataTable();
                const tableState = preserveTableState('#' + tableId);
        
                // Destruir a tabela apenas se ela existir e tiver sido inicializada corretamente
                if ($.fn.DataTable.isDataTable('#' + tableId)) {
                    try {
                        table.clear().destroy();
                    } catch (error) {
                        console.warn('Erro ao destruir a DataTable:', error);
                    }
                }
        
                // Atualiza a tabela com novos dados
                tableBody.innerHTML = '';
                data.forEach(item => {
                    const row = document.createElement('tr');
                    row.innerHTML = columns.map(col => `<td>${item[col]}</td>`).join('');
                    tableBody.appendChild(row);
                });
        
                // Reinicializa o DataTable com paginação e ordenação
                const newTable = $('#' + tableId).DataTable({
                    paging: true,
                    pageLength: 5,
                    searching: false,
                    ordering: true,
                    order: [[1, 'desc']],
                    deferRender: true, // Melhorar performance com deferRender
                    destroy: true // Garante que a tabela seja destruída e recriada
                });
        
                // Restaurar o estado da tabela após a recriação
                restoreTableState('#' + tableId, tableState);
            } else {
                console.warn('Tabela não encontrada no DOM:', tableId);
            }
        };
        
    
        const ramalData = Object.entries(transferenciasPorRamal).map(([ramal, dados]) => ({ ramal, total: dados.Cognitiva + dados.Tradicional, cognitiva: dados.Cognitiva, tradicional: dados.Tradicional }));
        updateDataTable('tabelaRamal', ramalData, ['ramal', 'total', 'cognitiva', 'tradicional']);
    
        const setorData = Object.entries(transferenciasPorSetor).map(([setor, dados]) => ({ setor, total: dados.total, ramal: dados.ramal }));
        updateDataTable('tabelaSetor', setorData, ['setor', 'total', 'ramal']);
    
        const destinoData = Object.entries(transferenciasPorDestinoTradicional).map(([destino, total]) => ({ destino, total }));
        updateDataTable('tabelaDestino', destinoData, ['destino', 'total']);
    };
    
    
    
    const exibirResumoRecorrenciasChamadas = (recorrenciasArray) => {
        const tabelaRecorrenciasBody = document.getElementById('tabelaRecorrenciasBody');
    
        // Limpar o conteúdo anterior da tabela apenas uma vez
        if (tabelaRecorrenciasBody) {
            tabelaRecorrenciasBody.innerHTML = '';
        }
    
        // Exibir mensagem se não houver recorrências
        if (recorrenciasArray.length === 0) {
            tabelaRecorrenciasBody.innerHTML = `<tr><td colspan="5">Nenhuma reincidência encontrada.</td></tr>`;
            return;
        }
    
        // Preencher a tabela com os dados de recorrências
        recorrenciasArray.forEach(recorrencia => {
            const row = document.createElement('tr');
            const duracaoTotalMinutos = Math.floor(recorrencia.duracaoTotal / 60);
            row.innerHTML = `
                <td>${recorrencia.telefone}</td>
                <td>${recorrencia.totalChamadas}</td>
                <td>${recorrencia.chamadasCognitivas}</td>
                <td>${recorrencia.chamadasTradicionais}</td>
                <td>${duracaoTotalMinutos} min</td>
            `;
            tabelaRecorrenciasBody.appendChild(row);
        });
    
        // Verificar se DataTable já foi inicializado, se não, inicialize
        if (!$.fn.DataTable.isDataTable('#tabelaRecorrencias')) {
            $('#tabelaRecorrencias').DataTable({
                paging: true,
                pageLength: 5,
                ordering: true,
                order: [[1, 'desc']],
                searching: false,
                lengthChange: false,
                destroy: true // Permitir que a tabela seja destruída quando recarregar dados
            });
        } else {
            // Apenas limpar e adicionar novos dados, sem destruir a tabela
            const table = $('#tabelaRecorrencias').DataTable();
            table.clear().rows.add(recorrenciasArray.map(recorrencia => [
                recorrencia.telefone,
                recorrencia.totalChamadas,
                recorrencia.chamadasCognitivas,
                recorrencia.chamadasTradicionais,
                `${Math.floor(recorrencia.duracaoTotal / 60)} min`
            ])).draw();
        }
    };
    
    

    // Function to find recurring calls
    const encontrarRecorrenciasDeChamadas = (jornadas) => {
        const recorrencias = {};
        jornadas.forEach(jornada => {
            const telefone = jornada.numero_cliente || 'Desconhecido';
            recorrencias[telefone] = recorrencias[telefone] || { telefone, totalChamadas: 0, chamadasCognitivas: 0, chamadasTradicionais: 0, duracaoTotal: 0 };
            recorrencias[telefone].totalChamadas += 1;
            if (jornada.tipo_ura === 'Cognitiva') recorrencias[telefone].chamadasCognitivas += 1;
            else recorrencias[telefone].chamadasTradicionais += 1;
            recorrencias[telefone].duracaoTotal += calcularDuracaoEmSegundos(jornada.data_hora_inicio, jornada.data_hora_fim);
        });

        const recorrenciasArray = Object.values(recorrencias).filter(item => item.totalChamadas >= 2).sort((a, b) => b.totalChamadas - a.totalChamadas);
        exibirResumoRecorrenciasChamadas(recorrenciasArray);
    };

    const calcularDuracaoEmSegundos = (inicio, fim) => {
        const dataInicio = new Date(inicio);
        const dataFim = new Date(fim);
        return (dataFim - dataInicio) / 1000;
    };
});
