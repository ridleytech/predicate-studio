package models

import (
	"encoding/json"
	"fmt"

	"go.mongodb.org/mongo-driver/v2/bson"
)

type ID = bson.ObjectID

func ParseID(hex string) (ID, error) {
	id, err := bson.ObjectIDFromHex(hex)
	if err != nil {
		return bson.NilObjectID, fmt.Errorf("invalid id: %w", err)
	}
	return id, nil
}

type JSONID bson.ObjectID

func NewJSONID(id bson.ObjectID) JSONID {
	return JSONID(id)
}

func (id JSONID) MarshalJSON() ([]byte, error) {
	oid := bson.ObjectID(id)
	if oid == bson.NilObjectID {
		return []byte("null"), nil
	}
	return json.Marshal(oid.Hex())
}
