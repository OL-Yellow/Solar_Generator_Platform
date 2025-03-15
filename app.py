import os
from flask import Flask, render_template, request, session, redirect, url_for, flash
import logging

# Configure logging
logging.basicConfig(level=logging.DEBUG)

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
