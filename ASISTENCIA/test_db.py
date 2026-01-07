from sqlalchemy import create_engine, text
from sqlalchemy.exc import OperationalError

# --- CONFIGURACIÓN ---
# Prueba con tu configuración actual
DATABASE_URL = "mysql+pymysql://root:@localhost:3306/control_biometrico_saas"

print("--- INICIANDO DIAGNÓSTICO ---")
print(f"1. Intentando conectar a: {DATABASE_URL}")

try:
    engine = create_engine(DATABASE_URL)
    connection = engine.connect()
    print("✅ Conexión exitosa a MySQL.")
    
    print("\n2. Verificando tabla 'dispositivos'...")
    # Intentamos leer una columna simple
    result = connection.execute(text("SELECT count(*) FROM dispositivos;"))
    print(f"✅ Tabla encontrada. Hay {result.scalar()} dispositivos registrados.")

    print("\n3. CRÍTICO: Verificando columna 'last_seen'...")
    try:
        # Intentamos leer la columna conflictiva
        connection.execute(text("SELECT last_seen FROM dispositivos LIMIT 1;"))
        print("✅ ¡ÉXITO! La columna 'last_seen' EXISTE y funciona.")
    except Exception as e:
        print("❌ ERROR GRAVE: La columna 'last_seen' NO existe en la base de datos.")
        print("   Solución: Debes ejecutar el comando ALTER TABLE en MySQL.")
        print(f"   Detalle técnico: {e}")

    connection.close()

except OperationalError as e:
    print("\n❌ ERROR DE CONEXIÓN:")
    print("No se pudo entrar a la base de datos. Posibles causas:")
    print("1. La contraseña de root no es vacía (intenta quitar los dos puntos ':' después de root).")
    print("2. MySQL (XAMPP) está apagado.")
    print(f"Detalle: {e}")

except Exception as e:
    print(f"\n❌ OTRO ERROR: {e}")

print("\n--- FIN DEL DIAGNÓSTICO ---")