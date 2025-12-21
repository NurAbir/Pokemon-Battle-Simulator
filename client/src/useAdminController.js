/* useAdminController.js - The Logic Layer */
import { useState, useEffect, useRef } from 'react';
import { useAnimation } from 'framer-motion';
import { fetchInitialUsers, generateUser, banUser, dismissReport, updateUserElo } from './AdminModel';

export const useAdminController = (avatars, audio) => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [hasBooted, setHasBooted] = useState(false);
  const [uptime, setUptime] = useState(0);
  const [banFlash, setBanFlash] = useState(false);
  const panelControls = useAnimation();
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const loadData = async () => {
      const data = await fetchInitialUsers();
      setUsers(data);
    };
    loadData();

// ADD THIS BLOCK: Poll for updates every 2 seconds
    const pollingInterval = setInterval(async () => {
       const data = await fetchInitialUsers();
       // Only update if we aren't currently banning someone (prevent UI jump)
       setUsers(prevUsers => {
          // simple check to avoid overwriting local animation states if needed, 
          // or just return 'data' for immediate updates
          return data; 
       });
    }, 2000);

    const interval = setInterval(() => setUptime(prev => prev + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const handleBan = async (userToBan) => { 
    // LINE 41: Ban attempt aborted: Selected user is null or missing necessary ID fields.
    if (!userToBan || (!userToBan._id && !userToBan.id)) {
        console.error("Ban attempt aborted: Selected user is null or missing necessary ID fields.");
        return; 
    }
    
    // The MongoDB _id (string) is needed for the API. The numerical id (number) is for local state.
    const apiId = userToBan._id; // ID for API call (MongoDB ObjectId string)
    const localId = userToBan.id; // ID for local state update (Numerical ID)

    audio.playSound('ban');
    setBanFlash(true);
    setTimeout(() => setBanFlash(false), 300);

    panelControls.start({
      x: [0, -10, 10, -5, 5, 0],
      y: [0, -5, 5, -2, 2, 0],
      transition: { duration: 0.4 }
    });

    setSelectedUser(null);

    // Call API with the MongoDB _id
    await banUser(apiId); 

    // Update local state using the numerical ID
    setUsers(prev => prev.filter(u => u.id !== localId));

    setTimeout(() => {
      audio.playSound('spawn');
      setUsers(prev => [...prev, generateUser(avatars)]);
    }, 800);
  };

  const handleUpdateElo = async (userId, newElo) => {
    const updatedUser = await updateUserElo(userId, newElo);
    if (updatedUser) {
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, reportData: { ...u.reportData, ELO: newElo.toString() } } : u));
      audio.playSound('check'); // Feedback sound
    }
  };

  const handleDismiss = async (id) => {
      setSelectedUser(null); // Close the modal
      audio.playSound('check'); 

      // Call the backend API to dismiss the report (resets status to 'safe')
      const updatedUser = await dismissReport(id);

      if (updatedUser) {
        // Update the user list with the new 'safe' status
        setUsers(prev => prev.map(u => 
          u.id === id ? updatedUser : u 
        ));
      }
    };

  const handleTerminate = async (userId) => {
    // API call to set user status back to 'safe'
    await fetch(`http://localhost:5000/api/users/${userId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'safe' })
    });
    audio.playSound('alert'); // Use your existing audio engine
};

  const systemLoad = users.length > 0 
    ? (35 + (users.filter(u => u.status === 'suspicious').length / users.length) * 55 + (Math.sin(Date.now() / 1000) * 2)).toFixed(2)
    : "0.00";

  return {
    users, selectedUser, setSelectedUser,
    hasBooted, setHasBooted, uptime, banFlash,
    panelControls, handleBan, systemLoad, handleDismiss, activeTab,
    setActiveTab, handleTerminate
  };
};