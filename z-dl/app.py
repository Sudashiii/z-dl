# /app/app.py
from flask import Flask, request, jsonify, send_file, send_from_directory
import requests
from Zlibrary import Zlibrary
import os
import io
import re
from dotenv import load_dotenv
from ebooklib import epub
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Load environment variables
load_dotenv()
CREDENTIALS_FILE = os.path.join(os.path.dirname(__file__), "credentials.txt")
DOWNLOAD_DIR = os.path.join(os.path.dirname(__file__), "download")
KEEP_BOOKS = os.getenv("keep_books", "false").lower() == "true"
LOGIN_REMIX = os.getenv("login_remix", "true").lower() == "true"
AUTH_ENABLED = os.getenv("auth", "false").lower() == "true"
API_KEYS = os.getenv("api_keys", "").split(",") if os.getenv("api_keys") else []
OPEN_ROUTER_API_KEY = os.getenv("open_router_api_key", "")
OPEN_ROUTER_API_URL = os.getenv("open_router_url", "")
STORAGE_URL = os.getenv("STORAGE_URL")

# Middleware to check API key if auth is enabled
def check_api_key():
    if not AUTH_ENABLED:
        return True
    api_key = request.headers.get("X-API-Key")
    if not api_key or api_key not in API_KEYS:
        return False
    return True

# Function to sanitize title for filename
def sanitize_filename(title, extension):
    # Remove invalid characters, replace spaces with underscores, and ensure extension
    sanitized = re.sub(r'[^\w\s-]', '', title).strip().replace(' ', '_')
    sanitized = sanitized if sanitized else 'book'
    return f"{sanitized}.{extension.lower()}"

# Initialize or create credentials file
def initialize_credentials():
    if not os.path.exists(CREDENTIALS_FILE):
        try:
            with open(CREDENTIALS_FILE, "w", encoding="utf-8") as file:
                file.write("\n\n")  # Create empty file with two lines
            print(f"Created empty '{CREDENTIALS_FILE}'. Please update via POST /credentials.")
        except Exception as e:
            raise Exception(f"Error creating '{CREDENTIALS_FILE}': {str(e)}")

# Load credentials from file
def load_credentials():
    initialize_credentials()
    try:
        with open(CREDENTIALS_FILE, "r", encoding="utf-8") as file:
            lines = [line.strip() for line in file]
            if len(lines) < 2:
                raise ValueError("credentials.txt must contain at least two lines")
            if LOGIN_REMIX:
                return {"remix_userid": lines[0], "remix_userkey": lines[1]}
            else:
                return {"email": lines[0], "password": lines[1]}
    except Exception as e:
        raise Exception(f"Error reading '{CREDENTIALS_FILE}': {str(e)}")

# Initialize Zlibrary
zlib = None
try:
    creds = load_credentials()
    if LOGIN_REMIX:
        zlib = Zlibrary(remix_userid=creds["remix_userid"], remix_userkey=creds["remix_userkey"])
    else:
        zlib = Zlibrary(email=creds["email"], password=creds["password"])
    if not zlib.isLoggedIn():
        raise Exception("Login failed! Please check credentials in credentials.txt")
    print("ZLibrary login successful!")
except Exception as e:
    print(f"Error during ZLibrary login: {str(e)}")
    zlib = None

@app.route("/")
def index():
    return send_from_directory(".", "index.html")

@app.route("/auth-check")
def auth_check():
    if not check_api_key():
        return jsonify({"error": "Invalid or missing API key"}), 401
    return jsonify({"message": "API key is valid"}), 200

