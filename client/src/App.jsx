import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Signup from './components/Signup';
import ForgotPassword from './components/ForgotPassword';
import VerifyCode from './components/VerifyCode';
import ResetPassword from './components/ResetPassword';
import TeamBuilder from './components/TeamBuilder';
import ProfilePage from './components/ProfilePage';
import Dashboard from './components/Dashboard';
import AdminPanel from './components/AdminPanel';
import Battle from './components/Battle';
import NotificationBoard from './components/NotificationBoard';
import FriendFinder from './components/FriendFinder';
import ChatBox from './components/ChatBox';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/verify-code" element={<VerifyCode />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/admin" element={<AdminPanel />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/team-builder" element={<TeamBuilder />} />
      <Route path="/battle" element={<Battle />} />
      <Route path="/notifications" element={<NotificationBoard />} />
      <Route path="/friends" element={<FriendFinder />} />
      <Route path="/chat" element={<ChatBox />} />
    </Routes>
  );
}

export default App;