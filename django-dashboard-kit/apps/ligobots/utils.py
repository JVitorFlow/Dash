from datetime import datetime, timedelta

def consolidar_dados_por_agente_e_data(dados):
    agentes_consolidados = []
    emails_para_ignorar = ["homolog.inovasaude@mail.com", "yara.bezerra@wtime.com.br"]

    for item in dados:
        # Ignorar os e-mails na lista de exclusão
        if item['nome'] in emails_para_ignorar:
            continue

        login_str = item.get('login')
        logoff_str = item.get('logoff')

        if not login_str or not logoff_str or login_str == logoff_str:
            continue

        # Converter strings para objetos datetime
        login_date = datetime.fromisoformat(login_str)
        logoff_date = datetime.fromisoformat(logoff_str)

        # Verificar a tolerância de 15 minutos para logoff
        tolerancia_logoff = timedelta(minutes=15)
        inicio_dia_seguinte = logoff_date.replace(hour=0, minute=0, second=0, microsecond=0)

        # Aplicar a tolerância
        limite_tolerancia_logoff = inicio_dia_seguinte + tolerancia_logoff
        if logoff_date <= limite_tolerancia_logoff:
            logoff_date -= timedelta(days=1)
            logoff_date = logoff_date.replace(hour=23, minute=59, second=59, microsecond=999999)

        data = logoff_date.strftime('%d/%m/%Y')

        # Verificar se já existe registro do agente no mesmo dia
        agente_existente = next((ag for ag in agentes_consolidados if ag['nome'] == item['nome'] and ag['data'] == data), None)

        if not agente_existente:
            agente_existente = {
                'nome': item.get('nome', 'N/A'),
                'data': data,
                'periodosLogin': [],
                'tempoTotalPausaSegundos': 0,
                'tempoExcedentePausaSegundos': 0,
                'quantidadePausas': 0,
                'detalhesPausas': set(),
                'todosPeriodos': set()
            }
            agentes_consolidados.append(agente_existente)

        # Adicionar o período de login e logoff
        agente_existente['periodosLogin'].append({'loginDate': login_date, 'logoffDate': logoff_date})

        # Processar pausas (se houver)
        if 'agent_pause_list' in item and isinstance(item['agent_pause_list'], list):
            for pause in item['agent_pause_list']:
                pause_start = datetime.fromisoformat(pause['pause'])
                pause_end = datetime.fromisoformat(pause['unpause'])
                pause_duration_seconds = (pause_end - pause_start).total_seconds()

                # Verificar se a pausa atravessa a meia-noite
                if pause_start.date() != pause_end.date():
                    # Dividir a pausa entre os dois dias
                    fim_dia_pausa = pause_start.replace(hour=23, minute=59, second=59, microsecond=999999)
                    comeco_dia_seguinte = pause_end.replace(hour=0, minute=0, second=0, microsecond=0)

                    pausa_dia1_segundos = (fim_dia_pausa - pause_start).total_seconds()
                    pausa_dia2_segundos = (pause_end - comeco_dia_seguinte).total_seconds()

                    # Atualizar o primeiro dia
                    agente_existente['tempoTotalPausaSegundos'] += pausa_dia1_segundos
                    agente_existente['detalhesPausas'].add(f"{pause_start.strftime('%H:%M:%S')} - 23:59:59: {pause['motivo_pause']}")
                    agente_existente['quantidadePausas'] += 1

                    # Processar a pausa do segundo dia
                    agente_dia2 = next((ag for ag in agentes_consolidados if ag['nome'] == item['nome'] and ag['data'] == pause_end.strftime('%d/%m/%Y')), None)
                    if not agente_dia2:
                        agente_dia2 = {
                            'nome': item.get('nome', 'N/A'),
                            'data': pause_end.strftime('%d/%m/%Y'),
                            'periodosLogin': [],
                            'tempoTotalPausaSegundos': 0,
                            'tempoExcedentePausaSegundos': 0,
                            'quantidadePausas': 0,
                            'detalhesPausas': set(),
                            'todosPeriodos': set()
                        }
                        agentes_consolidados.append(agente_dia2)

                    agente_dia2['tempoTotalPausaSegundos'] += pausa_dia2_segundos
                    agente_dia2['detalhesPausas'].add(f"00:00:00 - {pause_end.strftime('%H:%M:%S')}: {pause['motivo_pause']}")
                    agente_dia2['quantidadePausas'] += 1

                else:
                    # Caso a pausa não cruze a meia-noite
                    detalhe_pausa = f"{pause_start.strftime('%H:%M:%S')} - {pause_end.strftime('%H:%M:%S')}: {pause['motivo_pause']}"
                    if detalhe_pausa not in agente_existente['detalhesPausas']:
                        agente_existente['detalhesPausas'].add(detalhe_pausa)
                        agente_existente['tempoTotalPausaSegundos'] += pause_duration_seconds
                        agente_existente['quantidadePausas'] += 1

    # Processamento final de consolidação
    for agente in agentes_consolidados:
        agente['detalhesPausas'] = list(agente['detalhesPausas'])
        agente['periodosLogin'].sort(key=lambda x: x['loginDate'])
        agente['todosPeriodos'] = list(agente['todosPeriodos'])

    return agentes_consolidados


