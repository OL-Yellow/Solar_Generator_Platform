from app import db
from datetime import datetime

class Location(db.Model):
    __tablename__ = 'location'

    id = db.Column(db.Integer, primary_key=True)
    city = db.Column(db.String(100), nullable=False)
    state = db.Column(db.String(100), nullable=False)
    avg_sun_hours_dry = db.Column(db.Float, nullable=False)  # Average sun hours during dry season
    avg_sun_hours_wet = db.Column(db.Float, nullable=False)  # Average sun hours during wet season
    avg_temperature = db.Column(db.Float, nullable=False)    # Average temperature in Celsius
    grid_reliability = db.Column(db.Float, nullable=False)   # Average daily grid availability in hours
    has_voltage_issues = db.Column(db.Boolean, default=False)

class SystemConfiguration(db.Model):
    __tablename__ = 'system_configuration'

    id = db.Column(db.Integer, primary_key=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    location_id = db.Column(db.Integer, db.ForeignKey('location.id'), nullable=False)

    # System Type and Size
    system_type = db.Column(db.String(50), nullable=False)  # full_solar, hybrid, backup_only
    solar_capacity_kw = db.Column(db.Float, nullable=False)
    battery_capacity_kwh = db.Column(db.Float, nullable=False)
    inverter_size_kw = db.Column(db.Float, nullable=False)

    # Battery Details
    battery_technology = db.Column(db.String(50), nullable=False)  # lithium, lead_acid
    battery_lifecycle_years = db.Column(db.Float, nullable=False)
    depth_of_discharge = db.Column(db.Float, nullable=False)

    # User Requirements
    peak_load_kw = db.Column(db.Float, nullable=False)
    daily_energy_kwh = db.Column(db.Float, nullable=False)
    backup_hours_required = db.Column(db.Float, nullable=False)
    has_critical_loads = db.Column(db.Boolean, default=False)
    has_motor_loads = db.Column(db.Boolean, default=False)
    budget_constraint = db.Column(db.Float, nullable=True)

    # Economic Analysis
    initial_cost = db.Column(db.Float, nullable=False)
    monthly_savings = db.Column(db.Float, nullable=False)
    payback_period_months = db.Column(db.Float, nullable=False)

    # Relationship
    location = db.relationship('Location', backref='system_configurations')
    components = db.relationship('SystemComponent', backref='system_configuration')

class SystemComponent(db.Model):
    __tablename__ = 'system_component'

    id = db.Column(db.Integer, primary_key=True)
    system_id = db.Column(db.Integer, db.ForeignKey('system_configuration.id'), nullable=False)
    component_type = db.Column(db.String(50), nullable=False)  # panel, battery, inverter, protection
    make_model = db.Column(db.String(100), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    unit_cost = db.Column(db.Float, nullable=False)
    specifications = db.Column(db.JSON, nullable=True)  # Store additional specs as JSON
    is_critical = db.Column(db.Boolean, default=False)
    maintenance_interval_months = db.Column(db.Integer, nullable=True)