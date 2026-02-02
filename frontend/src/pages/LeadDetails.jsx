import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { leadsAPI, usersAPI, followupsAPI, dayItinerariesAPI, packagesAPI, settingsAPI, suppliersAPI, hotelsAPI, paymentsAPI, googleMailAPI, whatsappAPI, queryDetailAPI, vouchersAPI } from '../services/api';
import { searchPexelsPhotos } from '../services/pexels';
import { getDisplayImageUrl, rewriteHtmlImageUrls, sanitizeEmailHtmlForDisplay } from '../utils/imageUrl';
import Layout from '../components/Layout';
import { ArrowLeft, Calendar, Mail, Plus, Upload, X, Search, FileText, Printer, Send, MessageCircle, CheckCircle, CheckCircle2, Clock, Briefcase, MapPin, CalendarDays, Users, UserCheck, Leaf, Smartphone, Phone, MoreVertical, Download, Pencil, Trash2, Camera, RefreshCw, Reply, ChevronDown } from 'lucide-react';
import DetailRow from '../components/Quiries/DetailRow';
import html2pdf from 'html2pdf.js';
const LeadDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    return tab || 'proposals';
  });
  const [users, setUsers] = useState([]);
  const [notes, setNotes] = useState([]);
  const [noteText, setNoteText] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [addingNote, setAddingNote] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [showItineraryModal, setShowItineraryModal] = useState(false);
  const [showInsertItineraryModal, setShowInsertItineraryModal] = useState(false);
  const [sendDropdownOptId, setSendDropdownOptId] = useState(null);
  const [sendingOptionChannel, setSendingOptionChannel] = useState(null);
  const [dayItineraries, setDayItineraries] = useState([]);
  const [loadingItineraries, setLoadingItineraries] = useState(false);
  const [itinerarySearchTerm, setItinerarySearchTerm] = useState('');
  const [proposals, setProposals] = useState([]);
  const [showQuotationModal, setShowQuotationModal] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [quotationData, setQuotationData] = useState(null);
  const [loadingQuotation, setLoadingQuotation] = useState(false);
  const [itineraryFormData, setItineraryFormData] = useState({
    itinerary_name: '',
    duration: '1',
    destinations: '',
    notes: '',
    image: null,
    show_on_website: true
  });
  const [savingItinerary, setSavingItinerary] = useState(false);
  const [itineraryImagePreview, setItineraryImagePreview] = useState(null);
  const [showItineraryLibraryModal, setShowItineraryLibraryModal] = useState(false);
  const [itineraryLibrarySearchTerm, setItineraryLibrarySearchTerm] = useState('');
  const [itineraryLibraryTab, setItineraryLibraryTab] = useState('free');
  const [itineraryFreeStockPhotos, setItineraryFreeStockPhotos] = useState([]);
  const [itineraryFreeStockLoading, setItineraryFreeStockLoading] = useState(false);
  const [itineraryFreeStockError, setItineraryFreeStockError] = useState(null); // 'no_api_key' | 'api_error' | null
  const [itineraryLibraryPackages, setItineraryLibraryPackages] = useState([]);
  const [followups, setFollowups] = useState([]);
  const [showFollowupModal, setShowFollowupModal] = useState(false);
  const [editingFollowupId, setEditingFollowupId] = useState(null);
  const [followupFormData, setFollowupFormData] = useState({
    type: 'Task',
    description: '',
    reminder_date: '',
    reminder_time: '',
    set_reminder: 'Yes'
  });
  const [addingFollowup, setAddingFollowup] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [hotelsFromConfirmedOption, setHotelsFromConfirmedOption] = useState([]);
  const [vehiclesFromProposals, setVehiclesFromProposals] = useState([]);
  const [selectedSuppliers, setSelectedSuppliers] = useState([]);
  const [selectedHotels, setSelectedHotels] = useState([]);
  const [selectedVehicles, setSelectedVehicles] = useState([]);
  const [selectAllSuppliers, setSelectAllSuppliers] = useState(false);
  const [selectAllHotels, setSelectAllHotels] = useState(false);
  const [selectAllVehicles, setSelectAllVehicles] = useState(false);
  const [supplierEmailForm, setSupplierEmailForm] = useState({
    subject: '',
    cc_email: '',
    body: ''
  });
  const [sendingEmail, setSendingEmail] = useState(false);
  const [payments, setPayments] = useState([]);
  const [paymentSummary, setPaymentSummary] = useState({ total_amount: 0, total_paid: 0, total_due: 0 });
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentFormData, setPaymentFormData] = useState({
    amount: '',
    paid_amount: '',
    due_date: ''
  });
  const [addingPayment, setAddingPayment] = useState(false);
  const [activityTimeline, setActivityTimeline] = useState([]);
  const [queryDetailInvoices, setQueryDetailInvoices] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [voucherActionLoading, setVoucherActionLoading] = useState(null); // 'preview' | 'download' | 'send'
  const [showVoucherPopup, setShowVoucherPopup] = useState(false);
  const [voucherPopupHtml, setVoucherPopupHtml] = useState('');

  // Email states
  const [leadEmails, setLeadEmails] = useState([]);
  const [loadingEmails, setLoadingEmails] = useState(false);
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [emailFormData, setEmailFormData] = useState({
    to_email: '',
    cc_email: '',
    subject: '',
    body: ''
  });
  const [sendingClientEmail, setSendingClientEmail] = useState(false);
  const [emailAttachment, setEmailAttachment] = useState(null);
  const [companySettings, setCompanySettings] = useState(null);
  const [gmailEmails, setGmailEmails] = useState([]);
  const [loadingGmail, setLoadingGmail] = useState(false);
  const [syncingInbox, setSyncingInbox] = useState(false);
  const [replyThreadId, setReplyThreadId] = useState(null);
  const [whatsappMessages, setWhatsappMessages] = useState([]);

  useEffect(() => {
    fetchLeadDetails();
    fetchUsers();
    loadProposals();
    fetchSuppliers();
    fetchCompanySettings();
  }, [id]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [location.search]);

  useEffect(() => {
    const closeDropdown = () => setSendDropdownOptId(null);
    if (sendDropdownOptId) {
      document.addEventListener('click', closeDropdown);
      return () => document.removeEventListener('click', closeDropdown);
    }
  }, [sendDropdownOptId]);

  // Outgoing numbers for calls tab (no-op if not used; implement with callsAPI.getMappings() if needed)
  const fetchOutgoingNumbers = async () => {
    try {
      // Optional: load call mappings when Calls tab is used
    } catch (err) {
      // ignore
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchOutgoingNumbers();
    }
  }, [user?.id]);

  useEffect(() => {
    if (activeTab !== 'calls') {
      return;
    }

    fetchCallHistory();
    const interval = setInterval(() => {
      fetchCallHistory();
    }, 5000);

    return () => clearInterval(interval);
  }, [activeTab, id]);

  useEffect(() => {
    if ((activeTab === 'history' || activeTab === 'invoice') && id) {
      fetchQueryDetail();
    }
  }, [activeTab, id]);

  // Fetch company settings (use /settings not /admin/settings to avoid 500 tenant error)
  const fetchCompanySettings = async () => {
    try {
      const response = await settingsAPI.getAll();
      if (response.data?.success && response.data?.data) {
        const raw = response.data.data;
        const obj = Array.isArray(raw)
          ? raw.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {})
          : raw;
        setCompanySettings(obj);
      }
    } catch (err) {
      // Non-blocking: page works without company settings
    }
  };

  // Update subject when lead or confirmed proposal changes
  useEffect(() => {
    if (lead) {
      const confirmedOption = getConfirmedOption();
      const queryId = lead.query_id || lead.id || id;
      const destination = lead.destination || 'Destination';
      const subject = `Travel Enquiry for ${destination} from (Query Id- ${queryId})`;

      if (confirmedOption) {
        setSupplierEmailForm(prev => ({
          ...prev,
          subject: subject,
          body: generateEmailBody()
        }));
      } else {
        setSupplierEmailForm(prev => ({
          ...prev,
          subject: subject,
          body: 'Dear Sir,\nKindly provide the best rates for below enquiry at the earliest'
        }));
      }
    }
  }, [lead, proposals, id]);

  // Build unique hotel keys for dedupe (hotel_id + day)
  const getHotelDedupeKey = (h) => `${h.hotel_id || h.hotelName || ''}_${h.day}`;

  // Load hotels from ALL proposals (all options in all itineraries for this lead)
  useEffect(() => {
    const loadHotelsFromAllProposals = async () => {
      const rawHotelsList = [];
      proposals.forEach((proposal) => {
        const itineraryId = proposal.itinerary_id;
        const optionNum = proposal.optionNumber ?? 1;
        if (!itineraryId) return;
        try {
          const stored = localStorage.getItem(`itinerary_${itineraryId}_events`);
          if (!stored) return;
          const dayEvents = JSON.parse(stored);
          Object.keys(dayEvents).sort((a, b) => parseInt(a) - parseInt(b)).forEach((day) => {
            const events = dayEvents[day] || [];
            events.forEach((event) => {
              if (event.eventType !== 'accommodation' || !event.hotelOptions) return;
              event.hotelOptions.forEach((opt) => {
                if (opt.optionNumber === optionNum) {
                  rawHotelsList.push({
                    hotel_id: opt.hotel_id ?? opt.hotelId ?? opt.id,
                    hotelName: opt.hotelName || event.subject || 'Hotel',
                    roomName: opt.roomName || opt.room_type || '',
                    mealPlan: opt.mealPlan || opt.meal_plan || '',
                    day: parseInt(day, 10),
                    price: opt.price || ''
                  });
                }
              });
            });
          });
        } catch (_) {}
      });

      const seen = new Set();
      const uniqueRaw = rawHotelsList.filter((h) => {
        const key = getHotelDedupeKey(h);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      if (uniqueRaw.length === 0) {
        setHotelsFromConfirmedOption([]);
        return;
      }
      try {
        const hotelPromises = uniqueRaw.map(async (hotel, index) => {
          const hotelId = hotel.hotel_id;
          const hotelName = hotel.hotelName || 'Hotel';
          const roomType = hotel.roomName || '';
          const mealPlan = hotel.mealPlan || '';
          const day = hotel.day;
          const price = hotel.price || '';
          if (hotelId) {
            try {
              const response = await hotelsAPI.get(hotelId);
              const hotelData = response.data.data;
              return {
                id: `hotel_${hotelId}_${day}_${index}`,
                hotel_id: hotelId,
                company_name: hotelData.name || hotelName,
                name: hotelData.contact_person || '',
                email: hotelData.email || '',
                type: 'hotel',
                hotel_name: hotelData.name || hotelName,
                room_type: roomType,
                meal_plan: mealPlan,
                price,
                day
              };
            } catch {
              return {
                id: `hotel_${hotelId}_${day}_${index}`,
                hotel_id: hotelId,
                company_name: hotelName,
                name: '',
                email: '',
                type: 'hotel',
                hotel_name: hotelName,
                room_type: roomType,
                meal_plan: mealPlan,
                price,
                day
              };
            }
          }
          return {
            id: `hotel_${hotelName}_${day}_${index}_${Date.now()}`,
            hotel_id: null,
            company_name: hotelName,
            name: '',
            email: '',
            type: 'hotel',
            hotel_name: hotelName,
            room_type: roomType,
            meal_plan: mealPlan,
            price,
            day
          };
        });
        const hotelsData = await Promise.all(hotelPromises);
        const validHotels = hotelsData.filter((h) => h.company_name && h.company_name !== 'Hotel');
        validHotels.sort((a, b) => {
          if (a.email && !b.email) return -1;
          if (!a.email && b.email) return 1;
          return 0;
        });
        setHotelsFromConfirmedOption(validHotels);
      } catch (err) {
        setHotelsFromConfirmedOption([]);
      }
    };
    loadHotelsFromAllProposals();
  }, [proposals]);

  // Load vehicles (transport) from ALL proposals
  useEffect(() => {
    const transportList = [];
    const seen = new Set();
    proposals.forEach((proposal) => {
      const details = getPackageDetails(proposal);
      if (!details || !details.transport || !details.transport.length) return;
      details.transport.forEach((t, i) => {
        const key = `${t.name}_${t.day}_${t.details || ''}`;
        if (seen.has(key)) return;
        seen.add(key);
        transportList.push({
          id: `vehicle_${String(t.name).replace(/\s+/g, '_')}_${t.day}_${i}`,
          name: t.name || 'Vehicle',
          details: t.details || '',
          day: t.day,
          email: '' // Transfer model has no email; show — in UI
        });
      });
    });
    setVehiclesFromProposals(transportList);
  }, [proposals]);

  // Load proposals from localStorage – refresh from itinerary's latest options so 3 options show after update
  const loadProposals = () => {
    try {
      const storedProposals = localStorage.getItem(`lead_${id}_proposals`);
      let list = storedProposals ? JSON.parse(storedProposals) : [];
      if (list.length === 0) {
        setProposals([]);
        return;
      }
      const byItineraryId = {};
      list.forEach((p) => {
        const tid = p.itinerary_id;
        if (tid) {
          if (!byItineraryId[tid]) byItineraryId[tid] = [];
          byItineraryId[tid].push(p);
        }
      });
      const result = [];
      const processedItineraryIds = new Set();
      list.forEach((p) => {
        const tid = p.itinerary_id;
        if (!tid) {
          result.push(p);
          return;
        }
        if (processedItineraryIds.has(tid)) return;
        processedItineraryIds.add(tid);
        const fromStorage = localStorage.getItem(`itinerary_${tid}_proposals`);
        const latestOptions = fromStorage ? JSON.parse(fromStorage) : [];
        if (Array.isArray(latestOptions) && latestOptions.length > 0) {
          const existing = byItineraryId[tid] || [];
          const confirmedOptionNum = existing.find((x) => x.confirmed)?.optionNumber;
          latestOptions.forEach((opt, i) => {
            result.push({
              ...opt,
              id: opt.id || Date.now() + i + tid,
              confirmed: confirmedOptionNum != null && opt.optionNumber === confirmedOptionNum
            });
          });
        } else {
          (byItineraryId[tid] || []).forEach((x) => result.push(x));
        }
      });
      setProposals(result);
    } catch (err) {
      console.error('Failed to load proposals:', err);
      setProposals([]);
    }
  };

  // Save proposals to localStorage
  const saveProposals = (newProposals) => {
    try {
      localStorage.setItem(`lead_${id}_proposals`, JSON.stringify(newProposals));
      setProposals(newProposals);
    } catch (err) {
      console.error('Failed to save proposals:', err);
    }
  };

  // Confirm an option – creates voucher + invoice and logs to history
  const handleConfirmOption = async (optionId) => {
    const updatedProposals = proposals.map(proposal => ({
      ...proposal,
      confirmed: proposal.id === optionId ? true : false // Only one option can be confirmed at a time
    }));
    saveProposals(updatedProposals);

    const confirmedProposal = updatedProposals.find(p => p.id === optionId);
    if (confirmedProposal) {
      const optionNumber = confirmedProposal.optionNumber ?? 1;
      const totalAmount = confirmedProposal.price ?? 0;
      const itineraryName = confirmedProposal.itinerary_name || quotationData?.itinerary?.itinerary_name || '';

      try {
        await leadsAPI.confirmOption(id, {
          option_number: optionNumber,
          total_amount: totalAmount,
          itinerary_name: itineraryName,
        });
      } catch (err) {
        console.error('Confirm option API failed:', err);
      }

      try {
        const quotationDataForSend = await handleViewQuotation(confirmedProposal);
        if (quotationDataForSend && (lead?.email || lead?.phone)) {
          await autoSendConfirmedToClient(quotationDataForSend, confirmedProposal);
        } else if (!quotationDataForSend) {
          alert('Option confirmed! Quotation could not be loaded. Please share via Email or WhatsApp manually.');
        } else {
          alert('Option confirmed! Client email/phone is missing — add it in Mails or WhatsApp tabs and send manually.');
        }
      } catch (err) {
        console.error('Failed to load quotation or auto-send:', err);
        alert('Option confirmed! Email/WhatsApp auto-send failed. Please share via Email or WhatsApp manually.');
      }

      fetchPayments();
      if (activeTab === 'history' || activeTab === 'invoice') fetchQueryDetail();
    } else {
      alert('Option confirmed successfully! You can now share the final itinerary.');
    }
  };

  const fetchQueryDetail = async () => {
    if (!id) return;
    setLoadingHistory(true);
    try {
      const res = await queryDetailAPI.getDetail(id);
      const data = res?.data?.data;
      setActivityTimeline(data?.activity_timeline || []);
      setQueryDetailInvoices(data?.invoices || []);
    } catch (err) {
      console.error('Failed to load query detail:', err);
      setActivityTimeline([]);
      setQueryDetailInvoices([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const fetchActivityTimeline = fetchQueryDetail;

  const handleVoucherPreview = async () => {
    if (!id) return;
    setVoucherActionLoading('preview');
    try {
      const res = await vouchersAPI.preview(id);
      const blob = res.data;
      const html = await blob.text();
      setVoucherPopupHtml(html);
      setShowVoucherPopup(true);
    } catch (err) {
      console.error('Voucher preview failed:', err);
      alert('Voucher preview could not be loaded. Please try again.');
    } finally {
      setVoucherActionLoading(null);
    }
  };

  const handleVoucherDownload = async () => {
    if (!id) return;
    setVoucherActionLoading('download');
    try {
      const res = await vouchersAPI.download(id);
      const blob = res.data;
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `voucher-lead-${id}-${new Date().toISOString().slice(0, 10)}.html`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (err) {
      console.error('Voucher download failed:', err);
      alert('Voucher download fail. Please try again.');
    } finally {
      setVoucherActionLoading(null);
    }
  };

  const handleVoucherSend = async () => {
    if (!id) return;
    const toEmail = lead?.email || '';
    const email = window.prompt('Send voucher to email:', toEmail || '');
    if (email === null) return;
    setVoucherActionLoading('send');
    try {
      await vouchersAPI.send(id, { to_email: email || toEmail, subject: 'Travel Voucher' });
      alert('Voucher email sent successfully.');
    } catch (err) {
      console.error('Voucher send failed:', err);
      alert('Voucher send failed. Please check client email.');
    } finally {
      setVoucherActionLoading(null);
    }
  };

  // Get confirmed option
  const getConfirmedOption = () => {
    return proposals.find(p => p.confirmed === true);
  };

  // Auto-send final itinerary + voucher/payment to client via Email and WhatsApp after confirm; show in Mails & WhatsApp tabs
  const autoSendConfirmedToClient = async (quotationDataForSend, confirmedProposal) => {
    if (!lead || !confirmedProposal || !quotationDataForSend?.itinerary) return;
    const itinerary = quotationDataForSend.itinerary;
    const confirmedOptionNum = confirmedProposal.optionNumber?.toString() || '1';
    const hotels = quotationDataForSend.hotelOptions?.[confirmedOptionNum] || [];
    const totalPrice = confirmedProposal.price ?? hotels.reduce((sum, h) => sum + (parseFloat(h.price) || 0), 0);

    // Payment summary (fetch if not loaded)
    let paySummary = { total_amount: 0, total_paid: 0, total_due: 0 };
    try {
      const payRes = await paymentsAPI.getByLead(id);
      const payList = payRes?.data?.data?.payments || payRes?.data?.payments || [];
      if (Array.isArray(payList) && payList.length) {
        paySummary.total_amount = payList.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);
        paySummary.total_paid = payList.reduce((s, p) => s + (parseFloat(p.paid_amount) || 0), 0);
        paySummary.total_due = paySummary.total_amount - paySummary.total_paid;
      }
    } catch (_) {}

    const paymentText = paySummary.total_amount > 0
      ? `\n\nPayment Summary:\nTotal: ₹${paySummary.total_amount.toLocaleString('en-IN')}\nPaid: ₹${paySummary.total_paid.toLocaleString('en-IN')}\nDue: ₹${paySummary.total_due.toLocaleString('en-IN')}`
      : '';

    // WhatsApp message (confirmed option + payment)
    let whatsappMsg = `*✓ CONFIRMED TRAVEL ITINERARY*\n\n`;
    whatsappMsg += `*${itinerary.itinerary_name || 'Itinerary'}*\n`;
    whatsappMsg += `Query ID: ${formatLeadId(lead.id)}\n`;
    whatsappMsg += `Destination: ${itinerary.destinations || 'N/A'}\n`;
    whatsappMsg += `Duration: ${itinerary.duration || 0} Days\n\n`;
    whatsappMsg += `*Confirmed Option ${confirmedOptionNum}*\n`;
    hotels.forEach(h => {
      whatsappMsg += `• Day ${h.day}: ${h.hotelName || 'Hotel'} (${h.category || 'N/A'} Star)\n`;
      whatsappMsg += `  Room: ${h.roomName || 'N/A'} | Meal: ${h.mealPlan || 'N/A'}\n`;
    });
    whatsappMsg += `\n*Total Package: ₹${totalPrice.toLocaleString('en-IN')}*`;
    whatsappMsg += paymentText;
    whatsappMsg += `\n\nThis is your confirmed itinerary. Best regards,\nTravelOps Team`;

    // Email body (plain text for API)
    let emailBody = `CONFIRMED TRAVEL ITINERARY\n\n`;
    emailBody += `${itinerary.itinerary_name || 'Itinerary'}\n`;
    emailBody += `Query ID: ${formatLeadId(lead.id)}\n`;
    emailBody += `Destination: ${itinerary.destinations || 'N/A'}\n`;
    emailBody += `Duration: ${itinerary.duration || 0} Days\n\n`;
    emailBody += `Confirmed Option ${confirmedOptionNum}\n`;
    hotels.forEach(h => {
      emailBody += `• Day ${h.day}: ${h.hotelName || 'Hotel'} (${h.category || 'N/A'} Star)\n`;
      emailBody += `  Room: ${h.roomName || 'N/A'} | Meal: ${h.mealPlan || 'N/A'}\n`;
    });
    emailBody += `\nTotal Package: ₹${totalPrice.toLocaleString('en-IN')}`;
    emailBody += paymentText.replace(/\n\n/g, '\n');
    emailBody += `\n\nThis is your confirmed itinerary. Best regards, TravelOps Team`;

    const subject = `Confirmed Travel Itinerary - ${itinerary.itinerary_name || 'Itinerary'} - ${formatLeadId(lead.id)}`;
    const toEmail = lead.email;

    try {
      if (toEmail) {
        await leadsAPI.sendEmail(id, { to_email: toEmail, subject, body: emailBody });
        fetchLeadEmails();
      }
      if (lead.phone) {
        await whatsappAPI.send(id, whatsappMsg);
        fetchWhatsAppMessages();
      }
      if (toEmail || lead.phone) {
        alert('Final itinerary and payment summary have been sent to the client via Email and WhatsApp. You can see them in the Mails and WhatsApp tabs.');
      }
    } catch (err) {
      console.error('Auto-send failed:', err);
      const msg = err.response?.data?.message || err.response?.data?.error || err.message || 'Unknown error';
      alert('Mail could not be sent.\n\nIssue: ' + msg);
    }
  };

  const fetchLeadDetails = async () => {
    try {
      setLoading(true);
      const response = await leadsAPI.get(id);
      const leadData = response?.data?.data?.lead ?? response?.data?.lead ?? null;
      if (!leadData) {
        setLead(null);
        setFollowups([]);
        setNotes([]);
        setLoading(false);
        return;
      }
      setLead(leadData);

      // Split followups vs notes:
      // - Notes: remark present AND no reminder_date/reminder_time
      // - Followups: has reminder_date or reminder_time
      const allFollowups = leadData.followups && Array.isArray(leadData.followups) ? leadData.followups : [];
      if (allFollowups.length > 0) {
        const notesOnly = allFollowups.filter((f) => {
          const hasRemark = f?.remark && String(f.remark).trim() !== '';
          const hasReminder = Boolean(f?.reminder_date || f?.reminder_time);
          return hasRemark && !hasReminder;
        });

        const followupsOnly = allFollowups.filter((f) => Boolean(f?.reminder_date || f?.reminder_time));

        setNotes(
          notesOnly.map((f) => ({
            id: f.id,
            content: f.remark,
            created_at: f.created_at,
            created_by: f?.user?.name || 'System',
          }))
        );
        setFollowups(followupsOnly);
      } else {
        setFollowups([]);
        setNotes([]);
      }
    } catch (err) {
      console.error('Failed to fetch lead details:', err);
      setLead(null);
      setFollowups([]);
      setNotes([]);
      alert('Failed to load lead details. Please check the console or try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await usersAPI.list();
      setUsers(response.data.data.users || []);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await suppliersAPI.list();
      setSuppliers(response.data.data || []);
    } catch (err) {
      console.error('Failed to fetch suppliers:', err);
    }
  };

  // Fetch emails for the lead
  const fetchLeadEmails = async () => {
    if (!id) return;
    setLoadingEmails(true);
    try {
      const response = await leadsAPI.getEmails(id);
      if (response.data.success) {
        setLeadEmails(response.data.data.emails || []);
      }
    } catch (err) {
      console.error('Failed to fetch lead emails:', err);
    } finally {
      setLoadingEmails(false);
    }
  };

  // Send email to client
  const handleSendClientEmail = async (e) => {
    e.preventDefault();
    const toEmail = emailFormData.to_email || lead?.email;
    if (!toEmail || !emailFormData.subject || !emailFormData.body) {
      alert('Please fill in all required fields');
      return;
    }

    setSendingClientEmail(true);
    try {
      if (user?.google_token) {
        // Use Gmail API if connected
        const emailData = {
          to: toEmail,
          to_email: toEmail,
          cc_email: emailFormData.cc_email,
          subject: emailFormData.subject,
          body: emailFormData.body,
          lead_id: id
        };
        if (replyThreadId) {
          emailData.thread_id = replyThreadId;
        }
        const response = await googleMailAPI.sendMail(emailData);
        if (response.data?.success || response.data?.message) {
          alert('Email sent successfully via Gmail!');
          setShowComposeModal(false);
          setReplyThreadId(null);
          setEmailFormData({
            to_email: lead?.email || '',
            cc_email: '',
            subject: '',
            body: ''
          });
          fetchGmailEmails();
        } else {
          const msg = response.data?.message || response.data?.error || 'Unknown error';
          alert('Mail could not be sent.\n\nIssue: ' + msg);
        }
      } else {
        // Fallback to existing system email (local mailer)
        const emailData = {
          to_email: toEmail,
          cc_email: emailFormData.cc_email,
          subject: emailFormData.subject,
          body: emailFormData.body,
          attachment: emailAttachment
        };

        const response = await leadsAPI.sendEmail(id, emailData);
        if (response.data.success) {
          alert('Email sent successfully!');
          setShowComposeModal(false);
          setEmailFormData({
            to_email: lead?.email || '',
            cc_email: '',
            subject: '',
            body: ''
          });
          setEmailAttachment(null);
          fetchLeadEmails();
        } else {
          const msg = response.data?.message || response.data?.error || 'Unknown error';
          alert('Mail could not be sent.\n\nIssue: ' + msg);
        }
      }
    } catch (err) {
      console.error('Failed to send email:', err);
      const msg = err.response?.data?.message || err.response?.data?.error || err.message || 'Unknown error';
      alert('Mail could not be sent.\n\nIssue: ' + msg);
    } finally {
      setSendingClientEmail(false);
    }
  };

  // Fetch Gmail emails
  const fetchGmailEmails = async () => {
    if (!id || !user?.google_token) return;
    setLoadingGmail(true);
    try {
      const response = await googleMailAPI.getGmailEmails(id);
      if (response.data.success) {
        setGmailEmails(response.data.data.emails || []);
      }
    } catch (err) {
      console.error('Failed to fetch Gmail emails:', err);
    } finally {
      setLoadingGmail(false);
    }
  };

  // Sync Gmail inbox so received/reply emails show in CRM
  const handleSyncInbox = async () => {
    if (!user?.google_token) {
      alert('Connect Gmail in Settings (Accounts → Gmail / Email Integration) so received and reply emails can appear here.');
      return;
    }
    setSyncingInbox(true);
    try {
      await googleMailAPI.syncInbox();
      await fetchGmailEmails();
      alert('Inbox synced. Received and reply emails will appear in Gmail Conversations below.');
    } catch (err) {
      alert('Sync failed. Make sure Gmail is connected in Settings.');
    } finally {
      setSyncingInbox(false);
    }
  };

  // Open compose modal with pre-filled email
  const openComposeModal = () => {
    setReplyThreadId(null);
    setEmailFormData({
      to_email: lead?.email || '',
      cc_email: '',
      subject: '',
      body: ''
    });
    setShowComposeModal(true);
  };

  // Open compose as reply to a Gmail thread
  const openReplyModal = (thread) => {
    const sorted = [...thread].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    const lastMsg = sorted[sorted.length - 1];
    const replyToEmail = lastMsg.direction === 'inbound' ? lastMsg.from_email : lastMsg.to_email;
    const subject = lastMsg.subject?.startsWith('Re:') ? lastMsg.subject : `Re: ${lastMsg.subject || ''}`;
    setReplyThreadId(lastMsg.thread_id);
    setEmailFormData({
      to_email: replyToEmail,
      cc_email: '',
      subject,
      body: ''
    });
    setShowComposeModal(true);
  };

  // Fetch payments for the lead
  const fetchPayments = async () => {
    if (!id) return;
    setLoadingPayments(true);
    try {
      const response = await paymentsAPI.getByLead(id);
      if (response.data.success) {
        setPayments(response.data.data.payments || []);
        setPaymentSummary(response.data.data.summary || { total_amount: 0, total_paid: 0, total_due: 0 });
      }
    } catch (err) {
      console.error('Failed to fetch payments:', err);
      setPayments([]);
      setPaymentSummary({ total_amount: 0, total_paid: 0, total_due: 0 });
    } finally {
      setLoadingPayments(false);
    }
  };

  // Handle adding payment
  const handleAddPayment = async (e) => {
    e.preventDefault();

    if (!paymentFormData.amount || parseFloat(paymentFormData.amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    const amount = parseFloat(paymentFormData.amount);
    const paidAmount = parseFloat(paymentFormData.paid_amount || 0);

    if (paidAmount > amount) {
      alert('Paid amount cannot exceed total amount');
      return;
    }

    setAddingPayment(true);
    try {
      const response = await paymentsAPI.create({
        lead_id: id,
        amount: amount,
        paid_amount: paidAmount,
        due_date: paymentFormData.due_date || null
      });

      if (response.data.success) {
        alert('Payment added successfully!');
        setShowPaymentModal(false);
        setPaymentFormData({ amount: '', paid_amount: '', due_date: '' });
        await fetchPayments();
      } else {
        alert(response.data.message || 'Failed to add payment');
      }
    } catch (err) {
      console.error('Failed to add payment:', err);
      const errorMsg = err.response?.data?.message || err.response?.data?.errors
        ? Object.values(err.response.data.errors).flat().join(', ')
        : 'Failed to add payment';
      alert(errorMsg);
    } finally {
      setAddingPayment(false);
    }
  };

  // Fetch payments when billing tab is active
  useEffect(() => {
    if (activeTab === 'billing' && id) {
      fetchPayments();
    }
  }, [activeTab, id]);

  // Fetch emails when mails tab is active
  useEffect(() => {
    if (activeTab === 'mails' && id) {
      fetchLeadEmails();
      if (user?.google_token) {
        fetchGmailEmails();
      }
    }
  }, [activeTab, id, user?.google_token]);

  // Fetch WhatsApp messages when WhatsApp tab is active
  useEffect(() => {
    if (activeTab === 'whatsapp' && id) {
      fetchWhatsAppMessages();
    }
  }, [activeTab, id]);

  // Fetch WhatsApp messages for this lead (so sent messages show in WhatsApp tab)
  const fetchWhatsAppMessages = async () => {
    if (!id) return;
    try {
      const response = await whatsappAPI.messages(id);
      if (response?.data?.success && Array.isArray(response.data.data)) {
        setWhatsappMessages(response.data.data);
      } else if (response?.data?.data?.messages) {
        setWhatsappMessages(response.data.data.messages);
      }
    } catch (err) {
      console.error('Failed to fetch WhatsApp messages:', err);
    }
  };

  // Generate email body with enquiry details
  const generateEmailBody = () => {
    const confirmedOption = getConfirmedOption();
    if (!confirmedOption || !lead) return 'Dear Sir,\nKindly provide the best rates for below enquiry at the earliest';

    let body = 'Dear Sir,\nKindly provide the best rates for below enquiry at the earliest\n\n';

    // Extract hotel details from confirmed option
    const hotels = confirmedOption.hotels || [];
    const checkIn = lead.travel_start_date ? formatDateForDisplay(lead.travel_start_date) : 'N/A';
    const checkOut = lead.travel_end_date ? formatDateForDisplay(lead.travel_end_date) : 'N/A';

    // Calculate nights
    let nights = 'N/A';
    if (lead.travel_start_date && lead.travel_end_date) {
      const start = new Date(lead.travel_start_date);
      const end = new Date(lead.travel_end_date);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      nights = diffDays.toString();
    }

    body += 'Enquiry Details:\n';
    body += `Customer Name: ${lead.client_title || 'Mr.'} ${lead.client_name}\n`;
    body += `Enquiry ID: ${lead.query_id || lead.id || id}\n`;
    body += `Enquiry For: ${confirmedOption.itinerary_name || 'Full package'}\n`;
    body += `Check-In: ${checkIn}\n`;
    body += `Check-Out: ${checkOut}\n`;
    body += `Nights: ${nights}\n`;
    body += `Pax: Adult: ${lead.adult || 1} - Child: ${lead.child || 0} - Infant: ${lead.infant || 0}\n\n`;

    if (hotels.length > 0) {
      body += 'Hotel Requirements:\n';
      hotels.forEach((hotel, index) => {
        body += `${index + 1}. ${hotel.hotel_name || 'Hotel'} - ${hotel.room_type || 'Room'} - ${hotel.meal_plan || 'Meal Plan'}\n`;
        if (hotel.price) {
          body += `   Price: ${hotel.price}\n`;
        }
      });
    }

    return body;
  };

  // Format date for display (DD-MM-YYYY)
  const formatDateForDisplay = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  };

  const handleSelectAllSuppliers = (checked) => {
    setSelectAllSuppliers(checked);
    if (checked) {
      setSelectedSuppliers(suppliers.map(s => s.id));
    } else {
      setSelectedSuppliers([]);
    }
  };

  const handleSelectAllHotels = (checked) => {
    setSelectAllHotels(checked);
    if (checked) {
      setSelectedHotels(hotelsFromConfirmedOption.map(h => h.id));
    } else {
      setSelectedHotels([]);
    }
  };

  const handleSelectVehicle = (vehicleId) => {
    setSelectedVehicles((prev) =>
      prev.includes(vehicleId) ? prev.filter((id) => id !== vehicleId) : [...prev, vehicleId]
    );
  };

  const handleSelectAllVehicles = (checked) => {
    setSelectAllVehicles(checked);
    const withEmail = vehiclesFromProposals.filter((v) => v.email && v.email.trim() !== '');
    if (checked) {
      setSelectedVehicles(withEmail.map((v) => v.id));
    } else {
      setSelectedVehicles([]);
    }
  };

  const handleSelectSupplier = (supplierId) => {
    setSelectedSuppliers(prev => {
      if (prev.includes(supplierId)) {
        return prev.filter(id => id !== supplierId);
      } else {
        return [...prev, supplierId];
      }
    });
  };

  const handleSelectHotel = (hotelId) => {
    setSelectedHotels(prev => {
      if (prev.includes(hotelId)) {
        return prev.filter(id => id !== hotelId);
      } else {
        return [...prev, hotelId];
      }
    });
  };

  const handleSendSupplierEmail = async () => {
    const selectedHotelEmailsList = hotelsFromConfirmedOption
      .filter(h => selectedHotels.includes(h.id) && h.email && h.email.trim() !== '')
      .map(h => ({ email: h.email.trim(), name: h.company_name, hotel_name: h.hotel_name, room_type: h.room_type, meal_plan: h.meal_plan }));
    const selectedVehicleEmailsList = vehiclesFromProposals
      .filter(v => selectedVehicles.includes(v.id) && v.email && v.email.trim() !== '')
      .map(v => ({ email: v.email.trim(), hotel_name: v.name }));
    const hasRecipients = selectedSuppliers.length > 0 || selectedHotelEmailsList.length > 0 || selectedVehicleEmailsList.length > 0;

    if (!hasRecipients) {
      alert('Please select at least one supplier, hotel or vehicle (with email)');
      return;
    }

    if (!supplierEmailForm.subject.trim()) {
      alert('Please enter a subject');
      return;
    }

    setSendingEmail(true);
    try {
      const confirmedOption = getConfirmedOption();
      const enquiryDetails = {
        customer_name: lead ? `${lead.client_title || 'Mr.'} ${lead.client_name}` : 'N/A',
        enquiry_id: lead?.query_id || lead?.id || id,
        enquiry_for: confirmedOption?.itinerary_name || 'Full package',
        check_in: lead?.travel_start_date ? formatDateForDisplay(lead.travel_start_date) : 'N/A',
        check_out: lead?.travel_end_date ? formatDateForDisplay(lead.travel_end_date) : 'N/A',
        nights: lead?.travel_start_date && lead?.travel_end_date ?
          Math.ceil(Math.abs(new Date(lead.travel_end_date) - new Date(lead.travel_start_date)) / (1000 * 60 * 60 * 24)).toString() : 'N/A',
        adult: lead?.adult || 1,
        child: lead?.child || 0,
        infant: lead?.infant || 0,
        hotels: confirmedOption?.hotels || []
      };

      // Prepare hotel emails - only include hotels with valid email
      const selectedHotelEmails = selectedHotelEmailsList;

      // Include selected vehicles (with email) in hotel_emails so backend can send
      const allRecipientEmails = [...selectedHotelEmails, ...selectedVehicleEmailsList.map(v => ({ ...v, name: v.hotel_name, room_type: '', meal_plan: '' }))];

      // Check if any selected hotels don't have email
      const hotelsWithoutEmail = hotelsFromConfirmedOption
        .filter(h => selectedHotels.includes(h.id) && (!h.email || h.email.trim() === ''))
        .map(h => h.company_name || h.hotel_name);

      if (hotelsWithoutEmail.length > 0) {
        const proceed = window.confirm(
          `Warning: The following hotels don't have email addresses:\n${hotelsWithoutEmail.join(', ')}\n\nOnly hotels with valid emails will receive the mail.\n\nDo you want to continue?`
        );
        if (!proceed) {
          setSendingEmail(false);
          return;
        }
      }

      if (selectedSuppliers.length === 0 && allRecipientEmails.length === 0) {
        alert('Please select at least one supplier, hotel or vehicle with valid email address');
        setSendingEmail(false);
        return;
      }

      const response = await suppliersAPI.sendEmail({
        supplier_ids: selectedSuppliers,
        hotel_emails: allRecipientEmails,
        subject: supplierEmailForm.subject,
        cc_email: supplierEmailForm.cc_email,
        body: supplierEmailForm.body,
        enquiry_details: enquiryDetails,
        lead_id: parseInt(id)
      });

      if (response.data.success) {
        const data = response.data.data || {};
        const sentCount = data.sent_count || 0;
        const failedCount = data.failed_count || 0;
        const errors = data.errors || [];

        let message = `Email sent successfully to ${sentCount} recipient(s)!`;
        if (failedCount > 0) {
          message += `\n\n${failedCount} email(s) failed:\n${errors.slice(0, 5).join('\n')}`;
          if (errors.length > 5) {
            message += `\n... and ${errors.length - 5} more errors`;
          }
        }
        if (hotelsWithoutEmail.length > 0) {
          message += `\n\nNote: ${hotelsWithoutEmail.length} hotel(s) were skipped due to missing email addresses.`;
        }

        alert(message);

        // Reset form only if at least some emails were sent
        if (sentCount > 0) {
          setSupplierEmailForm({
            subject: supplierEmailForm.subject,
            cc_email: '',
            body: generateEmailBody()
          });
          setSelectedSuppliers([]);
          setSelectedHotels([]);
          setSelectedVehicles([]);
          setSelectAllSuppliers(false);
          setSelectAllHotels(false);
          setSelectAllVehicles(false);
        }
      } else {
        const errorMsg = response.data.message || 'Failed to send email';
        const errors = response.data.data?.errors || [];
        alert(`${errorMsg}${errors.length > 0 ? '\n\nErrors:\n' + errors.join('\n') : ''}`);
      }
    } catch (err) {
      console.error('Failed to send email:', err);
      const errorMsg = err.response?.data?.message || 'Failed to send email';
      const errors = err.response?.data?.data?.errors || [];
      const errorDetails = err.response?.data?.error || '';

      let alertMsg = errorMsg;
      if (errors.length > 0) {
        alertMsg += '\n\nErrors:\n' + errors.slice(0, 5).join('\n');
        if (errors.length > 5) {
          alertMsg += `\n... and ${errors.length - 5} more errors`;
        }
      }
      if (errorDetails && !errors.length) {
        alertMsg += `\n\nDetails: ${errorDetails}`;
      }

      alert(alertMsg);
    } finally {
      setSendingEmail(false);
    }
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) {
      alert('Please enter a note');
      return;
    }

    setAddingNote(true);
    try {
      const payload = {
        remark: noteText.trim(),
        reminder_date: null,
        reminder_time: null,
      };

      if (editingNoteId) {
        await followupsAPI.update(editingNoteId, payload);
      } else {
        // Create note-only (no reminder) so it appears in Notes section, not Followups
        await followupsAPI.create({
          lead_id: parseInt(id),
          ...payload,
        });
      }

      // Refresh lead details to get updated notes
      await fetchLeadDetails();
      setNoteText('');
      setShowNoteInput(false);
      setEditingNoteId(null);
    } catch (err) {
      console.error('Failed to add note:', err);
      alert(err.response?.data?.message || 'Failed to add note');
    } finally {
      setAddingNote(false);
    }
  };

  const handleDeleteFollowup = async (followupId) => {
    if (!window.confirm('Delete this item?')) return;
    try {
      await followupsAPI.delete(followupId);
      await fetchLeadDetails();
    } catch (err) {
      console.error('Failed to delete:', err);
      alert(err.response?.data?.message || 'Failed to delete');
    }
  };

  // Helper function to convert 12-hour time to 24-hour format
  const convertTo24Hour = (time12h) => {
    if (!time12h || time12h.trim() === '') return null;
    const parts = time12h.trim().split(' ');
    if (parts.length < 2) return null;
    const [time, modifier] = parts;
    const [hours, minutes] = time.split(':');
    if (!hours || !minutes) return null;

    let hour24 = parseInt(hours, 10);
    if (isNaN(hour24)) return null;

    if (modifier === 'PM' && hour24 !== 12) {
      hour24 += 12;
    } else if (modifier === 'AM' && hour24 === 12) {
      hour24 = 0;
    }

    return `${String(hour24).padStart(2, '0')}:${minutes.padStart(2, '0')}:00`;
  };

  // Helper function to convert 24-hour time to 12-hour format
  const convertTo12Hour = (time24h) => {
    if (!time24h) return '';
    const [hours, minutes] = time24h.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  // Helper function to convert date from DD-MM-YYYY to YYYY-MM-DD
  const convertDateFormat = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateStr;
  };

  // Helper function to convert date from YYYY-MM-DD to DD-MM-YYYY
  const convertDateToDisplay = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateStr;
  };

  // Generate time slots for dropdown
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 1; hour <= 12; hour++) {
      slots.push(`${hour}:00 AM`);
      slots.push(`${hour}:30 AM`);
    }
    for (let hour = 1; hour <= 12; hour++) {
      slots.push(`${hour}:00 PM`);
      slots.push(`${hour}:30 PM`);
    }
    return slots;
  };

  const handleAddFollowup = async (e) => {
    e.preventDefault();

    if (!followupFormData.reminder_date) {
      alert('Please select a reminder date');
      return;
    }

    // Only create followup if Set Reminder is Yes
    if (followupFormData.set_reminder !== 'Yes') {
      alert('Please enable reminder to create follow-up');
      return;
    }

    setAddingFollowup(true);
    try {
      // Convert date from DD-MM-YYYY to YYYY-MM-DD for API
      let dateInApiFormat = followupFormData.reminder_date;
      const parts = followupFormData.reminder_date.split('-');
      if (parts.length === 3 && parts[0].length === 2) {
        // It's in DD-MM-YYYY format, convert to YYYY-MM-DD
        dateInApiFormat = `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
      // If already in YYYY-MM-DD format, use as is

      const timeIn24Hour = followupFormData.reminder_time ? convertTo24Hour(followupFormData.reminder_time) : null;

      const payload = {
        lead_id: parseInt(id),
        remark: followupFormData.description.trim() || null,
        reminder_date: dateInApiFormat,
      };

      // Only include reminder_time if it's provided
      if (timeIn24Hour) {
        payload.reminder_time = timeIn24Hour;
      }

      if (editingFollowupId) {
        await followupsAPI.update(editingFollowupId, payload);
      } else {
        await followupsAPI.create(payload);
      }

      // Refresh lead details to get updated followups
      await fetchLeadDetails();
      setFollowupFormData({
        type: 'Task',
        description: '',
        reminder_date: '',
        reminder_time: '',
        set_reminder: 'Yes'
      });
      setShowFollowupModal(false);
      setEditingFollowupId(null);
      alert('Follow-up added successfully!');
    } catch (err) {
      console.error('Failed to add followup:', err);
      const errorMsg = err.response?.data?.message ||
        (err.response?.data?.errors ? Object.values(err.response.data.errors).flat().join(', ') : null) ||
        err.response?.data?.error ||
        'Failed to add follow-up. Please check all fields and try again.';
      alert(errorMsg);
    } finally {
      setAddingFollowup(false);
    }
  };

  const handleCreateItinerary = () => {
    // Pre-fill form with lead data (duration from lead trip days if set)
    const tripDays = (lead?.travel_start_date && lead?.travel_end_date)
      ? Math.round((new Date(lead.travel_end_date) - new Date(lead.travel_start_date)) / (1000 * 60 * 60 * 24)) + 1
      : 1;
    setItineraryFormData({
      itinerary_name: '',
      duration: String(tripDays),
      destinations: lead?.destination || '',
      notes: lead?.remark || '',
      image: null,
      show_on_website: true
    });
    setItineraryImagePreview(null);
    setShowItineraryModal(true);
  };

  const getImagePathFromUrl = (url) => {
    if (!url || typeof url !== 'string') return null;
    const match = url.match(/\/storage\/(.+)$/);
    return match ? match[1] : null;
  };

  const handleItineraryFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setItineraryFormData(prev => ({ ...prev, image: file }));
      const reader = new FileReader();
      reader.onloadend = () => setItineraryImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const fetchItineraryFreeStockImages = async () => {
    const q = (itineraryLibrarySearchTerm || '').trim();
    if (q.length < 2) return;
    setItineraryFreeStockLoading(true);
    setItineraryFreeStockError(null);
    try {
      const { photos, error } = await searchPexelsPhotos(q, 15);
      setItineraryFreeStockPhotos(photos || []);
      setItineraryFreeStockError(error || null);
    } catch (e) {
      setItineraryFreeStockPhotos([]);
      setItineraryFreeStockError('api_error');
    } finally {
      setItineraryFreeStockLoading(false);
    }
  };

  const handleSelectItineraryFreeStockImage = async (imageUrl) => {
    try {
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      const file = new File([blob], 'image.jpg', { type: blob.type || 'image/jpeg' });
      setItineraryFormData(prev => ({ ...prev, image: file }));
      setItineraryImagePreview(URL.createObjectURL(file));
      setShowItineraryLibraryModal(false);
    } catch (e) {
      alert('Failed to load image. Try another or upload from device.');
    }
  };

  const handleSelectItineraryLibraryImage = (itinerary) => {
    if (!itinerary?.image) return;
    const path = getImagePathFromUrl(itinerary.image);
    if (path) {
      setItineraryFormData(prev => ({ ...prev, image: { libraryPath: path, url: itinerary.image } }));
      setItineraryImagePreview(itinerary.image);
    }
    setShowItineraryLibraryModal(false);
  };

  useEffect(() => {
    if (!showItineraryLibraryModal || itineraryLibraryTab !== 'your' || itineraryLibraryPackages.length > 0) return;
    packagesAPI.list().then((res) => {
      const data = res.data.data || [];
      const baseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api').replace('/api', '');
      const processed = data.map((p) => {
        if (p.image) {
          let url = p.image;
          if (url.startsWith('/storage') || (url.startsWith('/') && !url.startsWith('http'))) url = `${baseUrl}${url}`;
          if (url.includes('localhost') && !url.includes(':8000')) url = url.replace('localhost', 'localhost:8000');
          return { ...p, image: url };
        }
        return p;
      });
      setItineraryLibraryPackages(processed);
    }).catch(() => setItineraryLibraryPackages([]));
  }, [showItineraryLibraryModal, itineraryLibraryTab]);

  const itineraryLibrarySearch = (itineraryLibrarySearchTerm || '').trim().toLowerCase();
  const itineraryLibraryImages = itineraryLibrarySearch.length >= 2
    ? itineraryLibraryPackages.filter(
        (p) => p.image && (
          (p.title || p.itinerary_name || '').toLowerCase().includes(itineraryLibrarySearch) ||
          (p.destination || p.destinations || '').toLowerCase().includes(itineraryLibrarySearch)
        )
      )
    : [];

  const handleInsertItinerary = async () => {
    setShowInsertItineraryModal(true);
    setLoadingItineraries(true);
    try {
      const response = await packagesAPI.list();
      const data = response.data.data || [];

      // Process image URLs - handle both relative and absolute URLs
      const processedData = data.map(itinerary => {
        if (itinerary.image) {
          // If image is a relative URL, convert to absolute
          if (itinerary.image.startsWith('/storage') || (itinerary.image.startsWith('/') && !itinerary.image.startsWith('http'))) {
            let baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
            baseUrl = baseUrl.replace('/api', '');
            itinerary.image = `${baseUrl}${itinerary.image}`;
          }
          // Fix domain if needed
          if (itinerary.image.includes('localhost') && !itinerary.image.includes(':8000')) {
            itinerary.image = itinerary.image.replace('localhost', 'localhost:8000');
          }
        }
        return itinerary;
      });

      setDayItineraries(processedData);
    } catch (err) {
      console.error('Failed to fetch itineraries:', err);
      alert('Failed to load itineraries');
    } finally {
      setLoadingItineraries(false);
    }
  };

  const handleSelectItinerary = (itinerary) => {
    const itineraryName = itinerary.title || itinerary.itinerary_name || 'Untitled Itinerary';
    const baseInfo = {
      itinerary_id: itinerary.id,
      itinerary_name: itineraryName,
      destination: itinerary.destination || itinerary.destinations || '',
      duration: itinerary.duration || 0,
      image: itinerary.image || null,
      notes: itinerary.notes || '',
      created_at: new Date().toISOString(),
      inserted_at: new Date().toISOString()
    };

    // Check if this itinerary has options (Option 1, 2, 3) saved from Itinerary Detail / Final tab
    const storedOptionsKey = `itinerary_${itinerary.id}_proposals`;
    const finalPricesKey = `itinerary_${itinerary.id}_finalClientPrices`;
    let optionsToAdd = [];
    try {
      const stored = localStorage.getItem(storedOptionsKey);
      // Use latest prices from Itinerary Detail (finalClientPrices) so Query shows same as Itinerary page
      let finalClientPricesMap = {};
      try {
        const fp = localStorage.getItem(finalPricesKey);
        if (fp) finalClientPricesMap = JSON.parse(fp);
      } catch (_) {}

      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          optionsToAdd = parsed.map((opt, idx) => {
            const optNum = opt.optionNumber != null ? opt.optionNumber : idx + 1;
            const latestPrice = finalClientPricesMap[String(optNum)] ?? finalClientPricesMap[optNum];
            const price = latestPrice !== undefined && latestPrice !== null && latestPrice !== ''
              ? Number(latestPrice)
              : (opt.price ?? opt.pricing?.finalClientPrice ?? 0);
            return {
              ...opt,
              id: Date.now() + idx,
              itinerary_id: itinerary.id,
              itinerary_name: opt.itinerary_name || itineraryName,
              destination: opt.destination || baseInfo.destination,
              duration: opt.duration ?? baseInfo.duration,
              image: opt.image || baseInfo.image,
              price,
              pricing: { ...(opt.pricing || {}), finalClientPrice: price },
              created_at: baseInfo.created_at,
              inserted_at: baseInfo.inserted_at
            };
          });
        }
      }
    } catch (e) {
      console.error('Error loading itinerary options:', e);
    }

    let updatedProposals;
    if (optionsToAdd.length > 0) {
      updatedProposals = [...proposals, ...optionsToAdd];
      saveProposals(updatedProposals);
      setShowInsertItineraryModal(false);
      setItinerarySearchTerm('');
      alert(`${optionsToAdd.length} option(s) of "${itineraryName}" have been added to proposals.`);
      return;
    }

    // No options in Final tab – add single proposal (whole itinerary)
    const newProposal = {
      id: Date.now(),
      ...baseInfo,
      price: itinerary.price || 0,
      website_cost: itinerary.website_cost || 0
    };
    updatedProposals = [...proposals, newProposal];
    saveProposals(updatedProposals);

    setShowInsertItineraryModal(false);
    setItinerarySearchTerm('');
    alert(`Itinerary "${itineraryName}" has been added to proposals.`);
  };

  // Trip days from From Date & To Date (inclusive) – e.g. 30 Jan to 1 Feb = 3 days / 2 nights
  const leadTripDays = (() => {
    if (!lead?.travel_start_date || !lead?.travel_end_date) return null;
    const start = new Date(lead.travel_start_date);
    const end = new Date(lead.travel_end_date);
    const diff = Math.round((end - start) / (1000 * 60 * 60 * 24));
    return diff + 1; // inclusive
  })();

  const filteredItineraries = dayItineraries.filter(itinerary => {
    // Only show active itineraries (show_on_website = true)
    if (!itinerary.show_on_website) {
      return false;
    }
    // If query has From/To dates, show only itineraries matching that duration (e.g. 3 days → 3 days itineraries)
    if (leadTripDays != null) {
      const itineraryDays = itinerary.duration != null ? Number(itinerary.duration) : null;
      if (itineraryDays != null && itineraryDays !== leadTripDays) {
        return false;
      }
    }
    const searchLower = itinerarySearchTerm.toLowerCase();
    return (
      (itinerary.title || itinerary.itinerary_name || '').toLowerCase().includes(searchLower) ||
      (itinerary.destination || itinerary.destinations || '').toLowerCase().includes(searchLower) ||
      (itinerary.details || itinerary.notes || '').toLowerCase().includes(searchLower)
    );
  });

  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };


  // Format ID helper - formats ID as Q-0005, Q-0004, etc.
  const formatLeadId = (id) => {
    if (!id) return 'N/A';
    return `Q-${String(id).padStart(4, '0')}`;
  };

  const handleItinerarySave = async (e) => {
    e.preventDefault();
    if (!itineraryFormData.itinerary_name?.trim()) {
      alert('Please enter Itinerary Name.');
      return;
    }
    setSavingItinerary(true);
    try {
      const formData = new FormData();
      formData.append('itinerary_name', itineraryFormData.itinerary_name.trim());
      formData.append('duration', itineraryFormData.duration || '1');
      if (itineraryFormData.destinations) formData.append('destinations', itineraryFormData.destinations);
      if (itineraryFormData.notes) formData.append('notes', itineraryFormData.notes);
      formData.append('show_on_website', itineraryFormData.show_on_website ? '1' : '0');
      if (itineraryFormData.image) {
        if (itineraryFormData.image instanceof File) {
          formData.append('image', itineraryFormData.image);
        } else if (itineraryFormData.image?.libraryPath) {
          formData.append('image_path', itineraryFormData.image.libraryPath);
        }
      }

      const response = await packagesAPI.create(formData);
      let created = response?.data?.data;
      setShowItineraryModal(false);
      setItineraryFormData({ itinerary_name: '', duration: '1', destinations: '', notes: '', image: null, show_on_website: true });
      setItineraryImagePreview(null);
      if (created) {
        if (created.image) {
          let imgUrl = created.image;
          if (imgUrl.startsWith('/storage') || (imgUrl.startsWith('/') && !imgUrl.startsWith('http'))) {
            const baseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api').replace('/api', '');
            imgUrl = `${baseUrl}${imgUrl}`;
          }
          if (imgUrl.includes('localhost') && !imgUrl.includes(':8000')) imgUrl = imgUrl.replace('localhost', 'localhost:8000');
          created = { ...created, image: imgUrl };
        }
        handleSelectItinerary(created);
      } else {
        alert('Itinerary created successfully. You can add it to this query via "Insert itinerary".');
      }
    } catch (err) {
      console.error('Failed to create itinerary:', err);
      const msg = err.response?.data?.message || err.response?.data?.errors
        ? Object.values(err.response.data.errors || {}).flat().join(', ')
        : 'Failed to create itinerary. Please try again.';
      alert(msg);
    } finally {
      setSavingItinerary(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${day}/${month}/${year} - ${displayHours}:${minutes} ${ampm}`;
  };

  const getTravelMonth = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    return months[date.getMonth()];
  };

  // Get package details for an option
  const getPackageDetails = (proposal) => {
    try {
      const storedEvents = localStorage.getItem(`itinerary_${proposal.itinerary_id}_events`);
      if (!storedEvents) return null;

      const dayEvents = JSON.parse(storedEvents);
      const optionNum = proposal.optionNumber || 1;

      const details = {
        hotels: [],
        meals: [],
        activities: [],
        transport: [],
        other: []
      };

      Object.keys(dayEvents).sort((a, b) => parseInt(a) - parseInt(b)).forEach(day => {
        const events = dayEvents[day] || [];
        events.forEach(event => {
          // Hotels are option-specific
          if (event.eventType === 'accommodation' && event.hotelOptions) {
            event.hotelOptions.forEach(option => {
              if (option.optionNumber === optionNum) {
                details.hotels.push({
                  name: option.hotelName || event.subject || 'Hotel',
                  room: option.roomName || 'Standard Room',
                  mealPlan: option.mealPlan || 'Room Only',
                  day: parseInt(day),
                  category: option.category ? `${option.category} Star` : '3 Star',
                  image: option.image || event.image || null, // Add hotel image
                  checkIn: option.checkIn || '',
                  checkOut: option.checkOut || '',
                  checkInTime: option.checkInTime || '',
                  checkOutTime: option.checkOutTime || ''
                });
              }
            });
          }
          // Other events are shared across all options (meals, activities, transport)
          else if (event.eventType === 'meal') {
            details.meals.push({
              name: event.subject || 'Meal',
              type: event.mealType || event.details || 'Meal',
              day: parseInt(day),
              image: event.image || null
            });
          } else if (event.eventType === 'activity') {
            details.activities.push({
              name: event.subject || 'Activity',
              details: event.details || '',
              day: parseInt(day),
              image: event.image || null
            });
          } else if (event.eventType === 'transportation' || event.eventType === 'transport') {
            details.transport.push({
              name: event.subject || 'Transport',
              details: event.details || event.transferType || '',
              day: parseInt(day),
              image: event.image || null
            });
          } else if (event.eventType &&
            !['accommodation', 'meal', 'activity', 'transportation', 'transport', 'day-itinerary'].includes(event.eventType)) {
            details.other.push({
              name: event.subject || 'Service',
              type: event.eventType || 'other',
              details: event.details || '',
              day: parseInt(day),
              image: event.image || null
            });
          }
        });
      });

      return details;
    } catch (err) {
      console.error('Error getting package details:', err);
      return null;
    }
  };

  const handleViewQuotation = async (proposal, openModal = true) => {
    setLoadingQuotation(true);
    setSelectedProposal(proposal);
    setSelectedOption(null);

    try {
      // Load itinerary data from localStorage if available
      const storedEvents = localStorage.getItem(`itinerary_${proposal.itinerary_id}_events`);
      const storedPricing = localStorage.getItem(`itinerary_${proposal.itinerary_id}_pricing`);
      const storedSettings = localStorage.getItem(`itinerary_${proposal.itinerary_id}_settings`);

      let dayEvents = {};
      let pricingData = {};
      let settings = {};

      if (storedEvents) {
        dayEvents = JSON.parse(storedEvents);
      }
      if (storedPricing) {
        pricingData = JSON.parse(storedPricing);
      }
      if (storedSettings) {
        settings = JSON.parse(storedSettings);
      }

      // Group hotel options by optionNumber
      const hotelOptions = {};
      Object.keys(dayEvents).forEach(day => {
        const events = dayEvents[day] || [];
        events.forEach(event => {
          if (event.eventType === 'accommodation' && event.hotelOptions) {
            event.hotelOptions.forEach(option => {
              const optNum = option.optionNumber || 1;
              if (!hotelOptions[optNum]) {
                hotelOptions[optNum] = [];
              }
              hotelOptions[optNum].push({
                ...option,
                day: parseInt(day),
                image: option.image || event.image || null // Add image from option or event
              });
            });
          }
        });
      });

      // Get itinerary details
      const itineraryResponse = await packagesAPI.get(proposal.itinerary_id);
      const itinerary = itineraryResponse.data.data.package || {};

      const builtQuotation = {
        itinerary: {
          ...itinerary,
          duration: proposal.duration || itinerary.duration,
          destinations: proposal.destination || itinerary.destinations
        },
        hotelOptions: hotelOptions
      };
      setQuotationData(builtQuotation);

      // Set first option as selected if available
      const optionNumbers = Object.keys(hotelOptions).sort((a, b) => parseInt(a) - parseInt(b));
      const selOpt = optionNumbers.length > 0 ? optionNumbers[0] : (proposal.optionNumber?.toString() || null);
      if (selOpt) setSelectedOption(selOpt);

      if (openModal) setShowQuotationModal(true);
      return builtQuotation;
    } catch (err) {
      console.error('Failed to load quotation:', err);
      alert('Failed to load quotation data');
      return null;
    } finally {
      setLoadingQuotation(false);
    }
  };

  // Get selected email template
  const getSelectedTemplate = async () => {
    try {
      const response = await settingsAPI.getByKey('selected_email_template');
      return response.data.success && response.data.data?.value
        ? response.data.data.value
        : 'template-1'; // Default template
    } catch (err) {
      console.error('Failed to load template:', err);
      return 'template-1';
    }
  };

  // Get All Policies
  const getAllPolicies = async () => {
    try {
      const [remarksRes, termsRes, confirmationRes, cancellationRes, amendmentRes, thankYouRes] = await Promise.all([
        settingsAPI.getByKey('remarks'),
        settingsAPI.getByKey('terms_conditions'),
        settingsAPI.getByKey('confirmation_policy'),
        settingsAPI.getByKey('cancellation_policy'),
        settingsAPI.getByKey('amendment_policy'),
        settingsAPI.getByKey('thank_you_message')
      ]);

      return {
        remarks: remarksRes.data.success && remarksRes.data.data?.value ? remarksRes.data.data.value : '',
        termsConditions: termsRes.data.success && termsRes.data.data?.value ? termsRes.data.data.value : '',
        confirmationPolicy: confirmationRes.data.success && confirmationRes.data.data?.value ? confirmationRes.data.data.value : '',
        cancellationPolicy: cancellationRes.data.success && cancellationRes.data.data?.value ? cancellationRes.data.data.value : '',
        amendmentPolicy: amendmentRes.data.success && amendmentRes.data.data?.value ? amendmentRes.data.data.value : '',
        thankYouMessage: thankYouRes.data.success && thankYouRes.data.data?.value ? thankYouRes.data.data.value : ''
      };
    } catch (err) {
      console.error('Failed to load policies:', err);
      return {
        remarks: '',
        termsConditions: '',
        confirmationPolicy: '',
        cancellationPolicy: '',
        amendmentPolicy: '',
        thankYouMessage: ''
      };
    }
  };

  // Get Terms & Conditions (for backward compatibility)
  const getTermsAndConditions = async () => {
    const policies = await getAllPolicies();
    return policies.termsConditions;
  };

  // Helper function to format text for HTML
  const formatTextForHTML = (text) => {
    if (!text) return '';
    // Convert line breaks to <br> and preserve formatting
    return text
      .split('\n')
      .map(line => {
        const trimmed = line.trim();
        if (trimmed.startsWith('-') || trimmed.startsWith('•') || trimmed.match(/^\d+\./)) {
          return `<li style="margin: 5px 0; color: #555;">${trimmed.replace(/^[-•]\s*|\d+\.\s*/, '')}</li>`;
        }
        if (trimmed === '') return '';
        return `<p style="margin: 8px 0; color: #555;">${trimmed}</p>`;
      })
      .join('');
  };

  // Generate Policy Section HTML
  const generatePolicySection = (title, text, styles = {}) => {
    if (!text) return '';

    const formattedText = formatTextForHTML(text);
    const isList = formattedText.includes('<li>');

    return `
      <div style="background: ${styles.termsBg || '#f8f9fa'}; padding: 20px; border-radius: ${styles.borderRadius || '10px'}; margin-top: 20px; border: ${styles.termsBorder || '1px solid #e5e7eb'}; box-shadow: ${styles.termsShadow || '0 3px 10px rgba(0,0,0,0.1)'};">
        <h4 style="margin: 0 0 12px 0; font-size: ${styles.termsTitleSize || '18px'}; color: ${styles.termsTitleColor || '#333'}; font-weight: bold;">${title}</h4>
        <div style="color: #555; line-height: 1.7; font-size: ${styles.termsTextSize || '14px'};">
          ${isList ? `<ul style="margin: 0; padding-left: 20px;">${formattedText}</ul>` : formattedText}
        </div>
      </div>
    `;
  };

  // Generate All Policies HTML section
  const generateAllPoliciesSection = (policies, styles = {}) => {
    let html = '';

    if (policies.remarks) {
      html += generatePolicySection('Remarks', policies.remarks, styles);
    }
    if (policies.termsConditions) {
      html += generatePolicySection('Terms & Conditions', policies.termsConditions, styles);
    }
    if (policies.confirmationPolicy) {
      html += generatePolicySection('Confirmation Policy', policies.confirmationPolicy, styles);
    }
    if (policies.cancellationPolicy) {
      html += generatePolicySection('Cancellation Policy', policies.cancellationPolicy, styles);
    }
    if (policies.amendmentPolicy) {
      html += generatePolicySection('Amendment Policy (Postpone & Prepone Policy)', policies.amendmentPolicy, styles);
    }

    return html;
  };

  // Generate Terms & Conditions HTML section (for backward compatibility)
  const generateTermsSection = (termsText, styles = {}) => {
    return generatePolicySection('Terms & Conditions', termsText, styles);
  };

  // Generate 3D Premium Card Template HTML
  const generate3DPremiumEmailTemplate = (itinerary, allOptions, hotelsData, policies = {}) => {
    let html = `
      <div style="font-family: 'Arial', sans-serif; max-width: 800px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px;">
        <div style="background: white; padding: 40px; border-radius: 20px; margin-bottom: 30px; box-shadow: 0 20px 60px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.1);">
          <h1 style="margin: 0; font-size: 48px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; text-align: center; font-weight: bold;">TravelOps</h1>
          <p style="text-align: center; color: #666; margin-top: 10px;">Delhi, India | Email: info@travelops.com | Mobile: +91-9871023004</p>
        </div>
        <div style="background: white; padding: 30px; border-radius: 20px; margin-bottom: 30px; box-shadow: 0 15px 35px rgba(0,0,0,0.2), inset 0 -5px 15px rgba(0,0,0,0.1);">
          <h2 style="margin-top: 0; font-size: 32px; color: #667eea; text-align: center;">Travel Quotation</h2>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 20px;">
            <div style="padding: 15px; background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); border-radius: 10px; box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);"><strong>Query ID:</strong> ${formatLeadId(lead?.id)}</div>
            <div style="padding: 15px; background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); border-radius: 10px; box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);"><strong>Destination:</strong> ${itinerary.destinations || 'N/A'}</div>
            <div style="padding: 15px; background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); border-radius: 10px; box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);"><strong>Duration:</strong> ${itinerary.duration || 0} Nights & ${(itinerary.duration || 0) + 1} Days</div>
            <div style="padding: 15px; background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); border-radius: 10px; box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);"><strong>Adults:</strong> ${lead?.adult || 1} | <strong>Children:</strong> ${lead?.child || 0}</div>
          </div>
        </div>
    `;

    allOptions.forEach(optNum => {
      const hotels = hotelsData[optNum] || [];
      const totalPrice = hotels.reduce((sum, h) => sum + (parseFloat(h.price) || 0), 0);

      html += `
        <div style="background: white; padding: 35px; border-radius: 25px; margin-bottom: 30px; box-shadow: 0 25px 50px rgba(0,0,0,0.25), 0 0 0 1px rgba(102,126,234,0.1); position: relative;">
          <div style="position: absolute; top: -10px; left: 50%; transform: translateX(-50%); width: 60px; height: 60px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 50%; box-shadow: 0 10px 20px rgba(102,126,234,0.4); display: flex; align-items: center; justify-content: center; color: white; font-size: 24px; font-weight: bold;">${optNum}</div>
          <div style="margin-top: 30px;">
            <h2 style="margin: 0 0 25px 0; font-size: 28px; color: #667eea; text-align: center;">Option ${optNum}</h2>
      `;

      hotels.forEach((hotel) => {
        html += `
          <div style="background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); padding: 25px; border-radius: 15px; margin-bottom: 20px; box-shadow: inset 0 2px 10px rgba(0,0,0,0.1), 0 5px 15px rgba(0,0,0,0.1);">
            <h4 style="margin: 0 0 15px 0; color: #333; font-size: 20px;">Day ${hotel.day}: ${hotel.hotelName || 'Hotel'}</h4>
            <p style="margin: 8px 0; color: #555;"><strong>Category:</strong> ${hotel.category ? `${hotel.category} Star` : 'N/A'}</p>
            <p style="margin: 8px 0; color: #555;"><strong>Room:</strong> ${hotel.roomName || 'N/A'}</p>
            <p style="margin: 8px 0; color: #555;"><strong>Meal Plan:</strong> ${hotel.mealPlan || 'N/A'}</p>
            ${hotel.price ? `<p style="margin: 8px 0; color: #555;"><strong>Price:</strong> ₹${parseFloat(hotel.price).toLocaleString('en-IN')}</p>` : ''}
          </div>
        `;
      });

      html += `
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 25px; border-radius: 15px; text-align: center; font-size: 28px; font-weight: bold; box-shadow: 0 10px 30px rgba(102,126,234,0.4), inset 0 -5px 15px rgba(0,0,0,0.2);">
            Total Package Price: ₹${totalPrice.toLocaleString('en-IN')}
          </div>
        </div>
      </div>
    `;
    });

    html += `
        <div style="background: rgba(255,255,255,0.95); padding: 30px; border-radius: 20px; text-align: center; box-shadow: 0 15px 35px rgba(0,0,0,0.2);">
          <p style="margin: 5px 0; font-size: 18px; font-weight: bold; color: #667eea;">Thank you for choosing TravelOps!</p>
          <p style="margin: 10px 0 5px 0; color: #666;">📞 +91-9871023004 | 🌐 www.travelops.com</p>
        </div>
      </div>
    `;

    return html;
  };

  // Generate 3D Floating Boxes Template HTML
  const generate3DFloatingEmailTemplate = (itinerary, allOptions, hotelsData, policies = {}) => {
    let html = `
      <div style="font-family: 'Arial', sans-serif; max-width: 800px; margin: 0 auto; background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); padding: 40px 20px;">
        <div style="background: white; padding: 40px; border-radius: 15px; margin-bottom: 40px; box-shadow: 0 30px 60px rgba(0,0,0,0.4), 0 0 0 3px rgba(255,255,255,0.2);">
          <h1 style="margin: 0; font-size: 48px; background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; text-align: center; font-weight: bold;">TravelOps</h1>
          <p style="text-align: center; color: #666; margin-top: 10px;">Delhi, India | Email: info@travelops.com | Mobile: +91-9871023004</p>
        </div>
        <div style="background: white; padding: 30px; border-radius: 15px; margin-bottom: 40px; box-shadow: 0 20px 50px rgba(0,0,0,0.3), 0 0 0 2px rgba(255,255,255,0.1);">
          <h2 style="margin-top: 0; font-size: 32px; color: #1e3c72; text-align: center;">Travel Quotation</h2>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 20px;">
            <div style="padding: 15px; background: #f0f4ff; border-radius: 10px; border-left: 4px solid #2a5298; box-shadow: 0 5px 15px rgba(0,0,0,0.1);"><strong>Query ID:</strong> ${formatLeadId(lead?.id)}</div>
            <div style="padding: 15px; background: #f0f4ff; border-radius: 10px; border-left: 4px solid #2a5298; box-shadow: 0 5px 15px rgba(0,0,0,0.1);"><strong>Destination:</strong> ${itinerary.destinations || 'N/A'}</div>
            <div style="padding: 15px; background: #f0f4ff; border-radius: 10px; border-left: 4px solid #2a5298; box-shadow: 0 5px 15px rgba(0,0,0,0.1);"><strong>Duration:</strong> ${itinerary.duration || 0} Nights & ${(itinerary.duration || 0) + 1} Days</div>
            <div style="padding: 15px; background: #f0f4ff; border-radius: 10px; border-left: 4px solid #2a5298; box-shadow: 0 5px 15px rgba(0,0,0,0.1);"><strong>Adults:</strong> ${lead?.adult || 1} | <strong>Children:</strong> ${lead?.child || 0}</div>
          </div>
        </div>
    `;

    allOptions.forEach((optNum, idx) => {
      const hotels = hotelsData[optNum] || [];
      const totalPrice = hotels.reduce((sum, h) => sum + (parseFloat(h.price) || 0), 0);
      const rotation = idx % 2 === 0 ? '-2deg' : '2deg';
      const badgePos = idx % 2 === 0 ? 'right: 30px;' : 'left: 30px;';

      html += `
        <div style="background: white; padding: 35px; border-radius: 20px; margin-bottom: 40px; box-shadow: 0 35px 70px rgba(0,0,0,0.35), 0 0 0 2px rgba(42,82,152,0.2); position: relative;">
          <div style="position: absolute; top: -20px; ${badgePos} width: 80px; height: 80px; background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); border-radius: 15px; box-shadow: 0 15px 30px rgba(30,60,114,0.5); display: flex; align-items: center; justify-content: center; color: white; font-size: 32px; font-weight: bold;">${optNum}</div>
          <div style="margin-top: 20px;">
            <h2 style="margin: 0 0 25px 0; font-size: 28px; color: #1e3c72; text-align: center;">Option ${optNum}</h2>
      `;

      hotels.forEach((hotel) => {
        html += `
          <div style="background: linear-gradient(135deg, #e8f0ff 0%, #d0e0ff 100%); padding: 25px; border-radius: 15px; margin-bottom: 20px; box-shadow: 0 10px 25px rgba(0,0,0,0.15), inset 0 2px 5px rgba(255,255,255,0.5);">
            <h4 style="margin: 0 0 15px 0; color: #1e3c72; font-size: 20px;">Day ${hotel.day}: ${hotel.hotelName || 'Hotel'}</h4>
            <p style="margin: 8px 0; color: #333;"><strong>Category:</strong> ${hotel.category ? `${hotel.category} Star` : 'N/A'}</p>
            <p style="margin: 8px 0; color: #333;"><strong>Room:</strong> ${hotel.roomName || 'N/A'}</p>
            <p style="margin: 8px 0; color: #333;"><strong>Meal Plan:</strong> ${hotel.mealPlan || 'N/A'}</p>
            ${hotel.price ? `<p style="margin: 8px 0; color: #333;"><strong>Price:</strong> ₹${parseFloat(hotel.price).toLocaleString('en-IN')}</p>` : ''}
          </div>
        `;
      });

      html += `
          <div style="background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); color: white; padding: 25px; border-radius: 15px; text-align: center; font-size: 28px; font-weight: bold; box-shadow: 0 15px 35px rgba(30,60,114,0.5), inset 0 -5px 15px rgba(0,0,0,0.2);">
            Total Package Price: ₹${totalPrice.toLocaleString('en-IN')}
          </div>
        </div>
      </div>
    `;
    });

    html += `
        ${generateAllPoliciesSection(policies, {
      termsBg: 'rgba(255,255,255,0.95)',
      borderRadius: '15px',
      termsBorder: '2px solid #1e3c72',
      termsShadow: '0 15px 40px rgba(0,0,0,0.3)',
      termsTitleColor: '#1e3c72',
      termsTitleSize: '20px',
      termsTextSize: '14px'
    })}
        ${policies.thankYouMessage ? `
        <div style="background: rgba(255,255,255,0.95); padding: 25px; border-radius: 15px; margin-top: 30px; border: 2px solid #1e3c72; box-shadow: 0 15px 40px rgba(0,0,0,0.3);">
          <div style="color: #555; line-height: 1.8; font-size: 14px;">
            ${formatTextForHTML(policies.thankYouMessage)}
          </div>
        </div>
        ` : ''}
        <div style="background: rgba(255,255,255,0.95); padding: 30px; border-radius: 15px; text-align: center; box-shadow: 0 20px 50px rgba(0,0,0,0.3); margin-top: 30px;">
          <p style="margin: 5px 0; font-size: 18px; font-weight: bold; color: #1e3c72;">Thank you for choosing TravelOps!</p>
          <p style="margin: 10px 0 5px 0; color: #666;">📞 +91-9871023004 | 🌐 www.travelops.com</p>
        </div>
      </div>
    `;

    return html;
  };

  // Generate 3D Layered Design Template HTML
  const generate3DLayeredEmailTemplate = (itinerary, allOptions, hotelsData, policies = {}) => {
    let html = `
      <div style="font-family: 'Arial', sans-serif; max-width: 800px; margin: 0 auto; background: linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%); padding: 50px 20px;">
        <div style="position: relative; margin-bottom: 50px;">
          <div style="background: rgba(255,255,255,0.1); padding: 50px; border-radius: 20px; box-shadow: 0 20px 60px rgba(0,0,0,0.5); position: relative; z-index: 3;">
            <div style="background: rgba(255,255,255,0.15); padding: 40px; border-radius: 15px; box-shadow: 0 15px 40px rgba(0,0,0,0.4); position: relative; z-index: 2;">
              <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); position: relative; z-index: 1;">
                <h1 style="margin: 0; font-size: 48px; background: linear-gradient(135deg, #0f2027 0%, #2c5364 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; text-align: center; font-weight: bold;">TravelOps</h1>
                <p style="text-align: center; color: #666; margin-top: 10px;">Delhi, India | Email: info@travelops.com | Mobile: +91-9871023004</p>
              </div>
            </div>
          </div>
        </div>
        <div style="position: relative; margin-bottom: 50px;">
          <div style="background: rgba(255,255,255,0.95); padding: 30px; border-radius: 20px; box-shadow: 0 25px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.2); position: relative; z-index: 2;">
            <h2 style="margin-top: 0; font-size: 32px; color: #0f2027; text-align: center;">Travel Quotation</h2>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 20px;">
              <div style="padding: 15px; background: linear-gradient(135deg, #e0f2f1 0%, #b2dfdb 100%); border-radius: 10px; box-shadow: 0 5px 15px rgba(0,0,0,0.1), inset 0 2px 5px rgba(255,255,255,0.5);"><strong>Query ID:</strong> ${formatLeadId(lead?.id)}</div>
              <div style="padding: 15px; background: linear-gradient(135deg, #e0f2f1 0%, #b2dfdb 100%); border-radius: 10px; box-shadow: 0 5px 15px rgba(0,0,0,0.1), inset 0 2px 5px rgba(255,255,255,0.5);"><strong>Destination:</strong> ${itinerary.destinations || 'N/A'}</div>
              <div style="padding: 15px; background: linear-gradient(135deg, #e0f2f1 0%, #b2dfdb 100%); border-radius: 10px; box-shadow: 0 5px 15px rgba(0,0,0,0.1), inset 0 2px 5px rgba(255,255,255,0.5);"><strong>Duration:</strong> ${itinerary.duration || 0} Nights & ${(itinerary.duration || 0) + 1} Days</div>
              <div style="padding: 15px; background: linear-gradient(135deg, #e0f2f1 0%, #b2dfdb 100%); border-radius: 10px; box-shadow: 0 5px 15px rgba(0,0,0,0.1), inset 0 2px 5px rgba(255,255,255,0.5);"><strong>Adults:</strong> ${lead?.adult || 1} | <strong>Children:</strong> ${lead?.child || 0}</div>
            </div>
          </div>
        </div>
    `;

    allOptions.forEach(optNum => {
      const hotels = hotelsData[optNum] || [];
      const totalPrice = hotels.reduce((sum, h) => sum + (parseFloat(h.price) || 0), 0);

      html += `
        <div style="position: relative; margin-bottom: 50px;">
          <div style="background: rgba(255,255,255,0.1); padding: 35px; border-radius: 25px; box-shadow: 0 30px 70px rgba(0,0,0,0.5); position: relative; z-index: 3;">
            <div style="background: rgba(255,255,255,0.2); padding: 30px; border-radius: 20px; box-shadow: 0 20px 50px rgba(0,0,0,0.4); position: relative; z-index: 2;">
              <div style="background: white; padding: 25px; border-radius: 15px; box-shadow: 0 15px 40px rgba(0,0,0,0.3); position: relative; z-index: 1;">
                <div style="position: absolute; top: -25px; left: 50%; transform: translateX(-50%); width: 70px; height: 70px; background: linear-gradient(135deg, #0f2027 0%, #2c5364 100%); border-radius: 50%; box-shadow: 0 15px 35px rgba(15,32,39,0.6); display: flex; align-items: center; justify-content: center; color: white; font-size: 28px; font-weight: bold; z-index: 4;">${optNum}</div>
                <div style="margin-top: 30px;">
                  <h2 style="margin: 0 0 25px 0; font-size: 28px; color: #0f2027; text-align: center;">Option ${optNum}</h2>
      `;

      hotels.forEach((hotel) => {
        html += `
          <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); padding: 25px; border-radius: 15px; margin-bottom: 20px; box-shadow: 0 10px 25px rgba(0,0,0,0.15), inset 0 2px 5px rgba(255,255,255,0.5);">
            <h4 style="margin: 0 0 15px 0; color: #0f2027; font-size: 20px;">Day ${hotel.day}: ${hotel.hotelName || 'Hotel'}</h4>
            <p style="margin: 8px 0; color: #333;"><strong>Category:</strong> ${hotel.category ? `${hotel.category} Star` : 'N/A'}</p>
            <p style="margin: 8px 0; color: #333;"><strong>Room:</strong> ${hotel.roomName || 'N/A'}</p>
            <p style="margin: 8px 0; color: #333;"><strong>Meal Plan:</strong> ${hotel.mealPlan || 'N/A'}</p>
            ${hotel.price ? `<p style="margin: 8px 0; color: #333;"><strong>Price:</strong> ₹${parseFloat(hotel.price).toLocaleString('en-IN')}</p>` : ''}
          </div>
        `;
      });

      html += `
          <div style="background: linear-gradient(135deg, #0f2027 0%, #2c5364 100%); color: white; padding: 25px; border-radius: 15px; text-align: center; font-size: 28px; font-weight: bold; box-shadow: 0 15px 35px rgba(15,32,39,0.6), inset 0 -5px 15px rgba(0,0,0,0.2);">
            Total Package Price: ₹${totalPrice.toLocaleString('en-IN')}
          </div>
        </div>
      </div>
    </div>
    `;
    });

    html += `
        ${generateAllPoliciesSection(policies, {
      termsBg: 'rgba(255,255,255,0.95)',
      borderRadius: '20px',
      termsBorder: '2px solid #0f2027',
      termsShadow: '0 20px 50px rgba(0,0,0,0.4)',
      termsTitleColor: '#0f2027',
      termsTitleSize: '20px',
      termsTextSize: '14px'
    })}
        ${policies.thankYouMessage ? `
        <div style="background: rgba(255,255,255,0.95); padding: 25px; border-radius: 20px; margin-top: 30px; border: 2px solid #0f2027; box-shadow: 0 20px 50px rgba(0,0,0,0.4);">
          <div style="color: #555; line-height: 1.8; font-size: 14px;">
            ${formatTextForHTML(policies.thankYouMessage)}
          </div>
        </div>
        ` : ''}
        <div style="position: relative;">
          <div style="background: rgba(255,255,255,0.95); padding: 30px; border-radius: 20px; text-align: center; box-shadow: 0 25px 60px rgba(0,0,0,0.4); position: relative; z-index: 2; margin-top: 30px;">
            <p style="margin: 5px 0; font-size: 18px; font-weight: bold; color: #0f2027;">Thank you for choosing TravelOps!</p>
            <p style="margin: 10px 0 5px 0; color: #666;">📞 +91-9871023004 | 🌐 www.travelops.com</p>
          </div>
        </div>
      </div>
    `;

    return html;
  };

  // Generate Adventure Template HTML
  const generateAdventureEmailTemplate = (itinerary, allOptions, hotelsData, policies = {}) => {
    let html = `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; background: #d1fae5;">
        <div style="background: #65a30d; padding: 40px 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 48px; font-weight: bold; color: white; text-transform: uppercase; letter-spacing: 3px;">EXPLORE</h1>
          <p style="margin: 10px 0 0 0; font-size: 28px; color: white; font-style: italic;">The World</p>
          <p style="margin: 20px 0 0 0; font-size: 16px; color: white; text-transform: uppercase; letter-spacing: 2px;">ORGANIZE YOUR TRIP WITH US</p>
        </div>
        <div style="padding: 30px; background: #d1fae5;">
          <div style="background: white; padding: 25px; border-radius: 8px; margin-bottom: 25px; border-left: 5px solid #65a30d;">
            <h2 style="margin-top: 0; color: #365314; font-size: 24px;">Travel Quotation</h2>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 15px;">
              <div><strong style="color: #365314;">Query ID:</strong> ${formatLeadId(lead?.id)}</div>
              <div><strong style="color: #365314;">Destination:</strong> ${itinerary.destinations || 'N/A'}</div>
              <div><strong style="color: #365314;">Duration:</strong> ${itinerary.duration || 0} Nights & ${(itinerary.duration || 0) + 1} Days</div>
              <div><strong style="color: #365314;">Adults:</strong> ${lead?.adult || 1} | <strong>Children:</strong> ${lead?.child || 0}</div>
            </div>
          </div>
    `;

    allOptions.forEach(optNum => {
      const hotels = hotelsData[optNum] || [];
      const totalPrice = hotels.reduce((sum, h) => sum + (parseFloat(h.price) || 0), 0);

      html += `
        <div style="background: white; padding: 25px; border-radius: 8px; margin-bottom: 25px; border: 2px solid #84cc16;">
          <div style="background: #65a30d; color: white; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="margin: 0; font-size: 24px;">Option ${optNum}</h2>
          </div>
          <div style="margin: 20px 0;">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px;">
              <div style="width: 40px; height: 40px; background: #84cc16; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">🏔️</div>
              <h3 style="margin: 0; color: #365314; font-size: 20px;">Hotels Included</h3>
            </div>
      `;

      hotels.forEach((hotel) => {
        html += `
          <div style="background: #f7fee7; padding: 20px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #84cc16;">
            <h4 style="margin: 0 0 10px 0; color: #365314; font-size: 18px;">Day ${hotel.day}: ${hotel.hotelName || 'Hotel'}</h4>
            <p style="margin: 5px 0; color: #365314;"><strong>Category:</strong> ${hotel.category ? `${hotel.category} Star` : 'N/A'}</p>
            <p style="margin: 5px 0; color: #365314;"><strong>Room:</strong> ${hotel.roomName || 'N/A'}</p>
            <p style="margin: 5px 0; color: #365314;"><strong>Meal Plan:</strong> ${hotel.mealPlan || 'N/A'}</p>
            ${hotel.checkIn ? `<p style="margin: 5px 0; color: #365314;"><strong>Check-in:</strong> ${hotel.checkIn} ${hotel.checkInTime || ''}</p>` : ''}
            ${hotel.checkOut ? `<p style="margin: 5px 0; color: #365314;"><strong>Check-out:</strong> ${hotel.checkOut} ${hotel.checkOutTime || ''}</p>` : ''}
            ${hotel.price ? `<p style="margin: 5px 0; color: #365314;"><strong>Price:</strong> ₹${parseFloat(hotel.price).toLocaleString('en-IN')}</p>` : ''}
          </div>
        `;
      });

      html += `
          <div style="background: #65a30d; color: white; padding: 20px; text-align: center; border-radius: 8px; font-size: 24px; font-weight: bold;">
            Total Package Price: ₹${totalPrice.toLocaleString('en-IN')}
          </div>
        </div>
      </div>
    `;
    });

    html += `
        </div>
        ${generateAllPoliciesSection(policies, {
      termsBg: 'white',
      borderRadius: '8px',
      termsBorder: '2px solid #84cc16',
      termsShadow: '0 5px 15px rgba(0,0,0,0.1)',
      termsTitleColor: '#365314',
      termsTitleSize: '18px',
      termsTextSize: '14px'
    })}
        ${policies.thankYouMessage ? `
        <div style="background: white; padding: 25px; border-radius: 8px; margin-top: 30px; border: 2px solid #84cc16; box-shadow: 0 5px 15px rgba(0,0,0,0.1);">
          <div style="color: #365314; line-height: 1.8; font-size: 14px;">
            ${formatTextForHTML(policies.thankYouMessage)}
          </div>
        </div>
        ` : ''}
        <div style="background: #365314; color: #fef3c7; padding: 25px; text-align: center; margin-top: 30px;">
          <p style="margin: 5px 0; font-size: 18px; font-weight: bold;">BOOK NOW</p>
          <p style="margin: 10px 0 5px 0;">📍 Delhi, India</p>
          <p style="margin: 5px 0;">📞 +91-9871023004</p>
          <p style="margin: 5px 0;">🌐 www.travelops.com</p>
        </div>
      </div>
    `;

    return html;
  };

  // Generate Beach Template HTML
  const generateBeachEmailTemplate = (itinerary, allOptions, hotelsData, policies = {}) => {
    let html = `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; background: white;">
        <div style="background: linear-gradient(180deg, #0ea5e9 0%, #06b6d4 50%, #22d3ee 100%); padding: 50px 30px; text-align: center; position: relative; overflow: hidden;">
          <div style="position: absolute; bottom: 0; left: 0; right: 0; height: 50px; background: #fef3c7; border-radius: 50% 50% 0 0 / 100% 100% 0 0;"></div>
          <div style="position: relative; z-index: 1;">
            <h1 style="margin: 0; font-size: 42px; color: white; font-weight: bold;">Explore The World</h1>
            <p style="margin: 10px 0 0 0; font-size: 18px; color: white; text-transform: uppercase; letter-spacing: 2px;">WITH US</p>
          </div>
        </div>
        <div style="padding: 30px; background: #fef3c7;">
          <div style="background: white; padding: 25px; border-radius: 12px; margin-bottom: 25px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="margin-top: 0; color: #0891b2; font-size: 28px;">Travel Quotation</h2>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 15px;">
              <div><strong style="color: #164e63;">Query ID:</strong> ${formatLeadId(lead?.id)}</div>
              <div><strong style="color: #164e63;">Destination:</strong> ${itinerary.destinations || 'N/A'}</div>
              <div><strong style="color: #164e63;">Duration:</strong> ${itinerary.duration || 0} Nights & ${(itinerary.duration || 0) + 1} Days</div>
              <div><strong style="color: #164e63;">Adults:</strong> ${lead?.adult || 1} | <strong>Children:</strong> ${lead?.child || 0}</div>
            </div>
          </div>
    `;

    allOptions.forEach(optNum => {
      const hotels = hotelsData[optNum] || [];
      const totalPrice = hotels.reduce((sum, h) => sum + (parseFloat(h.price) || 0), 0);

      html += `
        <div style="background: white; padding: 25px; border-radius: 12px; margin-bottom: 25px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <div style="background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); color: white; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
            <h2 style="margin: 0; font-size: 28px;">Option ${optNum}</h2>
          </div>
          <h3 style="color: #0891b2; margin-top: 0; font-size: 22px;">🏨 Hotels Included</h3>
      `;

      hotels.forEach((hotel) => {
        html += `
          <div style="background: #ecfeff; padding: 20px; border-radius: 10px; margin-bottom: 15px; border: 2px solid #06b6d4;">
            <div style="display: flex; gap: 15px;">
              ${hotel.image ? `<img src="${hotel.image}" alt="${hotel.hotelName}" style="width: 120px; height: 120px; object-fit: cover; border-radius: 50%; flex-shrink: 0;" />` : '<div style="width: 120px; height: 120px; background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); border-radius: 50%; flex-shrink: 0; display: flex; align-items: center; justify-content: center; color: white; font-size: 40px;">🏨</div>'}
              <div style="flex: 1;">
                <h4 style="margin: 0 0 10px 0; color: #164e63; font-size: 20px;">Day ${hotel.day}: ${hotel.hotelName || 'Hotel'}</h4>
                <p style="margin: 5px 0; color: #164e63;"><strong>Category:</strong> ${hotel.category ? `${hotel.category} Star` : 'N/A'}</p>
                <p style="margin: 5px 0; color: #164e63;"><strong>Room:</strong> ${hotel.roomName || 'N/A'}</p>
                <p style="margin: 5px 0; color: #164e63;"><strong>Meal Plan:</strong> ${hotel.mealPlan || 'N/A'}</p>
                ${hotel.price ? `<p style="margin: 5px 0; color: #164e63;"><strong>Price:</strong> ₹${parseFloat(hotel.price).toLocaleString('en-IN')}</p>` : ''}
              </div>
            </div>
          </div>
        `;
      });

      html += `
          <div style="background: #0891b2; color: white; padding: 25px; text-align: center; border-radius: 10px; font-size: 28px; font-weight: bold;">
            Total Package Price: ₹${totalPrice.toLocaleString('en-IN')}
          </div>
        </div>
      `;
    });

    html += `
        </div>
        ${generateAllPoliciesSection(policies, {
      termsBg: 'white',
      borderRadius: '12px',
      termsBorder: '2px solid #06b6d4',
      termsShadow: '0 5px 15px rgba(0,0,0,0.1)',
      termsTitleColor: '#0891b2',
      termsTitleSize: '18px',
      termsTextSize: '14px'
    })}
        ${policies.thankYouMessage ? `
        <div style="background: white; padding: 25px; border-radius: 12px; margin-top: 30px; border: 2px solid #06b6d4; box-shadow: 0 5px 15px rgba(0,0,0,0.1);">
          <div style="color: #164e63; line-height: 1.8; font-size: 14px;">
            ${formatTextForHTML(policies.thankYouMessage)}
          </div>
        </div>
        ` : ''}
        <div style="background: #164e63; color: white; padding: 25px; text-align: center; margin-top: 30px;">
          <p style="margin: 5px 0; font-size: 18px; font-weight: bold;">Thank you for choosing TravelOps!</p>
          <p style="margin: 10px 0 5px 0;">📞 +91-9871023004 | 🌐 www.travelops.com</p>
        </div>
      </div>
    `;

    return html;
  };

  // Generate Elegant Package Template HTML
  const generateElegantEmailTemplate = (itinerary, allOptions, hotelsData, policies = {}) => {
    let html = `
      <div style="font-family: 'Georgia', serif; max-width: 800px; margin: 0 auto; background: white;">
        <div style="background: #3f6212; color: #fef3c7; padding: 40px 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 48px; font-style: italic; font-weight: normal;">Travel</h1>
          <p style="margin: 5px 0 0 0; font-size: 24px; letter-spacing: 3px;">Package Pricelist</p>
          <p style="margin: 20px 0 0 0; font-size: 14px; max-width: 600px; margin-left: auto; margin-right: auto;">
            Create your dream travel experience with our carefully curated packages, designed to make your journey truly unforgettable.
          </p>
        </div>
        <div style="padding: 30px; background: #f7fee7;">
          <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 25px; border: 1px solid #84cc16;">
            <h2 style="margin-top: 0; color: #365314; font-size: 24px;">Quote Details</h2>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
              <div><strong style="color: #3f6212;">Query ID:</strong> ${formatLeadId(lead?.id)}</div>
              <div><strong style="color: #3f6212;">Destination:</strong> ${itinerary.destinations || 'N/A'}</div>
              <div><strong style="color: #3f6212;">Duration:</strong> ${itinerary.duration || 0} Nights & ${(itinerary.duration || 0) + 1} Days</div>
              <div><strong style="color: #3f6212;">Adults:</strong> ${lead?.adult || 1} | <strong>Children:</strong> ${lead?.child || 0}</div>
            </div>
          </div>
    `;

    allOptions.forEach(optNum => {
      const hotels = hotelsData[optNum] || [];
      const totalPrice = hotels.reduce((sum, h) => sum + (parseFloat(h.price) || 0), 0);

      html += `
        <div style="background: #65a30d; padding: 25px; border-radius: 10px; margin-bottom: 25px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h2 style="margin: 0; color: #fef3c7; font-size: 28px; font-weight: normal;">Option ${optNum}</h2>
            <div style="color: #fef3c7; font-size: 32px; font-weight: bold; text-decoration: underline;">₹${totalPrice.toLocaleString('en-IN')}</div>
          </div>
      `;

      hotels.forEach((hotel) => {
        html += `
          <div style="background: #f7fee7; padding: 20px; border-radius: 8px; margin-bottom: 15px;">
            <div style="display: flex; gap: 15px; margin-bottom: 15px;">
              ${hotel.image ? `<img src="${hotel.image}" alt="${hotel.hotelName}" style="width: 100px; height: 100px; border-radius: 50%; flex-shrink: 0; object-fit: cover;" />` : '<div style="width: 100px; height: 100px; background: #84cc16; border-radius: 50%; flex-shrink: 0; display: flex; align-items: center; justify-content: center; color: white; font-size: 40px;">🏨</div>'}
              <div style="flex: 1;">
                <h4 style="margin: 0 0 10px 0; color: #365314; font-size: 20px;">Day ${hotel.day}: ${hotel.hotelName || 'Hotel'}</h4>
                <ul style="margin: 0; padding-left: 20px; color: #365314;">
                  <li>${hotel.category ? `${hotel.category} Star` : 'N/A'} Category</li>
                  <li>${hotel.roomName || 'Standard'} Room</li>
                  <li>${hotel.mealPlan || 'Room Only'} Meal Plan</li>
                  ${hotel.checkIn ? `<li>Check-in: ${hotel.checkIn} ${hotel.checkInTime || ''}</li>` : ''}
                </ul>
              </div>
            </div>
          </div>
        `;
      });

      html += `</div>`;
    });

    html += `
        </div>
        ${generateTermsSection(termsConditions, {
      termsBg: '#f7fee7',
      borderRadius: '10px',
      termsBorder: '2px solid #84cc16',
      termsShadow: '0 5px 15px rgba(0,0,0,0.1)',
      termsTitleColor: '#365314',
      termsTitleSize: '22px',
      termsTextSize: '14px'
    })}
        <div style="background: #365314; color: #fef3c7; padding: 25px; text-align: center; margin-top: 30px;">
          <p style="margin: 5px 0;">📍 Delhi, India</p>
          <p style="margin: 5px 0;">📞 +91-9871023004 | 🌐 www.travelops.com</p>
        </div>
      </div>
    `;

    return html;
  };

  // Extract only the <body> inner HTML from a full HTML string
  const extractBodyContent = (htmlString) => {
    if (!htmlString) return '';
    try {
      const bodyMatch = htmlString.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      if (bodyMatch && bodyMatch[1]) {
        return bodyMatch[1];
      }
      return htmlString;
    } catch (e) {
      console.error('Failed to extract body content from HTML', e);
      return htmlString;
    }
  };

  // Generate professional email content with all options using selected template
  const generateEmailContent = async () => {
    if (!quotationData || !selectedProposal) return '';

    const templateId = await getSelectedTemplate();
    const allPolicies = await getAllPolicies();
    const itinerary = quotationData.itinerary;
    const allOptions = Object.keys(quotationData.hotelOptions).sort((a, b) => parseInt(a) - parseInt(b));

    // Use special templates
    if (templateId === 'template-2') {
      return generate3DPremiumEmailTemplate(itinerary, allOptions, quotationData.hotelOptions, allPolicies);
    } else if (templateId === 'template-3') {
      return generate3DFloatingEmailTemplate(itinerary, allOptions, quotationData.hotelOptions, allPolicies);
    } else if (templateId === 'template-4') {
      return generate3DLayeredEmailTemplate(itinerary, allOptions, quotationData.hotelOptions, allPolicies);
    } else if (templateId === 'template-5') {
      return generateAdventureEmailTemplate(itinerary, allOptions, quotationData.hotelOptions, allPolicies);
    } else if (templateId === 'template-6') {
      return generateBeachEmailTemplate(itinerary, allOptions, quotationData.hotelOptions, allPolicies);
    } else if (templateId === 'template-7') {
      return generateElegantEmailTemplate(itinerary, allOptions, quotationData.hotelOptions, allPolicies);
    }

    // Template styles based on template ID
    const templateStyles = {
      'template-1': {
        headerBg: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
        optionBorder: '#2563eb',
        optionHeaderBg: '#2563eb',
        hotelCardBg: '#f0f9ff',
        priceBoxBg: '#dc2626',
        footerBg: '#1f2937'
      },
      'template-5': {
        headerBg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        optionBorder: '#667eea',
        optionHeaderBg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        hotelCardBg: '#f3f4f6',
        priceBoxBg: '#8b5cf6',
        footerBg: '#4b5563'
      },
      'template-6': {
        headerBg: '#ffffff',
        headerColor: '#1f2937',
        optionBorder: '#e5e7eb',
        optionHeaderBg: '#f9fafb',
        optionHeaderColor: '#1f2937',
        hotelCardBg: '#ffffff',
        priceBoxBg: '#059669',
        footerBg: '#f9fafb',
        footerColor: '#6b7280'
      }
    };

    const styles = templateStyles[templateId] || templateStyles['template-1'];

    let htmlContent = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .header { background: ${styles.headerBg}; color: ${styles.headerColor || 'white'}; padding: 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 32px; }
            .content { padding: 30px; max-width: 800px; margin: 0 auto; }
            .itinerary-image { width: 100%; max-width: 600px; height: 300px; object-fit: cover; border-radius: 10px; margin: 20px auto; display: block; }
            .quote-details { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .option-section { border: 2px solid ${styles.optionBorder}; border-radius: 10px; padding: 25px; margin: 30px 0; background: white; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
            .option-header { background: ${styles.optionHeaderBg}; color: ${styles.optionHeaderColor || 'white'}; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
            .hotel-card { background: ${styles.hotelCardBg}; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid ${styles.optionBorder}; }
            .hotel-image { width: 120px; height: 120px; object-fit: cover; border-radius: 8px; float: left; margin-right: 15px; }
            .price-box { background: ${styles.priceBoxBg}; color: white; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0; font-size: 24px; font-weight: bold; }
            .footer { background: ${styles.footerBg}; color: ${styles.footerColor || 'white'}; padding: 20px; text-align: center; }
            table { width: 100%; border-collapse: collapse; margin: 15px 0; }
            td { padding: 8px; border-bottom: 1px solid #e5e7eb; }
            .label { font-weight: bold; color: #4b5563; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>TravelOps</h1>
            <p>Delhi, India | Email: info@travelops.com | Mobile: +91-9871023004</p>
          </div>
          
          <div class="content">
            <h2 style="color: ${styles.optionBorder}; font-size: 28px;">Travel Quotation</h2>
            
            ${itinerary.image ? `<img src="${itinerary.image}" alt="${itinerary.itinerary_name}" class="itinerary-image" />` : ''}
            
            <div class="quote-details">
              <h3 style="margin-top: 0;">Quote Details</h3>
              <table>
                <tr><td class="label">Query ID:</td><td>${formatLeadId(lead?.id)}</td></tr>
                <tr><td class="label">Destination:</td><td>${itinerary.destinations || 'N/A'}</td></tr>
                <tr><td class="label">Duration:</td><td>${itinerary.duration || 0} Nights & ${(itinerary.duration || 0) + 1} Days</td></tr>
                <tr><td class="label">Adults:</td><td>${lead?.adult || 1}</td></tr>
                <tr><td class="label">Children:</td><td>${lead?.child || 0}</td></tr>
              </table>
            </div>
    `;

    // Add all options
    allOptions.forEach(optNum => {
      const hotels = quotationData.hotelOptions[optNum] || [];
      const totalPrice = hotels.reduce((sum, h) => sum + (parseFloat(h.price) || 0), 0);

      htmlContent += `
        <div class="option-section">
          <div class="option-header">
            <h2 style="margin: 0; font-size: 24px;">Option ${optNum}</h2>
          </div>
          
          <h3 style="color: #1e40af;">🏨 Hotels Included:</h3>
      `;

      hotels.forEach((hotel, idx) => {
        htmlContent += `
          <div class="hotel-card">
            ${hotel.image ? `<img src="${hotel.image}" alt="${hotel.hotelName}" class="hotel-image" />` : ''}
            <div style="margin-left: ${hotel.image ? '135px' : '0'};">
              <h4 style="margin-top: 0; color: #1e40af; font-size: 18px;">Day ${hotel.day}: ${hotel.hotelName || 'Hotel'}</h4>
              <p><strong>Category:</strong> ${hotel.category ? `${hotel.category} Star` : 'N/A'}</p>
              <p><strong>Room:</strong> ${hotel.roomName || 'N/A'}</p>
              <p><strong>Meal Plan:</strong> ${hotel.mealPlan || 'N/A'}</p>
              ${hotel.checkIn ? `<p><strong>Check-in:</strong> ${hotel.checkIn} ${hotel.checkInTime || ''}</p>` : ''}
              ${hotel.checkOut ? `<p><strong>Check-out:</strong> ${hotel.checkOut} ${hotel.checkOutTime || ''}</p>` : ''}
              ${hotel.price ? `<p><strong>Price:</strong> ₹${parseFloat(hotel.price).toLocaleString('en-IN')}</p>` : ''}
            </div>
            <div style="clear: both;"></div>
          </div>
        `;
      });

      htmlContent += `
          <div class="price-box">
            Total Package Price: ₹${totalPrice.toLocaleString('en-IN')}
          </div>
        </div>
      `;
    });

    htmlContent += `
          </div>
          
          ${generateAllPoliciesSection(allPolicies, {
      termsBg: '#f8f9fa',
      borderRadius: '10px',
      termsBorder: `2px solid ${styles.optionBorder}`,
      termsShadow: '0 5px 15px rgba(0,0,0,0.1)',
      termsTitleColor: styles.optionBorder,
      termsTitleSize: '18px',
      termsTextSize: '14px'
    })}
          ${allPolicies.thankYouMessage ? `
          <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-top: 20px; border: 2px solid ${styles.optionBorder}; box-shadow: 0 5px 15px rgba(0,0,0,0.1);">
            <div style="color: #555; line-height: 1.8; font-size: 14px;">
              ${formatTextForHTML(allPolicies.thankYouMessage)}
            </div>
          </div>
          ` : ''}
          
          <div class="footer">
            <p>Thank you for choosing TravelOps!</p>
            <p>For any queries, please contact us at info@travelops.com or +91-9871023004</p>
          </div>
        </body>
      </html>
    `;

    return htmlContent;
  };

  const handleSendMail = async (optionNum) => {
    if (!quotationData || !lead) {
      alert('Please load quotation first');
      return;
    }

    const recipientEmail = lead?.email || '';
    const optionNumbers = Object.keys(quotationData.hotelOptions || {}).sort((a, b) => parseInt(a) - parseInt(b));
    if (!recipientEmail) {
      alert('Lead email is required to send. Please add customer email.');
      return;
    }

    const subject = `Travel Quotation - ${quotationData.itinerary.itinerary_name || 'Itinerary'} - ${formatLeadId(lead.id)}`;
    const emailContent = await generateEmailContent();

    try {
      if (user?.google_token) {
        await googleMailAPI.sendMail({
          to: recipientEmail,
          to_email: recipientEmail,
          subject,
          body: emailContent,
          lead_id: id,
        });
        fetchGmailEmails();
        
        // Update lead status to PROPOSAL if not already
        if (lead.status !== 'proposal') {
          try {
            await leadsAPI.updateStatus(id, { status: 'proposal' });
            await fetchLeadDetails(); // Refresh lead data
          } catch (statusError) {
            console.error('Failed to update lead status:', statusError);
            // Don't show error to user as email was sent successfully
          }
        }
        
        alert('Email sent successfully via Gmail! Lead status updated to PROPOSAL.');
        return;
      }

      const response = await leadsAPI.sendEmail(id, {
        to_email: recipientEmail,
        subject,
        body: emailContent,
      });

      if (response.data.success) {
        fetchLeadEmails();
        
        // Update lead status to PROPOSAL if not already
        if (lead.status !== 'proposal') {
          try {
            await leadsAPI.updateStatus(id, { status: 'proposal' });
            await fetchLeadDetails(); // Refresh lead data
          } catch (statusError) {
            console.error('Failed to update lead status:', statusError);
            // Don't show error to user as email was sent successfully
          }
        }
        
        alert('Email sent successfully! Lead status updated to PROPOSAL.');
      } else {
        const msg = response.data?.message || response.data?.error || 'Unknown error';
        alert('Mail could not be sent.\n\nIssue: ' + msg);
      }
    } catch (error) {
      console.error('Error sending email:', error);
      const msg = error.response?.data?.message || error.response?.data?.error || error.message || 'Unknown error';
      alert('Mail could not be sent.\n\nIssue: ' + msg);
    }
  };

  const handlePrint = (optionNum) => {
    // Print the quotation modal content
    const printContent = document.querySelector('.quotation-content');
    if (printContent) {
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html>
          <head>
            <title>Travel Quotation - ${quotationData?.itinerary?.itinerary_name || 'Itinerary'}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              .quotation-content { max-width: 800px; margin: 0 auto; }
              img { max-width: 100%; height: auto; }
              @media print {
                body { padding: 0; }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            ${printContent.innerHTML}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    } else {
      window.print();
    }
  };

  const handleDownloadSingleOptionPdf = async (optionNum) => {
    if (!quotationData || !optionNum) {
      alert('Please select an option first.');
      return;
    }

    try {
      const fullHtml = await generateEmailContent();
      let emailContent = extractBodyContent(fullHtml);

      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = emailContent;
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.width = '210mm'; // A4 width
      tempDiv.style.backgroundColor = '#ffffff';
      document.body.appendChild(tempDiv);

      const opt = {
        margin: [10, 10, 10, 10],
        filename: `Travel_Quotation_Option_${optionNum}_${quotationData?.itinerary?.itinerary_name || 'Itinerary'}_${formatLeadId(lead?.id)}_${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2,
          useCORS: true,
          logging: false,
          letterRendering: true
        },
        jsPDF: { 
          unit: 'mm', 
          format: 'a4', 
          orientation: 'portrait',
          compress: true
        },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      };

      await html2pdf().set(opt).from(tempDiv).save();
      document.body.removeChild(tempDiv);
      alert(`PDF downloaded successfully for Option ${optionNum}!`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try the Print option instead.');
    }
  };

  const handleSendWhatsApp = async (optionNum) => {
    if (!quotationData || !lead) {
      alert('Please load quotation first');
      return;
    }

    // Build WhatsApp message from quotation (all options)
    let message = `*Travel Quotation - ${quotationData.itinerary.itinerary_name || 'Itinerary'}*\n\n`;
    message += `Query ID: ${formatLeadId(lead.id)}\n`;
    message += `Destination: ${quotationData.itinerary.destinations || 'N/A'}\n`;
    message += `Duration: ${quotationData.itinerary.duration || 0} Days\n\n`;
    const allOptions = Object.keys(quotationData.hotelOptions || {}).sort((a, b) => parseInt(a) - parseInt(b));
    allOptions.forEach(optNum => {
      const hotels = quotationData.hotelOptions[optNum] || [];
      const totalPrice = hotels.reduce((sum, h) => sum + (parseFloat(h.price) || 0), 0);
      message += `*Option ${optNum}*\n`;
      hotels.forEach(hotel => {
        message += `• Day ${hotel.day}: ${hotel.hotelName || 'Hotel'} (${hotel.category || 'N/A'} Star)\n`;
        message += `  Room: ${hotel.roomName || 'N/A'} | Meal: ${hotel.mealPlan || 'N/A'}\n`;
      });
      message += `Total Price: ₹${totalPrice.toLocaleString('en-IN')}\n\n`;
    });
    message += `Best regards,\nTravelOps Team`;

    try {
      const response = await whatsappAPI.send(id, message);
      if (response.data.success) {
        fetchWhatsAppMessages();
        
        if (lead.status !== 'proposal') {
          try {
            await leadsAPI.updateStatus(id, { status: 'proposal' });
            await fetchLeadDetails();
          } catch (statusError) {
            console.error('Failed to update lead status:', statusError);
          }
        }
        
        alert('WhatsApp message sent successfully! Lead status updated to PROPOSAL.');
      } else {
        alert(response.data.message || 'Failed to send WhatsApp message');
      }
    } catch (error) {
      console.error('Error sending WhatsApp:', error);
      alert(error.response?.data?.message || 'Failed to send WhatsApp message');
    }
  };

  // Send option directly from card (Email / WhatsApp / Both) - loads quotation if needed
  const handleSendOptionFromCard = async (opt, channel) => {
    setSendDropdownOptId(null);
    if (!lead?.email && (channel === 'email' || channel === 'both')) {
      alert('Customer email is required. Please add email to the lead.');
      return;
    }
    if (!lead?.phone && (channel === 'whatsapp' || channel === 'both')) {
      alert('Customer phone is required for WhatsApp. Please add phone to the lead.');
      return;
    }
    setSendingOptionChannel(channel);
    try {
      const qData = quotationData && selectedProposal?.id === opt.id
        ? quotationData
        : await handleViewQuotation(opt, false);
      if (!qData) return;
      setQuotationData(qData);
      setSelectedProposal(opt);
      const optNum = opt.optionNumber?.toString() || Object.keys(qData.hotelOptions || {})[0];
      setSelectedOption(optNum);
      await new Promise(r => setTimeout(r, 50));
      if (channel === 'email' || channel === 'both') await handleSendMail(optNum);
      if (channel === 'whatsapp' || channel === 'both') await handleSendWhatsApp(optNum);
    } catch (err) {
      console.error('Send from card failed:', err);
      alert('Failed to send. ' + (err.message || ''));
    } finally {
      setSendingOptionChannel(null);
    }
  };

  // Download PDF directly from card - loads quotation if needed
  const handleDownloadPdfFromCard = async (opt) => {
    try {
      const qData = quotationData && selectedProposal?.id === opt.id
        ? quotationData
        : await handleViewQuotation(opt, false);
      if (!qData) return;
      setQuotationData(qData);
      setSelectedProposal(opt);
      const optNum = opt.optionNumber?.toString() || Object.keys(qData.hotelOptions || {})[0];
      setSelectedOption(optNum);
      await new Promise(r => setTimeout(r, 50));
      await handleDownloadSingleOptionPdf(optNum);
    } catch (err) {
      console.error('PDF download failed:', err);
      alert('Failed to download PDF. ' + (err.message || ''));
    }
  };

  const handleSendAllFromGroup = async (group, channel) => {
    if (!group?.options?.length) {
      alert('No options found for this itinerary.');
      return;
    }

    // Create WhatsApp message with all options
    let message = `*Travel Quotation - ${quotationData.itinerary.itinerary_name || 'Itinerary'}*\n\n`;
    message += `Query ID: ${formatLeadId(lead.id)}\n`;
    message += `Destination: ${quotationData.itinerary.destinations || 'N/A'}\n`;
    message += `Duration: ${quotationData.itinerary.duration || 0} Days\n\n`;

    const allOptions = Object.keys(quotationData.hotelOptions).sort((a, b) => parseInt(a) - parseInt(b));

    allOptions.forEach(optNum => {
      const hotels = quotationData.hotelOptions[optNum] || [];
      const totalPrice = hotels.reduce((sum, h) => sum + (parseFloat(h.price) || 0), 0);

      message += `*Option ${optNum}*\n`;
      message += `Hotels:\n`;

      hotels.forEach(hotel => {
        message += `• Day ${hotel.day}: ${hotel.hotelName || 'Hotel'} (${hotel.category || 'N/A'} Star)\n`;
        message += `  Room: ${hotel.roomName || 'N/A'} | Meal: ${hotel.mealPlan || 'N/A'}\n`;
      });

      message += `Total Price: ₹${totalPrice.toLocaleString('en-IN')}\n\n`;
    });

    message += `For detailed quotation with images, please check your email or contact us.\n\n`;
    message += `Best regards,\nTravelOps Team`;

    const phone = lead.phone?.replace(/[^0-9]/g, '') || '';
    if (phone) {
      const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
    } else {
      alert('Phone number not available for this lead.');
    }
  };

  // Generate email content for confirmed option only
  const generateConfirmedOptionEmailContent = async (confirmedOption) => {
    if (!confirmedOption || !quotationData) return '';

    // Load quotation data for the confirmed option
    await handleViewQuotation(confirmedOption);

    const templateId = await getSelectedTemplate();
    const allPolicies = await getAllPolicies();
    const itinerary = quotationData.itinerary;
    const confirmedOptionNum = confirmedOption.optionNumber.toString();
    const hotels = quotationData.hotelOptions[confirmedOptionNum] || [];
    const totalPrice = confirmedOption.price || hotels.reduce((sum, h) => sum + (parseFloat(h.price) || 0), 0);

    // Use the same template generation logic but only for confirmed option
    const allOptions = [confirmedOptionNum];
    const emailContent = await generateEmailContent();

    // Extract only the confirmed option section from the email content
    // For simplicity, we'll regenerate with only confirmed option
    return await generateEmailContentForOptions([confirmedOptionNum], templateId, allPolicies, itinerary, hotels, totalPrice);
  };

  // Helper function to generate email for specific options
  const generateEmailContentForOptions = async (optionNumbers, templateId, allPolicies, itinerary, hotels, totalPrice) => {
    const templateStyles = {
      'template-1': {
        headerBg: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
        optionBorder: '#2563eb',
        optionHeaderBg: '#2563eb',
        hotelCardBg: '#f0f9ff',
        priceBoxBg: '#dc2626',
        footerBg: '#1f2937'
      }
    };

    const styles = templateStyles[templateId] || templateStyles['template-1'];

    let htmlContent = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .header { background: ${styles.headerBg}; color: white; padding: 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 32px; }
            .content { padding: 30px; max-width: 800px; margin: 0 auto; }
            .itinerary-image { width: 100%; max-width: 600px; height: 300px; object-fit: cover; border-radius: 10px; margin: 20px auto; display: block; }
            .quote-details { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .option-section { border: 2px solid ${styles.optionBorder}; border-radius: 10px; padding: 25px; margin: 30px 0; background: white; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
            .option-header { background: ${styles.optionHeaderBg}; color: white; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
            .hotel-card { background: ${styles.hotelCardBg}; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid ${styles.optionBorder}; }
            .hotel-image { width: 120px; height: 120px; object-fit: cover; border-radius: 8px; float: left; margin-right: 15px; }
            .price-box { background: ${styles.priceBoxBg}; color: white; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0; font-size: 24px; font-weight: bold; }
            .footer { background: ${styles.footerBg}; color: white; padding: 20px; text-align: center; }
            table { width: 100%; border-collapse: collapse; margin: 15px 0; }
            td { padding: 8px; border-bottom: 1px solid #e5e7eb; }
            .label { font-weight: bold; color: #4b5563; }
            .confirmed-badge { background: #10b981; color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; margin-bottom: 15px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>TravelOps</h1>
            <p>Delhi, India | Email: info@travelops.com | Mobile: +91-9871023004</p>
          </div>
          
          <div class="content">
            <div class="confirmed-badge">✓ CONFIRMED ITINERARY</div>
            <h2 style="color: ${styles.optionBorder}; font-size: 28px;">Final Travel Itinerary</h2>
            
            ${itinerary.image ? `<img src="${itinerary.image}" alt="${itinerary.itinerary_name}" class="itinerary-image" />` : ''}
            
            <div class="quote-details">
              <h3 style="margin-top: 0;">Quote Details</h3>
              <table>
                <tr><td class="label">Query ID:</td><td>${formatLeadId(lead?.id)}</td></tr>
                <tr><td class="label">Destination:</td><td>${itinerary.destinations || 'N/A'}</td></tr>
                <tr><td class="label">Duration:</td><td>${itinerary.duration || 0} Nights & ${(itinerary.duration || 0) + 1} Days</td></tr>
                <tr><td class="label">Adults:</td><td>${lead?.adult || 1}</td></tr>
                <tr><td class="label">Children:</td><td>${lead?.child || 0}</td></tr>
              </table>
            </div>
            
            <div class="option-section">
              <div class="option-header">
                <h2 style="margin: 0; font-size: 24px;">Confirmed Option ${optionNumbers[0]}</h2>
              </div>
              
              <h3 style="color: #1e40af;">🏨 Hotels Included:</h3>
    `;

    hotels.forEach((hotel, idx) => {
      htmlContent += `
        <div class="hotel-card">
          ${hotel.image ? `<img src="${hotel.image}" alt="${hotel.hotelName}" class="hotel-image" />` : ''}
          <div style="margin-left: ${hotel.image ? '135px' : '0'};">
            <h4 style="margin-top: 0; color: #1e40af; font-size: 18px;">Day ${hotel.day}: ${hotel.hotelName || 'Hotel'}</h4>
            <p><strong>Category:</strong> ${hotel.category ? `${hotel.category} Star` : 'N/A'}</p>
            <p><strong>Room:</strong> ${hotel.roomName || 'N/A'}</p>
            <p><strong>Meal Plan:</strong> ${hotel.mealPlan || 'N/A'}</p>
            ${hotel.checkIn ? `<p><strong>Check-in:</strong> ${hotel.checkIn} ${hotel.checkInTime || ''}</p>` : ''}
            ${hotel.checkOut ? `<p><strong>Check-out:</strong> ${hotel.checkOut} ${hotel.checkOutTime || ''}</p>` : ''}
          </div>
          <div style="clear: both;"></div>
        </div>
      `;
    });

    htmlContent += `
              <div class="price-box">
                Total Package Price: ₹${totalPrice.toLocaleString('en-IN')}
              </div>
            </div>
          </div>
          
          ${generateAllPoliciesSection(allPolicies, {
      termsBg: '#f8f9fa',
      borderRadius: '10px',
      termsBorder: `2px solid ${styles.optionBorder}`,
      termsShadow: '0 5px 15px rgba(0,0,0,0.1)',
      termsTitleColor: styles.optionBorder,
      termsTitleSize: '18px',
      termsTextSize: '14px'
    })}
          
          <div class="footer">
            <p>Thank you for choosing TravelOps!</p>
            <p>For any queries, please contact us at info@travelops.com or +91-9871023004</p>
          </div>
        </body>
      </html>
    `;

    return htmlContent;
  };

  // Send confirmed option via email
  const handleSendConfirmedOptionEmail = async () => {
    const confirmedOption = getConfirmedOption();
    if (!confirmedOption) {
      alert('Please confirm an option first');
      return;
    }

    if (!lead || !lead.email) {
      alert('Client email not available');
      return;
    }

    // Load quotation data for confirmed option
    await handleViewQuotation(confirmedOption);

    const templateId = await getSelectedTemplate();
    const allPolicies = await getAllPolicies();
    const itinerary = quotationData.itinerary;
    const confirmedOptionNum = confirmedOption.optionNumber.toString();
    const hotels = quotationData.hotelOptions[confirmedOptionNum] || [];
    const totalPrice = confirmedOption.price || hotels.reduce((sum, h) => sum + (parseFloat(h.price) || 0), 0);

    const emailContent = await generateEmailContentForOptions(
      [confirmedOptionNum],
      templateId,
      allPolicies,
      itinerary,
      hotels,
      totalPrice
    );

    const subject = encodeURIComponent(`Confirmed Travel Itinerary - ${itinerary.itinerary_name || 'Itinerary'} - ${formatLeadId(lead.id)}`);

    navigator.clipboard.writeText(emailContent).then(() => {
      const mailtoLink = `mailto:${lead.email}?subject=${subject}&body=${encodeURIComponent('Please find your confirmed travel itinerary attached.')}`;
      window.open(mailtoLink);
      alert('Confirmed itinerary email content copied to clipboard! Paste it in your email client.');
    }).catch(() => {
      window.location.href = `mailto:${lead.email}?subject=${subject}&body=${encodeURIComponent('Please find your confirmed travel itinerary attached.')}`;
    });
  };

  // Send confirmed option via WhatsApp
  const handleSendConfirmedOptionWhatsApp = async () => {
    const confirmedOption = getConfirmedOption();
    if (!confirmedOption) {
      alert('Please confirm an option first');
      return;
    }

    if (!lead || !lead.phone) {
      alert('Client phone number not available');
      return;
    }

    // Load quotation data for confirmed option
    await handleViewQuotation(confirmedOption);

    const phone = lead.phone.replace(/[^0-9]/g, '');
    const confirmedOptionNum = confirmedOption.optionNumber.toString();
    const hotels = quotationData.hotelOptions[confirmedOptionNum] || [];
    const totalPrice = confirmedOption.price || hotels.reduce((sum, h) => sum + (parseFloat(h.price) || 0), 0);

    let message = `*✓ CONFIRMED TRAVEL ITINERARY*\n\n`;
    message += `*Travel Quotation - ${quotationData.itinerary.itinerary_name || 'Itinerary'}*\n\n`;
    message += `Query ID: ${formatLeadId(lead.id)}\n`;
    message += `Destination: ${quotationData.itinerary.destinations || 'N/A'}\n`;
    message += `Duration: ${quotationData.itinerary.duration || 0} Days\n\n`;
    message += `*Confirmed Option ${confirmedOptionNum}*\n`;
    message += `Hotels:\n`;

    hotels.forEach(hotel => {
      message += `• Day ${hotel.day}: ${hotel.hotelName || 'Hotel'} (${hotel.category || 'N/A'} Star)\n`;
      message += `  Room: ${hotel.roomName || 'N/A'} | Meal: ${hotel.mealPlan || 'N/A'}\n`;
    });

    message += `\n*Total Package Price: ₹${totalPrice.toLocaleString('en-IN')}*\n\n`;
    message += `This is your confirmed itinerary. For detailed quotation with images, please check your email.\n\n`;
    message += `Best regards,\nTravelOps Team`;

    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };


  const handleStatusChange = async (newStatus) => {
    try {
      await leadsAPI.updateStatus(id, newStatus);
      fetchLeadDetails();
    } catch (err) {
      console.error('Failed to update status:', err);
      alert('Failed to update status');
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

  if (!lead || (lead && typeof lead.id === 'undefined')) {
    return (
      <Layout>
        <div className="p-6">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            Lead not found
          </div>
          <button
            type="button"
            onClick={() => navigate('/leads')}
            className="mt-4 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Back to Queries
          </button>
        </div>
      </Layout>
    );
  }

  const assignedUser = users.find(u => u.id === lead.assigned_to);



  return (
    <Layout Header={() => null} padding={20}>
      <div className="p-6 " style={{ backgroundColor: '#D8DEF5', minHeight: '100vh' }}>
        {/* Header */}
        <div className="mb-2 rounded-lg   bg-white p-4 ">
          <div className="flex items-center  justify-between mb-4">
            <div className="flex flex-col  items-start gap-2">

              <div className="flex  items-center gap-2">
                <button
                  onClick={() => navigate('/leads')}
                  className="text-gray-700 hover:text-gray-900"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <h1 className="text-xl font-[700] text-gray-800">Query ID: {formatLeadId(lead.id)}</h1>
                {lead.priority === 'hot' && (
                  <span className="px-2 py-0.5 text-xs font-semibold bg-red-500 text-white rounded">HOT</span>
                )}
              </div>
              <div className="text-sm text-gray-600 mb-4">
                <b>Created</b>: {formatDate(lead.created_at)} | <b>Last Updated</b>: {formatDateTime(lead.updated_at)}
              </div>
            </div>
          </div>




        </div>

        {/* Main Content */}
        <div className="grid grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="col-span-1 p-6 shadow rounded-lg bg-white space-y-6">
            {/* Query Information */}
            <div className="  ">
              <h2 className="text-xl font-[700] text-gray-800 mb-4">Query Information</h2>
              <div
                className="rounded-2xl border border-gray-200 p-4 space-y-4 text-sm"
                style={{
                  background: `
          linear-gradient(rgba(255,255,255,0.8), rgba(255,255,255,0.8)),
          url(/images/quiries/detailsback.png)
        `,
                  backgroundRepeat: "no-repeat",
                  backgroundSize: "cover",
                  backdropFilter: "blur(6px)"
                }}
              >
                {/* ROW */}
                <DetailRow
                  icon={<MapPin className="text-yellow-500" size={18} />}
                  label="Destination"
                  value={lead.destination || "N/A"}
                />

                <DetailRow
                  icon={<Calendar className="text-sky-500" size={18} />}
                  label="From Date"
                  value={
                    lead.travel_start_date
                      ? formatDate(lead.travel_start_date)
                      : "N/A"
                  }
                />

                <DetailRow
                  icon={<CalendarDays className="text-red-500" size={18} />}
                  label="To Date"
                  value={
                    lead.travel_end_date
                      ? formatDate(lead.travel_end_date)
                      : lead.travel_start_date
                        ? formatDate(lead.travel_start_date)
                        : "N/A"
                  }
                />

                <DetailRow
                  icon={<Calendar className="text-teal-600" size={18} />}
                  label="Travel Month"
                  value={
                    lead.travel_start_date
                      ? getTravelMonth(lead.travel_start_date)
                      : "N/A"
                  }
                />

                <DetailRow
                  icon={<Leaf className="text-green-600" size={18} />}
                  label="Lead Source"
                  value={lead.source || "N/A"}
                />

                <DetailRow
                  icon={<Briefcase className="text-purple-600" size={18} />}
                  label="Services"
                  value={lead.service || "Activities only"}
                />

                {/* Pax */}
                <div className="flex items-start gap-3">
                  <Users className="text-black mt-[2px]" size={18} />
                  <div className="flex gap-2 flex-wrap">
                    <span className="text-blue-600 font-medium">Pax:</span>
                    <span className="text-gray-900">
                      Adult: {lead.adult || 1}
                    </span>
                    <span className="text-blue-600">
                      Child: {lead.child || 0}
                    </span>
                    <span className="text-blue-600">
                      Infant: {lead.infant || 0}
                    </span>
                  </div>
                </div>

                <DetailRow
                  icon={<UserCheck className="text-orange-500" size={18} />}
                  label="Assign To"
                  value={assignedUser?.name || "N/A"}
                />

                {lead.remark && (
                  <DetailRow
                    icon={<Briefcase className="text-gray-600" size={18} />}
                    label="Description"
                    value={lead.remark}
                  />
                )}
              </div>
            </div>

            {/* Related Customer */}
          
            <div className="bg-white rounded-xl shadow-sm border p-5">
              <h2 className="text-lg font-semibold text-gray-800 mb-3">
                Related Customer
              </h2>

              <div className="flex items-center justify-between gap-6">
                {/* LEFT INFO */}
                <div className="flex-1">
                  <div className="text-sm text-gray-500 mb-1">
                    {lead.client_title ? `${lead.client_title} ` : 'Mr. '}
                    {lead.client_name}
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                    <Smartphone className="w-4 h-4 text-gray-700" />
                    <span>{lead.phone || 'N/A'}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="w-4 h-4 text-gray-700" />
                    <span>{lead.email || 'N/A'}</span>
                  </div>
                </div>

                {/* DIVIDER */}
                <div className="h-16 w-px bg-gray-300"></div>

                {/* RIGHT ACTIONS */}
                <div className="flex flex-col gap-3 min-w-[200px]">
                  <a
                    href={lead.phone ? `tel:${lead.phone}` : '#'}
                    className="flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium py-2 px-4 rounded-full transition"
                  >
                    <Phone className="w-4 h-4" />
                    {lead.phone || 'Call'}
                  </a>

                  <a
                    href={lead.email ? `mailto:${lead.email}` : '#'}
                    className="flex items-center justify-center gap-2 bg-[#E78175] hover:bg-[#f79176] text-white text-sm font-medium py-2 px-4 rounded-full transition"
                  >
                    <Mail className="w-4 h-4" />
                    {lead.email || 'Email'}
                  </a>
                </div>
              </div>
            </div>

            {/* Notes */}
              <div className={` rounded-[28px] relative border-2 border-gray-200 p-5 ${showNoteInput  ? 'bg-gray-400' :'bg-white'}`}>
                    {/* TITLE */}
                    <h2 className="text-lg font-semibold text-black mb-6">
                      Related Company
                    </h2>

                    <div className="flex justify-between items-start">
                      {/* LEFT SIDE */}
                      <div className="space-y-6">
                        {/* COMPANY NAME */}
                        <div className="text-sm font-medium text-black">
                          {lead.company_name || 'Triplive b2b'}
                        </div>

                        {/* NOTES LABEL + ADD BUTTON - at top */}
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-black">Notes :</span>

                          {!showNoteInput && (
                            <button
                              onClick={() => setShowNoteInput(true)}
                              className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-full text-sm font-medium transition"
                            >
                              <Plus className="w-5 h-5" />
                              Add Note
                            </button>
                          )}
                        </div>

                        {/* NOTES LIST */}
                        {notes.length > 0 && (
                          <div className="space-y-3 mt-3">
                            {notes
                              .slice()
                              .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                              .map((note) => (
                                <div
                                  key={note.id}
                                  className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm"
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <p className="text-gray-800 whitespace-pre-wrap flex-1">{note.content}</p>
                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingNoteId(note.id);
                                          setNoteText(note.content || '');
                                          setShowNoteInput(true);
                                        }}
                                        className="text-gray-500 hover:text-gray-800"
                                        title="Edit"
                                      >
                                        <Pencil className="h-4 w-4" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteFollowup(note.id)}
                                        className="text-red-500 hover:text-red-700"
                                        title="Delete"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                    </div>
                                  </div>
                                  <p className="text-gray-500 text-xs mt-2">
                                    {note.created_by} • {note.created_at ? new Date(note.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                                  </p>
                                </div>
                              ))}
                          </div>
                        )}

                        {/* NOTE INPUT */}
                        {showNoteInput && (
                          <div className="w-[420px] bottom-0 z-10 absolute">
                            <textarea
                              value={noteText}
                              onChange={(e) => setNoteText(e.target.value)}
                              placeholder="Type Note Here"
                              rows={3}
                              className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />

                            <div className="flex justify-end gap-3 mt-3">
                              <button
                                onClick={() => {
                                  setShowNoteInput(false);
                                  setNoteText('');
                                  setEditingNoteId(null);
                                }}
                                className="text-gray-600 hover:text-gray-800 text-sm"
                              >
                                Cancel
                              </button>

                              <button
                                onClick={handleAddNote}
                                disabled={addingNote}
                                className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-1.5 rounded-full text-sm font-medium disabled:opacity-50"
                              >
                                {addingNote ? 'Saving...' : (editingNoteId ? 'Update Note' : 'Add Note')}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* RIGHT SIDE */}
                      <div className="text-right space-y-8">
                        {/* NOTES STATUS */}
                        <div className="text-sm text-gray-400 font-light">
                          {notes.length === 0 ? 'No Notes Yet..' : `${notes.length} Notes`}
                        </div>
                      </div>
                    </div>
                </div>
          </div>

          {/* Right Column */}
          <div className="col-span-2   p-4 bg-white rounded-lg">
            {/* Tabs */}
            <div className="bg-white  rounded-lg ">

              <div className=" p-4 flex justify-center border-gray-200">
                <div className="flex rounded-full w-fit custom-scroll overflow-x-auto">
                  {[
                    { key: 'proposals', label: 'Proposals' },
                    { key: 'mails', label: 'Mails' },
                    { key: 'whatsapp', label: 'WhatsApp' },
                    { key: 'followups', label: "Followup's" },
                    { key: 'suppComm', label: 'Supp. Comm.' },
                    { key: 'postSales', label: 'Post Sales' },
                    { key: 'voucher', label: 'Voucher' },
                    { key: 'docs', label: 'Docs.' },
                    { key: 'invoice', label: 'Invoice' },
                    { key: 'billing', label: 'Billing' },
                    { key: 'history', label: 'History' }
                  ].map(({ key, label },index) => (
                    <button
                      key={key}
                      onClick={() => setActiveTab(key)}
                      className={`px-4  py-3 ${index==0  ?  "border-l rounded-l-full " : index == 10 ? " border-r rounded-r-full":null}  border-l-0 border   text-sm font-medium whitespace-nowrap ${activeTab === key
                        ? 'bg-[#333] text-white'
                        : 'text-gray-600 bg-white hover:text-gray-900'
                        }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === 'proposals' ? (
                  <div className="flex flex-col gap-6 w-full max-w-4xl">
                    {/* Confirmed Option Banner – full width, no overlap */}
                    {getConfirmedOption() && (() => {
                      const confirmedOption = getConfirmedOption();
                      return (
                        <div className="w-full bg-green-50 border-l-4 border-green-500 rounded-r-xl p-4 sm:p-5 shadow-sm">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="flex items-center gap-3 sm:gap-4">
                              <div className="flex-shrink-0 bg-green-500 rounded-full p-2.5 sm:p-3">
                                <CheckCircle className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2 mb-0.5">
                                  <h3 className="font-bold text-green-800 text-lg sm:text-xl">
                                    Option {confirmedOption.optionNumber} Confirmed
                                  </h3>
                                  <span className="px-2.5 py-0.5 bg-green-500 text-white text-xs font-bold rounded-full">
                                    CONFIRMED
                                  </span>
                                </div>
                                <p className="text-sm text-green-700">
                                  Final itinerary is ready to share with the client
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2 sm:gap-3 flex-shrink-0">
                              <button
                                onClick={handleSendConfirmedOptionEmail}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm font-semibold"
                              >
                                <Mail className="h-4 w-4" />
                                Share Email
                              </button>
                              <button
                                onClick={handleSendConfirmedOptionWhatsApp}
                                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2 text-sm font-semibold"
                              >
                                <MessageCircle className="h-4 w-4" />
                                Share WhatsApp
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                   

                    {/* Proposals List – single card with all options inside */}
                    {proposals.length === 0 ? (
                      <div className="text-center w-full py-12 text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="mb-2">No proposals added yet</p>
                        <p className="text-sm">Click "Insert itinerary" to add an itinerary as a proposal</p>
                      </div>
                    ) : (() => {
                      const first = proposals[0];
                      const cardTitle = (lead?.destination || first?.itinerary_name || 'Proposals').toString().trim() || 'Proposals';
                      const cardImage = getDisplayImageUrl(first?.image) || first?.image || null;
                      const cardDestination = first?.destination || lead?.destination || '';

                      return (
                        <div className="w-full">
                          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                            {/* Card header – one image/title block (click to edit itinerary) */}
                            <div
                              className="relative h-60 w-full overflow-hidden rounded-t-xl cursor-pointer"
                              onClick={() => {
                                if (first?.itinerary_id) {
                                  navigate(`/itineraries/${first.itinerary_id}`);
                                } else if (proposals[0]?.itinerary_id) {
                                  navigate(`/itineraries/${proposals[0].itinerary_id}`);
                                } else {
                                  alert('Itinerary ID not found for this proposal.');
                                }
                              }}
                            >
                              {cardImage ? (
                                <img src={cardImage} alt={cardTitle} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              ) : (
                                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                  <span className="text-gray-500 font-semibold">Proposals</span>
                                </div>
                              )}
                              <div className="absolute bottom-0 left-0 right-0 bg-black/55 p-4">
                                <h3 className="text-xl font-semibold text-white">{cardTitle}</h3>
                                {cardDestination && (
                                  <p className="text-sm text-gray-200">{cardDestination}</p>
                                )}
                              </div>
                            </div>

                            {/* Single card body – all options inside */}
                            <div className="p-5">
                              <div className="text-lg text-blue-500 font-medium mb-2">
                                Pax: <span className="font-semibold">{lead?.adult ?? 1}</span> Adult(s) – <span className="font-semibold">{lead?.child ?? 0}</span> Child(s)
                              </div>
                              <div className="text-sm text-gray-700 mb-1">
                                <strong>Date:</strong> {lead?.travel_start_date ? formatDateForDisplay(lead.travel_start_date) : 'N/A'} &nbsp;
                                <strong>Till:</strong> {lead?.travel_end_date ? formatDateForDisplay(lead.travel_end_date) : 'N/A'}
                              </div>
                              <hr className="my-4" />

                              {/* Package options – professional card layout */}
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                                {proposals.map((opt) => {
                                  const displayPrice = opt.price ?? opt.pricing?.finalClientPrice ?? 0;
                                  return (
                                    <div
                                      key={opt.id}
                                      className={`rounded-xl border-2 overflow-hidden shadow-sm transition-all ${opt.confirmed ? 'border-green-500 bg-green-50/50 shadow-green-100' : 'border-gray-200 bg-white hover:shadow-md'}`}
                                    >
                                      {/* Card header */}
                                      <div className="bg-blue-600 px-4 py-2.5 flex items-center justify-between">
                                        <span className="text-white font-semibold">
                                          {opt.optionNumber != null ? `Option ${opt.optionNumber}` : (opt.itinerary_name || 'Itinerary')}
                                        </span>
                                        {opt.confirmed && (
                                          <span className="px-2 py-0.5 bg-green-500 text-white text-xs font-semibold rounded-full">Confirmed</span>
                                        )}
                                      </div>
                                      {/* Card body */}
                                      <div className="p-4">
                                        <div className="mb-4">
                                          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-0.5">Total Price</p>
                                          <p className="text-2xl font-bold text-gray-900">₹{Number(displayPrice).toLocaleString('en-IN')}</p>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                          {opt.confirmed ? (
                                            <span className="w-full text-center px-3 py-2 bg-green-100 text-green-700 text-sm font-semibold rounded-lg border border-green-300">
                                              Confirmed
                                            </span>
                                          ) : (
                                            <button
                                              type="button"
                                              onClick={(e) => { e.stopPropagation(); handleConfirmOption(opt.id); }}
                                              className="w-full bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-3 py-2 rounded-lg transition-colors"
                                            >
                                              Make Confirm
                                            </button>
                                          )}
                                          <div className="relative">
                                            <button
                                              type="button"
                                              onClick={(e) => { e.stopPropagation(); setSendDropdownOptId(sendDropdownOptId === opt.id ? null : opt.id); }}
                                              disabled={sendingOptionChannel}
                                              className="w-full bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-3 py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
                                            >
                                              <Send className="h-4 w-4" />
                                              {sendingOptionChannel ? 'Sending…' : 'Send'}
                                              <ChevronDown className="h-4 w-4" />
                                            </button>
                                            {sendDropdownOptId === opt.id && (
                                              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 py-1">
                                                <button type="button" onClick={(e) => { e.stopPropagation(); handleSendOptionFromCard(opt, 'email'); }} className="w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center gap-2 text-sm">
                                                  <Mail className="h-4 w-4 text-blue-600" /> Email pe bhejo
                                                </button>
                                                <button type="button" onClick={(e) => { e.stopPropagation(); handleSendOptionFromCard(opt, 'whatsapp'); }} className="w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center gap-2 text-sm">
                                                  <MessageCircle className="h-4 w-4 text-green-600" /> WhatsApp pe bhejo
                                                </button>
                                                <button type="button" onClick={(e) => { e.stopPropagation(); handleSendOptionFromCard(opt, 'both'); }} className="w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center gap-2 text-sm">
                                                  <Send className="h-4 w-4" /> Dono pe bhejo (Email + WhatsApp)
                                                </button>
                                              </div>
                                            )}
                                          </div>
                                          <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); handleDownloadPdfFromCard(opt); }}
                                            className="w-full bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold px-3 py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
                                          >
                                            <Download className="h-4 w-4" />
                                            Download PDF
                                          </button>
                                          <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); handleViewQuotation(opt); }}
                                            className="w-full bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold px-3 py-2 rounded-lg transition-colors"
                                          >
                                            View Quotation
                                          </button>
                                          {opt.itinerary_id && (
                                            <button
                                              type="button"
                                              onClick={(e) => { e.stopPropagation(); navigate(`/itineraries/${opt.itinerary_id}`); }}
                                              className="w-full text-gray-600 hover:text-gray-800 hover:bg-gray-100 text-sm font-medium px-3 py-2 rounded-lg border border-gray-300 transition-colors"
                                            >
                                              Edit
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>

                              {/* Delete all proposals for this lead */}
                              <div className="flex justify-end">
                                <button
                                  onClick={() => {
                                    if (window.confirm('Remove all proposals from this lead?')) {
                                      saveProposals([]);
                                    }
                                  }}
                                  className="text-red-600 hover:text-red-700 text-sm font-medium"
                                >
                                  Remove all proposals
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Create / Insert buttons – full width row, no overlap */}
                    <div className="flex flex-wrap items-center gap-3 pt-2">
                      <button
                        onClick={handleCreateItinerary}
                        className="bg-[#3F8CFF] text-white px-6 py-2.5 rounded-lg hover:bg-[#2d7ae8] flex items-center gap-2 font-medium text-sm"
                      >
                        <Plus className="h-4 w-4" />
                        Create itinerary
                      </button>
                      <button
                        onClick={handleInsertItinerary}
                        className="bg-[#E78175] text-white px-6 py-2.5 rounded-lg hover:bg-[#d9706a] flex items-center gap-2 font-medium text-sm"
                      >
                        <Upload className="h-4 w-4" />
                        Insert itinerary
                      </button>
                    </div>
                  </div>
                ):
                activeTab === 'mails' ? (
                  <div className="space-y-4">
                    {/* Header with Compose, Sync Inbox, and Customer Email */}
                    <div className="flex flex-wrap items-center gap-4 mb-6">
                      <button
                        onClick={openComposeModal}
                        className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium shadow-md"
                      >
                        <Mail className="h-5 w-5" />
                        Compose
                      </button>
                      {user?.google_token && (
                        <button
                          type="button"
                          onClick={handleSyncInbox}
                          disabled={syncingInbox}
                          className="bg-gray-100 text-gray-700 px-4 py-2.5 rounded-lg hover:bg-gray-200 flex items-center gap-2 font-medium border border-gray-300 disabled:opacity-60"
                        >
                          {syncingInbox ? (
                            <span className="animate-spin rounded-full h-4 w-4 border-2 border-gray-500 border-t-transparent" />
                          ) : (
                            <RefreshCw className="h-4 w-4" />
                          )}
                          {syncingInbox ? 'Syncing...' : 'Sync inbox'}
                        </button>
                      )}
                      {lead?.email && (
                        <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 rounded-lg border border-gray-200">
                          <span className="text-gray-500 text-sm">ℹ</span>
                          <span className="text-gray-700 font-medium">{lead.email}</span>
                        </div>
                      )}
                    </div>
                    {user?.google_token && (
                      <p className="text-sm text-gray-600 mb-2">
                        Received and reply emails appear in &quot;Gmail Conversations&quot; when you connect Gmail in Settings and use &quot;Sync inbox&quot; (or they sync automatically every 5 minutes).
                      </p>
                    )}

                    {/* Emails List */}
                    {loadingEmails || loadingGmail ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    ) : (leadEmails.length === 0 && gmailEmails.length === 0) ? (
                      <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
                        <Mail className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                        <p>No mails yet</p>
                        <p className="text-sm mt-1">Click "Compose" to send your first email to the client</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {/* Gmail Conversations Section */}
                        {gmailEmails.length > 0 && (
                          <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-red-500"></div>
                              Gmail Conversations
                            </h3>
                            <div className="space-y-3">
                              {/* Group by thread_id */}
                              {Object.values(gmailEmails.reduce((acc, email) => {
                                if (!acc[email.thread_id]) acc[email.thread_id] = [];
                                acc[email.thread_id].push(email);
                                return acc;
                              }, {})).map((thread, threadIdx) => {
                                const sorted = [...thread].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
                                const latestEmail = thread[0];

                                return (
                                  <div key={latestEmail.thread_id} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                    <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                                      <div className="flex items-center gap-3">
                                        <div className="bg-red-100 p-2 rounded-lg">
                                          <Mail className="h-4 w-4 text-red-600" />
                                        </div>
                                        <div>
                                          <p className="font-semibold text-gray-800">{latestEmail.subject}</p>
                                          <p className="text-xs text-gray-500">
                                            {thread.length} message{thread.length > 1 ? 's' : ''} • Last message {new Date(latestEmail.created_at).toLocaleString()}
                                          </p>
                                        </div>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => openReplyModal(thread)}
                                        className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                                      >
                                        <Reply className="h-4 w-4" />
                                        Reply
                                      </button>
                                    </div>
                                    <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
                                      {sorted.map((email) => (
                                        <div key={email.id} className={`p-4 ${email.direction === 'inbound' ? 'bg-white' : 'bg-blue-50/50'}`}>
                                          <div className="flex justify-between items-start mb-2">
                                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${email.direction === 'inbound' ? 'bg-gray-100 text-gray-600' : 'bg-blue-100 text-blue-600'}`}>
                                              {email.direction === 'inbound' ? 'Received' : 'Sent'}
                                            </span>
                                            <span className="text-xs text-gray-400">
                                              {new Date(email.created_at).toLocaleString()}
                                            </span>
                                          </div>
                                          <div
                                            className="text-sm text-gray-800 prose prose-sm max-w-none break-words"
                                            dangerouslySetInnerHTML={{
                                              __html: (() => {
                                                const raw = email.body || '—';
                                                const isHtml = /<[a-z][\s\S]*>/i.test(raw);
                                                const processed = isHtml ? rewriteHtmlImageUrls(sanitizeEmailHtmlForDisplay(raw)) : raw.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br/>');
                                                return processed;
                                              })()
                                            }}
                                          />
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* System Emails Section */}
                        {leadEmails.length > 0 && (
                          <div className="space-y-4 pt-4 border-t border-gray-200">
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              System Logged Emails
                            </h3>
                            <div className="space-y-3">
                              {leadEmails.map((email) => (
                                <div
                                  key={email.id}
                                  className="flex items-start gap-4 p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                                >
                                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                    <Send className="h-4 w-4 text-blue-600" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="font-medium text-gray-800 truncate">{email.to_email}</span>
                                      {email.status === 'failed' && (
                                        <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded">Failed</span>
                                      )}
                                    </div>
                                    <p className="text-blue-600 font-medium truncate">{email.subject}</p>
                                    <div className="text-sm text-gray-500 truncate mt-1" dangerouslySetInnerHTML={{ __html: rewriteHtmlImageUrls(sanitizeEmailHtmlForDisplay(email.body || '')) }}></div>
                                  </div>
                                  <div className="flex-shrink-0 text-right">
                                    <p className="text-sm text-gray-500">
                                      {new Date(email.created_at).toLocaleDateString('en-IN')}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">
                                      by {email.user?.name || 'System'}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
                : activeTab === 'whatsapp' ? (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600 mb-4">Sent and received WhatsApp messages for this lead will appear here.</p>
                    {whatsappMessages.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        No WhatsApp messages yet
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {whatsappMessages.map((msg, idx) => (
                          <div key={msg.id || idx} className="bg-white border border-gray-200 rounded-lg p-4 text-sm">
                            <div className="text-gray-500 text-xs mb-1">
                              {msg.created_at ? new Date(msg.created_at).toLocaleString() : ''}
                              {msg.direction ? ` · ${msg.direction}` : ''}
                            </div>
                            <div className="text-gray-800 whitespace-pre-wrap">{msg.message || msg.body || msg.text || '—'}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
                : activeTab === 'followups' ? (
                  <div>
                    {/* Header with Add Button */}
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-gray-800">Followup's / Task</h3>
                      <button
                        onClick={() => {
                          setEditingFollowupId(null);
                          const today = new Date();
                          const dd = String(today.getDate()).padStart(2, '0');
                          const mm = String(today.getMonth() + 1).padStart(2, '0');
                          const yyyy = today.getFullYear();
                          const formattedDate = `${dd}-${mm}-${yyyy}`;

                          setFollowupFormData({
                            type: 'Task',
                            description: '',
                            reminder_date: formattedDate,
                            reminder_time: '1:00 PM',
                            set_reminder: 'Yes'
                          });
                          setShowFollowupModal(true);
                        }}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                        + Add Task
                      </button>
                    </div>

                    {/* Followups List */}
                    {followups.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        No Task
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {followups
                          .sort((a, b) => {
                            // Sort by reminder_date and reminder_time
                            const dateA = new Date(`${a.reminder_date} ${a.reminder_time || '00:00:00'}`);
                            const dateB = new Date(`${b.reminder_date} ${b.reminder_time || '00:00:00'}`);
                            return dateA - dateB;
                          })
                          .map((followup) => {
                            const reminderDate = new Date(`${followup.reminder_date} ${followup.reminder_time || '00:00:00'}`);
                            const isOverdue = reminderDate < new Date() && !followup.is_completed;
                            const isToday = reminderDate.toDateString() === new Date().toDateString() && !followup.is_completed;

                            return (
                              <div
                                key={followup.id}
                                className={`border rounded-lg p-4 ${followup.is_completed
                                  ? 'bg-gray-50 border-gray-200'
                                  : isOverdue
                                    ? 'bg-red-50 border-red-200'
                                    : isToday
                                      ? 'bg-yellow-50 border-yellow-200'
                                      : 'bg-white border-gray-200'
                                  }`}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                      <Calendar className={`h-5 w-5 ${followup.is_completed
                                        ? 'text-gray-400'
                                        : isOverdue
                                          ? 'text-red-500'
                                          : isToday
                                            ? 'text-yellow-600'
                                            : 'text-blue-500'
                                        }`} />
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <span className="font-semibold text-gray-800">
                                            {new Date(followup.reminder_date).toLocaleDateString('en-IN', {
                                              day: '2-digit',
                                              month: 'short',
                                              year: 'numeric'
                                            })}
                                          </span>
                                          {followup.reminder_time && (
                                            <>
                                              <span className="text-gray-400">•</span>
                                              <div className="flex items-center gap-1 text-gray-600">
                                                <Clock className="h-4 w-4" />
                                                <span>
                                                  {convertTo12Hour(followup.reminder_time)}
                                                </span>
                                              </div>
                                            </>
                                          )}
                                        </div>
                                        {(followup.remark || followup.description) && (
                                          <p className="text-gray-700 mt-2">{followup.remark || followup.description}</p>
                                        )}
                                        <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                                          <span>Created by: {followup.user?.name || 'Unknown'}</span>
                                          <span>•</span>
                                          <span>
                                            {new Date(followup.created_at).toLocaleDateString('en-IN', {
                                              day: '2-digit',
                                              month: 'short',
                                              year: 'numeric',
                                              hour: '2-digit',
                                              minute: '2-digit'
                                            })}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 ml-4">
                                    {isOverdue && !followup.is_completed && (
                                      <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded">
                                        Overdue
                                      </span>
                                    )}
                                    {isToday && !followup.is_completed && (
                                      <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded">
                                        Today
                                      </span>
                                    )}
                                    {!followup.is_completed && (
                                      <>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            // Backend may return ISO date with time; normalize to YYYY-MM-DD first
                                            const rawDate = followup.reminder_date ? String(followup.reminder_date).slice(0, 10) : '';
                                            const parts = rawDate.split('-'); // YYYY-MM-DD
                                            const ddmmyyyy = parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : '';
                                            setEditingFollowupId(followup.id);
                                            setFollowupFormData({
                                              type: 'Task',
                                              description: followup.remark || '',
                                              reminder_date: ddmmyyyy,
                                              reminder_time: followup.reminder_time ? convertTo12Hour(followup.reminder_time) : '1:00 PM',
                                              set_reminder: 'Yes',
                                            });
                                            setShowFollowupModal(true);
                                          }}
                                          className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded hover:bg-gray-200"
                                          title="Edit"
                                        >
                                          <Pencil className="h-3.5 w-3.5" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteFollowup(followup.id)}
                                          className="px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded hover:bg-red-200"
                                          title="Delete"
                                        >
                                          <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                      </>
                                    )}
                                    {followup.is_completed ? (
                                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded flex items-center gap-1">
                                        <CheckCircle className="h-3 w-3" />
                                        Completed
                                      </span>
                                    ) : (
                                      <button
                                        onClick={async () => {
                                          try {
                                            await followupsAPI.complete(followup.id);
                                            await fetchLeadDetails();
                                          } catch (err) {
                                            console.error('Failed to complete followup:', err);
                                            alert(err.response?.data?.message || 'Failed to mark as completed');
                                          }
                                        }}
                                        className="px-3 py-1 bg-green-600 text-white text-xs font-semibold rounded hover:bg-green-700 transition-colors"
                                      >
                                        Mark Complete
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>
                )
                : activeTab === 'suppComm' ? (
                  <div className="grid grid-cols-3 gap-6">
                    {/* Left Panel - Email Form */}
                    <div className="col-span-2">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Supplier Communication</h3>

                      {/* Subject */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Subject
                        </label>
                        <input
                          type="text"
                          value={supplierEmailForm.subject}
                          onChange={(e) => setSupplierEmailForm({ ...supplierEmailForm, subject: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter subject"
                        />
                      </div>

                      {/* CC Email */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          CC Email
                        </label>
                        <input
                          type="email"
                          value={supplierEmailForm.cc_email}
                          onChange={(e) => setSupplierEmailForm({ ...supplierEmailForm, cc_email: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter CC email (optional)"
                        />
                      </div>

                      {/* Email Body */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email Body
                        </label>
                        <textarea
                          value={supplierEmailForm.body}
                          onChange={(e) => setSupplierEmailForm({ ...supplierEmailForm, body: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          rows="12"
                          placeholder="Enter email body..."
                        />
                      </div>

                      {/* Enquiry Details Table */}
                      {lead && (
                        <div className="mb-4 border border-gray-200 rounded-lg p-4 bg-gray-50">
                          <h4 className="font-semibold text-gray-800 mb-3">Enquiry Detail</h4>
                          <table className="w-full text-sm">
                            <tbody>
                              <tr className="border-b border-gray-200">
                                <td className="py-2 font-medium text-gray-700">Customer Name</td>
                                <td className="py-2 text-gray-600">
                                  {lead.client_title || 'Mr.'} {lead.client_name}
                                </td>
                                <td className="py-2 font-medium text-gray-700">Enquiry ID</td>
                                <td className="py-2 text-gray-600">{lead.query_id || lead.id || id}</td>
                                <td className="py-2 font-medium text-gray-700">Enquiry For</td>
                                <td className="py-2 text-gray-600">
                                  {getConfirmedOption()?.itinerary_name || 'Full package'}
                                </td>
                              </tr>
                              <tr>
                                <td className="py-2 font-medium text-gray-700">Check-In</td>
                                <td className="py-2 text-gray-600">
                                  {lead.travel_start_date ? formatDateForDisplay(lead.travel_start_date) : 'N/A'}
                                </td>
                                <td className="py-2 font-medium text-gray-700">Check-Out</td>
                                <td className="py-2 text-gray-600">
                                  {lead.travel_end_date ? formatDateForDisplay(lead.travel_end_date) : 'N/A'}
                                </td>
                                <td className="py-2 font-medium text-gray-700">Nights</td>
                                <td className="py-2 text-gray-600">
                                  {lead.travel_start_date && lead.travel_end_date ?
                                    Math.ceil(Math.abs(new Date(lead.travel_end_date) - new Date(lead.travel_start_date)) / (1000 * 60 * 60 * 24)) : 'N/A'}
                                </td>
                              </tr>
                            </tbody>
                          </table>

                          {/* Hotel Details */}
                          {getConfirmedOption()?.hotels && getConfirmedOption().hotels.length > 0 && (
                            <div className="mt-4">
                              <h5 className="font-semibold text-gray-800 mb-2">Hotel Requirements:</h5>
                              <div className="space-y-2">
                                {getConfirmedOption().hotels.map((hotel, index) => (
                                  <div key={index} className="bg-white p-2 rounded border border-gray-200">
                                    <div className="text-sm">
                                      <span className="font-medium">{hotel.hotel_name || 'Hotel'}</span>
                                      {hotel.room_type && <span> - {hotel.room_type}</span>}
                                      {hotel.meal_plan && <span> - {hotel.meal_plan}</span>}
                                      {hotel.price && <span className="text-blue-600 ml-2">₹{hotel.price}</span>}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Send Button */}
                      <button
                        onClick={handleSendSupplierEmail}
                        disabled={sendingEmail || (
                          selectedSuppliers.length === 0 &&
                          selectedHotels.length === 0 &&
                          (selectedVehicles.length === 0 || !vehiclesFromProposals.some(v => selectedVehicles.includes(v.id) && v.email && v.email.trim()))
                        )}
                        className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold"
                      >
                        <Send className="h-5 w-5" />
                        {sendingEmail ? 'Sending...' : `Send Mail To Selected (${selectedSuppliers.length} Suppliers${selectedHotels.length > 0 ? `, ${selectedHotels.length} Hotels` : ''}${selectedVehicles.length > 0 ? `, ${selectedVehicles.length} Vehicles` : ''})`}
                      </button>
                    </div>

                    {/* Right Panel - Supplier Selection */}
                    <div className="col-span-1 border-l border-gray-200 pl-6">
                      <div className="mb-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectAllSuppliers}
                            onChange={(e) => handleSelectAllSuppliers(e.target.checked)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="font-semibold text-gray-800">Select Supplier</span>
                        </label>
                      </div>

                      <div className="max-h-[300px] overflow-y-auto space-y-3 mb-6 pb-4 border-b border-gray-200">
                        {suppliers.length === 0 ? (
                          <div className="text-gray-500 text-sm">No suppliers available</div>
                        ) : (
                          suppliers.map((supplier) => (
                            <div key={supplier.id} className="flex items-start gap-2">
                              <input
                                type="checkbox"
                                checked={selectedSuppliers.includes(supplier.id)}
                                onChange={() => handleSelectSupplier(supplier.id)}
                                className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              />
                              <div className="flex-1">
                                <div className="font-medium text-gray-800 text-sm">
                                  {supplier.company_name || supplier.company}
                                </div>
                                <div className="text-xs text-gray-600">
                                  {supplier.title || ''} {supplier.name || `${supplier.first_name || ''} ${supplier.last_name || ''}`.trim()}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {supplier.email || 'No email'}
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Hotels (from itinerary) - all proposals */}
                      {hotelsFromConfirmedOption.length > 0 && (
                        <>
                          <div className="mb-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectAllHotels}
                                onChange={(e) => handleSelectAllHotels(e.target.checked)}
                                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                              />
                              <span className="font-semibold text-gray-800">Hotels (from itinerary)</span>
                            </label>
                          </div>

                          <div className="max-h-[280px] overflow-y-auto space-y-3 mb-6 pb-4 border-b border-gray-200">
                            {hotelsFromConfirmedOption.map((hotel) => (
                              <div key={hotel.id} className="flex items-start gap-2 bg-green-50 p-2 rounded border border-green-200">
                                <input
                                  type="checkbox"
                                  checked={selectedHotels.includes(hotel.id)}
                                  onChange={() => handleSelectHotel(hotel.id)}
                                  className="mt-1 w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                                />
                                <div className="flex-1">
                                  <div className="font-medium text-gray-800 text-sm">
                                    {hotel.company_name || hotel.hotel_name}
                                  </div>
                                  {hotel.room_type && (
                                    <div className="text-xs text-gray-600">
                                      Room: {hotel.room_type} {hotel.meal_plan && `| Meal: ${hotel.meal_plan}`}
                                    </div>
                                  )}
                                  {hotel.day && (
                                    <div className="text-xs text-gray-500">
                                      Day {hotel.day}
                                    </div>
                                  )}
                                  <div className={`text-xs mt-1 ${hotel.email ? 'text-gray-500' : 'text-orange-600 font-medium'}`}>
                                    {hotel.email || '⚠ No email - Please add email in hotel master'}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      )}

                      {/* Vehicles (from itinerary) - all proposals */}
                      {vehiclesFromProposals.length > 0 && (
                        <>
                          <div className="mb-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectAllVehicles}
                                onChange={(e) => handleSelectAllVehicles(e.target.checked)}
                                className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                              />
                              <span className="font-semibold text-gray-800">Vehicles (from itinerary)</span>
                            </label>
                          </div>

                          <div className="max-h-[280px] overflow-y-auto space-y-3">
                            {vehiclesFromProposals.map((vehicle) => (
                              <div key={vehicle.id} className="flex items-start gap-2 bg-amber-50 p-2 rounded border border-amber-200">
                                <input
                                  type="checkbox"
                                  checked={selectedVehicles.includes(vehicle.id)}
                                  onChange={() => handleSelectVehicle(vehicle.id)}
                                  disabled={!vehicle.email || !vehicle.email.trim()}
                                  className="mt-1 w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500 disabled:opacity-50"
                                />
                                <div className="flex-1">
                                  <div className="font-medium text-gray-800 text-sm">
                                    {vehicle.name}
                                  </div>
                                  {vehicle.details && (
                                    <div className="text-xs text-gray-600">
                                      {vehicle.details}
                                    </div>
                                  )}
                                  {vehicle.day && (
                                    <div className="text-xs text-gray-500">
                                      Day {vehicle.day}
                                    </div>
                                  )}
                                  <div className={`text-xs mt-1 ${vehicle.email ? 'text-gray-500' : 'text-amber-600 font-medium'}`}>
                                    {vehicle.email || '— No email (add in Transfer master to send)'}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ):
                activeTab === 'postSales' ? (
                  <div className="space-y-6">
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Post Sales</h3>
                      <div className="text-center py-8 text-gray-500">
                        <p>Post sales management coming soon</p>
                        <p className="text-sm mt-2">Track and manage post-sale activities here</p>
                      </div>
                    </div>
                  </div>
                ):
                activeTab === 'voucher' ? (
                  <div className="space-y-6">
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Vouchers</h3>
                      {getConfirmedOption() ? (
                        <>
                          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <p className="text-sm font-medium text-green-800">Voucher ready — Option {getConfirmedOption()?.optionNumber ?? ''} confirmed. You can preview, download, or email it to the client.</p>
                          </div>
                          <div className="flex flex-wrap gap-3">
                            <button type="button" onClick={handleVoucherPreview} disabled={!!voucherActionLoading} className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50">
                              {voucherActionLoading === 'preview' ? 'Opening…' : 'Preview'}
                            </button>
                            <button type="button" onClick={handleVoucherDownload} disabled={!!voucherActionLoading} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
                              {voucherActionLoading === 'download' ? 'Downloading…' : 'Download'}
                            </button>
                            <button type="button" onClick={handleVoucherSend} disabled={!!voucherActionLoading} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50">
                              {voucherActionLoading === 'send' ? 'Sending…' : 'Send by Email'}
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <p className="text-gray-600 mb-4">Go to the <strong>Proposals</strong> tab and <strong>Confirm</strong> an option first. After confirmation, the voucher will be ready here — you can Preview, Download, or Email it.</p>
                          <div className="flex flex-wrap gap-3">
                            <button type="button" onClick={handleVoucherPreview} disabled={!!voucherActionLoading} className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50">
                              {voucherActionLoading === 'preview' ? 'Opening…' : 'Preview (draft)'}
                            </button>
                            <button type="button" onClick={handleVoucherDownload} disabled={!!voucherActionLoading} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
                              {voucherActionLoading === 'download' ? 'Downloading…' : 'Download (draft)'}
                            </button>
                            <button type="button" onClick={handleVoucherSend} disabled={!!voucherActionLoading} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50">
                              {voucherActionLoading === 'send' ? 'Sending…' : 'Send by Email'}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ):
                activeTab === 'docs' ? (
                  <div className="space-y-6">
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Documents</h3>
                      <div className="flex justify-end mb-4">
                        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                          <Upload className="h-4 w-4" />
                          Upload Document
                        </button>
                      </div>
                      <div className="text-center py-8 text-gray-500">
                        <p>No documents uploaded</p>
                        <p className="text-sm mt-2">Upload passports, tickets, confirmations and other documents here</p>
                      </div>
                    </div>
                  </div>
                ):
                activeTab === 'invoice' ? (
                  <div className="space-y-6">
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Invoices</h3>
                      <p className="text-sm text-gray-500 mb-4">Confirming an option automatically creates an invoice.</p>
                      {loadingHistory ? (
                        <div className="text-center py-8 text-gray-500">Loading...</div>
                      ) : queryDetailInvoices.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <p>No invoices yet</p>
                          <p className="text-sm mt-2">Confirm an option — invoice will be auto-created based on it</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead>
                              <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Invoice No.</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Option</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Itinerary</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                              </tr>
                            </thead>
                            <tbody>
                              {queryDetailInvoices.map((inv) => (
                                <tr key={inv.id} className="hover:bg-gray-50">
                                  <td className="px-4 py-2 text-sm font-medium text-gray-900">{inv.invoice_number}</td>
                                  <td className="px-4 py-2 text-sm text-gray-600">Option {inv.option_number}</td>
                                  <td className="px-4 py-2 text-sm text-gray-600">{inv.itinerary_name || '—'}</td>
                                  <td className="px-4 py-2 text-sm text-gray-900">₹{Number(inv.total_amount).toLocaleString('en-IN')}</td>
                                  <td className="px-4 py-2"><span className={`text-xs px-2 py-1 rounded ${inv.status === 'paid' ? 'bg-green-100 text-green-800' : inv.status === 'sent' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700'}`}>{inv.status}</span></td>
                                  <td className="px-4 py-2 text-sm text-gray-500">{inv.created_at ? new Date(inv.created_at).toLocaleDateString('en-IN') : '—'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                ):
                activeTab === 'billing' ? (
                  <div className="space-y-6">
                    {/* Package Details Section */}
                    {(() => {
                      const confirmedOption = getConfirmedOption();
                      const confirmedOptionNum = confirmedOption?.optionNumber;
                      const hotels = quotationData?.hotelOptions?.[confirmedOptionNum?.toString()] || [];
                      const packagePrice = confirmedOption?.price || hotels.reduce((sum, h) => sum + (parseFloat(h.price) || 0), 0);

                      return confirmedOption ? (
                        <div className="bg-white border border-gray-200 rounded-lg p-6">
                          <h3 className="text-lg font-semibold text-gray-800 mb-4">Final Package Details</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-gray-600">Option Number</p>
                              <p className="text-base font-medium text-gray-900">Option {confirmedOptionNum}</p>
                            </div>
                            {quotationData?.itinerary && (
                              <>
                                <div>
                                  <p className="text-sm text-gray-600">Destination</p>
                                  <p className="text-base font-medium text-gray-900">{quotationData.itinerary.destinations || 'N/A'}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600">Duration</p>
                                  <p className="text-base font-medium text-gray-900">{quotationData.itinerary.duration || 0} Nights</p>
                                </div>
                                {lead?.travel_start_date && (
                                  <div>
                                    <p className="text-sm text-gray-600">Travel Dates</p>
                                    <p className="text-base font-medium text-gray-900">
                                      {formatDateForDisplay(lead.travel_start_date)} - {lead.travel_end_date ? formatDateForDisplay(lead.travel_end_date) : 'N/A'}
                                    </p>
                                  </div>
                                )}
                              </>
                            )}
                            <div>
                              <p className="text-sm text-gray-600">Total Package Price</p>
                              <p className="text-xl font-bold text-green-600">₹{packagePrice.toLocaleString('en-IN')}</p>
                            </div>
                          </div>
                          {hotels.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                              <p className="text-sm font-medium text-gray-700 mb-2">Hotels Included:</p>
                              <div className="space-y-2">
                                {hotels.map((hotel, idx) => (
                                  <div key={idx} className="bg-gray-50 p-3 rounded">
                                    <p className="text-sm font-medium text-gray-900">
                                      Day {hotel.day}: {hotel.hotelName || 'Hotel'}
                                    </p>
                                    <p className="text-xs text-gray-600">
                                      {hotel.roomName || 'N/A'} | {hotel.mealPlan || 'N/A'} | ₹{parseFloat(hotel.price || 0).toLocaleString('en-IN')}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <p className="text-sm text-yellow-800">
                            ⚠️ No confirmed package found. Please confirm an option in the Proposals tab first.
                          </p>
                        </div>
                      );
                    })()}

                    {/* Payment Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-blue-600 font-medium">Total Amount</p>
                        <p className="text-2xl font-bold text-blue-700">
                          ₹{paymentSummary.total_amount.toLocaleString('en-IN')}
                        </p>
                      </div>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <p className="text-sm text-green-600 font-medium">Paid Amount</p>
                        <p className="text-2xl font-bold text-green-700">
                          ₹{paymentSummary.total_paid.toLocaleString('en-IN')}
                        </p>
                      </div>
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-sm text-red-600 font-medium">Due Amount</p>
                        <p className="text-2xl font-bold text-red-700">
                          ₹{paymentSummary.total_due.toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>

                    {/* Add Payment Button */}
                    <div className="flex justify-end">
                      <button
                        onClick={() => {
                          const confirmedOption = getConfirmedOption();
                          const confirmedOptionNum = confirmedOption?.optionNumber;
                          const hotels = quotationData?.hotelOptions?.[confirmedOptionNum?.toString()] || [];
                          const packagePrice = confirmedOption?.price || hotels.reduce((sum, h) => sum + (parseFloat(h.price) || 0), 0);

                          setPaymentFormData({
                            amount: packagePrice > 0 ? packagePrice.toString() : '',
                            paid_amount: '',
                            due_date: ''
                          });
                          setShowPaymentModal(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                        Add Payment
                      </button>
                    </div>

                    {/* Payment History */}
                    <div className="bg-white border border-gray-200 rounded-lg">
                      <div className="p-4 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-800">Payment History</h3>
                      </div>
                      {loadingPayments ? (
                        <div className="p-8 text-center text-gray-500">Loading payments...</div>
                      ) : payments.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">No payments recorded yet</div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Date</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Total Amount</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Paid Amount</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Due Amount</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Due Date</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Added By</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {payments.map((payment) => (
                                <tr key={payment.id} className="hover:bg-gray-50">
                                  <td className="px-4 py-3 text-sm text-gray-900">
                                    {payment.created_at ? formatDateForDisplay(payment.created_at) : 'N/A'}
                                  </td>
                                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                    ₹{parseFloat(payment.amount).toLocaleString('en-IN')}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-green-600 font-medium">
                                    ₹{parseFloat(payment.paid_amount).toLocaleString('en-IN')}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-red-600 font-medium">
                                    ₹{parseFloat(payment.due_amount || (payment.amount - payment.paid_amount)).toLocaleString('en-IN')}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-600">
                                    {payment.due_date ? formatDateForDisplay(payment.due_date) : 'N/A'}
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${payment.status === 'paid'
                                      ? 'bg-green-100 text-green-800'
                                      : payment.status === 'partial'
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : 'bg-red-100 text-red-800'
                                      }`}>
                                      {payment.status === 'paid' ? 'Paid' : payment.status === 'partial' ? 'Partial' : 'Pending'}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-600">
                                    {payment.creator?.name || 'N/A'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                ):
                activeTab === 'history' && (
                  <div className="max-w-3xl">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Query History</h3>
                    <p className="text-sm text-gray-500 mb-4">All activity for this query — payments, followups, calls, confirmations — is shown here.</p>
                    {loadingHistory ? (
                      <div className="text-center py-8 text-gray-500">Loading...</div>
                    ) : activityTimeline.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">No history yet</div>
                    ) : (
                      <div className="space-y-0 border-l-2 border-gray-200 pl-6 ml-2">
                        {activityTimeline.map((item, idx) => (
                          <div key={idx} className="relative pb-6 last:pb-0">
                            <span className="absolute -left-[29px] top-1 w-3 h-3 rounded-full bg-gray-300 border-2 border-white" />
                            <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                                  item.type === 'payment' ? 'bg-green-100 text-green-800' :
                                  item.type === 'followup' ? 'bg-blue-100 text-blue-800' :
                                  item.type === 'call' ? 'bg-purple-100 text-purple-800' :
                                  'bg-gray-200 text-gray-700'
                                }`}>
                                  {item.title}
                                </span>
                                {item.user?.name && (
                                  <span className="text-xs text-gray-500">by {item.user.name}</span>
                                )}
                                <span className="text-xs text-gray-400 ml-auto">
                                  {item.created_at ? new Date(item.created_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : ''}
                                </span>
                              </div>
                              <p className="text-sm text-gray-700 mt-1">{item.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Voucher Preview Popup */}
      {showVoucherPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto py-8" onClick={() => setShowVoucherPopup(false)}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl mx-4 my-auto max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-4 border-b border-gray-200 shrink-0">
              <h2 className="text-lg font-bold text-gray-800">Voucher Preview</h2>
              <button type="button" onClick={() => setShowVoucherPopup(false)} className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="overflow-auto flex-1 p-4 min-h-0">
              <iframe title="Voucher preview" srcDoc={voucherPopupHtml} className="w-full border border-gray-200 rounded-lg bg-white" style={{ minHeight: '60vh' }} />
            </div>
          </div>
        </div>
      )}

      {/* Itinerary Setup Modal */}
      {showItineraryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto py-8">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 my-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">Itinerary setup</h2>
              <button
                onClick={() => setShowItineraryModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleItinerarySave}>
              <div className="p-6 grid grid-cols-2 gap-6 max-h-[70vh] overflow-y-auto">
                {/* Itinerary setup section */}
                <div className="col-span-2">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Itinerary setup</h3>
                </div>

                {/* Itinerary Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Itinerary Name
                  </label>
                  <input
                    type="text"
                    value={itineraryFormData.itinerary_name}
                    onChange={(e) => setItineraryFormData({ ...itineraryFormData, itinerary_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter itinerary name"
                  />
                </div>

                {/* Duration (days) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration (Days)
                  </label>
                  <input
                    type="number"
                    value={itineraryFormData.duration}
                    onChange={(e) => setItineraryFormData({ ...itineraryFormData, duration: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1"
                    placeholder="e.g. 3"
                  />
                </div>

                {/* Destinations */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Destinations
                  </label>
                  <input
                    type="text"
                    value={itineraryFormData.destinations}
                    onChange={(e) => setItineraryFormData({ ...itineraryFormData, destinations: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter Destination"
                  />
                </div>

                {/* Notes */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={itineraryFormData.notes}
                    onChange={(e) => setItineraryFormData({ ...itineraryFormData, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Notes"
                    rows="3"
                  />
                </div>

                {/* Status - Active / Inactive (Visible / Hidden) */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="itinerary_status"
                        checked={itineraryFormData.show_on_website === true}
                        onChange={() => setItineraryFormData(prev => ({ ...prev, show_on_website: true }))}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Active (Visible)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="itinerary_status"
                        checked={itineraryFormData.show_on_website === false}
                        onChange={() => setItineraryFormData(prev => ({ ...prev, show_on_website: false }))}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Inactive (Hidden)</span>
                    </label>
                  </div>
                </div>

                {/* Image */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Image
                  </label>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <label className="flex-1 cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleItineraryFileChange}
                          className="hidden"
                        />
                        <div className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors border border-gray-300">
                          <Upload className="h-4 w-4" />
                          <span className="text-sm font-medium">Upload Image</span>
                        </div>
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowItineraryLibraryModal(true)}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
                      >
                        <Camera className="h-4 w-4" />
                        <span className="text-sm font-medium">Choose from Library</span>
                      </button>
                    </div>
                    {(itineraryImagePreview || itineraryFormData.image) && (
                      <div className="mt-2">
                        <div className="relative w-32 h-32 border border-gray-300 rounded-lg overflow-hidden bg-gray-50">
                          <img
                            src={itineraryImagePreview || (itineraryFormData.image instanceof File ? URL.createObjectURL(itineraryFormData.image) : itineraryFormData.image?.url)}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    )}
                    {!itineraryImagePreview && !itineraryFormData.image && (
                      <p className="text-xs text-gray-500">No image selected. Upload or choose from library.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end p-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowItineraryModal(false)}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900 mr-3"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingItinerary}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {savingItinerary ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Choose from Library modal (for Itinerary setup) */}
      {showItineraryLibraryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">Choose Image</h2>
              <button
                type="button"
                onClick={() => { setShowItineraryLibraryModal(false); setItineraryLibrarySearchTerm(''); setItineraryFreeStockPhotos([]); setItineraryLibraryPackages([]); }}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="flex border-b border-gray-200">
              <button
                type="button"
                onClick={() => setItineraryLibraryTab('free')}
                className={`px-4 py-3 text-sm font-medium border-b-2 ${itineraryLibraryTab === 'free' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}
              >
                Free stock images
              </button>
              <button
                type="button"
                onClick={() => setItineraryLibraryTab('your')}
                className={`px-4 py-3 text-sm font-medium border-b-2 ${itineraryLibraryTab === 'your' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}
              >
                Your itineraries
              </button>
            </div>
            <div className="p-4 border-b border-gray-200">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    value={itineraryLibrarySearchTerm}
                    onChange={(e) => setItineraryLibrarySearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (itineraryLibraryTab === 'free' ? fetchItineraryFreeStockImages() : null)}
                    placeholder={itineraryLibraryTab === 'free' ? 'Search e.g. Shimla, Kufri...' : 'Search your itineraries...'}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {itineraryLibraryTab === 'free' && (
                  <button
                    type="button"
                    onClick={fetchItineraryFreeStockImages}
                    disabled={(itineraryLibrarySearchTerm || '').trim().length < 2 || itineraryFreeStockLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    Search
                  </button>
                )}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {itineraryLibraryTab === 'free' ? (
                itineraryFreeStockLoading ? (
                  <div className="flex justify-center h-48"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" /></div>
                ) : (itineraryLibrarySearchTerm || '').trim().length < 2 ? (
                  <p className="text-center py-8 text-gray-500">Type location (e.g. Shimla, Kufri) and click Search.</p>
                ) : itineraryFreeStockPhotos.length === 0 ? (
                  <div className="text-center py-8 px-4">
                    {itineraryFreeStockError === 'no_api_key' ? (
                      <>
                        <p className="text-gray-600 mb-2">Pexels API key is required for free stock images.</p>
                        <p className="text-sm text-gray-500">On the live server add <code className="bg-gray-100 px-1 rounded">VITE_PEXELS_API_KEY</code> to .env, then run <code className="bg-gray-100 px-1 rounded">npm run build</code> again. Or use <strong>Upload Image</strong>.</p>
                        <p className="text-xs text-gray-400 mt-2">Free key: pexels.com/api</p>
                      </>
                    ) : (
                      <p className="text-gray-500">No images found. Try another search.</p>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {itineraryFreeStockPhotos.map((p) => (
                      <button key={p.id} type="button" onClick={() => handleSelectItineraryFreeStockImage(p.url)} className="aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-500">
                        <img src={p.thumb || p.url} alt={p.alt} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )
              ) : (
                itineraryLibrarySearch.length < 2 ? (
                  <p className="text-center py-8 text-gray-500">Type at least 2 characters to see your itinerary images.</p>
                ) : itineraryLibraryImages.length === 0 ? (
                  <p className="text-center py-8 text-gray-500">No images for this search. Use Free stock images tab.</p>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {itineraryLibraryImages.map((p) => (
                      <button key={p.id} type="button" onClick={() => handleSelectItineraryLibraryImage(p)} className="aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-500">
                        <img src={p.image} alt={p.itinerary_name || p.title || 'Select'} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* Insert Itinerary Modal */}
      {showInsertItineraryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto py-8">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 my-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">Select Itinerary</h2>
              <button
                onClick={() => {
                  setShowInsertItineraryModal(false);
                  setItinerarySearchTerm('');
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {/* Trip duration hint when From/To dates set */}
              {leadTripDays != null && (
                <div className="mb-3 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                  Showing itineraries for <strong>{leadTripDays} day{leadTripDays !== 1 ? 's' : ''}</strong> ({leadTripDays} days / {Math.max(0, leadTripDays - 1)} nights) only — based on this query&apos;s From & To dates.
                </div>
              )}
              {/* Search Bar */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    placeholder="Search itineraries..."
                    value={itinerarySearchTerm}
                    onChange={(e) => setItinerarySearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Itineraries List */}
              {loadingItineraries ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : filteredItineraries.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  {itinerarySearchTerm
                    ? 'No itineraries found matching your search'
                    : leadTripDays != null
                      ? `No itineraries for ${leadTripDays} day${leadTripDays !== 1 ? 's' : ''} (${leadTripDays} days / ${Math.max(0, leadTripDays - 1)} nights). Create an itinerary with ${leadTripDays} days duration to see it here.`
                      : 'No itineraries available'}
                </div>
              ) : (
                <div className="max-h-[60vh] overflow-y-auto space-y-3">
                  {filteredItineraries.map((itinerary) => (
                    <div
                      key={itinerary.id}
                      onClick={() => handleSelectItinerary(itinerary)}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-blue-50 hover:border-blue-300 cursor-pointer transition-colors"
                    >
                      <div className="flex justify-between items-start gap-4">
                        {/* Image */}
                        <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden border border-gray-200 flex-shrink-0">
                          {itinerary.image ? (
                            <img
                              src={itinerary.image}
                              alt={itinerary.title || itinerary.itinerary_name || 'Itinerary'}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                const parent = e.target.parentElement;
                                if (parent && !parent.querySelector('.no-photo-text')) {
                                  const span = document.createElement('span');
                                  span.className = 'no-photo-text text-xs text-gray-400 font-medium';
                                  span.textContent = 'NO PHOTO';
                                  parent.appendChild(span);
                                }
                              }}
                            />
                          ) : (
                            <span className="text-xs text-gray-400 font-medium">NO PHOTO</span>
                          )}
                        </div>

                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-800 mb-1">
                            {itinerary.title || itinerary.itinerary_name || 'Untitled Itinerary'}
                          </h3>
                          {(itinerary.destination || itinerary.destinations) && (
                            <p className="text-sm text-gray-600 mb-2">
                              <span className="font-medium">Destination:</span> {itinerary.destination || itinerary.destinations}
                            </p>
                          )}
                          {itinerary.duration && (
                            <p className="text-sm text-gray-600 mb-1">
                              <span className="font-medium">Duration:</span> {itinerary.duration} Days
                            </p>
                          )}
                          {(itinerary.details || itinerary.notes) && (
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {itinerary.details || itinerary.notes}
                            </p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            {itinerary.created_by_name && (
                              <span>Created by: {itinerary.created_by_name}</span>
                            )}
                            {(itinerary.last_update || itinerary.last_updated) && (
                              <span>Last updated: {itinerary.last_update || itinerary.last_updated}</span>
                            )}
                            {itinerary.show_on_website !== undefined && (
                              <span className={`px-2 py-1 rounded ${itinerary.show_on_website
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-700'
                                }`}>
                                {itinerary.show_on_website ? 'Active' : 'Inactive'}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectItinerary(itinerary);
                          }}
                          className="ml-4 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm font-medium"
                        >
                          Insert
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end p-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowInsertItineraryModal(false);
                  setItinerarySearchTerm('');
                }}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Follow-up Modal */}
      {showFollowupModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto py-8">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 my-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">{editingFollowupId ? 'Edit Followup / Task' : 'Add Followup / Task'}</h2>
              <button
                onClick={() => {
                  setShowFollowupModal(false);
                  setFollowupFormData({
                    type: 'Task',
                    description: '',
                    reminder_date: '',
                    reminder_time: '',
                    set_reminder: 'Yes'
                  });
                  setEditingFollowupId(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleAddFollowup}>
              <div className="p-6 space-y-5">
                {/* Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type
                  </label>
                  <div className="relative">
                    <select
                      value={followupFormData.type}
                      onChange={(e) => setFollowupFormData({ ...followupFormData, type: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white text-gray-900 cursor-pointer"
                    >
                      <option value="Task">Task</option>
                      <option value="Followup">Followup</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={followupFormData.description}
                    onChange={(e) => setFollowupFormData({ ...followupFormData, description: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    placeholder="Enter description..."
                    rows="4"
                  />
                </div>

                {/* Reminder Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reminder Date
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={followupFormData.reminder_date ? (() => {
                        // Convert DD-MM-YYYY to YYYY-MM-DD for date input
                        const parts = followupFormData.reminder_date.split('-');
                        if (parts.length === 3) {
                          return `${parts[2]}-${parts[1]}-${parts[0]}`;
                        }
                        return followupFormData.reminder_date;
                      })() : ''}
                      onChange={(e) => {
                        // Convert YYYY-MM-DD to DD-MM-YYYY for display
                        if (e.target.value) {
                          const parts = e.target.value.split('-');
                          const formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
                          setFollowupFormData({ ...followupFormData, reminder_date: formattedDate });
                        } else {
                          setFollowupFormData({ ...followupFormData, reminder_date: '' });
                        }
                      }}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Time */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time
                  </label>
                  <div className="relative">
                    <select
                      value={followupFormData.reminder_time}
                      onChange={(e) => setFollowupFormData({ ...followupFormData, reminder_time: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white text-gray-900 cursor-pointer"
                    >
                      {generateTimeSlots().map((time) => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Set Reminder */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Set Reminder
                  </label>
                  <div className="relative">
                    <select
                      value={followupFormData.set_reminder}
                      onChange={(e) => setFollowupFormData({ ...followupFormData, set_reminder: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white text-gray-900 cursor-pointer"
                    >
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Company/Client */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company/Client
                  </label>
                  <input
                    type="text"
                    value={lead?.client_name ? `${lead.client_title || ''} ${lead.client_name}`.trim() : 'Travbizz Travel IT Solutions'}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                    disabled
                    readOnly
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
                <button
                  type="button"
                  onClick={() => {
                    setShowFollowupModal(false);
                    setFollowupFormData({
                      type: 'Task',
                      description: '',
                      reminder_date: '',
                      reminder_time: '',
                      set_reminder: 'Yes'
                    });
                  }}
                  className="px-5 py-2.5 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors font-medium"
                  disabled={addingFollowup}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-semibold shadow-sm transition-colors"
                  disabled={addingFollowup}
                >
                  <Plus className="h-4 w-4" />
                  {addingFollowup ? 'Saving...' : (editingFollowupId ? 'Update' : 'Save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quotation Modal */}
      {showQuotationModal && selectedProposal && quotationData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto py-8">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl mx-4 my-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
              <h2 className="text-2xl font-bold text-gray-800">View Quotation</h2>
              <div className="flex items-center gap-2 flex-wrap">
                {selectedOption && quotationData && (
                  <>
                    <button
                      onClick={() => handleSendMail(selectedOption)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                      title="Send Mail (Current Option)"
                    >
                      <Mail className="h-4 w-4" />
                      Send Mail
                    </button>
                    <button
                      onClick={async () => {
                        // Send all options via email
                        const emailContent = await generateEmailContent();
                        const subject = encodeURIComponent(`Complete Travel Quotation - ${quotationData.itinerary.itinerary_name || 'Itinerary'} - ${formatLeadId(lead.id)}`);

                        navigator.clipboard.writeText(emailContent).then(() => {
                          const mailtoLink = `mailto:${lead.email || ''}?subject=${subject}&body=${encodeURIComponent('Please find the complete travel quotation with all options attached.')}`;
                          window.open(mailtoLink);
                          alert('Complete quotation (all options) copied to clipboard! Paste it in your email client.');
                        }).catch(() => {
                          alert('Please use Print option to generate PDF with all options');
                        });
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium"
                      title="Send All Options via Email"
                    >
                      <Mail className="h-4 w-4" />
                      Send All Options
                    </button>
                    <button
                      onClick={() => handleDownloadSingleOptionPdf(selectedOption)}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium"
                      title="Download PDF (Current Option)"
                    >
                      <Download className="h-4 w-4" />
                      Download PDF
                    </button>
                    <button
                      onClick={() => handlePrint(selectedOption)}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm font-medium"
                      title="Print"
                    >
                      <Printer className="h-4 w-4" />
                      Print
                    </button>
                    <button
                      onClick={() => handleSendWhatsApp(selectedOption)}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                      title="Send WhatsApp (All Options)"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Send WhatsApp
                    </button>
                  </>
                )}
                <button
                  onClick={() => {
                    setShowQuotationModal(false);
                    setSelectedProposal(null);
                    setQuotationData(null);
                    setSelectedOption(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors ml-2"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 max-h-[80vh] overflow-y-auto">
              {loadingQuotation ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <>
                  {/* Option Selector */}
                  {quotationData.hotelOptions && Object.keys(quotationData.hotelOptions).length > 0 && (
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Option:
                      </label>
                      <div className="flex gap-2 flex-wrap">
                        {Object.keys(quotationData.hotelOptions).map(optionNum => (
                          <button
                            key={optionNum}
                            onClick={() => setSelectedOption(optionNum)}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${selectedOption === optionNum
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                              }`}
                          >
                            Option {optionNum}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quotation Content */}
                  {selectedOption && quotationData.hotelOptions[selectedOption] && (
                    <div className="quotation-content">
                      {/* Company Header */}
                      <div className="text-center mb-6">
                        <h1 className="text-3xl font-bold text-blue-600 mb-2">TravelOps</h1>
                        <div className="text-sm text-gray-600">
                          <p>Delhi India</p>
                          <p>Email: info@travelops.com</p>
                          <p>Mobile: +91-9871023004</p>
                        </div>
                      </div>

                      {/* Itinerary Image */}
                      {quotationData.itinerary.image && (
                        <div className="mb-6">
                          <div className="w-full h-64 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                            <img
                              src={quotationData.itinerary.image}
                              alt={quotationData.itinerary.itinerary_name || quotationData.itinerary.title || 'Itinerary'}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                const parent = e.target.parentElement;
                                if (parent && !parent.querySelector('.no-photo-text')) {
                                  const span = document.createElement('span');
                                  span.className = 'no-photo-text text-sm text-gray-400 font-medium absolute inset-0 flex items-center justify-center';
                                  span.textContent = 'NO PHOTO';
                                  parent.appendChild(span);
                                }
                              }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Quote Details */}
                      <div className="bg-gray-50 p-4 rounded-lg mb-6">
                        <h2 className="text-xl font-semibold mb-3">Quote Details</h2>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <p><span className="font-medium">Ref. Query ID:</span> {formatLeadId(lead?.id)}</p>
                          <p><span className="font-medium">Query ID:</span> {formatLeadId(lead?.id)}</p>
                          <p><span className="font-medium">Adult(s):</span> {lead?.adult || 1}</p>
                          <p><span className="font-medium">Child(s):</span> {lead?.child || 0}</p>
                          <p><span className="font-medium">Nights:</span> {quotationData.itinerary.duration || 0} Nights & {(quotationData.itinerary.duration || 0) + 1} Days</p>
                          <p><span className="font-medium">Destination Covered:</span> {quotationData.itinerary.destinations || 'N/A'}</p>
                          <p><span className="font-medium">Start Date:</span> {quotationData.itinerary.start_date || 'N/A'}</p>
                          <p><span className="font-medium">End Date:</span> {quotationData.itinerary.end_date || 'N/A'}</p>
                          <p><span className="font-medium">Query Date:</span> {new Date(lead?.created_at).toLocaleDateString('en-GB')}</p>
                        </div>
                      </div>

                      {/* Hotel Details for Selected Option */}
                      <div className="mb-6">
                        <h2 className="text-xl font-semibold mb-3">Hotel Details - Option {selectedOption}</h2>
                        {quotationData.hotelOptions[selectedOption].map((option, idx) => (
                          <div key={idx} className="border border-gray-200 rounded-lg p-4 mb-3">
                            <div className="flex gap-4">
                              {/* Hotel Image */}
                              {option.image && (
                                <div className="flex-shrink-0">
                                  <div className="w-32 h-32 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                                    <img
                                      src={option.image}
                                      alt={option.hotelName || 'Hotel'}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        e.target.style.display = 'none';
                                        const parent = e.target.parentElement;
                                        if (parent && !parent.querySelector('.no-photo-text')) {
                                          const span = document.createElement('span');
                                          span.className = 'no-photo-text text-xs text-gray-400 font-medium absolute inset-0 flex items-center justify-center';
                                          span.textContent = 'NO PHOTO';
                                          parent.appendChild(span);
                                        }
                                      }}
                                    />
                                  </div>
                                </div>
                              )}

                              {/* Hotel Details */}
                              <div className="flex-1">
                                <h3 className="font-semibold text-lg mb-2">{option.hotelName || 'Hotel'}</h3>
                                <div className="grid grid-cols-2 gap-2 text-sm text-gray-700">
                                  <p><span className="font-medium">Day:</span> {option.day || 'N/A'}</p>
                                  <p><span className="font-medium">Room:</span> {option.roomName || 'N/A'}</p>
                                  <p><span className="font-medium">Meal Plan:</span> {option.mealPlan || 'N/A'}</p>
                                  <p><span className="font-medium">Category:</span> {option.category ? `${option.category} Star` : 'N/A'}</p>
                                  <p><span className="font-medium">Check In:</span> {option.checkIn || 'N/A'} {option.checkInTime || ''}</p>
                                  <p><span className="font-medium">Check Out:</span> {option.checkOut || 'N/A'} {option.checkOutTime || ''}</p>
                                  {option.single && <p><span className="font-medium">Single:</span> {option.single}</p>}
                                  {option.double && <p><span className="font-medium">Double:</span> {option.double}</p>}
                                  {option.triple && <p><span className="font-medium">Triple:</span> {option.triple}</p>}
                                  {option.quad && <p><span className="font-medium">Quad:</span> {option.quad}</p>}
                                  {option.price && (
                                    <p className="col-span-2">
                                      <span className="font-medium">Price:</span> ₹{parseFloat(option.price).toLocaleString('en-IN')}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Total Price */}
                      <div className="bg-red-600 text-white p-4 rounded-lg text-center mb-6">
                        <p className="text-2xl font-bold">
                          Total Package Price: ₹{
                            quotationData.hotelOptions[selectedOption]
                              .reduce((sum, opt) => sum + (parseFloat(opt.price) || 0), 0)
                              .toLocaleString('en-IN')
                          }
                        </p>
                      </div>

                      {/* Terms and Conditions */}
                      {quotationData.itinerary.terms_conditions && (
                        <div className="mb-4">
                          <h3 className="text-lg font-semibold mb-2">Terms and Conditions</h3>
                          <div className="text-sm text-gray-700 whitespace-pre-wrap">
                            {quotationData.itinerary.terms_conditions}
                          </div>
                        </div>
                      )}

                      {/* Refund Policy */}
                      {quotationData.itinerary.refund_policy && (
                        <div className="mb-4">
                          <h3 className="text-lg font-semibold mb-2">Refund Policy</h3>
                          <div className="text-sm text-gray-700 whitespace-pre-wrap">
                            {quotationData.itinerary.refund_policy}
                          </div>
                        </div>
                      )}

                      {/* Package Description */}
                      {quotationData.itinerary.package_description && (
                        <div className="mb-4">
                          <h3 className="text-lg font-semibold mb-2">Package Description</h3>
                          <div className="text-sm text-gray-700 whitespace-pre-wrap">
                            {quotationData.itinerary.package_description}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {!selectedOption && (
                    <div className="text-center py-12 text-gray-500">
                      <p>No hotel options found for this itinerary.</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto py-8">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 my-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">Add Payment</h2>
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setPaymentFormData({ amount: '', paid_amount: '', due_date: '' });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleAddPayment} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Amount <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={paymentFormData.amount}
                  onChange={(e) => setPaymentFormData({ ...paymentFormData, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter total amount"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Paid Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={paymentFormData.paid_amount}
                  onChange={(e) => setPaymentFormData({ ...paymentFormData, paid_amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter paid amount (optional)"
                />
                <p className="mt-1 text-xs text-gray-500">Leave empty if no payment received yet</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  value={paymentFormData.due_date}
                  onChange={(e) => setPaymentFormData({ ...paymentFormData, due_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">Optional: Set due date for payment</p>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowPaymentModal(false);
                    setPaymentFormData({ amount: '', paid_amount: '', due_date: '' });
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingPayment}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {addingPayment ? 'Adding...' : 'Add Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Compose Email Modal */}
      {showComposeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto py-8">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 my-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">{replyThreadId ? 'Reply to Mail' : 'Compose Mail'}</h2>
              <button
                onClick={() => {
                  setShowComposeModal(false);
                  setReplyThreadId(null);
                  setEmailFormData({ to_email: '', cc_email: '', subject: '', body: '' });
                  setEmailAttachment(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSendClientEmail} className="p-6 space-y-4">
              {/* From Email - Company Email */}
              <div className="text-sm text-gray-600">
                <span className="text-gray-500">From</span>{' '}
                <span className="text-gray-800 font-medium">{companySettings?.company_email || 'noreply@company.com'}</span>
              </div>

              {/* To - Customer Name & Email */}
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="font-semibold text-gray-800">{lead?.client_name || 'Customer'}</div>
                <div className="text-sm text-gray-600">{emailFormData.to_email || lead?.email}</div>
              </div>

              {/* CC Email */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">CC</label>
                <input
                  type="email"
                  value={emailFormData.cc_email}
                  onChange={(e) => setEmailFormData({ ...emailFormData, cc_email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter CC email (optional)"
                />
              </div>

              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Subject</label>
                <input
                  type="text"
                  value={emailFormData.subject}
                  onChange={(e) => setEmailFormData({ ...emailFormData, subject: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter email subject"
                  required
                />
              </div>

              {/* Mail Body with Toolbar */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Mail Body</label>
                <div className="border border-gray-300 rounded-lg overflow-hidden">
                  {/* Simple Toolbar */}
                  <div className="flex items-center gap-1 p-2 bg-gray-50 border-b border-gray-200 flex-wrap">
                    <button type="button" className="p-1.5 hover:bg-gray-200 rounded text-gray-600" title="Undo">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                    </button>
                    <button type="button" className="p-1.5 hover:bg-gray-200 rounded text-gray-600" title="Redo">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" /></svg>
                    </button>
                    <span className="w-px h-5 bg-gray-300 mx-1"></span>
                    <select className="text-sm border-0 bg-transparent text-gray-600 focus:ring-0 cursor-pointer">
                      <option>Formats</option>
                      <option>Paragraph</option>
                      <option>Heading 1</option>
                      <option>Heading 2</option>
                    </select>
                    <span className="w-px h-5 bg-gray-300 mx-1"></span>
                    <button type="button" className="p-1.5 hover:bg-gray-200 rounded font-bold text-gray-700" title="Bold">B</button>
                    <button type="button" className="p-1.5 hover:bg-gray-200 rounded italic text-gray-700" title="Italic">I</button>
                    <span className="w-px h-5 bg-gray-300 mx-1"></span>
                    <button type="button" className="p-1.5 hover:bg-gray-200 rounded text-gray-600" title="Align Left">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 5A.75.75 0 012.75 9h9.5a.75.75 0 010 1.5h-9.5A.75.75 0 012 9.75zm0 5A.75.75 0 012.75 14h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75z" clipRule="evenodd" /></svg>
                    </button>
                    <button type="button" className="p-1.5 hover:bg-gray-200 rounded text-gray-600" title="Align Center">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4.75A.75.75 0 014.75 4h10.5a.75.75 0 010 1.5H4.75A.75.75 0 014 4.75zm-2 5A.75.75 0 012.75 9h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 9.75zm2 5A.75.75 0 014.75 14h10.5a.75.75 0 010 1.5H4.75a.75.75 0 01-.75-.75z" clipRule="evenodd" /></svg>
                    </button>
                    <button type="button" className="p-1.5 hover:bg-gray-200 rounded text-gray-600" title="Align Right">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm4 5A.75.75 0 016.75 9h10.5a.75.75 0 010 1.5H6.75A.75.75 0 016 9.75zm-4 5A.75.75 0 012.75 14h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75z" clipRule="evenodd" /></svg>
                    </button>
                    <button type="button" className="p-1.5 hover:bg-gray-200 rounded text-gray-600" title="Justify">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 5A.75.75 0 012.75 9h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 9.75zm0 5A.75.75 0 012.75 14h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75z" clipRule="evenodd" /></svg>
                    </button>
                    <span className="w-px h-5 bg-gray-300 mx-1"></span>
                    <button type="button" className="p-1.5 hover:bg-gray-200 rounded text-gray-600" title="Bullet List">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 4a1 1 0 100 2 1 1 0 000-2zm4 0a1 1 0 000 2h10a1 1 0 100-2H7zm0 5a1 1 0 000 2h10a1 1 0 100-2H7zm0 5a1 1 0 000 2h10a1 1 0 100-2H7zM3 9a1 1 0 100 2 1 1 0 000-2zm0 5a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" /></svg>
                    </button>
                    <button type="button" className="p-1.5 hover:bg-gray-200 rounded text-gray-600" title="Numbered List">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" /></svg>
                    </button>
                  </div>
                  {/* Text Area */}
                  <textarea
                    value={emailFormData.body}
                    onChange={(e) => setEmailFormData({ ...emailFormData, body: e.target.value })}
                    className="w-full px-3 py-3 border-0 focus:ring-0 min-h-[200px] resize-y"
                    placeholder="Type your message here..."
                    required
                  />
                </div>
              </div>

              {/* Attachment */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Attachment</label>
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer">
                    <span className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors inline-block">
                      Choose File
                    </span>
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => setEmailAttachment(e.target.files[0] || null)}
                    />
                  </label>
                  <span className="text-sm text-gray-500">
                    {emailAttachment ? emailAttachment.name : 'No file chosen'}
                  </span>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={sendingClientEmail}
                  className="px-6 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
                >
                  {sendingClientEmail ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Sending...
                    </>
                  ) : (
                    'Send Mail'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default LeadDetails;

