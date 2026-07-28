package services

import (
	"context"
	"fmt"
	"time"

	"predicate-developer-studio-backend/internal/models"
	"predicate-developer-studio-backend/internal/repositories"
)

type PoliciesService struct {
	repo  repositories.PoliciesRepository
	audit repositories.AuditLogsRepository
}

func NewPoliciesService(repo repositories.PoliciesRepository, audit repositories.AuditLogsRepository) *PoliciesService {
	return &PoliciesService{repo: repo, audit: audit}
}

func (s *PoliciesService) Create(ctx context.Context, name string, policy map[string]any) (models.Policy, error) {
	if name == "" {
		return models.Policy{}, fmt.Errorf("name is required")
	}
	if policy == nil {
		return models.Policy{}, fmt.Errorf("policy is required")
	}

	created, err := s.repo.Create(ctx, models.Policy{Name: name, Policy: policy})
	if err != nil {
		return models.Policy{}, err
	}
	if s.audit != nil {
		_, _ = s.audit.Create(ctx, models.AuditLog{Actor: "system", Action: "policy.create", CreatedAt: time.Now().UTC()})
	}
	return created, nil
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
	updated, err := s.repo.Update(ctx, id, repositories.PolicyUpdate{Name: name, Policy: policy})
	if err != nil {
		return models.Policy{}, err
	}
	if s.audit != nil {
		_, _ = s.audit.Create(ctx, models.AuditLog{Actor: "system", Action: "policy.update", CreatedAt: time.Now().UTC()})
	}
	return updated, nil
}

func (s *PoliciesService) Delete(ctx context.Context, id models.ID) error {
	err := s.repo.Delete(ctx, id)
	if err != nil {
		return err
	}
	if s.audit != nil {
		_, _ = s.audit.Create(ctx, models.AuditLog{Actor: "system", Action: "policy.delete", CreatedAt: time.Now().UTC()})
	}
	return nil
}
