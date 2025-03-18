import os
from flask import Flask, render_template, request, session, redirect, url_for, flash, jsonify
import logging
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import declarative_base

# Configure logging with more details
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')

# Initialize SQLAlchemy with base class
Base = declarative_base()

db = SQLAlchemy(model_class=Base)

# Create Flask app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "dev_key_123")

# Configure database
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL")
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    "pool_recycle": 300,
    "pool_pre_ping": True,
}

# Initialize database
db.init_app(app)

# Import and register the calculator blueprint
from routes import calculator
app.register_blueprint(calculator)

# Nigerian states and average sun hours
NIGERIA_LOCATIONS = {
    "Lagos": 5.5,
    "Abuja": 6.0,
    "Kano": 6.5,
    "Port Harcourt": 5.0,
    "Ibadan": 5.8,
    "Enugu": 5.6
}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/submit_lead', methods=['POST'])
def submit_lead():
    lead_data = {
        'name': request.form.get('name'),
        'phone': request.form.get('phone'),
        'email': request.form.get('email'),
        'contact_time': request.form.get('contact_time'),
        'system_size': request.form.get('system_size'),
        'estimated_savings': request.form.get('estimated_savings')
    }

    # Validate required fields
    if not all([lead_data['name'], lead_data['phone'], lead_data['email']]):
        flash('Please fill in all required fields', 'error')
        return redirect(url_for('calculator.index'))

    # Store lead in database (to be implemented)
    flash('Thank you! We will contact you soon.', 'success')
    return redirect(url_for('calculator.index'))

@app.errorhandler(404)
def not_found_error(error):
    return render_template('404.html'), 404

@app.errorhandler(500)
def internal_error(error):
    return render_template('500.html'), 500

# Create database tables
with app.app_context():
    # Import models here to ensure they are known to SQLAlchemy
    from models import Location, SystemConfiguration, SystemComponent
    db.create_all()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)