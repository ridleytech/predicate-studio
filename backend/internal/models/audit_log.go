package models

import "time"

type AuditLog struct {
	ID        ID        `bson:"_id,omitempty" json:"-"`
	JSONID    JSONID    `bson:"-" json:"id"`
	Actor     string    `bson:"actor" json:"actor"`
	Action    string    `bson:"action" json:"action"`
	CreatedAt time.Time `bson:"createdAt" json:"createdAt"`
}

func (a AuditLog) WithJSONID() AuditLog {
	a.JSONID = NewJSONID(a.ID)
	return a
}
