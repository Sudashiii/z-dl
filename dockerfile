FROM python:3.12-slim

WORKDIR /app

COPY app.py .
COPY Zlibrary.py .

RUN pip install --no-cache-dir flask requests python-dotenv

RUN mkdir -p /app/download

EXPOSE 5000

ENV FLASK_ENV=production

CMD ["python", "app.py"]