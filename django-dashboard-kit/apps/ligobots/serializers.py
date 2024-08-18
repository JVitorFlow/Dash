from rest_framework import serializers
from .models import EmpresasOmini, PerfilUsuario, Licenca, CanalOmini, Bot, BotCanal, LicencaUsuario, Ura, Rpa

class EmpresasOminiSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmpresasOmini
        fields = '__all__'

class PerfilUsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = PerfilUsuario
        fields = '__all__'

class LicencaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Licenca
        fields = '__all__'

class CanalOminiSerializer(serializers.ModelSerializer):
    class Meta:
        model = CanalOmini
        fields = '__all__'

class BotSerializer(serializers.ModelSerializer):
    class Meta:
        model = Bot
        fields = '__all__'

class BotCanalSerializer(serializers.ModelSerializer):
    class Meta:
        model = BotCanal
        fields = '__all__'

class LicencaUsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = LicencaUsuario
        fields = '__all__'

class URASerializer(serializers.ModelSerializer):
    class Meta:
        model = Ura
        fields = '__all__'

class RPASerializer(serializers.ModelSerializer):
    class Meta:
        model = Rpa
        fields = '__all__'