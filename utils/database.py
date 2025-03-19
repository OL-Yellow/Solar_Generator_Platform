import sqlite3
import os
import json
from datetime import datetime

class LoanApplicationDB:
    def __init__(self):
        # Create a data directory if it doesn't exist
        if not os.path.exists('data'):
            os.makedirs('data')
        self.db_path = 'data/loan_applications.db'
        self.init_db()

    def init_db(self):
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS loan_applications (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    full_name TEXT NOT NULL,
                    email TEXT NOT NULL,
                    phone TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            conn.commit()

    def save_application(self, name, email, phone):
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute(
                'INSERT INTO loan_applications (full_name, email, phone) VALUES (?, ?, ?)',
                (name, email, phone)
            )
            conn.commit()
            return cursor.lastrowid

    def get_all_applications(self):
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM loan_applications ORDER BY created_at DESC')
            return [dict(row) for row in cursor.fetchall()]

# Create a single instance to be used across the application
db = LoanApplicationDB()
