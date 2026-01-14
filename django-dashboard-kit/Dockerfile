# ==============================================================================
# DOCKERFILE OTIMIZADO - Django Dashboard Kit
# ==============================================================================
# Melhorias aplicadas:
# - Cache eficiente (requirements antes do código)
# - Usuário não-root (segurança)
# - Imagem menor (limpeza adequada)
# - .dockerignore para excluir arquivos desnecessários
# - Healthcheck para monitoramento
# - Porta exposta documentada
# ==============================================================================

FROM python:3.11-slim

# Metadados da imagem
LABEL maintainer="JVitorFlow"
LABEL description="Django Dashboard Kit - Production Ready"
LABEL version="1.0"

# Definir variáveis de ambiente
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Criar diretório de trabalho
WORKDIR /app

# Instalar dependências do sistema
# - libpq-dev: necessário para psycopg2
# - gcc: necessário para compilar alguns pacotes Python
# Limpar cache APT para reduzir tamanho da imagem
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Copiar APENAS requirements.txt primeiro (cache eficiente)
COPY requirements.txt /app/

# Instalar dependências Python
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copiar o restante do código
COPY . /app/

# Criar usuário não-root para rodar a aplicação (segurança)
RUN useradd -m -u 1000 appuser && \
    chown -R appuser:appuser /app

# Criar diretórios para staticfiles e media
RUN mkdir -p /app/staticfiles /app/media && \
    chown -R appuser:appuser /app/staticfiles /app/media

# Mudar para usuário não-root
USER appuser

# Expor porta do Gunicorn
EXPOSE 5005

# Healthcheck para monitoramento
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:5005/', timeout=5)" || exit 1

# Comando de execução
CMD ["gunicorn", "--config", "gunicorn-cfg.py", "core.wsgi"]
