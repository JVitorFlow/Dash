document.addEventListener("DOMContentLoaded", function () {

  const elements = {
    selectPeriodo: document.getElementById("select-periodo"),
    startDate: document.getElementById("startDate"), // Adicionado
    endDate: document.getElementById("endDate"), // Adicionado
    prevPage: document.getElementById("prev-page"),
    nextPage: document.getElementById("next-page"),
    currentPageDisplay: document.getElementById("current-page"),
    paginationContainer: document.getElementById("pagination-container"),
  };

  let allData = []; // Todos os dados recebidos do backend
  let currentPage = 1; // Página inicial
  const limit = 4; // Limite de itens por página

  // Função para formatar a data no padrão ISO compatível com datetime-local
  function ajustarDataLocal(data) {
    const dia = String(data.getDate()).padStart(2, "0");
    const mes = String(data.getMonth() + 1).padStart(2, "0");
    const ano = data.getFullYear();
    const horas = String(data.getHours()).padStart(2, "0");
    const minutos = String(data.getMinutes()).padStart(2, "0");
    return `${ano}-${mes}-${dia}T${horas}:${minutos}`;
  }

  // Atualizar automaticamente os campos de data com base no período selecionado
  elements.selectPeriodo.addEventListener("change", function () {
    const periodo = this.value;
    const now = new Date();
    let startDate = new Date();
    let endDate = new Date();

    switch (periodo) {
      case "today": // Hoje
        startDate.setHours(0, 0, 0, 0);
        endDate = now;
        break;
      case "yesterday": // Ontem
        startDate.setDate(now.getDate() - 1);
        startDate.setHours(0, 0, 0, 0);
        endDate.setDate(now.getDate() - 1);
        endDate.setHours(23, 59, 59, 999);
        break;
      case "7": // Últimos 7 dias
        startDate.setDate(now.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case "15": // Últimos 15 dias
        startDate.setDate(now.getDate() - 15);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case "30": // Últimos 30 dias
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

  // Configuração do botão de filtragem
  const filterButton = document.getElementById("filter-button");
  if (filterButton) {
    filterButton.addEventListener("click", function () {
      currentPage = 1; // Reinicia para a primeira página ao filtrar
      fetchData();
    });
  }


  function showSpinner() {
    let spinner = document.getElementById("loading-spinner");
    if (!spinner) {
      // Adiciona o spinner dinamicamente no container de resultados
      const resultsContainer = document.getElementById("results-container");
      if (resultsContainer) {
        resultsContainer.innerHTML += `
          <div id="loading-spinner" class="loading-spinner">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Carregando...</span>
            </div>
            <p class="text-primary mt-2">Processando, por favor aguarde...</p>
          </div>
        `;
        spinner = document.getElementById("loading-spinner");
      }
    }
    if (spinner) {
      spinner.classList.remove("d-none");
    }
  }
  
  function hideSpinner() {
    const spinner = document.getElementById("loading-spinner");
    if (spinner) {
      spinner.classList.add("d-none");
    }
  }

  // Função para buscar dados da página no backend
  async function fetchData() {
    try {
      const form = document.getElementById("filter-form");
      const dtStart = form.querySelector("#startDate").value;
      const dtFinish = form.querySelector("#endDate").value;
      const hospital = form.querySelector("#select-hospital").value;

      if (!dtStart || !dtFinish || !hospital) {
        alert("Por favor, preencha todos os campos!");
        return;
      }

      showSpinner();

      const response = await fetch(form.action, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": form.querySelector("[name=csrfmiddlewaretoken]").value,
        },
        body: JSON.stringify({
          dt_start: dtStart,
          dt_finish: dtFinish,
          nm_flow_ivr_pico: hospital,
          page: currentPage,
          limit: limit,
        }),
      });

      if (!response.ok) {
        throw new Error(`Erro na requisição: ${response.statusText}`);
      }

      const data = await response.json();

      console.log("Dados recebidos do backend:", data);

      if (data.status === "sucesso") {
        const normalizedData = Array.isArray(data.dados.dados)
          ? data.dados.dados
          : [];
        renderResults(normalizedData); // Renderiza apenas os dados da página atual
        renderPaginationControls(data.dados.total_pages);

        // Salva os parâmetros e resultados da pesquisa no Local Storage
        localStorage.setItem(
          "ultimaPesquisa",
          JSON.stringify({
            parametros: { dtStart, dtFinish, hospital },
            resultados: data.dados,
            currentPage,
          })
        );

      } else {
        alert(data.mensagem || "Erro ao processar os dados.");
      }
    } catch (error) {
      console.error("Erro na requisição:", error);
      alert("Erro ao carregar os dados. Tente novamente.");
    } finally {
      hideSpinner();
    }
  }


  const ultimaPesquisa = JSON.parse(localStorage.getItem("ultimaPesquisa"));

  if (ultimaPesquisa) {
    const { parametros, resultados, currentPage: savedPage } = ultimaPesquisa;

    // Restaura os valores dos campos do formulário
    document.getElementById("startDate").value = parametros.dtStart;
    document.getElementById("endDate").value = parametros.dtFinish;
    document.getElementById("select-hospital").value = parametros.hospital;

    // Atualiza o estado atual da página
    currentPage = savedPage || 1;

    // Renderiza os resultados e a paginação
    renderResults(resultados.dados);
    renderPaginationControls(resultados.total_pages);
  }

  // Renderizar os controles de paginação
  function renderPaginationControls(totalPages) {
    if (!elements.paginationContainer) {
      console.error("Elemento 'paginationContainer' não encontrado.");
      return;
    }

    elements.paginationContainer.innerHTML = `
      <div id="pagination-controls" class="d-flex justify-content-center align-items-center mt-4">
        <button id="prev-page" class="btn btn-secondary me-2" ${
          currentPage === 1 ? "disabled" : ""
        }>Anterior</button>
        <span id="current-page" class="mx-2">Página ${currentPage} de ${totalPages}</span>
        <button id="next-page" class="btn btn-secondary ms-2" ${
          currentPage === totalPages ? "disabled" : ""
        }>Próxima</button>
      </div>
    `;

    // Configurar os eventos dos botões
    document.getElementById("prev-page").addEventListener("click", function () {
      if (currentPage > 1) {
        currentPage -= 1;
        fetchData(); // Atualiza a página
      }
    });

    document.getElementById("next-page").addEventListener("click", function () {
      if (currentPage < totalPages) {
        currentPage += 1;
        fetchData(); // Atualiza a página
      }
    });
  }

  // Função para renderizar os resultados no HTML
  function renderResults(dados) {
    const container = document.getElementById("results-container");
    if (!container) return;

    if (!dados || dados.length === 0) {
      container.innerHTML = `<div class="alert alert-warning">Nenhum dado disponível para exibição.</div>`;
      return;
    }

    container.innerHTML = ""; // Limpa os resultados anteriores

    dados.forEach((dia, index) => {
      // HTML para o Resumo Geral e o Gráfico lado a lado

      // Formata a data para o padrão brasileiro
      const inicioFormatado = dia.periodo.inicio || "Início não disponível";
      const fimFormatado = dia.periodo.fim || "Fim não disponível";

      const resumoEGraficoHtml = `
                <div class="card shadow-sm mb-4">
                    <div class="card-header custom-card-header">
                        <h5 style="color: #ffffff;">${inicioFormatado} - ${fimFormatado}</h5>
                    </div>
    
                    <div class="card-body">
                        <div class="row">
                            <!-- Coluna do Resumo Geral -->
                            <div class="col-md-6">
                                <p><strong>Total de Chamadas:</strong> ${dia.resumo_geral.total_chamadas}</p>
                                <p><strong>Pico de Horário:</strong> ${dia.resumo_geral.pico_horario.horario} - 
                                    ${dia.resumo_geral.pico_horario.chamadas} chamadas (${dia.resumo_geral.pico_horario.percentual})</p>
                                <h6>Categorias:</h6>
                                <ul class="list-unstyled">
                                    <li><i class="fas fa-check-circle text-success"></i> Em Navegação: ${dia.resumo_geral.categorias.navegacao}</li>
                                    <li><i class="fas fa-tasks text-info"></i> Processadas: ${dia.resumo_geral.categorias.processadas}</li>
                                    <li><i class="fas fa-phone-alt text-primary"></i> Direcionadas para Ramal: ${dia.resumo_geral.categorias.transferidas}</li>
                                    <li><i class="fas fa-exclamation-triangle text-warning"></i> Paciente interrompeu a navegação: ${dia.resumo_geral.categorias.abandonadas}</li>
                                    <li><i class="fas fa-user-friends text-secondary"></i> Direcionadas para Humano: ${dia.resumo_geral.categorias.derivadas}</li>
                                    <!--
                                      <li><i class="fas fa-bug text-danger"></i> Erros de Transferência: ${dia.resumo_geral.categorias.erros_transferencia}</li>
                                    -->
                                </ul>
                            </div>
                            <!-- Coluna do Gráfico -->
                            <div class="col-md-6">
                                <canvas id="chart-${index}" width="400" height="200"></canvas>
                            </div>
                        </div>
                        <!-- Botão para abrir o modal -->
                        <div class="text-end mt-3">
                            <button class="btn btn-secondary" data-bs-toggle="modal" data-bs-target="#modal-detalhes-${index}">
                                Ver Detalhes por Horário
                            </button>
                        </div>
                    </div>
                </div>
            `;

      // Modal para Detalhes por Horário
      const modalHtml = `
                <div class="modal fade" id="modal-detalhes-${index}" tabindex="-1" aria-labelledby="modalLabel-${index}" aria-hidden="true">
                    <div class="modal-dialog modal-lg">
                        <div class="modal-content">
                            <div class="modal-header bg-primary text-white">
                                <h5 class="modal-title" id="modalLabel-${index}">
                                    Detalhes por Horário - ${dia.data}
                                    <i class="fas fa-info-circle" data-bs-toggle="tooltip" data-bs-placement="right" 
                                        title="Veja o detalhamento do número de chamadas e sua porcentagem em relação ao total do período.">
                                    </i>
                                </h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body">
                                <table class="table table-striped table-hover text-center">
                                    <thead class="table-light">
                                        <tr>
                                            <th>Horário</th>
                                            <th>Chamadas</th>
                                            <th>
                                                Percentual
                                                <i class="fas fa-info-circle text-secondary" data-bs-toggle="tooltip" 
                                                    title="O percentual é calculado como: (Chamadas no horário / Total de chamadas) x 100">
                                                </i>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${dia.detalhes_horarios
                                          .map(
                                            (d) => `
                                            <tr>
                                                <td>${d.horario}</td>
                                                <td>${d.chamadas}</td>
                                                <td>${d.percentual}</td>
                                            </tr>
                                        `
                                          )
                                          .join("")}
                                    </tbody>
                                </table>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fechar</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

      // Insere o Resumo Geral, o Gráfico, e o Modal no container
      container.insertAdjacentHTML("beforeend", resumoEGraficoHtml + modalHtml);

      // Renderiza o Gráfico usando Chart.js após um pequeno atraso para garantir que o canvas esteja no DOM
      setTimeout(() => {
        renderChart(`chart-${index}`, dia.detalhes_horarios);
      }, 0);
    });
  }

  function renderChart(chartId, detalhesHorarios) {
    const chartElement = document.getElementById(chartId);

    if (!chartElement) {
      console.error(`Canvas element with ID ${chartId} not found.`);
      return;
    }

    // Encontrar o maior pico
    const labels = detalhesHorarios.map((d) => d.horario);
    const dataValues = detalhesHorarios.map((d) => d.chamadas);
    const maxValue = Math.max(...dataValues); // Maior número de chamadas
    const maxIndex = dataValues.indexOf(maxValue); // Índice do maior pico

    const ctx = chartElement.getContext("2d");
    new Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Chamadas por Horário",
            data: dataValues,
            backgroundColor: "rgba(54, 162, 235, 0.2)",
            borderColor: "rgba(54, 162, 235, 1)",
            borderWidth: 2,
            pointBackgroundColor: dataValues.map((value, index) =>
              index === maxIndex
                ? "rgba(0, 123, 255, 1)"
                : "rgba(54, 162, 235, 1)"
            ),
            pointBorderColor: dataValues.map((value, index) =>
              index === maxIndex
                ? "rgba(0, 123, 255, 1)"
                : "rgba(54, 162, 235, 1)"
            ),
            pointRadius: dataValues.map((value, index) =>
              index === maxIndex ? 10 : 5
            ),
            pointHoverRadius: 10,
            pointHoverBackgroundColor: "rgba(0, 123, 255, 1)",
          },
        ],
      },
      options: {
        responsive: true,
        layout: {
          padding: {
            top: 20, // Adiciona espaço acima do gráfico
          },
        },
        plugins: {
          zoom: {
            pan: {
              enabled: true,
              mode: "x",
            },
            zoom: {
              wheel: {
                enabled: true,
              },
              pinch: {
                enabled: true,
              },
              mode: "x",
            },
          },
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              label: function (tooltipItem) {
                return `${tooltipItem.raw} chamadas`;
              },
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: "Quantidade de Chamadas",
            },
          },
          x: {
            title: {
              display: true,
              text: "Horários",
            },
          },
        },
      },
      plugins: [
        {
          afterDatasetsDraw: (chart) => {
            const { ctx } = chart;
            const meta = chart.getDatasetMeta(0);
            const point = meta.data[maxIndex];

            // Adiciona o ícone
            const icon = new Image();
            icon.src = "https://img.icons8.com/ios-filled/50/000000/phone.png"; // URL de um ícone de telefone
            icon.onload = () => {
              ctx.drawImage(icon, point.x - 15, point.y - 20, 30, 30); // Desenha o ícone sobre o ponto
            };
          },
        },
      ],
    });
  }
});
