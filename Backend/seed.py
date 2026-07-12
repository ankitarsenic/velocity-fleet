from datetime import date,timedelta
from app import create_app
from app.extensions import db
from app.models import Role,User,Vehicle,Driver
app=create_app()
with app.app_context():
 db.create_all()
 for name in ["Admin","Fleet Manager","Dispatcher","Safety Officer","Financial Analyst"]:
  if not Role.query.filter_by(name=name).first():db.session.add(Role(name=name))
 db.session.commit()
 if not User.query.filter_by(email="admin@transitops.local").first():
  user=User(email="admin@transitops.local",name="System Admin",role=Role.query.filter_by(name="Admin").first());user.set_password("ChangeMe123!")
  db.session.add_all([user,Vehicle(registration_number="TO-1001",make="Tata",model="Prima",capacity_kg=12000),Driver(employee_code="DRV-001",name="Ravi Kumar",license_number="DL-001",license_expiry=date.today()+timedelta(days=365))]);db.session.commit()
 print("Seeded: admin@transitops.local / ChangeMe123!")
