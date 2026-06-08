import type { AlertNotification } from '../hooks/useAlerts';

type AlertToastsProps = {
  notifications: AlertNotification[];
  dismissNotification: (notificationId: string) => void;
};

export const AlertToasts = ({ notifications, dismissNotification }: AlertToastsProps) => {
  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-3">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className="rounded-lg border border-cyan-300/30 bg-slate-950/95 p-4 shadow-[0_16px_50px_rgba(0,0,0,0.45)] ring-1 ring-white/10 backdrop-blur"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-cyan-200">価格アラート</p>
              <p className="mt-1 text-sm font-semibold leading-6 text-white">
                {notification.message}
              </p>
            </div>
            <button
              type="button"
              onClick={() => dismissNotification(notification.id)}
              className="rounded-full px-2 py-1 text-xs font-bold text-slate-400 transition hover:bg-white/10 hover:text-white"
            >
              閉じる
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
