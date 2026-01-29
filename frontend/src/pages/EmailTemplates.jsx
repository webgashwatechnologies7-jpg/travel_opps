import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Mail, Plus, Edit, Trash2, Eye, Save, X } from 'lucide-react';
import { settingsAPI } from '../services/api';

const EmailTemplates = () => {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    subject: '',
    content: '',
    description: ''
  });

  // Default templates
  const defaultTemplates = [
    {
      id: 'template-1',
      name: 'Professional Classic',
      description: 'Clean and professional design with blue theme',
      isDefault: true,
      layout: 'classic'
    },
    {
      id: 'template-2',
      name: '3D Premium Card',
      description: '3D card effect with depth and shadows - Perfect for PDF',
      isDefault: true,
      layout: '3d-premium'
    },
    {
      id: 'template-3',
      name: '3D Floating Boxes',
      description: 'Floating 3D boxes with modern depth effect',
      isDefault: true,
      layout: '3d-floating'
    },
    {
      id: 'template-4',
      name: '3D Layered Design',
      description: 'Multi-layer 3D effect with impressive depth',
      isDefault: true,
      layout: '3d-layered'
    },
    {
      id: 'template-5',
      name: 'Adventure Travel',
      description: 'Rustic outdoor adventure style with earthy tones',
      isDefault: true,
      layout: 'adventure'
    },
    {
      id: 'template-6',
      name: 'Beach Paradise',
      description: 'Serene beach theme with ocean blue colors',
      isDefault: true,
      layout: 'beach'
    },
    {
      id: 'template-7',
      name: 'Elegant Package',
      description: 'Sophisticated package pricelist format',
      isDefault: true,
      layout: 'elegant'
    },
    {
      id: 'template-8',
      name: 'Modern Elegant',
      description: 'Modern design with gradient colors',
      isDefault: true,
      layout: 'modern'
    },
    {
      id: 'template-9',
      name: 'Minimalist',
      description: 'Simple and clean minimalist design',
      isDefault: true,
      layout: 'minimalist'
    }
  ];

  useEffect(() => {
    loadTemplates();
    loadSelectedTemplate();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await settingsAPI.getByKey('email_templates');
      if (response.data && response.data.success && response.data.data?.value) {
        const savedTemplates = JSON.parse(response.data.data.value);
        setTemplates(savedTemplates.length > 0 ? savedTemplates : defaultTemplates);
      } else {
        setTemplates(defaultTemplates);
      }
    } catch (err) {
      console.error('Failed to load templates:', err);
      setTemplates(defaultTemplates);
    } finally {
      setLoading(false);
    }
  };

  const loadSelectedTemplate = async () => {
    try {
      const response = await settingsAPI.getByKey('selected_email_template');
      if (response.data && response.data.success && response.data.data?.value) {
        setSelectedTemplate(response.data.data.value);
      } else {
        setSelectedTemplate('template-1'); // Default to first template
      }
    } catch (err) {
      console.error('Failed to load selected template:', err);
      setSelectedTemplate('template-1');
    }
  };

  const saveSelectedTemplate = async (templateId) => {
    try {
      setSaving(true);
      await settingsAPI.save({
        key: 'selected_email_template',
        value: templateId,
        type: 'string',
        description: 'Selected email template for sending quotations'
      });
      setSelectedTemplate(templateId);
      alert('Template selected successfully!');
    } catch (err) {
      console.error('Failed to save selected template:', err);
      alert('Failed to save template selection');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateTemplate = async () => {
    try {
      const template = {
        id: `custom-${Date.now()}`,
        name: newTemplate.name,
        subject: newTemplate.subject,
        content: newTemplate.content,
        description: newTemplate.description,
        isDefault: false,
        isCustom: true
      };

      const updatedTemplates = [...templates, template];
      setTemplates(updatedTemplates);
      
      // Try to save to backend, but don't fail if it doesn't work
      try {
        await settingsAPI.save({
          key: 'email_templates',
          value: JSON.stringify(updatedTemplates),
          type: 'json',
          description: 'Email templates for quotations and campaigns'
        });
      } catch {
        // Template saved locally only
      }

      setShowCreateModal(false);
      setNewTemplate({ name: '', subject: '', content: '', description: '' });
      alert('Template created successfully!');
    } catch {
      alert('Failed to create template');
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      try {
        const updatedTemplates = templates.filter(t => t.id !== templateId);
        setTemplates(updatedTemplates);
        
        // Try to save to backend, but don't fail if it doesn't work
        try {
          await settingsAPI.save({
            key: 'email_templates',
            value: JSON.stringify(updatedTemplates),
            type: 'json',
            description: 'Email templates for quotations and campaigns'
          });
        } catch {
          // Deleted locally only
        }

        if (selectedTemplate === templateId) {
          setSelectedTemplate(null);
        }
        
        alert('Template deleted successfully!');
      } catch {
        alert('Failed to delete template');
      }
    }
  };

  const [previewTemplateData, setPreviewTemplateData] = useState(null);

  // Generate 3D Premium Card Template
  const generate3DPremiumTemplate = () => {
    return `
      <div style="font-family: 'Arial', sans-serif; max-width: 800px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px;">
        <!-- Header with 3D Effect -->
        <div style="background: white; padding: 40px; border-radius: 20px; margin-bottom: 30px; box-shadow: 0 20px 60px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.1); transform: perspective(1000px) rotateX(2deg);">
          <h1 style="margin: 0; font-size: 48px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; text-align: center; font-weight: bold;">TravelOps</h1>
          <p style="text-align: center; color: #666; margin-top: 10px;">Delhi, India | Email: info@travelops.com | Mobile: +91-9871023004</p>
        </div>
        
        <!-- Quote Details Card with 3D -->
        <div style="background: white; padding: 30px; border-radius: 20px; margin-bottom: 30px; box-shadow: 0 15px 35px rgba(0,0,0,0.2), inset 0 -5px 15px rgba(0,0,0,0.1); transform: perspective(1000px) rotateY(-1deg);">
          <h2 style="margin-top: 0; font-size: 32px; color: #667eea; text-align: center;">Travel Quotation</h2>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 20px;">
            <div style="padding: 15px; background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); border-radius: 10px; box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);"><strong>Query ID:</strong> Q-0005</div>
            <div style="padding: 15px; background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); border-radius: 10px; box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);"><strong>Destination:</strong> Shimla, Kufri</div>
            <div style="padding: 15px; background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); border-radius: 10px; box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);"><strong>Duration:</strong> 3 Nights & 4 Days</div>
            <div style="padding: 15px; background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); border-radius: 10px; box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);"><strong>Adults:</strong> 2 | <strong>Children:</strong> 1</div>
          </div>
        </div>
        
        <!-- Option 1 with 3D Card Effect -->
        <div style="background: white; padding: 35px; border-radius: 25px; margin-bottom: 30px; box-shadow: 0 25px 50px rgba(0,0,0,0.25), 0 0 0 1px rgba(102,126,234,0.1); transform: perspective(1000px) rotateX(1deg) translateY(-5px); position: relative;">
          <div style="position: absolute; top: -10px; left: 50%; transform: translateX(-50%); width: 60px; height: 60px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 50%; box-shadow: 0 10px 20px rgba(102,126,234,0.4); display: flex; align-items: center; justify-content: center; color: white; font-size: 24px; font-weight: bold;">1</div>
          <div style="margin-top: 30px;">
            <h2 style="margin: 0 0 25px 0; font-size: 28px; color: #667eea; text-align: center;">Option 1</h2>
            
            <div style="background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); padding: 25px; border-radius: 15px; margin-bottom: 20px; box-shadow: inset 0 2px 10px rgba(0,0,0,0.1), 0 5px 15px rgba(0,0,0,0.1);">
              <h4 style="margin: 0 0 15px 0; color: #333; font-size: 20px;">Day 1: The Green Park Shimla</h4>
              <p style="margin: 8px 0; color: #555;"><strong>Category:</strong> 5 Star</p>
              <p style="margin: 8px 0; color: #555;"><strong>Room:</strong> Superior Villa</p>
              <p style="margin: 8px 0; color: #555;"><strong>Meal Plan:</strong> Room Only</p>
              <p style="margin: 8px 0; color: #555;"><strong>Price:</strong> ₹24,452</p>
            </div>
            
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 25px; border-radius: 15px; text-align: center; font-size: 28px; font-weight: bold; box-shadow: 0 10px 30px rgba(102,126,234,0.4), inset 0 -5px 15px rgba(0,0,0,0.2);">
              Total Package Price: ₹48,904
            </div>
          </div>
        </div>
        
        <!-- Option 2 with 3D Card Effect -->
        <div style="background: white; padding: 35px; border-radius: 25px; margin-bottom: 30px; box-shadow: 0 25px 50px rgba(0,0,0,0.25), 0 0 0 1px rgba(102,126,234,0.1); transform: perspective(1000px) rotateX(1deg) translateY(-5px); position: relative;">
          <div style="position: absolute; top: -10px; left: 50%; transform: translateX(-50%); width: 60px; height: 60px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 50%; box-shadow: 0 10px 20px rgba(102,126,234,0.4); display: flex; align-items: center; justify-content: center; color: white; font-size: 24px; font-weight: bold;">2</div>
          <div style="margin-top: 30px;">
            <h2 style="margin: 0 0 25px 0; font-size: 28px; color: #667eea; text-align: center;">Option 2</h2>
            
            <div style="background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); padding: 25px; border-radius: 15px; margin-bottom: 20px; box-shadow: inset 0 2px 10px rgba(0,0,0,0.1), 0 5px 15px rgba(0,0,0,0.1);">
              <h4 style="margin: 0 0 15px 0; color: #333; font-size: 20px;">Day 1: Luxury Hotel Shimla</h4>
              <p style="margin: 8px 0; color: #555;"><strong>Category:</strong> 4 Star</p>
              <p style="margin: 8px 0; color: #555;"><strong>Price:</strong> ₹18,500</p>
            </div>
            
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 25px; border-radius: 15px; text-align: center; font-size: 28px; font-weight: bold; box-shadow: 0 10px 30px rgba(102,126,234,0.4), inset 0 -5px 15px rgba(0,0,0,0.2);">
              Total Package Price: ₹18,500
            </div>
          </div>
        </div>
        
        <!-- Footer with 3D Effect -->
        <div style="background: rgba(255,255,255,0.95); padding: 30px; border-radius: 20px; text-align: center; box-shadow: 0 15px 35px rgba(0,0,0,0.2); transform: perspective(1000px) rotateX(-2deg);">
          <p style="margin: 5px 0; font-size: 18px; font-weight: bold; color: #667eea;">Thank you for choosing TravelOps!</p>
          <p style="margin: 10px 0 5px 0; color: #666;">📞 +91-9871023004 | 🌐 www.travelops.com</p>
        </div>
      </div>
    `;
  };

  // Generate 3D Floating Boxes Template
  const generate3DFloatingTemplate = () => {
    return `
      <div style="font-family: 'Arial', sans-serif; max-width: 800px; margin: 0 auto; background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); padding: 40px 20px;">
        <!-- Header Floating Card -->
        <div style="background: white; padding: 40px; border-radius: 15px; margin-bottom: 40px; box-shadow: 0 30px 60px rgba(0,0,0,0.4), 0 0 0 3px rgba(255,255,255,0.2); transform: translateY(-10px) rotateZ(-1deg);">
          <h1 style="margin: 0; font-size: 48px; background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; text-align: center; font-weight: bold;">TravelOps</h1>
          <p style="text-align: center; color: #666; margin-top: 10px;">Delhi, India | Email: info@travelops.com | Mobile: +91-9871023004</p>
        </div>
        
        <!-- Quote Details Floating -->
        <div style="background: white; padding: 30px; border-radius: 15px; margin-bottom: 40px; box-shadow: 0 20px 50px rgba(0,0,0,0.3), 0 0 0 2px rgba(255,255,255,0.1); transform: translateY(5px) rotateZ(1deg);">
          <h2 style="margin-top: 0; font-size: 32px; color: #1e3c72; text-align: center;">Travel Quotation</h2>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 20px;">
            <div style="padding: 15px; background: #f0f4ff; border-radius: 10px; border-left: 4px solid #2a5298; box-shadow: 0 5px 15px rgba(0,0,0,0.1);"><strong>Query ID:</strong> Q-0005</div>
            <div style="padding: 15px; background: #f0f4ff; border-radius: 10px; border-left: 4px solid #2a5298; box-shadow: 0 5px 15px rgba(0,0,0,0.1);"><strong>Destination:</strong> Shimla, Kufri</div>
            <div style="padding: 15px; background: #f0f4ff; border-radius: 10px; border-left: 4px solid #2a5298; box-shadow: 0 5px 15px rgba(0,0,0,0.1);"><strong>Duration:</strong> 3 Nights & 4 Days</div>
            <div style="padding: 15px; background: #f0f4ff; border-radius: 10px; border-left: 4px solid #2a5298; box-shadow: 0 5px 15px rgba(0,0,0,0.1);"><strong>Adults:</strong> 2 | <strong>Children:</strong> 1</div>
          </div>
        </div>
        
        <!-- Option 1 Floating Box -->
        <div style="background: white; padding: 35px; border-radius: 20px; margin-bottom: 40px; box-shadow: 0 35px 70px rgba(0,0,0,0.35), 0 0 0 2px rgba(42,82,152,0.2); transform: translateY(-15px) rotateZ(-2deg); position: relative;">
          <div style="position: absolute; top: -20px; right: 30px; width: 80px; height: 80px; background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); border-radius: 15px; box-shadow: 0 15px 30px rgba(30,60,114,0.5); transform: rotateZ(15deg); display: flex; align-items: center; justify-content: center; color: white; font-size: 32px; font-weight: bold;">1</div>
          <div style="margin-top: 20px;">
            <h2 style="margin: 0 0 25px 0; font-size: 28px; color: #1e3c72; text-align: center;">Option 1</h2>
            
            <div style="background: linear-gradient(135deg, #e8f0ff 0%, #d0e0ff 100%); padding: 25px; border-radius: 15px; margin-bottom: 20px; box-shadow: 0 10px 25px rgba(0,0,0,0.15), inset 0 2px 5px rgba(255,255,255,0.5);">
              <h4 style="margin: 0 0 15px 0; color: #1e3c72; font-size: 20px;">Day 1: The Green Park Shimla</h4>
              <p style="margin: 8px 0; color: #333;"><strong>Category:</strong> 5 Star</p>
              <p style="margin: 8px 0; color: #333;"><strong>Room:</strong> Superior Villa</p>
              <p style="margin: 8px 0; color: #333;"><strong>Meal Plan:</strong> Room Only</p>
              <p style="margin: 8px 0; color: #333;"><strong>Price:</strong> ₹24,452</p>
            </div>
            
            <div style="background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); color: white; padding: 25px; border-radius: 15px; text-align: center; font-size: 28px; font-weight: bold; box-shadow: 0 15px 35px rgba(30,60,114,0.5), inset 0 -5px 15px rgba(0,0,0,0.2);">
              Total Package Price: ₹48,904
            </div>
          </div>
        </div>
        
        <!-- Option 2 Floating Box -->
        <div style="background: white; padding: 35px; border-radius: 20px; margin-bottom: 40px; box-shadow: 0 35px 70px rgba(0,0,0,0.35), 0 0 0 2px rgba(42,82,152,0.2); transform: translateY(-15px) rotateZ(2deg); position: relative;">
          <div style="position: absolute; top: -20px; left: 30px; width: 80px; height: 80px; background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); border-radius: 15px; box-shadow: 0 15px 30px rgba(30,60,114,0.5); transform: rotateZ(-15deg); display: flex; align-items: center; justify-content: center; color: white; font-size: 32px; font-weight: bold;">2</div>
          <div style="margin-top: 20px;">
            <h2 style="margin: 0 0 25px 0; font-size: 28px; color: #1e3c72; text-align: center;">Option 2</h2>
            
            <div style="background: linear-gradient(135deg, #e8f0ff 0%, #d0e0ff 100%); padding: 25px; border-radius: 15px; margin-bottom: 20px; box-shadow: 0 10px 25px rgba(0,0,0,0.15), inset 0 2px 5px rgba(255,255,255,0.5);">
              <h4 style="margin: 0 0 15px 0; color: #1e3c72; font-size: 20px;">Day 1: Luxury Hotel Shimla</h4>
              <p style="margin: 8px 0; color: #333;"><strong>Category:</strong> 4 Star</p>
              <p style="margin: 8px 0; color: #333;"><strong>Price:</strong> ₹18,500</p>
            </div>
            
            <div style="background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); color: white; padding: 25px; border-radius: 15px; text-align: center; font-size: 28px; font-weight: bold; box-shadow: 0 15px 35px rgba(30,60,114,0.5), inset 0 -5px 15px rgba(0,0,0,0.2);">
              Total Package Price: ₹18,500
            </div>
          </div>
        </div>
        
        <!-- Footer Floating -->
        <div style="background: rgba(255,255,255,0.95); padding: 30px; border-radius: 15px; text-align: center; box-shadow: 0 20px 50px rgba(0,0,0,0.3); transform: translateY(10px) rotateZ(-1deg);">
          <p style="margin: 5px 0; font-size: 18px; font-weight: bold; color: #1e3c72;">Thank you for choosing TravelOps!</p>
          <p style="margin: 10px 0 5px 0; color: #666;">📞 +91-9871023004 | 🌐 www.travelops.com</p>
        </div>
      </div>
    `;
  };

  // Generate 3D Layered Design Template
  const generate3DLayeredTemplate = () => {
    return `
      <div style="font-family: 'Arial', sans-serif; max-width: 800px; margin: 0 auto; background: linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%); padding: 50px 20px;">
        <!-- Layered Header -->
        <div style="position: relative; margin-bottom: 50px;">
          <div style="background: rgba(255,255,255,0.1); padding: 50px; border-radius: 20px; box-shadow: 0 20px 60px rgba(0,0,0,0.5); transform: translateZ(20px); position: relative; z-index: 3;">
            <div style="background: rgba(255,255,255,0.15); padding: 40px; border-radius: 15px; box-shadow: 0 15px 40px rgba(0,0,0,0.4); transform: translateZ(15px); position: relative; z-index: 2;">
              <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); transform: translateZ(10px); position: relative; z-index: 1;">
                <h1 style="margin: 0; font-size: 48px; background: linear-gradient(135deg, #0f2027 0%, #2c5364 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; text-align: center; font-weight: bold;">TravelOps</h1>
                <p style="text-align: center; color: #666; margin-top: 10px;">Delhi, India | Email: info@travelops.com | Mobile: +91-9871023004</p>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Layered Quote Details -->
        <div style="position: relative; margin-bottom: 50px;">
          <div style="background: rgba(255,255,255,0.95); padding: 30px; border-radius: 20px; box-shadow: 0 25px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.2); transform: translateZ(25px); position: relative; z-index: 2;">
            <h2 style="margin-top: 0; font-size: 32px; color: #0f2027; text-align: center;">Travel Quotation</h2>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 20px;">
              <div style="padding: 15px; background: linear-gradient(135deg, #e0f2f1 0%, #b2dfdb 100%); border-radius: 10px; box-shadow: 0 5px 15px rgba(0,0,0,0.1), inset 0 2px 5px rgba(255,255,255,0.5);"><strong>Query ID:</strong> Q-0005</div>
              <div style="padding: 15px; background: linear-gradient(135deg, #e0f2f1 0%, #b2dfdb 100%); border-radius: 10px; box-shadow: 0 5px 15px rgba(0,0,0,0.1), inset 0 2px 5px rgba(255,255,255,0.5);"><strong>Destination:</strong> Shimla, Kufri</div>
              <div style="padding: 15px; background: linear-gradient(135deg, #e0f2f1 0%, #b2dfdb 100%); border-radius: 10px; box-shadow: 0 5px 15px rgba(0,0,0,0.1), inset 0 2px 5px rgba(255,255,255,0.5);"><strong>Duration:</strong> 3 Nights & 4 Days</div>
              <div style="padding: 15px; background: linear-gradient(135deg, #e0f2f1 0%, #b2dfdb 100%); border-radius: 10px; box-shadow: 0 5px 15px rgba(0,0,0,0.1), inset 0 2px 5px rgba(255,255,255,0.5);"><strong>Adults:</strong> 2 | <strong>Children:</strong> 1</div>
            </div>
          </div>
        </div>
        
        <!-- Option 1 Layered -->
        <div style="position: relative; margin-bottom: 50px;">
          <div style="background: rgba(255,255,255,0.1); padding: 35px; border-radius: 25px; box-shadow: 0 30px 70px rgba(0,0,0,0.5); transform: translateZ(30px); position: relative; z-index: 3;">
            <div style="background: rgba(255,255,255,0.2); padding: 30px; border-radius: 20px; box-shadow: 0 20px 50px rgba(0,0,0,0.4); transform: translateZ(20px); position: relative; z-index: 2;">
              <div style="background: white; padding: 25px; border-radius: 15px; box-shadow: 0 15px 40px rgba(0,0,0,0.3); transform: translateZ(10px); position: relative; z-index: 1;">
                <div style="position: absolute; top: -25px; left: 50%; transform: translateX(-50%); width: 70px; height: 70px; background: linear-gradient(135deg, #0f2027 0%, #2c5364 100%); border-radius: 50%; box-shadow: 0 15px 35px rgba(15,32,39,0.6); display: flex; align-items: center; justify-content: center; color: white; font-size: 28px; font-weight: bold; z-index: 4;">1</div>
                <div style="margin-top: 30px;">
                  <h2 style="margin: 0 0 25px 0; font-size: 28px; color: #0f2027; text-align: center;">Option 1</h2>
                  
                  <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); padding: 25px; border-radius: 15px; margin-bottom: 20px; box-shadow: 0 10px 25px rgba(0,0,0,0.15), inset 0 2px 5px rgba(255,255,255,0.5);">
                    <h4 style="margin: 0 0 15px 0; color: #0f2027; font-size: 20px;">Day 1: The Green Park Shimla</h4>
                    <p style="margin: 8px 0; color: #333;"><strong>Category:</strong> 5 Star</p>
                    <p style="margin: 8px 0; color: #333;"><strong>Room:</strong> Superior Villa</p>
                    <p style="margin: 8px 0; color: #333;"><strong>Meal Plan:</strong> Room Only</p>
                    <p style="margin: 8px 0; color: #333;"><strong>Price:</strong> ₹24,452</p>
                  </div>
                  
                  <div style="background: linear-gradient(135deg, #0f2027 0%, #2c5364 100%); color: white; padding: 25px; border-radius: 15px; text-align: center; font-size: 28px; font-weight: bold; box-shadow: 0 15px 35px rgba(15,32,39,0.6), inset 0 -5px 15px rgba(0,0,0,0.2);">
                    Total Package Price: ₹48,904
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Option 2 Layered -->
        <div style="position: relative; margin-bottom: 50px;">
          <div style="background: rgba(255,255,255,0.1); padding: 35px; border-radius: 25px; box-shadow: 0 30px 70px rgba(0,0,0,0.5); transform: translateZ(30px); position: relative; z-index: 3;">
            <div style="background: rgba(255,255,255,0.2); padding: 30px; border-radius: 20px; box-shadow: 0 20px 50px rgba(0,0,0,0.4); transform: translateZ(20px); position: relative; z-index: 2;">
              <div style="background: white; padding: 25px; border-radius: 15px; box-shadow: 0 15px 40px rgba(0,0,0,0.3); transform: translateZ(10px); position: relative; z-index: 1;">
                <div style="position: absolute; top: -25px; left: 50%; transform: translateX(-50%); width: 70px; height: 70px; background: linear-gradient(135deg, #0f2027 0%, #2c5364 100%); border-radius: 50%; box-shadow: 0 15px 35px rgba(15,32,39,0.6); display: flex; align-items: center; justify-content: center; color: white; font-size: 28px; font-weight: bold; z-index: 4;">2</div>
                <div style="margin-top: 30px;">
                  <h2 style="margin: 0 0 25px 0; font-size: 28px; color: #0f2027; text-align: center;">Option 2</h2>
                  
                  <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); padding: 25px; border-radius: 15px; margin-bottom: 20px; box-shadow: 0 10px 25px rgba(0,0,0,0.15), inset 0 2px 5px rgba(255,255,255,0.5);">
                    <h4 style="margin: 0 0 15px 0; color: #0f2027; font-size: 20px;">Day 1: Luxury Hotel Shimla</h4>
                    <p style="margin: 8px 0; color: #333;"><strong>Category:</strong> 4 Star</p>
                    <p style="margin: 8px 0; color: #333;"><strong>Price:</strong> ₹18,500</p>
                  </div>
                  
                  <div style="background: linear-gradient(135deg, #0f2027 0%, #2c5364 100%); color: white; padding: 25px; border-radius: 15px; text-align: center; font-size: 28px; font-weight: bold; box-shadow: 0 15px 35px rgba(15,32,39,0.6), inset 0 -5px 15px rgba(0,0,0,0.2);">
                    Total Package Price: ₹18,500
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Layered Footer -->
        <div style="position: relative;">
          <div style="background: rgba(255,255,255,0.95); padding: 30px; border-radius: 20px; text-align: center; box-shadow: 0 25px 60px rgba(0,0,0,0.4); transform: translateZ(20px); position: relative; z-index: 2;">
            <p style="margin: 5px 0; font-size: 18px; font-weight: bold; color: #0f2027;">Thank you for choosing TravelOps!</p>
            <p style="margin: 10px 0 5px 0; color: #666;">📞 +91-9871023004 | 🌐 www.travelops.com</p>
          </div>
        </div>
      </div>
    `;
  };

  // Generate Adventure Travel Template (Rustic style)
  const generateAdventureTemplate = () => {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; background: #d1fae5;">
        <!-- Header Banner -->
        <div style="background: #65a30d; padding: 40px 30px; text-align: center; position: relative; overflow: hidden;">
          <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; opacity: 0.1; background-image: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMCAwIEwxMDAgMTAwIiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iMiIvPjwvc3ZnPg==');"></div>
          <h1 style="margin: 0; font-size: 48px; font-weight: bold; color: white; text-transform: uppercase; letter-spacing: 3px;">EXPLORE</h1>
          <p style="margin: 10px 0 0 0; font-size: 28px; color: white; font-style: italic;">The World</p>
          <p style="margin: 20px 0 0 0; font-size: 16px; color: white; text-transform: uppercase; letter-spacing: 2px;">ORGANIZE YOUR TRIP WITH US</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 30px; background: #d1fae5;">
          <!-- Quote Details -->
          <div style="background: white; padding: 25px; border-radius: 8px; margin-bottom: 25px; border-left: 5px solid #65a30d;">
            <h2 style="margin-top: 0; color: #365314; font-size: 24px;">Travel Quotation</h2>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 15px;">
              <div><strong style="color: #365314;">Query ID:</strong> Q-0005</div>
              <div><strong style="color: #365314;">Destination:</strong> Shimla, Kufri</div>
              <div><strong style="color: #365314;">Duration:</strong> 3 Nights & 4 Days</div>
              <div><strong style="color: #365314;">Adults:</strong> 2 | <strong>Children:</strong> 1</div>
            </div>
          </div>
          
          <!-- Option 1 -->
          <div style="background: white; padding: 25px; border-radius: 8px; margin-bottom: 25px; border: 2px solid #84cc16;">
            <div style="background: #65a30d; color: white; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="margin: 0; font-size: 24px;">Option 1</h2>
            </div>
            
            <div style="margin: 20px 0;">
              <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px;">
                <div style="width: 40px; height: 40px; background: #84cc16; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">🏔️</div>
                <h3 style="margin: 0; color: #365314; font-size: 20px;">Hotels Included</h3>
              </div>
              
              <div style="background: #f7fee7; padding: 20px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #84cc16;">
                <h4 style="margin: 0 0 10px 0; color: #365314; font-size: 18px;">Day 1: The Green Park Shimla</h4>
                <p style="margin: 5px 0; color: #365314;"><strong>Category:</strong> 5 Star</p>
                <p style="margin: 5px 0; color: #365314;"><strong>Room:</strong> Superior Villa</p>
                <p style="margin: 5px 0; color: #365314;"><strong>Meal Plan:</strong> Room Only</p>
                <p style="margin: 5px 0; color: #365314;"><strong>Price:</strong> ₹24,452</p>
              </div>
              
              <div style="background: #65a30d; color: white; padding: 20px; text-align: center; border-radius: 8px; font-size: 24px; font-weight: bold;">
                Total Package Price: ₹48,904
              </div>
            </div>
          </div>
          
          <!-- Option 2 -->
          <div style="background: white; padding: 25px; border-radius: 8px; margin-bottom: 25px; border: 2px solid #84cc16;">
            <div style="background: #65a30d; color: white; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="margin: 0; font-size: 24px;">Option 2</h2>
            </div>
            
            <div style="background: #f7fee7; padding: 20px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #84cc16;">
              <h4 style="margin: 0 0 10px 0; color: #365314; font-size: 18px;">Day 1: Luxury Hotel Shimla</h4>
              <p style="margin: 5px 0; color: #365314;"><strong>Category:</strong> 4 Star</p>
              <p style="margin: 5px 0; color: #365314;"><strong>Room:</strong> Deluxe Room</p>
              <p style="margin: 5px 0; color: #365314;"><strong>Price:</strong> ₹18,500</p>
            </div>
            
            <div style="background: #65a30d; color: white; padding: 20px; text-align: center; border-radius: 8px; font-size: 24px; font-weight: bold;">
              Total Package Price: ₹18,500
            </div>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background: #365314; color: #fef3c7; padding: 25px; text-align: center;">
          <p style="margin: 5px 0; font-size: 18px; font-weight: bold;">BOOK NOW</p>
          <p style="margin: 10px 0 5px 0;">📍 123 Anywhere St., Any City</p>
          <p style="margin: 5px 0;">📞 +91-9871023004</p>
          <p style="margin: 5px 0;">🌐 www.travelops.com</p>
        </div>
      </div>
    `;
  };

  // Generate Beach Paradise Template
  const generateBeachTemplate = () => {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; background: white;">
        <!-- Header with Ocean Background -->
        <div style="background: linear-gradient(180deg, #0ea5e9 0%, #06b6d4 50%, #22d3ee 100%); padding: 50px 30px; text-align: center; position: relative; overflow: hidden;">
          <div style="position: absolute; bottom: 0; left: 0; right: 0; height: 50px; background: #fef3c7; border-radius: 50% 50% 0 0 / 100% 100% 0 0;"></div>
          <div style="position: relative; z-index: 1;">
            <h1 style="margin: 0; font-size: 42px; color: white; font-weight: bold;">Explore The World</h1>
            <p style="margin: 10px 0 0 0; font-size: 18px; color: white; text-transform: uppercase; letter-spacing: 2px;">WITH US</p>
          </div>
        </div>
        
        <!-- Content -->
        <div style="padding: 30px; background: #fef3c7;">
          <!-- Quote Details -->
          <div style="background: white; padding: 25px; border-radius: 12px; margin-bottom: 25px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="margin-top: 0; color: #0891b2; font-size: 28px;">Travel Quotation</h2>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 15px;">
              <div><strong style="color: #164e63;">Query ID:</strong> Q-0005</div>
              <div><strong style="color: #164e63;">Destination:</strong> Shimla, Kufri</div>
              <div><strong style="color: #164e63;">Duration:</strong> 3 Nights & 4 Days</div>
              <div><strong style="color: #164e63;">Adults:</strong> 2 | <strong>Children:</strong> 1</div>
            </div>
          </div>
          
          <!-- Option 1 -->
          <div style="background: white; padding: 25px; border-radius: 12px; margin-bottom: 25px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <div style="background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); color: white; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
              <h2 style="margin: 0; font-size: 28px;">Option 1</h2>
            </div>
            
            <h3 style="color: #0891b2; margin-top: 0; font-size: 22px;">🏨 Hotels Included</h3>
            
            <div style="background: #ecfeff; padding: 20px; border-radius: 10px; margin-bottom: 15px; border: 2px solid #06b6d4;">
              <div style="display: flex; gap: 15px;">
                <div style="width: 120px; height: 120px; background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); border-radius: 50%; flex-shrink: 0; display: flex; align-items: center; justify-content: center; color: white; font-size: 40px;">🏨</div>
                <div style="flex: 1;">
                  <h4 style="margin: 0 0 10px 0; color: #164e63; font-size: 20px;">Day 1: The Green Park Shimla</h4>
                  <p style="margin: 5px 0; color: #164e63;"><strong>Category:</strong> 5 Star</p>
                  <p style="margin: 5px 0; color: #164e63;"><strong>Room:</strong> Superior Villa</p>
                  <p style="margin: 5px 0; color: #164e63;"><strong>Meal Plan:</strong> Room Only</p>
                  <p style="margin: 5px 0; color: #164e63;"><strong>Price:</strong> ₹24,452</p>
                </div>
              </div>
            </div>
            
            <div style="background: #0891b2; color: white; padding: 25px; text-align: center; border-radius: 10px; font-size: 28px; font-weight: bold;">
              Total Package Price: ₹48,904
            </div>
          </div>
          
          <!-- Option 2 -->
          <div style="background: white; padding: 25px; border-radius: 12px; margin-bottom: 25px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <div style="background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); color: white; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
              <h2 style="margin: 0; font-size: 28px;">Option 2</h2>
            </div>
            
            <div style="background: #ecfeff; padding: 20px; border-radius: 10px; margin-bottom: 15px; border: 2px solid #06b6d4;">
              <h4 style="margin: 0 0 10px 0; color: #164e63; font-size: 20px;">Day 1: Luxury Hotel Shimla</h4>
              <p style="margin: 5px 0; color: #164e63;"><strong>Category:</strong> 4 Star</p>
              <p style="margin: 5px 0; color: #164e63;"><strong>Price:</strong> ₹18,500</p>
            </div>
            
            <div style="background: #0891b2; color: white; padding: 25px; text-align: center; border-radius: 10px; font-size: 28px; font-weight: bold;">
              Total Package Price: ₹18,500
            </div>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background: #164e63; color: white; padding: 25px; text-align: center;">
          <p style="margin: 5px 0; font-size: 18px; font-weight: bold;">Thank you for choosing TravelOps!</p>
          <p style="margin: 10px 0 5px 0;">📞 +91-9871023004 | 🌐 www.travelops.com</p>
        </div>
      </div>
    `;
  };

  // Generate Elegant Package Template
  const generateElegantTemplate = () => {
    return `
      <div style="font-family: 'Georgia', serif; max-width: 800px; margin: 0 auto; background: white;">
        <!-- Header -->
        <div style="background: #3f6212; color: #fef3c7; padding: 40px 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 48px; font-style: italic; font-weight: normal;">Travel</h1>
          <p style="margin: 5px 0 0 0; font-size: 24px; letter-spacing: 3px;">Package Pricelist</p>
          <p style="margin: 20px 0 0 0; font-size: 14px; max-width: 600px; margin-left: auto; margin-right: auto;">
            Create your dream travel experience with our carefully curated packages, designed to make your journey truly unforgettable.
          </p>
        </div>
        
        <!-- Content -->
        <div style="padding: 30px; background: #f7fee7;">
          <!-- Quote Details -->
          <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 25px; border: 1px solid #84cc16;">
            <h2 style="margin-top: 0; color: #365314; font-size: 24px;">Quote Details</h2>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
              <div><strong style="color: #3f6212;">Query ID:</strong> Q-0005</div>
              <div><strong style="color: #3f6212;">Destination:</strong> Shimla, Kufri</div>
              <div><strong style="color: #3f6212;">Duration:</strong> 3 Nights & 4 Days</div>
              <div><strong style="color: #3f6212;">Adults:</strong> 2 | <strong>Children:</strong> 1</div>
            </div>
          </div>
          
          <!-- Option 1 -->
          <div style="background: #65a30d; padding: 25px; border-radius: 10px; margin-bottom: 25px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
              <h2 style="margin: 0; color: #fef3c7; font-size: 28px; font-weight: normal;">Option 1</h2>
              <div style="color: #fef3c7; font-size: 32px; font-weight: bold; text-decoration: underline;">₹48,904</div>
            </div>
            
            <div style="background: #f7fee7; padding: 20px; border-radius: 8px; margin-bottom: 15px;">
              <div style="display: flex; gap: 15px; margin-bottom: 15px;">
                <div style="width: 100px; height: 100px; background: #84cc16; border-radius: 50%; flex-shrink: 0; display: flex; align-items: center; justify-content: center; color: white; font-size: 40px;">🏨</div>
                <div style="flex: 1;">
                  <h4 style="margin: 0 0 10px 0; color: #365314; font-size: 20px;">Day 1: The Green Park Shimla</h4>
                  <ul style="margin: 0; padding-left: 20px; color: #365314;">
                    <li>5 Star Category</li>
                    <li>Superior Villa Room</li>
                    <li>Room Only Meal Plan</li>
                    <li>Check-in: 2026-01-06 2:00 PM</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div style="background: #f7fee7; padding: 20px; border-radius: 8px;">
              <div style="display: flex; gap: 15px;">
                <div style="width: 100px; height: 100px; background: #84cc16; border-radius: 50%; flex-shrink: 0; display: flex; align-items: center; justify-content: center; color: white; font-size: 40px;">🏨</div>
                <div style="flex: 1;">
                  <h4 style="margin: 0 0 10px 0; color: #365314; font-size: 20px;">Day 2: The Green Park Shimla</h4>
                  <ul style="margin: 0; padding-left: 20px; color: #365314;">
                    <li>5 Star Category</li>
                    <li>Standard Room</li>
                    <li>Room Only Meal Plan</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Option 2 -->
          <div style="background: #65a30d; padding: 25px; border-radius: 10px; margin-bottom: 25px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
              <h2 style="margin: 0; color: #fef3c7; font-size: 28px; font-weight: normal;">Option 2</h2>
              <div style="color: #fef3c7; font-size: 32px; font-weight: bold; text-decoration: underline;">₹18,500</div>
            </div>
            
            <div style="background: #f7fee7; padding: 20px; border-radius: 8px;">
              <h4 style="margin: 0 0 10px 0; color: #365314; font-size: 20px;">Day 1: Luxury Hotel Shimla</h4>
              <ul style="margin: 0; padding-left: 20px; color: #365314;">
                <li>4 Star Category</li>
                <li>Deluxe Room</li>
                <li>Breakfast Included</li>
              </ul>
            </div>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background: #365314; color: #fef3c7; padding: 25px; text-align: center;">
          <p style="margin: 5px 0;">📍 123 Anywhere St., Any City, ST 12345</p>
          <p style="margin: 5px 0;">📞 +91-9871023004 | 🌐 www.travelops.com</p>
        </div>
      </div>
    `;
  };

  // Generate preview HTML based on template
  const generatePreviewHTML = (template) => {
    const templateStyles = {
      'template-1': {
        headerBg: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
        optionBorder: '#2563eb',
        optionHeaderBg: '#2563eb',
        hotelCardBg: '#f0f9ff',
        priceBoxBg: '#dc2626',
        footerBg: '#1f2937',
        type: 'standard'
      },
      'template-5': {
        headerBg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        optionBorder: '#667eea',
        optionHeaderBg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        hotelCardBg: '#f3f4f6',
        priceBoxBg: '#8b5cf6',
        footerBg: '#4b5563',
        type: 'modern'
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
        footerColor: '#6b7280',
        type: 'minimalist'
      }
    };

    const styles = templateStyles[template.id] || templateStyles['template-1'];
    
    // Special templates with unique layouts
    if (template.id === 'template-2') {
      return generate3DPremiumTemplate();
    } else if (template.id === 'template-3') {
      return generate3DFloatingTemplate();
    } else if (template.id === 'template-4') {
      return generate3DLayeredTemplate();
    } else if (template.id === 'template-5') {
      return generateAdventureTemplate();
    } else if (template.id === 'template-6') {
      return generateBeachTemplate();
    } else if (template.id === 'template-7') {
      return generateElegantTemplate();
    }

    return `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; background: white;">
        <!-- Header -->
        <div style="background: ${styles.headerBg}; color: ${styles.headerColor || 'white'}; padding: 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 32px;">TravelOps</h1>
          <p style="margin: 10px 0 0 0;">Delhi, India | Email: info@travelops.com | Mobile: +91-9871023004</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 30px;">
          <h2 style="color: ${styles.optionBorder}; font-size: 28px; margin-top: 0;">Travel Quotation</h2>
          
          <!-- Sample Image -->
          <div style="width: 100%; height: 200px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px; margin: 20px 0; display: flex; align-items: center; justify-content: center; color: white; font-size: 18px;">
            Itinerary Image Preview
          </div>
          
          <!-- Quote Details -->
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Quote Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px; font-weight: bold; color: #4b5563;">Query ID:</td><td style="padding: 8px;">Q-0005</td></tr>
              <tr><td style="padding: 8px; font-weight: bold; color: #4b5563;">Destination:</td><td style="padding: 8px;">Shimla, Kufri</td></tr>
              <tr><td style="padding: 8px; font-weight: bold; color: #4b5563;">Duration:</td><td style="padding: 8px;">3 Nights & 4 Days</td></tr>
              <tr><td style="padding: 8px; font-weight: bold; color: #4b5563;">Adults:</td><td style="padding: 8px;">2</td></tr>
              <tr><td style="padding: 8px; font-weight: bold; color: #4b5563;">Children:</td><td style="padding: 8px;">1</td></tr>
            </table>
          </div>
          
          <!-- Option 1 -->
          <div style="border: 2px solid ${styles.optionBorder}; border-radius: 10px; padding: 25px; margin: 30px 0; background: white; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <div style="background: ${styles.optionHeaderBg}; color: ${styles.optionHeaderColor || 'white'}; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="margin: 0; font-size: 24px;">Option 1</h2>
            </div>
            
            <h3 style="color: ${styles.optionBorder}; margin-top: 0;">🏨 Hotels Included:</h3>
            
            <!-- Hotel 1 -->
            <div style="background: ${styles.hotelCardBg}; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid ${styles.optionBorder};">
              <div style="display: flex; gap: 15px;">
                <div style="width: 100px; height: 100px; background: #e5e7eb; border-radius: 8px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; color: #9ca3af; font-size: 12px;">
                  Hotel Image
                </div>
                <div style="flex: 1;">
                  <h4 style="margin: 0 0 10px 0; color: ${styles.optionBorder}; font-size: 18px;">Day 1: The Green Park Shimla</h4>
                  <p style="margin: 5px 0;"><strong>Category:</strong> 5 Star</p>
                  <p style="margin: 5px 0;"><strong>Room:</strong> Superior Villa</p>
                  <p style="margin: 5px 0;"><strong>Meal Plan:</strong> Room Only</p>
                  <p style="margin: 5px 0;"><strong>Check-in:</strong> 2026-01-06 2:00 PM</p>
                  <p style="margin: 5px 0;"><strong>Check-out:</strong> 2026-01-07 11:00</p>
                  <p style="margin: 5px 0;"><strong>Price:</strong> ₹24,452</p>
                </div>
              </div>
            </div>
            
            <!-- Hotel 2 -->
            <div style="background: ${styles.hotelCardBg}; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid ${styles.optionBorder};">
              <div style="display: flex; gap: 15px;">
                <div style="width: 100px; height: 100px; background: #e5e7eb; border-radius: 8px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; color: #9ca3af; font-size: 12px;">
                  Hotel Image
                </div>
                <div style="flex: 1;">
                  <h4 style="margin: 0 0 10px 0; color: ${styles.optionBorder}; font-size: 18px;">Day 2: The Green Park Shimla</h4>
                  <p style="margin: 5px 0;"><strong>Category:</strong> 5 Star</p>
                  <p style="margin: 5px 0;"><strong>Room:</strong> Standard Room</p>
                  <p style="margin: 5px 0;"><strong>Meal Plan:</strong> Room Only</p>
                  <p style="margin: 5px 0;"><strong>Check-in:</strong> 2026-01-07 2:00 PM</p>
                  <p style="margin: 5px 0;"><strong>Check-out:</strong> 2026-01-08 11:00</p>
                  <p style="margin: 5px 0;"><strong>Price:</strong> ₹24,452</p>
                </div>
              </div>
            </div>
            
            <!-- Price Box -->
            <div style="background: ${styles.priceBoxBg}; color: white; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0; font-size: 24px; font-weight: bold;">
              Total Package Price: ₹48,904
            </div>
          </div>
          
          <!-- Option 2 -->
          <div style="border: 2px solid ${styles.optionBorder}; border-radius: 10px; padding: 25px; margin: 30px 0; background: white; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <div style="background: ${styles.optionHeaderBg}; color: ${styles.optionHeaderColor || 'white'}; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="margin: 0; font-size: 24px;">Option 2</h2>
            </div>
            
            <h3 style="color: ${styles.optionBorder}; margin-top: 0;">🏨 Hotels Included:</h3>
            
            <div style="background: ${styles.hotelCardBg}; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid ${styles.optionBorder};">
              <h4 style="margin: 0 0 10px 0; color: ${styles.optionBorder}; font-size: 18px;">Day 1: Luxury Hotel Shimla</h4>
              <p style="margin: 5px 0;"><strong>Category:</strong> 4 Star</p>
              <p style="margin: 5px 0;"><strong>Room:</strong> Deluxe Room</p>
              <p style="margin: 5px 0;"><strong>Meal Plan:</strong> Breakfast Included</p>
              <p style="margin: 5px 0;"><strong>Price:</strong> ₹18,500</p>
            </div>
            
            <div style="background: ${styles.priceBoxBg}; color: white; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0; font-size: 24px; font-weight: bold;">
              Total Package Price: ₹18,500
            </div>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background: ${styles.footerBg}; color: ${styles.footerColor || 'white'}; padding: 20px; text-align: center;">
          <p style="margin: 5px 0;">Thank you for choosing TravelOps!</p>
          <p style="margin: 5px 0;">For any queries, please contact us at info@travelops.com or +91-9871023004</p>
        </div>
      </div>
    `;
  };

  const previewTemplate = (template) => {
    const previewHTML = generatePreviewHTML(template);
    setPreviewTemplateData({ template, html: previewHTML });
    setShowPreview(true);
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
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                <Mail className="h-8 w-8" />
                Email Templates
              </h1>
              <p className="text-gray-600 mt-2">Manage email templates for sending quotations to clients</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Add New
            </button>
          </div>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {templates.map((template) => (
            <div
              key={template.id}
              className={`bg-white rounded-lg shadow-md border-2 transition-all ${
                selectedTemplate === template.id
                  ? 'border-blue-600 ring-4 ring-blue-200'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{template.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                  </div>
                  {selectedTemplate === template.id && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                      Active
                    </span>
                  )}
                </div>

                {/* Template Preview */}
                <div 
                  className="mb-4 h-32 rounded-lg flex items-center justify-center border border-gray-200 overflow-hidden"
                  style={{
                    background: template.id === 'template-2' ? 'linear-gradient(135deg, #84cc16 0%, #65a30d 100%)' :
                               template.id === 'template-3' ? 'linear-gradient(180deg, #0ea5e9 0%, #06b6d4 50%, #22d3ee 100%)' :
                               template.id === 'template-4' ? '#3f6212' :
                               template.id === 'template-5' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' :
                               template.id === 'template-6' ? '#ffffff' :
                               'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)'
                  }}
                >
                  <div className="text-center">
                    {template.id === 'template-2' && <span className="text-white text-lg font-bold">🏔️ ADVENTURE</span>}
                    {template.id === 'template-3' && <span className="text-white text-lg font-bold">🏖️ BEACH</span>}
                    {template.id === 'template-4' && <span className="text-yellow-200 text-lg font-bold italic">Elegant</span>}
                    {template.id === 'template-5' && (
                      <>
                        <Mail className="h-8 w-8 text-white mx-auto mb-2" />
                        <span className="text-xs text-white font-medium">Modern</span>
                      </>
                    )}
                    {template.id === 'template-6' && (
                      <>
                        <Mail className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                        <span className="text-xs text-gray-600 font-medium">Minimalist</span>
                      </>
                    )}
                    {template.id === 'template-1' && (
                      <>
                        <Mail className="h-8 w-8 text-white mx-auto mb-2" />
                        <span className="text-xs text-white font-medium">Classic</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => previewTemplate(template)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm"
                  >
                    <Eye className="h-4 w-4" />
                    Preview
                  </button>
                  <button
                    onClick={() => saveSelectedTemplate(template.id)}
                    disabled={selectedTemplate === template.id || saving}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded text-sm ${
                      selectedTemplate === template.id
                        ? 'bg-blue-600 text-white cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {selectedTemplate === template.id ? (
                      <>
                        <Save className="h-4 w-4" />
                        Active
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Select
                      </>
                    )}
                  </button>
                  {template.isCustom && (
                    <button
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="px-3 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm"
                      title="Delete template"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Preview Modal */}
        {showPreview && previewTemplateData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
              <div className="flex justify-between items-center p-6 border-b bg-gray-50">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Template Preview</h2>
                  <p className="text-sm text-gray-600 mt-1">{previewTemplateData.template.name}</p>
                </div>
                <button
                  onClick={() => {
                    setShowPreview(false);
                    setPreviewTemplateData(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 bg-gray-100">
                <div className="bg-white rounded-lg shadow-lg p-4">
                  <div 
                    dangerouslySetInnerHTML={{ __html: previewTemplateData.html }}
                    style={{ maxWidth: '100%', overflowX: 'auto' }}
                  />
                </div>
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> This is a preview with sample data. When you send emails to clients, actual quotation data will be used with this template design.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Create Template Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center p-6 border-b">
                <h2 className="text-xl font-bold text-gray-900">Create New Email Template</h2>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewTemplate({ name: '', subject: '', content: '', description: '' });
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Template Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newTemplate.name}
                    onChange={(e) => setNewTemplate({...newTemplate, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter template name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Subject <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newTemplate.subject}
                    onChange={(e) => setNewTemplate({...newTemplate, subject: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter email subject"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={newTemplate.description}
                    onChange={(e) => setNewTemplate({...newTemplate, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Brief description of this template"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Content <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={newTemplate.content}
                    onChange={(e) => setNewTemplate({...newTemplate, content: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={10}
                    placeholder="Enter your email content here. You can use HTML tags for formatting."
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    You can use HTML tags like &lt;strong&gt;, &lt;em&gt;, &lt;br&gt;, etc. for formatting.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewTemplate({ name: '', subject: '', content: '', description: '' });
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateTemplate}
                  disabled={!newTemplate.name || !newTemplate.subject || !newTemplate.content}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Template
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default EmailTemplates;

