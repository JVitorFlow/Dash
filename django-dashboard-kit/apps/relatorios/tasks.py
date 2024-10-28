import json
from celery import shared_task
from .services import ( 
    obter_token_autenticacao, obter_chamadas_ivr, 
    processar_chamadas_abandonadas, obter_jornada_ura,analisar_jornada_ura_tradicional_com_tempo

)
from datetime import datetime


@shared_task
def processar_chamadas_async(token, dt_start, dt_finish, call_filter_list):
    # Autenticação e obtenção do token
    token = obter_token_autenticacao()
    if not token:
        return {'status': 'erro', 'mensagem': 'Falha ao obter o token.'}

    # Chamar diretamente a função para obter as chamadas
    chamadas_ivr = obter_chamadas_ivr(token, dt_start, dt_finish, call_filter_list)

    if isinstance(chamadas_ivr, dict) and chamadas_ivr.get('status') == 'erro':
        return {'status': 'erro', 'mensagem': chamadas_ivr['mensagem']}

    # Processar as chamadas abandonadas
    resultado_abandonos = processar_chamadas_abandonadas(chamadas_ivr)

    if isinstance(resultado_abandonos, dict) and resultado_abandonos.get('status') == 'erro':
        return {'status': 'erro', 'mensagem': resultado_abandonos['mensagem']}

    # Retornar o resultado do processamento
    return {
        'status': 'sucesso',
        'abandonos_cognitivos': resultado_abandonos.get('abandonos_cognitivos', []),
        'interrompidas_cliente': resultado_abandonos.get('interrompidas_cliente', [])
    }


@shared_task
def processar_jornada_ura_async(token, dt_start, dt_finish, call_filter_list):
    """
    Task assíncrona para processar a jornada do usuário na URA.
    """
    # Autenticação e obtenção do token
    token = obter_token_autenticacao()
    if not token:
        return {'status': 'erro', 'mensagem': 'Falha ao obter o token.'}

    # Obter as chamadas da URA via API
    chamadas_ivr_response = obter_jornada_ura(token, dt_start, dt_finish, call_filter_list)

    # Verifique se a resposta contém um erro
    if isinstance(chamadas_ivr_response, dict) and chamadas_ivr_response.get('status') == 'erro':
        return {'status': 'erro', 'mensagem': chamadas_ivr_response['mensagem']}

    # Obter a lista de chamadas
    chamadas_ivr = chamadas_ivr_response.get('data', [])
    
    # Verifique se as chamadas estão no formato correto (dicionário) antes de processar
    resultado_jornada = []
    for chamada in chamadas_ivr:
        if isinstance(chamada, dict):
            # Adicionar o processamento da jornada e detalhes dos eventos aqui
            detalhes_jornada = analisar_jornada_ura_tradicional_com_tempo(chamada)
            
            # Adiciona os eventos da chamada ao resultado
            detalhes_jornada['eventos'] = chamada.get('ivr_event_list', [])
            resultado_jornada.append(detalhes_jornada)
        else:
            # Logar se houver algum problema com a formatação da chamada
            print(f"Chamada mal formatada encontrada: {chamada}")

    # Retornar o resultado da jornada processada
    return {
        'status': 'sucesso',
        'jornadas': resultado_jornada
    }

