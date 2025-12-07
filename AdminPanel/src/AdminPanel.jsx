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
  Wifi
} from 'lucide-react';

// --- ADVANCED AUDIO ENGINE (WebAudio API) ---
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

  // FM Synthesis for sci-fi texture
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
        // FM Modulation for "buzz"
        mod.frequency.value = 50;
        modGain.gain.value = 500;
        mod.connect(modGain);
        modGain.connect(osc.frequency);
        mod.start(t);
        
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.linearRampToValueAtTime(0, t + 0.3);
        osc.start(t);
        osc.stop(t + 0.3);
        break;

      case 'ban':
        // Heavy impact sound
        osc.type = 'square';
        osc.frequency.setValueAtTime(200, t);
        osc.frequency.exponentialRampToValueAtTime(50, t + 0.6);
        gain.gain.setValueAtTime(0.5, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
        osc.start(t);
        osc.stop(t + 0.6);
        break;
      
      case 'spawn':
        // Digital materialize sound
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

// --- CUSTOM CURSOR ---
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

// --- FLUID BACKGROUND (Enhanced Brightness) ---
const HackerFluidBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let w = canvas.width = window.innerWidth;
    let h = canvas.height = window.innerHeight;
    
    const chars = "XYZ@#&01";
    const particles = Array.from({ length: 120 }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: 0, vy: 0,
        char: chars[Math.floor(Math.random() * chars.length)]
    }));

    const render = (time) => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.08)'; // Slightly more trail clearing for brightness
      ctx.fillRect(0, 0, w, h);
      ctx.font = '14px monospace';

      particles.forEach(p => {
        // Navier-Stokes-ish Flow Field approximation
        const angle = (Math.sin(p.x * 0.003 + time * 0.0001) + Math.cos(p.y * 0.003)) * Math.PI * 2;
        p.vx += Math.cos(angle) * 0.15;
        p.vy += Math.sin(angle) * 0.15;
        p.vx *= 0.94; p.vy *= 0.94; // Friction
        p.x += p.vx + 0.2; p.y += p.vy;

        if(p.x < 0) p.x = w; if(p.x > w) p.x = 0;
        if(p.y < 0) p.y = h; if(p.y > h) p.y = 0;

        // Brightness calculation based on velocity
        const speed = Math.sqrt(p.vx*p.vx + p.vy*p.vy);
        const alpha = Math.min(1, speed * 0.5 + 0.3);
        
        ctx.shadowBlur = 15;
        ctx.shadowColor = `rgba(0, 255, 100, ${alpha})`;
        ctx.fillStyle = `rgba(150, 255, 150, ${alpha})`; // Brighter Green
        ctx.fillText(p.char, p.x, p.y);
        ctx.shadowBlur = 0;
      });

      animationFrameId = requestAnimationFrame(() => render(Date.now()));
    };
    render(0);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 z-0 opacity-60 pointer-events-none" />;
};

// --- DATA UTILS ---
const avatars = [
  "https://i.pravatar.cc/150?u=a", "https://i.pravatar.cc/150?u=b", 
  "https://i.pravatar.cc/150?u=c", "https://i.pravatar.cc/150?u=d"
];

const generateUser = (idOverride = null) => {
  const id = idOverride || Date.now();
  const isSuspicious = Math.random() < 0.3; 
  
  // Revised Status strings based on Design
  const activities = ["Currently in-game", "AFK (Away)", "AFK (In-Lobby)"];
  const activity = activities[Math.floor(Math.random() * activities.length)];

  return {
    id,
    // Revised Name format "User #XXXXXX"
    name: `User #${Math.floor(100000 + Math.random() * 900000)}`,
    status: isSuspicious ? "suspicious" : "safe",
    activity: activity,
    ping: Math.floor(Math.random() * 80) + 10,
    avatar: `https://i.pravatar.cc/150?u=${id}`,
    // Reported By logic for suspicious users
    reportedBy: isSuspicious ? Array.from({length: Math.floor(Math.random()*3)+1}, () => avatars[Math.floor(Math.random()*avatars.length)]) : [],
    // Revised Report Data matching Modal Design
    reportData: {
        "Wins": Math.floor(Math.random() * 5000),
        "Losses": Math.floor(Math.random() * 100),
        "ELO": Math.random() > 0.9 ? "999+" : Math.floor(1000 + Math.random() * 2000),
        "Playtime": `${Math.floor(Math.random() * 100)}H ${Math.floor(Math.random() * 60)}M`,
        "Joined": new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toLocaleDateString()
    }
  };
};

const generateMockUsers = (count = 12) => {
  return Array.from({ length: count }, (_, i) => generateUser(i));
};

// --- UI COMPONENTS ---

