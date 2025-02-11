FROM python:3.12-slim

WORKDIR /app

# Install poetry and dependencies
RUN pip install poetry && \
    poetry config virtualenvs.in-project true

# Copy dependency files
COPY pyproject.toml poetry.lock ./

# Install dependencies
RUN poetry install --no-dev --no-root

# Copy application code
COPY . .

# Install the application with all dependencies
RUN poetry install --no-dev

# Set environment variables
ENV HOST=0.0.0.0
ENV PORT=8080

# Run uvicorn directly
CMD ["poetry", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080", "--workers", "1"]
