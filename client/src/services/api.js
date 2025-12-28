import axios from 'axios';

const API = axios.create({
    baseURL:  `${process.env.REACT_APP_API_URL}/api`
});

// Add auth token to requests
API.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Auth endpoints
export const signup = (data) => API.post('/auth/signup', data);
export const login = (data) => API.post('/auth/login', data);
export const forgotPassword = (data) => API.post('/auth/forgot-password', data);
export const verifyCode = (data) => API.post('/auth/verify-code', data);
export const resetPassword = (data) => API.post('/auth/reset-password', data);

// Notification endpoints
export const getNotifications = (params) => API.get('/notifications', { params });
export const getUnreadCount = () => API.get('/notifications/unread-count');
export const markNotificationRead = (notificationId) => API.put(`/notifications/${notificationId}/read`);
export const markAllNotificationsRead = () => API.put('/notifications/read-all');
export const sendMatchInvite = (data) => API.post('/notifications/match-invite', data);
export const respondToMatchInvite = (notificationId, data) => API.post(`/notifications/${notificationId}/respond-match`, data);
export const deleteNotification = (notificationId) => API.delete(`/notifications/${notificationId}`);

// Friend endpoints
export const searchUser = (username) => API.get('/friends/search', { params: { username } });
export const getFriends = () => API.get('/friends');
export const getPendingFriendRequests = () => API.get('/friends/pending');
export const sendFriendRequest = (data) => API.post('/friends/request', data);
export const respondToFriendRequest = (data) => API.post('/friends/respond', data);
export const removeFriend = (friendUserId) => API.delete(`/friends/${friendUserId}`);

// Chat endpoints
export const getGlobalChat = () => API.get('/chat/global');
export const getPrivateChatList = () => API.get('/chat/private');
export const getPrivateChat = (userId) => API.get(`/chat/private/${userId}`);
export const getBattleChat = (battleId) => API.get(`/chat/battle/${battleId}`);
export const getChatHistory = (roomId, params) => API.get(`/chat/history/${roomId}`, { params });
export const markChatAsRead = (roomId) => API.put(`/chat/${roomId}/read`);

export default API;