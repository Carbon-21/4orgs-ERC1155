# Carbon21 Database

Este repositório contém:

- Definição das tabelas usadas no BD MySQL
- Definição dos triggers usados no BD MySQL
- Instruções para uso do sequelize-auto, pacote nodejs que cria modelos sequelize para tabelas de um DB
  <br>
  <br>

## Database

### Instalação

```
chmod +x install-db
./install-db
```

Autorizar sudo e inserir senha do db quando solicitado (12345678).

Será criado um usuário carbon, com senha 12345678, bem como um banco dedados chamado carbon.

<br>

### Uso

Para iniciar o MySQL:

```
sudo systemctl start mysql
```

Para terminar o MySQL:

```
sudo systemctl stop mysql
```

_Nota: os scripts init e kill já iniciam e terminam o MySQL, respectivamente._
<br><br>
Para recriar o banco carbon (apagar todas as entradas das tabelas), inclusive o atualizando (bem como os modelos sequelize) caso haja alguma alteração em `carbon.sql`:

```
chmod +x reset-db
./reset-db
```

Dica: instalar a extensão "MySQL" do Weijan Chen, no VScode. Não é ótima mas quebra um galho.
<br><br>
