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

	"github.com/hyperledger/fabric-contract-api-go/contractapi"

)

// const uriKey = "uri"
const balancePrefix = "account~tokenId~sender"
const approvalPrefix = "account~operator"

const minterMSPID = "CarbonMSP"

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

// Get role (OU) from clientAccountID
func GetRole(clientAccountID string) string {
	//decode from b64
	clientAccountIDPlain, err := base64.StdEncoding.DecodeString(clientAccountID)
	if err != nil {
		panic(err)
	}
	// fmt.Printf("Decoded text: \n%s\n\n", clientAccountIDPlain)

	//get OU from clientAccountID
	re := regexp.MustCompile("^x509::CN=.*?,OU=(admin|client|admin|peer).*$")
	match := re.FindStringSubmatch(string(clientAccountIDPlain))

	// fmt.Println(match[1])

	return match[1]
}

// Mint creates amount tokens of token type id and assigns them to account.
// This function emits a TransferSingle event.
func (s *SmartContract) Mint(ctx contractapi.TransactionContextInterface, account string, id string, amount uint64) error {

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

	// Mint tokens
	err = mintHelper(ctx, operator, account, id, amount)
	if err != nil {
		return err
	}

	// Emit TransferSingle event
	transferSingleEvent := TransferSingle{operator, "0x0", account, id, amount}
	return emitTransferSingle(ctx, transferSingleEvent)
}


// Mint creates amount tokens of token type id and assigns them to account.
// This function emits a TransferSingle event.
func (s *SmartContract) FTFromNFT(ctx contractapi.TransactionContextInterface) (uint64,error) {

	// -------- Get all NFTs --------
	// tokenid is the id of the FTs how will be generated from the NFTs
	var tokenid = "$ylvas"

	
	// Stores a list of all NFTs of the same user (account))
	NFTSumList := make([][]string,0)

	if tokenid == "" {
		return 0, fmt.Errorf("Please inform tokenid!")
	}

	// Check minter authorization - this sample assumes Carbon is the central banker with privilege to mint new tokens
	err := authorizationHelper(ctx)
	if err != nil {
		return 0,err
	}

	// Get ID of submitting client identity
	operator, err := ctx.GetClientIdentity().GetID()
	if err != nil {
		return 0,fmt.Errorf("failed to get client id: %v", err)
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

		fmt.Print(queryResponse)
		// Split Key to search for specific tokenid 
		// The compositekey (account -  tokenid - senderer)
		_, compositeKeyParts, err := ctx.GetStub().SplitCompositeKey(queryResponse.Key)
		
      		  if err != nil {
      		      return 0, fmt.Errorf("failed to get key: %s", queryResponse.Key, err)
     		   }
     		   
     		  // Contains the tokenid if FT probably 'sylvas' and if is an NFT will contain there id
		returnedTokenID := compositeKeyParts[1]
		
		// Contains the account of the user who have the nft
		accountNFT := compositeKeyParts[0]

		// Retrieve all NFTs by analyzing all records and seeing if they aren't FTs/
		if returnedTokenID != tokenid {
		
			// Part to insert the logic of how many sylvas to add for that NFT
			var SylvasAdd int 
			SylvasAdd = 10   // add 10 sylvas per nft
			
			// Function that checks if the NFT receiver is in the temporary Slice Array
			// If found, it returns the index to concatenate the id of the nft found and add the qty of sylvas
			// Otherwise, add to this slice the set of the token id, the receiver and some sylvas
			containInSliceIndex := containInSlice(NFTSumList,accountNFT)
			
			//  Found the account in the list
			if (containInSliceIndex != -1){
				// Concatenates the id of the other nft
				//fmt.Print("ID nfts", NFTSumList[containInSliceIndex][0])
				NFTSumList[containInSliceIndex][0] = string(NFTSumList[containInSliceIndex][0]) + "," + string(returnedTokenID)
				
				// Add the value to the total number of silvas
				//fmt.Print("Sylvas", NFTSumList[containInSliceIndex][2])	
				currentSylv,err := strconv.Atoi(NFTSumList[containInSliceIndex][2])
				fmt.Print(err)
				NFTSumList[containInSliceIndex][2] = strconv.Itoa(currentSylv + SylvasAdd) 		
			}else{
				//fmt.Print("Adicionando Elemento", returnedTokenID, accountNFT)
				element := []string{string(returnedTokenID),accountNFT,strconv.Itoa(SylvasAdd)}
				NFTSumList = append(NFTSumList, element)		
			}
			
						
			// NFTSumList [0] - List of NFTS ids for each user
			// NFTSumList [1] - Account that owns the nfts
			// NFTSumList [2] - Total sylvas associated to be added to that account
									
			for i:= range NFTSumList{
				// 'Minting' the tokens from the temporary list		
				sylvaInt, err := strconv.ParseInt(NFTSumList[i][2], 10, 64)
				err = mintHelper(ctx, operator, string(NFTSumList[i][1]), tokenid, uint64(sylvaInt))
				if err != nil {
					return 0,err
				}
				fmt.Print("AQUI:", string(NFTSumList[i][0]), "-", string(NFTSumList[i][1]), "-", string(NFTSumList[i][2]))
			}		
		}

	}
	

	return uint64(0), nil
}



