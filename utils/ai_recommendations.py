import os
import anthropic
from anthropic import Anthropic
import logging
import json

def get_system_recommendations(user_data):
    """Get AI-powered solar system recommendations using Claude."""
    try:
        client = Anthropic(api_key=os.environ['ANTHROPIC_API_KEY'])

        # Format the user data into a detailed prompt
        prompt = f"""Based on the following information about a Nigerian property's energy needs, calculate and provide specific recommendations for a solar power system. Return the data in a structured JSON format.

Location: {user_data['location']}
User Type: {user_data['user_type']}
Current Generator: {user_data['generator_size']}kW
Monthly Fuel Usage: {user_data['generator_fuel']} liters
Daily Energy Usage: {user_data['daily_energy']}kWh
Backup Days Needed: {user_data['backup_days']}
Budget Range: {user_data['budget_range']}

Consider:
- Nigerian climate conditions
- Local solar panel and battery costs
- Need for backup power
- Current generator expenses
- User's budget constraints

Return ONLY a JSON object with these exact keys (include units in the values):
{{
    "solar_system": {{
        "total_capacity": "X kW",
        "num_panels": "X",
        "panel_type": "XXX W monocrystalline"
    }},
    "battery_system": {{
        "total_capacity": "X kWh",
        "battery_type": "lithium-ion/gel/etc",
        "configuration": "X batteries in series/parallel"
    }},
    "financial": {{
        "estimated_cost": "₦X",
        "monthly_savings": "₦X",
        "payback_period": "X years"
    }},
    "installation": {{
        "mounting": "roof/ground mounted",
        "estimated_area": "X square meters",
        "additional_notes": "brief installation considerations"
    }}
}}"""

        # Call Claude API with the latest model
        message = client.messages.create(
            model="claude-3-5-sonnet-20241022",  # the newest Anthropic model is "claude-3-5-sonnet-20241022" which was released October 22, 2024
            max_tokens=1500,
            temperature=0.2,
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        )

        # Extract the response text
        response_text = message.content[0].text if isinstance(message.content, list) else message.content

        # Try to parse JSON from the response
        try:
            recommendations_data = json.loads(response_text)

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

            return {
                'success': True,
                'recommendations': html_recommendations
            }

        except json.JSONDecodeError as e:
            logging.error(f"Failed to parse JSON from Claude response: {str(e)}")
            return {
                'success': False,
                'error': 'Failed to parse AI recommendations'
            }

    except Exception as e:
        logging.error(f"Error getting AI recommendations: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }