import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { getDisplayImageUrl } from '../utils/imageUrl';
import { packagesAPI, dayItinerariesAPI, hotelsAPI, activitiesAPI, settingsAPI, destinationsAPI, itineraryPricingAPI, transfersAPI, mealPlansAPI } from '../services/api';
import { searchPexelsPhotos } from '../services/pexels';
import { ArrowLeft, Camera, Edit, Plus, ChevronRight, FileText, Search, X, Bed, Image as ImageIcon, Car, FileText as PassportIcon, UtensilsCrossed, Plane, User, Ship, Star, Calendar, Hash, Building2, Upload } from 'lucide-react';
import PricingTab from '../components/PricingTab';
import FinalTab from '../components/FinalTab';

// Helper for checking permissions
const hasPermission = (user, permission) => {
  if (!user) return false;
  // Super Admin bypass
  if (user.is_super_admin) return true;
  // Check granular permission
  if (user.permissions && user.permissions.includes(permission)) return true;
  return false;
};

const ItineraryDetail = () => {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const fromLeadId = location.state?.fromLeadId || searchParams.get('fromLead');
  const [itinerary, setItinerary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('build');
  const [dayItineraries, setDayItineraries] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [dayDetails, setDayDetails] = useState('');
  const [showDayDetailsModal, setShowDayDetailsModal] = useState(false);
  const [dayDetailsForm, setDayDetailsForm] = useState({
    subject: '',
    details: '',
    image: null,
    eventType: '',
    id: null, // For editing existing events
    // Common fields
    destination: '',
    type: 'Manual',
    name: '',
    date: '',
    startTime: '1:00 PM',
    endTime: '2:00 PM',
    showTime: false,
    // Accommodation specific fields
    hotelOptions: [], // Array of hotel options
    editingOptionIndex: null, // For editing a specific option
    // Current option being edited
    hotelName: '',
    hotel_id: null, // Hotel ID from database for email lookup
    category: '1',
    roomName: '',
    mealPlan: '',
    single: '',
    double: '',
    triple: '',
    quad: '',
    cwb: '',
    cnb: '',
    checkIn: '',
    checkInTime: '2:00 PM',
    checkOut: '',
    checkOutTime: '11:00',
    // Masters Hotel form fields (for Add Manual)
    hotel_details: '',
    hotel_photo: null,
    contact_person: '',
    email: '',
    phone: '',
    hotel_address: '',
    hotel_link: '',
    status: 'active',
    // Activity Masters form
    activity_details: '',
    activity_photo: null,
    // Transportation Masters form (transfer)
    transfer_details: '',
    transfer_photo: null,
    // Transportation specific
    transferType: 'Private',
    // Meal specific
    mealType: 'Breakfast'
  });
  const [eventImagePreview, setEventImagePreview] = useState(null);
  const [hotelPhotoPreview, setHotelPhotoPreview] = useState(null);
  const [dayItineraryImageSource, setDayItineraryImageSource] = useState('upload'); // 'upload' | 'library'
  const [showDayItineraryImageModal, setShowDayItineraryImageModal] = useState(false);
  const [dayItineraryLibraryPackages, setDayItineraryLibraryPackages] = useState([]);
  const [dayItineraryLibrarySearchTerm, setDayItineraryLibrarySearchTerm] = useState('');
  const [dayItineraryLibraryTab, setDayItineraryLibraryTab] = useState('free');
  const [dayItineraryFreeStockPhotos, setDayItineraryFreeStockPhotos] = useState([]);
  const [dayItineraryFreeStockLoading, setDayItineraryFreeStockLoading] = useState(false);
  const [dayItineraryLibraryLoading, setDayItineraryLibraryLoading] = useState(false);
  const [showEventTypeDropdown, setShowEventTypeDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const [dayEvents, setDayEvents] = useState({}); // Store events by day number
  const [showCoverPhotoModal, setShowCoverPhotoModal] = useState(false);
  const [coverPhotoSource, setCoverPhotoSource] = useState('upload'); // 'upload' or 'unsplash'
  const [unsplashImages, setUnsplashImages] = useState([]);
  const [unsplashSearchTerm, setUnsplashSearchTerm] = useState('travel');
  const [unsplashLoading, setUnsplashLoading] = useState(false);
  const [coverPhotoFile, setCoverPhotoFile] = useState(null);
  const [coverPhotoPreview, setCoverPhotoPreview] = useState(null);
  const [hotelSearchResults, setHotelSearchResults] = useState([]);
  const [hotelSearchLoading, setHotelSearchLoading] = useState(false);
  const [showHotelSearch, setShowHotelSearch] = useState(false);
  const [searchType, setSearchType] = useState('day-itinerary'); // 'day-itinerary' or 'hotel'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDestination, setSelectedDestination] = useState('');
  const [filterType, setFilterType] = useState('all'); // Filter for day itineraries by type
  const [categoryType, setCategoryType] = useState('day-itinerary'); // Category dropdown: day-itinerary, accommodation, activity, etc.
  const [activities, setActivities] = useState([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [dataSourceTab, setDataSourceTab] = useState('database'); // 'database', 'manual', 'api'
  const [showManualAddModal, setShowManualAddModal] = useState(false);
  const [showApiSearchModal, setShowApiSearchModal] = useState(false);
  const [storedHotels, setStoredHotels] = useState([]);
  const [storedHotelsLoading, setStoredHotelsLoading] = useState(false);
  const [storedTransfers, setStoredTransfers] = useState([]);
  const [storedTransfersLoading, setStoredTransfersLoading] = useState(false);
  const [mealPlans, setMealPlans] = useState([]);
  const [mealPlansLoading, setMealPlansLoading] = useState(false);
  const [apiSearchForm, setApiSearchForm] = useState({
    city: '',
    checkIn: '',
    checkOut: '',
    checkInTime: '2:00 PM',
    checkOutTime: '11:00',
    rooms: 1,
    guests: 2
  });
  const [expandedHotelId, setExpandedHotelId] = useState(null);
  const [hotelRooms, setHotelRooms] = useState({});
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [maxHotelOptions, setMaxHotelOptions] = useState(4); // Default to 4
  const [packageTerms, setPackageTerms] = useState({
    terms_conditions: '',
    refund_policy: '',
    package_description: ''
  });
  const [pricingData, setPricingData] = useState({}); // Store pricing for each option
  const [finalClientPrices, setFinalClientPrices] = useState({}); // Final client prices for each option
  const [baseMarkup, setBaseMarkup] = useState(0); // Base markup percentage
  const [extraMarkup, setExtraMarkup] = useState(0); // Extra markup amount
  const [gstOnTotal, setGstOnTotal] = useState(0); // GST percentage
  const [cgst, setCgst] = useState(0);
  const [sgst, setSgst] = useState(0);
  const [igst, setIgst] = useState(0);
  const [tcs, setTcs] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [optionGstSettings, setOptionGstSettings] = useState({});
  const [days, setDays] = useState([]);

  useEffect(() => {
    fetchItinerary();
    fetchDayItineraries();
    fetchDestinations();
    loadEventsFromStorage();
    fetchMaxHotelOptions();
    loadPricingFromServer();
  }, [id]);

  const loadPricingFromServer = async () => {
    try {
      const response = await itineraryPricingAPI.get(id);
      if (response.data?.success && response.data.data) {
        const data = response.data.data;
        if (data.pricing_data) setPricingData(data.pricing_data);
        if (data.final_client_prices) setFinalClientPrices(data.final_client_prices);
        if (data.option_gst_settings) setOptionGstSettings(data.option_gst_settings);
        if (data.base_markup !== undefined && data.base_markup !== null) setBaseMarkup(Number(data.base_markup));
        if (data.extra_markup !== undefined && data.extra_markup !== null) setExtraMarkup(Number(data.extra_markup));
        if (data.cgst !== undefined && data.cgst !== null) setCgst(Number(data.cgst));
        if (data.sgst !== undefined && data.sgst !== null) setSgst(Number(data.sgst));
        if (data.igst !== undefined && data.igst !== null) setIgst(Number(data.igst));
        if (data.tcs !== undefined && data.tcs !== null) setTcs(Number(data.tcs));
        if (data.discount !== undefined && data.discount !== null) setDiscount(Number(data.discount));
      }
    } catch (error) {
      console.error('Failed to load pricing from server', error);
    }
  };

  const fetchMaxHotelOptions = async () => {
    try {
      const response = await settingsAPI.getMaxHotelOptions();
      if (response.data.success && response.data.data?.max_hotel_options) {
        setMaxHotelOptions(response.data.data.max_hotel_options);
      }
    } catch (error) {
      // Default to 4 if settings endpoint fails
    }
  };

  // Initialize pricing data from hotel options when events are loaded
  useEffect(() => {
    const newPricingData = {};
    Object.keys(dayEvents).forEach(day => {
      const events = dayEvents[day] || [];
      events.forEach(event => {
        if (event.eventType === 'accommodation' && event.hotelOptions && event.hotelOptions.length > 0) {
          event.hotelOptions.forEach((option, idx) => {
            const optionKey = `${option.optionNumber || 1}-${day}-${idx}`;
            // Check if pricing already exists, otherwise initialize
            if (!pricingData[optionKey]) {
              const defaultNet = parseFloat(option.price) || 0;
              newPricingData[optionKey] = {
                net: defaultNet,
                markup: 0,
                gross: defaultNet
              };
            }
          });
        }
      });
    });
    if (Object.keys(newPricingData).length > 0) {
      setPricingData(prev => ({ ...prev, ...newPricingData }));
    }
  }, [dayEvents]);

  // Add options to proposals – only options that exist in dayEvents (same as Final tab)
  const handleAddOptionsToProposals = () => {
    const optionNumbersFromEvents = new Set();
    Object.keys(dayEvents || {}).forEach(day => {
      (dayEvents[day] || []).forEach(event => {
        if (event.eventType === 'accommodation' && event.hotelOptions && event.hotelOptions.length > 0) {
          event.hotelOptions.forEach((option) => {
            const optNum = option.optionNumber ?? 1;
            const optNumInt = parseInt(optNum, 10);
            if (optNumInt >= 1 && optNumInt <= maxHotelOptions) optionNumbersFromEvents.add(optNumInt);
          });
        }
      });
    });
    const sortedOptionNumbers = Array.from(optionNumbersFromEvents).sort((a, b) => a - b);

    if (sortedOptionNumbers.length === 0) {
      toast.warning('No hotel options found in this itinerary. Please add accommodation options first.');
      return;
    }

    const proposals = sortedOptionNumbers.map(optNum => {
      let totalGross = 0;
      Object.keys(pricingData || {}).forEach(key => {
        const [keyOpt] = key.split('-');
        if (parseInt(keyOpt, 10) === optNum) {
          totalGross += (pricingData[key]?.gross || 0);
        }
      });
      const settings = (optionGstSettings && optionGstSettings[optNum]) || {
        cgst, sgst, igst, tcs, discount
      };

      const cgstAmt = (totalGross * (settings.cgst || 0)) / 100;
      const sgstAmt = (totalGross * (settings.sgst || 0)) / 100;
      const igstAmt = (totalGross * (settings.igst || 0)) / 100;
      const tcsAmt = (totalGross * (settings.tcs || 0)) / 100;
      const discountAmt = (totalGross * (settings.discount || 0)) / 100;
      const calculatedTotal = totalGross + cgstAmt + sgstAmt + igstAmt + tcsAmt - discountAmt;

      const finalPrice = finalClientPrices[String(optNum)] !== undefined && finalClientPrices[String(optNum)] !== null
        ? parseFloat(finalClientPrices[String(optNum)]) || calculatedTotal
        : (finalClientPrices[optNum] !== undefined && finalClientPrices[optNum] !== null ? parseFloat(finalClientPrices[optNum]) : null) ?? calculatedTotal;

      const hotelDetails = [];
      Object.keys(dayEvents || {}).forEach(day => {
        (dayEvents[day] || []).forEach(event => {
          if (event.eventType === 'accommodation' && event.hotelOptions) {
            event.hotelOptions.forEach((option, idx) => {
              if (option.optionNumber === optNum) {
                hotelDetails.push({
                  ...option,
                  day: parseInt(day),
                  pricing: pricingData[`${optNum}-${day}-${idx}`]
                });
              }
            });
          }
        });
      });

      return {
        id: Date.now() + optNum,
        optionNumber: optNum,
        itinerary_id: parseInt(id),
        itinerary_name: itinerary?.itinerary_name || 'Itinerary',
        destination: itinerary?.destinations || '',
        duration: itinerary?.duration || 0,
        price: finalPrice,
        website_cost: finalPrice,
        hotelDetails,
        pricing: {
          baseMarkup,
          extraMarkup,
          ...settings,
          finalClientPrice: finalPrice,
          totalGross,
          totalTax: cgstAmt + sgstAmt + igstAmt + tcsAmt,
          discountAmount: discountAmt
        },
        image: itinerary?.image || null,
        inserted_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      };
    });

    localStorage.setItem(`itinerary_${id}_proposals`, JSON.stringify(proposals));
    toast.success(`Successfully saved ${proposals.length} option(s).`);
  };

  // Auto-save options to itinerary_*_proposals – only options that exist in dayEvents (same as Final tab), so Query shows same count and prices as itinerary
  const syncOptionsToProposalsStorage = () => {
    if (!id || !itinerary) return;
    // Collect distinct option numbers from dayEvents (accommodation hotelOptions), same as FinalTab – not from pricingData
    const optionNumbersFromEvents = new Set();
    Object.keys(dayEvents || {}).forEach(day => {
      (dayEvents[day] || []).forEach(event => {
        if (event.eventType === 'accommodation' && event.hotelOptions && event.hotelOptions.length > 0) {
          event.hotelOptions.forEach((option) => {
            const optNum = option.optionNumber ?? 1;
            const optNumInt = parseInt(optNum, 10);
            if (optNumInt >= 1 && optNumInt <= maxHotelOptions) optionNumbersFromEvents.add(optNumInt);
          });
        }
      });
    });
    const sortedOptionNumbers = Array.from(optionNumbersFromEvents).sort((a, b) => a - b);
    if (sortedOptionNumbers.length === 0) return;

    const proposals = sortedOptionNumbers.map(optNum => {
      const optNumStr = String(optNum);
      let totalGross = 0;
      Object.keys(pricingData || {}).forEach(key => {
        const [keyOpt] = key.split('-');
        if (parseInt(keyOpt, 10) === optNum) {
          totalGross += (pricingData[key]?.gross || 0);
        }
      });
      const settings = (optionGstSettings && optionGstSettings[optNum]) || {
        cgst, sgst, igst, tcs, discount
      };

      const cgstAmt = (totalGross * (settings.cgst || 0)) / 100;
      const sgstAmt = (totalGross * (settings.sgst || 0)) / 100;
      const igstAmt = (totalGross * (settings.igst || 0)) / 100;
      const tcsAmt = (totalGross * (settings.tcs || 0)) / 100;
      const discountAmt = (totalGross * (settings.discount || 0)) / 100;
      const calculatedTotal = totalGross + cgstAmt + sgstAmt + igstAmt + tcsAmt - discountAmt;

      const finalPrice = finalClientPrices[optNumStr] !== undefined && finalClientPrices[optNumStr] !== null
        ? parseFloat(finalClientPrices[optNumStr]) || calculatedTotal
        : (finalClientPrices[optNum] !== undefined && finalClientPrices[optNum] !== null ? parseFloat(finalClientPrices[optNum]) : null) ?? calculatedTotal;
      const hotelDetails = [];
      Object.keys(dayEvents || {}).forEach(day => {
        (dayEvents[day] || []).forEach(event => {
          if (event.eventType === 'accommodation' && event.hotelOptions) {
            event.hotelOptions.forEach((option, idx) => {
              if (option.optionNumber === optNum) {
                hotelDetails.push({
                  ...option,
                  day: parseInt(day),
                  pricing: pricingData[`${optNum}-${day}-${idx}`]
                });
              }
            });
          }
        });
      });
      return {
        id: Date.now() + optNum,
        optionNumber: optNum,
        itinerary_id: parseInt(id),
        itinerary_name: itinerary?.itinerary_name || 'Itinerary',
        destination: itinerary?.destinations || '',
        duration: itinerary?.duration || 0,
        price: finalPrice,
        website_cost: finalPrice,
        hotelDetails,
        pricing: {
          baseMarkup,
          extraMarkup,
          ...settings,
          finalClientPrice: finalPrice,
          totalGross,
          totalTax: cgstAmt + sgstAmt + igstAmt + tcsAmt,
          discountAmount: discountAmt
        },
        image: itinerary?.image || null,
        inserted_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      };
    });
    try {
      localStorage.setItem(`itinerary_${id}_proposals`, JSON.stringify(proposals));
    } catch (e) {
      console.error('Failed to sync options to proposals storage', e);
    }
  };

  useEffect(() => {
    syncOptionsToProposalsStorage();
  }, [pricingData, dayEvents, finalClientPrices, id, itinerary, baseMarkup, extraMarkup, cgst, sgst, igst, tcs, discount, maxHotelOptions, optionGstSettings]);

  // Load images when modal opens
  useEffect(() => {
    if (showCoverPhotoModal && coverPhotoSource === 'unsplash' && unsplashImages.length === 0) {
      fetchUnsplashImages();
    }
  }, [showCoverPhotoModal, coverPhotoSource]);

  // Load events from localStorage on mount
  const loadEventsFromStorage = () => {
    try {
      const storedEvents = localStorage.getItem(`itinerary_${id}_events`);
      if (storedEvents) {
        setDayEvents(JSON.parse(storedEvents));
      }

      // Load days data (destinations per day)
      const storedDays = localStorage.getItem(`itinerary_${id}_days`);
      if (storedDays) {
        try {
          const parsedDays = JSON.parse(storedDays);
          if (Array.isArray(parsedDays) && parsedDays.length > 0) {
            setDays(parsedDays);
          }
        } catch (e) {
          console.error('Failed to parse stored days:', e);
        }
      }

      // Load pricing data
      const storedPricing = localStorage.getItem(`itinerary_${id}_pricing`);
      if (storedPricing) {
        setPricingData(JSON.parse(storedPricing));
      }

      // Load final client prices
      const storedFinalPrices = localStorage.getItem(`itinerary_${id}_finalClientPrices`);
      if (storedFinalPrices) {
        setFinalClientPrices(JSON.parse(storedFinalPrices));
      }

      // Load GST settings
      const storedSettings = localStorage.getItem(`itinerary_${id}_settings`);
      if (storedSettings) {
        const settings = JSON.parse(storedSettings);
        setBaseMarkup(settings.baseMarkup || 0);
        setExtraMarkup(settings.extraMarkup || 0);
        setCgst(settings.cgst || 0);
        setSgst(settings.sgst || 0);
        setIgst(settings.igst || 0);
        setTcs(settings.tcs || 0);
        setDiscount(settings.discount || 0);
      }
    } catch (err) {
      console.error('Failed to load data from storage:', err);
    }
  };

  // Save days to localStorage whenever they change
  useEffect(() => {
    if (id && days.length > 0) {
      try {
        localStorage.setItem(`itinerary_${id}_days`, JSON.stringify(days));
      } catch (err) {
        console.error('Failed to save days to storage:', err);
      }
    }
  }, [days, id]);

  // Save events to localStorage whenever they change
  useEffect(() => {
    if (id && Object.keys(dayEvents).length > 0) {
      try {
        localStorage.setItem(`itinerary_${id}_events`, JSON.stringify(dayEvents));
      } catch (err) {
        console.error('Failed to save events to storage:', err);
      }
    }
  }, [dayEvents, id]);

  // Save pricing data to localStorage whenever it changes
  useEffect(() => {
    if (id && Object.keys(pricingData).length > 0) {
      try {
        localStorage.setItem(`itinerary_${id}_pricing`, JSON.stringify(pricingData));
      } catch (err) {
        console.error('Failed to save pricing data to storage:', err);
      }
    }
  }, [pricingData, id]);

  // Save final client prices to localStorage whenever they change
  useEffect(() => {
    if (id) {
      try {
        // Save even if empty to clear previous data
        localStorage.setItem(`itinerary_${id}_finalClientPrices`, JSON.stringify(finalClientPrices));
      } catch (err) {
        console.error('Failed to save final client prices to storage:', err);
      }
    }
  }, [finalClientPrices, id]);

  // Save GST settings to localStorage whenever they change
  useEffect(() => {
    if (id) {
      try {
        const settings = {
          baseMarkup,
          extraMarkup,
          cgst,
          sgst,
          igst,
          tcs,
          discount
        };
        localStorage.setItem(`itinerary_${id}_settings`, JSON.stringify(settings));
      } catch (err) {
        console.error('Failed to save settings to storage:', err);
      }
    }
  }, [baseMarkup, extraMarkup, cgst, sgst, igst, tcs, discount, id]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showEventTypeDropdown && dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowEventTypeDropdown(false);
      }
    };

    if (showEventTypeDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEventTypeDropdown]);

  const fetchItinerary = async () => {
    try {
      setLoading(true);
      const response = await packagesAPI.get(id);
      const data = response.data.data;

      // Convert image URL to absolute if needed
      if (data.image) {
        if (data.image.startsWith('/storage') || (data.image.startsWith('/') && !data.image.startsWith('http'))) {
          const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
          const baseUrl = apiBaseUrl.replace('/api', '');
          data.image = `${baseUrl}${data.image}`;
        }
        // Fix domain if needed
        if (data.image.includes('localhost') && !data.image.includes(':8000')) {
          data.image = data.image.replace('localhost', 'localhost:8000');
        }
      }

      setItinerary(data);

      // Load terms and policies
      setPackageTerms({
        terms_conditions: data.terms_conditions || '',
        refund_policy: data.refund_policy || '',
        package_description: data.package_description || ''
      });

      // Set first day as selected if available
      if (data.duration && data.duration > 0) {
        setSelectedDay(1);
        // Initialize days - check localStorage first, otherwise use defaults
        const storedDays = localStorage.getItem(`itinerary_${id}_days`);
        if (storedDays) {
          try {
            const parsedDays = JSON.parse(storedDays);
            if (Array.isArray(parsedDays) && parsedDays.length === data.duration) {
              setDays(parsedDays);
            } else {
              // Duration changed, need to update days
              const initialDays = [];
              for (let i = 1; i <= data.duration; i++) {
                const existingDay = parsedDays.find(d => d.day === i);
                initialDays.push({
                  day: i,
                  destination: existingDay?.destination || data.destinations?.split(',')[0]?.trim() || '',
                  details: existingDay?.details || ''
                });
              }
              setDays(initialDays);
              localStorage.setItem(`itinerary_${id}_days`, JSON.stringify(initialDays));
            }
          } catch (e) {
            // If parsing fails, use defaults
            const initialDays = [];
            for (let i = 1; i <= data.duration; i++) {
              initialDays.push({
                day: i,
                destination: data.destinations?.split(',')[0]?.trim() || '',
                details: ''
              });
            }
            setDays(initialDays);
          }
        } else {
          // No stored days, initialize with defaults
          const initialDays = [];
          for (let i = 1; i <= data.duration; i++) {
            initialDays.push({
              day: i,
              destination: data.destinations?.split(',')[0]?.trim() || '',
              details: ''
            });
          }
          setDays(initialDays);
          localStorage.setItem(`itinerary_${id}_days`, JSON.stringify(initialDays));
        }
      }
    } catch (err) {
      console.error('Failed to fetch itinerary:', err);
      toast.error('Failed to load itinerary');
      navigate('/itineraries');
    } finally {
      setLoading(false);
    }
  };

  const fetchDayItineraries = async () => {
    try {
      const response = await dayItinerariesAPI.list();
      const data = response.data.data || response.data || [];

      // Process image URLs
      const processedData = data.map(itinerary => {
        if (itinerary.image) {
          if (itinerary.image.startsWith('/storage') || (itinerary.image.startsWith('/') && !itinerary.image.startsWith('http'))) {
            let baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
            baseUrl = baseUrl.replace('/api', '');
            itinerary.image = `${baseUrl}${itinerary.image}`;
          }
          if (itinerary.image.includes('localhost') && !itinerary.image.includes(':8000')) {
            itinerary.image = itinerary.image.replace('localhost', 'localhost:8000');
          }
        }
        return itinerary;
      });

      setDayItineraries(processedData.filter(d => d.status === 'active'));
    } catch (err) {
      console.error('Failed to fetch day itineraries:', err);
    }
  };

  // Day Itinerary image library (same as Masters → Day Itinerary)
  const fetchDayItineraryLibraryPackages = async () => {
    setDayItineraryLibraryLoading(true);
    try {
      const response = await packagesAPI.list();
      const data = response.data.data || [];
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
      setDayItineraryLibraryPackages(processed);
    } catch (err) {
      console.error('Failed to fetch library:', err);
    } finally {
      setDayItineraryLibraryLoading(false);
    }
  };

  const fetchDayItineraryFreeStockImages = async () => {
    const q = (dayItineraryLibrarySearchTerm || '').trim();
    if (q.length < 2) return;
    setDayItineraryFreeStockLoading(true);
    try {
      const { photos } = await searchPexelsPhotos(q, 15);
      setDayItineraryFreeStockPhotos(photos || []);
    } catch (e) {
      setDayItineraryFreeStockPhotos([]);
    } finally {
      setDayItineraryFreeStockLoading(false);
    }
  };

  const handleSelectDayItineraryFreeStockImage = async (imageUrl) => {
    try {
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      const file = new File([blob], 'image.jpg', { type: blob.type || 'image/jpeg' });
      const et = dayDetailsForm.eventType;
      const updates = et === 'activity' ? { activity_photo: file } : et === 'transportation' ? { transfer_photo: file } : { image: file };
      setDayDetailsForm(prev => ({ ...prev, ...updates }));
      setEventImagePreview(URL.createObjectURL(file));
      setDayItineraryImageSource('upload');
      setShowDayItineraryImageModal(false);
    } catch (e) {
      toast.error('Failed to load image. Try another or upload from device.');
    }
  };

  const handleSelectDayItineraryLibraryImage = (imageUrl) => {
    setEventImagePreview(imageUrl);
    const et = dayDetailsForm.eventType;
    // For activity/transport: store URL string; at save we fetch and convert to File
    const updates = et === 'activity' ? { activity_photo: imageUrl } : et === 'transportation' ? { transfer_photo: imageUrl } : { image: null };
    setDayDetailsForm(prev => ({ ...prev, ...updates }));
    setDayItineraryImageSource('library');
    setShowDayItineraryImageModal(false);
  };

  useEffect(() => {
    if (showDayItineraryImageModal && dayItineraryLibraryTab === 'your' && dayItineraryLibraryPackages.length === 0) {
      fetchDayItineraryLibraryPackages();
    }
  }, [showDayItineraryImageModal, dayItineraryLibraryTab]);

  const dayItineraryLibrarySearch = (dayItineraryLibrarySearchTerm || '').trim().toLowerCase();
  const dayItineraryLibraryImages = dayItineraryLibrarySearch.length >= 2
    ? dayItineraryLibraryPackages.filter(
      (p) => p.image && (
        (p.title || p.itinerary_name || '').toLowerCase().includes(dayItineraryLibrarySearch) ||
        (p.destination || p.destinations || '').toLowerCase().includes(dayItineraryLibrarySearch)
      )
    )
    : [];

  const fetchDestinations = async () => {
    try {
      const response = await destinationsAPI.list();
      const data = response.data.data || response.data || [];

      // Check if Shimla exists, if not create it
      const shimlaExists = data.some(dest => dest.name.toLowerCase() === 'shimla');
      if (!shimlaExists) {
        try {
          await destinationsAPI.create({ name: 'Shimla' });
          // Fetch again to get updated list
          const updatedResponse = await destinationsAPI.list();
          const updatedData = updatedResponse.data.data || updatedResponse.data || [];
          setDestinations(updatedData.filter(d => d.status === 'active').map(d => d.name));
        } catch (createErr) {
          // If creation fails (maybe already exists), just use the fetched list
          console.error('Failed to create Shimla destination:', createErr);
          setDestinations(data.filter(d => d.status === 'active').map(d => d.name));
        }
      } else {
        setDestinations(data.filter(d => d.status === 'active').map(d => d.name));
      }
    } catch (err) {
      console.error('Failed to fetch destinations:', err);
      setDestinations([]);
    }
  };

  const fetchActivities = async () => {
    try {
      setActivitiesLoading(true);
      const response = await activitiesAPI.list();
      const data = response.data.data || response.data || [];

      // Process image URLs
      const processedData = data.map(activity => {
        if (activity.activity_photo) {
          if (activity.activity_photo.startsWith('/storage') || (activity.activity_photo.startsWith('/') && !activity.activity_photo.startsWith('http'))) {
            let baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
            baseUrl = baseUrl.replace('/api', '');
            activity.activity_photo = `${baseUrl}${activity.activity_photo}`;
          }
          if (activity.activity_photo.includes('localhost') && !activity.activity_photo.includes(':8000')) {
            activity.activity_photo = activity.activity_photo.replace('localhost', 'localhost:8000');
          }
        }
        return activity;
      });

      setActivities(processedData.filter(a => a.status === 'active'));
    } catch (err) {
      console.error('Failed to fetch activities:', err);
    } finally {
      setActivitiesLoading(false);
    }
  };

  useEffect(() => {
    if (categoryType === 'activity') {
      fetchActivities();
    } else if (categoryType === 'accommodation') {
      if (dataSourceTab === 'database') {
        fetchStoredHotels();
      } else if (dataSourceTab === 'api') {
        const destination = days[selectedDay - 1]?.destination || dayDetailsForm.destination;
        if (destination) {
          setSelectedDestination(destination);
          searchHotels('', destination);
        }
      }
    } else if (categoryType === 'transportation') {
      fetchTransfers();
    } else if (categoryType === 'meal') {
      fetchMealPlans();
    }
  }, [categoryType, dataSourceTab]);

  const fetchStoredHotels = async () => {
    try {
      setStoredHotelsLoading(true);
      const response = await hotelsAPI.list();
      const data = response.data.data || response.data || [];

      // Process image URLs
      const processedData = data.map(hotel => {
        if (hotel.hotel_photo) {
          if (hotel.hotel_photo.startsWith('/storage') || (hotel.hotel_photo.startsWith('/') && !hotel.hotel_photo.startsWith('http'))) {
            let baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
            baseUrl = baseUrl.replace('/api', '');
            hotel.hotel_photo = `${baseUrl}${hotel.hotel_photo}`;
          }
          if (hotel.hotel_photo.includes('localhost') && !hotel.hotel_photo.includes(':8000')) {
            hotel.hotel_photo = hotel.hotel_photo.replace('localhost', 'localhost:8000');
          }
        }
        return {
          id: hotel.id,
          name: hotel.name,
          hotelName: hotel.name,
          rating: parseInt(hotel.category) || 3,
          address: hotel.hotel_address || hotel.destination || '',
          image: hotel.hotel_photo || null,
          destination: hotel.destination || '',
          category: hotel.category || '1',
        };
      });

      setStoredHotels(processedData.filter(h => h.status === 'active'));
    } catch (err) {
      console.error('Failed to fetch stored hotels:', err);
    } finally {
      setStoredHotelsLoading(false);
    }
  };

  const fetchTransfers = async () => {
    try {
      setStoredTransfersLoading(true);
      const response = await transfersAPI.list();
      const data = response.data?.data || response.data || [];

      const processed = data.map(transfer => {
        let photo = transfer.transfer_photo || null;
        if (photo && (photo.startsWith('/storage') || (photo.startsWith('/') && !photo.startsWith('http')))) {
          let baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
          baseUrl = baseUrl.replace('/api', '');
          photo = `${baseUrl}${photo}`;
        }
        return {
          ...transfer,
          transfer_photo: photo,
        };
      });

      setStoredTransfers(processed.filter(t => t.status === 'active'));
    } catch (err) {
      console.error('Failed to fetch transfers:', err);
      setStoredTransfers([]);
    } finally {
      setStoredTransfersLoading(false);
    }
  };

  const fetchMealPlans = async () => {
    try {
      setMealPlansLoading(true);
      const response = await mealPlansAPI.list();
      const data = response.data?.data || response.data || [];
      setMealPlans(data);
    } catch (err) {
      console.error('Failed to fetch meal plans:', err);
      setMealPlans([]);
    } finally {
      setMealPlansLoading(false);
    }
  };

  const handleApiHotelSearch = async () => {
    if (!apiSearchForm.city) {
      toast.warning('Please enter city name');
      return;
    }

    setHotelSearchLoading(true);
    try {
      const response = await hotelsAPI.search(apiSearchForm.city, '');
      if (response.data.success && response.data.data && response.data.data.length > 0) {
        setHotelSearchResults(response.data.data);
      } else {
        setHotelSearchResults([]);
      }
      setShowApiSearchModal(false);
    } catch (err) {
      console.error('API hotel search error:', err);
      toast.error('Failed to search hotels. Please try again.');
    } finally {
      setHotelSearchLoading(false);
    }
  };

  const fetchHotelRooms = async (hotelId, hotelName) => {
    if (hotelRooms[hotelId]) {
      // Toggle if already fetched
      if (expandedHotelId === hotelId) {
        setExpandedHotelId(null);
      } else {
        setExpandedHotelId(hotelId);
      }
      return;
    }

    setRoomsLoading(true);
    try {
      // Call backend API to get real room data
      const response = await hotelsAPI.getRooms(hotelId, {
        checkIn: apiSearchForm.checkIn || '',
        checkOut: apiSearchForm.checkOut || '',
        adults: apiSearchForm.guests || 2,
        rooms: apiSearchForm.rooms || 1
      });

      if (response.data.success && response.data.data) {
        setHotelRooms({
          ...hotelRooms,
          [hotelId]: response.data.data
        });
        setExpandedHotelId(hotelId);
      } else {
        throw new Error('No rooms data received');
      }
    } catch (err) {
      console.error('Failed to fetch hotel rooms:', err);
      toast.error('Failed to load room types. Please try again.');
    } finally {
      setRoomsLoading(false);
    }
  };

  const handleRoomSelect = (hotel, room) => {
    if (!selectedDay) {
      toast.warning('Please select a day first');
      return;
    }

    // Count existing accommodation events in the selected day to determine option number
    const currentDayEvents = dayEvents[selectedDay] || [];
    const accommodationEvents = currentDayEvents.filter(e => e.eventType === 'accommodation');

    // Check if max options limit reached
    if (accommodationEvents.length >= maxHotelOptions) {
      toast.warning(`Maximum ${maxHotelOptions} hotel options allowed per day.`);
      return;
    }

    // Check if same hotel already exists in another option
    if (isHotelAlreadyInOptions(hotel)) {
      showToastNotification('warning', 'Hotel Already Added', 'This hotel is already added in options. You cannot add the same hotel in multiple options.');
      return;
    }

    const nextOptionNumber = accommodationEvents.length + 1;

    // Extract the hotel_id for email lookup
    const hotelId = extractHotelId(hotel);

    // Create accommodation event with room details
    const eventData = {
      id: Date.now(),
      subject: hotel.hotelName || hotel.name || 'Hotel',
      details: `${room.name} - ${room.mealPlan}`,
      destination: hotel.address || apiSearchForm.city || '',
      eventType: 'accommodation',
      image: hotel.image || null,
      type: 'Manual',
      name: hotel.hotelName || hotel.name || 'Hotel',
      date: apiSearchForm.checkIn || '',
      startTime: apiSearchForm.checkInTime || '2:00 PM',
      endTime: apiSearchForm.checkOutTime || '11:00',
      showTime: false,
      hotelOptions: [{
        hotelName: hotel.hotelName || hotel.name || 'Hotel',
        hotel_id: hotelId,
        category: hotel.rating ? hotel.rating.toString() : '3',
        roomName: room.name,
        mealPlan: room.mealPlan,
        single: '',
        double: room.guests >= 2 ? '1' : '',
        triple: '',
        quad: '',
        cwb: '',
        cnb: '',
        checkIn: apiSearchForm.checkIn || '',
        checkInTime: apiSearchForm.checkInTime || '2:00 PM',
        checkOut: apiSearchForm.checkOut || '',
        checkOutTime: apiSearchForm.checkOutTime || '11:00',
        price: room.price,
        optionNumber: nextOptionNumber // Add option number
      }],
      editingOptionIndex: null,
      hotelName: hotel.hotelName || hotel.name || 'Hotel',
      hotel_id: hotelId,
      category: hotel.rating ? hotel.rating.toString() : '3',
      roomName: room.name,
      mealPlan: room.mealPlan,
      single: '',
      double: room.guests >= 2 ? '1' : '',
      triple: '',
      quad: '',
      cwb: '',
      cnb: '',
      checkIn: apiSearchForm.checkIn || '',
      checkInTime: apiSearchForm.checkInTime || '2:00 PM',
      checkOut: apiSearchForm.checkOut || '',
      checkOutTime: apiSearchForm.checkOutTime || '11:00',
      transferType: 'Private',
      mealType: 'Breakfast'
    };

    saveEvent(eventData);
    setExpandedHotelId(null);
  };

  // Fetch images from Unsplash (using Picsum as free alternative)
  const fetchUnsplashImages = async () => {
    setUnsplashLoading(true);
    try {
      // Using Picsum Photos (free, no API key needed)
      const query = unsplashSearchTerm || 'travel';
      const imageUrls = [];
      const seed = Date.now(); // Use timestamp as seed for variety

      for (let i = 0; i < 12; i++) {
        imageUrls.push({
          id: `picsum-${i}-${seed}`,
          urls: {
            thumb: `https://picsum.photos/seed/${query}-${i}-${seed}/400/300`,
            regular: `https://picsum.photos/seed/${query}-${i}-${seed}/1200/800`
          },
          alt_description: query
        });
      }
      setUnsplashImages(imageUrls);
    } catch (err) {
      console.error('Failed to fetch images:', err);
      toast.error('Failed to load images. Please try again.');
    } finally {
      setUnsplashLoading(false);
    }
  };

  // Handle cover photo save
  const handleCoverPhotoSave = async () => {
    try {
      if (coverPhotoFile) {
        // Upload file
        const formData = new FormData();
        formData.append('image', coverPhotoFile);
        formData.append('_method', 'PUT');

        await packagesAPI.update(id, formData);
      } else if (coverPhotoPreview && coverPhotoSource === 'unsplash') {
        // Download image from URL and upload
        const response = await fetch(coverPhotoPreview);
        const blob = await response.blob();
        const file = new File([blob], 'cover-photo.jpg', { type: blob.type });

        const formData = new FormData();
        formData.append('image', file);
        formData.append('_method', 'PUT');

        await packagesAPI.update(id, formData);
      }

      // Refresh itinerary data
      await fetchItinerary();

      // Close modal
      setShowCoverPhotoModal(false);
      setCoverPhotoFile(null);
      setCoverPhotoPreview(null);
      setUnsplashImages([]);
    } catch (err) {
      console.error('Failed to save cover photo:', err);
      toast.error('Failed to save cover photo. Please try again.');
    }
  };

  const saveEvent = (eventData) => {
    if (!selectedDay) return;

    const currentDayEvents = dayEvents[selectedDay] || [];

    if (eventData.id && currentDayEvents.some(e => e.id === eventData.id)) {
      // Update existing event
      const updatedEvents = currentDayEvents.map(e =>
        e.id === eventData.id ? eventData : e
      );
      setDayEvents({
        ...dayEvents,
        [selectedDay]: updatedEvents
      });
    } else {
      // Add new event
      setDayEvents({
        ...dayEvents,
        [selectedDay]: [...currentDayEvents, eventData]
      });
    }

    // Reset form with all fields
    setDayDetailsForm({
      subject: '',
      details: '',
      image: null,
      eventType: '',
      id: null,
      destination: '',
      type: 'Manual',
      name: '',
      date: '',
      startTime: '1:00 PM',
      endTime: '2:00 PM',
      showTime: false,
      hotelOptions: [],
      editingOptionIndex: null,
      hotelName: '',
      hotel_id: null,
      category: '1',
      roomName: '',
      mealPlan: '',
      single: '',
      double: '',
      triple: '',
      quad: '',
      cwb: '',
      cnb: '',
      checkIn: '',
      checkInTime: '2:00 PM',
      checkOut: '',
      checkOutTime: '11:00',
      hotel_details: '',
      hotel_photo: null,
      contact_person: '',
      email: '',
      phone: '',
      hotel_address: '',
      hotel_link: '',
      status: 'active',
      activity_details: '',
      activity_photo: null,
      transfer_details: '',
      transfer_photo: null,
      transferType: 'Private',
      mealType: 'Breakfast'
    });
    setEventImagePreview(null);
    setHotelPhotoPreview(null);
    setShowDayDetailsModal(false);
  };

  // Handle adding day itinerary to selected day
  const handleAddDayItinerary = (dayItineraryId) => {
    if (!selectedDay) {
      toast.warning('Please select a day first');
      return;
    }

    // Find the selected day itinerary
    const selectedItinerary = dayItineraries.find(di => di.id === parseInt(dayItineraryId));
    if (!selectedItinerary) {
      toast.error('Day itinerary not found');
      return;
    }

    // Process image URL if exists
    let imageUrl = null;
    if (selectedItinerary.image) {
      imageUrl = selectedItinerary.image;
      // Handle both relative and absolute URLs
      if (imageUrl.startsWith('/storage') || (imageUrl.startsWith('/') && !imageUrl.startsWith('http'))) {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
        const baseUrl = apiBaseUrl.replace('/api', '');
        imageUrl = `${baseUrl}${imageUrl}`;
      }
      // Fix domain if needed
      if (imageUrl.includes('localhost') && !imageUrl.includes(':8000')) {
        imageUrl = imageUrl.replace('localhost', 'localhost:8000');
      }
    }

    // Create event from day itinerary
    const eventData = {
      id: Date.now(), // Temporary ID
      subject: selectedItinerary.title || selectedItinerary.destination || 'Day Itinerary',
      details: selectedItinerary.details || '',
      destination: selectedItinerary.destination || '',
      eventType: 'day-itinerary', // Mark as day itinerary
      image: imageUrl, // Use processed image URL
      type: 'Manual',
      name: selectedItinerary.title || '',
      date: '',
      startTime: '1:00 PM',
      endTime: '2:00 PM',
      showTime: false,
      hotelOptions: [],
      editingOptionIndex: null,
      hotelName: '',
      hotel_id: null,
      category: '1',
      roomName: '',
      mealPlan: '',
      single: '',
      double: '',
      triple: '',
      quad: '',
      cwb: '',
      cnb: '',
      checkIn: '',
      checkInTime: '2:00 PM',
      checkOut: '',
      checkOutTime: '11:00',
      transferType: 'Private',
      mealType: 'Breakfast'
    };

    // Add event to selected day
    saveEvent(eventData);
  };

  // Search hotels by location using backend API
  const searchHotels = async (query = '', location = '') => {
    if (!location && !query) return;

    setHotelSearchLoading(true);
    try {
      const searchLocation = location || query;

      // Use backend API which handles multiple free APIs and local database
      const response = await hotelsAPI.search(searchLocation, query);

      if (response.data.success && response.data.data && response.data.data.length > 0) {
        const hotels = response.data.data.map(h => ({
          id: h.id,
          name: h.hotelName || h.name,
          hotelName: h.hotelName || h.name,
          rating: h.rating || Math.floor(Math.random() * 3) + 3,
          address: h.address || `${searchLocation}, India`,
          image: h.image || null
        }));
        setHotelSearchResults(hotels);
      } else {
        // Fallback to mock hotels
        const mockHotels = generateMockHotels(searchLocation);
        setHotelSearchResults(mockHotels);
      }
    } catch (err) {
      console.error('Hotel search error:', err);
      // Fallback to mock hotels
      const mockHotels = generateMockHotels(location || query);
      setHotelSearchResults(mockHotels);
    } finally {
      setHotelSearchLoading(false);
    }
  };

  // Generate mock hotels for testing (enhanced with more options)
  const generateMockHotels = (location) => {
    const hotelTypes = [
      'Grand Hotel', 'Palace', 'Resort', 'Inn', 'Luxury Hotel',
      'Boutique Hotel', 'Plaza', 'Suites', 'View Hotel', 'Heritage Hotel',
      'International Hotel', 'Business Hotel', 'Beach Resort', 'Hill Resort',
      'Spa Resort', 'Eco Resort', 'City Hotel', 'Airport Hotel', 'Budget Hotel',
      'Premium Hotel', 'Executive Hotel', 'Royal Hotel', 'Crown Hotel', 'Tower Hotel'
    ];

    return hotelTypes.map((type, index) => ({
      id: `hotel-${location}-${index}`,
      name: `${location} ${type}`,
      hotelName: `${location} ${type}`,
      rating: Math.floor(Math.random() * 3) + 3, // 3-5 stars
      address: `${location}, India`,
      price: Math.floor(Math.random() * 5000) + 2000
    }));
  };

  // Extract numeric hotel_id from hotel object (handles 'local-XX' format)
  const extractHotelId = (hotel) => {
    if (!hotel) return null;
    const rawId = hotel.id || hotel.hotel_id;
    if (!rawId) return null;
    // Handle 'local-XX' format from local database search
    if (typeof rawId === 'string' && rawId.startsWith('local-')) {
      return parseInt(rawId.replace('local-', ''), 10) || null;
    }
    // Handle regular numeric IDs
    return typeof rawId === 'number' ? rawId : (parseInt(rawId, 10) || null);
  };

  const showToastNotification = (type, title, text) => {
    toast[type || 'info'](
      <div>
        <div className="font-bold">{title}</div>
        <div className="text-sm">{text}</div>
      </div>
    );
  };

  // Check if hotel is already used in another option for the selected day
  const isHotelAlreadyInOptions = (hotel, excludeEventId = null) => {
    const currentDayEvents = dayEvents[selectedDay] || [];
    const accommodationEvents = currentDayEvents.filter(e => e.eventType === 'accommodation' && e.id !== excludeEventId);
    const hotelId = extractHotelId(hotel);
    const hotelName = (hotel.hotelName || hotel.name || '').toString().trim().toLowerCase();
    if (!hotelId && !hotelName) return false;
    for (const ev of accommodationEvents) {
      for (const opt of (ev.hotelOptions || [])) {
        const optId = opt.hotel_id != null ? (typeof opt.hotel_id === 'number' ? opt.hotel_id : parseInt(opt.hotel_id, 10)) : null;
        const optName = (opt.hotelName || '').toString().trim().toLowerCase();
        if (hotelId && optId && hotelId === optId) return true;
        if (hotelName && optName && hotelName === optName) return true;
      }
    }
    return false;
  };

  // Handle hotel selection from search
  const handleHotelSelect = (hotel) => {
    if (!selectedDay) {
      toast.warning('Please select a day first');
      return;
    }

    // Count existing accommodation events in the selected day to determine option number
    const currentDayEvents = dayEvents[selectedDay] || [];
    const accommodationEvents = currentDayEvents.filter(e => e.eventType === 'accommodation');

    // Check if max options limit reached
    if (accommodationEvents.length >= maxHotelOptions) {
      toast.warning(`Maximum ${maxHotelOptions} hotel options allowed per day.`);
      return;
    }

    // Check if same hotel already exists in another option
    if (isHotelAlreadyInOptions(hotel)) {
      showToastNotification('warning', 'Hotel Already Added', 'This hotel is already added in options. You cannot add the same hotel in multiple options.');
      return;
    }

    const nextOptionNumber = accommodationEvents.length + 1;

    // Extract the hotel_id for email lookup
    const hotelId = extractHotelId(hotel);

    // Check if accommodation modal is open
    if (dayDetailsForm.eventType === 'accommodation' && showDayDetailsModal) {
      // Add hotel to current hotel option in the modal (still check duplicate - could be adding new option)
      if (isHotelAlreadyInOptions(hotel, dayDetailsForm.id)) {
        showToastNotification('warning', 'Hotel Already Added', 'This hotel is already added in options. You cannot add the same hotel in multiple options.');
        setHotelSearchResults([]);
        setSearchQuery('');
        return;
      }
      setDayDetailsForm({
        ...dayDetailsForm,
        hotelName: hotel.hotelName || hotel.name,
        hotel_id: hotelId,
        category: hotel.rating ? hotel.rating.toString() : dayDetailsForm.category,
        destination: selectedDestination || dayDetailsForm.destination || hotel.address || ''
      });
      setShowHotelSearch(false);
    } else {
      // Directly add hotel as accommodation event without opening popup
      const eventData = {
        id: Date.now(),
        subject: hotel.hotelName || hotel.name || 'Hotel',
        details: '',
        destination: selectedDestination || hotel.address || days[selectedDay - 1]?.destination || '',
        eventType: 'accommodation',
        image: hotel.image || null,
        type: 'Manual',
        name: hotel.hotelName || hotel.name || 'Hotel',
        date: '',
        startTime: '2:00 PM',
        endTime: '11:00',
        showTime: false,
        hotelOptions: [{
          hotelName: hotel.hotelName || hotel.name || 'Hotel',
          hotel_id: hotelId,
          category: hotel.rating ? hotel.rating.toString() : '3',
          roomName: '',
          mealPlan: '',
          single: '',
          double: '',
          triple: '',
          quad: '',
          cwb: '',
          cnb: '',
          checkIn: '',
          checkInTime: '2:00 PM',
          checkOut: '',
          checkOutTime: '11:00',
          optionNumber: nextOptionNumber // Add option number
        }],
        editingOptionIndex: null,
        hotelName: hotel.hotelName || hotel.name || 'Hotel',
        hotel_id: hotelId,
        category: hotel.rating ? hotel.rating.toString() : '3',
        roomName: '',
        mealPlan: '',
        single: '',
        double: '',
        triple: '',
        quad: '',
        cwb: '',
        cnb: '',
        checkIn: '',
        checkInTime: '2:00 PM',
        checkOut: '',
        checkOutTime: '11:00',
        transferType: 'Private',
        mealType: 'Breakfast'
      };

      // Directly save the event without opening popup
      saveEvent(eventData);
    }
    setHotelSearchResults([]);
    setSearchQuery('');
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const handleDayDestinationChange = (dayNumber, newDestination) => {
    if (!newDestination || newDestination.trim() === '' || newDestination === 'Select Destination') {
      return; // Don't update if empty or placeholder
    }

    const updatedDays = days.map(day =>
      day.day === dayNumber
        ? { ...day, destination: newDestination.trim() }
        : day
    );

    setDays(updatedDays);

    // Save to localStorage for persistence
    try {
      localStorage.setItem(`itinerary_${id}_days`, JSON.stringify(updatedDays));
    } catch (err) {
      console.error('Failed to save days to localStorage:', err);
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

  if (!itinerary) {
    return (
      <Layout>
        <div className="p-6">
          <div className="text-center py-12">
            <p className="text-gray-500">Itinerary not found</p>
            <button
              onClick={() => fromLeadId ? navigate(`/leads/${fromLeadId}`) : navigate('/itineraries')}
              className="mt-4 text-blue-600 hover:text-blue-700"
            >
              {fromLeadId ? 'Back to Query' : 'Back to Itineraries'}
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <>
      <Layout>
        <div className="min-h-screen">
          {/* Header with Back Button */}
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <button
              onClick={() => fromLeadId ? navigate(`/leads/${fromLeadId}`) : navigate('/itineraries')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="font-medium">{fromLeadId ? 'Back to Query' : 'Back to Itineraries'}</span>
            </button>
          </div>

          {/* Tabs */}
          <div className="bg-blue-50 border-b border-gray-200 px-6">
            <div className="flex gap-1 items-center justify-between">
              <div className="flex gap-1">
                <button
                  onClick={() => setActiveTab('build')}
                  className={`px-6 py-3 font-medium transition-colors ${activeTab === 'build'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                    : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  Build
                </button>
                <button
                  onClick={() => setActiveTab('pricing')}
                  className={`px-6 py-3 font-medium transition-colors ${activeTab === 'pricing'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                    : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  Pricing
                </button>
                <button
                  onClick={() => setActiveTab('final')}
                  className={`px-6 py-3 font-medium transition-colors ${activeTab === 'final'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                    : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  Final
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          {activeTab === 'build' && (
            <div className="p-6">
              {/* Itinerary Header/Cover */}
              <div
                className="relative w-full h-64 rounded-lg mb-6 overflow-hidden shadow-lg"
                style={{
                  backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundColor: '#667eea'
                }}
              >
                {itinerary.image && (
                  <img
                    src={getDisplayImageUrl(itinerary.image) || itinerary.image}
                    alt={itinerary.itinerary_name}
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                )}
                <div className="relative z-10 h-full flex flex-col justify-between p-8">
                  {hasPermission(user, 'itineraries.edit') && (
                    <div className="flex justify-end">
                      <button
                        onClick={() => setShowCoverPhotoModal(true)}
                        className="bg-white/90 backdrop-blur-sm text-gray-800 px-4 py-2 rounded-lg hover:bg-white transition-colors flex items-center gap-2 shadow-lg font-medium"
                      >
                        <Camera className="h-4 w-4" />
                        Change Cover Photo
                      </button>
                    </div>
                  )}
                  <div className="bg-white/90 backdrop-blur-sm p-4 rounded-lg shadow-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <h1 className="text-4xl font-bold text-gray-900">{itinerary.itinerary_name || 'Untitled'}</h1>
                      {hasPermission(user, 'itineraries.edit') && (
                        <button className="text-gray-700 hover:text-gray-900">
                          <Edit className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                    <p className="text-gray-700 text-lg">{itinerary.destinations || 'No destinations'}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-12 gap-6">
                {/* Left Column - Day List */}
                <div className="col-span-3">
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <h3 className="font-semibold text-gray-800 mb-4">Itinerary Days</h3>
                    <div className="space-y-2">
                      {days.map((day, index) => (
                        <div
                          key={day.day}
                          onClick={() => setSelectedDay(day.day)}
                          className={`p-3 rounded-lg cursor-pointer transition-colors ${selectedDay === day.day
                            ? 'bg-blue-50 border-2 border-blue-500'
                            : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                            }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className={`font-semibold ${selectedDay === day.day ? 'text-blue-600' : 'text-gray-700'}`}>
                                DAY {day.day}
                              </span>
                              {hasPermission(user, 'itineraries.edit') && (
                                <button className="text-gray-400 hover:text-gray-600">
                                  <Edit className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                            <ChevronRight className={`h-4 w-4 ${selectedDay === day.day ? 'text-blue-600' : 'text-gray-400'}`} />
                          </div>
                          <select
                            className="mt-2 w-full text-sm border border-gray-300 rounded px-2 py-1 bg-white"
                            value={day.destination || ''}
                            onChange={(e) => {
                              e.stopPropagation();
                              const selectedValue = e.target.value;
                              if (selectedValue && selectedValue !== '') {
                                handleDayDestinationChange(day.day, selectedValue);
                              }
                            }}
                            onClick={(e) => e.stopPropagation()}
                            disabled={!hasPermission(user, 'itineraries.edit')}
                          >
                            <option value="">Select Destination</option>
                            {destinations.map((dest) => (
                              <option key={dest} value={dest}>{dest}</option>
                            ))}
                            {/* Show current destination if it's not in the list */}
                            {day.destination && !destinations.includes(day.destination) && day.destination !== 'Destination' && (
                              <option value={day.destination}>{day.destination}</option>
                            )}
                          </select>
                        </div>
                      ))}
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div
                          role="button"
                          tabIndex={0}
                          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 cursor-pointer"
                          onClick={() => setActiveTab('final')}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActiveTab('final'); } }}
                        >
                          <FileText className="h-4 w-4" />
                          <span className="text-sm font-medium">Package Terms</span>
                          <ChevronRight className="h-4 w-4 ml-auto" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Center Column - Day Details */}
                <div className="col-span-6">
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    {selectedDay && (
                      <>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-gray-800">
                            Day {selectedDay} → {days[selectedDay - 1]?.destination || 'Destination'}
                          </h3>
                          <div className="relative" ref={dropdownRef}>
                            {hasPermission(user, 'itineraries.edit') && (
                              <button
                                onClick={() => setShowEventTypeDropdown(!showEventTypeDropdown)}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm font-medium"
                              >
                                <Plus className="h-4 w-4" />
                                New Event
                              </button>
                            )}

                            {showEventTypeDropdown && (
                              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                                <div className="py-2">
                                  <button
                                    onClick={() => {
                                      setDayDetailsForm({ ...dayDetailsForm, eventType: 'day-itinerary' });
                                      setShowEventTypeDropdown(false);
                                      setShowDayDetailsModal(true);
                                    }}
                                    className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-sm text-gray-700"
                                  >
                                    <FileText className="h-4 w-4 text-gray-500" />
                                    <span>Day Itinerary</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      setDayDetailsForm({
                                        ...dayDetailsForm,
                                        eventType: 'accommodation',
                                        destination: days[selectedDay - 1]?.destination || ''
                                      });
                                      setShowEventTypeDropdown(false);
                                      setShowDayDetailsModal(true);
                                    }}
                                    className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-sm text-gray-700"
                                  >
                                    <Bed className="h-4 w-4 text-gray-500" />
                                    <span>Accommodation</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      setDayDetailsForm({ ...dayDetailsForm, eventType: 'activity' });
                                      setCategoryType('activity');
                                      setShowEventTypeDropdown(false);
                                      setShowDayDetailsModal(true);
                                    }}
                                    className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-sm text-gray-700"
                                  >
                                    <ImageIcon className="h-4 w-4 text-gray-500" />
                                    <span>Activity</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      setDayDetailsForm({ ...dayDetailsForm, eventType: 'transportation' });
                                      setCategoryType('transportation');
                                      setShowEventTypeDropdown(false);
                                      setShowDayDetailsModal(true);
                                    }}
                                    className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-sm text-gray-700"
                                  >
                                    <Car className="h-4 w-4 text-gray-500" />
                                    <span>Transportation</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      setDayDetailsForm({ ...dayDetailsForm, eventType: 'meal' });
                                      setCategoryType('meal');
                                      setShowEventTypeDropdown(false);
                                      setShowDayDetailsModal(true);
                                    }}
                                    className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-sm text-gray-700"
                                  >
                                    <UtensilsCrossed className="h-4 w-4 text-gray-500" />
                                    <span>Meal</span>
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="mb-4">
                          <div
                            className="flex items-center gap-2 border border-gray-300 rounded-lg p-3 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                            onClick={() => {
                              if (hasPermission(user, 'itineraries.edit')) {
                                setShowDayDetailsModal(true);
                              }
                            }}
                          >
                            <input
                              type="text"
                              placeholder="Enter Day Wise Details"
                              value={dayEvents[selectedDay] && dayEvents[selectedDay].length > 0
                                ? `${dayEvents[selectedDay].length} event(s) added`
                                : 'No events added'}
                              readOnly
                              className="flex-1 bg-transparent border-none outline-none text-sm cursor-pointer"
                            />
                            <button
                              className="text-gray-400 hover:text-gray-600"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (hasPermission(user, 'itineraries.edit')) {
                                  setShowDayDetailsModal(true);
                                }
                              }}
                              disabled={!hasPermission(user, 'itineraries.edit')}
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        {/* Events List */}
                        <div className="space-y-4">
                          {dayEvents[selectedDay] && dayEvents[selectedDay].length > 0 ? (
                            (() => {
                              const filteredEvents = dayEvents[selectedDay].filter(event => {
                                // Filter by type if filterType is set
                                if (filterType === 'all') return true;
                                return event.eventType === filterType;
                              });

                              if (filteredEvents.length === 0) {
                                return (
                                  <div className="text-center py-8 text-gray-500 text-sm">
                                    No {filterType === 'all' ? '' : filterType} events found for this day
                                  </div>
                                );
                              }

                              return filteredEvents.map((event, index) => (
                                <div key={event.id || index} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                                  <div className="flex gap-4 items-start">
                                    {/* Image */}
                                    <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-300 flex-shrink-0 relative overflow-hidden">
                                      {(event.image || (event.eventType === 'accommodation' && event.hotelOptions?.[0]?.image)) ? (
                                        <>
                                          <img
                                            src={getDisplayImageUrl(event.image || event.hotelOptions?.[0]?.image) || event.image || event.hotelOptions?.[0]?.image}
                                            alt={event.subject}
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
                                        </>
                                      ) : (
                                        <div className="text-center p-2">
                                          <p className="text-xs text-gray-400 font-medium">NO PHOTO</p>
                                        </div>
                                      )}
                                    </div>
                                    {/* Event Details */}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-semibold text-gray-900 text-base">{event.subject}</h4>
                                        {event.eventType && (
                                          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                                            {event.eventType === 'day-itinerary' ? 'Day Itinerary' : event.eventType}
                                          </span>
                                        )}
                                      </div>
                                      {event.eventType === 'accommodation' && event.hotelOptions && event.hotelOptions.length > 0 ? (
                                        <div className="space-y-3 mt-2">
                                          {event.hotelOptions.map((option, optIndex) => (
                                            <div key={optIndex} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                                              <div className="flex items-start justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                  <Building2 className="h-5 w-5 text-blue-600" />
                                                  <div>
                                                    <h5 className="font-medium text-gray-900 text-sm">{option.hotelName || 'Hotel'}</h5>
                                                    <div className="flex items-center gap-1 mt-0.5">
                                                      {[...Array(parseInt(option.category || 1))].map((_, i) => (
                                                        <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                                      ))}
                                                      <span className="ml-1 px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                                                        Option {option.optionNumber || (optIndex + 1)}
                                                      </span>
                                                    </div>
                                                  </div>
                                                </div>
                                              </div>
                                              <div className="grid grid-cols-3 gap-2 text-xs text-gray-600">
                                                <div className="flex items-center gap-1">
                                                  <Calendar className="h-3 w-3" />
                                                  <span>Check-in: {option.checkIn ? new Date(option.checkIn).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                  <Calendar className="h-3 w-3" />
                                                  <span>Check-out: {option.checkOut ? new Date(option.checkOut).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                  <Hash className="h-3 w-3" />
                                                  <span>Room: #{option.roomName || 'N/A'}</span>
                                                </div>
                                              </div>
                                              <div className="mt-2 space-y-0.5">
                                                {[
                                                  { label: 'Single', value: option.single },
                                                  { label: 'Double', value: option.double },
                                                  { label: 'Triple', value: option.triple },
                                                  { label: 'Quad', value: option.quad },
                                                  { label: 'Child With Bed', value: option.cwb },
                                                  { label: 'Child No Bed', value: option.cnb }
                                                ].filter(room => room.value && parseInt(room.value) > 0).map((room, idx) => (
                                                  <div key={idx} className="text-xs text-gray-600">
                                                    Room: {room.value} {room.label} | Meal: {option.mealPlan || 'N/A'}
                                                  </div>
                                                ))}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <p className="text-sm text-gray-600">{event.details || 'No details provided'}</p>
                                      )}
                                    </div>
                                    {/* Edit Button on Right */}
                                    {hasPermission(user, 'itineraries.edit') && (
                                      <button
                                        className="text-blue-500 hover:text-blue-700 flex-shrink-0"
                                        onClick={() => {
                                          setDayDetailsForm({
                                            subject: event.subject || '',
                                            details: event.details || '',
                                            image: event.image || null,
                                            eventType: event.eventType || '',
                                            id: event.id || index,
                                            destination: event.destination || '',
                                            type: event.type || 'Manual',
                                            name: event.name || '',
                                            date: event.date || '',
                                            startTime: event.startTime || '1:00 PM',
                                            endTime: event.endTime || '2:00 PM',
                                            showTime: event.showTime || false,
                                            hotelOptions: event.hotelOptions || [],
                                            editingOptionIndex: null,
                                            hotelName: event.hotelOptions?.[0]?.hotelName || '',
                                            hotel_id: event.hotelOptions?.[0]?.hotel_id || null,
                                            category: event.hotelOptions?.[0]?.category || '1',
                                            roomName: event.hotelOptions?.[0]?.roomName || '',
                                            mealPlan: event.hotelOptions?.[0]?.mealPlan || '',
                                            single: event.hotelOptions?.[0]?.single || '',
                                            double: event.hotelOptions?.[0]?.double || '',
                                            triple: event.hotelOptions?.[0]?.triple || '',
                                            quad: event.hotelOptions?.[0]?.quad || '',
                                            cwb: event.hotelOptions?.[0]?.cwb || '',
                                            cnb: event.hotelOptions?.[0]?.cnb || '',
                                            checkIn: event.hotelOptions?.[0]?.checkIn || '',
                                            checkInTime: event.hotelOptions?.[0]?.checkInTime || '2:00 PM',
                                            checkOut: event.hotelOptions?.[0]?.checkOut || '',
                                            checkOutTime: event.hotelOptions?.[0]?.checkOutTime || '11:00',
                                            transferType: event.transferType || 'Private',
                                            mealType: event.mealType || 'Breakfast'
                                          });
                                          setEventImagePreview(event.image || null);
                                          setShowDayDetailsModal(true);
                                        }}
                                      >
                                        <Edit className="h-5 w-5" />
                                      </button>
                                    )}
                                    {/* Delete Button */}
                                    {hasPermission(user, 'itineraries.edit') && (
                                      <button
                                        className="text-red-500 hover:text-red-700 flex-shrink-0"
                                        onClick={() => {
                                          const allEvents = dayEvents[selectedDay];
                                          const eventIndex = allEvents.findIndex(e => (e.id && e.id === event.id) || allEvents.indexOf(e) === index);
                                          const updatedEvents = allEvents.filter((_, i) => i !== eventIndex);
                                          setDayEvents({
                                            ...dayEvents,
                                            [selectedDay]: updatedEvents
                                          });
                                        }}
                                      >
                                        <X className="h-5 w-5" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ));
                            })()
                          ) : (
                            <div className="min-h-[300px] border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                              <div className="text-center text-gray-400">
                                <p className="text-sm">No events added yet</p>
                                <p className="text-xs mt-1">Click "New Event" to add activities</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Right Sidebar - Search and Filters */}
                <div className="col-span-3">
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="space-y-4">
                      {/* Search Input */}
                      <div>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search"
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          />
                        </div>
                      </div>

                      {/* Category Dropdown */}
                      <div>
                        <select
                          value={categoryType}
                          onChange={(e) => {
                            setCategoryType(e.target.value);
                            setSearchQuery('');
                            setDataSourceTab('database');
                          }}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                        >
                          <option value="day-itinerary">Day Itinerary</option>
                          <option value="accommodation">Accommodation</option>
                          <option value="activity">Activity</option>
                          <option value="transportation">Transportation</option>
                          <option value="meal">Meal</option>
                        </select>
                      </div>

                      {/* Data Source Tabs - Only show for accommodation */}
                      {categoryType === 'accommodation' && (
                        <div className="flex gap-2 border-b border-gray-200">
                          <button
                            onClick={() => {
                              setDataSourceTab('database');
                              fetchStoredHotels();
                            }}
                            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${dataSourceTab === 'database'
                              ? 'border-green-600 text-green-600'
                              : 'border-transparent text-gray-600 hover:text-gray-900'
                              }`}
                          >
                            From Database
                          </button>
                          {hasPermission(user, 'itineraries.edit') && (
                            <button
                              onClick={() => {
                                setDataSourceTab('manual');
                                setShowManualAddModal(true);
                              }}
                              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-1 ${dataSourceTab === 'manual'
                                ? 'border-green-600 text-green-600'
                                : 'border-transparent text-gray-600 hover:text-gray-900'
                                }`}
                            >
                              <Plus className="h-4 w-4" />
                              Add Manual
                            </button>
                          )}
                          {hasPermission(user, 'itineraries.edit') && (
                            <button
                              onClick={() => {
                                setDataSourceTab('api');
                                setShowApiSearchModal(true);
                              }}
                              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-1 ${dataSourceTab === 'api'
                                ? 'border-green-600 text-green-600'
                                : 'border-transparent text-gray-600 hover:text-gray-900'
                                }`}
                            >
                              <Plus className="h-4 w-4" />
                              From API
                            </button>
                          )}
                        </div>
                      )}

                      {/* Items List - Cards */}
                      <div className="max-h-[600px] overflow-y-auto space-y-3">
                        {categoryType === 'day-itinerary' && (
                          <>
                            {dayItineraries
                              .filter(di => {
                                if (!searchQuery) return true;
                                const query = searchQuery.toLowerCase();
                                return (di.title || '').toLowerCase().includes(query) ||
                                  (di.destination || '').toLowerCase().includes(query) ||
                                  (di.details || '').toLowerCase().includes(query);
                              })
                              .map((di) => (
                                <div
                                  key={di.id}
                                  className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                                  onClick={() => {
                                    if (hasPermission(user, 'itineraries.edit')) {
                                      if (selectedDay) {
                                        handleAddDayItinerary(di.id);
                                      } else {
                                        toast.warning('Please select a day from the left (e.g. DAY 1, DAY 2) first, then add this item.');
                                      }
                                    }
                                  }}
                                >
                                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden border border-gray-200 flex-shrink-0">
                                    {di.image ? (
                                      <img
                                        src={getDisplayImageUrl(di.image) || di.image}
                                        alt={di.title || 'Day Itinerary'}
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
                                      <ImageIcon className="h-6 w-6 text-gray-400" />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-gray-900 text-sm mb-1">{di.title || di.destination || 'Day Itinerary'}</h4>
                                    <p className="text-xs text-gray-600 line-clamp-2">{di.details || di.destination || 'No description'}</p>
                                  </div>
                                  {hasPermission(user, 'itineraries.edit') && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (selectedDay) {
                                          handleAddDayItinerary(di.id);
                                        } else {
                                          toast.warning('Please select a day from the left (e.g. DAY 1, DAY 2) first, then add this item.');
                                        }
                                      }}
                                      className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center hover:bg-gray-800 flex-shrink-0"
                                    >
                                      <Plus className="h-4 w-4" />
                                    </button>
                                  )}
                                </div>
                              ))}
                          </>
                        )}

                        {categoryType === 'activity' && (
                          <>
                            {activitiesLoading ? (
                              <div className="flex items-center justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                              </div>
                            ) : (
                              activities
                                .filter(activity => {
                                  if (!searchQuery) return true;
                                  const query = searchQuery.toLowerCase();
                                  return (activity.activity_name || '').toLowerCase().includes(query) ||
                                    (activity.destination || '').toLowerCase().includes(query) ||
                                    (activity.activity_details || '').toLowerCase().includes(query);
                                })
                                .map((activity) => (
                                  <div
                                    key={activity.id}
                                    className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                                    onClick={() => {
                                      if (!hasPermission(user, 'itineraries.edit')) return;
                                      if (selectedDay) {
                                        const eventData = {
                                          id: Date.now(),
                                          subject: activity.activity_name || 'Activity',
                                          details: activity.activity_details || '',
                                          destination: activity.destination || '',
                                          eventType: 'activity',
                                          image: activity.activity_photo || null,
                                          type: 'Manual',
                                          name: activity.activity_name || '',
                                          date: '',
                                          startTime: '1:00 PM',
                                          endTime: '2:00 PM',
                                          showTime: false,
                                          hotelOptions: [],
                                          editingOptionIndex: null,
                                        };
                                        saveEvent(eventData);
                                      } else {
                                        toast.warning('Please select a day from the left (e.g. DAY 1, DAY 2) first, then add this item.');
                                      }
                                    }}
                                  >
                                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden border border-gray-200 flex-shrink-0">
                                      {activity.activity_photo ? (
                                        <img
                                          src={getDisplayImageUrl(activity.activity_photo) || activity.activity_photo}
                                          alt={activity.activity_name || 'Activity'}
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
                                        <ImageIcon className="h-6 w-6 text-gray-400" />
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h4 className="font-semibold text-gray-900 text-sm mb-1">{activity.activity_name || 'Activity'}</h4>
                                      <p className="text-xs text-gray-600 line-clamp-2">{activity.activity_details || activity.destination || 'No description'}</p>
                                    </div>
                                    {hasPermission(user, 'itineraries.edit') && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (selectedDay) {
                                            const eventData = {
                                              id: Date.now(),
                                              subject: activity.activity_name || 'Activity',
                                              details: activity.activity_details || '',
                                              destination: activity.destination || '',
                                              eventType: 'activity',
                                              image: activity.activity_photo || null,
                                              type: 'Manual',
                                              name: activity.activity_name || '',
                                              date: '',
                                              startTime: '1:00 PM',
                                              endTime: '2:00 PM',
                                              showTime: false,
                                              hotelOptions: [],
                                              editingOptionIndex: null,
                                            };
                                            saveEvent(eventData);
                                          } else {
                                            toast.warning('Please select a day from the left (e.g. DAY 1, DAY 2) first, then add this item.');
                                          }
                                        }}
                                        className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center hover:bg-gray-800 flex-shrink-0"
                                      >
                                        <Plus className="h-4 w-4" />
                                      </button>
                                    )}
                                  </div>
                                ))
                            )}
                          </>
                        )}

                        {categoryType === 'accommodation' && (
                          <>
                            {dataSourceTab === 'database' && (
                              <>
                                {storedHotelsLoading ? (
                                  <div className="flex items-center justify-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                  </div>
                                ) : (
                                  <>
                                    <div className="text-sm text-gray-600 mb-2">
                                      Suggested Accommodation in {days[selectedDay - 1]?.destination || 'null'}
                                    </div>
                                    {storedHotels.length > 0 ? (
                                      storedHotels
                                        .filter(hotel => {
                                          if (!searchQuery) return true;
                                          const query = searchQuery.toLowerCase();
                                          return (hotel.hotelName || hotel.name || '').toLowerCase().includes(query) ||
                                            (hotel.address || '').toLowerCase().includes(query) ||
                                            (hotel.destination || '').toLowerCase().includes(query);
                                        })
                                        .map((hotel) => (
                                          <div
                                            key={hotel.id}
                                            className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                                            onClick={() => hasPermission(user, 'itineraries.edit') && handleHotelSelect(hotel)}
                                          >
                                            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden border border-gray-200 flex-shrink-0">
                                              {hotel.image ? (
                                                <img
                                                  src={getDisplayImageUrl(hotel.image) || hotel.image}
                                                  alt={hotel.hotelName || hotel.name || 'Hotel'}
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
                                                <Bed className="h-6 w-6 text-gray-400" />
                                              )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                              <h4 className="font-semibold text-gray-900 text-sm mb-1">{hotel.hotelName || hotel.name || 'Hotel'}</h4>
                                              {hotel.rating && (
                                                <div className="flex items-center gap-1 mb-1">
                                                  {[...Array(Math.floor(hotel.rating))].map((_, i) => (
                                                    <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                                  ))}
                                                </div>
                                              )}
                                              {hotel.address && (
                                                <p className="text-xs text-gray-600 line-clamp-2">{hotel.address}</p>
                                              )}
                                            </div>
                                            {hasPermission(user, 'itineraries.edit') && (
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleHotelSelect(hotel);
                                                }}
                                                className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center hover:bg-gray-800 flex-shrink-0"
                                              >
                                                <Plus className="h-4 w-4" />
                                              </button>
                                            )}
                                          </div>
                                        ))
                                    ) : (
                                      <div className="text-center py-8 text-gray-500 text-sm">
                                        No hotels found in database. Use "+ Add Manual" to add hotels.
                                      </div>
                                    )}
                                  </>
                                )}
                              </>
                            )}

                            {dataSourceTab === 'api' && (
                              <>
                                {hotelSearchLoading ? (
                                  <div className="flex items-center justify-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                  </div>
                                ) : (
                                  <>
                                    {hotelSearchResults.length > 0 ? (
                                      hotelSearchResults
                                        .filter(hotel => {
                                          if (!searchQuery) return true;
                                          const query = searchQuery.toLowerCase();
                                          return (hotel.hotelName || hotel.name || '').toLowerCase().includes(query) ||
                                            (hotel.address || '').toLowerCase().includes(query);
                                        })
                                        .map((hotel) => (
                                          <div
                                            key={hotel.id}
                                            className="border border-gray-200 rounded-lg overflow-hidden"
                                          >
                                            <div className="flex items-start gap-3 p-3 hover:bg-gray-50 transition-colors">
                                              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden border border-gray-200 flex-shrink-0">
                                                {hotel.image ? (
                                                  <img
                                                    src={getDisplayImageUrl(hotel.image) || hotel.image}
                                                    alt={hotel.hotelName || hotel.name || 'Hotel'}
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
                                                  <Bed className="h-6 w-6 text-gray-400" />
                                                )}
                                              </div>
                                              <div className="flex-1 min-w-0">
                                                <h4 className="font-semibold text-gray-900 text-sm mb-1">{hotel.hotelName || hotel.name || 'Hotel'}</h4>
                                                {hotel.rating && (
                                                  <div className="flex items-center gap-1 mb-1">
                                                    {[...Array(Math.floor(hotel.rating))].map((_, i) => (
                                                      <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                                    ))}
                                                  </div>
                                                )}
                                                {hotel.address && (
                                                  <p className="text-xs text-gray-600 line-clamp-2 mb-2">{hotel.address}</p>
                                                )}
                                                <button
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    fetchHotelRooms(hotel.id, hotel.hotelName || hotel.name);
                                                  }}
                                                  className="bg-blue-600 text-white px-4 py-1.5 rounded text-xs font-medium hover:bg-blue-700 transition-colors"
                                                >
                                                  {expandedHotelId === hotel.id ? 'Hide Rooms' : 'View Rooms'}
                                                </button>
                                              </div>
                                            </div>

                                            {/* Room Types Section */}
                                            {expandedHotelId === hotel.id && (
                                              <div className="border-t border-gray-200 bg-gray-50 p-4">
                                                {roomsLoading ? (
                                                  <div className="flex items-center justify-center py-4">
                                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                                  </div>
                                                ) : hotelRooms[hotel.id] && hotelRooms[hotel.id].length > 0 ? (
                                                  <div className="space-y-3">
                                                    <div className="grid grid-cols-5 gap-2 text-xs font-semibold text-gray-700 mb-2 pb-2 border-b border-gray-300">
                                                      <div>Room Name</div>
                                                      <div>Number of guests</div>
                                                      <div>Meal Plan</div>
                                                      <div>Total Price</div>
                                                      <div></div>
                                                    </div>
                                                    {hotelRooms[hotel.id].map((room) => (
                                                      <div key={room.id} className="grid grid-cols-5 gap-2 items-center text-sm bg-white p-3 rounded border border-gray-200">
                                                        <div className="text-gray-900">{room.name}</div>
                                                        <div className="text-gray-600">{room.guests}</div>
                                                        <div className="text-gray-600">{room.mealPlan}</div>
                                                        <div className="text-gray-900 font-semibold">Rs. {room.price.toLocaleString()}</div>
                                                        <div>
                                                          {hasPermission(user, 'itineraries.edit') && (
                                                            <button
                                                              onClick={() => handleRoomSelect(hotel, room)}
                                                              className="bg-blue-600 text-white px-4 py-1.5 rounded text-xs font-medium hover:bg-blue-700 transition-colors w-full"
                                                            >
                                                              Select
                                                            </button>
                                                          )}
                                                        </div>
                                                      </div>
                                                    ))}
                                                  </div>
                                                ) : (
                                                  <div className="text-center py-4 text-gray-500 text-sm">
                                                    No rooms available
                                                  </div>
                                                )}
                                              </div>
                                            )}
                                          </div>
                                        ))
                                    ) : (
                                      <div className="text-center py-8 text-gray-500 text-sm">
                                        Click "+ From API" to search hotels
                                      </div>
                                    )}
                                  </>
                                )}
                              </>
                            )}
                          </>
                        )}

                        {categoryType === 'transportation' && (
                          <>
                            {storedTransfersLoading ? (
                              <div className="flex items-center justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                              </div>
                            ) : storedTransfers.length > 0 ? (
                              storedTransfers
                                .filter(transfer => {
                                  if (!searchQuery) return true;
                                  const query = searchQuery.toLowerCase();
                                  return (transfer.name || '').toLowerCase().includes(query) ||
                                    (transfer.destination || '').toLowerCase().includes(query) ||
                                    (transfer.transfer_details || '').toLowerCase().includes(query);
                                })
                                .map((transfer) => (
                                  <div
                                    key={transfer.id}
                                    className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                                    onClick={() => {
                                      if (!hasPermission(user, 'itineraries.edit')) return;
                                      if (selectedDay) {
                                        const eventData = {
                                          id: Date.now(),
                                          subject: transfer.name || 'Transfer',
                                          details: transfer.transfer_details || '',
                                          destination: transfer.destination || '',
                                          eventType: 'transportation',
                                          image: transfer.transfer_photo || null,
                                          type: 'Manual',
                                          name: transfer.name || '',
                                          date: '',
                                          startTime: '1:00 PM',
                                          endTime: '2:00 PM',
                                          showTime: false,
                                          hotelOptions: [],
                                          editingOptionIndex: null,
                                        };
                                        saveEvent(eventData);
                                      } else {
                                        toast.warning('Please select a day from the left (e.g. DAY 1, DAY 2) first, then add this item.');
                                      }
                                    }}
                                  >
                                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden border border-gray-200 flex-shrink-0">
                                      {transfer.transfer_photo ? (
                                        <img
                                          src={getDisplayImageUrl(transfer.transfer_photo) || transfer.transfer_photo}
                                          alt={transfer.name || 'Transfer'}
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
                                        <Car className="h-6 w-6 text-gray-400" />
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h4 className="font-semibold text-gray-900 text-sm mb-1">{transfer.name || 'Transfer'}</h4>
                                      <p className="text-xs text-gray-600 line-clamp-2">
                                        {transfer.transfer_details || transfer.destination || 'No description'}
                                      </p>
                                    </div>
                                    {hasPermission(user, 'itineraries.edit') && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (selectedDay) {
                                            const eventData = {
                                              id: Date.now(),
                                              subject: transfer.name || 'Transfer',
                                              details: transfer.transfer_details || '',
                                              destination: transfer.destination || '',
                                              eventType: 'transportation',
                                              image: transfer.transfer_photo || null,
                                              type: 'Manual',
                                              name: transfer.name || '',
                                              date: '',
                                              startTime: '1:00 PM',
                                              endTime: '2:00 PM',
                                              showTime: false,
                                              hotelOptions: [],
                                              editingOptionIndex: null,
                                            };
                                            saveEvent(eventData);
                                          } else {
                                            toast.warning('Please select a day from the left (e.g. DAY 1, DAY 2) first, then add this item.');
                                          }
                                        }}
                                        className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center hover:bg-gray-800 flex-shrink-0"
                                      >
                                        <Plus className="h-4 w-4" />
                                      </button>
                                    )}
                                  </div>
                                ))
                            ) : (
                              <div className="text-center py-8 text-gray-500 text-sm">
                                No transportation items found. Please add transfers in Masters → Transfer first.
                              </div>
                            )}
                          </>
                        )}

                        {categoryType === 'meal' && (
                          <>
                            {mealPlansLoading ? (
                              <div className="flex items-center justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                              </div>
                            ) : mealPlans.length > 0 ? (
                              mealPlans
                                .filter(meal => {
                                  if (!searchQuery) return true;
                                  const query = searchQuery.toLowerCase();
                                  return (meal.name || '').toLowerCase().includes(query);
                                })
                                .map((meal) => (
                                  <div
                                    key={meal.id}
                                    className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                                    onClick={() => {
                                      if (!hasPermission(user, 'itineraries.edit')) return;
                                      if (selectedDay) {
                                        const eventData = {
                                          id: Date.now(),
                                          subject: meal.name || 'Meal',
                                          details: '',
                                          destination: days[selectedDay - 1]?.destination || '',
                                          eventType: 'meal',
                                          image: null,
                                          type: 'Manual',
                                          name: meal.name || '',
                                          date: '',
                                          startTime: '1:00 PM',
                                          endTime: '2:00 PM',
                                          showTime: false,
                                          hotelOptions: [],
                                          editingOptionIndex: null,
                                          mealPlan: meal.name || '',
                                        };
                                        saveEvent(eventData);
                                      } else {
                                        toast.warning('Please select a day from the left (e.g. DAY 1, DAY 2) first, then add this item.');
                                      }
                                    }}
                                  >
                                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200 flex-shrink-0">
                                      <UtensilsCrossed className="h-6 w-6 text-gray-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h4 className="font-semibold text-gray-900 text-sm mb-1">{meal.name || 'Meal'}</h4>
                                      <p className="text-xs text-gray-600 line-clamp-2">
                                        Meal Plan
                                      </p>
                                    </div>
                                    {hasPermission(user, 'itineraries.edit') && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (selectedDay) {
                                            const eventData = {
                                              id: Date.now(),
                                              subject: meal.name || 'Meal',
                                              details: '',
                                              destination: days[selectedDay - 1]?.destination || '',
                                              eventType: 'meal',
                                              image: null,
                                              type: 'Manual',
                                              name: meal.name || '',
                                              date: '',
                                              startTime: '1:00 PM',
                                              endTime: '2:00 PM',
                                              showTime: false,
                                              hotelOptions: [],
                                              editingOptionIndex: null,
                                              mealPlan: meal.name || '',
                                            };
                                            saveEvent(eventData);
                                          } else {
                                            toast.warning('Please select a day from the left (e.g. DAY 1, DAY 2) first, then add this item.');
                                          }
                                        }}
                                        className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center hover:bg-gray-800 flex-shrink-0"
                                      >
                                        <Plus className="h-4 w-4" />
                                      </button>
                                    )}
                                  </div>
                                ))
                            ) : (
                              <div className="text-center py-8 text-gray-500 text-sm">
                                No meal plans found. Please add meal plans in Masters → Meal Plan first.
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'pricing' && (
            <PricingTab
              itinerary={itinerary}
              dayEvents={dayEvents}
              pricingData={pricingData}
              setPricingData={setPricingData}
              finalClientPrices={finalClientPrices}
              setFinalClientPrices={setFinalClientPrices}
              baseMarkup={baseMarkup}
              setBaseMarkup={setBaseMarkup}
              extraMarkup={extraMarkup}
              setExtraMarkup={setExtraMarkup}
              cgst={cgst}
              setCgst={setCgst}
              sgst={sgst}
              setSgst={setSgst}
              igst={igst}
              setIgst={setIgst}
              tcs={tcs}
              setTcs={setTcs}
              discount={discount}
              setDiscount={setDiscount}
              optionGstSettings={optionGstSettings}
              setOptionGstSettings={setOptionGstSettings}
              onPricingSaveSuccess={(gst) => setOptionGstSettings(gst || {})}
              showToastNotification={(type, title, msg) => {
                const text = title ? `${title}: ${msg}` : msg;
                if (type === 'error') toast.error(text);
                else if (type === 'warning') toast.warning(text);
                else if (type === 'success') toast.success(text);
                else toast.info(text);
              }}
              readOnly={!hasPermission(user, 'itineraries.edit')}
            />
          )}

          {activeTab === 'final' && (
            <FinalTab
              itinerary={itinerary}
              dayEvents={dayEvents}
              pricingData={pricingData}
              finalClientPrices={finalClientPrices}
              packageTerms={packageTerms}
              baseMarkup={baseMarkup}
              extraMarkup={extraMarkup}
              cgst={cgst}
              sgst={sgst}
              igst={igst}
              tcs={tcs}
              discount={discount}
              maxHotelOptions={maxHotelOptions}
              optionGstSettings={optionGstSettings}
            />
          )}

          {/* Day Details Modal */}
          {showDayDetailsModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4">
                {/* Modal Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-200">
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">
                      {dayDetailsForm.eventType === 'day-itinerary'
                        ? `Day Itinerary in day ${selectedDay}`
                        : dayDetailsForm.eventType
                          ? `${dayDetailsForm.eventType.charAt(0).toUpperCase() + dayDetailsForm.eventType.slice(1).replace('-', ' ')} in day ${selectedDay}`
                          : `Day ${selectedDay} Details`}
                    </h2>
                    {dayDetailsForm.eventType && (
                      <p className="text-sm text-gray-500 mt-1">
                        Event Type: {dayDetailsForm.eventType === 'day-itinerary' ? 'Day Itinerary' : dayDetailsForm.eventType.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setShowDayDetailsModal(false);
                      setDayDetailsForm({
                        subject: '',
                        details: '',
                        image: null,
                        eventType: '',
                        id: null,
                        destination: '',
                        type: 'Manual',
                        hotelOptions: [],
                        editingOptionIndex: null,
                        hotelName: '',
                        hotel_id: null,
                        category: '1',
                        roomName: '',
                        mealPlan: '',
                        single: '',
                        double: '',
                        triple: '',
                        quad: '',
                        cwb: '',
                        cnb: '',
                        checkIn: '',
                        checkInTime: '2:00 PM',
                        checkOut: '',
                        checkOutTime: '11:00',
                        hotel_details: '',
                        hotel_photo: null,
                        contact_person: '',
                        email: '',
                        phone: '',
                        hotel_address: '',
                        hotel_link: '',
                        status: 'active',
                        name: '',
                        date: '',
                        startTime: '1:00 PM',
                        endTime: '2:00 PM',
                        showTime: false,
                        transferType: 'Private',
                        mealType: 'Breakfast'
                      });
                      setEventImagePreview(null);
                      setHotelPhotoPreview(null);
                      setShowDayItineraryImageModal(false);
                      setDayItineraryLibraryPackages([]);
                      setDayItineraryFreeStockPhotos([]);
                    }}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                {/* Modal Body - Same fields as Master forms (Day Itinerary, Activity, etc.) */}
                <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                  {dayDetailsForm.eventType === 'day-itinerary' ? (
                    <>
                      {/* Day Itinerary form - same fields as Masters → Day Itinerary */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Destination</label>
                        <input
                          type="text"
                          value={dayDetailsForm.destination || ''}
                          onChange={(e) => setDayDetailsForm({ ...dayDetailsForm, destination: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter destination"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                        <input
                          type="text"
                          value={dayDetailsForm.subject || dayDetailsForm.name || ''}
                          onChange={(e) => setDayDetailsForm({ ...dayDetailsForm, subject: e.target.value, name: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter title"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Details</label>
                        <textarea
                          value={dayDetailsForm.details || ''}
                          onChange={(e) => setDayDetailsForm({ ...dayDetailsForm, details: e.target.value })}
                          rows={6}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter details"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
                        <div className="space-y-2">
                          {eventImagePreview ? (
                            <div className="relative">
                              <img src={eventImagePreview} alt="Preview" className="w-full h-48 object-cover rounded-lg border border-gray-300" />
                              <button
                                type="button"
                                onClick={() => { setDayDetailsForm({ ...dayDetailsForm, image: null }); setEventImagePreview(null); }}
                                className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full hover:bg-red-700"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                              <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                              <p className="text-sm text-gray-600 mb-3">No image selected</p>
                            </div>
                          )}
                          <div className="flex gap-2">
                            <label className="flex-1 cursor-pointer">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files[0];
                                  if (file) {
                                    setDayDetailsForm({ ...dayDetailsForm, image: file });
                                    setDayItineraryImageSource('upload');
                                    const reader = new FileReader();
                                    reader.onloadend = () => setEventImagePreview(reader.result);
                                    reader.readAsDataURL(file);
                                  }
                                }}
                                className="hidden"
                              />
                              <div className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                                <Upload className="h-4 w-4" />
                                <span className="text-sm font-medium">Upload Image</span>
                              </div>
                            </label>
                            <button
                              type="button"
                              onClick={() => {
                                setDayItineraryImageSource('library');
                                setShowDayItineraryImageModal(true);
                              }}
                              className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
                            >
                              <Camera className="h-4 w-4" />
                              <span className="text-sm font-medium">Choose from Library</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : dayDetailsForm.eventType === 'accommodation' ? (
                    <>
                      {/* Existing Hotel Options List - Only show when editing existing event */}
                      {dayDetailsForm.id && dayDetailsForm.hotelOptions && dayDetailsForm.hotelOptions.length > 0 && (
                        <div className="space-y-4 mb-6">
                          <h3 className="text-lg font-semibold text-gray-800">Hotel Options</h3>
                          {dayDetailsForm.hotelOptions.map((option, index) => (
                            <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                  <div className="relative">
                                    <Building2 className="h-8 w-8 text-blue-600" />
                                    {option.image && (
                                      <button className="absolute -bottom-1 -right-1 bg-black/50 rounded-full p-1">
                                        <Edit className="h-3 w-3 text-white" />
                                      </button>
                                    )}
                                  </div>
                                  <div>
                                    <h4 className="font-semibold text-gray-900">{option.hotelName || 'Hotel Name'}</h4>
                                    <div className="flex items-center gap-1 mt-1">
                                      {[...Array(parseInt(option.category || 1))].map((_, i) => (
                                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                      ))}
                                      <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                                        Option {option.optionNumber || (index + 1)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="grid grid-cols-3 gap-4 text-sm">
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4 text-gray-500" />
                                  <span className="text-gray-600">Check-in:</span>
                                  <span className="font-medium">{option.checkIn ? new Date(option.checkIn).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4 text-gray-500" />
                                  <span className="text-gray-600">Check-out:</span>
                                  <span className="font-medium">{option.checkOut ? new Date(option.checkOut).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Hash className="h-4 w-4 text-gray-500" />
                                  <span className="text-gray-600">Room:</span>
                                  <span className="font-medium">#{option.roomName || 'N/A'}</span>
                                </div>
                              </div>
                              <div className="mt-3 space-y-1">
                                {[
                                  { label: 'Single', value: option.single },
                                  { label: 'Double', value: option.double },
                                  { label: 'Triple', value: option.triple },
                                  { label: 'Quad', value: option.quad },
                                  { label: 'Child With Bed', value: option.cwb },
                                  { label: 'Child No Bed', value: option.cnb }
                                ].filter(room => room.value && parseInt(room.value) > 0).map((room, idx) => (
                                  <div key={idx} className="text-sm text-gray-700">
                                    Room: {room.value} {room.label} | Meal: {option.mealPlan || 'N/A'}
                                  </div>
                                ))}
                              </div>
                              {option.details && (
                                <p className="mt-2 text-sm text-gray-600">{option.details}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add Hotel Form - Same as Masters (Add Hotel) */}
                      {!dayDetailsForm.id && (
                        <div className="border-t border-gray-200 pt-4 space-y-4">
                          <h3 className="text-lg font-semibold text-gray-800 mb-4">Add Hotel (same as Masters)</h3>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Hotel name *</label>
                            <input
                              type="text"
                              value={dayDetailsForm.hotelName}
                              onChange={(e) => setDayDetailsForm({ ...dayDetailsForm, hotelName: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Enter hotel name"
                              required
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                              <select
                                value={dayDetailsForm.category}
                                onChange={(e) => setDayDetailsForm({ ...dayDetailsForm, category: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                              >
                                <option value="">Select</option>
                                <option value="1">1 Star</option>
                                <option value="2">2 Stars</option>
                                <option value="3">3 Stars</option>
                                <option value="4">4 Stars</option>
                                <option value="5">5 Stars</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Destination *</label>
                              <input
                                type="text"
                                value={dayDetailsForm.destination}
                                onChange={(e) => setDayDetailsForm({ ...dayDetailsForm, destination: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter destination"
                                required
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Hotel Details</label>
                            <textarea
                              value={dayDetailsForm.hotel_details}
                              onChange={(e) => setDayDetailsForm({ ...dayDetailsForm, hotel_details: e.target.value })}
                              rows={4}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Enter hotel details"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Hotel Photo *</label>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files[0];
                                if (file) {
                                  setDayDetailsForm({ ...dayDetailsForm, hotel_photo: file });
                                  const reader = new FileReader();
                                  reader.onloadend = () => setHotelPhotoPreview(reader.result);
                                  reader.readAsDataURL(file);
                                }
                              }}
                              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            />
                            {hotelPhotoPreview && (
                              <img src={hotelPhotoPreview} alt="Preview" className="mt-2 h-20 w-20 object-cover rounded-lg" />
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                              <input
                                type="text"
                                value={dayDetailsForm.contact_person}
                                onChange={(e) => setDayDetailsForm({ ...dayDetailsForm, contact_person: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter contact person name"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                              <input
                                type="email"
                                value={dayDetailsForm.email}
                                onChange={(e) => setDayDetailsForm({ ...dayDetailsForm, email: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter email"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                            <input
                              type="tel"
                              value={dayDetailsForm.phone}
                              onChange={(e) => setDayDetailsForm({ ...dayDetailsForm, phone: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Enter phone number"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Hotel Address *</label>
                            <input
                              type="text"
                              value={dayDetailsForm.hotel_address}
                              onChange={(e) => setDayDetailsForm({ ...dayDetailsForm, hotel_address: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Enter hotel address"
                              required
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
                              <select
                                value={dayDetailsForm.status}
                                onChange={(e) => setDayDetailsForm({ ...dayDetailsForm, status: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                              >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Hotel Link</label>
                              <input
                                type="url"
                                value={dayDetailsForm.hotel_link}
                                onChange={(e) => setDayDetailsForm({ ...dayDetailsForm, hotel_link: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter hotel website link"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                    </>
                  ) : dayDetailsForm.eventType === 'activity' ? (
                    <>
                      {/* Activity form - same as Masters */}
                      <div className="border-t border-gray-200 pt-4 space-y-4">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Add Activity (same as Masters)</h3>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                          <input
                            type="text"
                            value={dayDetailsForm.name}
                            onChange={(e) => setDayDetailsForm({ ...dayDetailsForm, name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter activity name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Destination</label>
                          <select
                            value={dayDetailsForm.destination}
                            onChange={(e) => setDayDetailsForm({ ...dayDetailsForm, destination: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Select Destination</option>
                            {destinations.map((dest) => (
                              <option key={dest} value={dest}>{dest}</option>
                            ))}
                            {days[selectedDay - 1]?.destination && !destinations.includes(days[selectedDay - 1].destination) && (
                              <option value={days[selectedDay - 1].destination}>{days[selectedDay - 1].destination}</option>
                            )}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Activity Details</label>
                          <textarea
                            value={dayDetailsForm.activity_details}
                            onChange={(e) => setDayDetailsForm({ ...dayDetailsForm, activity_details: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            placeholder="Enter activity details"
                            rows="3"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Activity Photo</label>
                          <div className="flex gap-2">
                            <label className="flex-1 cursor-pointer">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files[0];
                                  if (file) {
                                    setDayDetailsForm({ ...dayDetailsForm, activity_photo: file });
                                    const reader = new FileReader();
                                    reader.onloadend = () => setEventImagePreview(reader.result);
                                    reader.readAsDataURL(file);
                                  }
                                }}
                                className="hidden"
                              />
                              <div className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                                <Upload className="h-4 w-4" />
                                <span className="text-sm font-medium">Upload Image</span>
                              </div>
                            </label>
                            <button
                              type="button"
                              onClick={() => setShowDayItineraryImageModal(true)}
                              className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
                            >
                              <Camera className="h-4 w-4" />
                              <span className="text-sm font-medium">Choose from Library</span>
                            </button>
                          </div>
                          {(eventImagePreview || dayDetailsForm.activity_photo) && (
                            <div className="mt-3 relative inline-block">
                              <img
                                src={eventImagePreview || (typeof dayDetailsForm.activity_photo === 'string' ? dayDetailsForm.activity_photo : '')}
                                alt="Activity Preview"
                                className="w-full h-48 object-cover rounded-lg border border-gray-300"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  setDayDetailsForm({ ...dayDetailsForm, activity_photo: null });
                                  setEventImagePreview(null);
                                }}
                                className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full hover:bg-red-700"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
                          <select
                            value={dayDetailsForm.status}
                            onChange={(e) => setDayDetailsForm({ ...dayDetailsForm, status: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                          </select>
                        </div>
                      </div>
                    </>
                  ) : dayDetailsForm.eventType === 'transportation' ? (
                    <>
                      {/* Transportation form - same as Masters */}
                      <div className="border-t border-gray-200 pt-4 space-y-4">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Add Transportation (same as Masters)</h3>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                          <input
                            type="text"
                            value={dayDetailsForm.name}
                            onChange={(e) => setDayDetailsForm({ ...dayDetailsForm, name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter transportation name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Destination</label>
                          <select
                            value={dayDetailsForm.destination}
                            onChange={(e) => setDayDetailsForm({ ...dayDetailsForm, destination: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Select Destination</option>
                            {destinations.map((dest) => (
                              <option key={dest} value={dest}>{dest}</option>
                            ))}
                            {days[selectedDay - 1]?.destination && !destinations.includes(days[selectedDay - 1].destination) && (
                              <option value={days[selectedDay - 1].destination}>{days[selectedDay - 1].destination}</option>
                            )}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Transfer Details</label>
                          <textarea
                            value={dayDetailsForm.transfer_details}
                            onChange={(e) => setDayDetailsForm({ ...dayDetailsForm, transfer_details: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            placeholder="Enter transfer details"
                            rows="3"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Transfer Photo</label>
                          <div className="flex gap-2">
                            <label className="flex-1 cursor-pointer">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files[0];
                                  if (file) {
                                    setDayDetailsForm({ ...dayDetailsForm, transfer_photo: file });
                                    const reader = new FileReader();
                                    reader.onloadend = () => setEventImagePreview(reader.result);
                                    reader.readAsDataURL(file);
                                  }
                                }}
                                className="hidden"
                              />
                              <div className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                                <Upload className="h-4 w-4" />
                                <span className="text-sm font-medium">Upload Image</span>
                              </div>
                            </label>
                            <button
                              type="button"
                              onClick={() => setShowDayItineraryImageModal(true)}
                              className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
                            >
                              <Camera className="h-4 w-4" />
                              <span className="text-sm font-medium">Choose from Library</span>
                            </button>
                          </div>
                          {(eventImagePreview || dayDetailsForm.transfer_photo) && (
                            <div className="mt-3 relative inline-block">
                              <img
                                src={eventImagePreview || (typeof dayDetailsForm.transfer_photo === 'string' ? dayDetailsForm.transfer_photo : '')}
                                alt="Transfer Preview"
                                className="w-full h-48 object-cover rounded-lg border border-gray-300"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  setDayDetailsForm({ ...dayDetailsForm, transfer_photo: null });
                                  setEventImagePreview(null);
                                }}
                                className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full hover:bg-red-700"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
                          <select
                            value={dayDetailsForm.status}
                            onChange={(e) => setDayDetailsForm({ ...dayDetailsForm, status: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                          </select>
                        </div>
                      </div>
                    </>
                  ) : dayDetailsForm.eventType === 'flight' ? (
                    <>
                      {/* Flight Specific Fields */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Destination
                          </label>
                          <select
                            value={dayDetailsForm.destination}
                            onChange={(e) => setDayDetailsForm({ ...dayDetailsForm, destination: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Select Destination</option>
                            {destinations.map((dest) => (
                              <option key={dest} value={dest}>{dest}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Type
                          </label>
                          <select
                            value={dayDetailsForm.type}
                            onChange={(e) => setDayDetailsForm({ ...dayDetailsForm, type: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="Manual">Manual</option>
                            <option value="Automatic">Automatic</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Name
                        </label>
                        <input
                          type="text"
                          value={dayDetailsForm.name}
                          onChange={(e) => setDayDetailsForm({ ...dayDetailsForm, name: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter flight name"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Date <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          value={dayDetailsForm.date}
                          onChange={(e) => setDayDetailsForm({ ...dayDetailsForm, date: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Start time
                          </label>
                          <select
                            value={dayDetailsForm.startTime}
                            onChange={(e) => setDayDetailsForm({ ...dayDetailsForm, startTime: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="1:00 PM">1:00 PM</option>
                            <option value="2:00 PM">2:00 PM</option>
                            <option value="3:00 PM">3:00 PM</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            End time
                          </label>
                          <select
                            value={dayDetailsForm.endTime}
                            onChange={(e) => setDayDetailsForm({ ...dayDetailsForm, endTime: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="2:00 PM">2:00 PM</option>
                            <option value="3:00 PM">3:00 PM</option>
                            <option value="4:00 PM">4:00 PM</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Description
                        </label>
                        <textarea
                          value={dayDetailsForm.details}
                          onChange={(e) => setDayDetailsForm({ ...dayDetailsForm, details: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                          placeholder="Enter description"
                          rows="4"
                        />
                      </div>
                    </>
                  ) : dayDetailsForm.eventType === 'meal' ? (
                    <>
                      {/* Meal form - same as Masters */}
                      <div className="border-t border-gray-200 pt-4 space-y-4">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Add Meal Plan (same as Masters)</h3>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                          <input
                            type="text"
                            value={dayDetailsForm.name}
                            onChange={(e) => setDayDetailsForm({ ...dayDetailsForm, name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter meal plan name (e.g. Breakfast, Lunch, Dinner)"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
                          <select
                            value={dayDetailsForm.status}
                            onChange={(e) => setDayDetailsForm({ ...dayDetailsForm, status: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                          </select>
                        </div>
                      </div>
                    </>
                  ) : dayDetailsForm.eventType === 'leisure' ? (
                    <>
                      {/* Leisure Specific Fields */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Name
                        </label>
                        <input
                          type="text"
                          value={dayDetailsForm.name || 'Day at Leisure'}
                          onChange={(e) => setDayDetailsForm({ ...dayDetailsForm, name: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter leisure name"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Destination
                        </label>
                        <select
                          value={dayDetailsForm.destination}
                          onChange={(e) => setDayDetailsForm({ ...dayDetailsForm, destination: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select Destination</option>
                          {destinations.map((dest) => (
                            <option key={dest} value={dest}>{dest}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Description
                        </label>
                        <textarea
                          value={dayDetailsForm.details}
                          onChange={(e) => setDayDetailsForm({ ...dayDetailsForm, details: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                          placeholder="Enter description"
                          rows="4"
                        />
                      </div>
                    </>
                  ) : dayDetailsForm.eventType === 'cruise' ? (
                    <>
                      {/* Cruise Specific Fields */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Name
                        </label>
                        <input
                          type="text"
                          value={dayDetailsForm.name}
                          onChange={(e) => setDayDetailsForm({ ...dayDetailsForm, name: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter cruise name"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Destination
                        </label>
                        <select
                          value={dayDetailsForm.destination}
                          onChange={(e) => setDayDetailsForm({ ...dayDetailsForm, destination: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select Destination</option>
                          {destinations.map((dest) => (
                            <option key={dest} value={dest}>{dest}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Date <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          value={dayDetailsForm.date}
                          onChange={(e) => setDayDetailsForm({ ...dayDetailsForm, date: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Start time
                          </label>
                          <select
                            value={dayDetailsForm.startTime}
                            onChange={(e) => setDayDetailsForm({ ...dayDetailsForm, startTime: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="1:00 PM">1:00 PM</option>
                            <option value="2:00 PM">2:00 PM</option>
                            <option value="3:00 PM">3:00 PM</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            End time
                          </label>
                          <select
                            value={dayDetailsForm.endTime}
                            onChange={(e) => setDayDetailsForm({ ...dayDetailsForm, endTime: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="2:00 PM">2:00 PM</option>
                            <option value="3:00 PM">3:00 PM</option>
                            <option value="4:00 PM">4:00 PM</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Description
                        </label>
                        <textarea
                          value={dayDetailsForm.details}
                          onChange={(e) => setDayDetailsForm({ ...dayDetailsForm, details: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                          placeholder="Enter description"
                          rows="4"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Default Fields for other event types */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Subject
                        </label>
                        <input
                          type="text"
                          value={dayDetailsForm.subject}
                          onChange={(e) => setDayDetailsForm({ ...dayDetailsForm, subject: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter subject"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Details
                        </label>
                        <textarea
                          value={dayDetailsForm.details}
                          onChange={(e) => setDayDetailsForm({ ...dayDetailsForm, details: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                          placeholder="Enter details"
                          rows="6"
                        />
                      </div>
                    </>
                  )}

                  {/* Image Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Image
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          setDayDetailsForm({ ...dayDetailsForm, image: file });
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setEventImagePreview(reader.result);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {eventImagePreview && (
                      <div className="mt-3">
                        <img
                          src={eventImagePreview}
                          alt="Preview"
                          className="w-32 h-32 object-cover rounded-lg border border-gray-300"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex justify-end p-6 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setShowDayDetailsModal(false);
                      setDayDetailsForm({
                        subject: '',
                        details: '',
                        image: null,
                        eventType: '',
                        id: null,
                        destination: '',
                        type: 'Manual',
                        name: '',
                        date: '',
                        startTime: '1:00 PM',
                        endTime: '2:00 PM',
                        showTime: false,
                        hotelName: '',
                        category: '1',
                        roomName: '',
                        mealPlan: '',
                        hotelOption: 'Option 1',
                        single: '',
                        double: '',
                        triple: '',
                        quad: '',
                        cwb: '',
                        cnb: '',
                        checkIn: '',
                        checkInTime: '2:00 PM',
                        checkOut: '',
                        checkOutTime: '11:00',
                        hotel_details: '',
                        hotel_photo: null,
                        contact_person: '',
                        email: '',
                        phone: '',
                        hotel_address: '',
                        hotel_link: '',
                        status: 'active',
                        activity_details: '',
                        activity_photo: null,
                        transfer_details: '',
                        transfer_photo: null,
                        transferType: 'Private',
                        mealType: 'Breakfast'
                      });
                      setEventImagePreview(null);
                      setHotelPhotoPreview(null);
                    }}
                    className="px-4 py-2 text-gray-700 hover:text-gray-900 mr-3"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      // Generate subject based on event type
                      let subject = '';
                      if (dayDetailsForm.eventType === 'accommodation') {
                        const hasHotelOptions = dayDetailsForm.hotelOptions && dayDetailsForm.hotelOptions.length > 0;
                        const hasMastersFormData = dayDetailsForm.hotelName?.trim() && dayDetailsForm.hotel_address?.trim();
                        if (!hasHotelOptions && !hasMastersFormData) {
                          toast.warning('Please fill hotel name and hotel address (or add hotel option)');
                          return;
                        }
                        subject = hasHotelOptions
                          ? dayDetailsForm.hotelOptions[0]?.hotelName || dayDetailsForm.destination || 'Accommodation'
                          : dayDetailsForm.hotelName;
                      } else if (dayDetailsForm.eventType === 'day-itinerary') {
                        subject = dayDetailsForm.subject || dayDetailsForm.name || '';
                        if (!subject.trim()) {
                          toast.warning('Please enter title');
                          return;
                        }
                      } else if (['activity', 'transportation', 'meal'].includes(dayDetailsForm.eventType)) {
                        subject = dayDetailsForm.name || dayDetailsForm.subject || '';
                        if (!subject.trim()) {
                          toast.warning(`Please enter ${dayDetailsForm.eventType} name`);
                          return;
                        }
                      } else {
                        subject = dayDetailsForm.subject || '';
                        if (!subject.trim()) {
                          toast.warning('Please enter a subject');
                          return;
                        }
                      }

                      let imageData = eventImagePreview || dayDetailsForm.image;

                      // For accommodation with Masters form: save to Hotels API first so it appears in side search
                      if (dayDetailsForm.eventType === 'accommodation') {
                        const hasHotelOptions = dayDetailsForm.hotelOptions && dayDetailsForm.hotelOptions.length > 0;
                        const hasMastersFormData = dayDetailsForm.hotelName?.trim() && dayDetailsForm.hotel_address?.trim();
                        if (!hasHotelOptions && hasMastersFormData) {
                          try {
                            const hotelData = new FormData();
                            hotelData.append('name', dayDetailsForm.hotelName);
                            hotelData.append('category', String(parseInt(dayDetailsForm.category, 10) || 1));
                            hotelData.append('destination', dayDetailsForm.destination || '');
                            hotelData.append('hotel_details', dayDetailsForm.hotel_details || '');
                            if (dayDetailsForm.hotel_photo) {
                              hotelData.append('hotel_photo', dayDetailsForm.hotel_photo);
                            }
                            hotelData.append('contact_person', dayDetailsForm.contact_person || '');
                            hotelData.append('email', dayDetailsForm.email || '');
                            hotelData.append('phone', dayDetailsForm.phone || '');
                            hotelData.append('hotel_address', dayDetailsForm.hotel_address);
                            hotelData.append('hotel_link', dayDetailsForm.hotel_link || '');
                            hotelData.append('status', dayDetailsForm.status || 'active');
                            const createRes = await hotelsAPI.create(hotelData);
                            const created = createRes?.data?.data || createRes?.data;
                            if (created) {
                              let imgUrl = created.hotel_photo || created.image;
                              if (imgUrl && (imgUrl.startsWith('/storage') || (imgUrl.startsWith('/') && !imgUrl.startsWith('http')))) {
                                const baseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api').replace('/api', '');
                                imgUrl = `${baseUrl}${imgUrl}`;
                              }
                              const accommodationEvents = (dayEvents[selectedDay] || []).filter(e => e.eventType === 'accommodation');
                              const nextOptionNumber = accommodationEvents.length + 1;
                              const eventData = {
                                id: Date.now(),
                                subject: created.name || dayDetailsForm.hotelName,
                                details: dayDetailsForm.hotel_details || '',
                                destination: created.destination || dayDetailsForm.destination,
                                eventType: 'accommodation',
                                image: imgUrl,
                                type: 'Manual',
                                name: created.name || dayDetailsForm.hotelName,
                                hotelOptions: [{
                                  hotelName: created.name || dayDetailsForm.hotelName,
                                  hotel_id: created.id,
                                  category: (created.category || dayDetailsForm.category || '1').toString(),
                                  image: imgUrl,
                                  roomName: '',
                                  mealPlan: '',
                                  single: '',
                                  double: '',
                                  triple: '',
                                  quad: '',
                                  cwb: '',
                                  cnb: '',
                                  checkIn: '',
                                  checkInTime: '2:00 PM',
                                  checkOut: '',
                                  checkOutTime: '11:00',
                                  optionNumber: nextOptionNumber,
                                  destination: created.destination || dayDetailsForm.destination,
                                  details: dayDetailsForm.hotel_details || ''
                                }]
                              };
                              saveEvent(eventData);
                              await fetchStoredHotels();
                            }
                          } catch (err) {
                            console.error('Failed to save hotel to Masters:', err);
                            toast.error(err?.response?.data?.message || 'Failed to save hotel. Please try again.');
                          }
                          return;
                        }
                      }

                      // Helper function to create event data
                      const createEventData = (image) => {
                        const baseData = {
                          id: dayDetailsForm.id || Date.now(),
                          subject: subject,
                          details: dayDetailsForm.details,
                          eventType: dayDetailsForm.eventType,
                          image: image,
                          destination: dayDetailsForm.destination,
                          type: dayDetailsForm.type,
                          name: dayDetailsForm.name,
                          date: dayDetailsForm.date,
                          startTime: dayDetailsForm.startTime,
                          endTime: dayDetailsForm.endTime,
                          showTime: dayDetailsForm.showTime
                        };

                        // Add accommodation specific fields
                        if (dayDetailsForm.eventType === 'accommodation') {
                          baseData.hotelOptions = dayDetailsForm.hotelOptions || [];
                          baseData.destination = dayDetailsForm.destination;
                          baseData.type = dayDetailsForm.type;
                        }

                        // Add transportation specific fields
                        if (dayDetailsForm.eventType === 'transportation') {
                          baseData.transferType = dayDetailsForm.transferType;
                        }

                        // Add meal specific fields
                        if (dayDetailsForm.eventType === 'meal') {
                          baseData.mealType = dayDetailsForm.mealType;
                        }

                        return baseData;
                      };

                      // For day-itinerary: save to Masters first so it shows in search/dropdown
                      if (dayDetailsForm.eventType === 'day-itinerary') {
                        try {
                          const submitData = new FormData();
                          submitData.append('destination', dayDetailsForm.destination || '');
                          submitData.append('title', subject);
                          submitData.append('details', dayDetailsForm.details || '');
                          submitData.append('status', 'active');
                          if (dayDetailsForm.image instanceof File) {
                            submitData.append('image', dayDetailsForm.image);
                          } else if (eventImagePreview && typeof eventImagePreview === 'string' && eventImagePreview.startsWith('http')) {
                            const res = await fetch(eventImagePreview);
                            const blob = await res.blob();
                            const file = new File([blob], 'day-itinerary-image.jpg', { type: blob.type || 'image/jpeg' });
                            submitData.append('image', file);
                          }
                          const createRes = await dayItinerariesAPI.create(submitData);
                          const created = createRes?.data?.data || createRes?.data;
                          if (created) {
                            let imgUrl = created.image;
                            if (imgUrl && (imgUrl.startsWith('/storage') || (imgUrl.startsWith('/') && !imgUrl.startsWith('http')))) {
                              const baseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api').replace('/api', '');
                              imgUrl = `${baseUrl}${imgUrl}`;
                            }
                            if (imgUrl && imgUrl.includes('localhost') && !imgUrl.includes(':8000')) {
                              imgUrl = imgUrl.replace('localhost', 'localhost:8000');
                            }
                            saveEvent({
                              id: created.id,
                              subject: created.title || subject,
                              details: created.details || dayDetailsForm.details,
                              destination: created.destination || dayDetailsForm.destination,
                              eventType: 'day-itinerary',
                              image: imgUrl || imageData,
                              type: 'Manual',
                              name: created.title || subject
                            });
                            await fetchDayItineraries();
                          } else {
                            if (dayDetailsForm.image instanceof File) {
                              const reader = new FileReader();
                              reader.onloadend = () => saveEvent(createEventData(reader.result));
                              reader.readAsDataURL(dayDetailsForm.image);
                            } else {
                              saveEvent(createEventData(imageData));
                            }
                          }
                        } catch (err) {
                          console.error('Failed to save day itinerary to Masters:', err);
                          toast.error(err?.response?.data?.message || 'Failed to save to Masters. Please try again.');
                        }
                        return;
                      }

                      // For activity: save to Masters first so it shows in search/dropdown
                      if (dayDetailsForm.eventType === 'activity') {
                        try {
                          const activityData = new FormData();
                          activityData.append('name', dayDetailsForm.name || '');
                          activityData.append('destination', dayDetailsForm.destination || '');
                          activityData.append('activity_details', dayDetailsForm.activity_details || '');
                          if (dayDetailsForm.activity_photo instanceof File) {
                            activityData.append('activity_photo', dayDetailsForm.activity_photo);
                          } else {
                            const photoUrl = typeof dayDetailsForm.activity_photo === 'string' ? dayDetailsForm.activity_photo : eventImagePreview;
                            if (photoUrl && typeof photoUrl === 'string') {
                              const url = photoUrl.startsWith('http') ? photoUrl : `${(import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api').replace('/api', '')}${photoUrl}`;
                              const res = await fetch(url);
                              const blob = await res.blob();
                              const file = new File([blob], 'activity-image.jpg', { type: blob.type || 'image/jpeg' });
                              activityData.append('activity_photo', file);
                            }
                          }
                          activityData.append('status', dayDetailsForm.status || 'active');
                          const createRes = await activitiesAPI.create(activityData);
                          const created = createRes?.data?.data || createRes?.data;
                          if (created) {
                            let imgUrl = created.activity_photo || created.image;
                            if (imgUrl && (imgUrl.startsWith('/storage') || (imgUrl.startsWith('/') && !imgUrl.startsWith('http')))) {
                              const baseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api').replace('/api', '');
                              imgUrl = `${baseUrl}${imgUrl}`;
                            }
                            if (imgUrl && imgUrl.includes('localhost') && !imgUrl.includes(':8000')) {
                              imgUrl = imgUrl.replace('localhost', 'localhost:8000');
                            }
                            saveEvent({
                              id: Date.now(),
                              subject: created.name || dayDetailsForm.name,
                              details: created.activity_details || dayDetailsForm.activity_details,
                              destination: created.destination || dayDetailsForm.destination,
                              eventType: 'activity',
                              image: imgUrl || eventImagePreview,
                              type: 'Manual',
                              name: created.name || dayDetailsForm.name
                            });
                            await fetchActivities();
                          }
                        } catch (err) {
                          console.error('Failed to save activity to Masters:', err);
                          toast.error(err?.response?.data?.message || 'Failed to save activity. Please try again.');
                        }
                        return;
                      }

                      // For transportation: save to Masters first so it shows in search/dropdown
                      if (dayDetailsForm.eventType === 'transportation') {
                        try {
                          const transferData = new FormData();
                          transferData.append('name', dayDetailsForm.name || '');
                          transferData.append('destination', dayDetailsForm.destination || '');
                          transferData.append('transfer_details', dayDetailsForm.transfer_details || '');
                          if (dayDetailsForm.transfer_photo instanceof File) {
                            transferData.append('transfer_photo', dayDetailsForm.transfer_photo);
                          } else {
                            const photoUrl = typeof dayDetailsForm.transfer_photo === 'string' ? dayDetailsForm.transfer_photo : eventImagePreview;
                            if (photoUrl && typeof photoUrl === 'string') {
                              const url = photoUrl.startsWith('http') ? photoUrl : `${(import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api').replace('/api', '')}${photoUrl}`;
                              const res = await fetch(url);
                              const blob = await res.blob();
                              const file = new File([blob], 'transfer-image.jpg', { type: blob.type || 'image/jpeg' });
                              transferData.append('transfer_photo', file);
                            }
                          }
                          transferData.append('status', dayDetailsForm.status || 'active');
                          const createRes = await transfersAPI.create(transferData);
                          const created = createRes?.data?.data || createRes?.data;
                          if (created) {
                            let imgUrl = created.transfer_photo || created.image;
                            if (imgUrl && (imgUrl.startsWith('/storage') || (imgUrl.startsWith('/') && !imgUrl.startsWith('http')))) {
                              const baseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api').replace('/api', '');
                              imgUrl = `${baseUrl}${imgUrl}`;
                            }
                            if (imgUrl && imgUrl.includes('localhost') && !imgUrl.includes(':8000')) {
                              imgUrl = imgUrl.replace('localhost', 'localhost:8000');
                            }
                            saveEvent({
                              id: Date.now(),
                              subject: created.name || dayDetailsForm.name,
                              details: created.transfer_details || dayDetailsForm.transfer_details,
                              destination: created.destination || dayDetailsForm.destination,
                              eventType: 'transportation',
                              image: imgUrl || eventImagePreview,
                              type: 'Manual',
                              name: created.name || dayDetailsForm.name
                            });
                            await fetchTransfers();
                          }
                        } catch (err) {
                          console.error('Failed to save transportation to Masters:', err);
                          toast.error(err?.response?.data?.message || 'Failed to save transportation. Please try again.');
                        }
                        return;
                      }

                      // For meal: save to Masters first so it shows in search/dropdown
                      if (dayDetailsForm.eventType === 'meal') {
                        try {
                          const mealData = { name: dayDetailsForm.name || '', status: dayDetailsForm.status || 'active' };
                          const createRes = await mealPlansAPI.create(mealData);
                          const created = createRes?.data?.data || createRes?.data;
                          if (created) {
                            saveEvent({
                              id: Date.now(),
                              subject: created.name || dayDetailsForm.name,
                              details: '',
                              destination: dayDetailsForm.destination || '',
                              eventType: 'meal',
                              image: null,
                              type: 'Manual',
                              name: created.name || dayDetailsForm.name,
                              mealType: created.name || dayDetailsForm.name
                            });
                            await fetchMealPlans();
                          }
                        } catch (err) {
                          console.error('Failed to save meal plan to Masters:', err);
                          toast.error(err?.response?.data?.message || 'Failed to save meal plan. Please try again.');
                        }
                        return;
                      }

                      // Convert File to base64 if it's a File object (for other event types)
                      if (dayDetailsForm.image instanceof File) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          saveEvent(createEventData(reader.result));
                        };
                        reader.readAsDataURL(dayDetailsForm.image);
                      } else {
                        saveEvent(createEventData(imageData));
                      }
                    }}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Day Itinerary Image Library Modal (Choose from Library - same as Masters) */}
          {showDayItineraryImageModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
                <div className="flex justify-between items-center p-4 border-b border-gray-200">
                  <h2 className="text-xl font-bold text-gray-800">Choose Image</h2>
                  <button
                    onClick={() => {
                      setShowDayItineraryImageModal(false);
                      setDayItineraryLibraryPackages([]);
                      setDayItineraryFreeStockPhotos([]);
                    }}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                <div className="flex border-b border-gray-200">
                  <button
                    type="button"
                    onClick={() => setDayItineraryLibraryTab('free')}
                    className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${dayItineraryLibraryTab === 'free' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                  >
                    Free stock images
                  </button>
                  <button
                    type="button"
                    onClick={() => setDayItineraryLibraryTab('your')}
                    className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${dayItineraryLibraryTab === 'your' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                  >
                    Your itineraries
                  </button>
                </div>
                <div className="p-4 border-b border-gray-200">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <input
                        type="text"
                        value={dayItineraryLibrarySearchTerm}
                        onChange={(e) => setDayItineraryLibrarySearchTerm(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (dayItineraryLibraryTab === 'free' ? fetchDayItineraryFreeStockImages() : null)}
                        placeholder={dayItineraryLibraryTab === 'free' ? 'Search e.g. Shimla, Kufri...' : 'Search your itineraries e.g. Shimla'}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    {dayItineraryLibraryTab === 'free' && (
                      <button
                        type="button"
                        onClick={fetchDayItineraryFreeStockImages}
                        disabled={(dayItineraryLibrarySearchTerm || '').trim().length < 2 || dayItineraryFreeStockLoading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Search
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {dayItineraryLibraryTab === 'free' ? 'Free images from Pexels. Type location (Shimla, Kufri) and click Search.' : 'Images from itineraries you already added.'}
                  </p>
                </div>
                <div className="flex-1 overflow-y-auto p-6">
                  {dayItineraryLibraryTab === 'free' ? (
                    dayItineraryFreeStockLoading ? (
                      <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                      </div>
                    ) : (dayItineraryLibrarySearchTerm || '').trim().length < 2 ? (
                      <div className="text-center py-12 text-gray-500">
                        <p>Type a location (e.g. Shimla, Kufri) and click Search to get free images.</p>
                      </div>
                    ) : dayItineraryFreeStockPhotos.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <p>No images found. Try another search or add VITE_PEXELS_API_KEY in .env (pexels.com/api).</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-4">
                        {dayItineraryFreeStockPhotos.map((p) => (
                          <div
                            key={p.id}
                            onClick={() => handleSelectDayItineraryFreeStockImage(p.url)}
                            className="relative aspect-video cursor-pointer group overflow-hidden rounded-lg border-2 border-gray-200 hover:border-blue-500 transition-colors"
                          >
                            <img src={p.thumb || p.url} alt={p.alt || ''} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity flex items-center justify-center">
                              <span className="text-white opacity-0 group-hover:opacity-100 font-medium">Select</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  ) : (
                    dayItineraryLibraryLoading ? (
                      <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                      </div>
                    ) : dayItineraryLibrarySearch.length < 2 ? (
                      <div className="text-center py-12 text-gray-500">
                        <p>Type at least 2 characters to see images from your itineraries.</p>
                      </div>
                    ) : dayItineraryLibraryImages.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <p>No images for &quot;{dayItineraryLibrarySearchTerm}&quot;. Use &quot;Free stock images&quot; tab to search Kufri, Shimla, etc.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-4">
                        {dayItineraryLibraryImages.map((p) => (
                          <div
                            key={p.id}
                            onClick={() => handleSelectDayItineraryLibraryImage(p.image)}
                            className="relative aspect-video cursor-pointer group overflow-hidden rounded-lg border-2 border-gray-200 hover:border-blue-500 transition-colors"
                          >
                            <img src={p.image} alt={p.itinerary_name || p.title || 'Select'} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity flex items-center justify-center">
                              <span className="text-white opacity-0 group-hover:opacity-100 font-medium">Select</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Cover Photo Change Modal */}
          {showCoverPhotoModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto py-8">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl mx-4 my-auto max-h-[90vh] overflow-hidden flex flex-col">
                {/* Modal Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
                  <h2 className="text-2xl font-bold text-gray-800">Change Cover Photo</h2>
                  <button
                    onClick={() => {
                      setShowCoverPhotoModal(false);
                      setCoverPhotoFile(null);
                      setCoverPhotoPreview(null);
                      setUnsplashImages([]);
                      setUnsplashSearchTerm('travel');
                    }}
                    className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-1 transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="flex-1 overflow-y-auto p-6">
                  {/* Source Tabs */}
                  <div className="flex gap-2 mb-6 border-b border-gray-200">
                    <button
                      onClick={() => setCoverPhotoSource('upload')}
                      className={`px-4 py-2 font-medium transition-colors ${coverPhotoSource === 'upload'
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-600 hover:text-gray-800'
                        }`}
                    >
                      Upload Image
                    </button>
                    <button
                      onClick={() => {
                        setCoverPhotoSource('unsplash');
                        if (unsplashImages.length === 0) {
                          fetchUnsplashImages();
                        }
                      }}
                      className={`px-4 py-2 font-medium transition-colors ${coverPhotoSource === 'unsplash'
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-600 hover:text-gray-800'
                        }`}
                    >
                      Free Images (Unsplash)
                    </button>
                  </div>

                  {/* Upload Section */}
                  {coverPhotoSource === 'upload' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Select Image File
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              setCoverPhotoFile(file);
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setCoverPhotoPreview(reader.result);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer border border-gray-300 rounded-lg"
                        />
                      </div>
                      {coverPhotoPreview && (
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">Preview:</label>
                          <div className="relative w-full h-64 border-2 border-gray-300 rounded-lg overflow-hidden bg-gray-50">
                            <img
                              src={coverPhotoPreview}
                              alt="Preview"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Unsplash Section */}
                  {coverPhotoSource === 'unsplash' && (
                    <div className="space-y-4">
                      {/* Search */}
                      <div className="flex gap-2">
                        <div className="flex-1 relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                          <input
                            type="text"
                            placeholder="Search for images (e.g., mountains, beach, city)"
                            value={unsplashSearchTerm}
                            onChange={(e) => setUnsplashSearchTerm(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                fetchUnsplashImages();
                              }
                            }}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <button
                          onClick={fetchUnsplashImages}
                          disabled={unsplashLoading}
                          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
                        >
                          {unsplashLoading ? 'Loading...' : 'Search'}
                        </button>
                      </div>

                      {/* Images Grid */}
                      {unsplashLoading && (
                        <div className="flex items-center justify-center py-12">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        </div>
                      )}

                      {!unsplashLoading && unsplashImages.length > 0 && (
                        <div className="grid grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                          {unsplashImages.map((img) => (
                            <div
                              key={img.id}
                              onClick={() => {
                                setCoverPhotoPreview(img.urls.regular);
                                setCoverPhotoFile(null); // Clear file when selecting from Unsplash
                              }}
                              className={`relative aspect-video rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${coverPhotoPreview === img.urls.regular
                                ? 'border-blue-600 ring-2 ring-blue-300'
                                : 'border-gray-200 hover:border-blue-400'
                                }`}
                            >
                              <img
                                src={img.urls.thumb}
                                alt={img.alt_description || 'Unsplash image'}
                                className="w-full h-full object-cover"
                              />
                              {coverPhotoPreview === img.urls.regular && (
                                <div className="absolute inset-0 bg-blue-600/20 flex items-center justify-center">
                                  <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                                    Selected
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {!unsplashLoading && unsplashImages.length === 0 && unsplashSearchTerm && (
                        <div className="text-center py-12 text-gray-500">
                          No images found. Try a different search term.
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
                  <button
                    onClick={() => {
                      setShowCoverPhotoModal(false);
                      setCoverPhotoFile(null);
                      setCoverPhotoPreview(null);
                      setUnsplashImages([]);
                    }}
                    className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCoverPhotoSave}
                    disabled={!coverPhotoFile && !coverPhotoPreview}
                    className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium shadow-sm transition-colors"
                  >
                    Save Cover Photo
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </Layout>

      {/* Manual Add Modal */}
      {showManualAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Accommodation in day {selectedDay}
              </h2>
              <button
                onClick={() => {
                  setShowManualAddModal(false);
                  setDataSourceTab('database');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6">
              <button
                onClick={() => {
                  setDayDetailsForm({
                    ...dayDetailsForm,
                    eventType: 'accommodation',
                    destination: days[selectedDay - 1]?.destination || '',
                  });
                  setShowManualAddModal(false);
                  setShowDayDetailsModal(true);
                  setDataSourceTab('database');
                }}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Open Accommodation Form
              </button>
            </div>
          </div>
        </div>
      )}

      {/* API Search Modal */}
      {showApiSearchModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Accommodation in day {selectedDay}
              </h2>
              <button
                onClick={() => {
                  setShowApiSearchModal(false);
                  setDataSourceTab('database');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ENTER CITY NAME
                </label>
                <input
                  type="text"
                  value={apiSearchForm.city}
                  onChange={(e) => setApiSearchForm({ ...apiSearchForm, city: e.target.value })}
                  placeholder="Enter city name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CHECK IN
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={apiSearchForm.checkIn}
                    onChange={(e) => setApiSearchForm({ ...apiSearchForm, checkIn: e.target.value })}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <select
                    value={apiSearchForm.checkInTime || '2:00 PM'}
                    onChange={(e) => setApiSearchForm({ ...apiSearchForm, checkInTime: e.target.value })}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="2:00 PM">2:00 PM</option>
                    <option value="3:00 PM">3:00 PM</option>
                    <option value="4:00 PM">4:00 PM</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CHECK OUT
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={apiSearchForm.checkOut}
                    onChange={(e) => setApiSearchForm({ ...apiSearchForm, checkOut: e.target.value })}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <select
                    value={apiSearchForm.checkOutTime || '11:00'}
                    onChange={(e) => setApiSearchForm({ ...apiSearchForm, checkOutTime: e.target.value })}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="11:00">11:00</option>
                    <option value="12:00">12:00</option>
                    <option value="1:00 PM">1:00 PM</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ROOMS & GUESTS
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    value={apiSearchForm.rooms}
                    onChange={(e) => setApiSearchForm({ ...apiSearchForm, rooms: parseInt(e.target.value) || 1 })}
                    className="w-20 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-gray-600">Room</span>
                  <span className="text-gray-400">-</span>
                  <input
                    type="number"
                    min="1"
                    value={apiSearchForm.guests}
                    onChange={(e) => setApiSearchForm({ ...apiSearchForm, guests: parseInt(e.target.value) || 2 })}
                    className="w-20 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-gray-600">Guest</span>
                </div>
              </div>
              <button
                onClick={handleApiHotelSearch}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Search Hotel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ItineraryDetail;

