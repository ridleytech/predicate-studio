package models

type TraceOutcome string

const (
	TracePass TraceOutcome = "PASS"
	TraceFail TraceOutcome = "FAIL"
)

type TraceEvent struct {
	Type    string       `bson:"type" json:"type"`
	Key     string       `bson:"key,omitempty" json:"key,omitempty"`
	Outcome TraceOutcome `bson:"outcome" json:"outcome"`
	Message string       `bson:"message" json:"message"`
}
