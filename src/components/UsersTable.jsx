import { useEffect, useState } from 'react';
import axios from '../config/axios';
import { Trash2, User, CreditCard, Fingerprint, Pencil } from 'lucide-react';

// Recibimos la función 'onEdit' desde el padre (App.jsx)
const UsersTable = ({ onEdit }) => {
    const [usuarios, setUsuarios] = useState([]);

    // --- src/components/UsersTable.jsx ---

    const fetchUsuarios = async () => {
        try {
            // La URL base ya está configurada en la instancia 'api'
            const response = await axios.get('/usuarios');
            setUsuarios(response.data);
        } catch (error) {
            console.error("Error al obtener usuarios:", error);
            // Si da error, asegúrate de que el token no haya expirado
        }
    };

    const getStatusBadge = (user) => {
        const ahora = new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });

        if (ahora >= user.inicio_almuerzo && ahora <= user.fin_almuerzo) {
            return <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded text-xs">En Almuerzo</span>;
        }
        return <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">Laborando</span>;
    };

    const handleDelete = async (id) => {
        if (!confirm("¿Estás seguro de eliminar este usuario?")) return;
        try {
            await axios.delete(`/dashboard/usuarios/${id}`);
            fetchUsuarios();
        } catch (error) { alert("Error al eliminar"); }
    };

    useEffect(() => { fetchUsuarios(); }, []);

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Directorio de Personal</h2>
                <button onClick={fetchUsuarios} className="text-blue-600 hover:underline text-sm font-medium">Actualizar Lista</button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-100 text-gray-600 text-xs uppercase font-bold">
                        <tr>
                            <th className="px-6 py-4">Nombre</th>
                            <th className="px-6 py-4">Credenciales</th>
                            <th className="px-6 py-4 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {usuarios.map((u) => (
                            <tr key={u.id} className="hover:bg-blue-50 transition">
                                <td className="px-6 py-4 font-bold text-gray-800 flex items-center gap-3">
                                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700">
                                        <User size={16} />
                                    </div>
                                    {u.nombre_completo}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex gap-2">
                                        {u.nfc_uid ?
                                            <span className="flex items-center gap-1 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded border border-purple-200"><CreditCard size={12} /> {u.nfc_uid}</span> :
                                            <span className="text-xs text-gray-400 opacity-50 flex items-center gap-1"><CreditCard size={12} /> -- </span>
                                        }
                                        {u.huella_sensor_id &&
                                            <span className="flex items-center gap-1 text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded border border-orange-200"><Fingerprint size={12} /> ID: {u.huella_sensor_id}</span>
                                        }
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right flex justify-end gap-2">

                                    {/* BOTÓN EDITAR */}
                                    <button
                                        onClick={() => onEdit(u)} // <--- AQUÍ LLAMAMOS A LA FUNCIÓN PADRE
                                        className="text-gray-400 hover:text-orange-600 hover:bg-orange-50 p-2 rounded-lg transition"
                                        title="Editar"
                                    >
                                        <Pencil size={18} />
                                    </button>

                                    <button
                                        onClick={() => handleDelete(u.id)}
                                        className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition"
                                        title="Eliminar"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default UsersTable;