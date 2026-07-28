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

type MongoAuditLogsRepository struct {
	col *mongo.Collection
}

func NewMongoAuditLogsRepository(db *mongo.Database) *MongoAuditLogsRepository {
	return &MongoAuditLogsRepository{col: db.Collection("auditLogs")}
}

func (r *MongoAuditLogsRepository) List(ctx context.Context, limit int64) ([]models.AuditLog, error) {
	if limit <= 0 {
		limit = 100
	}

	cur, err := r.col.Find(ctx, bson.D{}, options.Find().SetLimit(limit).SetSort(bson.D{{Key: "createdAt", Value: -1}}))
	if err != nil {
		return nil, fmt.Errorf("find audit logs: %w", err)
	}
	defer cur.Close(ctx)

	var out []models.AuditLog
	for cur.Next(ctx) {
		var a models.AuditLog
		if err := cur.Decode(&a); err != nil {
			return nil, fmt.Errorf("decode audit log: %w", err)
		}
		out = append(out, a.WithJSONID())
	}
	if err := cur.Err(); err != nil {
		return nil, fmt.Errorf("cursor error: %w", err)
	}

	return out, nil
}

func (r *MongoAuditLogsRepository) Create(ctx context.Context, a models.AuditLog) (models.AuditLog, error) {
	if a.CreatedAt.IsZero() {
		a.CreatedAt = time.Now().UTC()
	}
	res, err := r.col.InsertOne(ctx, a)
	if err != nil {
		return models.AuditLog{}, fmt.Errorf("insert audit log: %w", err)
	}
	if id, ok := res.InsertedID.(bson.ObjectID); ok {
		a.ID = models.ID(id)
	}
	return a.WithJSONID(), nil
}
