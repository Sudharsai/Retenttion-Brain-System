import os
import pymysql
from dotenv import load_dotenv

load_dotenv()

db_url = os.getenv("DATABASE_URL")
print(f"Testing connection to: {db_url}")

try:
    # Manual parse for pymysql test
    # mysql+pymysql://rb_user:rb_password@localhost:3307/retention_brain
    parts = db_url.split("://")[1].split("@")
    creds = parts[0].split(":")
    addr = parts[1].split("/")
    host_port = addr[0].split(":")
    
    connection = pymysql.connect(
        host=host_port[0],
        port=int(host_port[1]),
        user=creds[0],
        password=creds[1],
        database=addr[1],
        connect_timeout=5
    )
    print("SUCCESS: Connected to MySQL!")
    connection.close()
except Exception as e:
    print(f"FAILURE: Could not connect to MySQL. Error: {str(e)}")
