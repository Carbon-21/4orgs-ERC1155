# Carbon21 Database

Este repositório contém:

- Definição das tabelas usadas no BD MySQL
- Definição dos triggers usados no BD MySQL
- Instruções para uso do sequelize-auto, pacote nodejs que cria modelos sequelize para tabelas de um DB
  <br>
  <br>

## Sequelize-auto

Com o MySQL funcionando, rodar dentro do diretório `sequelize-auto`: <br>

` node node_modules/sequelize-auto/bin/sequelize-auto -o "./models" -h localhost -e mysql --caseModel c --caseProp c -d [bd] -u [usuário] -x [senha] -p [porta] [-t specific_table_else_all]`

_Nota: o comando -t é opcional e deve ser usado caso se deseje criar o modelo sequelize de apenas uma tabela específica._
