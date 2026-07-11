import sys
import os

# Add the backend directory to sys.path so we can import app modules
sys.path.append(os.path.dirname(__file__))

from app.database import SessionLocal
from app.models import Form, Question, Response, Answer
from app.schemas import QuestionIn
from app.main import replace_questions

def restore():
    db = SessionLocal()
    try:
        # Form 2: Customer Satisfaction Survey
        form2 = Form(title="Customer Satisfaction Survey", status="published", thank_you_message="Thank you for your valuable feedback!")
        replace_questions(form2, [
            QuestionIn(type="dropdown", title="Which product did you use?", required=True, options=["Formly Basic", "Formly Pro", "Formly Enterprise"]), 
            QuestionIn(type="yes_no", title="Would you recommend us to a friend?", required=True), 
            QuestionIn(type="rating", title="Please rate our support team", required=True), 
            QuestionIn(type="long_text", title="How can we improve?", required=False)
        ])
        db.add(form2)
        db.commit()
        
        for values in [["Formly Pro", "Yes", "5", "Keep up the good work!"], ["Formly Basic", "No", "3", "Needs more features"], ["Formly Enterprise", "Yes", "4", "Great support"]]:
            response = Response(form_id=form2.id)
            db.add(response)
            db.flush()
            db.add_all(Answer(response_id=response.id, question_id=q.id, value=value) for q, value in zip(form2.questions, values))
            
        db.commit()
        print(f"Successfully restored Customer Satisfaction Survey with ID {form2.id}")
    except Exception as e:
        print(f"Error restoring form: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    restore()
