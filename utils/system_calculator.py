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

CHARGE_CONTROLLER_COSTS = {
    "30A": 35000,
    "50A": 55000,
    "60A": 70000,
    "80A": 90000,
    "100A": 120000
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

def get_charge_controller_size(system_size_kw):
    """Determine appropriate charge controller size based on system size"""
    system_amps = (system_size_kw * 1000) / 48  # Assuming 48V system

    if system_amps <= 30:
        return "30A"
    elif system_amps <= 50:
        return "50A"
    elif system_amps <= 60:
        return "60A"
    elif system_amps <= 80:
        return "80A"
    else:
        return "100A"

def calculate_panel_count(system_size_kw, panel_watts=400):
    """Calculate number of panels needed based on system size and panel wattage"""
    # Convert kW to W
    system_watts = system_size_kw * 1000
    # Calculate number of panels
    panel_count = math.ceil(system_watts / panel_watts)
    return panel_count

def determine_system_type(grid_hours, usage_type):
    """
    Determine the recommended solar system type based on grid availability and usage pattern.

    Args:
        grid_hours (float): Daily grid power availability in hours
        usage_type (str): Type of usage ('home', 'business', or 'dual')

    Returns:
        dict: Contains system type recommendation and rationale
    """
    # Initialize the recommendation object
    system_type_info = {
        'type': 'integrated',  # Default recommendation
        'rationale': 'Integrated system recommended as default for reliable power supply.',
        'configuration': 'Fixed installation'
    }

    # Convert grid_hours to float for comparison
    try:
        grid_hours = float(grid_hours)
    except (TypeError, ValueError):
        grid_hours = 0

    # Check for dual-use case first
    if usage_type == 'dual':
        system_type_info.update({
            'type': 'portable',
            'rationale': 'Portable system recommended for dual home/business use for flexibility.',
            'configuration': 'Portable setup with wheeled mounting'
        })
        return system_type_info

    # Evaluate based on grid availability
    if grid_hours < 8:
        system_type_info.update({
            'type': 'full_solar',
            'rationale': f'Full solar system recommended due to very limited grid availability ({grid_hours} hours/day).',
            'configuration': 'Complete solar installation with extended battery backup'
        })
    elif grid_hours <= 16:
        # For 8-16 hours, evaluate cost-effectiveness
        if usage_type == 'business':
            # Businesses typically need more consistent power
            system_type_info.update({
                'type': 'hybrid',
                'rationale': f'Hybrid system recommended for business use with moderate grid availability ({grid_hours} hours/day). Ensures business continuity with grid-interactive capabilities.',
                'configuration': 'Grid-interactive system with battery backup'
            })
        else:
            # For homes, if grid is relatively reliable (>12 hours), backup might be sufficient
            if grid_hours > 12:
                system_type_info.update({
                    'type': 'backup',
                    'rationale': f'Backup-only system recommended due to decent grid availability ({grid_hours} hours/day). Cost-effective solution for home backup needs.',
                    'configuration': 'Basic backup system for essential loads'
                })
            else:
                system_type_info.update({
                    'type': 'hybrid',
                    'rationale': f'Hybrid system recommended due to moderate grid availability ({grid_hours} hours/day). Balances cost and reliability.',
                    'configuration': 'Grid-interactive system with battery backup'
                })
    else:
        system_type_info.update({
            'type': 'backup',
            'rationale': f'Backup-only system recommended due to good grid availability ({grid_hours} hours/day).',
            'configuration': 'Basic backup system for essential loads'
        })

    return system_type_info

def calculate_system_cost(daily_energy_kwh, location, backup_days, user_type, battery_type="lithium-ion"):
    """Calculate complete solar system cost based on parameters"""
    # Get system type recommendation
    grid_hours = float(location)  # Assuming location value is grid hours for now
    usage_type = user_type  # Map user_type to usage_type
    system_type_info = determine_system_type(grid_hours, usage_type)

    # Calculate system components
    system_size_kw = get_system_size(daily_energy_kwh, location)
    battery_size_kwh = get_battery_size(daily_energy_kwh, backup_days, user_type)
    inverter_size = get_inverter_size(system_size_kw)
    charge_controller_size = get_charge_controller_size(system_size_kw)
    panel_count = calculate_panel_count(system_size_kw)

    # Get cost factors for location
    location_costs = PANEL_COSTS.get(location, PANEL_COSTS["default"])
    panel_cost_per_watt = location_costs["cost_per_watt"]
    installation_factor = location_costs["installation_factor"]

    # Calculate component costs
    component_costs = {
        "solar_panels": system_size_kw * 1000 * panel_cost_per_watt,
        "batteries": battery_size_kwh * BATTERY_COSTS[battery_type]["cost_per_kwh"],
        "inverter": INVERTER_COSTS[inverter_size],
        "charge_controller": CHARGE_CONTROLLER_COSTS[charge_controller_size],
    }

    # Calculate BOS (Balance of System) and installation costs
    component_total = sum(component_costs.values())
    bos_cost = component_total * 0.15  # 15% for wiring, mounting, etc.
    installation_cost = component_total * (installation_factor - 1)

    # Total system cost
    total_cost = component_total + bos_cost + installation_cost

    # Calculate monthly savings vs generator
    monthly_generator_cost = daily_energy_kwh * 30 * 0.5 * 650
    monthly_savings = monthly_generator_cost

    # Calculate payback period (in years)
    payback_years = total_cost / (monthly_savings * 12)

    return {
        "system_type": system_type_info,
        "solar_system": {
            "total_capacity": f"{system_size_kw} kW",
            "num_panels": f"{panel_count}",
            "panel_type": "400 W monocrystalline",
            "charge_controller": charge_controller_size
        },
        "battery_system": {
            "total_capacity": f"{battery_size_kwh} kWh",
            "battery_type": battery_type,
            "configuration": f"{math.ceil(battery_size_kwh / 5)} batteries in parallel"
        },
        "financial": {
            "cost_breakdown": {
                "solar_panels": f"₦{component_costs['solar_panels']:,.2f}",
                "batteries": f"₦{component_costs['batteries']:,.2f}",
                "inverter": f"₦{component_costs['inverter']:,.2f}",
                "charge_controller": f"₦{component_costs['charge_controller']:,.2f}",
                "bos": f"₦{bos_cost:,.2f}",
                "installation": f"₦{installation_cost:,.2f}",
                "total": f"₦{total_cost:,.2f}"
            },
            "monthly_savings": f"₦{monthly_savings:,.2f}",
            "payback_period": f"{payback_years:.1f} years"
        },
        "installation": {
            "mounting": system_type_info["configuration"],
            "estimated_area": f"{panel_count * 2} square meters",
            "additional_notes": "Installation includes mounting hardware, wiring, and system configuration."
        }
    }

def get_html_recommendations(recommendations_data):
    """Format the recommendations in HTML with proper styling"""
    # Add system type section at the beginning
    html_recommendations = f"""
        <div class="results-card mb-4">
            <div class="row g-4">
                <div class="col-12">
                    <div class="recommendation-section">
                        <h4 class="section-title">Recommended System Type</h4>
                        <div class="specification-list">
                            <div class="spec-item">
                                <span class="spec-label">System Type:</span>
                                <span class="spec-value">{recommendations_data['system_type']['type'].replace('_', ' ').title()}</span>
                            </div>
                            <div class="spec-item">
                                <span class="spec-label">Rationale:</span>
                                <span class="spec-value">{recommendations_data['system_type']['rationale']}</span>
                            </div>
                            <div class="spec-item">
                                <span class="spec-label">Configuration:</span>
                                <span class="spec-value">{recommendations_data['system_type']['configuration']}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

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
                            <div class="spec-item">
                                <span class="spec-label">Charge Controller:</span>
                                <span class="spec-value">{recommendations_data['solar_system']['charge_controller']}</span>
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
                        <h4 class="section-title">Cost Breakdown</h4>
                        <div class="specification-list">
                            <div class="spec-item">
                                <span class="spec-label">Solar Panels:</span>
                                <span class="spec-value">{recommendations_data['financial']['cost_breakdown']['solar_panels']}</span>
                            </div>
                            <div class="spec-item">
                                <span class="spec-label">Batteries:</span>
                                <span class="spec-value">{recommendations_data['financial']['cost_breakdown']['batteries']}</span>
                            </div>
                            <div class="spec-item">
                                <span class="spec-label">Inverter:</span>
                                <span class="spec-value">{recommendations_data['financial']['cost_breakdown']['inverter']}</span>
                            </div>
                            <div class="spec-item">
                                <span class="spec-label">Charge Controller:</span>
                                <span class="spec-value">{recommendations_data['financial']['cost_breakdown']['charge_controller']}</span>
                            </div>
                            <div class="spec-item">
                                <span class="spec-label">Balance of System:</span>
                                <span class="spec-value">{recommendations_data['financial']['cost_breakdown']['bos']}</span>
                            </div>
                            <div class="spec-item">
                                <span class="spec-label">Installation:</span>
                                <span class="spec-value">{recommendations_data['financial']['cost_breakdown']['installation']}</span>
                            </div>
                            <div class="spec-item">
                                <span class="spec-label font-weight-bold">Total Cost:</span>
                                <span class="spec-value">{recommendations_data['financial']['cost_breakdown']['total']}</span>
                            </div>
                            <div class="spec-item">
                                <span class="spec-label">Monthly Savings:</span>
                                <span class="spec-value">{recommendations_data['financial']['monthly_savings']}</span>
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