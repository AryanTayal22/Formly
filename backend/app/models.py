from datetime import datetime
from sqlalchemy import JSON, Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

class Form(Base):
    __tablename__ = "forms"
    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(180))
    status: Mapped[str] = mapped_column(String(20), default="draft")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    thank_you_message: Mapped[str] = mapped_column(Text, default="Thank you for sharing.")
    questions: Mapped[list["Question"]] = relationship(back_populates="form", cascade="all, delete-orphan", order_by="Question.position")
    responses: Mapped[list["Response"]] = relationship(back_populates="form", cascade="all, delete-orphan")

class Question(Base):
    __tablename__ = "questions"
    id: Mapped[int] = mapped_column(primary_key=True)
    form_id: Mapped[int] = mapped_column(ForeignKey("forms.id"))
    position: Mapped[int] = mapped_column(Integer)
    type: Mapped[str] = mapped_column(String(40))
    title: Mapped[str] = mapped_column(Text)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    required: Mapped[bool] = mapped_column(Boolean, default=False)
    options: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)
    form: Mapped[Form] = relationship(back_populates="questions")
    answers: Mapped[list["Answer"]] = relationship(back_populates="question", cascade="all, delete-orphan")

class Response(Base):
    __tablename__ = "responses"
    id: Mapped[int] = mapped_column(primary_key=True)
    form_id: Mapped[int] = mapped_column(ForeignKey("forms.id"))
    submitted_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    form: Mapped[Form] = relationship(back_populates="responses")
    answers: Mapped[list["Answer"]] = relationship(back_populates="response", cascade="all, delete-orphan")

class Answer(Base):
    __tablename__ = "answers"
    id: Mapped[int] = mapped_column(primary_key=True)
    response_id: Mapped[int] = mapped_column(ForeignKey("responses.id"))
    question_id: Mapped[int] = mapped_column(ForeignKey("questions.id"))
    value: Mapped[str] = mapped_column(Text)
    response: Mapped[Response] = relationship(back_populates="answers")
    question: Mapped[Question] = relationship(back_populates="answers")
