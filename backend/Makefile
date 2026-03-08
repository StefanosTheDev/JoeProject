# Backend make targets

.PHONY: clean reset-pycache

# Remove __pycache__ dirs and .pyc/.pyo files
reset-pycache:
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name '*.pyc' -delete 2>/dev/null || true
	find . -type f -name '*.pyo' -delete 2>/dev/null || true

# Same as reset-pycache (alias)
clean: reset-pycache
