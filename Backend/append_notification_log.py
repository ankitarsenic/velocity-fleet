import os

filepath = r"c:\Users\Omesh\OneDrive\Desktop\Velocity fleet\Backend\app\models.py"

with open(filepath, 'a', encoding='utf-8') as f:
    f.write("\n")
    f.write("class NotificationLog(db.Model):\n")
    f.write("    id = db.Column(db.Integer, primary_key=True)\n")
    f.write("    driver_id = db.Column(db.Integer, db.ForeignKey('driver.id'), nullable=False)\n")
    f.write("    milestone = db.Column(db.Integer, nullable=False) # 30, 15, 7, 1\n")
    f.write("    sent_at = db.Column(db.DateTime, default=datetime.utcnow)\n")
    f.write("\n")
    f.write("    driver = db.relationship('Driver', backref=db.backref('notifications', lazy=True))\n")

print("Appended NotificationLog to models.py")
