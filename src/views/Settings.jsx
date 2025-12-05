import { useState } from 'react';
import { useApp } from '../App';
import {
    Sun,
    Moon,
    Download,
    Trash2,
    RefreshCw,
    FileSpreadsheet,
    Info,
    Cloud
} from 'lucide-react';

function Settings() {
    const { theme, setTheme, files, currentFile, questions, progress, resetProgress } = useApp();
    const [showConfirmReset, setShowConfirmReset] = useState(false);

    const handleExportProgress = () => {
        const data = JSON.stringify(progress, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `progreso_${currentFile}_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleResetProgress = async () => {
        await resetProgress();
        window.location.reload();
    };

    const totalAnswered = Object.values(progress).filter(p => p.confianza_count > 0).length;
    const totalMarked = Object.values(progress).filter(p => p.marcada_para_repaso).length;

    return (
        <div className="fade-in">
            <header className="page-header">
                <h1 className="page-title">Configuración</h1>
                <p className="page-description">
                    Personaliza tu experiencia de estudio
                </p>
            </header>

            {/* Theme Section */}
            <div className="card" style={{ marginBottom: 24 }}>
                <h3 className="card-title" style={{ marginBottom: 16 }}>Apariencia</h3>

                <div style={{ display: 'flex', gap: 12 }}>
                    <button
                        className={`btn ${theme === 'light' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setTheme('light')}
                        style={{ flex: 1, padding: 16 }}
                    >
                        <Sun size={20} />
                        <span>Modo Claro</span>
                    </button>
                    <button
                        className={`btn ${theme === 'dark' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setTheme('dark')}
                        style={{ flex: 1, padding: 16 }}
                    >
                        <Moon size={20} />
                        <span>Modo Oscuro</span>
                    </button>
                </div>
            </div>

            {/* Files Section */}
            <div className="card" style={{ marginBottom: 24 }}>
                <h3 className="card-title" style={{ marginBottom: 16 }}>Archivos Cargados</h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {files.map(file => (
                        <div
                            key={file.name}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12,
                                padding: 12,
                                backgroundColor: file.name === currentFile ? 'var(--accent-light)' : 'var(--bg-secondary)',
                                borderRadius: 'var(--radius-md)',
                                border: file.name === currentFile ? '1px solid var(--accent)' : '1px solid transparent'
                            }}
                        >
                            <FileSpreadsheet size={20} style={{ color: 'var(--accent)' }} />
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 500 }}>{file.name.replace('.xlsx', '')}</div>
                                <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                                    {file.name}
                                </div>
                            </div>
                            {file.name === currentFile && (
                                <span style={{
                                    padding: '4px 8px',
                                    backgroundColor: 'var(--accent)',
                                    color: 'white',
                                    borderRadius: 4,
                                    fontSize: 11,
                                    fontWeight: 500
                                }}>
                                    Activo
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Progress Section */}
            <div className="card" style={{ marginBottom: 24 }}>
                <h3 className="card-title" style={{ marginBottom: 16 }}>Progreso</h3>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 16,
                    marginBottom: 24
                }}>
                    <div style={{ textAlign: 'center', padding: 16, backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                        <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--accent)' }}>
                            {questions.length}
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Total preguntas</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: 16, backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                        <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--success)' }}>
                            {totalAnswered}
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Respondidas</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: 16, backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                        <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--warning)' }}>
                            {totalMarked}
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Marcadas</div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                    <button
                        className="btn btn-secondary"
                        onClick={handleExportProgress}
                        style={{ flex: 1 }}
                    >
                        <Download size={18} />
                        Exportar Progreso
                    </button>
                    <button
                        className="btn btn-secondary"
                        onClick={() => setShowConfirmReset(true)}
                        style={{ color: 'var(--danger)' }}
                    >
                        <Trash2 size={18} />
                        Reiniciar
                    </button>
                </div>
            </div>

            {/* Confirm Reset Modal */}
            {showConfirmReset && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div className="card" style={{ maxWidth: 400, textAlign: 'center' }}>
                        <Trash2 size={48} style={{ color: 'var(--danger)', marginBottom: 16 }} />
                        <h3 style={{ marginBottom: 8 }}>¿Reiniciar progreso?</h3>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
                            Esta acción eliminará todo tu progreso para "{currentFile?.replace('.xlsx', '')}".
                            No se puede deshacer.
                        </p>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <button
                                className="btn btn-secondary"
                                onClick={() => setShowConfirmReset(false)}
                                style={{ flex: 1 }}
                            >
                                Cancelar
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={() => {
                                    handleResetProgress();
                                    setShowConfirmReset(false);
                                }}
                                style={{ flex: 1, backgroundColor: 'var(--danger)' }}
                            >
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Keyboard Shortcuts */}
            <div className="card" style={{ marginBottom: 24 }}>
                <h3 className="card-title" style={{ marginBottom: 16 }}>Atajos de Teclado</h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                    {[
                        { key: '← / →', desc: 'Navegar entre preguntas' },
                        { key: 'Espacio', desc: 'Mostrar respuesta / Siguiente' },
                        { key: 'Enter', desc: 'Mostrar respuesta' },
                        { key: '1-5', desc: 'Seleccionar confianza' },
                    ].map(shortcut => (
                        <div
                            key={shortcut.key}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12,
                                padding: 12,
                                backgroundColor: 'var(--bg-secondary)',
                                borderRadius: 'var(--radius-md)'
                            }}
                        >
                            <code style={{
                                padding: '4px 8px',
                                backgroundColor: 'var(--bg-tertiary)',
                                borderRadius: 4,
                                fontSize: 12,
                                fontFamily: 'var(--font-mono)'
                            }}>
                                {shortcut.key}
                            </code>
                            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                                {shortcut.desc}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* About */}
            <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Info size={20} style={{ color: 'var(--accent)' }} />
                    <div>
                        <div style={{ fontWeight: 500 }}>FAQ Study App</div>
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                            Aplicación de estudio para Ingeniería Sanitaria • v1.0.0
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Settings;
