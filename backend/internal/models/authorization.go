package models

import "time"

type Authorization struct {
	SchemaVersion    int       `bson:"schemaVersion" json:"schemaVersion"`
	Subject          string    `bson:"subject" json:"subject"`
	Amount           float64   `bson:"amount" json:"amount"`
	Nonce            string    `bson:"nonce" json:"nonce"`
	ExpiresAt        time.Time `bson:"expiresAt" json:"expiresAt"`
	PolicyIDHash     string    `bson:"policyIdHash" json:"policyIdHash"`
	EvaluationIDHash string    `bson:"evaluationIdHash" json:"evaluationIdHash"`
	ContractAddress  string    `bson:"contractAddress" json:"contractAddress"`
	ChainID          int64     `bson:"chainId" json:"chainId"`
}
