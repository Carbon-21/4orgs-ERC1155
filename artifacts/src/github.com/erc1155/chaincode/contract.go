/*
	2021 Baran Kılıç <baran.kilic@boun.edu.tr>

	SPDX-License-Identifier: Apache-2.0
*/

package chaincode

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"regexp"
	"sort"
	"strconv"
	"strings"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

const balancePrefix = "account~tokenId~sender"
const approvalPrefix = "account~operator"

const compensationPrefix = "account~tokenTerraId~tokenCompensationId~sender"

// The book order contain the NFT listed for sell. the format key:value is owner~id:[status, price]
const orderbook = "owner~id"

// Org allowed to mint tokens
const minterMSPID = "CarbonMSP"

// System account set to admin@admin.com (account that will receive system tax)
const systemAccount = "eDUwOTo6Q049YWRtaW5AYWRtaW4uY29tLE9VPWFkbWluK09VPWNhcmJvbitPVT1kZXBhcnRtZW50MTo6Q049ZmFicmljLWNhLXNlcnZlcixPVT1GYWJyaWMsTz1IeXBlcmxlZGdlcixTVD1Ob3J0aCBDYXJvbGluYSxDPVVT"

// System currency: Default token which tax applies
const systemCurrency = "$ylvas"

// Tax (in %) to be applied and reverted to system account
const taxPercentage = 10

// -- inicio Definição do enum de status do NFT --
// Constatnte utilizada para representar o status do NFT
const (
	NFT_Ativo     = iota // 0
	NFT_Bloqueado        // 1
)

// Mapeamento para associar o inteiro que representa o status com sua respectiva string
var statusNFT = map[int]string{
	NFT_Ativo:     "Ativo",
	NFT_Bloqueado: "Bloqueado",
}

// Funcao que retorna a string do status dado um inteiro que o representa no enum
func getNomeStatusNFT(status int) string {
	nomeStatusNFT, ok := statusNFT[status]
	if !ok {
		return "Status do NFT invalido"
	}
	return nomeStatusNFT
}

// Funcao que retorna o inteiro do status dado uma string que o representa
// Caso nao encontrar o status correspondente retorna -1
func getIntStatusNFT(status string) int {
	// Faz o status ficar tudo minusculo para evitar Case
	status = strings.ToLower(status)
	for intStatus, strStatus := range statusNFT {
		if strings.EqualFold(strStatus, status) {
			return intStatus
		}
	}
	return -1
}

// -- fim Definição do enum de status do NFT --

// Token struct for marshal/unmarshal buy and sell listings
type ListItem struct {
	Status     string
	Price      uint64
	TaxPercent uint64
}

type ListForSaleEvent struct {
	Operator  string
	Sender    string
	Id        string
	IsForSale bool
	Price     uint64
}

// SmartContract provides functions for transferring tokens between accounts
type SmartContract struct {
	contractapi.Contract
}

// TransferSingle MUST emit when a single token is transferred, including zero
// value transfers as well as minting or burning.
// The operator argument MUST be msg.sender.
// The from argument MUST be the address of the holder whose balance is decreased.
// The to argument MUST be the address of the recipient whose balance is increased.
// The id argument MUST be the token type being transferred.
// The value argument MUST be the number of tokens the holder balance is decreased
// by and match what the recipient balance is increased by.
// When minting/creating tokens, the from argument MUST be set to `0x0` (i.e. zero address).
// When burning/destroying tokens, the to argument MUST be set to `0x0` (i.e. zero address).
type TransferSingle struct {
	Operator string `json:"operator"`
	From     string `json:"from"`
	To       string `json:"to"`
	ID       string `json:"id"`
	Value    uint64 `json:"value"`
}

// TransferBatch MUST emit when tokens are transferred, including zero value
// transfers as well as minting or burning.
// The operator argument MUST be msg.sender.
// The from argument MUST be the address of the holder whose balance is decreased.
// The to argument MUST be the address of the recipient whose balance is increased.
// The ids argument MUST be the list of tokens being transferred.
// The values argument MUST be the list of number of tokens (matching the list
// and order of tokens specified in _ids) the holder balance is decreased by
// and match what the recipient balance is increased by.
// When minting/creating tokens, the from argument MUST be set to `0x0` (i.e. zero address).
// When burning/destroying tokens, the to argument MUST be set to `0x0` (i.e. zero address).
type TransferBatch struct {
	Operator string   `json:"operator"`
	From     string   `json:"from"`
	To       string   `json:"to"`
	IDs      []string `json:"ids"`
	Values   []uint64 `json:"values"`
}

// TransferBatchMultiRecipient MUST emit when tokens are transferred, including zero value
// transfers as well as minting or burning.
// The operator argument MUST be msg.sender.
// The from argument MUST be the address of the holder whose balance is decreased.
// The to argument MUST be the list of the addresses of the recipients whose balance is increased.
// The ids argument MUST be the list of tokens being transferred.
// The values argument MUST be the list of number of tokens (matching the list
// and order of tokens specified in _ids) the holder balance is decreased by
// and match what the recipient balance is increased by.
// When minting/creating tokens, the from argument MUST be set to `0x0` (i.e. zero address).
// When burning/destroying tokens, the to argument MUST be set to `0x0` (i.e. zero address).
type TransferBatchMultiRecipient struct {
	Operator string   `json:"operator"`
	From     string   `json:"from"`
	To       []string `json:"to"`
	IDs      []string `json:"ids"`
	Values   []uint64 `json:"values"`
}

// ApprovalForAll MUST emit when approval for a second party/operator address
// to manage all tokens for an owner address is enabled or disabled
// (absence of an event assumes disabled).
type ApprovalForAll struct {
	Owner    string `json:"owner"`
	Operator string `json:"operator"`
	Approved bool   `json:"approved"`
}

// URI MUST emit when the URI is updated for a token ID.
// Note: This event is not used in this contract implementation because in this implementation,
// only the programmatic way of setting URI is used. The URI should contain {id} as part of it
// and the clients MUST replace this with the actual token ID.
// e.g.: http://token/{id}.json
type URI struct {
	ID    string `json:"id"`
	Value string `json:"value"`
}

// To represents recipient address
// ID represents token ID
type ToID struct {
	To string
	ID string
}

// Structs NFT 'de Terra'
type Metadata struct {
	Id                string `json:"id"`                 // Id interno do NFT no sistema
	Status            string `json:"status"`             // Ativo, bloqueado
	LandOwner         string `json:"land_owner"`         // Dono da terra
	LandArea          string `json:"land_area"`          // Área em  hectares
	Phyto             string `json:"phyto"`              // Fitofisiologia
	Geolocation       string `json:"geolocation"`        //Coordenadas da área {(x1,y1),(x2,y2})}
	CompensationOwner string `json:"compensation_owner"` // Detentor do direito de compensacao (Account ID ou Token ID)
	CompensationState string `json:"compensation_state"` // Compensado, Não compensado
	MintSylvas        string `json:"mint_sylvas"`        // Booleano referente ao direito de gerar FTs
	MintRate          string `json:"mint_rate"`          // Potencial de geracao com base no tipo de area
	Certificate       string `json:"certificate"`        // Comprovante emitido pelo órgão governamental permitindo a ativação do NFT.
	NFTType           string `json:"nft_type"`           // Tipo de nft (preservação/corte)
	CustomNotes       string `json:"custom_notes"`       // Demais anotações

	// PlantedAmount  string `json:"planted_amount"`
	// OrigPlantedAmount  string `json:"orig_planted_amount"`

	//AreaClassification string `json:"areaclassification"`
	//Verifier string `json:"verifier"`

	/* Definições no metadata controller
	const customData = {
	id: dto.id || "",
	verifier: dto.verifier || "",
	private_verifier: dto.private_verifier || "",
	land_owner: dto.land_owner || "",
	// land_info: {
	phyto: dto.phyto || "",
	land: dto.land || "",
	geolocation: dto.geolocation || "",
	area_classification: dto.area_classification || "",
	// },
	// nft_info: {
	amount: dto.amount || "",
	status: dto.status || "",
	nft_type: dto.nft_type || "",
	value: dto.value || "",
	can_mint_sylvas: dto.can_mint_sylvas || "",
	sylvas_minted: dto.sylvas_minted || "",
	bonus_ft: dto.bonus_ft || "",f
	// },
	compensation_owner: dto.compensation_owner || "",
	compensation_state: dto.compensation_state || "",
	certificate: dto.certificate || "",
	minter: dto.minter || "",
	queue: dto.queue || "",
	custom_notes: dto.custom_notes || "",
	*/

}

type NFToken struct {
	Amount   string   `json:"amount"`
	Metadata Metadata `json:"metadata"`
}

// Structs NFT de 'Direito de compensação'

type NFTCompensationToken struct {
	IdNFTTerra              string   `json:"id_nft_terra"`
	IdNFTCompensation       string   `json:"id_nft_compensation"`
	CompensationTotalArea   string   `json:"compensation_total_area"`
	CompensationAreaSupply  string   `json:"compensation_area_supply"`
	CREAEng                 string   `json:"crea_eng"`    // CREA engenheiro que possibilitou a compensacao
	LinkDocs                string   `json:"link_docs"`   // Link apontando para docummentacao relevante
	Geolocation             string   `json:"geolocation"` // Coordenadaaas geograficas do centroide da terra
	Shapefile               string   `json:"shapefile"`   // Shapefile
	CompensationState       string   `json:"compensation_state"`
	CompensationOwner       string   `json:"compensation_owner"`
	IdNFTCompensationPai    string   `json:"id_nft_compensation_pai"`
	IdFilhosNFTCompensation []string `json:"id_filhos_nft_compensation"` // Array de id dos filhos desse NFT
}

