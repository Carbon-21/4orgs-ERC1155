# Documentação da API

Cada rota criada para o backend deve ser documentada aqui, bem como os atributos exigidos, quem pode ter acesso a ela e cenários que devem ser verificados.

## Autenticação

- Getsalt
- Login
- Sign up

## Chaincode

### Invokes

- TransferFrom

  - Descrição: transfere ativos de um usuário a outro
  - Argumentos:
    - "tokenId"
    - "tokenAmount" (int)
    - "tokenSender" (email)
    - "tokenReceiver" (email)
  - Acesso: dono do ativo a ser transferido
  - Cenários

- Mint
  - Descrição: emite certa qunatidade de um ativo para um usuário
  - Argumentos:
    - "tokenId"
    - "tokenAmount" (int)
    - "tokenReceiver" (email)
  - Acesso: admin
  - Cenários
    - Usuário inválido
    -
- SetURI
  - Descrição: cria URL para um ativo
  - Argumentos:
    - "tokenId"
    - "URI" (URL)
  - Acesso: admin
  - Cenários

### Queries

- BalanceOf

  - Descrição: checa o balanço de um token para um usuário
  - Argumentos:
    - tokenId
    - tokenOwner (email)
  - Acesso:
  - Cenários

- SelfBalance

  - Descrição: checa seu balanço de um token
  - Argumentos:
    - tokenId
  - Acesso:
  - Cenários
  - Observação: antigo ClientAccountBalance

- TotalSupply

  - Descrição: checa a quantidade existente de dado token
  - Argumentos:
    - tokenId
  - Acesso:
  - Cenários

- GetURI
  - Descrição: retorna URL de um ativo
  - Argumentos
    - tokenId
  - Acesso: admin
  - Cenários
