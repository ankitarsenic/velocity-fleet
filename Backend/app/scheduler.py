from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from apscheduler.triggers.cron import CronTrigger
from datetime import datetime, timedelta
import logging

# Set up logging for our mock email service
logger = logging.getLogger('EmailService')
logger.setLevel(logging.INFO)
ch = logging.StreamHandler()
ch.setFormatter(logging.Formatter('=== EMAIL SERVICE ===\n%(message)s\n====================='))
logger.addHandler(ch)

def send_mock_email(driver_name, license_number, expiry_date, days_remaining):
    # This acts as our mock email sender. In a real environment, you'd use Flask-Mail or smtplib.
    email_body = f"""
    TO: fleet.admin@transitops.com, {driver_name.lower().replace(' ', '.')}@transitops-drivers.com
    SUBJECT: [URGENT] Driver License Expiry Notification - {days_remaining} Days Remaining
    
    Hello Fleet Admin & {driver_name},
    
    This is an automated notification from the TransitOps system.
    
    Driver: {driver_name}
    License Number: {license_number}
    Expiry Date: {expiry_date}
    
    WARNING: This license will expire in {days_remaining} day(s).
    Please ensure the license is renewed immediately. Drivers with expired licenses will be automatically locked out of the dispatch system and cannot be assigned to new trips.
    
    Thank you,
    TransitOps Automated Compliance System
    """
    logger.info(email_body)

def check_license_expiries(app):
    with app.app_context():
        from app.models import db, Driver, NotificationLog
        today = datetime.utcnow().date()
        
        # Drivers to check
        drivers = Driver.query.all()
        
        for driver in drivers:
            if not driver.license_expiry:
                continue
                
            delta = (driver.license_expiry - today).days
            
            # The milestones we care about
            if delta in [30, 15, 7, 1]:
                # Check if we already logged this milestone
                existing = NotificationLog.query.filter_by(driver_id=driver.id, milestone=delta).first()
                if not existing:
                    # Send email
                    send_mock_email(driver.name, driver.license_number, driver.license_expiry, delta)
                    
                    # Log it
                    log = NotificationLog(driver_id=driver.id, milestone=delta)
                    db.session.add(log)
                    db.session.commit()

def init_scheduler(app):
    scheduler = BackgroundScheduler()
    # Run the check daily at 1:00 AM. For testing purposes, we'll run it every 10 seconds.
    # scheduler.add_job(func=check_license_expiries, args=[app], trigger=CronTrigger(hour=1, minute=0))
    scheduler.add_job(func=check_license_expiries, args=[app], trigger=IntervalTrigger(seconds=10))
    scheduler.start()
