import { useState, useEffect } from 'react';
import axios from './config/axios';
import { History as HistoryIcon, LayoutDashboard, Users, Radio, LogOut, RefreshCw, UserPlus, FileSpreadsheet, ChevronRight, ShieldCheck, Coffee } from 'lucide-react';
import UserModal from './components/UserModal';
import UsersTable from './components/UsersTable';
import DevicesView from './components/DevicesView';
import ReportsView from './components/ReportsView';
import LoginView from './components/LoginView';
import WeeklyChart from './components/WeeklyChart';
import { brandConfig } from './config';
import StaffView from './components/StaffView';
import AuditoriaView from './components/AuditoriaView';
import SuperAdminView from './components/SuperAdminView';

function App() {
  const [stats, setStats] = useState({ usuarios_activos: 0, asistencias_hoy: 0, dispositivos_online: 0 });
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState('supervisor');
  const [empresaData, setEmpresaData] = useState({
    usa_nfc: true,
    usa_huella: false,
    usa_facial: false
  });
  const [usersRefreshKey, setUsersRefreshKey] = useState(0);
  const [dynamicAppName, setDynamicAppName] = useState(brandConfig.appName); // Estado para el nombre dinámico
  const API_URL = "/dashboard";

  // Carga de configuración pública (Nombre de la empresa)
  useEffect(() => {
    const fetchPublicConfig = async () => {
      try {
        const res = await axios.get('/public/config');
        if (res.data.nombre_sistema) {
          setDynamicAppName(res.data.nombre_sistema);
        }
      } catch (error) {
        console.error("Error cargando nombre del sistema:", error);
      }
    };
    fetchPublicConfig();

    const fetchConfig = async () => {
      try {
        const token = localStorage.getItem('biopass_token');
        if (!token) return; // Solo si hay token

        const res = await axios.get('/dashboard/config-empresa-actual');
        setEmpresaData(res.data);
      } catch (error) {
        console.error("Error cargando configuración:", error);
      }
    };
    if (isAuthenticated) fetchConfig();
  }, [isAuthenticated]);

  // Carga inicial de sesión
  useEffect(() => {
    const token = localStorage.getItem('biopass_token');
    const role = localStorage.getItem('biopass_role');
    console.log("App initialization - Loaded Token:", !!token, "Role:", role);
    if (token) {
      setIsAuthenticated(true);
      if (role) setUserRole(role);
    }
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const statsRes = await axios.get(`${API_URL}/stats`);
      const logsRes = await axios.get(`${API_URL}/logs`);
      setStats(statsRes.data);
      setLogs(logsRes.data);
    } catch (error) { console.error("Error cargando dashboard:", error); }
    finally { setLoading(false); }
  };

  // --- src/App.jsx ---

  // ... dentro de la función App() ...

  useEffect(() => {
    if (isAuthenticated) {
      // 1. Carga inicial de datos
      fetchData();

      // 2. Conexión WebSocket [NUEVO]
      const ws = new WebSocket("ws://127.0.0.1:8000/ws/dashboard");

      ws.onmessage = (event) => {
        const nuevoLog = JSON.parse(event.data);

        // Actualizamos la lista de logs instantáneamente
        // Agregamos el nuevo al principio y limitamos a los últimos 15
        setLogs(prevLogs => {
          const actualizados = [nuevoLog, ...prevLogs];
          return actualizados.slice(0, 15);
        });

        // Opcional: Actualizar estadísticas de "Hoy" al recibir un log
        setStats(prev => ({
          ...prev,
          asistencias_hoy: prev.asistencias_hoy + 1
        }));
      };

      ws.onerror = (err) => console.error("Error WebSocket:", err);

      // Limpieza al desmontar o cerrar sesión
      return () => ws.close();
    }
  }, [isAuthenticated]);

  // ELIMINADO: El useEffect que contenía el setInterval(fetchData, 10000

  const handleLogout = () => {
    localStorage.clear();
    setIsAuthenticated(false);
    setUserRole('supervisor');
  };

  const handleNewUser = () => { setUserToEdit(null); setIsModalOpen(true); };
  const handleEditUser = (usuario) => { setUserToEdit(usuario); setIsModalOpen(true); };

  const handleUserAdded = () => {
    fetchData();
    setUsersRefreshKey(prev => prev + 1);
  };

  if (!isAuthenticated) return <LoginView onLoginSuccess={() => {
    // Al tener éxito, forzamos la lectura del nuevo rol
    const role = localStorage.getItem('biopass_role');
    setUserRole(role);
    setIsAuthenticated(true);
  }} />;

  const SidebarItem = ({ id, icon: Icon, label }) => {
    const active = currentView === id;
    return (
      <button
        onClick={() => setCurrentView(id)}
        className={`relative w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 group font-medium
        ${active
            ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/30 translate-x-1'
            : 'text-slate-400 hover:bg-slate-800 hover:text-white hover:translate-x-1'}`}
      >
        <Icon size={20} className={active ? "text-white" : "text-slate-400 group-hover:text-white transition-colors"} />
        <span>{label}</span>
        {active && <ChevronRight size={16} className="absolute right-3 opacity-50" />}
      </button>
    );
  };

  const DashboardView = () => (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between h-32 relative overflow-hidden group hover:shadow-md transition">
          <div className="absolute right-0 top-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider z-10">Asistencias Hoy</p>
          <p className="text-4xl font-extrabold text-slate-800 z-10">{stats.asistencias_hoy}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between h-32 relative overflow-hidden group hover:shadow-md transition">
          <div className="absolute right-0 top-0 w-24 h-24 bg-purple-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider z-10">Personal Activo</p>
          <p className="text-4xl font-extrabold text-slate-800 z-10">{stats.usuarios_activos}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between h-32 relative overflow-hidden group hover:shadow-md transition">
          <div className="absolute right-0 top-0 w-24 h-24 bg-green-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider z-10">Equipos Online</p>
          <p className="text-4xl font-extrabold text-slate-800 z-10">{stats.dispositivos_online}</p>
        </div>
      </div>
      <div className="bg-white p-6 rounded-3xl border shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-orange-100 rounded-2xl text-orange-600">
            <Coffee size={24} /> {/* Importa Coffee de lucide-react */}
          </div>
          <div>
            <p className="text-sm font-bold text-slate-400 uppercase">En Almuerzo</p>
            <h4 className="text-2xl font-black text-slate-800">{stats.en_almuerzo || 0}</h4>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="font-bold text-slate-800 mb-4">Actividad Semanal</h3>
        <WeeklyChart />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-white">
          <h3 className="font-bold text-lg text-slate-800">Últimos Accesos</h3>
          <button onClick={fetchData} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition">
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold tracking-widest">
              <tr>
                <th className="px-6 py-4">Hora</th>
                <th className="px-6 py-4">Empleado</th>
                <th className="px-6 py-4">Método</th>
                <th className="px-6 py-4">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {logs.length === 0 ? (
                <tr><td colSpan="4" className="px-6 py-12 text-center text-slate-400 italic">No hay registros recientes...</td></tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition border-transparent border-l-4 hover:border-l-blue-500">
                    <td className="px-6 py-4 text-sm font-mono text-slate-600">{log.hora}</td>
                    <td className="px-6 py-4 font-semibold text-slate-700">{log.nombre_usuario}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${log.metodo === 'NFC' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-purple-50 text-purple-600 border-purple-100'}`}>{log.metodo}</span>
                    </td>
                    <td className="px-6 py-4">
                      {log.evento === 'EXITO' ? (
                        <span className="flex items-center gap-1.5 text-xs font-bold text-green-600">
                          <ShieldCheck size={14} /> Correcto
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-xs font-bold text-amber-500">
                          <div className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></div>
                          Revisar
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen w-full bg-[#f8fafc] font-sans text-slate-600 selection:bg-blue-100">
      <aside className="w-72 bg-[#0f172a] text-white flex flex-col shrink-0 shadow-2xl z-20">
        <div className="p-8 pb-4">
          <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-200 tracking-tight">
            {dynamicAppName}<span className="text-white font-light">{brandConfig.appSuffix}</span>
          </h1>
          <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-2">{brandConfig.version}</p>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto custom-scrollbar">
          <p className="px-4 text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-2 mt-2">Navegación</p>
          <SidebarItem id="dashboard" icon={LayoutDashboard} label="Panel General" />
          <SidebarItem id="users" icon={Users} label="Personal" />
          <SidebarItem id="devices" icon={Radio} label="Equipos IoT" />
          {userRole === 'admin' && (
            <>
              <p className="px-4 text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-2 mt-6">Administración</p>
              <SidebarItem id="staff" icon={ShieldCheck} label="Gestión Staff" />
              <SidebarItem id="auditoria" icon={HistoryIcon} label="Auditoría" />
            </>
          )}
          {userRole === 'superadmin' && (
            <button
              onClick={() => setCurrentView('superadmin')}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${currentView === 'superadmin' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
            >
              <ShieldCheck size={20} />
              <span className="font-bold text-sm">Empresas (Global)</span>
            </button>
          )}

          <p className="px-4 text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-2 mt-6">Reportes</p>
          <SidebarItem id="reports" icon={FileSpreadsheet} label="Exportar Datos" />

        </nav>

        <div className="p-4 m-4 bg-slate-800/50 rounded-2xl border border-slate-700/50">
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shadow-inner ${userRole === 'superadmin' ? 'bg-purple-600' : (userRole === 'admin' ? 'bg-blue-600' : 'bg-amber-600')}`}>
              {userRole === 'superadmin' ? 'SA' : (userRole === 'admin' ? 'AD' : 'SV')}
            </div>
            <div>
              <p className="text-sm font-bold text-white capitalize">{userRole === 'superadmin' ? 'Super Admin' : (userRole === 'admin' ? 'Administrador' : 'Supervisor')}</p>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-[10px] text-slate-400">Conectado</span>
              </div>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 text-xs font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 py-2.5 rounded-xl transition-colors">
            <LogOut size={14} /> Finalizar Sesión
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#f1f5f9] relative">
        <header className="h-20 px-8 flex justify-between items-center z-10 bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0">
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              {currentView === 'dashboard' && 'Vista General'}
              {currentView === 'users' && 'Gestión de Personal'}
              {currentView === 'devices' && 'Hardware Conectado'}
              {currentView === 'reports' && 'Descarga de Reportes'}

            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Bienvenido al sistema de control.</p>
          </div>

          {(userRole === 'admin' || userRole === 'superadmin') && (
            <button
              onClick={handleNewUser}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-blue-500/30 flex items-center gap-2 transition-transform hover:-translate-y-0.5 font-bold text-sm"
            >
              <UserPlus size={18} /> Nuevo Registro
            </button>
          )}
        </header>

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {currentView === 'dashboard' && <DashboardView />}
          {currentView === 'users' && <div className="max-w-7xl mx-auto"><UsersTable key={usersRefreshKey} onEdit={handleEditUser} role={userRole} /></div>}
          {currentView === 'devices' && <div className="max-w-7xl mx-auto"><DevicesView /></div>}
          {currentView === 'reports' && <div className="max-w-7xl mx-auto"><ReportsView /></div>}
          {currentView === 'staff' && <StaffView />}
          {currentView === 'auditoria' && <AuditoriaView />}
          {currentView === 'superadmin' && userRole === 'superadmin' && <div className="max-w-7xl mx-auto"><SuperAdminView /></div>}
        </div>

        <UserModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onUserAdded={handleUserAdded}
          userToEdit={userToEdit}
          empresaConfig={empresaData} // <--- Ahora sí existe la variable
        />
      </main>
    </div>
  );
}

export default App;