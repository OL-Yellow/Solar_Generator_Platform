from extensions import db
from datetime import datetime

class UserProfile(db.Model):
    __tablename__ = 'user_profiles'

    id = db.Column(db.Integer, primary_key=True)
    location = db.Column(db.String(100), nullable=False)
    user_type = db.Column(db.String(50), nullable=False)  # home, business, or dual
    grid_hours = db.Column(db.Float, nullable=False)
    monthly_fuel_cost = db.Column(db.Float)
    daily_energy = db.Column(db.Float, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    appliances = db.relationship('Appliance', backref='user_profile', lazy=True)
    solar_recommendation = db.relationship('SolarRecommendation', backref='user_profile', lazy=True, uselist=False)
    loan_application = db.relationship('LoanApplication', backref='user_profile', lazy=True, uselist=False)

class Appliance(db.Model):
    __tablename__ = 'appliances'

    id = db.Column(db.Integer, primary_key=True)
    user_profile_id = db.Column(db.Integer, db.ForeignKey('user_profiles.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    power_rating = db.Column(db.Float, nullable=False)  # in watts
    quantity = db.Column(db.Integer, default=1)
    hours_per_day = db.Column(db.Float)
    backup_power = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class SolarRecommendation(db.Model):
    __tablename__ = 'solar_recommendations'

    id = db.Column(db.Integer, primary_key=True)
    user_profile_id = db.Column(db.Integer, db.ForeignKey('user_profiles.id'), nullable=False)

    # System Type
    system_type = db.Column(db.String(50), nullable=False)  # hybrid, full_solar, backup

    # Solar Panel System
    total_capacity = db.Column(db.Float, nullable=False)  # in kW
    num_panels = db.Column(db.Integer, nullable=False)
    panel_type = db.Column(db.String(100))

    # Battery System
    battery_capacity = db.Column(db.Float, nullable=False)  # in kWh
    battery_type = db.Column(db.String(50))
    battery_configuration = db.Column(db.String(100))

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class LoanApplication(db.Model):
    __tablename__ = 'loan_applications'

    id = db.Column(db.Integer, primary_key=True)
    user_profile_id = db.Column(db.Integer, db.ForeignKey('user_profiles.id'), nullable=False)
    full_name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    phone = db.Column(db.String(20), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f'<LoanApplication {self.full_name}>'