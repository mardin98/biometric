import React, { useState, useEffect } from 'react';
import axios from '../config/axios';
import {
    X, User, CreditCard, Mail, Briefcase,
    Clock, Utensils, ScanFace, Fingerprint, ShieldCheck, Store
} from 'lucide-react';

const UserModal = ({ isOpen, onClose, onSave, user = null, services = { nfc: true, facial: true, biometric: true }, empresaConfig }) => {
    const [sucursales, setSucursales] = useState([]);
    const [formData, setFormData] = useState({
        nombre_completo: '',
        nfc_uid: '',
        face_id: '',
        finger_id: '',
        sucursal_id: '',
        email: '',
        dui: '',
        cargo: '',
        entrada: '08:00',
        salida: '17:00',
        inicio_almuerzo: '12:00',
        fin_almuerzo: '13:00'
    });

    // Sincronizar datos cuando el modal abre o cambia el usuario a editar
    useEffect(() => {
        if (user) {
            setFormData({
                nombre_completo: user.nombre_completo || '',
                nfc_uid: user.nfc_uid || '',
                face_id: user.face_id || '',
                finger_id: user.finger_id || '',
                sucursal_id: user.sucursal_id || '',
                email: user.email || '',
                dui: user.dui || '',
                cargo: user.cargo || '',
                entrada: user.entrada || '08:00',
                salida: user.salida || '17:00',
                inicio_almuerzo: user.inicio_almuerzo || '12:00',
                fin_almuerzo: user.fin_almuerzo || '13:00'
            });
        } else {
            setFormData({
                nombre_completo: '', nfc_uid: '', face_id: '', finger_id: '', sucursal_id: '',
                email: '', dui: '', cargo: '', entrada: '08:00',
                salida: '17:00', inicio_almuerzo: '12:00', fin_almuerzo: '13:00'
            });
        }
    }, [user, isOpen]);

    // Cargar sucursales si hay ID de empresa
    useEffect(() => {
        if (empresaConfig?.id && isOpen) {
            axios.get(`/empresas/${empresaConfig.id}/sucursales`)
                .then(res => setSucursales(res.data))
                .catch(err => console.error("Error cargando sucursales:", err));
        }
    }, [empresaConfig, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 text-sm">
            <div className="bg-white rounded-[2.5rem] w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] animate-in zoom-in-95 duration-200">

                {/* HEADER */}
                <div className="bg-slate-900 p-6 flex justify-between items-center text-white shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-500/20 rounded-2xl">
                            <ShieldCheck className="text-blue-400" size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold">{user ? 'Actualizar Perfil' : 'Registro de Empleado'}</h3>
                            <p className="text-slate-400 text-xs">Gestión de credenciales y horarios laborales</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="hover:bg-white/10 p-2 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="overflow-y-auto p-8 custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">

                        {/* COLUMNA IZQUIERDA: IDENTIDAD */}
                        <div className="space-y-6">
                            <h4 className="text-[10px] font-bold text-blue-600 uppercase tracking-[0.2em] flex items-center gap-2">
                                <User size={14} /> Datos de Identidad
                            </h4>

                            <div className="space-y-4">
                                <InputField label="Nombre Completo" icon={<User size={14} />} value={formData.nombre_completo} onChange={v => setFormData({ ...formData, nombre_completo: v })} required />
                                <InputField label="DUI (Documento Único)" icon={<CreditCard size={14} />} placeholder="00000000-0" value={formData.dui} onChange={v => setFormData({ ...formData, dui: v })} />
                                <InputField label="Correo Institucional" icon={<Mail size={14} />} type="email" value={formData.email} onChange={v => setFormData({ ...formData, email: v })} />
                                <InputField label="Cargo / Puesto" icon={<Briefcase size={14} />} value={formData.cargo} onChange={v => setFormData({ ...formData, cargo: v })} />

                                <div className="group space-y-1.5">
                                    <label className="flex items-center gap-2 text-[11px] font-bold text-slate-500 ml-1">
                                        <Store size={14} /> Sucursal / Agencia
                                    </label>
                                    <select
                                        className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm text-slate-600"
                                        value={formData.sucursal_id}
                                        onChange={e => setFormData({ ...formData, sucursal_id: e.target.value })}
                                    >
                                        <option value="">-- Sede Principal --</option>
                                        {sucursales.map(s => (
                                            <option key={s.id} value={s.id}>{s.nombre}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* COLUMNA DERECHA: MÉTODOS DE ACCESO (CONDICIONAL) */}
                        <div className="space-y-6">
                            <h4 className="text-[10px] font-bold text-orange-600 uppercase tracking-[0.2em] flex items-center gap-2">
                                <ShieldCheck size={14} /> Métodos de Acceso Contratados
                            </h4>

                            <div className="space-y-4">
                                {services.nfc && (
                                    <div className="p-4 bg-orange-50/50 border border-orange-100 rounded-2xl hover:bg-orange-50 transition-colors">
                                        <InputField label="Token / UID NFC" icon={<CreditCard size={14} className="text-orange-500" />} value={formData.nfc_uid} onChange={v => setFormData({ ...formData, nfc_uid: v })} />
                                    </div>
                                )}

                                {services.facial && (
                                    <div className="p-4 bg-purple-50/50 border border-purple-100 rounded-2xl hover:bg-purple-50 transition-colors">
                                        <InputField label="ID de Reconocimiento Facial" icon={<ScanFace size={14} className="text-purple-500" />} value={formData.face_id} onChange={v => setFormData({ ...formData, face_id: v })} />
                                    </div>
                                )}

                                {services.biometric && (
                                    <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl hover:bg-emerald-50 transition-colors">
                                        <InputField label="ID de Huella Digital" icon={<Fingerprint size={14} className="text-emerald-500" />} value={formData.finger_id} onChange={v => setFormData({ ...formData, finger_id: v })} />
                                    </div>
                                )}

                                {!services.nfc && !services.facial && !services.biometric && (
                                    <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed">
                                        <p className="text-slate-400 italic">No hay servicios biométricos activos para esta empresa.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* SECCIÓN INFERIOR: TIEMPOS Y HORARIOS */}
                    <div className="mt-10 p-6 bg-slate-50 rounded-[2rem] border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <h5 className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-2">
                                <Clock size={14} /> Jornada de Trabajo
                            </h5>
                            <div className="grid grid-cols-2 gap-4">
                                <InputField label="Hora Entrada" type="time" value={formData.entrada} onChange={v => setFormData({ ...formData, entrada: v })} />
                                <InputField label="Hora Salida" type="time" value={formData.salida} onChange={v => setFormData({ ...formData, salida: v })} />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h5 className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-2">
                                <Utensils size={14} /> Receso de Almuerzo
                            </h5>
                            <div className="grid grid-cols-2 gap-4">
                                <InputField label="Inicia" type="time" value={formData.inicio_almuerzo} onChange={v => setFormData({ ...formData, inicio_almuerzo: v })} />
                                <InputField label="Finaliza" type="time" value={formData.fin_almuerzo} onChange={v => setFormData({ ...formData, fin_almuerzo: v })} />
                            </div>
                        </div>
                    </div>

                    {/* BOTONES DE ACCIÓN */}
                    <div className="mt-10 flex gap-4 sticky bottom-0 bg-white pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-4 px-6 border border-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-slate-50 transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="flex-[2] py-4 px-6 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all active:scale-[0.98]"
                        >
                            {user ? 'Guardar Cambios del Empleado' : 'Finalizar Registro'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

/** * Sub-componente de Input para mantener el código limpio 
 */
const InputField = ({ label, icon, value, onChange, type = "text", placeholder = "", required = false }) => (
    <div className="group space-y-1.5">
        <label className="flex items-center gap-2 text-[11px] font-bold text-slate-500 ml-1 transition-colors group-focus-within:text-blue-600">
            {icon} {label}
        </label>
        <input
            type={type}
            required={required}
            placeholder={placeholder}
            className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm placeholder:text-slate-300"
            value={value}
            onChange={e => onChange(e.target.value)}
        />
    </div>
);

export default UserModal;