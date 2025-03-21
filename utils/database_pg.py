import json
from datetime import datetime
import logging
from models import db, LoanApplication

class LoanApplicationManager:
    def __init__(self):
        """Initialize the database manager"""
        self.session = db.session
        logging.info("Initialized LoanApplicationManager with database session")

    def save_calculator_data(self, application_number, calculator_data):
        """Save or update calculator data in the database"""
        try:
            # Format appliances data
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
            
            # Log the data for debugging
            logging.debug(f"Calculator data: {calculator_data}")
            logging.debug(f"Formatted appliances: {formatted_appliances}")
            
            try:
                # Check if application already exists using a fresh session
                application = db.session.query(LoanApplication).filter_by(application_number=application_number).first()
                
                if application:
                    # Update existing application
                    application.location = calculator_data.get('location_name', 'Unknown')
                    application.usage_type = calculator_data.get('user_type', '')
                    application.grid_hours = str(calculator_data.get('grid_hours', ''))
                    application.monthly_fuel_cost = str(calculator_data.get('monthly_fuel_cost', ''))
                    application.daily_energy = str(calculator_data.get('daily_energy', ''))
                    application.maintenance_cost = str(calculator_data.get('maintenance_cost', ''))
                    application.set_appliances(formatted_appliances)
                    application.updated_at = datetime.utcnow()
                    logging.info(f"Updated existing application {application_number}")
                else:
                    # Create new application
                    application = LoanApplication(
                        application_number=application_number,
                        location=calculator_data.get('location_name', 'Unknown'),
                        usage_type=calculator_data.get('user_type', ''),
                        grid_hours=str(calculator_data.get('grid_hours', '')),
                        monthly_fuel_cost=str(calculator_data.get('monthly_fuel_cost', '')),
                        daily_energy=str(calculator_data.get('daily_energy', '')),
                        maintenance_cost=str(calculator_data.get('maintenance_cost', '')),
                        appliances=json.dumps(formatted_appliances)
                    )
                    db.session.add(application)
                    logging.info(f"Created new application {application_number}")
                
                db.session.commit()
                logging.info(f"Successfully saved calculator data for application {application_number}")
                return True
                
            except Exception as inner_e:
                # If we have a connection error, try to reconnect
                db.session.rollback()
                logging.error(f"Database operation error: {str(inner_e)}")
                # Create a new application with a fresh session attempt
                application = LoanApplication(
                    application_number=application_number,
                    location=calculator_data.get('location_name', 'Unknown'),
                    usage_type=calculator_data.get('user_type', ''),
                    grid_hours=str(calculator_data.get('grid_hours', '')),
                    monthly_fuel_cost=str(calculator_data.get('monthly_fuel_cost', '')),
                    daily_energy=str(calculator_data.get('daily_energy', '')),
                    maintenance_cost=str(calculator_data.get('maintenance_cost', '')),
                    appliances=json.dumps(formatted_appliances)
                )
                db.session.add(application)
                db.session.commit()
                logging.info(f"Created application after reconnection attempt: {application_number}")
                return True
                
        except Exception as e:
            db.session.rollback()
            logging.error(f"Error saving calculator data: {str(e)}")
            return False

    def save_application(self, name, email, phone, application_number):
        """Save or update personal information for an application"""
        try:
            logging.debug(f"Attempting to save personal info for application {application_number}")
            
            try:
                # Check if application already exists
                application = db.session.query(LoanApplication).filter_by(application_number=application_number).first()
                
                if application:
                    # Update existing application with personal info
                    logging.debug(f"Updating existing application {application_number}")
                    application.full_name = name
                    application.email = email
                    application.phone = phone
                    application.updated_at = datetime.utcnow()
                else:
                    # Create new application with minimal data
                    logging.debug(f"Creating new application {application_number}")
                    application = LoanApplication(
                        application_number=application_number,
                        full_name=name,
                        email=email,
                        phone=phone,
                        appliances='[]'
                    )
                    db.session.add(application)
                
                db.session.commit()
                logging.info(f"Successfully saved personal info for application {application_number}")
                return True
                
            except Exception as inner_e:
                # If we have a connection error, try to reconnect
                db.session.rollback()
                logging.error(f"Database operation error: {str(inner_e)}")
                
                # Create a new application with a fresh session attempt
                application = LoanApplication(
                    application_number=application_number,
                    full_name=name,
                    email=email,
                    phone=phone,
                    appliances='[]'
                )
                db.session.add(application)
                db.session.commit()
                logging.info(f"Created application after reconnection attempt: {application_number}")
                return True
                
        except Exception as e:
            db.session.rollback()
            logging.error(f"Error saving personal info: {str(e)}")
            return False

    def get_all_applications(self):
        """Get all loan applications in dictionary format"""
        try:
            applications = db.session.query(LoanApplication).all()
            result = []
            for app in applications:
                try:
                    result.append(app.to_dict())
                except Exception as app_e:
                    logging.error(f"Error converting application to dict: {str(app_e)}")
            return result
        except Exception as e:
            logging.error(f"Error retrieving applications: {str(e)}")
            return []

    def get_application_by_number(self, application_number):
        """Get a specific application by its number"""
        try:
            application = db.session.query(LoanApplication).filter_by(application_number=application_number).first()
            if application:
                return application.to_dict()
            logging.debug(f"No application found for number: {application_number}")
            return None
        except Exception as e:
            logging.error(f"Error retrieving application {application_number}: {str(e)}")
            return None

    def export_to_csv(self):
        """Generate CSV data from all applications"""
        import csv
        from io import StringIO
        
        try:
            applications = self.get_all_applications()
            if not applications:
                return None
            
            # Create CSV in memory
            output = StringIO()
            fieldnames = [
                'Application Number', 'Location', 'Usage Type', 'Grid Hours',
                'Monthly Fuel Cost', 'Daily Energy', 'Maintenance Cost',
                'Appliances & Equipment', 'Full Name', 'Email', 'Phone',
                'Created At', 'Updated At'
            ]
            writer = csv.DictWriter(output, fieldnames=fieldnames)
            writer.writeheader()
            
            for app in applications:
                writer.writerow({
                    'Application Number': app['application_number'],
                    'Location': app['location'] or '',
                    'Usage Type': app['usage_type'] or '',
                    'Grid Hours': app['grid_hours'] or '',
                    'Monthly Fuel Cost': app['monthly_fuel_cost'] or '',
                    'Daily Energy': app['daily_energy'] or '',
                    'Maintenance Cost': app['maintenance_cost'] or '',
                    'Appliances & Equipment': json.dumps(app['appliances']),
                    'Full Name': app['full_name'] or '',
                    'Email': app['email'] or '',
                    'Phone': app['phone'] or '',
                    'Created At': app['created_at'] or '',
                    'Updated At': app['updated_at'] or ''
                })
            
            return output.getvalue()
        except Exception as e:
            logging.error(f"Error exporting to CSV: {str(e)}")
            return None

# Create a single instance to be used across the application
db_manager = LoanApplicationManager()