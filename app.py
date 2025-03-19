import os
from flask import Flask, render_template, request, session, redirect, url_for, flash, jsonify
import logging
# Import local calculator instead of AI
from utils.system_calculator import get_system_recommendations

# Configure logging with more details
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')

app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "dev_key_123")

# In-memory storage for leads
leads = []

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

@app.route('/calculator')
def calculator():
    return render_template('calculator.html', locations=NIGERIA_LOCATIONS)

@app.route('/loan_application')
def loan_application():
    return render_template('loan_application.html')

@app.route('/get_recommendations', methods=['POST'])
def get_recommendations():
    try:
        logging.debug("Received recommendation request")
        if not request.is_json:
            logging.error("Request is not JSON format")
            return jsonify({'error': 'Request must be JSON'}), 400

        user_data = request.get_json()
        logging.debug(f"Received user data: {user_data}")

        # Validate required fields
        required_fields = ['location', 'user_type', 'grid_hours', 'monthly_fuel_cost', 'daily_energy']
        missing_fields = [field for field in required_fields if not user_data.get(field)]

        if missing_fields:
            error_msg = f"Missing required fields: {', '.join(missing_fields)}"
            logging.error(error_msg)
            return jsonify({'error': error_msg}), 400

        result = get_system_recommendations(user_data)
        logging.debug(f"Got recommendations result: {result}")

        if result.get('success'):
            return jsonify(result)
        else:
            logging.error(f"Failed to get recommendations: {result.get('error')}")
            return jsonify({'error': 'Failed to get recommendations', 'details': result.get('error')}), 500

    except Exception as e:
        logging.error(f"Error in get_recommendations: {str(e)}")
        return jsonify({'error': str(e)}), 500

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
        return redirect(url_for('calculator'))

    leads.append(lead_data)
    flash('Thank you! We will contact you soon.', 'success')
    return redirect(url_for('calculator'))

@app.errorhandler(404)
def not_found_error(error):
    return render_template('404.html'), 404

@app.errorhandler(500)
def internal_error(error):
    return render_template('500.html'), 500