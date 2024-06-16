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
	@deno compile --allow-read --allow-write --allow-env --allow-sys --output dist/book-builder main.ts
	@chmod +x dist/book-builder

.PHONY: install
install: ci
	@deno task embed
	@deno install --allow-read --allow-write --allow-env --allow-sys --name book-builder -g -f main.ts

tmp:
	@mkdir -p tmp

.PHONY: install
dev: tmp
	@deno task embed
	@deno install --allow-read --allow-write --allow-env --allow-sys --name book-builder -g -f main.ts

.PHONY: clean
clean:
	@rm -rf tmp || true
	@rm -rf dist || true

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
	@deno test --allow-read
