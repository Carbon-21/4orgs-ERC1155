# CARBON21

## Como rodar
### Clonando repositorio
```
git clone --single-branch -b develop https://github.com/Carbon-21/4orgs-ERC1155.git
cd 4orgs-ERC1155
```

### Pré-requisitos

Para instalar os pré-requisitos:
```
chmod +x ./installPreReq
./installPreReq
```
_Nota: Aconselhavel reiniciar a maquina ao fim das instalações_

Obtenção dos Samples do Hyperledger Fabric
```
chmod +x ./obtainSamples
./obtainSamples
```

Atribuição ao path
```
chmod +x ./atribuiPath
./atribuiPath
```
_Notas desse script: Executar esse script de atribuição estando logado como root e como 'usuario normal' para vincular ao path de ambos_

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
<br><br>


ATUALIZAÇÃO: Para gerar os materiais criptográficos (par de chaves e CSR) do lado do cliente, é preciso instalar o browserify, que une códigos com suas dependências em um único arquivo (<i>bundle.js</i>). Para isso, rode o script <i>install-dependencies</i> (Ao rodar o init, esse script já é chamado automaticamente).
<br>
<br>
### Browserify

O browserify já é chamado automaticamente ao rodar o script <i>init</i>. Entretanto, toda vez que o script relacionado à geração de chaves e CSR (<i>crypto-generator.js</i>) for alterado, é necessário utilizar chamar o browserify novamente. Para isso, na pasta da api-2.0, execute o seguinte comando:

```
browserify ./public/browser-src/crypto-generator.js > ./public/dist/bundle.js -t babelify
```

### Geração de material criptográfico
A rota para testar a geração de materiais criptográficos é: [localhost:4000/generateCrypto](http://localhost:4000/generateCrypto)

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

## Todo

- [x] Remover vulnerabilidades da API
- [ ] Documentar instalação dos pré-requisitos
- [ ] Modificar as funções batch do chaincode de modo a corrigir a identificação do operador
- [ ] Adicionar suporte à função que permite aprovar novos operadores para uma conta
      <br><br>
