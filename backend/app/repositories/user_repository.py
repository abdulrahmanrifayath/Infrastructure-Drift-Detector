from typing import Optional
from sqlalchemy.orm import Session
from app.domain.models.user import User
from app.repositories.base import BaseRepository


class UserRepository(BaseRepository[User]):
    """
    User repository extending BaseRepository for User specific queries.
    """
    def __init__(self):
        super().__init__(User)

    def get_by_email(self, db: Session, email: str) -> Optional[User]:
        return db.query(User).filter(User.email == email).first()


user_repository = UserRepository()
