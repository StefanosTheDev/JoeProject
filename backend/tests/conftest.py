"""
Pytest fixtures for API tests.
See docs/HEYGEN_ELEVENLABS_PLAN.md for lockstep testing requirements.
"""
from __future__ import annotations

import os

import pytest
from fastapi.testclient import TestClient

# Ensure test env does not rely on real keys when not needed
os.environ.setdefault("HEYGEN_API_KEY", "")
os.environ.setdefault("ELEVENLABS_API_KEY", "")

# Pytest-asyncio: run async tests marked with @pytest.mark.asyncio
pytest_plugins = ("pytest_asyncio",)


@pytest.fixture(scope="module")
def client() -> TestClient:
    from app.main import app
    return TestClient(app)
