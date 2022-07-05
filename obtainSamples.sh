#!/bin/bash

# obtainSamples - Script para obtencao do fabricSamples
# excluindo e colocado em um novo diretorio criado chamado fabricSamples a
# partir do diretorio atual
# -------
# Alteracao do path do para já incluir os binarios do fabric
# (Rodar com . ./obtainSamples para atribuir corretamente)
# Alteracao temporaria altera somente o bash corrente
# Alteracao permanente altera o arquivo utilizado para criacao (ainda em desenvolvimento)

obtemFabricSamples(){
        # Excluindo estrutura se ja existente
        echo Excluindo diretorios 
        sudo rm -r fabricSamples

        # Criando estrutura de diretorios
        echo Criando diretorios
        mkdir fabricSamples
        cd fabricSamples

        # Obtendo os Samples
        echo Obtendo Samples
        curl -sSL https://bit.ly/2ysbOFE | bash -s
}

adicionaPathTemp(){
	BINFABRICPATH=$(pwd)/fabricSamples/fabric-samples/bin
	PATH="${PATH:+${PATH}:${BINFABRICPATH}}"	
	echo "Adicionado ao path"
}

adicionaPathPerm(){
	echo "Funcionalidade ainda em desenvolvimento ..."
}

clear
echo  "Deseja baixar a estrutura de diretorios do sample ?( s / n)" 
echo "Uma pasta fabricSamples será criada dentro do seu diretorio atual, e se uma já existir ela será excluida !"
read simounao
if [ "$simounao" == s ]; then
	obtemFabricSamples
fi
clear
echo "Deseja atribuir os binarios do sample no path temporariamente(t), permeanentemente(p) ou sair (s) ?( t / p / s )"
echo ""
echo "Path temporario-> Ao fechar o terminal ele some,Path permantente-> persistente mesmo ao fechar do terminal"
echo "OBS 1: Este script deve estar sendo executado no mesmo nivel do diretorio dos samples e não dentro dele "
echo "OBS 2: Para o path temporario funcionar é necessario executar o script com (. ./obtainSamples.sh) com o ponto inicial" 
echo "OBS 3: Se no passo anterior foi respondido sim, o diretorio já estara no nivel correto"
echo ""

read tempperm
if [ "$tempperm" == t ]; then
	adicionaPathTemp
fi
if [ "$tempperm" == p ]; then
	adicionaPathPerm
fi

if [ "$tempperm" == s ]; then
        echo "Saindo..."
fi

