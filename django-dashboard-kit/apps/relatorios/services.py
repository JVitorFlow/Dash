import requests
import logging
from django.conf import settings
from datetime import datetime
from dateutil import parser
from urllib.parse import urlencode, quote

logger = logging.getLogger(__name__)

# URL da API para gerar o token
TOKEN_API_URL = "https://api.reports.digitalcontact.cloud/Security/CreateToken"
IVR_TRACE_CALL_API_URL = "https://api.reports.digitalcontact.cloud/IVREvent/GetIVRTraceCall"

USERNAME = settings.USERNAME_IVRCALLAPI
PASSWORD = settings.PASSWORD_IVRCALLAPI
ORG_ID = settings.ORG_ID
CAMPAIGN_ID = settings.CAMPAING_ID

BASE_URL_LEIA = "https://api.leia.digitalcontact.cloud"
FILES_DIRECTORY = "wtime"
TOKEN_LEIA = "FR4IyuofvNekAPa16UEUAc92s6h1Ilkw"



EVENTOS_LEGIVEIS = {
    "startIvr": "Início do IVR",
    "ValidaTelefoneEntrada": "Valida Telefone de Entrada",
    "InicializaContador": "Inicializa Contador",
    "AudioSaudacao": "Áudio de Saudação",
    "ValidaTipoAtendimento": "Valida Tipo de Atendimento",
    "InicializaDataSetSetores": "Inicializa DataSet de Setores",
    "LogAbandonoCognitivo": "Log de Abandono Cognitivo",
    "CapturaAudio": "Captura de Áudio",
    "IvrAudioDTMF": "Detecção de DTMF",
    "IvrRedirect": "Transferência",
    "finishIvr": "Fim do IVR"
    # Adicione outros mapeamentos conforme necessário
}

def obter_lista_eventos_legiveis(ivr_events):
    return [EVENTOS_LEGIVEIS.get(event.get('step_name', ''), event.get('step_name', '')) for event in ivr_events]

def verificar_abandono_cognitivo(ivr_events):
    eventos_legiveis = obter_lista_eventos_legiveis(ivr_events)
    if "Log de Abandono Cognitivo" in eventos_legiveis and "Captura de Áudio" not in eventos_legiveis:
        return True
    return False

def verificar_interrompida_ura_tradicional(ivr_events):
    eventos_legiveis = obter_lista_eventos_legiveis(ivr_events)
    if "Áudio de Saudação" in eventos_legiveis and not any(evento in eventos_legiveis for evento in ["Detecção de DTMF", "Transferência"]):
        return True
    return False


def obter_token_autenticacao():
    """
    Função que faz uma requisição para obter o token de autenticação da API.
    """
    url = TOKEN_API_URL
    headers = {
        'Accept': 'text/plain',
        'Content-Type': 'application/json'
    }
    body = {
        'userName': USERNAME,
        'password': PASSWORD
    }
    
    try:
        response = requests.post(TOKEN_API_URL, headers=headers, json=body)
        response.raise_for_status()  # Verifica se a resposta foi bem-sucedida (status 2xx)
        
        # Se a resposta foi bem-sucedida, processa o resultado
        data = response.json()
        token = data.get('value', None)  # Pega o token da resposta
        
        if token:
            logger.info(f"Token obtido com sucesso: {token}")
            return token
        else:
            logger.error("Não foi possível obter o token. Resposta da API inválida.")
            return None

    except requests.HTTPError as http_err:
        logger.error(f"Erro HTTP ocorreu: {http_err}")
    except Exception as err:
        logger.error(f"Ocorreu um erro ao obter o token: {err}")

    return None  # Em caso de erro, retorna None

