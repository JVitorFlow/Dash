# -*- encoding: utf-8 -*-
from django.contrib import admin
from .models import Cliente, Servico, Atividade, Company, Status, TipoServico, StatusProject, Project

@admin.register(Cliente)
class ClienteAdmin(admin.ModelAdmin):
    list_display = ('nome', 'slug', 'criado_em', 'atualizado_em')
    search_fields = ('nome', 'descricao')
    prepopulated_fields = {"slug": ("nome",)}

@admin.register(Servico)
class ServicoAdmin(admin.ModelAdmin):
    list_display = ('tipo', 'cliente', 'descricao', 'criado_em', 'atualizado_em')
    search_fields = ('tipo__nome', 'cliente__nome', 'descricao')
    list_filter = ('tipo', 'cliente')

@admin.register(Atividade)
class AtividadeAdmin(admin.ModelAdmin):
    list_display = ('descricao', 'status', 'cliente', 'criado_em', 'atualizado_em')
    list_filter = ('status', 'criado_em', 'atualizado_em')
    search_fields = ('descricao', 'cliente__nome')

@admin.register(TipoServico)
class TipoServicoAdmin(admin.ModelAdmin):
    list_display = ('nome',)
    search_fields = ('nome',)

@admin.register(Status)
class StatusAdmin(admin.ModelAdmin):
    list_display = ('nome',)
    search_fields = ('nome',)

@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = ('name',)
    search_fields = ('name',)

@admin.register(StatusProject)
class StatusProjectAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug')
    search_fields = ('name',)

@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ('name', 'status', 'client', 'created_at', 'updated_at')
    list_filter = ('status', 'client')
    search_fields = ('name', 'client__nome')

