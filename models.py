from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase

class Base(DeclarativeBase):
    pass

db = SQLAlchemy(model_class=Base)

class LoanApplication(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    application_number = db.Column(db.String(50), unique=True, nullable=False)
    location = db.Column(db.String(50))
    usage_type = db.Column(db.String(50))
    grid_hours = db.Column(db.Float)
    monthly_fuel_cost = db.Column(db.Float)
    daily_energy = db.Column(db.Float)
    maintenance_cost = db.Column(db.Float)
    appliances_equipment = db.Column(db.Text)  # JSON stored as text
    full_name = db.Column(db.String(100))
    email = db.Column(db.String(100))
    phone = db.Column(db.String(50))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f'<LoanApplication {self.application_number}>'