import sys
sys.path.append('/home/ubuntu/repos/Ali/backend')

from app.database import db

print("Checking database reports...")
reports = db.get_all_reports()
print(f'Total reports in database: {len(reports)}')

for report in reports:
    print(f'Report ID: {report.report_id}')
    print(f'  Reporter: {report.reporter_id}')
    print(f'  Reported User: {report.reported_user_id}')
    print(f'  Category: {report.category}')
    print(f'  Reason: {report.reason}')
    print(f'  Status: {report.status}')
    print(f'  Created: {report.created_at}')
    print('---')

print("\nChecking all users...")
users = db.get_all_users()
print(f'Total users in database: {len(users)}')
for user in users:
    print(f'User ID: {user.user_id}, Username: {user.username}, Role: {user.role}, Status: {user.status}')
