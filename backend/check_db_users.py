from database.session import SessionLocal
from models.domain import User

def check_users():
    db = SessionLocal()
    try:
        users = db.query(User).all()
        print(f"Total Users in DB: {len(users)}")
        for u in users:
            print(f"User: {u.username}, Role: {u.role}, Hash: {u.password_hash[:20]}...")
    finally:
        db.close()

if __name__ == "__main__":
    check_users()
