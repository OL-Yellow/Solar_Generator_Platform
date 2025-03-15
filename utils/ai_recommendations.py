import os
import anthropic
from anthropic import Anthropic
import logging

def get_system_recommendations(user_data):
    """Get AI-powered solar system recommendations using Claude."""
    try:
        client = Anthropic(api_key=os.environ['ANTHROPIC_API_KEY'])
        
        # Format the user data into a detailed prompt
        prompt = f"""Based on the following information about a Nigerian property's energy needs, provide specific recommendations for a solar power system. Include panel size, battery capacity, and system specifications:

Location: {user_data['location']}
User Type: {user_data['user_type']}
Current Generator: {user_data['generator_size']}KVA
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

Provide recommendations in this format:
1. Solar Panel System:
   - Total capacity in kW
   - Suggested number and type of panels
2. Battery System:
   - Total capacity in kWh
   - Recommended battery configuration
3. Cost Analysis:
   - Estimated total system cost
   - Monthly savings projection
   - Payback period
4. Additional Recommendations:
   - Installation considerations
   - Maintenance requirements
   - System optimization tips
"""

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
        
        return {
            'success': True,
            'recommendations': message.content
        }
        
    except Exception as e:
        logging.error(f"Error getting AI recommendations: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }
