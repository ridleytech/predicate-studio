package api

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"

	"predicate-developer-studio-backend/internal/models"
	"predicate-developer-studio-backend/internal/repositories"
	"predicate-developer-studio-backend/internal/services"
)

type policiesHandler struct {
	svc *services.PoliciesService
}

type createPolicyRequest struct {
	Name   string         `json:"name"`
	Policy map[string]any `json:"policy"`
}

type updatePolicyRequest struct {
	Name   *string        `json:"name"`
	Policy map[string]any `json:"policy"`
}

func (h *policiesHandler) handleList() http.HandlerFunc {
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

func (h *policiesHandler) handleCreate() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req createPolicyRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeError(w, http.StatusBadRequest, "invalid json")
			return
		}

		p, err := h.svc.Create(r.Context(), req.Name, req.Policy)
		if err != nil {
			writeError(w, http.StatusBadRequest, err.Error())
			return
		}
		writeJSON(w, http.StatusCreated, p)
	}
}

func (h *policiesHandler) handleGet() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id, err := models.ParseID(r.PathValue("id"))
		if err != nil {
			writeError(w, http.StatusBadRequest, err.Error())
			return
		}

		p, err := h.svc.Get(r.Context(), id)
		if err != nil {
			if errors.Is(err, repositories.ErrNotFound) {
				writeError(w, http.StatusNotFound, "policy not found")
				return
			}
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}
		writeJSON(w, http.StatusOK, p)
	}
}

func (h *policiesHandler) handleUpdate() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id, err := models.ParseID(r.PathValue("id"))
		if err != nil {
			writeError(w, http.StatusBadRequest, err.Error())
			return
		}

		var req updatePolicyRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeError(w, http.StatusBadRequest, "invalid json")
			return
		}

		p, err := h.svc.Update(r.Context(), id, req.Name, req.Policy)
		if err != nil {
			if errors.Is(err, repositories.ErrNotFound) {
				writeError(w, http.StatusNotFound, "policy not found")
				return
			}
			writeError(w, http.StatusBadRequest, err.Error())
			return
		}

		writeJSON(w, http.StatusOK, p)
	}
}

func (h *policiesHandler) handleDelete() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id, err := models.ParseID(r.PathValue("id"))
		if err != nil {
			writeError(w, http.StatusBadRequest, err.Error())
			return
		}

		if err := h.svc.Delete(r.Context(), id); err != nil {
			if errors.Is(err, repositories.ErrNotFound) {
				writeError(w, http.StatusNotFound, "policy not found")
				return
			}
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}

		w.WriteHeader(http.StatusNoContent)
	}
}
