import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { History as HistoryIcon, ShieldAlert, Clock, UserCheck } from 'lucide-react';

const AuditoriaView = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchAuditoria = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('biopass_token'); // O el nombre que uses para tu token
            const res = await axios.get('http://127.0.0.1:8000/api/v1/dashboard/auditoria', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setLogs(res.data);
        } catch (err) {
            console.error("Error cargando auditoría:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAuditoria();
    }, []);

    return (
        <div className="p-8 animate-in fade-in duration-500">
            {/* Encabezado de la Vista */}
            <div className="mb-8 flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <HistoryIcon className="text-blue-600" size={28} />
                        Registro de Auditoría
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">
                        Historial de acciones críticas realizadas por administradores y supervisores.
                    </p>
                </div>
                <button
                    onClick={fetchAuditoria}
                    className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-4 py-2 rounded-xl transition-colors"
                >
                    <Clock size={16} /> Actualizar
                </button>
            </div>

            {/* Tabla de Registros */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Fecha y Hora</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Administrador</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Acción Realizada</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Detalles</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-10 text-center text-slate-400">
                                        Cargando registros...
                                    </td>
                                </tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-10 text-center text-slate-400 italic">
                                        No se han registrado acciones de auditoría aún.
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors group">
                                        <td className="px-6 py-4 text-sm text-slate-600">
                                            <div className="flex items-center gap-2">
                                                <Clock size={14} className="text-slate-400" />
                                                {log.fecha}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                                                    <UserCheck size={14} />
                                                </div>
                                                <span className="text-sm font-bold text-slate-700">
                                                    @{log.admin}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight ${log.accion.includes('ELIMINAR') || log.accion.includes('REMOTA')
                                                ? 'bg-red-50 text-red-600 border border-red-100'
                                                : 'bg-green-50 text-green-600 border border-green-100'
                                                }`}>
                                                {log.accion}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm text-slate-500 truncate max-w-xs" title={log.detalles}>
                                                {log.detalles || 'Sin detalles adicionales'}
                                            </p>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pie de página de la tabla */}
            <div className="mt-4 flex items-center gap-2 text-[11px] text-slate-400 italic px-2">
                <ShieldAlert size={12} />
                Los registros de auditoría son inalterables y sirven para cumplimiento legal.
            </div>
        </div>
    );
};

export default AuditoriaView;