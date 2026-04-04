import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronRight, ChevronLeft, FileText } from 'lucide-react';

const Sidebar = ({
    settings,
    isSidebarOpen,
    toggleSidebar,
    menuItems,
    openSubmenus,
    toggleSubmenu,
    isAdmin,
    isActive,
    isSubmenuActive,
    checkFeatureAccess,
    MENU_ICON_MAP
}) => {
    return (
        <div
            className={`sidebar-wrapper fixed inset-y-0 left-0 z-10 transition-all duration-300 hidden lg:block ${isSidebarOpen ? 'w-64' : 'w-20'}`}
            style={{ boxShadow: '2px 0 20px rgba(0, 0, 0, 0.2)' }}
        >
            <div className="w-full h-full shadow-lg" style={{
                background: settings?.sidebar_color
                    ? settings.sidebar_color
                    : `linear-gradient(180deg, #2D3192 0%, #1a1c4b 100%)`
            }}>
                <div className="flex flex-col h-full">
                    {/* Logo and Toggle Button */}
                    <div className="p-4 border-b border-blue-800/50 flex items-center justify-between">
                        <div className="flex items-center justify-start flex-1">
                            <Link to="/dashboard" className="flex items-center gap-2">
                                {settings?.company_logo ? (
                                    <img
                                        src={settings.company_logo && window.location.protocol === 'https:' && settings.company_logo.startsWith('http://') ? settings.company_logo.replace('http://', 'https://') : settings.company_logo}
                                        alt="Logo"
                                        className={`h-8 object-contain transition-all duration-300 ${isSidebarOpen ? 'opacity-100 max-w-[180px]' : 'opacity-100 w-8'}`}
                                        onError={(e) => {
                                            // Safe fallback to text if image fails
                                            e.target.style.display = 'none';
                                            const parent = e.target.parentElement;
                                            if (parent && !parent.querySelector('.fallback-text')) {
                                                const span = document.createElement('span');
                                                span.className = 'fallback-text text-xl font-bold text-white whitespace-nowrap overflow-hidden transition-all duration-300';
                                                span.innerText = settings?.company_name || 'TravelFusion CRM';
                                                if (!isSidebarOpen) {
                                                    span.innerText = span.innerText.charAt(0);
                                                }
                                                parent.appendChild(span);
                                            }
                                        }}
                                    />
                                ) : (
                                    <h1 className="text-xl font-bold text-white">
                                        {isSidebarOpen ? (settings?.company_name || 'TravelFusion CRM') : (settings?.company_name?.[0] || 'T')}
                                    </h1>
                                )}
                            </Link>
                        </div>
                        <button onClick={toggleSidebar} className="p-1.5 rounded-lg hover:bg-blue-800/50 transition-colors text-white">
                            {isSidebarOpen ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 p-2 space-y-1 overflow-y-auto overflow-x-hidden custom-scroll">
                        {menuItems.filter(item => !item.adminOnly || isAdmin).map((item) => {
                            if (item.submenu) {
                                const Icon = MENU_ICON_MAP[item.icon] || FileText;
                                const submenuKey = item.label.toLowerCase();
                                const isSubmenuOpen = openSubmenus[submenuKey];
                                const hasActiveSubmenu = isSubmenuActive(item.submenu.map(sm => sm.path));
                                return (
                                    <div key={item.label} className="relative">
                                        <button
                                            onClick={() => { if (checkFeatureAccess(item.feature)) toggleSubmenu(submenuKey); }}
                                            className={`w-full flex items-center px-3 py-3 rounded-xl transition-all duration-300 ${hasActiveSubmenu ? 'bg-[#C42771] text-white shadow-lg shadow-[#C42771]/20' : 'text-blue-100/80 hover:bg-white/10 hover:text-white'}`}
                                        >
                                            <Icon className="h-6 w-6 flex-shrink-0 text-white" />
                                            <span className={`ml-3 text-sm font-medium whitespace-nowrap text-white transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>
                                                {item.label}
                                            </span>
                                            <ChevronDown className={`ml-auto h-4 w-4 text-white transition-all duration-200 ${isSubmenuOpen ? 'rotate-180' : ''} ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`} />
                                        </button>
                                        {isSubmenuOpen && isSidebarOpen && (
                                            <div className="ml-2 mt-1 space-y-1">
                                                {item.submenu.map((subItem) => (
                                                    <Link
                                                        key={subItem.path}
                                                        to={subItem.path}
                                                        onClick={(e) => { if (!checkFeatureAccess(subItem.feature)) e.preventDefault(); }}
                                                        className={`flex items-center px-2 py-2 rounded-lg transition-colors ${isActive(subItem.path) ? 'bg-[#C42771]/80 text-white font-semibold' : 'text-blue-200 hover:bg-white/10'}`}
                                                    >
                                                        <span className="text-xs mr-2">•</span> <span className="text-sm">{subItem.label}</span>
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            } else {
                                const Icon = MENU_ICON_MAP[item.icon] || FileText;
                                return (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        onClick={(e) => { if (!checkFeatureAccess(item.feature)) e.preventDefault(); }}
                                        className={`flex items-center px-3 py-3 rounded-xl transition-all duration-300 ${isActive(item.path) ? 'bg-[#C42771] text-white shadow-lg shadow-[#C42771]/25' : 'text-blue-100/80 hover:bg-white/10 hover:text-white'}`}
                                    >
                                        <Icon className="h-6 w-6 flex-shrink-0 text-white" />
                                        <span className={`ml-3 text-sm font-medium whitespace-nowrap text-white transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>
                                            {item.label}
                                        </span>
                                    </Link>
                                );
                            }
                        })}
                    </nav>
                </div>
            </div>
        </div>
    );
};

export default React.memo(Sidebar);
