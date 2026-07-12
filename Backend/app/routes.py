from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.extensions import db
from app.models import Vehicle, Driver, Trip, Maintenance, FuelLog, Expense
from datetime import datetime, date, timedelta
import time
from sqlalchemy import func
from app.auth import requires_permission

api_bp = Blueprint('api', __name__)

# --- VEHICLES ENDPOINTS ---
@api_bp.route('/vehicles', methods=['GET'])
@jwt_required()
@requires_permission('read_vehicles')
def get_vehicles():
    query = Vehicle.query

    # Search
    search = request.args.get('search')
    if search:
        query = query.filter(db.or_(
            Vehicle.registration_number.ilike(f'%{search}%'),
            Vehicle.make.ilike(f'%{search}%'),
            Vehicle.model.ilike(f'%{search}%')
        ))

    # Multi-select filters
    statuses = request.args.getlist('status')
    if statuses:
        query = query.filter(Vehicle.status.in_(statuses))

    types = request.args.getlist('type')
    if types:
        query = query.filter(Vehicle.vehicle_type.in_(types))
        
    regions = request.args.getlist('region')
    if regions:
        query = query.filter(Vehicle.region.in_(regions))
        
    license_categories = request.args.getlist('license_category')
    if license_categories:
        query = query.filter(Vehicle.license_category.in_(license_categories))

    # Range filters
    min_score = request.args.get('min_score', type=int)
    if min_score is not None:
        query = query.filter(Vehicle.safety_score >= min_score)
        
    max_score = request.args.get('max_score', type=int)
    if max_score is not None:
        query = query.filter(Vehicle.safety_score <= max_score)

    # Sorting
    sort_by = request.args.get('sort_by', 'id')
    sort_dir = request.args.get('sort_dir', 'asc')
    
    if hasattr(Vehicle, sort_by):
        column = getattr(Vehicle, sort_by)
        if sort_dir.lower() == 'desc':
            query = query.order_by(column.desc())
        else:
            query = query.order_by(column.asc())

    # Pagination
    page = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 10, type=int)
    
    if limit > 0:
        pagination = query.paginate(page=page, per_page=limit, error_out=False)
        return jsonify({
            'data': [v.to_dict() for v in pagination.items],
            'meta': {
                'total': pagination.total,
                'page': pagination.page,
                'pages': pagination.pages,
                'limit': pagination.per_page
            }
        }), 200
    else:
        # If limit is 0 or not provided properly, return all matching
        vehicles = query.all()
        return jsonify({
            'data': [v.to_dict() for v in vehicles],
            'meta': {
                'total': len(vehicles),
                'page': 1,
                'pages': 1,
                'limit': len(vehicles)
            }
        }), 200

@api_bp.route('/vehicles', methods=['POST'])
@jwt_required()
@requires_permission('manage_vehicles')
def create_vehicle():
    data = request.get_json() or {}
    reg = data.get('registration_number')
    make = data.get('make')
    model = data.get('model')
    cap = data.get('capacity_kg')

    if not reg or not make or not model or cap is None:
        return jsonify({'message': 'Missing required fields'}), 400

    if Vehicle.query.filter_by(registration_number=reg).first():
        return jsonify({'message': 'Vehicle with this registration already exists'}), 400

    try:
        cap = int(cap)
    except ValueError:
        return jsonify({'message': 'Capacity must be a valid integer'}), 400

    vehicle = Vehicle(registration_number=reg, make=make, model=model, capacity_kg=cap)
    db.session.add(vehicle)
    db.session.commit()
    return jsonify(vehicle.to_dict()), 201

