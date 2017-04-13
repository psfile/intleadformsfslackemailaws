package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/gorilla/mux"
	"github.com/nimajalali/go-force/force"
	"github.com/nimajalali/go-force/sobjects"
)

type lead_struct struct {
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	Company   string `json:"company"`
	Phone     string `json:"phone"`
	Email     string `json:"email"`
}

type CustomLead struct {
	sobjects.Lead
	Email string `force:",omitempty"`
	Phone string `force:",omitempty"`
}

func main() {

	port := os.Getenv("PORT")
	if port == "" {
		port = "5000"
	}

	router := mux.NewRouter().StrictSlash(true)
	router.HandleFunc("/", Test)
	router.HandleFunc("/lead", ProcessLead)

	log.Printf("Listening on port %s\n\n", port)
	http.ListenAndServe(":"+port, router)
}

func Test(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintln(w, "Successful Tom!")
}

func ProcessLead(w http.ResponseWriter, r *http.Request) {

	decoder := json.NewDecoder(r.Body)
	var l lead_struct
	err := decoder.Decode(&l)

	if err != nil {
		log.Fatal(err)
	}

	company := l.Company
	fname := l.FirstName
	lname := l.LastName
	phone := l.Phone
	email := l.Email

	apiVersion := os.Getenv("API")
	appKey := os.Getenv("AppKey")
	appSecret := os.Getenv("AppSecret")
	username := os.Getenv("Username")
	pass := os.Getenv("Password")
	token := os.Getenv("UserToken")

	fmt.Println(apiVersion)
	fmt.Println(company)

	forceApi, err := force.Create(
		apiVersion,
		appKey,
		appSecret,
		username,
		pass,
		token,
		"production",
	)
	if err != nil {
		log.Fatal(err)
	}

	fmt.Println("Time to create the lead!")

	lead := &CustomLead{}
	lead.Company = company
	lead.FirstName = fname
	lead.LastName = lname
	lead.Phone = phone
	lead.Email = email

	resp, err := forceApi.InsertSObject(lead)
	if err != nil {
		fmt.Println(err)
	}

	if len(resp.Id) == 0 {
		fmt.Println(resp)
	}
	fmt.Fprintln(w, "lead id:", resp.Id)
}
