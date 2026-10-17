import api from './api';

const BASE_URL = '/admin/settings';

export const fetchSettings = async () => {
    const response = await api.get(BASE_URL);
    return response.data;
};

export const updateSettings = async (data) => {
    const response = await api.put(BASE_URL, data);
    return response.data;
};
