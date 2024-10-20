from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from .services import (
    obter_token_autenticacao, obter_chamadas_ivr,
    processar_chamadas_abandonadas
)

@api_view(['POST'])
def obter_chamadas_ivr_view(request):
    data = request.data
    dt_start = data.get('dt_start')
    dt_finish = data.get('dt_finish')
    call_filter_list = data.get('call_filter_list')

    if not all([dt_start, dt_finish, call_filter_list]):
        return Response({"error": "Faltam parâmetros na requisição."}, status=status.HTTP_400_BAD_REQUEST)

    token = obter_token_autenticacao()

    if token:
        chamadas_ivr = obter_chamadas_ivr(token, dt_start, dt_finish, call_filter_list)

        if isinstance(chamadas_ivr, dict) and chamadas_ivr.get('status') == 'erro':
            return Response({"error": chamadas_ivr['mensagem']}, status=status.HTTP_400_BAD_REQUEST)

        resultado_abandonos = processar_chamadas_abandonadas(chamadas_ivr)
        print(f"Tipo de 'resultado_abandonos': {type(resultado_abandonos)}")

        if isinstance(resultado_abandonos, dict) and resultado_abandonos.get('status') == 'erro':
            return Response({"error": resultado_abandonos['mensagem']}, status=status.HTTP_400_BAD_REQUEST)

        return Response(resultado_abandonos, status=status.HTTP_200_OK)
    else:
        return Response({"error": "Falha ao obter o token."}, status=status.HTTP_400_BAD_REQUEST)