// Get role (OU) from clientAccountID
func GetRole(clientAccountID string) string {
	//decode from b64
	clientAccountIDPlain, err := base64.StdEncoding.DecodeString(clientAccountID)
	if err != nil {
		panic(err)
	}
	// fmt.Printf("Decoded text: \n%s\n\n", clientAccountIDPlain)

	//get OU from clientAccountID
	re := regexp.MustCompile("^x509::CN=.*?,OU=(admin|client|peer).*$")
	match := re.FindStringSubmatch(string(clientAccountIDPlain))

	// fmt.Println(match[1])

	return match[1]
}

func (s *SmartContract) GetNFTsFromStatus(ctx contractapi.TransactionContextInterface, status string) ([][]string, error) {
	return NFTsFromStatusHelper(ctx, status)
}

//returns whole world state
func (s *SmartContract) GetWorldState(ctx contractapi.TransactionContextInterface) ([][]string, error) {

	// // Must be Carbon's admin
	// err := authorizationHelper(ctx)
	// if err != nil {
	// 	return nil, err
	// }

	// Slice de slices que conterá os tokens e suas quantidades
	var tokens [][]string

	// Get all transactions
	balanceIterator, err := ctx.GetStub().GetStateByPartialCompositeKey(balancePrefix, []string{})
	if err != nil {
		return nil, fmt.Errorf("Erro ao obter o prefixo %v: %v", balancePrefix, err)
	}
	defer balanceIterator.Close()

	// Itera pelos pares chave/valor que deram match
	for balanceIterator.HasNext() {
		queryResponse, err := balanceIterator.Next()
		if err != nil {
			return nil, fmt.Errorf("failed to get the next state for prefix %v: %v", balancePrefix, err)
		}

		// Split the key
		_, compositeKeyParts, err := ctx.GetStub().SplitCompositeKey(queryResponse.Key)
		if err != nil {
			return nil, fmt.Errorf("failed to get key: %s", err)
		}

		// Get key parts
		tokenAccount := compositeKeyParts[0]
		tokenID := compositeKeyParts[1]
		tokenSender := compositeKeyParts[2]
		// metadata := compositeKeyParts[3]

		// Get value
		tokenAmount := queryResponse.Value

		//! Add info to the array of arrays
		element := []string{tokenAccount, tokenID, tokenSender, string(tokenAmount)}
		tokens = append(tokens, element)
		// }
	}

	return tokens, nil
}

// Cria um novo NFT de compensação
func (s *SmartContract) MintNFTCompensation(ctx contractapi.TransactionContextInterface, account string, idNFTTerra string, idNFTComp string, compensationTotalArea string, metadata string) error {

	// Check minter authorization - this sample assumes Carbon is the central banker with privilege to mint new tokens
	err := authorizationHelper(ctx)
	if err != nil {
		return err
	}

	// Get ID of submitting client identity
	operator, err := ctx.GetClientIdentity().GetID()
	if err != nil {
		return fmt.Errorf("failed to get client id: %v", err)
	}

	// Realiza o 'mint' do nft
	err = mintCompensationHelper(ctx, idNFTTerra, idNFTComp, account, compensationTotalArea, compensationTotalArea, "Nao Compensado", "")
	if err != nil {
		return err
	}

	// Emit TransferSingle event
	transferSingleEvent := TransferSingle{operator, "0x0", account, idNFTComp, 1}
	return emitTransferSingle(ctx, transferSingleEvent)
}

// CompensateNFT, funcao é utilizada para consolidar parcialmente ou totalmente a compensação de direitos de compensacao
/*
   Ao compensar um direito é criado um novo nft com seu status já alterado para compensado enquato o 'supply' do NFT
   base é subtraido pela quantidade compensada.
*/

func (s *SmartContract) CompensateNFT(ctx contractapi.TransactionContextInterface, account string, tokenTerraId string, tokenCompensationId string, compensationAmount string, tokenCompensationIdNew string) error {

	// Pega todas os pares de chave cuja chave é "account~tokenId~sender"
	// Segundo argumento: uma array cujos valores são verificados no valor do par chave/valor, seguindo a ordem do prefixo. Pode ser vazio: []string{}
	balanceIterator, err := ctx.GetStub().GetStateByPartialCompositeKey(compensationPrefix, []string{account, tokenTerraId, tokenCompensationId})
	if err != nil {
		return fmt.Errorf("Erro ao obter o prefixo %v: %v", balancePrefix, err)
	}

	// defer: coloca a função deferida na pilha, para ser executa apóso retorno da função em que é executada. Garante que será chamada, seja qual for o fluxo de execução.
	defer balanceIterator.Close()

	// Itera pelos pares chave/valor que deram match
	for balanceIterator.HasNext() {
		queryResponse, err := balanceIterator.Next()
		if err != nil {
			return fmt.Errorf("failed to get the next state for prefix %v: %v", compensationPrefix, err)
		}

		// Pega a quantidade de tokens TokenId que a conta possui
		// tokenAmount := queryResponse.Value
		nft := new(NFTCompensationToken)
		_ = json.Unmarshal(queryResponse.Value, nft)

		// Verifica se o estado atual do NFT já é compensado
		if nft.CompensationState == "Compensado" {
			return fmt.Errorf(("NFT já compensado"))
		} else if nft.CompensationState == "Bloqueado" {
			return fmt.Errorf(("NFT esta bloquado"))
		} else if nft.CompensationAreaSupply < compensationAmount {
			return fmt.Errorf(("O total de compensacao solicitada é maior que o disponivel"))
		} else {
			// Atualiza o Supply disponivel do NFT atual
			CompensationSupply, _ := strconv.Atoi(nft.CompensationAreaSupply)
			CompensationAmount, _ := strconv.Atoi(compensationAmount)
			nft.CompensationAreaSupply = strconv.Itoa(CompensationSupply - CompensationAmount)

			// Insere o id do nft do filho no pai
			nft.IdFilhosNFTCompensation = append(nft.IdFilhosNFTCompensation, tokenCompensationIdNew)

			tokenAsBytes, _ := json.Marshal(nft)
			err = ctx.GetStub().PutState(queryResponse.Key, tokenAsBytes)
			if err != nil {
				return fmt.Errorf("Problema ao atualizar supply do NFT %v", err)
			}

			// Minta um novo novo NFT de compensacao com o supply e o total = ao compensation Amount
			// Mint tokens
			err := mintCompensationHelper(ctx, nft.IdNFTTerra, tokenCompensationIdNew, account, strconv.Itoa(CompensationAmount), "0", "Compensado", tokenCompensationId)
			if err != nil {
				return err
			}

			// Salva alteração no World State
			/*tokenAsBytes, _ := json.Marshal(nft)

			err = ctx.GetStub().PutState(queryResponse.Key, tokenAsBytes)
			if err != nil {
				return fmt.Errorf("Problema ao inserir no world state o nft com estado de compensado %v", err)
			}
			*/
		}
		return nil
	}
	return fmt.Errorf("Token não encontrado")
}

// Mint creates amount tokens of token type id and assigns them to account.
// This function emits a TransferSingle event.
func (s *SmartContract) Mint(ctx contractapi.TransactionContextInterface, account string, id string, amount uint64, metadata string) error {

	var decMetadata Metadata
	json.Unmarshal([]byte(metadata), &decMetadata)

	//fmt.Printf("Metadata : %#v",decMetadata)

	// Check minter authorization - this sample assumes Carbon is the central banker with privilege to mint new tokens
	err := authorizationHelper(ctx)
	if err != nil {
		return err
	}

	// Get ID of submitting client identity
	operator, err := ctx.GetClientIdentity().GetID()
	if err != nil {
		return fmt.Errorf("failed to get client id: %v", err)
	}

	//Garante que não seja emitido mais de uma NFT em nenhuma circunstância
	if id != systemCurrency {
		amount = 1
	}

	// Mint tokens
	err = mintHelper(ctx, operator, account, id, amount, decMetadata)
	if err != nil {
		return err
	}

	// Emit TransferSingle event
	transferSingleEvent := TransferSingle{operator, "0x0", account, id, amount}
	return emitTransferSingle(ctx, transferSingleEvent)
}

// getAllNFTID Retorna todos os NFTs do world state
func (s *SmartContract) GetAllNFTIds(ctx contractapi.TransactionContextInterface) [][]string {
	var errRet [][]string

	// Check minter authorization - this sample assumes Carbon is the central banker with privilege to mint new tokens
	err := authorizationHelper(ctx)
	if err != nil {
		el := []string{"Authorization failed"}
		errRet = append(errRet, el)
		return errRet
	}

	idNFTs, _ := idNFTHelper(ctx, "")
	return idNFTs
}

