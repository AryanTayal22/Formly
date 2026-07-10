import os
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

DATABASE_URL = os.environ.get("DATABASE_URL", f"sqlite:///{Path(__file__).parent.parent / 'formly.db'}")
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {})
SessionLocal = sessionmaker(bind=engine, autoflush=False)

class Base(DeclarativeBase): pass

def db_session():
    db = SessionLocal()
    try: yield db
    finally: db.close()