const GlitchText = ({ text, className, trigger }) => (
  <span className={`relative inline-block ${className} group overflow-hidden`}>
    <span className="relative z-10">{text}</span>
    <span className="absolute top-0 left-0 -z-10 w-full h-full text-red-500 opacity-50 animate-pulse translate-x-[2px] mix-blend-screen">
      {text}
    </span>
    <span className="absolute top-0 left-0 -z-10 w-full h-full text-blue-500 opacity-50 animate-pulse -translate-x-[2px] mix-blend-screen">
      {text}
    </span>
  </span>
);

const UserCard = ({ user, onClick, audio }) => {
  const isSuspicious = user.status === 'suspicious';
  const isInGame = user.activity === "Currently in-game";
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0, transition: { duration: 0.2 } }}
      whileHover={{ scale: 1.03, x: 5, boxShadow: isSuspicious ? "0 0 25px rgba(220,38,38,0.4)" : "0 0 20px rgba(59,130,246,0.3)" }}
      whileTap={{ scale: 0.96 }}
      onMouseEnter={() => audio.playSound('hover')}
      onClick={() => { audio.playSound('click'); onClick(user); }}
      className={`
        relative p-4 rounded-xl border cursor-none backdrop-blur-md transition-all duration-200 group
        ${isSuspicious 
          ? 'bg-red-950/40 border-red-500/60' 
          : 'bg-gray-900/60 border-gray-700/50 hover:border-blue-400/80'}
      `}
    >
      <div className="flex items-start gap-4">
        {/* Avatar with Halo */}
        <div className={`relative w-12 h-12 rounded-full overflow-hidden border-2 ${isSuspicious ? 'border-red-500 shadow-[0_0_15px_#ef4444]' : 'border-blue-500/50 group-hover:border-blue-400'}`}>
           <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" />
           <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center mb-1">
            <h3 className="text-sm font-bold text-gray-100 font-mono tracking-wide truncate">
                {user.name}
            </h3>
            {isSuspicious ? (
                <AlertCircle size={16} className="text-red-500 animate-pulse" />
            ) : (
                <Wifi size={14} className="text-blue-500/50" />
            )}
          </div>
          
          <div className="flex items-center gap-2 text-[10px] font-mono">
            <span className={`w-1.5 h-1.5 rounded-full ${isInGame ? 'bg-green-500 shadow-[0_0_5px_#22c55e]' : 'bg-yellow-500'}`}></span>
            <span className={isInGame ? "text-green-400" : "text-yellow-500"}>{user.activity}</span>
          </div>

          {/* Reported By Section for Suspicious Users */}
          {isSuspicious && user.reportedBy.length > 0 && (
              <div className="mt-3 flex items-center gap-2 bg-red-900/20 p-1.5 rounded border border-red-500/20">
                  <span className="text-[9px] text-red-300 uppercase tracking-tighter">Reported By:</span>
                  <div className="flex -space-x-2">
                      {user.reportedBy.map((src, i) => (
                          <img key={i} src={src} className="w-4 h-4 rounded-full border border-red-900" alt="reporter" />
                      ))}
                  </div>
              </div>
          )}
        </div>
      </div>
      
      {/* Corner Deco */}
      <div className={`absolute top-0 right-0 p-1 ${isSuspicious ? 'text-red-500/20' : 'text-blue-500/10'}`}>
          <Scan size={40} />
      </div>
    </motion.div>
  );
};

