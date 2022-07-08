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
