import { Link } from 'react-router-dom';
import frpImage from '../../assets/frp-asdf.jpeg';
import guideImage from '../../assets/guide.webp';

const POSTS = [
  {
    id: 1,
    category: 'guide',
    badge: 'Guide',
    title: 'How to bypass FRP on Samsung SM-A546B (Android 14)',
    excerpt: 'Step-by-step walkthrough for the most-rented Samsung this month. Works in under 10 minutes with the right tool.',
    meta: '5 min read · Updated this week',
    image: guideImage,
    imageAlt: 'Xiaomi FRP unlock guide for MIUI 14',
  },
  {
    id: 2,
    category: 'new',
    badge: 'New Tool',
    title: 'New: Xiaomi HyperOS FRP removal now supported',
    excerpt: 'New Xiaomi auth bypass added to the rental catalog. Covers MIUI 14 + HyperOS 1.0 on Redmi Note 13 series.',
    meta: '2 min read',
    image: frpImage,
    imageAlt: 'Electronics repair tools and circuit board',
  },
];

const CATEGORY_ICON = {
  guide: '📘',
  new: '🆕',
  update: '🔄',
};

export default function Blog({ posts = POSTS }) {
  return (
    <section className="blog-section" aria-labelledby="blog-heading">
      <div className="blog-section__inner">
        <h2 id="blog-heading" className="blog-section__title">Guides &amp; new tools</h2>
        <div className="blog-grid">
          {posts.map((p) => (
            <Link
              key={p.id}
              to={p.to || '/blog'}
              className="blog-card"
            >
              {p.image ? (
                <div
                  className={`blog-card__media blog-card__media--${p.category}`}
                  data-fallback-icon={CATEGORY_ICON[p.category] || '📄'}
                >
                  <img
                    src={p.image}
                    alt={p.imageAlt || ''}
                    loading="lazy"
                    onError={(e) => {
                      const wrap = e.currentTarget.parentElement;
                      if (wrap) wrap.classList.add('blog-card__media--fallback');
                      e.currentTarget.remove();
                    }}
                  />
                </div>
              ) : (
                <div
                  className={`blog-card__thumb blog-card__thumb--${p.category}`}
                  aria-hidden="true"
                >
                  <span className="blog-card__thumb-icon">{CATEGORY_ICON[p.category] || '📄'}</span>
                </div>
              )}
              <div className="blog-card__body">
                <div className={`blog-card__badge blog-card__badge--${p.category}`}>{p.badge}</div>
                <div className="blog-card__title">{p.title}</div>
                <div className="blog-card__excerpt">{p.excerpt}</div>
                <div className="blog-card__meta">{p.meta}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
