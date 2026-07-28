package models

import "time"

type Evaluation struct {
	ID             ID             `bson:"_id,omitempty" json:"-"`
	JSONID         JSONID         `bson:"-" json:"id"`
	PolicyID       ID             `bson:"policyId" json:"-"`
	PolicyName     string         `bson:"policyName" json:"policyName"`
	Version        int            `bson:"policyVersion" json:"policyVersion"`
	PolicySnapshot map[string]any `bson:"policySnapshot" json:"policySnapshot"`
	Decision       string         `bson:"decision" json:"decision"`
	LatencyMS      int64          `bson:"latencyMs" json:"latencyMs"`
	Reason         string         `bson:"reason" json:"reason"`
	Trace          []TraceEvent   `bson:"trace" json:"trace"`
	Tx             map[string]any `bson:"tx" json:"tx"`
	CreatedAt      time.Time      `bson:"createdAt" json:"createdAt"`
}

func (e Evaluation) WithJSONID() Evaluation {
	e.JSONID = NewJSONID(e.ID)
	return e
}