// Mint creates amount tokens of token type id and assigns them to account.
// This function emits a TransferSingle event.
func (s *SmartContract) FTFromNFT(ctx contractapi.TransactionContextInterface) (uint64, error) {

	// -------- Get all NFTs --------
	// tokenid is the id of the FTs how will be generated from the NFTs
	var tokenid = systemCurrency

	// Stores a list of all NFTs of the same user (account))
	NFTSumList := make([][]string, 0)

	if tokenid == "" {
		return 0, fmt.Errorf("Please inform tokenid!")
	}

	// Check minter authorization - this sample assumes Carbon is the central banker with privilege to mint new tokens
	err := authorizationHelper(ctx)
	if err != nil {
		return 0, err
	}

	// Get ID of submitting client identity
	operator, err := ctx.GetClientIdentity().GetID()
	if err != nil {
		return 0, fmt.Errorf("failed to get client id: %v", err)
	}

	balanceIterator, err := ctx.GetStub().GetStateByPartialCompositeKey(balancePrefix, []string{})
	if err != nil {
		return 0, fmt.Errorf("failed to get state for prefix %v: %v", balancePrefix, err)
	}
	defer balanceIterator.Close()

	for balanceIterator.HasNext() {
		queryResponse, err := balanceIterator.Next()
		if err != nil {
			return 0, fmt.Errorf("failed to get the next state for prefix %v: %v", balancePrefix, err)
		}

		//fmt.Print(queryResponse)
		// Split Key to search for specific tokenid
		// The compositekey (account -  tokenid - senderer)
		_, compositeKeyParts, err := ctx.GetStub().SplitCompositeKey(queryResponse.Key)

		if err != nil {
			return 0, fmt.Errorf("failed to get key: %s", queryResponse.Key, err)
		}

		nft := new(NFToken)
		_ = json.Unmarshal(queryResponse.Value, nft)

		// fmt.Printf("NFT Qtd:" + nft.Metadata.Land)

		// Contains the tokenid if FT probably 'sylvas' and if is an NFT will contain there id
		returnedTokenID := compositeKeyParts[1]

		// Contains the account of the user who have the nft
		accountNFT := compositeKeyParts[0]

		// Retrieve all NFTs by analyzing all records and seeing if they aren't FTs/
		if (returnedTokenID != tokenid) && (nft.Metadata.Status == getNomeStatusNFT(NFT_Ativo)) && (nft.Metadata.MintSylvas == "Ativo") {

			// Part to insert the logic of how many sylvas to add for that NFT
			var SylvasAdd int
			var LandArea int
			var MintRate int
			LandArea, _ = strconv.Atoi(nft.Metadata.LandArea)
			MintRate, _ = strconv.Atoi(nft.Metadata.MintRate)

			SylvasAdd = (MintRate * LandArea) / 100

			// SylvasAdd =  10 // add 10 sylvas per nft

			// Function that checks if the NFT receiver is in the temporary Slice Array
			// If found, it returns the index to concatenate the id of the nft found and add the qty of sylvas
			// Otherwise, add to this slice the set of the token id, the receiver and some sylvas
			containInSliceIndex := containInSlice(NFTSumList, accountNFT)

			//  Found thes account in the list
			if containInSliceIndex != -1 {
				// Concatenates the id of the other nft
				//fmt.Print("ID nfts", NFTSumList[containInSliceIndex][0])
				NFTSumList[containInSliceIndex][0] = string(NFTSumList[containInSliceIndex][0]) + "," + string(returnedTokenID)

				// Add the value to the total number of silvas
				//fmt.Print("Sylvas", NFTSumList[containInSliceIndex][2])
				currentSylv, err := strconv.Atoi(NFTSumList[containInSliceIndex][2])
				fmt.Print(err)
				NFTSumList[containInSliceIndex][2] = strconv.Itoa(currentSylv + SylvasAdd)
			} else {
				//fmt.Print("Adicionando Elemento", returnedTokenID, accountNFT)
				element := []string{string(returnedTokenID), accountNFT, strconv.Itoa(SylvasAdd)}
				NFTSumList = append(NFTSumList, element)
			}

			// NFTSumList [0] - List of NFTS ids for each user
			// NFTSumList [1] - Account that owns the nfts
			// NFTSumList [2] - Total sylvas associated to be added to that account

			for i := range NFTSumList {
				// 'Minting' the tokens from the temporary list
				sylvaInt, err := strconv.ParseInt(NFTSumList[i][2], 10, 64)
				err = mintHelper(ctx, operator, string(NFTSumList[i][1]), tokenid, uint64(sylvaInt), *new(Metadata))
				if err != nil {
					return 0, err
				}
				fmt.Print("AQUI:" + string(NFTSumList[i][0]) + "-" + string(NFTSumList[i][1]) + "-" + string(NFTSumList[i][2]))
			}
		}

	}

	return uint64(0), nil
}

func containInSlice(NFTSumList [][]string, account string) int {
	// Checks if it has a receiver for sylvas and if yes, returns the index and the ids of the nfts, if not, it returns 0
	// Check the list if there is already a destination with the same code

	for i := range NFTSumList {
		// If it has, concatenate the id of the NFT in the first and perform the sum of the value of sylvas to be added
		if NFTSumList[i][1] == account {
			//fmt.Print("Elemento encontrado, indice:", i)
			return i
		}
	}
	return -1
}

// MintBatch creates amount tokens for each token type id and assigns them to account.
// This function emits a TransferBatch event.
func (s *SmartContract) MintBatch(ctx contractapi.TransactionContextInterface, account string, ids []string, amounts []uint64) error {

	if len(ids) != len(amounts) {
		return fmt.Errorf("ids and amounts must have the same length")
	}

	// Check minter authorization - this sample assumes Carbon is the central banker with privilege to mint new tokens
	err := authorizationHelper(ctx)
	if err != nil {
		return err
	}

	// Get ID of submitting client identity
	operator, err := ctx.GetClientIdentity().GetID()
	if err != nil {
		return fmt.Errorf("failed to get client id: %v", err)
	}

	// Group amount by token id because we can only send token to a recipient only one time in a block. This prevents key conflicts
	amountToSend := make(map[string]uint64) // token id => amount

	for i := 0; i < len(amounts); i++ {
		amountToSend[ids[i]] += amounts[i]
	}

	// Copy the map keys and sort it. This is necessary because iterating maps in Go is not deterministic
	amountToSendKeys := sortedKeys(amountToSend)

	// Mint tokens
	for _, id := range amountToSendKeys {
		amount := amountToSend[id]
		err = mintHelper(ctx, operator, account, id, amount, *new(Metadata))
		if err != nil {
			return err
		}
	}

	// Emit TransferBatch event
	transferBatchEvent := TransferBatch{operator, "0x0", account, ids, amounts}
	return emitTransferBatch(ctx, transferBatchEvent)
}

// Burn destroys amount tokens of token type id from account.
// This function triggers a TransferSingle event.
func (s *SmartContract) Burn(ctx contractapi.TransactionContextInterface, account string, id string, amount uint64) error {

	if account == "0x0" {
		return fmt.Errorf("burn to the zero address")
	}

	// Check minter authorization - this sample assumes Carbon is the central banker with privilege to burn new tokens
	err := authorizationHelper(ctx)
	if err != nil {
		return err
	}

	// Get ID of submitting client identity
	operator, err := ctx.GetClientIdentity().GetID()
	if err != nil {
		return fmt.Errorf("failed to get client id: %v", err)
	}

	// Burn tokens
	err = removeBalance(ctx, account, []string{id}, []uint64{amount})
	if err != nil {
		return err
	}

	transferSingleEvent := TransferSingle{operator, account, "0x0", id, amount}
	return emitTransferSingle(ctx, transferSingleEvent)
}

// BurnBatch destroys amount tokens of for each token type id from account.
// This function emits a TransferBatch event.
func (s *SmartContract) BurnBatch(ctx contractapi.TransactionContextInterface, account string, ids []string, amounts []uint64) error {

	if account == "0x0" {
		return fmt.Errorf("burn to the zero address")
	}

	if len(ids) != len(amounts) {
		return fmt.Errorf("ids and amounts must have the same length")
	}

	// Check minter authorization - this sample assumes Carbon is the central banker with privilege to burn new tokens
	err := authorizationHelper(ctx)
	if err != nil {
		return err
	}

	// Get ID of submitting client identity
	operator, err := ctx.GetClientIdentity().GetID()
	if err != nil {
		return fmt.Errorf("failed to get client id: %v", err)
	}

	err = removeBalance(ctx, account, ids, amounts)
	if err != nil {
		return err
	}

	transferBatchEvent := TransferBatch{operator, account, "0x0", ids, amounts}
	return emitTransferBatch(ctx, transferBatchEvent)
}

// TransferFrom transfers tokens from sender account to recipient account
// recipient account must be a valid clientID as returned by the ClientID() function
func (s *SmartContract) TransferFrom(ctx contractapi.TransactionContextInterface, sender string, recipient string, id string, amount uint64) error {
	if sender == recipient {
		return fmt.Errorf("Proibido transferir para si mesmo")
	}

	// Verify if the NFT is listed on the store
	nftStatus, _ := NFTsFromStatusHelper(ctx, "sale")
	for j := 0; j < len(nftStatus); j++ {
		if id == nftStatus[j][0] {
			return fmt.Errorf("NFT não pode ser transferido enquanto esta a venda")
		}
	}

	// Get ID of submitting client identity
	operator, err := ctx.GetClientIdentity().GetID()
	if err != nil {
		return fmt.Errorf("failed to get client id: %v", err)
	}

	// Check whether operator is owner or approved
	if operator != sender {
		approved, err := _isApprovedForAll(ctx, sender, operator)
		if err != nil {
			return err
		}
		if !approved {
			return fmt.Errorf("Chamador não é o dono do token nem está aprovado a realizar esta transação")
		}
	}

	// Withdraw the funds from the sender address
	err = removeBalance(ctx, sender, []string{id}, []uint64{amount})
	if err != nil {
		return err
	}

	if recipient == "0x0" {
		return fmt.Errorf("transfer to the zero address")
	}

	// Deposit the fund to the recipient address
	err = addBalance(ctx, operator, recipient, id, amount, *new(Metadata))
	if err != nil {
		return err
	}

	// Emit TransferSingle event
	transferSingleEvent := TransferSingle{operator, sender, recipient, id, amount}
	return emitTransferSingle(ctx, transferSingleEvent)

}

// BatchTransferFrom transfers multiple tokens from sender account to recipient account
// recipient account must be a valid clientID as returned by the ClientID() function
// This function triggers a TransferBatch event
func (s *SmartContract) BatchTransferFrom(ctx contractapi.TransactionContextInterface, sender string, recipient string, ids []string, amounts []uint64) error {
	if sender == recipient {
		return fmt.Errorf("transfer to self")
	}

	if len(ids) != len(amounts) {
		return fmt.Errorf("ids and amounts must have the same length")
	}

	// Get ID of submitting client identity
	operator, err := ctx.GetClientIdentity().GetID()
	if err != nil {
		return fmt.Errorf("failed to get client id: %v", err)
	}

	// Check whether operator is owner or approved
	if operator != sender {
		approved, err := _isApprovedForAll(ctx, sender, operator)
		if err != nil {
			return err
		}
		if !approved {
			return fmt.Errorf("caller is not owner nor is approved")
		}
	}

	// Withdraw the funds from the sender address
	err = removeBalance(ctx, sender, ids, amounts)
	if err != nil {
		return err
	}

	if recipient == "0x0" {
		return fmt.Errorf("transfer to the zero address")
	}

	// Group amount by token id because we can only send token to a recipient only one time in a block. This prevents key conflicts
	amountToSend := make(map[string]uint64) // token id => amount

	for i := 0; i < len(amounts); i++ {
		amountToSend[ids[i]] += amounts[i]
	}

	// Copy the map keys and sort it. This is necessary because iterating maps in Go is not deterministic
	amountToSendKeys := sortedKeys(amountToSend)

	// Deposit the funds to the recipient address
	for _, id := range amountToSendKeys {
		amount := amountToSend[id]
		err = addBalance(ctx, sender, recipient, id, amount, *new(Metadata))
		if err != nil {
			return err
		}
	}

	transferBatchEvent := TransferBatch{operator, sender, recipient, ids, amounts}
	return emitTransferBatch(ctx, transferBatchEvent)
}

// BatchTransferFromMultiRecipient transfers multiple tokens from sender account to multiple recipient accounts
// recipient account must be a valid clientID as returned by the ClientID() function
// This function triggers a TransferBatchMultiRecipient event
func (s *SmartContract) BatchTransferFromMultiRecipient(ctx contractapi.TransactionContextInterface, sender string, recipients []string, ids []string, amounts []uint64) error {

	if len(recipients) != len(ids) || len(ids) != len(amounts) {
		return fmt.Errorf("recipients, ids, and amounts must have the same length")
	}

	for _, recipient := range recipients {
		if sender == recipient {
			return fmt.Errorf("transfer to self")
		}
	}

	// Get ID of submitting client identity
	operator, err := ctx.GetClientIdentity().GetID()
	if err != nil {
		return fmt.Errorf("failed to get client id: %v", err)
	}

	// Check whether operator is owner or approved
	if operator != sender {
		approved, err := _isApprovedForAll(ctx, sender, operator)
		if err != nil {
			return err
		}
		if !approved {
			return fmt.Errorf("caller is not owner nor is approved")
		}
	}

	// Withdraw the funds from the sender address
	err = removeBalance(ctx, sender, ids, amounts)
	if err != nil {
		return err
	}

	// Group amount by (recipient, id ) pair because we can only send token to a recipient only one time in a block. This prevents key conflicts
	amountToSend := make(map[ToID]uint64) // (recipient, id ) => amount

	for i := 0; i < len(amounts); i++ {
		amountToSend[ToID{recipients[i], ids[i]}] += amounts[i]
	}

	// Copy the map keys and sort it. This is necessary because iterating maps in Go is not deterministic
	amountToSendKeys := sortedKeysToID(amountToSend)

	// Deposit the funds to the recipient addresses
	for _, key := range amountToSendKeys {
		if key.To == "0x0" {
			return fmt.Errorf("transfer to the zero address")
		}

		amount := amountToSend[key]

		err = addBalance(ctx, sender, key.To, key.ID, amount, *new(Metadata))
		if err != nil {
			return err
		}
	}

	// Emit TransferBatchMultiRecipient event
	transferBatchMultiRecipientEvent := TransferBatchMultiRecipient{operator, sender, recipients, ids, amounts}
	return emitTransferBatchMultiRecipient(ctx, transferBatchMultiRecipientEvent)
}

// IsApprovedForAll returns true if operator is approved to transfer account's tokens.
func (s *SmartContract) IsApprovedForAll(ctx contractapi.TransactionContextInterface, account string, operator string) (bool, error) {
	return _isApprovedForAll(ctx, account, operator)
}

// _isApprovedForAll returns true if operator is approved to transfer account's tokens.
func _isApprovedForAll(ctx contractapi.TransactionContextInterface, account string, operator string) (bool, error) {
	approvalKey, err := ctx.GetStub().CreateCompositeKey(approvalPrefix, []string{account, operator})
	if err != nil {
		return false, fmt.Errorf("failed to create the composite key for prefix %s: %v", approvalPrefix, err)
	}

	approvalBytes, err := ctx.GetStub().GetState(approvalKey)
	if err != nil {
		return false, fmt.Errorf("failed to read approval of operator %s for account %s from world state: %v", operator, account, err)
	}

	if approvalBytes == nil {
		return false, nil
	}

	var approved bool
	err = json.Unmarshal(approvalBytes, &approved)
	if err != nil {
		return false, fmt.Errorf("failed to decode approval JSON of operator %s for account %s: %v", operator, account, err)
	}

	return approved, nil
}

// SetApprovalForAll returns true if operator is approved to transfer account's tokens.
func (s *SmartContract) SetApprovalForAll(ctx contractapi.TransactionContextInterface, operator string, approved bool) error {
	// Get ID of submitting client identity
	account, err := ctx.GetClientIdentity().GetID()
	if err != nil {
		return fmt.Errorf("failed to get client id: %v", err)
	}

	if account == operator {
		return fmt.Errorf("setting approval status for self")
	}

	approvalForAllEvent := ApprovalForAll{account, operator, approved}
	approvalForAllEventJSON, err := json.Marshal(approvalForAllEvent)
	if err != nil {
		return fmt.Errorf("failed to obtain JSON encoding: %v", err)
	}
	err = ctx.GetStub().SetEvent("ApprovalForAll", approvalForAllEventJSON)
	if err != nil {
		return fmt.Errorf("failed to set event: %v", err)
	}

	approvalKey, err := ctx.GetStub().CreateCompositeKey(approvalPrefix, []string{account, operator})
	if err != nil {
		return fmt.Errorf("failed to create the composite key for prefix %s: %v", approvalPrefix, err)
	}

	approvalJSON, err := json.Marshal(approved)
	if err != nil {
		return fmt.Errorf("failed to encode approval JSON of operator %s for account %s: %v", operator, account, err)
	}

	err = ctx.GetStub().PutState(approvalKey, approvalJSON)
	if err != nil {
		return err
	}

	return nil
}

// BalanceOf returns the balance of the given account
func (s *SmartContract) BalanceOf(ctx contractapi.TransactionContextInterface, account string, id string) (uint64, error) {
	return balanceOfHelper(ctx, account, id)
}

// BalanceOfBatch returns the balance of multiple account/token pairs
func (s *SmartContract) BalanceOfBatch(ctx contractapi.TransactionContextInterface, accounts []string, ids []string) ([]uint64, error) {
	if len(accounts) != len(ids) {
		return nil, fmt.Errorf("accounts and ids must have the same length")
	}

	balances := make([]uint64, len(accounts))

	for i := 0; i < len(accounts); i++ {
		var err error
		balances[i], err = balanceOfHelper(ctx, accounts[i], ids[i])
		if err != nil {
			return nil, err
		}
	}

	return balances, nil
}

// SelfBalance returns the balance of the requesting client's account
func (s *SmartContract) SelfBalance(ctx contractapi.TransactionContextInterface, id string) (uint64, error) {

	// Get ID of submitting client identity
	clientID, err := ctx.GetClientIdentity().GetID()
	if err != nil {
		return 0, fmt.Errorf("failed to get client id: %v", err)
	}

	return balanceOfHelper(ctx, clientID, id)
}

// SelfBalance returns the balance of the requesting client's account
func (s *SmartContract) SelfBalanceNFT(ctx contractapi.TransactionContextInterface) [][]string {
	// Get ID of submitting client identity
	clientID, err := ctx.GetClientIdentity().GetID()
	if err != nil {
		ret := make([][]string, 0)
		ret = append(ret, []string{"failed to get client id"})
		return ret
		//return "0", fmt.Errorf("failed to get client id: %v", err)
	}

	idNFTs, _ := idNFTHelper(ctx, clientID)
	return idNFTs
}

// SelfBalance returns the balance of the requesting client's account
func (s *SmartContract) BalanceNFT(ctx contractapi.TransactionContextInterface, account string) [][]string {
	idNFTs, _ := idNFTHelper(ctx, account)
	return idNFTs
}

