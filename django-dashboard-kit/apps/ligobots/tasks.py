import json
from celery import shared_task
from .services import obter_atividade_agentes_ura
from .utils import consolidar_dados_por_agente_e_data, calcular_ocupacao_total
from datetime import datetime

def datetime_converter(obj):
    """
    Função auxiliar para converter objetos datetime para string no formato ISO 8601.
    """
    if isinstance(obj, datetime):
        return obj.isoformat()
    if isinstance(obj, set):
        return list(obj)  # Converte set para lista para serialização JSON
    raise TypeError(f"Tipo {type(obj)} não é serializável para JSON.")


@shared_task
def tarefa_processar_atividade_agentes(dt_start, dt_end):
    """
    Tarefa Celery que busca e processa os dados de atividade dos agentes via API.
    """
    try:
        # Preparar os parâmetros da API com as datas fornecidas
        data = {
            'dtStart': dt_start,
            'dtFinish': dt_end
        }

        # Obter os dados da API
        dados_api = obter_atividade_agentes_ura(data)

        # Verifica se a resposta foi bem-sucedida
        if dados_api.get('status') == 'success':
            # Verificar se 'agent_activity_list' está presente
            agent_activity_list = dados_api.get('data', {}).get('agent_activity_list', [])

            if agent_activity_list:
                # Consolidar os dados recebidos da API
                agentes_consolidados = consolidar_dados_por_agente_e_data(agent_activity_list)

                # Calcular a ocupação total
                ocupacao_total = calcular_ocupacao_total(agentes_consolidados)

                # Criar o conteúdo final a ser salvo
                resultado = {
                    'status': 'sucesso',
                    'agentes_consolidados': agentes_consolidados,
                    'ocupacao_total': ocupacao_total
                }
                
                # Gerar um nome de arquivo baseado no timestamp
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                arquivo_json = f'atividade_agentes_{timestamp}.json'
                
                # Salvar os dados em um arquivo JSON formatado
                with open(arquivo_json, 'w', encoding='utf-8') as f:
                    json.dump(resultado, f, ensure_ascii=False, indent=4, default=datetime_converter)
                
                return resultado
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
        # Tratar exceções gerais e registrar o erro
        return {
            'status': 'erro',
            'mensagem': str(e)
        }