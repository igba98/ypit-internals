import { Role } from '@/types';

export type FieldSpecKind =
  | 'text'
  | 'textarea'
  | 'number'
  | 'date'
  | 'boolean'
  | 'url'
  | 'select'
  | 'userSelect'
  | 'paymentMethodSelect';

export interface BaseFieldSpec {
  key: string;
  label: string;
  required: boolean;
  helpText?: string;
}

export type FieldSpec =
  | (BaseFieldSpec & { kind: 'text' | 'textarea' | 'date' | 'url' })
  | (BaseFieldSpec & { kind: 'number'; min?: number; currency?: string })
  | (BaseFieldSpec & { kind: 'boolean'; defaultValue?: boolean })
  | (BaseFieldSpec & { kind: 'select'; options: { value: string; label: string }[] })
  | (BaseFieldSpec & { kind: 'userSelect'; roles: Role[] })
  | (BaseFieldSpec & { kind: 'paymentMethodSelect' });