from celery import shared_task
from .services import (
    obter_chamadas_ivr,
    processar_chamadas_abandonadas,
    obter_jornada_ura,
    analisar_jornada_ura_tradicional_com_tempo,
)
import logging

logger = logging.getLogger(__name__)


@shared_task
def processar_chamadas_async(token, dt_start, dt_finish, code_flow_ivr):
    """
    Processa as chamadas IVR de forma assíncrona e separa os abandonos cognitivos e interrompidos.
    """
    # Chamar diretamente a função para obter as chamadas
    chamadas_ivr = obter_chamadas_ivr(token, dt_start, dt_finish, code_flow_ivr)

    if isinstance(chamadas_ivr, dict) and chamadas_ivr.get("status") == "erro":
        return {"status": "erro", "mensagem": chamadas_ivr["mensagem"]}

    # Processar as chamadas abandonadas
    resultado_abandonos = processar_chamadas_abandonadas(chamadas_ivr)

    # Retornar o resultado do processamento
    return {
        "status": "sucesso",
        "abandonos_cognitivos": resultado_abandonos.get("abandonos_cognitivos", []),
        "interrompidas_cliente": resultado_abandonos.get("interrompidas_cliente", []),
    }


@shared_task
def processar_jornada_ura_async(token, dt_start, dt_finish, code_flow_ivr):
    """
    Task assíncrona para processar a jornada do usuário na URA.
    Processa as chamadas da URA e retorna os detalhes da jornada.
    """

    # Obter as chamadas da URA via API
    chamadas_ivr_response = obter_jornada_ura(token, dt_start, dt_finish, code_flow_ivr)

    # Verifica se a resposta contém um erro
    if isinstance(chamadas_ivr_response, dict) and chamadas_ivr_response.get('status') == 'erro':
        return {'status': 'erro', 'mensagem': chamadas_ivr_response['mensagem']}

    # Obter a lista de chamadas
    chamadas_ivr = chamadas_ivr_response.get('data', [])

    # Verifica se a resposta está no formato correto
    if not isinstance(chamadas_ivr, list):
        return {'status': 'erro', 'mensagem': 'Resposta da API está no formato errado. Esperado uma lista de chamadas.'}

    # Processamento das chamadas
    resultado_jornada = []
    for chamada in chamadas_ivr:
        detalhes_jornada = _processar_chamada_jornada(chamada)
        if detalhes_jornada:
            resultado_jornada.append(detalhes_jornada)

    # Retorna o resultado da jornada processada
    return {
        'status': 'sucesso',
        'jornadas': resultado_jornada
    }


def _processar_chamada_jornada(chamada):
    """
    Função auxiliar para processar uma chamada individual na jornada da URA.
    """
    if not isinstance(chamada, dict):
        logger.warning(f"Chamada mal formatada encontrada e ignorada: {chamada}")
        return None

    call_data = chamada.get('call_data', {})
    ivr_event_list = chamada.get('ivr_event_list', [])

    # Certifica-se de que call_data seja um dicionário
    if not isinstance(call_data, dict):
        logger.warning(f"Chamada com call_data inválido ou ausente ignorada: {chamada}")
        return None

    # Verifica se variables existe e é um dicionário
    variables = call_data.get('variables', {})
    if not isinstance(variables, dict):
        logger.warning(f"Chamada ignorada devido a variables inválido: {chamada}")
        return None

    # Processa a jornada
    detalhes_jornada = analisar_jornada_ura_tradicional_com_tempo(chamada)

    # Verifica se detalhes_jornada foi retornado corretamente
    if detalhes_jornada is None:
        logger.warning(f"Detalhes da jornada não processados para a chamada: {chamada.get('id_call')}")
        return None

    # Adiciona os eventos ao resultado da jornada
    detalhes_jornada['eventos'] = ivr_event_list if isinstance(ivr_event_list, list) else []
    return detalhes_jornada
