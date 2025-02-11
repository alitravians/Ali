FROM python:3.12-slim

WORKDIR /app

# Install poetry
RUN pip install poetry && \
    poetry config virtualenvs.in-project true

# Copy dependency files
COPY pyproject.toml poetry.lock ./

# Install dependencies
RUN poetry install --no-dev

# Copy application code
COPY . .

# Run the application
CMD ["poetry", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]
