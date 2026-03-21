import os
import psycopg2
from dotenv import load_dotenv
from urllib.parse import urlparse

load_dotenv()

db_url = os.getenv("DATABASE_URL")
if not db_url or "postgresql" not in db_url:
    print(f"SKIPPING: DATABASE_URL is not set for PostgreSQL ({db_url})")
    exit(0)

print(f"Testing connection to: {db_url}")

try:
    # Use urlparse for robust parsing
    result = urlparse(db_url)
    username = result.username
    password = result.password
    database = result.path[1:]
    hostname = result.hostname
    port = result.port or 5432
    
    connection = psycopg2.connect(
        host=hostname,
        port=port,
        user=username,
        password=password,
        dbname=database,
        connect_timeout=5
    )
    print("SUCCESS: Connected to PostgreSQL!")
    connection.close()
except Exception as e:
    print(f"FAILURE: Could not connect to PostgreSQL. Error: {str(e)}")
