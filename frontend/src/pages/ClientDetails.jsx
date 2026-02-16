import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { accountsAPI, followUpAPI, leadsAPI, paymentsAPI } from '../services/api';
import Layout from '../components/Layout';
import { ArrowLeft, Phone, Mail, MapPin, Calendar, DollarSign, FileText, MessageSquare, User, Plus, Edit, Save, X, TrendingUp } from 'lucide-react';

const ClientDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddFollowUp, setShowAddFollowUp] = useState(false);
  const [editingClient, setEditingClient] = useState(false);
  const [followUps, setFollowUps] = useState([]);
  const [payments, setPayments] = useState([]);
  const [queries, setQueries] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [vendorPayments, setVendorPayments] = useState([]);
  const [followUpForm, setFollowUpForm] = useState({
    type: 'Phone Call',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().split(' ')[0].substring(0, 5),
    notes: '',
    nextAction: '',
    nextFollowUpDate: ''
  });
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    mobile: '',
    secondaryMobile: '',
    secondaryEmail: '',
    city: '',
    address: '',
    dateOfBirth: '',
    marriageAnniversary: ''
  });

  useEffect(() => {
    fetchClientDetails();
  }, [id]);

  // Load follow-ups from localStorage on component mount
  useEffect(() => {
    const loadFollowUps = async () => {
      try {
        const followUpResponse = await followUpAPI.getClientFollowUps(id);

        if (followUpResponse && followUpResponse.data && followUpResponse.data.success) {
          const apiFollowUps = followUpResponse.data.data;
          setFollowUps(apiFollowUps);
          localStorage.setItem(`followUps_${id}`, JSON.stringify(apiFollowUps));
        } else {
          const savedFollowUps = localStorage.getItem(`followUps_${id}`);
          if (savedFollowUps) {
            const parsedFollowUps = JSON.parse(savedFollowUps);
            setFollowUps(parsedFollowUps);
          } else {
            const mockFollowUps = [
              {
                id: 1,
                date: '2024-01-20',
                time: '10:00',
                type: 'Phone Call',
                notes: 'Discussed Manali trip details, client interested in 3-day package',
                nextAction: 'Send detailed itinerary'
              },
              {
                id: 2,
                date: '2024-01-15',
                time: '14:30',
                type: 'Email',
                notes: 'Sent payment reminder for Delhi trip',
                nextAction: 'Follow up on payment'
              }
            ];
            setFollowUps(mockFollowUps);
            localStorage.setItem(`followUps_${id}`, JSON.stringify(mockFollowUps));
          }
        }
      } catch {
        const savedFollowUps = localStorage.getItem(`followUps_${id}`);
        if (savedFollowUps) {
          try {
            const parsedFollowUps = JSON.parse(savedFollowUps);
            setFollowUps(parsedFollowUps);
          } catch {
            setFollowUps([]);
          }
        } else {
          setFollowUps([]);
        }
      }
    };

    loadFollowUps();
  }, [id]);

  useEffect(() => {
    localStorage.setItem(`followUps_${id}`, JSON.stringify(followUps));
  }, [followUps, id]);

  const fetchClientDetails = async () => {
    try {
      const clientResponse = await accountsAPI.getClient(id);

      if (clientResponse && clientResponse.data && clientResponse.data.success) {
        const clientData = clientResponse.data.data;

        // Define relevant IDs: Main Client ID (if it's a lead) + Query IDs
        const queryIds = clientData.id ? [clientData.id] : [];
        if (clientData.queries && Array.isArray(clientData.queries)) {
          clientData.queries.forEach(q => {
            if (q.id && !queryIds.includes(q.id)) queryIds.push(q.id);
          });
        }

        // Fetch details for all queries to sum up package prices causing total deal value
        const leadPromises = queryIds.map(qid => leadsAPI.get(qid).catch(() => null));
        const paymentPromises = queryIds.map(qid => paymentsAPI.getByLead(qid).catch(() => null));

        const [leadResults, paymentResults] = await Promise.all([
          Promise.all(leadPromises),
          Promise.all(paymentPromises)
        ]);

        let grandTotalPackagePrice = 0;
        let grandTotalPaid = 0;
        let aggregatedPayments = [];

        // Process Package Prices from Leads
        leadResults.forEach(res => {
          if (res?.data?.success) {
            const lead = res.data.data;
            // Find confirmed proposal
            if (lead.proposals && lead.proposals.length > 0) {
              const confirmed = lead.proposals.find(p => p.status?.toLowerCase() === 'confirmed');
              if (confirmed) {
                let price = parseFloat(confirmed.price || 0);
                // Fallback to quotation data if price is missing
                if (!price && lead.quotation && lead.quotation.data) {
                  try {
                    const qData = JSON.parse(lead.quotation.data);
                    const optNum = confirmed.option_number;
                    if (qData.hotelOptions && qData.hotelOptions[optNum]) {
                      // Use reducing logic for hotel options price sum if applicable
                      const calcPrice = qData.hotelOptions[optNum].reduce((sum, h) => sum + (parseFloat(h.price) || 0), 0);
                      if (calcPrice > 0) price = calcPrice;
                    }
                  } catch (e) {
                    console.error("Error parsing quotation data for lead " + lead.id, e);
                  }
                }
                grandTotalPackagePrice += price;
              }
            }
          }
        });

        // Process Payments
        paymentResults.forEach(res => {
          if (res?.data?.success && res.data.data?.payments) {
            const pList = res.data.data.payments;
            pList.forEach(p => {
              // Check if already added (avoid duplicates if main query ID is repeated)
              if (!aggregatedPayments.some(ap => ap.id === p.id)) {
                aggregatedPayments.push(p);
                grandTotalPaid += parseFloat(p.paid_amount || 0);
              }
            });
          }
        });

        // Fallback: If no confirmed package price found, use the MAXIMUM 'Total Amount' from any single payment
        // This avoids summing up the 'Deal Value' repeatedly if the user entered it for every installment.
        if (grandTotalPackagePrice === 0 && aggregatedPayments.length > 0) {
          const maxPaymentExpected = aggregatedPayments.reduce((max, p) => Math.max(max, parseFloat(p.amount) || 0), 0);
          if (maxPaymentExpected > 0) {
            grandTotalPackagePrice = maxPaymentExpected;
          }
        }

        const grandTotalDue = Math.max(0, grandTotalPackagePrice - grandTotalPaid);

        // Update Client Data with new calculated totals
        clientData.calculatedTotal = grandTotalPackagePrice;
        clientData.calculatedPaid = grandTotalPaid;
        clientData.calculatedDue = grandTotalDue;

        setClient(clientData);

        setEditForm({
          name: clientData.name,
          email: clientData.email,
          mobile: clientData.mobile,
          mobile2: clientData.mobile2 || '',
          email2: clientData.email2 || '',
          city: clientData.city,
          address: clientData.address || '',
          marriageAnniversary: clientData.marriageAnniversary || ''
        });

        // Format Aggregated Payments for Display
        const formattedPayments = aggregatedPayments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).map(p => ({
          id: p.id,
          date: p.created_at ? new Date(p.created_at).toISOString().split('T')[0] : 'N/A',
          amount: `₹${parseFloat(p.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
          paidAmount: `₹${parseFloat(p.paid_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
          dueAmount: `₹${Math.max(0, parseFloat(p.amount || 0) - parseFloat(p.paid_amount || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
          status: p.status ? p.status.charAt(0).toUpperCase() + p.status.slice(1) : 'Pending',
          description: p.description || `Payment #${p.id}`,
          dueDate: p.due_date,
          addedBy: p.created_by
        }));

        setPayments(formattedPayments);
        setQueries(clientData.queries || []);
        setInvoices(clientData.invoices || []);
        setDocuments(clientData.documents || []);
        setFollowUps(clientData.followUps || []);
        setVendorPayments(clientData.vendorPayments || []);
      }
    } catch (error) {
      console.error('Failed to fetch client details:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handler functions
  const handleAddFollowUp = async () => {
    if (!followUpForm.notes.trim()) {
      toast.warning('Please add notes for the follow-up');
      return;
    }

    try {
      // Prepare follow-up data for API
      const followUpData = {
        client_id: id,
        type: followUpForm.type,
        date: followUpForm.date,
        time: followUpForm.time,
        notes: followUpForm.notes,
        next_action: followUpForm.nextAction || 'No action specified',
        next_followup_date: followUpForm.nextFollowUpDate,
        created_by: 1 // This should come from auth context
      };

      // Call API to save follow-up
      const response = await followUpAPI.create(followUpData);

      if (response.data.success) {
        // Add to local state with server ID
        const newFollowUp = {
          id: response.data.data.id, // Use server ID
          date: followUpForm.date,
          time: followUpForm.time,
          type: followUpForm.type,
          notes: followUpForm.notes,
          nextAction: followUpForm.nextAction || 'No action specified',
          nextFollowUpDate: followUpForm.nextFollowUpDate
        };

        // Update local state
        setFollowUps(prevFollowUps => {
          const updatedFollowUps = [newFollowUp, ...prevFollowUps];
          localStorage.setItem(`followUps_${id}`, JSON.stringify(updatedFollowUps));
          return updatedFollowUps;
        });

        // Reset form
        setShowAddFollowUp(false);
        setFollowUpForm({
          type: 'Phone Call',
          date: new Date().toISOString().split('T')[0],
          time: new Date().toTimeString().split(' ')[0].substring(0, 5),
          notes: '',
          nextAction: '',
          nextFollowUpDate: ''
        });

        // Show success message
        toast.success('Follow-up saved to database successfully!');
      } else {
        throw new Error(response.data.message || 'Failed to save follow-up');
      }
    } catch {
      toast.info('Failed to save follow-up. Saving locally...');

      // Fallback: Save to local state and localStorage
      const newFollowUp = {
        id: Date.now(),
        date: followUpForm.date,
        time: followUpForm.time,
        type: followUpForm.type,
        notes: followUpForm.notes,
        nextAction: followUpForm.nextAction || 'No action specified',
        nextFollowUpDate: followUpForm.nextFollowUpDate
      };

      setFollowUps(prevFollowUps => {
        const updatedFollowUps = [newFollowUp, ...prevFollowUps];
        localStorage.setItem(`followUps_${id}`, JSON.stringify(updatedFollowUps));
        return updatedFollowUps;
      });

      setShowAddFollowUp(false);
      setFollowUpForm({
        type: 'Phone Call',
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().split(' ')[0].substring(0, 5),
        notes: '',
        nextAction: '',
        nextFollowUpDate: ''
      });

      toast.success('Follow-up saved locally!');
    }
  };

  const handleEditClient = () => {
    setEditingClient(true);
  };

  const handleSaveClient = () => {
    setClient({
      ...client,
      ...editForm
    });
    setEditingClient(false);
  };

  const handleCancelEdit = () => {
    setEditForm({
      name: client.name,
      email: client.email,
      mobile: client.mobile,
      mobile2: client.mobile2 || '',
      email2: client.email2 || '',
      city: client.city,
      address: client.address || '',
      dateOfBirth: client.dateOfBirth || '',
      marriageAnniversary: client.marriageAnniversary || ''
    });
    setEditingClient(false);
  };

  const handleFollowUpFormChange = (e) => {
    const { name, value } = e.target;
    setFollowUpForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const mockPayments = [
    {
      id: 1,
      date: '2024-01-10',
      amount: '₹15,000',
      status: 'Paid',
      method: 'Bank Transfer',
      description: 'Trip to Manali'
    },
    {
      id: 2,
      date: '2024-01-08',
      amount: '₹20,000',
      status: 'Paid',
      method: 'Cash',
      description: 'Advance for Delhi trip'
    },
    {
      id: 3,
      date: '2024-01-05',
      amount: '₹10,000',
      status: 'Pending',
      method: 'Online',
      description: 'Hotel booking'
    }
  ];

  const mockQueries = [
    {
      id: 1,
      date: '2024-01-14',
      destination: 'Manali',
      status: 'Confirmed',
      budget: '₹25,000',
      adults: 2,
      children: 1
    },
    {
      id: 2,
      date: '2024-01-10',
      destination: 'Delhi',
      status: 'Pending',
      budget: '₹15,000',
      adults: 1,
      children: 0
    },
    {
      id: 3,
      date: '2024-01-05',
      destination: 'Shimla',
      status: 'Completed',
      budget: '₹20,000',
      adults: 2,
      children: 2
    }
  ];

  const mockFollowUps = [
    {
      id: 1,
      date: '2024-01-20',
      type: 'Phone Call',
      notes: 'Discussed Manali trip details, client interested in 3-day package',
      nextAction: 'Send detailed itinerary'
    },
    {
      id: 2,
      date: '2024-01-15',
      type: 'Email',
      notes: 'Sent payment reminder for Delhi trip',
      nextAction: 'Follow up on payment'
    },
    {
      id: 3,
      date: '2024-01-12',
      type: 'Meeting',
      notes: 'Client visited office, discussed travel plans for summer vacation',
      nextAction: 'Prepare custom packages'
    }
  ];

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (!client) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Client Not Found</h2>
            <p className="text-gray-600">The client you're looking for doesn't exist.</p>
            <button
              onClick={() => navigate('/accounts/clients')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Back to Clients
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white shadow-sm rounded-lg mb-6">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigate('/accounts/clients')}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft className="h-5 w-5 text-gray-600" />
                </button>
                <h1 className="text-2xl font-bold text-gray-900">Client Details</h1>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => navigate(`/accounts/clients/${id}/reports`)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center space-x-2"
                >
                  <TrendingUp className="h-4 w-4" />
                  <span>Reports</span>
                </button>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${client.status === 'Active'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
                  }`}>
                  {client.status}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Client Info Card */}
        <div className="bg-white shadow-sm rounded-lg mb-6">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Personal Information</h2>
              <div className="flex items-center space-x-2">
                {!editingClient ? (
                  <button
                    onClick={handleEditClient}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit Client"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                ) : (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleSaveClient}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="Save Changes"
                    >
                      <Save className="h-4 w-4" />
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Cancel"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {editingClient ? (
                <>
                  <div className="flex items-center space-x-3">
                    <User className="h-5 w-5 text-gray-400" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">Full Name</p>
                      <input
                        type="text"
                        name="name"
                        value={editForm.name}
                        onChange={handleEditFormChange}
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Phone className="h-5 w-5 text-gray-400" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">Primary Mobile</p>
                      <input
                        type="tel"
                        name="mobile"
                        value={editForm.mobile}
                        onChange={handleEditFormChange}
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Phone className="h-5 w-5 text-gray-400" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">Secondary Mobile</p>
                      <input
                        type="tel"
                        name="mobile2"
                        value={editForm.mobile2}
                        onChange={handleEditFormChange}
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">Primary Email</p>
                      <input
                        type="email"
                        name="email"
                        value={editForm.email}
                        onChange={handleEditFormChange}
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">Secondary Email</p>
                      <input
                        type="email"
                        name="email2"
                        value={editForm.email2}
                        onChange={handleEditFormChange}
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-5 w-5 text-gray-400" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">City</p>
                      <input
                        type="text"
                        name="city"
                        value={editForm.city}
                        onChange={handleEditFormChange}
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-5 w-5 text-gray-400" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">Address</p>
                      <input
                        type="text"
                        name="address"
                        value={editForm.address}
                        onChange={handleEditFormChange}
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">Date of Birth</p>
                      <input
                        type="date"
                        name="dateOfBirth"
                        value={editForm.dateOfBirth}
                        onChange={handleEditFormChange}
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">Marriage Anniversary</p>
                      <input
                        type="date"
                        name="marriageAnniversary"
                        value={editForm.marriageAnniversary}
                        onChange={handleEditFormChange}
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center space-x-3">
                    <User className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Full Name</p>
                      <p className="font-medium text-gray-900">{client.title} {client.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Phone className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Primary Mobile</p>
                      <p className="font-medium text-gray-900">{client.mobile}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Phone className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Secondary Mobile</p>
                      <p className="font-medium text-gray-900">{client.mobile2 || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Primary Email</p>
                      <p className="font-medium text-gray-900">{client.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Secondary Email</p>
                      <p className="font-medium text-gray-900">{client.email2 || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">City</p>
                      <p className="font-medium text-gray-900">{client.city}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Address</p>
                      <p className="font-medium text-gray-900">{client.address || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Date of Birth</p>
                      <p className="font-medium text-gray-900">{client.dateOfBirth || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Marriage Anniversary</p>
                      <p className="font-medium text-gray-900">{client.marriageAnniversary || 'N/A'}</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white shadow-sm rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <MessageSquare className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Total Queries</p>
                <p className="text-2xl font-semibold text-gray-900">{client.totalQueries}</p>
              </div>
            </div>
          </div>
          <div className="bg-white shadow-sm rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Total Deal Value</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {client.calculatedTotal !== undefined
                    ? `₹${client.calculatedTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                    : client.totalAmount}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white shadow-sm rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Paid Amount</p>
                <p className="text-2xl font-semibold text-gray-900">
                  ₹{(client.calculatedPaid || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white shadow-sm rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-red-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Due Amount</p>
                <p className="text-2xl font-semibold text-gray-900">
                  ₹{(client.calculatedDue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white shadow-sm rounded-lg">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {['overview', 'payments', 'queries', 'invoices', 'documents', 'vendorPayments', 'followups'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1).replace('followups', 'Follow-ups').replace('vendorPayments', 'Vendor Payments')}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <MessageSquare className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="ml-3">
                        <h4 className="text-sm font-medium text-blue-800">Last Query</h4>
                        <p className="text-sm text-blue-700">Destination: Manali, Budget: ₹25,000</p>
                        <p className="text-xs text-blue-600 mt-1">Date: {client.lastQuery}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'payments' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Payment History</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paid Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {payments.map((payment) => (
                        <tr key={payment.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {payment.date}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {payment.amount}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium text-green-600">
                            {payment.paidAmount}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium text-red-600">
                            {payment.dueAmount}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {payment.dueDate}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${payment.status === 'Paid'
                              ? 'bg-green-100 text-green-800'
                              : payment.status === 'Partial'
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-yellow-100 text-yellow-800'
                              }`}>
                              {payment.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {payment.method}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {payment.description}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'queries' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Query History</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Destination</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Budget</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Travelers</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {queries.map((query) => (
                        <tr key={query.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {query.date}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {query.destination}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${query.status === 'Confirmed'
                              ? 'bg-green-100 text-green-800'
                              : query.status === 'Pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-blue-100 text-blue-800'
                              }`}>
                              {query.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {query.budget}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {query.adults}A/{query.children}C
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'invoices' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Invoice History</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice No.</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Query ID</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {invoices.map((invoice) => (
                        <tr key={invoice.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {invoice.invoiceNumber}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {invoice.date}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {invoice.dueDate}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {invoice.amount}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${invoice.status === 'Paid'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                              }`}>
                              {invoice.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {invoice.description}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {invoice.queryId}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'documents' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Documents</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {documents.map((doc) => (
                    <div key={doc.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <FileText className="h-5 w-5 text-blue-600" />
                          <span className="font-medium text-gray-900">{doc.name}</span>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded ${doc.status === 'Verified'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                          }`}>
                          {doc.status}
                        </span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Type:</span>
                          <span className="text-gray-900">{doc.type}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Uploaded:</span>
                          <span className="text-gray-900">{doc.uploadDate}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Size:</span>
                          <span className="text-gray-900">{doc.size}</span>
                        </div>
                      </div>
                      <button className="mt-3 w-full px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
                        Download
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'vendorPayments' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Vendor Payments</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendor Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice No.</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {vendorPayments.length > 0 ? (
                        vendorPayments.map((payment) => (
                          <tr key={payment.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{payment.vendorName}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{payment.date}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{payment.amount}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{payment.category}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${payment.status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                {payment.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{payment.invoiceNumber}</td>
                            <td className="px-6 py-4 text-sm text-gray-900">{payment.description}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                            No vendor payments found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'followups' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Follow-ups</h3>
                  <button
                    onClick={() => setShowAddFollowUp(true)}
                    className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Follow-up</span>
                  </button>
                </div>
                <div className="space-y-4">
                  {followUps.length > 0 ? (
                    followUps.map((followUp) => (
                      <div key={followUp.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${followUp.type === 'Call' ? 'bg-blue-100 text-blue-800' :
                              followUp.type === 'Email' ? 'bg-purple-100 text-purple-800' :
                                followUp.type === 'Meeting' ? 'bg-green-100 text-green-800' :
                                  'bg-gray-100 text-gray-800'
                              }`}>
                              {followUp.type}
                            </span>
                            <span className="text-sm text-gray-500">
                              {followUp.date} at {followUp.time}
                            </span>
                          </div>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${followUp.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                            {followUp.status}
                          </span>
                        </div>
                        <p className="text-gray-900 text-sm mb-2">{followUp.notes}</p>
                        <div className="flex justify-between items-center text-xs text-gray-500 border-t pt-2 mt-2">
                          <span>Assigned to: {followUp.assignedTo}</span>
                          {followUp.nextAction && (
                            <span>Next Action: {followUp.nextAction}</span>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                      <p>No follow-ups found.</p>
                      <button
                        onClick={() => setShowAddFollowUp(true)}
                        className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Schedule your first follow-up
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ClientDetails;
