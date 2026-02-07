'use client';

import { useState } from 'react';
import { Rss, Cpu, Image, Check, Pencil, Calendar, Twitter, Send } from 'lucide-react';
import { formatRelativeTime, formatScheduledTime } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EditPostModal } from '@/components/queue/EditPostModal';
import { approvePost, rejectPost, publishToTwitter } from '@/lib/supabase/mutations';
import { useToast } from '@/lib/contexts/ToastContext';
import type { Post, PostStatus } from '@/types';

interface PostCardProps {
  post: Post;
  onStatusChange?: (id: string, status: PostStatus) => void;
}

const sourceIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  rss: Rss,
  'claude_ai': Cpu,
};

export function PostCard({ post, onStatusChange }: PostCardProps) {
  const isPending = post.status === 'pending';
  const isApproved = post.status === 'approved' || post.status === 'scheduled';
  const isPublished = post.status === 'published';
  const SourceIcon = sourceIconMap[post.source] || Rss;
  const [loadingAction, setLoadingAction] = useState<'approve' | 'reject' | 'publish' | null>(null);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentContent, setCurrentContent] = useState(post.content);
  const { addToast } = useToast();

  const handleApprove = async () => {
    setLoadingAction('approve');
    try {
      const { error } = await approvePost(post.id);
      if (error) throw error;
      onStatusChange?.(post.id, 'approved');
      addToast('Post aprovado com sucesso!', 'success');
    } catch {
      addToast('Erro ao aprovar o post. Tente novamente.', 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleReject = async () => {
    setLoadingAction('reject');
    try {
      const { error } = await rejectPost(post.id);
      if (error) throw error;
      setShowRejectConfirm(false);
      onStatusChange?.(post.id, 'rejected');
      addToast('Post descartado.', 'info');
    } catch {
      addToast('Erro ao descartar o post.', 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  const handlePublish = async () => {
    setLoadingAction('publish');
    try {
      await publishToTwitter(post.id);
      onStatusChange?.(post.id, 'published');
      addToast('Post publicado no Twitter!', 'success');
    } catch {
      addToast('Erro ao publicar no Twitter. Verifique as credenciais.', 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  // Published posts
  if (isPublished) {
    return (
      <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 flex gap-6 opacity-80 hover:opacity-100 transition-all">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-4">
            <span className="px-3 py-1 rounded-lg bg-white border border-slate-100 text-slate-600 text-xs font-bold flex items-center gap-2">
              <SourceIcon className="w-3 h-3" />
              {post.source_name ?? post.source}
            </span>
            <span className="text-slate-400 text-xs font-bold uppercase">
              {post.published_at ? formatRelativeTime(post.published_at) : formatRelativeTime(post.created_at)}
            </span>
          </div>
          <div className="flex gap-4">
            <Avatar
              initials={post.author.avatarInitials}
              emoji={post.author.avatarEmoji}
              size="sm"
            />
            <p className="text-base leading-relaxed text-slate-600 font-medium">
              {renderContent(currentContent)}
            </p>
          </div>
        </div>
        <div className="w-48 flex items-center justify-center border-l border-slate-200 pl-6">
          <p className="text-sky-500 font-bold text-sm flex items-center gap-2">
            <Twitter className="w-5 h-5" />
            Publicado
          </p>
        </div>
      </div>
    );
  }

  // Approved/Scheduled posts — show publish button
  if (isApproved) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-soft flex gap-6 hover:border-slate-300 transition-all">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold flex items-center gap-2">
                <SourceIcon className="w-3 h-3" />
                {post.source_name ?? post.source}
              </span>
              <Badge variant="scheduled">
                <Check className="w-3 h-3" />
                Aprovado
              </Badge>
            </div>
            {post.scheduled_at && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                <Calendar className="w-3 h-3" />
                {formatScheduledTime(post.scheduled_at)}
              </span>
            )}
          </div>
          <div className="flex gap-4">
            <Avatar
              initials={post.author.avatarInitials}
              emoji={post.author.avatarEmoji}
              size="md"
            />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base font-extrabold text-slate-900">
                  {post.author.name}
                </span>
                <span className="text-sm text-slate-400 font-medium">
                  {post.author.handle}
                </span>
              </div>
              <p className="text-lg leading-relaxed text-slate-700 font-medium">
                {renderContent(currentContent)}
              </p>
            </div>
          </div>
        </div>
        <div className="w-64 flex flex-col justify-center gap-3 pl-8 border-l border-slate-100">
          <Button
            variant="primary"
            onClick={() => setShowPublishConfirm(true)}
            loading={loadingAction === 'publish'}
            disabled={loadingAction !== null}
            icon={<Send className="w-4 h-4" />}
            className="w-full py-4"
          >
            Publicar no Twitter
          </Button>
          <Button
            variant="secondary"
            onClick={() => setShowEditModal(true)}
            disabled={loadingAction !== null}
            icon={<Pencil className="w-4 h-4" />}
            className="w-full py-3"
          >
            Editar Texto
          </Button>
        </div>

        <ConfirmDialog
          open={showPublishConfirm}
          title="Publicar no Twitter"
          description="Tem certeza que deseja publicar este post no Twitter? Esta ação não pode ser desfeita."
          confirmLabel="Publicar"
          loading={loadingAction === 'publish'}
          onConfirm={() => {
            handlePublish().finally(() => setShowPublishConfirm(false));
          }}
          onCancel={() => setShowPublishConfirm(false)}
        />

        <EditPostModal
          open={showEditModal}
          onClose={() => setShowEditModal(false)}
          post={{ ...post, content: currentContent }}
          onSave={(_, newContent) => setCurrentContent(newContent)}
        />
      </div>
    );
  }

  // Pending posts
  return (
    <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-soft flex gap-8 relative overflow-hidden group hover:border-slate-300 transition-all">
      {isPending && (
        <div className="absolute top-6 right-6">
          <Badge variant="pending" pulse>
            Aprovação Necessária
          </Badge>
        </div>
      )}

      <div className="flex-1">
        <div className="flex items-center gap-3 mb-4">
          <span className="px-3 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold flex items-center gap-2">
            <SourceIcon className="w-3 h-3" />
            {post.source_name ?? post.source}
          </span>
          <span className="text-slate-400 text-xs font-bold uppercase">
            {formatRelativeTime(post.created_at)}
          </span>
        </div>

        <div className="flex gap-4">
          <Avatar
            initials={post.author.avatarInitials}
            emoji={post.author.avatarEmoji}
            size="md"
          />
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base font-extrabold text-slate-900">
                {post.author.name}
              </span>
              <span className="text-sm text-slate-400 font-medium">
                {post.author.handle}
              </span>
            </div>
            <p className="text-lg leading-relaxed text-slate-700 font-medium">
              {renderContent(currentContent)}
            </p>

            {post.image_url && (
              <div className="mt-4 h-48 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 gap-2 font-medium">
                <Image className="w-5 h-5" />
                Preview da Imagem
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="w-64 flex flex-col justify-center gap-3 pl-8 border-l border-slate-100">
        <Button
          variant="primary"
          onClick={handleApprove}
          loading={loadingAction === 'approve'}
          disabled={loadingAction !== null}
          icon={<Check className="w-4 h-4" />}
          className="w-full py-4"
        >
          Aprovar Post
        </Button>
        <Button
          variant="secondary"
          onClick={() => setShowEditModal(true)}
          disabled={loadingAction !== null}
          icon={<Pencil className="w-4 h-4" />}
          className="w-full py-3"
        >
          Editar Texto
        </Button>
        <Button
          variant="destructive"
          onClick={() => setShowRejectConfirm(true)}
          disabled={loadingAction !== null}
          className="w-full py-2"
        >
          Descartar
        </Button>
      </div>

      <ConfirmDialog
        open={showRejectConfirm}
        title="Descartar Post"
        description="Tem certeza que deseja descartar este post? Esta ação não pode ser desfeita."
        confirmLabel="Descartar"
        loading={loadingAction === 'reject'}
        onConfirm={handleReject}
        onCancel={() => setShowRejectConfirm(false)}
      />

      <EditPostModal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        post={{ ...post, content: currentContent }}
        onSave={(_, newContent) => setCurrentContent(newContent)}
      />
    </div>
  );
}

function renderContent(content: string) {
  const parts = content.split(/(#[a-zA-Z0-9_\u00C0-\u024F]+)/g);
  return parts.map((part, i) => {
    if (part.startsWith('#')) {
      return (
        <span key={i} className="text-sky-500 font-bold">
          {part}
        </span>
      );
    }
    return part;
  });
}
