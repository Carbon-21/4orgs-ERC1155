# CARBON21

## Instalação

Para clonar o repositório:
```
git clone --single-branch -b develop https://github.com/Carbon-21/4orgs-ERC1155.git
cd 4orgs-ERC1155
```

<br>

Para instalar as dependências do fabric:

```
chmod +x ./dependencies_install
./dependencies_install
```

Reinicie a máquina para garantir que o usuário foi adicionado ao grupo docker. 
<br>
<br>
Em seguida, para instalar o fabric:
```
chmod +x ./install
./install
```
Por fim, configure o banco de dados de usuários, conforme a seção "instalação" do ./database/README
<br><br>

## Como Usar
### Rede

Para subir a rede:

```
chmod +x init
./init
```

<br>
Para matar a rede, sem subir uma nova:

```
./kill
```

_Nota: o script init também roda o kill, e ambos matam qualquer conatiner docker previamente ativo!_
<br>
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
