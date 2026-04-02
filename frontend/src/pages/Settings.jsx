import { useState, useEffect } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';
import { useContent } from '../contexts/ContentContext';
import { Settings as SettingsIcon, RotateCcw, Save, Hotel, Mail, Bell, Upload, X, Building, Phone, MapPin, Globe, Image as ImageIcon, Copy, Clock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api, { settingsAPI, googleMailAPI, notificationsAPI } from '../services/api';

const Settings = () => {
  const { user } = useAuth();
  const { t } = useContent();
  const { settings, updateSettings, resetSettings, loadSettings, loading: settingsLoading } = useSettings();
  
  const [formData, setFormData] = useState({
    sidebar_color: '#2D3192',
    dashboard_background_color: '#F0F2F9',
    header_background_color: '#F0F2F9',
  });

  const [logo, setLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [favicon, setFavicon] = useState(null);
  const [faviconPreview, setFaviconPreview] = useState(null);
  
  const [companyForm, setCompanyForm] = useState({
    company_name: '',
    company_address: '',
    company_phone: '',
    company_email: '',
    company_website: '',
    fb_page_id: '',
    fb_page_access_token: '',
    attendance_mode: 'flexible',
    allowed_ips: [],
    default_punch_in_time: '09:00',
    default_punch_out_time: '18:00',
  });

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [maxHotelOptions, setMaxHotelOptions] = useState(4);
  const [savingItinerarySettings, setSavingItinerarySettings] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [testingWebToLead, setTestingWebToLead] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData({
        sidebar_color: settings.sidebar_color || settings.sidebar_color1 || '#2D3192',
        dashboard_background_color: settings.dashboard_background_color || '#F0F2F9',
        header_background_color: settings.header_background_color || '#F0F2F9',
      });
    }
    fetchMaxHotelOptions();
    fetchCompanyDetails();
  }, [settings]);

  const fetchMaxHotelOptions = async () => {
    try {
      const response = await settingsAPI.getMaxHotelOptions();
      if (response.data.success && response.data.data?.max_hotel_options) {
        setMaxHotelOptions(response.data.data.max_hotel_options);
      }
    } catch (err) { console.error(err); }
  };

  const fetchCompanyDetails = async () => {
    try {
      const response = await settingsAPI.getCompany();
      if (response.data?.success && response.data?.data) {
        const company = response.data.data;
        setCompanyForm({
          company_name: company.name || '',
          company_address: company.address || '',
          company_phone: company.phone || '',
          company_email: company.email || '',
          company_website: company.website || '',
          fb_page_id: company.fb_page_id || '',
          fb_page_access_token: company.fb_page_access_token || '',
          attendance_mode: company.attendance_mode || 'flexible',
          allowed_ips: company.allowed_ips || [],
          default_punch_in_time: company.default_punch_in_time || '09:00',
          default_punch_out_time: company.default_punch_out_time || '18:00',
        });
        if (company.logo) setLogoPreview(company.logo);
        if (company.favicon) setFaviconPreview(company.favicon);
        if (company.api_key) setApiKey(company.api_key);
      }
    } catch (err) { console.error(err); }
  };

  const saveItinerarySettings = async () => {
    try {
      setSavingItinerarySettings(true);
      await settingsAPI.save({ key: 'max_hotel_options', value: maxHotelOptions.toString(), type: 'integer' });
      toast.success('Itinerary settings saved successfully!');
    } catch (err) { toast.error('Failed to save itinerary settings.'); } 
    finally { setSavingItinerarySettings(false); }
  };

  const testWebToLeadAPI = async () => {
    try {
      setTestingWebToLead(true);
      const testData = {
        api_key: apiKey,
        name: "Test Customer",
        phone: "9999999999",
        destination: "Switzerland",
        email: "test@example.com",
        source: "CRM Settings Test",
        campaign_name: "API Test",
        remark: "Automated test lead from settings page"
      };

      const response = await api.post('/leads/web-to-lead', testData);

      if (response.data.success) {
        toast.success(`Success! Test lead created (ID: ${response.data.data.lead_id})`);
      } else {
        toast.error(`API Error: ${response.data.message}`);
      }
    } catch (error) {
      console.error('Test API error:', error);
      toast.error(error.response?.data?.message || 'Failed to connect to API endpoint.');
    } finally {
      setTestingWebToLead(false);
    }
  };

  const handleCompanyChange = (e) => {
    const { name, value } = e.target;
    setCompanyForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      let logoUrl = logoPreview;
      if (logo) {
         const logoData = new FormData();
         logoData.append('logo', logo);
         const res = await api.post('/settings/upload-logo', logoData);
         if (res.data.success) logoUrl = res.data.data.logo_url;
      }
      let faviconUrl = faviconPreview;
      if (favicon) {
         const favData = new FormData();
         favData.append('logo', favicon);
         const res = await api.post('/settings/upload-logo', favData);
         if (res.data.success) faviconUrl = res.data.data.logo_url;
      }
      await settingsAPI.updateCompany({ ...companyForm, logo: logoUrl, favicon: faviconUrl });
      await updateSettings({
        sidebar_color: formData.sidebar_color,
        dashboard_background_color: formData.dashboard_background_color,
        header_background_color: formData.header_background_color,
      });
      toast.success('Settings updated successfully!');
      loadSettings();
    } catch (err) { toast.error('Error saving settings.'); } 
    finally { setSaving(false); }
  };

  if (settingsLoading) {
    return <div className="flex items-center justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-8 space-y-12">
          
          <div className="border-b pb-6">
            <h1 className="text-2xl font-bold flex items-center gap-3 text-slate-800 font-sans">
               <Building className="w-8 h-8 text-blue-600" /> Company Settings
            </h1>
            <p className="text-slate-500 mt-1 font-medium">Configure your dashboard brand and operational policies</p>
          </div>

          <section className="space-y-4">
             <h3 className="text-xs font-bold text-blue-600 uppercase tracking-widest flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-600"></div> Company Logo
             </h3>
             <div className="flex items-center gap-4">
                <button onClick={() => document.getElementById('l-up').click()} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-100">
                  <Upload className="w-4 h-4" /> CHOOSE LOGO
                </button>
                <button onClick={() => setLogoPreview(null)} className="px-6 py-2.5 bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-rose-600 transition-all active:scale-95 shadow-lg shadow-rose-100">
                  <X className="w-4 h-4" /> REMOVE
                </button>
                <input type="file" id="l-up" className="hidden" onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    setLogo(file);
                    const reader = new FileReader();
                    reader.onloadend = () => setLogoPreview(reader.result);
                    reader.readAsDataURL(file);
                  }
                }} />
             </div>
             <div className="p-4 bg-slate-50 rounded-3xl border border-dashed border-slate-200 inline-block">
                {logoPreview ? (
                  <img src={logoPreview} className="max-h-24 object-contain" alt="Logo" />
                ) : (
                  <div className="h-24 w-48 flex items-center justify-center text-slate-300"><Building className="w-12 h-12" /></div>
                )}
             </div>
          </section>

          <section className="space-y-4">
             <h3 className="text-xs font-bold text-blue-600 uppercase tracking-widest flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-600"></div> Company Favicon
             </h3>
             <div className="flex items-center gap-4">
                <button onClick={() => document.getElementById('f-up').click()} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-blue-700 transition-all">
                  <Upload className="w-4 h-4" /> CHOOSE FAVICON
                </button>
                <button onClick={() => setFaviconPreview(null)} className="px-6 py-2.5 bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-rose-600 transition-all">
                  <X className="w-4 h-4" /> REMOVE
                </button>
                <input type="file" id="f-up" className="hidden" onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    setFavicon(file);
                    const reader = new FileReader();
                    reader.onloadend = () => setFaviconPreview(reader.result);
                    reader.readAsDataURL(file);
                  }
                }} />
             </div>
             <div className="p-3 bg-slate-50 rounded-2xl border border-dashed border-slate-200 inline-block">
                {faviconPreview ? (
                  <img src={faviconPreview} className="h-8 w-8 object-contain" alt="Favicon" />
                ) : (
                  <div className="h-8 w-8 text-slate-400"><Globe className="w-6 h-6" /></div>
                )}
             </div>
          </section>

          <section className="space-y-6 pt-4">
            <h3 className="text-xs font-bold text-blue-600 uppercase tracking-widest flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-blue-600"></div> Company Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-2">
                 <label className="text-sm font-bold text-slate-700 ml-1">Company Name</label>
                 <input name="company_name" value={companyForm.company_name} onChange={handleCompanyChange} className="w-full px-5 py-3.5 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-blue-100 font-medium" />
               </div>
               <div className="space-y-2 md:col-span-2">
                 <label className="text-sm font-bold text-slate-700 ml-1">Address</label>
                 <textarea name="company_address" value={companyForm.company_address} onChange={handleCompanyChange} rows="3" className="w-full px-5 py-3.5 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-blue-100 font-medium resize-none" />
               </div>
               <div className="space-y-2">
                 <label className="text-sm font-bold text-slate-700 ml-1">Phone Number</label>
                 <input name="company_phone" value={companyForm.company_phone} onChange={handleCompanyChange} className="w-full px-5 py-3.5 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-blue-100 font-medium" />
               </div>
               <div className="space-y-2">
                 <label className="text-sm font-bold text-slate-700 ml-1">Email Address</label>
                 <input name="company_email" value={companyForm.company_email} onChange={handleCompanyChange} className="w-full px-5 py-3.5 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-blue-100 font-medium" />
               </div>
               <div className="space-y-2">
                 <label className="text-sm font-bold text-slate-700 ml-1">Website</label>
                 <input name="company_website" value={companyForm.company_website} onChange={handleCompanyChange} className="w-full px-5 py-3.5 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-blue-100 font-medium" />
               </div>
            </div>
          </section>

          <section className="space-y-6 pt-4">
             <h3 className="text-xs font-bold text-blue-600 uppercase tracking-widest flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-600"></div> Meta (Facebook) Lead Ads Integration
             </h3>
             <div className="p-5 bg-blue-50/50 border border-blue-100 rounded-3xl space-y-3">
                <h4 className="text-sm font-bold text-blue-800">Webhook Setup Instructions:</h4>
                <p className="text-xs text-blue-600 font-medium leading-relaxed">
                   To automatically fetch leads, configure your Facebook App Webhook.<br />
                   Callback URL: <code className="bg-white px-1.5 py-0.5 rounded border border-blue-200 mx-1">{window.location.origin}/api/facebook/webhook</code><br />
                   Verify Token: <code className="bg-white px-1.5 py-0.5 rounded border border-blue-200 mx-1">my_crm_lead_token</code>
                </p>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Facebook Page ID</label>
                  <input name="fb_page_id" value={companyForm.fb_page_id} onChange={handleCompanyChange} className="w-full px-5 py-3.5 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-blue-100 font-medium" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Page Access Token</label>
                  <input name="fb_page_access_token" value={companyForm.fb_page_access_token} onChange={handleCompanyChange} className="w-full px-5 py-3.5 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-blue-100 font-mono text-sm" />
                </div>
             </div>
          </section>

          <section className="space-y-6 pt-4">
             <h3 className="text-xs font-bold text-blue-600 uppercase tracking-widest flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-600"></div> Attendance & IP Policy
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="space-y-2">
                   <label className="text-sm font-bold text-slate-700 ml-1">Official Punch-in time</label>
                   <input type="time" name="default_punch_in_time" value={companyForm.default_punch_in_time} onChange={handleCompanyChange} className="w-full px-5 py-3.5 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-blue-100" />
                </div>
                <div className="space-y-2">
                   <label className="text-sm font-bold text-slate-700 ml-1">Official Punch-out time</label>
                   <input type="time" name="default_punch_out_time" value={companyForm.default_punch_out_time} onChange={handleCompanyChange} className="w-full px-5 py-3.5 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-blue-100" />
                </div>
             </div>
          </section>

          <section className="space-y-6 pt-4">
             <h3 className="text-xs font-bold text-blue-600 uppercase tracking-widest flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-600"></div> Customize your dashboard colors
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                   <label className="text-sm font-bold text-slate-700 ml-1">Sidebar Color</label>
                   <div className="flex items-center gap-4">
                      <input type="color" value={formData.sidebar_color} onChange={(e) => setFormData(p=>({...p, sidebar_color: e.target.value}))} className="w-12 h-12 rounded-xl cursor-pointer border-0 p-0 shadow-sm" />
                      <input value={formData.sidebar_color} readOnly className="flex-1 px-5 py-3.5 bg-slate-50 border-0 rounded-2xl font-mono" />
                   </div>
                </div>
                <div className="space-y-3">
                   <label className="text-sm font-bold text-slate-700 ml-1">Background Color</label>
                   <div className="flex items-center gap-4">
                      <input type="color" value={formData.dashboard_background_color} onChange={(e) => setFormData(p=>({...p, dashboard_background_color: e.target.value}))} className="w-12 h-12 rounded-xl cursor-pointer border-0 p-0 shadow-sm" />
                      <input value={formData.dashboard_background_color} readOnly className="flex-1 px-5 py-3.5 bg-slate-50 border-0 rounded-2xl font-mono" />
                   </div>
                </div>
             </div>
          </section>

          <div className="flex items-center gap-4 pt-8">
            <button onClick={handleSubmit} disabled={saving} className="px-10 py-3.5 bg-blue-600 text-white rounded-2xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 active:scale-95">
              <Save className="w-5 h-5" /> {saving ? 'SAVING...' : 'SAVE SETTINGS'}
            </button>
            <button onClick={() => { if(window.confirm('Reset?')) resetSettings(); }} className="px-10 py-3.5 bg-slate-800 text-white rounded-2xl font-bold flex items-center gap-2 hover:bg-black transition-all shadow-xl shadow-slate-100 active:scale-95">
              <RotateCcw className="w-5 h-5" /> RESET SETTINGS
            </button>
          </div>

          <hr className="opacity-50" />

          <section className="space-y-6 pt-4">
             <h3 className="text-lg font-bold flex items-center gap-2 text-slate-800">
                <div className="p-1.5 bg-blue-100 rounded-lg"><Hotel className="w-5 h-5 text-blue-600" /></div> Itinerary Settings
             </h3>
             <p className="text-sm text-slate-500 font-medium">Configure settings for itinerary management</p>
             <div className="space-y-4 max-w-lg">
                <div className="space-y-2">
                   <label className="text-sm font-bold text-slate-700 ml-1">Maximum Hotel Options Per Day</label>
                   <p className="text-[11px] text-slate-400 font-medium mb-2 leading-relaxed">Specify maximum number of hotel options the users can add per day in an itinerary. (Standard: 4)</p>
                   <div className="flex items-center gap-4">
                      <input type="number" min="1" max="10" value={maxHotelOptions} onChange={(e)=>setMaxHotelOptions(e.target.value)} className="w-24 px-5 py-3.5 bg-slate-50 border-0 rounded-2xl font-bold text-slate-700 focus:ring-2 focus:ring-blue-100" />
                      <span className="text-sm font-bold text-slate-400">options per day</span>
                   </div>
                </div>
                <button onClick={saveItinerarySettings} disabled={savingItinerarySettings} className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 active:scale-95 text-xs">
                  <Save className="w-4 h-4 mr-2 inline" /> {savingItinerarySettings ? 'SAVING...' : 'SAVE ITINERARY SETTINGS'}
                </button>
             </div>
          </section>

          <section className="space-y-6 pt-8 pb-12">
             <div className="flex items-center gap-3 border-t pt-12 mt-4">
                <div className="p-1.5 bg-indigo-100 rounded-lg"><Globe className="w-5 h-5 text-indigo-600" /></div>
                <div>
                   <h3 className="text-lg font-bold text-slate-800">Website Integration (Web-to-Lead API)</h3>
                </div>
             </div>
             <p className="text-sm text-slate-500 font-medium max-w-4xl leading-relaxed">
                Copy the API endpoint and keys below to connect your landing pages, ads, or external logic straight to the CRM. 
                All incoming leads will automatically flow into the CRM.
             </p>

             <div className="space-y-6 max-w-4xl">
                <div className="group space-y-2">
                   <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">YOUR UNIQUE API KEY</label>
                   <div className="flex items-center gap-2">
                      <input readOnly value={apiKey} className="w-full px-5 py-3.5 bg-slate-50 border-0 rounded-2xl font-mono text-sm text-slate-600 focus:ring-2 focus:ring-indigo-100" />
                      <button onClick={() => { navigator.clipboard.writeText(apiKey); toast.success('API Key Copied!'); }} className="p-3.5 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-100"><Copy className="w-5 h-5" /></button>
                   </div>
                </div>
                <div className="group space-y-2">
                   <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">API ENDPOINT URL (POST)</label>
                   <div className="flex items-center gap-2">
                      <input readOnly value={`${window.location.origin}/api/leads/web-to-lead`} className="w-full px-5 py-3.5 bg-slate-50 border-0 rounded-2xl font-mono text-sm text-slate-600 focus:ring-2 focus:ring-indigo-100" />
                      <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/api/leads/web-to-lead`); toast.success('Endpoint Copied!'); }} className="p-3.5 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-100"><Copy className="w-5 h-5" /></button>
                   </div>
                </div>
                
                <div className="flex items-center justify-between gap-4 py-4 bg-emerald-50/50 p-6 rounded-3xl border border-emerald-100">
                   <span className="text-sm font-medium text-emerald-800">You can trigger a test API request to check if leads are flowing successfully.</span>
                   <button onClick={testWebToLeadAPI} disabled={testingWebToLead} className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-100 flex items-center gap-2 disabled:opacity-50 transition-all active:scale-95">
                      <div className={`w-2 h-2 rounded-full bg-white ${testingWebToLead ? 'animate-spin' : 'animate-pulse'}`}></div> {testingWebToLead ? 'TESTING...' : 'TEST CONNECTION (CREATE TEST LEAD)'}
                   </button>
                </div>
             </div>

             <div className="mt-8 overflow-hidden rounded-3xl border border-slate-100 shadow-sm">
                <table className="w-full text-left text-sm border-collapse">
                   <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-widest">
                      <tr>
                        <th className="px-6 py-4">Parameter Name</th>
                        <th className="px-6 py-4">Data Type</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Description</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                      {[
                        {name: 'api_key', type: 'String', status: 'Required', desc: 'Your unique API Key provided above. Used for authentication.'},
                        {name: 'name', type: 'String', status: 'Required', desc: 'Full name of the customer/lead.'},
                        {name: 'phone', type: 'String', status: 'Required', desc: "Phone or WhatsApp number of the customer."},
                        {name: 'destination', type: 'String', status: 'Required', desc: 'The location the customer wants to travel to (e.g., "Shimla", "Dubai").'},
                        {name: 'email', type: 'String', status: 'Optional', desc: 'Email address of the customer.'},
                      ].map((row, i) => (
                        <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                           <td className="px-6 py-4 font-mono text-indigo-600 font-bold">{row.name}</td>
                           <td className="px-6 py-4 text-blue-500 font-semibold">{row.type}</td>
                           <td className="px-6 py-4"><span className={`${row.status==='Required'?'text-rose-500 bg-rose-50':'text-slate-500 bg-slate-100'} px-2.5 py-1 rounded-lg text-[10px] font-bold`}>{row.status}</span></td>
                           <td className="px-6 py-4 text-slate-500 font-medium">{row.desc}</td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </section>

        </div>
      </div>
    </div>
  );
};

export default Settings;
