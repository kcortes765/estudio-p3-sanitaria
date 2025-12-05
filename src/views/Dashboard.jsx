import { useMemo } from 'react';
import { useApp } from '../App';
import {
    BookOpen,
    CheckCircle,
    AlertCircle,
    Target,
    TrendingUp,
    Clock
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';

function Dashboard() {
    const { questions, progress, loading, currentFile } = useApp();

    const stats = useMemo(() => {
        if (!questions.length) return null;

        const total = questions.length;
        let answered = 0;
        let highConfidence = 0;
        let lowConfidence = 0;
        let markedForReview = 0;
        let totalConfidence = 0;
        let confidenceCount = 0;

        questions.forEach(q => {
            const p = progress[q.numero] || {};
            if (p.confianza_count > 0) {
                answered++;
                totalConfidence += p.confianza_promedio || 0;
                confidenceCount++;
            }
            if (p.ultima_confianza >= 4) highConfidence++;
            if (p.ultima_confianza && p.ultima_confianza <= 2) lowConfidence++;
            if (p.marcada_para_repaso) markedForReview++;
        });

        const avgConfidence = confidenceCount > 0
            ? (totalConfidence / confidenceCount).toFixed(1)
            : 0;

        return {
            total,
            answered,
            pending: total - answered,
            highConfidence,
            lowConfidence,
            markedForReview,
            avgConfidence,
            progressPercent: Math.round((answered / total) * 100)
        };
    }, [questions, progress]);

    const sectionStats = useMemo(() => {
        if (!questions.length) return [];

        const sections = {};
        questions.forEach(q => {
            const section = q.seccion || 'Sin sección';
            if (!sections[section]) {
                sections[section] = {
                    name: section,
                    total: 0,
                    answered: 0,
                    avgConfidence: 0,
                    confidenceSum: 0
                };
            }
            sections[section].total++;

            const p = progress[q.numero] || {};
            if (p.confianza_count > 0) {
                sections[section].answered++;
                sections[section].confidenceSum += p.confianza_promedio || 0;
            }
        });

        return Object.values(sections).map(s => ({
            ...s,
            avgConfidence: s.answered > 0
                ? (s.confidenceSum / s.answered).toFixed(1)
                : 0,
            progress: Math.round((s.answered / s.total) * 100)
        }));
    }, [questions, progress]);

    const pieData = useMemo(() => {
        if (!stats) return [];
        return [
            { name: 'Respondidas', value: stats.answered, color: '#2383e2' },
            { name: 'Pendientes', value: stats.pending, color: '#e1e1e0' }
        ];
    }, [stats]);

    if (loading) {
        return (
            <div className="loading">
                <div className="spinner"></div>
            </div>
        );
    }

    if (!questions.length) {
        return (
            <div className="empty-state">
                <BookOpen size={64} />
                <h3>No hay preguntas cargadas</h3>
                <p>Selecciona un archivo Excel para comenzar</p>
            </div>
        );
    }

    return (
        <div className="fade-in">
            <header className="page-header">
                <h1 className="page-title">Dashboard</h1>
                <p className="page-description">
                    {currentFile?.replace('.xlsx', '')} • {stats?.total} preguntas
                </p>
            </header>

            {/* Stats Grid */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon blue">
                        <BookOpen size={20} />
                    </div>
                    <div className="stat-value">{stats?.total}</div>
                    <div className="stat-label">Total de preguntas</div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon green">
                        <CheckCircle size={20} />
                    </div>
                    <div className="stat-value">{stats?.answered}</div>
                    <div className="stat-label">Respondidas</div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon orange">
                        <Clock size={20} />
                    </div>
                    <div className="stat-value">{stats?.pending}</div>
                    <div className="stat-label">Pendientes</div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon blue">
                        <TrendingUp size={20} />
                    </div>
                    <div className="stat-value">{stats?.avgConfidence}</div>
                    <div className="stat-label">Confianza promedio</div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon green">
                        <Target size={20} />
                    </div>
                    <div className="stat-value">{stats?.highConfidence}</div>
                    <div className="stat-label">Alta confianza (≥4)</div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon red">
                        <AlertCircle size={20} />
                    </div>
                    <div className="stat-value">{stats?.lowConfidence}</div>
                    <div className="stat-label">Baja confianza (≤2)</div>
                </div>
            </div>

            {/* Progress Overview */}
            <div className="card" style={{ marginBottom: 24 }}>
                <div className="card-header">
                    <h3 className="card-title">Progreso General</h3>
                    <span style={{ fontSize: 24, fontWeight: 700, color: 'var(--accent)' }}>
                        {stats?.progressPercent}%
                    </span>
                </div>
                <div className="progress-bar" style={{ height: 12 }}>
                    <div
                        className="progress-fill"
                        style={{ width: `${stats?.progressPercent}%` }}
                    />
                </div>
            </div>

            {/* Charts Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
                {/* Pie Chart */}
                <div className="card">
                    <h3 className="card-title" style={{ marginBottom: 16 }}>Estado General</h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={50}
                                outerRadius={80}
                                paddingAngle={2}
                                dataKey="value"
                            >
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 8 }}>
                        {pieData.map(item => (
                            <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{
                                    width: 12,
                                    height: 12,
                                    borderRadius: 3,
                                    backgroundColor: item.color
                                }} />
                                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                                    {item.name}: {item.value}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bar Chart - Progress by Section */}
                <div className="card">
                    <h3 className="card-title" style={{ marginBottom: 16 }}>Progreso por Sección</h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={sectionStats.slice(0, 5)} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                            <XAxis type="number" domain={[0, 100]} tick={{ fill: 'var(--text-secondary)' }} />
                            <YAxis
                                type="category"
                                dataKey="name"
                                width={100}
                                tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                                tickFormatter={(value) => value.length > 15 ? value.slice(0, 15) + '...' : value}
                            />
                            <Tooltip
                                formatter={(value) => [`${value}%`, 'Progreso']}
                                contentStyle={{
                                    backgroundColor: 'var(--bg-primary)',
                                    border: '1px solid var(--border)',
                                    borderRadius: 8
                                }}
                            />
                            <Bar
                                dataKey="progress"
                                fill="var(--accent)"
                                radius={[0, 4, 4, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Section Details Table */}
            <div className="card">
                <h3 className="card-title" style={{ marginBottom: 16 }}>Detalle por Sección</h3>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>
                                    SECCIÓN
                                </th>
                                <th style={{ textAlign: 'center', padding: '12px 8px', fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>
                                    TOTAL
                                </th>
                                <th style={{ textAlign: 'center', padding: '12px 8px', fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>
                                    RESPONDIDAS
                                </th>
                                <th style={{ textAlign: 'center', padding: '12px 8px', fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>
                                    CONFIANZA
                                </th>
                                <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500, width: 150 }}>
                                    PROGRESO
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {sectionStats.map((section, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid var(--border-light)' }}>
                                    <td style={{ padding: '12px 8px', fontSize: 14 }}>{section.name}</td>
                                    <td style={{ textAlign: 'center', padding: '12px 8px', fontSize: 14 }}>{section.total}</td>
                                    <td style={{ textAlign: 'center', padding: '12px 8px', fontSize: 14 }}>{section.answered}</td>
                                    <td style={{ textAlign: 'center', padding: '12px 8px', fontSize: 14 }}>
                                        <span style={{
                                            padding: '4px 8px',
                                            borderRadius: 4,
                                            backgroundColor: 'var(--accent-light)',
                                            color: 'var(--accent)',
                                            fontSize: 12,
                                            fontWeight: 500
                                        }}>
                                            {section.avgConfidence}
                                        </span>
                                    </td>
                                    <td style={{ padding: '12px 8px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <div className="progress-bar" style={{ flex: 1, height: 6 }}>
                                                <div className="progress-fill" style={{ width: `${section.progress}%` }} />
                                            </div>
                                            <span style={{ fontSize: 12, color: 'var(--text-secondary)', minWidth: 35 }}>
                                                {section.progress}%
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
