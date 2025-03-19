import csv
import os
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
                writer.writerow(['Full Name', 'Email', 'Phone', 'Created At'])

    def save_application(self, name, email, phone):
        with open(self.csv_path, 'a', newline='') as csvfile:
            writer = csv.writer(csvfile)
            writer.writerow([
                name,
                email,
                phone,
                datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            ])

    def get_all_applications(self):
        applications = []
        with open(self.csv_path, 'r', newline='') as csvfile:
            reader = csv.DictReader(csvfile)
            for row in reader:
                applications.append(row)
        return applications

# Create a single instance to be used across the application
db = LoanApplicationLogger()