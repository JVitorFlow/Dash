# -*- encoding: utf-8 -*-
"""
Gunicorn Configuration - Production Optimized
==============================================
Configuração otimizada para produção do Django Dashboard Kit
"""

import multiprocessing
import os

# ==============================================================================
# Server Socket
# ==============================================================================
bind = '0.0.0.0:5005'
backlog = 2048

# ==============================================================================
# Worker Processes
# ==============================================================================
# Fórmula recomendada: (2 x número_de_cores) + 1
# Para 1 CPU: 3 workers
# Para 2 CPUs: 5 workers
# Para 4 CPUs: 9 workers
workers = int(os.getenv('GUNICORN_WORKERS', multiprocessing.cpu_count() * 2 + 1))

# Tipo de worker
# - sync: padrão, bom para apps Django tradicionais
# - gevent/eventlet: para apps assíncronas
worker_class = 'sync'

# Threads por worker (para processar múltiplas requests simultâneas)
threads = int(os.getenv('GUNICORN_THREADS', 2))

# Timeout para workers (30s padrão, aumentar se tiver operações longas)
timeout = int(os.getenv('GUNICORN_TIMEOUT', 120))

# Restart workers após N requests (previne memory leaks)
max_requests = 1000
max_requests_jitter = 50

# ==============================================================================
# Logging
# ==============================================================================
accesslog = '-'  # stdout
errorlog = '-'   # stderr
loglevel = os.getenv('GUNICORN_LOG_LEVEL', 'info')  # debug, info, warning, error, critical

# Capturar output do Django
capture_output = True
enable_stdio_inheritance = True

# Log format
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(D)s'

# ==============================================================================
# Process Naming
# ==============================================================================
proc_name = 'django-dashboard-kit'

# ==============================================================================
# Server Mechanics
# ==============================================================================
# Restart workers gracefully ao receber SIGHUP
reload = False  # Não usar em produção (use CI/CD para restart)
preload_app = True  # Carrega app antes de fazer fork (economiza RAM)

# ==============================================================================
# Security
# ==============================================================================
# Limitar tamanho do header (previne ataques)
limit_request_line = 4094
limit_request_fields = 100
limit_request_field_size = 8190

# ==============================================================================
# Callbacks (opcional)
# ==============================================================================
def on_starting(server):
    """Chamado antes do master process iniciar"""
    server.log.info("Gunicorn master starting")

def on_reload(server):
    """Chamado quando server recarrega configuração"""
    server.log.info("Gunicorn reloading")

def when_ready(server):
    """Chamado após workers estarem prontos"""
    server.log.info(f"Gunicorn ready with {workers} workers")

def on_exit(server):
    """Chamado quando server está saindo"""
    server.log.info("Gunicorn shutting down")

# ==============================================================================
# Worker Lifecycle
# ==============================================================================
def worker_int(worker):
    """Chamado quando worker recebe INT/QUIT signal"""
    worker.log.info(f"Worker {worker.pid} received INT/QUIT")

def post_fork(server, worker):
    """Chamado após fazer fork do worker"""
    server.log.info(f"Worker spawned (pid: {worker.pid})")

def pre_fork(server, worker):
    """Chamado antes de fazer fork do worker"""
    pass

def pre_exec(server):
    """Chamado antes de re-executar o master"""
    server.log.info("Forked child, re-executing")

def worker_abort(worker):
    """Chamado quando worker recebe SIGABRT"""
    worker.log.warning(f"Worker {worker.pid} aborted")
