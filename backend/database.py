from sqlmodel import SQLModel, create_engine, Session
from config import DATABASE_URL

# Python App ↔ Engine ↔ Database
engine = create_engine(
    DATABASE_URL,
    echo=True,       # prints SQL queries in terminal.
    connect_args={"check_same_thread": False}
)

# Create DB session
def get_session():
    # A session is: Database Conversation
    # Used to: insert data, query data, update rows, delete rows
    with Session(engine) as session:
        yield session

# This tells SQLModel: Create all tables from all SQLModel classes
def create_tables():
    SQLModel.metadata.create_all(engine)