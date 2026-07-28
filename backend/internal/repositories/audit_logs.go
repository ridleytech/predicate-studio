package repositories

import (
	"context"

	"predicate-developer-studio-backend/internal/models"
)

type AuditLogsRepository interface {
	List(ctx context.Context, limit int64) ([]models.AuditLog, error)
}
