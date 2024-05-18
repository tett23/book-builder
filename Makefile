SHELL = /bin/sh
.DEFAULT_GOAL := all

required_commands := deno

.PHONY: doctor
doctor:
ifneq (, $(none_commands))
	@echo "No $(none_commands) in $(PATH)"
	@false
else
	@true
endif

.PHONY: all
all: doctor ci build

.PHONY: build
build: clean
	@deno compile --config ./tsconfig.json --unstable --allow-read --allow-write --allow-env --output dist/book-builder main.ts
	@chmod +x dist/book-builder

install: ci
	@deno install --config ./tsconfig.json --unstable --allow-read --allow-write --allow-env --name book-builder main.ts

.PHONY: clean
clean:
	@rm dist/book-builder || true

.PHONY: ci
ci: lint fmt test

.PHONY: lint
lint:
	@deno lint

.PHONY: fmt
fmt:
	@deno fmt

.PHONY: test
test:
	@deno test
