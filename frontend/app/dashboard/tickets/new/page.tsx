'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ticketApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { getErrorMessage } from '@/lib/utils';
import { Loader2, Paperclip, X, ArrowLeft, Sparkles, Info } from 'lucide-react';
import Link from 'next/link';

const CATEGORIES = ['General', 'Technical', 'Billing', 'Sales', 'Other'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

export default function NewTicketPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    title:       '',
    description: '',
    category:    'General',
    priority:    'Medium',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => formData.append(k, v));
      if (file) formData.append('attachment', file);

      const res = await ticketApi.create(formData);
      toast({ title: 'Ticket submitted', description: 'AI triage has been applied.' });
      router.push(`/dashboard/tickets/${res.data.data._id}`);
    } catch (err) {
      toast({
        title: 'Submission failed',
        description: getErrorMessage(err),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="pt-14 lg:pt-0 max-w-xl">
      {/* Header */}
      <div className="mb-5 pt-2">
        <Link
          href="/dashboard/tickets"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
        >
          <ArrowLeft className="w-3 h-3" aria-hidden="true" />
          Back to tickets
        </Link>
        <h1 className="text-xl font-semibold text-foreground">Submit a support ticket</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Describe your issue clearly — the AI triage will suggest category, priority, and a draft reply
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <Card>
          <CardContent className="space-y-5 pt-5">

            {/* Title */}
            <div className="space-y-1.5">
              <Label htmlFor="title">
                Issue title <span className="text-destructive" aria-hidden="true">*</span>
              </Label>
              <Input
                id="title"
                name="title"
                placeholder="Brief summary of the issue"
                value={form.title}
                onChange={handleChange}
                required
                maxLength={200}
                autoFocus
                aria-required="true"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="description">
                Description <span className="text-destructive" aria-hidden="true">*</span>
              </Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Describe the issue in detail. Include steps to reproduce, error messages, and any relevant context."
                value={form.description}
                onChange={handleChange}
                required
                rows={6}
                aria-required="true"
              />
            </div>

            {/* Category + Priority */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  className="flex h-9 w-full rounded-md border border-border bg-muted/40 px-3 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
                <p className="text-2xs text-muted-foreground flex items-center gap-1">
                  <Info className="w-2.5 h-2.5" aria-hidden="true" />
                  AI will verify this
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="priority">Initial priority</Label>
                <select
                  id="priority"
                  name="priority"
                  value={form.priority}
                  onChange={handleChange}
                  className="flex h-9 w-full rounded-md border border-border bg-muted/40 px-3 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
                </select>
                <p className="text-2xs text-muted-foreground flex items-center gap-1">
                  <Info className="w-2.5 h-2.5" aria-hidden="true" />
                  AI will verify this
                </p>
              </div>
            </div>

            {/* File attachment */}
            <div className="space-y-1.5">
              <Label>Attachment</Label>
              {file ? (
                <div
                  className="flex items-center gap-3 p-3 rounded-md border border-border"
                  style={{ background: 'hsl(var(--surface-2))' }}
                >
                  <Paperclip className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" aria-hidden="true" />
                  <span className="text-xs text-foreground flex-1 truncate">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="text-muted-foreground hover:text-destructive transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                    aria-label={`Remove attachment ${file.name}`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <label
                  className="flex items-center gap-3 p-4 rounded-md border-2 border-dashed border-border hover:border-primary/40 hover:bg-primary/3 transition-colors cursor-pointer focus-within:ring-2 focus-within:ring-ring"
                  aria-label="Upload file attachment"
                >
                  <Paperclip className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" aria-hidden="true" />
                  <span className="text-xs text-muted-foreground">
                    Click to attach a file — PDF, images, docs (max 10MB)
                  </span>
                  <input
                    type="file"
                    className="sr-only"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.txt,.doc,.docx"
                  />
                </label>
              )}
            </div>

            {/* AI notice — informational, not decorative */}
            <div className="ai-panel p-3.5" role="note" aria-label="AI triage information">
              <div className="flex items-center gap-2 mb-1.5">
                <Sparkles
                  className="w-3.5 h-3.5 flex-shrink-0"
                  style={{ color: 'hsl(var(--ai-ink))' }}
                  aria-hidden="true"
                />
                <span className="text-xs font-medium" style={{ color: 'hsl(var(--ai-ink))' }}>
                  AI Triage
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                After submission, our AI will analyze your ticket and suggest the best category,
                priority, and a draft reply. These are suggestions only — an agent must
                explicitly apply them.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1"
                id="submit-ticket-btn"
                aria-busy={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                    Submitting…
                  </>
                ) : (
                  'Submit ticket'
                )}
              </Button>
              <Link href="/dashboard/tickets">
                <Button type="button" variant="outline" id="cancel-ticket-btn">
                  Cancel
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
