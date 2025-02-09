import requests
import logging
from django.conf import settings
from dateutil import parser
from urllib.parse import quote
from datetime import datetime

logger = logging.getLogger(__name__)

# Configurações da API
TOKEN_API_URL = settings.TOKEN_API_URL
IVR_TRACE_CALL_API_URL = settings.IVR_TRACE_CALL_API_URL
USERNAME = settings.USERNAME_IVRCALLAPI
PASSWORD = settings.PASSWORD_IVRCALLAPI
ORG_ID = settings.ORG_ID
CAMPAIGN_ID = settings.CAMPAING_ID

BASE_URL_LEIA = settings.BASE_URL_LEIA
FILES_DIRECTORY = settings.FILES_DIRECTORY
TOKEN_LEIA = settings.TOKEN_LEIA


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
    "finishIvr": "Fim do IVR",
}

# -----------------------------------
# 1. Funções de Autenticação
# -----------------------------------

def obter_token_autenticacao():
    """
    Função que faz uma requisição para obter o token de autenticação da API.
    """

    headers = {"Accept": "text/plain", "Content-Type": "application/json"}
    body = {"userName": USERNAME, "password": PASSWORD}

    try:
        response = requests.post(TOKEN_API_URL, headers=headers, json=body)
        response.raise_for_status()  # Verifica se a resposta foi bem-sucedida (status 2xx)

        # Se a resposta foi bem-sucedida, processa o resultado
        data = response.json()
        token = data.get("value", None)  # Pega o token da resposta

        if token:
            logger.info(f"Token obtido com sucesso: {token}")
            return token
        else:
            logger.error("Não foi possível obter o token. Resposta da API inválida.")
            return None

    except requests.RequestException as e:
        logger.error(f"Erro ao obter token: {e}")
    return None

# -----------------------------------
# 2. Funções de Manipulação de Dados
# -----------------------------------
def formatar_data_html5(data):
    """
    Formata a data para o padrão esperado pela aplicação.
    Se a entrada já for um objeto datetime, retorna diretamente.
    """
    if isinstance(data, datetime):
        # Se já for um objeto datetime, apenas retorna
        return data
    elif isinstance(data, str):
        # Se for uma string, converte para datetime usando strptime
        return datetime.strptime(data, "%Y-%m-%dT%H:%M")
    else:
        raise ValueError("O formato da data é inválido. Esperado str ou datetime.")

def format_date_to_api(date_str):
    """
    Converte uma data de entrada (YYYY-MM-DD) para o formato esperado pela API (YYYY-MM-DDTHH:MM:SS).
    """
    try:
        date_obj = datetime.strptime(date_str, "%Y-%m-%d")
        return date_obj.strftime("%Y-%m-%dT00:00:00")
    except ValueError as e:
        raise ValueError(f"Erro na formatação da data: {e}")
    

# -----------------------------------
# 3. Funções de Chamadas de API
# -----------------------------------

def fazer_requisicao_post(url, headers, body):
    """
    Faz uma requisição POST genérica.
    """
    try:
        response = requests.post(url, headers=headers, json=body)
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        logger.error(f"Erro na requisição POST: {e}")
        raise

def obter_chamadas_ivr(token, dt_start, dt_finish, call_filter_list):

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }

    todas_chamadas = []
    page = 1
    total_pages = 1
    limit = 200

    try:
        while page <= total_pages:
            url = f"{IVR_TRACE_CALL_API_URL}?limit={limit}&page={page}"
            body = {
                "dt_start": dt_start,
                "dt_finish": dt_finish,
                "org_id": ORG_ID,
                "campaign_id": CAMPAIGN_ID,
                "call_filter_list": call_filter_list,
            }

            data = fazer_requisicao_post(url, headers, body)

            chamadas = data.get("data", [])
            todas_chamadas.extend(chamadas)

            metadata = data.get("metadata", {})
            total_pages = metadata.get("page_total", 1)
            page += 1

        return todas_chamadas
    except requests.HTTPError as http_err:
        logger.error(f"Erro HTTP ocorreu: {http_err}")
        return {"status": "erro", "mensagem": str(http_err)}
    except Exception as err:
        logger.error(f"Ocorreu um erro ao obter as chamadas IVR: {err}")
        return {"status": "erro", "mensagem": str(err)}

