# 🗺️ Travel CRM - Best Practice Flow

## 📋 Complete Lead-to-Booking Flow

### **PHASE 1: LEAD CAPTURE & QUALIFICATION**

#### Step 1: Lead Creation
- **Source**: Facebook, WhatsApp, Walk-in, Website, Referral, etc.
- **Required Info**:
  - Client Name
  - Contact (Phone/Email)
  - Destination Interest
  - Travel Dates (if known)
  - Number of Travelers (Adults/Children/Infants)
  - Budget Range (Optional)
- **Status**: `NEW`
- **Priority**: Auto-assign based on source/urgency (Hot/Warm/Cold)
- **Assignment**: Auto-assign or manual assignment to Sales Rep

---

### **PHASE 2: ITINERARY PLANNING**

#### Step 2: Create Itinerary Structure
- **Basic Setup**:
  - Itinerary Name (e.g., "Goa Beach Tour")
  - Start Date & End Date
  - Duration: Days & Nights (e.g., 3 Days 2 Nights)
  - Destinations Overview
  - Travelers: Adults, Children, Infants

#### Step 3: Day-wise Itinerary Setup
For each day, set:
- **Day Number** (Day 1, Day 2, Day 3...)
- **Destination** (City/Location for that day)
- **Activities** (Sightseeing, transfers, meals, etc.)
- **Accommodation Required** (Yes/No - for nights)

**Example Structure:**
```
Day 1 (Night 1):
  - Destination: Mumbai → Goa
  - Activities: Airport pickup, Hotel check-in, Evening beach visit
  - Accommodation: Yes (Night 1)

Day 2 (Night 2):
  - Destination: Goa
  - Activities: Morning beach activities, Fort visit, Sunset cruise
  - Accommodation: Yes (Night 2)

Day 3:
  - Destination: Goa → Mumbai
  - Activities: Hotel checkout, Airport drop
  - Accommodation: No
```

---

### **PHASE 3: HOTEL OPTIONS SETUP**

#### Step 4: Add Hotel Options Per Night
For each night that requires accommodation:

**Night 1 (Day 1):**
- **Option 1**: Hotel A (3 Star) - Room Type X - Meal Plan Y
- **Option 2**: Hotel B (4 Star) - Room Type X - Meal Plan Y
- **Option 3**: Hotel C (5 Star) - Room Type X - Meal Plan Y

**Night 2 (Day 2):**
- **Option 1**: Hotel D (3 Star) - Room Type X - Meal Plan Y
- **Option 2**: Hotel E (4 Star) - Room Type X - Meal Plan Y
- **Option 3**: Hotel F (5 Star) - Room Type X - Meal Plan Y

**Key Points:**
- Each option can have DIFFERENT hotels for different nights
- Option 1 = Budget option (all nights)
- Option 2 = Mid-range option (all nights)
- Option 3 = Premium option (all nights)

**Data Structure:**
```json
{
  "itinerary_id": 1,
  "nights": [
    {
      "night_number": 1,
      "day": 1,
      "destination": "Goa",
      "options": [
        {
          "option_number": 1,
          "hotel_id": 101,
          "hotel_name": "Hotel A",
          "room_type": "Deluxe",
          "meal_plan": "Breakfast",
          "price": 5000
        },
        {
          "option_number": 2,
          "hotel_id": 102,
          "hotel_name": "Hotel B",
          "room_type": "Super Deluxe",
          "meal_plan": "Breakfast",
          "price": 8000
        },
        {
          "option_number": 3,
          "hotel_id": 103,
          "hotel_name": "Hotel C",
          "room_type": "Suite",
          "meal_plan": "Breakfast + Dinner",
          "price": 12000
        }
      ]
    },
    {
      "night_number": 2,
      "day": 2,
      "destination": "Goa",
      "options": [
        {
          "option_number": 1,
          "hotel_id": 104,
          "hotel_name": "Hotel D",
          "room_type": "Deluxe",
          "meal_plan": "Breakfast",
          "price": 5000
        },
        {
          "option_number": 2,
          "hotel_id": 105,
          "hotel_name": "Hotel E",
          "room_type": "Super Deluxe",
          "meal_plan": "Breakfast",
          "price": 8000
        },
        {
          "option_number": 3,
          "hotel_id": 106,
          "hotel_name": "Hotel F",
          "room_type": "Suite",
          "meal_plan": "Breakfast + Dinner",
          "price": 12000
        }
      ]
    }
  ]
}
```

---

### **PHASE 4: PRICING SETUP**

#### Step 5: Set Pricing Per Option
For each option (1, 2, 3), calculate:

**Option 1 Pricing:**
- Base Price (Sum of all hotel prices for Option 1)
  - Night 1 Hotel: ₹5,000
  - Night 2 Hotel: ₹5,000
  - **Subtotal**: ₹10,000
  
- Additional Charges:
  - Transport: ₹3,000
  - Activities: ₹2,000
  - Guide: ₹1,000
  - **Subtotal**: ₹6,000
  
- **Total Base**: ₹16,000

- Taxes & Charges:
  - GST (18%): ₹2,880
  - Service Charge (5%): ₹800
  - **Total Charges**: ₹3,680

- **Final Price Option 1**: ₹19,680

**Option 2 Pricing:**
- Base Price: ₹16,000 (Night 1: ₹8,000 + Night 2: ₹8,000)
- Additional Charges: ₹6,000
- GST (18%): ₹3,960
- Service Charge (5%): ₹1,100
- **Final Price Option 2**: ₹27,060

**Option 3 Pricing:**
- Base Price: ₹24,000 (Night 1: ₹12,000 + Night 2: ₹12,000)
- Additional Charges: ₹6,000
- GST (18%): ₹5,400
- Service Charge (5%): ₹1,500
- **Final Price Option 3**: ₹36,900

**Pricing Fields:**
- Base Price (Hotels)
- Transport Cost
- Activity Cost
- Guide Cost
- Other Charges
- GST Percentage (e.g., 18%)
- CGST (if applicable)
- SGST (if applicable)
- Service Charge
- Discount (if any)
- **Final Total**

---

### **PHASE 5: PROPOSAL GENERATION**

#### Step 6: Generate Proposal PDF
Each proposal should include:

**Cover Page:**
- Company Logo
- Proposal Title
- Client Name
- Query ID
- Date
- Valid Until Date

**Itinerary Overview:**
- Duration (Days/Nights)
- Destinations
- Travel Dates
- Number of Travelers

**Day-wise Itinerary:**
- Day 1: Activities, transfers, meals
- Day 2: Activities, transfers, meals
- Day 3: Activities, transfers, meals

**Hotel Options (All 3 Options):**

**Option 1:**
- Night 1: Hotel A (3 Star) - Room Type - Meal Plan - ₹5,000
- Night 2: Hotel D (3 Star) - Room Type - Meal Plan - ₹5,000
- Additional Services: ₹6,000
- GST (18%): ₹2,880
- Service Charge: ₹800
- **Total: ₹19,680**

**Option 2:**
- Night 1: Hotel B (4 Star) - Room Type - Meal Plan - ₹8,000
- Night 2: Hotel E (4 Star) - Room Type - Meal Plan - ₹8,000
- Additional Services: ₹6,000
- GST (18%): ₹3,960
- Service Charge: ₹1,100
- **Total: ₹27,060**

**Option 3:**
- Night 1: Hotel C (5 Star) - Room Type - Meal Plan - ₹12,000
- Night 2: Hotel F (5 Star) - Room Type - Meal Plan - ₹12,000
- Additional Services: ₹6,000
- GST (18%): ₹5,400
- Service Charge: ₹1,500
- **Total: ₹36,900**

**Inclusions:**
- Accommodation
- Meals
- Transfers
- Activities
- Guide

**Exclusions:**
- Airfare
- Personal expenses
- Tips
- Insurance

**Terms & Conditions:**
- Payment terms
- Cancellation policy
- Refund policy

---

### **PHASE 6: CLIENT COMMUNICATION**

#### Step 7: Send Proposal to Client

**Via WhatsApp:**
- Generate PDF
- Create message:
  ```
  Hello [Client Name],
  
  Thank you for your interest in [Destination] travel.
  
  Please find attached our travel proposal with 3 options:
  
  Option 1: Budget Package - ₹19,680
  Option 2: Mid-Range Package - ₹27,060
  Option 3: Premium Package - ₹36,900
  
  Query ID: [Query ID]
  
  Please review and let us know your preferred option.
  
  Valid until: [Date]
  
  Best regards,
  [Your Company]
  ```
- Attach PDF
- Send via WhatsApp API

**Via Email:**
- Generate PDF
- Create email:
  - To: Client Email
  - Subject: Travel Proposal - [Destination] - Query ID [ID]
  - Body: Similar to WhatsApp message
  - Attachment: PDF
- Send via Email API (Gmail/SMTP)

**After Sending:**
- **Status automatically changes to**: `PROPOSAL` (sent)
- Log sent date/time
- Track delivery status

---

### **PHASE 7: FOLLOW-UP & NEGOTIATION**

#### Step 8: Follow-up Management
- **Status**: `PROPOSAL` → `FOLLOWUP`
- Schedule follow-up reminders:
  - Date: [Date]
  - Time: [Time]
  - Notes: "Follow up on proposal sent"
