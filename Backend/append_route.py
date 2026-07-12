import os

filepath = r"c:\Users\Omesh\OneDrive\Desktop\Velocity fleet\Backend\app\routes.py"

code = """
# --- MONTHLY REPORT ENDPOINT ---
from sqlalchemy import extract

@api_bp.route('/reports/monthly', methods=['GET'])
@jwt_required()
@requires_permission(['view_reports', 'manage_trips', 'view_financials'])
def generate_monthly_report():
    month = request.args.get('month', type=int)
    year = request.args.get('year', type=int)
    
    if not month or not year:
        return jsonify({'message': 'Month and year are required parameters'}), 400
        
    # Aggregate data
    trips = Trip.query.filter(extract('month', Trip.dispatch_time) == month, extract('year', Trip.dispatch_time) == year).all()
    fuel_logs = FuelLog.query.filter(extract('month', FuelLog.date) == month, extract('year', FuelLog.date) == year).all()
    maintenance_logs = Maintenance.query.filter(extract('month', Maintenance.start_date) == month, extract('year', Maintenance.start_date) == year).all()
    expenses = Expense.query.filter(extract('month', Expense.date) == month, extract('year', Expense.date) == year).all()
    
    total_trips = len(trips)
    completed_trips = len([t for t in trips if t.status == 'COMPLETED'])
    total_distance = sum([(t.cargo_weight_kg / 100) * 10 for t in trips]) # Mock distance logic based on cargo weight for now
    avg_trip_distance = total_distance / total_trips if total_trips > 0 else 0
    
    total_fuel_liters = sum([f.liters for f in fuel_logs])
    total_fuel_cost = sum([f.cost for f in fuel_logs])
    avg_fuel_efficiency = total_distance / total_fuel_liters if total_fuel_liters > 0 else 0
    
    total_maintenance_cost = sum([m.cost for m in maintenance_logs])
    total_expenses = sum([e.amount for e in expenses])
    
    # Vehicles and Drivers
    active_vehicles_ids = set([t.vehicle_id for t in trips])
    total_active_vehicles = len(active_vehicles_ids)
    
    # Calculate vehicle performance
    vehicle_stats = {}
    for t in trips:
        vid = t.vehicle_id
        if vid not in vehicle_stats:
            vehicle_stats[vid] = {'trips': 0, 'distance': 0, 'fuel_used': 0, 'fuel_cost': 0, 'maintenance_cost': 0}
        vehicle_stats[vid]['trips'] += 1
        vehicle_stats[vid]['distance'] += (t.cargo_weight_kg / 100) * 10
        
    for f in fuel_logs:
        vid = f.vehicle_id
        if vid in vehicle_stats:
            vehicle_stats[vid]['fuel_used'] += f.liters
            vehicle_stats[vid]['fuel_cost'] += f.cost
            
    for m in maintenance_logs:
        vid = m.vehicle_id
        if vid in vehicle_stats:
            vehicle_stats[vid]['maintenance_cost'] += m.cost

    most_utilized_vehicle = None
    most_utilized_count = -1
    
    fleet_performance = []
    vehicles_lookup = {v.id: v for v in Vehicle.query.all()}
    
    for vid, stats in vehicle_stats.items():
        v = vehicles_lookup.get(vid)
        if not v: continue
        
        fuel_eff = stats['distance'] / stats['fuel_used'] if stats['fuel_used'] > 0 else 0
        perf = {
            'id': v.id,
            'name': f"{v.make} {v.model}",
            'registration': v.registration_number,
            'type': v.vehicle_type,
            'status': v.status,
            'trips': stats['trips'],
            'distance': stats['distance'],
            'fuel_used': stats['fuel_used'],
            'fuel_efficiency': fuel_eff,
            'expenses': stats['fuel_cost'] + stats['maintenance_cost']
        }
        fleet_performance.append(perf)
        if stats['trips'] > most_utilized_count:
            most_utilized_count = stats['trips']
            most_utilized_vehicle = perf

    # Sort fleet performance by trips
    fleet_performance.sort(key=lambda x: x['trips'], reverse=True)

    # Driver performance
    driver_stats = {}
    for t in trips:
        did = t.driver_id
        if did not in driver_stats:
            driver_stats[did] = {'trips': 0, 'distance': 0}
        driver_stats[did]['trips'] += 1
        driver_stats[did]['distance'] += (t.cargo_weight_kg / 100) * 10
        
    driver_performance = []
    drivers_lookup = {d.id: d for d in Driver.query.all()}
    
    for did, stats in driver_stats.items():
        d = drivers_lookup.get(did)
        if not d: continue
        
        driver_performance.append({
            'name': d.name,
            'employee_code': d.employee_code,
            'trips': stats['trips'],
            'distance': stats['distance'],
            'safety_score': 100 - (d.warnings_count * 10),
            'status': d.status
        })
        
    driver_performance.sort(key=lambda x: x['trips'], reverse=True)
    
    # Breakdown of expenses
    expense_breakdown = {
        'Fuel': total_fuel_cost,
        'Maintenance': total_maintenance_cost,
        'Tolls': sum([e.amount for e in expenses if e.category and e.category.lower() == 'toll']),
        'Other': sum([e.amount for e in expenses if not e.category or e.category.lower() != 'toll'])
    }
    
    # AI Rules Engine Insights
    insights = []
    if most_utilized_vehicle:
        insights.append(f"Vehicle '{most_utilized_vehicle['registration']}' was the most utilized this month with {most_utilized_vehicle['trips']} trips.")
    if avg_fuel_efficiency < 5 and total_fuel_liters > 0:
        insights.append("Warning: Fleet average fuel efficiency is critically low (under 5 km/L). Investigate idle times.")
    elif total_fuel_liters > 0:
        insights.append(f"Fleet fuel efficiency averaged {avg_fuel_efficiency:.2f} km/L, indicating optimal performance.")
    if total_maintenance_cost > (total_fuel_cost * 0.5) and total_maintenance_cost > 0:
        insights.append("Maintenance costs are exceedingly high compared to fuel. Consider renewing aging vehicles.")
    if total_trips > 0:
        insights.append(f"Successfully completed {completed_trips}/{total_trips} dispatched trips.")
        
    # Fleet Health Indicators
    health_score = 100
    if total_maintenance_cost > 5000: health_score -= 20
    if avg_fuel_efficiency > 0 and avg_fuel_efficiency < 8: health_score -= 10
    if len([d for d in drivers_lookup.values() if d.warnings_count > 0]) > 0: health_score -= 10
    
    health_status = 'Excellent' if health_score >= 90 else 'Good' if health_score >= 70 else 'Needs Attention' if health_score >= 50 else 'Critical'

    return jsonify({
        'summary': {
            'total_trips': total_trips,
            'completed_trips': completed_trips,
            'total_distance': total_distance,
            'avg_trip_distance': avg_trip_distance,
            'total_fuel_liters': total_fuel_liters,
            'total_fuel_cost': total_fuel_cost,
            'total_maintenance_cost': total_maintenance_cost,
            'total_operational_expenses': total_expenses + total_fuel_cost + total_maintenance_cost,
            'avg_fuel_efficiency': avg_fuel_efficiency,
            'total_active_vehicles': total_active_vehicles,
            'fleet_health': health_status,
        },
        'most_utilized_vehicle': most_utilized_vehicle,
        'fleet_performance': fleet_performance,
        'driver_performance': driver_performance,
        'expense_breakdown': expense_breakdown,
        'insights': insights
    }), 200
"""

with open(filepath, "a", encoding="utf-8") as f:
    f.write(code)

print("Appended /reports/monthly route to routes.py")