def captura_informacoes_leia_ia(tag, data_inicio, data_fim):

    """
    Faz a chamada à API Leia com as informações necessárias.
    """
    try:
        tag_encoded = quote(tag, safe="")

        query_string = (
            f"token={TOKEN_LEIA}"
            f"&tag={tag_encoded}"
            f"&start_date={data_inicio}"
            f"&end_date={data_fim}"
        )

        full_url = f"{BASE_URL_LEIA}/requests/{FILES_DIRECTORY}?{query_string}"

        logger.info(f"URL construída: {full_url}")

        response = requests.get(full_url)

        response.raise_for_status()

        return response.json()
    
    except requests.exceptions.HTTPError as http_err:
        logger.error(f"Erro HTTP ao capturar informações Leia: {http_err}")
        logger.debug(f"Resposta da API: {response.text}")  # Log detalhado da resposta
    except requests.RequestException as req_err:
        logger.error(f"Erro de requisição Leia: {req_err}")
    except Exception as e:
        logger.error(f"Erro inesperado: {e}")

    return None


# -----------------------------------
# 4. Funções de Tarefas Assíncronas
# -----------------------------------


def iniciar_task_assincrona(task_func, *args, **kwargs):
    """
    Inicia uma tarefa assíncrona e retorna o ID da task.
    """
    try:
        task = task_func.delay(*args, **kwargs)
        return task.id
    except Exception as e:
        raise RuntimeError(f"Erro ao iniciar a task: {str(e)}")


# -----------------------------------
# 5. Funções de Análise de Chamadas
# -----------------------------------

def verificar_abandono_cognitivo(ivr_events):

    """
    Verifica se uma chamada foi abandonada cognitivamente.
    Uma chamada é considerada abandonada cognitivamente se:
    - Contém o evento "LogAbandonoCognitivo".
    - Não contém o evento "CapturaAudio".
    """
    eventos_legiveis = obter_eventos_legiveis(ivr_events)
    return (
        "Log de Abandono Cognitivo" in eventos_legiveis
        and "Captura de Áudio" not in eventos_legiveis
    )

def verificar_interrompida_ura_tradicional(ivr_events):
    """
    Verifica se uma chamada foi interrompida na URA Tradicional.
    Uma chamada é considerada interrompida se:
    - Contém o evento "AudioSaudacao".
    - Não contém os eventos "IvrAudioDTMF" ou "IvrRedirect".
    """
    eventos_legiveis = obter_eventos_legiveis(ivr_events)
    saudacao = "Áudio de Saudação" in eventos_legiveis
    interacao = any(evt in eventos_legiveis for evt in ["Detecção de DTMF", "Transferência"])
    return saudacao and not interacao

def obter_eventos_legiveis(ivr_events):
    """
    Recebe uma lista de eventos IVR e retorna os nomes traduzidos (legíveis) dos eventos.
    """
    return [
        EVENTOS_LEGIVEIS.get(event.get("step_name", ""), event.get("step_name", ""))
        for event in ivr_events
    ]

# -----------------------------------
# 6. Análise de Chamadas Abandonadas
# -----------------------------------

def processar_chamadas_abandonadas(dados_pagina):

    """
     Esta função recebe uma lista de chamadas (dados_pagina) e analisa cada uma delas
     para identificar dois tipos principais de eventos:
     1. Chamadas abandonadas cognitivamente:
        - Ocorre quando o evento "LogAbandonoCognitivo" está presente
          e o evento "CapturaAudio" está ausente na lista de eventos da chamada.
     2. Chamadas interrompidas pelo cliente na URA Tradicional:
        - Ocorre quando o evento "AudioSaudacao" está presente, mas os eventos
          "IvrAudioDTMF" ou "IvrRedirect" estão ausentes.

    Parâmetros:
        - dados_pagina (list): Lista de chamadas com os dados a serem processados.
        
        Retorno:
        - dict: Dicionário com as chamadas classificadas em "abandonos_cognitivos" e "interrompidas_cliente".
    """
    chamadas_abandonadas_cognitivo = []
    chamadas_interrompidas_cliente = []

    for chamada in dados_pagina:
        call_data = chamada.get("call_data", {})
        ivr_events = chamada.get("ivr_event_list", [])
        numero_cliente = (
            call_data.get("variables", {})
            .get("global", {})
            .get("contactphonefull", "Número desconhecido")
        )
        data_hora_inicio = call_data.get("start_ivr")
        data_hora_fim = call_data.get("finish_ivr")
        nome_ura = call_data.get("nm_flow_ivr", "Desconhecido")

        # Verifica se é um abandono cognitivo
        if verificar_abandono_cognitivo(ivr_events):
            chamadas_abandonadas_cognitivo.append(
                {
                    "id_chamada": chamada.get("id_call"),
                    "numero_cliente": numero_cliente,
                    "data_hora_inicio": data_hora_inicio,
                    "data_hora_fim": data_hora_fim,
                    "tipo_abandono": "cognitivo",
                    "nome_ura": nome_ura,
                }
            )

        # Verifica se foi interrompida pelo cliente na URA Tradicional
        elif verificar_interrompida_ura_tradicional(ivr_events):
            chamadas_interrompidas_cliente.append(
                {
                    "id_chamada": chamada.get("id_call"),
                    "numero_cliente": numero_cliente,
                    "data_hora_inicio": data_hora_inicio,
                    "data_hora_fim": data_hora_fim,
                    "tipo_abandono": "interrompida_pelo_cliente",
                    "nome_ura": nome_ura,
                }
            )

    return {
        "abandonos_cognitivos": chamadas_abandonadas_cognitivo,
        "interrompidas_cliente": chamadas_interrompidas_cliente,
    }


