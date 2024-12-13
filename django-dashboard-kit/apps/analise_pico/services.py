import requests
import logging
from django.conf import settings
from datetime import datetime
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor
from django.core.paginator import Paginator

logger = logging.getLogger(__name__)

# URL da API para gerar o token
TOKEN_API_URL = "https://api.reports.digitalcontact.cloud/Security/CreateToken"
IVR_TRACE_CALL_API_URL = "https://api.reports.digitalcontact.cloud/IVREvent/GetIVRTraceCall"

USERNAME = settings.USERNAME_IVRCALLAPI
PASSWORD = settings.PASSWORD_IVRCALLAPI
ORG_ID = settings.ORG_ID
CAMPAIGN_ID = settings.CAMPAING_ID




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

def fetch_page(token, dt_start, dt_finish, call_filter_list, page, limit):
    url = f"{IVR_TRACE_CALL_API_URL}?limit={limit}&page={page}"
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
    body = {
        "dt_start": dt_start,
        "dt_finish": dt_finish,
        "org_id": ORG_ID,
        "campaign_id": CAMPAIGN_ID,
        "call_filter_list": call_filter_list
    }
    response = requests.post(url, headers=headers, json=body)
    response.raise_for_status()
    return response.json().get('data', [])

def obter_chamadas_ivr(token, dt_start, dt_finish, call_filter_list):
    limit = 200
    todas_chamadas = []
    page = 1

    # Descobrir o número total de páginas
    url = f"{IVR_TRACE_CALL_API_URL}?limit={limit}&page={page}"
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
    body = {
        "dt_start": dt_start,
        "dt_finish": dt_finish,
        "org_id": ORG_ID,
        "campaign_id": CAMPAIGN_ID,
        "call_filter_list": call_filter_list
    }
    response = requests.post(url, headers=headers, json=body)
    response.raise_for_status()
    data = response.json()
    metadata = data.get('metadata', {})
    total_pages = metadata.get('page_total', 1)

    todas_chamadas.extend(data.get('data', []))

    # Busca as páginas em paralelo
    with ThreadPoolExecutor() as executor:
        results = executor.map(
            lambda page: fetch_page(token, dt_start, dt_finish, call_filter_list, page, limit),
            range(2, total_pages + 1)
        )
        for result in results:
            todas_chamadas.extend(result)

    return todas_chamadas

def processar_pico_movimento_paginado(chamadas, dt_start, dt_finish, page=1, limit=10):
    """
    Processa as chamadas e retorna os resultados paginados.
    """
    resultados = processar_pico_movimento(chamadas, dt_start, dt_finish)
    paginator = Paginator(resultados, limit)
    pagina = paginator.get_page(page)
    
    return {
        "dados": list(pagina),
        "total_pages": paginator.num_pages,
        "current_page": pagina.number,
        "total_items": paginator.count,
    }


def processar_pico_movimento(chamadas, dt_start, dt_finish):
    logger.info("Iniciando processamento da tarefa")
    logger.info(f"Chamadas recebidas: {chamadas}")
    logger.info(f"Período: {dt_start} - {dt_finish}")

    try:
        movimentacao_por_dia = defaultdict(lambda: defaultdict(int))
        categorias_por_dia = defaultdict(lambda: defaultdict(int))

        for chamada in chamadas:
            logger.info(f"Processando chamada: {chamada}")
            dt_start_chamada = chamada.get("call_data", {}).get("start_ivr")
            code_status_ivr = chamada.get("call_data", {}).get("code_status_ivr")

            if dt_start_chamada:
                data_chamada = datetime.fromisoformat(dt_start_chamada.replace("Z", "+00:00"))
                data_formatada = data_chamada.strftime('%Y-%m-%d')
                horario = data_chamada.strftime('%H:00')
                movimentacao_por_dia[data_formatada][horario] += 1

                if code_status_ivr == 10000:
                    categorias_por_dia[data_formatada]["navegacao"] += 1
                elif code_status_ivr == 10001:
                    categorias_por_dia[data_formatada]["processadas"] += 1
                elif code_status_ivr == 10002:
                    categorias_por_dia[data_formatada]["transferidas"] += 1
                elif code_status_ivr == 10003:
                    categorias_por_dia[data_formatada]["abandonadas"] += 1
                elif code_status_ivr == 10004:
                    categorias_por_dia[data_formatada]["derivadas"] += 1
                elif code_status_ivr == 10005:
                    categorias_por_dia[data_formatada]["erros_transferencia"] += 1

        resultado = []

        for data, horarios in movimentacao_por_dia.items():
            total_chamadas = sum(horarios.values())
            pico_horario = max(horarios.items(), key=lambda x: x[1], default=("N/A", 0))

            detalhes_horarios = [
                {
                    "horario": horario,
                    "chamadas": chamadas,
                    "percentual": f"{(chamadas / total_chamadas) * 100:.2f}%"
                }
                for horario, chamadas in sorted(horarios.items())
            ]

            categorias = categorias_por_dia[data]

            # Ajustar início e fim do período
            data_inicio = datetime.strptime(data, '%Y-%m-%d')
            if data == datetime.strptime(dt_start, '%Y-%m-%dT%H:%M').strftime('%Y-%m-%d'):
                inicio = datetime.strptime(dt_start, '%Y-%m-%dT%H:%M').strftime('%d/%m/%Y %H:%M')
            else:
                inicio = f"{data_inicio.strftime('%d/%m/%Y')} 00:00"

            if data == datetime.strptime(dt_finish, '%Y-%m-%dT%H:%M').strftime('%Y-%m-%d'):
                fim = datetime.strptime(dt_finish, '%Y-%m-%dT%H:%M').strftime('%d/%m/%Y %H:%M')
            else:
                fim = f"{data_inicio.strftime('%d/%m/%Y')} 23:59"

            resultado.append({
                "data": data,
                "periodo": {
                    "inicio": inicio,
                    "fim": fim
                },
                "resumo_geral": {
                    "total_chamadas": total_chamadas,
                    "pico_horario": {
                        "horario": pico_horario[0],
                        "chamadas": pico_horario[1],
                        "percentual": f"{(pico_horario[1] / total_chamadas) * 100:.2f}%"
                    },
                    "categorias": {
                        "navegacao": categorias["navegacao"],
                        "processadas": categorias["processadas"],
                        "transferidas": categorias["transferidas"],
                        "abandonadas": categorias["abandonadas"],
                        "derivadas": categorias["derivadas"],
                        "erros_transferencia": categorias["erros_transferencia"],
                    }
                },
                "detalhes_horarios": detalhes_horarios
            })

        logger.info("Processamento concluído")
        return resultado
    except Exception as e:
        logger.error(f"Erro ao processar tarefa: {e}")
        raise e
