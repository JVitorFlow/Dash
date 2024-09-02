FROM python:3.11

# Definir o diretório de trabalho no contêiner
WORKDIR /app

# Copiar os arquivos necessários para o diretório de trabalho
COPY . /app

# Definir variáveis de ambiente
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Instalar dependências do sistema necessárias (como psycopg2-binary)
RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    && apt-get clean

# Instalar dependências Python
RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

# Executar collectstatic se o projeto usar arquivos estáticos
RUN python manage.py collectstatic --noinput

# Definir o comando de execução do Gunicorn
CMD ["gunicorn", "--config", "gunicorn-cfg.py", "core.wsgi"]
