'use client';

import { Lead } from '@/types';
import { cn, formatDate } from '@/lib/utils';
import { Phone, Mail, MoreVertical, Calendar, Eye } from 'lucide-react';
import { motion } from 'motion/react';
import { ActionDropdown } from '@/components/shared/ActionDropdown';

interface LeadCardProps {
  lead: Lead;
  onClick: (lead: Lead) => void;
  isDragging?: boolean;
}

export function LeadCard({ lead, onClick, isDragging }: LeadCardProps) {
  const sourceColors = {
    SOCIAL_MEDIA: 'bg-blue-100 text-blue-700',
    SCHOOL_VISIT: 'bg-green-100 text-green-700',
    SUB_AGENT: 'bg-purple-100 text-purple-700',
    REFERRAL: 'bg-amber-100 text-amber-700',
    WALK_IN: 'bg-gray-100 text-gray-700',
    WEBSITE: 'bg-indigo-100 text-indigo-700'
  };

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      onClick={() => onClick(lead)}
      className={cn(
        "bg-white rounded-xl shadow-card p-4 cursor-pointer transition-all duration-200 border-l-4 border-transparent hover:shadow-card-hover",
        isDragging && "opacity-50 shadow-elevated",
        "hover:border-primary"
      )}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-urbanist font-bold text-gray-900 text-lg leading-tight truncate pr-2">
          {lead.fullName}
        </h3>
        <ActionDropdown basePath="/leads" record={lead} />
      </div>

      <div className="flex flex-col gap-1.5 mb-3">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <span className="truncate">{lead.phone}</span>
        </div>
        {lead.email && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span className="truncate">{lead.email}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 mb-3">
        <span className={cn("px-2 py-0.5 rounded text-[10px] font-medium", sourceColors[lead.source])}>
          {lead.source.replace('_', ' ')}
        </span>
        {lead.interestedCountry && (
          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-medium truncate">
            {lead.interestedCountry}
          </span>
        )}
      </div>

      <p className="font-urbanist text-sm text-gray-500 line-clamp-2 mb-4 h-10">
        {lead.interestedIn}
      </p>

      <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-50">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gray-200 overflow-hidden shrink-0">
            {lead.assignedToId ? (
              <img src={`https://i.pravatar.cc/150?u=${lead.assignedToId}`} alt={lead.assignedToName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500 text-[10px] font-medium">?</div>
            )}
          </div>
          <span className="text-xs font-medium text-gray-700 truncate max-w-[80px]">
            {lead.assignedToName || 'Unassigned'}
          </span>
        </div>
        
        <div className="flex items-center gap-1 text-[10px] text-gray-400 font-medium">
          <Calendar className="w-3 h-3" />
          {formatDate(lead.createdAt)}
        </div>
      </div>
    </motion.div>
  );
}
