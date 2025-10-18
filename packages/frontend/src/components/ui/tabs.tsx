import React, { createContext, useContext } from 'react';

type TabsValue = string;

interface TabsContextValue {
  value: TabsValue;
  setValue: (v: TabsValue) => void;
}

const TabsCtx = createContext<TabsContextValue | null>(null);

interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  value: TabsValue;
  onValueChange: (v: TabsValue) => void;
}

export const Tabs: React.FC<TabsProps> = ({ value, onValueChange, className, children, ...props }) => {
  const ctx: TabsContextValue = { value, setValue: onValueChange };
  return (
    <div className={className} {...props}>
      <TabsCtx.Provider value={ctx}>{children}</TabsCtx.Provider>
    </div>
  );
};

export const TabsList: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div
    className={['inline-flex items-center gap-1 rounded-md bg-gray-100 p-1', className]
      .filter(Boolean)
      .join(' ')}
    {...props}
  />
);

interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: TabsValue;
}
export const TabsTrigger: React.FC<TabsTriggerProps> = ({ value, className, children, ...props }) => {
  const ctx = useContext(TabsCtx);
  if (!ctx) return null;
  const selected = ctx.value === value;
  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      onClick={() => ctx.setValue(value)}
      className={[
        'px-3 py-1.5 text-sm rounded-md',
        selected ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-900',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </button>
  );
};

interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: TabsValue;
}
export const TabsContent: React.FC<TabsContentProps> = ({ value, className, children, ...props }) => {
  const ctx = useContext(TabsCtx);
  if (!ctx) return null;
  if (ctx.value !== value) return null;
  return (
    <div role="tabpanel" className={className} {...props}>
      {children}
    </div>
  );
};

export default Tabs;