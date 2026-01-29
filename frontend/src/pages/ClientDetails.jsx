import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { accountsAPI, followUpAPI } from '../services/api';
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
        setClient(clientResponse.data.data);
        setEditForm({
          name: clientResponse.data.data.name,
          email: clientResponse.data.data.email,
          mobile: clientResponse.data.data.mobile,
          mobile2: clientResponse.data.data.mobile2 || '',
          email2: clientResponse.data.data.email2 || '',
          city: clientResponse.data.data.city,
          address: clientResponse.data.data.address || '',
          dateOfBirth: clientResponse.data.data.dateOfBirth || '',
          marriageAnniversary: clientResponse.data.data.marriageAnniversary || ''
        });
      } else {
        // Use mock data if API fails
        const mockClient = {
          id: id,
          name: 'Shubi Paras',
          title: 'Mr.',
          firstName: 'Shubi',
          lastName: 'Paras',
          email: 'web.gashwatechnologies7@gmail.com',
          email2: 'shubi@example.com',
          mobile: '+919805585855',
          mobile2: '+919805598988',
          city: 'Shimla',
          address: 'Igh, Shimla, Himachal Pradesh',
          dateOfBirth: '2017-06-27',
          marriageAnniversary: '2020-01-15',
          status: 'Active',
          createdBy: 'Admin',
          createdAt: '2024-01-15',
          lastQuery: '2024-01-14',
          totalQueries: 5,
          totalPayments: 3,
          totalAmount: '₹45,000',
          nextFollowUp: '2024-01-20'
        };

        setClient(mockClient);
        setEditForm({
          name: mockClient.name,
          email: mockClient.email,
          mobile: mockClient.mobile,
          mobile2: mockClient.mobile2 || '',
          email2: mockClient.email2 || '',
          city: mockClient.city,
          address: mockClient.address || '',
          dateOfBirth: mockClient.dateOfBirth || '',
          marriageAnniversary: mockClient.marriageAnniversary || ''
        });
      }

      // Mock other data for now (can be replaced with real APIs later)
      setPayments([
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
      ]);

      setQueries([
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
        }
      ]);

      // Mock invoices data
      setInvoices([
        {
          id: 1,
          invoiceNumber: 'INV-2024-001',
          date: '2024-01-10',
          dueDate: '2024-01-25',
          amount: '₹15,000',
          status: 'Paid',
          description: 'Manali Trip Package',
          queryId: 'Q001'
        },
        {
          id: 2,
          invoiceNumber: 'INV-2024-002',
          date: '2024-01-08',
          dueDate: '2024-01-23',
          amount: '₹20,000',
          status: 'Paid',
          description: 'Delhi Trip Advance',
          queryId: 'Q002'
        }
      ]);

      // Mock documents data
      setDocuments([
        {
          id: 1,
          name: 'Passport Copy',
          type: 'ID Proof',
          uploadDate: '2024-01-10',
          size: '2.5 MB',
          status: 'Verified'
        },
        {
          id: 2,
          name: 'Travel Insurance',
          type: 'Insurance',
          uploadDate: '2024-01-08',
          size: '1.8 MB',
          status: 'Verified'
        }
      ]);

      // Mock vendor payments data
      setVendorPayments([
        {
          id: 1,
          vendorName: 'Himalayan Travels',
          date: '2024-01-10',
          amount: '₹12,000',
          category: 'Transportation',
          status: 'Paid',
          invoiceNumber: 'VEN-001',
          description: 'Manali to Delhi Taxi'
        },
        {
          id: 2,
          vendorName: 'Mountain View Hotel',
          date: '2024-01-08',
          amount: '₹8,000',
          category: 'Accommodation',
          status: 'Paid',
          invoiceNumber: 'VEN-002',
          description: '2 Nights Stay'
        }
      ]);

    } catch (error) {
      console.error('Failed to fetch client details:', error);
      
      // Fallback to mock data if API fails
      const mockClient = {
        id: id,
        name: 'Shubi Paras',
        title: 'Mr.',
        firstName: 'Shubi',
        lastName: 'Paras',
        email: 'web.gashwatechnologies7@gmail.com',
        email2: 'shubi@example.com',
        mobile: '+919805585855',
        mobile2: '+919805598988',
        city: 'Shimla',
        address: 'Igh, Shimla, Himachal Pradesh',
        dateOfBirth: '2017-06-27',
        marriageAnniversary: '2020-01-15',
        status: 'Active',
        createdBy: 'Admin',
        createdAt: '2024-01-15',
        lastQuery: '2024-01-14',
        totalQueries: 5,
        totalPayments: 3,
        totalAmount: '₹45,000',
        nextFollowUp: '2024-01-20'
      };

      setClient(mockClient);
      setEditForm({
        name: mockClient.name,
        email: mockClient.email,
        mobile: mockClient.mobile,
        mobile2: mockClient.mobile2 || '',
        email2: mockClient.email2 || '',
        city: mockClient.city,
        address: mockClient.address || '',
        dateOfBirth: mockClient.dateOfBirth || '',
        marriageAnniversary: mockClient.marriageAnniversary || ''
      });

      // Mock follow-ups data
      setFollowUps([
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
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Handler functions
  const handleAddFollowUp = async () => {
    if (!followUpForm.notes.trim()) {
      alert('Please add notes for the follow-up');
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
        alert('Follow-up saved to database successfully!');
      } else {
        throw new Error(response.data.message || 'Failed to save follow-up');
      }
    } catch {
      alert('Failed to save follow-up. Saving locally...');

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
      
      alert('Follow-up saved locally!');
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
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  client.status === 'Active' 
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white shadow-sm rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Total Queries</p>
                <p className="text-2xl font-semibold text-gray-900">{client.totalQueries}</p>
              </div>
            </div>
          </div>
          <div className="bg-white shadow-sm rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Total Payments</p>
                <p className="text-2xl font-semibold text-gray-900">{client.totalPayments}</p>
              </div>
            </div>
          </div>
          <div className="bg-white shadow-sm rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Total Amount</p>
                <p className="text-2xl font-semibold text-gray-900">{client.totalAmount}</p>
              </div>
            </div>
          </div>
          <div className="bg-white shadow-sm rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Calendar className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Next Follow-up</p>
                <p className="text-lg font-semibold text-gray-900">{client.nextFollowUp}</p>
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
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab
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
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {mockPayments.map((payment) => (
                        <tr key={payment.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {payment.date}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {payment.amount}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              payment.status === 'Paid' 
                                ? 'bg-green-100 text-green-800'
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
                      {mockQueries.map((query) => (
                        <tr key={query.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {query.date}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {query.destination}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              query.status === 'Confirmed' 
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

            {activeTab === 'followups' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Follow-up History</h3>
                  <button
                    onClick={() => setShowAddFollowUp(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Follow-up</span>
                  </button>
                </div>
                
                {/* Add Follow-up Modal */}
                {showAddFollowUp && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
                      <div className="p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Follow-up</h3>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Type
                            </label>
                            <select
                              name="type"
                              value={followUpForm.type}
                              onChange={handleFollowUpFormChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="Phone Call">Phone Call</option>
                              <option value="Email">Email</option>
                              <option value="Meeting">Meeting</option>
                              <option value="WhatsApp">WhatsApp</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Date
                            </label>
                            <input
                              type="date"
                              name="date"
                              value={followUpForm.date}
                              onChange={handleFollowUpFormChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Time
                            </label>
                            <input
                              type="time"
                              name="time"
                              value={followUpForm.time}
                              onChange={handleFollowUpFormChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Notes
                            </label>
                            <textarea
                              name="notes"
                              value={followUpForm.notes}
                              onChange={handleFollowUpFormChange}
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="What was discussed..."
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Next Action
                            </label>
                            <input
                              type="text"
                              name="nextAction"
                              value={followUpForm.nextAction}
                              onChange={handleFollowUpFormChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="What to do next..."
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Next Follow-up Date
                            </label>
                            <input
                              type="date"
                              name="nextFollowUpDate"
                              value={followUpForm.nextFollowUpDate}
                              onChange={handleFollowUpFormChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end space-x-3 mt-6">
                          <button
                            onClick={() => setShowAddFollowUp(false)}
                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleAddFollowUp}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                          >
                            Add Follow-up
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  {followUps.map((followUp) => (
                    <div key={followUp.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className={`px-2 py-1 text-xs font-medium rounded ${
                              followUp.type === 'Phone Call' 
                                ? 'bg-blue-100 text-blue-800'
                                : followUp.type === 'Email'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-purple-100 text-purple-800'
                            }`}>
                              {followUp.type}
                            </span>
                            <span className="text-sm text-gray-500">{followUp.date}</span>
                            {followUp.time && (
                              <span className="text-sm text-gray-500">{followUp.time}</span>
                            )}
                          </div>
                          <p className="text-sm text-gray-900 mb-2">{followUp.notes}</p>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-medium text-gray-500">Next Action:</span>
                            <span className="text-xs font-medium text-blue-600">{followUp.nextAction}</span>
                          </div>
                          {followUp.nextFollowUpDate && (
                            <div className="flex items-center space-x-2 mt-2">
                              <span className="text-xs font-medium text-gray-500">Next Follow-up:</span>
                              <span className="text-xs font-medium text-green-600">{followUp.nextFollowUpDate}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
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
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              invoice.status === 'Paid' 
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
                        <span className={`px-2 py-1 text-xs font-medium rounded ${
                          doc.status === 'Verified' 
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
                      {vendorPayments.map((payment) => (
                        <tr key={payment.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {payment.vendorName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {payment.date}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {payment.amount}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {payment.category}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              payment.status === 'Paid' 
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {payment.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {payment.invoiceNumber}
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
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ClientDetails;
