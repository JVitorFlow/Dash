from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ( IndexView, ClienteListView, ClienteDetailView, lista_atividades,
    adicionar_atividade, excluir_atividade, editar_atividade,
    adicionar_cliente, ServicoCreateView, editar_servico, ServicoDeleteView,
    ProjectCreateView, ProjectListView, ProjectUpdateView, ProjectDeleteView
)
from .views_api import (
    CompanyViewSet, TipoServicoViewSet, StatusViewSet,
    ClienteViewSet, ServicoViewSet, AtividadeViewSet
)

app_name = 'home'

# Criar um roteador para as rotas da API
router = DefaultRouter()
router.register(r'companies', CompanyViewSet)
router.register(r'tipo-servicos', TipoServicoViewSet)
router.register(r'status', StatusViewSet)
router.register(r'clientes', ClienteViewSet)
router.register(r'servicos', ServicoViewSet)
router.register(r'atividades', AtividadeViewSet)

urlpatterns = [
    # Rotas da web
    path('', IndexView.as_view(), name='home'),
    path('lista_clientes/', ClienteListView.as_view(), name='lista_clientes'),
    path('detalhe_cliente/<int:pk>/', ClienteDetailView.as_view(), name='detalhe_cliente'),

    path('cliente/<int:cliente_id>/atividades/', lista_atividades, name='lista_atividades'),
    path('cliente/<int:cliente_id>/atividade/adicionar/', adicionar_atividade, name='adicionar_atividade'),
    path('cliente/<int:cliente_id>/atividade/<int:atividade_id>/excluir/', excluir_atividade, name='excluir_atividade'),
    path('cliente/<int:cliente_id>/atividade/<int:atividade_id>/editar/', editar_atividade, name='editar_atividade'),

    path('clientes/adicionar/', adicionar_cliente, name='adicionar_cliente'),

    path('servico/editar/<int:id>/', editar_servico, name='editar_servico'),
    path('cliente/<int:cliente_id>/servico/adicionar/', ServicoCreateView.as_view(), name='adicionar_servico'),
    path('cliente/<int:cliente_id>/servico/<int:pk>/excluir/', ServicoDeleteView.as_view(), name='excluir_servico'),

    path('projetos/', ProjectListView.as_view(), name='lista_projetos'),
    path('projetos/add/', ProjectCreateView.as_view(), name='adicionar_projeto'),
    path('projeto/<int:pk>/editar/', ProjectUpdateView.as_view(), name='editar_projeto'),
    path('projeto/<int:pk>/excluir/', ProjectDeleteView.as_view(), name='excluir_projeto'),

    # Rotas da API
    path('api/', include(router.urls)),
]
