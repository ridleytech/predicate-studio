package api

import (
	"net/http"
	"strconv"

	"predicate-developer-studio-backend/internal/services"
)

type auditLogsHandler struct {
	svc *services.AuditLogsService
}

func (h *auditLogsHandler) handleList() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		limit := int64(100)
		if q := r.URL.Query().Get("limit"); q != "" {
			if v, err := strconv.ParseInt(q, 10, 64); err == nil {
				limit = v
			}
		}

		items, err := h.svc.List(r.Context(), limit)
		if err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}
		writeJSON(w, http.StatusOK, items)
	}
}
