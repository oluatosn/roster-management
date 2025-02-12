import React from 'react';

interface AlertProps {
  className?: string;
  children: React.ReactNode;
}

export function Alert({ className = '', children }: AlertProps) {
  return (
    <div className={`relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground ${className}`}>
      {children}
    </div>
  );
}

export function AlertDescription({ className = '', children }: AlertProps) {
  return (
    <div className={`text-sm [&_p]:leading-relaxed ${className}`}>
      {children}
    </div>
  );
}
