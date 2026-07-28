package repositories

import (
	"context"
	"fmt"
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"

	"predicate-developer-studio-backend/internal/models"
)

type MongoEvaluationsRepository struct {
	col *mongo.Collection
}

func NewMongoEvaluationsRepository(db *mongo.Database) *MongoEvaluationsRepository {
	return &MongoEvaluationsRepository{col: db.Collection("evaluations")}
}

func (r *MongoEvaluationsRepository) Create(ctx context.Context, e models.Evaluation) (models.Evaluation, error) {
	if e.ID == bson.NilObjectID {
		e.ID = bson.NewObjectID()
	}
	if e.CreatedAt.IsZero() {
		e.CreatedAt = time.Now().UTC()
	}

	_, err := r.col.InsertOne(ctx, e)
	if err != nil {
		return models.Evaluation{}, fmt.Errorf("insert evaluation: %w", err)
	}
	return e.WithJSONID(), nil
}

func (r *MongoEvaluationsRepository) List(ctx context.Context, limit int64) ([]models.Evaluation, error) {
	if limit <= 0 {
		limit = 100
	}

	cur, err := r.col.Find(ctx, bson.D{}, options.Find().SetLimit(limit).SetSort(bson.D{{Key: "createdAt", Value: -1}}))
	if err != nil {
		return nil, fmt.Errorf("find evaluations: %w", err)
	}
	defer cur.Close(ctx)

	out := make([]models.Evaluation, 0)
	for cur.Next(ctx) {
		var e models.Evaluation
		if err := cur.Decode(&e); err != nil {
			return nil, fmt.Errorf("decode evaluation: %w", err)
		}
		out = append(out, e.WithJSONID())
	}
	if err := cur.Err(); err != nil {
		return nil, fmt.Errorf("cursor error: %w", err)
	}

	return out, nil
}
