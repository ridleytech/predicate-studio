package policy

type CompiledPolicy struct {
	Type     string           `json:"type"`
	Rules    []CompiledPolicy `json:"rules,omitempty"`
	Key      string           `json:"key,omitempty"`
	Params   map[string]any   `json:"params,omitempty"`
	Decision string           `json:"decision,omitempty"`
}
