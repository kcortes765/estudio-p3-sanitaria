import { useState, useRef } from 'react';
import { useApp } from '../App';
import {
    Sun,
    Moon,
    Download,
    Trash2,
    FileSpreadsheet,
    Info,
    Upload,
    Plus,
    X,
    Cloud,
    Check
} from 'lucide-react';
import * as XLSX from 'xlsx';

function Settings() {
    const {
        theme, setTheme, files, currentFile, questions, progress,
        resetProgress, addQuestionSet, removeQuestionSet
    } = useApp();

    const [showConfirmReset, setShowConfirmReset] = useState(false);
    const [showUpload, setShowUpload] = useState(false);
    const [uploadName, setUploadName] = useState('');
    const [uploadData, setUploadData] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const fileInputRef = useRef(null);

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
        setShowConfirmReset(false);
        window.location.reload();
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = new Uint8Array(event.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(sheet);

                setUploadData(jsonData);
                setUploadName(file.name.replace('.xlsx', '').replace('.xls', ''));
                setShowUpload(true);
            } catch (error) {
                console.error('Error reading file:', error);
                alert('Error al leer el archivo. Asegúrate de que sea un archivo XLSX válido.');
            }
        };
        reader.readAsArrayBuffer(file);
        e.target.value = '';
    };

    const handleUpload = async () => {
        if (!uploadData || !uploadName.trim()) return;

        setUploading(true);
        try {
            const success = await addQuestionSet(uploadName.trim(), uploadData);
            if (success) {
                setShowUpload(false);
                setUploadData(null);
                setUploadName('');
            } else {
                alert('Error al guardar. Intenta de nuevo.');
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert('Error al subir el archivo.');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id) => {
        const success = await removeQuestionSet(id);
        if (success) {
            setDeleteConfirm(null);
        }
    };

    const totalAnswered = Object.values(progress).filter(p => p.confianza_count > 0).length;
    const totalMarked = Object.values(progress).filter(p => p.marcada_para_repaso).length;
    const currentFileData = files.find(f => f.id === currentFile);

    return (
        <div className="fade-in">
            <header className="page-header">
                <h1 className="page-title">Configuración</h1>
                <p className="page-description">
                    Personaliza tu experiencia de estudio
                </p>
            </header>

            {/* Sync indicator */}
            <div className="sync-indicator" style={{ marginBottom: 16 }}>
                <div className="sync-dot"></div>
                <span>Sincronizado con la nube</span>
            </div>

            {/* Upload Section */}
            <div className="card" style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h3 className="card-title">Archivos de Estudio</h3>
                    <button
                        className="btn btn-primary"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <Upload size={16} />
                        Subir XLSX
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleFileSelect}
                        style={{ display: 'none' }}
                    />
                </div>

                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
                    Sube archivos Excel con columnas: N°, Sección, Tema, Pregunta, Respuesta super corta, Respuesta corta, Respuesta normal
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {files.map(file => (
                        <div
                            key={file.id}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12,
                                padding: 12,
                                backgroundColor: file.id === currentFile ? 'var(--accent-light)' : 'var(--bg-secondary)',
                                borderRadius: 'var(--radius-md)',
                                border: file.id === currentFile ? '1px solid var(--accent)' : '1px solid transparent'
                            }}
                        >
                            <FileSpreadsheet size={20} style={{ color: file.isBuiltIn ? 'var(--success)' : 'var(--accent)' }} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {file.name}
                                </div>
                                <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                                    {file.questions?.length || '?'} preguntas
                                    {file.isBuiltIn && ' • Incluido'}
                                </div>
                            </div>
                            {file.id === currentFile && (
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
                            {!file.isBuiltIn && (
                                <button
                                    className="btn btn-ghost btn-icon"
                                    onClick={() => setDeleteConfirm(file.id)}
                                    style={{ color: 'var(--danger)' }}
                                    title="Eliminar"
                                >
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>

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
                        <span>Claro</span>
                    </button>
                    <button
                        className={`btn ${theme === 'dark' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setTheme('dark')}
                        style={{ flex: 1, padding: 16 }}
                    >
                        <Moon size={20} />
                        <span>Oscuro</span>
                    </button>
                </div>
            </div>

            {/* Progress Section */}
            <div className="card" style={{ marginBottom: 24 }}>
                <h3 className="card-title" style={{ marginBottom: 16 }}>
                    Progreso: {currentFileData?.name}
                </h3>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 12,
                    marginBottom: 16
                }}>
                    <div style={{ textAlign: 'center', padding: 12, backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                        <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent)' }}>
                            {questions.length}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Total</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: 12, backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                        <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--success)' }}>
                            {totalAnswered}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Respondidas</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: 12, backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                        <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--warning)' }}>
                            {totalMarked}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Marcadas</div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                    <button
                        className="btn btn-secondary"
                        onClick={handleExportProgress}
                        style={{ flex: 1 }}
                    >
                        <Download size={16} />
                        Exportar
                    </button>
                    <button
                        className="btn btn-secondary"
                        onClick={() => setShowConfirmReset(true)}
                        style={{ color: 'var(--danger)' }}
                    >
                        <Trash2 size={16} />
                        Reiniciar
                    </button>
                </div>
            </div>

            {/* Keyboard Shortcuts */}
            <div className="card" style={{ marginBottom: 24 }}>
                <h3 className="card-title" style={{ marginBottom: 16 }}>Atajos</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                    {[
                        { key: '← →', desc: 'Navegar' },
                        { key: 'Espacio', desc: 'Ver / Siguiente' },
                        { key: '1-5', desc: 'Confianza' },
                    ].map(s => (
                        <div key={s.key} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: 8,
                            backgroundColor: 'var(--bg-secondary)',
                            borderRadius: 'var(--radius-md)',
                            fontSize: 12
                        }}>
                            <code style={{ padding: '2px 6px', backgroundColor: 'var(--bg-tertiary)', borderRadius: 3 }}>
                                {s.key}
                            </code>
                            <span style={{ color: 'var(--text-secondary)' }}>{s.desc}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* About */}
            <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Cloud size={20} style={{ color: 'var(--accent)' }} />
                    <div>
                        <div style={{ fontWeight: 500 }}>Study App</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                            Sincronizado • v2.0
                        </div>
                    </div>
                </div>
            </div>

            {/* Upload Modal */}
            {showUpload && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: 16
                }}>
                    <div className="card" style={{ maxWidth: 400, width: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <h3>Subir Archivo</h3>
                            <button className="btn btn-ghost btn-icon" onClick={() => setShowUpload(false)}>
                                <X size={18} />
                            </button>
                        </div>

                        <div style={{ marginBottom: 16 }}>
                            <label className="filter-label">Nombre del set</label>
                            <input
                                type="text"
                                value={uploadName}
                                onChange={(e) => setUploadName(e.target.value)}
                                placeholder="Ej: Hidráulica P1"
                                className="select"
                                style={{ marginTop: 8 }}
                            />
                        </div>

                        <div style={{
                            padding: 12,
                            backgroundColor: 'var(--bg-secondary)',
                            borderRadius: 'var(--radius-md)',
                            marginBottom: 16
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Check size={16} style={{ color: 'var(--success)' }} />
                                <span style={{ fontSize: 13 }}>
                                    {uploadData?.length} preguntas detectadas
                                </span>
                            </div>
                        </div>

                        <button
                            className="btn btn-primary btn-lg"
                            onClick={handleUpload}
                            disabled={uploading || !uploadName.trim()}
                            style={{ width: '100%' }}
                        >
                            {uploading ? 'Subiendo...' : 'Guardar'}
                        </button>
                    </div>
                </div>
            )}

            {/* Confirm Reset Modal */}
            {showConfirmReset && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: 16
                }}>
                    <div className="card" style={{ maxWidth: 350, textAlign: 'center' }}>
                        <Trash2 size={40} style={{ color: 'var(--danger)', marginBottom: 12 }} />
                        <h3 style={{ marginBottom: 8 }}>¿Reiniciar progreso?</h3>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: 20, fontSize: 14 }}>
                            Se eliminará todo tu progreso para este archivo.
                        </p>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <button className="btn btn-secondary" onClick={() => setShowConfirmReset(false)} style={{ flex: 1 }}>
                                Cancelar
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handleResetProgress}
                                style={{ flex: 1, backgroundColor: 'var(--danger)' }}
                            >
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirm Delete Set Modal */}
            {deleteConfirm && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: 16
                }}>
                    <div className="card" style={{ maxWidth: 350, textAlign: 'center' }}>
                        <Trash2 size={40} style={{ color: 'var(--danger)', marginBottom: 12 }} />
                        <h3 style={{ marginBottom: 8 }}>¿Eliminar archivo?</h3>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: 20, fontSize: 14 }}>
                            Se eliminará el archivo y todo su progreso.
                        </p>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)} style={{ flex: 1 }}>
                                Cancelar
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={() => handleDelete(deleteConfirm)}
                                style={{ flex: 1, backgroundColor: 'var(--danger)' }}
                            >
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Settings;
