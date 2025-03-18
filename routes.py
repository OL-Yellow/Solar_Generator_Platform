from flask import Blueprint, render_template, request, jsonify
from utils.calculator import (
    SystemRequirements,
    determine_system_type,
    recommend_battery_technology,
    get_system_size,
    get_battery_size,
    get_inverter_size,
    recommend_protection_components,
    perform_economic_analysis,
    design_modular_system
)
from models import db, Location, SystemConfiguration, SystemComponent

calculator = Blueprint('calculator', __name__, url_prefix='/calculator')

@calculator.route('/')
def index():
    return render_template('calculator/index.html')

@calculator.route('/calculate', methods=['POST'])
def calculate():
    try:
        data = request.get_json()

        # Create SystemRequirements from form data
        requirements = SystemRequirements(
            daily_energy_kwh=float(data['daily_energy_kwh']),
            peak_load_kw=float(data['peak_load_kw']),
            location_temperature=float(data['location_temperature']),
            grid_hours=float(data['grid_hours']),
            has_voltage_issues=bool(data['has_voltage_issues']),
            backup_hours=float(data['backup_hours']),
            has_motor_loads=bool(data['has_motor_loads']),
            has_dual_use=bool(data['has_dual_use']),
            budget_constraint=float(data['budget_constraint']) if data.get('budget_constraint') else None
        )

        # Get system recommendations
        system_type = determine_system_type(requirements)
        battery_tech = recommend_battery_technology(requirements)
        system_size = get_system_size(requirements)
        battery_size = get_battery_size(requirements, battery_tech)
        inverter_size = get_inverter_size(requirements)
        protection = recommend_protection_components(requirements)
        economics = perform_economic_analysis(system_size, battery_size, inverter_size, requirements)
        modular_design = design_modular_system(requirements)

        # Create location record
        location = Location(
            city=data['city'],
            state=data['state'],
            avg_sun_hours_dry=5.5,  # Example value, should be from data
            avg_sun_hours_wet=4.0,  # Example value, should be from data
            avg_temperature=requirements.location_temperature,
            grid_reliability=requirements.grid_hours,
            has_voltage_issues=requirements.has_voltage_issues
        )
        db.session.add(location)

        # Create system configuration
        config = SystemConfiguration(
            location=location,
            system_type=system_type,
            solar_capacity_kw=system_size['solar_capacity_kw'],
            battery_capacity_kwh=battery_size['capacity_kwh'],
            inverter_size_kw=inverter_size['size_kw'],
            battery_technology=battery_tech['technology'],
            battery_lifecycle_years=battery_tech['lifecycle_years'],
            depth_of_discharge=battery_tech['depth_of_discharge'],
            peak_load_kw=requirements.peak_load_kw,
            daily_energy_kwh=requirements.daily_energy_kwh,
            backup_hours_required=requirements.backup_hours,
            has_critical_loads=True if requirements.peak_load_kw > 3 else False,
            has_motor_loads=requirements.has_motor_loads,
            budget_constraint=requirements.budget_constraint,
            initial_cost=economics['initial_cost'],
            monthly_savings=economics['monthly_savings'],
            payback_period_months=economics['payback_period_months']
        )
        db.session.add(config)

        # Add recommended components
        for component in protection:
            comp = SystemComponent(
                system_configuration=config,
                component_type=component['type'],
                make_model="Generic",  # Should be from a product database
                quantity=1,
                unit_cost=50000,  # Example cost
                specifications={"priority": component['priority']},
                is_critical=component['priority'] == 'high',
                maintenance_interval_months=12
            )
            db.session.add(comp)

        db.session.commit()

        return jsonify({
            "system_type": system_type,
            "battery_technology": battery_tech,
            "system_size": system_size,
            "battery_size": battery_size,
            "inverter_size": inverter_size,
            "protection_components": protection,
            "economic_analysis": economics,
            "modular_design": modular_design
        })

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 400

@calculator.route('/modify', methods=['POST'])
def modify_configuration():
    try:
        data = request.get_json()
        config_id = data['config_id']
        modifications = data['modifications']

        # Get original configuration
        config = SystemConfiguration.query.get_or_404(config_id)

        # Update configuration based on modifications
        for key, value in modifications.items():
            if hasattr(config, key):
                setattr(config, key, value)

        # Recalculate system parameters
        requirements = SystemRequirements(
            daily_energy_kwh=config.daily_energy_kwh,
            peak_load_kw=config.peak_load_kw,
            location_temperature=config.location.avg_temperature,
            grid_hours=config.location.grid_reliability,
            has_voltage_issues=config.location.has_voltage_issues,
            backup_hours=config.backup_hours_required,
            has_motor_loads=config.has_motor_loads,
            has_dual_use=False,  # Assuming this isn't stored
            budget_constraint=config.budget_constraint
        )

        # Get updated calculations
        new_system_size = get_system_size(requirements)
        new_battery_tech = recommend_battery_technology(requirements)
        new_battery_size = get_battery_size(requirements, new_battery_tech)
        new_inverter_size = get_inverter_size(requirements)
        new_economics = perform_economic_analysis(
            new_system_size, new_battery_size, new_inverter_size, requirements
        )

        # Update configuration with new calculations
        config.solar_capacity_kw = new_system_size['solar_capacity_kw']
        config.battery_capacity_kwh = new_battery_size['capacity_kwh']
        config.inverter_size_kw = new_inverter_size['size_kw']
        config.initial_cost = new_economics['initial_cost']
        config.monthly_savings = new_economics['monthly_savings']
        config.payback_period_months = new_economics['payback_period_months']

        db.session.commit()

        return jsonify({
            "message": "Configuration updated successfully",
            "new_calculations": {
                "system_size": new_system_size,
                "battery_technology": new_battery_tech,
                "battery_size": new_battery_size,
                "inverter_size": new_inverter_size,
                "economic_analysis": new_economics
            }
        })

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 400