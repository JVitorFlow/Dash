# -*- encoding: utf-8 -*-

import logging

from django.contrib.auth.decorators import login_required
from django.urls import reverse
from django.shortcuts import render, get_object_or_404, redirect
from django.urls import reverse_lazy
from django.views.generic import CreateView, UpdateView, DeleteView, ListView
from .forms import AtividadeForm, ServicoForm, ProjectForm, StatusProjectForm, ClienteFilterForm
from .models import Cliente, Servico, Atividade, TipoServico, Company, Project, StatusProject
from django.views.generic import TemplateView
from django.contrib import messages
from django.utils.decorators import method_decorator
from django.views.generic import DetailView
from django.contrib.auth.mixins import LoginRequiredMixin

logger = logging.getLogger(__name__)


@method_decorator(login_required, name='dispatch')
class ClienteListView(ListView):
    model = Cliente
    template_name = 'home/lista_clientes.html'
    context_object_name = 'clientes'
    paginate_by = 8

    def get_queryset(self):
        queryset = Cliente.objects.all()
        nome = self.request.GET.get('nome')
        descricao = self.request.GET.get('descricao')
        servico = self.request.GET.get('servico')
        if nome:
            queryset = queryset.filter(nome__icontains=nome)
        if descricao:
            queryset = queryset.filter(descricao__icontains=descricao)
        if servico:
            queryset = queryset.filter(servicos__tipo_id=servico)
        return queryset.distinct()

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['filter_form'] = ClienteFilterForm(self.request.GET or None)
        return context


@method_decorator(login_required, name='dispatch')
class IndexView(TemplateView):
    template_name = 'home/index.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)

        total_clientes = Cliente.objects.count()
        tipos_servico = TipoServico.objects.all()

        total_servicos_dict = {tipo.nome: Servico.objects.filter(tipo=tipo).count() for tipo in tipos_servico}
        total_servicos = sum(total_servicos_dict.values())
        servicos_recentes = Servico.objects.order_by('-criado_em')[:10]
        
        # Dados para gráficos
        clientes = list(Cliente.objects.values_list('nome', flat=True))  # Convertendo para lista
        servicos_por_cliente = [cliente.servicos.count() for cliente in Cliente.objects.all()]
        
        # Calcular porcentagem de cada tipo de serviço
        porcentagem_por_tipo = {
            tipo: (quantidade / total_servicos) * 100 for tipo, quantidade in total_servicos_dict.items()
        }

         # Criar lista com cliente, total de serviços e tipo mais comum
        clientes_servicos = []
        for cliente in Cliente.objects.all():
            total_servicos_cliente = cliente.servicos.count()
            tipos_servicos = ", ".join(cliente.servicos.values_list('tipo__nome', flat=True).distinct())
            clientes_servicos.append((cliente.nome, total_servicos_cliente, tipos_servicos))

        context.update({
            'total_clientes': total_clientes,
            'total_servicos': total_servicos,
            'total_servicos_dict': total_servicos_dict,
            'servicos_recentes': servicos_recentes,
            'clientes': clientes,  # Passando diretamente para o template
            'servicos_por_cliente': servicos_por_cliente,  # Passando diretamente para o template
            'clientes_servicos': clientes_servicos,
            'porcentagem_por_tipo_labels': list(porcentagem_por_tipo.keys()),  # Nomes dos tipos de serviço
            'porcentagem_por_tipo_values': list(porcentagem_por_tipo.values()),  # Percentagens por tipo
        })

        return context



class ClienteDetailView(LoginRequiredMixin, DetailView):
    model = Cliente
    template_name = 'home/detalhe_cliente.html'
    context_object_name = 'cliente'
    login_url = '/login/'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        cliente = self.get_object()
        context['servicos'] = cliente.servicos.all()
        return context

@method_decorator(login_required, name='dispatch')
class ProjectCreateView(CreateView):
    model = Project
    form_class = ProjectForm
    template_name = 'home/adicionar_projeto_modal.html'
    success_url = reverse_lazy('home:lista_projetos')

    def form_valid(self, form):
        cliente_id = self.request.POST.get('client')
        if not cliente_id:
            messages.error(self.request, "Cliente não informado.")
            return self.form_invalid(form)
        
        cliente = get_object_or_404(Cliente, id=cliente_id)
        form.instance.client = cliente
        messages.success(self.request, "Projeto adicionado com sucesso!")
        return super().form_valid(form)


@method_decorator(login_required, name='dispatch')
class ProjectUpdateView(UpdateView):
    model = Project
    form_class = ProjectForm
    template_name = 'home/editar_projeto_modal.html'
    success_url = reverse_lazy('home:lista_projetos')

    def form_valid(self, form):
        form.instance.client_id = self.request.POST.get('client')
        form.instance.priority = self.request.POST.get('priority')
        return super().form_valid(form)


@method_decorator(login_required, name='dispatch')
class ProjectDeleteView(DeleteView):
    model = Project
    template_name = 'home/excluir_projeto.html'
    success_url = reverse_lazy('home:lista_projetos')

    def delete(self, request, *args, **kwargs):
        messages.success(self.request, "Projeto excluído com sucesso!")
        return super().delete(request, *args, **kwargs)

@method_decorator(login_required, name='dispatch')
class ProjectListView(ListView):
    model = Project
    template_name = 'home/lista_projetos.html'
    context_object_name = 'projetos'
    paginate_by = 10

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['status_projetos'] = StatusProject.objects.all()
        context['clientes'] = Cliente.objects.all()
        context['form'] = ProjectForm()
        return context

