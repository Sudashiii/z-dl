# ZLibrary API Application

A Flask-based web application to search and download books from ZLibrary using a REST API. Supports authentication via API keys, configurable login methods, and Docker deployment.

## Features
- **POST /books**: Search and download books by title, language, and format (e.g., EPUB), with files renamed to the sanitized title.
- **POST /credentials**: Update ZLibrary login credentials.
- **Configurable**: Uses `.env` for settings (`keep_books`, `login_remix`, `auth`, `api_keys`).
- **Dockerized**: Runs in a container with volume mounts for `/app/download` and `/app/app.py`.

## ZLibrary Credentials
- Create the file credentials.txt OR use the endpoint to create them late
- Set `login_remix` to false and use the first line for your email/user and the second one for the password (less secure)
- Login in like you normally would and grab the `remix_userid` and `remix_userkey` and put them into the credentials file

### POST /books
- **URL**: `http://localhost:5000/books`
- **Method**: POST
- **Headers** (if `auth=true` in `.env`):
  - `Content-Type: application/json`
  - `X-API-Key: mysecretkey1` (must match a key in `api_keys` from `.env`)
- **Body**:
  ```json
  {
      "title": "Python Crash Course",
      "lang": "english",
      "format": "epub"
  }

### POST /credentials
- **URL**: `http://localhost:5000/credentials`
- **Method**: POST
- **Headers** (if `auth=true` in `.env`):
  - `Content-Type: application/json`
  - `X-API-Key: mysecretkey1` (must match a key in `api_keys` from `.env`)
- **Body**:
  ```json
  {
      "remix_userid": "userId",
      "remix_userkey": "auth"
  }
- Note, also use the same body to update email and password, if you have `login_remix` false