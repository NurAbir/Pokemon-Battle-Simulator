import axios from 'axios';

const API = axios.create({
    baseURL: 'http://localhost:5000/api'
});

// Auth interceptor to add JWT token to all requests
API.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Auth endpoints
export const signup = (data) => API.post('/auth/signup', data);
export const login = (data) => API.post('/auth/login', data);
export const forgotPassword = (data) => API.post('/auth/forgot-password', data);
export const verifyCode = (data) => API.post('/auth/verify-code', data);
export const resetPassword = (data) => API.post('/auth/reset-password', data);

// Team endpoints
export const getMyTeam = () => API.get('/team/my-team');
export const createTeam = (data) => API.post('/team/create', data);
export const updateTeam = (data) => API.put('/team/update', data);

export default API;