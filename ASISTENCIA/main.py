from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, DateTime, ForeignKey, Boolean, text, desc
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from pydantic import BaseModel
import pytz
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import WebSocket, WebSocketDisconnect
from typing import List
import hashlib

# --- CONFIGURACIÓN BD ---
DATABASE_URL = "mysql+pymysql://root:@localhost:3306/control_biometrico_saas"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

app = FastAPI(title="S3-BioPass API")

# --- SEGURIDAD ---
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from passlib.context import CryptContext
from jose import JWTError, jwt

SECRET_KEY = "secreto_super_seguro_cambialo_en_produccion" 
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 480 

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ConnectionManager:
    def __init__(self):
        # Lista de administradores conectados al dashboard
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, data: dict):
        """Envía datos a todos los dashboards abiertos"""
        for connection in self.active_connections:
            try:
                await connection.send_json(data)
            except:
                pass # Manejar conexiones rotas

manager = ConnectionManager()


# --- MODELOS SQL (SINCRONIZADOS CON TU .SQL) ---
class Empresa(Base):
    __tablename__ = "empresas"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), unique=True)
    # Configuraciones por empresa
    usa_nfc = Column(Boolean, default=True)
    usa_huella = Column(Boolean, default=True)
    usa_facial = Column(Boolean, default=True)
    activo = Column(Boolean, default=True)

class Sucursal(Base): # SQLAlchemy Model
    __tablename__ = "sucursales"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100))
    empresa_id = Column(Integer, ForeignKey("empresas.id"))
    activo = Column(Boolean, default=True)

class Admin(Base):
    __tablename__ = "admins"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True)
    hashed_password = Column(String(200))
    rol = Column(String(20), default="admin")
    rol = Column(String(20), default="admin")
    empresa_id = Column(Integer, ForeignKey("empresas.id"), default=1)
    sucursal_id = Column(Integer, ForeignKey("sucursales.id"), nullable=True)

