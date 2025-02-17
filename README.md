# API da Tabela do Brasileirão 2024

Esta é uma API desenvolvida em Node.js com Express, que fornece informações sobre a tabela do Brasileirão 2024. A API permite filtrar times por posição, mínimo de pontos, visualizar detalhes de um time específico, além de permitir a adição, alteração e remoção de times. O projeto utiliza SQL Server como banco de dados e o Zod para validação dos requests.

## Tecnologias Utilizadas

- **Node.js**: Ambiente de execução JavaScript.
- **Express**: Framework para construção de APIs em Node.js.
- **SQL Server**: Banco de dados relacional para armazenamento dos dados.
- **Zod**: Biblioteca para validação de schemas e requests.

## Funcionalidades

- **Listar todos os times**: Retorna a tabela completa do Brasileirão 2024.
- **Filtrar por posição**: Retorna os times com base na posição na tabela.
- **Filtrar por mínimo de pontos**: Retorna os times que possuem um número mínimo de pontos.
- **Detalhes de um time específico**: Retorna todas as informações de um time específico.
- **Adicionar um novo time**: Permite a adição de um novo time à tabela.
- **Alterar informações de um time**: Permite a atualização das informações de um time existente.
- **Remover um time**: Remove um time da tabela.

## Como Usar

### Instalação

1. Clone o repositório:

   ```bash
   git clone https://github.com/CaioSilvaCampos/Tabela-Brasileirao-2024.git
2. Navegue até o diretório do projeto:
  ```bash
   cd Tabela-Brasileirao-2024
  ```
3. Instale as dependências
   ```bash
   npm install
   ```
4. Configure o arquivo .env com as credenciais do seu banco de dados SQL Server:
  ```bash
  DB_HOST=seu-host
  DB_USER=seu-usuario
  DB_PASSWORD=sua-senha
  DB_DATABASE=nome-do-banco-de-dados
```
5. Inicie o servidor com o npm run app.
   
