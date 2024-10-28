# -*- encoding: utf-8 -*-

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),          
    path("", include("apps.authentication.urls")), 
    path("", include("apps.home.urls")),
    path('ligobots/', include('apps.ligobots.urls', namespace='ligobots')),
    path('relatorios/', include('apps.relatorios.urls', namespace='relatorios')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)