@login_required(login_url="/login/")
def lista_atividades(request, cliente_id):
    cliente = get_object_or_404(Cliente, pk=cliente_id)
    atividades = cliente.atividades.all()
    
    date_range = request.GET.get('date_range')
    atividades_encontradas = True
    
    if date_range:
        try:
            if ' até ' in date_range:
                start_date, end_date = date_range.split(' até ')
            else:
                start_date = end_date = date_range

            atividades = atividades.filter(criado_em__date__range=[start_date, end_date])
            if not atividades.exists():
                atividades_encontradas = False
        except ValueError:
            atividades = cliente.atividades.all()  # Fallback para todas as atividades se o formato estiver incorreto
            atividades_encontradas = True

    return render(request, 'home/lista_atividades.html', {
        'cliente': cliente,
        'atividades': atividades,
        'atividades_encontradas': atividades_encontradas,
        'date_range': date_range
    })


@login_required(login_url="/login/")
def adicionar_atividade(request, cliente_id):
    cliente = get_object_or_404(Cliente, id=cliente_id)
    if request.method == 'POST':
        form = AtividadeForm(request.POST)
        if form.is_valid():
            atividade = form.save(commit=False)
            atividade.cliente = cliente
            atividade.save()
            return redirect('home:lista_atividades', cliente_id=cliente.id)
    else:
        form = AtividadeForm()
    return render(request, 'home/adicionar_atividade.html', {'form': form, 'cliente': cliente})

@login_required(login_url="/login/")
def excluir_atividade(request, cliente_id, atividade_id):
    atividade = get_object_or_404(Atividade, pk=atividade_id, cliente_id=cliente_id)
    atividade.delete()
    return redirect('home:lista_atividades', cliente_id=cliente_id)


@login_required(login_url="/login/")
def editar_atividade(request, cliente_id, atividade_id):
    cliente = get_object_or_404(Cliente, id=cliente_id)
    atividade = get_object_or_404(Atividade, id=atividade_id)
    
    if request.method == 'POST':
        form = AtividadeForm(request.POST, instance=atividade)
        if form.is_valid():
            atividade = form.save(commit=False)
            status_value = form.cleaned_data['status']
            atividade.status = status_value
            atividade.save()
            return redirect('home:lista_atividades', cliente_id=cliente.id)
    else:
        form = AtividadeForm(instance=atividade)
    
    return render(request, 'home/editar_atividade.html', {'form': form, 'cliente': cliente, 'atividade': atividade})

@login_required(login_url="/login/")
def adicionar_cliente(request):
    companies = Company.objects.all()
    tipos_servico = TipoServico.objects.all()
    if request.method == 'POST':
        nome = request.POST.get('nome')
        descricao = request.POST.get('descricao')
        foto = request.FILES.get('foto')
        tipo_servico_id = request.POST.get('tipo_servico')
        company_id = request.POST.get('company')
        
        if not company_id:
            messages.error(request, "Por favor, selecione uma empresa.")
            return render(request, 'home/adicionar_cliente.html', {'companies': companies, 'tipos_servico': tipos_servico})
        
        company = Company.objects.get(id=company_id)

        cliente = Cliente(nome=nome, descricao=descricao, foto=foto, company=company)
        cliente.save()

        # Buscar a instância do tipo de serviço pelo ID
        tipo_servico = TipoServico.objects.get(id=tipo_servico_id)
        
        # Adicione o tipo de serviço
        servico = Servico(cliente=cliente, tipo=tipo_servico)
        servico.save()

        messages.success(request, "Cliente adicionado com sucesso!")
        return redirect(reverse('home:lista_clientes'))
    return render(request, 'home/adicionar_cliente.html', {'companies': companies, 'tipos_servico': tipos_servico})


class ServicoCreateView(LoginRequiredMixin, CreateView):
    model = Servico
    form_class = ServicoForm
    template_name = 'home/adicionar_servico.html'
    login_url = '/login/'

    def form_valid(self, form):
        cliente = get_object_or_404(Cliente, id=self.kwargs['cliente_id'])
        form.instance.cliente = cliente
        return super().form_valid(form)

    def get_success_url(self):
        return reverse_lazy('home:detalhe_cliente', kwargs={'pk': self.kwargs['cliente_id']})

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['cliente'] = get_object_or_404(Cliente, pk=self.kwargs['cliente_id'])
        return context

@login_required(login_url="/login/")
def editar_servico(request, id):
    servico = get_object_or_404(Servico, id=id)
    if request.method == 'POST':
        form = ServicoForm(request.POST, instance=servico)
        if form.is_valid():
            form.save()
            messages.success(request, "Serviço atualizado com sucesso!")
            return redirect('home:detalhe_cliente', cliente_id=servico.cliente.id)
        else:
            messages.error(request, "Erro ao atualizar serviço. Verifique os dados e tente novamente.")
    else:
        form = ServicoForm(instance=servico)
    return render(request, 'home/editar_servico.html', {'form': form, 'servico': servico})

class ServicoDeleteView(LoginRequiredMixin, DeleteView):
    model = Servico
    template_name = 'home/confirm_delete.html'  # Create this template for confirmation
    context_object_name = 'servico'
    login_url = '/login/'

    def get_success_url(self):
        return reverse_lazy('home:detalhe_cliente', kwargs={'pk': self.kwargs['cliente_id']})

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['cliente'] = get_object_or_404(Cliente, pk=self.kwargs['cliente_id'])
        return context

    def get_queryset(self):
        """Certifique-se de que apenas os serviços do cliente correto possam ser excluídos."""
        return Servico.objects.filter(cliente_id=self.kwargs['cliente_id'])