const InspectionModal = ({ user, onClose, onBan, audio }) => {
  const isSus = user.status === 'suspicious';
  
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
      />
      
      <motion.div 
        initial={{ scaleY: 0.1, scaleX: 0.1, opacity: 0 }}
        animate={{ scaleY: 1, scaleX: 1, opacity: 1 }}
        exit={{ scaleY: 0, opacity: 0 }}
        transition={{ type: "spring", bounce: 0.3 }}
        className={`relative w-full max-w-md bg-black border-2 rounded-xl overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)] 
            ${isSus ? 'border-red-500 shadow-red-900/40' : 'border-blue-500 shadow-blue-900/40'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Animated Grid Lines */}
        <div className="absolute inset-0 bg-[size:20px_20px] bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] pointer-events-none" />

        <div className="p-8 relative z-10">
            <div className="flex items-center gap-4 mb-8">
                <div className={`w-24 h-24 rounded border-4 shadow-xl overflow-hidden ${isSus ? 'border-red-600' : 'border-blue-500'}`}>
                    <img src={user.avatar} className="w-full h-full object-cover" />
                </div>
                <div>
                    <h2 className="text-3xl font-black text-white font-mono uppercase tracking-tighter">{user.name}</h2>
                    <div className="flex items-center gap-2 mt-2">
                        <div className={`px-2 py-0.5 text-[10px] font-bold rounded ${isSus ? 'bg-red-600 text-black' : 'bg-blue-600 text-black'}`}>
                            ID: {user.id.toString().slice(-6)}
                        </div>
                        <span className={`text-xs tracking-widest uppercase ${isSus ? 'text-red-400 animate-pulse' : 'text-blue-400'}`}>
                            {isSus ? '/// THREAT DETECTED ///' : '/// VERIFIED USER ///'}
                        </span>
                    </div>
                    <div className="mt-2 text-xs text-gray-400 font-mono">
                         {user.activity}
                    </div>
                </div>
            </div>

            {/* Data Grid */}
            <div className="grid grid-cols-2 gap-4 mb-8">
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
                    <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">Reported By</div>
                    <div className="flex -space-x-3">
                        {user.reportedBy.map((src, i) => (
                            <img key={i} src={src} className="w-8 h-8 rounded-full border-2 border-black" alt="reporter" />
                        ))}
                    </div>
                </div>
            )}

            <div className="flex gap-4">
                <motion.button 
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onMouseEnter={() => audio.playSound('hover')}
                    onClick={() => { onBan(user.id); }}
                    className="flex-1 bg-red-600 hover:bg-red-500 text-black font-bold py-4 flex items-center justify-center gap-2 clip-path-polygon hover:shadow-[0_0_20px_#ef4444]"
                    style={{ clipPath: "polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)" }}
                >
                    <Skull size={20} />
                    <span>BAN USER</span>
                </motion.button>
                <motion.button 
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onMouseEnter={() => audio.playSound('hover')}
                    onClick={onClose}
                    className="flex-1 border border-white/20 hover:bg-white/10 text-white font-bold py-4 flex items-center justify-center gap-2"
                >
                    CLOSE
                </motion.button>
            </div>
        </div>
      </motion.div>
    </div>
  );
};

// --- MAIN APP ---

export default function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [hasBooted, setHasBooted] = useState(false);
  const [uptime, setUptime] = useState(0);
  const [banFlash, setBanFlash] = useState(false);
  
  // Controls for the main panel shaking effect
  const panelControls = useAnimation();
  const audio = useScifiAudio();

  // Initialize
  useEffect(() => {
    setUsers(generateMockUsers(14));
    
    // Uptime Counter
    const interval = setInterval(() => {
        setUptime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Real-time System Load Calculation
  const systemLoad = users.length > 0 
    ? (35 + (users.filter(u => u.status === 'suspicious').length / users.length) * 55 + (Math.sin(Date.now() / 1000) * 2)).toFixed(2)
    : "0.00";

  const handleBan = async (id) => {
    // 1. Audio Effect
    audio.playSound('ban');
    
    // 2. Global Flash Red
    setBanFlash(true);
    setTimeout(() => setBanFlash(false), 300);

    // 3. UI Jolt
    panelControls.start({
        x: [0, -10, 10, -5, 5, 0],
        y: [0, -5, 5, -2, 2, 0],
        transition: { duration: 0.4 }
    });

    // 4. Remove User
    setSelectedUser(null);
    setUsers(prev => prev.filter(u => u.id !== id));

    // 5. Replenish User (Auto-fill gap)
    setTimeout(() => {
        audio.playSound('spawn');
        setUsers(prev => {
            const newUsers = [...prev, generateUser()];
            // Shuffle slightly to make it look like "reorganizing"
            return newUsers.sort(() => Math.random() - 0.5); 
        });
    }, 800);
  };

  const formatUptime = (seconds) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  return (
    <div className="min-h-screen bg-black text-blue-100 font-sans overflow-hidden flex items-center justify-center relative cursor-none select-none">
      
      {/* --- LAYER 0: GLOBAL SYSTEMS --- */}
      <SciFiCursor />
      <HackerFluidBackground />
      
      {/* CRT Scanline Overlay */}
      <div className="pointer-events-none fixed inset-0 z-50 mix-blend-overlay opacity-30 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
      <div className="pointer-events-none fixed inset-0 z-50 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,6px_100%]" />

      {/* Global Ban Flash */}
      <AnimatePresence>
        {banFlash && (
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] bg-red-600 mix-blend-overlay"
            />
        )}
      </AnimatePresence>

      {/* --- LAYER 1: BOOT SEQUENCE --- */}
      <AnimatePresence>
        {!hasBooted && (
            <motion.div 
                exit={{ opacity: 0, filter: "blur(20px)", scale: 1.1 }}
                className="fixed inset-0 z-[200] bg-black flex items-center justify-center"
            >
                <div className="text-center cursor-none">
                    <motion.button 
                        whileHover={{ scale: 1.1, textShadow: "0 0 20px #22c55e" }}
                        className="p-10 rounded-full border border-green-500/30 group relative mb-8"
                        onClick={() => { audio.initAudio(); setHasBooted(true); }}
                    >
                         <Power size={64} className="text-green-500 animate-pulse" />
                         <div className="absolute inset-0 rounded-full border-t-2 border-green-400 animate-spin" />
                    </motion.button>
                    <div className="font-mono text-green-500 tracking-[0.5em] text-sm animate-pulse">SYSTEM START</div>
                </div>
            </motion.div>
        )}
      </AnimatePresence>

      {/* --- LAYER 2: MAIN INTERFACE --- */}
      <AnimatePresence>
        {hasBooted && (
          <motion.div 
            // Intro Reveal
            initial={{ height: 2, opacity: 0 }}
            animate={{ height: "85vh", opacity: 1 }}
            transition={{ duration: 1, ease: "easeInOut" }}
            className="relative z-10 w-full max-w-7xl flex gap-6 p-4"
          >
              {/* SHAKE WRAPPER */}
              <motion.div 
                animate={panelControls}
                className="w-full h-full flex flex-col md:flex-row gap-6"
              >
                
                {/* LEFT: GRID */}
                <div className="flex-[3] flex flex-col bg-gray-950/80 backdrop-blur-xl border border-gray-800 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] relative">
                    {/* Header */}
                    <div className="p-5 border-b border-gray-800 flex justify-between items-center bg-black/20">
                        <div className="flex items-center gap-3">
                            <Terminal className="text-blue-500" />
                            <h1 className="text-xl font-bold font-mono tracking-tight text-white uppercase">Admin Panel</h1>
                        </div>
                        <div className="flex items-center gap-4 text-xs font-mono text-gray-400">
                             <span className="flex items-center gap-2">
                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"/>
                                {formatUptime(uptime)}
                             </span>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-5 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-blue-900/50">
                        <motion.div 
                            layout
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                        >
                            <AnimatePresence mode='popLayout'>
                                {users.map(user => (
                                    <UserCard key={user.id} user={user} onClick={setSelectedUser} audio={audio} />
                                ))}
                            </AnimatePresence>
                        </motion.div>
                    </div>
                </div>

                {/* RIGHT: STATS */}
                <div className="flex-1 flex flex-col gap-4 min-w-[320px]">
                    <div className="bg-gray-950/80 backdrop-blur-xl border border-gray-800 rounded-2xl p-6 h-full shadow-2xl flex flex-col gap-6 relative overflow-hidden">
                        
                        {/* Decorative background grid in stats */}
                        <div className="absolute inset-0 bg-[linear-gradient(0deg,transparent_24%,rgba(59,130,246,0.05)_25%,rgba(59,130,246,0.05)_26%,transparent_27%,transparent_74%,rgba(59,130,246,0.05)_75%,rgba(59,130,246,0.05)_76%,transparent_77%,transparent),linear-gradient(90deg,transparent_24%,rgba(59,130,246,0.05)_25%,rgba(59,130,246,0.05)_26%,transparent_27%,transparent_74%,rgba(59,130,246,0.05)_75%,rgba(59,130,246,0.05)_76%,transparent_77%,transparent)] bg-[length:30px_30px]" />

                        <motion.div 
                            whileHover={{ scale: 1.02 }}
                            onMouseEnter={() => audio.playSound('hover')}
                            className="bg-blue-900/20 border border-blue-500/30 p-6 rounded-xl text-center relative overflow-hidden"
                        >
                            <Users className="mx-auto mb-2 text-blue-400" />
                            <div className="text-4xl font-mono font-bold text-white">{users.length}</div>
                            <div className="text-[10px] uppercase tracking-[0.3em] text-blue-300">Currently players online</div>
                        </motion.div>

                        <motion.div 
                            whileHover={{ scale: 1.02 }}
                            onMouseEnter={() => audio.playSound('hover')}
                            className="bg-red-900/10 border border-red-500/30 p-6 rounded-xl text-center relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-2 animate-pulse"><AlertCircle size={16} className="text-red-500"/></div>
                            <UserX className="mx-auto mb-2 text-red-400" />
                            <div className="text-4xl font-mono font-bold text-white">{users.filter(u => u.status === 'suspicious').length}</div>
                            <div className="text-[10px] uppercase tracking-[0.3em] text-red-300">Players Suspicious</div>
                        </motion.div>

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

              </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedUser && (
            <InspectionModal 
                user={selectedUser} 
                onClose={() => setSelectedUser(null)} 
                onBan={handleBan} 
                audio={audio} 
            />
        )}
      </AnimatePresence>

    </div>
  );
}