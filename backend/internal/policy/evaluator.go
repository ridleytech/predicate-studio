package policy

import (
	"fmt"
	"strings"
	"time"

	"predicate-developer-studio-backend/internal/models"
)

type EvaluationResult struct {
	Decision  string
	Reason    string
	Trace     []models.TraceEvent
	LatencyMS int64
}

func Evaluate(root CompiledPolicy, tx map[string]any) (EvaluationResult, error) {
	start := time.Now()
	decision, reason, trace, err := eval(root, tx)
	if err != nil {
		return EvaluationResult{}, err
	}
	return EvaluationResult{
		Decision:  decision,
		Reason:    reason,
		Trace:     trace,
		LatencyMS: time.Since(start).Milliseconds(),
	}, nil
}

func eval(node CompiledPolicy, tx map[string]any) (decision string, reason string, trace []models.TraceEvent, err error) {
	switch node.Type {
	case "and":
		if len(node.Rules) == 0 {
			return "DENY", "AND has no rules", []models.TraceEvent{{Type: "logic", Key: "and", Outcome: models.TraceFail, Message: "AND requires rules"}}, nil
		}
		trace = append(trace, models.TraceEvent{Type: "logic", Key: "and", Outcome: models.TracePass, Message: "AND"})

		var foundDecision bool
		var lastReason string
		for _, r := range node.Rules {
			if r.Type == "condition" {
				passed, msg, tr, err := evalCondition(r, tx)
				trace = append(trace, tr...)
				if err != nil {
					return "DENY", "evaluation error", trace, err
				}
				lastReason = msg
				if !passed {
					return "DENY", msg, trace, nil
				}
				continue
			}

			d, rsn, tr, err := eval(r, tx)
			trace = append(trace, tr...)
			if err != nil {
				return "DENY", "evaluation error", trace, err
			}
			lastReason = rsn
			foundDecision = true
			if strings.EqualFold(d, "DENY") {
				return "DENY", rsn, trace, nil
			}
			decision = d
			reason = rsn
		}

		if !foundDecision {
			if lastReason == "" {
				lastReason = "AND passed"
			}
			return "APPROVE", lastReason, trace, nil
		}
		return decision, reason, trace, nil

	case "or":
		if len(node.Rules) == 0 {
			return "DENY", "OR has no rules", []models.TraceEvent{{Type: "logic", Key: "or", Outcome: models.TraceFail, Message: "OR requires rules"}}, nil
		}
		trace = append(trace, models.TraceEvent{Type: "logic", Key: "or", Outcome: models.TracePass, Message: "OR"})
		var lastReason string
		for _, r := range node.Rules {
			d, rsn, tr, err := eval(r, tx)
			trace = append(trace, tr...)
			if err != nil {
				return "DENY", "evaluation error", trace, err
			}
			lastReason = rsn
			if strings.EqualFold(d, "APPROVE") {
				return "APPROVE", rsn, trace, nil
			}
		}
		if lastReason == "" {
			lastReason = "no OR branch approved"
		}
		return "DENY", lastReason, trace, nil

	case "condition":
		passed, msg, tr, err := evalCondition(node, tx)
		trace = append(trace, tr...)
		if err != nil {
			return "DENY", "evaluation error", trace, err
		}
		if passed {
			return "APPROVE", msg, trace, nil
		}
		return "DENY", msg, trace, nil

	case "result":
		dec := strings.ToUpper(node.Decision)
		if dec != "APPROVE" && dec != "DENY" {
			return "DENY", "invalid result decision", []models.TraceEvent{{Type: "result", Outcome: models.TraceFail, Message: "Invalid decision"}}, nil
		}
		trace = append(trace, models.TraceEvent{Type: "result", Key: dec, Outcome: models.TracePass, Message: fmt.Sprintf("Decision: %s", dec)})
		return dec, fmt.Sprintf("Decision: %s", dec), trace, nil

	default:
		return "DENY", "unknown policy node type", []models.TraceEvent{{Type: "error", Outcome: models.TraceFail, Message: fmt.Sprintf("Unknown node type: %s", node.Type)}}, nil
	}
}

func evalCondition(node CompiledPolicy, tx map[string]any) (passed bool, msg string, trace []models.TraceEvent, err error) {
	res, err := EvaluateCondition(node.Key, node.Params, tx)
	if err != nil {
		trace = append(trace, models.TraceEvent{Type: "condition", Key: node.Key, Outcome: models.TraceFail, Message: err.Error()})
		return false, err.Error(), trace, nil
	}
	if res.Passed {
		trace = append(trace, models.TraceEvent{Type: "condition", Key: node.Key, Outcome: models.TracePass, Message: res.Message})
		return true, res.Message, trace, nil
	}
	trace = append(trace, models.TraceEvent{Type: "condition", Key: node.Key, Outcome: models.TraceFail, Message: res.Message})
	return false, res.Message, trace, nil
}