# -----------------------------------
# 7. Análise de Jornada da URA
# -----------------------------------

def obter_jornada_ura(token, dt_start, dt_finish, code_flow_ivr):
    url_base = IVR_TRACE_CALL_API_URL
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }

    todas_chamadas = []
    page = 1
    total_pages = 1
    limit = 200
    MAX_PAGES = 10

    try:
        # Enquanto a página atual for menor ou igual ao total de páginas
        while page <= total_pages and page <= MAX_PAGES:
            url = f"{url_base}?limit={limit}&page={page}"
            body = {
                "dt_start": dt_start,
                "dt_finish": dt_finish,
                "org_id": ORG_ID,
                "campaign_id": CAMPAIGN_ID,
                "code_flow_ivr": code_flow_ivr, 
            }

            logger.info(f"Enviando requisição para a página {page}: {body}")
            response = requests.post(url, headers=headers, json=body)
            response.raise_for_status()  # Lança uma exceção se houver um erro HTTP

            data = response.json()

            # Validação do formato da resposta
            if not isinstance(data, dict):
                logger.error(f"Resposta da API não é um dicionário: {data}")
                return {
                    "status": "erro",
                    "mensagem": "Formato da resposta da API inválido.",
                }

            # Armazena as chamadas da página atual
            chamadas_pagina = data.get("data", [])
            if not isinstance(chamadas_pagina, list):
                logger.error(
                    f"O campo 'data' na resposta da API não é uma lista: {chamadas_pagina}"
                )
                return {
                    "status": "erro",
                    "mensagem": "Campo 'data' na resposta da API inválido.",
                }

            todas_chamadas.extend(chamadas_pagina)

            # Recupera informações de metadados, como o total de páginas
            metadata = data.get("metadata", {})
            total_pages = metadata.get("page_total", 1)  # Total de páginas
            page += 1  # Próxima página

            # Verifica se a página atual retornou dados
            if not chamadas_pagina:
                logger.warning(
                    f"Página {page - 1} retornou uma lista vazia ou dados ausentes."
                )

        # Verifica se o limite de páginas foi atingido
        if page > MAX_PAGES:
            logger.warning(
                f"Limite de páginas atingido ({MAX_PAGES}). Interrompendo a execução."
            )

        logger.info(f"Total de chamadas obtidas: {len(todas_chamadas)}")

        # Retornar como um dicionário com dados e metadados
        return {
            "data": todas_chamadas,
            "metadata": {
                "total_chamadas": len(todas_chamadas),
                "total_pages": total_pages,
            },
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

    # Mapeamento específico para HM
    step_to_ramal_map_hm = {
        "TransfVitimaViolencia": "RamalVitimaViolencia",
        "TransfAgendamentos": "RamalAgendamentos",
        "TransfTrabalharConosco": "RamalTrabalharConosco",
        "TransfRamalServicoAtendimentoUsuarioSAU": "RamalReclamacoesElogios",
    }

    step_to_ramal_map_hsjc = {
        "TransfOuvidoria": "RamalOuvidoria",
        "TransfAgendamentos": "RamalAgendamentos",
        "TransfFilaCirurgica": "RamalFilaCirurgica",
        "TransfRecepcaoInternacao": "RamalRecepcaoInternacao",
        "TransfAmbulatorio": "RamalAmbulatorio",
        "TransfGestaoPessoasISG": "RamalGestaoPessoasISG",
        "TransfAdministracaoISG": "RamalAdministracaoISG",
        "TransfResultadoExames": "RamalResultadoExames",
        "TransfAdministracaoRHInova": "RamalAdministracaoRHInova",
        "TransfComprasISG": "RamalComprasISG",
    }

    step_to_ramal_map_hsor = {
        "TransfRecepcaoInternacao": "RamalRecepcaoInternacao",
        "TransfOuvidoria": "RamalOuvidoria",
        "TransfAmbulatorio": "RamalAmbulatorio",
        "TransfAgendamentos": "RamalAgendamentos",
        "TransfFilaCirurgica": "RamalFilaCirurgica",
    }

    # Mapeamento de ramais para setores
    ramal_to_setor_map_hospitais = {
        "HM": {
            "11775": "Recepção Internação",
            "11651": "S.A.U.",
            "11730": "Centro Cirúrgico",
            "11261": "Serviço Social",
            "11650": "Agendamento",
            "11780": "Reprodução Humana",
            "10000": "T.I. - Tecnologia",
            "11009": "Prontuario Eletrônico",
            "11740": "Engenharia Clínica",
            "11750": "Manutenção.",
            "11760": "Quimioterapia",
            "11770": "Urgência - Emergência",
            "11776": "Recepção Imagem SADT",
            "11777": "SÉSMITI SECONCI",
            "11778": "SÉSMITI Inova Saúde",
            "11780": "Reprodução Humana",
        },
        "HSJC": {
            "12400": "RH Inova Bata Cinza",
            "12200": "Agendamento",
            "12300": "Resultado de Exame",
            "12400": "RH Inova Beta Cinza",
            "12700": "Administração",
            "12800": "Compras",
            "12900": "Ouvidoria",
            "12980": "Manutenção",
            "12246": "Agência Transfusional Banco De Sangue",
            "12080": "Farmácia",
            "12920": "Internação",
            "12970": "Engenharia Clínica",
            "12650": "RH ISG Bata Branca",
            "12625": "Rouparia",
            "12376": "Secretaria Medica",
            "12617": "Segurança do Trabalho",
            "12983": "Serviço Social",
            "10000": "Tecnologia da Informação",
            "12051": "Achados e Perdidos",
            "12349": "Almoxarifado e suprimentos",
            "12950": "NIR",
        },
        "HSOR": {
            "10000": "T.I. - Tecnologia",
            "15007": "Recepção Urgência - Emergência",
            "15012": "Pronto Atendimento - Serviço Social",
            "15017": "Chefia de Enfermagem",
            "15051": "Gestão de Hotelaria",
            "15065": "Sodexo - Operacional Higiene e Limpeza",
            "15095": "Farmácia Central",
            "15098": "ONET - CFTV",
            "15099": "Inova - CFTV",
            "15165": "Banco de Sangue",
            "15200": "Agendamento",
            "15235": "Compras",
            "15237": "Coordenação Suprimentos",
            "15300": "Fila Cirúrgica",
            "15400": "Ambulatório",
            "15500": "Recepção de Internação",
            "15604": "Portaria",
            "15700": "Ouvidoria",
            "15710": "Engenharia Clínica",
            "15720": "Manutenção",
            "15725": "Recursos Humanos - SPDM",
            "15730": "Recursos Humanos - Inova Saúde",
            "15735": "SÉSMITI SPDM",
            "15740": "SÉSMITI INOVA",
            "15900": "5º Andar",
            "15950": "Núcleo Interno de Vagas",
            "15960": "BB - Secretaria da Diretoria ADM",
            "15970": "BB - Secretaria da Diretoria Técnica",
        },
    }

    def obter_ramal_e_setor(step_name, variables, hospital_code, tipo_ura):
        """
        Retorna o ramal e setor com base no step_name e nas variáveis disponíveis.
        """
        # Define mapeamento de steps para ramais baseado no código do hospital
        step_to_ramal_map = {
            "HM": step_to_ramal_map_hm,
            "HSJC": step_to_ramal_map_hsjc,
            "HSOR": step_to_ramal_map_hsor,
        }.get(hospital_code, None)

        if not step_to_ramal_map:
            return "N/A", "N/A"

        # Obtem o ramal baseado em prioridades estabelecidas
        ramal = (
            variables.get(step_to_ramal_map.get(step_name))
            or variables.get("Ramal")
            or (
                "RamalCapturado" in variables
                and hospital_code == "HM"
                and variables.get("RamalCapturado")
            )  # Apenas HM tem ramal capturado na lógica original
            or (
                "RamalDesejadoDTMFCliente" in variables
                and hospital_code == "HM"
                and variables.get("RamalDesejadoDTMFCliente")
            )  # Apenas HM tem DTMF na lógica original
            or "N/A"
        )

        # Determina o setor baseado no tipo de URA
        if tipo_ura == "Tradicional":
            setor = ramal_to_setor_map_hospitais.get(hospital_code, {}).get(
                ramal, "N/A"
            )
        else:  # Cognitiva
            setor = variables.get("Setor", "N/A")

        # Se o setor for "N/A", substituí-lo pelo ramal
        if setor == "N/A":
            setor = ramal

        return ramal, setor

    def calcular_tempo_execucao_entre_eventos(evento_atual, evento_anterior):
        try:
            tempo_atual = parser.parse(evento_atual["executed_at"])
            tempo_anterior = parser.parse(evento_anterior["executed_at"])
            return (tempo_atual - tempo_anterior).total_seconds()
        except Exception as e:
            logger.info(f"Falha ao calcular tempo entre eventos: {e}")
            return None

    ivr_events = chamada.get("ivr_event_list", [])

    if not isinstance(ivr_events, list) or chamada.get("call_data", {}).get(
        "code_status_ivr"
    ) in (10003, 10004):
        logger.info(
            f"Chamada descartada com code_status_ivr: {chamada.get('call_data', {}).get('code_status_ivr')}"
        )
        return None

    # Determina o hospital e coleta as variáveis
    hospital_code = chamada.get("call_data", {}).get("nm_flow_ivr", "N/A")
    call_data = chamada.get("call_data", {})
    variables = call_data.get("variables", {})

    estado = {
        "menu_fluxo_agendamento_detectado": False,
        "interacao_dtmf": False,
        "foi_transferido": False,
        "captura_audio": False,
        "destino_transferencia": None,
        "ramal": None,
        "setor": None,
    }

    eventos_com_tempo_execucao = []

    for i, event in enumerate(ivr_events):
        step_name = event.get("step_name", "")
        step_type = event.get("step_type", "")

        if i > 0:
            tempo_execucao = calcular_tempo_execucao_entre_eventos(
                event, ivr_events[i - 1]
            )
        else:
            tempo_execucao = None

        eventos_com_tempo_execucao.append(
            {
                "step_name": step_name,
                "step_type": step_type,
                "executed_at": event.get("executed_at"),
                "tempo_execucao": tempo_execucao,
            }
        )

        if step_name == "MenuFluxoAgendamento":
            estado["menu_fluxo_agendamento_detectado"] = True
        elif estado["menu_fluxo_agendamento_detectado"]:
            if step_name == "BlocoAudioAgendamentoWhatsApp":
                estado.update(
                    destino_transferencia="Transferência Agendamento WhatsApp",
                    ramal="WhatsApp",
                    setor="WhatsApp",
                    foi_transferido=True,
                )
            elif step_name == "TransfAgendamentos":
                estado.update(
                    destino_transferencia="TransfAgendamentos",
                    ramal="11730",
                    foi_transferido=True,
                )

        if step_type == "IvrAudioDTMF":
            estado["interacao_dtmf"] = True
        if step_type == "IvrVoiceTranscriptionAudio":
            estado["captura_audio"] = True

        if step_type == "IvrTransferCall":
            estado["foi_transferido"] = True
            estado["destino_transferencia"] = step_name or "Desconhecido"

            # Passar o tipo de URA aqui para o mapeamento
            tipo_ura = "Cognitiva" if estado["captura_audio"] else "Tradicional"
            ramal, setor = obter_ramal_e_setor(
                step_name, variables, hospital_code, tipo_ura
            )
            estado["ramal"] = ramal
            estado["setor"] = setor

    tipo_ura = "Cognitiva" if estado["captura_audio"] else "Tradicional"

    # Adiciona captura de áudio apenas se a URA for cognitiva
    audio_capturado = (
        chamada.get("call_data", {})
        .get("variables", {})
        .get("AudioCapturado", "Não disponível")
        if tipo_ura == "Cognitiva"
        else "Não disponível"
    )

    return {
        "id_chamada": chamada.get("id_call"),
        "numero_cliente": (
            chamada.get("call_data", {})
            .get("variables", {})
            .get("global", {})
            .get("contactphonefull", "Número desconhecido")
        ),
        "did_number": chamada.get("did_number", "Desconhecido"),
        "data_hora_inicio": chamada.get("call_data", {}).get("start_ivr"),
        "data_hora_fim": chamada.get("call_data", {}).get("finish_ivr"),
        "tipo_atendimento": chamada.get("call_data", {})
        .get("variables", {})
        .get("TipoAtendimento", "Desconhecido"),
        "foi_transferido": estado["foi_transferido"],
        "destino_transferencia": estado["destino_transferencia"],
        "tipo_ura": tipo_ura,
        "ramal": estado["ramal"],
        "setor": estado["setor"],
        "audio_capturado": audio_capturado,
        "eventos": eventos_com_tempo_execucao,
    }

