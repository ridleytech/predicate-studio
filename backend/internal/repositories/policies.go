package repositories

import (
	"context"

	"predicate-developer-studio-backend/internal/models"
)

type PoliciesRepository interface {
	Create(ctx context.Context, p models.Policy) (models.Policy, error)
	List(ctx context.Context, limit int64) ([]models.Policy, error)
	GetByID(ctx context.Context, id models.ID) (models.Policy, error)
	Update(ctx context.Context, id models.ID, update PolicyUpdate) (models.Policy, error)
	Delete(ctx context.Context, id models.ID) error
}

type PolicyUpdate struct {
	Name   *string
	Policy map[string]any
}
