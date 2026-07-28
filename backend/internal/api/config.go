package api

import (
	"fmt"
	"os"
	"strconv"
)

type Config struct {
	Host                 string
	Port                 int
	MongoURI             string
	MongoDBName          string
	AuthSignerPrivateKey string
	ContractAddress      string
	ChainID              int64
}

func LoadConfig() (Config, error) {
	host := getenvDefault("HOST", "127.0.0.1")
	portStr := getenvDefault("PORT", "8080")
	port, err := strconv.Atoi(portStr)
	if err != nil {
		return Config{}, fmt.Errorf("invalid PORT: %w", err)
	}

	mongoURI := os.Getenv("MONGODB_URI")
	if mongoURI == "" {
		return Config{}, fmt.Errorf("MONGODB_URI is required")
	}

	mongoDBName := getenvDefault("MONGODB_DB", "predicate_developer_studio")

	authSignerPrivateKey := os.Getenv("AUTH_SIGNER_PRIVATE_KEY")
	if authSignerPrivateKey == "" {
		return Config{}, fmt.Errorf("AUTH_SIGNER_PRIVATE_KEY is required")
	}

	contractAddress := os.Getenv("CONTRACT_ADDRESS")
	if contractAddress == "" {
		return Config{}, fmt.Errorf("CONTRACT_ADDRESS is required")
	}

	chainIDStr := getenvDefault("CHAIN_ID", "1337")
	chainID, err := strconv.ParseInt(chainIDStr, 10, 64)
	if err != nil {
		return Config{}, fmt.Errorf("invalid CHAIN_ID: %w", err)
	}

	return Config{
		Host:                 host,
		Port:                 port,
		MongoURI:             mongoURI,
		MongoDBName:          mongoDBName,
		AuthSignerPrivateKey: authSignerPrivateKey,
		ContractAddress:      contractAddress,
		ChainID:              chainID,
	}, nil
}

func (c Config) Addr() string {
	return fmt.Sprintf("%s:%d", c.Host, c.Port)
}

func getenvDefault(key, def string) string {
	v := os.Getenv(key)
	if v == "" {
		return def
	}
	return v
}
