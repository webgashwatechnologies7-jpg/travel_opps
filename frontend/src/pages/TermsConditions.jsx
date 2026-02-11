import { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import { FileText, Save, AlertCircle, FileCheck, XCircle, Calendar, Heart, Bold, Italic, Underline, List, AlignLeft, AlignCenter, AlignRight, AlignJustify } from 'lucide-react';
import { settingsAPI } from '../services/api';

// PolicySection must be outside TermsConditions so it is not recreated on every keystroke (which was causing focus loss after one word)
const COLOR_CONFIG = {
  remarks: { headerBg: 'bg-orange-50', headerText: 'text-orange-700', iconBg: 'bg-orange-100', iconColor: 'text-orange-600', border: 'border-orange-200', dotBg: 'bg-orange-500' },
  terms: { headerBg: 'bg-blue-50', headerText: 'text-blue-700', iconBg: 'bg-blue-100', iconColor: 'text-blue-600', border: 'border-blue-200', dotBg: 'bg-blue-500' },
  confirmation: { headerBg: 'bg-green-50', headerText: 'text-green-700', iconBg: 'bg-green-100', iconColor: 'text-green-600', border: 'border-green-200', dotBg: 'bg-green-500' },
  cancellation: { headerBg: 'bg-red-50', headerText: 'text-red-700', iconBg: 'bg-red-100', iconColor: 'text-red-600', border: 'border-red-200', dotBg: 'bg-red-500' },
  amendment: { headerBg: 'bg-purple-50', headerText: 'text-purple-700', iconBg: 'bg-purple-100', iconColor: 'text-purple-600', border: 'border-purple-200', dotBg: 'bg-purple-500' },
  thankyou: { headerBg: 'bg-pink-50', headerText: 'text-pink-700', iconBg: 'bg-pink-100', iconColor: 'text-pink-600', border: 'border-pink-200', dotBg: 'bg-pink-500' }
};

function PolicySection({ title, value, onChange, placeholder, description, icon: Icon, color }) {
  const config = COLOR_CONFIG[color] || COLOR_CONFIG.terms;
  const editRef = useRef(null);
  const lastValueRef = useRef(undefined);

  useEffect(() => {
    const v = value ?? '';
    if (editRef.current && (lastValueRef.current === undefined || v !== lastValueRef.current)) {
      editRef.current.innerHTML = v;
      lastValueRef.current = v;
    }
  }, [value]);

  const handleInput = () => {
    if (!editRef.current) return;
    const html = editRef.current.innerHTML;
    lastValueRef.current = html;
    onChange(html);
  };

  const applyFormat = (cmd, value = null) => (e) => {
    e.preventDefault();
    editRef.current?.focus();
    document.execCommand(cmd, false, value);
    handleInput();
  };

  const blockFormat = (e) => {
    e.preventDefault();
    const block = e.target.value;
    if (block && editRef.current) {
      editRef.current.focus();
      document.execCommand('formatBlock', false, block === 'Normal' ? 'p' : block);
      handleInput();
    }
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg border-2 ${config.border} overflow-hidden mb-6 transition-all hover:shadow-xl`}>
      <div className={`${config.headerBg} px-6 py-4 border-b-2 ${config.border}`}>
        <div className="flex items-center gap-3">
          {Icon && (
            <div className={`p-2.5 rounded-lg ${config.iconBg}`}>
              <Icon className={`h-5 w-5 ${config.iconColor}`} />
            </div>
          )}
          <h2 className={`text-xl font-bold ${config.headerText}`}>{title}</h2>
        </div>
      </div>
      <div className="p-6">
        <div className="mb-4 flex flex-wrap items-center gap-2 p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200">
          <select className="px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium" aria-label="Paragraph format" onChange={blockFormat}>
            <option value="p">Normal</option>
            <option value="h1">Heading 1</option>
            <option value="h2">Heading 2</option>
            <option value="h3">Heading 3</option>
          </select>
          <div className="h-6 w-px bg-gray-300" aria-hidden />
          <div className="flex gap-1">
            <button type="button" className="p-1.5 hover:bg-white rounded border border-gray-300 hover:border-gray-400 transition-colors" title="Bold" onMouseDown={applyFormat('bold')}><Bold className="h-4 w-4 text-gray-700" /></button>
            <button type="button" className="p-1.5 hover:bg-white rounded border border-gray-300 hover:border-gray-400 transition-colors" title="Italic" onMouseDown={applyFormat('italic')}><Italic className="h-4 w-4 text-gray-700" /></button>
            <button type="button" className="p-1.5 hover:bg-white rounded border border-gray-300 hover:border-gray-400 transition-colors" title="Underline" onMouseDown={applyFormat('underline')}><Underline className="h-4 w-4 text-gray-700" /></button>
          </div>
          <div className="h-6 w-px bg-gray-300" aria-hidden />
          <div className="flex gap-1">
            <button type="button" className="p-1.5 hover:bg-white rounded border border-gray-300 hover:border-gray-400 transition-colors" title="Align Left" onMouseDown={applyFormat('justifyLeft')}><AlignLeft className="h-4 w-4 text-gray-700" /></button>
            <button type="button" className="p-1.5 hover:bg-white rounded border border-gray-300 hover:border-gray-400 transition-colors" title="Align Center" onMouseDown={applyFormat('justifyCenter')}><AlignCenter className="h-4 w-4 text-gray-700" /></button>
            <button type="button" className="p-1.5 hover:bg-white rounded border border-gray-300 hover:border-gray-400 transition-colors" title="Align Right" onMouseDown={applyFormat('justifyRight')}><AlignRight className="h-4 w-4 text-gray-700" /></button>
            <button type="button" className="p-1.5 hover:bg-white rounded border border-gray-300 hover:border-gray-400 transition-colors" title="Justify" onMouseDown={applyFormat('justifyFull')}><AlignJustify className="h-4 w-4 text-gray-700" /></button>
          </div>
          <div className="h-6 w-px bg-gray-300" aria-hidden />
          <div className="flex gap-1">
            <button type="button" className="p-1.5 hover:bg-white rounded border border-gray-300 hover:border-gray-400 transition-colors" title="Bullet List" onMouseDown={applyFormat('insertUnorderedList')}><List className="h-4 w-4 text-gray-700" /></button>
            <button type="button" className="px-2 py-1.5 text-sm hover:bg-white rounded border border-gray-300 hover:border-gray-400 transition-colors font-medium" title="Numbered List" onMouseDown={applyFormat('insertOrderedList')}>1.</button>
          </div>
        </div>
        <div
          ref={editRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          data-placeholder={placeholder}
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[200px] font-sans text-gray-700 resize-y overflow-auto empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400"
          style={{ pointerEvents: 'auto', userSelect: 'text' }}
          aria-label={title}
        />
        {description && (
          <div className="mt-3 flex items-start gap-2">
            <div className="mt-0.5">
              <div className={`w-1.5 h-1.5 rounded-full ${config.dotBg} opacity-60`} />
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">{description}</p>
          </div>
        )}
      </div>
    </div>
  );
}

const TermsConditions = () => {
  const [remarks, setRemarks] = useState('');
  const [termsConditions, setTermsConditions] = useState('');
  const [confirmationPolicy, setConfirmationPolicy] = useState('');
  const [cancellationPolicy, setCancellationPolicy] = useState('');
  const [amendmentPolicy, setAmendmentPolicy] = useState('');
  const [thankYouMessage, setThankYouMessage] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchAllPolicies();
  }, []);

  const fetchAllPolicies = async () => {
    try {
      setLoading(true);
      
      // Fetch all sections
      const [remarksRes, termsRes, confirmationRes, cancellationRes, amendmentRes, thankYouRes] = await Promise.all([
        settingsAPI.getByKey('remarks'),
        settingsAPI.getByKey('terms_conditions'),
        settingsAPI.getByKey('confirmation_policy'),
        settingsAPI.getByKey('cancellation_policy'),
        settingsAPI.getByKey('amendment_policy'),
        settingsAPI.getByKey('thank_you_message')
      ]);

      const getValue = (res) => {
        if (!res?.data?.success || !res?.data?.data) return '';
        const d = res.data.data;
        return (d.value != null ? String(d.value) : (d.content != null ? String(d.content) : ''));
      };
      setRemarks(getValue(remarksRes));
      setTermsConditions(getValue(termsRes));
      setConfirmationPolicy(getValue(confirmationRes));
      setCancellationPolicy(getValue(cancellationRes));
      setAmendmentPolicy(getValue(amendmentRes));
      setThankYouMessage(getValue(thankYouRes));
    } catch (err) {
      console.error('Failed to fetch policies:', err);
      setMessage({ type: 'error', text: 'Could not load policies. You can still type and save.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAll = async () => {
    try {
      setSaving(true);
      setMessage({ type: '', text: '' });
      
      // Save all sections
      await Promise.all([
        settingsAPI.save({
          key: 'remarks',
          value: remarks,
          type: 'text',
          description: 'General remarks and conditions for bookings'
        }),
        settingsAPI.save({
          key: 'terms_conditions',
          value: termsConditions,
          type: 'text',
          description: 'Terms and conditions for bookings and services'
        }),
        settingsAPI.save({
          key: 'confirmation_policy',
          value: confirmationPolicy,
          type: 'text',
          description: 'Policy regarding booking confirmation and payment terms'
        }),
        settingsAPI.save({
          key: 'cancellation_policy',
          value: cancellationPolicy,
          type: 'text',
          description: 'Policy regarding booking cancellations and refunds'
        }),
        settingsAPI.save({
          key: 'amendment_policy',
          value: amendmentPolicy,
          type: 'text',
          description: 'Policy regarding changes to travel dates (postpone/prepone)'
        }),
        settingsAPI.save({
          key: 'thank_you_message',
          value: thankYouMessage,
          type: 'text',
          description: 'Thank you message for employee full details view'
        })
      ]);
      
      setMessage({ type: 'success', text: 'All policies saved successfully!' });
    } catch (err) {
      console.error('Failed to save policies:', err);
      setMessage({ type: 'error', text: 'Failed to save. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            <FileText className="h-8 w-8" />
            Policies & Account Details
          </h1>
          <p className="text-gray-600 mt-2">Manage all policies and terms for packages</p>
        </div>

        {message.text && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Remarks */}
        <PolicySection
          title="Remarks"
          value={remarks}
          onChange={setRemarks}
          placeholder="Enter remarks here..."
          description="General remarks and conditions for bookings. Use toolbar buttons for formatting (Bold, Italic, Lists, etc.)"
          icon={AlertCircle}
          color="remarks"
        />

        {/* Terms & Conditions */}
        <PolicySection
          title="Terms & Conditions"
          value={termsConditions}
          onChange={setTermsConditions}
          placeholder="Enter terms and conditions here..."
          description="Terms and conditions for bookings and services."
          icon={FileText}
          color="terms"
        />

        {/* Confirmation Policy */}
        <PolicySection
          title="Confirmation Policy"
          value={confirmationPolicy}
          onChange={setConfirmationPolicy}
          placeholder="Enter confirmation policy here..."
          description="Policy regarding booking confirmation and payment terms."
          icon={FileCheck}
          color="confirmation"
        />

        {/* Cancellation Policy */}
        <PolicySection
          title="Cancellation Policy"
          value={cancellationPolicy}
          onChange={setCancellationPolicy}
          placeholder="Enter cancellation policy here..."
          description="Policy regarding booking cancellations and refunds."
          icon={XCircle}
          color="cancellation"
        />

        {/* Amendment Policy */}
        <PolicySection
          title="Amendment Policy (Postpone & Prepone Policy)"
          value={amendmentPolicy}
          onChange={setAmendmentPolicy}
          placeholder="Enter amendment policy here..."
          description="Policy regarding changes to travel dates (postpone/prepone)."
          icon={Calendar}
          color="amendment"
        />

        {/* Thank You Message */}
        <PolicySection
          title="Thank You Message (For Employee Full Details View)"
          value={thankYouMessage}
          onChange={setThankYouMessage}
          placeholder="Enter thank you message here..."
          description="Thank you message displayed in employee full details view."
          icon={Heart}
          color="thankyou"
        />

        {/* Save All Button */}
        <div className="flex justify-end mt-8 mb-4">
          <button
            onClick={handleSaveAll}
            disabled={saving}
            className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
          >
            <Save className="h-5 w-5" />
            {saving ? 'Saving All Policies...' : 'Save All Policies'}
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default TermsConditions;
