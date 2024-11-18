from django.urls import path
from .views import LigacoesAbandonadasView, verificar_status_task, UraJornadaView, LeiaView
from .views_api import (
    obter_chamadas_ivr_view
)

app_name = 'relatorios'

urlpatterns = [
    # URL para exibir o formulário e iniciar o processamento das ligações abandonadas
    path('api/obter_chamadas_ivr/', obter_chamadas_ivr_view, name='obter_chamadas_ivr'),
    path('abandonadas-ura/', LigacoesAbandonadasView.as_view(), name='abandonadas_ura'),
    path('jornada-ura/', UraJornadaView.as_view(), name='jornada_ura'),
    path('leia/', LeiaView.as_view(), name='leia'),
    # URL para verificar o progresso da task Celery
    path('celery-status/<str:task_id>/', verificar_status_task, name='celery_status'),
]
