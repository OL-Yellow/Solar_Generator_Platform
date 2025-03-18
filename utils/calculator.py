from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
import math

@dataclass
class SystemRequirements:
    daily_energy_kwh: float
    peak_load_kw: float
    location_temperature: float
    grid_hours: float
    has_voltage_issues: bool
    backup_hours: float
    has_motor_loads: bool
    has_dual_use: bool
    budget_constraint: Optional[float]

def determine_system_type(requirements: SystemRequirements) -> str:
    """Determine the optimal system type based on requirements."""
    if requirements.has_dual_use:
        return "portable"
    elif requirements.grid_hours < 8:
        return "full_solar"
    elif requirements.grid_hours <= 16:
        return "hybrid"
    else:
        return "backup_only"

def recommend_battery_technology(requirements: SystemRequirements) -> Dict:
    """Recommend battery technology based on requirements."""
    is_high_temp = requirements.location_temperature > 35
    is_frequent_cycling = requirements.grid_hours < 16
    
    if is_high_temp or is_frequent_cycling:
        return {
            "technology": "lithium",
            "depth_of_discharge": 0.8,
            "lifecycle_years": 10,
            "reason": "High temperature environment and/or frequent cycling needs"
        }
    elif requirements.budget_constraint and requirements.budget_constraint < 1000000:  # Example threshold
        return {
            "technology": "lead_acid",
            "depth_of_discharge": 0.5,
            "lifecycle_years": 3,
            "reason": "Budget constraints favor lower upfront cost"
        }
    else:
        return {
            "technology": "lithium",
            "depth_of_discharge": 0.8,
            "lifecycle_years": 10,
            "reason": "Default recommendation for optimal performance"
        }

def get_system_size(requirements: SystemRequirements) -> Dict:
    """Calculate required solar system size with environmental factors."""
    # Base calculation
    daily_energy_with_losses = requirements.daily_energy_kwh * 1.2  # 20% system losses
    
    # Temperature derating
    temp_derating = max(0, (requirements.location_temperature - 25) * 0.005)
    
    # Dust/harmattan derating (assuming 10% loss)
    dust_derating = 0.10
    
    # Total derating factor
    total_derating = 1 + temp_derating + dust_derating
    
    # Calculate required system size
    required_capacity = math.ceil(daily_energy_with_losses * total_derating)
    
    # Ensure minimum size of 0.2 kW
    solar_size_kw = max(0.2, required_capacity / 4)  # Assuming 4 peak sun hours
    
    return {
        "solar_capacity_kw": solar_size_kw,
        "derating_factors": {
            "temperature": temp_derating,
            "dust": dust_derating,
            "total": total_derating
        }
    }

def get_battery_size(requirements: SystemRequirements, battery_tech: Dict) -> Dict:
    """Calculate required battery size considering various factors."""
    # Calculate basic energy storage needed
    daily_backup_kwh = requirements.daily_energy_kwh * (requirements.backup_hours / 24)
    
    # Account for depth of discharge
    usable_capacity = battery_tech["depth_of_discharge"]
    
    # Temperature derating (assuming 1% per degree above 30°C)
    temp_derating = max(0, (requirements.location_temperature - 30) * 0.01)
    
    # Calculate total capacity needed
    total_capacity = (daily_backup_kwh / usable_capacity) * (1 + temp_derating)
    
    # Ensure minimum size of 0.5 kWh
    total_capacity = max(0.5, total_capacity)
    
    return {
        "capacity_kwh": total_capacity,
        "derating_factors": {
            "temperature": temp_derating,
            "depth_of_discharge": usable_capacity
        }
    }

def get_inverter_size(requirements: SystemRequirements) -> Dict:
    """Calculate required inverter size with safety margins."""
    base_size = requirements.peak_load_kw
    
    # Add margin for motor starting if needed
    if requirements.has_motor_loads:
        base_size *= 3  # Triple size for motor starting surge
    
    # Add 20% safety margin
    recommended_size = base_size * 1.2
    
    # Determine inverter features needed
    features = ["surge_protection"]
    if requirements.has_voltage_issues:
        features.extend(["voltage_stabilization", "grid_interactive"])
    
    # Determine inverter type
    if recommended_size < 1:
        inverter_type = "micro"
    elif requirements.grid_hours < 24:
        inverter_type = "hybrid"
    else:
        inverter_type = "standard"
    
    return {
        "size_kw": recommended_size,
        "type": inverter_type,
        "features": features
    }

