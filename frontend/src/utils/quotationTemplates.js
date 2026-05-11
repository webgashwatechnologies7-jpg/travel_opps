import { getDisplayImageUrl } from './imageUrl';
import { formatDate } from './formatters';

// Format ID helper - matches LeadDetails.jsx logic
export const formatLeadId = (id) => {
  if (!id) return 'N/A';
  return `Q-${String(id).padStart(4, '0')}`;
};

// Helper to get travel month
export const getTravelMonth = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'N/A';
  return date.toLocaleString('default', { month: 'long', year: 'numeric' });
};

// Helper function to format text for HTML
export const formatTextForHTML = (text) => {
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

/**
 * Generate Policy Section HTML
 * @param {string} title 
 * @param {string} text 
 * @param {object} styles 
 */
export const generatePolicySection = (title, text, styles = {}) => {
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

/**
 * Generate All Policies HTML section
 * @param {object} policies 
 * @param {object} styles 
 */
export const generateAllPoliciesSection = (policies, styles = {}) => {
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

/**
 * Generate Terms & Conditions HTML section (for backward compatibility)
 */
export const generateTermsSection = (termsText, styles = {}) => {
  return generatePolicySection('Terms & Conditions', termsText, styles);
};

/**
 * Shared Email Header builder
 */
export const buildEmailHeader = (companySettings, headerBg = '#1e40af', headerTextColor = '#ffffff') => {
  const cs = companySettings || {};
  const name = cs.company_name || 'Your Company Name';
  const address = cs.company_address || 'Delhi, India';
  const phone = cs.company_phone || '+91-9871023004';
  const email = cs.company_email || cs.email || 'info@yourcompany.com';
  const website = cs.company_website || 'www.yourcompany.com';
  const logo = cs.company_logo ? getDisplayImageUrl(cs.company_logo) : null;

  return `
      <table width="100%" cellpadding="0" cellspacing="0" style="background:${headerBg};">
        <tr>
          <td style="padding:24px 30px;text-align:center;">
            ${logo
      ? `<img src="${logo}" alt="${name}" style="height:56px;max-width:180px;object-fit:contain;display:block;margin:0 auto 10px;" />`
      : `<div style="font-size:28px;font-weight:bold;color:${headerTextColor};margin-bottom:6px;">${name}</div>`
    }
            <div style="font-size:13px;color:${headerTextColor};opacity:0.9;">${address}</div>
            <div style="font-size:13px;color:${headerTextColor};opacity:0.9;margin-top:3px;">📞 ${phone} | ✉ ${email} | 🌐 ${website}</div>
          </td>
        </tr>
      </table>
    `;
};

/**
 * Shared Email Footer builder
 */
export const buildEmailFooter = (companySettings, footerBg = '#1e293b', footerTextColor = '#ffffff') => {
  const cs = companySettings || {};
  const name = cs.company_name || 'Your Company Name';
  const address = cs.company_address || 'Delhi, India';
  const phone = cs.company_phone || '+91-9871023004';
  const email = cs.company_email || cs.email || 'info@yourcompany.com';
  const website = cs.company_website || 'www.yourcompany.com';

  return `
      <div style="background:${footerBg};color:${footerTextColor};padding:24px 30px;text-align:center;margin-top:30px;">
        <p style="margin:0 0 6px 0;font-size:16px;font-weight:bold;">Thank you for choosing ${name}!</p>
        <p style="margin:0;font-size:13px;opacity:0.9;">📍 ${address} | 📞 ${phone} | ✉ ${email} | 🌐 ${website}</p>
      </div>
    `;
};

/**
 * Extract only the <body> inner HTML from a full HTML string
 */
export const extractBodyContent = (htmlString) => {
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

// --- Template Functions ---

/**
 * Template 2: 3D Premium
 */
export const generate3DPremiumEmailTemplate = (itinerary, allOptions, hotelsData, policies = {}, context = {}) => {
  const { lead, companySettings } = context;
  const _hdrBg = (companySettings?.email_header_color) || '#667eea';
  const _ftrBg = (companySettings?.email_footer_color) || '#4b5563';

  let html = `
      <div style="font-family: 'Arial', sans-serif; max-width: 800px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px;">
        <div style="border-radius: 20px; overflow:hidden; margin-bottom: 30px; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
          ${buildEmailHeader(companySettings, _hdrBg, '#ffffff')}
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
        ${buildEmailFooter(companySettings, _ftrBg, '#ffffff')}
      </div>
    `;

  return html;
};

/**
 * Template 3: 3D Floating
 */
export const generate3DFloatingEmailTemplate = (itinerary, allOptions, hotelsData, policies = {}, context = {}) => {
  const { lead, companySettings } = context;
  const _hdrBg = (companySettings?.email_header_color) || '#1e3c72';
  const _ftrBg = (companySettings?.email_footer_color) || '#1e3c72';

  let html = `
      <div style="font-family: 'Arial', sans-serif; max-width: 800px; margin: 0 auto; background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); padding: 40px 20px;">
        <div style="border-radius: 15px; overflow:hidden; margin-bottom: 40px; box-shadow: 0 30px 60px rgba(0,0,0,0.4);">
          ${buildEmailHeader(companySettings, _hdrBg, '#ffffff')}
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
        ${buildEmailFooter(companySettings, _ftrBg, '#ffffff')}
      </div>
    `;

  return html;
};

/**
 * Template 4: 3D Layered (Default Template 1)
 */
export const generateEmailTemplate = (itinerary, allOptions, hotelsData, policies = {}, context = {}) => {
  const { lead, companySettings } = context;
  const _hdrBg = (companySettings?.email_header_color) || '#0f2027';
  const _ftrBg = (companySettings?.email_footer_color) || '#ecf0f1';

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
                ${buildEmailHeader(companySettings, _hdrBg, '#ffffff')}
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
  if (policies?.termsConditions) {
    html += `
      <tr>
        <td style="padding:20px;">
          <h4>Terms & Conditions</h4>
          <p style="font-size:13px;">${policies.termsConditions}</p>
        </td>
      </tr>
    `;
  }

  // FOOTER
  html += `
            <tr>
              <td style="padding:0;">
                ${buildEmailFooter(companySettings, _ftrBg, _ftrBg === '#ecf0f1' ? '#333333' : '#ffffff')}
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

/**
 * Template 5: Adventure
 */
export const generateAdventureEmailTemplate = (itinerary, allOptions, hotelsData, policies = {}, context = {}) => {
  const { lead, companySettings } = context;
  const _hdrBg = (companySettings?.email_header_color) || '#65a30d';
  const _ftrBg = (companySettings?.email_footer_color) || '#365314';

  let html = `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; background: #d1fae5;">
        ${buildEmailHeader(companySettings, _hdrBg, '#ffffff')}
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
        ${buildEmailFooter(companySettings, _ftrBg, '#ffffff')}
      </div>
    `;

  return html;
};

/**
 * Template 6: Beach
 */
export const generateBeachEmailTemplate = (itinerary, allOptions, hotelsData, policies = {}, context = {}) => {
  const { lead, companySettings } = context;
  const _hdrBg = (companySettings?.email_header_color) || '#0891b2';
  const _ftrBg = (companySettings?.email_footer_color) || '#164e63';

  let html = `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; background: white;">
        ${buildEmailHeader(companySettings, _hdrBg, '#ffffff')}
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
      const hotelImg = hotel.image ? getDisplayImageUrl(hotel.image) : null;
      html += `
          <div style="background: #ecfeff; padding: 20px; border-radius: 10px; margin-bottom: 15px; border: 2px solid #06b6d4;">
            <div style="display: flex; gap: 15px;">
              ${hotelImg ? `<img src="${hotelImg}" alt="${hotel.hotelName}" style="width: 120px; height: 120px; object-fit: cover; border-radius: 50%; flex-shrink: 0;" />` : '<div style="width: 120px; height: 120px; background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); border-radius: 50%; flex-shrink: 0; display: flex; align-items: center; justify-content: center; color: white; font-size: 40px;">🏨</div>'}
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
        ${buildEmailFooter(companySettings, _ftrBg, '#ffffff')}
      </div>
    `;

  return html;
};

/**
 * Template 7: Elegant
 */
export const generateElegantEmailTemplate = (itinerary, allOptions, hotelsData, policies = {}, context = {}) => {
  const { lead, companySettings } = context;
  const _hdrBg = (companySettings?.email_header_color) || '#3f6212';
  const _ftrBg = (companySettings?.email_footer_color) || '#365314';

  let html = `
      <div style="font-family: 'Georgia', serif; max-width: 800px; margin: 0 auto; background: white;">
        ${buildEmailHeader(companySettings, _hdrBg, '#fef3c7')}
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
      const hotelImg = hotel.image ? getDisplayImageUrl(hotel.image) : null;
      html += `
          <div style="background: #f7fee7; padding: 20px; border-radius: 8px; margin-bottom: 15px;">
            <div style="display: flex; gap: 15px; margin-bottom: 15px;">
              ${hotelImg ? `<img src="${hotelImg}" alt="${hotel.hotelName}" style="width: 100px; height: 100px; border-radius: 50%; flex-shrink: 0; object-fit: cover;" />` : '<div style="width: 100px; height: 100px; background: #84cc16; border-radius: 50%; flex-shrink: 0; display: flex; align-items: center; justify-content: center; color: white; font-size: 40px;">🏨</div>'}
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
        ${generateAllPoliciesSection(policies, {
    termsBg: '#f7fee7',
    borderRadius: '10px',
    termsBorder: '2px solid #84cc16',
    termsShadow: '0 5px 15px rgba(0,0,0,0.1)',
    termsTitleColor: '#365314',
    termsTitleSize: '22px',
    termsTextSize: '14px'
  })}
        ${buildEmailFooter(companySettings, _ftrBg, '#fef3c7')}
      </div>
    `;

  return html;
};

/**
 * Main Template Renderer
 */
export const renderTemplate = (templateId, itinerary, allOptions, hotelsData, policies, context) => {
  switch (templateId) {
    case 'template-2':
      return generate3DPremiumEmailTemplate(itinerary, allOptions, hotelsData, policies, context);
    case 'template-3':
      return generate3DFloatingEmailTemplate(itinerary, allOptions, hotelsData, policies, context);
    case 'template-4':
      return generateEmailTemplate(itinerary, allOptions, hotelsData, policies, context);
    case 'template-5':
      return generateAdventureEmailTemplate(itinerary, allOptions, hotelsData, policies, context);
    case 'template-6':
      return generateBeachEmailTemplate(itinerary, allOptions, hotelsData, policies, context);
    case 'template-7':
      return generateElegantEmailTemplate(itinerary, allOptions, hotelsData, policies, context);
    default:
      return generateEmailTemplate(itinerary, allOptions, hotelsData, policies, context);
  }
};
