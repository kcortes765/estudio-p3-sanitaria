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

// Data imports (default sets)
import modulosData from './data/modulos.json';
import sanitariaData from './data/sanitaria.json';

// Supabase
import {
  loadProgress,
  updateProgress as updateProgressDB,
  resetProgress,
  loadQuestionSets,
  loadQuestionSet,
  saveQuestionSet,
  deleteQuestionSet
} from './supabase';

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

// Normalize column names from XLSX
function normalizeQuestion(q, index) {
  return {
    numero: q['N°'] || q.numero || q.N || q['Nº'] || index + 1,
    seccion: q['Sección'] || q.seccion || q.Seccion || q.SECCION || '',
    tema: q['Tema'] || q.tema || q.TEMA || '',
    pregunta: q['Pregunta'] || q.pregunta || q.PREGUNTA || '',
    respuesta_super_corta: q['Respuesta super corta'] || q.respuesta_super_corta || q['Respuesta Super Corta'] || '',
    respuesta_corta: q['Respuesta corta'] || q.respuesta_corta || q['Respuesta Corta'] || '',
    respuesta_normal: q['Respuesta normal'] || q.respuesta_normal || q['Respuesta Normal'] || ''
  };
}

// Default built-in sets
const DEFAULT_SETS = {
  'modulos_p3': {
    id: 'modulos_p3',
    name: 'FAQs Módulos P3',
    questions: modulosData.map((q, i) => normalizeQuestion(q, i)),
    isBuiltIn: true
  },
  'sanitaria_p3': {
    id: 'sanitaria_p3',
    name: 'FAQs Sanitaria P3',
    questions: sanitariaData.map((q, i) => normalizeQuestion(q, i)),
    isBuiltIn: true
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
function Sidebar({ collapsed, setCollapsed, files, currentFile, setCurrentFile, isMobile, closeMobile }) {
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

        {!collapsed && files.length > 0 && (
          <div className="file-selector">
            <select
              value={currentFile}
              onChange={(e) => setCurrentFile(e.target.value)}
            >
              {files.map(f => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.questions?.length || '?'})
                </option>
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
  const [files, setFiles] = useState([]);
  const [currentFile, setCurrentFile] = useState('');
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

  // Load all question sets on mount
  useEffect(() => {
    async function loadAllSets() {
      setLoading(true);
      try {
        // Load custom sets from Supabase
        const customSets = await loadQuestionSets();

        // Combine defaults + custom
        const allFiles = [
          ...Object.values(DEFAULT_SETS),
          ...customSets.map(s => ({ ...s, isBuiltIn: false }))
        ];

        setFiles(allFiles);

        // Set default selection
        const savedFile = localStorage.getItem('currentFile');
        if (savedFile && allFiles.find(f => f.id === savedFile)) {
          setCurrentFile(savedFile);
        } else if (allFiles.length > 0) {
          setCurrentFile(allFiles[0].id);
        }
      } catch (error) {
        console.error('Error loading sets:', error);
        setFiles(Object.values(DEFAULT_SETS));
        setCurrentFile('modulos_p3');
      } finally {
        setLoading(false);
      }
    }
    loadAllSets();
  }, []);

  // Load questions when file changes
  useEffect(() => {
    async function loadCurrentSet() {
      if (!currentFile) return;
      setLoading(true);

      try {
        localStorage.setItem('currentFile', currentFile);

        // Check if it's a built-in set
        const builtIn = DEFAULT_SETS[currentFile];
        if (builtIn) {
          setQuestions(builtIn.questions);
        } else {
          // Load from Supabase
          const set = await loadQuestionSet(currentFile);
          if (set) {
            const normalized = set.questions.map((q, i) => normalizeQuestion(q, i));
            setQuestions(normalized);
          }
        }

        // Load progress
        const savedProgress = await loadProgress(currentFile);
        setProgress(savedProgress);
      } catch (error) {
        console.error('Error loading:', error);
      } finally {
        setLoading(false);
      }
    }
    loadCurrentSet();
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

  // Add new question set
  const addQuestionSet = async (name, questionsData) => {
    const id = 'set_' + Date.now();
    const normalized = questionsData.map((q, i) => normalizeQuestion(q, i));

    const saved = await saveQuestionSet(id, name, normalized);
    if (saved) {
      const newSet = { id, name, questions: normalized, isBuiltIn: false };
      setFiles(prev => [...prev, newSet]);
      setCurrentFile(id);
      return true;
    }
    return false;
  };

  // Delete question set
  const removeQuestionSet = async (id) => {
    const success = await deleteQuestionSet(id);
    if (success) {
      setFiles(prev => prev.filter(f => f.id !== id));
      if (currentFile === id) {
        setCurrentFile(files[0]?.id || 'modulos_p3');
      }
      return true;
    }
    return false;
  };

  // Refresh file list
  const refreshFiles = async () => {
    const customSets = await loadQuestionSets();
    const allFiles = [
      ...Object.values(DEFAULT_SETS),
      ...customSets.map(s => ({ ...s, isBuiltIn: false }))
    ];
    setFiles(allFiles);
  };

  const contextValue = {
    files,
    currentFile,
    setCurrentFile,
    questions,
    progress,
    updateProgress: handleUpdateProgress,
    resetProgress: handleResetProgress,
    addQuestionSet,
    removeQuestionSet,
    refreshFiles,
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
          files={files}
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
