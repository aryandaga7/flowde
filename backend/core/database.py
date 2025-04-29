# database.py

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from core.config import DATABASE_URL

import socket
orig_getaddrinfo = socket.getaddrinfo
def force_ipv4_getaddrinfo(host, port, family=0, type=0, proto=0, flags=0):
    return orig_getaddrinfo(host, port, socket.AF_INET, type, proto, flags)
socket.getaddrinfo = force_ipv4_getaddrinfo

DATABASE_URL = DATABASE_URL

engine = create_engine(DATABASE_URL, connect_args={"sslmode": "require"})

# Create a configured "Session" class.
# Sessions are used to interact with the database (e.g., execute queries, insert data).
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create a base class that our models will inherit from.
# SQLAlchemy uses this to know which classes are our models.
Base = declarative_base()
