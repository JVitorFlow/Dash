from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ( index, icons, tbl_bootstrap, chart_apex,  map_google, auth_signup, auth_signin, sample_page, DashboardKpiUraView)
from .views_api import (
    EmpresasOminiViewSet, PerfilUsuarioViewSet, LicencaViewSet, 
    CanalOminiViewSet, BotViewSet, BotCanalViewSet, LicencaUsuarioViewSet,
    URAViewSet, RPAViewSet, empresas_view, quantidade_mensagens_por_bot_e_canal_view, sessoes_view,
    atividade_agentes_ura_view, indicador_de_desempenho_por_fila_de_URA_view, tempo_medio_servico_por_atendente_view,
    indicadores_de_desempenho_view
)
app_name = 'ligobots'

# Criar um roteador para as rotas da API
router = DefaultRouter()
router.register(r'empresas', EmpresasOminiViewSet)
router.register(r'perfils', PerfilUsuarioViewSet)
router.register(r'licencas', LicencaViewSet)
router.register(r'canais', CanalOminiViewSet)
router.register(r'bots', BotViewSet)
router.register(r'bot-canais', BotCanalViewSet)
router.register(r'licenca-usuarios', LicencaUsuarioViewSet)
router.register(r'uras', URAViewSet)
router.register(r'rpas', RPAViewSet)

urlpatterns = [
    # Rotas da web
    path('', index, name='index'),
    path('icons/', icons, name='icons'),
    path('tbl_bootstrap/', tbl_bootstrap, name='tbl_bootstrap'),
    path('chart-apex/', chart_apex, name='chart_apex'),
    path('map-google/', map_google, name='map_google'),
    path('auth-signup/', auth_signup, name='auth_signup'),
    path('auth-signin/', auth_signin, name='auth_signin'),
    path('sample-page/', sample_page, name='sample_page'),
    path('dashboard-kpi-ura/', DashboardKpiUraView.as_view(), name='dashboard_kpi_ura'),
    
    # Rotas da API
    path('api/', include(router.urls)),
    path('api/empresas/', empresas_view, name='fetch_empresas'),
    path('api/quantidade-mensagens-por-bot-e-canal/', quantidade_mensagens_por_bot_e_canal_view, name='quantidade_mensagens_por_bot_e_canal'),
    path('api/sessoes/', sessoes_view, name='sessoes'),
    path('api/atividade-agentes-ura/', atividade_agentes_ura_view, name='atividade-agentes-ura'),
    path('api/indicador_de_desempenho_por_fila_de_URA/', indicador_de_desempenho_por_fila_de_URA_view, name='indicador_de_desempenho_por_fila_de_URA'),
    path('api/tempo-medio-servico-por-atendente/', tempo_medio_servico_por_atendente_view, name='tempo_medio_servico_por_atendente'),
    path('api/indicadores-de-desempenho/', indicadores_de_desempenho_view, name='indicadores_de_desempenho'),

]
