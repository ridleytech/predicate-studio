package blockchain

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"math/big"
	"time"

	"github.com/ethereum/go-ethereum/accounts"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/crypto"
)

const domainTag = "PREDICATE_AUTH_V1"

type AuthPayload struct {
	Subject          common.Address
	AmountWei        *big.Int
	Nonce            [32]byte
	ExpiresAt        uint64
	PolicyIDHash     [32]byte
	EvaluationIDHash [32]byte
	Contract         common.Address
	ChainID          *big.Int
}

func NewNonce() ([32]byte, string, error) {
	var b [32]byte
	if _, err := rand.Read(b[:]); err != nil {
		return [32]byte{}, "", fmt.Errorf("nonce rand: %w", err)
	}
	return b, "0x" + hex.EncodeToString(b[:]), nil
}

func HashIDString(id string) [32]byte {
	return crypto.Keccak256Hash([]byte(id))
}

func AmountToWei(amount float64) *big.Int {
	// PoC: treat amount as decimal ether-like units.
	// Phase 7 is about auth flow; exact token decimals come later.
	if amount <= 0 {
		return big.NewInt(0)
	}
	v := new(big.Float).SetFloat64(amount)
	v.Mul(v, big.NewFloat(1e18))
	i, _ := v.Int(nil)
	return i
}

func ExpiresAtUnix(t time.Time) uint64 {
	if t.IsZero() {
		return 0
	}
	u := t.UTC().Unix()
	if u < 0 {
		return 0
	}
	return uint64(u)
}

func MessageHash(p AuthPayload) common.Hash {
	// Solidity equivalent:
	// keccak256(abi.encodePacked(
	//  "PREDICATE_AUTH_V1",
	//  address(this),
	//  block.chainid,
	//  subject,
	//  amountWei,
	//  nonce,
	//  expiresAt,
	//  policyIdHash,
	//  evaluationIdHash
	// ))

	enc := make([]byte, 0, 32+20+32+20+32+32+32+32+32)
	enc = append(enc, []byte(domainTag)...)
	enc = append(enc, p.Contract.Bytes()...)
	enc = append(enc, common.LeftPadBytes(p.ChainID.Bytes(), 32)...)
	enc = append(enc, p.Subject.Bytes()...)
	enc = append(enc, common.LeftPadBytes(p.AmountWei.Bytes(), 32)...)
	enc = append(enc, p.Nonce[:]...)
	enc = append(enc, common.LeftPadBytes(new(big.Int).SetUint64(p.ExpiresAt).Bytes(), 32)...)
	enc = append(enc, p.PolicyIDHash[:]...)
	enc = append(enc, p.EvaluationIDHash[:]...)
	return crypto.Keccak256Hash(enc)
}

func SignEthMessageHash(messageHash common.Hash, privKeyHex string) (string, error) {
	pk, err := crypto.HexToECDSA(trim0x(privKeyHex))
	if err != nil {
		return "", fmt.Errorf("parse private key: %w", err)
	}
	ethHash := accounts.TextHash(messageHash.Bytes())
	sig, err := crypto.Sign(ethHash, pk)
	if err != nil {
		return "", fmt.Errorf("sign: %w", err)
	}
	return "0x" + hex.EncodeToString(sig), nil
}

func trim0x(s string) string {
	if len(s) >= 2 && (s[0:2] == "0x" || s[0:2] == "0X") {
		return s[2:]
	}
	return s
}