@api_bp.route('/vehicles/<int:id>', methods=['PUT'])
@jwt_required()
@requires_permission('manage_vehicles')
def update_vehicle(id):
    vehicle = Vehicle.query.get(id)
    if not vehicle:
        return jsonify({'message': 'Vehicle not found'}), 404

    data = request.get_json() or {}
    reg = data.get('registration_number')
    
    if reg and reg != vehicle.registration_number:
        if Vehicle.query.filter_by(registration_number=reg).first():
            return jsonify({'message': 'Vehicle with this registration already exists'}), 400
        vehicle.registration_number = reg

    if 'make' in data:
        vehicle.make = data['make']
    if 'model' in data:
        vehicle.model = data['model']
    if 'capacity_kg' in data:
        try:
            vehicle.capacity_kg = int(data['capacity_kg'])
        except ValueError:
            return jsonify({'message': 'Capacity must be a valid integer'}), 400
    if 'status' in data:
        if data['status'] not in ['AVAILABLE', 'ON_TRIP', 'MAINTENANCE']:
            return jsonify({'message': 'Invalid status'}), 400
        vehicle.status = data['status']

    db.session.commit()
    return jsonify(vehicle.to_dict()), 200

@api_bp.route('/vehicles/<int:id>', methods=['DELETE'])
@jwt_required()
@requires_permission('manage_vehicles')
def delete_vehicle(id):
    vehicle = Vehicle.query.get(id)
    if not vehicle:
        return jsonify({'message': 'Vehicle not found'}), 404
    
    # Check if vehicle has dependencies that prevent delete
    if vehicle.status == 'ON_TRIP':
        return jsonify({'message': 'Cannot delete a vehicle currently on a trip'}), 400

    db.session.delete(vehicle)
    db.session.commit()
    return jsonify({'message': 'Vehicle deleted successfully'}), 200


# --- DRIVERS ENDPOINTS ---
@api_bp.route('/drivers', methods=['GET'])
@jwt_required()
@requires_permission(['manage_drivers', 'read_drivers', 'assign_drivers'])
def get_drivers():
    drivers = Driver.query.all()
    return jsonify([d.to_dict() for d in drivers]), 200

@api_bp.route('/drivers', methods=['POST'])
@jwt_required()
@requires_permission('manage_drivers')
def create_driver():
    data = request.get_json() or {}
    code = data.get('employee_code')
    name = data.get('name')
    license_num = data.get('license_number')
    license_exp_str = data.get('license_expiry')

    if not code or not name or not license_num or not license_exp_str:
        return jsonify({'message': 'Missing required fields'}), 400

    if Driver.query.filter_by(employee_code=code).first():
        return jsonify({'message': 'Driver with this employee code already exists'}), 400

    try:
        license_exp = datetime.strptime(license_exp_str, '%Y-%m-%d').date()
    except ValueError:
        return jsonify({'message': 'Invalid expiry date format, use YYYY-MM-DD'}), 400

    driver = Driver(
        employee_code=code, name=name, 
        license_number=license_num, license_expiry=license_exp
    )
    db.session.add(driver)
    db.session.commit()
    return jsonify(driver.to_dict()), 201

