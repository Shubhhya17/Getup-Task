'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ticketApi, userApi, Ticket, User, Comment, ActivityEntry } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import {
  cn,
  getStatusClass,
  getPriorityClass,
  getPriorityBarClass,
  formatDate,
  timeAgo,
  getNextStatuses,
  getErrorMessage,
} from '@/lib/utils';
import {
  ArrowLeft,
  MessageSquare,
  Lock,
  Activity,
  Sparkles,
  CheckCircle2,
  Loader2,
  Paperclip,
  User as UserIcon,
  Clock,
  Tag,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react';

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [ticket, setTicket]             = useState<Ticket | null>(null);
  const [agents, setAgents]             = useState<User[]>([]);
  const [isLoading, setIsLoading]       = useState(true);
  const [commentBody, setCommentBody]   = useState('');
  const [isInternal, setIsInternal]     = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [activeTab, setActiveTab]       = useState<'conversation' | 'activity'>('conversation');
  const [aiAccepted, setAiAccepted]     = useState<string | null>(null);

  const canChangeStatus  = user?.role === 'agent' || user?.role === 'admin';
  const canAssign        = user?.role === 'admin';
  const canSeeInternal   = user?.role === 'agent' || user?.role === 'admin';

  const loadTicket = async () => {
    try {
      const res = await ticketApi.get(id);
      setTicket(res.data.data);
    } catch (err) {
      toast({ title: 'Error loading ticket', description: getErrorMessage(err), variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTicket();
    if (user?.role === 'admin') {
      userApi.getAgents().then((res) => setAgents(res.data.data));
    }
  }, [id]);

  /* Use AI draft reply — pre-fills comment box */
  const useAiDraft = () => {
    if (ticket?.aiSuggestion?.draftReply) {
      setCommentBody(ticket.aiSuggestion.draftReply);
      setIsInternal(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      await ticketApi.updateStatus(id, newStatus);
      toast({ title: 'Status updated', description: `Moved to "${newStatus}"` });
      loadTicket();
    } catch (err) {
      toast({ title: 'Error', description: getErrorMessage(err), variant: 'destructive' });
    }
  };

  const handleAssign = async (agentId: string) => {
    try {
      await ticketApi.assign(id, agentId || null);
      toast({ title: 'Ticket assigned' });
      loadTicket();
    } catch (err) {
      toast({ title: 'Error', description: getErrorMessage(err), variant: 'destructive' });
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentBody.trim()) return;
    setIsSubmittingComment(true);
    try {
      await ticketApi.addComment(id, commentBody, isInternal);
      setCommentBody('');
      setIsInternal(false);
      toast({ title: isInternal ? 'Internal note added' : 'Reply posted' });
      loadTicket();
    } catch (err) {
      toast({ title: 'Error', description: getErrorMessage(err), variant: 'destructive' });
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleAcceptAiSuggestion = async (field: 'category' | 'priority') => {
    if (!ticket?.aiSuggestion) return;
    try {
      const data: { category?: string; priority?: string } = {};
      data[field] = ticket.aiSuggestion[field];
      await ticketApi.acceptAiSuggestion(id, data);
      setAiAccepted(field); // triggers flash animation
      setTimeout(() => setAiAccepted(null), 500);
      toast({ title: `AI ${field} applied`, description: `Set to: ${ticket.aiSuggestion[field]}` });
      loadTicket();
    } catch (err) {
      toast({ title: 'Error', description: getErrorMessage(err), variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] pt-14 lg:pt-0">
        <Loader2 className="w-5 h-5 animate-spin text-primary" aria-label="Loading ticket…" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="pt-14 lg:pt-0">
        <p className="text-muted-foreground text-sm">Ticket not found.</p>
      </div>
    );
  }

  const nextStatuses  = getNextStatuses(ticket.status);
  const isCritical    = ticket.priority === 'Critical' && ticket.status === 'Open';

  return (
    <main className="pt-14 lg:pt-0" aria-label="Ticket detail">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 mb-5 pt-2">
        <Link
          href="/dashboard/tickets"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
        >
          <ArrowLeft className="w-3 h-3" aria-hidden="true" />
          Tickets
        </Link>
        <ChevronRight className="w-3 h-3 text-muted-foreground/40" aria-hidden="true" />
        <span className="text-xs text-muted-foreground truncate max-w-xs">{ticket.title}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5">
        {/* ── Left: main content ──────────────────────────────── */}
        <div className="space-y-4 min-w-0">

          {/* Ticket header */}
          <div
            className={cn(
              'rounded-lg border border-border p-5',
              getPriorityBarClass(ticket.priority),
              isCritical && 'critical-pulse',
            )}
            style={{ background: 'hsl(var(--surface-1))' }}
          >
            {/* Status + priority row */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span
                className={cn(
                  'inline-flex items-center text-xs px-2 py-0.5 rounded-sm badge-transition',
                  getStatusClass(ticket.status)
                )}
                role="status"
                aria-label={`Status: ${ticket.status}`}
              >
                {ticket.status}
              </span>
              <span
                className={cn('inline-flex items-center text-xs px-2 py-0.5 rounded-sm', getPriorityClass(ticket.priority))}
                aria-label={`Priority: ${ticket.priority}`}
              >
                {ticket.priority}
              </span>
              {ticket.category && (
                <span className="text-xs px-2 py-0.5 rounded-sm text-muted-foreground border border-border">
                  {ticket.category}
                </span>
              )}
              {isCritical && (
                <span className="flex items-center gap-1 text-xs text-priority-critical" aria-live="polite">
                  <AlertTriangle className="w-3 h-3" aria-hidden="true" />
                  Needs immediate attention
                </span>
              )}
            </div>

            <h1 className="text-base font-semibold text-foreground mb-3 leading-snug">
              {ticket.title}
            </h1>

            <p className="ticket-description">{ticket.description}</p>

            {/* Attachment */}
            {ticket.attachment && (
              <div className="mt-4 flex items-center gap-2 p-3 rounded-md border border-border" style={{ background: 'hsl(var(--surface-2))' }}>
                <Paperclip className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" aria-hidden="true" />
                <span className="text-xs text-muted-foreground flex-1 truncate">
                  {ticket.attachment.originalName}
                </span>
                <a
                  href={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}/uploads/${ticket.attachment.path}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline ml-auto flex-shrink-0"
                  aria-label={`Download ${ticket.attachment.originalName}`}
                >
                  Download
                </a>
              </div>
            )}
          </div>

          {/* ── AI Suggestion Panel ───────────────────────────── */}
          {ticket.aiSuggestion && canSeeInternal && (
            <div
              className={cn('ai-panel p-4', aiAccepted && 'ai-accepted')}
              role="region"
              aria-label="AI triage suggestion — unconfirmed"
            >
              {/* Panel header */}
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-3.5 h-3.5" style={{ color: 'hsl(var(--ai-ink))' }} aria-hidden="true" />
                <span className="text-xs font-semibold" style={{ color: 'hsl(var(--ai-ink))' }}>
                  AI Triage
                </span>
                <span
                  className="text-2xs px-1.5 py-0.5 rounded-sm border ml-auto"
                  style={{
                    background: 'hsl(var(--ai-surface))',
                    borderColor: 'hsl(var(--ai-border))',
                    color: 'hsl(var(--ai-ink) / 0.7)',
                  }}
                  aria-label="These are AI suggestions, not confirmed data"
                >
                  Suggested — not applied
                </span>
                {ticket.aiSuggestion.fallback && (
                  <span className="text-2xs px-1.5 py-0.5 rounded-sm bg-yellow-500/10 text-yellow-400 border border-yellow-500/25">
                    Heuristic
                  </span>
                )}
              </div>

              {/* Category + Priority in a 2-col grid */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                {(['category', 'priority'] as const).map((field) => (
                  <div
                    key={field}
                    className="flex items-center justify-between p-3 rounded-md border border-border"
                    style={{ background: 'hsl(var(--surface-2))' }}
                  >
                    <div className="min-w-0 mr-2">
                      <p className="text-2xs text-muted-foreground capitalize mb-0.5">
                        Suggested {field}
                      </p>
                      <p className="text-xs font-medium text-foreground truncate">
                        {ticket.aiSuggestion[field]}
                      </p>
                    </div>
                    <Button
                      variant="ai-accept"
                      size="sm"
                      onClick={() => handleAcceptAiSuggestion(field)}
                      aria-label={`Accept AI suggested ${field}: ${ticket.aiSuggestion![field]}`}
                    >
                      Apply
                    </Button>
                  </div>
                ))}
              </div>

              {/* Summary */}
              {ticket.aiSuggestion.summary && (
                <div
                  className="p-3 rounded-md border border-border mb-3"
                  style={{ background: 'hsl(var(--surface-2))' }}
                >
                  <p className="text-2xs text-muted-foreground mb-1">AI Summary</p>
                  <p className="text-xs text-foreground leading-relaxed">{ticket.aiSuggestion.summary}</p>
                </div>
              )}

              {/* Draft reply */}
              {ticket.aiSuggestion.draftReply && (
                <div
                  className="p-3 rounded-md border border-border"
                  style={{ background: 'hsl(var(--surface-2))' }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-2xs text-muted-foreground">Draft reply</p>
                    <Button
                      variant="ai-accept"
                      size="sm"
                      onClick={useAiDraft}
                      aria-label="Use AI draft reply as your comment"
                    >
                      Use as draft
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-4 whitespace-pre-wrap">
                    {ticket.aiSuggestion.draftReply}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── Conversation / Activity tabs ─────────────────── */}
          <div>
            {/* Tab bar */}
            <div
              className="flex border-b border-border mb-4"
              role="tablist"
              aria-label="Ticket threads"
            >
              {(['conversation', 'activity'] as const).map((tab) => (
                <button
                  key={tab}
                  role="tab"
                  id={`tab-${tab}`}
                  aria-selected={activeTab === tab}
                  aria-controls={`panel-${tab}`}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    'flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-colors duration-100 capitalize',
                    'border-b-2 -mb-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    activeTab === tab
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  )}
                >
                  {tab === 'conversation'
                    ? <MessageSquare className="w-3.5 h-3.5" aria-hidden="true" />
                    : <Activity className="w-3.5 h-3.5" aria-hidden="true" />}
                  {tab}
                </button>
              ))}
            </div>

            {activeTab === 'conversation' ? (
              <ConversationTab
                ticket={ticket}
                canSeeInternal={canSeeInternal}
                commentBody={commentBody}
                setCommentBody={setCommentBody}
                isInternal={isInternal}
                setIsInternal={setIsInternal}
                isSubmittingComment={isSubmittingComment}
                handleComment={handleComment}
                currentUser={user}
              />
            ) : (
              <ActivityTab ticket={ticket} />
            )}
          </div>
        </div>

        {/* ── Right: metadata sidebar ──────────────────────────── */}
        <div className="space-y-3" aria-label="Ticket metadata">

          {/* Status actions */}
          {canChangeStatus && nextStatuses.length > 0 && ticket.status !== 'Closed' && (
            <Card>
              <CardHeader><CardTitle>Move status</CardTitle></CardHeader>
              <CardContent className="pt-2 space-y-1.5">
                {nextStatuses.map((s) => (
                  <Button
                    key={s}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start gap-2 font-normal"
                    onClick={() => handleStatusChange(s)}
                    id={`status-btn-${s.replace(/\s+/g, '-').toLowerCase()}`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
                    Mark as {s}
                  </Button>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Ticket metadata */}
          <Card>
            <CardHeader><CardTitle>Details</CardTitle></CardHeader>
            <CardContent className="pt-2">
              <dl className="space-y-3">
                <MetaRow icon={UserIcon} label="Submitted by" value={ticket.createdBy?.name} />
                <MetaRow
                  icon={UserIcon}
                  label="Assigned to"
                  value={ticket.assignedTo?.name}
                  emptyValue="Unassigned"
                />
                <MetaRow icon={Clock} label="Opened" value={timeAgo(ticket.createdAt)} />
                {ticket.resolvedAt && (
                  <MetaRow icon={CheckCircle2} label="Resolved" value={timeAgo(ticket.resolvedAt)} />
                )}
                <MetaRow icon={Tag} label="Category" value={ticket.category} />
              </dl>
            </CardContent>
          </Card>

          {/* Admin: agent assignment */}
          {canAssign && (
            <Card>
              <CardHeader><CardTitle>Assign to agent</CardTitle></CardHeader>
              <CardContent className="pt-2">
                <select
                  value={ticket.assignedTo?._id || ''}
                  onChange={(e) => handleAssign(e.target.value)}
                  className="w-full h-9 rounded-md border border-border bg-muted/40 px-3 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Assign ticket to agent"
                  id="agent-assign-select"
                >
                  <option value="">Unassigned</option>
                  {agents.map((a) => (
                    <option key={a._id} value={a._id}>{a.name}</option>
                  ))}
                </select>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </main>
  );
}

/* ── Conversation tab ── */
function ConversationTab({
  ticket, canSeeInternal, commentBody, setCommentBody,
  isInternal, setIsInternal, isSubmittingComment, handleComment, currentUser,
}: {
  ticket: Ticket;
  canSeeInternal: boolean;
  commentBody: string;
  setCommentBody: (v: string) => void;
  isInternal: boolean;
  setIsInternal: (v: boolean) => void;
  isSubmittingComment: boolean;
  handleComment: (e: React.FormEvent) => void;
  currentUser: User | null;
}) {
  const visibleComments = ticket.comments.filter((c) => !c.isInternal || canSeeInternal);

  return (
    <div
      className="space-y-3"
      role="tabpanel"
      id="panel-conversation"
      aria-labelledby="tab-conversation"
    >
      {visibleComments.length === 0 && (
        <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
          <MessageSquare className="w-8 h-8 mb-2 opacity-20" aria-hidden="true" />
          <p className="text-xs">No replies yet — be the first to respond</p>
        </div>
      )}

      {visibleComments.map((comment) => (
        <CommentBubble
          key={comment._id}
          comment={comment}
          currentUserId={currentUser?._id}
        />
      ))}

      {/* Comment form */}
      <div
        className={cn(
          'rounded-lg border p-4',
          isInternal
            ? 'note-internal'
            : 'border-border'
        )}
        style={isInternal ? {} : { background: 'hsl(var(--surface-1))' }}
      >
        <form onSubmit={handleComment}>
          {isInternal && (
            <div className="flex items-center gap-1.5 mb-2">
              <Lock className="w-3 h-3 text-yellow-400" aria-hidden="true" />
              <span className="text-2xs text-yellow-400 font-medium">Internal note — agents and admins only</span>
            </div>
          )}
          <Textarea
            id="comment-body"
            placeholder={isInternal
              ? 'Write an internal note…'
              : 'Write a reply to the customer…'}
            value={commentBody}
            onChange={(e) => setCommentBody(e.target.value)}
            rows={3}
            className="mb-3 text-xs"
            aria-label={isInternal ? 'Internal note content' : 'Reply content'}
          />
          <div className="flex items-center justify-between gap-3">
            <div>
              {canSeeInternal && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    id="internal-note-toggle"
                    checked={isInternal}
                    onChange={(e) => setIsInternal(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-border accent-yellow-400"
                  />
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Lock className="w-3 h-3" aria-hidden="true" />
                    Internal note
                  </span>
                </label>
              )}
            </div>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmittingComment || !commentBody.trim()}
              id="submit-comment-btn"
            >
              {isSubmittingComment
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                : isInternal ? 'Add note' : 'Post reply'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Comment bubble ── */
function CommentBubble({ comment, currentUserId }: { comment: Comment; currentUserId?: string }) {
  const isOwn = comment.author?._id === currentUserId;

  return (
    <div
      className={cn('flex gap-2.5 comment-appear', isOwn ? 'flex-row-reverse' : 'flex-row')}
      role="article"
      aria-label={`${comment.isInternal ? 'Internal note' : 'Comment'} from ${comment.author?.name}`}
    >
      {/* Avatar */}
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center text-primary font-mono font-semibold text-xs flex-shrink-0"
        style={{ background: 'hsl(var(--primary) / 0.15)' }}
        aria-hidden="true"
      >
        {comment.author?.name?.charAt(0).toUpperCase()}
      </div>

      <div className={cn('max-w-[80%] space-y-1', isOwn && 'items-end flex flex-col')}>
        {/* Meta */}
        <div className={cn('flex items-center gap-2 text-2xs text-muted-foreground', isOwn && 'flex-row-reverse')}>
          <span className="font-medium text-foreground">{comment.author?.name}</span>
          {comment.isInternal && (
            <span className="flex items-center gap-0.5 text-yellow-400/80">
              <Lock className="w-2.5 h-2.5" aria-hidden="true" />
              Internal
            </span>
          )}
          <time dateTime={comment.createdAt}>{timeAgo(comment.createdAt)}</time>
        </div>

        {/* Body */}
        <div
          className={cn(
            'px-3 py-2.5 rounded-lg text-xs leading-relaxed whitespace-pre-wrap',
            isOwn
              ? 'bg-primary/10 border border-primary/20 text-foreground rounded-tr-sm'
              : comment.isInternal
                ? 'note-internal rounded-tl-sm'
                : 'border border-border rounded-tl-sm'
          )}
          style={(!isOwn && !comment.isInternal) ? { background: 'hsl(var(--surface-2))' } : {}}
        >
          {comment.body}
        </div>
      </div>
    </div>
  );
}

/* ── Activity log ── */
function ActivityTab({ ticket }: { ticket: Ticket }) {
  const log = [...(ticket.activityLog || [])].reverse();
  return (
    <div
      role="tabpanel"
      id="panel-activity"
      aria-labelledby="tab-activity"
    >
      {log.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-10">No activity recorded yet</p>
      )}
      <div className="activity-timeline space-y-4" aria-label="Activity history">
        {log.map((entry, i) => (
          <div key={i} className="relative" role="listitem">
            <div className="activity-dot" aria-hidden="true" />
            <p className="text-xs text-foreground">{entry.details}</p>
            <p className="text-2xs text-muted-foreground mt-0.5 font-mono">
              {entry.performedBy?.name} — {formatDate(entry.timestamp)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Metadata row ── */
function MetaRow({
  icon: Icon,
  label,
  value,
  emptyValue = '—',
}: {
  icon: React.ElementType;
  label: string;
  value?: string;
  emptyValue?: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 mt-0.5" aria-hidden="true" />
      <dt className="text-xs text-muted-foreground w-22 flex-shrink-0">{label}</dt>
      <dd className="text-xs text-foreground font-medium truncate">{value ?? emptyValue}</dd>
    </div>
  );
}
