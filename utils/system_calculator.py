import json
import math
import os

# Component cost tables by location
PANEL_COSTS = {
    "Lagos": {"cost_per_watt": 350, "installation_factor": 1.1},
    "Abuja": {"cost_per_watt": 370, "installation_factor": 1.0},
    "Kano": {"cost_per_watt": 390, "installation_factor": 1.2},
    "Port Harcourt": {"cost_per_watt": 360, "installation_factor": 1.15},
    "Ibadan": {"cost_per_watt": 355, "installation_factor": 1.05},
    "Enugu": {"cost_per_watt": 380, "installation_factor": 1.1},
    # Default for any unlisted location
    "default": {"cost_per_watt": 365, "installation_factor": 1.1}
}

BATTERY_COSTS = {
    "lithium-ion": {"cost_per_kwh": 180000, "cycles": 3000, "efficiency": 0.95},
    "gel": {"cost_per_kwh": 120000, "cycles": 1500, "efficiency": 0.85},
    "lead-acid": {"cost_per_kwh": 80000, "cycles": 800, "efficiency": 0.75}
}

INVERTER_COSTS = {
    "1-3kW": 150000,
    "3-5kW": 250000,
    "5-10kW": 400000,
    "10-15kW": 600000,
    "15-20kW": 800000
}

# Location-specific sun hours (average per day)
SUN_HOURS = {
    "Lagos": 5.5,
    "Abuja": 6.0,
    "Kano": 6.5,
    "Port Harcourt": 5.0,
    "Ibadan": 5.8,
    "Enugu": 5.6,
    # Default for any unlisted location
    "default": 5.5
}

def get_system_size(daily_energy_kwh, location):
    """Calculate required solar system size based on energy needs and location"""
    # Get sun hours for location or use default
    sun_hours = SUN_HOURS.get(location, SUN_HOURS["default"])

    # Add 20% buffer for system losses and future expansion
    required_kw = (daily_energy_kwh / sun_hours) * 1.2

    # Round up to nearest 0.5 kW
    required_kw = math.ceil(required_kw * 2) / 2

    # Ensure minimum system size of 1 kW
    return max(1.0, required_kw)

def get_battery_size(daily_energy_kwh, backup_days, user_type):
    """Calculate required battery capacity based on energy needs and backup days"""
    # For businesses, assume 70% of daily energy is used during daylight hours
    # For households, assume 50% of daily energy is used during daylight hours
    night_usage_factor = 0.5 if user_type == "household" else 0.3

    # Calculate energy needed to store
    night_energy_kwh = daily_energy_kwh * night_usage_factor

    # Factor in backup days
    backup_energy_kwh = daily_energy_kwh * (backup_days - 1) + night_energy_kwh

    # Add 30% buffer for battery depth of discharge and degradation
    required_capacity = backup_energy_kwh * 1.3

    # Round up to nearest 1 kWh
    return math.ceil(required_capacity)

def get_inverter_size(system_size_kw):
    """Determine appropriate inverter size range based on solar system size"""
    if system_size_kw <= 3:
        return "1-3kW"
    elif system_size_kw <= 5:
        return "3-5kW"
    elif system_size_kw <= 10:
        return "5-10kW"
    elif system_size_kw <= 15:
        return "10-15kW"
    else:
        return "15-20kW"

def calculate_panel_count(system_size_kw, panel_watts=400):
    """Calculate number of panels needed based on system size and panel wattage"""
    # Convert kW to W
    system_watts = system_size_kw * 1000
    # Calculate number of panels
    panel_count = math.ceil(system_watts / panel_watts)
    return panel_count

def calculate_system_cost(daily_energy_kwh, location, backup_days, user_type, battery_type="lithium-ion"):
    """Calculate complete solar system cost based on parameters"""
    # Calculate system components
    system_size_kw = get_system_size(daily_energy_kwh, location)
    battery_size_kwh = get_battery_size(daily_energy_kwh, backup_days, user_type)
    inverter_size = get_inverter_size(system_size_kw)
    panel_count = calculate_panel_count(system_size_kw)

    # Get cost factors for location
    location_costs = PANEL_COSTS.get(location, PANEL_COSTS["default"])
    panel_cost_per_watt = location_costs["cost_per_watt"]
    installation_factor = location_costs["installation_factor"]

    # Calculate component costs
    panel_cost = system_size_kw * 1000 * panel_cost_per_watt
    battery_cost = battery_size_kwh * BATTERY_COSTS[battery_type]["cost_per_kwh"]
    inverter_cost = INVERTER_COSTS[inverter_size]

    # Installation and balance of system costs (wiring, mounting, etc.)
    installation_cost = (panel_cost + battery_cost + inverter_cost) * (installation_factor - 1)

    # Calculate total system cost
    total_cost = panel_cost + battery_cost + inverter_cost + installation_cost

    # Calculate monthly savings vs generator
    # Assuming generator fuel cost of NGN 350/liter and 0.5 liter per kWh
    monthly_generator_cost = daily_energy_kwh * 30 * 0.5 * 350
    monthly_savings = monthly_generator_cost

    # Calculate payback period (in years)
    payback_years = total_cost / (monthly_savings * 12)

    # Convert currency values to formatted strings
    total_cost_formatted = f"{total_cost:,.2f}"
    monthly_savings_formatted = f"{monthly_savings:,.2f}"

    return {
        "solar_system": {
            "total_capacity": f"{system_size_kw} kW",
            "num_panels": f"{panel_count}",
            "panel_type": "400 W monocrystalline"
        },
        "battery_system": {
            "total_capacity": f"{battery_size_kwh} kWh",
            "battery_type": battery_type,
            "configuration": f"{math.ceil(battery_size_kwh / 5)} batteries in parallel"
        },
        "financial": {
            "estimated_cost": f"₦{total_cost_formatted}",
            "monthly_savings": f"₦{monthly_savings_formatted}",
            "payback_period": f"{payback_years:.1f} years"
        },
        "installation": {
            "mounting": "roof mounted",
            "estimated_area": f"{panel_count * 2} square meters",
            "additional_notes": "Installation includes mounting hardware, wiring, and system configuration."
        }
    }

