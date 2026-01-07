// --- src/components/SuperAdminView.jsx ---
import React, { useState, useEffect } from 'react';
import axios from '../config/axios';
import { Building2, Plus, ShieldCheck, Store, Users, X } from 'lucide-react';
import SucursalesManager from './SucursalesManager';



const SuperAdminView = () => {
    const [adminData, setAdminData] = useState({ username: '', password: '', empresa_id: '', sucursal_id: '' });
    const [empresas, setEmpresas] = useState([]);
    const [creationSucursales, setCreationSucursales] = useState([]); // Sucursales de la empresa seleccionada en el form
    const [nuevaEmpresa, setNuevaEmpresa] = useState({ nombre: '', usa_nfc: true, usa_huella: true, usa_facial: true });

    // Estado para gestionar sucursales (si no es null, muestra el modal)
    const [managingBranchEmpresa, setManagingBranchEmpresa] = useState(null);
    const [viewingStaffEmpresa, setViewingStaffEmpresa] = useState(null); // Empresa seleccionada para ver staff
    const [staffList, setStaffList] = useState([]); // Lista de staff de la empresa seleccionada

    const handleCrearAdmin = async (e) => {
        e.preventDefault();
        try {
            // Preparar payload, convirtiendo string vacío a null o integer
            const payload = {
                ...adminData,
                empresa_id: adminData.empresa_id ? parseInt(adminData.empresa_id) : null,
                sucursal_id: adminData.sucursal_id ? parseInt(adminData.sucursal_id) : null,
                rol: adminData.sucursal_id ? "supervisor" : "admin" // Auto-detectar rol: Si tiene sucursal es supervisor
            };

            await axios.post('/superadmin/usuarios-admin', payload);
            alert("Administrador/Supervisor creado. Ya puede iniciar sesión.");
            setAdminData({ username: '', password: '', empresa_id: '', sucursal_id: '' });
            setCreationSucursales([]);
        } catch (error) {
            console.error(error);
            alert("Error al crear administrador: " + (error.response?.data?.detail || error.message));
        }
    };

    const fetchEmpresas = async () => {
        const res = await axios.get('/superadmin/empresas');
        setEmpresas(res.data);
    };

    useEffect(() => { fetchEmpresas(); }, []);

    useEffect(() => { fetchEmpresas(); }, []);

    // Cargar sucursales cuando cambia la empresa seleccionada en el formulario
    useEffect(() => {
        if (adminData.empresa_id) {
            axios.get(`/empresas/${adminData.empresa_id}/sucursales`)
                .then(res => setCreationSucursales(res.data))
                .catch(err => console.error(err));
        } else {
            setCreationSucursales([]);
        }
    }, [adminData.empresa_id]);

    const handleCrear = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/superadmin/empresas', nuevaEmpresa);
            setNuevaEmpresa({ nombre: '', usa_nfc: true, usa_huella: true, usa_facial: true });
            fetchEmpresas();
            alert("Empresa creada con éxito");
        } catch (error) {
            alert("Error al crear empresa");
        }
    };

    const handleToggleStatus = async (empresa_id, currentStatus) => {
        try {
            const newStatus = !currentStatus;
            // Realizar petición al backend
            await axios.put(`/superadmin/empresas/${empresa_id}`, { activo: newStatus });

            // Actualizar estado local
            setEmpresas(prev => prev.map(emp =>
                emp.id === empresa_id ? { ...emp, activo: newStatus } : emp
            ));

        } catch (error) {
            console.error(error);
            alert("Error al cambiar estado: " + (error.response?.data?.detail || error.message));
        }
    };
    const handleViewStaff = async (empresa) => {
        try {
            const res = await axios.get(`/empresas/${empresa.id}/staff`);
            setStaffList(res.data);
            setViewingStaffEmpresa(empresa);
        } catch (error) {
            console.error(error);
            alert("Error al cargar staff");
        }
    };

    return (
        <div className="p-8">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <ShieldCheck className="text-purple-600" /> Panel Global de Empresas
            </h2>

            {/* Formulario de Creación */}
            <form onSubmit={handleCrear} className="bg-white p-6 rounded-2xl shadow-sm border mb-8 flex gap-4 items-end">
                <div className="flex-1">
                    <label className="block text-xs font-bold text-gray-400 mb-1">NOMBRE DE LA EMPRESA / CLÍNICA</label>
                    <input
                        className="w-full p-2 border rounded-xl bg-gray-50"
                        value={nuevaEmpresa.nombre}
                        onChange={e => setNuevaEmpresa({ ...nuevaEmpresa, nombre: e.target.value })}
                        placeholder="Ej. Hospital Central"
                        required
                    />
                </div>
                <button className="bg-purple-600 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2">
                    <Plus size={18} /> Crear Empresa
                </button>
            </form>

            {/* Listado de Empresas - TABLA */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-8">
                <div className="p-6 border-b border-slate-50">
                    <h3 className="font-bold text-lg text-slate-800">Empresas Registradas</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold tracking-widest">
                            <tr>
                                <th className="px-6 py-4">ID</th>
                                <th className="px-6 py-4">Empresa</th>
                                <th className="px-6 py-4">Módulos Activos</th>
                                <th className="px-6 py-4">Estado</th>
                                <th className="px-6 py-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {empresas.length === 0 ? (
                                <tr><td colSpan="5" className="px-6 py-12 text-center text-slate-400 italic">No hay empresas registradas...</td></tr>
                            ) : (
                                empresas.map((emp) => (
                                    <tr key={emp.id} className={`hover:bg-slate-50 transition border-l-4 ${emp.activo !== false ? 'border-transparent' : 'border-red-500 bg-red-50/10'}`}>
                                        <td className="px-6 py-4 text-sm font-mono text-slate-400">#{emp.id}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                                                    <Building2 size={18} />
                                                </div>
                                                <span className="font-bold text-slate-700">{emp.nombre}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-1.5 flex-wrap">
                                                {emp.usa_nfc && <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded border border-blue-100 font-bold">NFC</span>}
                                                {emp.usa_huella && <span className="text-[10px] bg-green-50 text-green-600 px-2 py-0.5 rounded border border-green-100 font-bold">HUELLA</span>}
                                                {emp.usa_facial && <span className="text-[10px] bg-orange-50 text-orange-600 px-2 py-0.5 rounded border border-orange-100 font-bold">FACIAL</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {emp.activo !== false ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-green-600 animate-pulse"></span> Activo
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span> Suspendido
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right flex gap-2 justify-end">
                                            <button
                                                onClick={() => setManagingBranchEmpresa(emp)}
                                                className="text-xs font-bold px-3 py-1.5 rounded-lg border border-purple-200 text-purple-600 hover:bg-purple-50 flex items-center gap-1"
                                                title="Gestionar Sucursales"
                                            >
                                                <Store size={14} /> Sucursales
                                            </button>

                                            <button
                                                onClick={() => handleViewStaff(emp)}
                                                className="text-xs font-bold px-3 py-1.5 rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 flex items-center gap-1"
                                                title="Ver Staff"
                                            >
                                                <Users size={14} /> Staff
                                            </button>

                                            <button
                                                onClick={() => handleToggleStatus(emp.id, emp.activo !== false)}
                                                className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${emp.activo !== false
                                                    ? 'border-red-200 text-red-600 hover:bg-red-50'
                                                    : 'border-green-200 text-green-600 hover:bg-green-50'
                                                    }`}
                                            >
                                                {emp.activo !== false ? 'Suspender' : 'Reactivar'}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border mb-8">
                <h3 className="text-lg font-bold mb-4 text-slate-700">Asignar Administrador/Supervisor</h3>
                <form onSubmit={handleCrearAdmin} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Empresa</label>
                        <select
                            className="w-full p-2 border rounded-xl bg-slate-50"
                            value={adminData.empresa_id}
                            onChange={e => setAdminData({ ...adminData, empresa_id: e.target.value })}
                            required
                        >
                            <option value="">Seleccione Empresa</option>
                            {empresas.map(emp => <option key={emp.id} value={emp.id}>{emp.nombre}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Sucursal (Opcional)</label>
                        <select
                            className="w-full p-2 border rounded-xl bg-slate-50"
                            value={adminData.sucursal_id}
                            onChange={e => setAdminData({ ...adminData, sucursal_id: e.target.value })}
                            disabled={!adminData.empresa_id}
                        >
                            <option value="">-- General (Admin) --</option>
                            {creationSucursales.map(suc => <option key={suc.id} value={suc.id}>{suc.nombre}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Usuario</label>
                        <input
                            className="w-full p-2 border rounded-xl bg-slate-50"
                            value={adminData.username}
                            onChange={e => setAdminData({ ...adminData, username: e.target.value })}
                            placeholder="ej. admin_clinica"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Contraseña</label>
                        <input
                            type="password"
                            className="w-full p-2 border rounded-xl bg-slate-50"
                            value={adminData.password}
                            onChange={e => setAdminData({ ...adminData, password: e.target.value })}
                            required
                        />
                    </div>
                    <button className="bg-slate-800 text-white px-6 py-2 rounded-xl font-bold hover:bg-slate-900 transition-colors">
                        Crear Admin
                    </button>
                </form>
            </div>

            {managingBranchEmpresa && (
                <SucursalesManager
                    empresaId={managingBranchEmpresa.id}
                    empresaNombre={managingBranchEmpresa.nombre}
                    onClose={() => setManagingBranchEmpresa(null)}
                />
            )}

            {/* Modal de Ver Staff */}
            {viewingStaffEmpresa && (
                <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 animate-in fade-in duration-200">
                    <div className="bg-white p-8 rounded-2xl shadow-2xl w-[600px]">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-slate-800">Staff de {viewingStaffEmpresa.nombre}</h3>
                                <p className="text-sm text-slate-400">Listado de administradores y supervisores</p>
                            </div>
                            <button onClick={() => setViewingStaffEmpresa(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                                <X size={20} className="text-slate-400" />
                            </button>
                        </div>

                        <div className="border rounded-xl overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b">
                                    <tr>
                                        <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Usuario</th>
                                        <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Rol</th>
                                        <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Asignación</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {staffList.length === 0 ? (
                                        <tr><td colSpan="3" className="px-4 py-8 text-center text-slate-400 text-sm">No hay staff registrado.</td></tr>
                                    ) : (
                                        staffList.map(st => (
                                            <tr key={st.id}>
                                                <td className="px-4 py-3 font-bold text-slate-700">{st.username}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${st.rol === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                                        {st.rol}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-slate-500">{st.sucursal}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SuperAdminView;