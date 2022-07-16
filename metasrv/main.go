package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"

	"github.com/gorilla/mux"
)

type metadata struct {
	TokenId			string	`json:"tokenid"`
	Bioma			string	`json:"bioma"`
	Area			string	`json:"area"`
	Localizacao		string	`json:"localizacao"`
	Status			string	`json:"status"`
}

type allMetadatas []metadata

var metadatas = allMetadatas{

}

func homeLink(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintf(w, "MockMeta file!")
}

func createMetadata(w http.ResponseWriter, r *http.Request) {
	var newMetaData metadata
	reqBody, err := ioutil.ReadAll(r.Body)
	if err != nil {
		fmt.Fprintf(w, "Missing token metadata")
	}
	
	json.Unmarshal(reqBody, &newMetaData)
	fmt.Println("Received metadata!", newMetaData)
	for _, singleMetadata := range metadatas {
		if singleMetadata.TokenId == newMetaData.TokenId  {
			fmt.Println("Metadata already exists!", newMetaData)
			return
		}
	}

	metadatas = append(metadatas, newMetaData)
	w.WriteHeader(http.StatusCreated)

	json.NewEncoder(w).Encode(newMetaData)
}

func getOneMetadata(w http.ResponseWriter, r *http.Request) {
	metadataID := mux.Vars(r)["tokenid"]

	for _, singleMetadata := range metadatas {
		if singleMetadata.TokenId == metadataID {
			json.NewEncoder(w).Encode(singleMetadata)
		}
	}
}

func getAllMetadatas(w http.ResponseWriter, r *http.Request) {
	json.NewEncoder(w).Encode(metadatas)
}

func updateMetadata(w http.ResponseWriter, r *http.Request) {
	metadataID := mux.Vars(r)["tokenid"]
	var updatedMetadata metadata

	reqBody, err := ioutil.ReadAll(r.Body)
	if err != nil {
		fmt.Fprintf(w, "Kindly enter data with the metadata title and description only in order to update")
	}
	json.Unmarshal(reqBody, &updatedMetadata)

	for i, singleMetadata := range metadatas {
		if singleMetadata.TokenId == metadataID {
			singleMetadata.Bioma = updatedMetadata.Bioma
			singleMetadata.Area = updatedMetadata.Area
			singleMetadata.Localizacao = updatedMetadata.Localizacao
			singleMetadata.Status = updatedMetadata.Status
			metadatas = append(metadatas[:i], singleMetadata)
			json.NewEncoder(w).Encode(singleMetadata)
		}
	}
}

func deleteMetadata(w http.ResponseWriter, r *http.Request) {
	metadataID := mux.Vars(r)["tokenid"]

	for i, singleMetadata := range metadatas {
		if singleMetadata.TokenId == metadataID {
			metadatas = append(metadatas[:i], metadatas[i+1:]...)
			fmt.Fprintf(w, "The metadata with ID %v has been deleted successfully", metadataID)
		}
	}
}

func main() {
	router := mux.NewRouter().StrictSlash(true)
	router.HandleFunc("/", homeLink)
	router.HandleFunc("/addnft", createMetadata).Methods("POST")
	router.HandleFunc("/nft", getAllMetadatas).Methods("GET")
	router.HandleFunc("/nft/{tokenid}.json", getOneMetadata).Methods("GET")
	// router.HandleFunc("/metadatas/{id}", updateMetadata).Methods("PATCH")
	// router.HandleFunc("/metadatas/{id}", deleteMetadata).Methods("DELETE")
	log.Fatal(http.ListenAndServe(":8888", router))
}