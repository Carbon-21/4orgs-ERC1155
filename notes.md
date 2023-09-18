# TODO

- fazer esquema de MFS
- assinar cauda
- reorganizar estrutura IPFs: pastas com cauda + assinatura
- limpar o arquivo ipfs.js (deixar a parte de read e write sem MFS comentada ainda)
- tirar pacotes
-

# PROBLEMAS

- ipfs-mini não funciona sem o docker (kubo)
- ipfs-core funciona com ou sem kubo, mas daí o IPNS da treta (com ou sem kubo) de vez em quando?: ipns record for f5uxa3ttf4acicabciqmjb7yyqt6keh5vzvrvjlu3k4npdfyrzxpaszq7lwfswnkcmioorq could not be stored in the routing - CodeError: Query aborted
  - talvez o problema é usar VPN junto com a aplicação (init tb parece q da pau com vpn). se der pau de novo, ver se não é isso
