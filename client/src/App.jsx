import React, { useState } from 'react';
import AdminPanel from './AdminPanel';
import Game from './Game'; // Import the new view

function App() {
  // Simple toggle for demo purposes
  const [view, setView] = useState('admin'); // 'admin' or 'game'

  return (
    <div className="App relative">
      {/* View Switcher (Fixed Top Right) */}
      <div className="fixed top-4 right-4 z-[99999] flex gap-2">
        <button 
            onClick={() => setView('admin')} 
            className={`px-4 py-2 text-xs font-bold uppercase rounded ${view === 'admin' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400'}`}
        >
            Admin View
        </button>
        <button 
            onClick={() => setView('game')} 
            className={`px-4 py-2 text-xs font-bold uppercase rounded ${view === 'game' ? 'bg-amber-600 text-white' : 'bg-gray-800 text-gray-400'}`}
        >
            Game View
        </button>
      </div>

      {view === 'admin' ? <AdminPanel /> : <Game />}
    </div>
  );
}

export default App;