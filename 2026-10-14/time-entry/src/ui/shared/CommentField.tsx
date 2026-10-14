import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../app/AppContext';
import { formatDate } from '../../app/view';
import { ArrowUpIcon, CheckIcon } from './Icons';

/**
 * The volunteer's message for a day – one text, the backend copies it to every
 * team involved. Pressing Enter or the arrow marks it finished: the arrow
 * becomes a tick and a line says it goes out with the choices. Typing again
 * reopens it.
 */
export function CommentField({ day, variant }: { day: string; variant: 'phone' | 'desktop' }) {
  const app = useApp();
  const { t } = useTranslation();
  const text = app.state.schedule.comments[day] ?? '';
  const [done, setDone] = useState(() => text.trim().length > 0);
  const finish = () => {
    if (text.trim()) {
      setDone(true);
      app.noteSent();
    }
    (document.activeElement as HTMLElement | null)?.blur();
  };
  const common = {
    type: 'text' as const,
    value: text,
    'aria-label': t('commentFor', { day: formatDate(day) }),
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      setDone(false);
      app.comment(day, e.currentTarget.value);
    },
    onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && (e.preventDefault(), finish()),
    'data-testid': 'comment',
    'data-day': day,
    'data-done': done || undefined,
  };
  if (variant === 'desktop') {
    return (
      <div className={`d-comment${done ? ' is-done' : ''}`} title={done ? t('commentDone') : undefined}>
        <input {...common} placeholder={t('commentPlaceholderDesk')} onBlur={() => text.trim() && finish()} />
        {done && <CheckIcon className="d-comment__tick" data-testid="comment-done" />}
      </div>
    );
  }
  return (
    <form
      className={`m-comment${done ? ' is-done' : ''}`}
      onSubmit={(e) => {
        e.preventDefault();
        finish();
      }}
    >
      <input {...common} placeholder={t('commentPlaceholder')} />
      <button type="submit" aria-label={done ? t('commentDone') : t('commentSend')} data-testid="comment-send">
        {done ? <CheckIcon data-testid="comment-done" /> : <ArrowUpIcon />}
      </button>
      {done && <small className="m-comment__done">{t('commentDone')}</small>}
    </form>
  );
}
