FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY icon_404.png .
COPY main.py .
RUN mkdir -p /app/config

CMD ["python", "main.py", "--schedule", "--interval", "3"]
