# Generated by Django 5.0.7 on 2024-08-06 12:28

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('home', '0005_remove_project_bot_id_alter_project_status'),
    ]

    operations = [
        migrations.AddField(
            model_name='project',
            name='priority',
            field=models.CharField(choices=[('Baixa', 'Baixa'), ('Média', 'Média'), ('Alta', 'Alta')], default='Média', max_length=10),
        ),
    ]