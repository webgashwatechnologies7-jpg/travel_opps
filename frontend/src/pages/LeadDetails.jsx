import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import { leadsAPI, usersAPI, followupsAPI, dayItinerariesAPI, packagesAPI, settingsAPI, suppliersAPI, hotelsAPI, paymentsAPI, googleMailAPI, whatsappAPI, whatsappWebAPI, queryDetailAPI, vouchersAPI, itineraryPricingAPI, leadInvoicesAPI, quotationsAPI, queryProposalsAPI, leadSourcesAPI } from '../services/api';
import { searchPexelsPhotos } from '../services/pexels';
import { getDisplayImageUrl, rewriteHtmlImageUrls, sanitizeEmailHtmlForDisplay } from '../utils/imageUrl';
// Layout removed - handled by nested routing
import { useSettings } from '../contexts/SettingsContext';
import { ArrowLeft, Calendar, Mail, Plus, Upload, X, Search, FileText, Printer, Send, MessageCircle, CheckCircle, CheckCircle2, Clock, Briefcase, MapPin, CalendarDays, Users, UserCheck, Leaf, Smartphone, Phone, MoreVertical, Download, Pencil, Trash2, Camera, RefreshCw, Reply, ChevronDown, Paperclip, Eye, Info, Gift, Heart, Building2, Image as ImageIcon } from 'lucide-react';
import DetailRow from '../components/Quiries/DetailRow';
import html2pdf from 'html2pdf.js';
import { WhatsAppTab, MailsTab, FollowupsTab, BillingTab, HistoryTab, SuppCommTab, PostSalesTab, VoucherTab, DocsTab, InvoiceTab, CallsTab, ItineraryHistoryTab } from '../components/LeadTabs';
import { callsAPI } from '../services/api';
import LogoLoader from '../components/LogoLoader';
import { Dialog } from 'primereact/dialog';

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
  const [leadSources, setLeadSources] = useState([]);
  const [notes, setNotes] = useState([]);
   const [noteText, setNoteText] = useState('');
   const [noteReason, setNoteReason] = useState('');
   const noteReasons = [
     "Booked with someone else",
     "Not interested",
     "Price is high",
     "Not answering call from 1 week",
     "Plan cancelled",
     "Wrong number",
     "Denied to post lead",
     "Other"
   ];
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [addingNote, setAddingNote] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [showItineraryModal, setShowItineraryModal] = useState(false);
  const [showAddItineraryModal, setShowAddItineraryModal] = useState(false);
  const [showInsertItineraryModal, setShowInsertItineraryModal] = useState(false);
  const [sendDropdownOptId, setSendDropdownOptId] = useState(null);
  const [sendAllDropdownOpen, setSendAllDropdownOpen] = useState(false);
  const [sendingOptionChannel, setSendingOptionChannel] = useState(null);
  const [dayItineraries, setDayItineraries] = useState([]);
  const [loadingItineraries, setLoadingItineraries] = useState(false);
  const [itinerarySearchTerm, setItinerarySearchTerm] = useState('');
  const [proposals, setProposals] = useState([]);
  const [loadingProposals, setLoadingProposals] = useState(false);
  const [maxHotelOptions, setMaxHotelOptions] = useState(4);
  const [showQuotationModal, setShowQuotationModal] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [quotationData, setQuotationData] = useState(null);
  const [loadingQuotation, setLoadingQuotation] = useState(false);
  const [refreshingProposalPrices, setRefreshingProposalPrices] = useState(false);
  const [leadCalls, setLeadCalls] = useState([]);
  const [loadingCalls, setLoadingCalls] = useState(false);
  const [recordingUrls, setRecordingUrls] = useState({});
  const [activeRecordingId, setActiveRecordingId] = useState(null);

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

  // Itinerary History states (sub-tabs inside Proposals)
  const [proposalSubTab, setProposalSubTab] = useState('active'); // 'active' | 'history'
  const [itineraryHistory, setItineraryHistory] = useState([]);
  const [itineraryHistoryTotal, setItineraryHistoryTotal] = useState(0);
  const [loadingItineraryHistory, setLoadingItineraryHistory] = useState(false);
  const [changePlanMode, setChangePlanMode] = useState(false); // true = replace proposals, false = append

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
  const [loadingWhatsappMessages, setLoadingWhatsappMessages] = useState(false);
  const [waStatus, setWaStatus] = useState('Checking...');
  const [profilePicUrl, setProfilePicUrl] = useState(null);
  const [showWaConnectModal, setShowWaConnectModal] = useState(false);
  const [showPdfPriceOptionModal, setShowPdfPriceOptionModal] = useState(false);
  const [pdfDownloadParams, setPdfDownloadParams] = useState(null);
  const [lastFetchedJid, setLastFetchedJid] = useState(null);
  const [showPaxModal, setShowPaxModal] = useState(false);
  const [paxTempList, setPaxTempList] = useState([]);
  const [savingPax, setSavingPax] = useState(false);
  const [showEditLeadModal, setShowEditLeadModal] = useState(false);
  const [editLeadFormData, setEditLeadFormData] = useState({
    client_name: '',
    client_title: '',
    email: '',
    phone: '',
    date_of_birth: '',
    marriage_anniversary: '',
  });
  const [savingLead, setSavingLead] = useState(false);

  const [showEditQueryModal, setShowEditQueryModal] = useState(false);
  const [editQueryFormData, setEditQueryFormData] = useState({
    destination: '',
    travel_start_date: '',
    travel_end_date: '',
    source: '',
    service: '',
    adult: 1,
    child: 0,
    infant: 0,
    assigned_to: '',
    remark: ''
  });
  const [savingQuery, setSavingQuery] = useState(false);

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
    fetchSources();
    fetchMaxHotelOptions();
    fetchSuppliers();
    fetchCompanySettings();
    checkConnectionStatus();
  }, [id]);

  const checkConnectionStatus = async () => {
    try {
      const response = await whatsappWebAPI.getStatus();
      setWaStatus(response.data.status || 'Disconnected');
    } catch (err) {
      setWaStatus('Disconnected');
    }
  };

  // Listener for itinerary selection from new tab
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data?.type === 'ITINERARY_SELECTED' && event.data?.itinerary) {
        handleSelectItinerary(event.data.itinerary);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [id, proposals]);


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


  // Prevent background scroll when any modal is open
  useEffect(() => {
    const isAnyModalOpen =
      showItineraryModal || showInsertItineraryModal || showQuotationModal ||
      showFollowupModal || showPaymentModal || showComposeModal ||
      showWaConnectModal || showPdfPriceOptionModal || showPaxModal ||
      showEditLeadModal || showEditQueryModal || showVoucherPopup ||
      showInvoicePreview || showItineraryLibraryModal;

    if (isAnyModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [
    showItineraryModal, showInsertItineraryModal, showQuotationModal,
    showFollowupModal, showPaymentModal, showComposeModal,
    showWaConnectModal, showPdfPriceOptionModal, showPaxModal,
    showEditLeadModal, showEditQueryModal, showVoucherPopup,
    showInvoicePreview, showItineraryLibraryModal
  ]);

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
      await Promise.all(proposals.map(async (proposal) => {
        const itineraryId = proposal.itinerary_id;
        const optionNum = proposal.optionNumber ?? 1;
        if (!itineraryId) return;
        try {
          // Fetch directly from server (DATABASE)
          const response = await packagesAPI.get(itineraryId);
          dayEvents = response?.data?.data?.day_events;

          if (!dayEvents) return;

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
      }));

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

  // Load proposals from server (with localStorage fallback for existing data)
  // Helper to reconstruct proposals from server data (used when localstorage is empty)
  const reconstructOptionsFromServerData = (itinerary, pricingData, existingBaseProposal) => {
    if (!itinerary || !itinerary.day_events) return [];

    const dayEvents = itinerary.day_events;
    const finalPrices = pricingData?.final_client_prices || {};
    const optionNumbersFromEvents = new Set();

    Object.keys(dayEvents || {}).forEach(day => {
      (dayEvents[day] || []).forEach(event => {
        if (event.eventType === 'accommodation' && event.hotelOptions) {
          event.hotelOptions.forEach((option) => {
            const optNum = option.optionNumber ?? 1;
            optionNumbersFromEvents.add(parseInt(optNum, 10));
          });
        }
      });
    });

    const sortedOptionNumbers = Array.from(optionNumbersFromEvents).sort((a, b) => a - b);
    if (sortedOptionNumbers.length === 0) {
      // Just return the base proposal if no options found
      return [existingBaseProposal];
    }

    return sortedOptionNumbers.map((optNum, idx) => {
      const optNumStr = String(optNum);
      const apiPrice = getPriceFromFinalPrices(finalPrices, optNum);
      const price = apiPrice !== null ? apiPrice : (existingBaseProposal.price || itinerary.price || 0);

      // Collect hotel options for this specific option number
      const hotelOptions = [];
      Object.keys(dayEvents || {}).forEach(day => {
        (dayEvents[day] || []).forEach(event => {
          if (event.eventType === 'accommodation' && event.hotelOptions) {
            event.hotelOptions.forEach(opt => {
              if (opt.optionNumber === optNum) {
                hotelOptions.push({ ...opt, day: parseInt(day) });
              }
            });
          }
        });
      });

      return {
        ...existingBaseProposal,
        id: Date.now() + idx + optNum,
        optionNumber: optNum,
        price,
        pricing: { ...(existingBaseProposal.pricing || {}), finalClientPrice: price },
        hotels: hotelOptions, // helpful for rendering
        itinerary_name: itinerary.itinerary_name || existingBaseProposal.itinerary_name,
        destination: itinerary.destinations || existingBaseProposal.destination,
        duration: itinerary.duration || existingBaseProposal.duration,
        image: itinerary.image || existingBaseProposal.image
      };
    });
  };

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    const run = async () => {
      setLoadingProposals(true);
      try {
        // 1. Try to fetch from server first
        const serverRes = await queryProposalsAPI.list(id);
        const serverData = serverRes?.data?.data || [];

        let list = [];
        if (serverData.length > 0) {
          // metadata contains the full proposal object we use in frontend
          list = serverData.map(p => ({
            ...p.metadata,
            confirmed: p.is_confirmed || p.metadata?.confirmed // Sync confirmed status from DB
          }));
        } else {
          // One-time legacy migration: move old browser-only proposals to DB
          const legacyKey = `lead_${id}_proposals`;
          const migrationFlag = `lead_${id}_legacy_migrated_v1`;
          const legacyRaw = localStorage.getItem(legacyKey);
          const alreadyMigrated = localStorage.getItem(migrationFlag) === '1';

          if (!alreadyMigrated && legacyRaw) {
            try {
              const legacyList = JSON.parse(legacyRaw);
              if (Array.isArray(legacyList) && legacyList.length > 0) {
                await queryProposalsAPI.sync(id, legacyList);
                list = legacyList;
                localStorage.setItem(migrationFlag, '1');
                toast.success('Legacy proposal data migrated to server.');
              }
            } catch (migrationErr) {
              console.warn('Legacy proposal migration failed:', migrationErr);
            }
          }
        }

        if (list.length === 0) {
          if (!cancelled) setProposals([]);
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

        // 2. Fetch Packages and Pricing for server-side reconstruction
        const uniqueItineraryIds = [...new Set(list.map(p => p.itinerary_id).filter(Boolean))];
        const packageMap = {};
        const pricingMap = {};

        await Promise.all(uniqueItineraryIds.map(async (tid) => {
          try {
            const [pkgRes, prRes] = await Promise.all([
              packagesAPI.get(tid),
              itineraryPricingAPI.get(tid)
            ]);
            if (pkgRes.data.data) packageMap[tid] = pkgRes.data.data;
            if (prRes.data.data) pricingMap[tid] = prRes.data.data;
          } catch (_) { }
        }));

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

          // Primary source: Server Data (Packages options_data field) - ELIMINATING LOCAL STORAGE RELIANCE
          const pkgData = packageMap[tid];
          // Always use Database data
          let latestOptions = (pkgData && Array.isArray(pkgData.options_data) && pkgData.options_data.length > 0) ? pkgData.options_data : [];

          // Re-Sync/Reconstruct from Server if LocalStorage is empty
          // Special Rule: If server-side list for this ITINERARY only has 1 item and it's 'base' (no option number),
          // AND we found actual options in the package data, then we expand it.
          const existingOfThisTid = byItineraryId[tid] || [];
          const isBaseOnly = existingOfThisTid.length === 1 && (existingOfThisTid[0].optionNumber == null);

          if ((!latestOptions || latestOptions.length === 0) && packageMap[tid] && isBaseOnly) {
            console.log(`Reconstructing options for Itinerary ${tid} from server data...`);
            latestOptions = reconstructOptionsFromServerData(packageMap[tid], pricingMap[tid], existingOfThisTid[0]);
          }

          if (Array.isArray(latestOptions) && latestOptions.length > 0) {
            const confirmedOptionNum = existingOfThisTid.find((x) => x.confirmed)?.optionNumber;
            latestOptions.forEach((opt, i) => {
              const optNum = opt.optionNumber != null ? opt.optionNumber : i + 1;
              const isConfirmed = confirmedOptionNum != null && opt.optionNumber === confirmedOptionNum;
              
              // DEEP LOCK: Find the existing saved version of this specific option for this lead
              const existing = existingOfThisTid.find(x => x.optionNumber === optNum);
              
              let price = opt.price ?? 0;
              
              if (isConfirmed && existing) {
                // If confirmed, ALWAYS use the price that was saved in the lead's proposal record
                price = existing.price ?? opt.price ?? 0;
              } else {
                // Not confirmed, so we can fetch the latest price from master
                const serverPrice = getPriceFromFinalPrices(pricingMap[tid]?.final_client_prices, optNum);
                price = serverPrice !== null ? serverPrice : (opt.price ?? 0);
              }

              result.push({
                ...opt,
                id: opt.id || (existing?.id) || Date.now() + i + tid,
                itinerary_name: opt.itinerary_name || pkgData.itinerary_name || pkgData.title || p.itinerary_name || p.title,
                destination: opt.destination || pkgData.destinations || pkgData.destination || p.destination,
                duration: opt.duration || pkgData.duration || p.duration,
                image: opt.image || pkgData.image || p.image,
                price: price,
                pricing: { 
                  ...(opt.pricing || {}), 
                  finalClientPrice: price,
                  // LOCK BASE PRICE: If confirmed, base price should also match the locked price
                  totalGross: isConfirmed ? price : (opt.pricing?.totalGross || price)
                },
                confirmed: isConfirmed
              });
            });
          } else {
            existingOfThisTid.forEach((x) => result.push(x));
          }
        });

        if (!cancelled) setProposals(result);
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to load proposals:', err);
          setProposals([]);
        }
      } finally {
        if (!cancelled) setLoadingProposals(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [id, maxHotelOptions]);

  // Save proposals to server (DATABASE ONLY)
  const saveProposals = async (newProposals) => {
    try {
      setProposals(newProposals);
      // Removed localStorage sync - using Database only
      await queryProposalsAPI.sync(id, newProposals);
      // Refresh itinerary history after any sync (so archived data updates)
      fetchItineraryHistory();
    } catch (err) {
      console.error('Failed to save proposals:', err);
      showToastNotification('error', 'Sync Failed', 'Could not save proposals to the server. Please try again.');
      // Refresh to get actual server state if desired, or just inform the user
      fetchLeadDetails();
    }
  };

  // Fetch itinerary change history (archived versions)
  const fetchItineraryHistory = async () => {
    if (!id) return;
    setLoadingItineraryHistory(true);
    try {
      const res = await queryProposalsAPI.history(id);
      const data = res?.data?.data || [];
      const total = res?.data?.total_changes || 0;
      setItineraryHistory(data);
      setItineraryHistoryTotal(total);
    } catch (err) {
      console.error('Failed to fetch itinerary history:', err);
      setItineraryHistory([]);
      setItineraryHistoryTotal(0);
    } finally {
      setLoadingItineraryHistory(false);
    }
  };

  // Auto-fetch history when History sub-tab is opened
  useEffect(() => {
    if (proposalSubTab === 'history' && id) {
      fetchItineraryHistory();
    }
  }, [proposalSubTab, id]);

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
        // LOCK PRICE FOR CONFIRMED OPTIONS: Do not refresh price from master if already confirmed
        if (opt.confirmed) {
          return opt;
        }

        const tid = opt.itinerary_id;
        const fp = priceMapByItinerary[tid];
        const optNum = opt.optionNumber != null ? opt.optionNumber : 1;
        const apiPrice = getPriceFromFinalPrices(fp, optNum);
        if (apiPrice !== null && apiPrice !== opt.price) {
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
      fetchLeadDetails();
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
    if (!id || !lead) return;
    
    const inv = queryDetailInvoices.find((i) => i.id === invoiceId);
    if (!inv) return;

    const toEmail = lead?.email || '';
    const toPhone = lead?.phone || '';

    if (!toEmail && !toPhone) {
      showToastNotification('warning', 'Missing Contact', 'Client has no email or phone number saved.');
      return;
    }

    if (!window.confirm(`Send Invoice ${inv.invoice_number} to client via ${toEmail ? 'Email' : ''}${toEmail && toPhone ? ' and ' : ''}${toPhone ? 'WhatsApp' : ''}?`)) {
      return;
    }

    setInvoiceActionLoading('send');
    try {
      // 1. Send Email via Backend (already has PDF attachment logic in some systems, or sends HTML)
      if (toEmail) {
        await leadInvoicesAPI.send(id, invoiceId, { 
          to_email: toEmail, 
          subject: `Proforma Invoice - ${inv.invoice_number} - TravelFusion CRM` 
        });
      }

      // 2. Send WhatsApp with PDF Attachment
      if (toPhone && waStatus === 'Connected') {
        const phoneStr = toPhone.replace(/\D/g, '');
        const chatId = phoneStr.length <= 10 ? `91${phoneStr}@s.whatsapp.net` : `${phoneStr}@s.whatsapp.net`;
        
        // Prepare professional message
        let waMsg = `*PROFORMA INVOICE: ${inv.invoice_number}*\n\n`;
        waMsg += `Hello *${lead.client_name || 'Guest'}*,\n`;
        waMsg += `Please find attached your invoice for: *${inv.itinerary_name || 'Package'}*.\n\n`;
        waMsg += `*Invoice Total: ₹${Number(inv.total_amount).toLocaleString('en-IN')}*\n`;
        
        // Add Bank Details if available from state
        if (accountDetails) {
          waMsg += `\n*OFFICIAL PAYMENT DETAILS:*\n`;
          waMsg += `Bank: ${accountDetails.bank_name || 'N/A'}\n`;
          waMsg += `Acc No: ${accountDetails.account_number || 'N/A'}\n`;
          waMsg += `IFSC: ${accountDetails.ifsc_code || 'N/A'}\n`;
          waMsg += `Holder: ${accountDetails.account_holder_name || 'N/A'}\n`;
          if (accountDetails.upi_id) waMsg += `UPI ID: ${accountDetails.upi_id}\n`;
        }

        waMsg += `\n*PLEASE SHARE A SCREENSHOT OF THE PAYMENT RECEIPT AFTER TRANSFER.*\n\n`;
        waMsg += `Best regards,\nTravelFusion CRM Team`;

        // Fetch PDF Blob to send as attachment
        const pdfRes = await leadInvoicesAPI.download(id, invoiceId);
        const pdfBlob = new Blob([pdfRes.data], { type: 'application/pdf' });
        const pdfFile = new File([pdfBlob], `Invoice_${inv.invoice_number}.pdf`, { type: 'application/pdf' });

        await whatsappWebAPI.sendMedia({
          chat_id: chatId,
          file: pdfFile,
          caption: waMsg,
          type: 'document'
        });
      }

      showToastNotification('success', 'Sent', 'Invoice sent successfully via ' + 
        (toEmail && toPhone && waStatus === 'Connected' ? 'Email & WhatsApp' : 
         toEmail ? 'Email' : 'WhatsApp'));
      
      if (inv.status !== 'paid') {
        fetchQueryDetail(); // Refresh list to see updated status
      }
    } catch (err) {
      console.error('Invoice send failed:', err);
      const msg = err.response?.data?.message || err.message || 'Unknown error';
      showToastNotification('error', 'Send Failed', 'Issue: ' + msg);
    } finally {
      setInvoiceActionLoading(null);
    }
  };

  // NEW: Send Payment Reminder via Email and WhatsApp
  const [remindingPaymentId, setRemindingPaymentId] = useState(null);

  const handleSendPaymentReminder = async (payment) => {
    if (!lead || !payment) return;
    setRemindingPaymentId(payment.id);

    try {
      const bankDetails = settings?.bank_details || 'Please contact us for bank details.';
      const amount = Number(payment.amount).toLocaleString('en-IN');
      const dueAmount = (Number(payment.amount) - Number(payment.paid_amount)).toLocaleString('en-IN');
      const dueDate = payment.due_date || 'N/A';
      
      // Welcome Msg for whatsapp 
      const welcomeMsg = `Dear ${lead.client_name || 'Customer'},\n\nThis is a friendly reminder that a payment toward your travel booking is due today or in the next few days.\n\n*Payment Summary:*\n• Total Amount: ₹${amount}\n• Balance Due: *₹${dueAmount}*\n• Due Date: ${dueDate}\n\n*Bank Details:*\n${bankDetails}\n\nKindly share the screenshot of the transaction once the payment is made.\n\nBest regards,\nTravelFusion CRM Team`;

      const _hdrBg = companySettings?.email_header_color || '#2c3e50';
      const _ftrBg = companySettings?.email_footer_color || '#f5f7fa';

      const htmlTemplate = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
</head>
<body style="margin:0; padding:0; font-family: Arial, sans-serif; background-color:#f5f7fa;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
    ${buildEmailHeader(_hdrBg, '#ffffff')}
    <div style="padding: 30px; color: #333;">
      <h2 style="color: ${_hdrBg}; margin-top: 0; margin-bottom: 20px;">Payment Reminder</h2>
      <p>Dear <strong>${lead.client_name || 'Customer'}</strong>,</p>

      <p>
        This is a friendly reminder that a payment toward your travel booking is due.
      </p>

      <table width="100%" cellpadding="10" style="margin: 20px 0; border: 1px solid #eee; border-radius: 8px; border-collapse: collapse;">
        <tr>
          <td style="border-bottom: 1px solid #eee;"><b>Total Amount:</b></td>
          <td style="border-bottom: 1px solid #eee;">₹${amount}</td>
        </tr>
        <tr>
          <td style="border-bottom: 1px solid #eee;"><b>Balance Due:</b></td>
          <td style="border-bottom: 1px solid #eee; color: #d93025; font-weight: bold;">₹${dueAmount}</td>
        </tr>
        <tr>
          <td><b>Due Date:</b></td>
          <td>${dueDate}</td>
        </tr>
      </table>

      <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-top: 20px;">
        <p style="margin-top: 0;"><b>Bank Details:</b></p>
        <pre style="margin: 0; font-family: inherit; font-size: 14px; white-space: pre-wrap;">${bankDetails}</pre>
      </div>

      <p style="margin-top: 20px;">Please share payment screenshot once done.</p>
    </div>
    ${buildEmailFooter(_ftrBg, '#333333')}
  </div>
</body>
</html>
`;
      // 1. Send via WhatsApp
      let waSent = false;
      const toPhone = lead.phone || lead.whatsapp_number;
      if (toPhone) {
        try {
          const chatId = toPhone.includes('@') ? toPhone : `${toPhone}@s.whatsapp.net`;
          await whatsappWebAPI.sendMessage({
            chat_id: chatId,
            message: welcomeMsg
          });
          waSent = true;
        } catch (waErr) {
          console.error('WhatsApp reminder failed:', waErr);
          // Don't throw, proceed to email
        }
      }

      // 2. Send via Email
      let emailSent = false;
      if (lead.email) {
        try {
          await leadsAPI.sendEmail(id, {
            to_email: lead.email,
            subject: `Payment Reminder: ₹${dueAmount} Due for your Booking`,
            body: htmlTemplate 
          });
          fetchLeadEmails();
          emailSent = true;
        } catch (emailErr) {
          console.error('Email reminder failed:', emailErr);
        }
      }

      if (waSent || emailSent) {
        showToastNotification('success', 'Reminder Handled', 
          `Sent via: ${waSent ? 'WhatsApp ' : ''}${emailSent ? '& Email' : ''}`);
      } else {
        showToastNotification('error', 'Reminder Failed', 'Both WhatsApp and Email failed. Check connections.');
      }
    } catch (err) {
      console.error('Reminder failed:', err);
      showToastNotification('error', 'Reminder Failed', 'Could not send reminder.');
    } finally {
      setRemindingPaymentId(null);
    }
  };
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

    // WhatsApp message (booked option + payment)
    let whatsappMsg = `*✓ BOOKED TRAVEL ITINERARY*\n\n`;
    whatsappMsg += `*${itinerary.itinerary_name || 'Itinerary'}*\n`;
    whatsappMsg += `Query ID: ${formatLeadId(lead.id)}\n`;
    whatsappMsg += `Destination: ${itinerary.destinations || 'N/A'}\n`;
    whatsappMsg += `Duration: ${itinerary.duration || 0} Days\n\n`;
    whatsappMsg += `*Booked Option ${confirmedOptionNum}*\n`;
    hotels.forEach(h => {
      whatsappMsg += `• Day ${h.day}: ${h.hotelName || 'Hotel'} (${h.category || 'N/A'} Star)\n`;
      whatsappMsg += `  Room: ${h.roomName || 'N/A'} | Meal: ${h.mealPlan || 'N/A'}\n`;
    });
    whatsappMsg += `\n*Total Package: ₹${totalPrice.toLocaleString('en-IN')}*`;
    whatsappMsg += paymentText;
    whatsappMsg += `\n\nThis is your confirmed itinerary. Best regards,\nTravelFusion CRM Team`;

    // Email body (plain text for API)
    const hotelsHtml = hotels.map(h => `
  <tr>
    <td style="padding:8px; border-bottom:1px solid #eee;">Day ${h.day}</td>
    <td style="padding:8px; border-bottom:1px solid #eee;">
      ${h.hotelName || 'Hotel'} (${h.category || 'N/A'} Star)
    </td>
    <td style="padding:8px; border-bottom:1px solid #eee;">
      ${h.roomName || 'N/A'}
    </td>
    <td style="padding:8px; border-bottom:1px solid #eee;">
      ${h.mealPlan || 'N/A'}
    </td>
  </tr>
`).join('');

const _hdrBgConfirmed = companySettings?.email_header_color || '#27ae60';
const _ftrBgConfirmed = companySettings?.email_footer_color || '#ecf0f1';

const emailTemplate = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
</head>
<body style="margin:0; padding:0; font-family: Arial, sans-serif; background:#f4f6f9;">
  <div style="max-width: 650px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); margin-top: 20px; margin-bottom: 20px;">
    ${buildEmailHeader(_hdrBgConfirmed, '#ffffff')}
    <div style="padding: 30px; color: #333;">
      <h2 style="color: ${_hdrBgConfirmed}; margin-top: 0; text-align: center; border-bottom: 1px solid #eee; padding-bottom: 15px;">Booked Travel Itinerary</h2>
      
      <h3 style="margin-top:20px; margin-bottom: 15px;">${itinerary.itinerary_name || 'Itinerary'}</h3>

      <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px;">
        <div><strong>Query ID:</strong> ${formatLeadId(lead.id)}</div>
        <div><strong>Duration:</strong> ${itinerary.duration || 0} Days</div>
        <div style="grid-column: span 2;"><strong>Destination:</strong> ${itinerary.destinations || 'N/A'}</div>
      </div>

      <p style="margin-top:20px; font-size: 16px;">
        <strong>Booked Option ${confirmedOptionNum}</strong>
      </p>

      <!-- Hotels Table -->
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse; margin-top:10px; border: 1px solid #eee;">
        <tr style="background:#f1f1f1;">
          <th style="padding:10px; text-align:left; border-bottom: 1px solid #ddd;">Day</th>
          <th style="padding:10px; text-align:left; border-bottom: 1px solid #ddd;">Hotel</th>
          <th style="padding:10px; text-align:left; border-bottom: 1px solid #ddd;">Room</th>
          <th style="padding:10px; text-align:left; border-bottom: 1px solid #ddd;">Meal</th>
        </tr>
        ${hotelsHtml}
      </table>

      <!-- Price -->
      <p style="margin-top:20px; font-size:16px;">
        <strong>Total Package:</strong> 
        <span style="color:#27ae60; font-size:18px; font-weight: bold;">
          ₹${totalPrice.toLocaleString('en-IN')}
        </span>
      </p>

      <!-- Payment Info -->
      <div style="margin-top:20px; background: #f8f9fb; padding: 15px; border-radius: 8px; border-left: 4px solid #27ae60;">
        <strong>Payment Details:</strong>
        <pre style="margin: 10px 0 0 0; font-family: inherit; font-size: 14px; white-space: pre-wrap;">${paymentText}</pre>
      </div>

      <p style="margin-top:25px; text-align: center; color: #555; font-style: italic;">
        This is your confirmed itinerary. We wish you a wonderful trip!
      </p>

    </div>
    ${buildEmailFooter(_ftrBgConfirmed, '#333')}
  </div>
</body>
</html>
`;
    // let emailBody = `CONFIRMED TRAVEL ITINERARY\n\n`;
    // emailBody += `${itinerary.itinerary_name || 'Itinerary'}\n`;
    // emailBody += `Query ID: ${formatLeadId(lead.id)}\n`;
    // emailBody += `Destination: ${itinerary.destinations || 'N/A'}\n`;
    // emailBody += `Duration: ${itinerary.duration || 0} Days\n\n`;
    // emailBody += `Confirmed Option ${confirmedOptionNum}\n`;
    // hotels.forEach(h => {
    //   emailBody += `• Day ${h.day}: ${h.hotelName || 'Hotel'} (${h.category || 'N/A'} Star)\n`;
    //   emailBody += `  Room: ${h.roomName || 'N/A'} | Meal: ${h.mealPlan || 'N/A'}\n`;
    // });
    // emailBody += `\nTotal Package: ₹${totalPrice.toLocaleString('en-IN')}`;
    // emailBody += paymentText.replace(/\n\n/g, '\n');
    // emailBody += `\n\nThis is your confirmed itinerary. Best regards, TravelFusion CRM Team`;

    const subject = `Confirmed Travel Itinerary - ${itinerary.itinerary_name || 'Itinerary'} - ${formatLeadId(lead.id)}`;
    const toEmail = lead.email;

    try {
      if (toEmail) {
        await leadsAPI.sendEmail(id, { to_email: toEmail, subject, body: emailTemplate });
        fetchLeadEmails();
      }
      
      const toPhone = lead.phone || lead.whatsapp_number || '';
      if (toPhone && waStatus === 'Connected') {
        const phoneStr = toPhone.replace(/\D/g, '');
        const chatId = phoneStr.length <= 10 ? `91${phoneStr}@s.whatsapp.net` : `${phoneStr}@s.whatsapp.net`;
        
        await whatsappWebAPI.sendMessage({
          chat_id: chatId,
          message: whatsappMsg
        });
        fetchWhatsAppMessages();
      }
      if (toEmail || toPhone) {
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

      // Wiping proposals for 'new' leads was causing data loss when users added itineraries 
      // but the page reloaded before the server-side status update or sync was complete.
      // We now rely on queryProposalsAPI.sync and server-side truth.
      // Auto-transition 'new' leads to 'Under Process' (processing)
      if (leadData && leadData.id && (leadData.status?.toLowerCase() === 'new')) {
        try {
          // Perform the update synchronously before setting the lead state
          await leadsAPI.updateStatus(leadData.id, 'processing');
          // Update the local data object to reflect the change immediately
          leadData.status = 'processing';
        } catch (err) {
          console.error("Auto transition to processing failed:", err);
        }
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

  const fetchSources = async () => {
    try {
      const response = await leadSourcesAPI.list();
      setLeadSources(response.data.data || []);
    } catch (err) {
      console.error('Failed to fetch lead sources:', err);
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

  const fetchLeadCalls = useCallback(async (isInitial = false) => {
    if (!id) return;
    if (isInitial) setLoadingCalls(true);
    try {
      const response = await callsAPI.list({ lead_id: id });
      if (response.data.success) {
        setLeadCalls(response.data.data.calls || []);
      }
    } catch (err) {
      console.error('Failed to fetch lead calls:', err);
    } finally {
      if (isInitial) setLoadingCalls(false);
    }
  }, [id]);

  const handleDeleteCall = async (callId) => {
    if (!window.confirm('Are you sure you want to delete this call log?')) return;
    try {
      const response = await callsAPI.delete(callId);
      if (response.data.success) {
        showToastNotification('success', 'Deleted', 'Call log deleted successfully');
        fetchLeadCalls(); // Refresh list silently
      }
    } catch (err) {
      console.error('Failed to delete call:', err);
      showToastNotification('error', 'Delete Failed', 'Could not delete call log');
    }
  };


  useEffect(() => {
    if (activeTab !== 'calls' || !id) {
      return;
    }

    fetchLeadCalls(true); // Show loader only first time
    const interval = setInterval(() => {
      fetchLeadCalls(false); // Update silently in background
    }, 30000); // 30 seconds interval (slower refresh)


    return () => clearInterval(interval);
  }, [activeTab, id, fetchLeadCalls]);


  const handlePlayRecording = async (callId) => {
    if (recordingUrls[callId]) {
      setActiveRecordingId(callId);
      return;
    }

    try {
      const response = await callsAPI.getRecording(callId);
      const blob = new Blob([response.data], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      setRecordingUrls(prev => ({ ...prev, [callId]: url }));
      setActiveRecordingId(callId);
    } catch (err) {
      toast.error('Failed to load recording');
    }
  };

  // Fetch WhatsApp messages for this lead
  const fetchWhatsAppMessages = useCallback(async () => {
    if (!id || !lead?.phone) return;
    setLoadingWhatsappMessages(true);
    try {
      const phoneStr = lead.phone.replace(/\D/g, '');
      const chatId = phoneStr.length <= 10 ? `91${phoneStr}@s.whatsapp.net` : `${phoneStr}@s.whatsapp.net`;

      const response = await whatsappWebAPI.getMessages(chatId, id); // pass lead id
      if (response?.data?.success) {
        if (response.data.data) {
          setWhatsappMessages(response.data.data);
          // Auto-mark as read if there are unread inbound messages and we are on the WhatsApp tab
          const hasUnread = response.data.data.some(m => m.direction === 'inbound' && m.status !== 'read');
          if (activeTab === 'whatsapp') {
            const lastInbound = [...response.data.data].reverse().find(m => m.direction === 'inbound');
            if (lastInbound && (hasUnread || !lastInbound.read_at)) {
               whatsappWebAPI.markAsRead(chatId, lastInbound.whatsapp_message_id || lastInbound.id);
            }
          }
        }
        if (response.data.profile_jid && response.data.profile_jid !== lastFetchedJid) {
          setLastFetchedJid(response.data.profile_jid);
          whatsappWebAPI.getProfilePicture(response.data.profile_jid)
            .then(res => {
              if (res?.data?.success && res?.data?.url) {
                setProfilePicUrl(res.data.url);
              }
            })
            .catch(() => { });
        }
      }
    } catch (err) {
      console.error('Failed to fetch WhatsApp messages:', err);
    } finally {
      setLoadingWhatsappMessages(false);
    }
  }, [id, lead?.phone]);

  // Fetch WhatsApp messages when WhatsApp tab is active
  useEffect(() => {
    if (activeTab !== 'whatsapp' || !id) return;
    fetchWhatsAppMessages();
    const interval = setInterval(fetchWhatsAppMessages, 15000);
    return () => clearInterval(interval);
  }, [activeTab, id, fetchWhatsAppMessages]);

  // Send WhatsApp message from tab
  const handleSendWhatsAppFromTab = async (text = '', file = null, quotedId = null, quotedPreview = null) => {
    const inputMsg = text || whatsappInput.trim();
    const inputAttachment = file || whatsappAttachment;

    if (!id || (!inputMsg && !inputAttachment)) return;

    // Check WhatsApp Connection
    if (waStatus !== 'Connected') {
      setShowWaConnectModal(true);
      return;
    }

    if (!lead?.phone) {
      showToastNotification('warning', 'Missing Phone', 'Lead has no phone number. Please add phone to send WhatsApp.');
      return;
    }
    setSendingWhatsapp(true);
    try {
      const phoneStr = lead.phone.replace(/\D/g, '');
      const chatId = phoneStr.length <= 10 ? `91${phoneStr}@s.whatsapp.net` : `${phoneStr}@s.whatsapp.net`;

      if (inputAttachment) {
        const mime = inputAttachment.type || '';
        let detectedType = 'document';
        if (mime.startsWith('image/') && !mime.includes('gif')) detectedType = 'image';
        else if (mime.startsWith('video/')) detectedType = 'video';
        else if (mime.startsWith('audio/')) detectedType = 'audio';

        const res = await whatsappWebAPI.sendMedia({
          chat_id: chatId,
          file: inputAttachment,
          caption: inputMsg || undefined,
          type: detectedType,
          quoted_message_id: quotedId,
          quoted_text: quotedPreview
        });
        if (res?.data?.success) {
          if (!text) setWhatsappInput('');
          if (!file) setWhatsappAttachment(null);
          await fetchWhatsAppMessages();
        } else {
          showToastNotification('error', 'Send Failed', res?.data?.message || 'Failed to send');
        }
      } else {
        const res = await whatsappWebAPI.sendMessage({
          chat_id: chatId,
          message: inputMsg,
          lead_id: id,
          quoted_message_id: quotedId,
          quoted_text: quotedPreview
        });
        if (res?.data?.success) {
          if (!text) setWhatsappInput('');
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

  // Duplicate interval removed - 15s interval above handles auto-refresh

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

  const handleSaveLead = async (e) => {
    e.preventDefault();
    setSavingLead(true);
    try {
      await leadsAPI.update(id, editLeadFormData);
      showToastNotification('success', 'Saved', 'Lead details updated successfully');
      setShowEditLeadModal(false);
      fetchLeadDetails();
    } catch (err) {
      console.error('Failed to save lead details:', err);
      showToastNotification('error', 'Error', 'Failed to update lead details');
    } finally {
      setSavingLead(false);
    }
  };

  const handleSaveQuery = async (e) => {
    e.preventDefault();
    setSavingQuery(true);
    try {
      await leadsAPI.update(id, editQueryFormData);
      showToastNotification('success', 'Saved', 'Query information updated successfully');
      setShowEditQueryModal(false);
      fetchLeadDetails();
    } catch (err) {
      console.error('Failed to save query details:', err);
      showToastNotification('error', 'Error', 'Failed to update query information');
    } finally {
      setSavingQuery(false);
    }
  };

  const handleAddNote = async () => {
    const finalNote = noteReason === 'Other' ? noteText.trim() : noteReason;
    
    if (!finalNote) {
      showToastNotification('warning', 'Empty Note', 'Please select a reason or enter a note');
      return;
    }

    setAddingNote(true);
    try {
      const payload = {
        remark: finalNote,
        reminder_date: null,
        reminder_time: null,
      };

      if (editingNoteId) {
        await followupsAPI.update(editingNoteId, payload);
        showToastNotification('success', 'Note Updated', 'Note has been updated successfully');
      } else {
        await followupsAPI.create({
          lead_id: parseInt(id),
          ...payload,
        });
        showToastNotification('success', 'Note Added', 'Note has been added successfully');
      }

      await fetchLeadDetails();
      setNoteText('');
      setNoteReason('');
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
  const convertTo24Hour = (timeStr) => {
    if (!timeStr || timeStr.trim() === '') return null;
    
    // If already in 24h format (no AM/PM)
    if (!timeStr.toUpperCase().includes('AM') && !timeStr.toUpperCase().includes('PM')) {
      const parts = timeStr.split(':');
      if (parts.length >= 2) {
        return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}:00`;
      }
      return null;
    }

    const parts = timeStr.trim().split(' ');
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
    return time24h.substring(0, 5); // Return HH:mm as is
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
    for (let hour = 1; hour <= 24; hour++) {
      const h = String(hour === 24 ? 0 : hour).padStart(2, '0');
      slots.push(`${h}:00`);
      slots.push(`${h}:30`);
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
        // Automatically transition status to 'followup' when a followup is added
        try {
          await leadsAPI.updateStatus(id, 'followup');
        } catch (statusErr) {
          console.error('Failed to auto-update status to followup:', statusErr);
        }
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
    setItineraryFormData({
      itinerary_name: '',
      destinations: '',
      duration: '',
      start_date: '',
      image: null,
      notes: '',
      show_on_website: true
    });
    setItineraryImagePreview(null);
    setShowAddItineraryModal(true);
  };

  const handleSaveItinerary = async (e) => {
    e.preventDefault();
    setSavingItinerary(true);
    try {
      const formData = new FormData();
      formData.append('itinerary_name', itineraryFormData.itinerary_name);
      formData.append('destinations', itineraryFormData.destinations);
      formData.append('duration', itineraryFormData.duration);
      formData.append('notes', itineraryFormData.notes);
      formData.append('show_on_website', itineraryFormData.show_on_website ? 1 : 0);

      if (itineraryFormData.image && itineraryFormData.image.file) {
        formData.append('image', itineraryFormData.image.file);
      } else if (itineraryFormData.image && itineraryFormData.image.libraryPath) {
        formData.append('library_image', itineraryFormData.image.libraryPath);
      }

      const res = await packagesAPI.create(formData);
      const newPkg = res.data.data;

      showToastNotification('success', 'Itinerary Created', 'Itinerary has been created successfully!');
      setShowAddItineraryModal(false);

      // Open builder in new tab as requested
      const builderUrl = `/itineraries/${newPkg.id}?fromLead=${id}`;
      window.open(builderUrl, '_blank');
    } catch (err) {
      console.error('Failed to create itinerary:', err);
      showToastNotification('error', 'Creation Failed', err.response?.data?.message || 'Something went wrong');
    } finally {
      setSavingItinerary(false);
    }
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

  // Fetch itineraries for the "Insert Itinerary" selection modal
  useEffect(() => {
    if (!showInsertItineraryModal || dayItineraries.length > 0) return;
    setLoadingItineraries(true);
    packagesAPI.list().then((res) => {
      const data = res.data.data || [];
      setDayItineraries(data);
    }).catch(() => setDayItineraries([]))
      .finally(() => setLoadingItineraries(false));
  }, [showInsertItineraryModal]);

  const itineraryLibrarySearch = (itineraryLibrarySearchTerm || '').trim().toLowerCase();
  const itineraryLibraryImages = itineraryLibrarySearch.length >= 2
    ? itineraryLibraryPackages.filter(
      (p) => p.image && (
        (p.title || p.itinerary_name || '').toLowerCase().includes(itineraryLibrarySearch) ||
        (p.destination || p.destinations || '').toLowerCase().includes(itineraryLibrarySearch)
      )
    )
    : [];

  const handleInsertItinerary = () => {
    setChangePlanMode(false); // Normal insert — append mode
    setShowInsertItineraryModal(true);
  };

  // Called from "Change Plan" button — replaces existing proposals instead of appending
  const handleChangePlan = () => {
    setChangePlanMode(true); // Replace mode ON
    setShowInsertItineraryModal(true);
  };
  
  // Called from "Remove Itinerary" button — clears all proposals for this lead
  const handleRemoveItinerary = async () => {
    if (window.confirm('Are you sure you want to remove this itinerary from the lead? All associated options will be deleted.')) {
      try {
        await saveProposals([]);
        showToastNotification('success', 'Itinerary Removed', 'The itinerary has been removed from this lead.');
      } catch (err) {
        console.error('Failed to remove itinerary:', err);
        showToastNotification('error', 'Error', 'Failed to remove itinerary. Please try again.');
      }
    }
  };


  const handleSelectItinerary = async (itinerary) => {
    const tid = itinerary.id;
    const itineraryName = itinerary.title || itinerary.itinerary_name || 'Untitled Itinerary';

    setLoadingItineraries(true);
    let fullPackage = null;
    let pricingDataFromServer = null;

    try {
      // Fetch FULL package details to ensure day_events and days are cloned
      const [pkgRes, prRes] = await Promise.all([
        packagesAPI.get(tid),
        itineraryPricingAPI.get(tid)
      ]);
      fullPackage = pkgRes.data.data;
      pricingDataFromServer = prRes.data.data;
    } catch (err) {
      console.warn('Failed to fetch full itinerary details from server, using basic info:', err);
    }

    const pkg = fullPackage || itinerary;
    const baseInfo = {
      itinerary_id: pkg.id,
      itinerary_name: itineraryName,
      destination: pkg.destinations || pkg.destination || '',
      duration: pkg.duration || 0,
      image: pkg.image || null,
      notes: pkg.notes || '',
      day_events: pkg.day_events || {},
      days: pkg.days || [],
      created_at: new Date().toISOString(),
      inserted_at: new Date().toISOString()
    };

    // Use server-synced options/prices so any device sees the same data
    let optionsToAdd = [];
    try {
      let finalClientPricesMap = pricingDataFromServer?.final_client_prices || {};
      if (Array.isArray(pkg.options_data) && pkg.options_data.length > 0) {
        optionsToAdd = pkg.options_data;
      }

      // If no saved options found, reconstruct from server events/pricing
      if (optionsToAdd.length === 0) {
        if (fullPackage) {
          optionsToAdd = reconstructOptionsFromServerData(fullPackage, pricingDataFromServer, baseInfo);
        }
      }

      // Map and format options for proposals list
      if (optionsToAdd.length > 0) {
        optionsToAdd = optionsToAdd.map((opt, idx) => {
          const optNum = opt.optionNumber != null ? opt.optionNumber : idx + 1;
          const latestPrice = finalClientPricesMap[String(optNum)] ?? finalClientPricesMap[optNum];
          const price = latestPrice !== undefined && latestPrice !== null && latestPrice !== ''
            ? Number(latestPrice)
            : (opt.price ?? opt.pricing?.finalClientPrice ?? 0);
          return {
            ...opt,
            id: Date.now() + idx + (tid * 100),
            itinerary_id: tid,
            itinerary_name: opt.itinerary_name || itineraryName,
            destination: opt.destination || baseInfo.destination,
            duration: opt.duration ?? baseInfo.duration,
            image: opt.image || baseInfo.image,
            price,
            pricing: { ...(opt.pricing || {}), finalClientPrice: price },
            day_events: opt.day_events || baseInfo.day_events,
            days: opt.days || baseInfo.days,
            created_at: baseInfo.created_at,
            inserted_at: baseInfo.inserted_at
          };
        });
      }
    } catch (e) {
      console.error('Error loading itinerary options:', e);
    } finally {
      setLoadingItineraries(false);
    }

    let updatedProposals;
    if (optionsToAdd.length > 0) {
      // ── Change Plan mode: REPLACE old proposals with new itinerary ──
      // ── Normal Insert mode: APPEND to existing proposals ──
      updatedProposals = changePlanMode ? optionsToAdd : [...proposals, ...optionsToAdd];
      saveProposals(updatedProposals);
      setShowInsertItineraryModal(false);
      setItinerarySearchTerm('');
      setChangePlanMode(false); // Reset after use
      const actionMsg = changePlanMode ? 'Plan Changed' : 'Itinerary Added';
      const detailMsg = changePlanMode
        ? `Plan has been changed to "${itineraryName}". Previous itinerary saved in history.`
        : `${optionsToAdd.length} option(s) of "${itineraryName}" have been added to proposals.`;
      showToastNotification('success', actionMsg, detailMsg);
      return;
    }

    // No options in Final tab – add single proposal (whole itinerary)
    const newProposal = {
      id: Date.now(),
      ...baseInfo,
      price: pkg.price || 0,
      website_cost: pkg.website_cost || 0
    };
    updatedProposals = changePlanMode ? [newProposal] : [...proposals, newProposal];
    saveProposals(updatedProposals);
    setChangePlanMode(false); // Reset after use

    setShowInsertItineraryModal(false);
    setItinerarySearchTerm('');
    const actionMsg2 = changePlanMode ? 'Plan Changed' : 'Itinerary Added';
    const detailMsg2 = changePlanMode
      ? `Plan has been changed to "${itineraryName}". Previous itinerary saved in history.`
      : `Itinerary "${itineraryName}" has been added to proposals.`;
    showToastNotification('success', actionMsg2, detailMsg2);
  };

  const handleDuplicateProposal = (proposal) => {
    const newProposal = {
      ...JSON.parse(JSON.stringify(proposal)), // Deep clone
      id: Date.now(),
      optionNumber: (proposal.optionNumber || 0) + 10, // Distinguish it
      itinerary_name: `${proposal.itinerary_name} (Copy)`,
      created_at: new Date().toISOString(),
      inserted_at: new Date().toISOString(),
      confirmed: false // Reset confirmation for the copy
    };
    const updated = [...proposals, newProposal];
    saveProposals(updated);
    showToastNotification('success', 'Proposal Duplicated', 'A copy of the proposal has been created.');
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
    // If query has From/To dates, show only itineraries matching that duration
    if (leadTripDays != null) {
      const itDays = parseInt(itinerary.duration);
      if (!isNaN(itDays) && itDays !== leadTripDays) {
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
      const dayEvents = proposal?.day_events;
      if (!dayEvents || typeof dayEvents !== 'object') return null;
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
      // Load itinerary data from API (database source-of-truth)
      let dayEvents = {};
      let pricingData = {};
      let settings = {};

      const tid = proposal.itinerary_id;
      if (tid) {
        try {
          // Fetch from server
          const [pkgRes, pricingRes] = await Promise.all([
            packagesAPI.get(tid),
            itineraryPricingAPI.get(tid)
          ]);

          const pkgData = pkgRes?.data?.data;
          const prData = pricingRes?.data?.data;

          dayEvents = pkgData?.day_events || {};

          if (prData) {
            pricingData = prData.pricing_data || {};
            settings = {
              baseMarkup: prData.base_markup,
              extraMarkup: prData.extra_markup,
              cgst: prData.cgst,
              sgst: prData.sgst,
              igst: prData.igst,
              tcs: prData.tcs,
              discount: prData.discount
            };
          }
        } catch (err) {
          console.warn('API fetch failed in handleViewQuotation', err);
        }
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
          itinerary_name: itinerary.itinerary_name || proposal.itinerary_name || 'Travel Proposal',
          duration: proposal.duration || itinerary.duration,
          destinations: proposal.destination || itinerary.destinations,
          day_events: dayEvents, // Include full day-by-day details
          // Force sync pax counts from the actual lead source of truth
          adult: lead.adult || 1,
          child: lead.child || 0,
          infant: lead.infant || 0
        },
        hotelOptions: hotelOptions,
        policies: {
          inclusions: itinerary.inclusions || [],
          exclusions: itinerary.exclusions || [],
          terms_conditions: itinerary.terms_conditions || '',
          termsConditions: itinerary.terms_conditions || '', // Match blade
          refund_policy: itinerary.refund_policy || '',
          cancellationPolicy: itinerary.refund_policy || '', // Match blade
          remarks: itinerary.remarks || '',
          confirmationPolicy: itinerary.confirmation_policy || '', // Match blade
          amendmentPolicy: itinerary.amendment_policy || '', // Match blade
          paymentPolicy: itinerary.payment_policy || '' // Match blade
        }
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

  // ─── Shared Email Header / Footer builders ────────────────────────────────
  // Reads company info from the already-fetched `companySettings` state.
  // headerBg / footerBg are hex / CSS colour strings from the email_header_color
  // and email_footer_color settings that callers must load and pass in.
  const buildEmailHeader = (headerBg = '#1e40af', headerTextColor = '#ffffff') => {
    const cs = companySettings || {};
    const name    = cs.company_name    || 'TravelFusion CRM';
    const address = cs.company_address || 'Delhi, India';
    const phone   = cs.company_phone   || '+91-9871023004';
    const email   = cs.company_email   || 'info@travelops.com';
    const website = cs.company_website || 'www.travelops.com';
    const logo    = cs.company_logo    ? getDisplayImageUrl(cs.company_logo) : null;

    return `
      <table width="100%" cellpadding="0" cellspacing="0" style="background:${headerBg};">
        <tr>
          <td style="padding:24px 30px;text-align:center;">
            ${logo
              ? `<img src="${logo}" alt="${name}" style="height:56px;max-width:180px;object-fit:contain;display:block;margin:0 auto 10px;" />`
              : `<div style="font-size:28px;font-weight:bold;color:${headerTextColor};margin-bottom:6px;">${name}</div>`
            }
            <div style="font-size:20px;font-weight:bold;color:${headerTextColor};margin-bottom:4px;">${name}</div>
            <div style="font-size:13px;color:${headerTextColor};opacity:0.9;">${address}</div>
            <div style="font-size:13px;color:${headerTextColor};opacity:0.9;margin-top:3px;">📞 ${phone} | ✉ ${email} | 🌐 ${website}</div>
          </td>
        </tr>
      </table>
    `;
  };

  const buildEmailFooter = (footerBg = '#1e293b', footerTextColor = '#ffffff') => {
    const cs = companySettings || {};
    const name    = cs.company_name    || 'TravelFusion CRM';
    const address = cs.company_address || 'Delhi, India';
    const phone   = cs.company_phone   || '+91-9871023004';
    const email   = cs.company_email   || 'info@travelops.com';
    const website = cs.company_website || 'www.travelops.com';

    return `
      <div style="background:${footerBg};color:${footerTextColor};padding:24px 30px;text-align:center;margin-top:30px;">
        <p style="margin:0 0 6px 0;font-size:16px;font-weight:bold;">Thank you for choosing ${name}!</p>
        <p style="margin:0;font-size:13px;opacity:0.9;">📍 ${address} | 📞 ${phone} | ✉ ${email} | 🌐 ${website}</p>
      </div>
    `;
  };
  // ─────────────────────────────────────────────────────────────────────────


  // Generate 3D Premium Card Template HTML
  const generate3DPremiumEmailTemplate = (itinerary, allOptions, hotelsData, policies = {}) => {
    const _hdrBg3dp = (companySettings?.email_header_color) || '#667eea';
    const _ftrBg3dp = (companySettings?.email_footer_color) || '#4b5563';
    let html = `
      <div style="font-family: 'Arial', sans-serif; max-width: 800px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px;">
        <div style="border-radius: 20px; overflow:hidden; margin-bottom: 30px; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
          ${buildEmailHeader(_hdrBg3dp, '#ffffff')}
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
        ${buildEmailFooter(_ftrBg3dp, '#ffffff')}
      </div>
    `;

    return html;
  };

  // Generate 3D Floating Boxes Template HTML
  const generate3DFloatingEmailTemplate = (itinerary, allOptions, hotelsData, policies = {}) => {
    const _hdrBg3df = (companySettings?.email_header_color) || '#1e3c72';
    const _ftrBg3df = (companySettings?.email_footer_color) || '#1e3c72';
    let html = `
      <div style="font-family: 'Arial', sans-serif; max-width: 800px; margin: 0 auto; background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); padding: 40px 20px;">
        <div style="border-radius: 15px; overflow:hidden; margin-bottom: 40px; box-shadow: 0 30px 60px rgba(0,0,0,0.4);">
          ${buildEmailHeader(_hdrBg3df, '#ffffff')}
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
        ${buildEmailFooter(_ftrBg3df, '#ffffff')}
      </div>
    `;

    return html;
  };

  // Generate 3D Layered Design Template HTML
 const generateEmailTemplate = (itinerary, allOptions, hotelsData, policies = {}) => {

  const _hdrBg4 = (companySettings?.email_header_color) || '#0f2027';
  const _ftrBg4 = (companySettings?.email_footer_color) || '#ecf0f1';
  let html = `
  <html>
  <body style="margin:0; padding:0; font-family: Arial, sans-serif; background:#f4f6f9;">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding:20px;">
      <tr>
        <td align="center">
          <table width="700" style="background:#ffffff; border-radius:8px; overflow:hidden;">
            
            <!-- HEADER -->
            <tr>
              <td style="padding:0;">
                ${buildEmailHeader(_hdrBg4, '#ffffff')}
              </td>
            </tr>

            <!-- BASIC INFO -->
            <tr>
              <td style="padding:20px;">
                <h3>${itinerary.itinerary_name || 'Travel Quotation'}</h3>
                <p><b>Query ID:</b> ${formatLeadId(lead?.id)}</p>
                <p><b>Destination:</b> ${itinerary.destinations || 'N/A'}</p>
                <p><b>Duration:</b> ${itinerary.duration || 0} Nights / ${(itinerary.duration || 0) + 1} Days</p>
                <p><b>Travellers:</b> ${lead?.adult || 1} Adult(s), ${lead?.child || 0} Child</p>
              </td>
            </tr>
  `;

  allOptions.forEach(optNum => {
    const hotels = hotelsData[optNum] || [];
    const totalPrice = hotels.reduce((sum, h) => sum + (parseFloat(h.price) || 0), 0);

    html += `
      <tr>
        <td style="padding:20px;">
          <table width="100%" style="border:1px solid #ddd; border-radius:6px;">
            
            <!-- OPTION HEADER -->
            <tr>
              <td colspan="4" style="background:#2c5364; color:#fff; padding:10px;">
                <b>Option ${optNum}</b>
              </td>
            </tr>

            <!-- TABLE HEADER -->
            <tr style="background:#f1f1f1;">
              <th style="padding:10px;">Day</th>
              <th style="padding:10px;">Hotel</th>
              <th style="padding:10px;">Room</th>
              <th style="padding:10px;">Meal</th>
            </tr>
    `;

    hotels.forEach(hotel => {
      html += `
        <tr>
          <td style="padding:8px;">${hotel.day}</td>
          <td style="padding:8px;">${hotel.hotelName || 'Hotel'} (${hotel.category || 'N/A'}★)</td>
          <td style="padding:8px;">${hotel.roomName || 'N/A'}</td>
          <td style="padding:8px;">${hotel.mealPlan || 'N/A'}</td>
        </tr>
      `;
    });

    html += `
        <tr>
          <td colspan="4" style="padding:12px; background:#ecf0f1; text-align:right;">
            <b>Total: ₹${totalPrice.toLocaleString('en-IN')}</b>
          </td>
        </tr>

          </table>
        </td>
      </tr>
    `;
  });

  // POLICIES
  if (policies?.terms) {
    html += `
      <tr>
        <td style="padding:20px;">
          <h4>Terms & Conditions</h4>
          <p style="font-size:13px;">${policies.terms}</p>
        </td>
      </tr>
    `;
  }

  // FOOTER
  html += `
            <tr>
              <td style="padding:0;">
                ${buildEmailFooter(_ftrBg4, _ftrBg4 === '#ecf0f1' ? '#333333' : '#ffffff')}
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;

  return html;
};

  // Generate Adventure Template HTML
  const generateAdventureEmailTemplate = (itinerary, allOptions, hotelsData, policies = {}) => {
    const _hdrBg5 = (companySettings?.email_header_color) || '#65a30d';
    const _ftrBg5 = (companySettings?.email_footer_color) || '#365314';
    let html = `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; background: #d1fae5;">
        ${buildEmailHeader(_hdrBg5, '#ffffff')}
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
        ${buildEmailFooter(_ftrBg5, '#ffffff')}
      </div>
    `;

    return html;
  };

  // Generate Beach Template HTML
  const generateBeachEmailTemplate = (itinerary, allOptions, hotelsData, policies = {}) => {
    const _hdrBg6 = (companySettings?.email_header_color) || '#0891b2';
    const _ftrBg6 = (companySettings?.email_footer_color) || '#164e63';
    let html = `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; background: white;">
        ${buildEmailHeader(_hdrBg6, '#ffffff')}
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
        ${buildEmailFooter(_ftrBg6, '#ffffff')}
      </div>
    `;

    return html;
  };

  // Generate Elegant Package Template HTML
  const generateElegantEmailTemplate = (itinerary, allOptions, hotelsData, policies = {}) => {
    const _hdrBg7 = (companySettings?.email_header_color) || '#3f6212';
    const _ftrBg7 = (companySettings?.email_footer_color) || '#365314';
    let html = `
      <div style="font-family: 'Georgia', serif; max-width: 800px; margin: 0 auto; background: white;">
        ${buildEmailHeader(_hdrBg7, '#fef3c7')}
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
        ${buildEmailFooter(_ftrBg7, '#fef3c7')}
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
    const companyName = pdfCompanySettings?.company_name || 'TravelFusion CRM';
    const companyAddress = pdfCompanySettings?.company_address || 'Delhi, India';
    const companyPhone = pdfCompanySettings?.company_phone || '+91-9871023004';
    const companyEmail = pdfCompanySettings?.company_email || 'info@travelops.com';

    const pdfHdrBg = pdfCompanySettings?.email_header_color || '#1e40af';
    let html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#333;margin:0;padding:0;">
      <!-- PDF Header: Logo + Company Name + Details -->
      ${buildEmailHeader(pdfHdrBg, '#ffffff')}

      <div style="padding:30px;max-width:800px;margin:0 auto;">
        <h2 style="color:${pdfHdrBg};font-size:24px;margin-bottom:20px;">Travel Quotation - ${itinerary.itinerary_name || 'Itinerary'}</h2>

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
        ${buildEmailFooter(pdfCompanySettings?.email_footer_color || '#1e293b', '#ffffff')}
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
      return generateEmailTemplate(itinerary, allOptions, qData.hotelOptions, allPolicies);
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
          ${buildEmailHeader(styles.headerBg?.includes('gradient') ? styles.headerBg : (companySettings?.email_header_color || styles.headerBg || '#1e40af'), styles.headerColor || '#ffffff')}
          
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
          
          ${buildEmailFooter(companySettings?.email_footer_color || styles.footerBg || '#1f2937', styles.footerColor || '#ffffff')}
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

        showToastNotification('success', 'Email Sent!', 'Email sent successfully! Lead status updated to Proposal Sent.');
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
  const handleDownloadSingleOptionPdf = async (optionNum, quotationDataOverride = null, itineraryIdForPricing = null, showPrice = true) => {
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
          policies: qData.policies, // Send all policies (Remarks, Cancellation, etc.)
          show_price: showPrice // User choice: with or without price
        },
        inclusions: qData.policies?.inclusions || [],
        exclusions: qData.policies?.exclusions || [],
        pricing_breakdown: optionPriceMap,
        terms_conditions: qData.policies?.terms_conditions || ''
      };

      // 1. Create Quotation in Database
      const createRes = await quotationsAPI.create(payload);
      if (!createRes.data.success) {
        throw new Error(createRes.data.message || 'Failed to create quotation record');
      }
      const quotationId = createRes.data.data.quotation.id;

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

      // Automatically update lead status to 'Proposal Sent' if it's currently new or processing
      if (lead && (lead.status === 'new' || lead.status === 'processing')) {
        try {
          await leadsAPI.updateStatus(id, { status: 'proposal' });
          await fetchLeadDetails(); // Refresh to reflect status change
        } catch (statusError) {
          console.error('Failed to auto-update status on download:', statusError);
        }
      }

    } catch (error) {
      console.error('Error generating PDF via Backend:', error);
      showToastNotification('error', 'Download Failed', error.response?.data?.message || error.message || 'Backend error');
    }
  };

  const triggerPdfDownloadWithOptions = (optionNum, quotationDataOverride = null, itineraryIdForPricing = null) => {
    setPdfDownloadParams({ optionNum, quotationDataOverride, itineraryIdForPricing });
    setShowPdfPriceOptionModal(true);
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
    message += `Best regards,\nTravelFusion CRM Team`;

    // Check WhatsApp Connection
    if (waStatus !== 'Connected') {
      setShowWaConnectModal(true);
      return;
    }

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

        showToastNotification('success', 'WhatsApp Sent!', 'WhatsApp message sent successfully! Lead status updated to Proposal Sent.');
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
      await triggerPdfDownloadWithOptions(optNum, qData, opt.itinerary_id || null);
    } catch (err) {
      console.error('PDF download failed:', err);
      showToastNotification('error', 'Download Failed', 'Failed to download PDF. ' + (err.message || ''));
    }
  };

  // Download PDF with both options – single button above cards (black box area)
  const handleDownloadAllOptionsPdf = async () => {
    const first = visibleProposals[0];
    if (!first) {
      showToastNotification('warning', 'No Proposal', 'No proposal found. Please add an itinerary first.');
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

      await triggerPdfDownloadWithOptions(optionToDownload, qData, first.itinerary_id || null);
    } catch (err) {
      console.error('Download PDF failed:', err);
      showToastNotification('error', 'Download Failed', 'Failed to download PDF. ' + (err?.message || ''));
    }
  };

  // Send both options via Email / WhatsApp – single button above cards
  const handleSendAllOptions = async (channel) => {
    setSendAllDropdownOpen(false);
    const first = visibleProposals[0];
    if (!first) {
      showToastNotification('warning', 'No Proposal', 'No proposal found. Please add an itinerary first.');
      return;
    }
    if ((channel === 'email' || channel === 'both') && !lead?.email) {
      showToastNotification('warning', 'Email Required', 'Customer email required. Please add an email to the lead.');
      return;
    }
    if ((channel === 'whatsapp' || channel === 'both') && !lead?.phone) {
      showToastNotification('warning', 'Phone Required', 'Customer phone required for WhatsApp. Please add a phone number to the lead.');
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
      showToastNotification('error', 'Send Failed', 'Failed to send. ' + (err?.message || ''));
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
    message += `Best regards,\nTravelFusion CRM Team`;

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
            <h1>TravelFusion CRM</h1>
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
            <p>Thank you for choosing TravelFusion CRM!</p>
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
    message += `Best regards,\nTravelFusion CRM Team`;

    // Check WhatsApp Connection
    if (waStatus !== 'Connected') {
      setShowWaConnectModal(true);
      return;
    }

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
      <div className="flex flex-col items-center justify-center h-[60vh] animate-in fade-in duration-500">
        <LogoLoader text="Connecting to query details..." />
      </div>
    );
  }

  return (
    <div className={`relative page-transition ${loading && lead ? 'opacity-80' : ''}`}>
      {loading && <div className="side-progress-bar absolute top-0 left-0 right-0 h-1 z-50" />}

      {loading && !lead ? (
        <div className="flex flex-col items-center justify-center h-[90vh] animate-in fade-in duration-500 bg-white/50 backdrop-blur-sm">
          <LogoLoader text="Loading detailed query..." />
        </div>
      ) : !lead || (lead && typeof lead.id === 'undefined') ? (
        <div className="flex flex-col items-center justify-center h-[90vh] animate-in fade-in duration-500 bg-[#D8DEF5]">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Query Not Found</h2>
            <p className="text-gray-600">The query you're looking for doesn't exist.</p>
            <button
              onClick={() => navigate('/leads')}
              className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-lg active:scale-95 transition-all"
            >
              Back to Queries
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="p-4 sm:p-6" style={{ backgroundColor: settings?.dashboard_background_color || '#D8DEF5', minHeight: '100vh' }}>
            {/* Header */}
            <div className="mb-4 rounded-xl bg-white p-4 sm:p-6 shadow-sm border border-gray-100">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => navigate('/leads')}
                    className="p-2.5 hover:bg-gray-100 rounded-full transition-colors text-gray-600 border border-gray-100"
                    title="Back to Queries"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 leading-tight flex items-center gap-3">
                      Query: #{formatLeadId(lead.id)}
                      {lead.status === 'processing' && (
                        <span className="px-3 py-1 text-xs font-bold bg-indigo-100 text-indigo-600 rounded-full border border-indigo-200 uppercase tracking-wider status-glow-processing">Under Process</span>
                      )}
                      {lead.status === 'new' && (
                        <span className="px-3 py-1 text-xs font-bold bg-blue-100 text-blue-600 rounded-full border border-blue-200 uppercase tracking-wider status-glow-new">New</span>
                      )}
                      {lead.status === 'proposal' && (
                        <span className="px-3 py-1 text-xs font-bold bg-orange-100 text-orange-600 rounded-full border border-orange-200 uppercase tracking-wider status-glow-proposal">Proposal Sent</span>
                      )}
                      {lead.status === 'followup' && (
                        <span className="px-3 py-1 text-xs font-bold bg-purple-100 text-purple-600 rounded-full border border-purple-200 uppercase tracking-wider status-glow-followup">Follow-up</span>
                      )}
                    </h1>
                    <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                      <span className="font-medium">Created:</span> {formatDate(lead.created_at)}
                      <span className="text-gray-300">•</span>
                      <span className="font-medium">Updated:</span> {formatDateTime(lead.updated_at)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {lead.priority === 'hot' && (
                    <span className="px-3 py-1 text-xs font-bold bg-red-100 text-red-600 rounded-full border border-red-200 uppercase tracking-wider">Hot Lead</span>
                  )}
                  {lead.status === 'confirmed' && (
                    <span className="px-3 py-1 text-xs font-bold bg-green-100 text-green-600 rounded-full border border-green-200 uppercase tracking-wider status-glow-confirmed">Booked</span>
                  )}
                   {lead.status === 'cancelled' && (
                    <span className="px-3 py-1 text-xs font-bold bg-gray-100 text-gray-600 rounded-full border border-gray-200 uppercase tracking-wider">Declined</span>
                  )}
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column (Sidebar Info) - 4 cols on laptop, stack on tablet/mobile */}
              <div className="lg:col-span-4 space-y-6">
                {/* Query Information */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                  <div className="flex justify-between items-center mb-5">
                    <h2 className="text-xl font-bold text-gray-900">Query Information</h2>
                    <button
                      onClick={() => {
                        setEditQueryFormData({
                          destination: lead.destination || '',
                          travel_start_date: lead.travel_start_date ? lead.travel_start_date.split('T')[0] : '',
                          travel_end_date: lead.travel_end_date ? lead.travel_end_date.split('T')[0] : '',
                          source: lead.source || '',
                          service: lead.service || '',
                          adult: lead.adult || 1,
                          child: lead.child || 0,
                          infant: lead.infant || 0,
                          assigned_to: lead.assigned_to || '',
                          remark: lead.remark || ''
                        });
                        setShowEditQueryModal(true);
                      }}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit Query"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  </div>
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
                      value={lead.assigned_user?.name || users.find(u => u.id === lead.assigned_to)?.name || "N/A"}
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

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <div className="flex justify-between items-center mb-5">
                    <h2 className="text-lg font-bold text-gray-900">
                      Travellers (Pax)
                    </h2>
                    <button
                      onClick={handlePaxModalOpen}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit Travellers"
                    >
                      <Pencil className="w-4 h-4" />
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
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <div className="flex justify-between items-center mb-5">
                    <h2 className="text-lg font-bold text-gray-900">
                      Related Customer
                    </h2>
                    <button
                      onClick={() => {
                        setEditLeadFormData({
                          client_name: lead.client_name || '',
                          client_title: lead.client_title || '',
                          email: lead.email || '',
                          phone: lead.phone || '',
                          date_of_birth: lead.date_of_birth ? lead.date_of_birth.split('T')[0] : '',
                          marriage_anniversary: lead.marriage_anniversary ? lead.marriage_anniversary.split('T')[0] : '',
                        });
                        setShowEditLeadModal(true);
                      }}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit Customer"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                    {/* INFO SECTION */}
                    <div className="space-y-3">
                      <div className="text-lg font-bold text-gray-900">
                        {lead.client_title ? `${lead.client_title} ` : ''}
                        {lead.client_name}
                      </div>

                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <div className="p-2 bg-blue-50 rounded-full">
                          <Smartphone className="w-4 h-4 text-blue-600" />
                        </div>
                        <span className="font-medium">{lead.phone || 'N/A'}</span>
                      </div>

                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <div className="p-2 bg-pink-50 rounded-full">
                          <Mail className="w-4 h-4 text-[#E78175]" />
                        </div>
                        <span className="font-medium truncate">{lead.email || 'N/A'}</span>
                      </div>

                      {(lead.date_of_birth || lead.marriage_anniversary) && (
                        <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-4">
                          {lead.date_of_birth && (
                            <div className="flex items-center gap-2 text-xs text-gray-600 bg-yellow-50 px-3 py-1.5 rounded-full border border-yellow-100">
                              <Gift className="w-3.5 h-3.5 text-yellow-600" />
                              <span>DOB: <span className="font-semibold">{formatDate(lead.date_of_birth)}</span></span>
                            </div>
                          )}
                          {lead.marriage_anniversary && (
                            <div className="flex items-center gap-2 text-xs text-gray-600 bg-red-50 px-3 py-1.5 rounded-full border border-red-100">
                              <Heart className="w-3.5 h-3.5 text-red-600" />
                              <span>Anniv: <span className="font-semibold">{formatDate(lead.marriage_anniversary)}</span></span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* ACTIONS SECTION */}
                    <div className="flex flex-col sm:flex-row lg:flex-col gap-3 pt-2">
                      <a
                        href={lead.phone ? `tel:${lead.phone}` : '#'}
                        className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-3 px-4 rounded-xl transition-all shadow-sm"
                      >
                        <Smartphone className="w-4 h-4" />
                        Call
                      </a>

                      <a
                        href={lead.email ? `mailto:${lead.email}` : '#'}
                        className="flex-1 flex items-center justify-center gap-2 bg-[#E78175] hover:bg-[#d67067] text-white text-sm font-bold py-3 px-4 rounded-xl transition-all shadow-sm"
                      >
                        <Mail className="w-4 h-4" />
                        Email
                      </a>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div className={`rounded-xl border shadow-sm p-5 ${showNoteInput ? 'bg-gray-50' : 'bg-white'}`}>
                  {/* TITLE */}
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">
                    Notes
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
                        <div className="w-full mt-4 space-y-3">
                          <select
                            value={noteReason}
                            onChange={(e) => setNoteReason(e.target.value)}
                            className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                          >
                            <option value="">Select Reason</option>
                            {noteReasons.map((reason) => (
                              <option key={reason} value={reason}>{reason}</option>
                            ))}
                          </select>

                          {noteReason === 'Other' && (
                            <textarea
                              value={noteText}
                              onChange={(e) => setNoteText(e.target.value)}
                              placeholder="Type Note Here..."
                              rows={3}
                              className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner"
                            />
                          )}

                          <div className="flex justify-end gap-3 mt-2">
                            <button
                              onClick={() => {
                                setShowNoteInput(false);
                                setNoteText('');
                                setNoteReason('');
                                setEditingNoteId(null);
                              }}
                              className="text-gray-500 hover:text-gray-700 text-sm font-medium"
                            >
                              Cancel
                            </button>

                            <button
                              onClick={handleAddNote}
                              disabled={addingNote || !noteReason || (noteReason === 'Other' && !noteText.trim())}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-1.5 rounded-full text-sm font-medium disabled:opacity-50 shadow-sm transition-all"
                            >
                              {addingNote ? 'Saving...' : (editingNoteId ? 'Update Note' : 'Add Note')}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* RIGHT SIDE */}
                    <div className="hidden sm:block text-right shrink-0">
                      {/* NOTES STATUS */}
                      <div className="text-sm text-gray-500 font-medium bg-gray-100 px-3 py-1 rounded-full">
                        {notes.length === 0 ? '0 Notes' : `${notes.length} Notes`}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column (Tabs Content) - 8 cols on laptop, stack on tablet/mobile */}
              <div className="lg:col-span-8 space-y-6">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 min-w-0">

                  <div className="flex justify-start border-b border-gray-100 sticky top-0 bg-white z-10 px-2 overflow-x-auto no-scrollbar">
                    <div className="flex space-x-1 p-1">
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
                        { key: 'calls', label: 'Calls' },
                        { key: 'history', label: 'History' }
                      ].map(({ key, label }, index) => (
                        <button
                          key={key}
                          onClick={() => setActiveTab(key)}
                          className={`px-4 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${activeTab === key
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
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
                      <div className="flex flex-col gap-5 w-full max-w-4xl">
                        {/* ── Sub-tabs: Active Itinerary | Itinerary History ── */}
                        <div className="flex items-center border-b border-gray-200">
                          <button
                            onClick={() => setProposalSubTab('active')}
                            className={`px-5 py-2.5 text-sm font-semibold border-b-2 transition-all ${
                              proposalSubTab === 'active'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                          >
                            Active Itinerary
                          </button>
                          <button
                            onClick={() => setProposalSubTab('history')}
                            className={`px-5 py-2.5 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
                              proposalSubTab === 'history'
                                ? 'border-orange-500 text-orange-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                          >
                            Itinerary History
                            {itineraryHistoryTotal > 0 && (
                              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                                proposalSubTab === 'history'
                                  ? 'bg-orange-100 text-orange-700'
                                  : 'bg-gray-100 text-gray-600'
                              }`}>
                                {itineraryHistoryTotal}
                              </span>
                            )}
                          </button>
                        </div>

                        {/* ── Sub-tab Content ── */}
                        {proposalSubTab === 'active' ? (
                          <>
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
                                        Option {confirmedOption.optionNumber} Booked
                                      </h3>
                                      <span className="px-2.5 py-0.5 bg-green-500 text-white text-xs font-bold rounded-full">
                                        BOOKED
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
                        {loadingProposals ? (
                          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-gray-100 shadow-sm">
                            <LogoLoader text="Fetching itineraries..." compact={true} />
                          </div>
                        ) : visibleProposals.length === 0 ? (
                          <div className="text-center w-full py-12 text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
                            <p className="mb-2">No proposals added yet</p>
                            <p className="text-sm">Click "Insert itinerary" to add an itinerary as a proposal</p>
                          </div>
                        ) : (() => {
                          const first = visibleProposals[0] || proposals[0];
                          const cardTitle = (first?.itinerary_name || first?.title || first?.metadata?.itinerary_name || lead?.destination || 'Proposals').toString().trim() || 'Proposals';
                          const rawImage = first?.image || first?.metadata?.image || first?.metadata?.itinerary_image;
                          const cardImageResult = getDisplayImageUrl(rawImage);
                          const cardImage = cardImageResult || rawImage || null;
                          const cardDestination = first?.destination || first?.metadata?.destination || lead?.destination || '';

                          return (
                            <div className="w-full">
                              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                {/* Card header – one image/title block (click to edit itinerary) */}
                                <div
                                  className="relative h-48 sm:h-60 w-full overflow-hidden rounded-t-xl cursor-pointer bg-gray-100"
                                  onClick={() => {
                                    const meta = first?.metadata || {};
                                    const itineraryId = first?.itinerary_id || meta.itinerary_id || proposals[0]?.itinerary_id;
                                    if (itineraryId) {
                                      window.open(`/itineraries/${itineraryId}?fromLead=${id}`, '_blank');
                                    } else {
                                      showToastNotification('error', 'Error', 'Itinerary ID not found for this proposal.');
                                    }
                                  }}
                                >
                                  {cardImage ? (
                                    <img
                                      src={cardImage}
                                      alt={cardTitle}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        e.target.style.display = 'none';
                                        if (e.target.nextSibling) {
                                          e.target.nextSibling.style.display = 'flex';
                                        }
                                      }}
                                    />
                                  ) : null}
                                  <div 
                                    className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center"
                                    style={{ display: cardImage ? 'none' : 'flex' }}
                                  >
                                    <span className="text-gray-400 font-bold text-xl uppercase tracking-widest opacity-50">{cardTitle.substring(0, 2)}</span>
                                  </div>
                                  <div className="absolute bottom-0 left-0 right-0 bg-black/65 p-4 backdrop-blur-sm">
                                    <h3 className="text-xl font-bold text-white truncate" title={cardTitle}>{cardTitle}</h3>
                                    {cardDestination && (
                                      <p className="text-sm text-gray-200 truncate" title={cardDestination}>{cardDestination}</p>
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
                                          title="Send all options via Email / WhatsApp"
                                        >
                                          <Send className="h-4 w-4" />
                                          {sendingOptionChannel ? 'Sending…' : 'Send'}
                                          <ChevronDown className="h-4 w-4" />
                                        </button>
                                        {sendAllDropdownOpen && (
                                          <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1 min-w-[180px]">
                                            <button type="button" onClick={() => handleSendAllOptions('email')} className="w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center gap-2 text-sm">
                                              <Mail className="h-4 w-4 text-blue-600" /> Email (Both Options)
                                            </button>
                                            <button type="button" onClick={() => handleSendAllOptions('whatsapp')} className="w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center gap-2 text-sm">
                                              <MessageCircle className="h-4 w-4 text-green-600" /> WhatsApp (Both Options)
                                            </button>
                                            <button type="button" onClick={() => handleSendAllOptions('both')} className="w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center gap-2 text-sm">
                                              <Send className="h-4 w-4" /> Send on Both (Email + WhatsApp)
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                      <button
                                        type="button"
                                        onClick={handleDownloadAllOptionsPdf}
                                        disabled={!visibleProposals.length}
                                        className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg border border-purple-700 transition-colors disabled:opacity-50"
                                        title="Download a single PDF for both options"
                                      >
                                        <Download className="h-4 w-4" />
                                        Download PDF
                                      </button>
                                    </div>
                                  </div>
                                  <hr className="my-4" />

                                  {/* Package options – professional card layout */}
                                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-4">
                                    {visibleProposals.map((opt) => {
                                      const meta = opt.metadata || {};
                                      const displayPrice = opt.price ?? meta.price ?? opt.pricing?.finalClientPrice ?? meta.pricing?.finalClientPrice ?? 0;
                                      const itineraryName = opt.itinerary_name || meta.itinerary_name || opt.title || 'Itinerary';

                                      return (
                                        <div
                                          key={opt.id}
                                          className={`rounded-xl border-2 overflow-hidden shadow-sm transition-all ${opt.confirmed ? 'border-green-500 bg-green-50/50 shadow-green-100' : 'border-gray-200 bg-white hover:shadow-md'}`}
                                        >
                                          {/* Card header */}
                                          <div className="bg-blue-600 px-4 py-2.5 flex items-center justify-between">
                                            <span className="text-white font-semibold">
                                              {opt.optionNumber != null ? `Option ${opt.optionNumber}` : itineraryName}
                                            </span>
                                            {opt.confirmed && (
                                              <span className="px-2 py-0.5 bg-green-500 text-white text-xs font-semibold rounded-full">Booked</span>
                                            )}
                                          </div>
                                          {/* Card body */}
                                          <div className="p-4">
                                            <div className="mb-4">
                                              {/* Breakdown: Base + Tax - Discount */}
                                              {(opt.pricing || meta.pricing) && ((opt.pricing?.totalGross || meta.pricing?.totalGross) > 0 || (opt.pricing?.totalTax || meta.pricing?.totalTax) > 0) && (
                                                <div className="mb-2 space-y-1 bg-gray-50 p-2 rounded text-xs">
                                                  {(opt.pricing?.totalGross || meta.pricing?.totalGross) > 0 && (
                                                    <div className="flex justify-between text-gray-600">
                                                      <span>Base Price:</span>
                                                      <span>₹{Math.round(opt.pricing?.totalGross || meta.pricing?.totalGross).toLocaleString('en-IN')}</span>
                                                    </div>
                                                  )}
                                                  {(opt.pricing?.totalTax || meta.pricing?.totalTax) > 0 && (
                                                    <div className="flex justify-between text-gray-600">
                                                      <span>Taxes (GST/TCS):</span>
                                                      <span>+ ₹{Math.round(opt.pricing?.totalTax || meta.pricing?.totalTax).toLocaleString('en-IN')}</span>
                                                    </div>
                                                  )}
                                                  {(opt.pricing?.discountAmount || meta.pricing?.discountAmount) > 0 && (
                                                    <div className="flex justify-between text-green-600 font-medium">
                                                      <span>Discount ({(opt.pricing?.discount || meta.pricing?.discount)}%):</span>
                                                      <span>- ₹{Math.round(opt.pricing?.discountAmount || meta.pricing?.discountAmount).toLocaleString('en-IN')}</span>
                                                    </div>
                                                  )}
                                                </div>
                                              )}

                                              {/* Pax Summary */}
                                              <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 mb-3 bg-gray-50 p-1.5 rounded">
                                                <Users className="h-3.5 w-3.5 text-gray-400" />
                                                <span>{lead?.adult || 1} Adult{(lead?.adult > 1) ? 's' : ''}</span>
                                                {(lead?.child > 0) && <span>, {lead?.child} Child{(lead?.child > 1) ? 'ren' : ''}</span>}
                                              </div>

                                              {/* Hotels Summary */}
                                              {(meta.hotelOptions || opt.hotelOptions) ? (
                                                <div className="space-y-1 mb-4 max-h-32 overflow-y-auto pr-1 thin-scrollbar">
                                                  {(meta.hotelOptions || opt.hotelOptions || []).map((h, hIdx) => (
                                                    <div key={hIdx} className="flex items-start gap-1.5 text-xs text-gray-600">
                                                      <Building2 className="h-3 w-3 mt-0.5 text-blue-500 flex-shrink-0" />
                                                      <span className="truncate font-medium">{h.hotelName || h.name || 'Hotel'}</span>
                                                    </div>
                                                  ))}
                                                </div>
                                              ) : (
                                                <div className="text-[10px] text-gray-400 mb-4 italic">No hotels set</div>
                                              )}

                                              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-0.5">Total Price</p>
                                              <p className="text-2xl font-bold text-gray-900">₹{Number(displayPrice).toLocaleString('en-IN')}</p>
                                            </div>
                                            <div className="flex flex-col gap-2">
                                              {opt.confirmed ? (
                                                <span className="w-full text-center px-3 py-2 bg-green-100 text-green-700 text-sm font-semibold rounded-lg border border-green-300">
                                                  Booked
                                                </span>
                                              ) : (
                                                <button
                                                  type="button"
                                                  onClick={(e) => { e.stopPropagation(); handleConfirmOption(opt.id); }}
                                                  className="w-full bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-3 py-2 rounded-lg transition-colors"
                                                >
                                                  Book Now
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
                                                  onClick={(e) => { e.stopPropagation(); window.open(`/itineraries/${opt.itinerary_id}?fromLead=${id}`, '_blank'); }}
                                                  className="w-full text-gray-600 hover:text-gray-800 hover:bg-gray-100 text-sm font-medium px-3 py-2 rounded-lg border border-gray-300 transition-colors"
                                                >
                                                  Edit
                                                </button>

                                              )}
                                              {/* Duplicate Option button removed for now */}
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>

                                  {/* Change Plan button (only when nothing is confirmed) */}
                                  {!hasConfirmedProposal && (
                                    <div className="flex justify-end">
                                      <button
                                        onClick={handleRemoveItinerary}
                                        className="inline-flex items-center gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 text-sm font-semibold px-3 py-1.5 rounded-lg border border-red-200 transition-colors"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                        Remove Itinerary
                                      </button>
                                      <button
                                        onClick={handleChangePlan}
                                        className="inline-flex items-center gap-1.5 text-orange-600 hover:text-orange-700 hover:bg-orange-50 text-sm font-semibold px-3 py-1.5 rounded-lg border border-orange-200 transition-colors"
                                      >
                                        🔄 Change Plan
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
                          </>
                        ) : (
                          /* History Sub-Tab */
                          <ItineraryHistoryTab
                            historyData={itineraryHistory}
                            totalChanges={itineraryHistoryTotal}
                            loadingHistory={loadingItineraryHistory}
                            getDisplayImageUrl={getDisplayImageUrl}
                            activeProposals={visibleProposals}
                            onViewQuotation={handleViewQuotation}
                            leadId={id}
                          />
                        )}
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
                            loadingMessages={loadingWhatsappMessages}
                            fetchWhatsAppMessages={fetchWhatsAppMessages}
                            handleSendWhatsAppFromTab={handleSendWhatsAppFromTab}
                            profilePicUrl={profilePicUrl}
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
                                          onSendReminder={handleSendPaymentReminder}
                                          remindingPaymentId={remindingPaymentId}
                                        />
                                      ) : activeTab === 'calls' ? (
                                        <CallsTab
                                          calls={leadCalls}
                                          loading={loadingCalls}
                                          onPlayRecording={handlePlayRecording}
                                          onDeleteCall={handleDeleteCall}
                                          recordingUrls={recordingUrls}
                                          activeRecordingId={activeRecordingId}
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
          <Dialog visible={showVoucherPopup} style={{ width: '80vw' }} onHide={() => setShowVoucherPopup(false)} showCloseIcon={false} header={() => (
            <div className="flex justify-between items-center p-4 border-b border-gray-100 shrink-0 bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-800">Voucher Preview</h2>
              <button type="button" onClick={() => setShowVoucherPopup(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                <X className="h-6 w-6" />
              </button>
            </div>
          )}>
            <div className="p-0 bg-gray-100">
              <iframe title="Voucher preview" srcDoc={voucherPopupHtml} className="w-full min-h-[75vh] border-0" />
            </div>
          </Dialog>






          {/* Invoice Preview Popup */}
          <Dialog visible={showInvoicePreview} style={{ width: '80vw' }} onHide={() => setShowInvoicePreview(false)} showCloseIcon={false} header={() => (
            <div className="flex justify-between items-center p-4 border-b border-gray-100 shrink-0 bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-800">Invoice Preview</h2>
              <button type="button" onClick={() => setShowInvoicePreview(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                <X className="h-6 w-6" />
              </button>
            </div>
          )}>
            <div className="p-0 bg-gray-100">
              <iframe title="Invoice preview" srcDoc={invoicePreviewHtml} className="w-full min-h-[75vh] border-0" />
            </div>
          </Dialog>






          {/* Itinerary Setup Modal */}


          <Dialog showCloseIcon={false} header={() => (
            <div className="flex justify-between items-center p-6 border-b border-gray-200 shrink-0">
              <h2 className="text-xl font-bold text-gray-800">Itinerary setup</h2>
              <button
                onClick={() => setShowAddItineraryModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          )}
            style={{ minWidth: '60vw' }}
            visible={showAddItineraryModal}
          >
            <form onSubmit={handleSaveItinerary} className="flex flex-col overflow-hidden">
              <div className="p-6 grid grid-cols-2 gap-6 overflow-y-auto flex-1">
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
              <div className="flex justify-end p-6 border-t border-gray-200 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAddItineraryModal(false)}
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
          </Dialog>

          {/* Choose from Library modal (for Itinerary setup) */}
          <Dialog visible={showItineraryLibraryModal} style={{ width: '80vw' }} onHide={() => { setShowItineraryLibraryModal(false); setItineraryLibrarySearchTerm(''); }} showCloseIcon={false} header={() => (
            <div className="flex justify-between items-center p-4 border-b border-gray-100 shrink-0 bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-800">Choose Image</h2>
              <button type="button" onClick={() => { setShowItineraryLibraryModal(false); setItineraryLibrarySearchTerm(''); setItineraryFreeStockPhotos([]); setItineraryLibraryPackages([]); }} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                <X className="h-6 w-6" />
              </button>
            </div>
          )}>
            <div className="flex flex-col h-[75vh]">
              <div className="flex border-b border-gray-200 shrink-0">
                <button type="button" onClick={() => setItineraryLibraryTab('free')} className={`px-4 py-3 text-sm font-medium border-b-2 ${itineraryLibraryTab === 'free' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}>Free stock images</button>
                <button type="button" onClick={() => setItineraryLibraryTab('your')} className={`px-4 py-3 text-sm font-medium border-b-2 ${itineraryLibraryTab === 'your' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}>Your itineraries</button>
              </div>
              <div className="p-4 border-b border-gray-200 shrink-0">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input type="text" value={itineraryLibrarySearchTerm} onChange={(e) => setItineraryLibrarySearchTerm(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (itineraryLibraryTab === 'free' ? fetchItineraryFreeStockImages() : null)} placeholder={itineraryLibraryTab === 'free' ? 'Search e.g. Shimla, Kufri...' : 'Search your itineraries...'} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                  </div>
                  {itineraryLibraryTab === 'free' && (
                    <button type="button" onClick={fetchItineraryFreeStockImages} disabled={(itineraryLibrarySearchTerm || '').trim().length < 2 || itineraryFreeStockLoading} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">Search</button>
                  )}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 bg-gray-50/30">
                {itineraryLibraryTab === 'free' ? (
                  itineraryFreeStockLoading ? (
                    <div className="flex flex-col items-center justify-center h-48 gap-3"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" /><p className="text-sm text-gray-500 font-medium">Searching Pexels Photos...</p></div>
                  ) : (itineraryLibrarySearchTerm || '').trim().length < 2 ? (
                    <div className="text-center py-12 text-gray-500"><div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-500"><Camera className="h-8 w-8" /></div><p className="font-medium">Type location (e.g. Maldives, Shimla) and click Search.</p></div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {itineraryFreeStockPhotos.map((p) => (
                        <button key={p.id} type="button" onClick={() => handleSelectItineraryFreeStockImage(p.url)} className="group relative aspect-square rounded-xl overflow-hidden border-2 border-transparent hover:border-blue-500 transition-all shadow-sm">
                          <img src={p.thumb || p.url} alt={p.alt} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold">SELECT IMAGE</div>
                        </button>
                      ))}
                    </div>
                  )
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {itineraryLibraryImages.map((p) => (
                      <button key={p.id} type="button" onClick={() => handleSelectItineraryLibraryImage(p)} className="group relative aspect-square rounded-xl overflow-hidden border-2 border-transparent hover:border-blue-500 transition-all shadow-sm">
                        <img
                          src={getDisplayImageUrl(p.image) || p.image}
                          alt={p.itinerary_name || p.title || 'Select'}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold p-2 text-center">{p.title || p.itinerary_name || 'SELECT'}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Dialog>


          {/* Insert Itinerary Modal */}


          <Dialog style={{ width: '50vw' }} header={() => (
            <div className="flex justify-between items-center p-6 border-b border-gray-200 shrink-0">
              <h2 className="text-xl font-bold text-gray-800">Select Itinerary</h2>
              <button onClick={() => { setShowInsertItineraryModal(false); setItinerarySearchTerm(''); }} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>
          )} visible={showInsertItineraryModal}

            showCloseIcon={false}
            onHide={() => setShowInsertItineraryModal(false)}>
            <div className="p-6">
              {leadTripDays != null && (
                <div className="mb-3 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                  Showing itineraries for <strong>{leadTripDays} day{leadTripDays !== 1 ? 's' : ''}</strong>
                </div>
              )}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input type="text" placeholder="Search..." value={itinerarySearchTerm} onChange={(e) => setItinerarySearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg" />
                </div>
              </div>
              <div className="space-y-3">
                {loadingItineraries ? (
                  <LogoLoader text="Loading..." />
                ) : filteredItineraries.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No itineraries found.</div>
                ) : filteredItineraries.map((it) => (
                  <div key={it.id} onClick={() => handleSelectItinerary(it)} className="border border-gray-200 rounded-lg p-4 hover:bg-blue-50 cursor-pointer flex gap-4 items-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden border border-gray-200 flex-shrink-0">
                      {it.image ? (
                        <img
                          src={getDisplayImageUrl(it.image) || it.image}
                          alt={it.title || 'Itinerary'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ImageIcon className="h-6 w-6 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold truncate">{it.title || it.itinerary_name}</h3>
                      <p className="text-sm text-gray-500">{it.duration} Days - {it.destination}</p>
                    </div>
                    <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition-colors flex-shrink-0">Insert</button>
                  </div>
                ))}
              </div>
            </div>

          </Dialog>



          {/* Add Follow-up Modal */}
          <Dialog visible={showFollowupModal} style={{ width: 'min(95vw, 600px)' }} onHide={() => {
            setShowFollowupModal(false);
            setFollowupFormData({ type: 'Task', description: '', reminder_date: '', reminder_time: '', set_reminder: 'Yes' });
            setEditingFollowupId(null);
          }} showCloseIcon={false} header={() => (
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-800">{editingFollowupId ? 'Edit Followup / Task' : 'Add Followup / Task'}</h2>
              <button onClick={() => { setShowFollowupModal(false); setEditingFollowupId(null); }} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"><X className="h-6 w-6" /></button>
            </div>
          )}>
            <form onSubmit={handleAddFollowup} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <select value={followupFormData.type} onChange={(e) => setFollowupFormData({ ...followupFormData, type: e.target.value })} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                  <option value="Task">Task</option>
                  <option value="Followup">Followup</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea value={followupFormData.description} onChange={(e) => setFollowupFormData({ ...followupFormData, description: e.target.value })} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none" placeholder="Enter description..." rows="4" required />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Reminder Date</label>
                  <input type="date" value={followupFormData.reminder_date ? (() => {
                    const parts = followupFormData.reminder_date.split('-');
                    return parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : followupFormData.reminder_date;
                  })() : ''} onChange={(e) => {
                    if (e.target.value) {
                      const parts = e.target.value.split('-');
                      setFollowupFormData({ ...followupFormData, reminder_date: `${parts[2]}-${parts[1]}-${parts[0]}` });
                    } else { setFollowupFormData({ ...followupFormData, reminder_date: '' }); }
                  }} min={new Date().toISOString().split('T')[0]} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                  <select value={followupFormData.reminder_time} onChange={(e) => setFollowupFormData({ ...followupFormData, reminder_time: e.target.value })} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                    {generateTimeSlots().map((time) => (<option key={time} value={time}>{time}</option>))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 p-6 border-t border-gray-100 mt-6 bg-gray-50/50 -mx-6 -mb-6 rounded-b-xl">
                <button type="button" onClick={() => setShowFollowupModal(false)} className="px-5 py-2.5 text-gray-600 font-medium hover:text-gray-900">Cancel</button>
                <button type="submit" disabled={addingFollowup} className="bg-blue-600 text-white px-8 py-2.5 rounded-lg font-bold shadow-md hover:bg-blue-700 disabled:opacity-50 transition-all">{addingFollowup ? 'Saving...' : (editingFollowupId ? 'Update' : 'Save')}</button>
              </div>
            </form>
          </Dialog>

          {/* Quotation Modal */}
          <Dialog visible={showQuotationModal && !!selectedProposal && !!quotationData} style={{ width: 'min(98vw, 1100px)' }} onHide={() => {
            setShowQuotationModal(false);
            setSelectedProposal(null);
            setQuotationData(null);
            setSelectedOption(null);
          }} showCloseIcon={false} header={() => (
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-2xl font-black text-gray-800 tracking-tight">View Quotation</h2>
              <div className="flex items-center gap-2">
                {selectedOption && quotationData && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <button onClick={() => handleSendMail(selectedOption)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 text-sm font-bold shadow-lg shadow-blue-100 transition-all active:scale-95"><Mail className="h-4 w-4" /> Email</button>
                    <button onClick={() => triggerPdfDownloadWithOptions(selectedOption, quotationData)} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 text-sm font-bold shadow-lg shadow-purple-100 transition-all active:scale-95"><Download className="h-4 w-4" /> PDF</button>
                    <button onClick={() => handleSendWhatsApp(selectedOption)} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 text-sm font-bold shadow-lg shadow-green-100 transition-all active:scale-95"><MessageCircle className="h-4 w-4" /> WhatsApp</button>
                  </div>
                )}
                <button onClick={() => setShowQuotationModal(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors ml-4"><X className="h-6 w-6" /></button>
              </div>
            </div>
          )}>
            <div className="p-6 overflow-y-auto max-h-[80vh] text-slate-900">
              {loadingQuotation ? (
                <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>
              ) : quotationData && (
                <>
                  {/* Option Selector */}
                  {quotationData.hotelOptions && (
                    <div className="mb-8 p-6 bg-blue-50/50 rounded-3xl border border-blue-100 flex flex-col md:flex-row md:items-center gap-6">
                      <div><p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Package Versions</p><p className="text-lg font-black text-gray-800">Select an Option</p></div>
                      <div className="flex gap-3 flex-wrap">
                        {Object.keys(quotationData.hotelOptions).map((optionNum) => (
                          <button key={optionNum} onClick={() => setSelectedOption(optionNum)} className={`px-6 py-3 rounded-2xl font-black transition-all ${selectedOption === optionNum ? 'bg-blue-600 text-white shadow-xl shadow-blue-100 scale-105' : 'bg-white text-gray-400 hover:bg-gray-100 border border-gray-100'}`}>Option {optionNum}</button>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedOption && quotationData.hotelOptions[selectedOption] && (
                    <div className="space-y-8">
                      {/* Header Info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-3xl">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Query Details</p>
                          <div className="space-y-2 text-sm font-medium">
                            <div className="flex justify-between border-b border-gray-50 pb-2"><span>Ref ID:</span><span className="font-black text-gray-800">#{formatLeadId(lead?.id)}</span></div>
                            {quotationData.itinerary && (
                              <div className="flex justify-between border-b border-gray-50 pb-2">
                                <span>Itinerary:</span>
                                <span 
                                  className="font-black text-blue-600 hover:text-blue-800 hover:underline cursor-pointer transition-colors"
                                  onClick={() => window.open(`/itineraries/${quotationData.itinerary.id}?fromLead=${id}`, '_blank')}
                                >
                                  {quotationData.itinerary?.title || quotationData.itinerary?.itinerary_name || 'View Itinerary'}
                                </span>
                              </div>
                            )}
                            <div className="flex justify-between border-b border-gray-50 pb-2"><span>Adults/Children:</span><span className="font-black text-gray-800">{lead?.adult}A / {lead?.child}C</span></div>
                            <div className="flex justify-between border-b border-gray-50 pb-2"><span>Destinations:</span><span className="font-black text-gray-800">{quotationData.itinerary?.destinations}</span></div>
                            <div className="flex justify-between"><span>Duration:</span><span className="font-black text-gray-800">{quotationData.itinerary?.duration} N / {(parseInt(quotationData.itinerary?.duration) || 0) + 1} D</span></div>
                          </div>
                        </div>
                        <div className="p-6 bg-gray-900 text-white rounded-3xl shadow-xl shadow-gray-200 flex flex-col justify-center text-center">
                          <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">Package Investment</p>
                          <p className="text-4xl font-black">₹{quotationData.hotelOptions[selectedOption].reduce((sum, opt) => sum + (parseFloat(opt.price) || 0), 0).toLocaleString('en-IN')}</p>
                          <p className="text-xs text-white/60 mt-2 font-medium">Inclusive of all hotels & primary services</p>
                        </div>
                      </div>

                      {/* Hotel Timeline/Grid */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-black text-gray-800 flex items-center gap-2"><Briefcase className="w-5 h-5 text-blue-600" /> Accommodation Summary</h3>
                        {quotationData.hotelOptions[selectedOption].map((hotel, idx) => (
                          <div key={idx} className="p-5 bg-white border-2 border-gray-50 rounded-3xl flex flex-col md:flex-row gap-6 hover:border-blue-100 transition-colors group">
                            {hotel.image && <div className="w-full md:w-48 h-32 rounded-2xl overflow-hidden shadow-inner"><img src={hotel.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="Hotel" /></div>}
                            <div className="flex-1">
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="text-xl font-black text-gray-800">{hotel.hotelName}</h4>
                                <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black rounded-lg uppercase tracking-widest">Day {hotel.day}</span>
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-bold text-gray-500">
                                <div><p className="text-[8px] uppercase tracking-widest text-gray-400 mb-1">Room Category</p><p className="text-gray-700">{hotel.roomName}</p></div>
                                <div><p className="text-[8px] uppercase tracking-widest text-gray-400 mb-1">Meal Plan</p><p className="text-gray-700">{hotel.mealPlan}</p></div>
                                <div><p className="text-[8px] uppercase tracking-widest text-gray-400 mb-1">Category</p><p className="text-gray-700">{hotel.category} Star</p></div>
                                <div><p className="text-[8px] uppercase tracking-widest text-gray-400 mb-1">Costing</p><p className="text-blue-600">₹{parseFloat(hotel.price).toLocaleString('en-IN')}</p></div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* T&C etc */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-60">
                        {quotationData.itinerary?.terms_conditions && (
                          <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Terms & Conditions</p>
                            <div className="text-xs leading-relaxed whitespace-pre-wrap">{quotationData.itinerary.terms_conditions}</div>
                          </div>
                        )}
                        {quotationData.itinerary?.refund_policy && (
                          <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Refund Policy</p>
                            <div className="text-xs leading-relaxed whitespace-pre-wrap">{quotationData.itinerary.refund_policy}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </Dialog>



          {/* Payment Modal */}
          <Dialog visible={showPaymentModal} style={{ width: '450px' }} onHide={() => setShowPaymentModal(false)} showCloseIcon={false} header={() => (
            <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-800">Add Payment</h2>
              <button type="button" onClick={() => setShowPaymentModal(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"><X className="h-6 w-6" /></button>
            </div>
          )}>
            <form onSubmit={handleAddPayment} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount</label>
                <input type="number" step="0.01" required value={paymentFormData.amount} onChange={(e) => setPaymentFormData({ ...paymentFormData, amount: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="Enter amount" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <input type="date" value={paymentFormData.due_date} onChange={(e) => setPaymentFormData({ ...paymentFormData, due_date: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none" />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setShowPaymentModal(false)} className="px-4 py-2 text-gray-600">Cancel</button>
                <button type="submit" disabled={addingPayment} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold shadow-md">{addingPayment ? 'Adding...' : 'Add Payment'}</button>
              </div>
            </form>
          </Dialog>

          {/* Compose Email Modal */}
          <Dialog visible={showComposeModal} style={{ width: 'min(90vw, 700px)' }} onHide={() => { setShowComposeModal(false); setReplyThreadId(null); }} showCloseIcon={false} header={() => (
            <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50/50">
              <h2 className="text-lg font-semibold text-gray-800">{replyThreadId ? 'Reply to Mail' : 'Compose Mail'}</h2>
              <button onClick={() => setShowComposeModal(false)} className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"><X className="h-6 w-6" /></button>
            </div>
          )}>
            <form onSubmit={handleSendClientEmail} className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div className="font-bold text-gray-800">{lead?.client_name || 'Customer'}</div>
                <div className="text-sm text-gray-600">{emailFormData.to_email || lead?.email}</div>
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">Subject</label>
                <input type="text" value={emailFormData.subject} onChange={(e) => setEmailFormData({ ...emailFormData, subject: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-50/50 outline-none transition-all" required />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">Message Body</label>
                <textarea value={emailFormData.body} onChange={(e) => setEmailFormData({ ...emailFormData, body: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl min-h-[250px] outline-none focus:ring-4 focus:ring-blue-50/50 transition-all font-medium text-gray-700" required />
              </div>
              <div className="pt-4 flex justify-between items-center">
                <input type="file" onChange={(e) => setEmailAttachment(e.target.files[0] || null)} />
                <button type="submit" disabled={sendingClientEmail} className="px-8 py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 font-black shadow-xl shadow-blue-100 transition-all active:scale-95 disabled:opacity-50">
                  {sendingClientEmail ? 'Sending...' : 'Send Now'}
                </button>
              </div>
            </form>
          </Dialog>

          {/* Pax Details Modal */}
          <Dialog visible={showPaxModal} style={{ width: 'min(95vw, 650px)' }} onHide={() => setShowPaxModal(false)} showCloseIcon={false} header={() => (
            <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-lg font-black text-gray-800 uppercase tracking-tight">Travellers</h3>
              <button onClick={() => setShowPaxModal(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"><X className="h-6 w-6" /></button>
            </div>
          )}>
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              <div className="bg-indigo-600 text-white p-6 rounded-3xl mb-6 shadow-xl shadow-indigo-100 flex items-center gap-4 relative overflow-hidden">
                <Users className="w-10 h-10 text-white/50" />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-1">Guests List</p>
                  <p className="text-2xl font-black">{((lead?.adult || 0) + (lead?.child || 0) + (lead?.infant || 0))} Guests Total</p>
                </div>
              </div>
              <div className="space-y-4">
                {paxTempList.map((pax, index) => (
                  <div key={index} className="p-4 rounded-3xl bg-white border border-gray-100 shadow-sm space-y-4 group">
                    <span className="px-3 py-1 bg-gray-100 text-[10px] font-black text-gray-500 rounded-lg uppercase tracking-widest">Guest #{index + 1}</span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input type="text" value={pax.name || ''} onChange={(e) => handlePaxChange(index, 'name', e.target.value)} className="w-full border-gray-200 border rounded-xl px-4 py-3 text-sm outline-none" placeholder="Enter Full Name" />
                      <div className="flex gap-2">
                        <input type="number" value={pax.age || ''} onChange={(e) => handlePaxChange(index, 'age', e.target.value)} className="w-20 border-gray-200 border rounded-xl px-4 py-3 text-sm outline-none" placeholder="Age" />
                        <select value={pax.gender || ''} onChange={(e) => handlePaxChange(index, 'gender', e.target.value)} className="flex-1 border-gray-200 border rounded-xl px-4 py-3 text-sm outline-none">
                          <option value="">Status</option><option value="Male">Male</option><option value="Female">Female</option><option value="Child">Child</option><option value="Infant">Infant</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-6 border-t bg-gray-50/50 flex justify-end gap-3 rounded-b-3xl">
              <button onClick={() => setShowPaxModal(false)} className="px-6 py-2 text-gray-500 font-bold hover:text-gray-800 transition-colors">Dismiss</button>
              <button onClick={handleSavePaxDetails} disabled={savingPax} className="px-10 py-3 bg-gray-900 text-white rounded-2xl font-black text-sm shadow-xl shadow-gray-200 hover:scale-[1.05] active:scale-95 transition-all disabled:opacity-50">{savingPax ? 'SAVING...' : 'SAVE CHANGES'}</button>
            </div>
          </Dialog>

          {/* Edit Lead Modal */}
          <Dialog visible={showEditLeadModal} style={{ width: 'min(90vw, 550px)' }} onHide={() => setShowEditLeadModal(false)} showCloseIcon={false} header={() => (
            <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight">Lead Profile</h3>
              <button onClick={() => setShowEditLeadModal(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"><X className="h-6 w-6" /></button>
            </div>
          )}>
            <form onSubmit={handleSaveLead} className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="flex gap-3">
                  <select value={editLeadFormData.client_title} onChange={(e) => setEditLeadFormData({ ...editLeadFormData, client_title: e.target.value })} className="w-24 border border-gray-200 rounded-2xl px-4 py-3 bg-gray-50 font-bold text-gray-700 outline-none">
                    <option value="">Title</option><option value="Mr.">Mr.</option><option value="Mrs.">Mrs.</option><option value="Ms.">Ms.</option>
                  </select>
                  <input type="text" value={editLeadFormData.client_name} onChange={(e) => setEditLeadFormData({ ...editLeadFormData, client_name: e.target.value })} className="flex-1 border border-gray-200 rounded-2xl px-4 py-3 outline-none focus:ring-4 focus:ring-blue-50/50 font-bold" placeholder="Full Name" required />
                </div>
                <input type="email" value={editLeadFormData.email} onChange={(e) => setEditLeadFormData({ ...editLeadFormData, email: e.target.value })} className="w-full border border-gray-200 rounded-2xl px-4 py-3 outline-none focus:ring-4 focus:ring-blue-50/50" placeholder="Primary Email" />
                <input type="text" value={editLeadFormData.phone} onChange={(e) => setEditLeadFormData({ ...editLeadFormData, phone: e.target.value })} className="w-full border border-gray-200 rounded-2xl px-4 py-3 outline-none focus:ring-4 focus:ring-blue-50/50" placeholder="Primary Phone" />
              </div>
              <div className="flex justify-end pt-4 gap-3">
                <button type="button" onClick={() => setShowEditLeadModal(false)} className="px-6 text-gray-400 font-bold">Cancel</button>
                <button type="submit" disabled={savingLead} className="px-10 py-3 bg-blue-600 text-white rounded-2xl font-black shadow-xl shadow-blue-100 hover:scale-[1.05] active:scale-95 transition-all">{savingLead ? 'WRITING...' : 'COMMIT CHANGES'}</button>
              </div>
            </form>
          </Dialog>

          {/* Edit Query Modal */}
          <Dialog visible={showEditQueryModal} style={{ width: 'min(95vw, 750px)' }} onHide={() => setShowEditQueryModal(false)} showCloseIcon={false} header={() => (
            <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight">Edit Query Information</h3>
              <button onClick={() => setShowEditQueryModal(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"><X className="h-6 w-6" /></button>
            </div>
          )}>
            <form onSubmit={handleSaveQuery} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Destination</label>
                  <input type="text" value={editQueryFormData.destination} onChange={(e) => setEditQueryFormData({ ...editQueryFormData, destination: e.target.value })} className="w-full border border-gray-200 rounded-2xl px-4 py-3 outline-none focus:ring-4 focus:ring-blue-50/50 font-bold" placeholder="Enter destination" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Lead Source</label>
                  <select value={editQueryFormData.source} onChange={(e) => setEditQueryFormData({ ...editQueryFormData, source: e.target.value })} className="w-full border border-gray-200 rounded-2xl px-4 py-3 outline-none focus:ring-4 focus:ring-blue-50/50 font-bold">
                    <option value="">Select Source</option>
                    {leadSources.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">From Date</label>
                  <input type="date" value={editQueryFormData.travel_start_date} onChange={(e) => {
                    const newStartDate = e.target.value;
                    setEditQueryFormData(prev => ({
                      ...prev,
                      travel_start_date: newStartDate,
                      travel_end_date: prev.travel_end_date && prev.travel_end_date < newStartDate ? newStartDate : prev.travel_end_date
                    }));
                  }} className="w-full border border-gray-200 rounded-2xl px-4 py-3 outline-none focus:ring-4 focus:ring-blue-50/50 font-bold" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">To Date</label>
                  <input type="date" value={editQueryFormData.travel_end_date} min={editQueryFormData.travel_start_date} onChange={(e) => setEditQueryFormData({ ...editQueryFormData, travel_end_date: e.target.value })} className="w-full border border-gray-200 rounded-2xl px-4 py-3 outline-none focus:ring-4 focus:ring-blue-50/50 font-bold" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Services</label>
                  <input type="text" value={editQueryFormData.service} onChange={(e) => setEditQueryFormData({ ...editQueryFormData, service: e.target.value })} className="w-full border border-gray-200 rounded-2xl px-4 py-3 outline-none focus:ring-4 focus:ring-blue-50/50 font-bold" placeholder="e.g. Flight + Hotel" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Assign To</label>
                  <select value={editQueryFormData.assigned_to} onChange={(e) => setEditQueryFormData({ ...editQueryFormData, assigned_to: e.target.value })} className="w-full border border-gray-200 rounded-2xl px-4 py-3 outline-none focus:ring-4 focus:ring-blue-50/50 font-bold">
                    <option value="">Select User</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-3 gap-4 md:col-span-2">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Adult</label>
                    <input type="number" value={editQueryFormData.adult} onChange={(e) => setEditQueryFormData({ ...editQueryFormData, adult: e.target.value })} className="w-full border border-gray-200 rounded-2xl px-4 py-3 outline-none focus:ring-4 focus:ring-blue-50/50 font-bold" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Child</label>
                    <input type="number" value={editQueryFormData.child} onChange={(e) => setEditQueryFormData({ ...editQueryFormData, child: e.target.value })} className="w-full border border-gray-200 rounded-2xl px-4 py-3 outline-none focus:ring-4 focus:ring-blue-50/50 font-bold" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Infant</label>
                    <input type="number" value={editQueryFormData.infant} onChange={(e) => setEditQueryFormData({ ...editQueryFormData, infant: e.target.value })} className="w-full border border-gray-200 rounded-2xl px-4 py-3 outline-none focus:ring-4 focus:ring-blue-50/50 font-bold" />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Remark / Description</label>
                  <textarea value={editQueryFormData.remark} onChange={(e) => setEditQueryFormData({ ...editQueryFormData, remark: e.target.value })} className="w-full border border-gray-200 rounded-2xl px-4 py-3 outline-none focus:ring-4 focus:ring-blue-50/50 font-bold" rows={3} placeholder="Enter any additional details or requirements" />
                </div>
              </div>
              <div className="flex justify-end gap-3 items-center">
                <button type="button" onClick={() => setShowEditQueryModal(false)} className="px-6 text-gray-400 font-bold">Cancel</button>
                <button type="submit" disabled={savingQuery} className="px-12 py-4 bg-blue-600 text-white rounded-3xl font-black shadow-2xl shadow-blue-100 hover:scale-[1.05] active:scale-95 transition-all">{savingQuery ? 'SAVING...' : 'Save Changes'}</button>
              </div>
            </form>
          </Dialog>

          {/* WhatsApp Connection Warning Modal */}
          <Dialog visible={showWaConnectModal} style={{ width: '400px' }} onHide={() => setShowWaConnectModal(false)} showCloseIcon={false} header={() => (
            <div className="flex justify-between items-center p-4 border-b border-orange-100 bg-orange-50/50">
              <h3 className="text-sm font-black text-orange-600 uppercase tracking-widest">WhatsApp Notice</h3>
              <button onClick={() => setShowWaConnectModal(false)} className="p-2 text-orange-300 hover:text-orange-500"><X className="h-6 w-6" /></button>
            </div>
          )}>
            <div className="p-8 text-center space-y-6">
              <div className="mx-auto w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center ring-8 ring-orange-50"><Smartphone className="h-10 w-10 text-orange-600" /></div>
              <div><h2 className="text-xl font-black text-gray-800 mb-2">WhatsApp Offline</h2><p className="text-gray-500 font-medium">Please connect your device from the WhatsApp menu to enable messaging services.</p></div>
              <button onClick={() => setShowWaConnectModal(false)} className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black shadow-xl hover:bg-black transition-all">Okay</button>
            </div>
          </Dialog>

          {/* PDF Price Option Modal */}
          <Dialog visible={showPdfPriceOptionModal} style={{ width: '400px' }} onHide={() => setShowPdfPriceOptionModal(false)} showCloseIcon={false} header={() => (
            <div className="flex justify-between items-center p-4 border-b border-purple-100 bg-purple-50/50">
              <h3 className="text-sm font-black text-purple-600 uppercase tracking-widest">Document Export</h3>
              <button onClick={() => setShowPdfPriceOptionModal(false)} className="p-2 text-purple-300 hover:text-purple-500"><X className="h-6 w-6" /></button>
            </div>
          )}>
            <div className="p-8 text-center space-y-6">
              <div className="mx-auto w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center ring-8 ring-purple-50"><Download className="h-10 w-10 text-purple-600" /></div>
              <div><h2 className="text-xl font-black text-gray-800">Include Pricing?</h2><p className="text-gray-500 font-medium">Choose whether to reveal the final package cost in this PDF export.</p></div>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => { setShowPdfPriceOptionModal(false); handleDownloadSingleOptionPdf(pdfDownloadParams.optionNum, pdfDownloadParams.quotationDataOverride, pdfDownloadParams.itineraryIdForPricing, true); }} className="py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg shadow-blue-100 transition-all active:scale-95">WITH PRICE</button>
                <button onClick={() => { setShowPdfPriceOptionModal(false); handleDownloadSingleOptionPdf(pdfDownloadParams.optionNum, pdfDownloadParams.quotationDataOverride, pdfDownloadParams.itineraryIdForPricing, false); }} className="py-4 bg-white border-2 border-gray-100 text-gray-500 rounded-2xl font-black transition-all active:scale-95">WITHOUT</button>
              </div>
            </div>
          </Dialog>

        </>
      )}
    </div>
  );
};

export default LeadDetails;


