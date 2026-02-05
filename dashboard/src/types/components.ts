import type { ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'destructive' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  icon?: ReactNode;
}

export type BadgeVariant = 'pending' | 'scheduled' | 'published' | 'rejected' | 'default';

export interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  pulse?: boolean;
  className?: string;
}

export type CardVariant = 'primary' | 'secondary';

export interface CardProps {
  variant?: CardVariant;
  children: ReactNode;
  className?: string;
}

export type StatColor = 'amber' | 'emerald' | 'red' | 'sky';

export interface StatCardProps {
  label: string;
  value: string | number;
  tagLabel?: string;
  color: StatColor;
  icon: ReactNode;
  decorative?: boolean;
}
