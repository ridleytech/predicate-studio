package services

import (
	"context"
	"fmt"

	"predicate-developer-studio-backend/internal/models"
	"predicate-developer-studio-backend/internal/repositories"
)

type PoliciesService struct {
	repo repositories.PoliciesRepository
}

func NewPoliciesService(repo repositories.PoliciesRepository) *PoliciesService {
	return &PoliciesService{repo: repo}
}

func (s *PoliciesService) Create(ctx context.Context, name string, policy map[string]any) (models.Policy, error) {
	if name == "" {
		return models.Policy{}, fmt.Errorf("name is required")
	}
	if policy == nil {
		return models.Policy{}, fmt.Errorf("policy is required")
	}

	return s.repo.Create(ctx, models.Policy{Name: name, Policy: policy})
}

func (s *PoliciesService) List(ctx context.Context, limit int64) ([]models.Policy, error) {
	return s.repo.List(ctx, limit)
}

func (s *PoliciesService) Get(ctx context.Context, id models.ID) (models.Policy, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *PoliciesService) Update(ctx context.Context, id models.ID, name *string, policy map[string]any) (models.Policy, error) {
	if name == nil && policy == nil {
		return models.Policy{}, fmt.Errorf("no fields to update")
	}
	return s.repo.Update(ctx, id, repositories.PolicyUpdate{Name: name, Policy: policy})
}

func (s *PoliciesService) Delete(ctx context.Context, id models.ID) error {
	return s.repo.Delete(ctx, id)
}