def obter_chamadas_ivr(token, dt_start, dt_finish, call_filter_list):
    url_base = IVR_TRACE_CALL_API_URL
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }

    # print(f"Headers: {headers}")

    todas_chamadas = []
    page = 1
    total_pages = 1
    limit = 200

    try:
        while page <= total_pages:
            url = f"{url_base}?limit={limit}&page={page}"
            body = {
                "dt_start": dt_start,
                "dt_finish": dt_finish,
                "org_id": ORG_ID,
                "campaign_id": CAMPAIGN_ID,
                "call_filter_list": call_filter_list
            }

            # print(f"Corpo da requisição sendo enviado: {body}")
            response = requests.post(url, headers=headers, json=body)

            response.raise_for_status()

            data = response.json()
            logger.info(f"Tipo de 'data' após response.json(): {type(data)}")

            # Handle case where data is a list
            if isinstance(data, list):
                data = {'data': data, 'metadata': {}}

            todas_chamadas.extend(data.get('data', []))

            metadata = data.get('metadata', {})
            total_pages = metadata.get('page_total', 1)
            page += 1

        # print(f"Total de chamadas obtidas: {len(todas_chamadas)}")
        return todas_chamadas

    except requests.HTTPError as http_err:
        logger.error(f"Erro HTTP ocorreu: {http_err}")
        return {"status": "erro", "mensagem": str(http_err)}
    except Exception as err:
        logger.error(f"Ocorreu um erro ao obter as chamadas IVR: {err}")
        return {"status": "erro", "mensagem": str(err)}


def obter_jornada_ura(token, dt_start, dt_finish, call_filter_list):
    url_base = IVR_TRACE_CALL_API_URL
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }

    todas_chamadas = []
    page = 1
    total_pages = 1
    limit = 200

    try:
        # Enquanto a página atual for menor ou igual ao total de páginas
        while page <= total_pages:
            url = f"{url_base}?limit={limit}&page={page}"
            body = {
                "dt_start": dt_start,
                "dt_finish": dt_finish,
                "org_id": ORG_ID,
                "campaign_id": CAMPAIGN_ID,
                "call_filter_list": call_filter_list
            }

            logger.info(f"Enviando requisição para a página {page}: {body}")
            response = requests.post(url, headers=headers, json=body)
            response.raise_for_status()  # Lança uma exceção se houver um erro HTTP

            data = response.json()

            # Armazena as chamadas da página atual
            chamadas_pagina = data.get('data', [])
            todas_chamadas.extend(chamadas_pagina)

            # Recupera informações de metadados, como o total de páginas
            metadata = data.get('metadata', {})
            total_pages = metadata.get('page_total', 1)  # Total de páginas
            page += 1  # Próxima página

        logger.info(f"Total de chamadas obtidas: {len(todas_chamadas)}")
        
        # Retornar como um dicionário com dados e metadados
        return {
            'data': todas_chamadas,
            'metadata': {
                'total_chamadas': len(todas_chamadas),
                'total_pages': total_pages
            }
        }

    except requests.HTTPError as http_err:
        logger.error(f"Erro HTTP ocorreu: {http_err}")
        return {"status": "erro", "mensagem": str(http_err)}
    except Exception as err:
        logger.error(f"Ocorreu um erro ao obter a jornada da URA: {err}")
        return {"status": "erro", "mensagem": str(err)}

