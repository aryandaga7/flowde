# database.py

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
# from core.config import DATABASE_URL


DATABASE_URL = "postgresql://postgres:3119@localhost:5432/FlowdeTestingDB"

# engine = create_engine(DATABASE_URL, connect_args={"sslmode": "require"})
engine = create_engine(DATABASE_URL)

# Create a configured "Session" class.
# Sessions are used to interact with the database (e.g., execute queries, insert data).
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create a base class that our models will inherit from.
# SQLAlchemy uses this to know which classes are our models.
Base = declarative_base()
