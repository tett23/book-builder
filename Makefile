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
	@deno task embed
	@deno compile --config ./tsconfig.json --allow-read --allow-write --allow-env --allow-sys --output dist/book-builder --import-map=deno.json main.ts
	@chmod +x dist/book-builder

.PHONY: install
install: ci
	@deno task embed
	@deno install --config ./tsconfig.json --allow-read --allow-write --allow-env --allow-sys --name book-builder --import-map=deno.json -g -f main.ts

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
