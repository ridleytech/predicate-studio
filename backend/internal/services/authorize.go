package services

import (
	"context"
	"fmt"
	"math/big"
	"time"

	"github.com/ethereum/go-ethereum/common"

	"predicate-developer-studio-backend/internal/blockchain"
	"predicate-developer-studio-backend/internal/models"
	"predicate-developer-studio-backend/internal/repositories"
)

type AuthorizeService struct {
	policiesRepo repositories.PoliciesRepository
	evalsRepo    repositories.EvaluationsRepository
	auditRepo    repositories.AuditLogsRepository
	signerKey    string
	contractAddr string
	chainID      int64
}

func NewAuthorizeService(policies repositories.PoliciesRepository, evals repositories.EvaluationsRepository, audit repositories.AuditLogsRepository, signerKey string, contractAddr string, chainID int64) *AuthorizeService {
	return &AuthorizeService{policiesRepo: policies, evalsRepo: evals, auditRepo: audit, signerKey: signerKey, contractAddr: contractAddr, chainID: chainID}
}

type AuthorizeInput struct {
	EvaluationID models.ID
	Subject      string
	TTLSeconds   int64
}

type AuthorizeOutput struct {
	Authorization models.Authorization `json:"authorization"`
	Signature     string               `json:"signature"`
}

func (s *AuthorizeService) Authorize(ctx context.Context, in AuthorizeInput) (AuthorizeOutput, error) {
	e, err := s.evalsRepo.GetByID(ctx, in.EvaluationID)
	if err != nil {
		return AuthorizeOutput{}, err
	}
	if e.Decision != "APPROVE" {
		return AuthorizeOutput{}, fmt.Errorf("evaluation is not approved")
	}

	if !common.IsHexAddress(in.Subject) {
		return AuthorizeOutput{}, fmt.Errorf("invalid subject address")
	}
	subjectAddr := common.HexToAddress(in.Subject)

	contract := common.HexToAddress(s.contractAddr)
	nonceBytes, nonceHex, err := blockchain.NewNonce()
	if err != nil {
		return AuthorizeOutput{}, err
	}

	expiresAt := time.Now().UTC().Add(5 * time.Minute)
	if in.TTLSeconds > 0 {
		expiresAt = time.Now().UTC().Add(time.Duration(in.TTLSeconds) * time.Second)
	}

	policyIDHash := blockchain.HashIDString(e.PolicyID.Hex())
	evalIDHash := blockchain.HashIDString(e.ID.Hex())

	amountVal := 0.0
	if v, ok := e.Tx["amount"]; ok {
		switch t := v.(type) {
		case float64:
			amountVal = t
		case int:
			amountVal = float64(t)
		case int64:
			amountVal = float64(t)
		}
	}

	payload := blockchain.AuthPayload{
		Subject:          subjectAddr,
		AmountWei:        blockchain.AmountToWei(amountVal),
		Nonce:            nonceBytes,
		ExpiresAt:        blockchain.ExpiresAtUnix(expiresAt),
		PolicyIDHash:     policyIDHash,
		EvaluationIDHash: evalIDHash,
		Contract:         contract,
		ChainID:          bigInt(s.chainID),
	}

	msgHash := blockchain.MessageHash(payload)
	sig, err := blockchain.SignEthMessageHash(msgHash, s.signerKey)
	if err != nil {
		return AuthorizeOutput{}, err
	}

	auth := models.Authorization{
		SchemaVersion:    1,
		Subject:          subjectAddr.Hex(),
		Amount:           amountVal,
		Nonce:            nonceHex,
		ExpiresAt:        expiresAt,
		PolicyIDHash:     "0x" + common.Bytes2Hex(policyIDHash[:]),
		EvaluationIDHash: "0x" + common.Bytes2Hex(evalIDHash[:]),
		ContractAddress:  contract.Hex(),
		ChainID:          s.chainID,
	}
	if s.auditRepo != nil {
		_, _ = s.auditRepo.Create(ctx, models.AuditLog{Actor: "system", Action: "authorization.create", CreatedAt: time.Now().UTC()})
	}

	return AuthorizeOutput{Authorization: auth, Signature: sig}, nil
}

func bigInt(v int64) *big.Int {
	return new(big.Int).SetInt64(v)
}
