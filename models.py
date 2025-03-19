from extensions import db
from flask_login import UserMixin
from datetime import datetime

class LoanApplication(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    phone = db.Column(db.String(20), nullable=False)
    system_type = db.Column(db.String(50))
    total_cost = db.Column(db.Float)
    monthly_savings = db.Column(db.Float)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f'<LoanApplication {self.full_name}>'