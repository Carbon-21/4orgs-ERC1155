# CARBON21
## Como rodar

### Rede

Para subir a rede:

```
git clone --single-branch -b develop https://github.com/Carbon-21/4orgs-ERC1155.git
cd 4orgs-ERC1155
chmod +x init
./init
```

_Nota: o script init irá matar qualquer docker previamente ativo!_

<br>
Para matar a rede, sem subir uma nova:

```
./kill
```

<br>

### API

Para subir a api:

```
cd api-2.0
npm install
sudo npm install -g nodemon
nodemon
```

_Nota: os passos 2 e 3 não são necessários se já foram feitos antes._
<br><br>

### Git

Para atualizar os arquivos locais (pull) e criar um novo branch para trabalhar:

```
./git-branch <nome_do_branch>
```

<br>

Para dar push direto para o branch em que se encontra:

```
./git-push <mensagem_de_commit>
```

<br><br>

### Blockchain explorer

Para executar o blockchain explorer:

```
cd Explorer
./run.sh
```

_Nota: Após a execução do script, abrir o navegador e ir para http://localhost:8080, e acessar com admin/adminpw_

<br><br>

### Chaincode Debugging

Para compilar o CC e ver se ele não tem nenhum bug antes de dar deploy:

```
./cc-build
```

Para entrar no terminal do docker do carbon-cc, permitindo ver prints colocados no CC:

```
./cc-debug
```

<br>

## Identificação do Operador

- Os dados do certificado do operador são passados pela API para o chaincode quando uma chamada é feita.
- O chaincode faz o decode e extrai o "CN" (Common Name) do certificado e o utiliza como "operator" na transação "TransferFrom". Assim, "operator" == "owner", permitindo a movimentação dos tokens.
  <br><br>

## Todo

- [x] Remover vulnerabilidades da API
- [ ] Documentar instalação dos pré-requisitos
- [ ] Modificar as funções batch do chaincode de modo a corrigir a identificação do operador
- [ ] Adicionar suporte à função que permite aprovar novos operadores para uma conta
      <br><br>

## Notas

- Pacotes node modificados
  - npm: removido (vulnerável / inútil)
  - fabric-common: ^ adicionado (vulnerável)
  - fabric-client: removido (inútil / vulnerável)
  - save: removido (inútil)
  - js-yaml: removido (inútil)
  - axios: removido (inútil)
  - http: removido (inutilizado)
  - express-bearer-token:removido (inutilizado)
  - cors: removido (inutilizado)
  - express-jwt:removido (inutilizado / vulnerável)
    <br><br>

## FabricNetwork-2.x

@MAM: Usei ref abaixo como base, acrescentando uma quarta organização.

Youtube Channel: https://www.youtube.com/watch?v=SJTdJt6N6Ow&list=PLSBNVhWU6KjW4qo1RlmR7cvvV8XIILub6

Network Topology

Four Orgs(Peer Orgs)

    - Each Org have one peer(Each Endorsing Peer)
    - Each Org have separate Certificate Authority
    - Each Peer has Current State database as couch db

One Orderer Org

    - Three Orderers
    - One Certificate Authority

Steps:

1. Clone the repo
2. Run Certificates Authority Services for all Orgs
3. Create Cryptomaterials for all organizations
4. Create Channel Artifacts using Org MSP
5. Create Channel and join peers
6. Deploy Chaincode
   1. Install All dependency
   2. Package Chaincode
   3. Install Chaincode on all Endorsing Peer
   4. Approve Chaincode as per Lifecycle Endorsment Policy
   5. Commit Chaincode Defination
7. Create Connection Profiles
8. Start API Server
9. Register User using API
10. Invoke Chaincode Transaction
11. Query Chaincode Transaction