def recommend_protection_components(requirements: SystemRequirements) -> List[Dict]:
    """Recommend protection components based on system requirements."""
    components = [
        {
            "type": "security_cage",
            "description": "Outdoor equipment protection",
            "priority": "high"
        },
        {
            "type": "surge_protector",
            "description": "Equipment electrical protection",
            "priority": "high"
        }
    ]
    
    if requirements.has_voltage_issues:
        components.append({
            "type": "voltage_stabilizer",
            "description": "Grid voltage fluctuation protection",
            "priority": "high"
        })
    
    if requirements.peak_load_kw > 5:  # Larger systems need more security
        components.extend([
            {
                "type": "gps_tracker",
                "description": "Asset tracking and recovery",
                "priority": "medium"
            },
            {
                "type": "motion_sensor",
                "description": "Security monitoring",
                "priority": "medium"
            }
        ])
    
    return components

def perform_economic_analysis(
    system_size: Dict,
    battery_size: Dict,
    inverter_size: Dict,
    requirements: SystemRequirements
) -> Dict:
    """Perform economic analysis of the system."""
    # Example cost assumptions (in Naira)
    SOLAR_COST_PER_KW = 500000
    LITHIUM_COST_PER_KWH = 200000
    LEAD_ACID_COST_PER_KWH = 100000
    INVERTER_COST_PER_KW = 150000
    
    # Calculate component costs
    solar_cost = system_size["solar_capacity_kw"] * SOLAR_COST_PER_KW
    battery_cost = battery_size["capacity_kwh"] * (
        LITHIUM_COST_PER_KWH if requirements.location_temperature > 35 
        else LEAD_ACID_COST_PER_KWH
    )
    inverter_cost = inverter_size["size_kw"] * INVERTER_COST_PER_KW
    
    # Total system cost
    total_cost = solar_cost + battery_cost + inverter_cost
    
    # Calculate monthly savings (assuming diesel generator alternative)
    DIESEL_COST_PER_KWH = 200  # Example cost
    monthly_savings = requirements.daily_energy_kwh * 30 * DIESEL_COST_PER_KWH
    
    # Calculate payback period
    payback_months = total_cost / monthly_savings
    
    return {
        "initial_cost": total_cost,
        "monthly_savings": monthly_savings,
        "payback_period_months": payback_months,
        "component_costs": {
            "solar": solar_cost,
            "battery": battery_cost,
            "inverter": inverter_cost
        }
    }

def design_modular_system(requirements: SystemRequirements) -> Dict:
    """Design a modular system with expansion pathway."""
    # Calculate minimum viable system for critical loads
    critical_load_factor = 0.6  # Assume 60% of load is critical
    minimal_requirements = SystemRequirements(
        daily_energy_kwh=requirements.daily_energy_kwh * critical_load_factor,
        peak_load_kw=requirements.peak_load_kw * critical_load_factor,
        location_temperature=requirements.location_temperature,
        grid_hours=requirements.grid_hours,
        has_voltage_issues=requirements.has_voltage_issues,
        backup_hours=requirements.backup_hours,
        has_motor_loads=requirements.has_motor_loads,
        has_dual_use=requirements.has_dual_use,
        budget_constraint=requirements.budget_constraint
    )
    
    # Get minimal system specifications
    minimal_system = {
        "solar": get_system_size(minimal_requirements),
        "battery": get_battery_size(minimal_requirements, recommend_battery_technology(minimal_requirements)),
        "inverter": get_inverter_size(minimal_requirements)
    }
    
    # Calculate full system specifications
    full_system = {
        "solar": get_system_size(requirements),
        "battery": get_battery_size(requirements, recommend_battery_technology(requirements)),
        "inverter": get_inverter_size(requirements)
    }
    
    # Define expansion stages
    return {
        "initial_system": minimal_system,
        "final_system": full_system,
        "expansion_stages": [
            {
                "stage": 1,
                "description": "Critical loads only",
                "capacity": minimal_system
            },
            {
                "stage": 2,
                "description": "Full system implementation",
                "capacity": full_system
            }
        ]
    }
