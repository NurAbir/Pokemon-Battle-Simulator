/* AdminPanel.jsx - The Presentation Layer (Fully Restored) */
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useAnimation, useMotionValue, useSpring } from 'framer-motion';
import { 
  AlertCircle, 
  CheckCircle2, 
  Skull, 
  ShieldCheck, 
  Users, 
  UserX,
  Activity,
  Power,
  Scan,
  Terminal,
  Crosshair,
  Wifi,
  Trophy,
  Copy,
  Check,
  Gamepad2,
  Database
} from 'lucide-react';
import { useAdminController } from './useAdminController'; // Controller Import
import PokemonManager from './usePokemonManagerController';
import Leaderboard from './Leaderboard';

// --- DATA CONSTANTS ---
const avatars = ["https://i.pravatar.cc/150?u=a", "https://i.pravatar.cc/150?u=b", "https://i.pravatar.cc/150?u=c", "https://i.pravatar.cc/150?u=d"];


// ----------------------------------------------------------------------
// --- 1. CORE COMPONENTS / UTILITIES (UI/Feature Implementation) ---
// ----------------------------------------------------------------------

// --- ADVANCED AUDIO ENGINE (WebAudio API) - Restored original sound logic ---
const useScifiAudio = () => {
  const audioCtxRef = useRef(null);
  const masterGainRef = useRef(null);

  const initAudio = () => {
    if (!audioCtxRef.current) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioCtxRef.current = new AudioContext();
      masterGainRef.current = audioCtxRef.current.createGain();
      masterGainRef.current.gain.value = 0.3; // Master volume
      masterGainRef.current.connect(audioCtxRef.current.destination);
    }
  };

  // FM Synthesis for sci-fi texture - Restored all original sound cases
  const playSound = (type) => {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const mod = ctx.createOscillator(); // Modulator for FM
    const modGain = ctx.createGain();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(masterGainRef.current);
    
    // Connect modulator only when needed (e.g., 'error')
    if (type === 'error') {
        mod.connect(modGain);
        modGain.connect(osc.frequency);
        mod.start(t);
    }


    switch (type) {
      case 'hover':
        osc.frequency.setValueAtTime(400, t);
        osc.frequency.exponentialRampToValueAtTime(600, t + 0.1);
        gain.gain.setValueAtTime(0.05, t);
        gain.gain.linearRampToValueAtTime(0, t + 0.1);
        osc.start(t);
        osc.stop(t + 0.1);
        break;
      
      case 'click':
      case 'select': // Use select for click actions
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, t);
        osc.frequency.exponentialRampToValueAtTime(2000, t + 0.1);
        gain.gain.setValueAtTime(0.1, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
        osc.start(t);
        osc.stop(t + 0.15);
        break;

      case 'error':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, t);
        osc.frequency.linearRampToValueAtTime(100, t + 0.3);
        mod.frequency.value = 50;
        modGain.gain.value = 500;
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.linearRampToValueAtTime(0, t + 0.3);
        osc.start(t);
        osc.stop(t + 0.3);
        mod.stop(t + 0.3);
        break;

      case 'ban':
        // Heavy impact sound (used by Controller)
        osc.type = 'square';
        osc.frequency.setValueAtTime(200, t);
        osc.frequency.exponentialRampToValueAtTime(50, t + 0.6);
        gain.gain.setValueAtTime(0.5, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
        osc.start(t);
        osc.stop(t + 0.6);
        break;
      
      case 'spawn':
        // Digital materialize sound (used by Controller)
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(800, t);
        osc.frequency.linearRampToValueAtTime(1200, t + 0.2);
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.1, t + 0.1);
        gain.gain.linearRampToValueAtTime(0, t + 0.2);
        osc.start(t);
        osc.stop(t + 0.2);
        break;
      default: break;
    }
  };

  return { initAudio, playSound };
};

