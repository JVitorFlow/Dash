from rest_framework import viewsets
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import (
    EmpresasOmini, PerfilUsuario, Licenca, 
    CanalOmini, Bot, BotCanal, LicencaUsuario, 
    Ura, Rpa
)
from .services import (
    obter_empresas, obter_quantidade_mensagens_por_bot_e_canal, obter_sessoes,
    obter_atividade_agentes_ura, obter_indicador_de_desempenho_por_fila_de_URA, 
    obter_tempo_medio_servico_por_atendente, obter_indicadores_de_desempenho, obter_token_autenticacao, obter_chamadas_ivr,
    processar_chamadas_abandonadas
)
from .serializers import (
    EmpresasOminiSerializer, PerfilUsuarioSerializer, LicencaSerializer,
    CanalOminiSerializer, BotSerializer, BotCanalSerializer, LicencaUsuarioSerializer,
    RPASerializer, URASerializer
)

class EmpresasOminiViewSet(viewsets.ModelViewSet):
    queryset = EmpresasOmini.objects.all()
    serializer_class = EmpresasOminiSerializer

class PerfilUsuarioViewSet(viewsets.ModelViewSet):
    queryset = PerfilUsuario.objects.all()
    serializer_class = PerfilUsuarioSerializer

class LicencaViewSet(viewsets.ModelViewSet):
    queryset = Licenca.objects.all()
    serializer_class = LicencaSerializer

class CanalOminiViewSet(viewsets.ModelViewSet):
    queryset = CanalOmini.objects.all()
    serializer_class = CanalOminiSerializer

class BotViewSet(viewsets.ModelViewSet):
    queryset = Bot.objects.all()
    serializer_class = BotSerializer

class BotCanalViewSet(viewsets.ModelViewSet):
    queryset = BotCanal.objects.all()
    serializer_class = BotCanalSerializer

class LicencaUsuarioViewSet(viewsets.ModelViewSet):
    queryset = LicencaUsuario.objects.all()
    serializer_class = LicencaUsuarioSerializer

class URAViewSet(viewsets.ModelViewSet):
    queryset = Ura.objects.all()
    serializer_class = URASerializer

class RPAViewSet(viewsets.ModelViewSet):
    queryset = Rpa.objects.all()
    serializer_class = RPASerializer


@api_view(['POST'])
def empresas_view(request):
    data = request.data  # Captura os dados do corpo da requisição
    result = obter_empresas(data)
    if result["status"] == "success":
        return Response(result["dados"], status=status.HTTP_200_OK)
    else:
        return Response(result, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
def quantidade_mensagens_por_bot_e_canal_view(request):
    data = {
        'start_date': request.query_params.get('start_date'),
        'end_date': request.query_params.get('end_date')
    }
    
    if not all(data.values()):
        return Response({"status": "error", "message": "Missing parameters"}, status=status.HTTP_400_BAD_REQUEST)
    
    result = obter_quantidade_mensagens_por_bot_e_canal(data)
    
    if result["status"] == "success":
        return Response(result["data"], status=status.HTTP_200_OK)
    else:
        return Response(result, status=status.HTTP_400_BAD_REQUEST)
    
@api_view(['GET'])
def sessoes_view(request):
    data = {
        'start_date': request.query_params.get('start_date'),
        'end_date': request.query_params.get('end_date')
    }
    
    if not all(data.values()):
        return Response({"status": "erro", "mensagem": "Parâmetros faltando"}, status=status.HTTP_400_BAD_REQUEST)
    
    result = obter_sessoes(data)
    
    if result["status"] == "sucesso":
        return Response(result["data"], status=status.HTTP_200_OK)
    else:
        return Response(result, status=status.HTTP_400_BAD_REQUEST)
    

@api_view(['POST'])
def atividade_agentes_ura_view(request):
    data = request.data  # Captura os dados do corpo da requisição
    result = obter_atividade_agentes_ura(data)
    
    if result.get("status") == "success":
        return Response(result["data"], status=status.HTTP_200_OK)
    else:
        return Response(result, status=status.HTTP_400_BAD_REQUEST)
    
@api_view(['POST'])
def indicador_de_desempenho_por_fila_de_URA_view(request):
    data = request.data  # Captura os dados do corpo da requisição
    result = obter_indicador_de_desempenho_por_fila_de_URA(data)  # Chama a função de serviço
    
    if result.get("status") == "success":
        return Response(result["data"], status=status.HTTP_200_OK)
    else:
        return Response(result, status=status.HTTP_400_BAD_REQUEST)
    
@api_view(['POST'])
def tempo_medio_servico_por_atendente_view(request):
    data = request.data
    result = obter_tempo_medio_servico_por_atendente(data)

    if result.get("status") == "success":
        return Response(result["data"], status=status.HTTP_200_OK)
    else:
        return Response(result, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def indicadores_de_desempenho_view(request):
    data = request.data
    result = obter_indicadores_de_desempenho(data)

    if result.get("status") == "success":
        return Response(result["data"], status=status.HTTP_200_OK)
    else:
        return Response(result, status=status.HTTP_400_BAD_REQUEST)


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

