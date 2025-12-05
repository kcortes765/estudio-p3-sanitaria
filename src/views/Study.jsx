import { useState, useEffect, useCallback, useMemo } from 'react';
import { useApp } from '../App';
import {
    ChevronLeft,
    ChevronRight,
    Bookmark,
    BookmarkCheck,
    RotateCcw,
    Shuffle,
    Filter,
    X
} from 'lucide-react';

function Study() {
    const { questions, progress, updateProgress, loading } = useApp();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showAnswer, setShowAnswer] = useState(false);
    const [answerLevel, setAnswerLevel] = useState('super_corta');
    const [isRandom, setIsRandom] = useState(false);
    const [showFilters, setShowFilters] = useState(false);

    // Filters
    const [selectedSections, setSelectedSections] = useState([]);
    const [selectedTopics, setSelectedTopics] = useState([]);

    // Get unique sections and topics
    const { sections, topics, topicsBySection } = useMemo(() => {
        const secs = new Set();
        const tops = new Set();
        const topsBySec = {};

        questions.forEach(q => {
            if (q.seccion) {
                secs.add(q.seccion);
                if (!topsBySec[q.seccion]) topsBySec[q.seccion] = new Set();
                if (q.tema) topsBySec[q.seccion].add(q.tema);
            }
            if (q.tema) tops.add(q.tema);
        });

        return {
            sections: Array.from(secs).sort(),
            topics: Array.from(tops).sort(),
            topicsBySection: Object.fromEntries(
                Object.entries(topsBySec).map(([k, v]) => [k, Array.from(v).sort()])
            )
        };
    }, [questions]);

    // Initialize with all sections/topics selected
    useEffect(() => {
        if (sections.length > 0 && selectedSections.length === 0) {
            setSelectedSections([...sections]);
        }
    }, [sections]);

    // Filtered questions
    const filteredQuestions = useMemo(() => {
        return questions.filter(q => {
            // Section filter
            if (selectedSections.length > 0 && selectedSections.length < sections.length) {
                if (!selectedSections.includes(q.seccion)) return false;
            }

            // Topic filter
            if (selectedTopics.length > 0) {
                if (!selectedTopics.includes(q.tema)) return false;
            }

            return true;
        });
    }, [questions, selectedSections, selectedTopics, sections.length]);

    // Shuffled sequence
    const sequence = useMemo(() => {
        const indices = filteredQuestions.map((_, i) => i);
        if (isRandom) {
            for (let i = indices.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [indices[i], indices[j]] = [indices[j], indices[i]];
            }
        }
        return indices;
    }, [filteredQuestions, isRandom]);

    // Reset index when filters change
    useEffect(() => {
        setCurrentIndex(0);
        setShowAnswer(false);
    }, [selectedSections, selectedTopics, isRandom]);

    const currentQuestion = filteredQuestions[sequence[currentIndex]];
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
            if (e.target.tagName === 'SELECT' || e.target.tagName === 'INPUT') return;

            if (e.key === 'ArrowRight' || e.key === ' ') {
                if (showAnswer) goNext();
                else setShowAnswer(true);
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

    const handleConfidence = async (level) => {
        if (!currentQuestion) return;
        await updateProgress(currentQuestion.numero, { confidence: level });
        goNext();
    };

    const toggleBookmark = async () => {
        if (!currentQuestion) return;
        await updateProgress(currentQuestion.numero, {
            marked: !currentProgress.marcada_para_repaso
        });
    };

    const toggleSection = (section) => {
        setSelectedSections(prev => {
            if (prev.includes(section)) {
                // Remove section and its topics
                const sectionTopics = topicsBySection[section] || [];
                setSelectedTopics(t => t.filter(topic => !sectionTopics.includes(topic)));
                return prev.filter(s => s !== section);
            } else {
                return [...prev, section];
            }
        });
    };

    const toggleTopic = (topic) => {
        setSelectedTopics(prev =>
            prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]
        );
    };

    const selectAllSections = () => {
        setSelectedSections([...sections]);
        setSelectedTopics([]);
    };

    const clearFilters = () => {
        setSelectedSections([...sections]);
        setSelectedTopics([]);
    };

    // Get available topics based on selected sections
    const availableTopics = useMemo(() => {
        if (selectedSections.length === 0 || selectedSections.length === sections.length) {
            return topics;
        }
        const available = new Set();
        selectedSections.forEach(sec => {
            (topicsBySection[sec] || []).forEach(t => available.add(t));
        });
        return Array.from(available).sort();
    }, [selectedSections, sections.length, topics, topicsBySection]);

    if (loading) {
        return (
            <div className="loading">
                <div className="spinner"></div>
            </div>
        );
    }

    const answerLevels = [
        { key: 'super_corta', label: 'Super corta' },
        { key: 'corta', label: 'Corta' },
        { key: 'normal', label: 'Normal' }
    ];

    const getAnswer = () => {
        if (!currentQuestion) return '';
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
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                        <h1 className="page-title">Modo Estudio</h1>
                        <p className="page-description">
                            {filteredQuestions.length} de {questions.length} preguntas
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button
                            className={`btn ${showFilters ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setShowFilters(!showFilters)}
                        >
                            <Filter size={16} />
                            Filtros
                        </button>
                        <button
                            className={`btn ${isRandom ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setIsRandom(!isRandom)}
                        >
                            <Shuffle size={16} />
                            {isRandom ? 'Aleatorio' : 'Secuencial'}
                        </button>
                    </div>
                </div>
            </header>

            {/* Filters Panel */}
            {showFilters && (
                <div className="filter-panel fade-in" style={{ marginBottom: 24 }}>
                    {/* Sections */}
                    <div style={{ marginBottom: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <label className="filter-label">Secciones</label>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button
                                    className="btn btn-ghost"
                                    style={{ padding: '4px 8px', fontSize: 12 }}
                                    onClick={selectAllSections}
                                >
                                    Todas
                                </button>
                                <button
                                    className="btn btn-ghost"
                                    style={{ padding: '4px 8px', fontSize: 12 }}
                                    onClick={() => setSelectedSections([])}
                                >
                                    Ninguna
                                </button>
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {sections.map(section => (
                                <button
                                    key={section}
                                    className={`btn ${selectedSections.includes(section) ? 'btn-primary' : 'btn-secondary'}`}
                                    style={{ padding: '6px 12px', fontSize: 13 }}
                                    onClick={() => toggleSection(section)}
                                >
                                    {section.length > 25 ? section.slice(0, 25) + '...' : section}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Topics */}
                    {availableTopics.length > 0 && (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                <label className="filter-label">Temas (opcional)</label>
                                {selectedTopics.length > 0 && (
                                    <button
                                        className="btn btn-ghost"
                                        style={{ padding: '4px 8px', fontSize: 12 }}
                                        onClick={() => setSelectedTopics([])}
                                    >
                                        Limpiar
                                    </button>
                                )}
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                {availableTopics.map(topic => (
                                    <button
                                        key={topic}
                                        className={`btn ${selectedTopics.includes(topic) ? 'btn-primary' : 'btn-secondary'}`}
                                        style={{ padding: '6px 12px', fontSize: 12 }}
                                        onClick={() => toggleTopic(topic)}
                                    >
                                        {topic.length > 30 ? topic.slice(0, 30) + '...' : topic}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                            <strong>{filteredQuestions.length}</strong> preguntas seleccionadas
                        </span>
                        <button className="btn btn-ghost" onClick={() => setShowFilters(false)}>
                            <X size={16} /> Cerrar
                        </button>
                    </div>
                </div>
            )}

            {filteredQuestions.length === 0 ? (
                <div className="empty-state">
                    <Filter size={64} />
                    <h3>No hay preguntas con estos filtros</h3>
                    <p>Selecciona al menos una sección</p>
                    <button className="btn btn-primary" onClick={selectAllSections} style={{ marginTop: 16 }}>
                        Seleccionar todas
                    </button>
                </div>
            ) : (
                <>
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
                            <span className="question-badge">{currentQuestion?.seccion}</span>
                            {currentQuestion?.tema && (
                                <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
                                    • {currentQuestion.tema}
                                </span>
                            )}
                            <span className="question-number" style={{ marginLeft: 'auto' }}>
                                #{currentQuestion?.numero}
                            </span>
                            <button
                                className="btn btn-ghost btn-icon"
                                onClick={toggleBookmark}
                            >
                                {currentProgress.marcada_para_repaso
                                    ? <BookmarkCheck size={18} style={{ color: 'var(--warning)' }} />
                                    : <Bookmark size={18} />
                                }
                            </button>
                        </div>

                        <h2 className="question-text">{currentQuestion?.pregunta}</h2>

                        {currentProgress.veces_mostrada > 0 && (
                            <div style={{
                                display: 'flex',
                                gap: 16,
                                padding: '12px 16px',
                                backgroundColor: 'var(--bg-secondary)',
                                borderRadius: 'var(--radius-md)',
                                marginBottom: 16,
                                fontSize: 13,
                                color: 'var(--text-secondary)',
                                flexWrap: 'wrap'
                            }}>
                                <span>Veces: {currentProgress.veces_mostrada}</span>
                                <span>•</span>
                                <span>Confianza: {currentProgress.ultima_confianza || 'N/A'}</span>
                            </div>
                        )}

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

                                <div className="answer-content">
                                    {getAnswer() || 'Sin respuesta disponible'}
                                </div>

                                <div style={{ marginTop: 24 }}>
                                    <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 12, textAlign: 'center' }}>
                                        ¿Qué tan bien conocías esta respuesta?
                                    </p>
                                    <div className="confidence-buttons" style={{ justifyContent: 'center' }}>
                                        {[1, 2, 3, 4, 5].map(level => (
                                            <button
                                                key={level}
                                                className={`confidence-btn level-${level}`}
                                                onClick={() => handleConfidence(level)}
                                            >
                                                {level}
                                            </button>
                                        ))}
                                    </div>
                                    <p style={{ fontSize: 11, color: 'var(--text-tertiary)', textAlign: 'center', marginTop: 8 }}>
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
                </>
            )}
        </div>
    );
}

export default Study;
