
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

_base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_default_db_path = os.path.join(_base_dir, "qualisense.db")
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{_default_db_path.replace(os.sep, '/')}")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