class Usuario(Base):
    __tablename__ = "usuarios"
    id = Column(Integer, primary_key=True, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id")) # <--- Vínculo esencial
    nombre_completo = Column(String(100))
    email = Column(String(100), nullable=True)
    dui = Column(String(20), nullable=True)
    cargo = Column(String(50), nullable=True)
    sucursal_id = Column(Integer, ForeignKey("sucursales.id"), nullable=True) # Nuevo campo
    entrada = Column(String(10), default="08:00")
    salida = Column(String(10), default="17:00")
    inicio_almuerzo = Column(String(10), default="12:00")
    fin_almuerzo = Column(String(10), default="13:00")
    activo = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    nfc_uid = Column(String(255), unique=True, index=True)
    fingerprint_id = Column(String(255), unique=True, index=True, nullable=True) 
    face_id = Column(String(255), unique=True, index=True, nullable=True)
    

class Dispositivo(Base):
    __tablename__ = "dispositivos"
    id = Column(Integer, primary_key=True, index=True)
    mac_address = Column(String(50), unique=True, index=True)
    nombre_ubicacion = Column(String(100))
    last_seen = Column(DateTime, nullable=True)
    estado = Column(Boolean, default=True)
    comando_pendiente = Column(Boolean, default=False)
    empresa_id = Column(Integer, default=1)
    sucursal_id = Column(Integer, ForeignKey("sucursales.id"), nullable=True) # Nuevo campo

class Log(Base):
    __tablename__ = "asistencia_logs"
    id = Column(Integer, primary_key=True, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id"))
    dispositivo_id = Column(Integer, ForeignKey("dispositivos.id"))
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    fecha_hora = Column(DateTime, default=datetime.now)
    metodo = Column(String(20))
    evento = Column(String(20))

class Auditoria(Base):
    __tablename__ = "auditoria"
    id = Column(Integer, primary_key=True, index=True)
    admin_id = Column(Integer, ForeignKey("admins.id"))
    accion = Column(String(255))
    # detalles = Column(String(500), nullable=True) # <--- ELIMINA O COMENTA ESTA LÍNEA
    fecha_hora = Column(DateTime, default=datetime.now)
    ip_address = Column(String(45), nullable=True) # <--- AGREGA ESTA QUE SÍ ESTÁ EN SQL

# --- SCHEMAS PYDANTIC (SINCRONIZADOS CON EL FRONTEND) ---

class AdminCreate(BaseModel):
    username: str
    password: str
    rol: str
    empresa_id: Optional[int] = 1
    sucursal_id: Optional[int] = None
    empresa_id: Optional[int] = 1

class UsuarioCreate(BaseModel):
    nombre_completo: str
    nfc_uid: str
    fingerprint_id: Optional[int] = None # NUEVO
    face_id: Optional[str] = None
    email: Optional[str] = None
    dui: Optional[str] = None
    cargo: Optional[str] = None
    entrada: Optional[str] = "08:00"
    salida: Optional[str] = "17:00"
    inicio_almuerzo: Optional[str] = "12:00"
    inicio_almuerzo: Optional[str] = "12:00"
    inicio_almuerzo: Optional[str] = "12:00"
    fin_almuerzo: Optional[str] = "13:00"
    sucursal_id: Optional[int] = None 
    empresa_id: Optional[int] = None # Permitir asignar empresa (solo útil para SuperAdmin o lógica interna)
    sucursal_id: Optional[int] = None # Nuevo campo

class UsuarioUpdate(BaseModel):
    nombre_completo: Optional[str] = None
    nfc_uid: Optional[str] = None
    email: Optional[str] = None
    dui: Optional[str] = None
    cargo: Optional[str] = None
    entrada: Optional[str] = None
    salida: Optional[str] = None
    inicio_almuerzo: Optional[str] = None
    fin_almuerzo: Optional[str] = None
    sucursal_id: Optional[int] = None # Nuevo campo

class CheckInRequest(BaseModel):
    mac_address: str
    metodo: str
    data: str

class LogResponse(BaseModel):
    id: int
    nombre_usuario: str
    fecha: str
    hora: str
    metodo: str
    evento: str

# --- FUNCIONES DE APOYO (SEGURIDAD) ---

# Función de utilidad para hashear si el dispositivo no lo hace
def generar_hash_biometrico(data_cruda: str):
    return hashlib.sha256(data_cruda.encode()).hexdigest()

# Define tu zona horaria local
LOCAL_TZ = pytz.timezone("America/El_Salvador")

def get_now():
    """Retorna la fecha y hora actual en la zona horaria local."""
    return datetime.now(LOCAL_TZ)

def get_db():
    db = SessionLocal()
    try: yield db
    finally: db.close()

def get_password_hash(password): return pwd_context.hash(password)
def verify_password(plain, hashed): return pwd_context.verify(plain, hashed)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        print(f"DEBUG: Authenticating user '{username}'")
        user = db.query(Admin).filter(Admin.username == username).first()
        if not user: 
            print("DEBUG: User not found in DB")
            raise HTTPException(status_code=401)
        print(f"DEBUG: Found user '{user.username}' with role '{user.rol}'")
        return user
    except Exception as e: 
        print(f"DEBUG: Auth error: {e}")
        raise HTTPException(status_code=401)

def registrar_auditoria(db: Session, admin_id: int, accion: str, detalles: str = None):
    new_audit = Auditoria(admin_id=admin_id, accion=accion, detalles=detalles)
    db.add(new_audit)
    db.commit()

# --- main.py ---

# Esquema para actualización
class EmpresaUpdate(BaseModel):
    nombre: Optional[str] = None
    usa_nfc: Optional[bool] = None
    usa_huella: Optional[bool] = None
    usa_facial: Optional[bool] = None
    activo: Optional[bool] = None

# Esquema para crear empresas
# Esquema para crear sucursales
class SucursalCreate(BaseModel):
    nombre: str
    empresa_id: int

class EmpresaCreate(BaseModel):
    nombre: str
    usa_nfc: bool = True
    usa_huella: bool = True
    usa_facial: bool = True

@app.post("/api/v1/superadmin/empresas")
def crear_empresa(
    empresa: EmpresaCreate, 
    db: Session = Depends(get_db), 
    current_admin: Admin = Depends(get_current_user)
):
    # Verificación de seguridad
    if current_admin.rol != "superadmin":
        raise HTTPException(status_code=403, detail="No tienes permisos de Super Admin")
    
    nueva_empresa = Empresa(
        nombre=empresa.nombre,
        usa_nfc=empresa.usa_nfc,
        usa_huella=empresa.usa_huella,
        usa_facial=empresa.usa_facial
    )
    db.add(nueva_empresa)
    db.commit()
    db.refresh(nueva_empresa)
    return nueva_empresa

@app.get("/api/v1/superadmin/empresas")
def listar_todas_las_empresas(
    db: Session = Depends(get_db), 
    current_admin: Admin = Depends(get_current_user)
):
    if current_admin.rol != "superadmin":
        raise HTTPException(status_code=403, detail="Acceso denegado")
    return db.query(Empresa).all()

@app.put("/api/v1/superadmin/empresas/{empresa_id}")
def actualizar_empresa(
    empresa_id: int, 
    obj: EmpresaUpdate, 
    db: Session = Depends(get_db), 
    current_admin: Admin = Depends(get_current_user)
):
    if current_admin.rol != "superadmin":
        raise HTTPException(status_code=403)
    
    db_emp = db.query(Empresa).filter(Empresa.id == empresa_id).first()
    if not db_emp: raise HTTPException(status_code=404)
    
    # Actualizar campos dinámicamente
    for key, value in obj.dict(exclude_unset=True).items():
        setattr(db_emp, key, value)
    
    db.commit()
    return {"message": "Empresa actualizada"}

@app.delete("/api/v1/superadmin/empresas/{empresa_id}")
def eliminar_empresa(empresa_id: int, db: Session = Depends(get_db), current_admin: Admin = Depends(get_current_user)):
    if current_admin.rol != "superadmin": raise HTTPException(status_code=403)
    
    db.query(Empresa).filter(Empresa.id == empresa_id).delete()
    db.commit()
    return {"message": "Empresa eliminada permanentemente"}

@app.delete("/api/v1/superadmin/empresas/{empresa_id}")
def eliminar_empresa(empresa_id: int, db: Session = Depends(get_db), current_admin: Admin = Depends(get_current_user)):
    if current_admin.rol != "superadmin": raise HTTPException(status_code=403)
    
    db.query(Empresa).filter(Empresa.id == empresa_id).delete()
    db.commit()
    return {"message": "Empresa eliminada permanentemente"}

# --- ENDPOINTS SUCURSALES ---
@app.post("/api/v1/sucursales")
def crear_sucursal(sucursal: SucursalCreate, db: Session = Depends(get_db), current: Admin = Depends(get_current_user)):
    # Validar permisos (solo admin o superadmin de la misma empresa)
    if current.rol != "superadmin" and current.empresa_id != sucursal.empresa_id:
        raise HTTPException(status_code=403)
        
    nueva = Sucursal(nombre=sucursal.nombre, empresa_id=sucursal.empresa_id)
    db.add(nueva)
    db.commit()
    db.refresh(nueva)
    return nueva

@app.get("/api/v1/empresas/{empresa_id}/sucursales")
def listar_sucursales(empresa_id: int, db: Session = Depends(get_db), current: Admin = Depends(get_current_user)):
    # Validar seguridad
    if current.rol != "superadmin" and current.empresa_id != empresa_id:
        raise HTTPException(status_code=403)
        
    return db.query(Sucursal).filter(Sucursal.empresa_id == empresa_id, Sucursal.activo == True).all()

# --- ENDPOINTS ---

@app.get("/api/v1/public/config")
def get_public_config(db: Session = Depends(get_db)):
    # Obtenemos la empresa principal (ID 1) para mostrar su nombre en el login/dashboard
    empresa = db.query(Empresa).order_by(Empresa.id).first()
    if not empresa:
        return {"nombre_sistema": "Biometric IoT"}
    return {"nombre_sistema": empresa.nombre}

@app.get("/api/v1/dashboard/config-empresa-actual")
def get_config_actual(db: Session = Depends(get_db), current: Admin = Depends(get_current_user)):
    # Buscamos la configuración de la empresa del admin actual
    target_id = current.empresa_id if current.empresa_id else 1
    empresa = db.query(Empresa).filter(Empresa.id == target_id).first()
    if not empresa:
        return {"usa_nfc": True, "usa_huella": False, "usa_facial": False}
    return {
        "id": empresa.id,
        "usa_nfc": empresa.usa_nfc,
        "usa_huella": empresa.usa_huella,
        "usa_facial": empresa.usa_facial
    }
# 3. Nuevo Endpoint para que el Admin configure la Empresa
@app.put("/api/v1/dashboard/config-empresa")
def update_empresa_config(usa_nfc: bool, usa_huella: bool, usa_facial: bool, 
                         db: Session = Depends(get_db), 
                         current_admin: Admin = Depends(get_current_user)):
    # En un SaaS real, usaríamos el empresa_id del admin logueado
    empresa = db.query(Empresa).filter(Empresa.id == 1).first() 
    empresa.usa_nfc = usa_nfc
    empresa.usa_huella = usa_huella
    empresa.usa_facial = usa_facial
    db.commit()
    registrar_auditoria(db, current_admin.id, "CAMBIO CONFIGURACIÓN", f"NFC:{usa_nfc}, Huella:{usa_huella}, Face:{usa_facial}")
    return {"mensaje": "Configuración actualizada"}

@app.post("/api/v1/auth/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(Admin).filter(Admin.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")
    token = create_access_token(data={"sub": user.username})
    return {"access_token": token, "token_type": "bearer", "rol": user.rol}

# 2. Mejora el endpoint de estadísticas con manejo de errores real
@app.get("/api/v1/dashboard/stats")
def get_stats(db: Session = Depends(get_db)):
    try:
        total_u = db.query(Usuario).filter(Usuario.activo == True).count()
        
        # Uso de zona horaria local para "hoy"
        hoy = get_now().date()
        total_h = db.query(Log).filter(text("DATE(fecha_hora) = :t")).params(t=hoy).count()
        
        devs = db.query(Dispositivo).all()
        ahora = get_now()
        
        # Un dispositivo está online si reportó en los últimos 2 minutos
        online = sum(1 for d in devs if d.last_seen and (ahora - d.last_seen.replace(tzinfo=LOCAL_TZ)).total_seconds() < 120)

        # NUEVA LÓGICA: Personal en Almuerzo
        # Buscamos el último evento de cada usuario hoy
        subquery = db.query(
            Log.usuario_id,
            Log.evento
        ).filter(text("DATE(fecha_hora) = :hoy")).params(hoy=hoy).order_by(Log.id.desc()).all()
        
        # Filtramos usuarios cuyo último evento fue "SALIDA ALMUERZO"
        usuarios_vistos = set()
        en_almuerzo_count = 0
        for user_id, evento in subquery:
            if user_id not in usuarios_vistos:
                if evento == "SALIDA ALMUERZO":
                    en_almuerzo_count += 1
                usuarios_vistos.add(user_id)
        
        return {
            "usuarios_activos": total_u, 
            "asistencias_hoy": total_h, 
            "dispositivos_online": online,
            "en_almuerzo": en_almuerzo_count
        }
    except Exception as e:
        # Importante: Lanzar un 500 para que el Frontend sepa que algo falló
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")


# --- main.py ---

@app.get("/api/v1/usuarios") # Quitamos /dashboard/ y dejamos el nombre limpio
def list_usuarios(
    db: Session = Depends(get_db), 
    current_admin: Admin = Depends(get_current_user)
):
    query = db.query(Usuario)
    
    # Aplicamos el filtro multi-sede para que no vean personal de otras empresas
    if current_admin.rol != "superadmin":
        query = query.filter(Usuario.empresa_id == current_admin.empresa_id)
    
    return query.all()

@app.post("/api/v1/dashboard/usuarios")
def create_user(u: UsuarioCreate, db: Session = Depends(get_db), current: Admin = Depends(get_current_user)):
    # Si no es Super Admin, forzamos que el usuario pertenezca a SU empresa
    if current.rol != "superadmin":
        if current.empresa_id is None: # Seguridad extra
             raise HTTPException(status_code=403, detail="Tu usuario no tiene empresa asignada")
        # Forzar ID de empresa del admin actual
        new_user_data = u.dict()
        new_user_data['empresa_id'] = current.empresa_id
        
        # Validar que si envía sucursal, pertenezca a su empresa
        if u.sucursal_id:
            suc = db.query(Sucursal).filter(Sucursal.id == u.sucursal_id, Sucursal.empresa_id == current.empresa_id).first()
            if not suc:
                 raise HTTPException(status_code=400, detail="La sucursal no pertenece a tu empresa")
        
        new_user = Usuario(**new_user_data)
        
    else:
        # Si ES SuperAdmin, debe venir empresa_id en el payload o usar default (1)
        # Ojo: UsuarioCreate original no tiene empresa_id, hay que revisar el modelo o asumirlo
        # En la lógica actual UsuarioCreate NO recibe empresa_id, se asumía implícito o faltaba.
        # Vamos a asumir que si es SuperAdmin y no hay contexto, podría fallar o asigna a la 1.
        # Lo ideal es que el Front envíe empresa_id si es SuperAdmin creando user para X empresa.
        # POR AHORA: Mantenemos lógica simple, asigna a la empresa del superadmin (1) o lógica existente.
        # Corrección: El modelo SQLAlchemy Usuario tiene empresa_id. Pydantic UsuarioCreate NO lo tiene explícito en main.py (lo vi antes).
        # Vamos a agregarlo a UsuarioCreate si hace falta, o usar current.empresa_id.
        
        # Para evitar romper, si es SuperAdmin, usa su empresa_id por defecto (1)
        new_user_data = u.dict()
        if 'empresa_id' not in new_user_data or new_user_data['empresa_id'] is None:
             new_user_data['empresa_id'] = current.empresa_id
        
        new_user = Usuario(**new_user_data)

    db.add(new_user)
    db.commit()
    registrar_auditoria(db, current.id, "CREAR USUARIO", f"Empleado: {u.nombre_completo}")
    return {"mensaje": "OK"}

@app.put("/api/v1/dashboard/usuarios/{user_id}")
def update_user(user_id: int, u: UsuarioUpdate, db: Session = Depends(get_db), current: Admin = Depends(get_current_user)):
    db_user = db.query(Usuario).filter(Usuario.id == user_id).first()
    if not db_user: raise HTTPException(status_code=404)
    for var, val in u.dict(exclude_unset=True).items():
        setattr(db_user, var, val)
    db.commit()
    registrar_auditoria(db, current.id, "EDITAR USUARIO", f"ID: {user_id}")
    return {"mensaje": "Actualizado"}

@app.delete("/api/v1/dashboard/usuarios/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), current: Admin = Depends(get_current_user)):
    u = db.query(Usuario).filter(Usuario.id == user_id).first()
    if u:
        nombre = u.nombre_completo
        db.delete(u)
        db.commit()
        registrar_auditoria(db, current.id, "ELIMINAR USUARIO", f"Eliminó a {nombre}")
    return {"mensaje": "Eliminado"}

@app.get("/api/v1/dashboard/logs", response_model=List[LogResponse])
def get_logs(limit: int = 15, db: Session = Depends(get_db)):
    logs = db.query(Log).order_by(desc(Log.fecha_hora)).limit(limit).all()
    res = []
    for l in logs:
        u = db.query(Usuario).filter(Usuario.id == l.usuario_id).first()
        res.append({
            "id": l.id, "nombre_usuario": u.nombre_completo if u else "Desconocido",
            "fecha": l.fecha_hora.strftime("%Y-%m-%d"), "hora": l.fecha_hora.strftime("%H:%M:%S"),
            "metodo": l.metodo, "evento": l.evento
        })
    return res

@app.get("/api/v1/dashboard/weekly-stats")
def get_weekly(db: Session = Depends(get_db)):
    start = datetime.now().date() - timedelta(days=6)
    logs = db.query(Log).filter(Log.fecha_hora >= start, Log.evento == "EXITO").all()
    stats_map = { (start + timedelta(days=i)).strftime("%Y-%m-%d"): 0 for i in range(7) }
    for l in logs:
        d = l.fecha_hora.strftime("%Y-%m-%d")
        if d in stats_map: stats_map[d] += 1
    return [{"date": k, "name": datetime.strptime(k, "%Y-%m-%d").strftime("%a"), "count": v} for k, v in stats_map.items()]

@app.get("/api/v1/dashboard/dispositivos")
def list_dispositivos(db: Session = Depends(get_db)):
    devs = db.query(Dispositivo).all()
    now = datetime.now()
    return [{
        "id": d.id, "ubicacion": d.nombre_ubicacion, "mac": d.mac_address,
        "online": (now - d.last_seen).total_seconds() < 120 if d.last_seen else False,
        "last_seen": d.last_seen.strftime("%d/%m %H:%M") if d.last_seen else "Nunca"
    } for d in devs]

@app.get("/api/v1/dashboard/auditoria")
def get_auditoria(db: Session = Depends(get_db), current_admin: Admin = Depends(get_current_user)):
    try:
        results = db.query(Auditoria, Admin).filter(Auditoria.admin_id == Admin.id).order_by(desc(Auditoria.fecha_hora)).limit(50).all()
        return [{
            "id": aud.id,
            "admin": adm.username,
            "accion": aud.accion,
            "detalles": "Acción registrada", # Texto estático o usa ip_address
            "fecha": aud.fecha_hora.strftime("%Y-%m-%d %H:%M:%S")
        } for aud, adm in results]
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500)

@app.get("/api/v1/dashboard/staff-list")
def list_staff(db: Session = Depends(get_db), current: Admin = Depends(get_current_user)):
    # Si es superadmin, ve todo
    if current.rol == "superadmin":
        return db.query(Admin).all()
    
    # Si es admin de empresa, ve solo los suyos y NO ve a superadmin
    if current.rol == "admin":
        return db.query(Admin).filter(
            Admin.empresa_id == current.empresa_id,
            Admin.rol != "superadmin"
        ).all()

    # Si es supervisor, quizás solo se ve a sí mismo o nada
    return [current]

@app.post("/api/v1/dashboard/staff")
def create_staff(data: AdminCreate, db: Session = Depends(get_db), current: Admin = Depends(get_current_user)):
    # Este endpoint es para que los ADMINS DE EMPRESA creen supervisores/admins
    if current.rol != "admin" and current.rol != "superadmin":
         raise HTTPException(status_code=403, detail="No tienes permisos")

    # Si NO es superadmin, forzar empresa_id
    empresa_target = data.empresa_id
    if current.rol != "superadmin":
        empresa_target = current.empresa_id
        # Validar que no cree superadmin
        if data.rol == "superadmin":
            raise HTTPException(status_code=403, detail="No puedes crear Super Admins")

    new_staff = Admin(
        username=data.username, 
        hashed_password=get_password_hash(data.password), 
        rol=data.rol, # admin o supervisor
        empresa_id=empresa_target,
        sucursal_id=data.sucursal_id
    )
    db.add(new_staff)
    db.commit()
    return {"mensaje": "Miembro de staff creado"}

@app.post("/api/v1/superadmin/usuarios-admin") # Renamed from /dashboard/staff to match frontend
def create_admin_user(data: AdminCreate, db: Session = Depends(get_db), current: Admin = Depends(get_current_user)):
    if current.rol != "superadmin":
        raise HTTPException(status_code=403, detail="Solo SuperAdmin puede crear administradores")
        
    # Verificar si la empresa existe
    if data.empresa_id:
        emp = db.query(Empresa).filter(Empresa.id == data.empresa_id).first()
        if not emp: raise HTTPException(status_code=404, detail="Empresa no encontrada")

    new_staff = Admin(
        username=data.username, 
        hashed_password=get_password_hash(data.password), 
        rol=data.rol,
        empresa_id=data.empresa_id,
        sucursal_id=data.sucursal_id
    )
    db.add(new_staff)
    db.commit()
    db.add(new_staff)
    db.commit()
    return {"mensaje": "Administrador creado exitosamente"}

@app.get("/api/v1/empresas/{empresa_id}/staff")
def list_staff_by_company(empresa_id: int, db: Session = Depends(get_db), current: Admin = Depends(get_current_user)):
    if current.rol != "superadmin":
        raise HTTPException(status_code=403, detail="Acceso denegado")
    
    admins = db.query(Admin).filter(Admin.empresa_id == empresa_id).all()
    # Enriquecer con nombre de sucursal
    result = []
    for a in admins:
        sucursal_nombre = "-- General --"
        if a.sucursal_id:
            suc = db.query(Sucursal).filter(Sucursal.id == a.sucursal_id).first()
            if suc: sucursal_nombre = suc.nombre
            
        result.append({
            "id": a.id,
            "username": a.username,
            "rol": a.rol,
            "sucursal": sucursal_nombre
        })
    return result

# --- ENDPOINTS IOT ---

@app.post("/api/v1/validar-acceso")
async def validar_iot(request: CheckInRequest, db: Session = Depends(get_db)):
    # 1. Buscar dispositivo
    dev = db.query(Dispositivo).filter(Dispositivo.mac_address == request.mac_address).first()
    if not dev: 
        raise HTTPException(status_code=401, detail="Dispositivo no autorizado")
    
    # 2. Verificar configuración de empresa
    empresa = db.query(Empresa).filter(Empresa.id == dev.empresa_id).first()
    
    metodo_normalizado = request.metodo.upper()
    # Validaciones de métodos (NFC, HUERTA, FACIAL) según configuración de empresa
    if metodo_normalizado == "NFC" and not empresa.usa_nfc:
        return {"acceso": False, "error": "Metodo NFC desactivado"}
    # ... (repetir para otros métodos)
    
    # 3. Buscar usuario de la MISMA empresa
    user = db.query(Usuario).filter(
        Usuario.empresa_id == dev.empresa_id, # <--- SEGURIDAD MULTI-SEDE
        Usuario.activo == True
    )

    if metodo_normalizado == "NFC":
        user = user.filter(Usuario.nfc_uid == request.data).first()
    elif metodo_normalizado in ["HUERTA", "HUELGA", "FINGER"]:
        user = user.filter(Usuario.fingerprint_id == request.data).first()
    elif metodo_normalizado == "FACIAL":
        user = user.filter(Usuario.face_id == request.data).first()

    if not user:
        return {"acceso": False, "status": "FALLO"}

    # 4. Registrar Log y actualizar dispositivo
    nuevo_log = Log(
        dispositivo_id=dev.id, 
        usuario_id=user.id, 
        empresa_id=dev.empresa_id, # Guardamos el ID de empresa en el log
        metodo=request.metodo, 
        evento="EXITO",
        fecha_hora=datetime.now()
    )
    dev.last_seen = datetime.now()
    db.add(nuevo_log)
    db.commit()
    db.refresh(nuevo_log)

    # 5. Notificar WebSocket
    await manager.broadcast({
        "id": nuevo_log.id,
        "nombre_usuario": user.nombre_completo,
        "fecha": nuevo_log.fecha_hora.strftime("%Y-%m-%d"),
        "hora": nuevo_log.fecha_hora.strftime("%H:%M:%S"),
        "metodo": nuevo_log.metodo,
        "evento": nuevo_log.evento,
        "empresa_id": dev.empresa_id
    })
    
    return {"acceso": True, "nombre": user.nombre_completo, "status": "EXITO"}

@app.get("/api/v1/dashboard/reportes")
def get_reportes(
    fecha_inicio: str, 
    fecha_fin: str, 
    usuario_id: Optional[int] = None, 
    db: Session = Depends(get_db)
):
    # Convertimos strings a objetos date de Python para asegurar precisión
    inicio = datetime.strptime(fecha_inicio, "%Y-%m-%d").date()
    fin = datetime.strptime(fecha_fin, "%Y-%m-%d").date()
    
    query = db.query(Log, Usuario).join(Usuario, Log.usuario_id == Usuario.id)
    
    # Filtro estricto usando func.date para ignorar la hora del Log
    query = query.filter(text("DATE(asistencia_logs.fecha_hora) BETWEEN :ini AND :fin")).params(ini=inicio, fin=fin)
    
    if usuario_id:
        query = query.filter(Log.usuario_id == usuario_id)
        
    results = query.order_by(desc(Log.fecha_hora)).all()
    
    return [{
        "id": log.id,
        "nombre": user.nombre_completo,
        "fecha": log.fecha_hora.strftime("%Y-%m-%d"),
        "hora": log.fecha_hora.strftime("%H:%M:%S"),
        "evento": log.evento,
        "metodo": log.metodo
    } for log, user in results]

# --- Actualización en main.py ---

@app.get("/api/v1/dashboard/reporte-detallado")
def reporte_detallado(fecha_inicio: str, fecha_fin: str, db: Session = Depends(get_db)):
    # Consulta uniendo Logs, Usuarios y Dispositivos
    results = db.query(Log, Usuario, Dispositivo)\
        .join(Usuario, Log.usuario_id == Usuario.id)\
        .join(Dispositivo, Log.dispositivo_id == Dispositivo.id)\
        .filter(text("DATE(asistencia_logs.fecha_hora) BETWEEN :ini AND :fin"))\
        .params(ini=fecha_inicio, fin=fecha_fin).all()
    
    reporte = []
    for log, user, device in results:
        hora_log = log.fecha_hora.time()
        evento_upper = log.evento.upper()
        
        # --- Lógica de Tardanza Entrada ---
        minutos_tarde = 0
        if "ENTRADA" in evento_upper and "ALMUERZO" not in evento_upper:
            try:
                hora_esperada = datetime.strptime(user.entrada, "%H:%M").time()
                if hora_log > hora_esperada:
                    delta = datetime.combine(datetime.today(), hora_log) - datetime.combine(datetime.today(), hora_esperada)
                    minutos_tarde = int(delta.total_seconds() / 60)
            except: pass

        # --- Lógica de Almuerzo (NUEVA) ---
        estado_almuerzo = "N/A"
        if "RETORNO ALMUERZO" in evento_upper:
            try:
                hora_fin_almuerzo = datetime.strptime(user.fin_almuerzo, "%H:%M").time()
                if hora_log > hora_fin_almuerzo:
                    delta_alm = datetime.combine(datetime.today(), hora_log) - datetime.combine(datetime.today(), hora_fin_almuerzo)
                    exceso = int(delta_alm.total_seconds() / 60)
                    estado_almuerzo = f"EXCESO ({exceso} min)"
                else:
                    estado_almuerzo = "A TIEMPO"
            except: 
                estado_almuerzo = "ERROR HORARIO"
        elif "SALIDA ALMUERZO" in evento_upper:
            estado_almuerzo = "EN CURSO"

        # Construcción del objeto (Tu Front leerá estas llaves automáticamente)
        reporte.append({
            "Usuario": user.nombre_completo,
            "Evento": log.evento,
            "Fecha": log.fecha_hora.strftime("%Y-%m-%d"),
            "Hora": log.fecha_hora.strftime("%H:%M:%S"),
            "Estado_Entrada": "A TIEMPO" if minutos_tarde == 0 else f"TARDE ({minutos_tarde} min)",
            "Estado_Almuerzo": estado_almuerzo,
            "Ubicacion": device.nombre_ubicacion,
            "Metodo": log.metodo,
            "Cargo": user.cargo,
            "DUI": user.dui
        })
    
    return reporte

@app.websocket("/ws/dashboard")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text() # Mantiene la conexión abierta
    except WebSocketDisconnect:
        manager.disconnect(websocket)