from django.db import models
from apps.home.models import TipoServico, Cliente

class EmpresasOmini(models.Model):
    nome = models.CharField(max_length=255)
    timezone = models.CharField(max_length=50)
    external_id = models.CharField(max_length=255, unique=True)  # ID da empresa na API externa

    def __str__(self):
        return self.nome
    
    

class PerfilUsuario(models.Model):
    nome = models.CharField(max_length=255)

    def __str__(self):
        return self.nome


class Licenca(models.Model):
    STATUS_CHOICES = [
        ('ativo', 'Ativo'),
        ('inativo', 'Inativo'),
    ]
    empresa = models.ForeignKey(EmpresasOmini, on_delete=models.CASCADE, related_name='licencas')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='ativo')
    data_criacao = models.DateTimeField(auto_now_add=True)
    data_atualizacao = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.empresa.nome} - {self.status}"
    


class CanalOmini(models.Model):
    nome = models.CharField(max_length=255)

    def __str__(self):
        return self.nome
    
class Bot(models.Model):
    STATUS_CHOICES = [
        ('ligado', 'Ligado'),
        ('desligado', 'Desligado'),
    ]

    nome = models.CharField(max_length=255)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='desligado')
    tipo = models.ForeignKey(TipoServico, on_delete=models.SET_NULL, null=True)  # Referência ao modelo Tipo servico
    bot_id = models.CharField(max_length=255, null=True, blank=True) 
    cliente = models.ForeignKey(Cliente, on_delete=models.CASCADE, related_name='bots', null=True, blank=True)
    canais = models.ManyToManyField(CanalOmini, blank=True)
    data_criacao = models.DateTimeField(auto_now_add=True)
    data_atualizacao = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.nome
    
class BotCanal(models.Model):
    bot = models.ForeignKey(Bot, on_delete=models.CASCADE, related_name='bot_canais')
    canal = models.ForeignKey(CanalOmini, on_delete=models.CASCADE)
    numero = models.CharField(max_length=15, blank=True, null=True)
    status = models.CharField(max_length=10, choices=[('ligado', 'Ligado'), ('desligado', 'Desligado')], default='desligado')

    def __str__(self):
        return f'{self.bot.nome} - {self.canal.nome} - {self.status}'

class LicencaUsuario(models.Model):
    nome = models.CharField(max_length=255)
    email = models.EmailField()
    empresa = models.ForeignKey(EmpresasOmini, on_delete=models.CASCADE, related_name='licenca_usuarios')
    licenca = models.ForeignKey(Licenca, on_delete=models.CASCADE, related_name='licenca_usuarios')
    status = models.BooleanField(default=True) 
    perfil = models.ForeignKey(PerfilUsuario, on_delete=models.CASCADE, null=True, blank=True)
    data_criacao = models.DateTimeField(auto_now_add=True)
    data_atualizacao = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.nome

class Ura(models.Model):
    nome = models.CharField(max_length=255)
    status = models.CharField(max_length=10, choices=Bot.STATUS_CHOICES, default='desligado')
    ura_id = models.CharField(max_length=255)  # ID da URA na Ligo
    cliente = models.ForeignKey(Cliente, on_delete=models.CASCADE, related_name='uras', null=True, blank=True)
    ativa = models.BooleanField(default=True) 
    data_criacao = models.DateTimeField(auto_now_add=True)
    data_atualizacao = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.nome


class Rpa(models.Model):
    nome = models.CharField(max_length=255)
    status = models.CharField(max_length=10, choices=Bot.STATUS_CHOICES, default='desligado')
    cliente = models.ForeignKey(Cliente, on_delete=models.CASCADE, related_name='rpas', null=True, blank=True)
    data_criacao = models.DateTimeField(auto_now_add=True)
    data_atualizacao = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.nome