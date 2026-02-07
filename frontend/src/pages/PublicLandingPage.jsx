import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { publicLandingPageAPI } from '../services/api';

const DEFAULT_ORDER = ['header', 'hero', 'about', 'whyUs', 'packages', 'whyBookOnline', 'footer'];

const PublicLandingPage = () => {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await publicLandingPageAPI.get(slug);
        if (res.data?.success && res.data?.data) {
          setData(res.data.data);
        }
      } catch (err) {
        setError('Page not found');
      } finally {
        setLoading(false);
      }
    };
    if (slug) fetchData();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-600">{error || 'Page not found'}</p>
      </div>
    );
  }

  const s = data.sections || {};
  const sectionOrder = Array.isArray(s.sectionOrder) ? s.sectionOrder : DEFAULT_ORDER;
  const header = s.header || {};
  const hero = s.hero || {};
  const about = s.about || {};
  const whyUs = s.whyUs || {};
  const packages = s.packages || {};
  const whyBookOnline = s.whyBookOnline || {};
  const footer = s.footer || {};

  const renderSection = (key) => {
    const sec = s[key] || {};
    if (key === 'sectionOrder') return null;

    if (key === 'header') {
      return (
        <header key={key} className="bg-white border-b shadow-sm py-3 px-6 flex justify-between items-center">
          <div className="flex items-center gap-2">
            {header.logo && <img src={header.logo} alt="Logo" className="h-10" />}
            <span className="font-semibold text-gray-800">{header.slogan || data.name}</span>
          </div>
          <div className="flex gap-4 text-sm">
            {header.phone && <a href={`tel:${header.phone}`} className="text-gray-700">📞 {header.phone}</a>}
            {header.email && <a href={`mailto:${header.email}`} className="text-gray-700">✉️ {header.email}</a>}
          </div>
        </header>
      );
    }
    if (key === 'hero') {
      return (
        <section
          key={key}
          className="relative py-24 px-6 text-center text-white"
          style={{
            background: hero.backgroundImage
              ? `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(${hero.backgroundImage}) center/cover`
              : 'linear-gradient(135deg, #0d9488, #14b8a6)',
          }}
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{hero.title || data.title}</h1>
          <p className="text-xl opacity-90 mb-2">{hero.subtitle}</p>
          {hero.tagline && <p className="inline-block bg-amber-400 text-gray-900 px-4 py-1 rounded font-semibold">{hero.tagline}</p>}
          {hero.formTitle && (
            <div className="mt-8 max-w-sm mx-auto bg-white/10 backdrop-blur rounded-lg p-6">
              <p className="text-lg font-semibold mb-4">{hero.formTitle}</p>
              <form className="space-y-3">
                <input type="text" placeholder="Name" className="w-full px-4 py-2 rounded border" />
                <input type="email" placeholder="Email" className="w-full px-4 py-2 rounded border" />
                <input type="tel" placeholder="Mobile" className="w-full px-4 py-2 rounded border" />
                <button type="submit" className="w-full bg-amber-400 text-gray-900 py-2 rounded font-semibold hover:bg-amber-500">SEND ENQUIRY</button>
              </form>
            </div>
          )}
        </section>
      );
    }
    if (key === 'about' && about.title) {
      return (
        <section key={key} className="py-16 px-6 max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">{about.title}</h2>
          <p className="text-gray-600 leading-relaxed whitespace-pre-line mb-6">{about.content}</p>
          {about.ctaText && about.ctaPhone && (
            <a href={`tel:${about.ctaPhone}`} className="inline-block bg-amber-400 text-gray-900 px-6 py-3 rounded font-semibold hover:bg-amber-500">{about.ctaText}</a>
          )}
        </section>
      );
    }
    if (key === 'whyUs' && whyUs.title) {
      return (
        <section key={key} className="py-16 px-6 bg-gray-50">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-10">{whyUs.title}</h2>
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(whyUs.items || []).map((item, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow-sm text-center">
                <div className="text-3xl mb-2">✓</div>
                <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </section>
      );
    }
    if (key === 'packages' && packages.title) {
      return (
        <section key={key} className="py-16 px-6">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-10">{packages.title}</h2>
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {(packages.items || []).map((pkg, i) => (
              <div key={i} className="bg-white border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition">
                <div className="relative h-48 bg-gray-200">
                  {pkg.image && <img src={pkg.image} alt={pkg.title} className="w-full h-full object-cover" />}
                  {pkg.discount && <span className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded text-sm font-bold">{pkg.discount}% OFF</span>}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900">{pkg.title}</h3>
                  <p className="text-sm text-gray-500">{pkg.duration}</p>
                  {(pkg.inclusions || []).length > 0 && (
                    <ul className="mt-2 text-sm text-gray-600 space-y-1">{pkg.inclusions.slice(0, 3).map((inc, j) => <li key={j}>• {inc}</li>)}</ul>
                  )}
                  <p className="mt-2 font-bold text-teal-600">Starts from ₹{pkg.price}/-</p>
                  <button className="mt-3 w-full bg-amber-400 text-gray-900 py-2 rounded font-semibold hover:bg-amber-500">SEND ENQUIRY</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      );
    }
    if (key === 'whyBookOnline' && whyBookOnline.title) {
      return (
        <section key={key} className="py-16 px-6 bg-gray-50">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-10">{whyBookOnline.title}</h2>
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {(whyBookOnline.items || []).map((item, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow-sm text-center">
                <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </section>
      );
    }
    if (key === 'footer') {
      return (
        <footer key={key} className="bg-gray-900 text-gray-300 py-12 px-6">
          <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between gap-6">
            <div>
              {footer.phone && <p>📞 {footer.phone}</p>}
              {footer.email && <p>✉️ {footer.email}</p>}
            </div>
            <div className="flex gap-4">
              {(footer.links || []).map((link, i) => (
                <a key={i} href="#" className="hover:text-white">{link}</a>
              ))}
            </div>
          </div>
          <p className="text-center mt-8 text-sm opacity-75">{footer.copyright}</p>
        </footer>
      );
    }
    if (sec.type === 'slider' && (sec.items || []).some((sl) => sl.image)) {
      return (
        <section key={key} className="py-8 px-6 bg-gray-100 overflow-hidden">
          {sec.title && <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">{sec.title}</h2>}
          <div className="max-w-5xl mx-auto">
            <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 scroll-smooth">
              {(sec.items || []).filter((sl) => sl.image).map((slide, i) => (
                <div key={i} className="flex-shrink-0 w-[85vw] md:w-[50vw] snap-center rounded-lg overflow-hidden bg-white shadow">
                  <a href={slide.link || '#'} className="block relative h-64">
                    <img src={slide.image} alt={slide.title || ''} className="w-full h-full object-cover" />
                    {(slide.title || slide.subtitle) && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 text-white">
                        {slide.title && <p className="font-semibold">{slide.title}</p>}
                        {slide.subtitle && <p className="text-sm opacity-90">{slide.subtitle}</p>}
                      </div>
                    )}
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>
      );
    }
    if (sec.type === 'textBlock' && (sec.title || sec.content)) {
      return (
        <section key={key} className="py-16 px-6 max-w-4xl mx-auto">
          {sec.title && <h2 className="text-3xl font-bold text-gray-900 mb-6">{sec.title}</h2>}
          {sec.content && <div className="text-gray-600 leading-relaxed whitespace-pre-line">{sec.content}</div>}
        </section>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-white">
      {sectionOrder.filter((k) => k !== 'sectionOrder').map((key) => renderSection(key))}
    </div>
  );
};

export default PublicLandingPage;
