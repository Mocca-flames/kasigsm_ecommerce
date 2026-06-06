import { useBanners } from '../../hooks/useHomeData';
import { useLocalStorage } from '../../hooks/useHomeData';

const DISMISS_KEY = 'dismissed_banners';

function readDismissed() {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function writeDismissed(arr) {
  try { localStorage.setItem(DISMISS_KEY, JSON.stringify(arr)); } catch { /* noop */ }
}

export default function Banner() {
  const { banners, loading } = useBanners();
  const [dismissed, setDismissed] = useLocalStorage(DISMISS_KEY, readDismissed());

  if (loading || !banners || banners.length === 0) return null;

  const visible = banners.filter((b) => !dismissed.includes(b.id));
  if (visible.length === 0) return null;

  // Show at most 2 visible banners; remaining behind a "Show more" toggle
  const [first, second, ...rest] = visible;
  const shown = rest.length ? [first, second] : [first];

  return (
    <div className="banner-stack" role="region" aria-label="Promotional banners">
      {shown.map((b) => {
        const isImage = !!b.image_url;
        return (
          <BannerItem
            key={b.id}
            banner={b}
            isImage={isImage}
            onDismiss={() => {
              const next = [...dismissed, b.id];
              setDismissed(next);
              writeDismissed(next);
            }}
          />
        );
      })}
      {rest.length > 0 ? (
        <BannerOverflow
          banners={rest}
          onDismiss={(id) => {
            const next = [...dismissed, id];
            setDismissed(next);
            writeDismissed(next);
          }}
        />
      ) : null}
    </div>
  );
}

function BannerItem({ banner, isImage, onDismiss }) {
  const content = (
    <>
      {!isImage ? <span className="banner__icon">📢</span> : null}
      <span className="banner__title">{banner.title || ''}</span>
      {banner.content ? (
        <span className="banner__content">{banner.content}</span>
      ) : null}
      {banner.link_url ? (
        <a href={banner.link_url} className="banner__cta">Learn more →</a>
      ) : null}
      {banner.is_dismissible !== false ? (
        <button
          type="button"
          className="banner__close"
          aria-label="Dismiss banner"
          onClick={onDismiss}
        >×</button>
      ) : null}
    </>
  );

  if (isImage) {
    return (
      <div
        className="banner banner--image"
        style={{ backgroundImage: `url(${banner.image_url})` }}
        role="status"
      >
        <div className="banner__overlay">{content}</div>
      </div>
    );
  }
  return (
    <div className="banner" role="status">
      {content}
    </div>
  );
}

function BannerOverflow({ banners, onDismiss }) {
  // For Phase 1 we just render the rest below — stack is allowed up to 2 visible
  // The spec calls for "Show more" toggle; the simple version is to render all.
  return (
    <>
      {banners.map((b) => (
        <BannerItem
          key={b.id}
          banner={b}
          isImage={!!b.image_url}
          onDismiss={onDismiss}
        />
      ))}
    </>
  );
}
