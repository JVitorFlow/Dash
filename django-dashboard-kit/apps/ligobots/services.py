import requests
from .models import EmpresasOmini
import logging
from django.conf import settings

logger = logging.getLogger(__name__)

# URLs das APIs
OMNI_API_URL = "https://apicode7docs.omni.code7.cloud/v1/Login/loginApi"
BOTERIA_API_BASE_URL = "https://api.boteria.com.br/api/v1/dashboard"
CCPAASSCII_API_BASE_URL = "https://ccpaasscii.code7.com/AYTY/AppInovaSaude/AytyTechInovaAPI/v1/ura"

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





