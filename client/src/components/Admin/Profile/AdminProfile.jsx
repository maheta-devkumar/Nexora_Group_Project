import React, { useState, useEffect } from 'react';
import { useProfileContext } from '../../../context/ProfileContext';
import { useAuth } from '../../../context/AuthContext';
import AdminLayout from '../../Admin/Layout/AdminLayout'; // Correct import path based on file location
import { User, Mail, Phone, Calendar, Lock, Save, Camera, Shield } from 'lucide-react';
import { toast } from 'react-toastify';
import './AdminProfile.css';

const AdminProfile = () => {
    const { profile, loading, error, fetchProfile, updateProfile, changePassword } = useProfileContext();
    const { user } = useAuth();

    // Form states
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        phone: '',
        gender: '',
        dob: '',
        profile_img_url: ''
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [isEditing, setIsEditing] = useState(false);
    const [passwordLoading, setPasswordLoading] = useState(false);

    // Initial fetch
    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    // Populate form data
    useEffect(() => {
        if (profile) {
            setFormData({
                first_name: profile.first_name || '',
                last_name: profile.last_name || '',
                phone: profile.phone || '',
                gender: profile.gender || '',
                dob: profile.dob ? new Date(profile.dob).toISOString().split('T')[0] : '',
                profile_img_url: profile.profile_img_url || ''
            });
        }
    }, [profile]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmitProfile = async (e) => {
        e.preventDefault();
        const result = await updateProfile(formData);
        if (result.success) {
            toast.success('Profile updated successfully');
            setIsEditing(false);
        } else {
            toast.error(result.message || 'Failed to update profile');
        }
    };

    const handleSubmitPassword = async (e) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error('New passwords do not match');
            return;
        }

        setPasswordLoading(true);
        const result = await changePassword(passwordData);
        setPasswordLoading(false);

        if (result.success) {
            toast.success('Password changed successfully');
            setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
        } else {
            toast.error(result.message || 'Failed to change password');
        }
    };

    if (loading && !profile) {
        return (
            <AdminLayout>
                <div className="flex justify-center items-center h-96">
                    <div className="spinner"></div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="admin-profile-container">
                <div className="admin-profile-header">
                    <h1>Admin Profile</h1>
                    <p>Manage your account settings and preferences</p>
                </div>

                <div className="profile-grid">
                    {/* Left Sidebar - Avatar & Basic Info */}
                    <div className="profile-sidebar">
                        <div className="admin-card">
                            <div className="profile-avatar-wrapper">
                                <img
                                    src={formData.profile_img_url || 'https://ui-avatars.com/api/?name=Admin&background=667eea&color=fff'}
                                    alt="Profile"
                                    className="profile-avatar"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = 'https://ui-avatars.com/api/?name=Admin&background=667eea&color=fff';
                                    }}
                                />
                                {isEditing && (
                                    <div className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-lg border border-gray-200 cursor-pointer hover:bg-gray-50">
                                        <Camera size={20} className="text-gray-600" />
                                    </div>
                                )}
                            </div>

                            <div className="profile-info">
                                <h3>{profile?.first_name} {profile?.last_name || 'Admin'}</h3>
                                <div className="role-badge">
                                    Administrator
                                </div>
                                <p className="text-sm text-[var(--admin-text-secondary)]">{profile?.email || user?.email}</p>
                            </div>

                            {/* <div className="profile-stats">
                                <div className="stat-item">
                                    <span className="stat-value">1,234</span>
                                    <span className="stat-label">Actions</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-value">4.5y</span>
                                    <span className="stat-label">Tenure</span>
                                </div>
                            </div> */}
                        </div>
                    </div>

                    {/* Right Content - Forms */}
                    <div className="profile-main">
                        {/* Personal Information */}
                        <div className="admin-card">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="section-title mb-0"><User size={20} /> Personal Information</h2>
                                <button
                                    className={`admin-btn ${isEditing ? 'admin-btn-secondary' : 'admin-btn-primary'}`}
                                    onClick={() => {
                                        if (isEditing) {
                                            // Cancel
                                            if (profile) {
                                                setFormData({
                                                    first_name: profile.first_name || '',
                                                    last_name: profile.last_name || '',
                                                    phone: profile.phone || '',
                                                    gender: profile.gender || '',
                                                    dob: profile.dob ? new Date(profile.dob).toISOString().split('T')[0] : '',
                                                    profile_img_url: profile.profile_img_url || ''
                                                });
                                            }
                                            setIsEditing(false);
                                        } else {
                                            setIsEditing(true);
                                        }
                                    }}
                                >
                                    {isEditing ? 'Cancel' : 'Edit Profile'}
                                </button>
                            </div>

                            <form onSubmit={handleSubmitProfile}>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>First Name</label>
                                        <input
                                            type="text"
                                            name="first_name"
                                            value={formData.first_name}
                                            onChange={handleInputChange}
                                            disabled={!isEditing}
                                            className="admin-input"
                                            placeholder="John"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Last Name</label>
                                        <input
                                            type="text"
                                            name="last_name"
                                            value={formData.last_name}
                                            onChange={handleInputChange}
                                            disabled={!isEditing}
                                            className="admin-input"
                                            placeholder="Doe"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Email</label>
                                        <input
                                            type="email"
                                            value={profile?.email || user?.email || ''}
                                            disabled={true}
                                            className="admin-input bg-gray-100"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Phone</label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleInputChange}
                                            disabled={!isEditing}
                                            className="admin-input"
                                            placeholder="+1 234 567 890"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Gender</label>
                                        <select
                                            name="gender"
                                            value={formData.gender}
                                            onChange={handleInputChange}
                                            disabled={!isEditing}
                                            className="admin-input"
                                        >
                                            <option value="">Select Gender</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Date of Birth</label>
                                        <input
                                            type="date"
                                            name="dob"
                                            value={formData.dob}
                                            onChange={handleInputChange}
                                            disabled={!isEditing}
                                            className="admin-input"
                                        />
                                    </div>
                                    <div className="form-group full-width">
                                        <label>Profile Image URL</label>
                                        <input
                                            type="text"
                                            name="profile_img_url"
                                            value={formData.profile_img_url}
                                            onChange={handleInputChange}
                                            disabled={!isEditing}
                                            className="admin-input"
                                            placeholder="https://example.com/avatar.jpg"
                                        />
                                        {isEditing && <p className="text-xs text-[var(--admin-text-secondary)] mt-1">Enter a direct URL for your profile picture</p>}
                                    </div>
                                </div>

                                {isEditing && (
                                    <div className="mt-6 flex justify-end">
                                        <button
                                            type="submit"
                                            className="admin-btn admin-btn-primary"
                                        >
                                            <Save size={18} /> Save Changes
                                        </button>
                                    </div>
                                )}
                            </form>
                        </div>

                        {/* Security Settings */}
                        <div className="admin-card">
                            <h2 className="section-title"><Shield size={20} /> Security Settings</h2>

                            <form onSubmit={handleSubmitPassword} className="password-section">
                                <div className="form-group mb-4">
                                    <label>Current Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                                        <input
                                            type="password"
                                            name="currentPassword"
                                            value={passwordData.currentPassword}
                                            onChange={handlePasswordChange}
                                            className="admin-input pl-10"
                                            placeholder="••••••••"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="form-grid mb-6">
                                    <div className="form-group">
                                        <label>New Password</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                                            <input
                                                type="password"
                                                name="newPassword"
                                                value={passwordData.newPassword}
                                                onChange={handlePasswordChange}
                                                className="admin-input pl-10"
                                                placeholder="••••••••"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Confirm New Password</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                                            <input
                                                type="password"
                                                name="confirmPassword"
                                                value={passwordData.confirmPassword}
                                                onChange={handlePasswordChange}
                                                className="admin-input pl-10"
                                                placeholder="••••••••"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end">
                                    <button
                                        type="submit"
                                        className="admin-btn admin-btn-primary"
                                        disabled={passwordLoading}
                                    >
                                        {passwordLoading ? 'Updating...' : 'Change Password'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminProfile;
