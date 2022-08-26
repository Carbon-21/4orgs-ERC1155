# CARBON21

## Como rodar

### Clonando o repositorio

```
git clone --single-branch -b develop https://github.com/Carbon-21/4orgs-ERC1155.git
cd 4orgs-ERC1155
```

<br>

### Pré-requisitos

Para instalar os pré-requisitos:

```
chmod +x ./installPreReq
./installPreReq
```

_Nota: Aconselhavel reiniciar a maquina ao fim das instalações_
<br><br>

Obtenção dos Samples do Hyperledger Fabric

```
chmod +x ./obtainSamples
./obtainSamples
```

<br>

Atribuição ao path

```
chmod +x ./atribuiPath
./atribuiPath
```

_Notas desse script: Executar esse script de atribuição estando logado como root e como 'usuario normal' para vincular ao path de ambos_
<br><br>
Por fim, certifique-se de que configurou o banco de dados de usuários, conforme ./database/README
<br><br>

### Rede

Para subir a rede:

```
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

<br>

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

<br>

### Blockchain explorer

Para executar o blockchain explorer:

```
cd Explorer
./run.sh
```

_Nota: Após a execução do script, abrir o navegador e ir para http://localhost:8080, e acessar com admin/adminpw_

<br>

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
