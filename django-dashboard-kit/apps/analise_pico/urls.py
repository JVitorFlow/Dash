from django.urls import path
from .views import AnalisePicoView
from . import views

app_name = 'analise_pico'

urlpatterns = [
    path('pico/', AnalisePicoView.as_view(), name='pico_movimento'),
]
