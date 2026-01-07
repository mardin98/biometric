import { useState, useEffect } from 'react';
import axios from 'axios';
import { ShieldCheck, Trash2, Plus } from 'lucide-react';

const StaffView = () => {
    const [staff, setStaff] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [sucursales, setSucursales] = useState([]);
    const [newUser, setNewUser] = useState({ username: '', password: '', rol: 'supervisor', sucursal_id: '' });

    // Obtener configuración de empresa actual para saber ID
    const [empresaId, setEmpresaId] = useState(null);

    useEffect(() => {
        fetchStaff();
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            const res = await axios.get('/dashboard/config-empresa-actual');
            if (res.data.id) {
                setEmpresaId(res.data.id);
                fetchSucursales(res.data.id);
            }
        } catch (error) { console.error("Error config", error); }
    };

    const fetchSucursales = async (id) => {
        try {
            const res = await axios.get(`/empresas/${id}/sucursales`);
            setSucursales(res.data);
        } catch (error) { console.error("Error sucursales", error); }
    };

    const fetchStaff = async () => {
        try {
            const token = localStorage.getItem('biopass_token');
            const res = await axios.get('http://127.0.0.1:8000/api/v1/dashboard/staff-list', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStaff(res.data);
        } catch (err) {
            console.error("Error cargando staff:", err);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('biopass_token');
            const payload = {
                ...newUser,
                sucursal_id: newUser.sucursal_id ? parseInt(newUser.sucursal_id) : null
            };
            await axios.post('http://127.0.0.1:8000/api/v1/dashboard/staff', payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setShowForm(false);
            fetchStaff();
        } catch (err) {
            alert(err.response?.data?.detail || "Error al crear staff");
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800">Gestión de Staff</h2>
                <button onClick={() => setShowForm(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                    <Plus size={18} /> Nuevo Miembro
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Usuario</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Rol</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Sucursal</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {staff.map(user => (
                            <tr key={user.id}>
                                <td className="px-6 py-4 font-medium text-slate-700">{user.username}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-md text-xs font-bold ${user.rol === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                        {user.rol.toUpperCase()}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-500">
                                    {user.sucursal_id ? `Sucursal ID: ${user.sucursal_id}` : 'General (Todas)'}
                                </td>
                                <td className="px-6 py-4 text-red-500 cursor-pointer hover:text-red-700"><Trash2 size={18} /></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal Simple para crear */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
                    <form onSubmit={handleCreate} className="bg-white p-8 rounded-2xl shadow-xl w-96 space-y-4">
                        <h3 className="text-xl font-bold">Agregar nuevo staff</h3>
                        <input className="w-full p-2 border rounded" placeholder="Usuario" onChange={e => setNewUser({ ...newUser, username: e.target.value })} required />
                        <input className="w-full p-2 border rounded" type="password" placeholder="Contraseña" onChange={e => setNewUser({ ...newUser, password: e.target.value })} required />
                        <select className="w-full p-2 border rounded" onChange={e => setNewUser({ ...newUser, rol: e.target.value })}>
                            <option value="supervisor">Supervisor</option>
                            <option value="admin">Administrador</option>
                        </select>
                        <select
                            className="w-full p-2 border rounded"
                            value={newUser.sucursal_id}
                            onChange={e => setNewUser({ ...newUser, sucursal_id: e.target.value })}
                        >
                            <option value="">-- Asignar a Sucursal (Opcional) --</option>
                            {sucursales.map(s => (
                                <option key={s.id} value={s.id}>{s.nombre}</option>
                            ))}
                        </select>
                        <div className="flex gap-2 pt-2">
                            <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2 text-slate-500">Cancelar</button>
                            <button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-bold">Crear</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default StaffView; 