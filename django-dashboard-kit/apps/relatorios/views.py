from django.views.generic import TemplateView
from celery.result import AsyncResult
from django.contrib.auth.mixins import LoginRequiredMixin
from django.shortcuts import render
from .services import (
    iniciar_task_assincrona,
    obter_token_autenticacao,
    captura_informacoes_leia_ia,
)
from .tasks import processar_chamadas_async, processar_jornada_ura_async
from .forms import DataIntervalForm, JornadaUraForm
from django.http import JsonResponse
from django.contrib import messages
from django.utils.timezone import now
import logging

logger = logging.getLogger(__name__)


class LigacoesAbandonadasView(LoginRequiredMixin, TemplateView):
    template_name = "relatorios/chamadas_abandonadas.html"

    def get(self, request, *args, **kwargs):
        # Exibe o formulário na tela inicial
        context = {"form": DataIntervalForm()}
        return self.render_to_response(context)

    def post(self, request, *args, **kwargs):
        # Processa os dados do formulário submetido
        # print(f"[{now()}] Dados recebidos no POST: {request.POST}")
        form = DataIntervalForm(request.POST)

        if not form.is_valid():
            return self._handle_form_invalid(request, form)

        return self._process_task(request, form)

    def _handle_form_invalid(self, request, form):
        """
        Trata o caso em que o formulário é inválido.
        """
        messages.error(request, "Dados do formulário inválidos.")
        return self.render_to_response({"form": form})

    def _process_task(self, request, form):
        """
        Processa a submissão válida do formulário, iniciando uma tarefa assíncrona.
        """
        dt_start = form.cleaned_data["dt_start"]
        dt_finish = form.cleaned_data["dt_finish"]

        # Obter token de autenticação
        token = self._get_authentication_token()
        if not token:
            return self._handle_auth_error(request, form)

        # Iniciar a tarefa assíncrona
        try:
            task_id = self._start_async_task(token, dt_start, dt_finish)
            return self._handle_task_success(request, task_id)
        except RuntimeError as e:
            return self._handle_task_error(request, form, str(e))

    def _get_authentication_token(self):
        """
        Obtém o token de autenticação.
        """
        return obter_token_autenticacao()

    def _start_async_task(self, token, dt_start, dt_finish):
        """
        Inicia a tarefa assíncrona e retorna o ID da tarefa.
        """
        task_id = iniciar_task_assincrona(
            processar_chamadas_async,
            token,
            dt_start.strftime("%Y-%m-%d %H:%M:%S"),
            dt_finish.strftime("%Y-%m-%d %H:%M:%S"),
            {"call_data.code_status_ivr": 10003},
        )
        return task_id

    def _handle_auth_error(self, request, form):
        """
        Trata o caso de erro ao obter o token de autenticação.
        """
        messages.error(request, "Falha ao obter o token de autenticação.")
        return self.render_to_response({"form": form})

    def _handle_task_success(self, request, task_id):
        """
        Trata o caso de sucesso ao iniciar a tarefa.
        """
        context = {
            "task_id": task_id,  # Task ID enviado ao front-end
            "status_message": "Processando relatório... Verifique o progresso.",
        }
        return render(request, self.template_name, context)

    def _handle_task_error(self, request, form, error_message):
        """
        Trata o caso de erro ao iniciar a tarefa.
        """
        messages.error(request, f"Erro ao iniciar a tarefa: {error_message}")
        return self.render_to_response({"form": form})


class UraJornadaView(LoginRequiredMixin, TemplateView):
    template_name = "relatorios/jornada_ura.html"

    def post(self, request, *args, **kwargs):
        """
        Processa o formulário de jornada da URA e inicia a tarefa assíncrona.
        """
        # Log dos dados recebidos no POST
        # print(f"[{now()}] Dados recebidos no POST: {request.POST}")

        form = JornadaUraForm(request.POST)

        if form.is_valid():

            # print(f"[{now()}] Formulário válido. Dados limpos: {form.cleaned_data}")

            ivr_code_mapping = {
                "HM": "66843e52abdc46987483f3e5",
                "HSJC": "6687ec45abdc469874751b5c",
                "HSOR": "6687ec45abdc469874751b5c",
            }

            # Dados validados do formulário
            dt_start = form.cleaned_data["dt_start"]
            dt_finish = form.cleaned_data["dt_finish"]
            nm_flow_ivr = form.cleaned_data["nm_flow_ivr"]

            # Definir o code_flow_ivr com base no mapeamento
            code_flow_ivr = ivr_code_mapping.get(nm_flow_ivr, nm_flow_ivr)  # Se não estiver no mapeamento, mantém o valor original


            # Obter token de autenticação
            token = obter_token_autenticacao()
            if not token:
                
                return self.render_to_response(
                    {
                        "form": form,
                        "error_message": "Falha ao obter o token de autenticação.",
                        "task_id": None,
                    }
                )

            try:
                # Iniciar a task assíncrona
                task_id = iniciar_task_assincrona(
                    processar_jornada_ura_async,
                    token,
                    dt_start.strftime("%Y-%m-%d %H:%M:%S"),
                    dt_finish.strftime("%Y-%m-%d %H:%M:%S"),
                    code_flow_ivr,
                )
                # print(f"[{now()}] Tarefa assíncrona iniciada. Task ID: {task_id}")

                return self.render_to_response(
                    {"form": form, "task_id": task_id, "error_message": None}
                )

            except RuntimeError as e:
                print(f"[{now()}] Erro ao iniciar a tarefa assíncrona: {str(e)}")
                return self.render_to_response(
                    {
                        "form": form,
                        "task_id": None,
                        "error_message": f"Erro ao iniciar a tarefa: {str(e)}",
                    }
                )

        else:
            # Caso o formulário seja inválido
            # print(f"[{now()}] Formulário inválido. Erros: {form.errors}")
            return self.render_to_response(
                {
                    "form": form,
                    "error_message": "Dados do formulário inválidos.",
                    "task_id": None,
                }
            )

    def get(self, request, *args, **kwargs):
        """
        Renderiza o formulário vazio para consulta da jornada.
        """
        return self.render_to_response(
            {"form": JornadaUraForm(), "error_message": None, "task_id": None}
        )

    def _render_response(self, form, task_id=None, error_message=None):
        """
        Método auxiliar para renderizar o contexto da view.
        """
        context = {
            "form": form,
            "task_id": task_id,
            "error_message": error_message,
        }
        return self.render_to_response(context)


