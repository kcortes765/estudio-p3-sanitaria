import { useState, useMemo, useEffect, useCallback } from 'react';
import { useApp } from '../App';
import {
    ChevronLeft,
    ChevronRight,
    Bookmark,
    BookmarkCheck,
    Filter,
    X
} from 'lucide-react';

function Review() {
    const { questions, progress, updateProgress, loading } = useApp();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showAnswer, setShowAnswer] = useState(false);
    const [answerLevel, setAnswerLevel] = useState('super_corta');
    const [showFilters, setShowFilters] = useState(true);

    // Filters
    const [filters, setFilters] = useState({
        sections: [],
        topics: [],
        minConfidence: 1,
        maxConfidence: 5,
        includeNoConfidence: true,
        maxViews: null,
        onlyMarked: false
    });

    // Get unique sections and topics
    const { sections, topics } = useMemo(() => {
        const secs = new Set();
        const tops = new Set();
        questions.forEach(q => {
            if (q.seccion) secs.add(q.seccion);
            if (q.tema) tops.add(q.tema);
        });
        return {
            sections: Array.from(secs).sort(),
            topics: Array.from(tops).sort()
        };
    }, [questions]);

    // Initialize filters with all sections/topics selected
    useEffect(() => {
        if (sections.length > 0 && filters.sections.length === 0) {
            setFilters(prev => ({ ...prev, sections: [...sections] }));
        }
        if (topics.length > 0 && filters.topics.length === 0) {
            setFilters(prev => ({ ...prev, topics: [...topics] }));
        }
    }, [sections, topics]);

    // Filtered questions
    const filteredQuestions = useMemo(() => {
        return questions.filter(q => {
            const p = progress[q.numero] || {};

            // Section filter
            if (filters.sections.length > 0 && !filters.sections.includes(q.seccion)) {
                return false;
            }

            // Topic filter
            if (filters.topics.length > 0 && !filters.topics.includes(q.tema)) {
                return false;
            }

            // Confidence filter
            const conf = p.ultima_confianza;
            if (conf) {
                if (conf < filters.minConfidence || conf > filters.maxConfidence) {
                    return false;
                }
            } else if (!filters.includeNoConfidence) {
                return false;
            }

            // Max views filter
            if (filters.maxViews !== null && (p.confianza_count || 0) > filters.maxViews) {
                return false;
            }

            // Marked only filter
            if (filters.onlyMarked && !p.marcada_para_repaso) {
                return false;
            }

            return true;
        });
    }, [questions, progress, filters]);

    const currentQuestion = filteredQuestions[currentIndex];
    const currentProgress = progress[currentQuestion?.numero] || {};

    // Reset index when filters change
    useEffect(() => {
        setCurrentIndex(0);
        setShowAnswer(false);
    }, [filteredQuestions.length]);

    // Navigation
    const goNext = useCallback(() => {
        if (currentIndex < filteredQuestions.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setShowAnswer(false);
            setAnswerLevel('super_corta');
        }
    }, [currentIndex, filteredQuestions.length]);

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
        setFilters(prev => ({
            ...prev,
            sections: prev.sections.includes(section)
                ? prev.sections.filter(s => s !== section)
                : [...prev.sections, section]
        }));
    };

    const toggleAllSections = (selectAll) => {
        setFilters(prev => ({
            ...prev,
            sections: selectAll ? [...sections] : []
        }));
    };

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
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <h1 className="page-title">Repaso Dirigido</h1>
                        <p className="page-description">
                            Filtra las preguntas para un repaso más efectivo
                        </p>
                    </div>
                    <button
                        className={`btn ${showFilters ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        <Filter size={16} />
                        Filtros
                    </button>
                </div>
            </header>

            {/* Filter Panel */}
            {showFilters && (
                <div className="filter-panel fade-in">
                    <div className="filter-grid">
                        {/* Sections */}
                        <div className="filter-group">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <label className="filter-label">Secciones</label>
                                <div style={{ display: 'flex', gap: 4 }}>
                                    <button
                                        className="btn btn-ghost"
                                        style={{ padding: '2px 6px', fontSize: 11 }}
                                        onClick={() => toggleAllSections(true)}
                                    >
                                        Todas
                                    </button>
                                    <button
                                        className="btn btn-ghost"
                                        style={{ padding: '2px 6px', fontSize: 11 }}
                                        onClick={() => toggleAllSections(false)}
                                    >
                                        Ninguna
                                    </button>
                                </div>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                                {sections.map(section => (
                                    <button
                                        key={section}
                                        className={`btn ${filters.sections.includes(section) ? 'btn-primary' : 'btn-secondary'}`}
                                        style={{ padding: '4px 10px', fontSize: 12 }}
                                        onClick={() => toggleSection(section)}
                                    >
                                        {section.length > 20 ? section.slice(0, 20) + '...' : section}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Confidence Range */}
                        <div className="filter-group">
                            <label className="filter-label">Rango de Confianza</label>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                <select
                                    className="select"
                                    value={filters.minConfidence}
                                    onChange={(e) => setFilters(prev => ({ ...prev, minConfidence: parseInt(e.target.value) }))}
                                >
                                    {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
                                </select>
                                <span>a</span>
                                <select
                                    className="select"
                                    value={filters.maxConfidence}
                                    onChange={(e) => setFilters(prev => ({ ...prev, maxConfidence: parseInt(e.target.value) }))}
                                >
                                    {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
                                </select>
                            </div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, fontSize: 13 }}>
                                <input
                                    type="checkbox"
                                    checked={filters.includeNoConfidence}
                                    onChange={(e) => setFilters(prev => ({ ...prev, includeNoConfidence: e.target.checked }))}
                                />
                                Incluir sin confianza
                            </label>
                        </div>

                        {/* Max Views */}
                        <div className="filter-group">
                            <label className="filter-label">Veces Respondida</label>
                            <select
                                className="select"
                                value={filters.maxViews ?? 'all'}
                                onChange={(e) => setFilters(prev => ({
                                    ...prev,
                                    maxViews: e.target.value === 'all' ? null : parseInt(e.target.value)
                                }))}
                            >
                                <option value="all">Todas</option>
                                <option value="0">No vistas (0)</option>
                                <option value="2">Menos de 3</option>
                                <option value="4">Menos de 5</option>
                                <option value="9">Menos de 10</option>
                            </select>
                        </div>

                        {/* Marked Only */}
                        <div className="filter-group">
                            <label className="filter-label">Marcadas</label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, marginTop: 8 }}>
                                <input
                                    type="checkbox"
                                    checked={filters.onlyMarked}
                                    onChange={(e) => setFilters(prev => ({ ...prev, onlyMarked: e.target.checked }))}
                                />
                                Solo marcadas para repaso
                            </label>
                        </div>
                    </div>

                    <div style={{
                        marginTop: 16,
                        paddingTop: 16,
                        borderTop: '1px solid var(--border)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                            <strong>{filteredQuestions.length}</strong> de {questions.length} preguntas
                        </span>
                    </div>
                </div>
            )}

            {/* Content */}
            {filteredQuestions.length === 0 ? (
                <div className="empty-state">
                    <Filter size={64} />
                    <h3>No hay preguntas con estos filtros</h3>
                    <p>Ajusta los filtros para ver más preguntas</p>
                </div>
            ) : (
                <>
                    {/* Progress indicator */}
                    <div style={{ marginBottom: 24 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                                Pregunta {currentIndex + 1} de {filteredQuestions.length}
                            </span>
                            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                                {Math.round(((currentIndex + 1) / filteredQuestions.length) * 100)}%
                            </span>
                        </div>
                        <div className="progress-bar">
                            <div
                                className="progress-fill"
                                style={{ width: `${((currentIndex + 1) / filteredQuestions.length) * 100}%` }}
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
                            >
                                {currentProgress.marcada_para_repaso
                                    ? <BookmarkCheck size={18} style={{ color: 'var(--warning)' }} />
                                    : <Bookmark size={18} />
                                }
                            </button>
                        </div>

                        <h2 className="question-text">{currentQuestion.pregunta}</h2>

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
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Navigation */}
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
                            {currentIndex + 1} / {filteredQuestions.length}
                        </span>

                        <button
                            className="btn btn-secondary"
                            onClick={goNext}
                            disabled={currentIndex === filteredQuestions.length - 1}
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

export default Review;
