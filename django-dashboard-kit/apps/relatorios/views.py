from django.views.generic import TemplateView
from celery.result import AsyncResult
from django.contrib.auth.mixins import LoginRequiredMixin
from django.shortcuts import render
from .services import obter_token_autenticacao
from .tasks import processar_chamadas_async, processar_jornada_ura_async
from django.http import JsonResponse
from datetime import datetime


class LigacoesAbandonadasView(LoginRequiredMixin, TemplateView):
    template_name = 'relatorios/chamadas_abandonadas.html'

    def post(self, request, *args, **kwargs):
        dt_start = request.POST.get('dt_start')
        dt_finish = request.POST.get('dt_finish')
        call_filter_list = {'call_data.code_status_ivr': 10003}

        # Validação básica dos dados do formulário
        if not dt_start or not dt_finish:
            error_message = "Por favor, preencha as datas corretamente."
            return render(request, self.template_name, {'error_message': error_message})

        # Formatando as datas para o formato exigido pela API: "YYYY-MM-DD HH:MM:SS"
        try:
            dt_start_obj = datetime.strptime(dt_start, '%Y-%m-%dT%H:%M')  # 'dt_start' recebido no formato HTML5
            dt_finish_obj = datetime.strptime(dt_finish, '%Y-%m-%dT%H:%M')  # 'dt_finish' recebido no formato HTML5

            # Formatação final para a API
            dt_start_formatted = dt_start_obj.strftime('%Y-%m-%d %H:%M:%S')
            dt_finish_formatted = dt_finish_obj.strftime('%Y-%m-%d %H:%M:%S')
        except ValueError:
            error_message = "Formato de data inválido. Por favor, use o formato correto de data e hora."
            return render(request, self.template_name, {'error_message': error_message})

        # Autenticação e obtenção do token
        token = obter_token_autenticacao()
        if not token:
            error_message = "Falha ao obter o token de autenticação."
            return render(request, self.template_name, {'error_message': error_message})

        # Iniciar a task assíncrona para processar as chamadas IVR
        try:
            task = processar_chamadas_async.delay(token, dt_start_formatted, dt_finish_formatted, call_filter_list)
            print(f"Task iniciada com o ID: {task.id}")  # Log para depuração
        except Exception as e:
            error_message = f"Erro ao iniciar o processamento: {str(e)}"
            return render(request, self.template_name, {'error_message': error_message})

        # Renderizar o template com o task_id para monitorar o progresso
        return render(request, self.template_name, {
            'task_id': task.id,  # Enviar task_id para o frontend
            'status_message': 'Processando relatório... Verifique o progresso.',
        })

    def get(self, request, *args, **kwargs):
        task_id = request.GET.get('task_id')
        if task_id:
            task_result = AsyncResult(task_id)
            status = task_result.status
            print(f"Status da task {task_id}: {status}")  # Log para depuração
        return render(request, self.template_name)


class UraJornadaView(TemplateView):
    template_name = 'relatorios/jornada_ura.html'

    def post(self, request, *args, **kwargs):
        dt_start = request.POST.get('dt_start')
        dt_finish = request.POST.get('dt_finish')
        hospital_selecionado = request.POST.get('nm_flow_ivr')

        # Validação dos dados do formulário
        if not dt_start or not dt_finish or not hospital_selecionado:
            error_message = "Por favor, preencha todos os campos corretamente."
            return render(request, self.template_name, {'error_message': error_message})

        hospital_map = {
            'HM': 'HM',
            'HSOR': 'HSOR',
            'HSJC': 'HSJC'
        }

        nm_flow_ivr = hospital_map.get(hospital_selecionado, None)  # Obtendo o valor correto
        if nm_flow_ivr is None:
            error_message = "Seleção de hospital inválida."
            return render(request, self.template_name, {'error_message': error_message})


        # Formatando as datas para o formato exigido pela API
        try:
            dt_start_obj = datetime.strptime(dt_start, '%Y-%m-%dT%H:%M')
            dt_finish_obj = datetime.strptime(dt_finish, '%Y-%m-%dT%H:%M')

            # Formatação final para a API
            dt_start_formatted = dt_start_obj.strftime('%Y-%m-%d %H:%M:%S')
            dt_finish_formatted = dt_finish_obj.strftime('%Y-%m-%d %H:%M:%S')
        except ValueError:
            error_message = "Formato de data inválido. Use o formato correto."
            return render(request, self.template_name, {'error_message': error_message})

        # Autenticação e obtenção do token
        token = obter_token_autenticacao()
        if not token:
            error_message = "Falha ao obter o token de autenticação."
            return render(request, self.template_name, {'error_message': error_message})

        call_filter_list = {
            'call_data.code_status_ivr': 10002,
            'call_data.nm_flow_ivr': nm_flow_ivr
        }
        
        # Iniciar a task assíncrona
        try:
            task = processar_jornada_ura_async.delay(token, dt_start_formatted, dt_finish_formatted, call_filter_list)
            print(f"Task iniciada com o ID: {task.id}")  # Log para depuração
        except Exception as e:
            error_message = f"Erro ao iniciar o processamento: {str(e)}"
            return render(request, self.template_name, {'error_message': error_message})

        # Renderizar o template com o task_id
        return render(request, self.template_name, {
            'task_id': task.id,
            'status_message': 'Processando relatório... Acompanhe o progresso.'
        })

    def get(self, request, *args, **kwargs):
        task_id = request.GET.get('task_id')
        if task_id:
            task_result = AsyncResult(task_id)
            status = task_result.status
            print(f"Status da task {task_id}: {status}")  # Log para depuração
        return render(request, self.template_name)

def verificar_status_task(request, task_id):
    task = AsyncResult(task_id)  # Recuperar o status da task pelo task_id
    print(f"Status atual da task {task_id}: {task.status}")

    # Verificar o status da task
    if task.state == 'PENDING':
        response = {
            'status': 'PENDING',
            'message': 'A task está aguardando para ser processada.'
        }
    elif task.state == 'STARTED':
        response = {
            'status': 'STARTED',
            'message': 'A task está em andamento.'
        }
    elif task.state == 'SUCCESS':
        response = {
            'status': 'SUCCESS',
            'result': task.result,  # Os resultados que foram processados
            'message': 'A task foi concluída com sucesso.'
        }
    elif task.state == 'FAILURE':
        response = {
            'status': 'FAILURE',
            'message': f"Erro no processamento: {task.result}"
        }
    else:
        response = {
            'status': task.state,
            'message': 'Status desconhecido.'
        }

    return JsonResponse(response)