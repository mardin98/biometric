# Script rápido para crear el primer Super Admin
from passlib.context import CryptContext
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def crear_primer_superadmin():
    password_hasheada = pwd_context.hash("admin123") # Cambia esto
    print(f"Username: superadmin")
    print(f"Hashed PW: {password_hasheada}")
    # Inserta esto en tu base de datos:
    # INSERT INTO admins (username, hashed_password, rol, empresa_id) 
    # VALUES ('superadmin', 'EL_HASH_GENERADO', 'superadmin', 1);

# crear_primer_superadmin()