FROM python:3.12-slim

# Install ffmpeg
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY playlist-to-zip/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY playlist-to-zip/ .

RUN mkdir -p /app/downloads

EXPOSE 8000

CMD ["gunicorn", "app:app", "-k", "uvicorn.workers.UvicornWorker", "--bind", "0.0.0.0:8000", "--timeout", "600"]
