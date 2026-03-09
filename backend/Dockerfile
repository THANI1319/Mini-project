FROM python:3.9-slim

WORKDIR /app

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install Docker CLI (to allow Docker-in-Docker, or use host's Docker socket)
RUN apt-get update && apt-get install -y docker.io && rm -rf /var/lib/apt/lists/*

COPY backend/ /app/backend/
COPY frontend/ /app/frontend/

EXPOSE 5000

CMD ["python", "backend/app.py"]