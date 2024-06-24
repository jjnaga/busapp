FROM python:3.12-slim-bullseye

# Set environment variables
# Prevents Python from writing .pyc files
ENV PYTHONDONTWRITEBYTECODE 1
# Ensures Python output is sent straight to the container log
ENV PYTHONUNBUFFERED 1

# Set the working directory
WORKDIR /app

# Install Python dependencies
COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt


COPY src/ /app/src/

# Run as non-root user
RUN useradd -m appuser
USER appuser

# Run the application
CMD ["python", "src/main.py"]