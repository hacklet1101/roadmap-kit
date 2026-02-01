import React, { useState } from 'react';
import { Package, Code, Database, Copy, Check, Layers, FileCode, ChevronDown, AlertTriangle } from 'lucide-react';

export default function SharedResources({ resources = {} }) {
  const [copiedItem, setCopiedItem] = useState(null);
  const [expanded, setExpanded] = useState({ ui: true, utils: true, db: true });

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(id);
    setTimeout(() => setCopiedItem(null), 2000);
  };

  const { ui_components = [], utilities = [], database_tables = [] } = resources;
  const total = ui_components.length + utilities.length + database_tables.length;

  if (total === 0) {
    return (
      <div className="card-dark rounded-2xl p-12 text-center">
        <Package className="w-12 h-12 mx-auto mb-4 text-theme-muted" />
        <h3 className="text-lg font-semibold text-theme-secondary mb-2">Sin recursos compartidos</h3>
        <p className="text-theme-muted text-sm">Agrega componentes en roadmap.json</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 stagger">
        <StatCard icon={Layers} label="Componentes UI" value={ui_components.length} gradient="from-blue-500 to-cyan-500" />
        <StatCard icon={Code} label="Utilidades" value={utilities.length} gradient="from-cyan-500 to-teal-500" />
        <StatCard icon={Database} label="Tablas DB" value={database_tables.length} gradient="from-teal-500 to-emerald-500" />
      </div>

      {/* UI Components */}
      {ui_components.length > 0 && (
        <Section
          title="Componentes UI"
          icon={Layers}
          color="blue"
          isOpen={expanded.ui}
          onToggle={() => setExpanded(p => ({ ...p, ui: !p.ui }))}
        >
          <div className="space-y-2">
            {ui_components.map((c, i) => (
              <ResourceItem
                key={i}
                path={c.path}
                description={c.description}
                usage={c.usage}
                color="blue"
                copyId={`ui-${i}`}
                copiedItem={copiedItem}
                onCopy={copyToClipboard}
              />
            ))}
          </div>
        </Section>
      )}

      {/* Utilities */}
      {utilities.length > 0 && (
        <Section
          title="Utilidades"
          icon={Code}
          color="cyan"
          isOpen={expanded.utils}
          onToggle={() => setExpanded(p => ({ ...p, utils: !p.utils }))}
        >
          <div className="space-y-2">
            {utilities.map((u, i) => (
              <ResourceItem
                key={i}
                path={u.path}
                description={u.description}
                usage={u.usage}
                exports={u.exports}
                warning={u.warning}
                color="cyan"
                copyId={`util-${i}`}
                copiedItem={copiedItem}
                onCopy={copyToClipboard}
              />
            ))}
          </div>
        </Section>
      )}

      {/* Database */}
      {database_tables.length > 0 && (
        <Section
          title="Tablas de Base de Datos"
          icon={Database}
          color="emerald"
          isOpen={expanded.db}
          onToggle={() => setExpanded(p => ({ ...p, db: !p.db }))}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {database_tables.map((t, i) => (
              <TableCard
                key={i}
                table={t}
                copyId={`table-${i}`}
                copiedItem={copiedItem}
                onCopy={copyToClipboard}
              />
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, gradient }) {
  return (
    <div className="card-dark rounded-2xl p-5 hover:scale-[1.02] transition-all">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-theme-muted uppercase tracking-wider mb-1">{label}</p>
          <p className={`text-3xl font-bold bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center opacity-80`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}

function Section({ title, icon: Icon, color, isOpen, onToggle, children }) {
  const colors = {
    blue: 'text-blue-400',
    cyan: 'text-cyan-400',
    emerald: 'text-emerald-400',
  };

  return (
    <div className="card-dark rounded-2xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3">
          <Icon className={`w-5 h-5 ${colors[color]}`} />
          <h3 className={`text-lg font-semibold ${colors[color]}`}>{title}</h3>
        </div>
        <ChevronDown className={`w-5 h-5 text-theme-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && <div className="px-6 pb-6 pt-2 border-t border-theme">{children}</div>}
    </div>
  );
}

function ResourceItem({ path, description, usage, exports, warning, color, copyId, copiedItem, onCopy }) {
  const [open, setOpen] = useState(false);
  const colors = {
    blue: 'text-blue-400 border-blue-500/20 bg-blue-500/5',
    cyan: 'text-cyan-400 border-cyan-500/20 bg-cyan-500/5',
  };

  return (
    <div className={`rounded-xl border ${colors[color]} overflow-hidden`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/[0.02] transition-colors text-left"
      >
        <FileCode className={`w-4 h-4 flex-shrink-0 ${colors[color].split(' ')[0]}`} />
        <div className="flex-1 min-w-0">
          <code className={`text-sm ${colors[color].split(' ')[0]}`}>{path}</code>
          <p className="text-xs text-theme-muted truncate mt-0.5">{description}</p>
        </div>
        <ChevronDown className={`w-4 h-4 text-theme-muted transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="px-4 pb-4 pt-2 border-t border-theme space-y-3 animate-fade-in">
          {exports?.length > 0 && (
            <div>
              <span className="text-[10px] text-theme-muted uppercase tracking-wider">Exports:</span>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {exports.map((e, i) => (
                  <span key={i} className="px-2 py-1 text-xs bg-white/5 text-blue-400 rounded border border-blue-500/20">{e}</span>
                ))}
              </div>
            </div>
          )}
          {usage && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] text-theme-muted uppercase tracking-wider">Uso:</span>
                <button onClick={() => onCopy(usage, copyId)} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                  {copiedItem === copyId ? <><Check className="w-3 h-3" /> Copiado</> : <><Copy className="w-3 h-3" /> Copiar</>}
                </button>
              </div>
              <div className="bg-white/5 rounded-lg p-3 border border-theme">
                <code className="text-sm text-blue-400">{usage}</code>
              </div>
            </div>
          )}
          {warning && (
            <div className="flex items-start gap-2 bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
              <AlertTriangle className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
              <span className="text-xs text-orange-300">{warning}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TableCard({ table, copyId, copiedItem, onCopy }) {
  return (
    <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 hover:border-emerald-500/40 transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-emerald-400" />
          <code className="text-base font-semibold text-emerald-400">{table.name}</code>
        </div>
        <button onClick={() => onCopy(table.name, copyId)} className="p-1.5 hover:bg-white/5 rounded-lg transition-colors">
          {copiedItem === copyId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-theme-muted" />}
        </button>
      </div>
      <p className="text-sm text-theme-secondary mb-3">{table.description}</p>
      {table.fields?.length > 0 && (
        <div>
          <span className="text-[10px] text-theme-muted uppercase tracking-wider">Campos:</span>
          <div className="flex flex-wrap gap-1 mt-1.5">
            {table.fields.map((f, i) => (
              <span key={i} className="text-xs bg-white/5 px-2 py-1 rounded text-theme-secondary border border-emerald-500/10">{f}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
