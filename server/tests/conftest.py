import pytest
from server.app.main import reset_rate_limiter


@pytest.fixture(autouse=True)
def reset_rate_limit_state():
    reset_rate_limiter()
    yield
    reset_rate_limiter()
