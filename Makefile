.PHONY: help install dev build lint format format-check check

help:
	@echo "Available targets:"
	@echo "  make install       npm install"
	@echo "  make dev           start Vite dev server on 127.0.0.1:5173"
	@echo "  make build         type-check and production build"
	@echo "  make lint          run ESLint"
	@echo "  make format        run Prettier write"
	@echo "  make format-check  run Prettier check"
	@echo "  make check         format-check + lint + build"

install:
	npm install

dev:
	npm run dev -- --host 127.0.0.1 --port 5173

build:
	npm run build

lint:
	npm run lint

format:
	npm run format

format-check:
	npm run format:check

check: format-check lint build