@api_bp.route('/drivers/<int:id>', methods=['PUT'])
@jwt_required()
@requires_permission('manage_drivers')
def update_driver(id):
    driver = Driver.query.get(id)
    if not driver:
        return jsonify({'message': 'Driver not found'}), 404

    data = request.get_json() or {}
    code = data.get('employee_code')

    if code and code != driver.employee_code:
        if Driver.query.filter_by(employee_code=code).first():
            return jsonify({'message': 'Driver with this employee code already exists'}), 400
        driver.employee_code = code

    if 'name' in data:
        driver.name = data['name']
    if 'license_number' in data:
        driver.license_number = data['license_number']
    if 'license_expiry' in data:
        try:
            driver.license_expiry = datetime.strptime(data['license_expiry'], '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'message': 'Invalid date format, use YYYY-MM-DD'}), 400
    if 'status' in data:
        if data['status'] not in ['AVAILABLE', 'ON_TRIP', 'INACTIVE']:
            return jsonify({'message': 'Invalid status'}), 400
        driver.status = data['status']

    db.session.commit()
    return jsonify(driver.to_dict()), 200

@api_bp.route('/drivers/<int:id>', methods=['DELETE'])
@jwt_required()
@requires_permission('manage_drivers')
def delete_driver(id):
    driver = Driver.query.get(id)
    if not driver:
        return jsonify({'message': 'Driver not found'}), 404

    if driver.status == 'ON_TRIP':
        return jsonify({'message': 'Cannot delete a driver currently on a trip'}), 400

    db.session.delete(driver)
    db.session.commit()
    return jsonify({'message': 'Driver deleted successfully'}), 200

@api_bp.route('/drivers/<int:id>/issue-warning', methods=['POST'])
@jwt_required()
@requires_permission(['manage_drivers', 'manage_trips', 'view_assigned_trips'])
def issue_driver_warning(id):
    driver = Driver.query.get(id)
    if not driver:
        return jsonify({'message': 'Driver not found'}), 404
    
    driver.warnings_count += 1
    db.session.commit()
    
    print(f"⚠️ SAFETY ALERT: Driver {driver.name} ({driver.employee_code}) exceeded speed limit. Warning count is now {driver.warnings_count}.")
    
    return jsonify({'message': 'Warning issued successfully', 'warnings_count': driver.warnings_count}), 200


# --- TRIPS ENDPOINTS ---
@api_bp.route('/trips', methods=['GET'])
@jwt_required()
@requires_permission(['manage_trips', 'view_assigned_trips'])
def get_trips():
    trips = Trip.query.order_by(Trip.dispatch_time.desc()).all()
    return jsonify([t.to_dict() for t in trips]), 200

@api_bp.route('/trips', methods=['POST'])
@jwt_required()
@requires_permission('manage_trips')
def create_trip():
    data = request.get_json() or {}
    v_id = data.get('vehicle_id')
    d_id = data.get('driver_id')
    origin = data.get('origin')
    dest = data.get('destination')
    weight = data.get('cargo_weight_kg')

    if not v_id or not d_id or not origin or not dest or weight is None:
        return jsonify({'message': 'Missing required fields'}), 400

    vehicle = Vehicle.query.get(v_id)
    driver = Driver.query.get(d_id)

    if not vehicle:
        return jsonify({'message': 'Vehicle not found'}), 404
    if not driver:
        return jsonify({'message': 'Driver not found'}), 404

    # Validations:
    if vehicle.status != 'AVAILABLE':
        return jsonify({'message': f'Vehicle is currently not available (Status: {vehicle.status})'}), 400
    
    if driver.status != 'AVAILABLE':
        return jsonify({'message': f'Driver is currently not available (Status: {driver.status})'}), 400

    if driver.license_expiry < date.today():
        return jsonify({'message': f'Cannot dispatch: Driver license expired on {driver.license_expiry}'}), 400

    try:
        weight = int(weight)
    except ValueError:
        return jsonify({'message': 'Weight must be an integer'}), 400

    if weight > vehicle.capacity_kg:
        return jsonify({'message': f'Cargo weight ({weight}kg) exceeds vehicle capacity ({vehicle.capacity_kg}kg)'}), 400

    # Perform updates atomically
    vehicle.status = 'ON_TRIP'
    driver.status = 'ON_TRIP'

    trip = Trip(
        vehicle_id=v_id,
        driver_id=d_id,
        origin=origin,
        destination=dest,
        cargo_weight_kg=weight,
        status='DISPATCHED',
        dispatch_time=datetime.utcnow()
    )

    db.session.add(trip)
    db.session.commit()

    return jsonify(trip.to_dict()), 201

@api_bp.route('/trips/<int:id>/complete', methods=['POST'])
@jwt_required()
@requires_permission(['manage_trips', 'update_trip_status'])
def complete_trip(id):
    trip = Trip.query.get(id)
    if not trip:
        return jsonify({'message': 'Trip not found'}), 404

    if trip.status == 'COMPLETED':
        return jsonify({'message': 'Trip is already completed'}), 400

    trip.status = 'COMPLETED'
    trip.completion_time = datetime.utcnow()

    # Mark vehicle and driver as available
    if trip.vehicle:
        trip.vehicle.status = 'AVAILABLE'
    if trip.driver:
        trip.driver.status = 'AVAILABLE'

    db.session.commit()
    return jsonify(trip.to_dict()), 200


# --- MAINTENANCE ENDPOINTS ---
@api_bp.route('/maintenance', methods=['GET'])
@jwt_required()
@requires_permission(['manage_vehicles', 'view_inspections', 'manage_safety'])
def get_maintenance():
    logs = Maintenance.query.order_by(Maintenance.start_date.desc()).all()
    return jsonify([l.to_dict() for l in logs]), 200

@api_bp.route('/maintenance', methods=['POST'])
@jwt_required()
@requires_permission(['manage_vehicles', 'manage_safety'])
def create_maintenance():
    data = request.get_json() or {}
    v_id = data.get('vehicle_id')
    desc = data.get('description')
    start_date_str = data.get('start_date')
    cost = data.get('cost', 0.0)

    if not v_id or not desc or not start_date_str:
        return jsonify({'message': 'Missing required fields'}), 400

    vehicle = Vehicle.query.get(v_id)
    if not vehicle:
        return jsonify({'message': 'Vehicle not found'}), 404

    if vehicle.status == 'ON_TRIP':
        return jsonify({'message': 'Cannot schedule maintenance: Vehicle is currently on trip'}), 400

    try:
        start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
    except ValueError:
        return jsonify({'message': 'Invalid date format, use YYYY-MM-DD'}), 400

    vehicle.status = 'MAINTENANCE'
    log = Maintenance(
        vehicle_id=v_id,
        description=desc,
        start_date=start_date,
        cost=float(cost),
        status='IN_PROGRESS'
    )
    db.session.add(log)
    db.session.commit()
    return jsonify(log.to_dict()), 201

@api_bp.route('/maintenance/<int:id>/complete', methods=['POST'])
@jwt_required()
@requires_permission(['manage_vehicles', 'manage_safety'])
def complete_maintenance(id):
    log = Maintenance.query.get(id)
    if not log:
        return jsonify({'message': 'Maintenance log not found'}), 404

    if log.status == 'COMPLETED':
        return jsonify({'message': 'Maintenance is already completed'}), 400

    data = request.get_json() or {}
    cost = data.get('cost')
    end_date_str = data.get('end_date')

    if cost is not None:
        log.cost = float(cost)
    
    if end_date_str:
        try:
            log.end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'message': 'Invalid date format, use YYYY-MM-DD'}), 400
    else:
        log.end_date = date.today()

    log.status = 'COMPLETED'

    # Mark vehicle AVAILABLE
    if log.vehicle:
        log.vehicle.status = 'AVAILABLE'

    # Automatically add to general expenses as a maintenance category log
    expense = Expense(
        amount=log.cost,
        category='Maintenance',
        description=f'Completed Maintenance: {log.description} (Vehicle: {log.vehicle.registration_number if log.vehicle else "Unknown"})',
        date=log.end_date
    )
    db.session.add(expense)
    db.session.commit()
    return jsonify(log.to_dict()), 200


# --- FUEL LOGS ENDPOINTS ---
@api_bp.route('/fuel', methods=['GET'])
@jwt_required()
@requires_permission(['manage_vehicles', 'view_fuel'])
def get_fuel_logs():
    logs = FuelLog.query.order_by(FuelLog.date.desc()).all()
    return jsonify([l.to_dict() for l in logs]), 200

@api_bp.route('/fuel', methods=['POST'])
@jwt_required()
@requires_permission('manage_vehicles')
def create_fuel_log():
    data = request.get_json() or {}
    v_id = data.get('vehicle_id')
    liters = data.get('liters')
    cost = data.get('cost')
    date_str = data.get('date')

    if not v_id or liters is None or cost is None or not date_str:
        return jsonify({'message': 'Missing required fields'}), 400

    vehicle = Vehicle.query.get(v_id)
    if not vehicle:
        return jsonify({'message': 'Vehicle not found'}), 404

    try:
        fuel_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        liters = float(liters)
        cost = float(cost)
    except ValueError:
        return jsonify({'message': 'Invalid arguments/types'}), 400

    log = FuelLog(vehicle_id=v_id, liters=liters, cost=cost, date=fuel_date)
    db.session.add(log)
    
    # Automatically add to expenses
    expense = Expense(
        amount=cost,
        category='Fuel',
        description=f'Fuel refuel {liters}L (Vehicle: {vehicle.registration_number})',
        date=fuel_date
    )
    db.session.add(expense)
    db.session.commit()

    return jsonify(log.to_dict()), 201


# --- EXPENSES ENDPOINTS ---
@api_bp.route('/expenses', methods=['GET'])
@jwt_required()
@requires_permission(['manage_trips', 'manage_expenses', 'view_financials'])
def get_expenses():
    expenses = Expense.query.order_by(Expense.date.desc()).all()
    return jsonify([e.to_dict() for e in expenses]), 200

@api_bp.route('/expenses', methods=['POST'])
@jwt_required()
@requires_permission(['manage_trips', 'manage_expenses'])
def create_expense():
    data = request.get_json() or {}
    amount = data.get('amount')
    cat = data.get('category')
    desc = data.get('description')
    date_str = data.get('date')
    t_id = data.get('trip_id')

    if amount is None or not cat or not desc or not date_str:
        return jsonify({'message': 'Missing required fields'}), 400

    try:
        exp_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        amount = float(amount)
    except ValueError:
        return jsonify({'message': 'Invalid arguments/types'}), 400

    if t_id:
        trip = Trip.query.get(t_id)
        if not trip:
            return jsonify({'message': 'Trip not found'}), 404

    expense = Expense(amount=amount, category=cat, description=desc, date=exp_date, trip_id=t_id)
    db.session.add(expense)
    db.session.commit()
    return jsonify(expense.to_dict()), 201


# --- DASHBOARD & ANALYTICS ---
@api_bp.route('/dashboard', methods=['GET'])
@jwt_required()
@requires_permission(['view_reports', 'manage_trips', 'view_financials'])
def get_dashboard_metrics():
    # Active trips
    active_trips = Trip.query.filter_by(status='DISPATCHED').count()
    completed_trips = Trip.query.filter_by(status='COMPLETED').count()

    # Vehicles status counts
    total_vehicles = Vehicle.query.count()
    v_available = Vehicle.query.filter_by(status='AVAILABLE').count()
    v_on_trip = Vehicle.query.filter_by(status='ON_TRIP').count()
    v_maintenance = Vehicle.query.filter_by(status='MAINTENANCE').count()

    # Drivers status counts
    total_drivers = Driver.query.count()
    d_available = Driver.query.filter_by(status='AVAILABLE').count()
    d_on_trip = Driver.query.filter_by(status='ON_TRIP').count()
    d_inactive = Driver.query.filter_by(status='INACTIVE').count()

    # Expenses aggregates
    fuel_exp = db.session.query(func.sum(Expense.amount)).filter_by(category='Fuel').scalar() or 0.0
    maint_exp = db.session.query(func.sum(Expense.amount)).filter_by(category='Maintenance').scalar() or 0.0
    toll_exp = db.session.query(func.sum(Expense.amount)).filter_by(category='Toll').scalar() or 0.0
    other_exp = db.session.query(func.sum(Expense.amount)).filter(Expense.category.notin_(['Fuel', 'Maintenance', 'Toll'])).scalar() or 0.0
    
    total_expenses = fuel_exp + maint_exp + toll_exp + other_exp

    # Fleet utilization rate
    utilization_rate = (v_on_trip / total_vehicles * 100) if total_vehicles > 0 else 0

    # License alert metrics
    today = date.today()
    expired_licenses = Driver.query.filter(Driver.license_expiry < today).count()
    expiring_soon = Driver.query.filter(
        Driver.license_expiry >= today, 
        Driver.license_expiry <= today + timedelta(days=30)
    ).count()

    # Monthly expense breakdown (last 6 months)
    monthly_data = []
    # Calculate previous 6 months including current month
    for i in range(5, -1, -1):
        target_month_date = today - timedelta(days=30*i)
        year = target_month_date.year
        month = target_month_date.month
        month_name = target_month_date.strftime('%b')
        
        # Start and end date for filtering
        start_date = date(year, month, 1)
        if month == 12:
            end_date = date(year + 1, 1, 1)
        else:
            end_date = date(year, month + 1, 1)

        month_fuel = db.session.query(func.sum(Expense.amount)).filter(
            Expense.category == 'Fuel',
            Expense.date >= start_date,
            Expense.date < end_date
        ).scalar() or 0.0

        month_maint = db.session.query(func.sum(Expense.amount)).filter(
            Expense.category == 'Maintenance',
            Expense.date >= start_date,
            Expense.date < end_date
        ).scalar() or 0.0

        month_others = db.session.query(func.sum(Expense.amount)).filter(
            Expense.category.notin_(['Fuel', 'Maintenance']),
            Expense.date >= start_date,
            Expense.date < end_date
        ).scalar() or 0.0

        monthly_data.append({
            'name': month_name,
            'fuel': float(month_fuel),
            'maintenance': float(month_maint),
            'others': float(month_others),
            'total': float(month_fuel + month_maint + month_others)
        })

    # Find driver alerts list (name, licence_number, expiry, employee_code, status)
    alerts_list = []
    drivers_with_alerts = Driver.query.filter(
        Driver.license_expiry <= today + timedelta(days=30)
    ).order_by(Driver.license_expiry.asc()).all()
    
    for d in drivers_with_alerts:
        days_left = (d.license_expiry - today).days
        alerts_list.append({
            'id': d.id,
            'name': d.name,
            'employee_code': d.employee_code,
            'license_number': d.license_number,
            'license_expiry': d.license_expiry.isoformat(),
            'days_left': days_left,
            'status': 'EXPIRED' if days_left < 0 else 'EXPIRING_SOON'
        })

    return jsonify({
        'kpis': {
            'active_trips': active_trips,
            'completed_trips': completed_trips,
            'total_vehicles': total_vehicles,
            'v_available': v_available,
            'v_on_trip': v_on_trip,
            'v_maintenance': v_maintenance,
            'total_drivers': total_drivers,
            'd_available': d_available,
            'd_on_trip': d_on_trip,
            'd_inactive': d_inactive,
            'utilization_rate': round(utilization_rate, 2),
            'expired_licenses': expired_licenses,
            'expiring_soon': expiring_soon,
            'total_expenses': round(total_expenses, 2),
            'breakdown': {
                'fuel': round(fuel_exp, 2),
                'maintenance': round(maint_exp, 2),
                'toll': round(toll_exp, 2),
                'others': round(other_exp, 2)
            }
        },
        'monthly_history': monthly_data,
        'driver_alerts': alerts_list
    }), 200

# --- PAYMENT GATEWAY ENDPOINT ---
@api_bp.route('/payments/process', methods=['POST'])
@jwt_required()
@requires_permission(['manage_expenses', 'manage_trips', 'manage_vehicles'])
def process_payment():
    data = request.get_json() or {}
    ref_id = data.get('reference_id')
    amount = data.get('amount')
    method = data.get('payment_method')
    record_type = data.get('record_type')

    if not ref_id or not amount or not method or not record_type:
        return jsonify({'message': 'Missing required payment fields'}), 400

    # Simulate banking gateway delay
    time.sleep(1.5)

    if record_type == 'trip':
        trip = Trip.query.get(ref_id)
        if trip:
            trip.status = 'PAID'
    elif record_type == 'maintenance':
        maint = Maintenance.query.get(ref_id)
        if maint:
            maint.status = 'PAID'
            
    db.session.commit()
    return jsonify({
        'message': 'Payment successful', 
        'transaction_id': f'TXN-{int(time.time())}'
    }), 200

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
