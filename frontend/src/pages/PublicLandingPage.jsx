import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { publicLandingPageAPI } from '../services/api';

const DEFAULT_ORDER = ['header', 'hero', 'about', 'whyUs', 'packages', 'whyBookOnline', 'footer'];
const DESTINATIONS = ['Shimla', 'Manali', 'Kullu', 'Khajjiar', 'Dharamshala', 'Dalhousie', 'Kasol', 'Spiti', 'Other'];

const PackageCard = ({ pkg, onEnquiry, phone }) => {
  const [showAllInclusions, setShowAllInclusions] = useState(false);
  const inc = pkg.inclusions || [];
  const disp = showAllInclusions ? inc : inc.slice(0, 3);
  const hasMore = inc.length > 3;
  const waNum = (phone || '').replace(/\D/g, '');
  const waLink = waNum ? `https://wa.me/91${waNum.slice(-10)}` : '#';
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition">
      <div className="relative h-40 sm:h-48 bg-gray-200">
        {pkg.image && <img src={pkg.image} alt={pkg.title} className="w-full h-full object-cover" />}
        {pkg.discount && <span className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-amber-400 text-gray-900 px-2 py-1 rounded text-xs sm:text-sm font-bold">{pkg.discount}% OFF</span>}
      </div>
      <div className="p-3 sm:p-4">
        <h3 className="font-semibold text-gray-900 text-sm sm:text-base">{pkg.title}</h3>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">Duration: {pkg.duration}</p>
        <div className="flex gap-2 mt-2 text-gray-400">
          <span title="Flight">✈</span><span title="Hotel">🏨</span><span title="Sightseeing">👁</span><span title="Meals">🍽</span><span title="Transfer">🚐</span>
        </div>
        {inc.length > 0 && (
          <ul className="mt-2 text-xs sm:text-sm text-gray-600 space-y-1">
            {disp.map((item, j) => <li key={j}>• {item}</li>)}
            {hasMore && !showAllInclusions && <li><button type="button" onClick={() => setShowAllInclusions(true)} className="text-amber-600 font-medium">Read More</button></li>}
            {hasMore && showAllInclusions && <li><button type="button" onClick={() => setShowAllInclusions(false)} className="text-amber-600 font-medium">Show Less</button></li>}
          </ul>
        )}
        <div className="mt-3 flex items-center justify-between gap-2 flex-wrap">
          <p className="font-bold text-green-600 text-sm sm:text-base">Starts from ₹{pkg.price}/-</p>
          <a href={waLink} target="_blank" rel="noopener noreferrer" className="text-green-600" title="WhatsApp">💬</a>
        </div>
        <button onClick={onEnquiry} className="mt-3 w-full bg-amber-400 text-gray-900 py-2 rounded font-semibold hover:bg-amber-500 text-sm">SEND ENQUIRY</button>
      </div>
    </div>
  );
};

