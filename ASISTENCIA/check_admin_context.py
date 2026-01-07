from sqlalchemy import create_engine, text

DATABASE_URL = "mysql+pymysql://root:@localhost:3306/control_biometrico_saas"
engine = create_engine(DATABASE_URL)

def check_admin():
    with engine.connect() as connection:
        result = connection.execute(text("SELECT username, rol FROM admins WHERE username='admin' OR rol LIKE '%admin%'"))
        print("\n--- ADMINS FOUND ---")
        for row in result:
            print(f"User: '{row[0]}', Role: '{row[1]}'") # Quotes to see whitespace
        print("--------------------\n")

if __name__ == "__main__":
    check_admin()
