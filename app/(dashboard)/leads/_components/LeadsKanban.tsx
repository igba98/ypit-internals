'use client';

import { useState } from 'react';
import { Lead } from '@/types';
import { LeadCard } from './LeadCard';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';

const COLUMNS = [
  { id: 'NEW', title: 'New', color: 'bg-gray-50' },
  { id: 'CONTACTED', title: 'Contacted', color: 'bg-blue-50' },
  { id: 'COUNSELED', title: 'Counseled', color: 'bg-amber-50' },
  { id: 'CONVERTED', title: 'Converted', color: 'bg-green-50' },
];

interface SortableLeadProps {
  lead: Lead;
  onClick: (lead: Lead) => void;
}

function SortableLead({ lead, onClick }: SortableLeadProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead.id, data: { type: 'Lead', lead } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="mb-3">
      <LeadCard lead={lead} onClick={onClick} isDragging={isDragging} />
    </div>
  );
}

interface LeadsKanbanProps {
  initialLeads: Lead[];
}

export function LeadsKanban({ initialLeads }: LeadsKanbanProps) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads.filter(l => l.status !== 'LOST'));
  const [activeLead, setActiveLead] = useState<Lead | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const lead = leads.find((l) => l.id === active.id);
    if (lead) setActiveLead(lead);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveLead = active.data.current?.type === 'Lead';
    const isOverLead = over.data.current?.type === 'Lead';
    const isOverColumn = COLUMNS.some((col) => col.id === overId);

    if (!isActiveLead) return;

    if (isActiveLead && isOverLead) {
      setLeads((leads) => {
        const activeIndex = leads.findIndex((l) => l.id === activeId);
        const overIndex = leads.findIndex((l) => l.id === overId);

        if (leads[activeIndex].status !== leads[overIndex].status) {
          const newLeads = [...leads];
          newLeads[activeIndex].status = leads[overIndex].status;
          return arrayMove(newLeads, activeIndex, overIndex);
        }

        return arrayMove(leads, activeIndex, overIndex);
      });
    }

    if (isActiveLead && isOverColumn) {
      setLeads((leads) => {
        const activeIndex = leads.findIndex((l) => l.id === activeId);
        const newLeads = [...leads];
        newLeads[activeIndex].status = overId as any;
        return arrayMove(newLeads, activeIndex, activeIndex);
      });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveLead(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveLead = active.data.current?.type === 'Lead';
    if (!isActiveLead) return;

    setLeads((leads) => {
      const activeIndex = leads.findIndex((l) => l.id === activeId);
      const overIndex = leads.findIndex((l) => l.id === overId);

      if (activeIndex !== -1 && overIndex !== -1) {
        return arrayMove(leads, activeIndex, overIndex);
      }
      return leads;
    });
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-6 overflow-x-auto pb-4 custom-scrollbar">
        {COLUMNS.map((col) => {
          const columnLeads = leads.filter((l) => l.status === col.id);
          return (
            <div key={col.id} className={cn("flex-1 min-w-[300px] rounded-xl p-4", col.color)}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-urbanist font-bold text-gray-900">{col.title}</h3>
                <span className="bg-white text-gray-500 text-xs font-bold px-2 py-1 rounded-full shadow-sm">
                  {columnLeads.length}
                </span>
              </div>
              
              <SortableContext items={columnLeads.map(l => l.id)} strategy={verticalListSortingStrategy}>
                <div className="min-h-[200px]">
                  {columnLeads.map((lead) => (
                    <SortableLead key={lead.id} lead={lead} onClick={(l) => console.log('Clicked', l.id)} />
                  ))}
                </div>
              </SortableContext>
            </div>
          );
        })}
      </div>

      <DragOverlay>
        {activeLead ? <LeadCard lead={activeLead} onClick={() => {}} isDragging /> : null}
      </DragOverlay>
    </DndContext>
  );
}
