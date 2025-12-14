import axios from 'axios';

const API = axios.create({
    baseURL: 'http://localhost:5000/api'
});

// Add auth token to requests if available
API.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Auth
export const signup = (data) => API.post('/auth/signup', data);
export const login = (data) => API.post('/auth/login', data);
export const forgotPassword = (data) => API.post('/auth/forgot-password', data);
export const verifyCode = (data) => API.post('/auth/verify-code', data);
export const resetPassword = (data) => API.post('/auth/reset-password', data);

// Notifications
export const getNotifications = (params) => API.get('/notifications', { params });
export const getUnreadCount = () => API.get('/notifications/unread-count');
export const sendMatchInvite = (data) => API.post('/notifications/match-invite', data);
export const sendFriendRequest = (data) => API.post('/notifications/friend-request', data);
export const respondToMatchInvite = (notificationId, accept) => 
    API.put(`/notifications/${notificationId}/respond-match`, { accept });
export const respondToFriendRequest = (notificationId, accept) => 
    API.put(`/notifications/${notificationId}/respond-friend`, { accept });
export const markNotificationRead = (notificationId) => 
    API.put(`/notifications/${notificationId}/read`);
export const markAllNotificationsRead = () => API.put('/notifications/read-all');

// Chat
export const getGlobalChat = () => API.get('/chat/global');
export const getPrivateChats = () => API.get('/chat/private');
export const getPrivateChat = (username) => API.get(`/chat/private/${username}`);
export const getBattleChat = (battleId) => API.get(`/chat/battle/${battleId}`);
export const getChatHistory = (roomId, params) => API.get(`/chat/room/${roomId}`, { params });
export const sendMessage = (roomId, content) => 
    API.post(`/chat/room/${roomId}/message`, { content });

// Battle Log
export const getBattleLog = (battleId) => API.get(`/battle-log/${battleId}`);
export const getBattleLogAfter = (battleId, timestamp) => 
    API.get(`/battle-log/${battleId}/after`, { params: { timestamp } });

export default API;