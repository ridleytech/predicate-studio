package repositories

import (
	"context"
	"errors"
	"fmt"
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"

	"predicate-developer-studio-backend/internal/models"
)

var ErrNotFound = errors.New("not found")

type MongoPoliciesRepository struct {
	col *mongo.Collection
}

func NewMongoPoliciesRepository(db *mongo.Database) *MongoPoliciesRepository {
	return &MongoPoliciesRepository{col: db.Collection("policies")}
}

func (r *MongoPoliciesRepository) Create(ctx context.Context, p models.Policy) (models.Policy, error) {
	now := time.Now().UTC()
	p.ID = bson.NewObjectID()
	p.Version = 1
	p.CreatedAt = now
	p.UpdatedAt = now

	_, err := r.col.InsertOne(ctx, p)
	if err != nil {
		return models.Policy{}, fmt.Errorf("insert policy: %w", err)
	}
	return p.WithJSONID(), nil
}

func (r *MongoPoliciesRepository) List(ctx context.Context, limit int64) ([]models.Policy, error) {
	if limit <= 0 {
		limit = 100
	}

	cur, err := r.col.Find(ctx, bson.D{}, options.Find().SetLimit(limit).SetSort(bson.D{{Key: "updatedAt", Value: -1}}))
	if err != nil {
		return nil, fmt.Errorf("find policies: %w", err)
	}
	defer cur.Close(ctx)

	out := make([]models.Policy, 0)
	for cur.Next(ctx) {
		var p models.Policy
		if err := cur.Decode(&p); err != nil {
			return nil, fmt.Errorf("decode policy: %w", err)
		}
		out = append(out, p.WithJSONID())
	}
	if err := cur.Err(); err != nil {
		return nil, fmt.Errorf("cursor error: %w", err)
	}

	return out, nil
}

func (r *MongoPoliciesRepository) GetByID(ctx context.Context, id models.ID) (models.Policy, error) {
	var p models.Policy
	if err := r.col.FindOne(ctx, bson.M{"_id": id}).Decode(&p); err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return models.Policy{}, ErrNotFound
		}
		return models.Policy{}, fmt.Errorf("find policy: %w", err)
	}
	return p.WithJSONID(), nil
}

func (r *MongoPoliciesRepository) Update(ctx context.Context, id models.ID, update PolicyUpdate) (models.Policy, error) {
	set := bson.M{"updatedAt": time.Now().UTC()}
	if update.Name != nil {
		set["name"] = *update.Name
	}

	updateDoc := bson.M{"$set": set}
	if update.Policy != nil {
		set["policy"] = update.Policy
		updateDoc["$inc"] = bson.M{"version": 1}
	}

	res := r.col.FindOneAndUpdate(
		ctx,
		bson.M{"_id": id},
		updateDoc,
		options.FindOneAndUpdate().SetReturnDocument(options.After),
	)

	var p models.Policy
	if err := res.Decode(&p); err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return models.Policy{}, ErrNotFound
		}
		return models.Policy{}, fmt.Errorf("update policy: %w", err)
	}

	return p.WithJSONID(), nil
}

func (r *MongoPoliciesRepository) Delete(ctx context.Context, id models.ID) error {
	res, err := r.col.DeleteOne(ctx, bson.M{"_id": id})
	if err != nil {
		return fmt.Errorf("delete policy: %w", err)
	}
	if res.DeletedCount == 0 {
		return ErrNotFound
	}
	return nil
}
