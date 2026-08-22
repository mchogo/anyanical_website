import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from 'react';

// このワークスペースの共通モーダル基盤。複数箇所に個別実装されていた
// `fixed inset-0` オーバーレイ（お気に入りアップセル等）を置き換える想定。
//
// 前提・既知の制約:
// - 同時に開くDialogは1つを想定している。ネストしたDialog（Dialogの中から
//   別のDialogを開く）はスクロールロックがbody styleを直接書き換えるため
//   正しく動かない。ネストが必要になった場合はスクロールロックを
//   参照カウント方式に変更すること。
// - 破壊的操作（削除確認など）の安全策そのものはこのコンポーネントの外側で
//   担保する（例: 確認ボタンを主要CTAから離す、名称を再入力させる等）。
//   Dialog自体はEscape/背景クリックでの誤閉じを`closeOnEscape`/
//   `closeOnBackdropClick`で抑制できるだけ。

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

const EXIT_ANIMATION_MS = 160;

export type DialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  description?: string;
  /** 背景クリックで閉じるか。破壊的な確認ダイアログ等ではfalseを指定する。既定はtrue。 */
  closeOnBackdropClick?: boolean;
  /** Escapeキーで閉じるか。既定はtrue。 */
  closeOnEscape?: boolean;
  panelClassName?: string;
  /**
   * trueにすると見出し(h3)を`sr-only`にする。アクセシブルネーム
   * (aria-labelledby)は保ったまま、視覚的な見出しを children 側で
   * 独自レイアウト(アイコン付きの演出など)として描画したい場合に使う。
   */
  hideTitleVisually?: boolean;
};

export const Dialog = ({
  open,
  onClose,
  title,
  children,
  description,
  closeOnBackdropClick = true,
  closeOnEscape = true,
  panelClassName = '',
  hideTitleVisually = false,
}: DialogProps) => {
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const closeTimerRef = useRef<number | null>(null);
  const [isMounted, setIsMounted] = useState(open);
  const [isClosing, setIsClosing] = useState(false);

  // 表示/退場アニメーションのライフサイクル。openの高速な連打（開く→閉じる→
  // 開く…）でも、保留中のタイマーを常に破棄してから次の状態へ進めるため
  // 破綻しない。
  useEffect(() => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }

    if (open) {
      setIsMounted(true);
      setIsClosing(false);
      return;
    }

    setIsClosing(true);
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    closeTimerRef.current = window.setTimeout(
      () => {
        setIsMounted(false);
        setIsClosing(false);
        closeTimerRef.current = null;
      },
      prefersReducedMotion ? 0 : EXIT_ANIMATION_MS,
    );

    return () => {
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
    };
  }, [open]);

  // フォーカス管理: 開いたときに直前のフォーカス位置を覚えておき、閉じたら
  // 戻す。開いた瞬間はパネル内の最初のフォーカス可能要素（なければパネル
  // 自体）へフォーカスを移す。
  useEffect(() => {
    if (!isMounted) return;

    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const focusTarget = panel?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR) ?? panel;
    focusTarget?.focus();

    return () => {
      previouslyFocusedRef.current?.focus?.();
    };
  }, [isMounted]);

  // 背景スクロールのロック（iOS Safariでも背面が動かないよう、既存の
  // FloatingNav.tsxモバイルメニューと同じ position:fixed 方式を使う）。
  useEffect(() => {
    if (!isMounted) return;

    const scrollY = window.scrollY;
    const { style } = document.body;
    style.position = 'fixed';
    style.top = `-${scrollY}px`;
    style.left = '0';
    style.right = '0';
    style.overflow = 'hidden';

    return () => {
      style.position = '';
      style.top = '';
      style.left = '';
      style.right = '';
      style.overflow = '';
      window.scrollTo(0, scrollY);
    };
  }, [isMounted]);

  if (!isMounted) return null;

  const handleBackdropClick = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    if (closeOnBackdropClick) onClose();
  };

  const handleKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (closeOnEscape && e.key === 'Escape') {
      e.stopPropagation();
      onClose();
      return;
    }

    if (e.key !== 'Tab') return;

    const panel = panelRef.current;
    if (!panel) return;

    const focusable = Array.from(
      panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
    ).filter((el) => el.offsetParent !== null);

    if (focusable.length === 0) {
      e.preventDefault();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return (
    <div
      className={`fixed inset-0 z-[70] grid place-items-center bg-slate-950/80 px-4 backdrop-blur-sm motion-reduce:animate-none ${
        isClosing ? 'animate-dialog-backdrop-out' : 'animate-fade-in'
      }`}
      onClick={handleBackdropClick}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className={`max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-lg border border-amber-300/30 bg-slate-950 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.55)] outline-none motion-reduce:animate-none ${
          isClosing ? 'animate-dialog-panel-out' : 'animate-dialog-panel-in'
        } ${panelClassName}`}
      >
        <h3
          id={titleId}
          className={hideTitleVisually ? 'sr-only' : 'text-xl font-bold text-white'}
        >
          {title}
        </h3>
        {description && (
          <p id={descriptionId} className="mt-2 text-sm leading-6 text-slate-400">
            {description}
          </p>
        )}
        {children}
      </div>
    </div>
  );
};
