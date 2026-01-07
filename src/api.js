import axios from 'axios';

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api/v1',
});

// Interceptor para añadir el Token a cada petición automáticamente
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('biopass_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para manejar errores 401 (Token expirado)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.clear(); // Limpia sesión
      window.location.reload(); // Recarga para ir al LoginView
    }
    return Promise.reject(error);
  }
);

export default api;