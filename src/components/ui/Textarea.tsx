import { useId } from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({ label, error, className = '', id: propsId, ...props }: TextareaProps) {
  const generatedId = useId();
  const id = propsId ?? (label ? generatedId : undefined);
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-text-primary">
          {label}
        </label>
      )}
      <textarea
        id={id}
        className={`
          w-full px-4 py-2.5 bg-panel text-text-primary
          border-2 border-nebula rounded-button
          focus:border-portal focus:outline-none focus:ring-2 focus:ring-portal-glow
          transition-all duration-200
          placeholder:text-text-secondary
          disabled:opacity-50 disabled:cursor-not-allowed
          resize-none
          ${error ? 'border-red-500' : ''}
          ${className}
        `}
        {...props}
      />
      {error && (
        <span className="text-xs text-red-400">{error}</span>
      )}
    </div>
  );
}
