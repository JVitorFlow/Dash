from django.shortcuts import render
from django.views.generic import TemplateView
from .models import Ura
from django.db.models import Count
from django.urls import reverse_lazy
from django.contrib.auth.mixins import LoginRequiredMixin


class DashboardKpiUraView(LoginRequiredMixin, TemplateView):
    template_name = 'ligobots/dashboard_kpi_ura.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)

        # Total de URAs
        total_uras = Ura.objects.count()

        # URAs Ativas e Inativas
        uras_ativas = Ura.objects.filter(ativa=True).count()
        uras_inativas = Ura.objects.filter(ativa=False).count()

        # Verifica se há alguma URA no banco de dados antes de tentar acessar a data da última atualização
        if total_uras > 0:
            ultima_atualizacao = Ura.objects.latest('data_atualizacao').data_atualizacao
        else:
            ultima_atualizacao = None  # ou uma data padrão, ou mensagem informativa

        # Dados para os gráficos
        clientes = Ura.objects.values('cliente__nome').annotate(total=Count('cliente'))
        clientes_labels = [cliente['cliente__nome'] for cliente in clientes] if clientes.exists() else []
        uras_por_cliente = [cliente['total'] for cliente in clientes] if clientes.exists() else []

        # Adicionando a URL da API indicadores_de_desempenho ao contexto
        indicador_de_desempenho_por_fila_de_URA = reverse_lazy('ligobots:indicador_de_desempenho_por_fila_de_URA')
        tempo_medio_servico_por_atendente_url = reverse_lazy('ligobots:tempo_medio_servico_por_atendente')
        indicador_tempo_espera_url = reverse_lazy('ligobots:indicador-tempo-espera')
        atividades_agentes_ura_url = reverse_lazy('ligobots:atividade-agentes-ura')
        indicador_de_desempenho_url = reverse_lazy('ligobots:indicadores_de_desempenho')

        context.update({
            'total_uras': total_uras,
            'uras_ativas': uras_ativas,
            'uras_inativas': uras_inativas,
            'ultima_atualizacao': ultima_atualizacao,
            'clientes_labels': clientes_labels,
            'uras_por_cliente': uras_por_cliente,
            'uras': Ura.objects.all(),
            'indicador_de_desempenho_por_fila_de_URA': indicador_de_desempenho_por_fila_de_URA,
            'tempo_medio_servico_por_atendente_url': tempo_medio_servico_por_atendente_url,
            'indicador_tempo_espera_url': indicador_tempo_espera_url,
            'atividades_agentes_ura_url': atividades_agentes_ura_url,
            'indicador_de_desempenho_url': indicador_de_desempenho_url,
        })

        return context

class RelatorioURAView(LoginRequiredMixin, TemplateView):
    template_name = 'ligobots/relatorio_ura.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        # Passar a URL da API de indicadores para o template
        context['indicador_de_desempenho_url'] = reverse_lazy('ligobots:indicadores_de_desempenho')
        return context
    

    