// Retorna todos nfts de compensação
func (s *SmartContract) SelfBalanceNFTCompensation(ctx contractapi.TransactionContextInterface) [][]string {
	// Get ID of submitting client identity
	clientID, err := ctx.GetClientIdentity().GetID()
	if err != nil {
		ret := make([][]string, 0)
		ret = append(ret, []string{"failed to get client id"})
		return ret
		//return "0", fmt.Errorf("failed to get client id: %v", err)
	}

	idNFTs, _ := idNFTCompensationHelper(ctx, clientID)
	return idNFTs
}

// ClientAccountID returns the id of the requesting client's account
// In this implementation, the client account ID is the clientId itself
// Users can use this function to get their own account id, which they can then give to others as the payment address
func (s *SmartContract) ClientAccountID(ctx contractapi.TransactionContextInterface) (string, error) {
	// Get ID of submitting client identity
	clientAccountID, err := ctx.GetClientIdentity().GetID()
	if err != nil {
		return "", fmt.Errorf("failed to get client id: %v", err)
	}

	return clientAccountID, nil
}

// TotalSupply return the total supply of given tokenID
func (s *SmartContract) TotalSupply(ctx contractapi.TransactionContextInterface, tokenid string) (uint64, error) {

	var balance uint64

	if tokenid == "" {
		return 0, fmt.Errorf("Please inform tokenid!")
	}

	balanceIterator, err := ctx.GetStub().GetStateByPartialCompositeKey(balancePrefix, []string{})
	if err != nil {
		return 0, fmt.Errorf("failed to get state for prefix %v: %v", balancePrefix, err)
	}
	defer balanceIterator.Close()

	for balanceIterator.HasNext() {
		queryResponse, err := balanceIterator.Next()
		if err != nil {
			return 0, fmt.Errorf("failed to get the next state for prefix %v: %v", balancePrefix, err)
		}

		// Split Key to search for specific tokenid
		_, compositeKeyParts, err := ctx.GetStub().SplitCompositeKey(queryResponse.Key)
		if err != nil {
			return 0, fmt.Errorf("failed to get key: %s", queryResponse.Key, err)
		}

		// Add all balances of informed tokenid
		returnedTokenID := compositeKeyParts[1]
		if returnedTokenID == tokenid {
			balAmount, _ := strconv.ParseUint(string(queryResponse.Value), 10, 64)
			balance += balAmount
		}

	}

	return balance, nil

}

//TODO: após metadados saírem do IPFS, ajsutar o nome das variáveis. Essa função será usada somente pra logs transparentes
//  SetURI set a specific URI containing the metadata related to a given tokenID
func (s *SmartContract) SetURI(ctx contractapi.TransactionContextInterface, tokenID string, tokenURI string) error {
	err := ctx.GetStub().PutState(tokenID, []byte(tokenURI))
	if err != nil {
		return err
	}

	// Emit setURI event
	setURIEvent := URI{tokenID, tokenURI}
	return emitSetURI(ctx, setURIEvent)

}

// GetURI return metadata URI related to a given tokenID
func (s *SmartContract) GetURI(ctx contractapi.TransactionContextInterface, tokenID string) (string, error) {

	uriBytes, err := ctx.GetStub().GetState(tokenID)
	if err != nil {
		return "", fmt.Errorf("failed to read key from world state: %v", err)
	}

	var tokenURI string
	if uriBytes != nil {
		tokenURI = string(uriBytes)
	}

	return tokenURI, nil
}

func (s *SmartContract) BroadcastTokenExistance(ctx contractapi.TransactionContextInterface, id string) error {

	// Check minter authorization - this sample assumes Carbon is the central banker with privilege to mint new tokens
	err := authorizationHelper(ctx)
	if err != nil {
		return err
	}

	// Get ID of submitting client identity
	operator, err := ctx.GetClientIdentity().GetID()
	if err != nil {
		return fmt.Errorf("failed to get client id: %v", err)
	}

	// Emit TransferSingle event
	transferSingleEvent := TransferSingle{operator, "0x0", "0x0", id, 0}
	return emitTransferSingle(ctx, transferSingleEvent)
}

// Helper Functions

// authorizationHelper checks minter authorization - this sample assumes Carbon is the central banker with privilege to mint new tokens. Also, the operator must be admin.
func authorizationHelper(ctx contractapi.TransactionContextInterface) error {

	// Get org of submitting client identity and check if it is minterMSPID
	clientMSPID, err := ctx.GetClientIdentity().GetMSPID()
	if err != nil {
		return fmt.Errorf("failed to get MSPID: %v", err)
	}
	if clientMSPID != minterMSPID {
		return fmt.Errorf("Não autorizado")
	}

	// Get ID of submitting client identity and check if role is admin
	operator, err := ctx.GetClientIdentity().GetID()
	if err != nil {
		return fmt.Errorf("Erro ao obter ID: %v", err)
	}
	if GetRole(operator) != "admin" {
		return fmt.Errorf("Não autorizado")
	}

	return nil
}

func mintHelper(ctx contractapi.TransactionContextInterface, operator string, account string, id string, amount uint64, metadata Metadata) error {
	if account == "0x0" {
		return fmt.Errorf("mint to the zero address")
	}

	if amount <= 0 {
		return fmt.Errorf("Quantidade emitida dever um inteiro positivo")
	}

	err := addBalance(ctx, operator, account, id, amount, metadata)
	if err != nil {
		return err
	}

	return nil
}

// Auxiliar utilizado para mintar nfts de compensação, onde sao passados o id do NFT da terra correspondente, o id desse nft, a conta do usuario detentora do nft, a área total de compensação, área disponivel para compensação, o status da compensação e o id do nft de compensação do pai (se for filho ou uma string em branco caso contrario)
func mintCompensationHelper(ctx contractapi.TransactionContextInterface, idNFTTerra string, idNFTComp string, account string, compensationTotalArea string, compensationAreaSupply string, compensationState string, tokenIdCompensationPai string) error {

	// verifica se o id do NFT de terras existe
	// Obtem os ids dos nfts para aquela conta
	// Varre a lista de ids para ver se o solicitado encontrasse na lista do usuario
	idNFTs, _ := idNFTHelper(ctx, account)
	matchIdNFT := 0
	for i := 0; i < len(idNFTs); i++ {
		if idNFTTerra == idNFTs[i][0] {
			matchIdNFT = matchIdNFT + 1
		}
	}

	if matchIdNFT == 0 {
		return fmt.Errorf("Id do NFT de terra invalido")
	}

	compensationKey, err := ctx.GetStub().CreateCompositeKey(compensationPrefix, []string{account, idNFTTerra, idNFTComp, account})
	if err != nil {
		return fmt.Errorf("failed to create the composite key for prefix %s: %v", balancePrefix, err)
	}

	var tokenNFTCompensacaoMint NFTCompensationToken

	//tokenMint.CompensationArea = strconv.FormatUint(uint64(compensationArea), 10)

	// Verifica se o Id do NFT de terra realmente existe

	// Mintando NFT da compensacao
	tokenNFTCompensacaoMint.IdNFTTerra = idNFTTerra
	tokenNFTCompensacaoMint.IdNFTCompensation = idNFTComp
	tokenNFTCompensacaoMint.CompensationTotalArea = compensationTotalArea
	tokenNFTCompensacaoMint.CompensationAreaSupply = compensationAreaSupply // Na primeira vez que é mintado a área total a ser utilizada é igual a área total do direito
	tokenNFTCompensacaoMint.CompensationOwner = account
	tokenNFTCompensacaoMint.CompensationState = compensationState // O NFT 'nasce' com o estado de não compensado

	// Verificando se o id do nft de compensação é diferente de uma string em branco, nesse caso é um nft filho
	if tokenIdCompensationPai != "" {
		tokenNFTCompensacaoMint.IdNFTCompensationPai = tokenIdCompensationPai
	}
	tokenInfoAsBytes, _ := json.Marshal(tokenNFTCompensacaoMint)

	err = ctx.GetStub().PutState(compensationKey, tokenInfoAsBytes)
	if err != nil {
		return err
	}
	return nil
}

func addBalance(ctx contractapi.TransactionContextInterface, sender string, recipient string, idString string, amount uint64, metadata Metadata) error {

	balanceKey, err := ctx.GetStub().CreateCompositeKey(balancePrefix, []string{recipient, idString, sender})
	if err != nil {
		return fmt.Errorf("failed to create the composite key for prefix %s: %v", balancePrefix, err)
	}

	balanceBytes, err := ctx.GetStub().GetState(balanceKey)
	if err != nil {
		return fmt.Errorf("failed to read account %s from world state: %v", recipient, err)
	}

	var balance uint64 = 0
	if balanceBytes != nil {
		balance, _ = strconv.ParseUint(string(balanceBytes), 10, 64)
	}

	balance += amount

	//Consulta world state e pega metadados, se eles estiverem vazios para um NFT
	if (metadata == Metadata{} && idString != systemCurrency) {
		res, err := getMetada(ctx, sender, idString)
		if err != nil {
			return err
		}

		metadata = res
	}

	// Se o token for Sylvas (FT), não serão armazenados os metadados, somente a quantidade
	if idString == systemCurrency {
		err = ctx.GetStub().PutState(balanceKey, []byte(strconv.FormatUint(uint64(balance), 10)))
		if err != nil {
			return err
		}
		// Caso o token for referente a um NFT os metadados serão armazenados
	} else {

		var tokenMint NFToken

		tokenMint.Amount = strconv.FormatUint(uint64(balance), 10)
		tokenMint.Metadata = metadata

		// Checa se o status definido para criacao do NFT e valido
		if getIntStatusNFT(tokenMint.Metadata.Status) == -1 {
			return fmt.Errorf("Status definido para o NFT não é valido")
		}

		tokenAsBytes, _ := json.Marshal(tokenMint)

		err = ctx.GetStub().PutState(balanceKey, tokenAsBytes)
		if err != nil {
			return err
		}
	}

	return nil
}

