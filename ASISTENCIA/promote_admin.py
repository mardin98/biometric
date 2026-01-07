from sqlalchemy import create_engine, text

DATABASE_URL = "mysql+pymysql://root:@localhost:3306/control_biometrico_saas"
engine = create_engine(DATABASE_URL)

def promote_admin():
    with engine.connect() as connection:
        print("Promoting user 'admin' to 'superadmin'...")
        try:
            connection.execute(text("UPDATE admins SET rol='superadmin' WHERE username='admin'"))
            connection.commit()
            print("Success! User 'admin' is now a 'superadmin'.")
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    promote_admin()
