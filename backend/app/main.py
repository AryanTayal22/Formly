from contextlib import asynccontextmanager
from typing import Any

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import engine, Base, db_session, SessionLocal
from app.models import Form, Question, Response, Answer
from app.schemas import FormIn, QuestionIn, ResponseIn

def form_out(form: Form, include_questions=True) -> dict[str, Any]:
    result = {"id": form.id, "title": form.title, "status": form.status, "created_at": form.created_at, "updated_at": form.updated_at, "response_count": len(form.responses), "thank_you_message": form.thank_you_message}
    if include_questions: result["questions"] = [{"id": q.id, "position": q.position, "type": q.type, "title": q.title, "description": q.description, "required": q.required, "options": q.options} for q in form.questions]
    return result

def replace_questions(form: Form, data: list[QuestionIn]):
    existing = {q.id: q for q in form.questions}
    new_questions = []
    for i, item in enumerate(data):
        item_data = item.model_dump(exclude={"id"})
        if isinstance(item.id, int) and item.id in existing:
            q = existing[item.id]
            for k, v in item_data.items(): setattr(q, k, v)
            q.position = i
            new_questions.append(q)
        else:
            new_questions.append(Question(position=i, **item_data))
    form.questions = new_questions

def seed(db: Session):
    if db.scalar(func.count(Form.id)): return
    
    # Form 1: Welcome survey
    form1 = Form(title="Welcome survey", status="published")
    replace_questions(form1, [QuestionIn(type="short_text", title="What should we call you?", description="We'd love to get to know you.", required=True), QuestionIn(type="multiple_choice", title="What brings you here today?", required=True, options=["Explore a new idea", "Share feedback", "Join the community"]), QuestionIn(type="rating", title="How was your experience?"), QuestionIn(type="long_text", title="Anything else you'd like to share?")])
    db.add(form1); db.commit()
    for values in [["Maya", "Explore a new idea", "5", "Loved it"], ["Jordan", "Share feedback", "4", "Very smooth"]]:
        response = Response(form_id=form1.id); db.add(response); db.flush()
        db.add_all(Answer(response_id=response.id, question_id=q.id, value=value) for q, value in zip(form1.questions, values))
    
    # Form 2: Customer Satisfaction Survey
    form2 = Form(title="Customer Satisfaction Survey", status="published", thank_you_message="Thank you for your valuable feedback!")
    replace_questions(form2, [QuestionIn(type="dropdown", title="Which product did you use?", required=True, options=["Formly Basic", "Formly Pro", "Formly Enterprise"]), QuestionIn(type="yes_no", title="Would you recommend us to a friend?", required=True), QuestionIn(type="rating", title="Please rate our support team", required=True), QuestionIn(type="long_text", title="How can we improve?", required=False)])
    db.add(form2); db.commit()
    for values in [["Formly Pro", "Yes", "5", "Keep up the good work!"], ["Formly Basic", "No", "3", "Needs more features"], ["Formly Enterprise", "Yes", "4", "Great support"]]:
        response = Response(form_id=form2.id); db.add(response); db.flush()
        db.add_all(Answer(response_id=response.id, question_id=q.id, value=value) for q, value in zip(form2.questions, values))
        
    # Form 3: Event RSVP
    form3 = Form(title="Community Event RSVP", status="published", thank_you_message="See you at the event!")
    replace_questions(form3, [QuestionIn(type="short_text", title="What is your full name?", required=True), QuestionIn(type="email", title="What is your email address?", required=True), QuestionIn(type="number", title="How many guests are you bringing?", required=True), QuestionIn(type="multiple_choice", title="Any dietary restrictions?", required=False, options=["None", "Vegetarian", "Vegan", "Gluten-Free"])])
    db.add(form3); db.commit()
    for values in [["Eli Brown", "eli@example.com", "1", "Vegetarian"], ["Zara Ahmed", "zara@example.com", "0", "None"]]:
        response = Response(form_id=form3.id); db.add(response); db.flush()
        db.add_all(Answer(response_id=response.id, question_id=q.id, value=value) for q, value in zip(form3.questions, values))

    # Form 4: Product Feedback (Draft)
    form4 = Form(title="Product Feedback (Draft)", status="draft", thank_you_message="Thanks!")
    replace_questions(form4, [QuestionIn(type="short_text", title="What feature would you like to see next?", required=False), QuestionIn(type="multiple_choice", title="How often do you use our product?", required=False, options=["Daily", "Weekly", "Monthly"])])
    db.add(form4)

    db.commit()
