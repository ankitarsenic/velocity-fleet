from datetime import datetime
from app.extensions import db
from werkzeug.security import generate_password_hash, check_password_hash

class Role(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)
    users = db.relationship('User', backref='role', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name
        }

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    name = db.Column(db.String(100), nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    role_id = db.Column(db.Integer, db.ForeignKey('role.id'), nullable=False)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'name': self.name,
            'role': self.role.name if self.role else None
        }

class Vehicle(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    registration_number = db.Column(db.String(20), unique=True, nullable=False)
    make = db.Column(db.String(50), nullable=False)
    model = db.Column(db.String(50), nullable=False)
    capacity_kg = db.Column(db.Integer, nullable=False)
    status = db.Column(db.String(20), nullable=False, default='AVAILABLE')  # AVAILABLE, ON_TRIP, MAINTENANCE
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'registration_number': self.registration_number,
            'make': self.make,
            'model': self.model,
            'capacity_kg': self.capacity_kg,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Driver(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    employee_code = db.Column(db.String(20), unique=True, nullable=False)
    name = db.Column(db.String(100), nullable=False)
    license_number = db.Column(db.String(50), nullable=False)
    license_expiry = db.Column(db.Date, nullable=False)
    status = db.Column(db.String(20), nullable=False, default='AVAILABLE')  # AVAILABLE, ON_TRIP, INACTIVE
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'employee_code': self.employee_code,
            'name': self.name,
            'license_number': self.license_number,
            'license_expiry': self.license_expiry.isoformat() if self.license_expiry else None,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Trip(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    vehicle_id = db.Column(db.Integer, db.ForeignKey('vehicle.id'), nullable=False)
    driver_id = db.Column(db.Integer, db.ForeignKey('driver.id'), nullable=False)
    origin = db.Column(db.String(100), nullable=False)
    destination = db.Column(db.String(100), nullable=False)
    status = db.Column(db.String(20), nullable=False, default='DISPATCHED')  # DISPATCHED, COMPLETED
    dispatch_time = db.Column(db.DateTime, default=datetime.utcnow)
    completion_time = db.Column(db.DateTime, nullable=True)
    cargo_weight_kg = db.Column(db.Integer, nullable=False)

    vehicle = db.relationship('Vehicle', backref=db.backref('trips', lazy=True))
    driver = db.relationship('Driver', backref=db.backref('trips', lazy=True))

    def to_dict(self):
        return {
            'id': self.id,
            'vehicle_id': self.vehicle_id,
            'vehicle': self.vehicle.to_dict() if self.vehicle else None,
            'driver_id': self.driver_id,
            'driver': self.driver.to_dict() if self.driver else None,
            'origin': self.origin,
            'destination': self.destination,
            'status': self.status,
            'dispatch_time': self.dispatch_time.isoformat() if self.dispatch_time else None,
            'completion_time': self.completion_time.isoformat() if self.completion_time else None,
            'cargo_weight_kg': self.cargo_weight_kg
        }

class Maintenance(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    vehicle_id = db.Column(db.Integer, db.ForeignKey('vehicle.id'), nullable=False)
    description = db.Column(db.String(200), nullable=False)
    cost = db.Column(db.Float, nullable=False, default=0.0)
    status = db.Column(db.String(20), nullable=False, default='IN_PROGRESS')  # IN_PROGRESS, COMPLETED
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=True)

    vehicle = db.relationship('Vehicle', backref=db.backref('maintenance_logs', lazy=True))

    def to_dict(self):
        return {
            'id': self.id,
            'vehicle_id': self.vehicle_id,
            'vehicle': self.vehicle.to_dict() if self.vehicle else None,
            'description': self.description,
            'cost': self.cost,
            'status': self.status,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'end_date': self.end_date.isoformat() if self.end_date else None
        }

class FuelLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    vehicle_id = db.Column(db.Integer, db.ForeignKey('vehicle.id'), nullable=False)
    liters = db.Column(db.Float, nullable=False)
    cost = db.Column(db.Float, nullable=False)
    date = db.Column(db.Date, nullable=False)

    vehicle = db.relationship('Vehicle', backref=db.backref('fuel_logs', lazy=True))

    def to_dict(self):
        return {
            'id': self.id,
            'vehicle_id': self.vehicle_id,
            'vehicle': self.vehicle.to_dict() if self.vehicle else None,
            'liters': self.liters,
            'cost': self.cost,
            'date': self.date.isoformat() if self.date else None
        }

class Expense(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    trip_id = db.Column(db.Integer, db.ForeignKey('trip.id'), nullable=True)
    amount = db.Column(db.Float, nullable=False)
    category = db.Column(db.String(50), nullable=False)  # Toll, Fuel, Maintenance, Other
    description = db.Column(db.String(200), nullable=False)
    date = db.Column(db.Date, nullable=False)

    trip = db.relationship('Trip', backref=db.backref('expenses', lazy=True))

    def to_dict(self):
        return {
            'id': self.id,
            'trip_id': self.trip_id,
            'trip': self.trip.to_dict() if self.trip else None,
            'amount': self.amount,
            'category': self.category,
            'description': self.description,
            'date': self.date.isoformat() if self.date else None
        }
