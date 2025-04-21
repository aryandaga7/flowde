# database.py

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Define the connection string to your PostgreSQL database.
# Replace 'your_user' and 'your_password' with your actual credentials,
# and ensure 'assignment_bot' is the database you created.
DATABASE_URL = "postgresql://aryandaga:3119@localhost/assignment_bot"

# Create the SQLAlchemy engine. This is the starting point for any database operations.
engine = create_engine(DATABASE_URL)

# Create a configured "Session" class.
# Sessions are used to interact with the database (e.g., execute queries, insert data).
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create a base class that our models will inherit from.
# SQLAlchemy uses this to know which classes are our models.
Base = declarative_base()
