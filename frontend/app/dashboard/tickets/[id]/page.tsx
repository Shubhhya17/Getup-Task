'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ticketApi, userApi, Ticket, User, Comment } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import {
  cn, getStatusClass, getPriorityClass, getPriorityBarClass,
  formatDate, timeAgo, getNextStatuses, getErrorMessage,
} from '@/lib/utils';
import { ArrowLeft, Loader2, Paperclip, ChevronRight } from 'lucide-react';

/*
 * Ticket Detail — Meridian design.
 *
 * Icon usage (strictly functional):
 *   ArrowLeft     — back navigation
 *   ChevronRight  — breadcrumb separator
 *   Paperclip     — file attachment (meaning: attached file)
 *   Loader2       — loading state (functional)
 *
 * Status: dot+label (CSS, no icon)
 * Priority: square pip+label (CSS, no icon)
 * Status actions: text buttons with text label
 * AI panel: "unconfirmed" — dashed blue border, pale blue bg, badge chip
 * Internal notes: amber tint
 */

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [ticket, setTicket]                     = useState<Ticket | null>(null);
  const [agents, setAgents]                     = useState<User[]>([]);
  const [isLoading, setIsLoading]               = useState(true);
  const [commentBody, setCommentBody]           = useState('');
  const [isInternal, setIsInternal]             = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isRegeneratingAi, setIsRegeneratingAi]       = useState(false);
  const [activeTab, setActiveTab]               = useState<'conversation' | 'activity'>('conversation');
  const [aiAccepted, setAiAccepted]             = useState<string | null>(null);
  const [replyTone, setReplyTone]               = useState('professional');

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
      const data: any = {};
      data[field] = ticket.aiSuggestion[field];
      await ticketApi.acceptAiSuggestion(id, data);
      setAiAccepted(field);
      setTimeout(() => setAiAccepted(null), 500);
      toast({ title: `AI ${field} applied`, description: `Set to: ${ticket.aiSuggestion[field]}` });
      loadTicket();
    } catch (err) {
      toast({ title: 'Error', description: getErrorMessage(err), variant: 'destructive' });
    }
  };

  const handleRegenerateReply = async () => {
    setIsRegeneratingAi(true);
    try {
      const res = await ticketApi.generateAiReply(id, replyTone);
      const newReply = res.data.data.draftReply;
      setTicket(prev => prev ? { 
        ...prev, 
        aiSuggestion: { ...prev.aiSuggestion!, draftReply: newReply } 
      } : null);
      toast({ title: 'AI reply regenerated' });
    } catch (err) {
      toast({ title: 'Error regenerating reply', description: getErrorMessage(err), variant: 'destructive' });
    } finally {
      setIsRegeneratingAi(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] pt-12 lg:pt-0">
        <Loader2 className="w-4 h-4 animate-spin text-[#2563EB]" strokeWidth={1.5} aria-label="Loading…" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="pt-12 lg:pt-0">
        <p className="text-sm text-[#6B6B6B]">Ticket not found.</p>
      </div>
    );
  }

  const nextStatuses = getNextStatuses(ticket.status);
  const isCritical   = ticket.priority === 'Critical' && ticket.status === 'Open';

  return (
    <main className="pt-12 lg:pt-0" aria-label="Ticket detail">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1 mb-6 pt-2">
        <Link
          href="/dashboard/tickets"
          className="inline-flex items-center gap-1 text-xs text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors"
        >
          <ArrowLeft className="w-3 h-3" strokeWidth={1.5} aria-hidden="true" />
          Tickets
        </Link>
        <ChevronRight className="w-3 h-3 text-[#C8C8C5]" strokeWidth={1.5} aria-hidden="true" />
        <span className="text-xs text-[#6B6B6B] truncate max-w-xs">{ticket.title}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-6">
        {/* ── Left: main content ── */}
        <div className="space-y-4 min-w-0">

          {/* Ticket header */}
          <div
            className={cn(
              'rounded border border-[#E8E8E5] bg-white p-5',
              'pl-[calc(1.25rem+2px)]',
              getPriorityBarClass(ticket.priority),
              isCritical && 'critical-pulse',
            )}
          >
            {/* Status + priority indicators */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span
                className={cn('badge-transition', getStatusClass(ticket.status))}
                role="status"
                aria-label={`Status: ${ticket.status}`}
              >
                {ticket.status}
              </span>
              <span
                className={getPriorityClass(ticket.priority)}
                aria-label={`Priority: ${ticket.priority}`}
              >
                {ticket.priority}
              </span>
              {ticket.category && (
                <span className="text-xs text-[#6B6B6B]">{ticket.category}</span>
              )}
              {isCritical && (
                <span className="text-xs font-medium text-[#B91C1C]" aria-live="polite">
                  Needs immediate attention
                </span>
              )}
            </div>

            {/* Title — largest typography moment on the screen */}
            <h1 className="text-base font-semibold text-[#1A1A1A] mb-4 leading-snug">
              {ticket.title}
            </h1>

            <p className="ticket-description">{ticket.description}</p>

            {/* Attachment */}
            {ticket.attachment && (
              <div className="mt-4 flex items-center gap-2 p-3 rounded border border-[#E8E8E5] bg-[#FAFAF9]">
                <Paperclip className="w-3.5 h-3.5 text-[#6B6B6B] flex-shrink-0" strokeWidth={1.5} aria-hidden="true" />
                <span className="text-xs text-[#6B6B6B] flex-1 truncate">
                  {ticket.attachment.originalName}
                </span>
                <a
                  href={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}/uploads/${ticket.attachment.path}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#2563EB] hover:underline"
                >
                  Download
                </a>
              </div>
            )}
          </div>

          {/* ── AI Suggestion panel ── */}
          {ticket.aiSuggestion && canSeeInternal && (
            <div
              className={cn('ai-panel p-4', aiAccepted && 'ai-accepted')}
              role="region"
              aria-label="AI triage suggestion — not yet confirmed"
            >
              {/* Header */}
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs font-semibold text-[hsl(var(--ai-ink))]">
                  AI Triage
                </span>
                <span
                  className="text-xs px-2 py-0.5 rounded font-medium ml-auto"
                  style={{
                    background: 'white',
                    border: '1px solid hsl(var(--ai-border))',
                    color: 'hsl(var(--ai-ink))',
                  }}
                  aria-label="These suggestions have not been applied yet"
                >
                  Not applied
                </span>
                {ticket.aiSuggestion.sentiment && (
                  <span className={cn(
                    "text-xs px-2 py-0.5 rounded font-medium border",
                    ticket.aiSuggestion.sentiment === 'Frustrated' ? 'bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]' : 
                    ticket.aiSuggestion.sentiment === 'Positive' ? 'bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]' :
                    'bg-[#F3F4F6] text-[#374151] border-[#E5E7EB]'
                  )}>
                    {ticket.aiSuggestion.sentiment}
                  </span>
                )}
                {ticket.aiSuggestion.fallback && (
                  <span className="text-xs px-2 py-0.5 rounded font-medium bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A]">
                    Heuristic
                  </span>
                )}
              </div>

              {/* Category + Priority */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                {(['category', 'priority'] as const).map((field) => (
                  <div
                    key={field}
                    className="flex items-center justify-between p-3 rounded bg-white border border-[#E8E8E5]"
                  >
                    <div className="min-w-0 mr-2">
                      <p className="text-xs text-[#6B6B6B] capitalize mb-0.5">
                        Suggested {field}
                      </p>
                      <p className="text-xs font-semibold text-[#1A1A1A] truncate">
                        {ticket.aiSuggestion![field]}
                      </p>
                    </div>
                    <Button
                      variant="ai-accept"
                      size="sm"
                      onClick={() => handleAcceptAiSuggestion(field)}
                      aria-label={`Apply AI suggested ${field}: ${ticket.aiSuggestion![field]}`}
                    >
                      Apply
                    </Button>
                  </div>
                ))}
              </div>

              {/* Summary */}
              {ticket.aiSuggestion.summary && (
                <div className="p-3 rounded bg-white border border-[#E8E8E5] mb-3">
                  <p className="text-xs text-[#6B6B6B] mb-1">Summary</p>
                  <p className="text-xs text-[#1A1A1A] leading-relaxed">{ticket.aiSuggestion.summary}</p>
                </div>
              )}

              {/* Draft reply */}
              {ticket.aiSuggestion.draftReply && (
                <div className="p-3 rounded bg-white border border-[#E8E8E5] mb-3">
                  <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                    <p className="text-xs text-[#6B6B6B]">Draft reply</p>
                    <div className="flex items-center gap-2">
                      <select 
                        value={replyTone}
                        onChange={(e) => setReplyTone(e.target.value)}
                        className="h-7 text-xs rounded border border-[#E8E8E5] bg-white px-2 focus:outline-none focus:border-[#2563EB]"
                      >
                        <option value="professional">Professional</option>
                        <option value="concise">Concise</option>
                        <option value="empathetic">Empathetic</option>
                      </select>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRegenerateReply}
                        disabled={isRegeneratingAi}
                        className="h-7 text-xs"
                      >
                        {isRegeneratingAi ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Regenerate'}
                      </Button>
                      <Button
                        variant="ai-accept"
                        size="sm"
                        onClick={useAiDraft}
                        aria-label="Use AI draft reply as your comment"
                        className="h-7 text-xs"
                      >
                        Use as draft
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-[#6B6B6B] leading-relaxed line-clamp-4 whitespace-pre-wrap">
                    {ticket.aiSuggestion.draftReply}
                  </p>
                </div>
              )}

              {/* Similar Tickets */}
              {ticket.aiSuggestion.similarTickets && ticket.aiSuggestion.similarTickets.length > 0 && (
                <div className="p-3 rounded bg-white border border-[#E8E8E5]">
                  <p className="text-xs text-[#6B6B6B] mb-2">Possibly related tickets</p>
                  <ul className="space-y-1">
                    {ticket.aiSuggestion.similarTickets.map(t => (
                      <li key={t.ticketId}>
                        <Link href={`/dashboard/tickets/${t.ticketId}`} className="text-xs text-[#2563EB] hover:underline truncate block">
                          {t.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* ── Tabs ── */}
          <div>
            <div
              className="flex border-b border-[#E8E8E5] mb-4"
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
                    'px-4 py-2.5 text-sm capitalize border-b-2 -mb-px transition-colors duration-100',
                    'focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-[#2563EB]',
                    activeTab === tab
                      ? 'border-[#2563EB] text-[#2563EB] font-medium'
                      : 'border-transparent text-[#6B6B6B] hover:text-[#1A1A1A]'
                  )}
                >
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

        {/* ── Right: metadata sidebar ── */}
        <div className="space-y-3">

          {/* Status actions */}
          {canChangeStatus && nextStatuses.length > 0 && ticket.status !== 'Closed' && (
            <Card>
              <CardHeader><CardTitle>Move status</CardTitle></CardHeader>
              <CardContent className="pt-3 space-y-1.5">
                {nextStatuses.map((s) => (
                  <Button
                    key={s}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start font-normal"
                    onClick={() => handleStatusChange(s)}
                    id={`status-btn-${s.replace(/\s+/g, '-').toLowerCase()}`}
                  >
                    Mark as {s}
                  </Button>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Metadata */}
          <Card>
            <CardHeader><CardTitle>Details</CardTitle></CardHeader>
            <CardContent className="pt-3">
              <dl className="space-y-3">
                <MetaRow label="Submitted by" value={ticket.createdBy?.name} />
                <MetaRow label="Assigned to"  value={ticket.assignedTo?.name} emptyValue="Unassigned" />
                <MetaRow label="Opened"       value={timeAgo(ticket.createdAt)} mono />
                {ticket.resolvedAt && (
                  <MetaRow label="Resolved" value={timeAgo(ticket.resolvedAt)} mono />
                )}
                <MetaRow label="Category" value={ticket.category} />
              </dl>
            </CardContent>
          </Card>

          {/* Agent assignment */}
          {canAssign && (
            <Card>
              <CardHeader><CardTitle>Assign to agent</CardTitle></CardHeader>
              <CardContent className="pt-3">
                <select
                  value={ticket.assignedTo?._id || ''}
                  onChange={(e) => handleAssign(e.target.value)}
                  className="w-full h-8 rounded border border-[#E8E8E5] bg-white px-2 text-xs text-[#1A1A1A] focus-visible:outline-none focus-visible:border-[#2563EB]"
                  aria-label="Assign to agent"
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
      className="space-y-4"
      role="tabpanel"
      id="panel-conversation"
      aria-labelledby="tab-conversation"
    >
      {visibleComments.length === 0 && (
        <div className="py-10 text-center">
          <p className="text-sm text-[#6B6B6B]">No replies yet</p>
        </div>
      )}

      {visibleComments.map((comment) => (
        <CommentBubble key={comment._id} comment={comment} currentUserId={currentUser?._id} />
      ))}

      {/* Reply form */}
      <div
        className={cn(
          'rounded border p-4',
          isInternal ? 'note-internal' : 'border-[#E8E8E5] bg-white'
        )}
      >
        <form onSubmit={handleComment}>
          {isInternal && (
            <p className="text-xs font-medium text-[#B45309] mb-2">
              Internal note — visible to agents and admins only
            </p>
          )}
          <Textarea
            id="comment-body"
            placeholder={isInternal ? 'Write an internal note…' : 'Write a reply…'}
            value={commentBody}
            onChange={(e) => setCommentBody(e.target.value)}
            rows={3}
            className="mb-3 text-sm"
            aria-label={isInternal ? 'Internal note' : 'Reply'}
          />
          <div className="flex items-center justify-between">
            <div>
              {canSeeInternal && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    id="internal-note-toggle"
                    checked={isInternal}
                    onChange={(e) => setIsInternal(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-[#E8E8E5] accent-[#D97706]"
                  />
                  <span className="text-xs text-[#6B6B6B]">Internal note</span>
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
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={1.5} aria-hidden="true" />
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
      {/* Typographic avatar */}
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center font-mono font-semibold text-xs text-[#2563EB] flex-shrink-0"
        style={{ background: '#EFF6FF', border: '1px solid #BFDBFE' }}
        aria-hidden="true"
      >
        {comment.author?.name?.charAt(0).toUpperCase()}
      </div>

      <div className={cn('max-w-[80%] space-y-1', isOwn && 'items-end flex flex-col')}>
        <div className={cn('flex items-center gap-2 text-xs text-[#6B6B6B]', isOwn && 'flex-row-reverse')}>
          <span className="font-medium text-[#1A1A1A]">{comment.author?.name}</span>
          {comment.isInternal && (
            <span className="text-[#B45309] font-medium">Internal</span>
          )}
          <time dateTime={comment.createdAt} className="font-mono">{timeAgo(comment.createdAt)}</time>
        </div>

        <div
          className={cn(
            'px-4 py-3 rounded-lg text-sm leading-relaxed whitespace-pre-wrap',
            isOwn
              ? 'bg-[#EFF6FF] border border-[#BFDBFE] text-[#1A1A1A] rounded-tr-sm'
              : comment.isInternal
                ? 'note-internal rounded-tl-sm'
                : 'bg-[#FAFAF9] border border-[#E8E8E5] text-[#1A1A1A] rounded-tl-sm'
          )}
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
        <p className="text-sm text-[#6B6B6B] text-center py-10">No activity recorded yet</p>
      )}
      <div className="activity-timeline space-y-5" aria-label="Activity history">
        {log.map((entry, i) => (
          <div key={i} className="relative">
            <div className="activity-dot" aria-hidden="true" />
            <p className="text-sm text-[#1A1A1A]">{entry.details}</p>
            <p className="text-xs text-[#A1A1A1] mt-0.5 font-mono">
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
  label, value, emptyValue = '—', mono,
}: {
  label: string;
  value?: string;
  emptyValue?: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start gap-2">
      <dt className="text-xs text-[#6B6B6B] w-24 flex-shrink-0 pt-px">{label}</dt>
      <dd className={cn('text-xs text-[#1A1A1A] font-medium truncate', mono && 'font-mono')}>
        {value ?? emptyValue}
      </dd>
    </div>
  );
}