def analisar_jornada_ura_tradicional_com_tempo(chamada):
    """
    Analisa uma jornada da URA, calcula o tempo de execução de cada bloco e determina se passou pela URA tradicional ou cognitiva.
    """
    call_data = chamada.get('call_data', {})
    ivr_events = chamada.get('ivr_event_list', [])
    variables = call_data.get('variables', {})


    numero_cliente = call_data.get('variables', {}).get('global', {}).get('contactphonefull', 'Número desconhecido')
    did_number = chamada.get('did_number', 'Desconhecido')
    dt_start = call_data.get('start_ivr')
    dt_finish = call_data.get('finish_ivr')
    tipo_atendimento = call_data.get('variables', {}).get('TipoAtendimento', 'Desconhecido')

    # Adicionando informações de Ramal e Setor
    ramal = call_data.get('variables', {}).get('Ramal', 'N/A')
    setor = call_data.get('variables', {}).get('Setor', 'N/A')
    
    # Adicionando o áudio capturado
    audio_capturado = call_data.get('variables', {}).get('AudioCapturado', '')

    # Eventos chave
    interacao_dtmf = False
    foi_transferido = False
    captura_audio = False
    destino_transferencia = None

    

    # Lista de eventos com tempo de execução
    eventos_com_tempo_execucao = []


    # Analisar os eventos do IVR
    for i, event in enumerate(ivr_events):
        step_type = event.get('step_type')

        # Verifica se houve interação por DTMF (URA tradicional)
        if step_type == "IvrAudioDTMF":
            interacao_dtmf = True

            # Verifica se o próximo evento é uma transferência
            if i + 1 < len(ivr_events) and ivr_events[i + 1].get('step_type') == "IvrTransferCall":
                foi_transferido = True
                destino_transferencia = ivr_events[i + 1].get('step_name', 'Desconhecido')

        # Verifica se houve transferência e busca o ramal transferido
        if step_type == "IvrTransferCall" and event.get('step_name') == "TransfRamalCliente":
            foi_transferido = True
            destino_transferencia = "TransfRamalCliente"

            # Atualiza o ramal com o valor de "RamalDesejadoDTMFCliente" ou "RamalCapturado"
            ramal = variables.get("RamalDesejadoDTMFCliente") or variables.get("RamalCapturado", "N/A")

        # Verifica se houve captura de áudio (URA cognitiva)
        if step_type == "IvrVoiceTranscriptionAudio":
            captura_audio = True

        # Se não for o primeiro evento, calcular o tempo de execução entre eventos
        if i > 0:
            tempo_execucao = calcular_tempo_execucao_entre_eventos(event, ivr_events[i - 1])
        else:
            tempo_execucao = None

        # Adiciona o evento com o tempo de execução
        eventos_com_tempo_execucao.append({
            'step_name': event.get('step_name'),
            'step_type': event.get('step_type'),
            'executed_at': event.get('executed_at'),
            'tempo_execucao': tempo_execucao
        })


    # Critério para identificar uma URA cognitiva (se houve captura de áudio)
    passou_pela_ura_cognitiva = captura_audio

    # Critério para identificar uma URA tradicional (se houve interação DTMF e transferência)
    passou_pela_ura_tradicional = interacao_dtmf and foi_transferido

    # Determina o tipo de URA
    tipo_ura = "Cognitiva" if passou_pela_ura_cognitiva else "Tradicional"

    # Montar o resultado final
    resultado = {
        'id_chamada': chamada.get('id_call'),
        'numero_cliente': numero_cliente,
        'did_number': did_number,
        'data_hora_inicio': dt_start,
        'data_hora_fim': dt_finish,
        'tipo_atendimento': tipo_atendimento,
        'foi_transferido': foi_transferido,
        'destino_transferencia': destino_transferencia,
        'tipo_ura': tipo_ura,  # Adicionando o tipo de URA
        'ramal': ramal,  # Incluindo o ramal
        'setor': setor,  # Incluindo o setor
        'audio_capturado': audio_capturado,  # Incluindo o áudio capturado
        'eventos': eventos_com_tempo_execucao  # Inclui os eventos com o tempo de execução calculado
    }

    return resultado



def calcular_tempo_execucao_entre_eventos(evento_atual, evento_anterior):
    """
    Calcula o tempo de execução entre dois eventos usando o campo 'executed_at'.
    """
    try:
        # Tenta analisar automaticamente o formato da data com parser do dateutil
        data_hora_atual = parser.parse(evento_atual['executed_at'])
        data_hora_anterior = parser.parse(evento_anterior['executed_at'])
        
        # Calcular a diferença de tempo em segundos
        tempo_execucao = (data_hora_atual - data_hora_anterior).total_seconds()
    except Exception as e:
        # Caso não seja possível calcular, retorna None e exibe o erro
        # print(f"Erro ao calcular tempo de execução: {e}")
        tempo_execucao = None

    return tempo_execucao
    

# Função auxiliar para verificar chamadas abandonadas cognitivamente
def verificar_abandono_cognitivo(ivr_events):
    log_abandono = False
    captura_audio = False

    for event in ivr_events:
        step_name = event.get('step_name', '')

        if step_name == "LogAbandonoCognitivo":
            log_abandono = True

        if step_name == "CapturaAudio":
            captura_audio = True

    # A chamada é um abandono cognitivo se tem LogAbandonoCognitivo e não tem CapturaAudio
    if log_abandono and not captura_audio:
        return True

    return False


