from django.views.generic import TemplateView
from django.http import JsonResponse
from django.contrib.auth.mixins import LoginRequiredMixin
from .services import obter_token_autenticacao, obter_chamadas_ivr, processar_pico_movimento_paginado
from datetime import datetime
import json
import logging

logger = logging.getLogger(__name__)

class AnalisePicoView(LoginRequiredMixin, TemplateView):
    template_name = "analise_pico/pico_movimento.html"

    def post(self, request, *args, **kwargs):
        try:
            # Log Content-Type e corpo da requisição
            logger.debug("Content-Type recebido: %s", request.content_type)
            logger.debug("Corpo bruto da requisição: %s", request.body)

            # Dados recebidos do frontend
            if request.content_type == "application/json":
                data = json.loads(request.body)
            else:
                data = request.POST

            # Extraindo campos
            dt_start = data.get('dt_start')
            dt_finish = data.get('dt_finish')
            hospital_selecionado = data.get('nm_flow_ivr_pico')
            page = int(data.get('page', 1))
            limit = int(data.get('page_size', 10))

            # Validação dos dados
            if not dt_start or not dt_finish or not hospital_selecionado:
                return JsonResponse({
                    "status": "erro",
                    "mensagem": "Por favor, preencha todos os campos corretamente."
                }, status=400)

            # Obter token
            token = obter_token_autenticacao()
            if not token:
                return JsonResponse({
                    "status": "erro",
                    "mensagem": "Erro ao obter o token de autenticação."
                }, status=500)

            # Obter chamadas
            chamadas = obter_chamadas_ivr(token, dt_start, dt_finish, {'call_data.nm_flow_ivr': hospital_selecionado})

            # Processar chamadas com paginação
            resultado_paginado = processar_pico_movimento_paginado(chamadas, dt_start, dt_finish, page, limit)

            return JsonResponse({
                "status": "sucesso",
                "dados": resultado_paginado
            })

        except Exception as e:
            logger.error(f"Erro na análise de picos: {e}", exc_info=True)
            return JsonResponse({
                "status": "erro",
                "mensagem": f"Erro interno no servidor: {e}"
            }, status=500)