func setBalance(ctx contractapi.TransactionContextInterface, sender string, recipient string, idString string, amount uint64) error {

	/*metadataString, err := getMetada(ctx, sender, idString)
	if err != nil {
		return err
	}*/

	balanceKey, err := ctx.GetStub().CreateCompositeKey(balancePrefix, []string{recipient, idString, sender})
	if err != nil {
		return fmt.Errorf("failed to create the composite key for prefix %s: %v", balancePrefix, err)
	}

	err = ctx.GetStub().PutState(balanceKey, []byte(strconv.FormatUint(uint64(amount), 10)))
	if err != nil {
		return err
	}

	return nil
}

func removeBalance(ctx contractapi.TransactionContextInterface, sender string, ids []string, amounts []uint64) error {
	// Calculate the total amount of each token to withdraw
	necessaryFunds := make(map[string]uint64) // token id -> necessary amount
	taxesPID := make(map[string]uint64)       // token id -> taxes

	for i := 0; i < len(amounts); i++ {
		if ids[i] == systemCurrency {
			// Calculate tax amount
			taxAmount := amounts[i] * uint64(taxPercentage) / 100
			taxesPID[ids[i]] += taxAmount
			necessaryFunds[ids[i]] += amounts[i] + taxAmount
			fmt.Println("Taxes per ID", taxesPID[ids[i]])
		} else {
			necessaryFunds[ids[i]] += amounts[i]
		}
	}

	// Copy the map keys and sort it. This is necessary because iterating maps in Go is not deterministic
	necessaryFundsKeys := sortedKeys(necessaryFunds)

	// Check whether the sender has the necessary funds and withdraw them from the account
	for _, tokenId := range necessaryFundsKeys {
		neededAmount, _ := necessaryFunds[tokenId]

		var partialBalance uint64
		var selfRecipientKeyNeedsToBeRemoved bool
		var selfRecipientKey string

		balanceIterator, err := ctx.GetStub().GetStateByPartialCompositeKey(balancePrefix, []string{sender, tokenId})
		if err != nil {
			return fmt.Errorf("failed to get state for prefix %v: %v", balancePrefix, err)
		}
		defer balanceIterator.Close()

		// Iterate over keys that store balances and add them to partialBalance until
		// either the necessary amount is reached or the keys ended
		for balanceIterator.HasNext() && partialBalance < neededAmount {
			queryResponse, err := balanceIterator.Next()
			if err != nil {
				return fmt.Errorf("failed to get the next state for prefix %v: %v", balancePrefix, err)
			}

			_, compositeKeyParts, err := ctx.GetStub().SplitCompositeKey(queryResponse.Key)
			if err != nil {
				return err
			}

			if compositeKeyParts[2] == sender {
				selfRecipientKeyNeedsToBeRemoved = true
				selfRecipientKey = queryResponse.Key
			} else {
				err = ctx.GetStub().DelState(queryResponse.Key)
				if err != nil {
					return fmt.Errorf("failed to delete the state of %v: %v", queryResponse.Key, err)
				}
			}

			// Verify if the token is an NFT
			if compositeKeyParts[1] != systemCurrency {
				nft := new(NFToken)
				_ = json.Unmarshal(queryResponse.Value, nft)
				partialBalance, _ = strconv.ParseUint(string(nft.Amount), 10, 64)

			} else {
				// Mandando taxa para a carbon
				err = taxes(ctx, sender, sender, tokenId, taxesPID[tokenId])
				if err != nil {
					return err
				}
				partBalAmount, _ := strconv.ParseUint(string(queryResponse.Value), 10, 64)
				partialBalance += partBalAmount
			}
		}

		if partialBalance < neededAmount {
			return fmt.Errorf("Remetente não possui %v suficientes. Quantia requisitada: %v. Quantia disponível: %v", tokenId, neededAmount, partialBalance)
		} else if partialBalance > neededAmount {
			// Send the remainder back to the sender (removing the taxes considered in neededAmount)
			remainder := partialBalance - neededAmount
			if selfRecipientKeyNeedsToBeRemoved {
				// Set balance for the key that has the same address for sender and recipient
				err = setBalance(ctx, sender, sender, tokenId, remainder)
				if err != nil {
					return err
				}
			} else {
				err = addBalance(ctx, sender, sender, tokenId, remainder, *new(Metadata))
				if err != nil {
					return err
				}
			}
		} else if selfRecipientKeyNeedsToBeRemoved {
			// Delete self recipient key
			err = ctx.GetStub().DelState(selfRecipientKey)
			if err != nil {
				return fmt.Errorf("failed to delete the state of %v: %v", selfRecipientKey, err)
			}
		}
	}
	return nil
}

func emitTransferSingle(ctx contractapi.TransactionContextInterface, transferSingleEvent TransferSingle) error {
	transferSingleEventJSON, err := json.Marshal(transferSingleEvent)
	if err != nil {
		return fmt.Errorf("failed to obtain JSON encoding: %v", err)
	}

	err = ctx.GetStub().SetEvent("TransferSingle", transferSingleEventJSON)
	if err != nil {
		return fmt.Errorf("failed to set event: %v", err)
	}

	return nil
}

func emitTransferBatch(ctx contractapi.TransactionContextInterface, transferBatchEvent TransferBatch) error {
	transferBatchEventJSON, err := json.Marshal(transferBatchEvent)
	if err != nil {
		return fmt.Errorf("failed to obtain JSON encoding: %v", err)
	}
	err = ctx.GetStub().SetEvent("TransferBatch", transferBatchEventJSON)
	if err != nil {
		return fmt.Errorf("failed to set event: %v", err)
	}

	return nil
}

func emitTransferBatchMultiRecipient(ctx contractapi.TransactionContextInterface, transferBatchMultiRecipientEvent TransferBatchMultiRecipient) error {
	transferBatchMultiRecipientEventJSON, err := json.Marshal(transferBatchMultiRecipientEvent)
	if err != nil {
		return fmt.Errorf("failed to obtain JSON encoding: %v", err)
	}
	err = ctx.GetStub().SetEvent("TransferBatchMultiRecipient", transferBatchMultiRecipientEventJSON)
	if err != nil {
		return fmt.Errorf("failed to set event: %v", err)
	}

	return nil
}

func emitSetURI(ctx contractapi.TransactionContextInterface, setURIevent URI) error {
	setURIeventJSON, err := json.Marshal(setURIevent)
	if err != nil {
		return fmt.Errorf("failed to obtain JSON encoding: %v", err)
	}

	err = ctx.GetStub().SetEvent("setURI", setURIeventJSON)
	if err != nil {
		return fmt.Errorf("failed to set event: %v", err)
	}

	return nil
}

// ListForSaleEvent{id, operator, id, true, price}
func emitListForSale(ctx contractapi.TransactionContextInterface, listForSaleevent ListForSaleEvent) error {
	listForSaleeventJSON, err := json.Marshal(listForSaleevent)
	if err != nil {
		return fmt.Errorf("failed to obtain JSON encoding: %v", err)
	}

	err = ctx.GetStub().SetEvent("ListForSale", listForSaleeventJSON)
	if err != nil {
		return fmt.Errorf("failed to set event: %v", err)
	}

	return nil
}

// balanceOfHelper returns the balance of the given account
func balanceOfHelper(ctx contractapi.TransactionContextInterface, account string, idString string) (uint64, error) {

	if account == "0x0" {
		return 0, fmt.Errorf("balance query for the zero address")
	}

	var balance uint64

	balanceIterator, err := ctx.GetStub().GetStateByPartialCompositeKey(balancePrefix, []string{account, idString})
	if err != nil {
		return 0, fmt.Errorf("failed to get state for prefix %v: %v", balancePrefix, err)
	}
	defer balanceIterator.Close()

	for balanceIterator.HasNext() {
		queryResponse, err := balanceIterator.Next()
		if err != nil {
			return 0, fmt.Errorf("failed to get the next state for prefix %v: %v", balancePrefix, err)
		}

		balAmount, _ := strconv.ParseUint(string(queryResponse.Value), 10, 64)
		balance += balAmount
	}

	return balance, nil
}

