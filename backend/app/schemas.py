from pydantic import BaseModel, Field

class QuestionIn(BaseModel):
    id: int | str | None = None
    type: str
    title: str
    description: str | None = None
    required: bool = False
    options: list[str] | None = None

class FormIn(BaseModel):
    title: str = Field(min_length=1, max_length=180)
    status: str = "draft"
    thank_you_message: str = "Thank you for sharing."
    questions: list[QuestionIn] = []

class AnswerIn(BaseModel):
    question_id: int
    value: str

class ResponseIn(BaseModel):
    answers: list[AnswerIn]
