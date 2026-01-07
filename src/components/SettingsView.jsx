import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Settings, ShieldCheck, Fingerprint, ScanFace, CreditCard } from 'lucide-react';

const SettingsView = () => {
    const [config, setConfig] = useState({ usa_nfc: true, usa_huella: false, usa_facial: false });

    const handleToggle = async (key) => {
        const newConfig = { ...config, [key]: !config[key] };
        setConfig(newConfig);
        const token = localStorage.getItem('biopass_token');
        await axios.put(`http://127.0.0.1:8000/api/v1/dashboard/config-empresa?usa_nfc=${newConfig.usa_nfc}&usa_huella=${newConfig.usa_huella}&usa_facial=${newConfig.usa_facial}`, {}, {
            headers: { Authorization: `Bearer ${token}` }
        });
    };

    return (
        <div className="p-8 max-w-2xl">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Settings className="text-blue-600" /> Configuración del Sistema
            </h2>

            <div className="bg-white rounded-2xl border p-6 space-y-6 shadow-sm">
                <p className="text-sm text-slate-500 mb-4">Activa los métodos de acceso contratados por tu empresa.</p>

                {/* Módulo NFC */}
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><CreditCard /></div>
                        <div>
                            <p className="font-bold text-slate-800">Lectura de Tarjetas NFC</p>
                            <p className="text-xs text-slate-500">Uso de carnets o llaveros de proximidad.</p>
                        </div>
                    </div>
                    <input type="checkbox" checked={config.usa_nfc} onChange={() => handleToggle('usa_nfc')} className="w-6 h-6 accent-blue-600" />
                </div>

                {/* Módulo Huella */}
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg"><Fingerprint /></div>
                        <div>
                            <p className="font-bold text-slate-800">Biometría Dactilar</p>
                            <p className="text-xs text-slate-500">Requiere sensor AS608 o similar en el equipo.</p>
                        </div>
                    </div>
                    <input type="checkbox" checked={config.usa_huella} onChange={() => handleToggle('usa_huella')} className="w-6 h-6 accent-emerald-600" />
                </div>

                {/* Módulo Facial */}
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-purple-100 text-purple-600 rounded-lg"><ScanFace /></div>
                        <div>
                            <p className="font-bold text-slate-800">Reconocimiento Facial</p>
                            <p className="text-xs text-slate-500">Verificación mediante cámara AI.</p>
                        </div>
                    </div>
                    <input type="checkbox" checked={config.usa_facial} onChange={() => handleToggle('usa_facial')} className="w-6 h-6 accent-purple-600" />
                </div>
            </div>
        </div>
    );
};

export default SettingsView;