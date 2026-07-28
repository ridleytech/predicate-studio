package policy

import (
	"fmt"
	"strings"
)

type ConditionResult struct {
	Passed  bool
	Message string
}

func EvaluateCondition(key string, params map[string]any, tx map[string]any) (ConditionResult, error) {
	switch key {
	case "wallet_kyc":
		v, _ := getBool(tx, "wallet", "kyc")
		if v {
			return ConditionResult{Passed: true, Message: "Wallet KYC passed"}, nil
		}
		return ConditionResult{Passed: false, Message: "Wallet KYC failed"}, nil

	case "country":
		expected, _ := getString(params, "country")
		actual, _ := getString(tx, "wallet", "country")
		if expected == "" {
			return ConditionResult{}, fmt.Errorf("country condition requires params.country")
		}
		if strings.EqualFold(expected, actual) {
			return ConditionResult{Passed: true, Message: fmt.Sprintf("Country %s allowed", actual)}, nil
		}
		return ConditionResult{Passed: false, Message: fmt.Sprintf("Country %s not allowed", actual)}, nil

	case "risk_score":
		max, ok := getNumber(params, "max")
		if !ok {
			return ConditionResult{}, fmt.Errorf("risk_score condition requires params.max")
		}
		score, _ := getNumber(tx, "wallet", "riskScore")
		if score <= max {
			return ConditionResult{Passed: true, Message: fmt.Sprintf("Risk score %.2f within limit", score)}, nil
		}
		return ConditionResult{Passed: false, Message: fmt.Sprintf("Risk score %.2f exceeds limit", score)}, nil

	case "max_amount":
		max, ok := getNumber(params, "max")
		if !ok {
			return ConditionResult{}, fmt.Errorf("max_amount condition requires params.max")
		}
		amt, _ := getNumber(tx, "amount")
		if amt <= max {
			return ConditionResult{Passed: true, Message: fmt.Sprintf("Amount %.2f within limit", amt)}, nil
		}
		return ConditionResult{Passed: false, Message: fmt.Sprintf("Amount %.2f exceeds limit", amt)}, nil

	case "wallet_allow_list":
		addr, _ := getString(tx, "wallet", "address")
		allowed := getStringArray(params, "addresses")
		for _, a := range allowed {
			if strings.EqualFold(a, addr) {
				return ConditionResult{Passed: true, Message: "Wallet is allow-listed"}, nil
			}
		}
		return ConditionResult{Passed: false, Message: "Wallet not in allow list"}, nil

	case "wallet_deny_list":
		addr, _ := getString(tx, "wallet", "address")
		denied := getStringArray(params, "addresses")
		for _, a := range denied {
			if strings.EqualFold(a, addr) {
				return ConditionResult{Passed: false, Message: "Wallet is deny-listed"}, nil
			}
		}
		return ConditionResult{Passed: true, Message: "Wallet not in deny list"}, nil

	default:
		return ConditionResult{}, fmt.Errorf("unknown condition key: %s", key)
	}
}

func getString(m map[string]any, keys ...string) (string, bool) {
	v, ok := getNested(m, keys...)
	if !ok {
		return "", false
	}
	s, ok := v.(string)
	return s, ok
}

func getBool(m map[string]any, keys ...string) (bool, bool) {
	v, ok := getNested(m, keys...)
	if !ok {
		return false, false
	}
	b, ok := v.(bool)
	return b, ok
}

func getNumber(m map[string]any, keys ...string) (float64, bool) {
	v, ok := getNested(m, keys...)
	if !ok {
		return 0, false
	}
	switch t := v.(type) {
	case float64:
		return t, true
	case int:
		return float64(t), true
	case int64:
		return float64(t), true
	case jsonNumber:
		f, err := t.Float64()
		if err != nil {
			return 0, false
		}
		return f, true
	default:
		return 0, false
	}
}

type jsonNumber interface {
	Float64() (float64, error)
}

func getStringArray(m map[string]any, key string) []string {
	v, ok := m[key]
	if !ok {
		return nil
	}
	a, ok := v.([]any)
	if !ok {
		return nil
	}

	out := make([]string, 0, len(a))
	for _, it := range a {
		s, ok := it.(string)
		if ok {
			out = append(out, s)
		}
	}
	return out
}

func getNested(m map[string]any, keys ...string) (any, bool) {
	cur := any(m)
	for _, k := range keys {
		nm, ok := cur.(map[string]any)
		if !ok {
			return nil, false
		}
		nxt, ok := nm[k]
		if !ok {
			return nil, false
		}
		cur = nxt
	}
	return cur, true
}
