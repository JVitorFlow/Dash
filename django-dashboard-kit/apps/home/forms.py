from django import forms
from .models import Cliente, Servico, Atividade, Project, StatusProject, TipoServico
from crispy_forms.helper import FormHelper
from crispy_forms.layout import Submit

class ClienteForm(forms.ModelForm):
    class Meta:
        model = Cliente
        fields = ['nome', 'descricao', 'foto']

class ClienteFilterForm(forms.Form):
    nome = forms.CharField(required=False, label='Nome')
    descricao = forms.CharField(required=False, label='Descrição')
    servico = forms.ModelChoiceField(
        queryset=TipoServico.objects.all().distinct(),
        required=False,
        label='Serviço',
        widget=forms.Select(attrs={'class': 'form-control'})
    )

class ServicoForm(forms.ModelForm):
    class Meta:
        model = Servico
        fields = ['tipo', 'descricao']

class AtividadeForm(forms.ModelForm):
    class Meta:
        model = Atividade
        fields = ['descricao', 'status']  # Include other fields as necessary

    def __init__(self, *args, **kwargs):
        super(AtividadeForm, self).__init__(*args, **kwargs)
        self.fields['descricao'].initial = ''
        self.fields['status'].initial = ''


class StatusProjectForm(forms.ModelForm):
    class Meta:
        model = StatusProject
        fields = ['name']

class ProjectForm(forms.ModelForm):
    class Meta:
        model = Project
        fields = ['name', 'status', 'client', 'priority', 'responsavel', 'data_entrega']
        widgets = {
            'data_entrega': forms.DateTimeInput(attrs={'type': 'datetime-local'})
        }