// --- CUSTOM CURSOR - Restored original crosshair and click-wave logic ---
const SciFiCursor = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [clicks, setClicks] = useState([]);
  
  useEffect(() => {
    const handleMove = (e) => setMousePosition({ x: e.clientX, y: e.clientY });
    const handleClick = (e) => {
      const id = Date.now();
      setClicks(prev => [...prev, { x: e.clientX, y: e.clientY, id }]);
      setTimeout(() => setClicks(prev => prev.filter(c => c.id !== id)), 1000);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mousedown', handleClick);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mousedown', handleClick);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden">
      {/* Main Crosshair */}
      <motion.div 
        className="absolute top-0 left-0"
        animate={{ x: mousePosition.x - 16, y: mousePosition.y - 16 }}
        transition={{ type: "spring", stiffness: 500, damping: 28, mass: 0.5 }}
      >
        <div className="relative w-8 h-8 flex items-center justify-center">
          <div className="absolute w-[1px] h-full bg-blue-400/80" />
          <div className="absolute h-[1px] w-full bg-blue-400/80" />
          <div className="w-4 h-4 border border-blue-400 rounded-full animate-spin-slow" />
        </div>
      </motion.div>

      {/* Click Waves */}
      <AnimatePresence>
        {clicks.map(click => (
          <motion.div
            key={click.id}
            initial={{ x: click.x, y: click.y, scale: 0, opacity: 1, borderWidth: 4 }}
            animate={{ scale: 4, opacity: 0, borderWidth: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="absolute -top-4 -left-4 w-8 h-8 rounded-full border border-blue-400 shadow-[0_0_20px_#3b82f6]"
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

// --- FLUID BACKGROUND (Simple SVG fallback for missing canvas code) ---
const HackerFluidBackground = () => (
  <div className="fixed inset-0 z-0 opacity-10 pointer-events-none">
    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="displacementFilter">
          <feTurbulence type="fractalNoise" baseFrequency="0.015 0.015" numOctaves="4" seed="0" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="50" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <radialGradient id="hackerGradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
          <stop offset="0%" style={{stopColor:'rgb(0,0,50)', stopOpacity:0.5}} />
          <stop offset="100%" style={{stopColor:'rgb(0,0,0)', stopOpacity:1}} />
        </radialGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#hackerGradient)" filter="url(#displacementFilter)" />
    </svg>
  </div>
);

// --- UserCard Component - Restored original look and audio effects ---
const UserCard = React.forwardRef(({ user, onClick, audio }, ref) => {
    const isSuspicious = user.status === 'suspicious';
    const isInGame = user.activity === 'Currently in-game';

    const [copied, setCopied] = React.useState(false);

  const copyId = (e) => {
    e.stopPropagation(); // Don't trigger inspection
    navigator.clipboard.writeText(user._id || user.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

    const handleCardClick = () => {
      audio.playSound('click');
      onClick(user);
    };

    return (
        <motion.div
            ref={ref} // Attach the ref here
            layout
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className={`
                bg-gray-900/60 p-3 rounded-lg shadow-lg border-2 transition-all duration-200 
                ${isSuspicious ? 'border-red-500 shadow-[0_0_15px_#dc2626]' : 'border-blue-700/50 hover:border-blue-400 shadow-[0_0_5px_#2563eb]'}
                hover:scale-[1.02] cursor-pointer relative overflow-hidden flex flex-col items-center text-center
            `}
            onClick={handleCardClick}
            onMouseEnter={() => audio.playSound('hover')} // Restored original hover sound
        >
            <div className="flex justify-between items-center mb-2 px-1 text-[10px] font-mono text-gray-500 uppercase tracking-widest border-b border-gray-800 pb-1">
              <span>UID: {user._id ? user._id.slice(-6) : user.id}</span>
              <button 
                onClick={copyId} 
                className="hover:text-blue-400 transition-colors"
                title="Copy Full ID"
              >
                {copied ? <Check size={10} className="text-green-500"/> : <Copy size={10}/>}
              </button>
            </div>
            <div className={`w-16 h-16 rounded-full border-4 mb-2 relative overflow-hidden ${isSuspicious ? 'border-red-500 shadow-[0_0_15px_#ef4444]' : 'border-blue-500/50 group-hover:border-blue-400'}`}>
                <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            </div>

            <div className="w-full min-w-0">
                <div className="flex justify-center items-center mb-1">
                    <h3 className="text-sm font-bold text-gray-100 font-mono tracking-wide truncate">
                        {user.name}
                    </h3>
                    {isSuspicious ? (
                        <AlertCircle size={16} className="text-red-500 animate-pulse ml-2" />
                    ) : (
                        <Wifi size={14} className="text-blue-500/50 ml-2" />
                    )}
                </div>
                <div className="flex items-center justify-center gap-2 text-[10px] font-mono">
                    <span className={`w-1.5 h-1.5 rounded-full ${isInGame ? 'bg-green-500 shadow-[0_0_5px_#22c55e]' : 'bg-yellow-500 shadow-[0_0_5px_#f59e0b]'}`}/>
                    <span className={`text-gray-400`}>{user.activity}</span>
                </div>
                <p className="text-[10px] mt-1 font-mono text-gray-500">{user.ping}ms</p>
            </div>
        </motion.div>
    );
});


// --- InspectionModal Component - Restored original look and audio effects ---
const InspectionModal = ({ user, onClose, onBan, onDismiss, audio }) => {
    const isSus = user.status === 'suspicious';
    const isBanning = useRef(false);

    const handleBanClick = () => {
        if (isBanning.current) return;
        isBanning.current = true;
        onBan(user.id);
        
        setTimeout(() => {
            onClose();
            isBanning.current = false;
        }, 500); 
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
            <motion.div
                initial={{ scale: 0.9, y: 50 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className={`relative w-full max-w-2xl p-6 rounded-xl shadow-2xl font-mono border-2 
                    ${isSus ? 'bg-red-950/90 border-red-700/50 shadow-[0_0_25px_rgba(220,38,38,0.5)]' : 'bg-blue-950/90 border-blue-700/50 shadow-[0_0_25px_rgba(37,99,235,0.5)]'}
                `}
            >
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition" onMouseEnter={() => audio.playSound('hover')}>
                    <Crosshair size={24} />
                </button>

                <div className="flex items-start mb-6">
                    <div className="relative mr-6">
                        <img src={user.avatar} alt={user.name} className="w-20 h-20 rounded-full border-4 border-blue-400 object-cover" />
                    </div>
                    
                    <div>
                        <h2 className={`text-3xl font-bold mb-1 ${isSus ? 'text-red-300' : 'text-white'}`}>{user.name}</h2>
                        <p className="text-sm text-gray-400 flex items-center gap-2">
                            {isSus ? <Skull size={18} className='text-red-500' /> : <ShieldCheck size={18} className='text-green-500' />}
                            BEHAVIOR STATUS: <span className={`uppercase font-extrabold ${isSus ? 'text-red-400' : 'text-green-400'}`}>{user.status.toUpperCase()}</span>
                        </p>
                        <p className="text-xs text-gray-500 mt-1">User Ping: {user.ping}ms</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 mb-6 border-y border-gray-700/50 bg-black/10">
                    {Object.entries(user.reportData).map(([k, v]) => (
                        <div key={k} className="bg-white/5 border border-white/10 p-2 hover:bg-white/10 transition-colors group">
                            <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1 group-hover:text-white transition-colors">{k}</div>
                            <div className="text-lg font-mono text-white">{v}</div>
                        </div>
                    ))}
                </div>

                {/* Reported By (Visual Consistency) */}
                {isSus && user.reportedBy.length > 0 && (
                    <div className="mb-8">
                        <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">Reported By {user.reportedBy.length} User(s):</div>
                        <div className="flex -space-x-3">
                            {user.reportedBy.map((src, i) => (
                                <img key={i} src={src} className="w-8 h-8 rounded-full border-2 border-black" alt="reporter" />
                            ))}
                        </div>
                    </div>
                )}


<div className="flex gap-4">
            {/* Dismiss Button */}
            <button 
                onClick={() => onDismiss(user._id || user.id)} // Pass the user's ID
                className="flex-1 py-3 bg-green-900/50 hover:bg-green-800 text-green-100 rounded-lg uppercase text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-lg border border-green-700"
            >
                <ShieldCheck size={18}/> Dismiss </button>
            
            {/* Ban Button */}
             <motion.button 
                    onClick={handleBanClick}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onMouseEnter={() => audio.playSound('hover')} // Restored original hover sound
                    className="w-full py-4 rounded-lg text-lg font-extrabold transition-all duration-150 flex items-center justify-center gap-3
                        bg-red-600 hover:bg-red-500 shadow-xl shadow-red-900/50 text-white border-b-4 border-red-800 uppercase tracking-widest
                    "
                >
                    <Skull size={20} /> Ban This User
                </motion.button>
        </div>

            </motion.div>
        </motion.div>
    );
};


// ----------------------------------------------------------------------
// --- 2. MAIN ADMIN PANEL COMPONENT (VIEW) ---
// ----------------------------------------------------------------------

export default function AdminPanel() {
  const audio = useScifiAudio();
  const [activeTab, setActiveTab] = useState('users'); // Navigation State

  // Call the Controller for state and handlers
  const {
    users, selectedUser, setSelectedUser,
    hasBooted, setHasBooted, uptime, banFlash,
    panelControls, handleBan, systemLoad,
handleDismiss,
  } = useAdminController(avatars, audio);

  const formatUptime = (s) => {
    const h = Math.floor(s / 3600).toString().padStart(2, '0');
    const m = Math.floor((s % 3600) / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${h}:${m}:${sec}`;
  };

  return (
    <div className="min-h-screen bg-black text-blue-100 font-sans overflow-hidden flex items-center justify-center relative cursor-none select-none">
      {/* --- LAYER 0: GLOBAL SYSTEMS --- */}
      <SciFiCursor />
      <HackerFluidBackground />
      
      {/* CRT Scanline Overlay - Restored feature */}
      <div className="pointer-events-none fixed inset-0 z-[10] opacity-[0.03] 
    bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] 
    bg-[length:100%_2px,3px_100%] animate-pulse-slow">
</div>

      {/* Ban Flash Overlay */}
      <AnimatePresence>
        {banFlash && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 0.4 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-red-600 mix-blend-overlay" 
          />
        )}
      </AnimatePresence>

      {/* Boot Sequence */}
      <AnimatePresence>
        {!hasBooted && (
          <motion.div 
            exit={{ opacity: 0, filter: "blur(20px)" }} 
            className="fixed inset-0 z-[200] bg-black flex items-center justify-center"
          >
            <motion.button 
              onClick={() => { audio.initAudio(); setHasBooted(true); }}
              onMouseEnter={() => audio.playSound('hover')}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-10 rounded-full border border-green-500/30 relative"
            >
              <Power size={64} className="text-green-500 animate-pulse" />
              <motion.div
                  className="absolute inset-0 border-4 rounded-full border-green-500/0"
                  animate={{ borderColor: ["rgba(20,250,20,0.5)", "rgba(20,250,20,0.0)"], scale: [1, 1.3] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Interface */}
      {hasBooted && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative z-10 w-full h-screen flex overflow-hidden">
          
          {/* SIDEBAR NAVIGATION (NEW) */}
          <aside className="w-64 bg-black/40 border-r border-gray-800 backdrop-blur-sm flex flex-col pt-6 z-20">
            <div className="px-6 pb-6 border-b border-gray-800">
                <div className="flex items-center gap-2 text-blue-400 mb-2">
                    <Terminal size={20} />
                    <span className="font-mono font-bold tracking-widest">POKEBATTLE_ADMIN</span>
                </div>
                <div className="text-[10px] text-gray-500 font-mono">SYS.VER.4.0.2</div>
            </div>

            <nav className="flex-1 p-4 space-y-2">
                <button 
                    onClick={() => { setActiveTab('users'); audio.playSound('select'); }}
                    onMouseEnter={() => audio.playSound('hover')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-mono text-xs uppercase tracking-wider ${activeTab === 'users' ? 'bg-blue-900/40 text-blue-200 border border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.3)]' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                >
                    <Users size={16} /> User Control
                </button>

                <button 
                    onClick={() => { setActiveTab('live'); audio.playSound('select'); }}
                    onMouseEnter={() => audio.playSound('hover')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-mono text-xs uppercase tracking-wider ${activeTab === 'live' ? 'bg-purple-900/40 text-purple-200 border border-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.3)]' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                >
                    <Activity size={16} /> Game Sessions
                </button>
                
                <button 
                    onClick={() => { setActiveTab('pokemon'); audio.playSound('select'); }}
                    onMouseEnter={() => audio.playSound('hover')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-mono text-xs uppercase tracking-wider ${activeTab === 'pokemon' ? 'bg-purple-900/40 text-purple-200 border border-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.3)]' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                >
                    <Gamepad2 size={16} /> Game Data
                </button>

                <button 
                    onClick={() => { setActiveTab('leaderboard'); audio.playSound('select'); }}
                    onMouseEnter={() => audio.playSound('hover')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-mono text-xs uppercase tracking-wider ${activeTab === 'leaderboard' ? 'bg-purple-900/40 text-purple-200 border border-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.3)]' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                >
                    <Trophy size={16} /> Leaderboard
                </button>

                <button 
                    onMouseEnter={() => audio.playSound('hover')}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 cursor-not-allowed font-mono text-xs uppercase tracking-wider opacity-50"
                >
                    <Database size={16} /> System Logs
                </button>
            </nav>

            <div className="p-6 border-t border-gray-800">
                <div className="text-[10px] text-gray-500 font-mono mb-1">UPTIME</div>
                <div className="text-xl font-mono text-green-500/80">{formatUptime(uptime)}</div>
            </div>
          </aside>


          {/* MAIN CONTENT AREA */}
          <main className="flex-1 relative overflow-hidden bg-black/20 p-6">
            <motion.div animate={panelControls} className="w-full h-full">
                
                {activeTab === 'users' && (
                    <div className="w-full h-full flex flex-col md:flex-row gap-6">
                        {/* LEFT: User Grid */}
                        <div className="flex-[3] bg-gray-950/80 border border-gray-800 rounded-2xl overflow-hidden flex flex-col relative z-10">
                        <div className="p-5 border-b border-gray-800 flex justify-between bg-black/20">
                            <div className="flex items-center gap-3"><Users className="text-blue-500" /><h1 className="font-mono text-white text-sm uppercase">Active Users</h1></div>
                        </div>
                        <div className="flex-1 p-5 overflow-y-auto scrollbar-hide"> 
                            <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-20">
                            <AnimatePresence mode='popLayout'>
                                {users.map(u => (
                                  <UserCard 
                                    key={u._id || u.id}  // Use MongoDB _id first, fallback to id
                                    user={u} 
                                    onClick={setSelectedUser} 
                                    audio={audio} 
                                  />
                                ))}
                            </AnimatePresence>
                            </motion.div>
                        </div>
                        </div>

                        {/* RIGHT: Stats */}
                        <div className="flex-1 flex flex-col gap-4 min-w-[300px]">
                            <div className="bg-gray-950/80 border border-gray-800 rounded-2xl p-6 h-full flex flex-col gap-6 relative z-10">
                                <div className="bg-blue-900/20 border border-blue-500/30 p-6 rounded-xl text-center">
                                    <Users className="mx-auto text-blue-400" />
                                    <div className="text-4xl font-mono text-white">{users.length}</div>
                                    <div className="text-[10px] uppercase text-blue-300">Total Users</div>
                                </div>
                                <div className="mt-auto">
                                    <div className="flex justify-between items-end mb-2">
                                        <span className="text-xs font-bold text-blue-400 uppercase flex items-center gap-2">
                                            <Activity size={14} className="animate-spin-slow" /> System Load
                                        </span>
                                        <span className="text-xl font-mono text-white">{systemLoad}%</span>
                                    </div>
                                    <div className="w-full h-3 bg-gray-900 rounded-full overflow-hidden border border-gray-700">
                                    <motion.div 
                                        className={`h-full ${parseFloat(systemLoad) > 80 ? 'bg-red-500 shadow-[0_0_10px_#ef4444]' : 'bg-blue-500 shadow-[0_0_10px_#3b82f6]'}`}
                                        animate={{ width: `${systemLoad}%` }}
                                        transition={{ type: "spring", stiffness: 50 }}
                                    />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'pokemon' && (
                    <div className="w-full h-full bg-gray-950/80 border border-gray-800 rounded-2xl overflow-hidden p-6 relative z-10">
                        <PokemonManager />
                    </div>
                )}

                {activeTab === 'leaderboard' && (
                  <motion.div key="leaderboard" className="max-w-4xl mx-auto">
                    <Leaderboard /> 
                  </motion.div>
                )}

                {activeTab === 'live' && (
                <motion.div key="live" className="space-y-6">
                  <div className="flex items-center gap-4 mb-8">
                    <Activity className="text-red-500 animate-pulse" size={32} />
                    <h2 className="text-3xl font-black italic uppercase">Current Game Sessions</h2>
                  </div>

                  <div className="grid gap-4">
                    {users.filter(u => u.status === 'battling').length === 0 ? (
                      <div className="text-gray-600 italic">No active combat sessions detected...</div>
                    ) : (
                      users.filter(u => u.status === 'battling').map(user => (
                        <div key={user.id} className="bg-red-900/10 border border-red-500/30 p-4 rounded-xl flex justify-between items-center group hover:border-red-500 transition-all">
                          <div className="flex items-center gap-4">
                            <div className="relative">
                              <img src={user.avatar} className="w-12 h-12 rounded-full border-2 border-red-500" />
                              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping" />
                            </div>
                            <div>
                              <h3 className="font-bold text-lg">{user.username}</h3>
                              <p className="text-xs text-red-400 font-mono uppercase tracking-tighter">
                                IN-COMBAT • PING: {user.ping}ms • ELO: {user.reportData.ELO}
                              </p>
                            </div>
                          </div>
                          <button 
                            // onClick={() => ()}
                            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded font-black text-xs uppercase shadow-[0_0_15px_rgba(220,38,38,0.4)]"
                          >
                            Terminate Session
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}

            </motion.div>
          </main>
        </motion.div>
      )}

      <AnimatePresence>
        {selectedUser && (
            <InspectionModal 
                user={selectedUser} 
                onClose={() => setSelectedUser(null)} 
                onBan={() => handleBan(selectedUser)} 
                onDismiss={handleDismiss}
                audio={audio} 
            />
        )}
      </AnimatePresence>
    </div>
  );
}