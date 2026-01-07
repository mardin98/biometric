import { useState, useEffect } from 'react';
import axios from 'axios';
import { Lock, User, LogIn } from 'lucide-react';
import { brandConfig } from '../config';

const LoginView = ({ onLoginSuccess }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [dynamicAppName, setDynamicAppName] = useState(brandConfig.appName);

    useEffect(() => {
        axios.get('http://127.0.0.1:8000/api/v1/public/config')
            .then(res => {
                if (res.data.nombre_sistema) setDynamicAppName(res.data.nombre_sistema);
            })
            .catch(err => console.error("Error loading config:", err));
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const formData = new FormData();
            formData.append('username', username);
            formData.append('password', password);

            const res = await axios.post('http://127.0.0.1:8000/api/v1/auth/login', formData);

            // --- SOLUCIÓN AL ERROR DE ROL ---
            // Limpiamos cualquier sesión previa para evitar conflictos de roles
            localStorage.clear();

            // Guardamos los nuevos datos enviados por el backend
            console.log("Role raw received:", res.data.rol);
            const normalizedRole = res.data.rol ? res.data.rol.toString().toLowerCase().trim() : 'supervisor';
            console.log("Role stored:", normalizedRole);

            localStorage.setItem('biopass_token', res.data.access_token);
            localStorage.setItem('biopass_role', normalizedRole);

            // Avisamos a App.jsx que ya estamos autenticados
            onLoginSuccess();

        } catch (err) {
            console.error(err);
            setError('Usuario o contraseña incorrectos');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex h-screen w-full bg-slate-900 justify-center items-center font-sans">
            <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-sm border border-slate-200">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-extrabold text-blue-700 tracking-tight">
                        {dynamicAppName}<span className="text-slate-800">{brandConfig.appSuffix}</span>
                    </h1>
                    <p className="text-gray-400 text-sm mt-2">{brandConfig.tagline}</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-xl text-center text-xs font-bold border border-red-100 animate-pulse">
                            {error}
                        </div>
                    )}

                    <div className="relative">
                        <User className="absolute left-3 top-3.5 text-gray-400" size={18} />
                        <input
                            type="text" required placeholder="Usuario"
                            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition bg-slate-50 text-slate-900"
                            value={username} onChange={(e) => setUsername(e.target.value)}
                        />
                    </div>

                    <div className="relative">
                        <Lock className="absolute left-3 top-3.5 text-gray-400" size={18} />
                        <input
                            type="password" required placeholder="Contraseña"
                            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition bg-slate-50 text-slate-900"
                            value={password} onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <button
                        type="submit" disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition flex justify-center items-center gap-2 shadow-lg shadow-blue-500/30"
                    >
                        {loading ? 'Validando...' : <><LogIn size={20} /> Iniciar Sesión</>}
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest">{brandConfig.footerText}</p>
                </div>
            </div>
        </div>
    );
};

export default LoginView;