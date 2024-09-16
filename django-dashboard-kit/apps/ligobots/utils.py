from datetime import datetime, timedelta

CARGA_HORARIA_ESPERADA_SEGUNDOS = 6 * 3600

def consolidar_dados_por_agente_e_data(dados_api):
    agentes_consolidados = []
    emails_para_ignorar = ["homolog.inovasaude@mail.com", "yara.bezerra@wtime.com.br"]

    for item in dados_api:
        # Ignorar emails na lista de exclusão
        if item['nome'] in emails_para_ignorar:
            continue

        login_str = item.get('login')
        logoff_str = item.get('logoff')

        # Verificar se os dados de login e logoff são válidos
        if not login_str or not logoff_str or login_str == logoff_str:
            continue

        # Converter strings de login e logoff para datetime
        login_date = datetime.fromisoformat(login_str)
        logoff_date = datetime.fromisoformat(logoff_str)

        # Ajustar logoff se ocorrer até 00:15 do dia seguinte
        inicio_dia_seguinte = logoff_date.replace(hour=0, minute=0, second=0, microsecond=0)
        limite_tolerancia_logoff = inicio_dia_seguinte + timedelta(minutes=15)
        if logoff_date <= limite_tolerancia_logoff:
            logoff_date -= timedelta(days=1)
            logoff_date = logoff_date.replace(hour=23, minute=59, second=59, microsecond=999999)

        # Data de referência será a do logoff ajustado
        data = logoff_date.strftime('%d/%m/%Y')

        # Verificar se o agente já tem registro no mesmo dia
        agente_existente = next((ag for ag in agentes_consolidados if ag['nome'] == item['nome'] and ag['data'] == data), None)

        if not agente_existente:
            agente_existente = {
                'nome': item.get('nome', 'N/A'),
                'data': data,
                'periodosLogin': [],
                'tempoTotalPausaSegundos': 0,
                'quantidadePausas': 0,
                'detalhesPausas': set(),
                'tempoTotalLoginSegundos': 0  # Nova chave para armazenar o tempo total de login em segundos
            }
            agentes_consolidados.append(agente_existente)

        # Verificar se já existe o mesmo período de login/logoff
        if any(periodo['loginDate'] == login_date and periodo['logoffDate'] == logoff_date for periodo in agente_existente['periodosLogin']):
            continue  # Evitar duplicações

        # Adicionar o período de login e logoff
        agente_existente['periodosLogin'].append({'loginDate': login_date, 'logoffDate': logoff_date})

        # Calcular o tempo de login em segundos para este período
        tempo_login_segundos = (logoff_date - login_date).total_seconds()
        agente_existente['tempoTotalLoginSegundos'] += tempo_login_segundos

        # Processar pausas (se houver)
        if 'agent_pause_list' in item and isinstance(item['agent_pause_list'], list):
            for pause in item['agent_pause_list']:
                pause_start = datetime.fromisoformat(pause['pause'])
                pause_end = datetime.fromisoformat(pause['unpause'])
                pause_duration_seconds = (pause_end - pause_start).total_seconds()

                # Dividir pausas que cruzam a meia-noite
                if pause_start.date() != pause_end.date():
                    fim_dia_pausa = pause_start.replace(hour=23, minute=59, second=59, microsecond=999999)
                    comeco_dia_seguinte = pause_end.replace(hour=0, minute=0, second=0, microsecond=0)

                    pausa_dia1_segundos = (fim_dia_pausa - pause_start).total_seconds()
                    pausa_dia2_segundos = (pause_end - comeco_dia_seguinte).total_seconds()

                    agente_existente['tempoTotalPausaSegundos'] += pausa_dia1_segundos
                    agente_existente['detalhesPausas'].add(f"{pause_start.strftime('%H:%M:%S')} - 23:59:59: {pause['motivo_pause']}")
                    agente_existente['quantidadePausas'] += 1

                    # Atualizar o próximo dia com a segunda parte da pausa
                    agente_existente['tempoTotalPausaSegundos'] += pausa_dia2_segundos
                    agente_existente['detalhesPausas'].add(f"00:00:00 - {pause_end.strftime('%H:%M:%S')}: {pause['motivo_pause']}")
                    agente_existente['quantidadePausas'] += 1
                else:
                    # Caso a pausa não cruze a meia-noite
                    detalhe_pausa = f"{pause_start.strftime('%H:%M:%S')} - {pause_end.strftime('%H:%M:%S')}: {pause['motivo_pause']}"
                    if detalhe_pausa not in agente_existente['detalhesPausas']:
                        agente_existente['detalhesPausas'].add(detalhe_pausa)
                        agente_existente['tempoTotalPausaSegundos'] += pause_duration_seconds
                        agente_existente['quantidadePausas'] += 1

    # Processar os agentes para calcular o tempo efetivo logado
    for agente in agentes_consolidados:
        tempo_total_login = agente['tempoTotalLoginSegundos']
        tempo_pausa = agente['tempoTotalPausaSegundos']
        tempo_efetivo_login = tempo_total_login - tempo_pausa  # Subtraímos o tempo de pausa do tempo total logado

        # Converter o tempo total de login e o tempo efetivo de login para o formato HH:MM:SS
        agente['tempoTotalLoginFormatado'] = str(timedelta(seconds=int(tempo_total_login)))
        agente['tempoEfetivoLoginFormatado'] = str(timedelta(seconds=int(tempo_efetivo_login)))

        # Converter o set de detalhes de pausa para uma lista (para JSON)
        agente['detalhesPausas'] = list(agente['detalhesPausas'])

    return agentes_consolidados




def calcular_ocupacao_total(agentes_consolidados):
    ocupacao_total_geral = 0
    soma_percentual = 0
    total_agentes = len(agentes_consolidados)

    for agente in agentes_consolidados:
        # Cálculo das horas trabalhadas em segundos (tempo total de login menos pausas)
        horas_trabalhadas_segundos = agente['tempoTotalLoginSegundos'] - agente['tempoTotalPausaSegundos']

        # Garantir que o tempo trabalhado não seja negativo
        if horas_trabalhadas_segundos < 0:
            horas_trabalhadas_segundos = 0

        # Cálculo da ocupação individual do agente
        carga_horaria = CARGA_HORARIA_ESPERADA_SEGUNDOS
        horas_de_pausa = agente['tempoTotalPausaSegundos']

        # Se o tempo de pausa for maior ou igual à carga horária, a ocupação é 0%
        if carga_horaria - horas_de_pausa > 0:
            ocupacao_percent = (horas_trabalhadas_segundos / (carga_horaria - horas_de_pausa)) * 100
        else:
            ocupacao_percent = 0

        ocupacao_percent = round(ocupacao_percent, 2)
        agente['ocupacaoPercentual'] = ocupacao_percent

        # Somar ao total geral
        soma_percentual += ocupacao_percent

    # Cálculo da ocupação total geral (média de todos os agentes)
    if total_agentes > 0:
        ocupacao_total_geral = round(soma_percentual / total_agentes, 2)

    return {
        'ocupacao_total_geral': ocupacao_total_geral  # Apenas a ocupação total geral é retornada
    }
