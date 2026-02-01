import React from 'react';
import { AlertTriangle, Clock, TrendingDown, Zap } from 'lucide-react';

export default function TechnicalDebt({ roadmap = {} }) {
  const allDebts = [];

  if (roadmap.features) {
    roadmap.features.forEach(feature => {
      feature.tasks?.forEach(task => {
        task.technical_debt?.forEach(debt => {
          allDebts.push({
            ...debt,
            taskName: task.name,
            featureName: feature.name,
            taskId: task.id
          });
        });
      });
    });
  }

  const grouped = {
    high: allDebts.filter(d => d.severity === 'high'),
    medium: allDebts.filter(d => d.severity === 'medium'),
    low: allDebts.filter(d => d.severity === 'low')
  };

  if (allDebts.length === 0) {
    return (
      <div className="card-dark rounded-2xl p-12 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-matrix/10 flex items-center justify-center">
          <TrendingDown className="w-8 h-8 text-matrix" />
        </div>
        <h3 className="text-lg font-semibold text-matrix mb-2">Sin deuda técnica</h3>
        <p className="text-theme-secondary text-sm">No hay deuda técnica registrada</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger">
        <StatCard label="Total" value={allDebts.length} gradient="from-blue-500 to-cyan-500" icon={AlertTriangle} />
        <StatCard label="Alta" value={grouped.high.length} gradient="from-rose-500 to-orange-500" icon={Zap} />
        <StatCard label="Media" value={grouped.medium.length} gradient="from-amber-500 to-yellow-500" icon={AlertTriangle} />
        <StatCard label="Baja" value={grouped.low.length} gradient="from-cyan-500 to-teal-500" icon={Clock} />
      </div>

      {/* Distribution Bar */}
      <div className="card-dark rounded-2xl p-6">
        <h3 className="text-sm text-theme-secondary uppercase tracking-wider mb-4">Distribución</h3>
        <div className="flex h-4 rounded-full overflow-hidden bg-white/5">
          {grouped.high.length > 0 && (
            <div
              className="bg-gradient-to-r from-rose-500 to-orange-500 transition-all"
              style={{ width: `${(grouped.high.length / allDebts.length) * 100}%` }}
            />
          )}
          {grouped.medium.length > 0 && (
            <div
              className="bg-gradient-to-r from-amber-500 to-yellow-500 transition-all"
              style={{ width: `${(grouped.medium.length / allDebts.length) * 100}%` }}
            />
          )}
          {grouped.low.length > 0 && (
            <div
              className="bg-gradient-to-r from-cyan-500 to-teal-500 transition-all"
              style={{ width: `${(grouped.low.length / allDebts.length) * 100}%` }}
            />
          )}
        </div>
        <div className="flex justify-between mt-3 text-xs">
          <span className="text-rose-400">{Math.round((grouped.high.length / allDebts.length) * 100)}% Alta</span>
          <span className="text-amber-400">{Math.round((grouped.medium.length / allDebts.length) * 100)}% Media</span>
          <span className="text-cyan-400">{Math.round((grouped.low.length / allDebts.length) * 100)}% Baja</span>
        </div>
      </div>

      {/* Debt by Severity */}
      {['high', 'medium', 'low'].map(sev => (
        grouped[sev].length > 0 && (
          <DebtSection key={sev} severity={sev} debts={grouped[sev]} />
        )
      ))}
    </div>
  );
}

function StatCard({ label, value, gradient, icon: Icon }) {
  return (
    <div className="card-dark rounded-2xl p-5 hover:scale-[1.02] transition-all">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-theme-muted uppercase tracking-wider mb-1">{label}</p>
          <p className={`text-3xl font-bold bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>{value}</p>
        </div>
        <Icon className={`w-8 h-8 opacity-50 bg-gradient-to-r ${gradient} bg-clip-text`} style={{ color: 'currentColor' }} />
      </div>
    </div>
  );
}

function DebtSection({ severity, debts }) {
  const config = {
    high: {
      title: 'Severidad Alta',
      label: 'Alta',
      textColor: 'text-rose-400',
      bgColor: 'bg-rose-500/5',
      borderColor: 'border-rose-500/20',
      badgeBg: 'bg-gradient-to-r from-rose-500 to-orange-500',
    },
    medium: {
      title: 'Severidad Media',
      label: 'Media',
      textColor: 'text-amber-400',
      bgColor: 'bg-amber-500/5',
      borderColor: 'border-amber-500/20',
      badgeBg: 'bg-gradient-to-r from-amber-500 to-yellow-500',
    },
    low: {
      title: 'Severidad Baja',
      label: 'Baja',
      textColor: 'text-cyan-400',
      bgColor: 'bg-cyan-500/5',
      borderColor: 'border-cyan-500/20',
      badgeBg: 'bg-gradient-to-r from-cyan-500 to-teal-500',
    },
  };

  const cfg = config[severity];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <AlertTriangle className={`w-5 h-5 ${cfg.textColor}`} />
        <h3 className={`text-lg font-semibold ${cfg.textColor}`}>{cfg.title}</h3>
        <span className={`px-2.5 py-0.5 text-xs font-bold text-white rounded-full ${cfg.badgeBg}`}>
          {debts.length}
        </span>
      </div>

      <div className="space-y-2">
        {debts.map((debt, idx) => (
          <div
            key={idx}
            className={`card-dark rounded-xl p-5 ${cfg.bgColor} ${cfg.borderColor} border hover:scale-[1.01] transition-all`}
          >
            <div className="flex items-start gap-4">
              <div className={`p-2.5 bg-white/5 rounded-lg ${cfg.borderColor} border`}>
                <AlertTriangle className={`w-5 h-5 ${cfg.textColor}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-theme-primary font-medium mb-2">{debt.description}</p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                  <span className="text-theme-muted">Característica: <span className="text-cyber">{debt.featureName}</span></span>
                  <span className="text-theme-muted">Tarea: <span className="text-cyber">{debt.taskName}</span></span>
                  <span className="flex items-center gap-1 text-theme-muted">
                    <Clock className="w-3.5 h-3.5" /> {debt.estimated_effort}
                  </span>
                </div>
              </div>
              <span className={`flex-shrink-0 px-2.5 py-1 text-[10px] font-bold text-white rounded-full uppercase tracking-wider ${cfg.badgeBg}`}>
                {cfg.label}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
