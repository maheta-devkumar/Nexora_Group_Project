import api from '../api'; // Centralized Axios instance

// Base URL for admin payments (matches backend route)
const BASE_URL = '/admin/payments';

// Fetch paginated payments with filters
export const fetchPayments = async ({ page = 1, limit = 20, status = '', method = '', fromDate = '', toDate = '' }) => {
    const params = {
        page,
        per_page: limit,
        ...(status && { status }),
        ...(method && { method }),
        ...(fromDate && { from_date: fromDate }),
        ...(toDate && { to_date: toDate }),
    };

    const response = await api.get(BASE_URL, { params });
    return response.data;
};

// Fetch payment summary metrics
export const fetchPaymentSummary = async () => {
    const response = await api.get(`${BASE_URL}/summary`);
    return response.data;
};

// Fetch single payment details
export const fetchPaymentDetails = async (paymentId) => {
    const response = await api.get(`${BASE_URL}/${paymentId}`);
    return response.data;
};
