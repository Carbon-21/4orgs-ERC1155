# CARBON21

## Notas Atualização 08-07-22
Adicionado suporte à geração de certificados via CSR. Agora, ao chamar o /signup deve ser informado no corpo da chamada a chave booleana csr, que indicará se o mecanismo de geração local da chave privada deve ou não ser utilizado.  
Caso o csr seja _true_, a API irá gerar uma chave privada ECDSA 256 bits e, a partir dela, irá gerar também um _Certificate Sign Request_. Esse csr é então passado como parâmetro à chamada enroll. A CA, por sua vez, assina o csr e retorna o certificado, sem ter conhecimento da chave do usuário.  
Caso o csr seja _false_, o procedimento padrão é adotado, no qual a geração da chave privada é feita pela CA durante o enroll e retornada à API.

Por fim, a API adiciona as credenciais geradas à carteira do usuário, como no exemplo abaixo:
```
{
    "credentials":
    {
        "certificate":"-----BEGIN CERTIFICATE-----   CERTIFICADO   -----END CERTIFICATE-----\n",
        "privateKey":"-----BEGIN EC PRIVATE KEY-----   CHAVE PRIVADA   -----END EC PRIVATE KEY-----\n"
    },
    "mspId":"CarbonMSP",
    "type":"X.509",
    "version":1
}
```
---
## Notas
A identificação do cliente agora é feita com o ClientID, que pode ser obtido por meio da função ClientAccountID do chaincode. Este clientID é o endereço para o qual os tokens devem ser enviados, emitidos etc.

### Assinatura das funções atualmente suportadas:
- Invoke    
      
     - Mint(ctx contractapi.TransactionContextInterface, account string, id string, amount uint64) error
     - TransferFrom(ctx contractapi.TransactionContextInterface, sender string, recipient string, id string, amount uint64) error 
     - ClientAccountBalance(ctx contractapi.TransactionContextInterface, id string) (uint64, error)
     - ClientAccountID(ctx contractapi.TransactionContextInterface) (string, error)  
      
- Query  
      
     - BalanceOf(ctx contractapi.TransactionContextInterface, account string, id string) (uint64, error)
      

### Outras alterações  
O ID do token foi modificado, deixando de ser um int64 para ser string. Assim fica mais amigável a operação (agora dá pra mintar $ylvas ao invés de "1"). Nos testes realizados até agora não identifiquei nenhum problema com isso, mas é importante uma verificação e testes mais detalhados.  

### Passo a passo do usuário
- Faz o enroll  
- Com o token gerado faz uma chamada para ClientAccountID para obter seu ID
- Com o token e o ClientID, pode fazer as operações de mint (se for usuário da carbon), transfer, burn etc.
      
---

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
