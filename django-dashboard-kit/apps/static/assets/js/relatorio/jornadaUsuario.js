document.addEventListener("DOMContentLoaded", () => {

  // Global State
  const globalState = {
    data: null,
    hospitalSelected: null,
  };

  // DOM Elements
  const elements = {
    filterButton: document.querySelector("#filter-button"),
    form: document.querySelector("#filter-form"),
    progressBar: document.getElementById("progressBar"),
    progressBarContainer: document.getElementById("progressBarContainer"),
    statusMessage: document.getElementById("statusMessage"),
    downloadExcelButton: document.getElementById("download-excel"),
    selectPeriodo: document.getElementById("select-periodo"),
    selectHospital: document.getElementById("select-hospital"),
    startDate: document.getElementById("startDate"),
    endDate: document.getElementById("endDate"),
    loadingMessage: document.getElementById("loadingMessage"),
  };

  // Inicializa os filtros salvos no sessionStorage
  const SESSION_KEYS = [
    "selectPeriodo",
    "selectHospital",
    "startDate",
    "endDate",
  ];
  const restoreSessionStorage = (keys) => {
    keys.forEach((key) => {
      if (sessionStorage.getItem(key)) {
        elements[key].value = sessionStorage.getItem(key);
      }
    });
  };
  restoreSessionStorage(SESSION_KEYS);

  // ---- Funções Auxiliares de Tabela ----

  // Preserva o estado atual da DataTable
  const preserveTableState = (tableId) => {
    const tableElement = document.querySelector(tableId);
    if (!tableElement) {
      return {}; // Retorna um objeto vazio se o elemento não existir
    }
    const table = $(tableId).DataTable();
    return {
      page: table.page.info().page,
      order: table.order(),
      search: table.search(),
      length: table.page.len(),
    };
  };

  // Restaura o estado da DataTable
  const restoreTableState = (tableId, state) => {
    const table = $(tableId).DataTable();
    table
      .page(state.page)
      .order(state.order)
      .search(state.search)
      .page.len(state.length)
      .draw(false);
  };

  // ---- Função para exibir resultados na tabela ----
  function exibirResultados(data) {
    // Salva os dados no sessionStorage
    sessionStorage.setItem("jornadaUraData", JSON.stringify(data));
    globalState.data = data;
    globalState.hospitalSelected = elements.selectHospital.value;
  
    const tableElement = document.querySelector("#jornadaUraTable");
    const tbody = document.getElementById("jornadaUraBody");
  
    if (!tableElement || !tbody) {
      console.error(
        "Tabela ou tbody não encontrada no DOM. Verifique o HTML e IDs."
      );
      return;
    }

  
    // --- [1] Verifica e destrói a DataTable, se existir ---
    if ($.fn.DataTable.isDataTable("#jornadaUraTable")) {
      try {
        console.log("Destruindo DataTable existente...");
        $("#jornadaUraTable").DataTable().clear().destroy();
      } catch (error) {
        console.warn("Erro ao destruir a DataTable:", error);
      }
    }
  
    // --- [2] Limpa o conteúdo do <tbody> ---
    tbody.innerHTML = "";
  
    // --- [3] Preenche os dados na tabela ---
    data.jornadas.forEach((jornada) => {
      const row = document.createElement("tr");
  
      const formatToUTC = (dateString) => {
        if (!dateString) return "Data Inválida";
        const date = new Date(dateString);
        return date.toISOString().replace("T", " ").slice(0, 19);
      };
  
      const dataInicio = formatToUTC(jornada.data_hora_inicio);
      const dataFim = formatToUTC(jornada.data_hora_fim);
      const dataComTempo = `${dataInicio} - ${dataFim}`;
  
      const duracaoMs =
        dataInicio !== "Data Inválida" && dataFim !== "Data Inválida"
          ? new Date(jornada.data_hora_fim) - new Date(jornada.data_hora_inicio)
          : NaN;
      const minutos = Math.floor(duracaoMs / 60000);
      const segundos = ((duracaoMs % 60000) / 1000).toFixed(2);
      const duracaoFormatada = !isNaN(duracaoMs)
        ? `${minutos} min ${segundos} s`
        : "N/A";
  
      const tipoUraHtml =
        jornada.tipo_ura === "Tradicional"
          ? '<i class="fas fa-keyboard" style="color: blue;"></i> Tradicional'
          : '<i class="fas fa-microphone" style="color: green;"></i> Cognitiva';
  
      const ramal =
        jornada.ramal ||
        ajustarRamalPorHospital(
          elements.selectHospital.value,
          jornada.destino_transferencia
        );
  
      row.innerHTML = `
        <td>${dataComTempo}</td>
        <td>${jornada.did_number || "N/A"}</td>
        <td>${jornada.numero_cliente}</td>
        <td>${jornada.tipo_atendimento || "N/A"}</td>
        <td>${jornada.id_chamada}</td>
        <td>${duracaoFormatada}</td>
        <td>${jornada.destino_transferencia || "N/A"}</td>
        <td>${tipoUraHtml}</td>
        <td>${ramal}</td>
        <td>${jornada.setor || "N/A"}</td>
        <td>${
          jornada.audio_capturado
            ? jornada.audio_capturado
            : "Sem áudio capturado"
        }</td>
        <td>${elements.selectHospital.value}</td>
        <td><button class="btn btn-primary detalhes-btn" data-jornada='${JSON.stringify(
          jornada
        )}'>Detalhes</button></td>
      `;
      tbody.appendChild(row);
    });
  
    // --- [4] Inicializa a nova DataTable ---
    $("#jornadaUraTable").DataTable({
      paging: true,
      searching: true,
      ordering: true,
      info: true,
      pageLength: 10,
      deferRender: true,
      language: {
        url: "https://cdn.datatables.net/plug-ins/1.10.24/i18n/Portuguese-Brasil.json",
      },
      columnDefs: [
        { orderable: true, targets: 0 },
        { width: "15%", targets: [0, 4] },
      ],
      order: [[0, "asc"]],
      orderMulti: false,
    });
  
    // --- [5] Vincula os eventos para os botões de detalhes ---
    document.querySelectorAll(".detalhes-btn").forEach((btn) => {
      btn.addEventListener("click", function () {
        exibirDetalhes(JSON.parse(this.getAttribute("data-jornada")));
      });
    });
  }
  

  // ---- Função para verificar o status da task (assíncrona) ----

  const verificarStatusTask = async (taskId) => {
    try {
      const response = await fetch(`/relatorios/celery-status/${taskId}/`);
      if (!response.ok) {
        throw new Error(`Erro HTTP! status: ${response.status}`);
      }
      const data = await response.json();

      elements.statusMessage.innerHTML = {
        SUCCESS: "Relatório concluído!",
        FAILURE: "Erro no processamento!",
        PENDING: "Processando seu relatório...",
        STARTED: "Processando seu relatório...",
      }[data.status];

      if (data.status === "SUCCESS") {
        exibirResultados(data.result);
      } else if (["PENDING", "STARTED"].includes(data.status)) {
        iniciarBarraProgresso();
        setTimeout(() => verificarStatusTask(taskId), 2000);
        return;
      }
    } catch (error) {
      console.error("Erro ao verificar o status da task:", error);
      elements.statusMessage.innerHTML = "Erro ao verificar o status da task.";
    }
    finalizarBarraProgresso();
  };

  // ---- Outras funções auxiliares: progress bar e exibir detalhes ----

  const updateProgressBar = (width, showLoading = false) => {
    elements.progressBar.style.width = width;
    elements.progressBarContainer.style.display =
      width === "100%" ? "none" : "block";
    elements.loadingMessage.style.display = showLoading ? "block" : "none";
  };

  const iniciarBarraProgresso = () => updateProgressBar("0%", true);
  const finalizarBarraProgresso = () =>
    setTimeout(() => updateProgressBar("100%"), 1000);

  function exibirDetalhes(jornada) {
    const detalhesJornada = document.getElementById("detalhesJornada");
    if (!detalhesJornada) {
      return console.error("Elemento 'detalhesJornada' não encontrado.");
    }
    detalhesJornada.innerHTML = "";
    const ol = document.createElement("ol");
    ol.style.paddingLeft = "20px";

    jornada.eventos.forEach((evento) => {
      const li = document.createElement("li");
      li.innerHTML = `
        <div>
          <strong>Etapa:</strong> ${evento.step_name} <br>
          <strong>Data:</strong> ${new Date(
            evento.executed_at
          ).toLocaleString()} <br>
          <hr>
        </div>
      `;
      ol.appendChild(li);
    });
    detalhesJornada.appendChild(ol);
    const modal = new bootstrap.Modal(document.getElementById("detalhesModal"));
    modal.show();
  }

  // ---- Evento do botão de filtro ----

  elements.filterButton.addEventListener("click", () => {
    const previousFilters = {
      selectPeriodo: sessionStorage.getItem("selectPeriodo"),
      selectHospital: sessionStorage.getItem("selectHospital"),
      startDate: sessionStorage.getItem("startDate"),
      endDate: sessionStorage.getItem("endDate"),
    };

    const currentFilters = {
      selectPeriodo: elements.selectPeriodo.value,
      selectHospital: elements.selectHospital.value,
      startDate: elements.startDate.value,
      endDate: elements.endDate.value,
    };

    const filtersChanged =
      JSON.stringify(previousFilters) !== JSON.stringify(currentFilters);

    if (filtersChanged) {
      SESSION_KEYS.forEach((key) => {
        if (elements[key].value)
          sessionStorage.setItem(key, elements[key].value);
      });
      // Remove dados antigos para forçar a atualização
      sessionStorage.removeItem("jornadaUraData");
      elements.form.submit();
    } else {
      console.log("Os filtros não foram alterados.");
    }
  });

  // ---- Preenchimento automático dos campos de data conforme o período selecionado ----

  elements.selectPeriodo.addEventListener("change", function () {
    const periodo = this.value;
    const now = new Date();
    let startDate = new Date();
    let endDate = new Date();

    switch (periodo) {
      case "today":
        startDate.setHours(0, 0, 0, 0);
        endDate = now;
        break;
      case "yesterday":
        startDate.setDate(now.getDate() - 1);
        startDate.setHours(0, 0, 0, 0);
        endDate.setDate(now.getDate() - 1);
        endDate.setHours(23, 59, 59, 999);
        break;
      case "7":
        startDate.setDate(now.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case "15":
        startDate.setDate(now.getDate() - 15);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case "30":
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
      elements.startDate.value = "";
      elements.endDate.value = "";
    }
  });

  function ajustarDataLocal(data) {
    const timezoneOffset = data.getTimezoneOffset() * 60000;
    return new Date(data.getTime() - timezoneOffset).toISOString().slice(0, 16);
  }

  const ajustarRamalPorHospital = (
    hospitalSelecionado,
    destinoTransferencia
  ) => {
    const ramais = {
      HM: {
        TransfAgendamentos: 11730,
        TransfRamalServicoAtendimentoUsuarioSAU: 11651,
        TransfTrabalharConosco: 11653,
        TransfVitimaViolencia: 11652,
      },
      HSOR: {
        TransfOuvidoria: 15700,
        TransfFilaCirurgica: 15300,
        TransfAgendamentos: 15200,
        TransfAmbulatorio: 15400,
      },
      HSJC: {
        TransfAdministracaoISG: 12700,
        TransfComprasISG: 12800,
        TransfGestaoPessoasISG: 12650,
        TransfAdministracaoRHInova: 12400,
        TransfOuvidoria: 12900,
        TransfAgendamentos: 12200,
        TransfResultadoExames: 12300,
      },
    };
    return ramais[hospitalSelecionado]?.[destinoTransferencia] || "N/A";
  };

  // ---- Inicialização das DataTables e Exportação para Excel ----

  const initializeDataTables = () => {
    $("#tabelaRamal, #tabelaSetor, #tabelaDestino").DataTable({
      paging: true,
      pageLength: 5,
      searching: false,
      lengthChange: false,
      ordering: true,
      deferRender: true,
    });

  };
  initializeDataTables();

  const exportTableToExcel = (
    tableID,
    filename = "relatorio_jornada_ura.xlsx"
  ) => {
    const table = $("#" + tableID).DataTable();
    const rows = table.rows({ search: "applied" }).data().toArray();

    let dataToExport = [];
    const headers = Array.from(
      document.querySelectorAll(`#${tableID} thead th`)
    )
      .slice(0, -1)
      .map((th) => th.innerText.trim());
    dataToExport.push(headers);

    rows.forEach((rowData) => {
      const row = Object.values(rowData)
        .slice(0, -1)
        .map((value) =>
          String(value)
            .replace(/<[^>]+>/g, "")
            .trim()
        );
      dataToExport.push(row);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Relatório");
    XLSX.writeFile(workbook, filename);
  };
  elements.downloadExcelButton.addEventListener("click", () =>
    exportTableToExcel("jornadaUraTable")
  );

  // ---- Modal de Transferências e Geração de Dados ----

  document
    .getElementById("abrirModalTransferencias")
    .addEventListener("click", () => {
      if (globalState.data && globalState.hospitalSelected) {
        gerarContagemTransferencias(
          globalState.data,
          globalState.hospitalSelected
        );
      } else {
        console.warn("Os dados de transferências não estão disponíveis.");
      }
      const modalElement = document.getElementById("transferenciasModal");
      const transferenciasModal = new bootstrap.Modal(modalElement);
      transferenciasModal.show();
    });

  const gerarContagemTransferencias = (data, hospitalSelecionado) => {
    if (!globalState.data || !globalState.hospitalSelected) {
      console.warn("Os dados de transferências não estão disponíveis.");
      return;
    }

    const transferenciasPorRamal = {};
    const transferenciasPorSetor = {};
    const transferenciasPorDestinoTradicional = {};

    globalState.data.jornadas.forEach((jornada) => {
      let ramal = jornada.ramal || "N/A";
      let setor = jornada.setor || "N/A";

      setor = setor.includes(":")
        ? setor.split(":")[0].trim()
        : setor.split("-")[0].trim();
      const tipoUra = jornada.tipo_ura;
      const destino = jornada.destino_transferencia || "N/A";

      if (
        hospitalSelecionado === "HM" &&
        destino === "Transferência Agendamento WhatsApp"
      ) {
        ramal = "WhatsApp";
      }

      if (tipoUra === "Tradicional" && (ramal === "N/A" || !ramal)) {
        ramal = mapRamal(hospitalSelecionado, destino);
      }

      transferenciasPorRamal[ramal] = transferenciasPorRamal[ramal] || {
        Cognitiva: 0,
        Tradicional: 0,
      };
      transferenciasPorRamal[ramal][tipoUra] += 1;

      if (tipoUra === "Cognitiva") {
        transferenciasPorSetor[setor] = transferenciasPorSetor[setor] || {
          total: 0,
          ramal,
        };
        transferenciasPorSetor[setor].total += 1;
      }

      if (tipoUra === "Tradicional") {
        transferenciasPorDestinoTradicional[destino] =
          (transferenciasPorDestinoTradicional[destino] || 0) + 1;
      }
    });

    exibirContagemTransferencias(
      transferenciasPorRamal,
      transferenciasPorSetor,
      transferenciasPorDestinoTradicional
    );
    encontrarRecorrenciasDeChamadas(globalState.data.jornadas);
  };

  const mapRamal = (hospital, destino) => {
    const ramalMapping = {
      HM: {
        TransfAgendamentos: 11730,
        TransfReclamacoesElogios: 11651,
        TransfTrabalharConosco: 11653,
        TransfVitimaViolencia: 11652,
      },
      HSOR: {
        TransfOuvidoria: 15700,
        TransfFilaCirurgica: 15300,
        TransfAgendamentos: 15200,
        TransfAmbulatorio: 15400,
      },
      HSJC: {
        TransfAdministracaoISG: 12700,
        TransfComprasISG: 12800,
        TransfGestaoPessoasISG: 12650,
        TransfAdministracaoRHInova: 12400,
        TransfOuvidoria: 12900,
        TransfAgendamentos: 12200,
        TransfResultadoExames: 12300,
      },
    };
    return ramalMapping[hospital]?.[destino] || "N/A";
  };

  const exibirContagemTransferencias = (
    transferenciasPorRamal,
    transferenciasPorSetor,
    transferenciasPorDestinoTradicional
  ) => {
    const tabelaRamalBody = document.getElementById("tabelaRamalBody");
    const tabelaSetorBody = document.getElementById("tabelaSetorBody");
    const tabelaDestinoBody = document.getElementById("tabelaDestinoBody");

    const updateDataTable = (tableId, data, columns) => {
      const tableBody = document.getElementById(tableId + "Body");
      if (tableBody) {
        const table = $("#" + tableId).DataTable();
        const tableState = preserveTableState("#" + tableId);

        if ($.fn.DataTable.isDataTable("#" + tableId)) {
          try {
            table.clear().destroy();
          } catch (error) {
            console.warn("Erro ao destruir a DataTable:", error);
          }
        }

        tableBody.innerHTML = "";
        data.forEach((item) => {
          const row = document.createElement("tr");
          row.innerHTML = columns
            .map((col) => `<td>${item[col]}</td>`)
            .join("");
          tableBody.appendChild(row);
        });

        const newTable = $("#" + tableId).DataTable({
          paging: true,
          pageLength: 5,
          searching: false,
          ordering: true,
          order: [[1, "desc"]],
          deferRender: true,
          destroy: true,
        });
        restoreTableState("#" + tableId, tableState);
      } else {
        console.warn("Tabela não encontrada no DOM:", tableId);
      }
    };

    const ramalData = Object.entries(transferenciasPorRamal).map(
      ([ramal, dados]) => ({
        ramal,
        total: dados.Cognitiva + dados.Tradicional,
        cognitiva: dados.Cognitiva,
        tradicional: dados.Tradicional,
      })
    );
    updateDataTable("tabelaRamal", ramalData, [
      "ramal",
      "total",
      "cognitiva",
      "tradicional",
    ]);

    const setorData = Object.entries(transferenciasPorSetor).map(
      ([setor, dados]) => ({ setor, total: dados.total, ramal: dados.ramal })
    );
    updateDataTable("tabelaSetor", setorData, ["setor", "total", "ramal"]);

    const destinoData = Object.entries(transferenciasPorDestinoTradicional).map(
      ([destino, total]) => ({ destino, total })
    );
    updateDataTable("tabelaDestino", destinoData, ["destino", "total"]);
  };

  const exibirResumoRecorrenciasChamadas = (recorrenciasArray) => {
    const tabelaRecorrenciasBody = document.getElementById(
      "tabelaRecorrenciasBody"
    );
    if (tabelaRecorrenciasBody) {
      tabelaRecorrenciasBody.innerHTML = "";
    }
    if (recorrenciasArray.length === 0) {
      tabelaRecorrenciasBody.innerHTML = `<tr><td colspan="5">Nenhuma reincidência encontrada.</td></tr>`;
      return;
    }
    recorrenciasArray.forEach((recorrencia) => {
      const row = document.createElement("tr");
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

    if (!$.fn.DataTable.isDataTable("#tabelaRecorrencias")) {
      $("#tabelaRecorrencias").DataTable({
        paging: true,
        pageLength: 5,
        ordering: true,
        order: [[1, "desc"]],
        searching: false,
        lengthChange: false,
        destroy: true,
      });
    } else {
      const table = $("#tabelaRecorrencias").DataTable();
      table
        .clear()
        .rows.add(
          recorrenciasArray.map((recorrencia) => [
            recorrencia.telefone,
            recorrencia.totalChamadas,
            recorrencia.chamadasCognitivas,
            recorrencia.chamadasTradicionais,
            `${Math.floor(recorrencia.duracaoTotal / 60)} min`,
          ])
        )
        .draw();
    }
  };

  const encontrarRecorrenciasDeChamadas = (jornadas) => {
    const recorrencias = {};
    jornadas.forEach((jornada) => {
      const telefone = jornada.numero_cliente || "Desconhecido";
      recorrencias[telefone] = recorrencias[telefone] || {
        telefone,
        totalChamadas: 0,
        chamadasCognitivas: 0,
        chamadasTradicionais: 0,
        duracaoTotal: 0,
      };
      recorrencias[telefone].totalChamadas += 1;
      if (jornada.tipo_ura === "Cognitiva") {
        recorrencias[telefone].chamadasCognitivas += 1;
      } else {
        recorrencias[telefone].chamadasTradicionais += 1;
      }
      recorrencias[telefone].duracaoTotal += calcularDuracaoEmSegundos(
        jornada.data_hora_inicio,
        jornada.data_hora_fim
      );
    });

    const recorrenciasArray = Object.values(recorrencias)
      .filter((item) => item.totalChamadas >= 2)
      .sort((a, b) => b.totalChamadas - a.totalChamadas);
    exibirResumoRecorrenciasChamadas(recorrenciasArray);
  };

  const calcularDuracaoEmSegundos = (inicio, fim) => {
    const dataInicio = new Date(inicio);
    const dataFim = new Date(fim);
    return (dataFim - dataInicio) / 1000;
  };

  // ---- Verifica se há dados persistidos ou um taskId para buscar dados ----

  const persistedData = sessionStorage.getItem("jornadaUraData");
  if (persistedData) {
    console.log("Dados persistidos encontrados. Exibindo resultados.");
    exibirResultados(JSON.parse(persistedData));
  } else if (typeof taskId !== "undefined" && taskId) {
    console.log("Nenhum dado persistido encontrado. Verificando task:", taskId);
    verificarStatusTask(taskId);
  } else {
    console.warn("Nenhum Task ID foi encontrado e não há dados persistidos.");
  }

  // ---- Fim do DOMContentLoaded ----
});