// Retorna a lista de NFTs que possuirem o status de venda pesquisado na loja
func NFTsFromStatusHelper(ctx contractapi.TransactionContextInterface, status string) ([][]string, error) {
	var NFTsFromStatus [][]string

	// Get the order from the world state ([0] owner ~ [1] tokenID)
	storeIterator, err := ctx.GetStub().GetStateByPartialCompositeKey(orderbook, []string{})
	if err != nil {
		return nil, fmt.Errorf("failed to create iterator: %v", err)
	}
	defer storeIterator.Close()

	for storeIterator.HasNext() {

		// Get the next NFT
		responseRange, err := storeIterator.Next()
		if err != nil {
			return nil, fmt.Errorf("failed to get next token: %v", err)
		}

		// Unpack the composite key (owner - id)
		_, storeCompositeKeyParts, err := ctx.GetStub().SplitCompositeKey(responseRange.Key)
		if err != nil {
			return nil, fmt.Errorf("failed to split composite key: %v", err)
		}

		// Parse the JSON object
		var data ListItem
		err = json.Unmarshal(responseRange.Value, &data)
		if err != nil {
			return nil, fmt.Errorf("failed to unmarshal NFT data: %v", err)
		}

		if data.Status == status {
			tokenIterator, err := ctx.GetStub().GetStateByPartialCompositeKey(balancePrefix, []string{})

			if err != nil {
				return nil, fmt.Errorf("failed to create iterator: %v", err)
			}
			defer tokenIterator.Close()

			for tokenIterator.HasNext() {
				queryTokenResponse, err := tokenIterator.Next()
				if err != nil {
					return nil, fmt.Errorf("failed to get the next state for token  %s: %v", storeCompositeKeyParts[1], err)
				}

				// Split Key to search for specific tokenid
				// The compositekey (account -  tokenid - senderer)
				_, compositeKeyPartsToken, err := ctx.GetStub().SplitCompositeKey(queryTokenResponse.Key)

				if err != nil {
					return nil, fmt.Errorf("failed to get key: %s", queryTokenResponse.Key)
				}

				// Contains the tokenid if FT probably 'sylvas' and if is an NFT will contain there id
				returnedTokenID := compositeKeyPartsToken[1]

				if returnedTokenID == storeCompositeKeyParts[1] {
					// Merge ID and Value of the NFTs
					element := []string{returnedTokenID, string(queryTokenResponse.Value)}
					NFTsFromStatus = append(NFTsFromStatus, element)
				}
			}
		}
	}

	// Check if the array is empty
	nftListSize := len(NFTsFromStatus)
	if nftListSize == 0 {
		el := []string{""}
		NFTsFromStatus = append(NFTsFromStatus, el)
		return NFTsFromStatus, nil
	} else {
		return NFTsFromStatus, nil
	}
}

// Funcao provisoria para obter os ids dos direitos de compensacao (futuramente fazer idNFTHelper mais generico)
func idNFTCompensationHelper(ctx contractapi.TransactionContextInterface, account string) ([][]string, error) {

	if account == "0x0" {
		return nil, fmt.Errorf("balance query for the zero address")
	}

	// --------Get all NFTs --------
	// tokenid is the id of the FTs how will be generated from the NFTs
	var tokenid = systemCurrency
	nftlist := make([][]string, 0)

	//balanceIterator, err := ctx.GetStub().GetStateByPartialCompositeKey(balancePrefix, []string{account})
	balanceIterator, err := ctx.GetStub().GetStateByPartialCompositeKey(compensationPrefix, []string{})
	if err != nil {
		return nil, fmt.Errorf("failed to get state for prefix %v: %v", compensationPrefix, err)
	}
	defer balanceIterator.Close()

	for balanceIterator.HasNext() {
		queryResponse, err := balanceIterator.Next()
		if err != nil {
			return nil, fmt.Errorf("failed to get the next state for prefix %v: %v", compensationPrefix, err)
		}

		fmt.Print(queryResponse)
		// Split Key to search for specific tokenid
		// The compositekey (account -  tokenid - senderer)
		_, compositeKeyParts, err := ctx.GetStub().SplitCompositeKey(queryResponse.Key)

		if err != nil {
			return nil, fmt.Errorf("failed to get key: %s: %v", queryResponse.Key, err)
		}

		// Contains the tokenid if FT probably 'sylvas' and if is an NFT will contain there id
		returnedTokenIDTerra := compositeKeyParts[1]
		returnedTokenIDCompensation := compositeKeyParts[2]

		// Contains the account of the user who have the nft
		accountNFT := compositeKeyParts[0]

		// Retrieve all NFTs by analyzing all records and seeing if they aren't FTs
		// Se nenhuma conta for passada a funcao retorna todos os nfts
		if account == "" {
			if returnedTokenIDTerra != tokenid {
				// Merge ID and Value of the NFTs
				element := []string{returnedTokenIDCompensation, returnedTokenIDTerra, string(queryResponse.Value)}
				nftlist = append(nftlist, element)
			}
		} else {
			// Retrieve NFTs from some account by analyzing all records and seeing if they aren't FTs
			if (returnedTokenIDTerra != tokenid) && (accountNFT == account) {
				// Merge ID and Value of the NFTs
				element := []string{returnedTokenIDCompensation, returnedTokenIDTerra, string(queryResponse.Value)}
				nftlist = append(nftlist, element)

			}
		}

	}
	return nftlist, nil
}

// idNFTHelper returns the NFTs associated with an account or all the nfts if the account parameter is empty
func idNFTHelper(ctx contractapi.TransactionContextInterface, account string) ([][]string, error) {

	if account == "0x0" {
		return nil, fmt.Errorf("balance query for the zero address")
	}

	// --------Get all NFTs --------
	// tokenid is the id of the FTs how will be generated from the NFTs
	var tokenid = systemCurrency
	nftlist := make([][]string, 0)

	//balanceIterator, err := ctx.GetStub().GetStateByPartialCompositeKey(balancePrefix, []string{account})
	balanceIterator, err := ctx.GetStub().GetStateByPartialCompositeKey(balancePrefix, []string{})
	if err != nil {
		return nil, fmt.Errorf("failed to get state for prefix %v: %v", balancePrefix, err)
	}
	defer balanceIterator.Close()

	for balanceIterator.HasNext() {
		queryResponse, err := balanceIterator.Next()
		if err != nil {
			return nil, fmt.Errorf("failed to get the next state for prefix %v: %v", balancePrefix, err)
		}

		fmt.Print(queryResponse)
		// Split Key to search for specific tokenid
		// The compositekey (account -  tokenid - senderer)
		_, compositeKeyParts, err := ctx.GetStub().SplitCompositeKey(queryResponse.Key)

		if err != nil {
			return nil, fmt.Errorf("failed to get key: %s", queryResponse.Key, err)
		}

		// Contains the tokenid if FT probably 'sylvas' and if is an NFT will contain there id
		returnedTokenID := compositeKeyParts[1]

		// Contains the account of the user who have the nft
		accountNFT := compositeKeyParts[0]

		// Retrieve all NFTs by analyzing all records and seeing if they aren't FTs
		// Se nenhuma conta for passada a funcao retorna todos os nfts
		if account == "" {
			if returnedTokenID != tokenid {
				// Merge ID and Value of the NFTs
				element := []string{returnedTokenID, string(queryResponse.Value)}
				nftlist = append(nftlist, element)
			}
		} else {
			// Retrieve NFTs from some account by analyzing all records and seeing if they aren't FTs
			if (returnedTokenID != tokenid) && (accountNFT == account) {
				// Merge ID and Value of the NFTs
				element := []string{returnedTokenID, string(queryResponse.Value)}
				nftlist = append(nftlist, element)

			}
		}

	}
	return nftlist, nil
}

// Returns the sorted slice ([]string) copied from the keys of map[string]uint64
func sortedKeys(m map[string]uint64) []string {
	// Copy map keys to slice
	keys := make([]string, len(m))
	i := 0
	for k := range m {
		keys[i] = k
		i++
	}
	// Sort the slice
	sort.Slice(keys, func(i, j int) bool { return keys[i] < keys[j] })
	return keys
}

// Returns the sorted slice ([]ToID) copied from the keys of map[ToID]uint64
func sortedKeysToID(m map[ToID]uint64) []ToID {
	// Copy map keys to slice
	keys := make([]ToID, len(m))
	i := 0
	for k := range m {
		keys[i] = k
		i++
	}
	// Sort the slice first according to ID if equal then sort by recipient ("To" field)
	sort.Slice(keys, func(i, j int) bool {
		if keys[i].ID != keys[j].ID {
			return keys[i].To < keys[j].To
		}
		return keys[i].ID < keys[j].ID
	})
	return keys
}

// This helper function apply the tax percentage over given amount, tranfering it to the system account.
// Important to note that the taxpercentage ideally should be defined in the begining, being possible to modify it (DAO decision maybe?)
// amount: total token amount to be taxed. MUST be previously validated by the caller function!!
// taxPercentage: tax percentage to apply
func taxes(ctx contractapi.TransactionContextInterface, operator string, sender string, id string, taxAmount uint64) error {

	/*// Calculate tax amount
	taxAmount := amount * uint64(taxPercentage) / 100
	fmt.Println("taxAmount: ", taxAmount)

	// Withdraw the funds from the sender address
	err := removeBalance(ctx, sender, []string{id}, []uint64{taxAmount})
	if err != nil {
		return err
	}*/

	// Send tax amount to system account
	err := addBalance(ctx, sender, systemAccount, id, taxAmount, *new(Metadata))
	if err != nil {
		return err
	}

	// Emit TransferSingle event
	transferSingleEvent := TransferSingle{operator, sender, systemAccount, id, taxAmount}
	return emitTransferSingle(ctx, transferSingleEvent)
}

