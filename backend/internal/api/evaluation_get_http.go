package api

import (
	"errors"
	"net/http"

	"predicate-developer-studio-backend/internal/models"
	"predicate-developer-studio-backend/internal/repositories"
	"predicate-developer-studio-backend/internal/services"
)

type evaluationGetHandler struct {
	svc *services.EvaluationsService
}

func (h *evaluationGetHandler) handleGet() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id, err := models.ParseID(r.PathValue("id"))
		if err != nil {
			writeError(w, http.StatusBadRequest, err.Error())
			return
		}

		e, err := h.svc.Get(r.Context(), id)
		if err != nil {
			if errors.Is(err, repositories.ErrNotFound) {
				writeError(w, http.StatusNotFound, "evaluation not found")
				return
			}
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}
		writeJSON(w, http.StatusOK, e)
	}
}
