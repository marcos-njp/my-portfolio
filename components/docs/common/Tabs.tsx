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
  layout?: "grid" | "scroll";
}

export function Tabs({ items, defaultTab, className = "", layout = "grid" }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || items[0]?.id);
  const activeItem = items.find((item) => item.id === activeTab);
  const useScrollLayout = layout === "scroll";

  return (
    <div className={className}>
      <div
        className={
          useScrollLayout
            ? "mb-4 flex overflow-x-auto border-b border-border scrollbar-hide"
            : "mb-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-0 sm:border-b sm:border-border"
        }
      >
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`rounded-md px-4 py-3 text-left text-sm font-medium transition-colors flex items-start gap-2 ${
                useScrollLayout
                  ? "shrink-0 whitespace-nowrap rounded-none border-b-2 -mb-px"
                  : "min-w-0 whitespace-normal sm:items-center sm:rounded-none sm:border-b-2 sm:-mb-px sm:whitespace-nowrap"
              } ${
                isActive
                  ? useScrollLayout
                    ? "border-primary text-foreground"
                    : "bg-secondary text-foreground sm:bg-transparent sm:border-primary"
                  : useScrollLayout
                    ? "border-transparent text-muted-foreground hover:text-foreground"
                    : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground sm:border-transparent sm:hover:bg-transparent"
              }`}
            >
              {Icon && <Icon className="w-4 h-4" strokeWidth={1.75} />}
              {item.label}
            </button>
          );
        })}
      </div>
      {activeItem && <div className="space-y-4">{activeItem.content}</div>}
    </div>
  );
}
