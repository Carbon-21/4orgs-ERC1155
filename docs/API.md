# Documentação da API

Cada rota criada para o backend deve ser documentada aqui, bem como os atributos exigidos, quem pode ter acesso a ela e cenários que devem ser implementados e testados.
Cenários implementados devem ser marcados com 🟢 e os não implementados com 🔴.

## Autenticação

- Getsalt
  - Descrição: retorna sal para que usuário performe o PHS
  - Argumentos:
    - email (email)
    - isSignUp (bool)
  - Cenários válidos:
    - Login com email correspondente a usuário existente e com status "active" 🟢
    - Login com email inexistente ou correpondente a usuário que não está com status "active" => retorna weededSalt 🟢
    - Sign up com email já cadastrado e com status "registering" 🟢
  - Cenários inválidos:
    - Sign up com email já cadastrado e status "active" 🟢
  - Observação: status "registering" existe quando usuário inicia processo de signup (getsalt com isSignUp == true), mas não o finaliza
- Login

  - Descrição: autentica usuário, retornando jwt
  - Argumentos:
    - username (email)
    - password (obs: campo enviado pelo front é bcrypt (senha inserida, salt))
  - Cenários válidos:
    - Email e senha corretos, correspondentes a um usuário com status "active" 🟢
  - Cenários inválidos:
    - Uso de email inexistente no DB ou correspondente a usuário não ativo (terá recebido weededSalt previamente) 🟢
    - Email válido, mas senha incorreta 🟢

- Sign up
  - Descrição: registra usuário no sistema
  - Argumentos:
    - name
    - email (email)
    - nome
    - cpf
    - password
  - Cenários válidos:
    - Registrar com email e CPF não cadastrados 🟢
    - Registrar mesmo após ter iniciado o registro (inserção do email => criação de usuário no DB com status "registering"), saído e voltado 🟢
  - Cenários inválidos:
    - Registrar com email já cadastrado 🟢
    - Registrar com CPF já cadastrado 🟢
  - Observação: implementar captcha para impedir mineração de usuários cadastrados. No login não precisa, pois email incorreto não é alegado (o usuário receb um weededSalt ao invés de um salt) 🔴

## Chaincode

### Invokes

- TransferFrom

  - Descrição: transfere ativos de um usuário a outro
  - Argumentos:
    - tokenId
    - tokenAmount (int)
    - tokenSender (email)
    - tokenReceiver (email)
  - Autorizados: dono do ativo a ser transferido
  - Cenários válidos:
  - Cenários inválidos:

- Mint
  - Descrição: emite certa quantidade de um ativo para um usuário
  - Argumentos:
    - tokenId
    - tokenAmount (int)
    - tokenReceiver (email)
  - Autorizados: admin
  - Cenários válidos:
  - Cenários inválidos:
    - Usuário inválido
    -
- SetURI
  - Descrição: cria URL para um ativo
  - Argumentos:
    - tokenId
    - URI (URL)
  - Autorizados: admin
  - Cenários válidos:
  - Cenários inválidos:
  - Observação: deixará de existir, não precisar detalhar os cenários por ora

### Queries

- BalanceOf

  - Descrição: checa o balanço de um token para um usuário
  - Argumentos:
    - tokenId
    - tokenOwner (email)
  - Autorizados:
  - Cenários válidos:
  - Cenários inválidos:

- SelfBalance

  - Descrição: checa seu balanço de um token
  - Argumentos:
    - tokenId
  - Autorizados:
  - Cenários inválidos:
  - Observação: antigo ClientAccountBalance

- TotalSupply

  - Descrição: checa a quantidade existente de dado token
  - Argumentos:
    - tokenId
  - Autorizados:
  - Cenários válidos:
  - Cenários inválidos:

- GetURI
  - Descrição: retorna URL de um ativo
  - Argumentos
    - tokenId
  - Autorizados: admin
  - Cenários inválidos:
  - Cenários válidos:
  - Observação: deixará de existir, não precisar detalhar os cenários por ora
