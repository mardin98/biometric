import { useEffect, useState } from 'react';
import axios from '../config/axios';
import { Server, Wifi, WifiOff, Activity, LockKeyholeOpen } from 'lucide-react';
import DeviceModal from './DeviceModal'; // <--- IMPORTAR EL MODAL

const DevicesView = () => {
    const [devices, setDevices] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false); // <--- ESTADO DEL MODAL

    const fetchDevices = async () => {
        try {
            const res = await axios.get('/dashboard/dispositivos');
            setDevices(res.data);
        } catch (error) { console.error(error); }
    };

    const handleOpenDoor = async (id) => {
        try {
            await axios.post(`/dashboard/dispositivos/${id}/abrir`);
            alert("🔓 Comando enviado exitosamente");
        } catch (error) {
            alert("Error al enviar comando");
        }
    };

    useEffect(() => {
        fetchDevices();
        const interval = setInterval(fetchDevices, 10000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Estado de Hardware</h2>

                {/* BOTÓN VINCULAR ACTIVO */}
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-white text-blue-700 px-4 py-2 rounded-lg border border-blue-200 text-sm font-bold shadow-sm hover:bg-blue-50 transition"
                >
                    + Vincular Nuevo ESP32
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {devices.map((dev) => (
                    <div key={dev.id} className={`bg-white rounded-xl shadow-sm border-2 p-6 transition 
            ${dev.online ? 'border-green-400' : 'border-gray-200 opacity-80'}`}>

                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-slate-100 rounded-lg text-slate-700">
                                <Server size={24} />
                            </div>
                            {dev.online ? (
                                <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full"><Wifi size={14} /> ONLINE</span>
                            ) : (
                                <span className="flex items-center gap-1 text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-full"><WifiOff size={14} /> OFFLINE</span>
                            )}
                        </div>

                        <h3 className="text-lg font-bold text-gray-800 mb-1">{dev.ubicacion || "Sin Nombre"}</h3>
                        <p className="text-xs text-gray-400 font-mono mb-4">MAC: {dev.mac}</p>
                        {/* BOTÓN APERTURA REMOTA */}
                        <button
                            onClick={() => handleOpenDoor(dev.id)}
                            disabled={!dev.online} // Solo funciona si está online
                            className={`w-full mt-4 mb-2 py-2 rounded-lg font-bold flex justify-center items-center gap-2 transition
                            ${dev.online
                                    ? 'bg-orange-100 text-orange-700 hover:bg-orange-200 cursor-pointer'
                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                        >
                            <LockKeyholeOpen size={18} /> ABRIR PUERTA
                        </button>


                        <div className="border-t border-gray-100 pt-4 flex flex-col gap-2">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Activity size={16} className="text-blue-500" />
                                <span className="text-xs font-bold text-gray-400 uppercase">Última Actividad:</span>
                            </div>
                            <p className="text-sm font-medium text-gray-800 pl-6">{dev.last_seen}</p>
                        </div>
                    </div>
                ))}
            </div>


            {/* MODAL AGREGADO AL FINAL */}
            <DeviceModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onDeviceAdded={fetchDevices}
            />
        </div>
    );
};

export default DevicesView;