'use client';

import Link from 'next/link';
import { ContractStatus, SubAgentSummary } from '@/types';
import { Avatar } from '@/components/shared/Avatar';
import { Mail, Phone, ExternalLink, Plane } from 'lucide-react';

const CONTRACT_BADGE: Record<ContractStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  ACTIVE: 'bg-green-100 text-green-800',
  EXPIRED: 'bg-amber-100 text-amber-800',
  TERMINATED: 'bg-red-100 text-red-800',
};

export function SubagentsList({ subagents }: { subagents: SubAgentSummary[] }) {
  if (subagents.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-card p-6 text-center py-12 text-gray-500">
        No subagents found.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-card border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-gray-50 text-[11px] uppercase tracking-wider text-gray-500">
              <th className="px-5 py-3 font-medium">Subagent</th>
              <th className="px-5 py-3 font-medium">Contact</th>
              <th className="px-5 py-3 font-medium">Contract</th>
              <th className="px-5 py-3 font-medium">KPI Progress</th>
              <th className="px-5 py-3 font-medium text-center">Travelled</th>
              <th className="px-5 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {subagents.map((agent) => {
              const { stats, contract } = agent;
              const hasTarget = stats.studentTarget > 0;
              return (
                <tr key={agent.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={agent.fullName} size="lg" className="w-10 h-10" />
                      <div>
                        <p className="font-medium text-gray-900">{agent.fullName}</p>
                        <span className={`inline-flex mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-medium ${agent.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {agent.status}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-col gap-1 text-xs text-gray-600">
                      <span className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5" /> {agent.email}
                      </span>
                      {agent.phone && (
                        <span className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5" /> {agent.phone}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    {contract ? (
                      <div>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${CONTRACT_BADGE[contract.status]}`}>
                          {contract.status}
                        </span>
                        {contract.endDate && (
                          <p className="text-[11px] text-gray-500 mt-1">
                            ends {new Date(contract.endDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">No contract</span>
                    )}
                  </td>
                  <td className="px-5 py-4 min-w-[180px]">
                    {hasTarget ? (
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-semibold text-gray-900">
                            {stats.studentsRecruited} / {stats.studentTarget}
                          </span>
                          <span className="text-gray-500">{stats.targetProgressPct}%</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              (stats.targetProgressPct ?? 0) >= 100
                                ? 'bg-green-500'
                                : (stats.targetProgressPct ?? 0) >= 50
                                  ? 'bg-blue-500'
                                  : 'bg-amber-500'
                            }`}
                            style={{ width: `${stats.targetProgressPct ?? 0}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-500">
                        {stats.studentsRecruited} student{stats.studentsRecruited === 1 ? '' : 's'} · no target set
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span className="inline-flex items-center gap-1 font-semibold text-gray-900">
                      <Plane className="w-3.5 h-3.5 text-gray-400" />
                      {stats.studentsTravelled}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link
                      href={`/subagents/${agent.id}`}
                      className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                    >
                      View Details
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