// SetNFTStatus Funcao que define o status referente a situaçao do NFT (Ativo, Bloqueado ...)
func (s *SmartContract) SetNFTStatus(ctx contractapi.TransactionContextInterface, account string, tokenId string, statusNFT string) error {

	// Pega todas os pares de chave cuja chave é "account~tokenId~sender"
	// Segundo argumento: uma array cujos valores são verificados no valor do par chave/valor, seguindo a ordem do prefixo. Pode ser vazio: []string{}
	balanceIterator, err := ctx.GetStub().GetStateByPartialCompositeKey(balancePrefix, []string{account, tokenId})
	if err != nil {
		return fmt.Errorf("Erro ao obter o prefixo %v: %v", balancePrefix, err)
	}

	if tokenId == "$ylvas" {
		return fmt.Errorf("Não é possivel editar metadados de FTs")
	}

	// defer: coloca a função deferida na pilha, para ser executa apóso retorno da função em que é executada. Garante que será chamada, seja qual for o fluxo de execução.
	defer balanceIterator.Close()

	// Itera pelos pares chave/valor que deram match
	for balanceIterator.HasNext() {
		queryResponse, err := balanceIterator.Next()
		if err != nil {
			return fmt.Errorf("failed to get the next state for prefix %v: %v", balancePrefix, err)
		}

		// Pega a quantidade de tokens TokenId que a conta possui
		// tokenAmount := queryResponse.Value
		nft := new(NFToken)
		_ = json.Unmarshal(queryResponse.Value, nft)

		// Altera o estado de compensação
		intNFTStatus := getIntStatusNFT(statusNFT)
		if intNFTStatus == -1 {
			return fmt.Errorf("Status informado invalido")
		} else {
			nft.Metadata.Status = getNomeStatusNFT(intNFTStatus)
		}

		// Salva alteração no World State
		tokenAsBytes, _ := json.Marshal(nft)

		err = ctx.GetStub().PutState(queryResponse.Key, tokenAsBytes)
		if err != nil {
			return fmt.Errorf("Problema ao alterar o status do nft - %v", err)
		}

		return nil
	}
	return fmt.Errorf("Token não encontrado")
}

// Trade functions
//
// List NFT for sale by a given price
// TODO: Modify this function to SetStatus, that will receive the same inputs, but also the desired status value (string)
func (s *SmartContract) SetStatus(ctx contractapi.TransactionContextInterface, owner string, id string, status string, price uint64) error {

	// Get the caller identity
	operator, err := ctx.GetClientIdentity().GetID()
	if err != nil {
		return fmt.Errorf("Erro ao obter ID: %v", err)
	}

	idNFTs, _ := idNFTHelper(ctx, operator)
	for i := 0; i < len(idNFTs); i++ {
		if id == idNFTs[i][0] {
			// Create the composite key for the NFT
			compositeKey, err := ctx.GetStub().CreateCompositeKey(orderbook, []string{owner, id})
			if err != nil {
				return fmt.Errorf("failed to create composite key for NFT: %v", err)
			}

			// Marshal the status and price into JSON
			data := ListItem{status, price, uint64(taxPercentage)}
			value, err := json.Marshal(data)
			if err != nil {
				return fmt.Errorf("failed to marshal NFT data: %v", err)
			}

			// Save the updated NFT state to the world state
			err = ctx.GetStub().PutState(compositeKey, value)
			if err != nil {
				return fmt.Errorf("failed to set NFT as listed for sale: %v", err)
			}
			return nil
		}
	}

	return fmt.Errorf("Only NFT owner can list for sale")

}

// Check book order for given status
// e.g.
// sale, sold
func (s *SmartContract) GetStatus(ctx contractapi.TransactionContextInterface, status string) ([][]string, error) {

	var forSaleNFTs [][]string

	// Get the NFT state from the world state
	iterator, err := ctx.GetStub().GetStateByPartialCompositeKey(orderbook, []string{})
	if err != nil {
		return nil, fmt.Errorf("failed to create iterator: %v", err)
	}

	// Iterate over all NFTs
	for iterator.HasNext() {

		// Get the next NFT
		responseRange, err := iterator.Next()
		if err != nil {
			return nil, fmt.Errorf("failed to get next token: %v", err)
		}

		// Unpack the composite key (owner - id)
		_, compositeKeyParts, err := ctx.GetStub().SplitCompositeKey(responseRange.Key)
		if err != nil {
			return nil, fmt.Errorf("failed to split composite key: %v", err)
		}

		// Parse the JSON object
		var data ListItem
		err = json.Unmarshal(responseRange.Value, &data)
		if err != nil {
			return nil, fmt.Errorf("failed to unmarshal NFT data: %v", err)
		}

		if data.Status == status {
			price := strconv.FormatUint(data.Price, 10)
			taxes := strconv.FormatUint(data.TaxPercent, 10)
			element := []string{compositeKeyParts[0], compositeKeyParts[1], data.Status, price, taxes}
			forSaleNFTs = append(forSaleNFTs, element)
		}
	}

	return forSaleNFTs, nil
}

// Buy listed NFT paying the asked price
func (s *SmartContract) Buy(ctx contractapi.TransactionContextInterface, buyer string, id string) error {

	// Get the caller identity
	operator, err := ctx.GetClientIdentity().GetID()

	// Check whether operator is approved
	if operator != buyer {
		approved, err := _isApprovedForAll(ctx, buyer, operator)
		if err != nil {
			return err
		}
		if !approved {
			return fmt.Errorf("Chamador não está aprovado a realizar esta transação")
		}
	}

	// Check the status of the NFT
	forSaleNFTs, err := s.GetStatus(ctx, "sale")
	if err != nil {
		return fmt.Errorf("failed to check NFT status: %v", err)
	}

	// Find the NFT that is being sold
	// forSaleNFT[0] = Owner
	// forSaleNFT[1] = TokenID
	// forSaleNFT[2] = Status
	// forSaleNFT[3] = Price
	var found bool
	for _, forSaleNFT := range forSaleNFTs {
		if forSaleNFT[1] == id {
			found = true

			compositeKey, err := ctx.GetStub().CreateCompositeKey(orderbook, []string{forSaleNFT[0], forSaleNFT[1]})
			if err != nil {
				return fmt.Errorf("failed to create composite key: %v", err)
			}

			salePrice, err := strconv.ParseUint(forSaleNFT[3], 10, 64)
			if err != nil {
				return fmt.Errorf("failed to parse price: %v", err)
			}

			err = s.deal(ctx, operator, buyer, forSaleNFT[0], []string{forSaleNFT[1], systemCurrency}, []uint64{1, salePrice})
			if err != nil {
				return fmt.Errorf("failed dealing for NFT: %v", err)
			}

			// Marshal the status and price into JSON
			status := "sold"
			data := struct {
				Status string `json:"status"`
				Price  uint64 `json:"price"`
			}{
				Status: status,
				Price:  salePrice,
			}
			value, err := json.Marshal(data)
			if err != nil {
				return fmt.Errorf("failed to marshal NFT data: %v", err)
			}

			// Save the updated NFT state to the world state
			err = ctx.GetStub().PutState(compositeKey, value)
			if err != nil {
				return fmt.Errorf("failed to set NFT as listed for sale: %v", err)
			}

		}
	}

	if !found {
		return fmt.Errorf("NFT with id %s not found or not for sale", id)
	}

	return nil
}

// execute the deal
// id[0] = NFT
// id[1] = FT
func (s *SmartContract) deal(ctx contractapi.TransactionContextInterface, operator string, buyer string, seller string, id []string, amount []uint64) error {

	// Transfer FT to seller
	err := s.TransferFrom(ctx, buyer, seller, id[1], amount[1])
	if err != nil {
		return err
	}

	// Transfer NFT to buyer
	err = removeBalance(ctx, seller, []string{id[0]}, []uint64{1})
	if err != nil {
		return err
	}

	// Send tax amount to system account
	err = addBalance(ctx, seller, buyer, id[0], 1, *new(Metadata))
	if err != nil {
		return err
	}

	// Update the order book
	status := "sold"

	// Create the composite key for the NFT
	compositeKey, err := ctx.GetStub().CreateCompositeKey(orderbook, []string{seller, id[0]})
	if err != nil {
		return fmt.Errorf("failed to create composite key for NFT: %v", err)
	}

	// Marshal the status and price into JSON
	status = "sale"
	taxes := amount[1] * uint64(taxPercentage) / 100
	data := ListItem{status, amount[1], taxes}
	value, err := json.Marshal(data)
	if err != nil {
		return fmt.Errorf("failed to marshal NFT data: %v", err)
	}

	// Save the updated NFT state to the world state
	err = ctx.GetStub().PutState(compositeKey, value)
	if err != nil {
		return fmt.Errorf("failed to set NFT as listed for sale: %v", err)
	}
	// Emit TransferSingle NFT event
	transferNFT := TransferSingle{operator, seller, buyer, id[0], 1}
	return emitTransferSingle(ctx, transferNFT)

}
func getMetada(ctx contractapi.TransactionContextInterface, account string, tokenId string) (Metadata, error) {
	// Pega todas os pares de chave cuja chave é "account~tokenId~sender"
	// Segundo argumento: uma array cujos valores são verificados no valor do par chave/valor, seguindo a ordem do prefixo. Pode ser vazio: []string{}
	balanceIterator, err := ctx.GetStub().GetStateByPartialCompositeKey(balancePrefix, []string{account, tokenId})
	if err != nil {
		return *new(Metadata), fmt.Errorf("Erro ao obter o prefixo %v: %v", balancePrefix, err)
	}
	// defer: coloca a função deferida na pilha, para ser executa apóso retorno da função em que é executada. Garante que será chamada, seja qual for o fluxo de execução.
	defer balanceIterator.Close()

	// Itera pelos pares chave/valor que deram match
	for balanceIterator.HasNext() {
		queryResponse, err := balanceIterator.Next()
		if err != nil {
			return *new(Metadata), fmt.Errorf("failed to get the next state for prefix %v: %v", balancePrefix, err)
		}

		// Pega a quantidade de tokens TokenId que a conta possui
		// tokenAmount := queryResponse.Value
		nft := new(NFToken)
		_ = json.Unmarshal(queryResponse.Value, nft)
		metadata := nft.Metadata

		// Adiciona info. do token à slice/array de tokens
		return metadata, nil
	}
	return *new(Metadata), fmt.Errorf("Token não encontrado")
}
