# Generated by Django 5.0.7 on 2024-08-14 19:17

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('ligobots', '0005_ura_ativa'),
    ]

    operations = [
        migrations.AddField(
            model_name='licencausuario',
            name='status',
            field=models.BooleanField(default=True),
        ),
    ]
