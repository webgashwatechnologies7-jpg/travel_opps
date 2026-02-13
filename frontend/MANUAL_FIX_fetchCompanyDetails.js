// Add this function after fetchMaxHotelOptions (around line 64)

const fetchCompanyDetails = async () => {
    try {
        const response = await settingsAPI.getCompany();
        if (response.data?.success && response.data?.data) {
            const company = response.data.data;
            setCompanyForm({
                company_name: company.name || '',
                company_address: company.address || '',
                company_phone: company.phone || '',
                company_email: company.email || '',
                company_website: ''
            });
            if (company.logo) {
                setLogoPreview(company.logo);
            }
        }
    } catch (err) {
        console.error('Failed to fetch company details:', err);
    }
};
