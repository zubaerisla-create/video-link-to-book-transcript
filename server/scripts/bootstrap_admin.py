#!/usr/bin/env python3
"""
Transcriptly Secure Admin Bootstrap CLI

Usage:
  # Promote existing user to administrator
  PYTHONPATH=. python -m server.scripts.bootstrap_admin --email user@example.com

  # List current administrators
  PYTHONPATH=. python -m server.scripts.bootstrap_admin --list

  # Create a new administrator account directly
  PYTHONPATH=. python -m server.scripts.bootstrap_admin --create --email admin@example.com --name "System Admin" --password "SecurePassword123"
"""

import argparse
import sys
from server.app.db.database import SessionLocal
from server.app.db.models import User
from server.app.db.migrations import run_database_migrations
from server.app.auth.security import hash_password
from server.app.services.analytics_service import record_admin_audit


def main():
    parser = argparse.ArgumentParser(description="Transcriptly Admin Bootstrap Utility")
    parser.add_argument("--email", type=str, help="Email address of the account to promote or create")
    parser.add_argument("--list", action="store_true", help="List all current administrators")
    parser.add_argument("--create", action="store_true", help="Create a new administrator account")
    parser.add_argument("--name", type=str, help="Full name (required with --create)")
    parser.add_argument("--password", type=str, help="Password (required with --create)")

    args = parser.parse_args()

    # Ensure migrations are applied first
    run_database_migrations()

    db = SessionLocal()
    try:
        if args.list:
            admins = db.query(User).filter((User.is_admin.is_(True)) | (User.role == "admin")).all()
            print(f"\nFound {len(admins)} administrator(s):")
            print("-" * 60)
            for a in admins:
                status_str = "ACTIVE" if a.is_active else "SUSPENDED"
                print(f"- {a.email} ({a.full_name}) | Status: {status_str} | ID: {a.id}")
            print("-" * 60 + "\n")
            return

        if not args.email:
            print("Error: --email or --list is required.")
            sys.exit(1)

        clean_email = args.email.strip().lower()

        if args.create:
            if not args.name or not args.password:
                print("Error: --name and --password are required when using --create.")
                sys.exit(1)

            if len(args.password) < 8:
                print("Error: Password must be at least 8 characters long.")
                sys.exit(1)

            existing = db.query(User).filter(User.email == clean_email).first()
            if existing:
                print(f"Error: User with email '{clean_email}' already exists. Use without --create to promote.")
                sys.exit(1)

            hashed = hash_password(args.password)
            new_admin = User(
                email=clean_email,
                full_name=args.name.strip(),
                hashed_password=hashed,
                role="admin",
                is_admin=True,
                is_active=True,
            )
            db.add(new_admin)
            db.commit()
            db.refresh(new_admin)

            record_admin_audit(
                db=db,
                admin_id=new_admin.id,
                admin_email="system_bootstrap_cli",
                action="ADMIN_BOOTSTRAP_CREATE",
                target_type="user",
                target_id=new_admin.id,
                details={"email": clean_email, "role": "admin"},
                ip_address="127.0.0.1",
            )

            print(f"Success: Created new administrator account for '{clean_email}' (id: {new_admin.id}).")
            return

        # Otherwise promote existing user
        user = db.query(User).filter(User.email == clean_email).first()
        if not user:
            print(f"Error: No user found with email '{clean_email}'.")
            print("To create a new administrator account, add --create --name \"...\" --password \"...\".")
            sys.exit(1)

        user.role = "admin"
        user.is_admin = True
        user.is_active = True
        if args.password:
            if len(args.password) < 8:
                print("Error: Password must be at least 8 characters long.")
                sys.exit(1)
            user.hashed_password = hash_password(args.password)
        db.commit()

        record_admin_audit(
            db=db,
            admin_id=user.id,
            admin_email="system_bootstrap_cli",
            action="ADMIN_BOOTSTRAP_PROMOTE",
            target_type="user",
            target_id=user.id,
            details={"email": clean_email, "promoted_role": "admin"},
            ip_address="127.0.0.1",
        )

        print(f"Success: User '{clean_email}' has been promoted to administrator (is_admin=True, role='admin').")

    finally:
        db.close()


if __name__ == "__main__":
    main()
