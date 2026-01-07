from sqlalchemy import create_engine, text

DATABASE_URL = "mysql+pymysql://root:@localhost:3306/control_biometrico_saas"
engine = create_engine(DATABASE_URL)

def run_migration():
    with engine.connect() as connection:
        try:
            # Check if column exists
            result = connection.execute(text("SHOW COLUMNS FROM admins LIKE 'sucursal_id'"))
            if result.fetchone():
                print("Column 'sucursal_id' already exists in 'admins'. Skipping.")
                return

            print("Adding 'sucursal_id' column to 'admins' table...")
            connection.execute(text("ALTER TABLE admins ADD COLUMN sucursal_id INT NULL DEFAULT NULL"))
            connection.execute(text("ALTER TABLE admins ADD CONSTRAINT fk_admin_sucursal FOREIGN KEY (sucursal_id) REFERENCES sucursales(id)"))
            connection.commit()
            print("Migration successful: Added 'sucursal_id' to 'admins'.")
        except Exception as e:
            print(f"Error during migration: {e}")

if __name__ == "__main__":
    run_migration()
