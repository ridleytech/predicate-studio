package api

import (
	"encoding/json"
	"errors"
	"net/http"

	"predicate-developer-studio-backend/internal/models"
	"predicate-developer-studio-backend/internal/repositories"
	"predicate-developer-studio-backend/internal/services"
)

type evaluateHandler struct {
	svc *services.EvaluateService
}

type evaluateRequest struct {
	PolicyID    string         `json:"policyId"`
	Transaction map[string]any `json:"transaction"`
}

func (h *evaluateHandler) handle() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req evaluateRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeError(w, http.StatusBadRequest, "invalid json")
			return
		}
		id, err := models.ParseID(req.PolicyID)
		if err != nil {
			writeError(w, http.StatusBadRequest, err.Error())
			return
		}
		if req.Transaction == nil {
			req.Transaction = map[string]any{}
		}

		out, err := h.svc.Evaluate(r.Context(), services.EvaluateInput{PolicyID: id, Transaction: req.Transaction})
		if err != nil {
			if errors.Is(err, repositories.ErrNotFound) {
				writeError(w, http.StatusNotFound, "policy not found")
				return
			}
			writeError(w, http.StatusBadRequest, err.Error())
			return
		}

		writeJSON(w, http.StatusOK, out.Evaluation)
	}
}
