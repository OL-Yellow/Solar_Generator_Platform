import csv
import os
import json
from datetime import datetime

class LoanApplicationLogger:
    def __init__(self):
        # Create a data directory if it doesn't exist
        if not os.path.exists('data'):
            os.makedirs('data')
        self.csv_path = 'data/loan_applications.csv'
        self.init_csv()

    def init_csv(self):
        # Create CSV file with headers if it doesn't exist
        if not os.path.exists(self.csv_path):
            with open(self.csv_path, 'w', newline='') as csvfile:
                writer = csv.writer(csvfile)
                writer.writerow([
                    'Application Number',
                    'Location',
                    'Usage Type',
                    'Grid Hours',
                    'Monthly Fuel Cost',
                    'Daily Energy',
                    'Maintenance Cost',
                    'Appliances & Equipment',  # JSON data
                    'Recommended Solar Solution',  # New column for recommendation JSON data
                    'Full Name',
                    'Email',
                    'Phone',
                    'Created At',
                    'Updated At'
                ])

    def save_calculator_data(self, application_number, calculator_data, recommendations_data=None):
        existing_data = self.get_all_applications()
        updated_rows = []
        found = False

        # Convert to list of dictionaries if not already
        if not isinstance(existing_data, list):
            existing_data = list(existing_data)

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

        # Format recommendations data as JSON if provided
        formatted_recommendations = {}
        if recommendations_data:
            formatted_recommendations = {
                'recommended_system_type': {
                    'system_type': recommendations_data['system_type']['type'],
                    'rationale': recommendations_data['system_type']['rationale'],
                    'configuration': recommendations_data['system_type']['configuration']
                },
                'solar_panel_system': {
                    'total_capacity': recommendations_data['solar_system']['total_capacity'],
                    'num_panels': recommendations_data['solar_system']['num_panels'],
                    'panel_type': recommendations_data['solar_system']['panel_type'],
                    'charge_controller': recommendations_data['solar_system']['charge_controller']
                },
                'battery_system': {
                    'total_capacity': recommendations_data['battery_system']['total_capacity'],
                    'battery_type': recommendations_data['battery_system']['battery_type'],
                    'configuration': recommendations_data['battery_system']['configuration']
                }
            }

        # Create new row if application doesn't exist
        new_row = {
            'Application Number': application_number,
            'Location': calculator_data.get('location', ''),
            'Usage Type': calculator_data.get('user_type', ''),
            'Grid Hours': calculator_data.get('grid_hours', ''),
            'Monthly Fuel Cost': calculator_data.get('monthly_fuel_cost', ''),
            'Daily Energy': calculator_data.get('daily_energy', ''),
            'Maintenance Cost': calculator_data.get('maintenance_cost', ''),
            'Appliances & Equipment': json.dumps(formatted_appliances),
            'Recommended Solar Solution': json.dumps(formatted_recommendations) if recommendations_data else '{}',
            'Full Name': '',
            'Email': '',
            'Phone': '',
            'Created At': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'Updated At': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }

        # Update file with new data
        with open(self.csv_path, 'w', newline='') as csvfile:
            writer = csv.DictWriter(csvfile, fieldnames=list(new_row.keys()))
            writer.writeheader()

            # Add existing rows or update if application number matches
            for row in existing_data:
                if row['Application Number'] == application_number:
                    row.update(new_row)
                    found = True
                updated_rows.append(row)

            if not found:
                updated_rows.append(new_row)

            writer.writerows(updated_rows)

    def save_application(self, name, email, phone, application_number):
        existing_data = self.get_all_applications()
        updated_rows = []
        found = False

        # Convert to list of dictionaries if not already
        if not isinstance(existing_data, list):
            existing_data = list(existing_data)

        # Update file with new personal data
        with open(self.csv_path, 'w', newline='') as csvfile:
            fieldnames = [
                'Application Number', 'Location', 'Usage Type', 'Grid Hours',
                'Monthly Fuel Cost', 'Daily Energy', 'Maintenance Cost',
                'Appliances & Equipment', 'Recommended Solar Solution',
                'Full Name', 'Email', 'Phone', 'Created At', 'Updated At'
            ]
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()

            for row in existing_data:
                if row['Application Number'] == application_number:
                    row.update({
                        'Full Name': name,
                        'Email': email,
                        'Phone': phone,
                        'Updated At': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                    })
                    found = True
                updated_rows.append(row)

            if not found:
                # If no existing application found, create new row with minimal data
                updated_rows.append({
                    'Application Number': application_number,
                    'Full Name': name,
                    'Email': email,
                    'Phone': phone,
                    'Location': '',
                    'Usage Type': '',
                    'Grid Hours': '',
                    'Monthly Fuel Cost': '',
                    'Daily Energy': '',
                    'Maintenance Cost': '',
                    'Appliances & Equipment': '[]',
                    'Recommended Solar Solution': '{}',
                    'Created At': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                    'Updated At': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                })

            writer.writerows(updated_rows)

    def get_all_applications(self):
        applications = []
        try:
            with open(self.csv_path, 'r', newline='') as csvfile:
                reader = csv.DictReader(csvfile)
                for row in reader:
                    applications.append(row)
        except FileNotFoundError:
            self.init_csv()
        return applications

# Create a single instance to be used across the application
db = LoanApplicationLogger()