@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(engine)
    with SessionLocal() as db: seed(db)
    yield

app = FastAPI(title="Formly API", version="1.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

@app.get("/health")
def health(): return {"ok": True}

@app.get("/forms")
def list_forms(db: Session = Depends(db_session)): return [form_out(f, False) for f in db.query(Form).order_by(Form.updated_at.desc()).all()]

@app.post("/forms", status_code=201)
def create_form(data: FormIn, db: Session = Depends(db_session)):
    form = Form(title=data.title, status=data.status, thank_you_message=data.thank_you_message); replace_questions(form, data.questions); db.add(form); db.commit(); db.refresh(form); return form_out(form)

@app.get("/forms/{form_id}")
def get_form(form_id: int, db: Session = Depends(db_session)):
    form = db.get(Form, form_id)
    if not form: raise HTTPException(404, "Form not found")
    return form_out(form)

@app.put("/forms/{form_id}")
def update_form(form_id: int, data: FormIn, db: Session = Depends(db_session)):
    form = db.get(Form, form_id)
    if not form: raise HTTPException(404, "Form not found")
    form.title, form.status, form.thank_you_message = data.title, data.status, data.thank_you_message; replace_questions(form, data.questions); db.commit(); db.refresh(form); return form_out(form)

@app.delete("/forms/{form_id}", status_code=204)
def delete_form(form_id: int, db: Session = Depends(db_session)):
    form = db.get(Form, form_id)
    if not form: raise HTTPException(404, "Form not found")
    db.delete(form); db.commit()

@app.get("/public/forms/{form_id}")
def public_form(form_id: int, db: Session = Depends(db_session)):
    form = db.get(Form, form_id)
    if not form or form.status != "published": raise HTTPException(404, "Published form not found")
    return form_out(form)

@app.post("/public/forms/{form_id}/responses", status_code=201)
def submit_response(form_id: int, data: ResponseIn, db: Session = Depends(db_session)):
    form = db.get(Form, form_id)
    if not form or form.status != "published": raise HTTPException(404, "Published form not found")
    valid = {q.id: q for q in form.questions}; sent = {a.question_id: a.value for a in data.answers}
    for q in form.questions:
        value = sent.get(q.id, "")
        if q.required and not value.strip(): raise HTTPException(422, f"{q.title} is required")
        if q.type == "email" and value and "@" not in value: raise HTTPException(422, "Invalid email")
        if q.type == "number" and value:
            try: float(value)
            except ValueError: raise HTTPException(422, "Invalid number")
    response = Response(form_id=form.id); db.add(response); db.flush(); db.add_all(Answer(response_id=response.id, question_id=qid, value=value) for qid, value in sent.items() if qid in valid); db.commit(); return {"id": response.id, "submitted_at": response.submitted_at}

@app.get("/forms/{form_id}/responses")
def get_responses(form_id: int, db: Session = Depends(db_session)):
    form = db.get(Form, form_id)
    if not form: raise HTTPException(404, "Form not found")
    results = []
    for r in form.responses:
        results.append({
            "id": r.id,
            "submitted_at": r.submitted_at,
            "answers": [{"question_id": a.question_id, "value": a.value} for a in r.answers]
        })
    return results

@app.get("/forms/{form_id}/analytics")
def analytics(form_id: int, db: Session = Depends(db_session)):
    form = db.get(Form, form_id)
    if not form: raise HTTPException(404, "Form not found")
    summaries = []
    for q in form.questions:
        counts = {}
        if q.options:
            counts = {option: db.query(Answer).filter_by(question_id=q.id, value=option).count() for option in q.options}
        summaries.append({"question_id": q.id, "title": q.title, "type": q.type, "selection_counts": counts})
    return {"response_count": len(form.responses), "questions": summaries}
