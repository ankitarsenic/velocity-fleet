from app import create_app
from app.extensions import db
from app.models import Role, User, Vehicle
from sqlalchemy import text
import json
import random

app = create_app()

ROLES_AND_PERMISSIONS = {
    "Super Admin": ["*"],
    "Fleet Manager": ["manage_vehicles", "manage_drivers", "manage_trips", "view_reports"],
    "Dispatcher": ["manage_trips", "assign_vehicles", "assign_drivers", "read_vehicles"],
    "Safety Officer": ["view_inspections", "manage_safety", "update_scores", "view_compliance"],
    "Financial Analyst": ["view_fuel", "manage_expenses", "view_financials"],
    "Driver": ["view_assigned_trips", "view_assigned_vehicle", "update_trip_status"],
    "Viewer": ["read_only"]
}

VEHICLE_TYPES = ['Bus', 'Truck', 'Van', 'SUV', 'Sedan', 'Electric', 'Mini Truck', 'Trailer']
REGIONS = ['North', 'South', 'East', 'West', 'Central']
LICENSE_CATEGORIES = ['LMV', 'HMV', 'Transport', 'Commercial', 'Hazardous Goods']

with app.app_context():
    # 1. Alter Tables (Ignoring errors if columns already exist)
    try:
        db.session.execute(text("ALTER TABLE role ADD COLUMN permissions JSON;"))
        print("Added 'permissions' column to 'role' table.")
    except Exception as e:
        db.session.rollback()
        print("Column 'permissions' might already exist.")
        
    try:
        db.session.execute(text("ALTER TABLE vehicle ADD COLUMN vehicle_type VARCHAR(50);"))
        db.session.execute(text("ALTER TABLE vehicle ADD COLUMN region VARCHAR(50);"))
        db.session.execute(text("ALTER TABLE vehicle ADD COLUMN license_category VARCHAR(50);"))
        db.session.execute(text("ALTER TABLE vehicle ADD COLUMN safety_score INT;"))
        print("Added new columns to 'vehicle' table.")
    except Exception as e:
        db.session.rollback()
        print("Vehicle columns might already exist.")

    db.session.commit()

    # 2. Rename old 'Admin' role to 'Super Admin' if exists
    old_admin = Role.query.filter_by(name="Admin").first()
    if old_admin:
        old_admin.name = "Super Admin"
        db.session.commit()
    
    # 3. Seed Roles and Permissions
    for role_name, perms in ROLES_AND_PERMISSIONS.items():
        role = Role.query.filter_by(name=role_name).first()
        if not role:
            role = Role(name=role_name)
            db.session.add(role)
        role.permissions = perms
    
    db.session.commit()
    print("Roles seeded with permissions.")

    # 4. Seed Vehicles with Mock Data
    vehicles = Vehicle.query.all()
    for v in vehicles:
        if not v.vehicle_type:
            v.vehicle_type = random.choice(VEHICLE_TYPES)
        if not v.region:
            v.region = random.choice(REGIONS)
        if not v.license_category:
            v.license_category = random.choice(LICENSE_CATEGORIES)
        if v.safety_score is None:
            v.safety_score = random.randint(40, 100)
    
    db.session.commit()
    print("Vehicles updated with advanced attributes.")
