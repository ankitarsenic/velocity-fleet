import os
import re

filepath = r"c:\Users\Omesh\OneDrive\Desktop\Velocity fleet\Backend\app\routes.py"

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update /trips POST
target_trips = """def create_trip():
    data = request.json
    driver = Driver.query.get(data['driver_id'])
    vehicle = Vehicle.query.get(data['vehicle_id'])"""
    
replacement_trips = """def create_trip():
    data = request.json
    driver = Driver.query.get(data['driver_id'])
    vehicle = Vehicle.query.get(data['vehicle_id'])
    
    if driver and driver.license_expiry:
        from datetime import datetime
        if driver.license_expiry < datetime.utcnow().date():
            return jsonify({'message': 'Cannot dispatch trip: Driver license is expired.'}), 403"""
            
content = content.replace(target_trips, replacement_trips)

# 2. Update /dispatch/recommend to skip expired drivers
target_rec = """            # Driver Scoring
            safety = 100 - (d.warnings_count * 10)"""
            
replacement_rec = """            # Skip if license expired
            from datetime import datetime
            if d.license_expiry and d.license_expiry < datetime.utcnow().date():
                continue
                
            # Driver Scoring
            safety = 100 - (d.warnings_count * 10)"""
            
content = content.replace(target_rec, replacement_rec)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated routes.py for license checks")
