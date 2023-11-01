# CARBON21

## Instalação

Para clonar o repositório:

```sh
git clone --single-branch -b develop https://github.com/Carbon-21/4orgs-ERC1155.git
cd 4orgs-ERC1155
```

Para instalar as dependências do Hyperledger Fabric:

```sh
chmod +x ./dependencies_install
./dependencies_install
```

Reinicie a máquina para garantir que o usuário foi adicionado ao grupo docker e em seguida execute o comando abaixo para instalar o Hyperledger Fabric:

```sh
chmod +x ./install
./install
```

### Banco de dados

As definições e passos para ter o banco de dados configurado você pode conferir no [README](./database/README.md) que está na pasta `database`.

## Como Usar

### Utilizando o sistema a primeira vez:

No diretório raiz, adicione a permissão de execução para os scripts:

```sh
chmod +x init kill
```

Inicie o sistema a primeira vez executando o comando:

```sh
./init -i
```

Finalize o sistema todo (incluindo Banco de Dados MySQL, Containers Docker - Hyperledger Fabric Blockchain ) executando o comando:

```sh
./kill -r
```

### Utilizando o sistema persistente:

Iniciar/Reiniciar o sistema executando o comando:

```sh
./init
```

Iniciar o sistema e recompilar o Bundle Javascript (Browserify):

```sh
./init -j
```

Finalizar o sistema sem reinicar o containers:

```sh
./kill
```

Finalizar o sistema forçando a reinicialização (inclusive Banco de Dados MySQL, Containers Docker - Hyperledger Fabric Blockchain ) :

```sh
./kill -r
```

:rotating_light: _Nota: o script ./init -r também roda o kill, e ambos matam qualquer container docker previamente ativo!_

Para mais informações utilize o comando `-h`:

```sh
./init -h
```

e

```sh
./kill -h
```

### API

Para subir a API:

```sh
cd api-2.0
npm install
sudo npm install -g nodemon
nodemon
```

:rotating_light: _Nota: os passos 2 e 3 (npm e sudo) não são necessários se já foram feitos antes._

### Usuário Admin

Algumas chamadas do CC só são permitidos a usuários admin. Um usuário administrador é criado ao inicializar-se o programa Node conforme as configurações das variáveis `ADMIN_LOGIN` e `ADMIN_PASSWORD` no arquivo [env](api-2.0/.env).

- Login: `admin@admin.com`
- Senha: `admin`

### Blockchain explorer

O blockchain explorer permite a visualização de informações da rede. Para executá-lo:

```sh
cd explorer
./run.sh
```

#### Como acessar

Após a execução do script, abrir o navegador e ir para http://localhost:8080.
As credenciais de admin para acessar são:

- Login: `exploreradmin`
- Senha: `exploreradminpw`

Caso tenho alguma dificuldade no acesso, verifique as configurações da variṽel `adminCredential` no arquivo [first-network](./explorer/connection-profile/first-network_2.2.json)

### Chaincode Debugging

Para compilar o CC e ver se ele não tem nenhum bug antes de dar deploy:

```sh
./cc-build
```

:rotating_light: _Nota: Lembre de rodar o script init após alterar o CC, para fazer o deploy da nova versão na blockchain._

Para entrar no terminal do docker do carbon-cc, permitindo ver prints colocados no CC:

```sh
./cc-debug
```

## Desenvolvimento

### Git

Para atualizar os arquivos locais (pull) e criar um novo branch para trabalhar:

```sh
./git-branch <nome_do_branch>
```

Para dar push direto para o branch em que se encontra:

```sh
./git-push <mensagem_de_commit>
```

### Frontend

- Ao desenvolver código Javascript que será rodado no navegador do usuário, modificar os arquivos localizados em `./api-2.0/public/scripts/src/`. Não modificar as réplicas contidas em os `./api-2.0/public/scripts/`.
- Não colocar endereço e porta hardcodeds, utilizar o padrão: `https://${HOST}:${PORT}/rota/desejada`
- Após modificar um arquivo Javascript do frontend, rodar `./get-bundles` dentro de `./api-2.0`. Isso fará com que HOST e PORT sejam modificados nos javascripts finais (`./api-2.0/public/scripts/`), de acordo como os valores configurados em `./api-2.0/.env`.

## Roadmap

Você pode saber mais sobre o planejamento e o que estã sendo desenvolvido no projeto [aqui](https://github.com/orgs/Carbon-21/projects/1).
