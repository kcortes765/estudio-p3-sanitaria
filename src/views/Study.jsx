import { useState, useEffect, useCallback } from 'react';
import { useApp } from '../App';
import {
    ChevronLeft,
    ChevronRight,
    Bookmark,
    BookmarkCheck,
    RotateCcw,
    Shuffle
} from 'lucide-react';

function Study() {
    const { questions, progress, updateProgress, loading } = useApp();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showAnswer, setShowAnswer] = useState(false);
    const [answerLevel, setAnswerLevel] = useState('super_corta');
    const [sequence, setSequence] = useState([]);
    const [isRandom, setIsRandom] = useState(false);

    // Initialize sequence
    useEffect(() => {
        if (questions.length > 0) {
            const indices = questions.map((_, i) => i);
            setSequence(isRandom ? shuffleArray([...indices]) : indices);
            setCurrentIndex(0);
            setShowAnswer(false);
        }
    }, [questions, isRandom]);

    // Shuffle helper
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    const currentQuestion = questions[sequence[currentIndex]];
    const currentProgress = progress[currentQuestion?.numero] || {};

    // Navigation
    const goNext = useCallback(() => {
        if (currentIndex < sequence.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setShowAnswer(false);
            setAnswerLevel('super_corta');
        }
    }, [currentIndex, sequence.length]);

    const goPrev = useCallback(() => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
            setShowAnswer(false);
            setAnswerLevel('super_corta');
        }
    }, [currentIndex]);

    // Keyboard navigation
    useEffect(() => {
        function handleKeyDown(e) {
            if (e.key === 'ArrowRight' || e.key === ' ') {
                if (showAnswer) {
                    goNext();
                } else {
                    setShowAnswer(true);
                }
            } else if (e.key === 'ArrowLeft') {
                goPrev();
            } else if (e.key >= '1' && e.key <= '5') {
                handleConfidence(parseInt(e.key));
            } else if (e.key === 'Enter') {
                setShowAnswer(true);
            }
        }

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showAnswer, goNext, goPrev]);

    // Handle confidence selection
    const handleConfidence = async (level) => {
        if (!currentQuestion) return;
        await updateProgress(currentQuestion.numero, { confidence: level });
        goNext();
    };

    // Toggle bookmark
    const toggleBookmark = async () => {
        if (!currentQuestion) return;
        await updateProgress(currentQuestion.numero, {
            marked: !currentProgress.marcada_para_repaso
        });
    };

    // Reset to start
    const resetStudy = () => {
        setCurrentIndex(0);
        setShowAnswer(false);
        setAnswerLevel('super_corta');
    };

    if (loading) {
        return (
            <div className="loading">
                <div className="spinner"></div>
            </div>
        );
    }

    if (!currentQuestion) {
        return (
            <div className="empty-state">
                <h3>No hay preguntas disponibles</h3>
                <p>Selecciona un archivo Excel con preguntas</p>
            </div>
        );
    }

    const answerLevels = [
        { key: 'super_corta', label: 'Super corta' },
        { key: 'corta', label: 'Corta' },
        { key: 'normal', label: 'Normal' }
    ];

    const getAnswer = () => {
        switch (answerLevel) {
            case 'super_corta': return currentQuestion.respuesta_super_corta;
            case 'corta': return currentQuestion.respuesta_corta;
            case 'normal': return currentQuestion.respuesta_normal;
            default: return '';
        }
    };

    return (
        <div className="fade-in">
            <header className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <h1 className="page-title">Modo Estudio</h1>
                        <p className="page-description">
                            Estudia las preguntas a tu ritmo • Usa ← → o 1-5 para navegar
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button
                            className={`btn ${isRandom ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setIsRandom(!isRandom)}
                            title={isRandom ? 'Orden secuencial' : 'Orden aleatorio'}
                        >
                            <Shuffle size={16} />
                            {isRandom ? 'Aleatorio' : 'Secuencial'}
                        </button>
                        <button className="btn btn-secondary" onClick={resetStudy}>
                            <RotateCcw size={16} />
                            Reiniciar
                        </button>
                    </div>
                </div>
            </header>

            {/* Progress indicator */}
            <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                        Pregunta {currentIndex + 1} de {sequence.length}
                    </span>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                        {Math.round(((currentIndex + 1) / sequence.length) * 100)}%
                    </span>
                </div>
                <div className="progress-bar">
                    <div
                        className="progress-fill"
                        style={{ width: `${((currentIndex + 1) / sequence.length) * 100}%` }}
                    />
                </div>
            </div>

            {/* Question Card */}
            <div className="question-card">
                <div className="question-meta">
                    <span className="question-badge">{currentQuestion.seccion}</span>
                    {currentQuestion.tema && (
                        <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
                            • {currentQuestion.tema}
                        </span>
                    )}
                    <span className="question-number" style={{ marginLeft: 'auto' }}>
                        #{currentQuestion.numero}
                    </span>
                    <button
                        className="btn btn-ghost btn-icon"
                        onClick={toggleBookmark}
                        title={currentProgress.marcada_para_repaso ? 'Quitar marcador' : 'Marcar para repaso'}
                    >
                        {currentProgress.marcada_para_repaso
                            ? <BookmarkCheck size={18} style={{ color: 'var(--warning)' }} />
                            : <Bookmark size={18} />
                        }
                    </button>
                </div>

                <h2 className="question-text">{currentQuestion.pregunta}</h2>

                {/* Stats */}
                {currentProgress.veces_mostrada > 0 && (
                    <div style={{
                        display: 'flex',
                        gap: 16,
                        padding: '12px 16px',
                        backgroundColor: 'var(--bg-secondary)',
                        borderRadius: 'var(--radius-md)',
                        marginBottom: 16,
                        fontSize: 13,
                        color: 'var(--text-secondary)'
                    }}>
                        <span>Veces: {currentProgress.veces_mostrada}</span>
                        <span>•</span>
                        <span>Última confianza: {currentProgress.ultima_confianza || 'N/A'}</span>
                        <span>•</span>
                        <span>Promedio: {currentProgress.confianza_promedio || 'N/A'}</span>
                    </div>
                )}

                {/* Answer Section */}
                {!showAnswer ? (
                    <button
                        className="btn btn-primary btn-lg"
                        onClick={() => setShowAnswer(true)}
                        style={{ width: '100%', marginTop: 16 }}
                    >
                        Mostrar Respuesta
                    </button>
                ) : (
                    <div className="answer-section">
                        {/* Answer Level Tabs */}
                        <div className="answer-tabs">
                            {answerLevels.map(level => (
                                <button
                                    key={level.key}
                                    className={`answer-tab ${answerLevel === level.key ? 'active' : ''}`}
                                    onClick={() => setAnswerLevel(level.key)}
                                >
                                    {level.label}
                                </button>
                            ))}
                        </div>

                        {/* Answer Content */}
                        <div className="answer-content">
                            {getAnswer() || 'Sin respuesta disponible'}
                        </div>

                        {/* Confidence Buttons */}
                        <div style={{ marginTop: 24 }}>
                            <p style={{
                                fontSize: 14,
                                color: 'var(--text-secondary)',
                                marginBottom: 12,
                                textAlign: 'center'
                            }}>
                                ¿Qué tan bien conocías esta respuesta?
                            </p>
                            <div className="confidence-buttons" style={{ justifyContent: 'center' }}>
                                {[1, 2, 3, 4, 5].map(level => (
                                    <button
                                        key={level}
                                        className={`confidence-btn level-${level}`}
                                        onClick={() => handleConfidence(level)}
                                        title={
                                            level === 1 ? 'No sabía nada' :
                                                level === 2 ? 'Sabía muy poco' :
                                                    level === 3 ? 'Algo sabía' :
                                                        level === 4 ? 'Sabía bien' :
                                                            'Lo dominaba'
                                        }
                                    >
                                        {level}
                                    </button>
                                ))}
                            </div>
                            <p style={{
                                fontSize: 11,
                                color: 'var(--text-tertiary)',
                                textAlign: 'center',
                                marginTop: 8
                            }}>
                                1 = No sabía • 5 = Lo dominaba
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Navigation Controls */}
            <div className="nav-controls">
                <button
                    className="btn btn-secondary"
                    onClick={goPrev}
                    disabled={currentIndex === 0}
                >
                    <ChevronLeft size={18} />
                    Anterior
                </button>

                <span className="nav-position">
                    {currentIndex + 1} / {sequence.length}
                </span>

                <button
                    className="btn btn-secondary"
                    onClick={goNext}
                    disabled={currentIndex === sequence.length - 1}
                >
                    Siguiente
                    <ChevronRight size={18} />
                </button>
            </div>
        </div>
    );
}

export default Study;
