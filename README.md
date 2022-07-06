# CARBON21

## Notas
A identificação do cliente agora é feita com o ClientID, que pode ser obtido por meio da função ClientAccountID do chaincode. Este clientID é o endereço para o qual os tokens devem ser enviados, emitidos etc.

### Funções atualmente suportadas:
- Invoke  
      - Mint  
      - TransferFrom  
      - ClientAccountBalance  
      - ClientAccountID  
- Query  
      - BalanceOf  

### Outras alterações  
O ID do token foi modificado, deixando de ser um int64 para ser string. Assim fica mais amigável a operação (agora dá pra mintar $ylvas ao invés de "1"). Nos testes realizados até agora não identifiquei nenhum problema com isso, mas é importante uma verificação e testes mais detalhados.  
      
---
