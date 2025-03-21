from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import json

db = SQLAlchemy()

class LoanApplication(db.Model):
    """Model for loan applications"""
    id = db.Column(db.Integer, primary_key=True)
    application_number = db.Column(db.String(50), unique=True, nullable=False)
    location = db.Column(db.String(100))
    usage_type = db.Column(db.String(50))
    grid_hours = db.Column(db.String(10))
    monthly_fuel_cost = db.Column(db.String(20))
    daily_energy = db.Column(db.String(20))
    maintenance_cost = db.Column(db.String(20))
    appliances = db.Column(db.Text)  # Stored as JSON string
    full_name = db.Column(db.String(100))
    email = db.Column(db.String(100))
    phone = db.Column(db.String(20))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __init__(self, application_number, **kwargs):
        self.application_number = application_number
        for key, value in kwargs.items():
            setattr(self, key, value)
    
    def get_appliances(self):
        """Convert JSON string to Python list"""
        if self.appliances:
            return json.loads(self.appliances)
        return []

    def set_appliances(self, appliances_list):
        """Convert Python list to JSON string"""
        self.appliances = json.dumps(appliances_list)

    def to_dict(self):
        """Convert model to dictionary"""
        return {
            'id': self.id,
            'application_number': self.application_number,
            'location': self.location,
            'usage_type': self.usage_type,
            'grid_hours': self.grid_hours,
            'monthly_fuel_cost': self.monthly_fuel_cost,
            'daily_energy': self.daily_energy,
            'maintenance_cost': self.maintenance_cost,
            'appliances': self.get_appliances(),
            'full_name': self.full_name,
            'email': self.email,
            'phone': self.phone,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S') if self.created_at else None,
            'updated_at': self.updated_at.strftime('%Y-%m-%d %H:%M:%S') if self.updated_at else None
        }