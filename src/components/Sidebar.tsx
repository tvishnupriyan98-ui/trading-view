import { BookOpen, Cpu, Play, Terminal, X } from 'lucide-react';
import type { ReactNode } from 'react';

export type NavSection = 'analyze' | 'guide' | 'commands' | 'environment';

interface SidebarProps {
  activeSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  reaVersion: string;
  commandCount: number;
  runCount: number;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

interface NavItem {
  id: NavSection;
  label: string;
  meta?: string;
  icon: ReactNode;
}

export function Sidebar({
  activeSection,
  onSelectSection,
  reaVersion,
  commandCount,
  runCount,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const navItems: NavItem[] = [
    {
      id: 'analyze',
      label: 'Workbench',
      meta: runCount > 0 ? String(runCount) : undefined,
      icon: <Play className="w-4 h-4 shrink-0" aria-hidden="true" />,
    },
    {
      id: 'guide',
      label: 'What You Can Do',
      icon: <BookOpen className="w-4 h-4 shrink-0" aria-hidden="true" />,
    },
    {
      id: 'commands',
      label: 'CLI & MCP Catalog',
      meta: commandCount > 0 ? String(commandCount) : undefined,
      icon: <Terminal className="w-4 h-4 shrink-0" aria-hidden="true" />,
    },
    {
      id: 'environment',
      label: 'Doctor & Setup',
      icon: <Cpu className="w-4 h-4 shrink-0" aria-hidden="true" />,
    },
  ];

  const handleSelect = (id: NavSection) => {
    onSelectSection(id);
    onCloseMobile();
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-slate-200">
      <div className="h-14 px-5 flex items-center justify-between border-b border-slate-200 shrink-0">
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            handleSelect('analyze');
          }}
          className="font-display text-base font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
        >
          REA Workbench
        </a>
        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Close navigation menu"
          className="lg:hidden p-1.5 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <nav aria-label="Workspace navigation" className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelect(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
                isActive
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <span className="flex items-center gap-2.5 truncate">
                {item.icon}
                <span className="truncate">{item.label}</span>
              </span>
              {item.meta && (
                <span
                  className={`font-mono text-xs tabular-nums ${
                    isActive ? 'text-slate-300' : 'text-slate-400'
                  }`}
                >
                  {item.meta}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="px-5 py-4 border-t border-slate-200 text-xs text-slate-500 space-y-1 shrink-0">
        <div className="font-medium text-slate-700">morluto/rea</div>
        <div className="font-mono tabular-nums text-slate-500">
          rea-agents {reaVersion}
        </div>
        <div className="text-slate-400">Local static runtime</div>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block w-60 shrink-0 h-screen sticky top-0">
        {sidebarContent}
      </aside>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <button
            type="button"
            aria-label="Dismiss navigation backdrop"
            onClick={onCloseMobile}
            className="fixed inset-0 bg-slate-900/40"
          />
          <aside className="relative z-50 w-64 max-w-[80vw] h-full">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