func containInSlice(NFTSumList [][]string, account string) int {
	// Checks if it has a receiver for sylvas and if yes, returns the index and the ids of the nfts, if not, it returns 0
	// Check the list if there is already a destination with the same code

	for i:= range NFTSumList{
		// If it has, concatenate the id of the NFT in the first and perform the sum of the value of sylvas to be added
		if(NFTSumList[i][1] == account){
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
		err = mintHelper(ctx, operator, account, id, amount)
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
// This function triggers a TransferSingle event
func (s *SmartContract) TransferFrom(ctx contractapi.TransactionContextInterface, sender string, recipient string, id string, amount uint64) error {
	if sender == recipient {
		return fmt.Errorf("transfer to self")
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
	err = removeBalance(ctx, operator, []string{id}, []uint64{amount})
	if err != nil {
		return err
	}

	if recipient == "0x0" {
		return fmt.Errorf("transfer to the zero address")
	}

	// Deposit the fund to the recipient address
	err = addBalance(ctx, operator, recipient, id, amount)
	if err != nil {
		return err
	}

	// Emit TransferSingle event
	transferSingleEvent := TransferSingle{operator, operator, recipient, id, amount}
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
		err = addBalance(ctx, sender, recipient, id, amount)
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

		err = addBalance(ctx, sender, key.To, key.ID, amount)
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
func (s *SmartContract) SelfBalanceNFT(ctx contractapi.TransactionContextInterface) ([][]string) {
	// Get ID of submitting client identity
	clientID, err := ctx.GetClientIdentity().GetID()
	if err != nil {
		ret := make([][]string,0)
		ret = append(ret,[]string{"failed to get client id"})
		return ret
		//return "0", fmt.Errorf("failed to get client id: %v", err)
	}


	idNFTs, _ := idNFTHelper(ctx, clientID)
	return idNFTs
}

// SelfBalance returns the balance of the requesting client's account
func (s *SmartContract) BalanceNFT(ctx contractapi.TransactionContextInterface, account string) ([][]string) {
	idNFTs, _ := idNFTHelper(ctx,account)
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

//  TotalSupply return the total supply of given tokenID
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

//  SetURI set a specific URI containing the metadata related to a given tokenID
func  (s *SmartContract) SetURI(ctx contractapi.TransactionContextInterface, tokenID string, tokenURI string) error {

	err := ctx.GetStub().PutState(tokenID, []byte(tokenURI))
	if err != nil {
		return err
	}

	// Emit setURI event
	setURIEvent := URI{tokenID, tokenURI}
	return emitSetURI(ctx, setURIEvent)

}

//  GetURI return metadata URI related to a given tokenID
func  (s *SmartContract) GetURI(ctx contractapi.TransactionContextInterface, tokenID string) (string, error) {

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

// authorizationHelper checks minter authorization - this sample assumes Carbon is the central banker with privilege to mint new tokens
func authorizationHelper(ctx contractapi.TransactionContextInterface) error {

	clientMSPID, err := ctx.GetClientIdentity().GetMSPID()
	if err != nil {
		return fmt.Errorf("failed to get MSPID: %v", err)
	}
	if clientMSPID != minterMSPID {
		return fmt.Errorf("client is not authorized to mint new tokens")
	}

	return nil
}

func mintHelper(ctx contractapi.TransactionContextInterface, operator string, account string, id string, amount uint64) error {
	if account == "0x0" {
		return fmt.Errorf("mint to the zero address")
	}

	if amount <= 0 {
		return fmt.Errorf("mint amount must be a positive integer")
	}

	err := addBalance(ctx, operator, account, id, amount)
	if err != nil {
		return err
	}

	return nil
}

func addBalance(ctx contractapi.TransactionContextInterface, sender string, recipient string, idString string, amount uint64) error {

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

	err = ctx.GetStub().PutState(balanceKey, []byte(strconv.FormatUint(uint64(balance), 10)))
	if err != nil {
		return err
	}

	return nil
}

func setBalance(ctx contractapi.TransactionContextInterface, sender string, recipient string, idString string, amount uint64) error {

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

	for i := 0; i < len(amounts); i++ {
		necessaryFunds[ids[i]] += amounts[i]
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

			partBalAmount, _ := strconv.ParseUint(string(queryResponse.Value), 10, 64)
			partialBalance += partBalAmount

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
		}

		if partialBalance < neededAmount {
			return fmt.Errorf("sender has insufficient funds for token %v, needed funds: %v, available fund: %v", tokenId, neededAmount, partialBalance)
		} else if partialBalance > neededAmount {
			// Send the remainder back to the sender
			remainder := partialBalance - neededAmount
			if selfRecipientKeyNeedsToBeRemoved {
				// Set balance for the key that has the same address for sender and recipient
				err = setBalance(ctx, sender, sender, tokenId, remainder)
				if err != nil {
					return err
				}
			} else {
				err = addBalance(ctx, sender, sender, tokenId, remainder)
				if err != nil {
					return err
				}
			}

		} else {
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

// balanceOfHelper returns the balance of the given account
func idNFTHelper(ctx contractapi.TransactionContextInterface, account string) ([][]string, error) {

	if account == "0x0" {
		return nil, fmt.Errorf("balance query for the zero address")
	}

	
	// --------Get all NFTs --------
	// tokenid is the id of the FTs how will be generated from the NFTs
	var tokenid = "$ylvas"
	nftlist := make([][]string,0)	
	
	balanceIterator, err := ctx.GetStub().GetStateByPartialCompositeKey(balancePrefix, []string{account})
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
	if ((returnedTokenID != tokenid) && (accountNFT == account)){
		// Merge ID and Value of the NFTs
		element := []string{returnedTokenID, string(queryResponse.Value)}
		nftlist = append(nftlist,element)
		
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
