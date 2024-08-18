from django.db import models
from django.utils.text import slugify


# Modelo da Empresa
class Company(models.Model):
    name = models.CharField(max_length=255)

    def __str__(self):
        return self.name

# Modelo de Tipo de Serviço
class TipoServico(models.Model):
    nome = models.CharField(max_length=50)

    def __str__(self):
        return self.nome

# Modelo de Status
class Status(models.Model):
    nome = models.CharField(max_length=50)

    def __str__(self):
        return self.nome
    
class StatusProject(models.Model):
    name = models.CharField(max_length=255, unique=True)
    slug = models.SlugField(unique=True, blank=True, null=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name
    
class Project(models.Model):

    PRIORITY_CHOICES = [
        ('Baixa', 'Baixa'),
        ('Média', 'Média'),
        ('Alta', 'Alta'),
    ]

    name = models.CharField(max_length=255)
    status = models.ForeignKey(StatusProject, on_delete=models.SET_NULL, null=True, blank=True)
    client = models.ForeignKey('Cliente', on_delete=models.PROTECT, related_name='projects')
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='Média')
    responsavel = models.CharField(max_length=255, default='Não atribuído')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    data_entrega = models.DateTimeField(null=True, blank=True) 

    def __str__(self):
        return self.name



# Modelo de Cliente
class Cliente(models.Model):
    company = models.ForeignKey(Company, on_delete=models.PROTECT)
    nome = models.CharField(max_length=255)
    slug = models.SlugField(unique=True, blank=True, null=True)
    descricao = models.TextField(blank=True, null=True)
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)
    foto = models.ImageField(upload_to='clientes/', blank=True, null=True)


    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.nome)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.nome

# Modelo de Serviço
class Servico(models.Model):
    tipo = models.ForeignKey(TipoServico, on_delete=models.CASCADE)
    descricao = models.TextField(blank=True, null=True)
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)
    cliente = models.ForeignKey(Cliente, related_name='servicos', on_delete=models.CASCADE, null=True, blank=True)

    def __str__(self):
        tipo_nome = self.tipo.nome if self.tipo else "Sem Tipo"
        cliente_nome = self.cliente.nome if self.cliente else "Sem Cliente"
        return f"{tipo_nome} - {cliente_nome}"


# Modelo de Atividade
class Atividade(models.Model):
    cliente = models.ForeignKey(Cliente, related_name='atividades', on_delete=models.CASCADE)
    descricao = models.TextField()
    status = models.ForeignKey(Status, on_delete=models.CASCADE)
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.descricao} - {self.status.nome}"



