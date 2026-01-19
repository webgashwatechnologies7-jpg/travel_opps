import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { leadsAPI, usersAPI, followupsAPI, dayItinerariesAPI, packagesAPI, settingsAPI, suppliersAPI, hotelsAPI, paymentsAPI, googleMailAPI } from '../services/api';
import Layout from '../components/Layout';
import { ArrowLeft, Calendar, Mail, Plus, Upload, X, Search, FileText, Printer, Send, MessageCircle, CheckCircle, CheckCircle2, Clock } from 'lucide-react';

const LeadDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('proposals');
  const [users, setUsers] = useState([]);
  const [notes, setNotes] = useState([]);
  const [noteText, setNoteText] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [addingNote, setAddingNote] = useState(false);
  const [showItineraryModal, setShowItineraryModal] = useState(false);
  const [showInsertItineraryModal, setShowInsertItineraryModal] = useState(false);
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
    start_date: '',
    end_date: '',
    adult: '1',
    child: '0',
    destinations: '',
    notes: ''
  });
  const [followups, setFollowups] = useState([]);
  const [showFollowupModal, setShowFollowupModal] = useState(false);
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
  const [selectedSuppliers, setSelectedSuppliers] = useState([]);
  const [selectedHotels, setSelectedHotels] = useState([]);
  const [selectAllSuppliers, setSelectAllSuppliers] = useState(false);
  const [selectAllHotels, setSelectAllHotels] = useState(false);
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

  useEffect(() => {
    fetchLeadDetails();
    fetchUsers();
    loadProposals();
    fetchSuppliers();
    fetchCompanySettings();
  }, [id]);

  // Fetch company settings
  const fetchCompanySettings = async () => {
    try {
      const response = await settingsAPI.get();
      if (response.data.success) {
        setCompanySettings(response.data.data);
      }
    } catch (err) {
      // Error logged for debugging
      // TODO: Add proper error reporting service
    }
  };

  // Update subject when lead or confirmed proposal changes
  useEffect(() => {
    if (lead) {
      const confirmedOption = getConfirmedOption();
      const queryId = lead.query_id || lead.id || id;
      const destination = lead.destinations || 'Destination';
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

  // Load hotels from confirmed option
  useEffect(() => {
    let isMounted = true;
    
    const loadHotelsFromConfirmedOption = async () => {
      const confirmedOption = getConfirmedOption();
      // Debug: Confirmed option data
      // TODO: Add proper logging service

      // Check for hotels in different possible structures
      let hotelsList = [];

      if (confirmedOption) {
        // Try different possible hotel structures
        if (confirmedOption.hotels && Array.isArray(confirmedOption.hotels)) {
          hotelsList = confirmedOption.hotels;
        } else if (confirmedOption.hotelDetails && Array.isArray(confirmedOption.hotelDetails)) {
          hotelsList = confirmedOption.hotelDetails;
        } else if (quotationData && confirmedOption.optionNumber) {
          // Try to get hotels from quotationData
          const optionNum = confirmedOption.optionNumber.toString();
          if (quotationData.hotelOptions && quotationData.hotelOptions[optionNum]) {
            hotelsList = quotationData.hotelOptions[optionNum];
          }
        }
      }

      // Debug: Hotels list data
      // TODO: Add proper logging service

      if (hotelsList.length > 0 && isMounted) {
        try {
          // Fetch hotel details for each hotel
          const hotelPromises = hotelsList.map(async (hotel, index) => {
            // Try different possible field names
            const hotelId = hotel.hotel_id || hotel.hotelId || hotel.id;
            const hotelName = hotel.hotel_name || hotel.hotelName || hotel.name || 'Hotel';
            const roomType = hotel.room_type || hotel.roomType || hotel.roomName || '';
            const mealPlan = hotel.meal_plan || hotel.mealPlan || '';
            const price = hotel.price || 0;
            const day = hotel.day || 1;

            if (hotelId && hotelId !== 'hotel_' + hotelName + '_' + index) {
              try {
                const hotelData = await hotelsAPI.getById(hotelId);
                return {
                  id: hotelData.data.data.id,
                  hotel_id: hotelId,
                  company_name: hotelData.data.data.name,
                  name: hotelData.data.data.contact_person || '',
                  email: hotelData.data.data.email || '',
                  type: 'hotel',
                  hotel_name: hotelData.data.data.name || hotelName,
                  room_type: roomType,
                  meal_plan: mealPlan,
                  price: price,
                  day: day
                };
              } catch (err) {
                // Error fetching hotel details
                // TODO: Add proper error reporting
                // If hotel fetch fails, use the data from confirmed option
                return {
                  id: `hotel_${hotelId || hotelName}_${index}`,
                  hotel_id: hotelId,
                  company_name: hotelName,
                  name: '',
                  email: hotel.email || '',
                  type: 'hotel',
                  hotel_name: hotelName,
                  room_type: roomType,
                  meal_plan: mealPlan,
                  price: price,
                  day: day
                };
              }
            } else {
              return {
                id: `hotel_${hotelId || hotelName}_${index}`,
                hotel_id: hotelId,
                company_name: hotelName,
                name: '',
                email: hotel.email || '',
                type: 'hotel',
                hotel_name: hotelName,
                room_type: roomType,
                meal_plan: mealPlan,
                price: price,
                day: day
              };
            }
          });

          const hotelsData = await Promise.all(hotelPromises);
          // Debug: Processed hotels data
          // TODO: Add proper logging service
          // Show all hotels, but prioritize those with email
          const validHotels = hotelsData.filter(h => h.company_name && h.company_name !== 'Hotel');
          // Sort: hotels with email first
          validHotels.sort((a, b) => {
            if (a.email && !b.email) return -1;
            if (!a.email && b.email) return 1;
            return 0;
          });
          
          if (isMounted) {
            setHotelsFromConfirmedOption(validHotels);
            // Debug: Hotels set in state
            // TODO: Add proper logging service
          }
        } catch (err) {
          // Error loading hotels
          // TODO: Add proper error reporting
          if (isMounted) {
            setHotelsFromConfirmedOption([]);
          }
        }
      } else {
        if (isMounted) {
          setHotelsFromConfirmedOption([]);
        }
      }
    };

    loadHotelsFromConfirmedOption();
    
    return () => {
      isMounted = false;
    };
  }, [proposals, quotationData]);

  // Load proposals from localStorage
  const loadProposals = () => {
    try {
      // Load lead-specific proposals
      const storedProposals = localStorage.getItem(`lead_${id}_proposals`);
      let proposals = [];

      if (storedProposals) {
        proposals = JSON.parse(storedProposals);
      }

      // Also load proposals from all itineraries (for options added from itinerary detail page)
      // This ensures all options from Final tab are available
      const allItineraryKeys = Object.keys(localStorage).filter(key => key.startsWith('itinerary_') && key.endsWith('_proposals'));
      allItineraryKeys.forEach(key => {
        try {
          const itineraryProposals = JSON.parse(localStorage.getItem(key) || '[]');
          // Add proposals that don't already exist (check by itinerary_id + optionNumber)
          itineraryProposals.forEach(ip => {
            const exists = proposals.some(p =>
              p.itinerary_id === ip.itinerary_id &&
              p.optionNumber === ip.optionNumber
            );
            if (!exists) {
              proposals.push(ip);
            }
          });
        } catch (e) {
          // Error loading itinerary proposals
          // TODO: Add proper error reporting
        }
      });

      setProposals(proposals);
    } catch (err) {
      console.error('Failed to load proposals:', err);
    }
  };

  // Save proposals to localStorage
  const saveProposals = (newProposals) => {
    try {
      localStorage.setItem(`lead_${id}_proposals`, JSON.stringify(newProposals));
      setProposals(newProposals);
    } catch (err) {
      // Error saving proposals
      // TODO: Add proper error reporting
    }
  };

  // Confirm an option
  const handleConfirmOption = async (optionId) => {
    const updatedProposals = proposals.map(proposal => ({
      ...proposal,
      confirmed: proposal.id === optionId ? true : false // Only one option can be confirmed at a time
    }));
    saveProposals(updatedProposals);

    // Load quotation data for confirmed option to get hotels
    const confirmedProposal = updatedProposals.find(p => p.id === optionId);
    if (confirmedProposal) {
      try {
        await handleViewQuotation(confirmedProposal);
      } catch (err) {
        // Error loading quotation data
        // TODO: Add proper error reporting
      }
    }

    alert('Option confirmed successfully! You can now share the final itinerary.');
  };

  // Get confirmed option
  const getConfirmedOption = () => {
    return proposals.find(p => p.confirmed === true);
  };

  const fetchLeadDetails = async () => {
    try {
      const response = await leadsAPI.get(id);
      const leadData = response.data.data.lead;
      setLead(leadData);

      // Extract notes from followups (those with remarks)
      if (leadData.followups) {
        const notesList = leadData.followups
          .filter(followup => followup.remark && followup.remark.trim() !== '')
          .map(followup => ({
            content: followup.remark,
            created_at: followup.created_at,
            created_by: followup.user?.name || 'System'
          }));
        setNotes(notesList);
        // Store all followups
        setFollowups(leadData.followups || []);
      } else {
        setFollowups([]);
      }
    } catch (err) {
      // Error fetching lead details
      // TODO: Add proper error reporting service
      alert('Failed to load lead details');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await usersAPI.list();
      setUsers(response.data.data.users || []);
    } catch (err) {
      // Error fetching users
      // TODO: Add proper error reporting service
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await suppliersAPI.list();
      setSuppliers(response.data.data || []);
    } catch (err) {
      // Error fetching suppliers
      // TODO: Add proper error reporting service
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
      // Error fetching lead emails
      // TODO: Add proper error reporting service
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
          to_email: toEmail,
          cc_email: emailFormData.cc_email,
          subject: emailFormData.subject,
          body: emailFormData.body,
          lead_id: id
        };
        const response = await googleMailAPI.sendMail(emailData);
        if (response.data.success) {
          alert('Email sent successfully via Gmail!');
          setShowComposeModal(false);
          setEmailFormData({
            to_email: lead?.email || '',
            cc_email: '',
            subject: '',
            body: ''
          });
          fetchGmailEmails();
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
        }
      }
    } catch (err) {
      // Error sending email
      // TODO: Add proper error reporting service
      alert(err.response?.data?.message || 'Failed to send email');
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
      // Error fetching Gmail emails
      // TODO: Add proper error reporting service
    } finally {
      setLoadingGmail(false);
    }
  };

  // Open compose modal with pre-filled email
  const openComposeModal = () => {
    setEmailFormData({
      to_email: lead?.email || '',
      cc_email: '',
      subject: '',
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
      // Error fetching payments
      // TODO: Add proper error reporting service
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
      // Error adding payment
      // TODO: Add proper error reporting service
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
    if (selectedSuppliers.length === 0 && selectedHotels.length === 0) {
      alert('Please select at least one supplier or hotel');
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
      const selectedHotelEmails = hotelsFromConfirmedOption
        .filter(h => selectedHotels.includes(h.id) && h.email && h.email.trim() !== '')
        .map(h => ({
          email: h.email.trim(),
          name: h.company_name,
          hotel_name: h.hotel_name,
          room_type: h.room_type,
          meal_plan: h.meal_plan
        }));

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

      if (selectedSuppliers.length === 0 && selectedHotelEmails.length === 0) {
        alert('Please select at least one supplier or hotel with valid email address');
        setSendingEmail(false);
        return;
      }

      const response = await suppliersAPI.sendEmail({
        supplier_ids: selectedSuppliers,
        hotel_emails: selectedHotelEmails,
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
          setSelectAllSuppliers(false);
          setSelectAllHotels(false);
        }
      } else {
        const errorMsg = response.data.message || 'Failed to send email';
        const errors = response.data.data?.errors || [];
        alert(`${errorMsg}${errors.length > 0 ? '\n\nErrors:\n' + errors.join('\n') : ''}`);
      }
    } catch (err) {
      // Error sending email
      // TODO: Add proper error reporting service
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
      // Create a followup with remark as note
      const today = new Date();
      const reminderDate = today.toISOString().split('T')[0];

      await followupsAPI.create({
        lead_id: parseInt(id),
        remark: noteText.trim(),
        reminder_date: reminderDate,
        reminder_time: null
      });

      // Refresh lead details to get updated notes
      await fetchLeadDetails();
      setNoteText('');
      setShowNoteInput(false);
    } catch (err) {
      // Error adding note
      // TODO: Add proper error reporting service
      alert(err.response?.data?.message || 'Failed to add note');
    } finally {
      setAddingNote(false);
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

      await followupsAPI.create(payload);

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
      alert('Follow-up added successfully!');
    } catch (err) {
      // Error adding followup
      // TODO: Add proper error reporting service
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
    // Pre-fill form with lead data
    setItineraryFormData({
      itinerary_name: '',
      start_date: lead?.travel_start_date ? formatDateForInput(lead.travel_start_date) : '',
      end_date: lead?.travel_end_date ? formatDateForInput(lead.travel_end_date) : '',
      adult: lead?.adult?.toString() || '1',
      child: lead?.child?.toString() || '0',
      destination: lead?.destinations || lead?.destination || '',
      notes: lead?.remark || ''
    });
    setShowItineraryModal(true);
  };

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
      // Error fetching itineraries
      // TODO: Add proper error reporting service
      alert('Failed to load itineraries');
    } finally {
      setLoadingItineraries(false);
    }
  };

  const handleSelectItinerary = (itinerary) => {
    // Add itinerary to proposals list
    const newProposal = {
      id: Date.now(), // Temporary ID
      itinerary_id: itinerary.id,
      itinerary_name: itinerary.title || itinerary.itinerary_name || 'Untitled Itinerary',
      destination: itinerary.destination || itinerary.destinations || '',
      duration: itinerary.duration || 0,
      price: itinerary.price || 0,
      website_cost: itinerary.website_cost || 0,
      image: itinerary.image || null,
      notes: itinerary.notes || '',
      created_at: new Date().toISOString(),
      inserted_at: new Date().toISOString()
    };

    const updatedProposals = [...proposals, newProposal];
    saveProposals(updatedProposals);

    setShowInsertItineraryModal(false);
    setItinerarySearchTerm('');

    // Show success message
    alert(`Itinerary "${newProposal.itinerary_name}" has been added to proposals.`);
  };

  const filteredItineraries = dayItineraries.filter(itinerary => {
    // Only show active itineraries (show_on_website = true)
    if (!itinerary.show_on_website) {
      return false;
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
    // TODO: Implement itinerary save API call
    // TODO: Add proper error handling
    alert('Itinerary save functionality will be implemented once API is ready');
    // For now, just close the modal
    setShowItineraryModal(false);
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
      // Error getting package details
      // TODO: Add proper error reporting service
      return null;
    }
  };

  const handleViewQuotation = async (proposal) => {
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

      // Set quotation data
      setQuotationData({
        itinerary: {
          ...itinerary,
          duration: proposal.duration || itinerary.duration,
          destination: proposal.destination || itinerary.destinations || itinerary.destination
        },
        hotelOptions: hotelOptions
      });

      // Set first option as selected if available
      const optionNumbers = Object.keys(hotelOptions).sort((a, b) => parseInt(a) - parseInt(b));
      if (optionNumbers.length > 0) {
        setSelectedOption(optionNumbers[0]);
      } else if (proposal.optionNumber) {
        setSelectedOption(proposal.optionNumber.toString());
      }

      setShowQuotationModal(true);
    } catch (err) {
      // Error loading quotation
      // TODO: Add proper error reporting service
      alert('Failed to load quotation data');
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
      // Error loading template
      // TODO: Add proper error reporting service
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
      // Error loading policies
      // TODO: Add proper error reporting service
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
            <div style="padding: 15px; background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); border-radius: 10px; box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);"><strong>Destination:</strong> ${itinerary.destinations || itinerary.destination || 'N/A'}</div>
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
            <div style="padding: 15px; background: #f0f4ff; border-radius: 10px; border-left: 4px solid #2a5298; box-shadow: 0 5px 15px rgba(0,0,0,0.1);"><strong>Destination:</strong> ${itinerary.destinations || itinerary.destination || 'N/A'}</div>
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
              <div style="padding: 15px; background: linear-gradient(135deg, #e0f2f1 0%, #b2dfdb 100%); border-radius: 10px; box-shadow: 0 5px 15px rgba(0,0,0,0.1), inset 0 2px 5px rgba(255,255,255,0.5);"><strong>Destination:</strong> ${itinerary.destinations || itinerary.destination || 'N/A'}</div>
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
              <div><strong style="color: #365314;">Destination:</strong> ${itinerary.destinations || itinerary.destination || 'N/A'}</div>
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
              <div><strong style="color: #164e63;">Destination:</strong> ${itinerary.destinations || itinerary.destination || 'N/A'}</div>
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
              <div><strong style="color: #3f6212;">Destination:</strong> ${itinerary.destinations || itinerary.destination || 'N/A'}</div>
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
                <tr><td class="label">Destination:</td><td>${itinerary.destinations || itinerary.destination || 'N/A'}</td></tr>
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

    const emailContent = await generateEmailContent();
    const subject = encodeURIComponent(`Travel Quotation - ${quotationData.itinerary.itinerary_name || 'Itinerary'} - ${formatLeadId(lead.id)}`);

    // Create a blob with HTML content
    const blob = new Blob([emailContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);

    // Open email client with HTML content
    const mailtoLink = `mailto:${lead.email || ''}?subject=${subject}&body=${encodeURIComponent('Please find the detailed travel quotation attached.')}`;

    // For better email experience, we'll copy HTML to clipboard and open email
    navigator.clipboard.writeText(emailContent).then(() => {
      window.open(mailtoLink);
      alert('Email content copied to clipboard! Paste it in your email client. You can also print this quotation as PDF and attach it.');
    }).catch(() => {
      // Fallback: open email with text body
      const textBody = `Dear ${lead.client_name || 'Client'},

Please find below the travel quotation for your query:

${quotationData.itinerary.itinerary_name || 'Itinerary'}
Destination: ${quotationData.itinerary.destinations || 'N/A'}
Duration: ${quotationData.itinerary.duration || 0} Days

For detailed quotation with images, please use the Print option to generate PDF.

Best regards,
TravelOps Team`;

      window.location.href = `mailto:${lead.email || ''}?subject=${subject}&body=${encodeURIComponent(textBody)}`;
    });
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

  const handleSendWhatsApp = (optionNum) => {
    if (!quotationData || !lead) {
      alert('Please load quotation first');
      return;
    }

    const phone = lead.phone?.replace(/[^0-9]/g, '') || '';
    if (!phone) {
      alert('Phone number not available');
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

    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
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
                <tr><td class="label">Destination:</td><td>${itinerary.destinations || itinerary.destination || 'N/A'}</td></tr>
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
      // Error updating status
      // TODO: Add proper error reporting service
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

  if (!lead) {
    return (
      <Layout>
        <div className="p-6">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            Lead not found
          </div>
        </div>
      </Layout>
    );
  }

  const assignedUser = users.find(u => u.id === lead.assigned_to);

  return (
    <Layout>
      <div className="p-6" style={{ backgroundColor: '#D8DEF5', minHeight: '100vh' }}>
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/leads')}
                className="text-gray-700 hover:text-gray-900"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h1 className="text-xl font-semibold text-gray-800">Query ID: {formatLeadId(lead.id)}</h1>
              {lead.priority === 'hot' && (
                <span className="px-2 py-0.5 text-xs font-semibold bg-red-500 text-white rounded">HOT</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm">
                <Plus className="h-4 w-4" />
                Shortcut
              </button>
              <button className="p-2 hover:bg-gray-100 rounded">
                <Calendar className="h-5 w-5 text-gray-600" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded">
                <Mail className="h-5 w-5 text-gray-600" />
              </button>
            </div>
          </div>
          <div className="text-sm text-gray-600 mb-4">
            Created: {formatDate(lead.created_at)} | Last Updated: {formatDateTime(lead.updated_at)}
          </div>

          {/* Status Buttons */}
          <div className="flex gap-2 flex-wrap mb-6">
            {[
              { key: 'new', label: 'New' },
              { key: 'proposal', label: 'Proposal Sent' },
              { key: 'noConnect', label: 'No Connect' },
              { key: 'hotLead', label: 'Hot Lead' },
              { key: 'proposalConfirmed', label: 'Proposal Con..' },
              { key: 'cancel', label: 'Cancel' },
              { key: 'followup', label: 'Follow Up' },
              { key: 'confirmed', label: 'Confirmed' },
              { key: 'postponed', label: 'Postponed' },
              { key: 'invalid', label: 'Invalid' }
            ].map(({ key, label }) => {
              const isActive = (key === 'new' && lead.status === 'new') ||
                (key === 'proposal' && lead.status === 'proposal') ||
                (key === 'followup' && lead.status === 'followup') ||
                (key === 'confirmed' && lead.status === 'confirmed') ||
                (key === 'cancel' && lead.status === 'cancelled') ||
                (key === 'hotLead' && lead.priority === 'hot');

              return (
                <button
                  key={key}
                  onClick={() => {
                    if (key === 'new') handleStatusChange('new');
                    else if (key === 'proposal') handleStatusChange('proposal');
                    else if (key === 'followup') handleStatusChange('followup');
                    else if (key === 'confirmed') handleStatusChange('confirmed');
                    else if (key === 'cancel') handleStatusChange('cancelled');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium ${isActive
                    ? key === 'new'
                      ? 'bg-blue-600 text-white'
                      : 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="col-span-1 space-y-6">
            {/* Query Information */}
            <div className="bg-white rounded-lg shadow p-6 border-2 border-dashed border-blue-500">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Query Information</h2>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-600">Destination:</span>
                  <span className="ml-2 font-medium text-gray-900">{lead.destination || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-600">From Date:</span>
                  <span className="ml-2 font-medium text-gray-900">{lead.travel_start_date ? formatDate(lead.travel_start_date) : 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-600">To Date:</span>
                  <span className="ml-2 font-medium text-gray-900">{lead.travel_end_date ? formatDate(lead.travel_end_date) : lead.travel_start_date ? formatDate(lead.travel_start_date) : 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-600">Travel Month:</span>
                  <span className="ml-2 font-medium text-gray-900">{lead.travel_start_date ? getTravelMonth(lead.travel_start_date) : 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-600">Lead Source:</span>
                  <span className="ml-2 font-medium text-gray-900">{lead.source || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-600">Services:</span>
                  <span className="ml-2 font-medium text-gray-900">{lead.service || 'Activities only'}</span>
                </div>
                <div>
                  <span className="text-gray-600">Pax:</span>
                  <span className="ml-2 font-medium text-gray-900">Adult: {lead.adult || '1'} - Child: {lead.child || '0'} - Infant: {lead.infant || '0'}</span>
                </div>
                <div>
                  <span className="text-gray-600">Assign To:</span>
                  <span className="ml-2 font-medium text-gray-900">{assignedUser?.name || 'N/A'}</span>
                </div>
                {lead.remark && (
                  <div>
                    <span className="text-gray-600">Description:</span>
                    <span className="ml-2 font-medium text-gray-900">{lead.remark}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Related Customer */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Related Customer</h2>
              <div className="space-y-2 text-sm">
                <div className="font-medium text-gray-900">
                  {lead.client_title ? `${lead.client_title} ` : 'Mr. '}{lead.client_name}
                </div>
                <div className="text-gray-600">Phone: {lead.phone || 'N/A'}</div>
                <div className="text-gray-600">Email: {lead.email || 'N/A'}</div>
              </div>
            </div>

            {/* Notes */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-800">Notes</h2>
                {!showNoteInput && (
                  <button
                    onClick={() => setShowNoteInput(true)}
                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 flex items-center gap-1"
                  >
                    <Plus className="h-4 w-4" />
                    Add Note
                  </button>
                )}
              </div>

              {showNoteInput && (
                <div className="mb-4">
                  <textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Type Note Here"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    rows="3"
                  />
                  <div className="flex justify-end gap-2 mt-2">
                    <button
                      onClick={() => {
                        setShowNoteInput(false);
                        setNoteText('');
                      }}
                      className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddNote}
                      disabled={addingNote}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 flex items-center gap-1 disabled:opacity-50"
                    >
                      {addingNote ? 'Adding...' : (
                        <>
                          <Plus className="h-4 w-4" />
                          Add Note
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {notes.length === 0 ? (
                  <div className="text-gray-500 text-sm">No Notes</div>
                ) : (
                  notes.map((note, index) => (
                    <div key={index} className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded">
                      <div className="flex items-start gap-2">
                        <span className="text-yellow-600">📌</span>
                        <div className="flex-1">
                          <p className="text-sm text-gray-800">{note.content}</p>
                          <p className="text-xs text-gray-500 mt-1">{formatDateTime(note.created_at)} by {note.created_by || 'System'}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="col-span-2">
            {/* Tabs */}
            <div className="bg-white rounded-lg shadow">
              <div className="border-b border-gray-200">
                <div className="flex overflow-x-auto">
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
                  ].map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setActiveTab(key)}
                      className={`px-4 py-3 text-sm font-medium whitespace-nowrap ${activeTab === key
                        ? 'border-b-2 border-blue-600 text-blue-600'
                        : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === 'proposals' && (
                  <div>
                    {/* Confirmed Option Banner */}
                    {getConfirmedOption() && (() => {
                      const confirmedOption = getConfirmedOption();
                      return (
                        <div className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-400 rounded-xl p-5 shadow-lg">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div className="flex items-center gap-4">
                              <div className="bg-green-500 rounded-full p-3 shadow-md">
                                <CheckCircle className="h-7 w-7 text-white" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-bold text-green-800 text-xl">
                                    Option {confirmedOption.optionNumber} Confirmed
                                  </h3>
                                  <span className="px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full shadow-sm">
                                    ✓ CONFIRMED
                                  </span>
                                </div>
                                <p className="text-sm text-green-700 font-medium">
                                  Final itinerary is ready to share with the client
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-3">
                              <button
                                onClick={handleSendConfirmedOptionEmail}
                                className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 flex items-center gap-2 font-semibold shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                              >
                                <Mail className="h-5 w-5" />
                                Share Email
                              </button>
                              <button
                                onClick={handleSendConfirmedOptionWhatsApp}
                                className="bg-green-600 text-white px-5 py-2.5 rounded-lg hover:bg-green-700 flex items-center gap-2 font-semibold shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                              >
                                <MessageCircle className="h-5 w-5" />
                                Share WhatsApp
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    <div className="flex gap-3 mb-6">
                      <button
                        onClick={handleCreateItinerary}
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium"
                      >
                        <Plus className="h-5 w-5" />
                        Create itinerary
                      </button>
                      <button
                        onClick={handleInsertItinerary}
                        className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 flex items-center gap-2 font-medium"
                      >
                        <Upload className="h-5 w-5" />
                        Insert itinerary
                      </button>
                    </div>

                    {/* Proposals List */}
                    {proposals.length === 0 ? (
                      <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="mb-2">No proposals added yet</p>
                        <p className="text-sm">Click "Insert itinerary" to add an itinerary as a proposal</p>
                      </div>
                    ) : (() => {
                      // Group proposals by itinerary_id
                      const groupedProposals = {};
                      proposals.forEach(proposal => {
                        const key = proposal.itinerary_id || `no-id-${proposal.itinerary_name}`;
                        if (!groupedProposals[key]) {
                          groupedProposals[key] = {
                            itinerary_id: proposal.itinerary_id,
                            itinerary_name: proposal.itinerary_name,
                            destination: proposal.destination,
                            duration: proposal.duration,
                            image: proposal.image,
                            inserted_at: proposal.inserted_at || proposal.created_at,
                            options: []
                          };
                        }
                        groupedProposals[key].options.push(proposal);
                      });

                      return (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {Object.values(groupedProposals).map((group) => (
                            <div
                              key={group.itinerary_id || group.itinerary_name}
                              className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300"
                            >
                              {/* Image */}
                              <div className="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
                                {group.image ? (
                                  <img
                                    src={group.image}
                                    alt={group.itinerary_name}
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
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <span className="text-sm text-gray-400 font-medium">NO PHOTO</span>
                                  </div>
                                )}
                              </div>

                              {/* Content */}
                              <div className="p-4">
                                {/* Title, Destination, Duration in one line */}
                                <div
                                  className="mb-4 cursor-pointer hover:text-blue-600 transition-colors"
                                  onClick={() => {
                                    if (group.itinerary_id) {
                                      navigate(`/itineraries/${group.itinerary_id}`);
                                    }
                                  }}
                                >
                                  <h3 className="text-lg font-bold text-gray-800 inline">
                                    {group.itinerary_name}
                                  </h3>
                                  {group.destination && (
                                    <span className="text-sm text-gray-600 ml-2 font-medium">
                                      • {group.destination}
                                    </span>
                                  )}
                                  {group.duration > 0 && (
                                    <span className="text-sm text-gray-600 ml-2 font-medium">
                                      • {group.duration} Days
                                    </span>
                                  )}
                                </div>

                                {/* Options Display */}
                                <div className="mt-3 mb-3">
                                  <div className="text-xs font-bold text-gray-700 mb-3 flex items-center gap-2">
                                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">Options</span>
                                    <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded font-semibold">
                                      {group.options.length}
                                    </span>
                                  </div>
                                  <div className="space-y-3">
                                    {group.options.sort((a, b) => (a.optionNumber || 0) - (b.optionNumber || 0)).map((option) => {
                                      const packageDetails = getPackageDetails(option);
                                      return (
                                        <div
                                          key={option.id}
                                          className={`border-2 rounded-xl p-4 transition-all duration-200 ${option.confirmed
                                            ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-400 shadow-md'
                                            : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm'
                                            }`}
                                        >
                                          <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2 flex-wrap">
                                              <span className={`px-3 py-1.5 text-xs font-bold rounded-lg shadow-sm ${option.confirmed
                                                ? 'bg-green-500 text-white border-2 border-green-600'
                                                : 'bg-blue-500 text-white border-2 border-blue-600'
                                                }`}>
                                                Option {option.optionNumber || 'N/A'}
                                                {option.confirmed && (
                                                  <span className="ml-1.5">✓</span>
                                                )}
                                              </span>
                                              {option.confirmed && (
                                                <span className="px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold rounded-full shadow-md flex items-center gap-1">
                                                  <CheckCircle className="h-3 w-3" />
                                                  CONFIRMED
                                                </span>
                                              )}
                                            </div>
                                            {option.price > 0 && (
                                              <span className={`text-base font-bold ${option.confirmed ? 'text-green-700' : 'text-gray-800'
                                                }`}>
                                                ₹{option.price.toLocaleString('en-IN')}
                                              </span>
                                            )}
                                          </div>

                                          {/* Package Details */}
                                          {packageDetails && (
                                            <div className="mt-2 space-y-2 text-xs">
                                              {/* Hotels */}
                                              {packageDetails.hotels.length > 0 && (
                                                <div className={`rounded-lg p-3 border ${option.confirmed
                                                  ? 'bg-white border-green-200 shadow-sm'
                                                  : 'bg-gray-50 border-gray-200'
                                                  }`}>
                                                  <span className="font-bold text-gray-800 block mb-2 flex items-center gap-1">
                                                    <span className="text-base">🏨</span>
                                                    <span>Hotels:</span>
                                                  </span>
                                                  <div className="space-y-2">
                                                    {packageDetails.hotels.map((hotel, idx) => (
                                                      <div key={idx} className="flex gap-3 items-start p-2 bg-white rounded-lg border border-gray-100">
                                                        {/* Hotel Image */}
                                                        {hotel.image && (
                                                          <div className="flex-shrink-0">
                                                            <img
                                                              src={hotel.image}
                                                              alt={hotel.name}
                                                              className="w-20 h-20 object-cover rounded-lg border-2 border-gray-200 shadow-sm"
                                                              onError={(e) => {
                                                                e.target.style.display = 'none';
                                                              }}
                                                            />
                                                          </div>
                                                        )}
                                                        <div className="flex-1 text-gray-700 text-xs">
                                                          <div className="mb-1">
                                                            <span className="font-bold text-blue-600">Day {hotel.day}:</span>{' '}
                                                            <span className="font-semibold text-gray-800">{hotel.name}</span>
                                                            <span className="text-gray-600 ml-1">({hotel.category})</span>
                                                          </div>
                                                          <div className="text-gray-700 mt-1 font-medium">
                                                            {hotel.room} • {hotel.mealPlan}
                                                          </div>
                                                          {(hotel.checkIn || hotel.checkOut) && (
                                                            <div className="text-gray-600 text-xs mt-1.5">
                                                              {hotel.checkIn && `Check-in: ${hotel.checkIn} ${hotel.checkInTime || ''}`}
                                                              {hotel.checkIn && hotel.checkOut && ' • '}
                                                              {hotel.checkOut && `Check-out: ${hotel.checkOut} ${hotel.checkOutTime || ''}`}
                                                            </div>
                                                          )}
                                                        </div>
                                                      </div>
                                                    ))}
                                                  </div>
                                                </div>
                                              )}

                                              {/* Meals */}
                                              {packageDetails.meals.length > 0 && (
                                                <div className={`rounded-lg p-3 border ${option.confirmed
                                                  ? 'bg-white border-green-200 shadow-sm'
                                                  : 'bg-gray-50 border-gray-200'
                                                  }`}>
                                                  <span className="font-bold text-gray-800 block mb-1 flex items-center gap-1">
                                                    <span className="text-base">🍽️</span>
                                                    <span>Meals:</span>
                                                  </span>
                                                  <div className="space-y-1">
                                                    {packageDetails.meals.map((meal, idx) => (
                                                      <div key={idx} className="text-gray-700 pl-2 text-xs">
                                                        <span className="font-semibold text-gray-800">Day {meal.day}:</span>{' '}
                                                        <span className="font-medium">{meal.name}</span>
                                                        {meal.type && <span className="text-gray-600"> • {meal.type}</span>}
                                                      </div>
                                                    ))}
                                                  </div>
                                                </div>
                                              )}

                                              {/* Activities */}
                                              {packageDetails.activities.length > 0 && (
                                                <div className={`rounded-lg p-3 border ${option.confirmed
                                                  ? 'bg-white border-green-200 shadow-sm'
                                                  : 'bg-gray-50 border-gray-200'
                                                  }`}>
                                                  <span className="font-bold text-gray-800 block mb-2 flex items-center gap-1">
                                                    <span className="text-base">🎯</span>
                                                    <span>Activities:</span>
                                                  </span>
                                                  <div className="space-y-2">
                                                    {packageDetails.activities.map((activity, idx) => (
                                                      <div key={idx} className="flex gap-3 items-start p-2 bg-white rounded-lg border border-gray-100">
                                                        {/* Activity Image */}
                                                        {activity.image && (
                                                          <div className="flex-shrink-0">
                                                            <img
                                                              src={activity.image}
                                                              alt={activity.name}
                                                              className="w-20 h-20 object-cover rounded-lg border-2 border-gray-200 shadow-sm"
                                                              onError={(e) => {
                                                                e.target.style.display = 'none';
                                                              }}
                                                            />
                                                          </div>
                                                        )}
                                                        <div className="flex-1 text-gray-700 text-xs">
                                                          <div className="mb-1">
                                                            <span className="font-bold text-blue-600">Day {activity.day}:</span>{' '}
                                                            <span className="font-semibold text-gray-800">{activity.name}</span>
                                                          </div>
                                                          {activity.details && (
                                                            <div className="text-gray-600 mt-1">{activity.details}</div>
                                                          )}
                                                        </div>
                                                      </div>
                                                    ))}
                                                  </div>
                                                </div>
                                              )}

                                              {/* Transport */}
                                              {packageDetails.transport.length > 0 && (
                                                <div className={`rounded-lg p-3 border ${option.confirmed
                                                  ? 'bg-white border-green-200 shadow-sm'
                                                  : 'bg-gray-50 border-gray-200'
                                                  }`}>
                                                  <span className="font-bold text-gray-800 block mb-1 flex items-center gap-1">
                                                    <span className="text-base">🚗</span>
                                                    <span>Transport:</span>
                                                  </span>
                                                  <div className="space-y-1">
                                                    {packageDetails.transport.map((trans, idx) => (
                                                      <div key={idx} className="text-gray-700 pl-2 text-xs">
                                                        <span className="font-semibold text-gray-800">Day {trans.day}:</span>{' '}
                                                        <span className="font-medium">{trans.name}</span>
                                                        {trans.details && <span className="text-gray-600"> • {trans.details}</span>}
                                                      </div>
                                                    ))}
                                                  </div>
                                                </div>
                                              )}

                                              {/* Other Services */}
                                              {packageDetails.other.length > 0 && (
                                                <div className={`rounded-lg p-3 border ${option.confirmed
                                                  ? 'bg-white border-green-200 shadow-sm'
                                                  : 'bg-gray-50 border-gray-200'
                                                  }`}>
                                                  <span className="font-bold text-gray-800 block mb-1 flex items-center gap-1">
                                                    <span className="text-base">📋</span>
                                                    <span>Other Services:</span>
                                                  </span>
                                                  <div className="space-y-1">
                                                    {packageDetails.other.map((other, idx) => (
                                                      <div key={idx} className="text-gray-700 pl-2 text-xs">
                                                        <span className="font-semibold text-gray-800">Day {other.day}:</span>{' '}
                                                        <span className="font-medium">{other.name}</span>
                                                        {other.details && <span className="text-gray-600"> • {other.details}</span>}
                                                      </div>
                                                    ))}
                                                  </div>
                                                </div>
                                              )}

                                              {packageDetails.hotels.length === 0 &&
                                                packageDetails.meals.length === 0 &&
                                                packageDetails.activities.length === 0 &&
                                                packageDetails.transport.length === 0 &&
                                                packageDetails.other.length === 0 && (
                                                  <div className="text-gray-500 italic text-center py-2">
                                                    Package details not available
                                                  </div>
                                                )}
                                            </div>
                                          )}

                                          <div className="flex gap-2 mt-4 pt-3 border-t border-gray-200">
                                            {!option.confirmed ? (
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  if (window.confirm(`Are you sure you want to confirm Option ${option.optionNumber}?`)) {
                                                    handleConfirmOption(option.id);
                                                  }
                                                }}
                                                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2.5 rounded-lg hover:from-green-700 hover:to-emerald-700 flex items-center justify-center gap-2 text-xs font-bold shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                                              >
                                                <CheckCircle className="h-4 w-4" />
                                                Confirm Option
                                              </button>
                                            ) : (
                                              <div className="flex gap-2 w-full">
                                                <button
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleSendConfirmedOptionEmail();
                                                  }}
                                                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-3 py-2.5 rounded-lg hover:from-blue-700 hover:to-blue-800 flex items-center justify-center gap-2 text-xs font-bold shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                                                  title="Share Confirmed Itinerary via Email"
                                                >
                                                  <Mail className="h-4 w-4" />
                                                  Share Email
                                                </button>
                                                <button
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleSendConfirmedOptionWhatsApp();
                                                  }}
                                                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-3 py-2.5 rounded-lg hover:from-green-700 hover:to-emerald-700 flex items-center justify-center gap-2 text-xs font-bold shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                                                  title="Share Confirmed Itinerary via WhatsApp"
                                                >
                                                  <MessageCircle className="h-4 w-4" />
                                                  Share WhatsApp
                                                </button>
                                              </div>
                                            )}
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleViewQuotation(option);
                                              }}
                                              className={`px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 text-xs font-bold shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105 ${option.confirmed
                                                ? 'bg-gradient-to-r from-gray-600 to-gray-700 text-white hover:from-gray-700 hover:to-gray-800'
                                                : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800'
                                                }`}
                                            >
                                              <FileText className="h-4 w-4" />
                                              View
                                            </button>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>

                                <div className="pt-4 mt-4 border-t-2 border-gray-200 flex items-center justify-between">
                                  <span className="text-xs text-gray-600 font-medium">
                                    Added: {new Date(group.inserted_at).toLocaleDateString('en-GB')}
                                  </span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (window.confirm('Are you sure you want to remove all options from this itinerary?')) {
                                        const updatedProposals = proposals.filter(p =>
                                          !group.options.some(opt => opt.id === p.id)
                                        );
                                        saveProposals(updatedProposals);
                                      }
                                    }}
                                    className="text-red-600 hover:text-red-700 text-sm font-bold px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                                  >
                                    Remove All
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                )}
                {activeTab === 'mails' && (
                  <div className="space-y-4">
                    {/* Header with Compose Button and Customer Email */}
                    <div className="flex items-center gap-4 mb-6">
                      <button
                        onClick={openComposeModal}
                        className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium shadow-md"
                      >
                        <Mail className="h-5 w-5" />
                        Compose
                      </button>
                      {lead?.email && (
                        <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 rounded-lg border border-gray-200">
                          <span className="text-gray-500 text-sm">ℹ</span>
                          <span className="text-gray-700 font-medium">{lead.email}</span>
                        </div>
                      )}
                    </div>

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
                                const latestEmail = thread[0];
                                const isExpanded = false; // Add state for expansion if needed

                                return (
                                  <div key={latestEmail.thread_id} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                    <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center cursor-pointer">
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
                                    </div>
                                    <div className="divide-y divide-gray-100 max-h-60 overflow-y-auto">
                                      {thread.map((email) => (
                                        <div key={email.id} className={`p-4 ${email.direction === 'inbound' ? 'bg-white' : 'bg-blue-50'}`}>
                                          <div className="flex justify-between items-start mb-2">
                                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${email.direction === 'inbound' ? 'bg-gray-100 text-gray-600' : 'bg-blue-100 text-blue-600'
                                              }`}>
                                              {email.direction === 'inbound' ? 'Received' : 'Sent'}
                                            </span>
                                            <span className="text-xs text-gray-400">
                                              {new Date(email.created_at).toLocaleString()}
                                            </span>
                                          </div>
                                          <div className="text-sm text-gray-800 whitespace-pre-wrap line-clamp-3">
                                            {email.body}
                                          </div>
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
                                    <div className="text-sm text-gray-500 truncate mt-1" dangerouslySetInnerHTML={{ __html: email.body }}></div>
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
                )}
                {activeTab === 'whatsapp' && (
                  <div className="text-center py-12 text-gray-500">
                    No WhatsApp messages yet
                  </div>
                )}
                {activeTab === 'followups' && (
                  <div>
                    {/* Header with Add Button */}
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-gray-800">Followup's / Task</h3>
                      <button
                        onClick={() => {
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
                                            // Error completing followup
                                            // TODO: Add proper error reporting service
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
                )}
                {activeTab === 'suppComm' && (
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
                        disabled={sendingEmail || (selectedSuppliers.length === 0 && selectedHotels.length === 0)}
                        className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold"
                      >
                        <Send className="h-5 w-5" />
                        {sendingEmail ? 'Sending...' : `Send Mail To Selected (${selectedSuppliers.length} Suppliers${selectedHotels.length > 0 ? `, ${selectedHotels.length} Hotels` : ''})`}
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

                      {/* Hotels from Confirmed Option Section */}
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
                              <span className="font-semibold text-gray-800">Select Hotels (From Confirmed Option)</span>
                            </label>
                          </div>

                          <div className="max-h-[300px] overflow-y-auto space-y-3">
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
                    </div>
                  </div>
                )}
                {activeTab === 'postSales' && (
                  <div className="space-y-6">
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Post Sales</h3>
                      <div className="text-center py-8 text-gray-500">
                        <p>Post sales management coming soon</p>
                        <p className="text-sm mt-2">Track and manage post-sale activities here</p>
                      </div>
                    </div>
                  </div>
                )}
                {activeTab === 'voucher' && (
                  <div className="space-y-6">
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Vouchers</h3>
                      <div className="flex justify-end mb-4">
                        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                          <Plus className="h-4 w-4" />
                          Create Voucher
                        </button>
                      </div>
                      <div className="text-center py-8 text-gray-500">
                        <p>No vouchers created yet</p>
                        <p className="text-sm mt-2">Create hotel, transport, and activity vouchers here</p>
                      </div>
                    </div>
                  </div>
                )}
                {activeTab === 'docs' && (
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
                )}
                {activeTab === 'invoice' && (
                  <div className="space-y-6">
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Invoices</h3>
                      <div className="flex justify-end mb-4">
                        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                          <Plus className="h-4 w-4" />
                          Create Invoice
                        </button>
                      </div>
                      <div className="text-center py-8 text-gray-500">
                        <p>No invoices generated</p>
                        <p className="text-sm mt-2">Generate and manage client invoices here</p>
                      </div>
                    </div>
                  </div>
                )}
                {activeTab === 'billing' && (
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
                )}
                {activeTab === 'history' && (
                  <div className="text-center py-12 text-gray-500">
                    No history available
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

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

                {/* Start Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={itineraryFormData.start_date}
                    onChange={(e) => setItineraryFormData({ ...itineraryFormData, start_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* End Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={itineraryFormData.end_date}
                    onChange={(e) => setItineraryFormData({ ...itineraryFormData, end_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Adult */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Adult
                  </label>
                  <input
                    type="number"
                    value={itineraryFormData.adult}
                    onChange={(e) => setItineraryFormData({ ...itineraryFormData, adult: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                  />
                </div>

                {/* Child */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Child
                  </label>
                  <input
                    type="number"
                    value={itineraryFormData.child}
                    onChange={(e) => setItineraryFormData({ ...itineraryFormData, child: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
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
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </form>
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
                  {itinerarySearchTerm ? 'No itineraries found matching your search' : 'No itineraries available'}
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
              <h2 className="text-xl font-bold text-gray-800">Add Followup / Task</h2>
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
                  {addingFollowup ? 'Saving...' : 'Save'}
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
              <h2 className="text-lg font-semibold text-gray-800">Compose Mail</h2>
              <button
                onClick={() => {
                  setShowComposeModal(false);
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

