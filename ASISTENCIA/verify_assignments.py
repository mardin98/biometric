from sqlalchemy import create_engine, text

DATABASE_URL = "mysql+pymysql://root:@localhost:3306/control_biometrico_saas"
engine = create_engine(DATABASE_URL)

def verify_assignments():
    with engine.connect() as connection:
        print("\n--- VERIFICANDO ASIGNACIONES DE SUCURSAL ---")
        
        # 1. Verificar Staff (Admins/Supervisores)
        print("\n[STAFF/ADMINS CON SUCURSAL]")
        staff = connection.execute(text("""
            SELECT a.username, a.rol, s.nombre as sucursal 
            FROM admins a 
            JOIN sucursales s ON a.sucursal_id = s.id 
            WHERE a.sucursal_id IS NOT NULL
        """))
        found_staff = False
        for row in staff:
            found_staff = True
            print(f"✅ User: {row[0]} | Rol: {row[1]} | Sucursal: {row[2]}")
        if not found_staff:
            print("ℹ️ No hay staff asignado a sucursales específicas aún.")

        # 2. Verificar Usuarios (Empleados)
        print("\n[EMPLEADOS CON SUCURSAL]")
        users = connection.execute(text("""
            SELECT u.nombre_completo, u.cargo, s.nombre as sucursal
            FROM usuarios u
            JOIN sucursales s ON u.sucursal_id = s.id
            WHERE u.sucursal_id IS NOT NULL
        """))
        found_users = False
        for row in users:
            found_users = True
            print(f"✅ Empleado: {row[0]} | Cargo: {row[1]} | Sucursal: {row[2]}")
        if not found_users:
            print("ℹ️ No hay empleados asignados a sucursales todavía.")

        print("\n-------------------------------------------")

if __name__ == "__main__":
    verify_assignments()