def get_html_recommendations(recommendations_data):
    """Format the recommendations in HTML with proper styling"""
    # Format currency values
    estimated_cost = recommendations_data['financial']['estimated_cost'].replace('₦', '')
    monthly_savings = recommendations_data['financial']['monthly_savings'].replace('₦', '')

    # Format the recommendations in HTML with proper styling
    html_recommendations = f"""
        <div class="results-card mb-4">
            <div class="row g-4">
                <div class="col-12 col-md-6">
                    <div class="recommendation-section">
                        <h4 class="section-title">Solar Panel System</h4>
                        <div class="specification-list">
                            <div class="spec-item">
                                <span class="spec-label">Total Capacity:</span>
                                <span class="spec-value">{recommendations_data['solar_system']['total_capacity']}</span>
                            </div>
                            <div class="spec-item">
                                <span class="spec-label">Number of Panels:</span>
                                <span class="spec-value">{recommendations_data['solar_system']['num_panels']}</span>
                            </div>
                            <div class="spec-item">
                                <span class="spec-label">Panel Type:</span>
                                <span class="spec-value">{recommendations_data['solar_system']['panel_type']}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-12 col-md-6">
                    <div class="recommendation-section">
                        <h4 class="section-title">Battery System</h4>
                        <div class="specification-list">
                            <div class="spec-item">
                                <span class="spec-label">Total Capacity:</span>
                                <span class="spec-value">{recommendations_data['battery_system']['total_capacity']}</span>
                            </div>
                            <div class="spec-item">
                                <span class="spec-label">Battery Type:</span>
                                <span class="spec-value">{recommendations_data['battery_system']['battery_type'].title()}</span>
                            </div>
                            <div class="spec-item">
                                <span class="spec-label">Configuration:</span>
                                <span class="spec-value">{recommendations_data['battery_system']['configuration']}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="results-card mb-4">
            <div class="row g-4">
                <div class="col-12">
                    <div class="recommendation-section">
                        <h4 class="section-title">Financial Analysis</h4>
                        <div class="specification-list">
                            <div class="spec-item">
                                <span class="spec-label">Estimated Cost:</span>
                                <span class="spec-value">₦{estimated_cost}</span>
                            </div>
                            <div class="spec-item">
                                <span class="spec-label">Monthly Savings:</span>
                                <span class="spec-value">₦{monthly_savings}</span>
                            </div>
                            <div class="spec-item">
                                <span class="spec-label">Payback Period:</span>
                                <span class="spec-value">{recommendations_data['financial']['payback_period']}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="results-card">
            <div class="row g-4">
                <div class="col-12">
                    <div class="recommendation-section">
                        <h4 class="section-title">Installation Details</h4>
                        <div class="specification-list">
                            <div class="spec-item">
                                <span class="spec-label">Mounting Type:</span>
                                <span class="spec-value">{recommendations_data['installation']['mounting'].title()}</span>
                            </div>
                            <div class="spec-item">
                                <span class="spec-label">Required Area:</span>
                                <span class="spec-value">{recommendations_data['installation']['estimated_area']}</span>
                            </div>
                            <div class="spec-item installation-notes">
                                <span class="spec-label">Additional Notes:</span>
                                <p class="spec-value notes-text">{recommendations_data['installation']['additional_notes']}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    """

    return html_recommendations

def get_system_recommendations(user_data):
    """Get solar system recommendations using local calculation rules"""
    try:
        # Default to 1 day backup period since we're calculating based on daily backup power
        backup_days = 1  

        recommendations_data = calculate_system_cost(
            daily_energy_kwh=float(user_data['daily_energy']),
            location=user_data['location'],
            backup_days=backup_days,
            user_type=user_data['user_type'],
            battery_type="lithium-ion"  # Default to lithium-ion batteries
        )

        html_recommendations = get_html_recommendations(recommendations_data)

        return {
            'success': True,
            'recommendations': html_recommendations
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }