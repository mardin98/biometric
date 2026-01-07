from main import SessionLocal, Admin, get_password_hash

# Conexión a la base de datos
db = SessionLocal()

print("--- INTENTANDO CREAR ADMINISTRADOR ---")

try:
    username = "superadmin"
    password = "admin123"

    # 1. Verificar si ya existe
    existe = db.query(Admin).filter(Admin.username == username).first()

    if existe:
        print(f"⚠️ El usuario '{username}' YA EXISTE. No se hizo nada.")
    else:
        # 2. Crear usuario
        print("Encriptando contraseña...")
        hashed_pw = get_password_hash(password)
        
        print("Guardando en base de datos...")
        nuevo_admin = Admin(username=username, hashed_password=hashed_pw)
        db.add(nuevo_admin)
        db.commit()
        print(f"✅ ¡ÉXITO TOTAL! Usuario '{username}' creado.")

except Exception as e:
    print("\n❌ ERROR GRAVE:")
    print(e)
    print("\nPosible solución: Instala bcrypt manualmente ejecutando:")
    print("pip install bcrypt")

finally:
    db.close()