# Generated by Django 5.0.7 on 2024-08-06 13:24

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('home', '0006_project_priority'),
    ]

    operations = [
        migrations.AddField(
            model_name='project',
            name='data_entrega',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='project',
            name='responsavel',
            field=models.CharField(default='Não atribuído', max_length=255),
        ),
    ]