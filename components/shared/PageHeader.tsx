import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  actions?: ReactNode;
}

export function PageHeader({ title, description, breadcrumbs, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-start justify-between mb-6 gap-4">
      <div>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex text-sm text-gray-500 mb-2">
            {breadcrumbs.map((crumb, i) => (
              <span key={i} className="flex items-center">
                {crumb.href ? (
                  <a href={crumb.href} className="hover:text-gray-900">{crumb.label}</a>
                ) : (
                  <span className="text-gray-900">{crumb.label}</span>
                )}
                {i < breadcrumbs.length - 1 && <span className="mx-2">/</span>}
              </span>
            ))}
          </nav>
        )}
        <h1 className="text-2xl font-bold font-urbanist text-gray-900">{title}</h1>
        {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
      </div>
      
      {actions && (
        <div className="flex items-center gap-3">
          {actions}
        </div>
      )}
    </div>
  );
}
