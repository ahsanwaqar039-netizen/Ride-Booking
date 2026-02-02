from flask import Flask, request, jsonify
from flask_cors import CORS
import random

app = Flask(__name__)
CORS(app)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "healthy"}), 200

@app.route('/suggest-fare', methods=['POST'])
def suggest_fare():
    data = request.json
    distance_km = data.get('distance_km', 0)
    traffic_factor = data.get('traffic_factor', 1.0)
    vehicle_type = data.get('vehicle_type', 'Car')

    base_fares = {
        'Bike': 50,
        'Car': 100,
        'AC Car': 150
    }
    
    rates = {
        'Bike': 40,
        'Car': 60,
        'AC Car': 100
    }
    
    base_fare = base_fares.get(vehicle_type, 100)
    rate_per_km = rates.get(vehicle_type, 60)
    
    estimated_fare = (base_fare + (distance_km * rate_per_km)) * traffic_factor
    

    min_fare = int(estimated_fare * 0.9)
    max_fare = int(estimated_fare * 1.2)
    
    return jsonify({
        "min_fare": min_fare,
        "max_fare": max_fare,
        "suggested_fare": int(estimated_fare),
        "currency": "PKR"
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5002)