@app.route("/books", methods=["POST"])
def download_book():
    if not check_api_key():
        return jsonify({"error": "Invalid or missing API key"}), 401

    if not zlib or not zlib.isLoggedIn():
        return jsonify({"error": "ZLibrary not initialized or login failed"}), 500

    # Get JSON payload
    data = request.get_json()
    if not data:
        return jsonify({"error": "No JSON data provided"}), 400

    # Validate required fields
    title = data.get("title")
    lang = data.get("lang")
    format = data.get("format")
    titlefix = data.get("titlefix")

    if not title:
        return jsonify({"error": "Missing required field: title"}), 400
    if not lang:
        return jsonify({"error": "Missing required field: lang"}), 400
    if not format:
        return jsonify({"error": "Missing required field: format"}), 400

    if titlefix == "on":
        title = normalize_book_title(title)

    try:
        # Create download directory if it doesn't exist
        os.makedirs(DOWNLOAD_DIR, exist_ok=True)

        # Search for the book
        results = zlib.search(message=title, languages=lang, extensions=format)
        books = results.get("books", [])

        if not books:
            # Fallback to any format if specified format not found
            results = zlib.search(message=title, languages=lang)
            books = results.get("books", [])
            if not books:
                return jsonify({"error": f"No books found for title '{title}' in language '{lang}'"}), 404

        # Get the first book from results
        book = books[0]
        book_format = book.get("extension", format)


        # Download the book
        filename, filecontent = zlib.downloadBook(book)

        # Use the provided title for the filename, sanitized
        new_filename = sanitize_filename(book["title"], book_format)

        # Save to download directory with sanitized title
        file_path = os.path.join(DOWNLOAD_DIR, new_filename)
        with open(file_path, "wb") as bookfile:
            bookfile.write(filecontent)

        if book_format.lower() == "epub":
            epubBook = epub.read_epub(file_path)
            epubBook.set_title(book["title"])
            epub.write_epub(file_path, epubBook)

        upload_url = STORAGE_URL + "/" + new_filename
        upload_epub(file_path, upload_url)

        # Send the file as a binary response
        response = send_file(
            io.BytesIO(filecontent),
            download_name=new_filename,
            as_attachment=True,
            mimetype=f"application/{book_format.lower()}"
        )

        # Delete the file if keep_books is false
        if not KEEP_BOOKS:
            try:
                os.remove(file_path)
                print(f"Deleted file: {file_path}")
            except Exception as e:
                print(f"Warning: Could not delete file '{file_path}': {str(e)}")

        return response

    except Exception as e:
        return jsonify({"error": f"Error downloading book '{title}': {str(e)}"}), 500

@app.route("/books-list", methods=["POST"])
def books_list():
    if not check_api_key():
        return jsonify({"error": "Invalid or missing API key"}), 401

    if not zlib or not zlib.isLoggedIn():
        return jsonify({"error": "ZLibrary not initialized or login failed"}), 500

    # Get JSON payload
    data = request.get_json()
    if not data:
        return jsonify({"error": "No JSON data provided"}), 400

    # Validate required fields
    title = data.get("title")
    lang = data.get("lang")
    format = data.get("format")
    titlefix = data.get("titlefix")

    try:
        # Search for the book
        results = zlib.search(message=title, languages=lang, extensions=format)
        books = results.get("books", [])

        if not books:
            # Fallback to any format if specified format not found
            results = zlib.search(message=title, languages=lang)
            books = results.get("books", [])
            if not books:
                return jsonify({"error": f"No books found for title '{title}' in language '{lang}'"}), 404
        
        return jsonify(books), 200
    except Exception as e:
        return jsonify({"error": f"Error downloading book '{title}': {str(e)}"}), 500

@app.route("/books-download", methods=["POST"])
def download_book2():
    if not check_api_key():
        return jsonify({"error": "Invalid or missing API key"}), 401

    if not zlib or not zlib.isLoggedIn():
        return jsonify({"error": "ZLibrary not initialized or login failed"}), 500

    # Get JSON payload
    data = request.get_json()
    if not data:
        return jsonify({"error": "No JSON data provided"}), 400

    # Validate required fields
    id = data.get("id")
    hash = data.get("hash")
    title = data.get("title")
    format = data.get("format")

    if not id:
        return jsonify({"error": "Missing required field: id"}), 400
    if not hash:
        return jsonify({"error": "Missing required field: hash"}), 400
    try:
        # Create download directory if it doesn't exist
        os.makedirs(DOWNLOAD_DIR, exist_ok=True)

        # Download the book
        filename, filecontent = zlib.downloadBookByIdAndHash(id, hash)

        # Use the provided title for the filename, sanitized
        new_filename = sanitize_filename(title, format)

        # Save to download directory with sanitized title
        file_path = os.path.join(DOWNLOAD_DIR, new_filename)
        with open(file_path, "wb") as bookfile:
            bookfile.write(filecontent)

        if format.lower() == "epub":
            epubBook = epub.read_epub(file_path)
            epubBook.set_title(title)
            epub.write_epub(file_path, epubBook)

        upload_url = STORAGE_URL + "/" + new_filename
        upload_epub(file_path, upload_url)

        # Send the file as a binary response
        response = send_file(
            io.BytesIO(filecontent),
            download_name=new_filename,
            as_attachment=True,
            mimetype=f"application/{format.lower()}"
        )

        return response

    except Exception as e:
        return jsonify({"error": f"Error downloading book '{title}': {str(e)}"}), 500


def upload_epub(file_path: str, upload_url: str):
    with open(file_path, "rb") as f:
        data = f.read()
    headers = {"Content-Type": "application/epub+zip"}
    response = requests.put(upload_url, data=data, headers=headers)

    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")

@app.route("/credentials", methods=["POST"])
def update_credentials():
    if not check_api_key():
        return jsonify({"error": "Invalid or missing API key"}), 401
 
    # Get JSON payload
    data = request.get_json()
    if not data:
        return jsonify({"error": "No JSON data provided"}), 400

    # Validate required fields based on login_remix
    if LOGIN_REMIX:
        required_fields = ["remix_userid", "remix_userkey"]
        creds_to_write = [data.get("remix_userid", ""), data.get("remix_userkey", "")]
    else:
        required_fields = ["email", "password"]
        creds_to_write = [data.get("email", ""), data.get("password", "")]

    for field in required_fields:
        if not data.get(field):
            return jsonify({"error": f"Missing required field: {field}"}), 400

    try:
        # Write new credentials to file
        with open(CREDENTIALS_FILE, "w", encoding="utf-8") as file:
            file.write("\n".join(creds_to_write) + "\n")

        # Attempt to re-login with new credentials
        global zlib
        if LOGIN_REMIX:
            zlib = Zlibrary(remix_userid=data["remix_userid"], remix_userkey=data["remix_userkey"])
        else:
            zlib = Zlibrary(email=data["email"], password=data["password"])
        if not zlib.isLoggedIn():
            raise Exception("Login failed with new credentials!")

        return jsonify({"message": "Credentials updated successfully and login verified"}), 200

    except Exception as e:
        return jsonify({"error": f"Error updating credentials: {str(e)}"}), 500

def normalize_book_title(title: str) -> str:
    if not OPEN_ROUTER_API_KEY or not OPEN_ROUTER_API_URL:
        print("OpenRouter API key or URL not set. Skipping title normalization.")
        return title

    try:
        API_KEY = OPEN_ROUTER_API_KEY
        API_URL = OPEN_ROUTER_API_URL

        headers = {
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json",
        }

        data = {
            "model": "openai/gpt-oss-20b:free",  
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "You are an expert in book metadata correction. "
                        "Given a possibly misspelled or incomplete title, "
                        "return ONLY the most likely correct full title of a real book. "
                        "Never invent new books or add commentary. "
                        "Output must be just the title, nothing else."
                    ),
                },
                {
                    "role": "user",
                    "content": "harry poter and the goblt of fire",
                },
                {
                    "role": "assistant",
                    "content": "Harry Potter and the Goblet of Fire",
                },
                {
                    "role": "user",
                    "content": title.strip(),
                },
            ],
            "extra_body":{"reasoning": "false"},

            "temperature": 0.2,  
        }

        response = requests.post(API_URL, headers=headers, json=data)
        response.raise_for_status()

        result = response.json()
        corrected = result["choices"][0]["message"]["content"].strip()
        return corrected
    except Exception as e:
        print(f"Error normalizing title '{title}': {str(e)}")
        return title

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=6126, debug=True)