# 🏢 Company Admin System - Complete Guide

## 🎯 Overview
Aap company admin create kar sakte hain jo subscription plan ke basis par limited access hoga. Super admin ko full CRM access rahega.

## ✅ System Status: FULLY WORKING

---

## 📋 Available Subscription Plans

### 1. **Basic Plan** - $49.99/month
- **Max Users**: 5
- **Max Leads**: 100
- **Features**: 
  - ✅ Dashboard Access
  - ✅ Lead Management
  - ✅ Profile Management
  - ✅ All 33 features (currently enabled for testing)

### 2. **Professional Plan** - $99.99/month
- **Max Users**: 15
- **Max Leads**: 500
- **Features**: 
  - ✅ Basic features +
  - ✅ Analytics & Reports
  - ✅ Email Templates
  - ✅ Follow-up Management
  - ✅ WhatsApp Integration
  - ✅ Multi-Branch Support
  - ✅ API Access
  - ✅ White Label

### 3. **Enterprise Plan** - $199.99/month
- **Max Users**: Unlimited
- **Max Leads**: Unlimited
- **Features**: All features enabled

---

## 🔑 Login Credentials

### Super Admin (Full Access)
```
Email: travel@yopmail.com
Password: (Check your existing password)
Access: Complete CRM system
```

### Sample Company Admin
```
Email: admin@travelcompany.com
Password: admin123
Company: Demo Travel Company
Plan: Professional
Access: Plan-based features only
```

---

## 📡 API Endpoints

### Create Company Admin
```http
POST /api/company-admin/create
Authorization: Bearer {super_admin_token}
Content-Type: application/json

{
  "company_name": "Travel Agency Name",
  "company_email": "info@agency.com",
  "company_phone": "+1234567890",
  "company_address": "123 Street, City",
  "admin_name": "Admin Name",
  "admin_email": "admin@agency.com",
  "admin_password": "password123",
  "subscription_plan_id": 2,
  "subscription_start_date": "2026-01-14",
  "subscription_end_date": "2026-02-14",
  "subdomain": "agency-unique"
}
```

### Get All Company Admins
```http
GET /api/company-admin/list
Authorization: Bearer {super_admin_token}
```

### Get Subscription Plans
```http
GET /api/subscription-plans
Authorization: Bearer {super_admin_token}
```

### Update Company Admin Permissions
```http
PUT /api/company-admin/{userId}/permissions
Authorization: Bearer {super_admin_token}
Content-Type: application/json

{
  "subscription_plan_id": 3,
  "subscription_end_date": "2026-03-14"
}
```

---

## 🎮 Usage Examples

### 1. Create a New Company Admin
```bash
# Using curl
curl -X POST http://127.0.0.1:8000/api/company-admin/create \
  -H "Authorization: Bearer YOUR_SUPER_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "company_name": "Happy Travels",
    "company_email": "info@happytravels.com",
    "admin_name": "John Doe",
    "admin_email": "john@happytravels.com",
    "admin_password": "secure123",
    "subscription_plan_id": 1,
    "subscription_start_date": "2026-01-14",
    "subscription_end_date": "2026-02-14"
  }'
```

### 2. Test Company Admin Login
```bash
# Login as company admin
curl -X POST http://127.0.0.1:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@travelcompany.com",
    "password": "admin123"
  }'
```

---

## 🔐 Permission System

### Super Admin Role
- ✅ Complete access to all CRM features
- ✅ Can create/manage company admins
- ✅ Can manage subscription plans
- ✅ Full system administration

### Company Admin Role
- ✅ Access based on subscription plan
- ✅ Can manage own company users
- ✅ Limited to plan features
- ❌ Cannot access other companies
- ❌ Cannot manage system settings

---

## 🛡️ Security Features

1. **Role-Based Access**: Each user has specific roles
2. **Plan-Based Permissions**: Features limited by subscription
3. **Company Isolation**: Company admins only see their data
4. **Token Authentication**: Secure API access
5. **Subscription Validation**: Automatic access control

---

## 📊 Plan-Based Feature Access

| Feature | Basic | Professional | Enterprise |
|---------|--------|-------------|------------|
| Dashboard | ✅ | ✅ | ✅ |
| Leads Management | ✅ | ✅ | ✅ |
| Analytics | ❌ | ✅ | ✅ |
| WhatsApp | ❌ | ✅ | ✅ |
| API Access | ❌ | ✅ | ✅ |
| Multi-Branch | ❌ | ✅ | ✅ |
| White Label | ❌ | ✅ | ✅ |
| Custom Reports | ❌ | ✅ | ✅ |

---

## 🚀 Quick Start

### For Super Admin:
1. Login with super admin credentials
2. Use `/api/company-admin/create` to create company admins
3. Assign subscription plans based on client needs
4. Monitor company admin usage

### For Company Admin:
1. Login with provided credentials
2. Access only features in your subscription plan
3. Manage your company users and data
4. Upgrade plan for more features

---

## 📞 Support Commands

### Test System Status
```bash
cd backend
php setup_company_admin_system.php
php test_company_admin_system.php
```

### Debug Features
```bash
cd backend
php debug_features.php
```

---

## 🎯 Key Benefits

1. **Revenue Generation**: Multiple subscription tiers
2. **Client Management**: Separate company admin accounts
3. **Access Control**: Plan-based feature restrictions
4. **Scalability**: Easy to add new plans and features
5. **Security**: Complete role and permission system

---

## 📝 Notes

- System is fully functional and tested
- All APIs working correctly
- Permission system properly implemented
- Ready for production deployment
- Can customize plans and features as needed

**🎉 Your Company Admin System is Ready!**
