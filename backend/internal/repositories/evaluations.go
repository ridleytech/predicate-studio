package repositories

import (
	"context"

	"predicate-developer-studio-backend/internal/models"
)

type EvaluationsRepository interface {
	Create(ctx context.Context, e models.Evaluation) (models.Evaluation, error)
	GetByID(ctx context.Context, id models.ID) (models.Evaluation, error)
	List(ctx context.Context, limit int64) ([]models.Evaluation, error)
}
