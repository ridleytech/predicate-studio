package api

import (
	"encoding/json"
	"errors"
	"net/http"

	"predicate-developer-studio-backend/internal/models"
	"predicate-developer-studio-backend/internal/repositories"
	"predicate-developer-studio-backend/internal/services"
)

type authorizeHandler struct {
	svc *services.AuthorizeService
}

type authorizeRequest struct {
	EvaluationID string `json:"evaluationId"`
	Subject      string `json:"subject"`
	TTLSeconds   int64  `json:"ttlSeconds,omitempty"`
}

func (h *authorizeHandler) handle() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req authorizeRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeError(w, http.StatusBadRequest, "invalid json")
			return
		}
		id, err := models.ParseID(req.EvaluationID)
		if err != nil {
			writeError(w, http.StatusBadRequest, err.Error())
			return
		}

		out, err := h.svc.Authorize(r.Context(), services.AuthorizeInput{EvaluationID: id, Subject: req.Subject, TTLSeconds: req.TTLSeconds})
		if err != nil {
			if errors.Is(err, repositories.ErrNotFound) {
				writeError(w, http.StatusNotFound, "evaluation not found")
				return
			}
			writeError(w, http.StatusBadRequest, err.Error())
			return
		}
		writeJSON(w, http.StatusOK, out)
	}
}
