import React, { useState } from 'react';
import {
  CheckCircle2, Clock, Circle, GitCommit, ExternalLink,
  Copy, Check, ChevronDown, FileCode, Recycle, Bot, AlertTriangle
} from 'lucide-react';

export default function TaskList({ tasks = [], featureId = '', onUpdateStatus }) {
  const [copiedItem, setCopiedItem] = useState(null);
  const [expandedTask, setExpandedTask] = useState(null);

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(id);
    setTimeout(() => setCopiedItem(null), 2000);
  };

  const statusConfig = {
    completed: {
      icon: CheckCircle2,
      label: 'Completado',
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/30',
      glow: 'shadow-emerald-500/20'
    },
    in_progress: {
      icon: Clock,
      label: 'En Progreso',
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/30',
      glow: 'shadow-amber-500/20'
    },
    pending: {
      icon: Circle,
      label: 'Pendiente',
      color: 'text-gray-400',
      bg: 'bg-gray-500/10',
      border: 'border-gray-500/30',
      glow: ''
    }
  };

  const priorityConfig = {
    high: { label: 'Alta', color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/30' },
    medium: { label: 'Media', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
    low: { label: 'Baja', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' }
  };

  const cycleStatus = (current) => {
    const order = ['pending', 'in_progress', 'completed'];
    return order[(order.indexOf(current) + 1) % order.length];
  };

  if (!tasks?.length) {
    return (
      <div className="py-8 text-center">
        <Circle className="w-10 h-10 mx-auto mb-3 text-gray-600" />
        <p className="text-gray-500 text-sm">No hay tareas definidas</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {tasks.map((task) => {
        const status = statusConfig[task.status] || statusConfig.pending;
        const priority = priorityConfig[task.priority] || priorityConfig.medium;
        const StatusIcon = status.icon;
        const isExpanded = expandedTask === task.id;

        return (
          <div key={task.id} className={`rounded-xl border ${status.border} ${status.bg} transition-all hover:border-blue-500/30`}>
            {/* Header */}
            <div className="flex items-center gap-3 p-4">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onUpdateStatus) {
                    onUpdateStatus(featureId, task.id, cycleStatus(task.status));
                  }
                }}
                className={`flex-shrink-0 w-8 h-8 rounded-lg ${status.bg} ${status.border} border flex items-center justify-center transition-all hover:scale-110 shadow-lg ${status.glow}`}
                title={`Click para cambiar estado (Actual: ${status.label})`}
              >
                <StatusIcon className={`w-4 h-4 ${status.color}`} />
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className={`font-medium ${task.status === 'completed' ? 'text-gray-500 line-through' : 'text-white'}`}>
                    {task.name}
                  </h4>
                  <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full border ${priority.bg} ${priority.border} ${priority.color}`}>
                    {priority.label}
                  </span>
                </div>
                <p className="text-sm text-gray-500 line-clamp-1 mt-0.5">{task.description}</p>
              </div>

              {/* Quick stats */}
              <div className="hidden sm:flex items-center gap-3 text-xs text-gray-500">
                {task.metrics?.lines_added > 0 && (
                  <span>
                    <span className="text-emerald-400">+{task.metrics.lines_added}</span>
                    <span className="mx-0.5">/</span>
                    <span className="text-rose-400">-{task.metrics.lines_removed}</span>
                  </span>
                )}
                {task.technical_debt?.length > 0 && (
                  <span className="flex items-center gap-1 text-orange-400">
                    <AlertTriangle className="w-3 h-3" />
                    {task.technical_debt.length}
                  </span>
                )}
              </div>

              <button
                onClick={() => setExpandedTask(isExpanded ? null : task.id)}
                className={`p-2 rounded-lg hover:bg-white/5 transition-all ${isExpanded ? 'bg-white/5' : ''}`}
              >
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* Expanded */}
            {isExpanded && (
              <div className="px-4 pb-4 pt-2 border-t border-white/5 space-y-4 animate-fade-in">
                <p className="text-sm text-gray-300">{task.description}</p>

                {/* Metrics */}
                {task.metrics?.lines_added > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <MetricCard label="Lineas" value={<><span className="text-emerald-400">+{task.metrics.lines_added}</span> / <span className="text-rose-400">-{task.metrics.lines_removed}</span></>} />
                    <MetricCard label="Archivos" value={task.metrics.files_created + task.metrics.files_modified} color="text-blue-400" />
                    <MetricCard label="Complejidad" value={`${task.metrics.complexity_score}/10`} color="text-amber-400" />
                    <MetricCard label="Commits" value={task.git?.commits?.length || 0} color="text-cyan-400" />
                  </div>
                )}

                {/* Files */}
                {task.affected_files?.length > 0 && (
                  <div>
                    <h5 className="flex items-center gap-2 text-xs text-gray-500 uppercase tracking-wider mb-2">
                      <FileCode className="w-3.5 h-3.5" /> Archivos
                    </h5>
                    <div className="flex flex-wrap gap-2">
                      {task.affected_files.map((file, idx) => (
                        <button
                          key={idx}
                          onClick={() => copyToClipboard(file, `file-${task.id}-${idx}`)}
                          className="group flex items-center gap-2 text-xs bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 hover:border-blue-500/30 transition-all"
                        >
                          <code className="text-blue-400">{file}</code>
                          {copiedItem === `file-${task.id}-${idx}` ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3 text-gray-500 group-hover:text-blue-400" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Resources */}
                {task.reused_resources?.length > 0 && (
                  <div>
                    <h5 className="flex items-center gap-2 text-xs text-gray-500 uppercase tracking-wider mb-2">
                      <Recycle className="w-3.5 h-3.5" /> Recursos
                    </h5>
                    <div className="flex flex-wrap gap-2">
                      {task.reused_resources.map((r, idx) => (
                        <span key={idx} className="px-3 py-1.5 text-xs bg-cyan-500/10 text-cyan-400 rounded-lg border border-cyan-500/20">
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI Notes */}
                {task.ai_notes?.trim() && (
                  <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
                    <h5 className="flex items-center gap-2 text-xs text-blue-400 uppercase tracking-wider mb-2">
                      <Bot className="w-3.5 h-3.5" /> Notas IA
                    </h5>
                    <p className="text-sm text-gray-300">{task.ai_notes}</p>
                  </div>
                )}

                {/* Debt */}
                {task.technical_debt?.length > 0 && (
                  <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-4">
                    <h5 className="flex items-center gap-2 text-xs text-orange-400 uppercase tracking-wider mb-3">
                      <AlertTriangle className="w-3.5 h-3.5" /> Deuda ({task.technical_debt.length})
                    </h5>
                    <div className="space-y-2">
                      {task.technical_debt.map((debt, idx) => (
                        <div key={idx} className="flex items-start gap-3">
                          <span className={`flex-shrink-0 px-2 py-0.5 text-[10px] font-bold rounded uppercase ${
                            debt.severity === 'high' ? 'bg-rose-500 text-white' :
                            debt.severity === 'medium' ? 'bg-amber-500 text-black' :
                            'bg-blue-500 text-white'
                          }`}>
                            {debt.severity}
                          </span>
                          <div>
                            <p className="text-sm text-gray-300">{debt.description}</p>
                            <p className="text-xs text-gray-500 mt-1">{debt.estimated_effort}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Git */}
                {task.git?.last_commit && (
                  <div className="flex items-center gap-4 pt-3 border-t border-white/5">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <GitCommit className="w-3.5 h-3.5" />
                      <code className="text-blue-400">{task.git.last_commit.substring(0, 7)}</code>
                    </div>
                    {task.git.pr_url && (
                      <a href={task.git.pr_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300">
                        PR #{task.git.pr_number}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                )}

                {/* Status buttons */}
                <div className="flex items-center gap-2 pt-3 border-t border-white/5">
                  <span className="text-xs text-gray-500">Estado:</span>
                  <div className="flex gap-1">
                    {['pending', 'in_progress', 'completed'].map((s) => {
                      const cfg = statusConfig[s];
                      const Icon = cfg.icon;
                      const active = task.status === s;
                      return (
                        <button
                          key={s}
                          onClick={() => onUpdateStatus?.(featureId, task.id, s)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border transition-all ${
                            active ? `${cfg.bg} ${cfg.border} ${cfg.color}` : 'border-white/10 text-gray-500 hover:border-white/20'
                          }`}
                        >
                          <Icon className="w-3 h-3" />
                          {cfg.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function MetricCard({ label, value, color = 'text-white' }) {
  return (
    <div className="bg-white/5 rounded-lg p-3 border border-white/5">
      <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">{label}</div>
      <div className={`text-lg font-bold ${color}`}>{value}</div>
    </div>
  );
}
