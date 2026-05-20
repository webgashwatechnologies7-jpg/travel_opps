import { useState, useEffect, useMemo, useCallback, useRef, memo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import { leadsAPI, usersAPI, followupsAPI, dayItinerariesAPI, packagesAPI, settingsAPI, suppliersAPI, hotelsAPI, paymentsAPI, googleMailAPI, whatsappAPI, whatsappWebAPI, queryDetailAPI, vouchersAPI, itineraryPricingAPI, leadInvoicesAPI, quotationsAPI, leadProposalsAPI, queryProposalsAPI, leadSourcesAPI, roomTypesAPI } from '../services/api';
import { searchPexelsPhotos } from '../services/pexels';
import { getDisplayImageUrl, rewriteHtmlImageUrls, sanitizeEmailHtmlForDisplay } from '../utils/imageUrl';
// Layout removed - handled by nested routing
import { useSettings } from '../contexts/SettingsContext';
import { ArrowLeft, Calendar, Mail, Plus, Upload, X, Search, FileText, FileText as PassportIcon, Printer, Send, MessageCircle, CheckCircle, CheckCircle2, Clock, Briefcase, MapPin, CalendarDays, Users, UserCheck, Leaf, Smartphone, Phone, MoreVertical, Download, Pencil, Trash2, Camera, RefreshCw, Reply, ChevronDown, Paperclip, Eye, Info, Gift, Heart, Building2, Image as ImageIcon, Plane, Bus, Train, UtensilsCrossed, Ship, User, Star, Car, Lock, Power, PhoneMissed, AlertCircle } from 'lucide-react';
import DetailRow from '../components/Quiries/DetailRow';
import html2pdf from 'html2pdf.js';
import { WhatsAppTab, MailsTab, FollowupsTab, BillingTab, HistoryTab, SuppCommTab, PostSalesTab, VoucherTab, DocsTab, InvoiceTab, CallsTab, ItineraryHistoryTab } from '../components/LeadTabs';
import { callsAPI } from '../services/api';
import LogoLoader from '../components/LogoLoader';
import { Dialog } from 'primereact/dialog';
import { 
  renderTemplate, 
  formatLeadId, 
  getTravelMonth, 
  formatTextForHTML, 
  generateAllPoliciesSection, 
  buildEmailHeader, 
  buildEmailFooter,
  extractBodyContent
} from '../utils/quotationTemplates';


const LeadDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const userRoles = useMemo(() => user?.roles?.map(r => typeof r === 'string' ? r : r.name) || [], [user]);
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
  const [showUnlockRequestModal, setShowUnlockRequestModal] = useState(false);
  const [showUnlockHandleModal, setShowUnlockHandleModal] = useState(false);
  const [unlockReason, setUnlockReason] = useState('');
  const [isSubmittingUnlock, setIsSubmittingUnlock] = useState(false);
  
  // Follow-up Completion State
  const [showFollowupCompleteModal, setShowFollowupCompleteModal] = useState(false);
  const [completingFollowup, setCompletingFollowup] = useState(null);
  const [followupCompletionData, setFollowupCompletionData] = useState({
    remark: '',
    scheduleNext: false,
    nextDate: '',
    nextTime: '13:00'
  });
  const [isCompletingFollowup, setIsCompletingFollowup] = useState(false);

  const isAdminOrManager = useMemo(() => {
    if (!user) return false;
    // Explicit bypass permission per user request
    if (user.permissions?.includes('leads_management.bypass_lock')) return true;

    return user.is_super_admin || user.roles?.some(r => {
      const roleName = typeof r === 'string' ? r : r.name;
      return ['Company Admin', 'Super Admin', 'Admin', 'Manager'].includes(roleName);
    });
  }, [user]);

  const isLeadLocked = useMemo(() => {
    if (!lead) return false;
    
    // Only Super Admin or users with explicit bypass permission are never locked out
    if (user?.is_super_admin || user?.permissions?.includes('leads_management.bypass_lock')) return false;

    // System lock field from DB
    if (lead.is_locked && !lead.is_unlocked_for_edit) return true;

    // Status-based lock: Booked (confirmed) or Declined (cancelled) queries are locked
    const leadStatus = lead.status?.toLowerCase();
    if ((leadStatus === 'confirmed' || leadStatus === 'cancelled') && !lead.is_unlocked_for_edit) {
      return true;
    }

    return false;
  }, [lead, isAdminOrManager]);

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
    due_date: '',
    receipt: null
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
  const [isBodyManuallyEdited, setIsBodyManuallyEdited] = useState(false);
  const [selectedProposalItineraryId, setSelectedProposalItineraryId] = useState(null);

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
  // Hotel Manager Modal
  const [showHotelManagerModal, setShowHotelManagerModal] = useState(false);
  const [hotelManagerData, setHotelManagerData] = useState([]); // [{dayNum, itineraryId, eventIndex, optIndex, hotelName, checkIn, checkOut, roomType, category, mealPlan}]
  const [savingHotelManager, setSavingHotelManager] = useState(false);
  const [loadingHotelManager, setLoadingHotelManager] = useState(false);
  const [roomTypes, setRoomTypes] = useState([]);
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
  const isInsertingRef = useRef(false);

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
    checkConnectionStatus();
  }, [id]);

  // Set default selected itinerary if none selected
  useEffect(() => {
    if (visibleProposals.length > 0 && !selectedProposalItineraryId) {
      setSelectedProposalItineraryId(visibleProposals[0].itinerary_id || 'unknown');
    }
  }, [visibleProposals, selectedProposalItineraryId]);

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


  // Update companySettings from context settings
  useEffect(() => {
    if (settings) {
      setCompanySettings(settings);
    }
  }, [settings]);

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
  const loadHotelsFromAllProposals = useCallback(async () => {
    const rawHotelsList = [];
    await Promise.all(proposals.map(async (proposal) => {
      const itineraryId = proposal.itinerary_id;
      const optionNum = proposal.optionNumber ?? 1;
      if (!itineraryId) return;
      try {
        const isProposalRecord = !!proposal.lead_id;
        const response = isProposalRecord
          ? await leadProposalsAPI.get(itineraryId)
          : await packagesAPI.get(itineraryId);
        const dayEvents = response?.data?.data?.day_events;

        if (!dayEvents) return;

        Object.keys(dayEvents).sort((a, b) => parseInt(a) - parseInt(b)).forEach((day) => {
          const events = dayEvents[day] || [];
          events.forEach((event) => {
            if (event.eventType !== 'accommodation' || !event.hotelOptions) return;
            event.hotelOptions.forEach((opt) => {
              if (opt.optionNumber === optionNum) {
                rawHotelsList.push({
                  ...opt,
                  hotel_id: opt.hotel_id ?? opt.hotelId ?? opt.id,
                  hotelName: opt.hotelName || event.subject || 'Hotel',
                  roomName: opt.roomName || opt.room_type || '',
                  mealPlan: opt.mealPlan || opt.meal_plan || '',
                  day: parseInt(day, 10),
                  price: opt.price || '',
                  status: opt.status || 'Pending'
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
      const uniqueHotelIds = [...new Set(uniqueRaw.map(h => h.hotel_id).filter(Boolean))];
      const hotelDataMap = {};

      const MAX_CONCURRENT = 5;
      for (let i = 0; i < uniqueHotelIds.length; i += MAX_CONCURRENT) {
        const chunk = uniqueHotelIds.slice(i, i + MAX_CONCURRENT);
        await Promise.all(chunk.map(async (hid) => {
          if (hotelDataMap[hid]) return;
          try {
            const res = await hotelsAPI.get(hid);
            if (res?.data?.data) {
              hotelDataMap[hid] = res.data.data;
            }
          } catch (e) {
            console.warn(`Failed to fetch hotel ${hid}`, e);
          }
        }));
      }

      const hotelsData = uniqueRaw.map((hotel, index) => {
        const hotelId = hotel.hotel_id;
        const hInfo = hotelDataMap[hotelId] || {};
        return {
          ...hotel,
          id: `${hotelId}_${hotel.day}_${index}`,
          company_name: hInfo.company_name || hotel.hotelName || hInfo.name,
          email: hInfo.email || '',
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
  }, [proposals]);

  useEffect(() => {
    loadHotelsFromAllProposals();
  }, [loadHotelsFromAllProposals]);

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
        hotelOptions: hotelOptions,
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
        // 1. Fetch from the new lead_proposals table
        const serverRes = await leadProposalsAPI.list({ lead_id: id });
        const serverData = serverRes?.data?.data || [];

        let list = [];
        if (serverData.length > 0) {
          // Map the separate table records into the frontend proposal format
          list = serverData.map(p => ({
            ...p,
            itinerary_id: p.id, // In the UI, the proposal ID acts as the itinerary ID for building/pricing
            master_id: p.original_package_id,
            confirmed: p.is_confirmed || false
          }));
        } else {
          // One-time legacy migration from query_proposals to lead_proposals if needed
          // (Simplified for now: just look at the old server data)
          const oldServerRes = await queryProposalsAPI.list(id);
          const oldServerData = oldServerRes?.data?.data || [];
          if (oldServerData.length > 0) {
            // ... migration logic if needed ...
          }
        }
        // One-time legacy migration: move old browser-only proposals to DB
        const legacyKey = `lead_${id}_proposals`;
        const migrationFlag = `lead_${id}_legacy_migrated_v1`;
        const legacyRaw = localStorage.getItem(legacyKey);
        const alreadyMigrated = localStorage.getItem(migrationFlag) === '1';

        if (list.length > 0 && !alreadyMigrated) {
          localStorage.setItem(migrationFlag, '1');
        } else if (!alreadyMigrated && legacyRaw) {
          try {
            const legacyList = JSON.parse(legacyRaw);
            if (Array.isArray(legacyList) && legacyList.length > 0) {
              await queryProposalsAPI.sync(id, legacyList);
              if (list.length === 0) {
                list = legacyList;
              }
              localStorage.setItem(migrationFlag, '1');
              toast.success('Legacy proposal data migrated to server.');
            }
          } catch (migrationErr) {
            console.warn('Legacy proposal migration failed:', migrationErr);
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
          // In the lead context, uniqueItineraryIds are always proposal IDs
          const [pkgRes] = await Promise.all([
            leadProposalsAPI.get(tid)
          ]);
          if (pkgRes.data.data) {
            packageMap[tid] = pkgRes.data.data;
            // Pricing is embedded in the proposal record
            pricingMap[tid] = pkgRes.data.data;
          }
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
            // Fallback to the first record of this itinerary if optionNumber is not explicitly set on the DB record
            const existing = existingOfThisTid.find(x => x.optionNumber === optNum) || (existingOfThisTid.length === 1 ? existingOfThisTid[0] : null);

            let price = opt.price ?? 0;

            if (existing) {
              // ALWAYS use the price that was saved in the lead's proposal record if it exists
              price = existing.price ?? opt.price ?? 0;
            } else {
              // Not confirmed, so we can fetch the latest price from master
              const serverPrice = getPriceFromFinalPrices(pricingMap[tid]?.final_client_prices, optNum);
              price = serverPrice !== null ? serverPrice : (opt.price ?? 0);
            }

            result.push({
              ...opt,
              itinerary_id: tid,
              id: (existing?.id) || opt.id || Date.now() + i + tid,
              itinerary_name: opt.itinerary_name || pkgData.itinerary_name || pkgData.title || p.itinerary_name || p.title,
              destination: opt.destination || pkgData.destinations || pkgData.destination || p.destination,
              routing: opt.routing || pkgData.routing || p.routing || '',
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

// Save proposals (Modified to handle separate table records)
const saveProposals = async (newProposals) => {
  try {
    setProposals(newProposals);
    // Since we now use a separate table, we don't 'sync' a JSON blob anymore.
    // Individual updates are handled by handleSelectItinerary or the Builder.
    // But for bulk removal, we use this:
    if (newProposals.length === 0) {
      const res = await leadProposalsAPI.list({ lead_id: id });
      const ids = (res.data.data || []).map(p => p.id);
      await Promise.all(ids.map(pid => leadProposalsAPI.delete(pid)));
    }
    fetchLeadDetails();
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
    const res = await leadProposalsAPI.history(id);
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
        // IMPROVED: Since we use lead_proposals for all active options, 
        // we fetch directly from the proposal record which contains the latest pricing.
        const res = await leadProposalsAPI.get(tid);
        const data = res?.data?.data;
        const fp = data?.final_client_prices;
        if (fp && typeof fp === 'object' && !Array.isArray(fp)) {
          priceMapByItinerary[tid] = fp;
        } else if (data?.price) {
          // Fallback to the single price column if final_client_prices is missing
          priceMapByItinerary[tid] = { "1": data.price };
        }
      } catch (e) {
        console.warn('Pricing Refresh API failed for itinerary', tid, e?.response?.status, e?.message);
        // Fallback to legacy pricing table if leadProposalsAPI fails (unlikely)
        try {
          const res = await itineraryPricingAPI.get(tid, id);
          const data = res?.data?.data;
          const fp = data?.final_client_prices;
          if (fp && typeof fp === 'object' && !Array.isArray(fp)) priceMapByItinerary[tid] = fp;
        } catch (_) {}
      }
    }
    let anyUpdated = false;
    const updated = proposals.map((opt) => {
      // LOCK PRICE FOR CONFIRMED OPTIONS
      if (opt.confirmed) return opt;

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
    // Note: saveProposals([]) handles deletions, here we just update state
    if (anyUpdated) {
      showToastNotification('success', 'Prices Refreshed', 'Prices have been updated successfully.');
    } else {
      showToastNotification('info', 'Up to Date', 'Prices are already up to date.');
    }
  } catch (err) {
    console.error('Failed to refresh proposal prices:', err);
    showToastNotification('error', 'Error', 'Failed to refresh prices. Please try again.');
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
      const confirmRes = await leadProposalsAPI.confirm(optionId);

      // Update local lead status
      if (confirmRes?.data?.success) {
        // Also call the old confirmOption to update lead status/logs if needed, 
        // but leadProposalsAPI.confirm already did the cleanup.
        await leadsAPI.confirmOption(id, {
          option_number: optionNumber,
          total_amount: totalAmount,
          itinerary_name: itineraryName,
        });
      }
    } catch (err) {
      console.error('Confirm option API failed:', err);
      const serverError = err.response?.data?.message || 'Server error';
      showToastNotification('error', 'Booking Failed', serverError);
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

const handleVoucherPreview = async (proposalId = null) => {
  if (!id) return;
  setVoucherActionLoading(proposalId ? `preview-${proposalId}` : 'preview');
  try {
    const params = proposalId ? { proposal_id: proposalId } : {};
    const res = await vouchersAPI.preview(id, params);
    const blob = res.data;
    const html = await blob.text();

    // Check if the response is actually JSON error (happens if preview fails)
    if (html.startsWith('{') && html.includes('"success":false')) {
      const errData = JSON.parse(html);
      throw new Error(errData.message || 'Failed to load preview');
    }

    setVoucherPopupHtml(html);
    setShowVoucherPopup(true);
  } catch (err) {
    console.error('Voucher preview failed:', err);
    showToastNotification('error', 'Preview Failed', err.message || 'Voucher preview could not be loaded. Please ensure you have a quotation first.');
  } finally {
    setVoucherActionLoading(null);
  }
};

const handleVoucherDownload = async (proposalId = null) => {
  if (!id) return;
  setVoucherActionLoading(proposalId ? `download-${proposalId}` : 'download');
  try {
    const params = proposalId ? { proposal_id: proposalId } : {};
    const res = await vouchersAPI.download(id, params);
    const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href = url;
    const pId = proposalId ? `_P${proposalId}` : '';
    link.setAttribute('download', `Voucher-${formatLeadId(id)}${pId}_${new Date().toISOString().split('T')[0]}.pdf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    showToastNotification('success', 'PDF Downloaded', 'Voucher PDF downloaded successfully.');
  } catch (err) {
    console.error('Voucher download failed:', err);
    showToastNotification('error', 'Download Failed', 'Voucher PDF download failed. Please ensure an option is confirmed or quotation exists.');
  } finally {
    setVoucherActionLoading(null);
  }
};

const handleVoucherSend = async (proposalId = null) => {
  if (!id || !lead) return;

  const toEmail = lead?.email || '';
  const toPhone = lead?.phone || '';

  if (!toEmail && !toPhone) {
    showToastNotification('warning', 'Missing Contact', 'Client has no email or phone number saved.');
    return;
  }

  if (!window.confirm(`Send Confirmation Voucher to client via ${toEmail ? 'Email' : ''}${toEmail && toPhone ? ' and ' : ''}${toPhone ? 'WhatsApp' : ''}?`)) {
    return;
  }

  setVoucherActionLoading(proposalId ? `send-${proposalId}` : 'send');
  try {
    // Send via backend - handles both email and WhatsApp PDF generation server-side
    await vouchersAPI.send(id, {
      to_email: toEmail || undefined,
      subject: `Confirmation Voucher - Query #${formatLeadId(id)} - ${settings?.company_name || 'Your Company'}`,
      proposal_id: proposalId || undefined,
      send_whatsapp: !!(toPhone && waStatus === 'Connected'),
      phone: toPhone || undefined,
    });

    showToastNotification('success', 'Sent', 'Voucher sent successfully via ' +
      (toEmail && toPhone && waStatus === 'Connected' ? 'Email & WhatsApp' :
        toEmail ? 'Email' : 'WhatsApp'));

  } catch (err) {
    console.error('Voucher send failed:', err);
    const msg = err.response?.data?.message || err.message || 'Unknown error';
    showToastNotification('error', 'Send Failed', 'Issue: ' + msg);
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
        subject: `Proforma Invoice - ${inv.invoice_number} - ${settings?.company_name || 'Your Company'}`
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

      // Get account details from settings
      const accountDetailsStr = settings?.account_details;
      let accountDetails = null;
      try {
        if (accountDetailsStr) {
          accountDetails = typeof accountDetailsStr === 'string' ? JSON.parse(accountDetailsStr) : accountDetailsStr;
        }
      } catch (e) { console.error('Failed to parse account details', e); }

      if (accountDetails) {
        waMsg += `\n*OFFICIAL PAYMENT DETAILS:*\n`;
        waMsg += `Bank: ${accountDetails.bank_name || 'N/A'}\n`;
        waMsg += `Acc No: ${accountDetails.account_number || 'N/A'}\n`;
        waMsg += `IFSC: ${accountDetails.ifsc_code || 'N/A'}\n`;
        waMsg += `Holder: ${accountDetails.account_holder_name || 'N/A'}\n`;
        if (accountDetails.upi_id) waMsg += `UPI ID: ${accountDetails.upi_id}\n`;
      }

      waMsg += `\n*PLEASE SHARE A SCREENSHOT OF THE PAYMENT RECEIPT AFTER TRANSFER.*\n\n`;
      waMsg += `Best regards,\n${companySettings?.company_name || 'Our Company'} Team`;

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

const handleInvoiceDelete = async (invoiceId) => {
  if (!id || !invoiceId) return;
  if (!window.confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) {
    return;
  }

  setInvoiceActionLoading('delete');
  try {
    await leadInvoicesAPI.delete(id, invoiceId);
    showToastNotification('success', 'Invoice Deleted', 'Invoice has been removed successfully.');
    fetchQueryDetail(); // Refresh the list
  } catch (err) {
    console.error('Invoice delete failed:', err);
    const msg = err.response?.data?.message || err.message || 'Unknown error';
    showToastNotification('error', 'Delete Failed', 'Issue: ' + msg);
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
    const welcomeMsg = `Dear ${lead.client_name || 'Customer'},\n\nThis is a friendly reminder that a payment toward your travel booking is due today or in the next few days.\n\n*Payment Summary:*\n• Total Amount: ₹${amount}\n• Balance Due: *₹${dueAmount}*\n• Due Date: ${dueDate}\n\n*Bank Details:*\n${bankDetails}\n\nKindly share the screenshot of the transaction once the payment is made.\n\nBest regards,\n${companySettings?.company_name || 'Our Company'} Team`;

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
    ${buildEmailFooter(companySettings, _ftrBg, '#333333')}
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
  whatsappMsg += `\n\nThis is your confirmed itinerary. Best regards,\n${companySettings?.company_name || settings?.company_name || 'Your Company'} Team`;

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
    ${buildEmailHeader(companySettings, _hdrBgConfirmed, '#ffffff')}
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
    ${buildEmailFooter(companySettings, _ftrBgConfirmed, '#333')}
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
    // IMPORTANT: Only do this if lead is actually 'new' and NOT confirmed/proposal sent
    if (leadData && leadData.id && leadData.status?.toLowerCase() === 'new') {
      try {
        // Perform the update synchronously before setting the lead state
        await leadsAPI.updateStatus(leadData.id, 'processing');
        // Update the local data object to reflect the change immediately
        leadData.status = 'processing';
        console.log("Auto transitioned lead to Under Process");
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
    const formData = new FormData();
    formData.append('lead_id', id);
    formData.append('amount', amount);
    formData.append('paid_amount', paidAmount);
    if (paymentFormData.due_date) formData.append('due_date', paymentFormData.due_date);
    if (paymentFormData.receipt) formData.append('receipt', paymentFormData.receipt);

    const response = await paymentsAPI.create(formData);

    if (response.data.success) {
      showToastNotification('success', 'Payment Added', 'Payment added successfully!');
      setShowPaymentModal(false);
      setPaymentFormData({ amount: '', paid_amount: '', due_date: '', receipt: null });
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
const generateEmailBody = (secHotels = null) => {
  const confirmedOption = getConfirmedOption();
  if (!lead) return 'Dear Sir,\nKindly provide the best rates for below enquiry at the earliest';

  let body = 'Dear Sir,\nKindly provide the best rates for below enquiry at the earliest\n\n';

  // Use hotelsFromConfirmedOption which is already populated and can be filtered by selection
  const selectedHotelList = hotelsFromConfirmedOption.filter(h => {
    if (!secHotels) return true;
    return secHotels.includes(h.id);
  });

  let checkIn = lead.travel_start_date ? formatDateForDisplay(lead.travel_start_date) : 'N/A';
  let checkOut = lead.travel_end_date ? formatDateForDisplay(lead.travel_end_date) : 'N/A';

  // If exactly one hotel is selected, use ITS specific dates for the Enquiry Details section
  if (selectedHotelList.length === 1) {
    const sh = selectedHotelList[0];
    if (sh.checkIn) checkIn = formatDateForDisplay(sh.checkIn);
    if (sh.checkOut) checkOut = formatDateForDisplay(sh.checkOut);
  }

  // Calculate nights
  let nights = 'N/A';
  const startD = (selectedHotelList.length === 1 && selectedHotelList[0].checkIn) ? new Date(selectedHotelList[0].checkIn) : (lead.travel_start_date ? new Date(lead.travel_start_date) : null);
  const endD = (selectedHotelList.length === 1 && selectedHotelList[0].checkOut) ? new Date(selectedHotelList[0].checkOut) : (lead.travel_end_date ? new Date(lead.travel_end_date) : null);

  if (startD && endD) {
    const diffTime = Math.abs(endD - startD);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    nights = diffDays.toString();
  }

  body += 'Enquiry Details:\n';
  body += `Customer Name: ${lead.client_title || 'Mr.'} ${lead.client_name}\n`;
  body += `Enquiry ID: ${lead.query_id || lead.id || id}\n`;
  body += `Enquiry For: ${confirmedOption?.itinerary_name || 'Full package'}\n`;
  body += `Check-In: ${checkIn}\n`;
  body += `Check-Out: ${checkOut}\n`;
  body += `Nights: ${nights}\n`;
  body += `Pax: Adult: ${lead.adult || 1} - Child: ${lead.child || 0} - Infant: ${lead.infant || 0}\n\n`;

  if (selectedHotelList.length > 0) {
    body += 'Hotel Requirements:\n';
    selectedHotelList.forEach((hotel, index) => {
      body += `${index + 1}. ${hotel.hotelName || hotel.hotel_name || 'Hotel'} (${hotel.checkIn ? formatDateForDisplay(hotel.checkIn) : 'N/A'} to ${hotel.checkOut ? formatDateForDisplay(hotel.checkOut) : 'N/A'})\n`;
      body += `   Room: ${hotel.roomName || hotel.room_type || 'Room'} x ${hotel.roomCount || hotel.rooms || 1}\n`;
      body += `   Meal Plan: ${hotel.mealPlan || hotel.meal_plan || 'Meal Plan'}\n`;
      if (hotel.price) {
        body += `   Price: ${hotel.price}\n`;
      }
      body += '\n';
    });
  }

  return body;
};

const handleSupplierEmailBodyChange = (newBody) => {
  setIsBodyManuallyEdited(true);
  setSupplierEmailForm(prev => ({ ...prev, body: newBody }));
};

// Keep email body in sync with selection until manual edit
useEffect(() => {
  if (!isBodyManuallyEdited && activeTab === 'suppliers') {
    setSupplierEmailForm(prev => ({
      ...prev,
      body: generateEmailBody(selectedHotels)
    }));
  }
}, [selectedHotels, activeTab, isBodyManuallyEdited]);

const resetSupplierEmailBody = () => {
  setIsBodyManuallyEdited(false);
  setSupplierEmailForm(prev => ({
    ...prev,
    body: generateEmailBody(selectedHotels)
  }));
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
  // Valid selected items
  const hotelsWithEmail = hotelsFromConfirmedOption.filter(h =>
    selectedHotels.includes(h.id) && h.email && h.email.trim() !== ''
  );

  if (selectedSuppliers.length === 0 && hotelsWithEmail.length === 0) {
    showToastNotification('warning', 'Selection Required', 'Please select at least one supplier or hotel with valid email');
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

    const sendRequests = [];

    // 1. GENERAL SUPPLIERS (Full Summary)
    if (selectedSuppliers.length > 0) {
      sendRequests.push(suppliersAPI.sendEmail({
        supplier_ids: selectedSuppliers,
        hotel_emails: [],
        subject: supplierEmailForm.subject,
        cc_email: supplierEmailForm.cc_email,
        body: supplierEmailForm.body,
        enquiry_details: enquiryDetails,
        lead_id: parseInt(id)
      }).then(res => ({ type: 'suppliers', res: res.data })));
    }

    // 2. INDIVIDUAL HOTELS (Private Emails)
    hotelsWithEmail.forEach(hotel => {
      const privateBody = generateEmailBody([hotel.id]);
      sendRequests.push(suppliersAPI.sendEmail({
        supplier_ids: [],
        hotel_emails: [{
          email: hotel.email.trim(),
          name: hotel.company_name,
          hotel_name: hotel.hotel_name,
          room_type: hotel.room_type,
          meal_plan: hotel.meal_plan
        }],
        subject: supplierEmailForm.subject,
        cc_email: supplierEmailForm.cc_email,
        body: privateBody,
        enquiry_details: {
          ...enquiryDetails,
          check_in: hotel.checkIn ? formatDateForDisplay(hotel.checkIn) : enquiryDetails.check_in,
          check_out: hotel.checkOut ? formatDateForDisplay(hotel.checkOut) : enquiryDetails.check_out,
          nights: (hotel.checkIn && hotel.checkOut) ?
            Math.ceil(Math.abs(new Date(hotel.checkOut) - new Date(hotel.checkIn)) / (1000 * 60 * 60 * 24)).toString() : enquiryDetails.nights
        },
        lead_id: parseInt(id)
      }).then(res => ({ type: 'hotel', hotel: hotel.company_name, res: res.data })));
    });

    // Wait for all individual sending requests to settle
    const results = await Promise.allSettled(sendRequests);

    let totalSent = 0;
    let totalFailed = 0;

    results.forEach(result => {
      if (result.status === 'fulfilled' && result.value.res.success) {
        totalSent += (result.value.res.data?.sent_count || 1);
      } else {
        totalFailed++;
      }
    });

    if (totalSent > 0) {
      showToastNotification('success', 'Email Status', `Successfully sent ${totalSent} email(s).`);

      // Reset form and selections after success
      setSupplierEmailForm({
        subject: supplierEmailForm.subject,
        cc_email: '',
        body: generateEmailBody()
      });
      setSelectedSuppliers([]);
      setSelectedHotels([]);
      setSelectAllSuppliers(false);
      setSelectAllHotels(false);
      setIsBodyManuallyEdited(false);

      // Mark as 'Inquiry Sent' in background
      const itId = confirmedOption?.itinerary_id;
      if (itId && hotelsWithEmail.length > 0) {
        (async () => {
          try {
            const pkgRes = await leadProposalsAPI.get(itId);
            const dayEvts = pkgRes?.data?.data?.day_events || {};
            const updatedEvts = JSON.parse(JSON.stringify(dayEvts));
            let changed = false;

            hotelsWithEmail.forEach(h => {
              const day = h.day.toString();
              if (updatedEvts[day]) {
                updatedEvts[day].forEach(evt => {
                  if (evt.eventType === 'accommodation' && evt.hotelOptions) {
                    evt.hotelOptions.forEach(opt => {
                      if ((opt.hotel_id ?? opt.hotelId ?? opt.id) == h.hotel_id) {
                        opt.status = 'Inquiry Sent';
                        changed = true;
                      }
                    });
                  }
                });
              }
            });

            if (changed) {
              await leadProposalsAPI.update(itId, { day_events: updatedEvts });
              loadHotelsFromAllProposals();
            }
          } catch (e) { console.error('Failed to update status', e); }
        })();
      }
    }

    if (totalFailed > 0) {
      showToastNotification('warning', 'Notice', `${totalFailed} request(s) failed.`);
    }

  } catch (error) {
    console.error('Send process failed', error);
    showToastNotification('error', 'Critical Error', 'Failed to execute bulk email dispatch.');
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

const handleSaveLeadDetails = async (e) => {
  e.preventDefault();
  if (isLeadLocked) {
    showToastNotification('error', 'Lead Locked', 'This booking is locked. Modification is not allowed.');
    return;
  }
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
  if (isLeadLocked) {
    showToastNotification('error', 'Lead Locked', 'This query is locked. Modification is not allowed.');
    return;
  }
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
      // Auto-transition: Update status to 'followup' when a followup is added
      // Only update if current status is 'new', 'processing' or 'proposal'
      if (['new', 'processing', 'proposal'].includes(lead?.status)) {
        try {
          await leadsAPI.updateStatus(id, 'followup');
        } catch (statusErr) {
          console.error('Failed to auto-update status to followup:', statusErr);
        }
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

const handleCompleteFollowupSubmit = async (e) => {
  if (e) e.preventDefault();
  if (!followupCompletionData.remark.trim()) {
    showToastNotification('warning', 'Remark Required', 'Please enter what the client said.');
    return;
  }
  
  if (followupCompletionData.scheduleNext && !followupCompletionData.nextDate) {
    showToastNotification('warning', 'Next Date Required', 'Please select a date for the next follow-up.');
    return;
  }

  setIsCompletingFollowup(true);
  try {
    // 1. Complete the current followup with the remark
    await followupsAPI.complete(completingFollowup.id, { 
        remark: followupCompletionData.remark 
    });

    // 2. Schedule next followup if requested
    if (followupCompletionData.scheduleNext) {
        let dateInApiFormat = followupCompletionData.nextDate;
        const parts = followupCompletionData.nextDate.split('-');
        if (parts.length === 3 && parts[0].length === 2) {
            dateInApiFormat = `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
        
        const timeIn24Hour = followupCompletionData.nextTime ? convertTo24Hour(followupCompletionData.nextTime) : null;
        
        await followupsAPI.create({
            lead_id: parseInt(id),
            remark: `Scheduled after previous followup: ${followupCompletionData.remark}`,
            reminder_date: dateInApiFormat,
            reminder_time: timeIn24Hour
        });
        
        showToastNotification('success', 'Follow-up Handled', 'Current task completed and next one scheduled.');
    } else {
        showToastNotification('success', 'Follow-up Completed', 'Task has been marked as completed.');
    }

    setShowFollowupCompleteModal(false);
    setCompletingFollowup(null);
    setFollowupCompletionData({ remark: '', scheduleNext: false, nextDate: '', nextTime: '13:00' });
    
    // Auto-transition: Update status to 'followup' if current status is 'new', 'processing' or 'proposal'
    if (['new', 'processing', 'proposal'].includes(lead?.status)) {
        try {
            await leadsAPI.updateStatus(id, 'followup');
        } catch (statusErr) {
            console.error('Failed to auto-update status to followup:', statusErr);
        }
    }

    await fetchLeadDetails();
  } catch (err) {
    console.error('Failed to complete followup:', err);
    showToastNotification('error', 'Error', err.response?.data?.message || 'Failed to process follow-up');
  } finally {
    setIsCompletingFollowup(false);
  }
};

const handleCreateItinerary = () => {

  setItineraryFormData({
    itinerary_name: '',
    destinations: lead?.destination || '',
    duration: (lead?.travel_start_date && lead?.travel_end_date) 
      ? (Math.ceil(Math.abs(new Date(lead.travel_end_date) - new Date(lead.travel_start_date)) / (1000 * 60 * 60 * 24)) + 1).toString()
      : '',
    start_date: lead?.travel_start_date ? new Date(lead.travel_start_date).toISOString().split('T')[0] : '',
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
    // REMOVED: formData.append('lead_id', id); - We create it as a Template first, 
    // then handleSelectItinerary will handle the clone/insertion flow.

    if (itineraryFormData.image && itineraryFormData.image.file) {
      formData.append('image', itineraryFormData.image.file);
    } else if (itineraryFormData.image && itineraryFormData.image.libraryPath) {
      formData.append('library_image', itineraryFormData.image.libraryPath);
    }

    const res = await packagesAPI.create(formData);
    const newPkg = res.data.data;

    showToastNotification('success', 'Itinerary Created', 'Itinerary has been created successfully!');
    setShowAddItineraryModal(false);

    // ── NEW: Automatically select/insert this itinerary into the current lead's proposals ──
    // This ensures it appears in the "Active Itinerary" tab immediately.
    let proposalId = newPkg.id;
    if (newPkg) {
      proposalId = await handleSelectItinerary(newPkg);
    }

    // Open builder in new tab as requested
    const builderUrl = `/itineraries/${proposalId}?fromLead=${id}&type=proposal`;
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
// Fetches ALL packages (templates + lead-specific proposals) so nothing is missed
useEffect(() => {
  if (!showInsertItineraryModal) {
    // Reset when modal closes so fresh data is fetched on next open
    setDayItineraries([]);
    return;
  }
  setLoadingItineraries(true);
  // Fetch all packages — includes templates AND lead-specific proposals
  packagesAPI.list({ per_page: 500 }).then((res) => {
    const data = res.data.data || [];
    // Sort by ID DESC (Latest first)
    setDayItineraries(data.sort((a, b) => b.id - a.id));
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
  if (isInsertingRef.current) return;
  isInsertingRef.current = true;

  try {
    let tid = itinerary.id;
    let itineraryName = itinerary.title || itinerary.itinerary_name || 'Untitled Itinerary';

    setLoadingItineraries(true);
    let fullPackage = null;
    let pricingDataFromServer = null;

    try {
      // 1. Create a record in the lead_proposals table from the template
      // This ensures isolation and moves the working copy to the separate table
      let createResSuccess = false;
      let createResData = null;
      if (!itinerary.lead_id || String(itinerary.lead_id) !== String(id)) {
        const createRes = await leadProposalsAPI.create({ package_id: tid, lead_id: id });
        if (createRes.data?.success && createRes.data?.data?.id) {
          tid = createRes.data.data.id;
          createResData = createRes.data.data;
          createResSuccess = true;
        }
      }



      // 2. Fetch FULL package details from the newly created clone
      // We use leadProposalsAPI for clones and packagesAPI for templates
      const isClone = !!(itinerary.lead_id || createResSuccess);
      let pkgRes, prRes;
      
      if (isClone) {
        // First try to use the data returned by createRes if available
        if (createResSuccess && createResData) {
          fullPackage = createResData;
          pricingDataFromServer = fullPackage;
        } else {
          pkgRes = await leadProposalsAPI.get(tid);
          fullPackage = pkgRes.data.data;
          pricingDataFromServer = fullPackage;
        }
      } else {
        [pkgRes, prRes] = await Promise.all([
          packagesAPI.get(tid),
          itineraryPricingAPI.get(tid, id)
        ]);
        fullPackage = pkgRes.data.data;
        pricingDataFromServer = prRes.data.data;
      }

      // Final fallback: if still no day_events/inclusions, try fetching from the master package template
      if (fullPackage && (!fullPackage.day_events || Object.keys(fullPackage.day_events).length === 0)) {
        const masterId = fullPackage.original_package_id || itinerary.id;
        if (masterId) {
          const masterRes = await packagesAPI.get(masterId);
          if (masterRes.data?.success) {
            const masterPkg = masterRes.data.data;
            fullPackage = {
              ...fullPackage,
              day_events: fullPackage.day_events || masterPkg.day_events,
              inclusions: fullPackage.inclusions || masterPkg.inclusions,
              exclusions: fullPackage.exclusions || masterPkg.exclusions,
              terms_conditions: fullPackage.terms_conditions || masterPkg.terms_conditions,
              refund_policy: fullPackage.refund_policy || masterPkg.refund_policy,
              confirmation_policy: fullPackage.confirmation_policy || masterPkg.confirmation_policy,
              amendment_policy: fullPackage.amendment_policy || masterPkg.amendment_policy,
              payment_policy: fullPackage.payment_policy || masterPkg.payment_policy,
              remarks: fullPackage.remarks || masterPkg.remarks,
            };
          }
        }
      }
    } catch (err) {
      console.warn('Failed to fetch full itinerary details from server, using basic info:', err);
      // Even if fetch fails, try to use whatever we have in itinerary search result
    }

    const pkg = fullPackage || itinerary;
    const baseInfo = {
      itinerary_id: pkg.id,
      itinerary_name: itineraryName,
      destination: pkg.destination || pkg.destinations || pkg.routing || pkg.itinerary_name || '',
      duration: pkg.duration || 0,
      image: pkg.image || null,
      notes: pkg.notes || '',
      day_events: pkg.day_events || pkg.dayEvents || pkg.itinerary?.day_events || {},
      days: pkg.days || [],
      inclusions: pkg.inclusions || pkg.package_inclusions || [],
      exclusions: pkg.exclusions || pkg.package_exclusions || [],
      terms_conditions: pkg.terms_conditions || pkg.terms || [],
      refund_policy: pkg.refund_policy || pkg.cancellation_policy || [],
      confirmation_policy: pkg.confirmation_policy || [],
      amendment_policy: pkg.amendment_policy || [],
      payment_policy: pkg.payment_policy || [],
      remarks: pkg.remarks || [],
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
            day_events: (opt.day_events && Object.keys(opt.day_events).length > 0) ? opt.day_events : baseInfo.day_events,
            days: (opt.days && opt.days.length > 0) ? opt.days : baseInfo.days,
            inclusions: (opt.inclusions && opt.inclusions.length > 0) ? opt.inclusions : baseInfo.inclusions,
            exclusions: (opt.exclusions && opt.exclusions.length > 0) ? opt.exclusions : baseInfo.exclusions,
            terms_conditions: opt.terms_conditions || baseInfo.terms_conditions,
            refund_policy: opt.refund_policy || baseInfo.refund_policy,
            confirmation_policy: opt.confirmation_policy || baseInfo.confirmation_policy,
            amendment_policy: opt.amendment_policy || baseInfo.amendment_policy,
            payment_policy: opt.payment_policy || baseInfo.payment_policy,
            remarks: opt.remarks || baseInfo.remarks,
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
      // ── Change Plan mode or Re-insert: Avoid duplicates ──
      const newItineraryId = optionsToAdd[0]?.itinerary_id;
      const otherProposals = proposals.filter(p => p.itinerary_id !== newItineraryId);

      if (changePlanMode) {
        updatedProposals = optionsToAdd;
      } else {
        updatedProposals = [...otherProposals, ...optionsToAdd];
      }

      await saveProposals(updatedProposals);
      setShowInsertItineraryModal(false);
      setItinerarySearchTerm('');
      setChangePlanMode(false);
      const actionMsg = changePlanMode ? 'Plan Changed' : 'Itinerary Updated';
      const detailMsg = changePlanMode
        ? `Plan has been changed to "${itineraryName}". Previous itinerary saved in history.`
        : `Itinerary "${itineraryName}" has been updated in proposals.`;
      showToastNotification('success', actionMsg, detailMsg);
      return tid;
    }

    // No options in Final tab – add single proposal (whole itinerary)
    const newProposal = {
      id: Date.now(),
      ...baseInfo,
      price: pkg.price || 0,
      website_cost: pkg.website_cost || 0
    };

    if (changePlanMode) {
      updatedProposals = [newProposal];
    } else {
      const otherProposals = proposals.filter(p => p.itinerary_id !== newProposal.itinerary_id);
      updatedProposals = [...otherProposals, newProposal];
    }

    await saveProposals(updatedProposals);
    setChangePlanMode(false);
    setShowInsertItineraryModal(false);
    setItinerarySearchTerm('');
    const actionMsg2 = changePlanMode ? 'Plan Changed' : 'Itinerary Added';
    const detailMsg2 = changePlanMode
      ? `Plan has been changed to "${itineraryName}". Previous itinerary saved in history.`
      : `Itinerary "${itineraryName}" has been added to proposals.`;
    showToastNotification('success', actionMsg2, detailMsg2);
    return tid;
  } catch (err) {
    console.error('Final itinerary select error:', err);
    showToastNotification('error', 'Error', 'Failed to add itinerary. Please try again.');
  } finally {
    isInsertingRef.current = false;
  }
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
  // Duration filter: if query has dates, show only matching-duration itineraries
  if (leadTripDays != null) {
    const itDays = parseInt(itinerary.duration);
    if (!isNaN(itDays) && itDays !== leadTripDays) {
      return false;
    }
  }
  // Search filter
  const searchLower = itinerarySearchTerm.toLowerCase();
  return (
    searchLower === '' ||
    (itinerary.title || itinerary.itinerary_name || '').toLowerCase().includes(searchLower) ||
    (itinerary.destination || itinerary.destinations || '').toLowerCase().includes(searchLower) ||
    (itinerary.details || itinerary.notes || '').toLowerCase().includes(searchLower)
  );
}).sort((a, b) => b.id - a.id); // newest first

const formatDateForInput = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};


// Format ID helper - formats ID as Q-0005, Q-0004, etc.


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

// Helper for inclusions/exclusions/terms
const toList = (val) => {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string' && val.trim()) return val.split('\n').map(s => s.trim()).filter(Boolean);
  return [];
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
    let inclusions = [];
    let exclusions = [];
    let terms = '';
    let pkgData = null;
    let prData = null;

    // Determine if this is a proposal record or a package template
    const tid = proposal.id;
    const alternativeTid = proposal.itinerary_id || proposal.original_package_id || proposal.master_id;
    const isProposalRecord = (typeof alternativeTid === 'number' && alternativeTid < 1000000000000) || 
                             (typeof tid === 'number' && tid < 1000000000000) ||
                             !!proposal.lead_id || !!proposal.company_id;

    if (tid || alternativeTid) {
      try {
        // Helper to check localStorage for a specific ID
        const getLocalData = (idToCheck) => {
          const hasLocal = (proposal.day_events && Object.keys(proposal.day_events).length > 0);
          const isTemp = typeof idToCheck === 'number' && idToCheck > 1000000000000;
          
          if (hasLocal && isTemp && idToCheck === proposal.id) {
            return { pkg: proposal, pr: proposal };
          }

          if (isTemp || (typeof idToCheck === 'string' && idToCheck.length > 10)) {
            const parseLegacy = (key) => {
              try { return JSON.parse(localStorage.getItem(key)) || null; } catch (e) { return null; }
            };
            const legacyEvents = parseLegacy(`itinerary_${idToCheck}_events`);
            if (legacyEvents && Object.keys(legacyEvents).length > 0) {
              const legacyPricing = parseLegacy(`itinerary_${idToCheck}_pricing`);
              const legacyProposals = parseLegacy(`itinerary_${idToCheck}_proposals`);
              const legacyProposal = Array.isArray(legacyProposals) ? (legacyProposals.find(p => p.id === idToCheck) || legacyProposals[0]) : null;
              
              return {
                pkg: { 
                  ...(legacyProposal || {}), 
                  day_events: legacyEvents,
                  inclusions: proposal.inclusions,
                  exclusions: proposal.exclusions,
                  terms_conditions: proposal.terms_conditions
                },
                pr: { ...(legacyPricing || {}), ...(legacyProposal?.pricing || {}) }
              };
            }
          }
          return null;
        };

        // Try primary tid first, then alternative, then ANY proposal ID in the list
        let localResult = getLocalData(tid) || (alternativeTid !== tid ? getLocalData(alternativeTid) : null);
        
        if (!localResult && Array.isArray(proposals)) {
          for (const p of proposals) {
            if (p.id !== tid && p.id !== alternativeTid) {
              localResult = getLocalData(p.id);
              if (localResult) break;
            }
            if (p.itinerary_id && p.itinerary_id !== tid && p.itinerary_id !== alternativeTid) {
              localResult = getLocalData(p.itinerary_id);
              if (localResult) break;
            }
          }
        }

        if (localResult) {
          pkgData = localResult.pkg;
          prData = localResult.pr;
        } else {
          if (isProposalRecord) {
            // ALWAYS use the database ID (alternativeTid) if available, as tid might be a temp ID
            const apiId = alternativeTid || tid;
            const res = await leadProposalsAPI.get(apiId);
            pkgData = res?.data?.data;
            prData = pkgData;
          } else {
            const [pkgRes, pricingRes] = await Promise.all([
              packagesAPI.get(tid),
              itineraryPricingAPI.get(tid, id)
            ]);
            pkgData = pkgRes?.data?.data;
            prData = pricingRes?.data?.data;
          }
        }

        // More aggressive extraction of dayEvents
        let meta = proposal.metadata;
        if (typeof meta === 'string') {
          try { meta = JSON.parse(meta); } catch (e) { console.warn('Failed to parse metadata string', e); }
        }

        // Extremely aggressive extraction - check root, .data, .package, etc.
        const actualData = pkgData?.data || pkgData;
        
        let rawDayEvents = pkgData?.day_events || 
                            pkgData?.dayEvents ||
                            pkgData?.itinerary?.day_events ||
                            pkgData?.original_package?.day_events ||
                            pkgData?.original_package?.dayEvents ||
                            pkgData?.package?.day_events || 
                            pkgData?.package?.dayEvents ||
                            proposal.day_events || 
                            proposal.dayEvents ||
                            meta?.day_events || 
                            meta?.dayEvents || 
                            meta?.itinerary?.day_events ||
                            meta?.itinerary?.dayEvents ||
                            meta?.package?.day_events ||
                            meta?.package?.dayEvents || {};

        if (typeof rawDayEvents === 'string' && rawDayEvents.trim()) {
          try {
            rawDayEvents = JSON.parse(rawDayEvents);
          } catch (e) {
            console.warn('Failed to parse rawDayEvents string', e);
            rawDayEvents = {};
          }
        }

        // Inclusions/Exclusions extraction using toList
        inclusions = toList(actualData?.inclusions || actualData?.original_package?.inclusions || actualData?.package?.inclusions || pkgData?.inclusions || meta?.inclusions);
        exclusions = toList(actualData?.exclusions || actualData?.original_package?.exclusions || actualData?.package?.exclusions || pkgData?.exclusions || meta?.exclusions);
        terms = actualData?.terms_conditions || actualData?.original_package?.terms_conditions || actualData?.package?.terms_conditions || pkgData?.terms_conditions || meta?.terms_conditions || '';

        // Process dayEvents into the expected object-keyed-by-day format
        if (Array.isArray(rawDayEvents)) {
          dayEvents = rawDayEvents.reduce((acc, event) => {
            const d = event.day || 1;
            if (!acc[d]) acc[d] = [];
            acc[d].push(event);
            return acc;
          }, {});
        } else if (typeof rawDayEvents === 'object' && rawDayEvents !== null) {
          dayEvents = rawDayEvents;
        } else if (typeof rawDayEvents === 'string') {
          try {
            const parsed = JSON.parse(rawDayEvents);
            if (Array.isArray(parsed)) {
              dayEvents = parsed.reduce((acc, event) => {
                const d = event.day || 1;
                if (!acc[d]) acc[d] = [];
                acc[d].push(event);
                return acc;
              }, {});
            } else { dayEvents = parsed; }
          } catch (e) { dayEvents = {}; }
        }
        
        // Update pkgData for subsequent uses
        pkgData = actualData;
                   
        if (prData) {
          pricingData = prData.pricing_data || {};
          settings = {
            baseMarkup: prData.base_markup,
            extraMarkup: prData.extra_markup,
            cgst: prData.cgst,
            sgst: prData.sgst,
            igst: prData.igst,
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
        const type = (event.eventType || '').toLowerCase();
        if (type === 'accommodation' && event.hotelOptions) {
          event.hotelOptions.forEach(option => {
            const optNum = option.optionNumber || 1;
            if (!hotelOptions[optNum]) {
              hotelOptions[optNum] = [];
            }
            hotelOptions[optNum].push({
              ...option,
              day: parseInt(day),
              image: option.image || event.image || null
            });
          });
        }
      });
    });

    // Fallback if no hotel options found in dayEvents but we have hotelDetails (legacy/local format)
    if (Object.keys(hotelOptions).length === 0 && (pkgData?.hotelDetails || proposal?.hotelDetails)) {
      const hDetails = pkgData?.hotelDetails || proposal?.hotelDetails || [];
      hDetails.forEach(h => {
        const optNum = h.optionNumber || 1;
        if (!hotelOptions[optNum]) hotelOptions[optNum] = [];
        hotelOptions[optNum].push({
          ...h,
          day: parseInt(h.day)
        });
      });
    }

    // Determine option numbers to display
    let optionNumbers = Object.keys(hotelOptions).sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
    
    // Fallback if no hotel options but we have day events
    if (optionNumbers.length === 0 && Object.keys(dayEvents).length > 0) {
      optionNumbers = ['1'];
    }

    if (hasConfirmedProposal) {
      const confirmed = proposals.find(p => p.confirmed);
      const confirmedNum = confirmed?.optionNumber?.toString();
      if (confirmedNum && optionNumbers.includes(confirmedNum)) {
        optionNumbers = [confirmedNum];
      }
    }

    // Map prices for all options
    const pricesByOption = {};
    const sourceData = pkgData || proposal;
    const finalPrices = sourceData?.final_client_prices || sourceData?.metadata?.final_client_prices || {};
    
    optionNumbers.forEach(optNum => {
      let pPrice = 0;
      if (finalPrices[optNum]) {
        pPrice = parseFloat(finalPrices[optNum]) || 0;
      } else if (sourceData?.final_client_prices?.[optNum]) {
        pPrice = parseFloat(sourceData.final_client_prices[optNum]) || 0;
      } else if (sourceData?.price && (optNum === '1' || optionNumbers.length === 1)) {
        pPrice = parseFloat(sourceData.price) || 0;
      } else if (sourceData?.website_cost && (optNum === '1' || optionNumbers.length === 1)) {
        pPrice = parseFloat(sourceData.website_cost) || 0;
      } else if (hotelOptions[optNum]) {
        pPrice = hotelOptions[optNum].reduce((sum, h) => sum + (parseFloat(h.price || h.cost || h.net_total || 0)), 0);
      }
      pricesByOption[optNum] = pPrice;
    });

    const builtQuotation = {
      itinerary: {
        ...proposal,
        itinerary_name: pkgData?.itinerary_name || proposal.itinerary_name || 'Travel Proposal',
        duration: pkgData?.duration || proposal.duration,
        routing: pkgData?.routing || proposal.routing || pkgData?.destinations || proposal.destination || '',
        destinations: pkgData?.destinations || proposal.destination || proposal.destinations,
        day_events: dayEvents,
        adult: pkgData?.adult || lead?.adult || 1,
        child: pkgData?.child || lead?.child || 0,
        infant: pkgData?.infant || lead?.infant || 0,
        prices: pricesByOption
      },
      hotelOptions: hotelOptions,
      policies: {
        inclusions: inclusions || [],
        exclusions: exclusions || [],
        terms_conditions: terms || '',
        termsConditions: terms || '',
        refund_policy: pkgData?.refund_policy || proposal.metadata?.refund_policy || proposal.refund_policy || '',
        cancellationPolicy: pkgData?.refund_policy || proposal.metadata?.refund_policy || proposal.refund_policy || '',
        remarks: pkgData?.remarks || proposal.metadata?.remarks || proposal.remarks || '',
        confirmationPolicy: pkgData?.confirmation_policy || proposal.metadata?.confirmation_policy || proposal.confirmation_policy || '',
        amendmentPolicy: pkgData?.amendment_policy || proposal.metadata?.amendment_policy || proposal.amendment_policy || '',
        paymentPolicy: pkgData?.payment_policy || proposal.metadata?.payment_policy || proposal.payment_policy || ''
      },
      debug: {
        apiId: alternativeTid || tid,
        altId: alternativeTid,
        tid: tid,
        isProposalRecord
      }
    };

    setQuotationData(builtQuotation);

    // Set first option as selected if available
    const selOpt = optionNumbers.length > 0 ? optionNumbers[0] : (proposal.optionNumber?.toString() || '1');
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
        destinations: proposal.destination || proposal.destinations,
        routing: proposal.routing || '',
        duration: proposal.duration,
        price: proposal.price,
      },
      hotelOptions: hotelOptions,
      debug: {
        error: err ? err.toString() : 'Unknown Error',
        stack: err && err.stack ? err.stack.toString().split('\n').slice(0, 3).join(' | ') : ''
      }
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
    return {};
  }
};

const getEventIcon = (eventType) => {
  switch (eventType) {
    case 'accommodation': return <Building2 className="h-5 w-5" />;
    case 'activity': return <ImageIcon className="h-5 w-5" />;
    case 'transportation': return <Car className="h-5 w-5" />;
    case 'meal': return <UtensilsCrossed className="h-5 w-5" />;
    case 'flight': return <Plane className="h-5 w-5" />;
    case 'visa': return <PassportIcon className="h-5 w-5" />;
    case 'leisure': return <User className="h-5 w-5" />;
    case 'cruise': return <Ship className="h-5 w-5" />;
    default: return <Calendar className="h-5 w-5" />;
  }
};

const getTravelIcon = (dayNum, dayEvents) => {
  const events = dayEvents?.[dayNum] || [];
  const transportEvent = events.find(e => e.eventType === 'transportation');
  if (transportEvent) {
    const subject = (transportEvent.subject || '').toLowerCase();
    if (subject.includes('flight') || subject.includes('air')) return <Plane className="h-4 w-4" />;
    if (subject.includes('volvo') || subject.includes('bus')) return <Bus className="h-4 w-4" />;
    if (subject.includes('train')) return <Train className="h-4 w-4" />;
    if (subject.includes('car') || subject.includes('taxi') || subject.includes('vehicle') || subject.includes('drive')) return <Car className="h-4 w-4" />;
  }
  return <Car className="h-4 w-4" />;
};
const getTermsAndConditions = async () => {
  const policies = await getAllPolicies();
  return policies.termsConditions;
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
  const companyName = pdfCompanySettings?.company_name || 'Your Company Name';
  const companyAddress = pdfCompanySettings?.company_address || 'Delhi, India';
  const companyPhone = pdfCompanySettings?.company_phone || '+91-9871023004';
  const companyEmail = pdfCompanySettings?.company_email || 'info@yourcompany.com';

  const pdfHdrBg = pdfCompanySettings?.email_header_color || '#1e40af';
  let html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#333;margin:0;padding:0;">
      <!-- PDF Header: Logo + Company Name + Details -->
      ${buildEmailHeader(pdfCompanySettings, pdfHdrBg, '#ffffff')}

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
        ${buildEmailFooter(pdfCompanySettings, pdfCompanySettings?.email_footer_color || '#1e293b', '#ffffff')}
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

  const context = { lead, companySettings };
  return renderTemplate(templateId, itinerary, allOptions, qData.hotelOptions, allPolicies, context);
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

  // Resolve option number and price for PDF generation
  const first = visibleProposals[0];
  const itineraryIdForPricing = first?.itinerary_id || null;

  let targetOptionNum = optionNum;
  if (!targetOptionNum && dataForSend.hotelOptions) {
    targetOptionNum = Object.keys(dataForSend.hotelOptions)[0] || null;
  }

  let forcedPrice = null;
  if (targetOptionNum) {
    const proposal = (visibleProposals || []).find(p => String(p.optionNumber ?? 1) === String(targetOptionNum));
    const meta = proposal?.metadata || {};
    forcedPrice = proposal?.price ?? meta.price ?? proposal?.pricing?.finalClientPrice ?? meta.pricing?.finalClientPrice ?? null;
  }

  // Generate PDF file
  showToastNotification('info', 'Generating PDF...', 'Preparing PDF attachment for the email...');
  let pdfFile = null;
  try {
    const pdfRes = await handleDownloadSingleOptionPdf(
      targetOptionNum,
      dataForSend,
      itineraryIdForPricing,
      true, // showPrice
      true, // shouldSendToWhatsApp = true to skip browser download
      null, // targetChatId = null since we don't want to send to WhatsApp from here
      forcedPrice
    );
    pdfFile = pdfRes?.file || null;
  } catch (pdfErr) {
    console.error('Failed to generate PDF for email:', pdfErr);
    showToastNotification('error', 'PDF Generation Error', 'Could not generate PDF attachment. Email will be sent without attachment.');
  }

  const clientName = lead?.client_name || 'Client';
  const companyName = companySettings?.company_name || settings?.company_name || 'Paradise Holidays';
  const itineraryName = dataForSend.itinerary?.itinerary_name || 'your upcoming trip';
  const destinationsStr = dataForSend.itinerary?.destinations || '';

  const emailContentHtml = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <p>Dear ${clientName},</p>
      <p>Thank you for choosing <strong>${companyName}</strong>! 🙏</p>
      <p>We are pleased to share the customized travel itinerary proposal for your upcoming trip to <strong>${destinationsStr || itineraryName}</strong>.</p>
      <p>Please find the detailed PDF quotation containing complete options, hotel details, inclusions, and policies attached to this email.</p>
      <p>If you have any questions or would like to make changes, please feel free to reply to this email or contact us directly.</p>
      <br/>
      <p>Best regards,</p>
      <p><strong>${companyName} Team</strong></p>
    </div>
  `;

  const emailContentText = `Dear ${clientName},\n\n`
    + `Thank you for choosing ${companyName}! 🙏\n\n`
    + `We are pleased to share the customized travel itinerary proposal for your upcoming trip to ${destinationsStr || itineraryName}.\n\n`
    + `Please find the detailed PDF quotation containing complete options, hotel details, inclusions, and policies attached to this email.\n\n`
    + `If you have any questions or would like to make changes, please feel free to reply to this email or contact us directly.\n\n`
    + `Best regards,\n${companyName} Team`;

  try {
    if (user?.google_token) {
      if (pdfFile) {
        await googleMailAPI.sendMailWithAttachment({
          to: recipientEmail,
          to_email: recipientEmail,
          subject,
          body: emailContentHtml,
          lead_id: id,
          attachment: pdfFile,
        });
      } else {
        await googleMailAPI.sendMail({
          to: recipientEmail,
          to_email: recipientEmail,
          subject,
          body: emailContentHtml,
          lead_id: id,
        });
      }
      fetchGmailEmails();

      if (lead.status !== 'proposal' && lead.status !== 'confirmed') {
        try {
          await handleStatusChange('proposal');
        } catch (statusError) {
          console.error('Failed to update lead status:', statusError);
        }
      }

      showToastNotification('success', 'Email Sent!', 'Email sent successfully via Gmail! Lead status updated to PROPOSAL.');
      await fetchGmailEmails();
      return;
    }

    const emailPayload = {
      to_email: recipientEmail,
      subject,
      body: emailContentText,
    };
    if (pdfFile) {
      emailPayload.attachment = pdfFile;
    }
    const response = await leadsAPI.sendEmail(id, emailPayload);

    if (response.data.success) {
      fetchLeadEmails();

      if (lead.status !== 'proposal' && lead.status !== 'confirmed') {
        try {
          await handleStatusChange('proposal');
        } catch (statusError) {
          console.error('Failed to update lead status:', statusError);
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
const handleDownloadSingleOptionPdf = async (optionNum, quotationDataOverride = null, itineraryIdForPricing = null, showPrice = true, shouldSendToWhatsApp = false, targetChatId = null, forcedPrice = null) => {
  const qData = quotationDataOverride || quotationData;
  if (!qData || !lead) {
    showToastNotification('warning', 'Quotation Needed', 'Please load quotation first');
    return;
  }

  let optionPriceMap = null;
  if (itineraryIdForPricing) {
    try {
      const res = await itineraryPricingAPI.get(itineraryIdForPricing, id);
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

  // Second Fallback: use prices from qData.itinerary.prices (computed from frontend)
  if (!optionPriceMap || Object.keys(optionPriceMap).length === 0) {
    if (qData.itinerary?.prices && typeof qData.itinerary.prices === 'object') {
      optionPriceMap = {};
      Object.keys(qData.itinerary.prices).forEach((key) => {
        const finalVal = parseFloat(qData.itinerary.prices[key]);
        if (!Number.isNaN(finalVal) && finalVal > 0) {
          optionPriceMap[key] = { final: finalVal, original: finalVal, discountPct: 0, discountAmount: 0 };
        }
      });
      if (Object.keys(optionPriceMap).length === 0) optionPriceMap = null;
    }
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

  // OVERRIDE WITH FORCED PRICE
  if (forcedPrice !== null && !Number.isNaN(parseFloat(forcedPrice))) {
    const pVal = parseFloat(forcedPrice);
    if (!optionPriceMap) optionPriceMap = {};
    if (!optionPriceMap[targetOption]) optionPriceMap[targetOption] = { discountPct: 0, discountAmount: 0 };
    optionPriceMap[targetOption].final = pVal;
    optionPriceMap[targetOption].original = pVal;
    basePrice = pVal;
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

    // Handle File Download / WhatsApp Send
    const blob = new Blob([downloadRes.data], { type: 'application/pdf' });
    const fileName = `Quotation_${quotationId}_${lead.client_name.replace(/\s+/g, '_')}.pdf`;

    if (shouldSendToWhatsApp && targetChatId) {
      const file = new File([blob], fileName, { type: 'application/pdf' });
      await whatsappWebAPI.sendMedia({
        chat_id: targetChatId,
        file: file,
        caption: `Professional Quotation PDF for ${qData.itinerary?.itinerary_name || 'Itinerary'}`,
        type: 'document'
      });
    }

    // If not just sending to WhatsApp, trigger browser download
    if (!shouldSendToWhatsApp) {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showToastNotification('success', 'PDF Downloaded', 'PDF served from Backend (Blade Template).');
    }

    // Automatically update lead status to 'Proposal Sent' if it's currently new or processing
    if (lead.status !== 'proposal' && lead.status !== 'confirmed') {
      try {
        await handleStatusChange('proposal');
        await fetchLeadDetails(); // Refresh to reflect status change
      } catch (statusError) {
        console.error('Failed to auto-update status on download:', statusError);
      }
    }

    return {
      blob,
      fileName,
      file: new File([blob], fileName, { type: 'application/pdf' })
    };

  } catch (error) {
    console.error('Error generating PDF via Backend:', error);
    showToastNotification('error', 'Download Failed', error.response?.data?.message || error.message || 'Backend error');
    return null;
  }
};

const triggerPdfDownloadWithOptions = (optionNum, quotationDataOverride = null, itineraryIdForPricing = null, forcedPrice = null) => {
  setPdfDownloadParams({ optionNum, quotationDataOverride, itineraryIdForPricing, forcedPrice });
  setShowPdfPriceOptionModal(true);
};

const handleSendWhatsApp = async (optionNum, quotationDataOverride = null) => {
  const qData = quotationDataOverride || quotationData;
  if (!qData || !lead) {
    showToastNotification('warning', 'Quotation Needed', 'Please load quotation first');
    return;
  }

  const clientName = lead?.client_name || 'Client';
  const companyName = settings?.company_name || companySettings?.company_name || 'Paradise Holidays';
  const itineraryName = qData.itinerary?.itinerary_name || 'your upcoming trip';
  const destinationsStr = qData.itinerary?.destinations || '';

  // Build WhatsApp message from quotation
  let message = `*Dear ${clientName},*\n\n`;
  message += `Thank you for choosing *${companyName}*! 🙏\n\n`;
  message += `We are pleased to share the customized travel itinerary proposal for your upcoming trip to *${destinationsStr || itineraryName}*.\n\n`;
  message += `Please find the detailed PDF quotation containing complete options, hotel details, inclusions, and policies attached below. 📁👇\n\n`;
  message += `Best regards,\n*${companyName} Team*`;

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

  // Check WhatsApp Connection
  if (waStatus !== 'Connected') {
    setShowWaConnectModal(true);
    return;
  }

  try {
    const phoneStr = lead.phone.replace(/\D/g, '');
    const chatId = phoneStr.length <= 10 ? `91${phoneStr}@s.whatsapp.net` : `${phoneStr}@s.whatsapp.net`;

    const response = await whatsappWebAPI.sendMessage({
      chat_id: chatId,
      message: message,
      lead_id: id
    });

    if (response.data.success) {
      fetchWhatsAppMessages();

      // Automatically generate and send the PDF as well
      try {
        showToastNotification('info', 'Attaching PDF...', 'Generating professional PDF for WhatsApp...');
        const first = visibleProposals[0];
        const itineraryIdForPricing = first?.itinerary_id || null;
        let singlePrice = null;
        if (optionNumbers.length === 1) {
          const singleOptNum = optionNumbers[0];
          const proposal = (visibleProposals || []).find(p => String(p.optionNumber ?? 1) === String(singleOptNum));
          const meta = proposal?.metadata || {};
          singlePrice = proposal?.price ?? meta.price ?? proposal?.pricing?.finalClientPrice ?? meta.pricing?.finalClientPrice ?? null;
        }
        await handleDownloadSingleOptionPdf(optionNumbers.length === 1 ? optionNumbers[0] : null, qData, itineraryIdForPricing, true, true, chatId, singlePrice);
      } catch (pdfErr) {
        console.error('Failed to send PDF via WhatsApp:', pdfErr);
      }

      if (lead.status !== 'proposal' && lead.status !== 'confirmed') {
        try {
          await handleStatusChange('proposal');
        } catch (statusError) {
          console.error('Failed to update lead status:', statusError);
        }
      }

      showToastNotification('success', 'WhatsApp Sent!', 'Summary and PDF sent successfully!');
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
    const actualPrice = opt.price ?? opt.metadata?.price ?? opt.pricing?.finalClientPrice ?? opt.metadata?.pricing?.finalClientPrice ?? 0;
    await triggerPdfDownloadWithOptions(optNum, qData, opt.itinerary_id || null, actualPrice);
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
    const actualPrice = confirmedProposal ? (confirmedProposal.price ?? confirmedProposal.metadata?.price ?? 0) : null;

    await triggerPdfDownloadWithOptions(optionToDownload, qData, first.itinerary_id || null, actualPrice);
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
  message += `Best regards,\n${companySettings?.company_name || 'Our Company'} Team`;

  const phone = lead.phone?.replace(/[^0-9]/g, '') || '';
  if (phone) {
    if (waStatus === 'Connected') {
      const phoneStr = phone.replace(/\D/g, '');
      const chatId = phoneStr.length <= 10 ? `91${phoneStr}@s.whatsapp.net` : `${phoneStr}@s.whatsapp.net`;
      try {
        await whatsappWebAPI.sendMessage({
          chat_id: chatId,
          message: message,
          lead_id: id
        });
        showToastNotification('success', 'Sent!', 'WhatsApp message sent successfully!');
        fetchWhatsAppMessages();
        if (lead.status !== 'proposal' && lead.status !== 'confirmed') {
          await handleStatusChange('proposal');
        }
      } catch (err) {
        console.error('WhatsApp send failed:', err);
        showToastNotification('error', 'Send Failed', err.response?.data?.message || 'Failed to send message');
      }
    } else {
      const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
    }
  } else {
    showToastNotification('warning', 'Phone Missing', 'Phone number not available for this lead.');
  }
};

// Generate email content for confirmed option only


// Helper function to generate email for specific options




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

  const emailContent = await generateEmailContent();

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
  message += `Best regards,\n${companySettings?.company_name || 'Our Company'} Team`;

  const phoneStr = phone.replace(/\D/g, '');
  const chatId = phoneStr.length <= 10 ? `91${phoneStr}@s.whatsapp.net` : `${phoneStr}@s.whatsapp.net`;

  try {
    await whatsappWebAPI.sendMessage({
      chat_id: chatId,
      message: message,
      lead_id: id
    });
    showToastNotification('success', 'Sent!', 'Confirmation WhatsApp sent successfully!');
    fetchWhatsAppMessages();
    if (lead.status !== 'confirmed') {
      await handleStatusChange('confirmed');
    }
  } catch (err) {
    console.error('WhatsApp send failed:', err);
    showToastNotification('error', 'Send Failed', err.response?.data?.message || 'Failed to send confirmation');
  }
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

const handleRequestUnlock = async (e) => {
  e.preventDefault();
  if (!unlockReason.trim()) {
    showToastNotification('warning', 'Reason Required', 'Please provide a reason for editing this booked query.');
    return;
  }
  setIsSubmittingUnlock(true);
  try {
    await leadsAPI.requestUnlock(id, unlockReason);
    showToastNotification('success', 'Request Sent', 'Unlock request has been sent to your manager.');
    setShowUnlockRequestModal(false);
    setUnlockReason('');
    fetchLeadDetails();
  } catch (err) {
    console.error('Failed to request unlock:', err);
    showToastNotification('error', 'Request Failed', err.response?.data?.message || 'Failed to send unlock request');
  } finally {
    setIsSubmittingUnlock(false);
  }
};

const handleApproveRejectUnlock = async (action) => {
  setIsSubmittingUnlock(true);
  try {
    await leadsAPI.handleUnlockRequest(id, { action });
    showToastNotification('success', 'Success', `Unlock request ${action}ed successfully.`);
    setShowUnlockHandleModal(false);
    fetchLeadDetails();
  } catch (err) {
    console.error('Failed to handle unlock request:', err);
    showToastNotification('error', 'Action Failed', err.response?.data?.message || 'Failed to process request');
  } finally {
    setIsSubmittingUnlock(false);
  }
};

const handleLockQuery = async () => {
  setIsSubmittingUnlock(true);
  try {
    await leadsAPI.lock(id);
    showToastNotification('success', 'Success', 'Query locked successfully.');
    fetchLeadDetails();
  } catch (err) {
    console.error('Failed to lock query:', err);
    showToastNotification('error', 'Action Failed', err.response?.data?.message || 'Failed to lock query');
  } finally {
    setIsSubmittingUnlock(false);
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
                  onClick={() => navigate(-1)}
                  className="p-2.5 hover:bg-gray-100 rounded-full transition-colors text-gray-600 border border-gray-100"
                  title="Back"
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
                      <span className="px-3 py-1 text-xs font-bold bg-purple-100 text-purple-600 rounded-full border border-purple-200 uppercase tracking-wider status-glow-followup">Follow Up Sent</span>
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

                {lead.is_locked && (
                  <div className={`flex items-center gap-2 px-3 py-1 border rounded-full text-xs font-bold uppercase tracking-tight shadow-sm ${lead.is_unlocked_for_edit ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
                    <Lock size={12} className={lead.is_unlocked_for_edit ? 'animate-pulse' : ''} />
                    {lead.is_unlocked_for_edit ? 'Unlocked for Edit' : 'Locked'}
                  </div>
                )}

                {lead.is_unlocked_for_edit && (isAdminOrManager || user?.id === lead.assigned_to || user?.id === lead.created_by) && (
                  <button
                    onClick={() => {
                      if (window.confirm('Are you sure you want to lock this query again? This will restrict edits.')) {
                        handleLockQuery();
                      }
                    }}
                    className="px-4 py-2 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-all flex items-center gap-2 active:scale-95 shadow-sm"
                  >
                    <Lock className="h-4 w-4" />
                    Lock Query
                  </button>
                )}

                {isLeadLocked && !lead.unlock_requested && (
                  <button
                    onClick={() => setShowUnlockRequestModal(true)}
                    className="px-4 py-2 text-xs font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition-all flex items-center gap-2 active:scale-95 shadow-sm"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Request Unlock
                  </button>
                )}

                {isLeadLocked && lead.unlock_requested && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-500 text-xs font-semibold cursor-default">
                    <Clock size={14} className="animate-spin" />
                    Unlock Requested...
                  </div>
                )}

                {(user.permissions?.includes('leads_management.approve_unlock') || user.permissions?.includes('leads_management.bypass_lock') || isAdminOrManager) && lead.unlock_requested && !lead.is_unlocked_for_edit && (
                  <button
                    onClick={() => setShowUnlockHandleModal(true)}
                    className="px-4 py-2 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-all flex items-center gap-2 active:scale-95 shadow-sm animate-pulse"
                  >
                    <Info className="h-4 w-4" />
                    Handle Unlock Request
                  </button>
                )}

                {lead.status !== 'confirmed' && lead.status !== 'cancelled' && !isLeadLocked && (
                  <button
                    onClick={() => {
                      if (window.confirm('Are you sure you want to decline this query? This will mark it as Declined.')) {
                        handleStatusChange('cancelled');
                      }
                    }}
                    className="px-4 py-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-all flex items-center gap-2 active:scale-95 shadow-sm"
                  >
                    <X className="h-4 w-4" />
                    Decline Query
                  </button>
                )}

                {(userRoles.includes('Admin') || userRoles.includes('Company Admin') || userRoles.includes('Super Admin')) && (
                  <button
                    onClick={async () => {
                      if (window.confirm(`Are you sure you want to PERMANENTLY DELETE query of ${lead.client_name}? This cannot be undone.`)) {
                        try {
                          await leadsAPI.delete(id);
                          toast.success('Query deleted successfully');
                          navigate('/leads');
                        } catch (err) {
                          toast.error('Failed to delete query');
                        }
                      }
                    }}
                    className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 border border-rose-700 rounded-xl transition-all flex items-center gap-2 active:scale-95 shadow-lg shadow-rose-500/20"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Query
                  </button>
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
                      if (isLeadLocked) {
                        showToastNotification('warning', 'Lead Locked', 'This booking is locked. Please request approval from your manager to edit.');
                        return;
                      }
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
                    className={`p-1.5 rounded-lg transition-colors ${isLeadLocked ? 'text-gray-400 cursor-not-allowed bg-gray-50' : 'text-blue-600 hover:bg-blue-50'}`}
                    title={isLeadLocked ? "LOCKED: Cannot Edit" : "Edit Query"}
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
                    onClick={() => {
                      if (isLeadLocked) {
                        showToastNotification('warning', 'Lead Locked', 'This booking is locked. Please request approval from your manager to edit.');
                        return;
                      }
                      handlePaxModalOpen();
                    }}
                    className={`p-1.5 rounded-lg transition-colors ${isLeadLocked ? 'text-gray-400 cursor-not-allowed bg-gray-50' : 'text-blue-600 hover:bg-blue-50'}`}
                    title={isLeadLocked ? "LOCKED: Cannot Edit" : "Edit Travellers"}
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
                      if (isLeadLocked) {
                        showToastNotification('warning', 'Lead Locked', 'This booking is locked. Please request approval from your manager to edit.');
                        return;
                      }
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
                    className={`p-1.5 rounded-lg transition-colors ${isLeadLocked ? 'text-gray-400 cursor-not-allowed bg-gray-50' : 'text-blue-600 hover:bg-blue-50'}`}
                    title={isLeadLocked ? "LOCKED: Cannot Edit" : "Edit Customer"}
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
                          onClick={() => {
                            if (isLeadLocked) return showToastNotification('warning', 'Lead Locked', 'Cannot add notes to a finalized booking.');
                            setShowNoteInput(true);
                          }}
                          className={`flex items-center gap-2 px-6 py-2 rounded-full text-sm font-medium transition ${isLeadLocked ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
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

                <div className="flex justify-start border-b border-gray-100 sticky top-0 bg-white z-10 px-2 overflow-x-auto custom-scrollbar-x">
                  <div className="flex space-x-1 p-1">
                    {[
                      { key: 'proposals', label: 'Proposals' },
                      { key: 'mails', label: 'Mails' },
                      { key: 'whatsapp', label: 'WhatsApp' },
                      { key: 'followups', label: "Followup's" },
                      { key: 'suppComm', label: 'Supp. Comm.' },
                      { key: 'voucher', label: 'Voucher' },
                      { key: 'docs', label: 'Docs.' },
                      { key: 'invoice', label: 'Invoice' },
                      { key: 'billing', label: 'Billing' },
                      { key: 'calls', label: 'Calls' },
                      { key: 'history', label: 'History' }
                    ].map(({ key, label }, index) => (
                      <button
                        key={key}
                        onClick={() => {
                          setActiveTab(key);
                          const params = new URLSearchParams(location.search);
                          params.set('tab', key);
                          navigate({ search: params.toString() }, { replace: true });
                        }}
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
                          className={`px-5 py-2.5 text-sm font-semibold border-b-2 transition-all ${proposalSubTab === 'active'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                          Active Package
                        </button>
                        <button
                          onClick={() => setProposalSubTab('history')}
                          className={`px-5 py-2.5 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${proposalSubTab === 'history'
                            ? 'border-orange-500 text-orange-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                          Package History
                          {itineraryHistoryTotal > 0 && (
                            <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${proposalSubTab === 'history'
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
                              <LogoLoader text="Fetching packages..." compact={true} />
                            </div>
                          ) : visibleProposals.length > 0 ? (
                            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mb-6">
                              <div className="p-5">
                                <div className="flex flex-wrap items-center justify-between gap-4 mb-6 border-b pb-4">
                                  <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                    <MapPin className="h-5 w-5 text-blue-600" />
                                    {[...new Set(visibleProposals.map(p => p.itinerary_name || p.title || 'Itinerary'))].length > 1 
                                      ? `Multiple Packages (${[...new Set(visibleProposals.map(p => p.itinerary_name || p.title || 'Package'))].length})`
                                      : (visibleProposals[0]?.itinerary_name || visibleProposals[0]?.title || 'Proposals')}
                                  </h3>
                                  
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={refreshProposalPricesFromServer}
                                      disabled={refreshingProposalPrices}
                                      className="inline-flex items-center gap-1.5 text-blue-600 hover:bg-blue-50 text-xs font-semibold px-3 py-2 rounded-lg border border-blue-200"
                                    >
                                      <RefreshCw className={`h-3.5 w-3.5 ${refreshingProposalPrices ? 'animate-spin' : ''}`} />
                                      Refresh prices
                                    </button>
                                  </div>
                                </div>

                                {/* Horizontal Summary Bar (Itinerary Tabs) */}
                                <div className="flex items-center border-b border-gray-100 overflow-x-auto custom-scrollbar-x mb-6">
                                  {Object.entries(
                                    visibleProposals.reduce((acc, p) => {
                                      const key = p.itinerary_id || 'unknown';
                                      if (!acc[key]) acc[key] = [];
                                      acc[key].push(p);
                                      return acc;
                                    }, {})
                                  ).map(([itId, groupProposals]) => {
                                    const itName = groupProposals[0]?.itinerary_name || 'Package';
                                    const isActive = selectedProposalItineraryId === itId;
                                    
                                    return (
                                      <button
                                        key={itId}
                                        onClick={() => setSelectedProposalItineraryId(itId)}
                                        className={`px-6 py-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
                                          isActive 
                                            ? 'border-blue-600 text-blue-600 bg-blue-50/30' 
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50/50'
                                        }`}
                                      >
                                        <div className="flex flex-col items-start leading-tight">
                                          <span className="uppercase tracking-wide">{itName}</span>
                                          <span className={`text-[10px] font-medium ${isActive ? 'text-blue-400' : 'text-gray-400'}`}>
                                            {groupProposals[0]?.metadata?.route || 'View Details'}
                                          </span>
                                        </div>
                                      </button>
                                    );
                                  })}
                                </div>

                                {/* Grouped Package options - FILTERED by selected tab */}
                                {Object.entries(
                                  visibleProposals.reduce((acc, p) => {
                                    const key = p.itinerary_id || 'unknown';
                                    if (!acc[key]) acc[key] = [];
                                    acc[key].push(p);
                                    return acc;
                                  }, {})
                                )
                                .filter(([itId]) => !selectedProposalItineraryId || itId === selectedProposalItineraryId)
                                .map(([itId, groupProposals]) => (
                                  <div key={itId} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <div className="flex flex-wrap items-center justify-between gap-4 mb-6 bg-blue-50/50 p-4 rounded-2xl border border-blue-100/50">
                                      <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-100">
                                          {groupProposals[0]?.itinerary_name?.[0] || 'I'}
                                        </div>
                                        <div>
                                          <h4 className="text-lg font-black text-gray-900 leading-tight">
                                            {groupProposals[0]?.itinerary_name || 'Package'}
                                          </h4>
                                          <p className="text-xs font-bold text-blue-600 uppercase tracking-widest">
                                            {groupProposals.length} Package Options Available
                                          </p>
                                        </div>
                                      </div>
                                      
                                      <div className="flex items-center gap-2">
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDownloadPdfFromCard(groupProposals[0]);
                                          }}
                                          className="inline-flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold px-4 py-2 rounded-lg transition-all active:scale-95 border border-gray-200"
                                        >
                                          <Download className="h-3.5 w-3.5" /> Download PDF
                                        </button>
                                        
                                        <button
                                          type="button"
                                          disabled={sendingOptionChannel === 'both'}
                                          onClick={() => handleSendOptionFromCard(groupProposals[0], 'both')}
                                          className={`inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-5 py-2 rounded-lg transition-all active:scale-95 shadow-lg shadow-blue-100 ${sendingOptionChannel === 'both' ? 'opacity-70 cursor-not-allowed' : ''}`}
                                        >
                                          <Send className={`h-3.5 w-3.5 ${sendingOptionChannel === 'both' ? 'animate-pulse' : ''}`} />
                                          {sendingOptionChannel === 'both' ? 'Sending...' : 'Send Package'}
                                        </button>
                                      </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                                      {groupProposals.map((opt) => (
                                        <div
                                          key={opt.id}
                                          className={`rounded-xl border-2 overflow-hidden shadow-sm transition-all ${opt.confirmed ? 'border-green-500 bg-green-50/50 shadow-green-100' : 'border-gray-200 bg-white hover:shadow-md'}`}
                                        >
                                          <div className="bg-blue-600 px-4 py-2.5 flex items-center justify-between text-white font-semibold">
                                            Option {opt.optionNumber || 1}
                                            {opt.confirmed && <span className="px-2 py-0.5 bg-green-500 text-xs rounded-full">Booked</span>}
                                          </div>
                                          <div className="p-4">
                                            <div className="mb-4 text-2xl font-bold text-gray-900">
                                              ₹{Number(opt.price || opt.metadata?.price || 0).toLocaleString('en-IN')}
                                            </div>
                                            <div className="flex flex-col gap-2">
                                              {!opt.confirmed && (
                                                <button
                                                  type="button"
                                                  onClick={(e) => { 
                                                    e.stopPropagation(); 
                                                    if (isLeadLocked) return showToastNotification('warning', 'Lead Locked', 'This booking is locked. Request manager approval to change options.');
                                                    const allDone = followups.every(f => f.is_completed);
                                                    if (!allDone) {
                                                      showToastNotification('warning', 'Pending Followups', 'Please mark all followups as done before confirming the booking.');
                                                      return;
                                                    }
                                                    handleConfirmOption(opt.id); 
                                                  }}
                                                  className={`w-full text-white text-sm font-semibold px-3 py-2 rounded-lg transition-all ${isLeadLocked ? 'bg-gray-400 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-600'}`}
                                                >
                                                  Book Now
                                                </button>
                                              )}
                                              <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); handleViewQuotation(opt); }}
                                                className="w-full bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold px-3 py-2 rounded-lg"
                                              >
                                                View Quotation
                                              </button>
                                              <button
                                                type="button"
                                                onClick={async (e) => {
                                                  e.stopPropagation();
                                                  if (isLeadLocked) return showToastNotification('warning', 'Lead Locked', 'Request manager approval.');
                                                  setLoadingHotelManager(true);
                                                  setShowHotelManagerModal(true);
                                                  try {
                                                    const [qData, rtRes] = await Promise.all([
                                                      handleViewQuotation(opt, false),
                                                      roomTypesAPI.list().catch(() => null)
                                                    ]);
                                                    if (rtRes?.data?.success) setRoomTypes(rtRes.data.data);
                                                    const pkg = qData?.itinerary;
                                                    const hotels = [];
                                                    Object.keys(pkg?.day_events || {}).forEach(d => {
                                                      (pkg.day_events[d] || []).forEach((ev, ei) => {
                                                        if ((ev.eventType || '').toLowerCase() === 'accommodation') {
                                                          (ev.hotelOptions || []).forEach((h, hi) => {
                                                            hotels.push({ ...h, dayNum: parseInt(d), itineraryId: opt.itinerary_id, eventIndex: ei, optIndex: hi });
                                                          });
                                                        }
                                                      });
                                                    });
                                                    setHotelManagerData(hotels);
                                                  } catch (err) { console.error(err); } finally { setLoadingHotelManager(false); }
                                                }}
                                                className={`w-full inline-flex items-center justify-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-lg border transition-all ${isLeadLocked ? 'text-gray-400 bg-gray-50 border-gray-200 cursor-not-allowed' : 'text-blue-600 hover:bg-blue-50 border-blue-200'}`}
                                              >
                                                <Building2 className="h-3.5 w-3.5" /> Manage Hotels
                                              </button>
                                              <button
                                                type="button"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  if (isLeadLocked) return showToastNotification('warning', 'Lead Locked', 'This booking is locked. Package editing is restricted.');
                                                  window.open(`/itineraries/${opt.itinerary_id}?fromLead=${id}&type=proposal`, '_blank');
                                                }}
                                                className={`w-full text-sm font-medium px-3 py-2 rounded-lg border transition-all ${isLeadLocked ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100 border-gray-300'}`}
                                              >
                                                Edit Package
                                              </button>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ))}

                                {!hasConfirmedProposal && (
                                  <div className="flex justify-end mt-4 gap-2">
                                    <button 
                                      onClick={() => {
                                        if (isLeadLocked) return showToastNotification('warning', 'Lead Locked', 'Cannot remove itinerary.');
                                        handleRemoveItinerary();
                                      }} 
                                      className={`text-sm font-semibold px-3 py-1.5 rounded-lg border transition-all ${isLeadLocked ? 'text-gray-300 border-gray-100 cursor-not-allowed' : 'text-red-600 border-red-200 hover:bg-red-50'}`}
                                    >
                                      Remove
                                    </button>
                                    <button 
                                      onClick={() => {
                                        if (isLeadLocked) return showToastNotification('warning', 'Lead Locked', 'Cannot change plan.');
                                        handleChangePlan();
                                      }} 
                                      className={`text-sm font-semibold px-3 py-1.5 rounded-lg border transition-all ${isLeadLocked ? 'text-gray-300 border-gray-100 cursor-not-allowed' : 'text-orange-600 border-orange-200 hover:bg-orange-50'}`}
                                    >
                                      Change Plan
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : null}

                          {/* Create / Insert buttons – full width row, no overlap */}
                          <div className="flex flex-wrap items-center gap-3 pt-2">
                            <button
                              onClick={() => {
                                if (isLeadLocked) return showToastNotification('warning', 'Lead Locked', 'Modification is restricted.');
                                handleCreateItinerary();
                              }}
                              className={`px-6 py-2.5 rounded-lg flex items-center gap-2 font-medium text-sm transition-all ${isLeadLocked ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed' : 'bg-[#3F8CFF] text-white hover:bg-[#2d7ae8]'}`}
                            >
                              <Plus className="h-4 w-4" />
                              Create package
                            </button>
                            <button
                              onClick={() => {
                                if (isLeadLocked) return showToastNotification('warning', 'Lead Locked', 'Modification is restricted.');
                                handleInsertItinerary();
                              }}
                              className={`px-6 py-2.5 rounded-lg flex items-center gap-2 font-medium text-sm transition-all ${isLeadLocked ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed' : 'bg-[#E78175] text-white hover:bg-[#d9706a]'}`}
                            >
                              <Upload className="h-4 w-4" />
                              Insert package
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
                            onCompleteFollowup={(f) => {
                                setCompletingFollowup(f);
                                setShowFollowupCompleteModal(true);
                            }}
                            isLeadLocked={isLeadLocked}
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
                              handleSupplierEmailBodyChange={handleSupplierEmailBodyChange}
                              handleSendSupplierEmail={handleSendSupplierEmail}
                              resetSupplierEmailBody={resetSupplierEmailBody}
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
                          ) : activeTab === 'voucher' ? (
                            <VoucherTab
                              lead={lead}
                              getConfirmedOption={getConfirmedOption}
                              quotationData={quotationData}
                              proposals={proposals}
                              handleVoucherPreview={handleVoucherPreview}
                              handleVoucherDownload={handleVoucherDownload}
                              handleVoucherSend={handleVoucherSend}
                              voucherActionLoading={voucherActionLoading}
                            />
                          ) :
                            activeTab === 'docs' ? (
                              <DocsTab leadId={id} />
                            ) :
                              activeTab === 'invoice' ? (
                                <InvoiceTab
                                  loadingHistory={loadingHistory}
                                  queryDetailInvoices={queryDetailInvoices}
                                  handleInvoicePreview={handleInvoicePreview}
                                  handleInvoiceDownload={handleInvoiceDownload}
                                  handleInvoiceSend={handleInvoiceSend}
                                  handleInvoiceDelete={handleInvoiceDelete}
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
                                    isLeadLocked={isLeadLocked}
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
            <h2 className="text-xl font-bold text-gray-800">Package setup</h2>
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


              {/* Routing / Destinations */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Routing
                </label>
                <input
                  type="text"
                  value={itineraryFormData.routing || itineraryFormData.destinations}
                  onChange={(e) => setItineraryFormData({ ...itineraryFormData, routing: e.target.value, destinations: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Delhi (1N) - Shimla (2N) - Manali (3N) - Delhi"
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
                <span>Showing all <strong>{leadTripDays}-day</strong> packages (templates + lead-specific)</span>
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
                    <p className="text-sm text-gray-500">{it.duration} Days - {it.destination || it.destinations || it.routing || it.itinerary_name || it.title}</p>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); handleSelectItinerary(it); }} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition-colors flex-shrink-0">Insert</button>
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
              <select 
                value={followupFormData.type} 
                onChange={(e) => setFollowupFormData({ ...followupFormData, type: e.target.value })} 
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              >
                <option value="Task">Task</option>
                <option value="Followup">Followup</option>
              </select>
            </div>
            <div className="flex gap-2 flex-wrap mt-1">
              <button
                type="button"
                onClick={() => setFollowupFormData({ ...followupFormData, type: 'Followup', description: 'Switched off' })}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold transition-all active:scale-95 shadow-sm"
              >
                <Power className="h-3.5 w-3.5 text-slate-500" />
                Switched off
              </button>
              <button
                type="button"
                onClick={() => setFollowupFormData({ ...followupFormData, type: 'Followup', description: 'Not reachable' })}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold transition-all active:scale-95 shadow-sm"
              >
                <AlertCircle className="h-3.5 w-3.5 text-slate-500" />
                Not reachable
              </button>
              <button
                type="button"
                onClick={() => setFollowupFormData({ ...followupFormData, type: 'Followup', description: 'Not answering' })}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold transition-all active:scale-95 shadow-sm"
              >
                <PhoneMissed className="h-3.5 w-3.5 text-slate-500" />
                Not answering
              </button>
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
        {/* Follow-up Completion Modal */}
        <Dialog visible={showFollowupCompleteModal} style={{ width: 'min(95vw, 550px)' }} onHide={() => {
          setShowFollowupCompleteModal(false);
          setCompletingFollowup(null);
          setFollowupCompletionData({ remark: '', scheduleNext: false, nextDate: '', nextTime: '13:00' });
        }} showCloseIcon={false} header={() => (
          <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-green-50/50">
            <h2 className="text-xl font-bold text-green-800">Complete Follow-up</h2>
            <button onClick={() => setShowFollowupCompleteModal(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"><X className="h-6 w-6" /></button>
          </div>
        )}>
          <form onSubmit={handleCompleteFollowupSubmit} className="p-6 space-y-6">
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-2">
                <p className="text-sm text-blue-800 font-medium flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    You are completing the task scheduled for: 
                    <span className="font-bold">{completingFollowup ? new Date(completingFollowup.reminder_date).toLocaleDateString() : ''}</span>
                </p>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 italic">
                Client se kya baat hui? (What did client say?) <span className="text-red-500">*</span>
              </label>
              <textarea 
                value={followupCompletionData.remark} 
                onChange={(e) => setFollowupCompletionData({ ...followupCompletionData, remark: e.target.value })} 
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-0 outline-none resize-none transition-all" 
                placeholder="Enter client response or reason for closing this task..." 
                rows="4" 
                required 
              />
            </div>

            <div className="pt-2">
                <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative flex items-center justify-center">
                        <input 
                            type="checkbox" 
                            checked={followupCompletionData.scheduleNext} 
                            onChange={(e) => setFollowupCompletionData({ ...followupCompletionData, scheduleNext: e.target.checked })}
                            className="w-6 h-6 rounded-lg border-2 border-gray-300 text-blue-600 focus:ring-0 cursor-pointer" 
                        />
                    </div>
                    <span className="text-sm font-bold text-gray-700 group-hover:text-blue-600 transition-colors">
                        Next follow-up schedule karna hai? (Schedule next follow-up?)
                    </span>
                </label>
            </div>

            {followupCompletionData.scheduleNext && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Next Date</label>
                        <input 
                            type="date" 
                            value={followupCompletionData.nextDate} 
                            onChange={(e) => setFollowupCompletionData({ ...followupCompletionData, nextDate: e.target.value })} 
                            min={new Date().toISOString().split('T')[0]} 
                            className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 outline-none font-medium" 
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Next Time</label>
                        <select 
                            value={followupCompletionData.nextTime} 
                            onChange={(e) => setFollowupCompletionData({ ...followupCompletionData, nextTime: e.target.value })} 
                            className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 outline-none font-medium bg-white"
                        >
                            {generateTimeSlots().map((time) => (<option key={time} value={time}>{time}</option>))}
                        </select>
                    </div>
                </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <button 
                type="button" 
                onClick={() => setShowFollowupCompleteModal(false)} 
                className="px-6 py-2.5 text-gray-500 font-bold hover:text-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={isCompletingFollowup} 
                className="bg-green-600 text-white px-10 py-2.5 rounded-xl font-black shadow-lg shadow-green-200 hover:bg-green-700 disabled:opacity-50 transition-all active:scale-95 flex items-center gap-2"
              >
                {isCompletingFollowup ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                {isCompletingFollowup ? 'Processing...' : 'Complete Task'}
              </button>
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
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-2 py-1 rounded">
                DEBUG: {quotationData?.itinerary?.itinerary_name ? 'DATA LOADED' : 'DATA MISSING'} | ID: {selectedProposal?.id}
              </span>
              <button onClick={() => setShowQuotationModal(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors ml-4"><X className="h-6 w-6" /></button>
            </div>
          </div>
        )}>
          <div className="p-0 overflow-y-auto max-h-[90vh] text-slate-900 bg-white shadow-2xl thin-scrollbar">
            {loadingQuotation ? (
              <div className="flex items-center justify-center py-20"><LogoLoader text="Generating Quotation..." /></div>
            ) : quotationData && (
              <div className="space-y-0 font-sans">
                {/* PDF Header: Logo & Address */}
                <div className="p-8 pb-4 flex justify-between items-start">
                  <div className="w-48">
                    {settings?.company_logo || companySettings?.company_logo ? (
                      <img src={settings?.company_logo || companySettings?.company_logo} alt="Logo" className="max-w-full h-auto" />
                    ) : (
                      <div className="text-2xl font-black text-blue-900 italic">{settings?.company_name || companySettings?.company_name || 'Your Company Name'}</div>
                    )}
                  </div>
                  <div className="text-right text-[10px] text-gray-500 max-w-xs leading-relaxed font-medium">
                    <p className="font-bold text-gray-800 text-xs mb-1">{settings?.company_name || companySettings?.company_name || 'Paradise Holidays'}</p>
                    <p>{settings?.company_address || companySettings?.company_address || 'Shimla, Himachal Pradesh, India'}</p>
                    <p>Phone: {settings?.company_phone || companySettings?.company_phone || companySettings?.phone || '+91-XXXXXXXXXX'}</p>
                    <p>Email: {settings?.company_email || companySettings?.company_email || companySettings?.email || 'info@yourcompany.com'}</p>
                  </div>
                </div>

                {/* QUOTATION Title Band */}
                <div className="bg-[#1e3a8a] text-white px-8 py-2 text-sm font-black uppercase tracking-widest flex justify-between">
                  <span>Quotation Details</span>
                  <span>Package ID: #{formatLeadId(lead?.id)}</span>
                </div>

                {/* Basic Details Table */}
                <div className="p-8">
                  <table className="w-full border-collapse border border-gray-100 text-xs">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-100 p-3 text-left font-bold text-gray-400 uppercase tracking-widest">Traveler</th>
                        <th className="border border-gray-100 p-3 text-left font-bold text-gray-400 uppercase tracking-widest">Travel Date</th>
                        <th className="border border-gray-100 p-3 text-left font-bold text-gray-400 uppercase tracking-widest">Guests</th>
                        <th className="border border-gray-100 p-3 text-left font-bold text-gray-400 uppercase tracking-widest">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-gray-100 p-4 font-black text-slate-800 uppercase">{lead?.client_name || 'N/A'}</td>
                        <td className="border border-gray-100 p-4 font-black text-slate-800 uppercase">
                          {lead?.travel_start_date ? new Date(lead.travel_start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Flexible'}
                        </td>
                        <td className="border border-gray-100 p-4 font-black text-slate-800 uppercase">{(lead?.adult || 0)} Adults, {(lead?.child || 0)} Child</td>
                        <td className="border border-gray-100 p-4 font-black text-blue-700 text-lg">
                          ₹{Number(quotationData.itinerary?.prices?.[selectedOption] || 0).toLocaleString('en-IN')}
                        </td>
                      </tr>
                      <tr>
                        <td colSpan="2" className="border border-gray-100 p-4">
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Routing</p>
                          <p className="font-extrabold text-slate-800">{quotationData.itinerary?.routing || quotationData.itinerary?.destinations || quotationData.itinerary?.destination}</p>
                        </td>
                        <td colSpan="2" className="border border-gray-100 p-4">
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Duration</p>
                          <p className="font-extrabold text-slate-800">{quotationData.itinerary?.duration} Nights / {(parseInt(quotationData.itinerary?.duration) || 0) + 1} Days</p>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Option Selector (Internal CRM feature, keeping it functional) */}
                {quotationData.hotelOptions && Object.keys(quotationData.hotelOptions).length > 1 && (
                  <div className="px-8 pb-8 flex gap-2">
                    {Object.keys(quotationData.hotelOptions).sort((a, b) => parseInt(a) - parseInt(b)).map((optionNum) => (
                      <button key={optionNum} onClick={() => setSelectedOption(optionNum)} className={`px-5 py-2 rounded-lg text-[10px] font-black tracking-widest uppercase transition-all ${selectedOption === optionNum ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>Version {optionNum}</button>
                    ))}
                  </div>
                )}

                {/* DETAILED ITINERARY Title Band */}
                <div className="bg-[#1e3a8a] text-white px-8 py-3 text-sm font-black uppercase tracking-widest">
                  Detailed Itinerary
                </div>

                {/* ITINERARY CONTENT */}
                <div className="p-8 space-y-12 relative">
                  <div className="absolute left-[39px] top-8 bottom-8 w-px bg-blue-100 border-l border-dashed border-blue-200" />

                  {quotationData.itinerary?.day_events && Object.keys(quotationData.itinerary.day_events).length > 0 ? (
                    Object.keys(quotationData.itinerary.day_events).sort((a, b) => parseInt(a) - parseInt(b)).map((dayNum) => {
                      const dayEvents = quotationData.itinerary.day_events[dayNum] || [];
                      return (
                        <div key={dayNum} className="relative pl-12 space-y-6">
                          {/* Day Bubble */}
                          <div className="absolute left-[-15px] top-0 w-8 h-8 rounded-full bg-blue-900 border-4 border-white shadow-md z-10 flex items-center justify-center text-white text-[10px] font-black">
                            {dayNum}
                          </div>

                          <div className="flex justify-between items-center mb-4 border-b border-gray-50 pb-2">
                            <h4 className="text-lg font-black text-blue-900 uppercase">Day {dayNum} Explorer</h4>
                            <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">{quotationData.itinerary?.itinerary_name}</span>
                          </div>

                          <div className="space-y-10">
                            {dayEvents.map((event, eIdx) => {
                              const eType = (event.eventType || '').toLowerCase();
                              const canShowEvent = eType !== 'accommodation' || (eType === 'accommodation' && event.hotelOptions?.some(opt => opt.optionNumber?.toString() === selectedOption?.toString()));
                              if (!canShowEvent) return null;

                              return (
                                <div key={eIdx} className="flex flex-col md:flex-row gap-6 items-start group">
                                  {/* Text Section (Left) */}
                                  <div className="flex-1 space-y-2">
                                    <div className="flex items-center gap-2">
                                      <span className="text-blue-600">{getEventIcon(event.eventType)}</span>
                                      <h5 className="font-black text-blue-800 text-sm uppercase">{event.subject || event.eventType}</h5>
                                    </div>
                                    <p className="text-xs text-gray-600 leading-relaxed font-medium whitespace-pre-wrap">
                                      {event.details || 'Your day will be filled with exploration and discovery at your own pace.'}
                                    </p>
                                    <div className="flex flex-wrap gap-2 pt-2">
                                      {event.startTime && (
                                        <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-full flex items-center gap-1">
                                          <Clock className="w-3 h-3" /> {event.startTime} {event.endTime && `- ${event.endTime}`}
                                        </span>
                                      )}
                                      {event.eventType === 'meal' && <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-full uppercase">Meal Included</span>}
                                    </div>
                                  </div>
                                  {/* Image Section (Right) */}
                                  <div className="w-full md:w-56 h-36 rounded-2xl overflow-hidden shadow-inner border border-gray-100 flex-shrink-0 bg-gray-50">
                                    {event.image ? (
                                      <img src={getDisplayImageUrl(event.image) || event.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="Ev" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-gray-200 italic text-[10px] uppercase font-black">{dayNum} IMG</div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-20 text-center space-y-4">
                       <div className="text-gray-300 italic">Itinerary details are currently unavailable for this version.</div>
                       <div className="text-blue-500 text-[10px] font-bold">Try removing and re-adding this itinerary to sync fresh data.</div>
                       <div className="bg-gray-50 p-4 rounded-xl max-w-lg mx-auto border border-gray-100">
                          <h6 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 text-left">Debug Info (Data Present)</h6>
                          <div className="text-[10px] text-gray-400 font-mono text-left space-y-1">
                             <div>Keys: {Object.keys(quotationData.itinerary || {}).join(', ')}</div>
                             <div>Day Events: {typeof quotationData.itinerary?.day_events} (Keys: {Object.keys(quotationData.itinerary?.day_events || {}).length})</div>
                             <div>Inclusions: {quotationData.policies?.inclusions?.length || 0}</div>
                             <div>Exclusions: {quotationData.policies?.exclusions?.length || 0}</div>
                             <div>SelProp ID: {selectedProposal?.id} | ItinID: {selectedProposal?.itinerary_id}</div>
                             <div>API ID: {quotationData.debug?.apiId} | AltID: {quotationData.debug?.altId}</div>
                             <div className="text-[8px] opacity-50 overflow-hidden whitespace-nowrap text-ellipsis">
                               LS Keys: {Object.keys(localStorage).filter(k => k.startsWith('itinerary_')).sort().slice(0, 5).join(', ')}
                             </div>
                             {quotationData.debug?.error && (
                               <div className="text-red-500 font-bold whitespace-normal">
                                 ERROR: {quotationData.debug.error}
                               </div>
                             )}
                          </div>
                       </div>
                    </div>
                  )}
                </div>

                {/* TERMS & CONDITIONS Title Band */}
                <div className="bg-[#1e3a8a] text-white px-8 py-3 text-sm font-black uppercase tracking-widest">
                  Terms & Conditions
                </div>

                <div className="p-8 space-y-8">
                  {/* Inclusions & Exclusions - Side by Side */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="border border-emerald-200 bg-emerald-50/20 rounded-xl p-6">
                      <h5 className="font-black text-emerald-800 text-[10px] uppercase tracking-widest mb-4 pb-2 border-b border-emerald-100">Inclusions</h5>
                      <ul className="space-y-2">
                        {quotationData.policies?.inclusions?.map((item, i) => (
                          <li key={i} className="flex gap-2 items-start text-[11px] font-semibold text-gray-600">
                            <span className="text-emerald-500 mt-0.5">✓</span> {item}
                          </li>
                        )) || <li className="text-gray-300 text-[10px] italic">Not Specified</li>}
                      </ul>
                    </div>
                    <div className="border border-red-200 bg-red-50/20 rounded-xl p-6">
                      <h5 className="font-black text-red-800 text-[10px] uppercase tracking-widest mb-4 pb-2 border-b border-red-100">Exclusions</h5>
                      <ul className="space-y-2">
                        {quotationData.policies?.exclusions?.map((item, i) => (
                          <li key={i} className="flex gap-2 items-start text-[11px] font-semibold text-gray-600">
                            <span className="text-red-400 mt-0.5">✕</span> {item}
                          </li>
                        )) || <li className="text-gray-300 text-[10px] italic">Not Specified</li>}
                      </ul>
                    </div>
                  </div>

                  {/* Other Policies List */}
                  <div className="space-y-8 pt-4">
                    {[
                      { title: 'Payment Policy', content: quotationData.policies?.paymentPolicy },
                      { title: 'Refund & Cancellation Policy', content: quotationData.policies?.refund_policy || quotationData.policies?.cancellationPolicy },
                      { title: 'Company Policy & Terms', content: quotationData.policies?.terms_conditions || quotationData.policies?.termsConditions },
                      { title: 'Critical Remarks', content: quotationData.policies?.remarks }
                    ].map((sec, idx) => sec.content ? (
                      <div key={idx} className="space-y-3">
                        <h6 className="text-[10px] font-black text-blue-900 border-b border-blue-50 pb-2 uppercase tracking-widest">{sec.title}</h6>
                        <div className="text-[11px] text-gray-500 leading-relaxed font-medium whitespace-pre-wrap pl-2 border-l-2 border-gray-50">
                          {sec.content}
                        </div>
                      </div>
                    ) : null)}
                  </div>
                </div>

                {/* HOTEL SUMMARY Title Band */}
                <div className="bg-[#1e3a8a] text-white px-8 py-3 text-sm font-black uppercase tracking-widest">
                  Accommodation Summary
                </div>

                <div className="p-8 space-y-6">
                  {quotationData.hotelOptions[selectedOption]?.map((hotel, idx) => (
                    <div key={idx} className="flex gap-6 pb-6 border-b border-gray-50 last:border-0 group">
                      <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-gray-50 border border-gray-100">
                        {hotel.image ? (
                          <img src={getDisplayImageUrl(hotel.image) || hotel.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="H" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] font-black text-gray-200">HOTEL</div>
                        )}
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex justify-between items-start">
                          <h5 className="font-black text-sm text-slate-800 uppercase leading-snug">{hotel.hotelName}</h5>
                          <span className="text-[10px] font-black bg-blue-50 text-blue-600 px-3 py-1 rounded-full border border-blue-100 uppercase">Night {hotel.day}</span>
                        </div>
                        <div className="flex gap-6 text-[10px] font-bold text-gray-400">
                          <div><span className="uppercase block text-[8px] mb-0.5 tracking-widest">Category</span><span className="text-gray-600">{hotel.category} Star</span></div>
                          <div><span className="uppercase block text-[8px] mb-0.5 tracking-widest">Room Type</span><span className="text-gray-600">{hotel.roomName || 'N/A'}</span></div>
                          <div><span className="uppercase block text-[8px] mb-0.5 tracking-widest">Meal Plan</span><span className="text-gray-600">{hotel.mealPlan || 'EP'}</span></div>
                          <div><span className="uppercase block text-[8px] mb-0.5 tracking-widest">Location</span><span className="font-black text-blue-600">{hotel.location || 'N/A'}</span></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* PRICE BANNER - MATCHING PDF */}
                <div className="px-8 pb-12">
                  <div className="bg-[#1e3a8a] text-center py-5 rounded-xl shadow-xl border-4 border-blue-800">
                    <h4 className="text-2xl font-black text-[#fbbf24] tracking-tight uppercase">
                      Total Package Cost: INR {Number(quotationData.itinerary?.prices?.[selectedOption] || 0).toLocaleString('en-IN')}
                    </h4>
                  </div>
                </div>

                {/* PDF Dark Footer */}
                <div className="bg-[#0f172a] text-white p-12 text-center space-y-6">
                  <p className="text-xs font-bold text-gray-400 opacity-80 leading-relaxed uppercase tracking-[.2em]">
                    This is a computer generated quotation & doesn't require signature. All bookings are subject to availability.
                  </p>
                  <div className="space-y-2">
                    <h5 className="text-2xl font-black text-[#fbbf24] tracking-tight">Thank you for choosing {settings?.company_name || 'our services'}!</h5>
                    <p className="text-gray-300 font-bold uppercase tracking-widest text-[10px]">Where your travel dreams meet professional reality.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Dialog>



        <Dialog visible={showPaymentModal} style={{ width: '450px' }} onHide={() => setShowPaymentModal(false)} showCloseIcon={false} header={() => (
          <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-xl font-bold text-gray-800">Add Payment</h2>
            <button type="button" onClick={() => setShowPaymentModal(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"><X className="h-6 w-6" /></button>
          </div>
        )}>
          <form onSubmit={handleAddPayment} className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Package Cost</label>
                <input type="number" step="0.01" required value={paymentFormData.amount} onChange={(e) => setPaymentFormData({ ...paymentFormData, amount: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" placeholder="Enter total amount" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount Paid Now</label>
                <input type="number" step="0.01" value={paymentFormData.paid_amount} onChange={(e) => setPaymentFormData({ ...paymentFormData, paid_amount: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500 font-bold text-green-700" placeholder="Enter paid amount" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Next Due Date (If any balance)</label>
              <input type="date" value={paymentFormData.due_date} onChange={(e) => setPaymentFormData({ ...paymentFormData, due_date: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Receipt / Screenshot (Optional)</label>
              <div className="mt-1 flex items-center justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-blue-400 transition-colors">
                <div className="space-y-1 text-center">
                  <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label htmlFor="payment-receipt" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500">
                      <span>Upload a file</span>
                      <input id="payment-receipt" name="payment-receipt" type="file" accept="image/*" className="sr-only" onChange={(e) => setPaymentFormData({ ...paymentFormData, receipt: e.target.files[0] })} />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                  {paymentFormData.receipt && (
                    <p className="text-xs font-bold text-green-600 mt-2 flex items-center justify-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> {paymentFormData.receipt.name}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button type="button" onClick={() => setShowPaymentModal(false)} className="px-4 py-2 text-gray-600">Cancel</button>
              <button type="submit" disabled={addingPayment} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold shadow-md hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50">
                {addingPayment ? (
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin" /> Adding...
                  </div>
                ) : 'Add Payment'}
              </button>
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
          <form onSubmit={handleSaveLeadDetails} className="p-8 space-y-6">
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
              <button onClick={() => { setShowPdfPriceOptionModal(false); handleDownloadSingleOptionPdf(pdfDownloadParams.optionNum, pdfDownloadParams.quotationDataOverride, pdfDownloadParams.itineraryIdForPricing, true, false, null, pdfDownloadParams.forcedPrice); }} className="py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg shadow-blue-100 transition-all active:scale-95">WITH PRICE</button>
              <button onClick={() => { setShowPdfPriceOptionModal(false); handleDownloadSingleOptionPdf(pdfDownloadParams.optionNum, pdfDownloadParams.quotationDataOverride, pdfDownloadParams.itineraryIdForPricing, false, false, null, pdfDownloadParams.forcedPrice); }} className="py-4 bg-white border-2 border-gray-100 text-gray-500 rounded-2xl font-black transition-all active:scale-95">WITHOUT</button>
            </div>
          </div>
        </Dialog>

        {/* ===== HOTEL MANAGER MODAL ===== */}
        {showHotelManagerModal && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-lg"><Building2 className="h-5 w-5 text-blue-600" /></div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-800">Manage Hotel Check-in / Check-out</h2>
                    <p className="text-xs text-gray-500">Update hotel dates and details directly from here</p>
                  </div>
                </div>
                <button onClick={() => setShowHotelManagerModal(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><X className="h-5 w-5 text-gray-500" /></button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                {loadingHotelManager ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-500 text-sm">Loading hotels...</p>
                  </div>
                ) : hotelManagerData.length === 0 ? (
                  <div className="text-center py-16 text-gray-400">
                    <Building2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p className="font-semibold">No hotels found in this itinerary</p>
                    <p className="text-sm mt-1">Add accommodation events in the itinerary editor first</p>
                  </div>
                ) : (
                  hotelManagerData.map((hotel, idx) => (
                    <div key={idx} className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
                      {/* Hotel header */}
                      <div className="flex items-center gap-3">
                        {hotel.image ? (
                          <img src={hotel.image} alt={hotel.hotelName} className="w-14 h-14 rounded-lg object-cover border border-gray-200 flex-shrink-0" />
                        ) : (
                          <div className="w-14 h-14 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <Building2 className="h-7 w-7 text-blue-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold bg-blue-600 text-white px-2 py-0.5 rounded-full">Day {hotel.dayNum}</span>
                            {hotel.category && <span className="text-xs text-yellow-600 font-semibold">{hotel.category}★</span>}
                          </div>
                          <h4 className="font-bold text-gray-800 text-sm mt-0.5 truncate">{hotel.hotelName}</h4>
                        </div>
                      </div>

                      {/* Editable fields */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Check-in Date</label>
                          <input
                            type="date"
                            value={hotel.checkIn || ''}
                            min={lead?.travel_start_date || ''}
                            max={lead?.travel_end_date || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (!val) return;
                              const baseDay = hotelManagerData[idx].dayNum;
                              const baseDate = new Date(val + 'T00:00:00');
                              
                              const updated = hotelManagerData.map(h => {
                                const diff = h.dayNum - baseDay;
                                const dIn = new Date(baseDate);
                                dIn.setDate(dIn.getDate() + diff);
                                const dOut = new Date(dIn);
                                dOut.setDate(dOut.getDate() + 1);
                                return {
                                  ...h,
                                  checkIn: dIn.toISOString().split('T')[0],
                                  checkOut: dOut.toISOString().split('T')[0]
                                };
                              });
                              setHotelManagerData(updated);
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Check-out Date</label>
                          <input
                            type="date"
                            value={hotel.checkOut || ''}
                            min={hotel.checkIn || lead?.travel_start_date || ''}
                            max={lead?.travel_end_date || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (!val) return;
                              const updated = [...hotelManagerData];
                              updated[idx] = { ...updated[idx], checkOut: val };
                              
                              // If check-out is changed, it only affects the NEXT hotel's check-in
                              // but for simplicity and since user wants "auto add", we can shift everything after
                              const nextDay = new Date(val + 'T00:00:00');
                              let currentIn = val;
                              for (let i = idx + 1; i < updated.length; i++) {
                                updated[i].checkIn = currentIn;
                                const dOut = new Date(currentIn + 'T00:00:00');
                                dOut.setDate(dOut.getDate() + 1);
                                const nextOut = dOut.toISOString().split('T')[0];
                                updated[i].checkOut = nextOut;
                                currentIn = nextOut;
                              }
                              setHotelManagerData(updated);
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Room Type</label>
                          <select
                            value={hotel.roomName || ''}
                            onChange={(e) => {
                              const updated = [...hotelManagerData];
                              updated[idx] = { ...updated[idx], roomName: e.target.value };
                              setHotelManagerData(updated);
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                          >
                            <option value="">Select Room Type</option>
                            {roomTypes.map(rt => (
                              <option key={rt.id} value={rt.name}>{rt.name}</option>
                            ))}
                            {hotel.roomName && !roomTypes.find(rt => rt.name === hotel.roomName) && (
                              <option value={hotel.roomName}>{hotel.roomName}</option>
                            )}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Meal Plan</label>
                          <select
                            value={hotel.mealPlan || ''}
                            onChange={(e) => {
                              const updated = [...hotelManagerData];
                              updated[idx] = { ...updated[idx], mealPlan: e.target.value };
                              setHotelManagerData(updated);
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                          >
                            <option value="">Select Meal Plan</option>
                            <option value="CP">CP (Breakfast)</option>
                            <option value="MAP">MAP (Breakfast + Dinner)</option>
                            <option value="AP">AP (All Meals)</option>
                            <option value="EP">EP (No Meals)</option>
                          </select>
                        </div>

                        <div className="flex-1 min-w-[120px]">
                          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Room Count</label>
                          <input
                            type="number"
                            min="1"
                            value={hotel.roomCount}
                            onChange={(e) => {
                              const updated = [...hotelManagerData];
                              updated[idx].roomCount = parseInt(e.target.value) || 1;
                              setHotelManagerData(updated);
                            }}
                            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                          />
                        </div>
                        <div className="flex-1 min-w-[120px]">
                          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Booking Status</label>
                          <select
                            value={hotel.status || 'Pending'}
                            onChange={(e) => {
                              const updated = [...hotelManagerData];
                              updated[idx].status = e.target.value;
                              setHotelManagerData(updated);
                            }}
                            className={`w-full bg-white border rounded-lg px-3 py-2 text-sm focus:ring-2 outline-none transition-all ${hotel.status === 'Confirmed' ? 'border-green-300 bg-green-50 text-green-700 font-bold' :
                              hotel.status === 'Inquiry Sent' ? 'border-blue-300 bg-blue-50 text-blue-700 font-bold' :
                                hotel.status === 'Cancelled' ? 'border-red-300 bg-red-50 text-red-700 font-bold' : 'border-gray-200'
                              }`}
                          >
                            <option value="Pending">Pending</option>
                            <option value="Inquiry Sent">Inquiry Sent</option>
                            <option value="Confirmed">Confirmed</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </div>
                      </div>
                      {/* Nights calculation */}
                      {hotel.checkIn && hotel.checkOut && (
                        <p className="text-xs text-blue-600 font-semibold">
                          Nights: {Math.max(0, Math.round((new Date(hotel.checkOut) - new Date(hotel.checkIn)) / (1000 * 60 * 60 * 24)))}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              {!loadingHotelManager && hotelManagerData.length > 0 && (
                <div className="px-6 py-4 border-t border-gray-100 flex flex-wrap gap-3 items-center justify-between">
                  <button
                    onClick={() => {
                      const startDate = lead?.travel_start_date;
                      if (!startDate) return;
                      const updated = hotelManagerData.map(hotel => {
                        const dIn = new Date(startDate);
                        dIn.setDate(dIn.getDate() + (hotel.dayNum - 1));
                        const dOut = new Date(startDate);
                        dOut.setDate(dOut.getDate() + hotel.dayNum);
                        return {
                          ...hotel,
                          checkIn: dIn.toISOString().split('T')[0],
                          checkOut: dOut.toISOString().split('T')[0]
                        };
                      });
                      setHotelManagerData(updated);
                      showToastNotification('info', 'Dates Reset', 'All hotel dates have been reset based on the travel start date.');
                    }}
                    className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg text-sm font-bold transition-all flex items-center gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Reset to Itinerary Dates
                  </button>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowHotelManagerModal(false)}
                      className="px-5 py-2.5 border border-gray-300 text-gray-600 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      disabled={savingHotelManager}
                      onClick={async () => {
                        if (isLeadLocked) {
                          showToastNotification('warning', 'Lead Locked', 'This booking is locked. Please request approval from your manager to edit.');
                          return;
                        }
                        setSavingHotelManager(true);
                        try {
                          const itId = hotelManagerData[0]?.itineraryId;
                          if (!itId) return;
                          const isProposalRecord = !!hotelManagerData[0]?.lead_id || !!lead?.id;
                          const pkgRes = isProposalRecord ? await leadProposalsAPI.get(itId) : await packagesAPI.get(itId);
                          const latestPkg = pkgRes?.data?.data;
                          const dayEvts = JSON.parse(JSON.stringify(latestPkg?.day_events || {}));

                          hotelManagerData.forEach(hotel => {
                            const dayEvtArr = dayEvts[hotel.dayNum.toString()];
                            if (!dayEvtArr) return;
                            const accEvent = dayEvtArr.find(e => (e.eventType || '').toLowerCase() === 'accommodation');
                            if (!accEvent || !accEvent.hotelOptions) return;
                            const optToUpdate = accEvent.hotelOptions[hotel.optIndex] || accEvent.hotelOptions.find(o => o.hotelName === hotel.hotelName);
                            if (optToUpdate) {
                              optToUpdate.checkIn = hotel.checkIn;
                              optToUpdate.checkOut = hotel.checkOut;
                              optToUpdate.roomName = hotel.roomName;
                              optToUpdate.mealPlan = hotel.mealPlan;
                              optToUpdate.roomCount = hotel.roomCount;
                              optToUpdate.rooms = hotel.roomCount;
                              optToUpdate.status = hotel.status;
                            }
                          });

                          if (isProposalRecord) {
                            await leadProposalsAPI.update(itId, { day_events: dayEvts });
                          } else {
                            await packagesAPI.update(itId, { day_events: dayEvts });
                          }
                          showToastNotification('success', 'Saved!', 'Hotel details updated successfully');
                          loadHotelsFromAllProposals();
                          setShowHotelManagerModal(false);
                        } catch (e) {
                          showToastNotification('error', 'Save Failed', 'Could not save hotel details. Please try again.');
                        } finally {
                          setSavingHotelManager(false);
                        }
                      }}
                      className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {savingHotelManager ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Saving...
                        </>
                      ) : (
                        'Save All Hotels'
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Unlock Request Modal */}
        <Dialog visible={showUnlockRequestModal} style={{ width: '450px' }} onHide={() => setShowUnlockRequestModal(false)} header="Request Edit Permission">
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-100 rounded-xl">
              <Info className="h-5 w-5 text-amber-600" />
              <p className="text-sm text-amber-800">
                This query is **Booked** and currently locked for editing. Please provide a reason to request temporary access from your manager.
              </p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Reason for Editing</label>
              <textarea
                value={unlockReason}
                onChange={(e) => setUnlockReason(e.target.value)}
                placeholder="e.g. Need to update flight timings / Change in pax details requested by client..."
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none h-32 text-sm"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowUnlockRequestModal(false)} className="px-4 py-2 text-gray-600 font-medium">Cancel</button>
              <button
                onClick={handleRequestUnlock}
                disabled={isSubmittingUnlock}
                className="px-6 py-2 bg-amber-600 text-white rounded-xl font-bold shadow-lg hover:bg-amber-700 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmittingUnlock ? <RefreshCw className="animate-spin h-4 w-4" /> : <Send className="h-4 w-4" />}
                Send Request
              </button>
            </div>
          </div>
        </Dialog>

        {/* Handle Unlock Modal (Manager View) */}
        <Dialog visible={showUnlockHandleModal} style={{ width: '450px' }} onHide={() => setShowUnlockHandleModal(false)} header="Review Unlock Request">
          <div className="p-4 space-y-4">
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Requester Reason</label>
              <p className="text-gray-800 text-sm whitespace-pre-wrap font-medium italic">
                "{lead.unlock_request_reason || 'No reason provided.'}"
              </p>
            </div>
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => handleApproveRejectUnlock('reject')}
                disabled={isSubmittingUnlock}
                className="flex-1 py-3 px-4 border border-red-200 text-red-600 font-bold rounded-xl hover:bg-red-50 transition-all disabled:opacity-50"
              >
                Reject
              </button>
              <button
                onClick={() => handleApproveRejectUnlock('approve')}
                disabled={isSubmittingUnlock}
                className="flex-1 py-3 px-4 bg-green-600 text-white font-bold rounded-xl shadow-lg hover:bg-green-700 transition-all shadow-green-100 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmittingUnlock ? <RefreshCw className="animate-spin h-4 w-4" /> : <CheckCircle size={18} />}
                Approve & Unlock
              </button>
            </div>
          </div>
        </Dialog>

      </>
    )}
  </div>
);
};

export default LeadDetails;


