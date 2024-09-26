from django.shortcuts import render
from django.views.generic import TemplateView
from .models import Ura
from django.db.models import Count
from django.urls import reverse_lazy
from django.contrib.auth.mixins import LoginRequiredMixin
from .services import processar_chamadas_abandonadas, obter_chamadas_ivr, obter_token_autenticacao
from datetime import datetime

def index(request):
    return render(request, 'ligobots/index.html')

def icons(request):
    return render(request, 'ligobots/icon-feather.html')

def tbl_bootstrap(request):
    return render(request, 'ligobots/tbl_bootstrap.html')

def chart_apex(request):
    return render(request, 'ligobots/chart-apex.html')

def map_google(request):
    return render(request, 'ligobots/map-google.html')

def auth_signup(request):
    return render(request, 'ligobots/auth-signup.html')

def auth_signin(request):
    return render(request, 'ligobots/auth-signin.html')

def sample_page(request):
    return render(request, 'ligobots/sample-page.html')


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
    
class LigacoesAbandonadasView(LoginRequiredMixin, TemplateView):
    template_name = 'ligobots/chamadas_abandonadas.html'

    def post(self, request, *args, **kwargs):
        dt_start = request.POST.get('dt_start')
        dt_finish = request.POST.get('dt_finish')
        call_filter_list = {'call_data.code_status_ivr': 10003}

        # Validação básica dos dados do formulário
        if not dt_start or not dt_finish:
            error_message = "Por favor, preencha as datas corretamente."
            return render(request, self.template_name, {'error_message': error_message})

        # Formatando as datas para o formato exigido pela API: "YYYY-MM-DD HH:MM:SS"
        try:
            dt_start_obj = datetime.strptime(dt_start, '%Y-%m-%dT%H:%M')  # 'dt_start' recebido no formato HTML5
            dt_finish_obj = datetime.strptime(dt_finish, '%Y-%m-%dT%H:%M')  # 'dt_finish' recebido no formato HTML5

            # Formatação final para a API
            dt_start_formatted = dt_start_obj.strftime('%Y-%m-%d %H:%M:%S')
            dt_finish_formatted = dt_finish_obj.strftime('%Y-%m-%d %H:%M:%S')
        except ValueError:
            error_message = "Formato de data inválido. Por favor, use o formato correto de data e hora."
            return render(request, self.template_name, {'error_message': error_message})

        # Autenticação e obtenção do token
        token = obter_token_autenticacao()
        if not token:
            error_message = "Falha ao obter o token."
            return render(request, self.template_name, {'error_message': error_message})

        # Chamar diretamente a função para obter as chamadas
        chamadas_ivr = obter_chamadas_ivr(token, dt_start_formatted, dt_finish_formatted, call_filter_list)

        if isinstance(chamadas_ivr, dict) and chamadas_ivr.get('status') == 'erro':
            error_message = chamadas_ivr['mensagem']
            return render(request, self.template_name, {'error_message': error_message})

        # Processar as chamadas abandonadas
        resultado_abandonos = processar_chamadas_abandonadas(chamadas_ivr)

        if isinstance(resultado_abandonos, dict) and resultado_abandonos.get('status') == 'erro':
            error_message = resultado_abandonos['mensagem']
            return render(request, self.template_name, {'error_message': error_message})

        # Separar os dados de abandonos cognitivos e interrompidas do cliente para renderização
        abandonos_cognitivos = resultado_abandonos.get('abandonos_cognitivos', [])
        interrompidas_cliente = resultado_abandonos.get('interrompidas_cliente', [])

        # Renderizar os dados processados no template
        return render(request, self.template_name, {
            'abandonos_cognitivos': abandonos_cognitivos,
            'interrompidas_cliente': interrompidas_cliente
        })

    def get(self, request, *args, **kwargs):
        # Renderiza o template com o formulário vazio
        return render(request, self.template_name)