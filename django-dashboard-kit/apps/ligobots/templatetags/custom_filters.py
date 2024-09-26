from django import template
from datetime import datetime

register = template.Library()

@register.filter(name='format_date')
def format_date(iso_date):
    """Formata a data ISO para o formato DD/MM/YYYY HH:MM:SS"""
    try:
        # Remover o "Z" no final da data e converter para o formato correto
        date_obj = datetime.fromisoformat(iso_date[:-1])
        return date_obj.strftime('%d/%m/%Y %H:%M:%S')
    except ValueError:
        return iso_date  # Retorna a data original se houver erro
