import requests
from .models import EmpresasOmini
import logging
from django.conf import settings

logger = logging.getLogger(__name__)

# URLs das APIs
OMNI_API_URL = "https://apicode7docs.omni.code7.cloud/v1/Login/loginApi"
BOTERIA_API_BASE_URL = "https://api.boteria.com.br/api/v1/dashboard"
CCPAASSCII_API_BASE_URL = "https://ccpaasscii.code7.com/AYTY/AppInovaSaude/AytyTechInovaAPI/v1/ura"


def obter_empresas(data):
    url = OMNI_API_URL
    headers = {
        'x-api-key': settings.API_KEY,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    }
    try:
        response = requests.post(url, headers=headers, json=data)
        response.raise_for_status()  # Raise an exception for HTTP errors
    except requests.HTTPError as http_err:
        print(f"HTTP error occurred: {http_err}")
        print(f"Response content: {response.content}")
        return {"status": "error", "message": f"Failed to fetch empresas: {response.content}"}
    except Exception as err:
        print(f"Other error occurred: {err}")
        return {"status": "error", "message": "Failed to fetch empresas"}
    
    if response.status_code == 200:
        empresas_data = response.json().get('empresas', [])
        for empresa_data in empresas_data:
            EmpresasOmini.objects.update_or_create(
                external_id=empresa_data['id'],
                defaults={
                    'nome': empresa_data['name'],
                    'timezone': empresa_data['timeZone']
                }
            )
        return {"status": "success", "dados": empresas_data}
    else:
        print(f"API request failed with status code {response.status_code}: {response.text}")
        return {"status": "error", "message": f"Failed to fetch empresas with status code {response.status_code}"}

def obter_quantidade_mensagens_por_bot_e_canal(data):
    url = f"{BOTERIA_API_BASE_URL}/company/messages/by-channel"
    params = {
        'company': settings.BOTERIA_COMPANY_ID,
        'token': settings.BOTERIA_TOKEN_DASHBOARD,
        'start_date': data.get('start_date'),
        'end_date': data.get('end_date')
    }
    try:
        response = requests.get(url, params=params)
        response.raise_for_status()  # Raise an exception for HTTP errors
    except requests.HTTPError as http_err:
        logger.error(f"HTTP error occurred: {http_err}")
        logger.error(f"Response content: {response.content}")
        return {"status": "error", "message": f"Failed to fetch message count: {response.content}"}
    except Exception as err:
        logger.error(f"Other error occurred: {err}")
        return {"status": "error", "message": "Failed to fetch message count"}
    
    if response.status_code == 200:
        return {"status": "success", "dados": response.json()}
    else:
        logger.error(f"API request failed with status code {response.status_code}: {response.text}")
        return {"status": "error", "message": f"Failed to fetch message count with status code {response.status_code}"}



def obter_sessoes(data):
    url = f"{BOTERIA_API_BASE_URL}/sector/sessions"
    params = {
        'sector': settings.SECTOR_ID,
        'token': settings.BOTERIA_TOKEN_DASHBOARD,
        'start_date': data.get('start_date'),
        'end_date': data.get('end_date')
    }
    try:
        response = requests.get(url, params=params)
        response.raise_for_status()  # Raise an exception for HTTP errors
    except requests.HTTPError as http_err:
        logger.error(f"Erro HTTP: {http_err}")
        logger.error(f"Conteúdo da resposta: {response.content}")
        return {"status": "erro", "mensagem": f"Falha ao obter sessões: {response.content}"}
    except Exception as err:
        logger.error(f"Outro erro: {err}")
        return {"status": "erro", "mensagem": "Falha ao obter sessões"}
    
    if response.status_code == 200:
        return {"status": "sucesso", "dados": response.json()}
    else:
        logger.error(f"Falha na requisição API com status code {response.status_code}: {response.text}")
        return {"status": "erro", "mensagem": f"Falha ao obter sessões com status code {response.status_code}"}
    

def obter_atividade_agentes_ura(data):
    url = f"{CCPAASSCII_API_BASE_URL}/percent-occupancy-by-user/get"
    headers = {
        'accept': 'application/json',
        'UUID': settings.UUID,
        'Content-Type': 'application/json'
    }
    
    try:
        # Fazendo a requisição diretamente para a API externa
        response = requests.post(url, headers=headers, json=data)
        
        # Verifica se a resposta foi bem-sucedida
        if response.status_code == 200:
            return response.json()
        else:
            return {
                "status": "error",
                "message": f"Erro ao acessar a API externa: {response.status_code}",
                "details": response.text
            }
    except Exception as e:
        return {
            "status": "error",
            "message": "Erro ao tentar fazer a requisição",
            "details": str(e)
        }

def obter_indicador_de_desempenho_por_fila_de_URA(data):
    url = f"{CCPAASSCII_API_BASE_URL}/omni-voice-log/get"
    headers = {
        'accept': 'application/json',
        'UUID': settings.UUID,
        'Content-Type': 'application/json'
    }
    
    try:
        # Fazendo a requisição diretamente para a API externa
        response = requests.post(url, headers=headers, json=data)
        
        # Verifica se a resposta foi bem-sucedida
        if response.status_code == 200:
            return response.json()
        else:
            return {
                "status": "error",
                "message": f"Erro ao acessar a API externa: {response.status_code}",
                "details": response.text
            }
    except Exception as e:
        return {
            "status": "error",
            "message": "Erro ao tentar fazer a requisição",
            "details": str(e)
        }

def obter_tempo_medio_servico_por_atendente(data):
    url = f"{CCPAASSCII_API_BASE_URL}/average-svc-time-per-attendant/get"
    headers = {
        'accept': 'application/json',
        'UUID': settings.UUID,
        'Content-Type': 'application/json'
    }

    try:
        # Fazendo a requisição diretamente para a API externa
        response = requests.post(url, headers=headers, json=data)

        # Verifica se a resposta foi bem-sucedida
        if response.status_code == 200:
            return response.json()
        else:
            return {
                "status": "error",
                "message": f"Erro ao acessar a API externa: {response.status_code}",
                "details": response.text
            }
    except Exception as e:
        return {
            "status": "error",
            "message": "Erro ao tentar fazer a requisição",
            "details": str(e)
        }

def obter_indicadores_de_desempenho(data):
    url = f"{CCPAASSCII_API_BASE_URL}/ura-performance-indicators/get"
    headers = {
        'accept': 'application/json',
        'UUID': settings.UUID,
        'Content-Type': 'application/json'
    }

    try:
        # Fazendo a requisição diretamente para a API externa
        response = requests.post(url, headers=headers, json=data)

        # Verifica se a resposta foi bem-sucedida
        if response.status_code == 200:
            return response.json()
        else:
            return {
                "status": "error",
                "message": f"Erro ao acessar a API externa: {response.status_code}",
                "details": response.text
            }
    except Exception as e:
        return {
            "status": "error",
            "message": "Erro ao tentar fazer a requisição",
            "details": str(e)
        }