def calcular_ocupacao_total(dados):
    resultado = processar_dados_para_grafico(dados)

    # Subtraindo as horas de pausa da carga horária para obter o tempo disponível
    horas_disponiveis = resultado['carga_horaria'] - resultado['horas_pausa']

    # Garantir que não estamos dividindo por zero
    if horas_disponiveis > 0:
        ocupacao_total_percent = (resultado['horas_trabalhadas'] / horas_disponiveis) * 100
        ocupacao_total_percent = round(ocupacao_total_percent, 2)
    else:
        ocupacao_total_percent = 0.0  # Se não houver tempo disponível, a ocupação é 0%

    print(f"(calcular_ocupacao_total)[INFO] Ocupação total calculada (percentual): {ocupacao_total_percent}%")

    return ocupacao_total_percent

def processar_dados_para_grafico(dados):
    resultado = {
        'carga_horaria': 0,
        'horas_trabalhadas': 0,
        'horas_pausa': 0
    }

    TEMPO_TRABALHO_ESPERADO_HORAS = 6
    agentes_consolidados = consolidar_dados_por_agente_e_data(dados)

    # Dicionário para armazenar o número de pessoas que logaram em cada dia
    pessoas_por_dia = {}

    total_segundos_trabalhados = 0
    total_segundos_pausa = 0

    for agente in agentes_consolidados:
        # Considera apenas dias onde o agente fez login
        if len(agente['periodosLogin']) > 0:
            if agente['data'] not in pessoas_por_dia:
                pessoas_por_dia[agente['data']] = set()
            pessoas_por_dia[agente['data']].add(agente['nome'])

        # Somar as horas trabalhadas (tempo logado efetivo)
        total_segundos_trabalhados += sum(
            (login_periodo['logoffDate'] - login_periodo['loginDate']).total_seconds()
            for login_periodo in agente['periodosLogin']
        )

        # Somar o tempo de pausa (em segundos)
        total_segundos_pausa += agente['tempoTotalPausaSegundos']

    # Cálculo da carga horária para o gráfico
    for dia, pessoas in pessoas_por_dia.items():
        resultado['carga_horaria'] += len(pessoas) * TEMPO_TRABALHO_ESPERADO_HORAS

    # Converter o total de segundos trabalhados e pausados para horas decimais
    resultado['horas_trabalhadas'] = total_segundos_trabalhados / 3600
    resultado['horas_pausa'] = total_segundos_pausa / 3600
    resultado['carga_horaria'] = round(resultado['carga_horaria'], 2)

    return resultado