package repositories

import (
	"context"
	"errors"
	"fmt"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"

	"predicate-developer-studio-backend/internal/models"
)

func (r *MongoEvaluationsRepository) GetByID(ctx context.Context, id models.ID) (models.Evaluation, error) {
	var e models.Evaluation
	if err := r.col.FindOne(ctx, bson.M{"_id": id}).Decode(&e); err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return models.Evaluation{}, ErrNotFound
		}
		return models.Evaluation{}, fmt.Errorf("find evaluation: %w", err)
	}
	return e.WithJSONID(), nil
}
