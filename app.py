import os
from flask import Flask, render_template, request, session, redirect, url_for, flash, jsonify
import logging
from utils.system_calculator import get_system_recommendations
from extensions import db
from models import UserProfile, Appliance, SolarRecommendation, LoanApplication

# Configure logging with more details
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')

app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "dev_key_123")

# Configure the database
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL")
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    "pool_recycle": 300,
    "pool_pre_ping": True,
}
db.init_app(app)

# Create all database tables
with app.app_context():
    db.create_all()
    logging.info("Database tables created successfully")

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

        # Create UserProfile
        user_profile = UserProfile(
            location=user_data['location'],
            user_type=user_data['user_type'],
            grid_hours=float(user_data['grid_hours']),
            monthly_fuel_cost=float(user_data['monthly_fuel_cost']),
            daily_energy=float(user_data['daily_energy'])
        )
        db.session.add(user_profile)

        # Create Appliances if provided
        if 'appliances' in user_data:
            for app_data in user_data['appliances']:
                appliance = Appliance(
                    user_profile=user_profile,
                    name=app_data['name'],
                    power_rating=float(app_data['power']),
                    quantity=int(app_data.get('quantity', 1)),
                    hours_per_day=float(app_data.get('hours', 0)),
                    backup_power=app_data.get('backup', True)
                )
                db.session.add(appliance)

        # Get recommendations
        result = get_system_recommendations(user_data)

        if result.get('success'):
            # Store recommendation data
            recommendation_data = result['recommendations']
            solar_recommendation = SolarRecommendation(
                user_profile=user_profile,
                system_type=recommendation_data['system_type']['type'],
                total_capacity=float(recommendation_data['solar_system']['total_capacity'].split()[0]),
                num_panels=int(recommendation_data['solar_system']['num_panels']),
                panel_type=recommendation_data['solar_system']['panel_type'],
                battery_capacity=float(recommendation_data['battery_system']['total_capacity'].split()[0]),
                battery_type=recommendation_data['battery_system']['battery_type'],
                battery_configuration=recommendation_data['battery_system']['configuration']
            )
            db.session.add(solar_recommendation)

            # Store the profile ID in session for loan application
            session['user_profile_id'] = user_profile.id

            try:
                db.session.commit()
            except Exception as e:
                logging.error(f"Database error: {str(e)}")
                db.session.rollback()
                return jsonify({'error': 'Database error occurred'}), 500

            return jsonify(result)
        else:
            logging.error(f"Failed to get recommendations: {result.get('error')}")
            return jsonify({'error': 'Failed to get recommendations', 'details': result.get('error')}), 500

    except Exception as e:
        logging.error(f"Error in get_recommendations: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/submit_loan_application', methods=['POST'])
def submit_loan_application():
    try:
        user_profile_id = session.get('user_profile_id')
        if not user_profile_id:
            flash('Please complete the solar calculator first', 'error')
            return redirect(url_for('calculator'))

        # Create loan application
        loan_application = LoanApplication(
            user_profile_id=user_profile_id,
            full_name=request.form['full_name'],
            email=request.form['email'],
            phone=request.form['phone']
        )

        db.session.add(loan_application)
        db.session.commit()

        flash('Thank you for your application! We will contact you soon.', 'success')
        return redirect(url_for('calculator'))

    except Exception as e:
        logging.error(f"Error submitting loan application: {str(e)}")
        flash('There was an error submitting your application. Please try again.', 'error')
        return redirect(url_for('loan_application'))

@app.errorhandler(404)
def not_found_error(error):
    return render_template('404.html'), 404

@app.errorhandler(500)
def internal_error(error):
    return render_template('500.html'), 500