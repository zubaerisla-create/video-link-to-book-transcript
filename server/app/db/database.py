import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from server.app.config import settings

# Engine setup supporting SQLite (development) and MySQL (VPS production)
connect_args = {}
engine_kwargs = {}

if settings.DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False
else:
    # MySQL specific connection settings
    engine_kwargs["pool_pre_ping"] = True
    engine_kwargs["pool_recycle"] = 3600
    engine_kwargs["pool_size"] = 10
    engine_kwargs["max_overflow"] = 20

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    **engine_kwargs,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    # Import models to ensure they are registered with Base metadata
    from server.app.db import models  # noqa: F401
    Base.metadata.create_all(bind=engine)
