import { useParams, useNavigate } from 'react-router';
import {
  ArrowLeft,
  Calendar,
  User,
  AlertCircle,
  Tag,
  CheckCircle,
  MessageSquare,
  Paperclip,
  Clock,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Separator } from '../components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { getTaskById } from '../data/mockData';
import { useState } from 'react';

const priorityConfig = {
  high: { color: 'text-red-700', bgColor: 'bg-red-100 border-red-200', label: 'High Priority' },
  medium: { color: 'text-orange-700', bgColor: 'bg-orange-100 border-orange-200', label: 'Medium Priority' },
  low: { color: 'text-blue-700', bgColor: 'bg-blue-100 border-blue-200', label: 'Low Priority' },
};

const statusConfig = {
  'todo': { label: 'To Do', color: 'bg-slate-100 text-slate-700' },
  'in-progress': { label: 'In Progress', color: 'bg-orange-100 text-orange-700' },
  'done': { label: 'Done', color: 'bg-green-100 text-green-700' },
};

export default function TaskDetailView() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const task = getTaskById(taskId!);
  const [status, setStatus] = useState(task?.status || 'todo');

  if (!task) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-slate-900 mb-4">Task not found</h2>
          <Button onClick={() => navigate('/developer')}>Return to Dashboard</Button>
        </div>
      </div>
    );
  }

  const priority = priorityConfig[task.priority as keyof typeof priorityConfig];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="px-8 py-4">
          <Button variant="ghost" className="mb-4 -ml-2 text-slate-600 hover:text-slate-900" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Badge className={`${statusConfig[status].color} border-0`}>{statusConfig[status].label}</Badge>
                <Badge className={`${priority.bgColor} ${priority.color} border`}>{priority.label}</Badge>
              </div>
              <h1 className="text-slate-900 text-2xl">{task.title}</h1>
              <p className="text-slate-600 mt-2">{task.description}</p>
            </div>
            <div className="flex gap-3 ml-6">
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Update status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
              <Button className="bg-primary hover:bg-primary/90">
                <CheckCircle className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="p-8">
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-md border border-slate-200">
              <h3 className="text-slate-900 mb-4">Task Details</h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center"><User className="w-5 h-5 text-blue-600" /></div>
                  <div>
                    <p className="text-xs text-slate-600">Assigned To</p>
                    <p className="text-sm text-slate-900">{task.assignedDeveloper?.name || 'Unassigned'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center"><Calendar className="w-5 h-5 text-orange-600" /></div>
                  <div>
                    <p className="text-xs text-slate-600">Due Date</p>
                    <p className="text-sm text-slate-900">{new Date(task.dueDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center"><Clock className="w-5 h-5 text-green-600" /></div>
                  <div>
                    <p className="text-xs text-slate-600">Created</p>
                    <p className="text-sm text-slate-900">{new Date(task.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center"><Clock className="w-5 h-5 text-purple-600" /></div>
                  <div>
                    <p className="text-xs text-slate-600">Last Updated</p>
                    <p className="text-sm text-slate-900">{new Date(task.updatedAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md border border-slate-200">
              <h3 className="text-slate-900 mb-4">Acceptance Criteria</h3>
              <div className="space-y-3">
                {task.acceptanceCriteria.map((criteria, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-slate-700">{criteria}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md border border-slate-200">
              <div className="flex items-center gap-2 mb-4"><MessageSquare className="w-5 h-5 text-slate-600" /><h3 className="text-slate-900">Comments ({task.comments.length})</h3></div>
              <div className="space-y-4">
                {task.comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <Avatar className="w-8 h-8 bg-accent text-white"><AvatarFallback className="bg-accent text-white text-xs">{comment.author.split(' ').map((n) => n[0]).join('')}</AvatarFallback></Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1"><p className="text-sm text-slate-900">{comment.author}</p><span className="text-xs text-slate-500">{new Date(comment.timestamp).toLocaleDateString()}</span></div>
                      <p className="text-sm text-slate-700 bg-slate-50 rounded-lg p-3">{comment.content}</p>
                    </div>
                  </div>
                ))}
                {task.comments.length === 0 && <p className="text-sm text-slate-500 text-center py-4">No comments yet</p>}
              </div>
              <Separator className="my-4" />
              <div className="flex gap-2">
                <input type="text" placeholder="Add a comment..." className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
                <Button className="bg-primary hover:bg-primary/90">Post</Button>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-md border border-slate-200">
              <div className="flex items-center gap-2 mb-4"><Tag className="w-5 h-5 text-slate-600" /><h3 className="text-slate-900">Tags</h3></div>
              <div className="flex flex-wrap gap-2">{task.tags.map((tag) => <Badge key={tag} variant="secondary" className="bg-slate-100 text-slate-700 border-0">{tag}</Badge>)}</div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md border border-slate-200">
              <div className="flex items-center gap-2 mb-4"><Paperclip className="w-5 h-5 text-slate-600" /><h3 className="text-slate-900">Attachments ({task.attachments.length})</h3></div>
              <div className="space-y-2">{task.attachments.map((attachment, index) => (<div key={index} className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"><Paperclip className="w-4 h-4 text-slate-600" /><span className="text-sm text-slate-700 truncate">{attachment}</span></div>))}{task.attachments.length === 0 && <p className="text-sm text-slate-500 text-center py-4">No attachments</p>}</div>
              <Button variant="outline" className="w-full mt-4">Add Attachment</Button>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md border border-slate-200">
              <div className="flex items-center gap-2 mb-4"><AlertCircle className="w-5 h-5 text-slate-600" /><h3 className="text-slate-900">Priority</h3></div>
              <div className={`p-4 rounded-lg ${priority.bgColor}`}>
                <p className={`text-sm ${priority.color}`}>{priority.label}</p>
                <p className="text-xs text-slate-600 mt-2">{task.priority === 'high' && 'This task requires immediate attention and should be prioritized.'}{task.priority === 'medium' && 'This task should be completed in a timely manner.'}{task.priority === 'low' && 'This task can be completed when time permits.'}</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
