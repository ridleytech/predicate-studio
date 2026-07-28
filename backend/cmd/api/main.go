package main

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"predicate-developer-studio-backend/internal/api"
	"predicate-developer-studio-backend/internal/database"
)

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo}))
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	cfg, err := api.LoadConfig()
	if err != nil {
		logger.Error("config load failed", "error", err)
		os.Exit(1)
	}

	mongoClient, err := database.ConnectMongo(ctx, cfg.MongoURI, logger)
	if err != nil {
		logger.Error("mongo connect failed", "error", err)
		os.Exit(1)
	}
	defer func() {
		shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		_ = mongoClient.Disconnect(shutdownCtx)
	}()

	h := api.NewHandler(api.Dependencies{
		Logger:               logger,
		MongoClient:          mongoClient,
		MongoDBName:          cfg.MongoDBName,
		AuthSignerPrivateKey: cfg.AuthSignerPrivateKey,
		ContractAddress:      cfg.ContractAddress,
		ChainID:              cfg.ChainID,
	})

	srv := &http.Server{
		Addr:              cfg.Addr(),
		Handler:           h.Routes(),
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       15 * time.Second,
		WriteTimeout:      15 * time.Second,
		IdleTimeout:       60 * time.Second,
	}

	go func() {
		logger.Info("http server starting", "addr", srv.Addr)
		err := srv.ListenAndServe()
		if err != nil && !errors.Is(err, http.ErrServerClosed) {
			logger.Error("http server error", "error", err)
			stop()
		}
	}()

	<-ctx.Done()

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := srv.Shutdown(shutdownCtx); err != nil {
		logger.Error("http server shutdown failed", "error", err)
		os.Exit(1)
	}

	logger.Info("shutdown complete")
}
