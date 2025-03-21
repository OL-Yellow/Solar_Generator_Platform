import json
import logging
from datetime import datetime
from models import db, SolarLoanApplication

class LoanApplicationLogger:
    def __init__(self):
        # No initialization needed for PostgreSQL
        pass

    def save_calculator_data(self, application_number, calculator_data):
        try:
            # Format appliances data as JSON
            appliances_data = calculator_data.get('appliances', [])
            formatted_appliances = []
            for appliance in appliances_data:
                formatted_appliances.append({
                    'type': appliance.get('type', ''),
                    'units': appliance.get('units', 0),
                    'hours_per_day': appliance.get('hours', 0),
                    'backup_included': appliance.get('backup', False),
                    'power_watts': appliance.get('power', 0),
                    'daily_usage_kwh': appliance.get('daily_usage', 0)
                })

            # Check if application already exists
            application = LoanApplication.query.filter_by(application_number=application_number).first()
            
            if application:
                # Update existing application
                application.location = calculator_data.get('location_name', 'Unknown')
                application.usage_type = calculator_data.get('user_type', '')
                application.grid_hours = calculator_data.get('grid_hours', 0)
                application.monthly_fuel_cost = calculator_data.get('monthly_fuel_cost', 0)
                application.daily_energy = calculator_data.get('daily_energy', 0)
                application.maintenance_cost = calculator_data.get('maintenance_cost', 0)
                application.appliances_equipment = json.dumps(formatted_appliances)
                application.updated_at = datetime.utcnow()
            else:
                # Create new application
                application = LoanApplication(
                    application_number=application_number,
                    location=calculator_data.get('location_name', 'Unknown'),
                    usage_type=calculator_data.get('user_type', ''),
                    grid_hours=calculator_data.get('grid_hours', 0),
                    monthly_fuel_cost=calculator_data.get('monthly_fuel_cost', 0),
                    daily_energy=calculator_data.get('daily_energy', 0),
                    maintenance_cost=calculator_data.get('maintenance_cost', 0),
                    appliances_equipment=json.dumps(formatted_appliances),
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                )
                db.session.add(application)
            
            db.session.commit()
            logging.info(f"Saved calculator data for application {application_number}")
            return True
        except Exception as e:
            db.session.rollback()
            logging.error(f"Error saving calculator data to PostgreSQL: {str(e)}")
            return False

    def save_application(self, name, email, phone, application_number):
        try:
            # Check if application already exists
            application = LoanApplication.query.filter_by(application_number=application_number).first()
            
            if application:
                # Update existing application with personal information
                application.full_name = name
                application.email = email
                application.phone = phone
                application.updated_at = datetime.utcnow()
            else:
                # Create new application with minimal data
                application = LoanApplication(
                    application_number=application_number,
                    full_name=name,
                    email=email,
                    phone=phone,
                    appliances_equipment='[]',  # Empty JSON array
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                )
                db.session.add(application)
            
            db.session.commit()
            logging.info(f"Saved personal information for application {application_number}")
            return True
        except Exception as e:
            db.session.rollback()
            logging.error(f"Error saving application to PostgreSQL: {str(e)}")
            return False

    def get_all_applications(self):
        try:
            # Get all applications from the database
            applications = LoanApplication.query.all()
            return applications
        except Exception as e:
            logging.error(f"Error retrieving applications from PostgreSQL: {str(e)}")
            return []

# Create a single instance to be used across the application
db = LoanApplicationLogger()