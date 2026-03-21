from passlib.context import CryptContext

def test_hashing():
    pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
    
    password = "admin123"
    hashed = pwd_context.hash(password)
    print(f"Password: {password}")
    print(f"Hashed: {hashed}")
    
    verified = pwd_context.verify(password, hashed)
    print(f"Verified: {verified}")
    
    # Simulate DB storage truncation check
    print(f"Hash length: {len(hashed)}")
    
if __name__ == "__main__":
    test_hashing()
