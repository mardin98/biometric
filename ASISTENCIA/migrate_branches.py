from sqlalchemy import create_engine, text

DATABASE_URL = "mysql+pymysql://root:@localhost:3306/control_biometrico_saas"
engine = create_engine(DATABASE_URL)

def run_migration():
    with engine.connect() as connection:
        # 1. Crear tabla sucursales
        print("Creando tabla sucursales...")
        try:
            connection.execute(text("""
            CREATE TABLE IF NOT EXISTS sucursales (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nombre VARCHAR(100),
                empresa_id INT,
                activo BOOLEAN DEFAULT TRUE,
                FOREIGN KEY (empresa_id) REFERENCES empresas(id)
            );
            """))
        except Exception as e:
            print(f"Error creando tabla: {e}")

        # 2. Agregar columna sucursal_id a usuarios
        print("Agregando columna sucursal_id a usuarios...")
        try:
            connection.execute(text("ALTER TABLE usuarios ADD COLUMN sucursal_id INT NULL;"))
            connection.execute(text("ALTER TABLE usuarios ADD CONSTRAINT fk_usuarios_sucursal FOREIGN KEY (sucursal_id) REFERENCES sucursales(id);"))
        except Exception as e:
            print(f"Nota en usuarios (puede que ya exista): {e}")

        # 3. Agregar columna sucursal_id a dispositivos
        print("Agregando columna sucursal_id a dispositivos...")
        try:
            connection.execute(text("ALTER TABLE dispositivos ADD COLUMN sucursal_id INT NULL;"))
            connection.execute(text("ALTER TABLE dispositivos ADD CONSTRAINT fk_dispositivos_sucursal FOREIGN KEY (sucursal_id) REFERENCES sucursales(id);"))
        except Exception as e:
            print(f"Nota en dispositivos (puede que ya exista): {e}")

        print("Migración completada.")

if __name__ == "__main__":
    run_migration()
