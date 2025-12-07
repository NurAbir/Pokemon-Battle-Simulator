import axios from 'axios';

const API = axios.create({
    baseURL: 'http://localhost:5000/api'
});

export const signup = (data) => API.post('/auth/signup', data);
export const login = (data) => API.post('/auth/login', data);
export const forgotPassword = (data) => API.post('/auth/forgot-password', data);
export const verifyCode = (data) => API.post('/auth/verify-code', data);
export const resetPassword = (data) => API.post('/auth/reset-password', data);

export default API;