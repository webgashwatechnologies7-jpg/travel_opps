import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronLeft, FileText } from 'lucide-react';

// Helper function for logo resolution (Inlined to fix ReferenceError)
const resolveLogoUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  if (url.startsWith('http')) return url;
  if (url.startsWith('data:')) return url;
  
  // Globally remove all "storage/" occurrences and multiple slashes
  let cleanPath = url.replace(/storage\//gi, '').replace(/\/+/g, '/').replace(/^\//, '');
  
  // If it's a public asset, return as root-relative
  if (cleanPath.startsWith('assets/')) return '/' + cleanPath;
  
  // For everything else, ensure it has exactly one /storage/ prefix
  return '/storage/' + cleanPath;
};



const MobileSidebar = ({
    settings,
    isOpen,
    onClose,
    menuItems,
    openSubmenus,
    toggleSubmenu,
    isAdmin,
    isActive,
    checkFeatureAccess,
    MENU_ICON_MAP
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] lg:hidden bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div
                className="absolute inset-y-0 left-0 w-64 shadow-2xl transform transition-transform"
                style={{
                    background: settings?.sidebar_color || `linear-gradient(180deg, #2D3192 0%, #1a1c4b 100%)`
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex flex-col h-full text-white">
                    <div className="p-4 border-b border-blue-800/50 flex justify-between items-center bg-black/5">
                        <Link to="/dashboard" onClick={onClose} className="flex items-center gap-3">
                            {settings?.company_logo ? (
                                <img
                                    src={resolveLogoUrl(settings.company_logo)}
                                    alt="Logo"
                                    className="h-9 object-contain max-w-[160px]"
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                        const parent = e.target.parentElement;
                                        if (parent && !parent.querySelector('.fallback-text')) {
                                            const span = document.createElement('span');
                                            span.className = 'fallback-text font-bold text-lg text-white truncate max-w-[150px]';
                                            span.innerText = settings?.company_name || 'TravelFusion CRM';
                                            parent.appendChild(span);
                                        }
                                    }}
                                />
                            ) : (
                                <span className="font-bold text-xl">{settings?.company_name || 'TravelFusion CRM'}</span>
                            )}
                        </Link>
                        <button onClick={onClose} className="p-2 text-white hover:bg-white/10 rounded-full transition-colors"><ChevronLeft /></button>
                    </div>
                    <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
                        {menuItems.filter(item => !item.adminOnly || isAdmin).map((item) => {
                            const Icon = MENU_ICON_MAP[item.icon] || FileText;
                            if (item.submenu) {
                                const key = item.label.toLowerCase();
                                const isSubOpen = openSubmenus[key];
                                return (
                                    <div key={item.label}>
                                        <button
                                            onClick={() => { if (checkFeatureAccess(item.feature)) toggleSubmenu(key); }}
                                            className="w-full flex items-center px-3 py-3 rounded-lg hover:bg-white/10"
                                        >
                                            <Icon className="h-6 w-6" />
                                            <span className="ml-3 flex-1 text-left">{item.label}</span>
                                            <ChevronDown className={`h-4 w-4 transition-transform ${isSubOpen ? 'rotate-180' : ''}`} />
                                        </button>
                                        {isSubOpen && (
                                            <div className="ml-4 mt-1 space-y-1 border-l border-white/20 pl-2">
                                                {item.submenu.map(sub => (
                                                    <Link
                                                        key={sub.path}
                                                        to={sub.path}
                                                        onClick={() => onClose()}
                                                        className={`block p-2 text-sm rounded-lg transition-colors ${isActive(sub.path) ? 'bg-[#C42771] shadow-lg shadow-[#C42771]/20' : 'hover:bg-white/5'}`}
                                                    >
                                                        {sub.label}
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            }
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => onClose()}
                                    className={`flex items-center px-3 py-3 rounded-xl transition-all duration-300 ${isActive(item.path) ? 'bg-[#C42771] text-white shadow-lg shadow-[#C42771]/25' : 'hover:bg-white/10'}`}
                                >
                                    <Icon className="h-6 w-6" />
                                    <span className="ml-3">{item.label}</span>
                                </Link>
                            );
                        })}
                    </nav>
                </div>
            </div>
        </div>
    );
};

export default React.memo(MobileSidebar);
