from django.contrib import admin
from .models import EmpresasOmini, PerfilUsuario, Licenca, CanalOmini, Bot, BotCanal, LicencaUsuario, Ura, Rpa

@admin.register(EmpresasOmini)
class EmpresasOminiAdmin(admin.ModelAdmin):
    list_display = ('nome', 'timezone', 'external_id')
    search_fields = ('nome', 'external_id')

@admin.register(PerfilUsuario)
class PerfilUsuarioAdmin(admin.ModelAdmin):
    list_display = ('nome',)
    search_fields = ('nome',)

@admin.register(Licenca)
class LicencaAdmin(admin.ModelAdmin):
    list_display = ('empresa', 'status', 'data_criacao', 'data_atualizacao')
    search_fields = ('empresa__nome', 'status')
    list_filter = ('status', 'data_criacao', 'data_atualizacao')

@admin.register(CanalOmini)
class CanalOminiAdmin(admin.ModelAdmin):
    list_display = ('nome',)
    search_fields = ('nome',)

@admin.register(Bot)
class BotAdmin(admin.ModelAdmin):
    list_display = ('nome', 'status', 'tipo', 'bot_id', 'cliente', 'data_criacao', 'data_atualizacao')
    search_fields = ('nome', 'bot_id', 'cliente__nome', 'tipo__nome')
    list_filter = ('status', 'tipo', 'data_criacao', 'data_atualizacao')

@admin.register(BotCanal)
class BotCanalAdmin(admin.ModelAdmin):
    list_display = ('bot', 'canal', 'numero', 'status')
    search_fields = ('bot__nome', 'canal__nome', 'numero')
    list_filter = ('status',)

@admin.register(LicencaUsuario)
class LicencaUsuarioAdmin(admin.ModelAdmin):
    list_display = ('nome', 'email', 'empresa', 'licenca', 'status', 'perfil', 'data_criacao', 'data_atualizacao')
    search_fields = ('nome', 'email', 'empresa__nome', 'licenca__empresa__nome', 'perfil__nome')
    list_filter = ('data_criacao', 'status', 'data_atualizacao')

@admin.register(Ura)
class URAAdmin(admin.ModelAdmin):
    list_display = ('nome', 'status', 'ura_id', 'cliente', 'ativa', 'data_criacao', 'data_atualizacao')
    search_fields = ('nome', 'ura_id', 'cliente__nome')
    list_filter = ('status', 'ativa', 'data_criacao', 'data_atualizacao')

@admin.register(Rpa)
class RPAAdmin(admin.ModelAdmin):
    list_display = ('nome', 'status', 'cliente', 'data_criacao', 'data_atualizacao')
    search_fields = ('nome', 'cliente__nome')
    list_filter = ('status', 'data_criacao', 'data_atualizacao')