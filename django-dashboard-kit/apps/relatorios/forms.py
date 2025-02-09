from django import forms

class BaseDataIntervalForm(forms.Form):
    dt_start = forms.DateTimeField(
        input_formats=['%Y-%m-%dT%H:%M'],  # Formato HTML5
        required=True,
        error_messages={'required': 'Por favor, informe a data inicial.'}
    )
    dt_finish = forms.DateTimeField(
        input_formats=['%Y-%m-%dT%H:%M'],
        required=True,
        error_messages={'required': 'Por favor, informe a data final.'}
    )

    def clean(self):
        cleaned_data = super().clean()
        dt_start = cleaned_data.get('dt_start')
        dt_finish = cleaned_data.get('dt_finish')

        if dt_start and dt_finish and dt_start >= dt_finish:
            raise forms.ValidationError("A data inicial deve ser anterior à data final.")

        return cleaned_data

class DataIntervalForm(BaseDataIntervalForm):
    pass

class JornadaUraForm(BaseDataIntervalForm):
    nm_flow_ivr = forms.ChoiceField(
        choices=[
            ('HM', 'Hospital da Mulher'),
            ('HSOR', 'Hospital Sorocaba'),
            ('HSJC', 'Hospital São José dos Campos'),
        ],
        required=True,
        error_messages={'required': 'Por favor, selecione um hospital válido.'}
    )
