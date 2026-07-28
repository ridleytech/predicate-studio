package services

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"predicate-developer-studio-backend/internal/models"
	"predicate-developer-studio-backend/internal/policy"
	"predicate-developer-studio-backend/internal/repositories"
)

type EvaluateService struct {
	policies repositories.PoliciesRepository
	evals    repositories.EvaluationsRepository
}

func NewEvaluateService(policies repositories.PoliciesRepository, evals repositories.EvaluationsRepository) *EvaluateService {
	return &EvaluateService{policies: policies, evals: evals}
}

type EvaluateInput struct {
	PolicyID     models.ID
	Transaction  map[string]any
	RequestedAt  time.Time
	RequestID    string
	RequestActor string
}

type EvaluateOutput struct {
	Evaluation models.Evaluation
}

func (s *EvaluateService) Evaluate(ctx context.Context, in EvaluateInput) (EvaluateOutput, error) {
	p, err := s.policies.GetByID(ctx, in.PolicyID)
	if err != nil {
		return EvaluateOutput{}, err
	}

	compiledRaw, ok := p.Policy["compiled"]
	if !ok {
		return EvaluateOutput{}, fmt.Errorf("policy is missing compiled payload")
	}

	b, err := json.Marshal(compiledRaw)
	if err != nil {
		return EvaluateOutput{}, fmt.Errorf("marshal compiled policy: %w", err)
	}

	var compiled policy.CompiledPolicy
	if err := json.Unmarshal(b, &compiled); err != nil {
		return EvaluateOutput{}, fmt.Errorf("unmarshal compiled policy: %w", err)
	}

	res, err := policy.Evaluate(compiled, in.Transaction)
	if err != nil {
		return EvaluateOutput{}, err
	}

	e := models.Evaluation{
		PolicyID:       p.ID,
		Decision:       res.Decision,
		LatencyMS:      res.LatencyMS,
		Reason:         res.Reason,
		Trace:          res.Trace,
		Tx:             in.Transaction,
		CreatedAt:      time.Now().UTC(),
		PolicyName:     p.Name,
		Version:        p.Version,
		PolicySnapshot: p.Policy,
	}

	created, err := s.evals.Create(ctx, e)
	if err != nil {
		return EvaluateOutput{}, err
	}

	return EvaluateOutput{Evaluation: created}, nil
}
