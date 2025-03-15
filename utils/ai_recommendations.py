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

            # Format the recommendations in HTML
            html_recommendations = f"""
                <div class="mb-4">
                    <h4>Solar Panel System</h4>
                    <ul class="list-unstyled">
                        <li><strong>Total Capacity:</strong> {recommendations_data['solar_system']['total_capacity']}</li>
                        <li><strong>Number of Panels:</strong> {recommendations_data['solar_system']['num_panels']}</li>
                        <li><strong>Panel Type:</strong> {recommendations_data['solar_system']['panel_type']}</li>
                    </ul>
                </div>

                <div class="mb-4">
                    <h4>Battery System</h4>
                    <ul class="list-unstyled">
                        <li><strong>Total Capacity:</strong> {recommendations_data['battery_system']['total_capacity']}</li>
                        <li><strong>Battery Type:</strong> {recommendations_data['battery_system']['battery_type']}</li>
                        <li><strong>Configuration:</strong> {recommendations_data['battery_system']['configuration']}</li>
                    </ul>
                </div>

                <div class="mb-4">
                    <h4>Financial Analysis</h4>
                    <ul class="list-unstyled">
                        <li><strong>Estimated Cost:</strong> {recommendations_data['financial']['estimated_cost']}</li>
                        <li><strong>Monthly Savings:</strong> {recommendations_data['financial']['monthly_savings']}</li>
                        <li><strong>Payback Period:</strong> {recommendations_data['financial']['payback_period']}</li>
                    </ul>
                </div>

                <div class="mb-4">
                    <h4>Installation Details</h4>
                    <ul class="list-unstyled">
                        <li><strong>Mounting Type:</strong> {recommendations_data['installation']['mounting']}</li>
                        <li><strong>Required Area:</strong> {recommendations_data['installation']['estimated_area']}</li>
                        <li><strong>Additional Notes:</strong> {recommendations_data['installation']['additional_notes']}</li>
                    </ul>
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