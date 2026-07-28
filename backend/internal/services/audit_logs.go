package services

import (
	"context"

	"predicate-developer-studio-backend/internal/models"
	"predicate-developer-studio-backend/internal/repositories"
)

type AuditLogsService struct {
	repo repositories.AuditLogsRepository
}

func NewAuditLogsService(repo repositories.AuditLogsRepository) *AuditLogsService {
	return &AuditLogsService{repo: repo}
}

func (s *AuditLogsService) List(ctx context.Context, limit int64) ([]models.AuditLog, error) {
	return s.repo.List(ctx, limit)
}
