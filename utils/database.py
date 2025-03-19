import csv
import os
from datetime import datetime
import uuid

class LoanApplicationLogger:
    def __init__(self):
        if not os.path.exists('data'):
            os.makedirs('data')
        self.csv_path = 'data/loan_applications.csv'
        self.init_csv()

    def init_csv(self):
        if not os.path.exists(self.csv_path):
            with open(self.csv_path, 'w', newline='') as csvfile:
                writer = csv.writer(csvfile)
                writer.writerow([
                    'Application Number',
                    'Created At',
                    # Basic Information
                    'Location',
                    'User Type',
                    'Grid Hours',
                    'Monthly Fuel Cost',
                    # Power Usage
                    'Daily Energy Usage',
                    'Backup Days',
                    'Generator Size',
                    # Appliances
                    'Appliance List',
                    'Total Power',
                    # Loan Application
                    'Full Name',
                    'Email',
                    'Phone',
                    'Last Updated'
                ])

    def generate_application_number(self):
        """Generate a unique application number"""
        return f"SOL-{uuid.uuid4().hex[:8].upper()}"

    def save_or_update_application(self, application_number, data_dict):
        """Save or update application data based on application number"""
        # Read existing data
        existing_data = []
        try:
            with open(self.csv_path, 'r', newline='') as csvfile:
                reader = csv.DictReader(csvfile)
                existing_data = list(reader)
        except FileNotFoundError:
            self.init_csv()

        # Update data if application exists, otherwise create new
        updated = False
        for row in existing_data:
            if row['Application Number'] == application_number:
                row.update(data_dict)
                row['Last Updated'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                updated = True
                break

        if not updated:
            new_row = {
                'Application Number': application_number,
                'Created At': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                'Last Updated': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            }
            new_row.update(data_dict)
            existing_data.append(new_row)

        # Write all data back to CSV
        with open(self.csv_path, 'w', newline='') as csvfile:
            fieldnames = [
                'Application Number', 'Created At',
                'Location', 'User Type', 'Grid Hours', 'Monthly Fuel Cost',
                'Daily Energy Usage', 'Backup Days', 'Generator Size',
                'Appliance List', 'Total Power',
                'Full Name', 'Email', 'Phone', 'Last Updated'
            ]
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(existing_data)

    def get_application(self, application_number):
        """Retrieve application data by application number"""
        try:
            with open(self.csv_path, 'r', newline='') as csvfile:
                reader = csv.DictReader(csvfile)
                for row in reader:
                    if row['Application Number'] == application_number:
                        return row
        except FileNotFoundError:
            return None
        return None

# Create a single instance to be used across the application
db = LoanApplicationLogger()