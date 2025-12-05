import { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  Target,
  Timer,
  Settings,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';
import './index.css';

// Data imports
import modulosData from './data/modulos.json';
import sanitariaData from './data/sanitaria.json';

// Supabase
import { loadProgress, updateProgress as updateProgressDB, resetProgress } from './supabase';

// Views
import Dashboard from './views/Dashboard';
import Study from './views/Study';
import Review from './views/Review';
import Exam from './views/Exam';
import SettingsView from './views/Settings';

// Context
const AppContext = createContext();
export function useApp() {
  return useContext(AppContext);
}

// Normalize column names
function normalizeQuestion(q, index) {
  return {
    numero: q['N°'] || q.numero || q.N || index + 1,
    seccion: q['Sección'] || q.seccion || q.Seccion || '',
    tema: q['Tema'] || q.tema || '',
    pregunta: q['Pregunta'] || q.pregunta || '',
    respuesta_super_corta: q['Respuesta super corta'] || q.respuesta_super_corta || '',
    respuesta_corta: q['Respuesta corta'] || q.respuesta_corta || '',
    respuesta_normal: q['Respuesta normal'] || q.respuesta_normal || ''
  };
}

// File configurations
const FILES = {
  'FAQs_Modulos_P3': {
    name: 'FAQs Módulos P3',
    data: modulosData.map((q, i) => normalizeQuestion(q, i)),
    color: '#2E7D32'
  },
  'FAQs_Sanitaria_P3': {
    name: 'FAQs Sanitaria P3',
    data: sanitariaData.map((q, i) => normalizeQuestion(q, i)),
    color: '#4472C4'
  }
};

// Theme Toggle
function ThemeToggle({ theme, setTheme }) {
  return (
    <button
      className="theme-toggle"
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
    >
      {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
    </button>
  );
}

// Sidebar
function Sidebar({ collapsed, setCollapsed, currentFile, setCurrentFile, isMobile, closeMobile }) {
  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/study', icon: BookOpen, label: 'Estudio' },
    { path: '/review', icon: Target, label: 'Repaso' },
    { path: '/exam', icon: Timer, label: 'Examen' },
    { path: '/settings', icon: Settings, label: 'Config' },
  ];

  return (
    <>
      {isMobile && !collapsed && (
        <div className="sidebar-overlay" onClick={closeMobile} />
      )}
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${isMobile ? 'mobile' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">S</div>
          {!collapsed && <span className="sidebar-title">Study App</span>}
          <button
            className="btn btn-ghost btn-icon"
            onClick={() => isMobile ? closeMobile() : setCollapsed(!collapsed)}
            style={{ marginLeft: 'auto' }}
          >
            {isMobile ? <X size={18} /> : (collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />)}
          </button>
        </div>

        {!collapsed && (
          <div className="file-selector">
            <select
              value={currentFile}
              onChange={(e) => setCurrentFile(e.target.value)}
            >
              {Object.entries(FILES).map(([key, file]) => (
                <option key={key} value={key}>{file.name}</option>
              ))}
            </select>
          </div>
        )}

        <nav className="sidebar-nav">
          <div className="nav-section">
            {!collapsed && <div className="nav-section-title">Navegación</div>}
            {navItems.map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => isMobile && closeMobile()}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              >
                <item.icon size={18} />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            ))}
          </div>
        </nav>
      </aside>
    </>
  );
}

// Mobile Header
function MobileHeader({ openSidebar }) {
  return (
    <header className="mobile-header">
      <button className="btn btn-ghost btn-icon" onClick={openSidebar}>
        <Menu size={24} />
      </button>
      <span className="mobile-title">Study App</span>
    </header>
  );
}

// Main App
function AppContent() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [currentFile, setCurrentFile] = useState('FAQs_Modulos_P3');
  const [questions, setQuestions] = useState([]);
  const [progress, setProgress] = useState({});
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Detect mobile
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Load questions and progress when file changes
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const fileData = FILES[currentFile];
        setQuestions(fileData.data);

        const savedProgress = await loadProgress(currentFile);
        setProgress(savedProgress);
      } catch (error) {
        console.error('Error loading:', error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [currentFile]);

  // Update progress
  const handleUpdateProgress = async (questionId, data) => {
    try {
      const updated = await updateProgressDB(currentFile, questionId, data);
      if (updated) {
        setProgress(prev => ({
          ...prev,
          [questionId]: updated
        }));
      }
      return updated;
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  // Reset progress
  const handleResetProgress = async () => {
    try {
      await resetProgress(currentFile);
      setProgress({});
    } catch (error) {
      console.error('Error resetting progress:', error);
    }
  };

  const contextValue = {
    files: Object.keys(FILES).map(k => ({ name: k, ...FILES[k] })),
    currentFile,
    setCurrentFile,
    questions,
    progress,
    updateProgress: handleUpdateProgress,
    resetProgress: handleResetProgress,
    loading,
    theme,
    setTheme,
  };

  return (
    <AppContext.Provider value={contextValue}>
      <div className="app-layout">
        {isMobile && <MobileHeader openSidebar={() => setMobileOpen(true)} />}
        <Sidebar
          collapsed={isMobile ? !mobileOpen : collapsed}
          setCollapsed={setCollapsed}
          currentFile={currentFile}
          setCurrentFile={setCurrentFile}
          isMobile={isMobile}
          closeMobile={() => setMobileOpen(false)}
        />
        <main className={`main-content ${isMobile ? 'mobile' : ''}`}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/study" element={<Study />} />
            <Route path="/review" element={<Review />} />
            <Route path="/exam" element={<Exam />} />
            <Route path="/settings" element={<SettingsView />} />
          </Routes>
        </main>
        <ThemeToggle theme={theme} setTheme={setTheme} />
      </div>
    </AppContext.Provider>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
