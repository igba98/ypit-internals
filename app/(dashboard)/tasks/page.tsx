import { PageHeader } from '@/components/shared/PageHeader';
import { TaskCardGrid } from './_components/TaskCardGrid';
import { TaskKanban } from './_components/TaskKanban';
import { getTasksByAssignee, mockTasks } from '@/lib/mock/mockTasks';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { CreateTaskButton } from './_components/CreateTaskButton';
import { SubmitReportButton } from './_components/SubmitReportButton';
import { TaskListView } from './_components/TaskListView';

export default async function TasksPage({ searchParams }: { searchParams: Promise<{ view?: string, filter?: string }> }) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('ypit_session');
  
  if (!sessionCookie) {
    redirect('/login');
  }
  
  const session = JSON.parse(sessionCookie.value);
  const awaitedSearchParams = await searchParams;
  
  const view = awaitedSearchParams.view || 'grid';
  const filter = awaitedSearchParams.filter || 'my-tasks';

  // Apply URL filters actively against mock properties natively
  let displayedTasks = mockTasks;
  if (filter === 'my-tasks') {
    displayedTasks = getTasksByAssignee(session.userId);
  } else if (filter === 'assigned-by-me') {
    displayedTasks = mockTasks.filter(t => t.assignedById === session.userId);
  } else if (filter === 'department') {
    // Show tasks assigned to anyone in the same department (allowing Heads to see Personal Tasks created by staff)
    // For demonstration, we just filter by the session user's department.
    displayedTasks = mockTasks.filter(t => t.department === session.department);
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Task Manager" 
        description="Manage your daily tasks and end-of-day reports."
        actions={
          <div className="flex items-center gap-3">
            <SubmitReportButton />
            <CreateTaskButton />
          </div>
        }
      />
      
      <div className="bg-white rounded-xl shadow-card p-6">
        <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
          <div className="flex gap-6">
            <Link href={`?view=${view}&filter=my-tasks`} scroll={false} className={`pb-4 -mb-[17px] font-medium transition-colors ${filter === 'my-tasks' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 hover:text-gray-900'}`}>
              My Tasks
            </Link>
            <Link href={`?view=${view}&filter=assigned-by-me`} scroll={false} className={`pb-4 -mb-[17px] font-medium transition-colors ${filter === 'assigned-by-me' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 hover:text-gray-900'}`}>
              Assigned by Me
            </Link>
            <Link href={`?view=${view}&filter=department`} scroll={false} className={`pb-4 -mb-[17px] font-medium transition-colors ${filter === 'department' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 hover:text-gray-900'}`}>
              Department
            </Link>
          </div>
          <div className="flex gap-2">
            <Link href={`?view=grid&filter=${filter}`} scroll={false} className={`p-2 rounded transition-colors ${view === 'grid' ? 'bg-gray-100 text-gray-700' : 'text-gray-500 hover:bg-gray-50'}`}>Grid</Link>
            <Link href={`?view=board&filter=${filter}`} scroll={false} className={`p-2 rounded transition-colors ${view === 'board' ? 'bg-gray-100 text-gray-700' : 'text-gray-500 hover:bg-gray-50'}`}>Board</Link>
            <Link href={`?view=list&filter=${filter}`} scroll={false} className={`p-2 rounded transition-colors ${view === 'list' ? 'bg-gray-100 text-gray-700' : 'text-gray-500 hover:bg-gray-50'}`}>List</Link>
          </div>
        </div>
        
        {view === 'grid' && <TaskCardGrid initialTasks={displayedTasks} />}
        {view === 'board' && <TaskKanban initialTasks={displayedTasks} />}
        {view === 'list' && <TaskListView initialTasks={displayedTasks} />}
      </div>
    </div>
  );
}
