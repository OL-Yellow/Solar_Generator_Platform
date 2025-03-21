import csv
import os
import json
import logging
from datetime import datetime
from app import app, SolarLoanApplication, db

# Configure logging with more details
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')

def migrate_csv_to_database():
    csv_path = 'data/loan_applications.csv'
    
    if not os.path.exists(csv_path):
        logging.info("No CSV file found. Nothing to migrate.")
        return
    
    try:
        # Read CSV data
        with open(csv_path, 'r', newline='') as csvfile:
            reader = csv.DictReader(csvfile)
            rows = list(reader)
        
        if not rows:
            logging.info("CSV file is empty. Nothing to migrate.")
            return
        
        # Migrate each row to database
        for row in rows:
            app_number = row.get('Application Number')
            
            # Skip if application number is missing
            if not app_number:
                continue
                
            # Check if application already exists in database
            existing = SolarLoanApplication.query.filter_by(application_number=app_number).first()
            if existing:
                logging.info(f"Application {app_number} already exists in database. Skipping.")
                continue
            
            # Create new application record
            try:
                # Parse dates from string format to datetime objects
                created_at = datetime.strptime(row.get('Created At', ''), '%Y-%m-%d %H:%M:%S') if row.get('Created At') else datetime.utcnow()
                updated_at = datetime.strptime(row.get('Updated At', ''), '%Y-%m-%d %H:%M:%S') if row.get('Updated At') else datetime.utcnow()
            except ValueError:
                # If date parsing fails, use current time
                created_at = updated_at = datetime.utcnow()
            
            # Parse numeric fields
            try:
                grid_hours = float(row.get('Grid Hours')) if row.get('Grid Hours') else None
                monthly_fuel_cost = float(row.get('Monthly Fuel Cost')) if row.get('Monthly Fuel Cost') else None
                daily_energy = float(row.get('Daily Energy')) if row.get('Daily Energy') else None
                maintenance_cost = float(row.get('Maintenance Cost')) if row.get('Maintenance Cost') else None
            except (ValueError, TypeError):
                logging.warning(f"Error parsing numeric values for application {app_number}")
                grid_hours = monthly_fuel_cost = daily_energy = maintenance_cost = None
            
            # Create new application
            new_app = SolarLoanApplication(
                application_number=app_number,
                location=row.get('Location', ''),
                usage_type=row.get('Usage Type', ''),
                grid_hours=grid_hours,
                monthly_fuel_cost=monthly_fuel_cost,
                daily_energy=daily_energy,
                maintenance_cost=maintenance_cost,
                appliances_equipment=row.get('Appliances & Equipment', '[]'),
                full_name=row.get('Full Name', ''),
                email=row.get('Email', ''),
                phone=row.get('Phone', ''),
                created_at=created_at,
                updated_at=updated_at
            )
            
            db.session.add(new_app)
            logging.info(f"Migrated application {app_number} to database")
        
        # Commit all changes
        db.session.commit()
        logging.info("Migration completed successfully")
        
        # Optional: Backup and rename the CSV file to avoid re-importing
        backup_file = f"{csv_path}.bak.{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        os.rename(csv_path, backup_file)
        logging.info(f"Original CSV file backed up to {backup_file}")
        
    except Exception as e:
        db.session.rollback()
        logging.error(f"Error during migration: {str(e)}")
        raise

if __name__ == "__main__":
    with app.app_context():
        migrate_csv_to_database()