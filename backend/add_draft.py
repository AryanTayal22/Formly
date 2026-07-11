import sys
import os

# Add the backend directory to sys.path so we can import app modules
sys.path.append(os.path.dirname(__file__))

from app.database import SessionLocal
from app.models import Form
from app.schemas import QuestionIn
from app.main import replace_questions

def add_draft():
    db = SessionLocal()
    try:
        draft = Form(title="Product Feedback (Draft)", status="draft", thank_you_message="Thanks!")
        replace_questions(draft, [
            QuestionIn(type="short_text", title="What feature would you like to see next?", required=False), 
            QuestionIn(type="multiple_choice", title="How often do you use our product?", required=False, options=["Daily", "Weekly", "Monthly"])
        ])
        db.add(draft)
        db.commit()
        print(f"Successfully added draft form with ID {draft.id}")
    except Exception as e:
        print(f"Error adding draft form: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    add_draft()
