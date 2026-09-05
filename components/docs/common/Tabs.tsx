import { ReactNode, useState } from "react";
import { LucideIcon } from "lucide-react";

interface TabItem {
  id: string;
  label: string;
  icon?: LucideIcon;
  content: ReactNode;
}

interface TabsProps {
  items: TabItem[];
  defaultTab?: string;
  className?: string;
  /** Accepted for compatibility; tabs always wrap now so they never get cut off. */
  layout?: string;
}

export function Tabs({ items, defaultTab, className = "" }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || items[0]?.id);
  const activeItem = items.find((item) => item.id === activeTab);

  return (
    <div className={className}>
      {/* Wrapping pill tabs — never cut off, no icons */}
      <div className="flex flex-wrap gap-2 mb-4">
        {items.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`px-3 py-1.5 text-sm font-medium rounded-sm border transition-colors ${
                isActive
                  ? "border-foreground text-foreground bg-secondary"
                  : "border-border text-muted-foreground hover:text-foreground hover:border-foreground"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      {activeItem && <div className="space-y-4">{activeItem.content}</div>}
    </div>
  );
}
