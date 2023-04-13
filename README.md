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

_Nota 2: caso você veja erros no output do comando init, veja se há uma pasta chamada genesis.block em ./artifacts/channel/. Se houver, delete ela. Trata-se de uma pasta intermediária que não deveria existir e pode não ter sido deletada adequadamente._
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

Algumas chamadas do CC só são permitidos a usuários admin. Um usuário administrador é criado ao inicializar-se o programa Node. Login e senha são:
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

O blockchain explorer permite a visualização de informações da rede. Para executá-lo:

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

<br><br>

## Desenvolvimento

Notas importante sobre o desenvolvimento
<br><br>

### Frontend

- Ao desenvolver código javascript que será rodado no navegador do usuário, modificar os arquivos localizados em `./api-2.0/public/scripts/src/`. Não modificar as réplicas contidas em os `./api-2.0/public/scripts/`.
- Não colocar endereço e porta hardcodeds, utilizar o padrão: `https://${HOST}:${PORT}/rota/desejada`
- Após modificar um arquivo javascript do frontend, rodar `./get-bundles` dentro de `./api-2.0`. Isso fará com que HOST e PORT sejam modificados nos javascripts finais (`./api-2.0/public/scripts/`), de acordo como os valores configurados em `./api-2.0/.env`.
