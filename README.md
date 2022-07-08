# CARBON21

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
