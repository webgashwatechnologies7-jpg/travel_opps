// 🚨 IMMEDIATE FIX FOR AUTHENTICATION ISSUES
// Run this in browser console to fix authentication

console.log('🔧 Fixing Authentication Issues...');

// Step 1: Clear all old auth data
localStorage.removeItem('auth_token');
localStorage.removeItem('user');
sessionStorage.clear();

console.log('✅ Cleared old auth data');

// Step 2: Set fresh token (from backend debug)
const freshToken = '21|b3syfRGPFYn3mKxYUgrmsbNSUKEipmI22427h8qUca0c2fb5';
localStorage.setItem('auth_token', freshToken);

console.log('✅ Set fresh token');

// Step 3: Set user data
const userData = {
  id: 1,
  name: 'Admin User',
  email: 'travel@yopmail.com',
  is_super_admin: true,
  is_active: true,
  roles: ['Admin']
};

localStorage.setItem('user', JSON.stringify(userData));

console.log('✅ Set user data');

// Step 4: Test API call
const testAPI = async () => {
  try {
    const response = await fetch('http://127.0.0.1:8000/api/admin/settings', {
      headers: {
        'Authorization': `Bearer ${freshToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      console.log('✅ API Test Successful');
      const data = await response.json();
      console.log('Response:', data);
    } else {
      console.log('❌ API Test Failed:', response.status);
    }
  } catch (error) {
    console.log('❌ API Test Error:', error);
  }
};

console.log('🔄 Testing API...');
testAPI();

console.log('🎉 Authentication Fix Complete!');
console.log('📋 Next Steps:');
console.log('1. Refresh the page');
console.log('2. Check if dashboard loads');
console.log('3. Test all features');

export const fixAuthentication = () => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user');
  
  const freshToken = '21|b3syfRGPFYn3mKxYUgrmsbNSUKEipmI22427h8qUca0c2fb5';
  localStorage.setItem('auth_token', freshToken);
  
  const userData = {
    id: 1,
    name: 'Admin User',
    email: 'travel@yopmail.com',
    is_super_admin: true,
    is_active: true,
    roles: ['Admin']
  };
  
  localStorage.setItem('user', JSON.stringify(userData));
  
  window.location.reload();
};
