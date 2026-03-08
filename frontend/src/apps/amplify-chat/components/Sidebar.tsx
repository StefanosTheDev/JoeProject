import { Link } from "react-router-dom";

export interface Conversation {
  id: string;
  title: string;
  createdAt: Date;
}

interface SidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  collapsed: boolean;
  onToggle: () => void;
  onNewChat: () => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

function groupByDate(conversations: Conversation[]) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const weekAgo = new Date(today.getTime() - 7 * 86400000);

  const groups: { label: string; items: Conversation[] }[] = [
    { label: "Today", items: [] },
    { label: "Yesterday", items: [] },
    { label: "Previous 7 Days", items: [] },
    { label: "Older", items: [] },
  ];

  for (const c of conversations) {
    const d = new Date(c.createdAt);
    if (d >= today) groups[0].items.push(c);
    else if (d >= yesterday) groups[1].items.push(c);
    else if (d >= weekAgo) groups[2].items.push(c);
    else groups[3].items.push(c);
  }

  return groups.filter((g) => g.items.length > 0);
}

const s = {
  aside: "bg-[var(--sidebar-bg)] text-[var(--sidebar-fg)] border-[var(--sidebar-border)]",
  muted: "text-[var(--sidebar-muted)]",
  item: "text-[var(--sidebar-muted)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-fg)]",
  active: "bg-[var(--sidebar-active)] text-[var(--sidebar-fg)]",
  divider: "border-[var(--sidebar-border)]",
};

export default function Sidebar({
  conversations,
  activeId,
  collapsed,
  onToggle,
  onNewChat,
  onSelect,
  onDelete,
}: SidebarProps) {
  return (
    <aside
      className={`flex h-dvh flex-col border-r transition-all duration-200 ${s.aside} ${
        collapsed ? "w-0 overflow-hidden border-r-0" : "w-[260px]"
      }`}
    >
      <div className="flex items-center justify-between px-3 pt-3 pb-1">
        <button
          onClick={onToggle}
          className={`flex size-9 items-center justify-center rounded-lg transition-colors ${s.item}`}
          aria-label="Collapse sidebar"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="size-5">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M9 3v18" />
          </svg>
        </button>
      </div>

      <div className={`border-b px-2 pt-1 pb-2 ${s.divider}`}>
        <Link
          to="/"
          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${s.item}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="size-[18px]">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          Home
        </Link>
        <button
          onClick={onNewChat}
          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${s.item}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="size-[18px]">
            <path d="M12 5v14M5 12h14" />
          </svg>
          New chat
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 pt-2 pb-3">
        {conversations.length > 0 ?
          groupByDate(conversations).map((group) => (
            <div key={group.label} className="mb-2">
              <p className={`px-3 py-1 text-[11px] font-medium ${s.muted}`}>
                {group.label}
              </p>
              {group.items.map((c) => (
                <button
                  key={c.id}
                  onClick={() => onSelect(c.id)}
                  className={`group flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-left text-[13px] font-normal transition-colors ${
                    c.id === activeId ? s.active : s.item
                  }`}
                >
                  <span className="flex-1 truncate">{c.title}</span>
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(c.id);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.stopPropagation();
                        onDelete(c.id);
                      }
                    }}
                    className="flex size-6 shrink-0 items-center justify-center rounded opacity-0 transition-opacity hover:bg-[var(--sidebar-hover)] group-hover:opacity-100"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="size-3.5">
                      <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                    </svg>
                  </span>
                </button>
              ))}
            </div>
          )) : (
          <p className={`px-3 text-xs ${s.muted}`}>No conversations yet</p>
        )}
      </nav>
    </aside>
  );
}