const SliderSection = ({ title, slides, autoplay, interval }) => {
  const scrollRef = useRef(null);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!autoplay || !scrollRef.current || slides.length <= 1) return;
    const timer = setInterval(() => {
      const next = (current + 1) % slides.length;
      setCurrent(next);
      const el = scrollRef.current;
      if (el) {
        const cardW = el.querySelector('.snap-center')?.offsetWidth || 0;
        el.scrollTo({ left: next * (cardW + 16), behavior: 'smooth' });
      }
    }, interval);
    return () => clearInterval(timer);
  }, [autoplay, interval, current, slides.length]);

  return (
    <section className="py-6 md:py-8 px-4 sm:px-6 bg-gray-100 overflow-hidden">
      {title && <h2 className="text-xl sm:text-2xl font-bold text-center text-gray-900 mb-4 md:mb-6">{title}</h2>}
      <div className="max-w-5xl mx-auto">
        <div ref={scrollRef} className="flex overflow-x-auto snap-x snap-mandatory gap-3 md:gap-4 pb-4 scroll-smooth scrollbar-hide">
          {slides.map((slide, i) => (
            <div key={i} className="flex-shrink-0 w-[80vw] sm:w-[60vw] md:w-[50vw] snap-center rounded-lg overflow-hidden bg-white shadow">
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
        {slides.length > 1 && (
          <div className="flex justify-center gap-1 mt-2">
            {slides.map((_, i) => (
              <button key={i} type="button" onClick={() => { setCurrent(i); scrollRef.current?.scrollTo({ left: i * (scrollRef.current?.querySelector('.snap-center')?.offsetWidth || 0) + i * 16, behavior: 'smooth' }); }} className={`w-2 h-2 rounded-full ${i === current ? 'bg-amber-500' : 'bg-gray-300'}`} aria-label={`Slide ${i + 1}`} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

const EnquiryForm = ({ formTitle, onSubmit, submitting, compact = false, resetTrigger }) => {
  const [form, setForm] = useState({ name: '', email: '', phone: '', city: '', destination: '' });
  useEffect(() => {
    if (resetTrigger) setForm({ name: '', email: '', phone: '', city: '', destination: '' });
  }, [resetTrigger]);
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name?.trim() || !form.email?.trim() || !form.phone?.trim()) {
      toast.warning('Please fill Name, Email and Mobile');
      return;
    }
    const ok = await onSubmit(form);
    if (ok) setForm({ name: '', email: '', phone: '', city: '', destination: '' });
  };
  return (
    <form onSubmit={handleSubmit} className={`space-y-3 ${compact ? '' : 'space-y-3'}`}>
      <p className={`font-semibold text-gray-900 ${compact ? 'text-base' : 'text-lg'} mb-3`}>{formTitle || 'Get Free Quote'}</p>
      <input type="text" placeholder="Name" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="w-full px-4 py-2.5 rounded border border-gray-300 bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500" />
      <input type="email" placeholder="Email" required value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className="w-full px-4 py-2.5 rounded border border-gray-300 bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500" />
      <input type="tel" placeholder="Mobile No." required value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className="w-full px-4 py-2.5 rounded border border-gray-300 bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500" />
      <input type="text" placeholder="Your City" value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} className="w-full px-4 py-2.5 rounded border border-gray-300 bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500" />
      <select value={form.destination} onChange={(e) => setForm((f) => ({ ...f, destination: e.target.value }))} className="w-full px-4 py-2.5 rounded border border-gray-300 focus:ring-2 focus:ring-amber-400 focus:border-amber-500 bg-white">
        <option value="">Choose your Destination</option>
        {DESTINATIONS.map((d) => (
          <option key={d} value={d}>{d}</option>
        ))}
      </select>
      <button type="submit" disabled={submitting} className="w-full bg-amber-400 text-gray-900 py-2.5 rounded font-semibold hover:bg-amber-500 disabled:opacity-70">
        {submitting ? 'Sending...' : 'SEND ENQUIRY'}
      </button>
    </form>
  );
};

const PublicLandingPage = () => {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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

  const handleEnquirySubmit = async (formData) => {
    setSubmitting(true);
    try {
      await publicLandingPageAPI.submitEnquiry(slug, formData);
      setFormModalOpen(false);
      setSuccessModalOpen(true);
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit. Please try again.');
      return false;
    } finally {
      setSubmitting(false);
    }
  };

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
        <header key={key} className="bg-white border-b shadow-sm py-3 px-4 sm:px-6 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-2">
            {header.logo && <img src={header.logo} alt="Logo" className="h-8 sm:h-10" />}
            <span className="font-semibold text-gray-800 text-sm sm:text-base">{header.slogan || data.name}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm">
            {header.phone && <a href={`tel:${header.phone}`} className="text-gray-700">📞 {header.phone}</a>}
            {header.email && <a href={`mailto:${header.email}`} className="text-gray-700 truncate">✉️ {header.email}</a>}
            <button onClick={() => setFormModalOpen(true)} className="bg-amber-400 text-gray-900 px-4 py-2 rounded font-semibold hover:bg-amber-500 text-sm whitespace-nowrap">
              GET FREE QUOTE
            </button>
          </div>
        </header>
      );
    }
    if (key === 'hero') {
      return (
        <section
          key={key}
          className="relative py-12 md:py-20 lg:py-24 px-4 sm:px-6 text-white min-h-[400px] md:min-h-[500px] flex items-center"
          style={{
            background: hero.backgroundImage
              ? `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(${hero.backgroundImage}) center/cover`
              : 'linear-gradient(135deg, #0d9488, #14b8a6)',
          }}
        >
          <div className="max-w-6xl mx-auto w-full flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
            <div className="flex-1 text-center lg:text-left">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-4">{hero.title || data.title}</h1>
              <p className="text-base sm:text-lg md:text-xl opacity-90 mb-2">{hero.subtitle}</p>
              {hero.tagline && <p className="inline-block bg-gray-900 text-white px-3 py-1.5 md:px-4 rounded font-semibold text-sm md:text-base mt-2">{hero.tagline}</p>}
            </div>
            {hero.formTitle && (
              <div className="w-full lg:w-96 flex-shrink-0 bg-amber-400/95 rounded-xl p-4 sm:p-6 shadow-lg">
                <EnquiryForm formTitle={hero.formTitle} onSubmit={handleEnquirySubmit} submitting={submitting} resetTrigger={successModalOpen} />
              </div>
            )}
          </div>
        </section>
      );
    }
    if (key === 'about' && (about.title || whyUs.title)) {
      return (
        <section key="about-whyus" className="py-10 md:py-16 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
            {about.title && (
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">{about.title}</h2>
                <p className="text-gray-600 leading-relaxed whitespace-pre-line text-sm sm:text-base">{about.content}</p>
                {about.ctaText && about.ctaPhone && (
                  <a href={`tel:${about.ctaPhone}`} className="inline-block mt-4 bg-amber-400 text-gray-900 px-4 py-2.5 sm:px-6 sm:py-3 rounded font-semibold hover:bg-amber-500 text-sm sm:text-base">{about.ctaText}</a>
                )}
              </div>
            )}
            {whyUs.title && (
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">{whyUs.title}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                  {(whyUs.items || []).map((item, i) => (
                    <div key={i} className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-gray-900 text-sm sm:text-base">{item.title}</h3>
                      <p className="text-gray-600 text-xs sm:text-sm mt-1">{item.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      );
    }
    if (key === 'whyUs') return null;
    if (key === 'packages' && packages.title) {
      return (
        <section key={key} className="py-10 md:py-16 px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-6 md:mb-10">{packages.title}</h2>
          <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
            {(packages.items || []).map((pkg, i) => (
              <PackageCard key={i} pkg={pkg} onEnquiry={() => setFormModalOpen(true)} phone={header.phone || footer.phone} />
            ))}
          </div>
        </section>
      );
    }
    if (key === 'whyBookOnline' && whyBookOnline.title) {
      return (
        <section key={key} className="py-10 md:py-16 px-4 sm:px-6 bg-gray-50">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-6 md:mb-10">{whyBookOnline.title}</h2>
          <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {(whyBookOnline.items || []).map((item, i) => (
              <div key={i} className="bg-white p-4 md:p-6 rounded-lg shadow-sm text-center">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-amber-400 text-gray-900 font-bold mb-3">✓</div>
                <h3 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">{item.title}</h3>
                <p className="text-gray-600 text-xs sm:text-sm">{item.description}</p>
              </div>
            ))}
          </div>
          {about.ctaText && about.ctaPhone && (
            <div className="text-center mt-8">
              <a href={`tel:${about.ctaPhone}`} className="inline-block bg-green-600 text-white px-6 py-3 rounded font-semibold hover:bg-green-700">CALL NOW FOR CUSTOMIZED PACKAGES</a>
            </div>
          )}
        </section>
      );
    }
    if (key === 'footer') {
      const links = footer.links || [];
      return (
        <footer key={key} className="bg-gray-900 text-gray-300">
          <div className="bg-black py-3 px-4">
            <div className="max-w-6xl mx-auto flex flex-wrap justify-center gap-2 sm:gap-4 text-xs sm:text-sm">
              {links.map((link, i) => (
                <a key={i} href="#" className="hover:text-amber-400">{link}</a>
              ))}
            </div>
          </div>
          <div className="max-w-6xl mx-auto py-8 md:py-12 px-4 sm:px-6 grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 text-center md:text-left">
            <div>
              <p className="font-semibold text-white mb-2">GUARANTEE</p>
              <ul className="space-y-1 text-sm">
                <li>✓ 100% Trust</li>
                <li>✓ 100% Support</li>
                <li>✓ 100% Value for money</li>
                <li>✓ 100% Online security</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-white mb-2">APPROVED BY</p>
              <p className="text-sm">Ministry of Tourism, Government of India</p>
            </div>
            <div>
              <p className="font-semibold text-white mb-2">CUSTOMER SUPPORT</p>
              {footer.phone && <p className="text-sm">📞 {footer.phone}</p>}
              {footer.email && <p className="text-sm">✉️ {footer.email}</p>}
            </div>
          </div>
          <p className="text-center pb-6 text-xs sm:text-sm opacity-75">{footer.copyright}</p>
        </footer>
      );
    }
    if (sec.type === 'slider' && (sec.items || []).some((sl) => sl.image)) {
      const slides = (sec.items || []).filter((sl) => sl.image);
      const autoplay = sec.autoplay !== false;
      const interval = sec.autoplayInterval || 5000;
      return (
        <SliderSection key={key} title={sec.title} slides={slides} autoplay={autoplay} interval={interval} />
      );
    }
    if (sec.type === 'textBlock' && (sec.title || sec.content)) {
      return (
        <section key={key} className="py-10 md:py-16 px-4 sm:px-6 max-w-4xl mx-auto">
          {sec.title && <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 md:mb-6">{sec.title}</h2>}
          {sec.content && <div className="text-gray-600 leading-relaxed whitespace-pre-line text-sm sm:text-base">{sec.content}</div>}
        </section>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-white relative">
      {sectionOrder.filter((k) => k !== 'sectionOrder').map((key) => renderSection(key))}

      {/* Floating WhatsApp icon - left side */}
      {(header.phone || footer.phone) && (
        <a
          href={`https://wa.me/91${(header.phone || footer.phone || '').replace(/\D/g, '').slice(-10)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 left-4 sm:left-6 z-40 w-14 h-14 bg-green-500 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-green-600"
          title="Chat on WhatsApp"
        >
          <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
        </a>
      )}

      {/* Floating GET FREE QUOTE button - right side */}
      <button
        onClick={() => setFormModalOpen(true)}
        className="fixed bottom-6 right-4 sm:right-6 z-40 bg-blue-600 text-white px-4 py-3 rounded-lg shadow-lg hover:bg-blue-700 font-semibold text-sm sm:text-base flex items-center gap-2"
      >
        GET FREE QUOTE
      </button>

      {/* Form popup modal */}
      {formModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setFormModalOpen(false)}>
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Get Free Quote</h3>
              <button onClick={() => setFormModalOpen(false)} className="text-gray-500 hover:text-gray-700 text-2xl leading-none">&times;</button>
            </div>
            <EnquiryForm formTitle="Fill Form & Get Free Quotes" onSubmit={handleEnquirySubmit} submitting={submitting} resetTrigger={successModalOpen} />
          </div>
        </div>
      )}

      {/* Success popup modal */}
      {successModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setSuccessModalOpen(false)}>
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-8 text-center" onClick={(e) => e.stopPropagation()}>
            <div className="text-5xl text-green-500 mb-4">✓</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Thank You!</h3>
            <p className="text-gray-600 mb-6">We will contact you soon.</p>
            <button onClick={() => setSuccessModalOpen(false)} className="w-full bg-teal-600 text-white py-2.5 rounded font-semibold hover:bg-teal-700">
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicLandingPage;
