'use client';

import Link from 'next/link';
import { User } from '@/types';
import { Mail, Phone, ExternalLink } from 'lucide-react';

interface SubagentWithStats extends User {
  totalLeads: number;
  convertedLeads: number;
}

export function SubagentsList({ subagents }: { subagents: SubagentWithStats[] }) {
  if (subagents.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No subagents found.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="pb-3 font-medium text-gray-500">Subagent</th>
            <th className="pb-3 font-medium text-gray-500">Contact</th>
            <th className="pb-3 font-medium text-gray-500">Status</th>
            <th className="pb-3 font-medium text-gray-500">Referred Leads</th>
            <th className="pb-3 font-medium text-gray-500">Converted Leads</th>
            <th className="pb-3 font-medium text-gray-500">Actions</th>
          </tr>
        </thead>
        <tbody>
          {subagents.map((agent) => (
            <tr key={agent.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
              <td className="py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden shrink-0">
                    {agent.avatar ? (
                      <img src={agent.avatar} alt={agent.fullName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 font-medium">
                        {agent.fullName.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="font-medium text-gray-900">{agent.fullName}</div>
                </div>
              </td>
              <td className="py-4">
                <div className="flex flex-col gap-1 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    {agent.email}
                  </div>
                  {agent.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      {agent.phone}
                    </div>
                  )}
                </div>
              </td>
              <td className="py-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                  ${agent.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                `}>
                  {agent.status}
                </span>
              </td>
              <td className="py-4">
                <div className="font-medium text-gray-900">{agent.totalLeads}</div>
              </td>
              <td className="py-4">
                <div className="font-medium text-gray-900">{agent.convertedLeads}</div>
              </td>
              <td className="py-4">
                <Link
                  href={`/subagents/${agent.id}`}
                  className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  View Details
                  <ExternalLink className="w-4 h-4" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
