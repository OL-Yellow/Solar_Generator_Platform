import os
import uuid
from io import BytesIO
from datetime import datetime
from flask import Flask, render_template, request, session, redirect, url_for, flash, jsonify, send_file
from functools import wraps
import logging
# Import local calculator instead of AI
from utils.system_calculator import get_system_recommendations
from models import db, LoanApplication
from utils.database_pg import db_manager

# Configure logging with more details
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')

app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "dev_key_123")
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
db.init_app(app)

# Create database tables if they don't exist
with app.app_context():
    try:
        # Create tables if they don't exist (don't drop existing data)
        db.create_all()
        logging.info("Database tables created/verified successfully")
    except Exception as e:
        logging.error(f"Error creating database tables: {str(e)}")

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
    # For demo purposes, hardcoded credentials
    # In production, use environment variables and/or database authentication
    return (username == 'admin' and password == 'solar2025')

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

@app.route('/admin/dashboard')
@requires_auth
def admin_dashboard():
    """Admin dashboard to view all applications"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = 10
        
        # Get all applications
        applications = LoanApplication.query.order_by(LoanApplication.created_at.desc()).all()
        
        # Calculate pagination
        total = len(applications)
        pages = (total + per_page - 1) // per_page  # Ceiling division
        
        # Get page of applications
        start = (page - 1) * per_page
        end = min(start + per_page, total)
        page_applications = applications[start:end]
        
        # Calculate statistics
        home_count = sum(1 for app in applications if app.usage_type == 'home')
        business_count = sum(1 for app in applications if app.usage_type == 'business')
        
        # Calculate average energy consumption
        energy_values = [float(app.daily_energy) for app in applications if app.daily_energy and app.daily_energy.replace('.', '', 1).isdigit()]
        avg_energy = round(sum(energy_values) / len(energy_values), 2) if energy_values else 0
        
        stats = {
            'total': total,
            'home': home_count,
            'business': business_count,
            'avg_energy': avg_energy
        }
        
        return render_template(
            'admin_dashboard.html',
            applications=[app.to_dict() for app in page_applications],
            page=page,
            pages=pages,
            stats=stats
        )
    
    except Exception as e:
        logging.error(f"Error in admin dashboard: {str(e)}")
        return render_template('admin_dashboard.html', applications=[], page=1, pages=1, stats={'total': 0, 'home': 0, 'business': 0, 'avg_energy': 0})

@app.route('/admin/download-applications')
@requires_auth
def download_applications():
    """Secure endpoint to download loan applications CSV"""
    try:
        # Get CSV data from the database manager
        csv_data = db_manager.export_to_csv()
        
        if csv_data:
            # Create a BytesIO object from the CSV string
            csv_buffer = BytesIO(csv_data.encode())
            
            # Return the CSV as a file attachment
            return send_file(
                csv_buffer,
                mimetype='text/csv',
                as_attachment=True,
                download_name=f'loan_applications_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv'
            )
        else:
            logging.error("No applications data available")
            return "No applications data available", 404
    except Exception as e:
        logging.error(f"Error downloading CSV: {str(e)}")
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

        # Save to database with application number
        db_manager.save_application(name, email, phone, application_number)

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

        # Save calculator data to database
        application_number = session.get('application_number')
        if application_number:
            db_manager.save_calculator_data(application_number, user_data)
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