class LeiaView(LoginRequiredMixin, TemplateView):
    template_name = "relatorios/leia.html"

    def get(self, request, *args, **kwargs):
        """
        Renderiza a página inicial com o formulário vazio.
        """
        return self.render_to_response({"form": JornadaUraForm(), "dados_api": None})

    def post(self, request, *args, **kwargs):
        """
        Processa os filtros enviados pelo formulário e exibe os resultados.
        """
        form = JornadaUraForm(request.POST)

        if form.is_valid():
            dt_start = form.cleaned_data["dt_start"]
            dt_finish = form.cleaned_data["dt_finish"]
            nm_flow_ivr = form.cleaned_data["nm_flow_ivr"]

            """ print(
                f"Datas recebidas: {dt_start} até {dt_finish}, hospital: {nm_flow_ivr}"
            ) """

            try:
                # Formata as datas para a API no formato YYYY-MM-DDTHH:mm:ss
                formatted_start_date = dt_start.strftime("%Y-%m-%dT%H:%M:%S")
                formatted_end_date = dt_finish.strftime("%Y-%m-%dT%H:%M:%S")

                print(
                    f"Datas formatadas para API: {formatted_start_date} até {formatted_end_date}"
                )

                # Faz a requisição para a API
                dados_api = captura_informacoes_leia_ia(
                    nm_flow_ivr, formatted_start_date, formatted_end_date
                )
                if dados_api:
                    print("Dados da API recebidos com sucesso.")
                    return self.render_to_response(
                        {"form": form, "dados_api": dados_api.get("result", [])}
                    )
                else:
                    logger.warning("A API não retornou dados.")
                    messages.error(request, "Não foi possível obter os dados da API.")
            except Exception as e:
                logger.exception(f"Erro ao buscar dados da API Leia: {e}")
                messages.error(request, f"Ocorreu um erro ao buscar os dados: {str(e)}")

        else:
            # Formulário inválido
            messages.warning(
                request, "Por favor, preencha todos os campos corretamente."
            )

        return self.render_to_response({"form": form, "dados_api": None})


def verificar_status_task(request, task_id):
    """
    Verifica o status de uma task do Celery e retorna um JSON.
    """

    logger.info(f"Verificando status da task com ID: {task_id}")
    try:
        task = AsyncResult(task_id)
        # print(f"Estado atual da task {task_id}: {task.state}")

        response = {
            "status": task.state,
            "result": task.result if task.state == "SUCCESS" else None,
            "message": {
                "PENDING": "Aguardando processamento.",
                "STARTED": "A tarefa está em andamento.",
                "SUCCESS": "A tarefa foi concluída com sucesso!",
                "FAILURE": f"Erro no processamento: {str(task.result)}",
            }.get(task.state, "Status desconhecido."),
        }

        # Adicionando logs detalhados para o caso de erro
        if task.state == "FAILURE":
            logger.error(f"Tarefa {task_id} falhou. Erro: {str(task.result)}")
        elif task.state == "SUCCESS":
            logger.info(f"Tarefa {task_id} concluída com sucesso.")

        logger.debug(f"Resposta gerada para a task {task_id}: {response}")
        return JsonResponse(response)

    except Exception as e:
        logger.exception(f"Erro ao verificar o status da task {task_id}: {e}")
        return JsonResponse(
            {
                "status": "ERROR",
                "message": f"Erro ao verificar o status da task: {str(e)}",
            },
            status=500,
        )
 