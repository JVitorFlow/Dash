# Changelog

## [Unreleased]

## [1.2.0] - 2025-02-09
### Added
- **Formulários de Validação para Intervalos de Data e Seleção de Hospital**:
  - Criados os formulários `BaseDataIntervalForm`, `DataIntervalForm` e `JornadaUraForm` para melhorar a validação de dados no sistema.
  - Implementada validação para garantir que a data inicial seja anterior à data final.
- **View Melhorada para Jornada URA**:
  - Refatoração da `UraJornadaView`, com melhor separação de responsabilidades e validação aprimorada.
  - Adicionada lógica para mapeamento dinâmico do `code_flow_ivr` com base no hospital selecionado.
- **Integração com Leia IA**:
  - Adicionada funcionalidade para capturar informações da API Leia IA, com formatação de datas e tratamento de erros.

### Changed
- **Centralização de Requisições POST**:
  - Refatorado `services.py` para criar uma função genérica para requisições POST, reduzindo redundância de código.
- **Ajuste de Logs**:
  - Alterado o nível de log do console para `INFO` e simplificado o formato de saída.
- **Parâmetro `code_flow_ivr`**:
  - Atualizado o uso do parâmetro `code_flow_ivr` na integração com a API de URA.

### Fixed
- **Correção de Botões HTML**:
  - Alterado o tipo de alguns botões para `submit` em templates relevantes, garantindo o comportamento esperado.
- **Campo de Data Atualizado**:
  - Atualizado o campo de data nos formulários HTML para o tipo `datetime-local`.
- **Correção na destruição da DataTable**:
  - Ajustado o fluxo para evitar o erro `Cannot read properties of null (reading 'parentNode')` ao destruir e recriar a tabela.

### Removed
- **Arquivos de Teste Não Utilizados**:
  - Removidos arquivos `tests.py` obsoletos para manter o repositório mais limpo e organizado.

## [1.1.0] - 2024-08-28
### Added
- **Criação do Gráfico de Desempenho para KPI 1201**: Implementado um novo gráfico para medir o desempenho do KPI 1201.
- **Estrutura de Dados para KPI 1104**: Ajustes realizados na estrutura dos dados do KPI 1104 para permitir aninhamento de informações, facilitando futuras expansões e integrações.
- **Busca Dinâmica para KPI 1202**: Implementada lógica para porcentagem e busca de informações dinâmicas no indicador do KPI 1202, garantindo que as informações estejam sempre atualizadas.

### Fixed
- Correção em exibições incorretas de URAs no KPI 1204 após ajustes na estrutura dos dados.

## [1.0.4] - 2024-08-26
### Added
- **Cálculo Revisado para KPI 1101**: Melhorias no cálculo do KPI 1101, otimizando a precisão das métricas.
- **Novo Gráfico de Desempenho**: Implementado gráfico para acompanhar o desempenho relacionado ao KPI 1101 e KPI 1104.
- **Ajustes em Cálculos de Abandonos para KPI 1102**: Modificações no cálculo de chamadas abandonadas para fornecer resultados mais precisos.

## [1.0.3] - 2024-08-22
### Changed
- **Melhorias nos Cálculos dos KPIs 1101 e 1102**: Refinamento nos cálculos para melhorar a precisão dos resultados apresentados.
- **Integração de Novo Sidebar**: Introduzido um novo sidebar para facilitar a navegação entre os KPIs.
- **Gráfico de Colunas**: Aumentada a versatilidade do gráfico de colunas para suportar tanto KPI 1101 quanto 1102.

## [1.0.2] - 2024-08-20
### Added
- **Separacão dos Scripts para KPIs**: Separados scripts para cálculos dos KPIs (1101, 1102, 1104, 1201), melhorando a modularidade e organização do código.

## [1.0.1] - 2024-08-18
### Added
- **Desenvolvimento Inicial para KPIs**: Implementação inicial completa para os KPIs 1101, 1102, 1104 e 1201, com as principais funcionalidades e cálculos.

