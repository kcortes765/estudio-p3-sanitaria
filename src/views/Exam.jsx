import { useState, useEffect, useCallback, useMemo } from 'react';
import { useApp } from '../App';
import {
    Play,
    Pause,
    RotateCcw,
    CheckCircle,
    XCircle,
    Trophy,
    Clock,
    Target
} from 'lucide-react';

function Exam() {
    const { questions, progress, updateProgress, loading } = useApp();

    // Exam state
    const [examStarted, setExamStarted] = useState(false);
    const [examFinished, setExamFinished] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [showAnswer, setShowAnswer] = useState(false);
    const [isPaused, setIsPaused] = useState(false);

    // Timer state
    const [timeLeft, setTimeLeft] = useState(0);
    const [totalTime, setTotalTime] = useState(30); // minutes

    // Config
    const [config, setConfig] = useState({
        questionCount: 20,
        timePerQuestion: 90, // seconds
        useTimer: true,
        randomOrder: true
    });

    // Shuffled questions for exam
    const examQuestions = useMemo(() => {
        if (!examStarted) return [];
        const shuffled = [...questions];
        if (config.randomOrder) {
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
        }
        return shuffled.slice(0, Math.min(config.questionCount, shuffled.length));
    }, [questions, examStarted, config.questionCount, config.randomOrder]);

    const currentQuestion = examQuestions[currentIndex];

    // Timer
    useEffect(() => {
        if (!examStarted || examFinished || isPaused || !config.useTimer) return;

        if (timeLeft <= 0) {
            handleFinish();
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [examStarted, examFinished, isPaused, timeLeft, config.useTimer]);

    // Format time
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Start exam
    const startExam = () => {
        setExamStarted(true);
        setExamFinished(false);
        setCurrentIndex(0);
        setAnswers({});
        setShowAnswer(false);
        setTimeLeft(config.useTimer ? totalTime * 60 : 0);
        setIsPaused(false);
    };

    // Finish exam
    const handleFinish = () => {
        setExamFinished(true);
    };

    // Handle answer
    const handleAnswer = async (confidence) => {
        const questionId = currentQuestion.numero;

        setAnswers(prev => ({
            ...prev,
            [questionId]: confidence
        }));

        await updateProgress(questionId, { confidence });

        if (currentIndex < examQuestions.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setShowAnswer(false);
        } else {
            handleFinish();
        }
    };

    // Skip question
    const skipQuestion = () => {
        if (currentIndex < examQuestions.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setShowAnswer(false);
        } else {
            handleFinish();
        }
    };

    // Results calculation
    const results = useMemo(() => {
        if (!examFinished) return null;

        const answered = Object.keys(answers).length;
        const total = examQuestions.length;
        const skipped = total - answered;

        let highConf = 0;
        let lowConf = 0;
        let sumConf = 0;

        Object.values(answers).forEach(conf => {
            sumConf += conf;
            if (conf >= 4) highConf++;
            if (conf <= 2) lowConf++;
        });

        const avgConf = answered > 0 ? (sumConf / answered).toFixed(1) : 0;
        const score = answered > 0 ? Math.round((sumConf / (answered * 5)) * 100) : 0;

        return { answered, total, skipped, highConf, lowConf, avgConf, score };
    }, [examFinished, answers, examQuestions]);

    // Timer color
    const getTimerClass = () => {
        if (!config.useTimer) return '';
        const percent = timeLeft / (totalTime * 60);
        if (percent < 0.1) return 'danger';
        if (percent < 0.25) return 'warning';
        return '';
    };

    if (loading) {
        return (
            <div className="loading">
                <div className="spinner"></div>
            </div>
        );
    }

    // Config Screen
    if (!examStarted) {
        return (
            <div className="fade-in">
                <header className="page-header">
                    <h1 className="page-title">Modo Examen</h1>
                    <p className="page-description">
                        Pon a prueba tus conocimientos con un examen cronometrado
                    </p>
                </header>

                <div className="card" style={{ maxWidth: 600, margin: '0 auto' }}>
                    <h3 className="card-title" style={{ marginBottom: 24 }}>Configuración del Examen</h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        {/* Question count */}
                        <div className="filter-group">
                            <label className="filter-label">Número de preguntas</label>
                            <select
                                className="select"
                                value={config.questionCount}
                                onChange={(e) => setConfig(prev => ({ ...prev, questionCount: parseInt(e.target.value) }))}
                            >
                                <option value={10}>10 preguntas</option>
                                <option value={20}>20 preguntas</option>
                                <option value={30}>30 preguntas</option>
                                <option value={50}>50 preguntas</option>
                                <option value={questions.length}>Todas ({questions.length})</option>
                            </select>
                        </div>

                        {/* Timer toggle */}
                        <div className="filter-group">
                            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <input
                                    type="checkbox"
                                    checked={config.useTimer}
                                    onChange={(e) => setConfig(prev => ({ ...prev, useTimer: e.target.checked }))}
                                />
                                <span>Usar temporizador</span>
                            </label>
                        </div>

                        {/* Time limit */}
                        {config.useTimer && (
                            <div className="filter-group">
                                <label className="filter-label">Tiempo total (minutos)</label>
                                <select
                                    className="select"
                                    value={totalTime}
                                    onChange={(e) => setTotalTime(parseInt(e.target.value))}
                                >
                                    <option value={10}>10 minutos</option>
                                    <option value={15}>15 minutos</option>
                                    <option value={20}>20 minutos</option>
                                    <option value={30}>30 minutos</option>
                                    <option value={45}>45 minutos</option>
                                    <option value={60}>60 minutos</option>
                                </select>
                            </div>
                        )}

                        {/* Random order */}
                        <div className="filter-group">
                            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <input
                                    type="checkbox"
                                    checked={config.randomOrder}
                                    onChange={(e) => setConfig(prev => ({ ...prev, randomOrder: e.target.checked }))}
                                />
                                <span>Orden aleatorio</span>
                            </label>
                        </div>
                    </div>

                    <button
                        className="btn btn-primary btn-lg"
                        onClick={startExam}
                        style={{ width: '100%', marginTop: 32 }}
                    >
                        <Play size={20} />
                        Comenzar Examen
                    </button>
                </div>
            </div>
        );
    }

    // Results Screen
    if (examFinished) {
        return (
            <div className="fade-in">
                <header className="page-header" style={{ textAlign: 'center' }}>
                    <Trophy size={64} style={{ color: 'var(--warning)', marginBottom: 16 }} />
                    <h1 className="page-title">¡Examen Completado!</h1>
                </header>

                <div className="stats-grid" style={{ maxWidth: 800, margin: '0 auto' }}>
                    <div className="stat-card">
                        <div className="stat-icon blue">
                            <Target size={20} />
                        </div>
                        <div className="stat-value">{results?.score}%</div>
                        <div className="stat-label">Puntuación</div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon green">
                            <CheckCircle size={20} />
                        </div>
                        <div className="stat-value">{results?.answered}</div>
                        <div className="stat-label">Respondidas</div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon orange">
                            <Clock size={20} />
                        </div>
                        <div className="stat-value">{results?.skipped}</div>
                        <div className="stat-label">Omitidas</div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon blue">
                            <Trophy size={20} />
                        </div>
                        <div className="stat-value">{results?.avgConf}</div>
                        <div className="stat-label">Confianza promedio</div>
                    </div>
                </div>

                <div style={{ textAlign: 'center', marginTop: 32 }}>
                    <button
                        className="btn btn-primary btn-lg"
                        onClick={() => {
                            setExamStarted(false);
                            setExamFinished(false);
                        }}
                    >
                        <RotateCcw size={20} />
                        Nuevo Examen
                    </button>
                </div>
            </div>
        );
    }

    // Exam in progress
    return (
        <div className="fade-in">
            {/* Header with timer */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 24
            }}>
                <div>
                    <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                        Pregunta {currentIndex + 1} de {examQuestions.length}
                    </span>
                </div>

                {config.useTimer && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <span className={`exam-timer ${getTimerClass()}`} style={{ fontSize: 32 }}>
                            {formatTime(timeLeft)}
                        </span>
                        <button
                            className="btn btn-secondary btn-icon"
                            onClick={() => setIsPaused(!isPaused)}
                        >
                            {isPaused ? <Play size={18} /> : <Pause size={18} />}
                        </button>
                    </div>
                )}

                <button
                    className="btn btn-secondary"
                    onClick={handleFinish}
                >
                    Terminar
                </button>
            </div>

            {/* Progress */}
            <div className="progress-bar" style={{ marginBottom: 24 }}>
                <div
                    className="progress-fill"
                    style={{ width: `${((currentIndex + 1) / examQuestions.length) * 100}%` }}
                />
            </div>

            {/* Paused overlay */}
            {isPaused && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 100
                }}>
                    <div style={{ textAlign: 'center', color: 'white' }}>
                        <Pause size={64} style={{ marginBottom: 16 }} />
                        <h2>Examen Pausado</h2>
                        <button
                            className="btn btn-primary btn-lg"
                            onClick={() => setIsPaused(false)}
                            style={{ marginTop: 24 }}
                        >
                            <Play size={20} />
                            Continuar
                        </button>
                    </div>
                </div>
            )}

            {/* Question */}
            <div className="question-card">
                <div className="question-meta">
                    <span className="question-badge">{currentQuestion?.seccion}</span>
                    <span className="question-number" style={{ marginLeft: 'auto' }}>
                        #{currentQuestion?.numero}
                    </span>
                </div>

                <h2 className="question-text">{currentQuestion?.pregunta}</h2>

                {!showAnswer ? (
                    <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                        <button
                            className="btn btn-primary btn-lg"
                            onClick={() => setShowAnswer(true)}
                            style={{ flex: 1 }}
                        >
                            Ver Respuesta
                        </button>
                        <button
                            className="btn btn-secondary btn-lg"
                            onClick={skipQuestion}
                        >
                            Omitir
                        </button>
                    </div>
                ) : (
                    <div className="answer-section">
                        <div className="answer-content" style={{ marginBottom: 24 }}>
                            <strong>Respuesta:</strong><br />
                            {currentQuestion?.respuesta_normal || currentQuestion?.respuesta_corta}
                        </div>

                        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 12, textAlign: 'center' }}>
                            ¿Qué tan bien sabías la respuesta?
                        </p>
                        <div className="confidence-buttons" style={{ justifyContent: 'center' }}>
                            {[1, 2, 3, 4, 5].map(level => (
                                <button
                                    key={level}
                                    className={`confidence-btn level-${level}`}
                                    onClick={() => handleAnswer(level)}
                                >
                                    {level}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Exam;
