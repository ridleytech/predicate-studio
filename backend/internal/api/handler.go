package api

import (
	"log/slog"
	"net/http"

	"go.mongodb.org/mongo-driver/v2/mongo"

	"predicate-developer-studio-backend/internal/middleware"
	"predicate-developer-studio-backend/internal/repositories"
	"predicate-developer-studio-backend/internal/services"
)

type Dependencies struct {
	Logger               *slog.Logger
	MongoClient          *mongo.Client
	MongoDBName          string
	AuthSignerPrivateKey string
	ContractAddress      string
	ChainID              int64
}

type Handler struct {
	deps Dependencies
}

func NewHandler(deps Dependencies) *Handler {
	return &Handler{deps: deps}
}

func (h *Handler) Routes() http.Handler {
	mux := http.NewServeMux()

	db := h.deps.MongoClient.Database(h.deps.MongoDBName)
	policiesRepo := repositories.NewMongoPoliciesRepository(db)
	auditRepo := repositories.NewMongoAuditLogsRepository(db)
	policiesSvc := services.NewPoliciesService(policiesRepo, auditRepo)
	policiesHTTP := &policiesHandler{svc: policiesSvc}

	evalsRepo := repositories.NewMongoEvaluationsRepository(db)
	evalsSvc := services.NewEvaluationsService(evalsRepo)
	evalsHTTP := &evaluationsHandler{svc: evalsSvc}
	evalGetHTTP := &evaluationGetHandler{svc: evalsSvc}
	auditSvc := services.NewAuditLogsService(auditRepo)
	auditHTTP := &auditLogsHandler{svc: auditSvc}

	evaluateSvc := services.NewEvaluateService(policiesRepo, evalsRepo, auditRepo)
	evaluateHTTP := &evaluateHandler{svc: evaluateSvc}

	authorizeSvc := services.NewAuthorizeService(policiesRepo, evalsRepo, auditRepo, h.deps.AuthSignerPrivateKey, h.deps.ContractAddress, h.deps.ChainID)
	authorizeHTTP := &authorizeHandler{svc: authorizeSvc}

	mux.HandleFunc("GET /health", h.handleHealth())

	mux.HandleFunc("GET /policies", policiesHTTP.handleList())
	mux.HandleFunc("POST /policies", policiesHTTP.handleCreate())
	mux.HandleFunc("GET /policies/{id}", policiesHTTP.handleGet())
	mux.HandleFunc("PUT /policies/{id}", policiesHTTP.handleUpdate())
	mux.HandleFunc("DELETE /policies/{id}", policiesHTTP.handleDelete())

	mux.HandleFunc("POST /evaluate", evaluateHTTP.handle())
	mux.HandleFunc("POST /authorize", authorizeHTTP.handle())
	mux.HandleFunc("GET /evaluations", evalsHTTP.handleList())
	mux.HandleFunc("GET /evaluations/{id}", evalGetHTTP.handleGet())
	mux.HandleFunc("GET /audit", auditHTTP.handleList())

	return middleware.Chain(
		mux,
		middleware.CORS(middleware.CORSOptions{AllowedOrigins: []string{"http://localhost:3000"}}),
		middleware.RequestID(),
		middleware.Recover(h.deps.Logger),
		middleware.AccessLog(h.deps.Logger),
	)
}
