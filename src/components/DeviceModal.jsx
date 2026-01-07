import { useState } from 'react';
import axios from 'axios';
import { X, Save, Server } from 'lucide-react';

const DeviceModal = ({ isOpen, onClose, onDeviceAdded }) => {
    const [formData, setFormData] = useState({
        nombre_ubicacion: '',
        mac_address: '',
        empresa_id: 1
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await axios.post('http://127.0.0.1:8000/api/v1/dashboard/dispositivos', formData);
            onDeviceAdded();
            onClose();
            setFormData({ nombre_ubicacion: '', mac_address: '', empresa_id: 1 });
        } catch (err) {
            setError(err.response?.data?.detail || 'Error al guardar.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 transform transition-all border border-gray-200">

                <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-4">
                    <h3 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
                        <Server className="text-blue-700" size={26} />
                        Vincular ESP32
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-red-600 transition">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">⚠️ {error}</div>}

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Nombre / Ubicación</label>
                        <input
                            type="text" required
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:border-blue-600 bg-white text-gray-900"
                            placeholder="Ej. Puerta Principal"
                            value={formData.nombre_ubicacion}
                            onChange={(e) => setFormData({ ...formData, nombre_ubicacion: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Dirección MAC</label>
                        <input
                            type="text" required
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:border-blue-600 font-mono uppercase bg-white text-gray-900"
                            placeholder="AA:BB:CC:DD:EE:FF"
                            value={formData.mac_address}
                            onChange={(e) => setFormData({ ...formData, mac_address: e.target.value.toUpperCase() })}
                        />
                        <p className="text-xs text-gray-500 mt-1">La encontrarás impresa en el ESP32 o en el monitor serial.</p>
                    </div>

                    <div className="flex gap-3 mt-8 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 px-4 py-3 bg-gray-200 text-gray-800 rounded-lg font-bold hover:bg-gray-300">Cancelar</button>
                        <button type="submit" disabled={loading} className="flex-1 px-4 py-3 bg-blue-700 text-white rounded-lg font-bold hover:bg-blue-800">
                            {loading ? 'Guardando...' : 'Vincular'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DeviceModal;