- Multiple follow-ups can be scheduled
- Track overdue follow-ups

#### Step 9: Client Response Handling
- **If Client Selects Option**: Status → `FOLLOWUP` → `CONFIRMED`
- **If Client Requests Changes**: Update proposal, send revised version
- **If Client Rejects**: Status → `CANCELLED` or keep in `FOLLOWUP` for future

---

### **PHASE 8: BOOKING CONFIRMATION**

#### Step 10: Confirm Booking
- **Status**: `CONFIRMED`
- Select confirmed option (Option 1, 2, or 3)
- Lock hotels for confirmed dates
- Generate booking confirmation
- Create payment schedule

#### Step 11: Payment Management
- Set payment milestones:
  - Advance Payment: ₹X (Due: [Date])
  - Second Installment: ₹Y (Due: [Date])
  - Final Payment: ₹Z (Due: [Date])
- Track payments received
- Generate payment receipts
- Send payment reminders

---

### **PHASE 9: PRE-TRAVEL PREPARATION**

#### Step 12: Document Management
- Upload required documents:
  - Passport copies
  - Visa documents
  - Travel insurance
  - Flight tickets
  - Hotel vouchers
- Organize by category
- Share with client

#### Step 13: Voucher Generation
- Generate hotel vouchers
- Generate activity vouchers
- Generate transfer vouchers
- Send to client via WhatsApp/Email

---

### **PHASE 10: POST-BOOKING SUPPORT**

#### Step 14: Travel Support
- Track travel dates
- Send reminders before travel
- Provide 24/7 support contact
- Handle on-travel issues

#### Step 15: Post-Travel
- Collect feedback
- Generate invoice
- Process final payments
- Close lead/booking

---

## 📊 STATUS FLOW DIAGRAM

```
NEW
  ↓
ASSIGNED (Optional)
  ↓
ITINERARY CREATED
  ↓
PROPOSAL CREATED
  ↓
PROPOSAL SENT (WhatsApp/Email) → Status: PROPOSAL
  ↓
FOLLOWUP (Scheduled)
  ↓
  ├─→ CONFIRMED (Client Selected Option)
  │     ↓
  │   PAYMENT SCHEDULED
  │     ↓
  │   DOCUMENTS COLLECTED
  │     ↓
  │   VOUCHERS GENERATED
  │     ↓
  │   TRAVEL COMPLETED
  │     ↓
  │   CLOSED
  │
  └─→ CANCELLED (If Rejected)
```

---

## 🎯 KEY FEATURES REQUIRED

### 1. **Itinerary Builder**
- Day-wise structure
- Activity management
- Destination mapping
- Transfer scheduling

### 2. **Hotel Management**
- Multiple options per night
- Room type selection
- Meal plan selection
- Price management

### 3. **Pricing Engine**
- Base price calculation
- Tax calculation (GST, CGST, SGST)
- Service charges
- Discounts
- Final pricing per option

### 4. **Proposal Generator**
- PDF generation
- Multiple options display
- Professional templates
- Company branding

### 5. **Communication**
- WhatsApp integration
- Email integration (Gmail/SMTP)
- Message templates
- PDF attachment

### 6. **Status Management**
- Automatic status updates
- Status change logging
- Workflow automation

### 7. **Payment Tracking**
- Payment schedules
- Payment history
- Receipt generation
- Reminders

### 8. **Document Management**
- Upload/download
- Categorization
- Sharing with client

---

## 💡 BEST PRACTICES

1. **Always create multiple options** (Budget, Mid-range, Premium)
2. **Set clear pricing** with breakdown
3. **Set validity dates** for proposals
4. **Follow up within 24-48 hours**
5. **Track all communications**
6. **Maintain document trail**
7. **Automate status updates**
8. **Send reminders** for payments
9. **Provide 24/7 support** during travel
10. **Collect feedback** post-travel

---

## 🔄 AUTOMATION OPPORTUNITIES

1. **Auto-assign leads** based on source/priority
2. **Auto-generate proposal** from itinerary
3. **Auto-send reminders** for follow-ups
4. **Auto-update status** on proposal send
5. **Auto-calculate pricing** based on hotels selected
6. **Auto-generate vouchers** on confirmation
7. **Auto-send payment reminders**
8. **Auto-create tasks** for document collection

---

## 📱 INTEGRATION REQUIREMENTS

1. **WhatsApp Business API** - For messaging
2. **Gmail API** - For email sending
3. **PDF Generator** - For proposals/vouchers
4. **Payment Gateway** - For online payments (optional)
5. **SMS Gateway** - For SMS reminders (optional)

---

**Ye flow industry-standard hai aur aapke requirements ke according customize kar sakte hain!**