# Função para verificar se a chamada foi interrompida pelo cliente na URA Tradicional
def verificar_interrompida_ura_tradicional(ivr_events):
    saudacao_passada = False
    dtmf_ou_transferencia = False

    for event in ivr_events:
        step_name = event.get('step_name', '')

        if step_name == "AudioSaudacao":
            saudacao_passada = True

        if step_name in ["IvrAudioDTMF", "IvrRedirect"]:
            dtmf_ou_transferencia = True
            break  # Não precisa continuar se encontrou DTMF ou transferência

    # A chamada é interrompida na URA Tradicional se passou pela saudação e não teve DTMF ou transferência
    if saudacao_passada and not dtmf_ou_transferencia:
        return True

    return False





# Função para processar chamadas e separar abandonos cognitivos e interrompidas
def processar_chamadas_abandonadas(dados_pagina):
    chamadas_abandonadas_cognitivo = []
    chamadas_interrompidas_cliente = []

    for chamada in dados_pagina:
        call_data = chamada.get('call_data', {})
        ivr_events = chamada.get('ivr_event_list', [])
        numero_cliente = call_data.get('variables', {}).get('global', {}).get('contactphonefull', 'Número desconhecido')
        data_hora_inicio = call_data.get('start_ivr')
        data_hora_fim = call_data.get('finish_ivr')
        nome_ura = call_data.get('nm_flow_ivr', 'Desconhecido')

        # Verifica se é um abandono cognitivo
        if verificar_abandono_cognitivo(ivr_events):
            chamadas_abandonadas_cognitivo.append({
                'id_chamada': chamada.get('id_call'),
                'numero_cliente': numero_cliente,
                'data_hora_inicio': data_hora_inicio,
                'data_hora_fim': data_hora_fim,
                'tipo_abandono': 'cognitivo',
                'nome_ura': nome_ura
            })

        # Verifica se foi interrompida pelo cliente na URA Tradicional
        elif verificar_interrompida_ura_tradicional(ivr_events):
            chamadas_interrompidas_cliente.append({
                'id_chamada': chamada.get('id_call'),
                'numero_cliente': numero_cliente,
                'data_hora_inicio': data_hora_inicio,
                'data_hora_fim': data_hora_fim,
                'tipo_abandono': 'interrompida_pelo_cliente',
                'nome_ura': nome_ura
            })

    return {
        'abandonos_cognitivos': chamadas_abandonadas_cognitivo,
        'interrompidas_cliente': chamadas_interrompidas_cliente
    }

def captura_informacoes_leia_ia(tag, data_inicio, data_fim):
    base_url = "https://api.leia.digitalcontact.cloud/requests/wtime"
    # print(f"Base URL: {base_url}")

    try:
        # Ajusta as datas para o formato esperado pela API
        formatted_data_inicio = data_inicio
        formatted_data_fim = data_fim
        # print(f"Datas formatadas: start_date={formatted_data_inicio}, end_date={formatted_data_fim}")

        # Codifica apenas a tag
        tag_encoded = quote(tag, safe="")
        # print(f"Tag codificada: {tag_encoded}")

        # Constrói manualmente a query string na ordem necessária
        query_string = (
            f"token={TOKEN_LEIA}"
            f"&tag={tag_encoded}"
            f"&start_date={formatted_data_inicio}"
            f"&end_date={formatted_data_fim}"
        )
        full_url = f"{base_url}?{query_string}"

        # Exibe a URL completa para verificação
        # print(f"URL gerada (para replicar o curl): {full_url}")

        # Faz a requisição usando requests.get
        response = requests.get(full_url)

        # Verifica se a resposta foi bem-sucedida
        # print(f"Status Code da resposta: {response.status_code}")
        response.raise_for_status()

        # Retorna os dados em JSON
        json_response = response.json()
        # print(f"Resposta JSON recebida: {json_response}")
        return json_response

    except requests.RequestException as e:
        # Captura e exibe erros na requisição
        # print(f"Erro ao fazer a requisição para a API: {e}")
        return None