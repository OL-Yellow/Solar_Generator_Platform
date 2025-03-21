import os
import uuid
import csv
import io
from datetime import datetime
from flask import Flask, render_template, request, session, redirect, url_for, flash, jsonify, send_file
from functools import wraps
import logging
# Import local calculator instead of AI
from utils.system_calculator import get_system_recommendations

# Configure logging with more details
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')

app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "dev_key_123")

# Configure SQLAlchemy
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL")
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    "pool_recycle": 300,
    "pool_pre_ping": True,
}
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

# Import and initialize models
from models import db, SolarLoanApplication
db.init_app(app)

with app.app_context():
    db.create_all()

# Import database utils after initializing SQLAlchemy
from utils.database import db as loan_db

# Nigerian states and average sun hours
NIGERIA_LOCATIONS = {
    "Lagos": 5.5,
    "Abuja": 6.0,
    "Kano": 6.5,
    "Port Harcourt": 5.0,
    "Ibadan": 5.8,
    "Enugu": 5.6
}

def check_auth(username, password):
    """Check if the username / password combination is valid"""
    return (username == os.environ.get('ADMIN_USERNAME') and 
            password == os.environ.get('ADMIN_PASSWORD'))

def authenticate():
    """Send a 401 response that enables basic auth"""
    return ('Could not verify your access level for that URL.\n'
            'You have to login with proper credentials', 401,
            {'WWW-Authenticate': 'Basic realm="Login Required"'})

def requires_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth = request.authorization
        if not auth or not check_auth(auth.username, auth.password):
            return authenticate()
        return f(*args, **kwargs)
    return decorated

@app.route('/admin/download-applications')
@requires_auth
def download_applications():
    """Secure endpoint to download loan applications CSV from database"""
    try:
        # Fetch all applications from database
        applications = SolarLoanApplication.query.all()
        
        if not applications:
            logging.warning("No applications found in database")
            return "No applications data available", 404
            
        # Create CSV in memory
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write header
        writer.writerow([
            'Application Number',
            'Location',
            'Usage Type',
            'Grid Hours',
            'Monthly Fuel Cost',
            'Daily Energy',
            'Maintenance Cost',
            'Appliances & Equipment',
            'Full Name',
            'Email',
            'Phone',
            'Created At',
            'Updated At'
        ])
        
        # Write data rows
        for app in applications:
            writer.writerow([
                app.application_number,
                app.location,
                app.usage_type,
                app.grid_hours,
                app.monthly_fuel_cost,
                app.daily_energy,
                app.maintenance_cost,
                app.appliances_equipment,
                app.full_name,
                app.email,
                app.phone,
                app.created_at.strftime('%Y-%m-%d %H:%M:%S') if app.created_at else '',
                app.updated_at.strftime('%Y-%m-%d %H:%M:%S') if app.updated_at else ''
            ])
        
        # Prepare CSV for download
        output.seek(0)
        return send_file(
            io.BytesIO(output.getvalue().encode('utf-8')),
            mimetype='text/csv',
            as_attachment=True,
            download_name=f'loan_applications_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv'
        )
    except Exception as e:
        logging.error(f"Error downloading applications: {str(e)}")
        return "Error downloading file", 500

@app.route('/')
def index():
    # Clear any existing application number when returning to landing page
    session.pop('application_number', None)
    return render_template('index.html')

@app.route('/calculator')
def calculator():
    # Always generate a new application number when starting calculator
    application_number = f"SOL-{datetime.now().year}-{str(uuid.uuid4().int)[:5]}"
    session['application_number'] = application_number
    return render_template('calculator.html', locations=NIGERIA_LOCATIONS, application_number=session.get('application_number'))

@app.route('/loan_application')
def loan_application():
    if 'application_number' not in session:
        flash('Please start from the calculator page', 'error')
        return redirect(url_for('calculator'))
    return render_template('loan_application.html', application_number=session.get('application_number'))

@app.route('/submit_lead', methods=['POST'])
def submit_lead():
    try:
        name = request.form.get('name')
        email = request.form.get('email')
        phone = request.form.get('phone')
        application_number = session.get('application_number')

        if not all([name, email, phone, application_number]):
            flash('Please fill in all required fields', 'error')
            return redirect(url_for('loan_application'))

        # Save to CSV file with application number
        loan_db.save_application(name, email, phone, application_number)

        flash('Thank you! We appreciate your time.', 'success')
        return redirect(url_for('thank_you'))

    except Exception as e:
        logging.error(f"Error saving loan application: {str(e)}")
        flash('There was an error submitting your application. Please try again.', 'error')
        return redirect(url_for('loan_application'))

@app.route('/thank-you')
def thank_you():
    application_number = session.get('application_number')
    if not application_number:
        return redirect(url_for('calculator'))
    return render_template('thank-you.html', application_number=application_number)

@app.route('/get_recommendations', methods=['POST'])
def get_recommendations():
    try:
        if not request.is_json:
            return jsonify({'error': 'Request must be JSON'}), 400

        user_data = request.get_json()
        required_fields = ['location', 'user_type', 'grid_hours', 'monthly_fuel_cost', 'daily_energy']
        missing_fields = [field for field in required_fields if not user_data.get(field)]

        if missing_fields:
            error_msg = f"Missing required fields: {', '.join(missing_fields)}"
            logging.error(error_msg)
            return jsonify({'error': error_msg}), 400

        # Save calculator data to CSV
        application_number = session.get('application_number')
        if application_number:
            loan_db.save_calculator_data(application_number, user_data)
            logging.info(f"Saved calculator data for application {application_number}")

        result = get_system_recommendations(user_data)

        if result.get('success'):
            return jsonify(result)
        else:
            return jsonify({'error': 'Failed to get recommendations', 'details': result.get('error')}), 500

    except Exception as e:
        logging.error(f"Error in get_recommendations: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.errorhandler(404)
def not_found_error(error):
    return render_template('404.html'), 404

@app.errorhandler(500)
def internal_error(error):
    return render_template('500.html'), 500