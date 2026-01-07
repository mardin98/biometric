import React, { useState, useEffect } from 'react';
import axios from '../config/axios';
import { Store, Plus, Trash2, Edit2, X } from 'lucide-react';

const SucursalesManager = ({ empresaId, empresaNombre, onClose }) => {
    const [sucursales, setSucursales] = useState([]);
    const [nombre, setNombre] = useState('');
    const [loading, setLoading] = useState(false);

    const fetchSucursales = async () => {
        try {
            const res = await axios.get(`/empresas/${empresaId}/sucursales`);
            setSucursales(res.data);
        } catch (error) {
            console.error("Error cargando sucursales:", error);
        }
    };

    useEffect(() => {
        if (empresaId) fetchSucursales();
    }, [empresaId]);

    const handleCrear = async (e) => {
        e.preventDefault();
        if (!nombre.trim()) return;
        setLoading(true);
        try {
            await axios.post('/sucursales', { nombre, empresa_id: empresaId });
            setNombre('');
            fetchSucursales();
        } catch (error) {
            alert("Error al crear sucursal");
        } finally {
            setLoading(false);
        }
    };

    // Placeholder para eliminar/editar si fuera necesario (por ahora solo crear/listar)

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-50 duration-200">
                <div className="p-4 border-b flex justify-between items-center bg-slate-50">
                    <div>
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <Store size={18} className="text-purple-600" />
                            Sucursales
                        </h3>
                        <p className="text-xs text-slate-500">Gestionando: <span className="font-bold">{empresaNombre}</span></p>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full transition">
                        <X size={20} className="text-slate-400" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Lista */}
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                        {sucursales.length === 0 ? (
                            <p className="text-center text-sm text-slate-400 py-4 italic">No hay sucursales registradas</p>
                        ) : (
                            sucursales.map(suc => (
                                <div key={suc.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <span className="text-sm font-semibold text-slate-700">{suc.nombre}</span>
                                    <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">ACTIVO</span>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Crear Nueva */}
                    <form onSubmit={handleCrear} className="flex gap-2">
                        <input
                            className="flex-1 p-2.5 text-sm border rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                            placeholder="Nombre de nueva sucursal..."
                            value={nombre}
                            onChange={e => setNombre(e.target.value)}
                            required
                        />
                        <button
                            disabled={loading}
                            className="bg-purple-600 text-white p-2.5 rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50"
                        >
                            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Plus size={20} />}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default SucursalesManager;
