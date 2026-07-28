package services

import (
	"context"

	"predicate-developer-studio-backend/internal/models"
	"predicate-developer-studio-backend/internal/repositories"
)

type EvaluationsService struct {
	repo repositories.EvaluationsRepository
}

func NewEvaluationsService(repo repositories.EvaluationsRepository) *EvaluationsService {
	return &EvaluationsService{repo: repo}
}

func (s *EvaluationsService) List(ctx context.Context, limit int64) ([]models.Evaluation, error) {
	return s.repo.List(ctx, limit)
}

func (s *EvaluationsService) Get(ctx context.Context, id models.ID) (models.Evaluation, error) {
	return s.repo.GetByID(ctx, id)
}
