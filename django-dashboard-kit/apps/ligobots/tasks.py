import json
from celery import shared_task
from .services import obter_atividade_agentes_ura
from .utils import consolidar_dados_por_agente_e_data, calcular_ocupacao_total

@shared_task
def tarefa_processar_atividade_agentes(dt_start, dt_end):
    """
    Tarefa Celery que busca e processa os dados de atividade dos agentes via API.
    """
    try:
        # Obter os dados da API
        data = {
            'dtStart': dt_start,
            'dtFinish': dt_end
        }

        dados_api = obter_atividade_agentes_ura(data)

        # Verifica se a resposta foi bem-sucedida
        if dados_api.get('status') == 'success':
            # Verificar se 'agent_activity_list' está presente
            agent_activity_list = dados_api.get('data', {}).get('agent_activity_list', [])

            if agent_activity_list:
                # Consolidar os dados recebidos da API
                agentes_consolidados = consolidar_dados_por_agente_e_data(agent_activity_list)
                ocupacao_total = calcular_ocupacao_total(agentes_consolidados)
                return {
                    'status': 'sucesso',
                    'agentes_consolidados': agentes_consolidados,
                    'ocupacao_total_percent': ocupacao_total
                }
            else:
                # Retornar erro se a lista de atividades estiver vazia
                return {
                    'status': 'erro',
                    'mensagem': "A lista de atividades de agentes está vazia."
                }
        else:
            # Retornar erro caso o status da API não seja 'success'
            return {
                'status': 'erro',
                'mensagem': "Erro na resposta da API.",
                'detalhes': dados_api.get('data', {}).get('errmsg', 'Erro desconhecido')
            }

    except Exception as e:
        # Tratar exceções gerais
        return {
            'status': 'erro',
            'mensagem': str(e)
        }
