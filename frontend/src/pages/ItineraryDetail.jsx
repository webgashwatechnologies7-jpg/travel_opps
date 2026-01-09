import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { packagesAPI, dayItinerariesAPI, hotelsAPI, activitiesAPI, settingsAPI } from '../services/api';
import { ArrowLeft, Camera, Edit, Plus, ChevronRight, FileText, Share2, Download, Send, Search, X, Bed, Image as ImageIcon, Car, FileText as PassportIcon, UtensilsCrossed, Plane, User, Ship, Star, Calendar, Hash, Building2 } from 'lucide-react';
import PricingTab from '../components/PricingTab';
import FinalTab from '../components/FinalTab';

const ItineraryDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [itinerary, setItinerary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('build');
  const [dayItineraries, setDayItineraries] = useState([]);
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
    // Transportation specific
    transferType: 'Private',
    // Meal specific
    mealType: 'Breakfast'
  });
  const [eventImagePreview, setEventImagePreview] = useState(null);
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

  useEffect(() => {
    fetchItinerary();
    fetchDayItineraries();
    loadEventsFromStorage();
  }, [id]);

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

  // Add options to proposals
  const handleAddOptionsToProposals = () => {
    // Group options by optionNumber
    const optionsByNumber = {};
    Object.keys(pricingData).forEach(key => {
      const [optNum] = key.split('-');
      if (!optionsByNumber[optNum]) {
        optionsByNumber[optNum] = [];
      }
      optionsByNumber[optNum].push({ key, pricing: pricingData[key] });
    });

    if (Object.keys(optionsByNumber).length === 0) {
      alert('No pricing data found. Please set prices for hotel options.');
      return;
    }

    // Create proposals for each option
    const proposals = Object.keys(optionsByNumber).map(optNum => {
      const optionData = optionsByNumber[optNum];
      let totalGross = 0;
      optionData.forEach(({ pricing }) => {
        totalGross += pricing.gross || 0;
      });

      // Calculate final price (use finalClientPrice if set, otherwise use calculated total)
      const calculatedTotal = totalGross;
      const finalPrice = finalClientPrices[optNum] !== undefined && finalClientPrices[optNum] !== null 
        ? parseFloat(finalClientPrices[optNum]) || calculatedTotal
        : calculatedTotal;

      // Get hotel details for this option
      const hotelDetails = [];
      Object.keys(dayEvents).forEach(day => {
        const events = dayEvents[day] || [];
        events.forEach(event => {
          if (event.eventType === 'accommodation' && event.hotelOptions) {
            event.hotelOptions.forEach((option, idx) => {
              if (option.optionNumber === parseInt(optNum)) {
                const optionKey = `${optNum}-${day}-${idx}`;
                hotelDetails.push({
                  ...option,
                  day: parseInt(day),
                  pricing: pricingData[optionKey]
                });
              }
            });
          }
        });
      });

      return {
        id: Date.now() + parseInt(optNum),
        optionNumber: parseInt(optNum),
        itinerary_id: parseInt(id),
        itinerary_name: itinerary?.itinerary_name || 'Itinerary',
        destination: itinerary?.destinations || '',
        duration: itinerary?.duration || 0,
        price: finalPrice, // Use final client price
        website_cost: finalPrice,
        hotelDetails: hotelDetails,
        pricing: {
          baseMarkup,
          extraMarkup,
          cgst,
          sgst,
          igst,
          tcs,
          discount,
          finalClientPrice: finalPrice
        },
        image: itinerary?.image || null,
        inserted_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      };
    });

    // Store in localStorage for LeadDetails page
    const existingProposals = JSON.parse(localStorage.getItem(`itinerary_${id}_proposals`) || '[]');
    const newProposals = [...existingProposals, ...proposals];
    localStorage.setItem(`itinerary_${id}_proposals`, JSON.stringify(newProposals));

    alert(`Successfully added ${proposals.length} option(s) to proposals! You can view them in the Lead Details page.`);
  };

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
      }
    } catch (err) {
      console.error('Failed to fetch itinerary:', err);
      alert('Failed to load itinerary');
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
      
      setDayItineraries(processedData);
    } catch (err) {
      console.error('Failed to fetch day itineraries:', err);
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
      
      setActivities(processedData);
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
      
      setStoredHotels(processedData);
    } catch (err) {
      console.error('Failed to fetch stored hotels:', err);
    } finally {
      setStoredHotelsLoading(false);
    }
  };

  const handleApiHotelSearch = async () => {
    if (!apiSearchForm.city) {
      alert('Please enter city name');
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
      alert('Failed to search hotels. Please try again.');
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
      alert('Failed to load room types. Please try again.');
    } finally {
      setRoomsLoading(false);
    }
  };

  const handleRoomSelect = (hotel, room) => {
    if (!selectedDay) {
      alert('Please select a day first');
      return;
    }

    // Count existing accommodation events in the selected day to determine option number
    const currentDayEvents = dayEvents[selectedDay] || [];
    const accommodationEvents = currentDayEvents.filter(e => e.eventType === 'accommodation');
    
    // Check if max options limit reached
    if (accommodationEvents.length >= maxHotelOptions) {
      alert(`Maximum ${maxHotelOptions} hotel options allowed per day. Please remove an existing hotel first.`);
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
      alert('Failed to load images. Please try again.');
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
      alert('Failed to save cover photo. Please try again.');
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
      transferType: 'Private',
      mealType: 'Breakfast'
    });
    setEventImagePreview(null);
    setShowDayDetailsModal(false);
  };

  // Handle adding day itinerary to selected day
  const handleAddDayItinerary = (dayItineraryId) => {
    if (!selectedDay) {
      alert('Please select a day first');
      return;
    }

    // Find the selected day itinerary
    const selectedItinerary = dayItineraries.find(di => di.id === parseInt(dayItineraryId));
    if (!selectedItinerary) {
      alert('Day itinerary not found');
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

  // Handle hotel selection from search
  const handleHotelSelect = (hotel) => {
    if (!selectedDay) {
      alert('Please select a day first');
      return;
    }

    // Count existing accommodation events in the selected day to determine option number
    const currentDayEvents = dayEvents[selectedDay] || [];
    const accommodationEvents = currentDayEvents.filter(e => e.eventType === 'accommodation');
    
    // Check if max options limit reached
    if (accommodationEvents.length >= maxHotelOptions) {
      alert(`Maximum ${maxHotelOptions} hotel options allowed per day. Please remove an existing hotel first.`);
      return;
    }
    
    const nextOptionNumber = accommodationEvents.length + 1;
    
    // Extract the hotel_id for email lookup
    const hotelId = extractHotelId(hotel);

    // Check if accommodation modal is open
    if (dayDetailsForm.eventType === 'accommodation' && showDayDetailsModal) {
      // Add hotel to current hotel option in the modal
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

  const generateDays = () => {
    if (!itinerary || !itinerary.duration) return [];
    const days = [];
    for (let i = 1; i <= itinerary.duration; i++) {
      days.push({
        day: i,
        destination: itinerary.destinations?.split(',')[0]?.trim() || 'Destination',
        details: ''
      });
    }
    return days;
  };

  const days = generateDays();

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
              onClick={() => navigate('/itineraries')}
              className="mt-4 text-blue-600 hover:text-blue-700"
            >
              Back to Itineraries
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <>
    <Layout>
      <div className="min-h-screen bg-gray-50">
        {/* Header with Back Button */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <button
            onClick={() => navigate('/itineraries')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="font-medium">Back to Itineraries</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="bg-blue-50 border-b border-gray-200 px-6">
          <div className="flex gap-1 items-center justify-between">
            <div className="flex gap-1">
              <button
                onClick={() => setActiveTab('build')}
                className={`px-6 py-3 font-medium transition-colors ${
                  activeTab === 'build'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Build
              </button>
              <button
                onClick={() => setActiveTab('pricing')}
                className={`px-6 py-3 font-medium transition-colors ${
                  activeTab === 'pricing'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Pricing
              </button>
              <button
                onClick={() => setActiveTab('final')}
                className={`px-6 py-3 font-medium transition-colors ${
                  activeTab === 'final'
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
                backgroundImage: itinerary.image ? `url(${itinerary.image})` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundColor: itinerary.image ? 'transparent' : '#667eea'
              }}
            >
              {itinerary.image && (
                <img 
                  src={itinerary.image} 
                  alt={itinerary.itinerary_name}
                  className="absolute inset-0 w-full h-full object-cover"
                  onError={(e) => {
                    console.error('Cover image failed to load:', itinerary.image);
                    e.target.style.display = 'none';
                  }}
                />
              )}
              <div className="relative z-10 h-full flex flex-col justify-between p-8">
                <div className="flex justify-end">
                  <button 
                    onClick={() => setShowCoverPhotoModal(true)}
                    className="bg-white/90 backdrop-blur-sm text-gray-800 px-4 py-2 rounded-lg hover:bg-white transition-colors flex items-center gap-2 shadow-lg font-medium"
                  >
                    <Camera className="h-4 w-4" />
                    Change Cover Photo
                  </button>
                </div>
                <div className="bg-white/90 backdrop-blur-sm p-4 rounded-lg shadow-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-4xl font-bold text-gray-900">{itinerary.itinerary_name || 'Untitled'}</h1>
                    <button className="text-gray-700 hover:text-gray-900">
                      <Edit className="h-5 w-5" />
                    </button>
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
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedDay === day.day
                            ? 'bg-blue-50 border-2 border-blue-500'
                            : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`font-semibold ${selectedDay === day.day ? 'text-blue-600' : 'text-gray-700'}`}>
                              DAY {day.day}
                            </span>
                            <button className="text-gray-400 hover:text-gray-600">
                              <Edit className="h-4 w-4" />
                            </button>
                          </div>
                          <ChevronRight className={`h-4 w-4 ${selectedDay === day.day ? 'text-blue-600' : 'text-gray-400'}`} />
                        </div>
                        <select className="mt-2 w-full text-sm border border-gray-300 rounded px-2 py-1 bg-white">
                          <option>{day.destination}</option>
                          {dayItineraries.map((di) => (
                            <option key={di.id} value={di.destination}>{di.destination}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex items-center gap-2 text-gray-600 hover:text-gray-900 cursor-pointer">
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
                          <button 
                            onClick={() => setShowEventTypeDropdown(!showEventTypeDropdown)}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm font-medium"
                          >
                            <Plus className="h-4 w-4" />
                            New Event
                          </button>
                          
                          {showEventTypeDropdown && (
                            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                              <div className="py-2">
                                <button
                                  onClick={() => {
                                    setDayDetailsForm({ ...dayDetailsForm, eventType: 'accommodation' });
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
                                    setDayDetailsForm({ ...dayDetailsForm, eventType: 'visa' });
                                    setShowEventTypeDropdown(false);
                                    setShowDayDetailsModal(true);
                                  }}
                                  className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-sm text-gray-700"
                                >
                                  <PassportIcon className="h-4 w-4 text-gray-500" />
                                  <span>Visa</span>
                                </button>
                                <button
                                  onClick={() => {
                                    setDayDetailsForm({ ...dayDetailsForm, eventType: 'meal' });
                                    setShowEventTypeDropdown(false);
                                    setShowDayDetailsModal(true);
                                  }}
                                  className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-sm text-gray-700"
                                >
                                  <UtensilsCrossed className="h-4 w-4 text-gray-500" />
                                  <span>Meal</span>
                                </button>
                                <button
                                  onClick={() => {
                                    setDayDetailsForm({ ...dayDetailsForm, eventType: 'flight' });
                                    setShowEventTypeDropdown(false);
                                    setShowDayDetailsModal(true);
                                  }}
                                  className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-sm text-gray-700"
                                >
                                  <Plane className="h-4 w-4 text-gray-500" />
                                  <span>Flight</span>
                                </button>
                                <button
                                  onClick={() => {
                                    setDayDetailsForm({ ...dayDetailsForm, eventType: 'leisure' });
                                    setShowEventTypeDropdown(false);
                                    setShowDayDetailsModal(true);
                                  }}
                                  className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-sm text-gray-700"
                                >
                                  <User className="h-4 w-4 text-gray-500" />
                                  <span>Leisure</span>
                                </button>
                                <button
                                  onClick={() => {
                                    setDayDetailsForm({ ...dayDetailsForm, eventType: 'cruise' });
                                    setShowEventTypeDropdown(false);
                                    setShowDayDetailsModal(true);
                                  }}
                                  className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-sm text-gray-700"
                                >
                                  <Ship className="h-4 w-4 text-gray-500" />
                                  <span>Cruise</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="mb-4">
                        <div 
                          className="flex items-center gap-2 border border-gray-300 rounded-lg p-3 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                          onClick={() => setShowDayDetailsModal(true)}
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
                              setShowDayDetailsModal(true);
                            }}
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
                                  {event.image ? (
                                    <>
                                      <img 
                                        src={event.image} 
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
                                {/* Delete Button */}
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
                        <option value="visa">Insurance / Visa</option>
                        <option value="meal">Meal</option>
                        <option value="flight">Flight</option>
                        <option value="leisure">Leisure</option>
                        <option value="cruise">Cruise</option>
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
                          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                            dataSourceTab === 'database'
                              ? 'border-green-600 text-green-600'
                              : 'border-transparent text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          From Database
                        </button>
                        <button
                          onClick={() => {
                            setDataSourceTab('manual');
                            setShowManualAddModal(true);
                          }}
                          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-1 ${
                            dataSourceTab === 'manual'
                              ? 'border-green-600 text-green-600'
                              : 'border-transparent text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          <Plus className="h-4 w-4" />
                          Add Manual
                        </button>
                        <button
                          onClick={() => {
                            setDataSourceTab('api');
                            setShowApiSearchModal(true);
                          }}
                          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-1 ${
                            dataSourceTab === 'api'
                              ? 'border-green-600 text-green-600'
                              : 'border-transparent text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          <Plus className="h-4 w-4" />
                          From API
                        </button>
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
                                  if (selectedDay) {
                                    handleAddDayItinerary(di.id);
                                  }
                                }}
                              >
                                <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden border border-gray-200 flex-shrink-0">
                                  {di.image ? (
                                    <img 
                                      src={di.image} 
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
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (selectedDay) {
                                      handleAddDayItinerary(di.id);
                                    }
                                  }}
                                  className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center hover:bg-gray-800 flex-shrink-0"
                                >
                                  <Plus className="h-4 w-4" />
                                </button>
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
                                    }
                                  }}
                                >
                                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden border border-gray-200 flex-shrink-0">
                                    {activity.activity_photo ? (
                                      <img 
                                        src={activity.activity_photo} 
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
                                      }
                                    }}
                                    className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center hover:bg-gray-800 flex-shrink-0"
                                  >
                                    <Plus className="h-4 w-4" />
                                  </button>
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
                                          onClick={() => handleHotelSelect(hotel)}
                                        >
                                          <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden border border-gray-200 flex-shrink-0">
                                            {hotel.image ? (
                                              <img 
                                                src={hotel.image} 
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
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleHotelSelect(hotel);
                                            }}
                                            className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center hover:bg-gray-800 flex-shrink-0"
                                          >
                                            <Plus className="h-4 w-4" />
                                          </button>
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
                                                  src={hotel.image} 
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
                                                        <button
                                                          onClick={() => handleRoomSelect(hotel, room)}
                                                          className="bg-blue-600 text-white px-4 py-1.5 rounded text-xs font-medium hover:bg-blue-700 transition-colors w-full"
                                                        >
                                                          Select
                                                        </button>
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

                      {(categoryType === 'transportation' || categoryType === 'visa' || categoryType === 'meal' || categoryType === 'flight' || categoryType === 'leisure' || categoryType === 'cruise') && (
                        <div className="text-center py-8 text-gray-500 text-sm">
                          {categoryType.charAt(0).toUpperCase() + categoryType.slice(1)} items will be displayed here
                        </div>
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
            onAddToProposals={handleAddOptionsToProposals}
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
          />
        )}

        {/* Top Right Utilities */}
        <div className="fixed right-6 top-24 space-y-3 z-10">
          <button className="bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-green-600 flex items-center gap-2 transition-colors text-sm font-medium" title="Share via WhatsApp">
            <Share2 className="h-4 w-4" />
            Share
          </button>
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-green-700 flex items-center gap-2 transition-colors text-sm font-medium" title="Export">
            <Download className="h-4 w-4" />
            Export
          </button>
          <button className="bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-red-600 flex items-center gap-2 transition-colors text-sm font-medium" title="Share">
            <Send className="h-4 w-4" />
            Share
          </button>
        </div>

        {/* Day Details Modal */}
        {showDayDetailsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4">
              {/* Modal Header */}
              <div className="flex justify-between items-center p-6 border-b border-gray-200">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">
                    {dayDetailsForm.eventType === 'visa' 
                      ? `Insurance / Visa in day ${selectedDay}`
                      : dayDetailsForm.eventType 
                        ? `${dayDetailsForm.eventType.charAt(0).toUpperCase() + dayDetailsForm.eventType.slice(1)} in day ${selectedDay}`
                        : `Day ${selectedDay} Details`}
                  </h2>
                  {dayDetailsForm.eventType && (
                    <p className="text-sm text-gray-500 mt-1 capitalize">
                      Event Type: {dayDetailsForm.eventType}
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
                      name: '',
                      date: '',
                      startTime: '1:00 PM',
                      endTime: '2:00 PM',
                      showTime: false,
                      transferType: 'Private',
                      mealType: 'Breakfast'
                    });
                    setEventImagePreview(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                {dayDetailsForm.eventType === 'accommodation' ? (
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

                    {/* Add/Edit Hotel Option Form - Only show when NOT editing existing event */}
                    {!dayDetailsForm.id && (
                      <div className="border-t border-gray-200 pt-4">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">
                          {dayDetailsForm.editingOptionIndex !== null ? `Edit Option ${dayDetailsForm.editingOptionIndex + 1}` : 'Add Hotel Option'}
                        </h3>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Destination
                          </label>
                          <select
                            value={dayDetailsForm.destination}
                            onChange={(e) => {
                              const destination = e.target.value;
                              setDayDetailsForm({ ...dayDetailsForm, destination });
                              // Auto-search hotels when destination is selected
                              if (destination) {
                                searchHotels('', destination);
                                setShowHotelSearch(true);
                              }
                            }}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Select Destination</option>
                            {dayItineraries.map((di) => (
                              <option key={di.id} value={di.destination}>{di.destination}</option>
                            ))}
                            {days[selectedDay - 1]?.destination && (
                              <option value={days[selectedDay - 1].destination}>{days[selectedDay - 1].destination}</option>
                            )}
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

                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div className="relative">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Hotel Name
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              value={dayDetailsForm.hotelName}
                              onChange={(e) => {
                                setDayDetailsForm({ ...dayDetailsForm, hotelName: e.target.value });
                                if (e.target.value.length > 2 && dayDetailsForm.destination) {
                                  searchHotels(e.target.value, dayDetailsForm.destination);
                                  setShowHotelSearch(true);
                                } else {
                                  setHotelSearchResults([]);
                                }
                              }}
                              onFocus={() => {
                                if (dayDetailsForm.destination && hotelSearchResults.length === 0) {
                                  searchHotels('', dayDetailsForm.destination);
                                }
                                setShowHotelSearch(true);
                              }}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Enter hotel name or search"
                            />
                            {dayDetailsForm.destination && (
                              <button
                                type="button"
                                onClick={() => {
                                  searchHotels('', dayDetailsForm.destination);
                                  setShowHotelSearch(true);
                                }}
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-blue-600 hover:text-blue-700"
                                title="Search hotels"
                              >
                                <Search className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                          {showHotelSearch && hotelSearchResults.length > 0 && (
                            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                              {hotelSearchResults.map((hotel) => (
                                <div
                                  key={hotel.id}
                                  onClick={() => handleHotelSelect(hotel)}
                                  className="p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                                >
                                  <div className="font-medium text-gray-900 text-sm">{hotel.hotelName || hotel.name}</div>
                                  {hotel.rating && (
                                    <div className="flex items-center gap-1 mt-1">
                                      {[...Array(Math.floor(hotel.rating))].map((_, i) => (
                                        <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                      ))}
                                      <span className="text-xs text-gray-500 ml-1">{hotel.rating} stars</span>
                                    </div>
                                  )}
                                  {hotel.address && (
                                    <div className="text-xs text-gray-500 mt-1">{hotel.address}</div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Category
                          </label>
                          <select
                            value={dayDetailsForm.category}
                            onChange={(e) => setDayDetailsForm({ ...dayDetailsForm, category: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="1">1 Star</option>
                            <option value="2">2 Stars</option>
                            <option value="3">3 Stars</option>
                            <option value="4">4 Stars</option>
                            <option value="5">5 Stars</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Room Name
                          </label>
                          <input
                            type="text"
                            value={dayDetailsForm.roomName}
                            onChange={(e) => setDayDetailsForm({ ...dayDetailsForm, roomName: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter room name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Meal Plan
                          </label>
                          <input
                            type="text"
                            value={dayDetailsForm.mealPlan}
                            onChange={(e) => setDayDetailsForm({ ...dayDetailsForm, mealPlan: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter meal plan"
                          />
                        </div>
                      </div>

                      {/* Number of Rooms */}
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Enter Number of Rooms
                        </label>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Single</label>
                            <input
                              type="number"
                              value={dayDetailsForm.single}
                              onChange={(e) => setDayDetailsForm({ ...dayDetailsForm, single: e.target.value })}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="0"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Double</label>
                            <input
                              type="number"
                              value={dayDetailsForm.double}
                              onChange={(e) => setDayDetailsForm({ ...dayDetailsForm, double: e.target.value })}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="0"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Triple</label>
                            <input
                              type="number"
                              value={dayDetailsForm.triple}
                              onChange={(e) => setDayDetailsForm({ ...dayDetailsForm, triple: e.target.value })}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="0"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Quad</label>
                            <input
                              type="number"
                              value={dayDetailsForm.quad}
                              onChange={(e) => setDayDetailsForm({ ...dayDetailsForm, quad: e.target.value })}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="0"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">CWB (Child With Bed)</label>
                            <input
                              type="number"
                              value={dayDetailsForm.cwb}
                              onChange={(e) => setDayDetailsForm({ ...dayDetailsForm, cwb: e.target.value })}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="0"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">CNB (Child No Bed)</label>
                            <input
                              type="number"
                              value={dayDetailsForm.cnb}
                              onChange={(e) => setDayDetailsForm({ ...dayDetailsForm, cnb: e.target.value })}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="0"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Check-in/Check-out */}
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Check-in <span className="text-red-500">*</span>
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="date"
                              value={dayDetailsForm.checkIn}
                              onChange={(e) => setDayDetailsForm({ ...dayDetailsForm, checkIn: e.target.value })}
                              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <select
                              value={dayDetailsForm.checkInTime}
                              onChange={(e) => setDayDetailsForm({ ...dayDetailsForm, checkInTime: e.target.value })}
                              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="12:00 AM">12:00 AM</option>
                              <option value="1:00 AM">1:00 AM</option>
                              <option value="2:00 AM">2:00 AM</option>
                              <option value="2:00 PM">2:00 PM</option>
                              <option value="3:00 PM">3:00 PM</option>
                              <option value="4:00 PM">4:00 PM</option>
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Check-out <span className="text-red-500">*</span>
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="date"
                              value={dayDetailsForm.checkOut}
                              onChange={(e) => setDayDetailsForm({ ...dayDetailsForm, checkOut: e.target.value })}
                              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <select
                              value={dayDetailsForm.checkOutTime}
                              onChange={(e) => setDayDetailsForm({ ...dayDetailsForm, checkOutTime: e.target.value })}
                              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="10:00">10:00</option>
                              <option value="11:00">11:00</option>
                              <option value="12:00 PM">12:00 PM</option>
                              <option value="1:00 PM">1:00 PM</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Description
                        </label>
                        <textarea
                          value={dayDetailsForm.details}
                          onChange={(e) => setDayDetailsForm({ ...dayDetailsForm, details: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                          placeholder="Enter description"
                          rows="3"
                        />
                      </div>

                      {/* Image Upload for Hotel Option */}
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Hotel Image
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

                      {/* Add/Update Option Button */}
                      <div className="mt-4 flex gap-2">
                        <button
                          onClick={() => {
                            const currentOptions = dayDetailsForm.hotelOptions || [];
                            
                            // Calculate next option number for this accommodation event
                            let nextOptionNumber;
                            if (dayDetailsForm.editingOptionIndex !== null) {
                              // Keep existing option number when editing
                              nextOptionNumber = currentOptions[dayDetailsForm.editingOptionIndex]?.optionNumber || (dayDetailsForm.editingOptionIndex + 1);
                            } else {
                              // Calculate next option number based on existing options in this event
                              const maxOptionNumber = currentOptions.length > 0 
                                ? Math.max(...currentOptions.map(opt => opt.optionNumber || 0))
                                : 0;
                              nextOptionNumber = maxOptionNumber + 1;
                            }

                            const newOption = {
                              hotelName: dayDetailsForm.hotelName,
                              hotel_id: dayDetailsForm.hotel_id, // Include hotel_id for email lookup
                              category: dayDetailsForm.category,
                              roomName: dayDetailsForm.roomName,
                              mealPlan: dayDetailsForm.mealPlan,
                              single: dayDetailsForm.single,
                              double: dayDetailsForm.double,
                              triple: dayDetailsForm.triple,
                              quad: dayDetailsForm.quad,
                              cwb: dayDetailsForm.cwb,
                              cnb: dayDetailsForm.cnb,
                              checkIn: dayDetailsForm.checkIn,
                              checkInTime: dayDetailsForm.checkInTime,
                              checkOut: dayDetailsForm.checkOut,
                              checkOutTime: dayDetailsForm.checkOutTime,
                              destination: dayDetailsForm.destination,
                              details: dayDetailsForm.details,
                              image: eventImagePreview || dayDetailsForm.image,
                              optionNumber: nextOptionNumber // Add option number
                            };

                            if (dayDetailsForm.editingOptionIndex !== null) {
                              // Update existing option
                              const updatedOptions = [...currentOptions];
                              updatedOptions[dayDetailsForm.editingOptionIndex] = newOption;
                              setDayDetailsForm({
                                ...dayDetailsForm,
                                hotelOptions: updatedOptions,
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
                                details: '',
                                image: null
                              });
                              setEventImagePreview(null);
                            } else {
                              // Check max options limit
                              if (currentOptions.length >= maxHotelOptions) {
                                alert(`Maximum ${maxHotelOptions} hotel options allowed. Please remove an existing option first.`);
                                return;
                              }
                              // Add new option
                              setDayDetailsForm({
                                ...dayDetailsForm,
                                hotelOptions: [...currentOptions, newOption],
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
                                details: '',
                                image: null
                              });
                              setEventImagePreview(null);
                            }
                          }}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2 text-sm font-medium"
                        >
                          <Plus className="h-4 w-4" />
                          {dayDetailsForm.editingOptionIndex !== null ? 'Update Option' : 'Add Option'}
                        </button>
                        {dayDetailsForm.editingOptionIndex !== null && (
                          <button
                            onClick={() => {
                              setDayDetailsForm({
                                ...dayDetailsForm,
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
                                details: '',
                                image: null
                              });
                              setEventImagePreview(null);
                            }}
                            className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 text-sm font-medium"
                          >
                            Cancel Edit
                          </button>
                        )}
                      </div>
                    </div>
                    )}
                  </>
                ) : dayDetailsForm.eventType === 'activity' ? (
                  <>
                    {/* Activity Specific Fields */}
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
                          {dayItineraries.map((di) => (
                            <option key={di.id} value={di.destination}>{di.destination}</option>
                          ))}
                          {days[selectedDay - 1]?.destination && (
                            <option value={days[selectedDay - 1].destination}>{days[selectedDay - 1].destination}</option>
                          )}
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
                        placeholder="Enter activity name"
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
                          <option value="12:00 AM">12:00 AM</option>
                          <option value="1:00 AM">1:00 AM</option>
                          <option value="2:00 AM">2:00 AM</option>
                          <option value="1:00 PM">1:00 PM</option>
                          <option value="2:00 PM">2:00 PM</option>
                          <option value="3:00 PM">3:00 PM</option>
                          <option value="4:00 PM">4:00 PM</option>
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
                          <option value="12:00 AM">12:00 AM</option>
                          <option value="1:00 AM">1:00 AM</option>
                          <option value="2:00 AM">2:00 AM</option>
                          <option value="1:00 PM">1:00 PM</option>
                          <option value="2:00 PM">2:00 PM</option>
                          <option value="3:00 PM">3:00 PM</option>
                          <option value="4:00 PM">4:00 PM</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="showTime"
                        checked={dayDetailsForm.showTime}
                        onChange={(e) => setDayDetailsForm({ ...dayDetailsForm, showTime: e.target.checked })}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="showTime" className="ml-2 block text-sm text-gray-700">
                        Show Time
                      </label>
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
                ) : dayDetailsForm.eventType === 'transportation' ? (
                  <>
                    {/* Transportation Specific Fields */}
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
                          {dayItineraries.map((di) => (
                            <option key={di.id} value={di.destination}>{di.destination}</option>
                          ))}
                          {days[selectedDay - 1]?.destination && (
                            <option value={days[selectedDay - 1].destination}>{days[selectedDay - 1].destination}</option>
                          )}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Transfer Type
                        </label>
                        <select
                          value={dayDetailsForm.transferType}
                          onChange={(e) => setDayDetailsForm({ ...dayDetailsForm, transferType: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="Private">Private</option>
                          <option value="Shared">Shared</option>
                          <option value="SIC">SIC</option>
                        </select>
                      </div>
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
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Name
                        </label>
                        <input
                          type="text"
                          value={dayDetailsForm.name}
                          onChange={(e) => setDayDetailsForm({ ...dayDetailsForm, name: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter transportation name"
                        />
                      </div>
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

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="showTimeTransport"
                        checked={dayDetailsForm.showTime}
                        onChange={(e) => setDayDetailsForm({ ...dayDetailsForm, showTime: e.target.checked })}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="showTimeTransport" className="ml-2 block text-sm text-gray-700">
                        Show Time
                      </label>
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
                          {dayItineraries.map((di) => (
                            <option key={di.id} value={di.destination}>{di.destination}</option>
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
                    {/* Meal Specific Fields */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Name
                      </label>
                      <input
                        type="text"
                        value={dayDetailsForm.name}
                        onChange={(e) => setDayDetailsForm({ ...dayDetailsForm, name: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter meal name"
                      />
                    </div>

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
                          {dayItineraries.map((di) => (
                            <option key={di.id} value={di.destination}>{di.destination}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Meal Type
                        </label>
                        <select
                          value={dayDetailsForm.mealType}
                          onChange={(e) => setDayDetailsForm({ ...dayDetailsForm, mealType: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="Breakfast">Breakfast</option>
                          <option value="Lunch">Lunch</option>
                          <option value="Dinner">Dinner</option>
                          <option value="Snacks">Snacks</option>
                        </select>
                      </div>
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
                ) : dayDetailsForm.eventType === 'visa' ? (
                  <>
                    {/* Visa Specific Fields */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Name
                      </label>
                      <input
                        type="text"
                        value={dayDetailsForm.name}
                        onChange={(e) => setDayDetailsForm({ ...dayDetailsForm, name: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter visa/insurance name"
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
                        {dayItineraries.map((di) => (
                          <option key={di.id} value={di.destination}>{di.destination}</option>
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
                        {dayItineraries.map((di) => (
                          <option key={di.id} value={di.destination}>{di.destination}</option>
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
                        {dayItineraries.map((di) => (
                          <option key={di.id} value={di.destination}>{di.destination}</option>
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
                      transferType: 'Private',
                      mealType: 'Breakfast'
                    });
                    setEventImagePreview(null);
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
                      if (!dayDetailsForm.hotelOptions || dayDetailsForm.hotelOptions.length === 0) {
                        alert('Please add at least one hotel option');
                        return;
                      }
                      subject = dayDetailsForm.hotelOptions[0]?.hotelName || dayDetailsForm.destination || 'Accommodation';
                    } else if (['activity', 'transportation', 'flight', 'meal', 'cruise', 'leisure'].includes(dayDetailsForm.eventType)) {
                      subject = dayDetailsForm.name || dayDetailsForm.subject || '';
                      if (!subject.trim()) {
                        alert(`Please enter ${dayDetailsForm.eventType} name`);
                        return;
                      }
                    } else if (dayDetailsForm.eventType === 'visa') {
                      subject = dayDetailsForm.name || 'Insurance / Visa';
                    } else {
                      subject = dayDetailsForm.subject || '';
                      if (!subject.trim()) {
                        alert('Please enter a subject');
                        return;
                      }
                    }

                    let imageData = eventImagePreview || dayDetailsForm.image;

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

                    // Convert File to base64 if it's a File object
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
                    className={`px-4 py-2 font-medium transition-colors ${
                      coverPhotoSource === 'upload'
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
                    className={`px-4 py-2 font-medium transition-colors ${
                      coverPhotoSource === 'unsplash'
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
                            className={`relative aspect-video rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                              coverPhotoPreview === img.urls.regular
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

