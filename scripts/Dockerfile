FROM python:3.11-slim

WORKDIR /app

COPY update_gist/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY update_gist/main.py .
RUN mkdir -p /app/config

CMD ["python", "main.py", "--schedule", "--interval", "1"]
