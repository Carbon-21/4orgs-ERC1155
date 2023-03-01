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
---
### Utilizando o sistema a primeira vez:
<br>
No diretório raiz, adicione a permissão de execução para os scripts:

```
chmod +x init kill
```
<br>

Inicie o sistema a primeira vez executando o comando:
```
./init -i
```
<br>

Finalize o sistema todo (incluindo Banco de Dados MySQL, Containers Docker - Hyperledger Fabric Blockchain ) executando o comando:
```
./kill -r
```

### Utilizando o sistema persistente:

<br>

Iniciar/Reiniciar o sistema executando o comando:
```
./init
```

Iniciar o sistema e recompilar o Bundle Javascript (Browserify):
```
./init -j
```

Finalizar o sistema sem reinicar o containers:
```
./kill
```

Finalizar o sistema forçando a reinicialização (inclusive Banco de Dados MySQL, Containers Docker - Hyperledger Fabric Blockchain ) :
```
./kill -r
```

Para mais informações utilize:
```
./init -h

e

./kill -h
```

_Nota: o script ./init -r também roda o kill, e ambos matam qualquer container docker previamente ativo!_
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

### Usuário Admin

Algumas chamadas do CC só são permitidos a usuários admin. Um usuário administrador é criado assim que o primeiro usuário é registrado na plataforma (rota de signup). Login e senha são:
`admin@admin.com admin`
<br>
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
cd explorer
./run.sh
```

_Nota: Após a execução do script, abrir o navegador e ir para http://localhost:8080, e acessar com admin/adminpw_

<br>

### Chaincode Debugging

Para compilar o CC e ver se ele não tem nenhum bug antes de dar deploy:

```
./cc-build
```

_Nota: Lembre de rodar o script init após alterar o CC, para fazer o deploy da nova versão na blockchain._
<br>
<br>
Para entrar no terminal do docker do carbon-cc, permitindo ver prints colocados no CC:

```
./cc-debug
```

<br>
