import axios from 'axios';

// Crear una instancia de axios
const api = axios.create({
    baseURL: 'http://127.0.0.1:8000/api/v1', // Ajusta esto si tu base URL cambia
});

// Interceptor para agregar el token a cada petición
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('biopass_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Interceptor para manejar errores globales (opcional)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Opcional: Redirigir al login o limpiar localStorage si el token expiró
            console.warn("Sesión expirada o no autorizada");
            // localStorage.clear();
            // window.location.href = '/login'; 
        }
        return Promise.reject(error);
    }
);

export default api;
