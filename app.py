import os
from flask import Flask, render_template, request, session, redirect, url_for, flash, jsonify
import logging
from utils.system_calculator import get_system_recommendations
from utils.database import db as loan_db

# Configure logging with more details
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')

app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "dev_key_123")

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
    # Generate application number if not exists
    if 'application_number' not in session:
        session['application_number'] = loan_db.generate_application_number()
    return render_template('index.html', application_number=session['application_number'])

@app.route('/calculator')
def calculator():
    # Ensure application number exists
    if 'application_number' not in session:
        session['application_number'] = loan_db.generate_application_number()
    return render_template('calculator.html', 
                         locations=NIGERIA_LOCATIONS,
                         application_number=session['application_number'])

@app.route('/loan_application')
def loan_application():
    if 'application_number' not in session:
        flash('Please start from the beginning', 'error')
        return redirect(url_for('index'))
    return render_template('loan_application.html', 
                         application_number=session['application_number'])

@app.route('/submit_lead', methods=['POST'])
def submit_lead():
    try:
        if 'application_number' not in session:
            flash('Invalid application session', 'error')
            return redirect(url_for('index'))

        name = request.form.get('name')
        email = request.form.get('email')
        phone = request.form.get('phone')

        if not all([name, email, phone]):
            flash('Please fill in all required fields', 'error')
            return redirect(url_for('loan_application'))

        # Save to CSV with application number
        loan_db.save_or_update_application(
            session['application_number'],
            {
                'Full Name': name,
                'Email': email,
                'Phone': phone
            }
        )

        flash('Thank you! We will contact you soon.', 'success')
        return redirect(url_for('calculator'))

    except Exception as e:
        logging.error(f"Error saving loan application: {str(e)}")
        flash('There was an error submitting your application. Please try again.', 'error')
        return redirect(url_for('loan_application'))

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

        # Save the basic information to CSV
        if 'application_number' in session:
            loan_db.save_or_update_application(
                session['application_number'],
                {
                    'Location': user_data['location'],
                    'User Type': user_data['user_type'],
                    'Grid Hours': user_data['grid_hours'],
                    'Monthly Fuel Cost': user_data['monthly_fuel_cost'],
                    'Daily Energy Usage': user_data['daily_energy']
                }
            )

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