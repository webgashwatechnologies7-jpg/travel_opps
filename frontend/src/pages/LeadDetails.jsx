import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import { leadsAPI, usersAPI, followupsAPI, dayItinerariesAPI, packagesAPI, settingsAPI, suppliersAPI, hotelsAPI, paymentsAPI, googleMailAPI, whatsappAPI, queryDetailAPI, vouchersAPI, itineraryPricingAPI, leadInvoicesAPI, quotationsAPI } from '../services/api';
import { searchPexelsPhotos } from '../services/pexels';
import { getDisplayImageUrl, rewriteHtmlImageUrls, sanitizeEmailHtmlForDisplay } from '../utils/imageUrl';
import Layout from '../components/Layout';
import { useSettings } from '../contexts/SettingsContext';
import { ArrowLeft, Calendar, Mail, Plus, Upload, X, Search, FileText, Printer, Send, MessageCircle, CheckCircle, CheckCircle2, Clock, Briefcase, MapPin, CalendarDays, Users, UserCheck, Leaf, Smartphone, Phone, MoreVertical, Download, Pencil, Trash2, Camera, RefreshCw, Reply, ChevronDown, Paperclip, Eye, Info } from 'lucide-react';
import DetailRow from '../components/Quiries/DetailRow';
import html2pdf from 'html2pdf.js';
import { WhatsAppTab, MailsTab, FollowupsTab, BillingTab, HistoryTab, SuppCommTab, PostSalesTab, VoucherTab, DocsTab, InvoiceTab } from '../components/LeadTabs';
const LeadDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { settings } = useSettings();
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
  const [sendAllDropdownOpen, setSendAllDropdownOpen] = useState(false);
  const [sendingOptionChannel, setSendingOptionChannel] = useState(null);
  const [dayItineraries, setDayItineraries] = useState([]);
  const [loadingItineraries, setLoadingItineraries] = useState(false);
  const [itinerarySearchTerm, setItinerarySearchTerm] = useState('');
  const [proposals, setProposals] = useState([]);
  const [maxHotelOptions, setMaxHotelOptions] = useState(4);
  const [showQuotationModal, setShowQuotationModal] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [quotationData, setQuotationData] = useState(null);
  const [loadingQuotation, setLoadingQuotation] = useState(false);
  const [refreshingProposalPrices, setRefreshingProposalPrices] = useState(false);
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
  const [showInvoicePreview, setShowInvoicePreview] = useState(false);
  const [invoicePreviewHtml, setInvoicePreviewHtml] = useState('');
  const [invoiceActionLoading, setInvoiceActionLoading] = useState(null); // 'preview' | 'download' | 'send' | invoiceId

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
  const [whatsappInput, setWhatsappInput] = useState('');
  const [whatsappAttachment, setWhatsappAttachment] = useState(null);
  const [sendingWhatsapp, setSendingWhatsapp] = useState(false);
  const [showPaxModal, setShowPaxModal] = useState(false);
  const [paxTempList, setPaxTempList] = useState([]);
  const [savingPax, setSavingPax] = useState(false);

  // UI helper: when one option is confirmed, show only that option in Proposals tab
  const visibleProposals = useMemo(() => {
    if (!proposals || proposals.length === 0) return [];
    const confirmed = proposals.find((p) => p.confirmed);
    return confirmed ? proposals.filter((p) => p.confirmed) : proposals;
  }, [proposals]);

  const showToastNotification = (type, title, text) => {
    toast[type || 'info'](
      <div>
        <div className="font-bold">{title}</div>
        <div className="text-sm">{text}</div>
      </div>
    );
  };

  const hasConfirmedProposal = useMemo(
    () => Array.isArray(proposals) && proposals.some((p) => p.confirmed),
    [proposals]
  );

  // Option numbers to show inside Quotation modal (after confirmation, only confirmed option)
  const quotationOptionNumbers = useMemo(() => {
    if (!quotationData?.hotelOptions) return [];
    const all = Object.keys(quotationData.hotelOptions).sort(
      (a, b) => parseInt(a, 10) - parseInt(b, 10)
    );
    if (!hasConfirmedProposal) return all;
    const confirmed = proposals?.find(p => p.confirmed === true);
    const confirmedNum =
      confirmed && confirmed.optionNumber != null
        ? confirmed.optionNumber.toString()
        : null;
    if (confirmedNum && all.includes(confirmedNum)) {
      return [confirmedNum];
    }
    return all;
  }, [quotationData, hasConfirmedProposal, proposals]);

  useEffect(() => {
    fetchLeadDetails();
    fetchUsers();
    fetchMaxHotelOptions();
    fetchSuppliers();
    fetchCompanySettings();
  }, [id]);

  // Mark 'new' leads as 'proposal' (or viewed) when opened to remove the "New" badge
  useEffect(() => {
    if (lead?.status === 'new' && lead?.id) {
      const markAsRead = async () => {
        try {
          // Changing status from 'new' to 'proposal' is a safe default to indicate it's been viewed/processed
          // This removes the "New" badge in LeadCard
          await leadsAPI.updateStatus(lead.id, 'proposal');
          // Refresh local lead data to reflect status change
          fetchLeadDetails();
        } catch (e) {
          console.error("Failed to update lead status on view", e);
        }
      };
      markAsRead();
    }
  }, [lead?.id, lead?.status]);

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

  useEffect(() => {
    const close = () => setSendAllDropdownOpen(false);
    if (sendAllDropdownOpen) {
      document.addEventListener('click', close);
      return () => document.removeEventListener('click', close);
    }
  }, [sendAllDropdownOpen]);

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

  // When quotation modal is open, lock body scroll so only modal scrolls
  useEffect(() => {
    if (showQuotationModal) {
      const original = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [showQuotationModal]);

  useEffect(() => {
    if ((activeTab === 'history' || activeTab === 'invoice') && id) {
      fetchQueryDetail();
    }
  }, [activeTab, id]);

  const fetchMaxHotelOptions = async () => {
    try {
      const response = await settingsAPI.getMaxHotelOptions();
      if (response.data?.success && response.data?.data?.max_hotel_options != null) {
        setMaxHotelOptions(response.data.data.max_hotel_options);
      }
    } catch (_) { }
  };

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
      const confirmedOption = proposals?.find(p => p.confirmed === true);
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
        } catch (_) { }
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
        // Optimization: Fetch unique hotel IDs first to avoid redundant API calls (429 Too Many Requests)
        const uniqueHotelIds = [...new Set(uniqueRaw.map(h => h.hotel_id).filter(Boolean))];
        const hotelDataMap = {};

        await Promise.all(uniqueHotelIds.map(async (hid) => {
          try {
            const res = await hotelsAPI.get(hid);
            if (res?.data?.data) {
              hotelDataMap[hid] = res.data.data;
            }
          } catch (e) {
            console.warn(`Failed to fetch hotel ${hid}`, e);
          }
        }));

        const hotelsData = uniqueRaw.map((hotel, index) => {
          const hotelId = hotel.hotel_id;
          const hotelName = hotel.hotelName || 'Hotel';
          const roomType = hotel.roomName || '';
          const mealPlan = hotel.mealPlan || '';
          const day = hotel.day;
          const price = hotel.price || '';

          if (hotelId && hotelDataMap[hotelId]) {
            const hotelData = hotelDataMap[hotelId];
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
          }

          return {
            id: `hotel_${hotelName}_${day}_${index}_${Date.now()}`,
            hotel_id: hotelId || null,
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

  // Helper: get final price from API response object (handles "1"/1 keys)
  const getPriceFromFinalPrices = (fp, optNum) => {
    if (!fp || typeof fp !== 'object') return null;
    const v = fp[String(optNum)] ?? fp[optNum] ?? fp[Number(optNum)];
    if (v === undefined || v === null || v === '') return null;
    const num = Number(v);
    return Number.isNaN(num) || num < 0 ? null : num;
  };

  // Load proposals from localStorage, then overlay prices from API (server) so Query always shows saved final client prices
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    const run = async () => {
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
            const filtered = latestOptions;
            filtered.forEach((opt, i) => {
              result.push({
                ...opt,
                id: opt.id || Date.now() + i + tid,
                price: opt.price ?? opt.pricing?.finalClientPrice ?? 0,
                pricing: { ...(opt.pricing || {}), finalClientPrice: opt.price ?? opt.pricing?.finalClientPrice ?? 0 },
                confirmed: confirmedOptionNum != null && opt.optionNumber === confirmedOptionNum
              });
            });
          } else {
            (byItineraryId[tid] || []).forEach((x) => result.push(x));
          }
        });
        setProposals(result);

        // Overlay final client prices from API so Query always shows server-saved prices (no localStorage dependency)
        const itineraryIds = [...new Set(result.map((r) => r.itinerary_id).filter(Boolean))];
        const priceMapByItinerary = {};
        await Promise.all(
          itineraryIds.map(async (tid) => {
            try {
              const res = await itineraryPricingAPI.get(tid);
              if (cancelled) return;
              const data = res?.data?.data;
              const fp = data?.final_client_prices;
              if (fp && typeof fp === 'object' && !Array.isArray(fp)) priceMapByItinerary[tid] = fp;
            } catch (_) { }
          })
        );
        if (cancelled) return;
        const updated = result.map((opt) => {
          const tid = opt.itinerary_id;
          const fp = priceMapByItinerary[tid];
          const optNum = opt.optionNumber != null ? opt.optionNumber : 1;
          const apiPrice = getPriceFromFinalPrices(fp, optNum);
          const price = apiPrice !== null ? apiPrice : (opt.price ?? 0);
          return { ...opt, price, pricing: { ...(opt.pricing || {}), finalClientPrice: price } };
        });
        setProposals(updated);
      } catch (err) {
        console.error('Failed to load proposals:', err);
        setProposals([]);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [id, maxHotelOptions, activeTab]);

  // Save proposals to localStorage
  const saveProposals = (newProposals) => {
    try {
      localStorage.setItem(`lead_${id}_proposals`, JSON.stringify(newProposals));
      setProposals(newProposals);
    } catch (err) {
      console.error('Failed to save proposals:', err);
    }
  };

  // Refresh proposal prices from server (database) – use after saving prices on Itinerary Pricing tab
  const refreshProposalPricesFromServer = async () => {
    if (!proposals.length) return;
    setRefreshingProposalPrices(true);
    try {
      const itineraryIds = [...new Set(proposals.map((r) => r.itinerary_id).filter(Boolean))];
      const priceMapByItinerary = {};
      for (const tid of itineraryIds) {
        try {
          const res = await itineraryPricingAPI.get(tid);
          const data = res?.data?.data;
          const fp = data?.final_client_prices;
          if (fp && typeof fp === 'object' && !Array.isArray(fp)) priceMapByItinerary[tid] = fp;
        } catch (e) {
          console.warn('Pricing API failed for itinerary', tid, e?.response?.status, e?.message);
        }
      }
      let anyUpdated = false;
      const updated = proposals.map((opt) => {
        const tid = opt.itinerary_id;
        const fp = priceMapByItinerary[tid];
        const optNum = opt.optionNumber != null ? opt.optionNumber : 1;
        const apiPrice = getPriceFromFinalPrices(fp, optNum);
        if (apiPrice !== null) {
          anyUpdated = true;
          return { ...opt, price: apiPrice, pricing: { ...(opt.pricing || {}), finalClientPrice: apiPrice } };
        }
        return opt;
      });
      setProposals(updated);
      saveProposals(updated);
      if (anyUpdated) {
        showToastNotification('success', 'Prices Refreshed', 'Database se naye prices load ho gaye hain.');
      } else {
        showToastNotification('warning', 'Prices Not Found', 'Database mein is itinerary ke liye koi Final Client Price save nahi mila. Please check the itinerary pricing tab.');
      }
    } catch (err) {
      console.error('Failed to refresh prices:', err);
      showToastNotification('error', 'Update Failed', 'Server se prices load nahi ho paaye.');
    } finally {
      setRefreshingProposalPrices(false);
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
        const quotationDataForSend = await handleViewQuotation(confirmedProposal, false);
        if (quotationDataForSend && (lead?.email || lead?.phone)) {
          await autoSendConfirmedToClient(quotationDataForSend, confirmedProposal);
        } else if (!quotationDataForSend) {
          showToastNotification('warning', 'Quotation Missing', 'Option confirmed! Quotation could not be loaded. Please share via Email or WhatsApp manually.');
        } else {
          showToastNotification('warning', 'Client Details Missing', 'Option confirmed! Client email/phone is missing — add it in Mails or WhatsApp tabs and send manually.');
        }
      } catch (err) {
        console.error('Failed to load quotation or auto-send:', err);
        showToastNotification('error', 'Auto-send Failed', 'Option confirmed! Email/WhatsApp auto-send failed. Please share via Email or WhatsApp manually.');
      }

      fetchPayments();
      if (activeTab === 'history' || activeTab === 'invoice') fetchQueryDetail();
    } else {
      showToastNotification('success', 'Confirmed', 'Option confirmed successfully! You can now share the final itinerary.');
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
      showToastNotification('error', 'Preview Failed', 'Voucher preview could not be loaded. Please try again.');
    } finally {
      setVoucherActionLoading(null);
    }
  };

  const handleVoucherDownload = async () => {
    if (!id) return;
    setVoucherActionLoading('download');
    try {
      const res = await vouchersAPI.download(id);
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Voucher_Query-${formatLeadId(id)}_${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      showToastNotification('success', 'PDF Downloaded', 'Voucher PDF downloaded successfully.');
    } catch (err) {
      console.error('Voucher download failed:', err);
      showToastNotification('error', 'Download Failed', 'Voucher PDF download failed. Please try again.');
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
      showToastNotification('success', 'Sent', 'Voucher email sent successfully.');
    } catch (err) {
      console.error('Voucher send failed:', err);
      showToastNotification('error', 'Send Failed', 'Voucher send failed. Please check client email.');
    } finally {
      setVoucherActionLoading(null);
    }
  };

  const handleInvoicePreview = async (invoiceId) => {
    if (!id) return;
    setInvoiceActionLoading('preview');
    try {
      const res = await leadInvoicesAPI.preview(id, invoiceId);
      const html = await res.data.text();
      setInvoicePreviewHtml(html);
      setShowInvoicePreview(true);
    } catch (err) {
      console.error('Invoice preview failed:', err);
      showToastNotification('error', 'Preview Failed', 'Invoice preview could not be loaded.');
    } finally {
      setInvoiceActionLoading(null);
    }
  };

  const handleInvoiceDownload = async (invoiceId) => {
    if (!id) return;
    setInvoiceActionLoading('download');
    try {
      const res = await leadInvoicesAPI.download(id, invoiceId);
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      const inv = queryDetailInvoices.find((i) => i.id === invoiceId);
      const invNum = inv?.invoice_number || invoiceId;
      link.setAttribute('download', `Invoice_${invNum}_${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      showToastNotification('success', 'PDF Downloaded', 'Invoice PDF downloaded successfully.');
    } catch (err) {
      console.error('Invoice download failed:', err);
      showToastNotification('error', 'Download Failed', 'Invoice PDF download failed.');
    } finally {
      setInvoiceActionLoading(null);
    }
  };

  const handleInvoiceSend = async (invoiceId) => {
    if (!id) return;
    const toEmail = lead?.email || '';
    const email = window.prompt('Send invoice to email:', toEmail || '');
    if (email === null) return;
    setInvoiceActionLoading('send');
    try {
      await leadInvoicesAPI.send(id, invoiceId, { to_email: email || toEmail, subject: `Invoice ${queryDetailInvoices.find((i) => i.id === invoiceId)?.invoice_number || invoiceId}` });
      showToastNotification('success', 'Sent', 'Invoice sent by email successfully.');
    } catch (err) {
      console.error('Invoice send failed:', err);
      showToastNotification('error', 'Send Failed', 'Invoice send failed. Please check client email.');
    } finally {
      setInvoiceActionLoading(null);
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
      const summary = payRes?.data?.data?.summary;
      if (summary) {
        paySummary = {
          total_amount: parseFloat(summary.total_amount) || 0,
          total_paid: parseFloat(summary.total_paid) || 0,
          total_due: parseFloat(summary.total_due) || 0,
        };
      }
    } catch (_) { }

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
        showToastNotification('success', 'Confirmed Shared', 'Final itinerary and payment summary have been sent to the client via Email and WhatsApp. You can see them in the Mails and WhatsApp tabs.');
      }
    } catch (err) {
      console.error('Auto-send failed:', err);
      const msg = err.response?.data?.message || err.response?.data?.error || err.message || 'Unknown error';
      showToastNotification('error', 'Mail Failed', 'Mail could not be sent. Issue: ' + msg);
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
      showToastNotification('error', 'Fetch Failed', 'Failed to load lead details. Please check the console or try again.');
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
      showToastNotification('warning', 'Missing Fields', 'Please fill in all required fields');
      return;
    }

    setSendingClientEmail(true);
    try {
      if (user?.google_token) {
        // Use Gmail API if connected
        const emailData = {
          to: toEmail,
          to_email: toEmail,
          subject: emailFormData.subject,
          body: emailFormData.body,
          lead_id: id
        };
        if (replyThreadId) emailData.thread_id = replyThreadId;
        const sendFn = emailAttachment ? () => googleMailAPI.sendMailWithAttachment({ ...emailData, attachment: emailAttachment }) : () => googleMailAPI.sendMail(emailData);
        const response = await sendFn();
        if (response.data?.success || response.data?.message) {
          showToastNotification('success', 'Email Sent!', 'Email sent successfully via Gmail!');
          setShowComposeModal(false);
          setReplyThreadId(null);
          // ... (rest of state reset)
          setEmailFormData({ to_email: lead?.email || '', cc_email: '', subject: '', body: '' });
          setEmailAttachment(null);
          fetchGmailEmails();
        } else {
          const msg = response.data?.message || response.data?.error || 'Unknown error';
          showToastNotification('error', 'Mail Error', 'Mail could not be sent. Issue: ' + msg);
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
          showToastNotification('success', 'Email Sent!', 'Email sent successfully!');
          setShowComposeModal(false);
          setEmailFormData({ to_email: lead?.email || '', cc_email: '', subject: '', body: '' });
          setEmailAttachment(null);
          fetchLeadEmails();
        } else {
          const msg = response.data?.message || response.data?.error || 'Unknown error';
          showToastNotification('error', 'Mail Error', 'Mail could not be sent. Issue: ' + msg);
        }
      }
    } catch (err) {
      console.error('Failed to send email:', err);
      const msg = err.response?.data?.message || err.response?.data?.error || err.message || 'Unknown error';
      showToastNotification('error', 'Mail Failed', 'Mail could not be sent. Issue: ' + msg);
    } finally {
      setSendingClientEmail(false);
    }
  };

  // Fetch Gmail emails (so sent mails show in Mails tab)
  const fetchGmailEmails = async () => {
    if (!id) return;
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
      showToastNotification('warning', 'Gmail Not Connected', 'Connect Gmail in Settings to see received and reply emails here.');
      return;
    }
    setSyncingInbox(true);
    try {
      await googleMailAPI.syncInbox();
      await fetchGmailEmails();
      showToastNotification('success', 'Inbox Synced', 'Received and reply emails will appear below.');
    } catch (err) {
      showToastNotification('error', 'Sync Failed', 'Make sure Gmail is connected in Settings.');
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
  const openReplyModal = async (thread) => {
    const tid = thread[0]?.thread_id;
    const ids = thread.map(e => e.id);
    try {
      await googleMailAPI.markEmailsRead(tid ? { thread_id: tid } : { email_ids: ids });
      setGmailEmails(prev => prev.map(e => (ids.includes(e.id) ? { ...e, is_read: true } : e)));
    } catch (_) { }
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
      showToastNotification('warning', 'Invalid Amount', 'Please enter a valid amount');
      return;
    }

    const amount = parseFloat(paymentFormData.amount);
    const paidAmount = parseFloat(paymentFormData.paid_amount || 0);

    if (paidAmount > amount) {
      showToastNotification('warning', 'Amount Exceeded', 'Paid amount cannot exceed total amount');
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
        showToastNotification('success', 'Payment Added', 'Payment added successfully!');
        setShowPaymentModal(false);
        setPaymentFormData({ amount: '', paid_amount: '', due_date: '' });
        await fetchPayments();
        await fetchQueryDetail();
      } else {
        showToastNotification('error', 'Failed', response.data.message || 'Failed to add payment');
      }
    } catch (err) {
      console.error('Failed to add payment:', err);
      const errorMsg = err.response?.data?.message || err.response?.data?.errors
        ? Object.values(err.response.data.errors).flat().join(', ')
        : 'Failed to add payment';
      showToastNotification('error', 'Error', errorMsg);
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

  // Fetch emails when mails tab is active (so sent mails show immediately)
  useEffect(() => {
    if (activeTab === 'mails' && id) {
      fetchLeadEmails();
      fetchGmailEmails();
    }
  }, [activeTab, id]);

  // Fetch WhatsApp messages when WhatsApp tab is active
  useEffect(() => {
    if (activeTab === 'whatsapp' && id) {
      fetchWhatsAppMessages();
    }
  }, [activeTab, id]);

  // Fetch WhatsApp messages for this lead
  const fetchWhatsAppMessages = async () => {
    if (!id) return;
    try {
      const response = await whatsappAPI.messages(id);
      if (response?.data?.success && response?.data?.data?.messages) {
        setWhatsappMessages(response.data.data.messages);
      } else if (response?.data?.success && Array.isArray(response.data.data)) {
        setWhatsappMessages(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch WhatsApp messages:', err);
    }
  };

  // Send WhatsApp message from tab
  const handleSendWhatsAppFromTab = async () => {
    if (!id || (!whatsappInput.trim() && !whatsappAttachment)) return;
    if (!lead?.phone) {
      showToastNotification('warning', 'Missing Phone', 'Lead has no phone number. Please add phone to send WhatsApp.');
      return;
    }
    setSendingWhatsapp(true);
    try {
      if (whatsappAttachment) {
        const res = await whatsappAPI.sendMedia(id, whatsappAttachment, whatsappInput.trim() || undefined);
        if (res?.data?.success) {
          setWhatsappInput('');
          setWhatsappAttachment(null);
          await fetchWhatsAppMessages();
        } else {
          showToastNotification('error', 'Send Failed', res?.data?.message || 'Failed to send');
        }
      } else {
        const res = await whatsappAPI.send(id, whatsappInput.trim());
        if (res?.data?.success) {
          setWhatsappInput('');
          await fetchWhatsAppMessages();
        } else {
          showToastNotification('error', 'Send Failed', res?.data?.message || 'Failed to send');
        }
      }
    } catch (err) {
      showToastNotification('error', 'Error', err?.response?.data?.message || 'Failed to send WhatsApp message');
    } finally {
      setSendingWhatsapp(false);
    }
  };

  // Auto-refresh WhatsApp when tab active
  useEffect(() => {
    if (activeTab !== 'whatsapp' || !id) return;
    const iv = setInterval(fetchWhatsAppMessages, 60000);
    return () => clearInterval(iv);
  }, [activeTab, id]);

  // Generate email body with enquiry details
  const generateEmailBody = () => {
    const confirmedOption = proposals?.find(p => p.confirmed === true);
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
      showToastNotification('warning', 'No Recipient', 'Please select at least one supplier, hotel or vehicle (with email)');
      return;
    }

    if (!supplierEmailForm.subject.trim()) {
      showToastNotification('warning', 'Missing Subject', 'Please enter a subject');
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
        showToastNotification('warning', 'Selection Required', 'Please select at least one supplier, hotel or vehicle with valid email address');
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

        showToastNotification(failedCount > 0 ? 'warning' : 'success', 'Mail Sent Status', message);

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
        showToastNotification('error', 'Send Failed', `${errorMsg}${errors.length > 0 ? ': ' + errors.join(', ') : ''}`);
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
        alertMsg += ` Details: ${errorDetails}`;
      }

      showToastNotification('error', 'Send Failed', alertMsg);
    } finally {
      setSendingEmail(false);
    }
  };

  const handlePaxModalOpen = () => {
    let currentPax = lead?.pax_details || [];
    if (!Array.isArray(currentPax)) currentPax = [];

    // Calculate total needed
    const totalAdults = lead?.adult || 0;
    const totalChildren = lead?.child || 0;
    const totalInfants = lead?.infant || 0;
    const totalPax = totalAdults + totalChildren + totalInfants;

    // Create a new list based on total pax count
    const newList = [];

    // Fill with existing data or create new slots
    for (let i = 0; i < totalPax; i++) {
      if (currentPax[i]) {
        newList.push({ ...currentPax[i] });
      } else {
        // New slot
        // If it's the first slot, pre-fill with lead contact info if available
        if (i === 0) {
          newList.push({
            name: lead?.client_name || '',
            phone: lead?.phone || '',
            email: lead?.email || '',
            age: '',
            gender: 'Adult' // Default to Adult 
          });
        } else {
          newList.push({ name: '', phone: '', email: '', age: '', gender: 'Adult' });
        }
      }
    }

    setPaxTempList(newList);
    setShowPaxModal(true);
  };

  const handlePaxChange = (index, field, value) => {
    const updated = [...paxTempList];
    if (!updated[index]) updated[index] = {};
    updated[index][field] = value;
    setPaxTempList(updated);
  };

  // Removed handleAddPaxRow and handleRemovePaxRow as we are enforcing the count based on lead data


  const handleSavePaxDetails = async () => {
    setSavingPax(true);
    try {
      await leadsAPI.update(id, { pax_details: paxTempList });
      showToastNotification('success', 'Saved', 'Passenger details updated successfully');
      setShowPaxModal(false);
      fetchLeadDetails();
    } catch (err) {
      console.error('Failed to save pax details:', err);
      showToastNotification('error', 'Error', 'Failed to save passenger details');
    } finally {
      setSavingPax(false);
    }
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) {
      showToastNotification('warning', 'Empty Note', 'Please enter a note');
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
        showToastNotification('success', 'Note Updated', 'Note has been updated successfully');
      } else {
        // Create note-only (no reminder) so it appears in Notes section, not Followups
        await followupsAPI.create({
          lead_id: parseInt(id),
          ...payload,
        });
        showToastNotification('success', 'Note Added', 'Note has been added successfully');
      }

      // Refresh lead details to get updated notes
      await fetchLeadDetails();
      setNoteText('');
      setShowNoteInput(false);
      setEditingNoteId(null);
    } catch (err) {
      console.error('Failed to add note:', err);
      showToastNotification('error', 'Error', err.response?.data?.message || 'Failed to add note');
    } finally {
      setAddingNote(false);
    }
  };

  const handleDeleteFollowup = async (followupId) => {
    if (!window.confirm('Delete this item?')) return;
    try {
      await followupsAPI.delete(followupId);
      showToastNotification('success', 'Deleted', 'Follow-up or Note deleted successfully');
      await fetchLeadDetails();
    } catch (err) {
      console.error('Failed to delete:', err);
      showToastNotification('error', 'Delete Failed', err.response?.data?.message || 'Failed to delete');
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
      showToastNotification('warning', 'Missing Date', 'Please select a reminder date');
      return;
    }

    // Only create followup if Set Reminder is Yes
    if (followupFormData.set_reminder !== 'Yes') {
      showToastNotification('warning', 'Reminder Disabled', 'Please enable reminder to create follow-up');
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
        showToastNotification('success', 'Follow-up Updated', 'Follow-up has been updated successfully');
      } else {
        await followupsAPI.create(payload);
        showToastNotification('success', 'Follow-up Added', 'Follow-up has been added successfully');
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
      showToastNotification('success', 'Follow-up Added', 'Follow-up added successfully!');
    } catch (err) {
      console.error('Failed to add followup:', err);
      const errorMsg = err.response?.data?.message ||
        (err.response?.data?.errors ? Object.values(err.response.data.errors).flat().join(', ') : null) ||
        err.response?.data?.error ||
        'Failed to add follow-up. Please check all fields and try again.';
      showToastNotification('error', 'Error', errorMsg);
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
      showToastNotification('error', 'Load Failed', 'Failed to load image. Try another or upload from device.');
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
      showToastNotification('error', 'Fetch Failed', 'Failed to load itineraries');
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
      } catch (_) { }

      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Add all options from itinerary (no limit) so query shows same options and prices as itinerary
          const filtered = parsed;
          optionsToAdd = filtered.map((opt, idx) => {
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
      showToastNotification('success', 'Itinerary Added', `${optionsToAdd.length} option(s) of "${itineraryName}" have been added to proposals.`);
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
    showToastNotification('success', 'Itinerary Added', `Itinerary "${itineraryName}" has been added to proposals.`);
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
      showToastNotification('warning', 'Missing Name', 'Please enter Itinerary Name.');
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
        showToastNotification('success', 'Created', 'Itinerary created successfully. You can add it to this query via "Insert itinerary".');
      }
    } catch (err) {
      console.error('Failed to create itinerary:', err);
      const msg = err.response?.data?.message || err.response?.data?.errors
        ? Object.values(err.response.data.errors || {}).flat().join(', ')
        : 'Failed to create itinerary. Please try again.';
      showToastNotification('error', 'Error', msg);
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

    // Prepare containers outside try so we can reuse in fallback
    let hotelOptions = {};

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
      hotelOptions = {};
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

      // Try to get itinerary details from backend – but fall back gracefully if missing (404)
      let itinerary = {};
      try {
        if (proposal.itinerary_id) {
          const itineraryResponse = await packagesAPI.get(proposal.itinerary_id);
          const raw = itineraryResponse?.data?.data;
          itinerary = (raw && raw.package) || raw || {};
        }
      } catch (err) {
        console.warn('packagesAPI.get failed, using proposal data for itinerary.', err);
        // Fallback: use proposal data only – enough for email/WhatsApp body and PDF
        itinerary = {
          itinerary_name: proposal.itinerary_name,
          title: proposal.itinerary_name,
          destinations: proposal.destination,
          duration: proposal.duration,
          price: proposal.price,
        };
      }

      // If there is a confirmed option, restrict selection to that option only
      let optionNumbers = Object.keys(hotelOptions).sort(
        (a, b) => parseInt(a, 10) - parseInt(b, 10)
      );
      if (hasConfirmedProposal) {
        const confirmed = getConfirmedOption();
        const confirmedNum =
          confirmed && confirmed.optionNumber != null
            ? confirmed.optionNumber.toString()
            : null;
        if (confirmedNum && optionNumbers.includes(confirmedNum)) {
          optionNumbers = [confirmedNum];
        }
      }

      const builtQuotation = {
        itinerary: {
          ...itinerary,
          duration: proposal.duration || itinerary.duration,
          destinations: proposal.destination || itinerary.destinations,
          day_events: dayEvents, // Include full day-by-day details
        },
        hotelOptions: hotelOptions,
      };
      setQuotationData(builtQuotation);

      // Set first option as selected if available
      const selOpt =
        optionNumbers.length > 0
          ? optionNumbers[0]
          : proposal.optionNumber?.toString() || null;
      if (selOpt) setSelectedOption(selOpt);

      if (openModal) setShowQuotationModal(true);
      return builtQuotation;
    } catch (err) {
      console.error('Failed to load quotation:', err);

      // Last-resort fallback: at least return minimal quotation so email can be generated
      const fallbackQuotation = {
        itinerary: {
          itinerary_name: proposal.itinerary_name,
          title: proposal.itinerary_name,
          destinations: proposal.destination,
          duration: proposal.duration,
          price: proposal.price,
        },
        hotelOptions: hotelOptions,
      };
      setQuotationData(fallbackQuotation);
      if (openModal) setShowQuotationModal(true);
      return fallbackQuotation;
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

  // Generate Policy Section HTML (supports plain text and HTML from rich editor)
  const generatePolicySection = (title, text, styles = {}) => {
    if (!text) return '';
    const isHtml = typeof text === 'string' && text.trim().match(/^<[a-z]/i);
    const formattedText = isHtml ? text : formatTextForHTML(text);
    const isList = !isHtml && formattedText.includes('<li>');

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
            <p style="margin: 8px 0 0 0;font-size:14px;opacity:0.9;">Delhi, India | 📞 +91-9871023004 | ✉ info@travelops.com</p>
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

  // optionPriceMap: { '1': { final, original?, discountPct?, discountAmount? }, '2': { ... } } for PDF price breakdown
  // optionNumForPriority: when provided (or when an option is confirmed), restrict PDF to that single option
  const generatePdfFullHtml = async (qData, optionPriceMap = null, optionNumForPriority = null) => {
    if (!qData || !lead) return '';
    let pdfCompanySettings = companySettings || null;
    try {
      const res = await settingsAPI.getAll();
      if (res?.data?.success && res?.data?.data) {
        const raw = res.data.data;
        pdfCompanySettings = Array.isArray(raw) ? raw.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {}) : raw;
      }
    } catch (_) { }
    const allPolicies = await getAllPolicies();
    const itinerary = qData.itinerary || {};
    const allOptionsRaw = Object.keys(qData.hotelOptions || {}).sort((a, b) => parseInt(a) - parseInt(b));
    const assignedUser = lead.assigned_user || users.find(u => u.id === lead.assigned_to);
    const logoUrl = pdfCompanySettings?.company_logo ? getDisplayImageUrl(pdfCompanySettings.company_logo) : null;
    const companyName = pdfCompanySettings?.company_name || 'TravelOps';
    const companyAddress = pdfCompanySettings?.company_address || 'Delhi, India';
    const companyPhone = pdfCompanySettings?.company_phone || '+91-9871023004';
    const companyEmail = pdfCompanySettings?.company_email || 'info@travelops.com';

    let html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#333;margin:0;padding:0;">
      <!-- PDF Header: Logo + Company Name + Details -->
      <div style="background:linear-gradient(135deg,#1e40af 0%,#2563eb 100%);color:#fff;padding:24px 30px;display:flex;align-items:center;gap:20px;flex-wrap:wrap;">
        ${logoUrl ? `<img src="${logoUrl}" alt="${companyName}" style="height:56px;max-width:180px;object-fit:contain;" />` : `<div style="font-size:28px;font-weight:bold;">${companyName}</div>`}
        <div style="flex:1;min-width:200px;">
          <div style="font-size:22px;font-weight:bold;margin-bottom:6px;">${companyName}</div>
          <div style="font-size:13px;opacity:0.95;">${companyAddress}</div>
          <div style="font-size:13px;opacity:0.95;">📞 ${companyPhone} | ✉ ${companyEmail}</div>
        </div>
      </div>

      <div style="padding:30px;max-width:800px;margin:0 auto;">
        <h2 style="color:#1e40af;font-size:24px;margin-bottom:20px;">Travel Quotation - ${itinerary.itinerary_name || 'Itinerary'}</h2>

        <!-- Query Information (A to Z query details) -->
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:20px;margin-bottom:24px;">
          <h3 style="margin:0 0 16px 0;font-size:18px;color:#1e293b;">Query Information</h3>
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            <tr><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-weight:600;color:#475569;width:140px;">Destination</td><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;">${lead.destination || 'N/A'}</td></tr>
            <tr><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-weight:600;color:#475569;">From Date</td><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;">${lead.travel_start_date ? formatDate(lead.travel_start_date) : 'N/A'}</td></tr>
            <tr><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-weight:600;color:#475569;">To Date</td><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;">${lead.travel_end_date ? formatDate(lead.travel_end_date) : (lead.travel_start_date ? formatDate(lead.travel_start_date) : 'N/A')}</td></tr>
            <tr><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-weight:600;color:#475569;">Travel Month</td><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;">${lead.travel_start_date ? getTravelMonth(lead.travel_start_date) : 'N/A'}</td></tr>
            <tr><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-weight:600;color:#475569;">Lead Source</td><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;">${lead.source || 'N/A'}</td></tr>
            <tr><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-weight:600;color:#475569;">Services</td><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;">${lead.service || 'Activities only'}</td></tr>
            <tr><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-weight:600;color:#475569;">Pax</td><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;">Adult: ${lead.adult ?? 1}, Child: ${lead.child ?? 0}, Infant: ${lead.infant ?? 0}</td></tr>
            <tr><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-weight:600;color:#475569;">Assign To</td><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;">${assignedUser?.name || 'N/A'}</td></tr>
            ${lead.remark ? `<tr><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-weight:600;color:#475569;">Description</td><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;">${lead.remark}</td></tr>` : ''}
          </table>
        </div>

        <!-- Quote summary -->
        <div style="background:#f1f5f9;padding:16px;border-radius:8px;margin-bottom:24px;">
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            <tr><td style="padding:6px 0;font-weight:600;color:#475569;">Query ID</td><td style="padding:6px 0;">${formatLeadId(lead.id)}</td></tr>
            <tr><td style="padding:6px 0;font-weight:600;color:#475569;">Destination</td><td style="padding:6px 0;">${itinerary.destinations || 'N/A'}</td></tr>
            <tr><td style="padding:6px 0;font-weight:600;color:#475569;">Duration</td><td style="padding:6px 0;">${itinerary.duration || 0} Nights / ${(itinerary.duration || 0) + 1} Days</td></tr>
            <tr><td style="padding:6px 0;font-weight:600;color:#475569;">Adults / Children</td><td style="padding:6px 0;">${lead.adult ?? 1} / ${lead.child ?? 0}</td></tr>
          </table>
        </div>
        ${itinerary.image ? `<img src="${getDisplayImageUrl(itinerary.image) || itinerary.image}" alt="${itinerary.itinerary_name}" style="width:100%;max-width:600px;height:240px;object-fit:cover;border-radius:10px;margin:0 auto 24px;display:block;" />` : ''}
    `;

    // Decide which option numbers to include:
    // - If any option is confirmed, always include only the confirmed option
    // - Else if a specific optionNumForPriority is provided, include only that option (if present)
    // - Else include all options
    let optionNumbers = allOptionsRaw;
    if (hasConfirmedProposal) {
      const confirmed = getConfirmedOption();
      const confirmedNum =
        confirmed && confirmed.optionNumber != null
          ? confirmed.optionNumber.toString()
          : null;
      if (confirmedNum && optionNumbers.includes(confirmedNum)) {
        optionNumbers = [confirmedNum];
      }
    } else if (optionNumForPriority != null) {
      const optKey = optionNumForPriority.toString();
      if (optionNumbers.includes(optKey)) {
        optionNumbers = [optKey];
      }
    }

    optionNumbers.forEach(optNum => {
      const hotels = qData.hotelOptions[optNum] || [];
      const priceInfo = optionPriceMap && optionPriceMap[String(optNum)] ? optionPriceMap[String(optNum)] : null;
      const finalPrice = priceInfo?.final != null ? Number(priceInfo.final) : hotels.reduce((sum, h) => sum + (parseFloat(h.price) || 0), 0);
      const originalPrice = priceInfo?.original != null ? Number(priceInfo.original) : null;
      const discountPct = priceInfo?.discountPct != null ? Number(priceInfo.discountPct) : 0;
      const discountAmount = priceInfo?.discountAmount != null ? Number(priceInfo.discountAmount) : (originalPrice != null && originalPrice > finalPrice ? originalPrice - finalPrice : 0);
      const showBreakdown = originalPrice != null && originalPrice > finalPrice && (discountPct > 0 || discountAmount > 0);

      html += `
        <div style="border:2px solid #2563eb;border-radius:10px;padding:24px;margin:24px 0;background:#fff;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <div style="background:#2563eb;color:#fff;padding:12px 16px;border-radius:8px;margin-bottom:16px;">
            <h2 style="margin:0;font-size:20px;">Option ${optNum}</h2>
          </div>
          ${showBreakdown ? `
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin-bottom:16px;">
            ${originalPrice != null && originalPrice > finalPrice ? `<div style="font-size:14px;color:#64748b;text-decoration:line-through;margin-bottom:4px;">₹${originalPrice.toLocaleString('en-IN')}</div>` : ''}
            <div style="font-size:22px;font-weight:bold;color:#1e293b;">₹${finalPrice.toLocaleString('en-IN')}/-</div>
            <div style="font-size:13px;color:#64748b;margin-top:4px;">Total Price</div>
            ${(discountPct > 0 || discountAmount > 0) ? `<div style="font-size:14px;color:#16a34a;font-weight:600;margin-top:6px;">Discount ${discountPct ? `(${discountPct}%)` : ''}: -₹${(discountAmount || 0).toLocaleString('en-IN')}</div>` : ''}
          </div>
          ` : ''}
          <h4 style="color:#1e40af;margin-bottom:12px;">Hotels Included</h4>
      `;
      hotels.forEach((hotel) => {
        html += `
          <div style="background:#f0f9ff;padding:16px;border-radius:8px;margin:12px 0;border-left:4px solid #2563eb;">
            ${hotel.image ? `<img src="${getDisplayImageUrl(hotel.image) || hotel.image}" alt="${hotel.hotelName}" style="width:100px;height:100px;object-fit:cover;border-radius:8px;float:left;margin-right:16px;" />` : ''}
            <div style="margin-left:${hotel.image ? '116px' : '0'};">
              <h4 style="margin:0 0 8px 0;color:#1e40af;">Day ${hotel.day}: ${hotel.hotelName || 'Hotel'}</h4>
              <p style="margin:4px 0;font-size:14px;"><strong>Category:</strong> ${hotel.category ? hotel.category + ' Star' : 'N/A'} | <strong>Room:</strong> ${hotel.roomName || 'N/A'} | <strong>Meal:</strong> ${hotel.mealPlan || 'N/A'}</p>
              ${hotel.checkIn ? `<p style="margin:4px 0;font-size:13px;">Check-in: ${hotel.checkIn} ${hotel.checkInTime || ''} | Check-out: ${hotel.checkOut || ''} ${hotel.checkOutTime || ''}</p>` : ''}
              ${hotel.price ? `<p style="margin:4px 0;font-size:13px;"><strong>Price:</strong> ₹${parseFloat(hotel.price).toLocaleString('en-IN')}</p>` : ''}
            </div>
            <div style="clear:both;"></div>
          </div>
        `;
      });
      html += `
          <div style="background:#dc2626;color:#fff;padding:16px;text-align:center;border-radius:8px;margin-top:16px;font-size:20px;font-weight:bold;">
            Total Package Price: ₹${finalPrice.toLocaleString('en-IN')}
          </div>
        </div>
      `;
    });

    html += `
        ${generateAllPoliciesSection(allPolicies, {
      termsBg: '#f8f9fa',
      borderRadius: '10px',
      termsBorder: '2px solid #2563eb',
      termsShadow: '0 5px 15px rgba(0,0,0,0.1)',
      termsTitleColor: '#1e40af',
      termsTitleSize: '18px',
      termsTextSize: '14px'
    })}
    ${allPolicies.thankYouMessage ? `<div style="background:#f8f9fa;padding:20px;border-radius:10px;margin-top:20px;border:2px solid #2563eb;"><div style="color:#555;line-height:1.8;font-size:14px;">${formatTextForHTML(allPolicies.thankYouMessage)}</div></div>` : ''}
        <div style="background:#1e293b;color:#fff;padding:20px;text-align:center;margin-top:30px;border-radius:0 0 10px 10px;">
          <p style="margin:0;">${companyName}</p>
          <p style="margin:8px 0 0 0;font-size:14px;opacity:0.9;">${companyAddress} | 📞 ${companyPhone} | ✉ ${companyEmail}</p>
        </div>
      </div>
    </div>
    `;
    return html;
  };

  // Generate professional email content.
  // By default, when an option is confirmed, only that option is included in the email.
  // When overrideQuotationData is passed (e.g. for PDF), use it so email is not blank due to async state.
  // optionNumForPriority: when provided (and no option is confirmed), restrict to that single option if present.
  const generateEmailContent = async (overrideQuotationData = null, optionNumForPriority = null) => {
    const qData = overrideQuotationData || quotationData;
    if (!qData) return '';

    const templateId = await getSelectedTemplate();
    const allPolicies = await getAllPolicies();
    const itinerary = qData.itinerary;
    const allOptionsRaw = Object.keys(qData.hotelOptions || {}).sort((a, b) => parseInt(a) - parseInt(b));

    // Decide which option numbers to include:
    // - If any option is confirmed, always include only the confirmed option
    // - Else if a specific optionNumForPriority is provided, include only that option (if present)
    // - Else include all options
    let allOptions = allOptionsRaw;
    if (hasConfirmedProposal) {
      const confirmed = getConfirmedOption();
      const confirmedNum =
        confirmed && confirmed.optionNumber != null
          ? confirmed.optionNumber.toString()
          : null;
      if (confirmedNum && allOptions.includes(confirmedNum)) {
        allOptions = [confirmedNum];
      }
    } else if (optionNumForPriority != null) {
      const optKey = optionNumForPriority.toString();
      if (allOptions.includes(optKey)) {
        allOptions = [optKey];
      }
    }

    // Use special templates
    if (templateId === 'template-2') {
      return generate3DPremiumEmailTemplate(itinerary, allOptions, qData.hotelOptions, allPolicies);
    } else if (templateId === 'template-3') {
      return generate3DFloatingEmailTemplate(itinerary, allOptions, qData.hotelOptions, allPolicies);
    } else if (templateId === 'template-4') {
      return generate3DLayeredEmailTemplate(itinerary, allOptions, qData.hotelOptions, allPolicies);
    } else if (templateId === 'template-5') {
      return generateAdventureEmailTemplate(itinerary, allOptions, qData.hotelOptions, allPolicies);
    } else if (templateId === 'template-6') {
      return generateBeachEmailTemplate(itinerary, allOptions, qData.hotelOptions, allPolicies);
    } else if (templateId === 'template-7') {
      return generateElegantEmailTemplate(itinerary, allOptions, qData.hotelOptions, allPolicies);
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
    const headerStyle = `background:${styles.headerBg};color:${styles.headerColor || 'white'};padding:30px;text-align:center;font-family:Arial,sans-serif;`;
    const contentStyle = 'padding:30px;max-width:800px;margin:0 auto;font-family:Arial,sans-serif;line-height:1.6;color:#333;';
    const quoteStyle = 'background:#f8f9fa;padding:20px;border-radius:8px;margin:20px 0;';
    const optionSectionStyle = `border:2px solid ${styles.optionBorder};border-radius:10px;padding:25px;margin:30px 0;background:white;box-shadow:0 2px 8px rgba(0,0,0,0.1);`;
    const optionHeaderStyle = `background:${styles.optionHeaderBg};color:${styles.optionHeaderColor || 'white'};padding:15px;border-radius:8px;margin-bottom:20px;`;
    const hotelCardStyle = `background:${styles.hotelCardBg};padding:15px;border-radius:8px;margin:15px 0;border-left:4px solid ${styles.optionBorder};`;
    const priceBoxStyle = `background:${styles.priceBoxBg};color:white;padding:20px;text-align:center;border-radius:8px;margin:20px 0;font-size:24px;font-weight:bold;`;
    const footerStyle = `background:${styles.footerBg};color:${styles.footerColor || 'white'};padding:20px;text-align:center;`;

    let htmlContent = `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#333;margin:0;padding:0;">
          <div style="${headerStyle}">
            <h1 style="margin:0;font-size:32px;">TravelOps</h1>
            <p style="margin:8px 0 0 0;">Delhi, India | Email: info@travelops.com | Mobile: +91-9871023004</p>
          </div>
          
          <div style="${contentStyle}">
            <h2 style="color:${styles.optionBorder};font-size:28px;">Travel Quotation</h2>
            
            ${itinerary.image ? `<img src="${itinerary.image}" alt="${itinerary.itinerary_name || 'Itinerary'}" style="width:100%;max-width:600px;height:300px;object-fit:cover;border-radius:10px;margin:20px auto;display:block;" />` : ''}
            
            <div style="${quoteStyle}">
              <h3 style="margin-top:0;">Quote Details</h3>
              <table style="width:100%;border-collapse:collapse;margin:15px 0;">
                <tr><td style="padding:8px;border-bottom:1px solid #e5e7eb;font-weight:bold;color:#4b5563;">Query ID:</td><td style="padding:8px;border-bottom:1px solid #e5e7eb;">${formatLeadId(lead?.id)}</td></tr>
                <tr><td style="padding:8px;border-bottom:1px solid #e5e7eb;font-weight:bold;color:#4b5563;">Destination:</td><td style="padding:8px;border-bottom:1px solid #e5e7eb;">${itinerary.destinations || 'N/A'}</td></tr>
                <tr><td style="padding:8px;border-bottom:1px solid #e5e7eb;font-weight:bold;color:#4b5563;">Duration:</td><td style="padding:8px;border-bottom:1px solid #e5e7eb;">${itinerary.duration || 0} Nights & ${(itinerary.duration || 0) + 1} Days</td></tr>
                <tr><td style="padding:8px;border-bottom:1px solid #e5e7eb;font-weight:bold;color:#4b5563;">Adults:</td><td style="padding:8px;border-bottom:1px solid #e5e7eb;">${lead?.adult || 1}</td></tr>
                <tr><td style="padding:8px;border-bottom:1px solid #e5e7eb;font-weight:bold;color:#4b5563;">Children:</td><td style="padding:8px;border-bottom:1px solid #e5e7eb;">${lead?.child || 0}</td></tr>
              </table>
            </div>
    `;

    // Add all options (dono options ke details PDF mein)
    allOptions.forEach(optNum => {
      const hotels = qData.hotelOptions[optNum] || [];
      const totalPrice = hotels.reduce((sum, h) => sum + (parseFloat(h.price) || 0), 0);

      htmlContent += `
        <div style="${optionSectionStyle}">
          <div style="${optionHeaderStyle}">
            <h2 style="margin:0;font-size:24px;">Option ${optNum}</h2>
          </div>
          
          <h3 style="color:#1e40af;">🏨 Hotels Included:</h3>
      `;

      hotels.forEach((hotel, idx) => {
        htmlContent += `
          <div style="${hotelCardStyle}">
            ${hotel.image ? `<img src="${hotel.image}" alt="${hotel.hotelName || 'Hotel'}" style="width:120px;height:120px;object-fit:cover;border-radius:8px;float:left;margin-right:15px;" />` : ''}
            <div style="margin-left:${hotel.image ? '135px' : '0'};">
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
          <div style="${priceBoxStyle}">
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
          <div style="background:#f8f9fa;padding:20px;border-radius:10px;margin-top:20px;border:2px solid ${styles.optionBorder};box-shadow:0 5px 15px rgba(0,0,0,0.1);">
            <div style="color:#555;line-height:1.8;font-size:14px;">
              ${formatTextForHTML(allPolicies.thankYouMessage)}
            </div>
          </div>
          ` : ''}
          
          <div style="${footerStyle}">
            <p style="margin:0;">Thank you for choosing TravelOps!</p>
            <p style="margin:8px 0 0 0;">For any queries, please contact us at info@travelops.com or +91-9871023004</p>
          </div>
      </div>
    `;

    return htmlContent;
  };

  const handleSendMail = async (optionNum, quotationDataOverride = null) => {
    let dataForSend = quotationDataOverride || quotationData;
    if (!dataForSend || !lead) {
      const confirmed = getConfirmedOption();
      const baseProposal = confirmed || selectedProposal || (proposals && proposals[0]);
      if (!baseProposal) {
        showToastNotification('warning', 'No Proposal', 'Please create at least one proposal before sending.');
        return;
      }
      const built = await handleViewQuotation(baseProposal, false);
      if (!built) {
        showToastNotification('error', 'Quotation Error', 'Failed to load quotation. Please try again.');
        return;
      }
      dataForSend = quotationDataOverride || built;
    }
    if (!dataForSend) return;

    const recipientEmail = lead?.email || '';
    if (!recipientEmail) {
      showToastNotification('warning', 'Email Required', 'Lead email is required to send. Please add customer email.');
      return;
    }

    const subject = `Travel Quotation - ${dataForSend.itinerary?.itinerary_name || 'Itinerary'} - ${formatLeadId(lead.id)}`;
    const emailContent = await generateEmailContent(dataForSend, optionNum);

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

        showToastNotification('success', 'Email Sent!', 'Email sent successfully via Gmail! Lead status updated to PROPOSAL.');
        await fetchGmailEmails();
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

        showToastNotification('success', 'Email Sent!', 'Email sent successfully! Lead status updated to PROPOSAL.');
      } else {
        const msg = response.data?.message || response.data?.error || 'Unknown error';
        showToastNotification('error', 'Mail Error', 'Mail could not be sent. Issue: ' + msg);
      }
    } catch (error) {
      console.error('Error sending email:', error);
      const msg = error.response?.data?.message || error.response?.data?.error || error.message || 'Unknown error';
      showToastNotification('error', 'Mail Failed', 'Mail could not be sent. Issue: ' + msg);
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

  // quotationDataOverride: pass when downloading so PDF is not blank. Renders in iframe so content is not blank.
  // itineraryIdForPricing: when set, fetches final_client_prices + option_gst_settings so PDF shows correct Total Price and discount breakdown (not ₹0).
  // PDF includes: company header (logo/name/details), query info, both options A–Z with full price details, all terms & policies.
  // quotationDataOverride: pass when downloading so PDF is not blank.
  // itineraryIdForPricing: when set, fetches final_client_prices + option_gst_settings so PDF shows correct Total Price.
  const handleDownloadSingleOptionPdf = async (optionNum, quotationDataOverride = null, itineraryIdForPricing = null) => {
    const qData = quotationDataOverride || quotationData;
    if (!qData) {
      showToastNotification('warning', 'Quotation Failed', 'Quotation data not loaded. Please open View Quotation first or try again.');
      return;
    }

    let optionPriceMap = null;
    if (itineraryIdForPricing) {
      try {
        const res = await itineraryPricingAPI.get(itineraryIdForPricing);
        const data = res?.data?.data;
        const fp = data?.final_client_prices;
        const ogst = data?.option_gst_settings || {};
        if (fp && typeof fp === 'object' && !Array.isArray(fp)) {
          optionPriceMap = {};
          Object.keys(fp).forEach((key) => {
            const finalVal = parseFloat(fp[key]);
            if (Number.isNaN(finalVal)) return;
            const discountPct = parseFloat(ogst[key]?.discount) || 0;
            let original = finalVal;
            let discountAmount = 0;
            if (discountPct > 0 && discountPct < 100) {
              original = Math.round(finalVal / (1 - discountPct / 100));
              discountAmount = original - finalVal;
            }
            optionPriceMap[key] = { final: finalVal, original, discountPct, discountAmount };
          });
        }
      } catch (_) { }
    }

    // Fallback: use prices from proposal cards
    const tid = itineraryIdForPricing;
    if ((!optionPriceMap || Object.keys(optionPriceMap).length === 0) && tid && proposals?.length) {
      optionPriceMap = {};
      proposals.filter((p) => p.itinerary_id === tid).forEach((p) => {
        const optNum = String(p.optionNumber ?? 1);
        const price = parseFloat(p.price);
        if (!Number.isNaN(price) && price > 0) {
          optionPriceMap[optNum] = { final: price };
        }
      });
      if (Object.keys(optionPriceMap).length === 0) optionPriceMap = null;
    }

    // Calculate base price for the main quotation record (e.g. from Option 1 or requested option)
    let basePrice = 0;
    const targetOption = optionNum ? String(optionNum) : (Object.keys(optionPriceMap || {})[0] || '1');
    if (optionPriceMap && optionPriceMap[targetOption]) {
      basePrice = optionPriceMap[targetOption].final || 0;
    } else if (qData.hotelOptions && qData.hotelOptions[targetOption]) {
      // Sum of hotel prices if no global price map
      basePrice = qData.hotelOptions[targetOption].reduce((sum, h) => sum + (parseFloat(h.price) || 0), 0);
    }

    try {
      showToastNotification('info', 'Generating PDF', 'Backend is generating PDF...');

      // Prepare data for Backend Quotation Store
      const payload = {
        lead_id: lead.id,
        title: qData.itinerary?.itinerary_name || 'Travel Quotation',
        description: `Generated for ${lead.client_name} - ${qData.itinerary?.itinerary_name}`,
        travel_start_date: lead.travel_start_date || new Date().toISOString().split('T')[0], // Fallback to today if null
        travel_end_date: lead.travel_end_date || new Date().toISOString().split('T')[0],
        adults: parseInt(lead.adult || 1),
        children: parseInt(lead.child || 0),
        infants: parseInt(lead.infant || 0),
        base_price: basePrice,
        currency: 'INR',
        valid_until: null, // Optional
        template: 'default',
        itinerary: qData.itinerary, // Full object
        // Add options data specially so blade can use it
        custom_fields: {
          hotel_options: qData.hotelOptions,
          display_option: optionNum, // Single option vs All
          policies: qData.policies // Send all policies (Remarks, Cancellation, etc.)
        },
        inclusions: qData.policies?.inclusions || [],
        exclusions: qData.policies?.exclusions || [],
        pricing_breakdown: optionPriceMap,
        terms_conditions: qData.policies?.terms || ''
      };

      // 1. Create Quotation in Database
      const createRes = await quotationsAPI.create(payload);
      if (!createRes.data.success) {
        throw new Error(createRes.data.message || 'Failed to create quotation record');
      }
      const quotationId = createRes.data.data.quotation.id;
      console.log('Quotation Created ID:', quotationId);

      // 2. Download the PDF
      const downloadRes = await quotationsAPI.download(quotationId);

      // Handle File Download
      const blob = new Blob([downloadRes.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const fileName = `Quotation_${quotationId}_${lead.client_name.replace(/\s+/g, '_')}.pdf`;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      showToastNotification('success', 'PDF Downloaded', 'PDF served from Backend (Blade Template).');

    } catch (error) {
      console.error('Error generating PDF via Backend:', error);
      showToastNotification('error', 'Download Failed', error.response?.data?.message || error.message || 'Backend error');
    }
  };

  const handleSendWhatsApp = async (optionNum, quotationDataOverride = null) => {
    const qData = quotationDataOverride || quotationData;
    if (!qData || !lead) {
      showToastNotification('warning', 'Quotation Needed', 'Please load quotation first');
      return;
    }

    // Build WhatsApp message from quotation
    let message = `*Travel Quotation - ${qData.itinerary?.itinerary_name || 'Itinerary'}*\n\n`;
    message += `Query ID: ${formatLeadId(lead.id)}\n`;
    message += `Destination: ${qData.itinerary?.destinations || 'N/A'}\n`;
    message += `Duration: ${qData.itinerary?.duration || 0} Days\n\n`;
    const allOptionsRaw = Object.keys(qData.hotelOptions || {}).sort((a, b) => parseInt(a) - parseInt(b));

    // Decide which option numbers to include:
    // - If any option is confirmed, always include only the confirmed option
    // - Else if a specific optionNum is provided, include only that option (if present)
    // - Else include all options
    let optionNumbers = allOptionsRaw;
    if (hasConfirmedProposal) {
      const confirmed = getConfirmedOption();
      const confirmedNum =
        confirmed && confirmed.optionNumber != null
          ? confirmed.optionNumber.toString()
          : null;
      if (confirmedNum && optionNumbers.includes(confirmedNum)) {
        optionNumbers = [confirmedNum];
      }
    } else if (optionNum != null) {
      const optKey = optionNum.toString();
      if (optionNumbers.includes(optKey)) {
        optionNumbers = [optKey];
      }
    }

    optionNumbers.forEach(optNum => {
      const hotels = qData.hotelOptions[optNum] || [];
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

        showToastNotification('success', 'WhatsApp Sent!', 'WhatsApp message sent successfully! Lead status updated to PROPOSAL.');
      } else {
        showToastNotification('error', 'WhatsApp Error', response.data.message || 'Failed to send WhatsApp message');
      }
    } catch (error) {
      console.error('Error sending WhatsApp:', error);
      showToastNotification('error', 'WhatsApp Failed', error.response?.data?.message || 'Failed to send WhatsApp message');
    }
  };

  // Send option directly from card (Email / WhatsApp / Both) - loads quotation if needed
  const handleSendOptionFromCard = async (opt, channel) => {
    setSendDropdownOptId(null);
    if (!lead?.email && (channel === 'email' || channel === 'both')) {
      showToastNotification('warning', 'Email Required', 'Customer email is required. Please add email to the lead.');
      return;
    }
    if (!lead?.phone && (channel === 'whatsapp' || channel === 'both')) {
      showToastNotification('warning', 'Phone Required', 'Customer phone is required for WhatsApp. Please add phone to the lead.');
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
      showToastNotification('error', 'Send Failed', 'Failed to send. ' + (err.message || ''));
    } finally {
      setSendingOptionChannel(null);
    }
  };

  // Download PDF directly from card - loads quotation and passes data so PDF is not blank; PDF includes all options
  const handleDownloadPdfFromCard = async (opt) => {
    try {
      const qData = quotationData && selectedProposal?.id === opt.id
        ? quotationData
        : await handleViewQuotation(opt, false);
      if (!qData) {
        showToastNotification('error', 'Quotation Error', 'Could not load quotation. Please try again.');
        return;
      }
      setQuotationData(qData);
      setSelectedProposal(opt);
      const optNum = opt.optionNumber?.toString() || Object.keys(qData.hotelOptions || {})[0];
      setSelectedOption(optNum);
      await handleDownloadSingleOptionPdf(optNum, qData, opt.itinerary_id || null);
    } catch (err) {
      console.error('PDF download failed:', err);
      showToastNotification('error', 'Download Failed', 'Failed to download PDF. ' + (err.message || ''));
    }
  };

  // Download PDF with both options – single button above cards (black box area)
  const handleDownloadAllOptionsPdf = async () => {
    const first = visibleProposals[0];
    if (!first) {
      showToastNotification('warning', 'No Proposal', 'Koi proposal nahi hai. Pehle itinerary add karein.');
      return;
    }
    try {
      const qData = quotationData && selectedProposal?.itinerary_id === first.itinerary_id
        ? quotationData
        : await handleViewQuotation(first, false);
      if (!qData) {
        showToastNotification('error', 'Quotation Failed', 'Could not load quotation. Please try again.');
        return;
      }
      setQuotationData(qData);
      setSelectedProposal(first);
      const optNum = Object.keys(qData.hotelOptions || {})[0] || 1;
      setSelectedOption(optNum);

      // Check if there's a confirmed option
      const confirmedProposal = proposals?.find(p => p.confirmed === true);
      const optionToDownload = confirmedProposal?.optionNumber ?? null;

      await handleDownloadSingleOptionPdf(optionToDownload, qData, first.itinerary_id || null);
    } catch (err) {
      console.error('Download PDF failed:', err);
      showToastNotification('error', 'Download Failed', 'PDF download nahi ho paya. ' + (err?.message || ''));
    }
  };

  // Send both options via Email / WhatsApp – single button above cards
  const handleSendAllOptions = async (channel) => {
    setSendAllDropdownOpen(false);
    const first = visibleProposals[0];
    if (!first) {
      showToastNotification('warning', 'No Proposal', 'Koi proposal nahi hai. Pehle itinerary add karein.');
      return;
    }
    if ((channel === 'email' || channel === 'both') && !lead?.email) {
      showToastNotification('warning', 'Email Required', 'Customer email required. Lead mein email add karein.');
      return;
    }
    if ((channel === 'whatsapp' || channel === 'both') && !lead?.phone) {
      showToastNotification('warning', 'Phone Required', 'Customer phone required for WhatsApp. Lead mein phone add karein.');
      return;
    }
    setSendingOptionChannel(channel);
    try {
      const qData = quotationData && selectedProposal?.itinerary_id === first.itinerary_id
        ? quotationData
        : await handleViewQuotation(first, false);
      if (!qData) return;
      setQuotationData(qData);
      setSelectedProposal(first);
      const optNum = Object.keys(qData.hotelOptions || {})[0] || 1;
      setSelectedOption(optNum);

      // Check if there's a confirmed option
      const confirmedProposal = proposals?.find(p => p.confirmed === true);
      const optionToSend = confirmedProposal?.optionNumber ?? optNum;

      await new Promise(r => setTimeout(r, 100));
      if (channel === 'email' || channel === 'both') await handleSendMail(optionToSend, qData);
      if (channel === 'whatsapp' || channel === 'both') await handleSendWhatsApp(optionToSend, qData);
    } catch (err) {
      console.error('Send failed:', err);
      showToastNotification('error', 'Send Failed', 'Send nahi ho paya. ' + (err?.message || ''));
    } finally {
      setSendingOptionChannel(null);
    }
  };

  const handleSendAllFromGroup = async (group, channel) => {
    if (!group?.options?.length) {
      showToastNotification('warning', 'No Options', 'No options found for this itinerary.');
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
      showToastNotification('warning', 'Phone Missing', 'Phone number not available for this lead.');
    }
  };

  // Generate email content for confirmed option only
  const generateConfirmedOptionEmailContent = async (confirmedOption) => {
    if (!confirmedOption || !quotationData) return '';

    // Load quotation data for the confirmed option
    await handleViewQuotation(confirmedOption, false);

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
      showToastNotification('warning', 'No Confirmation', 'Please confirm an option first');
      return;
    }

    if (!lead || !lead.email) {
      showToastNotification('warning', 'Email Missing', 'Client email not available');
      return;
    }

    // Load quotation data for confirmed option
    await handleViewQuotation(confirmedOption, false);

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
      showToastNotification('success', 'Copied!', 'Confirmed itinerary email content copied to clipboard!');
      window.open(mailtoLink);
    }).catch(() => {
      window.location.href = `mailto:${lead.email}?subject=${subject}&body=${encodeURIComponent('Please find your confirmed travel itinerary attached.')}`;
    });
  };

  // Send confirmed option via WhatsApp
  const handleSendConfirmedOptionWhatsApp = async () => {
    const confirmedOption = getConfirmedOption();
    if (!confirmedOption) {
      showToastNotification('warning', 'No Confirmation', 'Please confirm an option first');
      return;
    }

    if (!lead || !lead.phone) {
      showToastNotification('warning', 'Phone Missing', 'Client phone number not available');
      return;
    }

    // Load quotation data for confirmed option
    await handleViewQuotation(confirmedOption, false);

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
      showToastNotification('error', 'Update Failed', 'Failed to update status');
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

  const assignedUser = lead.assigned_user || users.find(u => u.id === lead.assigned_to);



  return (
    <Layout Header={() => null} padding={20}>
      <div className="p-4 sm:p-6" style={{ backgroundColor: settings?.dashboard_background_color || '#D8DEF5', minHeight: '100vh' }}>
        {/* Header */}
        <div className="mb-2 rounded-lg bg-white p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div className="flex flex-col items-start gap-2 min-w-0">

              <div className="flex flex-wrap items-center gap-2">
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Left Column */}
          <div className="lg:col-span-1 p-4 sm:p-6 shadow rounded-lg bg-white space-y-6">
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
                  value={lead.assigned_user?.name || assignedUser?.name || "N/A"}
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

            <div className="bg-white rounded-xl shadow-sm border p-5 mb-6">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-lg font-semibold text-gray-800">
                  Travellers (Pax)
                </h2>
                <button
                  onClick={handlePaxModalOpen}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                >
                  <Pencil className="w-3 h-3" /> Edit
                </button>
              </div>

              {lead?.pax_details && Array.isArray(lead.pax_details) && lead.pax_details.length > 0 ? (
                <div className="space-y-3">
                  {lead.pax_details.map((pax, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row sm:justify-between sm:items-center text-sm border-b border-gray-100 last:border-0 pb-2 last:pb-0 gap-1">
                      <div>
                        <span className="font-medium text-gray-700 block">{pax.name || `Person ${idx + 1}`}</span>
                        <div className="text-xs text-gray-500 flex gap-2">
                          {pax.phone && <span className="flex items-center gap-1"><Smartphone className="w-3 h-3" />{pax.phone}</span>}
                          {pax.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{pax.email}</span>}
                        </div>
                      </div>
                      <div className="flex gap-3 text-gray-500">
                        <span>{pax.gender || '-'}</span>
                        {pax.age && <span>{pax.age} yrs</span>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-500 italic">
                  No traveller details added.
                </div>
              )}
            </div>

            {/* Related Customer */}
            <div className="bg-white rounded-xl shadow-sm border p-5">
              <h2 className="text-lg font-semibold text-gray-800 mb-3">
                Related Customer
              </h2>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
                {/* LEFT INFO */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-gray-500 mb-1">
                    {lead.client_title ? `${lead.client_title} ` : ''}
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

                {/* DIVIDER - hidden on mobile */}
                <div className="hidden sm:block h-16 w-px bg-gray-300 flex-shrink-0"></div>

                {/* RIGHT ACTIONS */}
                <div className="flex flex-col sm:flex-row lg:flex-col gap-3 min-w-0 sm:min-w-[180px] shrink-0">
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
            <div className={` rounded-[28px] relative border-2 border-gray-200 p-5 ${showNoteInput ? 'bg-gray-400' : 'bg-white'}`}>
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
                    <div className="w-full max-w-[420px] bottom-0 z-10 absolute">
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
          <div className="lg:col-span-2 p-4 sm:p-6 bg-white rounded-lg min-w-0">
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
                  ].map(({ key, label }, index) => (
                    <button
                      key={key}
                      onClick={() => setActiveTab(key)}
                      className={`px-4  py-3 ${index == 0 ? "border-l rounded-l-full " : index == 10 ? " border-r rounded-r-full" : null}  border-l-0 border   text-sm font-medium whitespace-nowrap ${activeTab === key
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
                          </div>
                        </div>
                      );
                    })()}



                    {/* Proposals List – single card with all options inside */}
                    {visibleProposals.length === 0 ? (
                      <div className="text-center w-full py-12 text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="mb-2">No proposals added yet</p>
                        <p className="text-sm">Click "Insert itinerary" to add an itinerary as a proposal</p>
                      </div>
                    ) : (() => {
                      const first = visibleProposals[0] || proposals[0];
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
                                  navigate(`/itineraries/${first.itinerary_id}?fromLead=${id}`, { state: { fromLeadId: id } });
                                } else if (proposals[0]?.itinerary_id) {
                                  navigate(`/itineraries/${proposals[0].itinerary_id}?fromLead=${id}`, { state: { fromLeadId: id } });
                                } else {
                                  showToastNotification('error', 'Error', 'Itinerary ID not found for this proposal.');
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
                              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                                <div>
                                  <div className="text-lg text-blue-500 font-medium">
                                    Pax: <span className="font-semibold">{lead?.adult ?? 1}</span> Adult(s) – <span className="font-semibold">{lead?.child ?? 0}</span> Child(s)
                                  </div>
                                  <div className="text-sm text-gray-700 mt-0.5">
                                    <strong>Date:</strong> {lead?.travel_start_date ? formatDateForDisplay(lead.travel_start_date) : 'N/A'} &nbsp;
                                    <strong>Till:</strong> {lead?.travel_end_date ? formatDateForDisplay(lead.travel_end_date) : 'N/A'}
                                  </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={refreshProposalPricesFromServer}
                                    disabled={refreshingProposalPrices || !proposals.some((p) => p.itinerary_id)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Load latest prices from server"
                                  >
                                    <RefreshCw className={`h-4 w-4 ${refreshingProposalPrices ? 'animate-spin' : ''}`} />
                                    {refreshingProposalPrices ? 'Refreshing…' : 'Refresh prices'}
                                  </button>
                                  <div className="relative" onClick={(e) => e.stopPropagation()}>
                                    <button
                                      type="button"
                                      onClick={() => setSendAllDropdownOpen(!sendAllDropdownOpen)}
                                      disabled={sendingOptionChannel || !visibleProposals.length}
                                      className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg border border-green-700 transition-colors disabled:opacity-50"
                                      title="Dono options ek saath Email / WhatsApp pe bhejen"
                                    >
                                      <Send className="h-4 w-4" />
                                      {sendingOptionChannel ? 'Sending…' : 'Send'}
                                      <ChevronDown className="h-4 w-4" />
                                    </button>
                                    {sendAllDropdownOpen && (
                                      <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1 min-w-[180px]">
                                        <button type="button" onClick={() => handleSendAllOptions('email')} className="w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center gap-2 text-sm">
                                          <Mail className="h-4 w-4 text-blue-600" /> Email (dono options)
                                        </button>
                                        <button type="button" onClick={() => handleSendAllOptions('whatsapp')} className="w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center gap-2 text-sm">
                                          <MessageCircle className="h-4 w-4 text-green-600" /> WhatsApp (dono options)
                                        </button>
                                        <button type="button" onClick={() => handleSendAllOptions('both')} className="w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center gap-2 text-sm">
                                          <Send className="h-4 w-4" /> Dono pe bhejo (Email + WhatsApp)
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={handleDownloadAllOptionsPdf}
                                    disabled={!visibleProposals.length}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg border border-purple-700 transition-colors disabled:opacity-50"
                                    title="Dono options ka ek PDF download karein"
                                  >
                                    <Download className="h-4 w-4" />
                                    Download PDF
                                  </button>
                                </div>
                              </div>
                              <hr className="my-4" />

                              {/* Package options – professional card layout */}
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                                {visibleProposals.map((opt) => {
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
                                          {/* Breakdown: Base + Tax - Discount */}
                                          {opt.pricing && (opt.pricing.totalGross > 0 || opt.pricing.totalTax > 0) && (
                                            <div className="mb-2 space-y-1 bg-gray-50 p-2 rounded text-xs">
                                              {opt.pricing.totalGross > 0 && (
                                                <div className="flex justify-between text-gray-600">
                                                  <span>Base Price:</span>
                                                  <span>₹{Math.round(opt.pricing.totalGross).toLocaleString('en-IN')}</span>
                                                </div>
                                              )}
                                              {(opt.pricing.totalTax > 0) && (
                                                <div className="flex justify-between text-gray-600">
                                                  <span>Taxes (GST/TCS):</span>
                                                  <span>+ ₹{Math.round(opt.pricing.totalTax).toLocaleString('en-IN')}</span>
                                                </div>
                                              )}
                                              {(opt.pricing.discountAmount > 0) && (
                                                <div className="flex justify-between text-green-600 font-medium">
                                                  <span>Discount ({opt.pricing.discount}%):</span>
                                                  <span>- ₹{Math.round(opt.pricing.discountAmount).toLocaleString('en-IN')}</span>
                                                </div>
                                              )}
                                            </div>
                                          )}
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
                                              onClick={(e) => { e.stopPropagation(); navigate(`/itineraries/${opt.itinerary_id}?fromLead=${id}`, { state: { fromLeadId: id } }); }}
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

                              {/* Delete all proposals for this lead (only when nothing is confirmed) */}
                              {!hasConfirmedProposal && (
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
                              )}
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
                ) :
                  activeTab === 'mails' ? (
                    <MailsTab
                      lead={lead}
                      user={user}
                      loadingEmails={loadingEmails}
                      loadingGmail={loadingGmail}
                      leadEmails={leadEmails}
                      gmailEmails={gmailEmails}
                      syncingInbox={syncingInbox}
                      openComposeModal={openComposeModal}
                      handleSyncInbox={handleSyncInbox}
                      openReplyModal={openReplyModal}
                      rewriteHtmlImageUrls={rewriteHtmlImageUrls}
                      sanitizeEmailHtmlForDisplay={sanitizeEmailHtmlForDisplay}
                    />
                  )
                    : activeTab === 'whatsapp' ? (
                      <WhatsAppTab
                        lead={lead}
                        whatsappMessages={whatsappMessages}
                        whatsappInput={whatsappInput}
                        setWhatsappInput={setWhatsappInput}
                        whatsappAttachment={whatsappAttachment}
                        setWhatsappAttachment={setWhatsappAttachment}
                        sendingWhatsapp={sendingWhatsapp}
                        fetchWhatsAppMessages={fetchWhatsAppMessages}
                        handleSendWhatsAppFromTab={handleSendWhatsAppFromTab}
                      />
                    )
                      : activeTab === 'followups' ? (
                        <FollowupsTab
                          followups={followups}
                          setEditingFollowupId={setEditingFollowupId}
                          setFollowupFormData={setFollowupFormData}
                          setShowFollowupModal={setShowFollowupModal}
                          handleDeleteFollowup={handleDeleteFollowup}
                          convertTo12Hour={convertTo12Hour}
                          followupsAPI={followupsAPI}
                          fetchLeadDetails={fetchLeadDetails}
                          showToastNotification={showToastNotification}
                        />
                      )
                        : activeTab === 'suppComm' ? (
                          <SuppCommTab
                            lead={lead}
                            id={id}
                            getConfirmedOption={getConfirmedOption}
                            formatDateForDisplay={formatDateForDisplay}
                            supplierEmailForm={supplierEmailForm}
                            setSupplierEmailForm={setSupplierEmailForm}
                            handleSendSupplierEmail={handleSendSupplierEmail}
                            sendingEmail={sendingEmail}
                            suppliers={suppliers}
                            selectedSuppliers={selectedSuppliers}
                            handleSelectSupplier={handleSelectSupplier}
                            handleSelectAllSuppliers={handleSelectAllSuppliers}
                            selectAllSuppliers={selectAllSuppliers}
                            hotelsFromConfirmedOption={hotelsFromConfirmedOption}
                            selectedHotels={selectedHotels}
                            handleSelectHotel={handleSelectHotel}
                            handleSelectAllHotels={handleSelectAllHotels}
                            selectAllHotels={selectAllHotels}
                            vehiclesFromProposals={vehiclesFromProposals}
                            selectedVehicles={selectedVehicles}
                            handleSelectVehicle={handleSelectVehicle}
                            handleSelectAllVehicles={handleSelectAllVehicles}
                            selectAllVehicles={selectAllVehicles}
                          />
                        ) :
                          activeTab === 'postSales' ? (
                            <PostSalesTab />
                          ) :
                            activeTab === 'voucher' ? (
                              <VoucherTab
                                lead={lead}
                                getConfirmedOption={getConfirmedOption}
                                quotationData={quotationData}
                                handleVoucherPreview={handleVoucherPreview}
                                handleVoucherDownload={handleVoucherDownload}
                                handleVoucherSend={handleVoucherSend}
                                voucherActionLoading={voucherActionLoading}
                              />
                            ) :
                              activeTab === 'docs' ? (
                                <DocsTab />
                              ) :
                                activeTab === 'invoice' ? (
                                  <InvoiceTab
                                    loadingHistory={loadingHistory}
                                    queryDetailInvoices={queryDetailInvoices}
                                    handleInvoicePreview={handleInvoicePreview}
                                    handleInvoiceDownload={handleInvoiceDownload}
                                    handleInvoiceSend={handleInvoiceSend}
                                    invoiceActionLoading={invoiceActionLoading}
                                  />
                                ) :
                                  activeTab === 'billing' ? (
                                    <BillingTab
                                      lead={lead}
                                      getConfirmedOption={getConfirmedOption}
                                      quotationData={quotationData}
                                      paymentSummary={paymentSummary}
                                      payments={payments}
                                      loadingPayments={loadingPayments}
                                      setPaymentFormData={setPaymentFormData}
                                      setShowPaymentModal={setShowPaymentModal}
                                      formatDateForDisplay={formatDateForDisplay}
                                    />
                                  )
                                    :
                                    activeTab === 'history' && (
                                      <HistoryTab
                                        loadingHistory={loadingHistory}
                                        activityTimeline={activityTimeline}
                                      />
                                    )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Voucher Preview Popup */}
      {
        showVoucherPopup && (
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
        )
      }

      {/* Invoice Preview Popup */}
      {
        showInvoicePreview && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto py-8" onClick={() => setShowInvoicePreview(false)}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl mx-4 my-auto max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center p-4 border-b border-gray-200 shrink-0">
                <h2 className="text-lg font-bold text-gray-800">Invoice Preview</h2>
                <button type="button" onClick={() => setShowInvoicePreview(false)} className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="overflow-auto flex-1 p-4 min-h-0">
                <iframe title="Invoice preview" srcDoc={invoicePreviewHtml} className="w-full border border-gray-200 rounded-lg bg-white" style={{ minHeight: '60vh' }} />
              </div>
            </div>
          </div>
        )
      }

      {/* Itinerary Setup Modal */}
      {
        showItineraryModal && (
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
        )
      }

      {/* Choose from Library modal (for Itinerary setup) */}
      {
        showItineraryLibraryModal && (
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
        )
      }

      {/* Insert Itinerary Modal */}
      {
        showInsertItineraryModal && (
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
        )
      }

      {/* Add Follow-up Modal */}
      {
        showFollowupModal && (
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
        )
      }

      {/* Quotation Modal */}
      {
        showQuotationModal && selectedProposal && quotationData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
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
                            showToastNotification('success', 'Copied', 'Complete quotation (all options) copied to clipboard! Paste it in your email client.');
                          }).catch(() => {
                            showToastNotification('warning', 'Clipboards Failed', 'Please use Print option to generate PDF with all options');
                          });
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium"
                        title="Send All Options via Email"
                      >
                        <Mail className="h-4 w-4" />
                        Send All Options
                      </button>
                      <button
                        onClick={() => handleDownloadSingleOptionPdf(selectedOption, quotationData)}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium"
                        title="Download PDF (all options)"
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
              <div className="p-6 overflow-y-auto flex-1">
                {loadingQuotation ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <>
                    {/* Option Selector */}
                    {quotationData.hotelOptions && quotationOptionNumbers.length > 0 && (
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Select Option:
                        </label>
                        <div className="flex gap-2 flex-wrap">
                          {quotationOptionNumbers.map((optionNum) => (
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
        )
      }

      {/* Payment Modal */}
      {
        showPaymentModal && (
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
        )
      }

      {/* Compose Email Modal */}
      {
        showComposeModal && (
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
        )
      }
      {/* Pax Details Modal */}
      {
        showPaxModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
              <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                <h3 className="text-lg font-bold text-gray-800">Manage Travellers</h3>
                <button
                  onClick={() => setShowPaxModal(false)}
                  className="text-gray-500 hover:text-gray-700 p-1 hover:bg-gray-200 rounded-full transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 overflow-y-auto flex-1">
                <div className="mb-4 bg-blue-50 text-blue-800 p-3 rounded-lg text-sm flex gap-2">
                  <Users className="w-5 h-5 shrink-0" />
                  <div>
                    <p className="font-semibold">Total Pax Count: {((lead?.adult || 0) + (lead?.child || 0) + (lead?.infant || 0))}</p>
                    <p>Adult: {lead?.adult || 0}, Child: {lead?.child || 0}, Infant: {lead?.infant || 0}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {paxTempList.map((pax, index) => (
                    <div key={index} className="flex flex-col gap-2 border p-3 rounded-lg bg-gray-50">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-gray-500">Traveller #{index + 1}</span>
                      </div>

                      <div className="flex flex-wrap sm:flex-nowrap gap-3 items-start">
                        <div className="flex-1 min-w-[120px]">
                          <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
                          <input
                            type="text"
                            value={pax.name || ''}
                            onChange={(e) => handlePaxChange(index, 'name', e.target.value)}
                            className="w-full border rounded-md px-3 py-2 text-sm"
                            placeholder="Full Name"
                          />
                        </div>
                        <div className="w-24">
                          <label className="block text-xs font-medium text-gray-700 mb-1">Age</label>
                          <input
                            type="number"
                            value={pax.age || ''}
                            onChange={(e) => handlePaxChange(index, 'age', e.target.value)}
                            className="w-full border rounded-md px-3 py-2 text-sm"
                            placeholder="Age"
                          />
                        </div>
                        <div className="w-32">
                          <label className="block text-xs font-medium text-gray-700 mb-1">Gender/Type</label>
                          <select
                            value={pax.gender || ''}
                            onChange={(e) => handlePaxChange(index, 'gender', e.target.value)}
                            className="w-full border rounded-md px-3 py-2 text-sm"
                          >
                            <option value="">Select</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Child">Child</option>
                            <option value="Infant">Infant</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex flex-wrap sm:flex-nowrap gap-3 items-start">
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
                          <input
                            type="text"
                            value={pax.phone || ''}
                            onChange={(e) => handlePaxChange(index, 'phone', e.target.value)}
                            className="w-full border rounded-md px-3 py-2 text-sm"
                            placeholder="Phone Number"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                          <input
                            type="email"
                            value={pax.email || ''}
                            onChange={(e) => handlePaxChange(index, 'email', e.target.value)}
                            className="w-full border rounded-md px-3 py-2 text-sm"
                            placeholder="Email Address"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 p-3 bg-yellow-50 text-yellow-800 text-sm rounded-lg">
                  <p className="flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    <span>The number of travellers is fixed based on Adults ({lead?.adult || 0}) + Children ({lead?.child || 0}) + Infants ({lead?.infant || 0}). To add more travellers, please update the lead's pax counts first.</span>
                  </p>
                </div>
              </div>

              <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
                <button
                  onClick={() => setShowPaxModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSavePaxDetails}
                  disabled={savingPax}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 flex items-center gap-2"
                >
                  {savingPax ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )
      }
    </Layout >
  );
};

export default LeadDetails;

