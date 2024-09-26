import requests
from .models import EmpresasOmini
import logging
from django.conf import settings

logger = logging.getLogger(__name__)

# URLs das APIs
OMNI_API_URL = "https://apicode7docs.omni.code7.cloud/v1/Login/loginApi"
BOTERIA_API_BASE_URL = "https://api.boteria.com.br/api/v1/dashboard"
CCPAASSCII_API_BASE_URL = "https://ccpaasscii.code7.com/AYTY/AppInovaSaude/AytyTechInovaAPI/v1/ura"

# URL da API para gerar o token
TOKEN_API_URL = "https://api.reports.digitalcontact.cloud/Security/CreateToken"
IVR_TRACE_CALL_API_URL = "https://api.reports.digitalcontact.cloud/IVREvent/GetIVRTraceCall"


USERNAME = settings.USERNAME_IVRCALLAPI
PASSWORD = settings.PASSWORD_IVRCALLAPI
ORG_ID = settings.ORG_ID
CAMPAIGN_ID = settings.CAMPAING_ID

def request_post(url, headers=None, data=None):
    try:
        response = requests.post(url, headers=headers, json=data)
        response.raise_for_status()
        return {"status": "success", "data": response.json()}
    except requests.HTTPError as http_err:
        logger.error(f"HTTP error occurred: {http_err} - Response content: {response.content}")
        return {"status": "error", "message": f"Failed with status code {response.status_code}", "details": response.content}
    except Exception as err:
        logger.error(f"Other error occurred: {err}")
        return {"status": "error", "message": str(err)}

def request_get(url, params=None):
    try:
        response = requests.get(url, params=params)
        response.raise_for_status()
        return {"status": "success", "data": response.json()}
    except requests.HTTPError as http_err:
        logger.error(f"HTTP error occurred: {http_err} - Response content: {response.content}")
        return {"status": "error", "message": f"Failed with status code {response.status_code}", "details": response.content}
    except Exception as err:
        logger.error(f"Other error occurred: {err}")
        return {"status": "error", "message": str(err)}

def obter_empresas(data):
    url = OMNI_API_URL
    headers = {
        'x-api-key': settings.API_KEY,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    }
    
    result = request_post(url, headers=headers, data=data)
    if result["status"] == "success":
        empresas_data = result["data"].get('empresas', [])
        for empresa_data in empresas_data:
            EmpresasOmini.objects.update_or_create(
                external_id=empresa_data['id'],
                defaults={
                    'nome': empresa_data['name'],
                    'timezone': empresa_data['timeZone']
                }
            )
        return {"status": "success", "dados": empresas_data}
    
    return result

def obter_quantidade_mensagens_por_bot_e_canal(data):
    url = f"{BOTERIA_API_BASE_URL}/company/messages/by-channel"
    params = {
        'company': settings.BOTERIA_COMPANY_ID,
        'token': settings.BOTERIA_TOKEN_DASHBOARD,
        'start_date': data.get('start_date'),
        'end_date': data.get('end_date')
    }
    
    return request_get(url, params)

def obter_sessoes(data):
    url = f"{BOTERIA_API_BASE_URL}/sector/sessions"
    params = {
        'sector': settings.SECTOR_ID,
        'token': settings.BOTERIA_TOKEN_DASHBOARD,
        'start_date': data.get('start_date'),
        'end_date': data.get('end_date')
    }
    
    return request_get(url, params)

def obter_atividade_agentes_ura(data):
    url = f"{CCPAASSCII_API_BASE_URL}/percent-occupancy-by-user/get"
    headers = {
        'accept': 'application/json',
        'UUID': settings.UUID,
        'Content-Type': 'application/json'
    }

    return request_post(url, headers=headers, data=data)

def obter_indicador_de_desempenho_por_fila_de_URA(data):
    url = f"{CCPAASSCII_API_BASE_URL}/omni-voice-log/get"
    headers = {
        'accept': 'application/json',
        'UUID': settings.UUID,
        'Content-Type': 'application/json'
    }

    return request_post(url, headers=headers, data=data)

def obter_tempo_medio_servico_por_atendente(data):
    url = f"{CCPAASSCII_API_BASE_URL}/average-svc-time-per-attendant/get"
    headers = {
        'accept': 'application/json',
        'UUID': settings.UUID,
        'Content-Type': 'application/json'
    }

    return request_post(url, headers=headers, data=data)

def obter_indicadores_de_desempenho(data):
    url = f"{CCPAASSCII_API_BASE_URL}/ura-performance-indicators/get"
    headers = {
        'accept': 'application/json',
        'UUID': settings.UUID,
        'Content-Type': 'application/json'
    }

    return request_post(url, headers=headers, data=data)

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

    print(f"Headers: {headers}")

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

            print(f"Corpo da requisição sendo enviado: {body}")
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

        print(f"Total de chamadas obtidas: {len(todas_chamadas)}")
        return todas_chamadas

    except requests.HTTPError as http_err:
        logger.error(f"Erro HTTP ocorreu: {http_err}")
        return {"status": "erro", "mensagem": str(http_err)}
    except Exception as err:
        logger.error(f"Ocorreu um erro ao obter as chamadas IVR: {err}")
        return {"status": "erro", "mensagem": str(err)}




    

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





