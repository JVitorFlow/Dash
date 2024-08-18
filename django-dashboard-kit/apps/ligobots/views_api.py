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
    obter_tempo_medio_servico_por_atendente, obter_indicadores_de_desempenho
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
        return Response(result)
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
    
    if result["status"] == "error":
        return Response(result, status=status.HTTP_400_BAD_REQUEST)
    else:
        return Response(result)
    
@api_view(['GET'])
def sessoes_view(request):
    data = {
        'start_date': request.query_params.get('start_date'),
        'end_date': request.query_params.get('end_date')
    }
    
    if not all(data.values()):
        return Response({"status": "erro", "mensagem": "Parâmetros faltando"}, status=status.HTTP_400_BAD_REQUEST)
    
    result = obter_sessoes(data)
    
    if result["status"] == "erro":
        return Response(result, status=status.HTTP_400_BAD_REQUEST)
    else:
        return Response(result)
    

@api_view(['POST'])
def atividade_agentes_ura_view(request):
    data = request.data  # Captura os dados do corpo da requisição
    result = obter_atividade_agentes_ura(data)
    
    if result.get("status") == "error":
        return Response(result, status=status.HTTP_400_BAD_REQUEST)
    else:
        return Response(result, status=status.HTTP_200_OK)
    
@api_view(['POST'])
def indicador_de_desempenho_por_fila_de_URA_view(request):
    data = request.data  # Captura os dados do corpo da requisição
    result = obter_indicador_de_desempenho_por_fila_de_URA(data)  # Chama a função de serviço
    
    if result.get("status") == "error":
        return Response(result, status=status.HTTP_400_BAD_REQUEST)
    else:
        return Response(result, status=status.HTTP_200_OK)
    
@api_view(['POST'])
def tempo_medio_servico_por_atendente_view(request):
    data = request.data
    result = obter_tempo_medio_servico_por_atendente(data)

    # Verifica se houve algum erro na resposta da API
    if result.get("status") == "error":
        return Response(result, status=status.HTTP_400_BAD_REQUEST)
    else:
        return Response(result, status=status.HTTP_200_OK)



@api_view(['POST'])
def indicadores_de_desempenho_view(request):
    data = request.data
    result = obter_indicadores_de_desempenho(data)

    # Verifica se houve algum erro na resposta da API
    if result.get("status") == "error":
        return Response(result, status=status.HTTP_400_BAD_REQUEST)
    else:
        return Response(result, status=status.HTTP_200_OK)
