.PHONY: up down logs shell pull

# Start the stack
up:
	docker compose up --build -d

# Stop the stack
down:
	docker compose down

# View logs
logs:
	docker compose logs -f

# Enter the container
shell:
	docker compose exec arcade /bin/sh

# Warm up the local brain (Run once)
pull:
	docker compose run --rm ollama ollama pull qwen2.5-coder:7b
