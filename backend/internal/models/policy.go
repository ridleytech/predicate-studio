package models

import "time"

type Policy struct {
	ID        ID             `bson:"_id,omitempty" json:"-"`
	JSONID    JSONID         `bson:"-" json:"id"`
	Name      string         `bson:"name" json:"name"`
	Version   int            `bson:"version" json:"version"`
	Policy    map[string]any `bson:"policy" json:"policy"`
	CreatedAt time.Time      `bson:"createdAt" json:"createdAt"`
	UpdatedAt time.Time      `bson:"updatedAt" json:"updatedAt"`
}

func (p Policy) WithJSONID() Policy {
	p.JSONID = NewJSONID(p.ID)
	return p
}
