# TransitOps - Intelligent Fleet Management Platform

![TransitOps Banner](https://via.placeholder.com/1200x300/0b0f19/ffffff?text=TransitOps+-+Next-Gen+Fleet+Intelligence)

## 🚀 The Problem
Every day, transport companies lose thousands of dollars because the wrong driver is assigned to the wrong vehicle, maintenance schedules are missed, fuel expenses are difficult to track, and dispatch decisions rely on manual spreadsheets. Existing solutions manage data but don't help managers make **better operational decisions**.

## 💡 Our Solution
**TransitOps** transforms fleet management from reactive tracking into proactive decision making. We built an enterprise-grade platform that acts as an intelligent operations assistant—evaluating multiple risk factors in seconds to recommend the safest and most cost-effective assignments, while completely automating compliance and reporting.

---

## 🔥 Key Innovations (Hackathon Highlights)

### 1. AI-Powered Dispatch Assistant
Instead of manually guessing which driver and vehicle to assign to a critical trip, our Expert Rules Engine evaluates:
* Cargo weight vs. Vehicle capacity limits
* Driver safety scores & active warnings
* License validity
* Route terrain risk

The AI provides **Explainable AI** reasoning (e.g., *"✔ Capacity matches cargo perfectly"*, *"⚠ Driver has recent safety warnings"*) and returns the Top 3 safest combinations with a calculated Dispatch Confidence Score.

### 2. Live Telematics & Predictive Overspeeding Alerts
A simulated real-time GPS tracking dashboard that monitors active trips. If a driver exceeds the predefined speed threshold (e.g., 120 km/h), the system automatically:
* Flashes a critical UI alert on the manager's dashboard.
* Dispatches a backend API warning that permanently logs an infraction against the driver's safety score.

### 3. Automated Compliance System
Never miss a license renewal again. A daily `APScheduler` background job scans the database and calculates the delta between today and every driver's license expiry date. 
* It aggressively highlights expired drivers in the UI.
* **Strict Enforcement:** The API and AI Assistant will actively block any expired driver from being dispatched.
* Simulates sending automated HTML warning emails at exactly 30, 15, 7, and 1 days before expiry.

### 4. Enterprise Reporting & Analytics
A powerful reporting module that aggregates thousands of data points across trips, fuel, and maintenance into a stunning dashboard (powered by `recharts`). 
* Generates an instant **Executive Monthly Report**.
* Features native, one-click **Export to PDF** utilizing strict CSS `@media print` rules for a flawless corporate layout.

### 5. Deep Role-Based Access Control (RBAC)
Complete enterprise security. The platform conditionally renders UI elements and strictly protects all Flask backend routes using JWT-based permission claims. 
* **Roles include:** Super Admin, Fleet Manager, Dispatcher, Safety Officer, and Financial Analyst.

---

## 🛠️ Technical Architecture

```text
User 
  ↓
React + Vite (Frontend)
  ↓
REST API (Flask-JWT-Extended)
  ↓
Business Logic (AI Dispatch, RBAC, Scheduler)
  ↓
MySQL (Database)
```

**Tech Stack:**
* **Frontend:** React, TypeScript, Vite, Tailwind CSS, Recharts, Lucide Icons
* **Backend:** Python, Flask, SQLAlchemy, Flask-JWT-Extended, APScheduler
* **Database:** MySQL

---

## 🚀 How to Run Locally

### 1. Backend Setup
```bash
cd Backend
python -m venv venv
source venv/bin/activate  # Or `venv\Scripts\activate` on Windows
pip install -r requirements.txt
python wsgi.py
```
*The Flask API will run on `http://localhost:5000`*

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
*The Vite application will run on `http://localhost:5173`*

### 3. Default Admin Login
* **Email:** `admin@transitops.local`
* **Password:** `ChangeMe123!`

---

## 📈 Business Impact
Our solution is projected to:
* **Reduce Dispatch Time** by 70% using the AI Assistant.
* **Improve Safety** by immediately penalizing unsafe driving behavior via live telematics.
* **Save Administrative Hours** by fully automating compliance checks and monthly PDF reporting.

*Fleet management shouldn't just record operations—it should improve every operational decision. TransitOps turns data into actionable insights, enabling safer, smarter, and more efficient transport management.*
