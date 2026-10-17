import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useProfileContext } from '../../context/ProfileContext';
import { toastSuccess, toastError, toastInfo } from '../../utils/customToast';
import './Profile.css';

const Profile = () => {
    const navigate = useNavigate();
    const { logout, isAuthenticated } = useAuth();
    const { profile, loading, updateProfile, changePassword, fetchProfile, uploadProfileImage } = useProfileContext();
    const [activeTab, setActiveTab] = useState('info'); // 'info' or 'security'
    const [isEditing, setIsEditing] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    // Form States
    const [editData, setEditData] = useState({});
    const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

    useEffect(() => {
        if (!isAuthenticated) navigate('/login');
        if (!profile) fetchProfile();
    }, [isAuthenticated, profile, fetchProfile, navigate]);

    useEffect(() => {
        if (profile) {
            setEditData({
                first_name: profile.first_name || '',
                last_name: profile.last_name || '',
                phone: profile.phone || '',
                gender: profile.gender || '',
                dob: profile.dob || '',
                dob: profile.dob || '',
                profile_img_url: profile.profile_img_url ? `http://localhost:8000${profile.profile_img_url}` : null
            });
        }
    }, [profile]);

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toastError("Please upload an image file");
            return;
        }

        const result = await uploadProfileImage(file);
        if (result.success) {
            toastSuccess("Profile image updated");
        } else {
            toastError(result.message || "Failed to upload image");
        }
    };

    const handleSaveProfile = async () => {
        try {
            await updateProfile(editData);
            setIsEditing(false);
            toastSuccess("Profile updated successfully");
        } catch (error) {
            toastError("Failed to update profile");
        }
    };

    const handleSavePassword = async () => {
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            return toastError("Passwords do not match");
        }
        try {
            await changePassword(passwordData);
            setIsChangingPassword(false);
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            toastSuccess("Password changed successfully");
        } catch (error) {
            toastError("Failed to change password");
        }
    };

    if (loading || !profile) {
        return <div className="profile-page"><div className="profile-loading"><div className="spinner"></div></div></div>;
    }

    return (
        <div className="profile-page">
            <div className="profile-container">

                {/* Header Card */}
                <div className="profile-header-card">
                    <div className="profile-avatar-large">
                        {editData.profile_img_url ? (
                            <img src={editData.profile_img_url} alt="Profile" />
                        ) : (
                            <i className="fas fa-user"></i>
                        )}
                        <label className="camera-overlay">
                            <i className="fas fa-camera"></i>
                            <span style={{ marginLeft: '8px', fontSize: '13px' }}>Change Photo</span>
                            <input
                                type="file"
                                hidden
                                accept="image/*"
                                onChange={handleImageUpload}
                            />
                        </label>
                    </div>
                    <div className="profile-title-section">
                        <h2>{profile.first_name} {profile.last_name}</h2>
                        <div className="profile-email-large">
                            <i className="fas fa-envelope"></i>
                            {profile.email}
                            {profile.is_verified && <i className="fas fa-check-circle" style={{ color: '#22c55e' }}></i>}
                        </div>
                    </div>
                </div>

                {/* Tabs Navigation */}
                <div className="profile-tabs-nav">
                    <button
                        className={`profile-tab-btn ${activeTab === 'info' ? 'active' : ''}`}
                        onClick={() => setActiveTab('info')}
                    >
                        <i className="fas fa-user-circle"></i> Personal Info
                    </button>
                    <button
                        className={`profile-tab-btn ${activeTab === 'security' ? 'active' : ''}`}
                        onClick={() => setActiveTab('security')}
                    >
                        <i className="fas fa-shield-alt"></i> Security
                    </button>
                </div>

                {/* Content Area */}
                <div className="profile-form-card">
                    {activeTab === 'info' && (
                        <>
                            {!isEditing ? (
                                /* Read Only View */
                                <div className="info-display-grid">
                                    <div className="info-item">
                                        <h4>Full Name</h4>
                                        <p>{profile.first_name} {profile.last_name}</p>
                                    </div>
                                    <div className="info-item">
                                        <h4>Email</h4>
                                        <p>{profile.email}</p>
                                    </div>
                                    <div className="info-item">
                                        <h4>Phone</h4>
                                        <p>{profile.phone || 'Not set'}</p>
                                    </div>
                                    <div className="info-item">
                                        <h4>My Gender</h4>
                                        <p>{profile.gender || 'Not specified'}</p>
                                    </div>
                                </div>
                            ) : (
                                /* Edit View */
                                <div className="form-grid-profile">
                                    <div className="profile-input-group">
                                        <label>First Name</label>
                                        <input
                                            value={editData.first_name}
                                            onChange={(e) => setEditData({ ...editData, first_name: e.target.value })}
                                        />
                                    </div>
                                    <div className="profile-input-group">
                                        <label>Last Name</label>
                                        <input
                                            value={editData.last_name}
                                            onChange={(e) => setEditData({ ...editData, last_name: e.target.value })}
                                        />
                                    </div>
                                    <div className="profile-input-group">
                                        <label>Phone</label>
                                        <input
                                            value={editData.phone}
                                            onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                                        />
                                    </div>
                                    <div className="profile-input-group">
                                        <label>Gender</label>
                                        <select
                                            value={editData.gender}
                                            onChange={(e) => setEditData({ ...editData, gender: e.target.value })}
                                        >
                                            <option value="">Select</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                </div>
                            )}

                            <div className="profile-actions-bar">
                                {isEditing ? (
                                    <>
                                        <button className="btn-profile-secondary" onClick={() => setIsEditing(false)}>Cancel</button>
                                        <button className="btn-profile-primary" onClick={handleSaveProfile}>Save Changes</button>
                                    </>
                                ) : (
                                    <button className="btn-profile-primary" onClick={() => setIsEditing(true)}>
                                        Edit Profile
                                    </button>
                                )}
                            </div>
                        </>
                    )}

                    {activeTab === 'security' && (
                        <div className="security-section-content">
                            {!isChangingPassword ? (
                                <div className="info-display-grid">
                                    <div className="info-item">
                                        <h4>Password</h4>
                                        <p>••••••••</p>
                                    </div>
                                    <div className="info-item">
                                        <h4>Actions</h4>
                                        <div className="password-actions">
                                            <button className="btn-profile-secondary" onClick={() => setIsChangingPassword(true)}>
                                                Change Password
                                            </button>
                                            <button
                                                className="btn-link-text forgot-password-link"
                                                onClick={() => navigate('/forgot-password')}
                                            >
                                                Forgot Password?
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="form-grid-profile">
                                    <div className="profile-input-group">
                                        <label>Current Password</label>
                                        <input type="password"
                                            value={passwordData.currentPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                        />
                                    </div>
                                    <div className="profile-input-group">
                                        <label>New Password</label>
                                        <input type="password"
                                            value={passwordData.newPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                        />
                                    </div>
                                    <div className="profile-input-group">
                                        <label>Confirm Password</label>
                                        <input type="password"
                                            value={passwordData.confirmPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                        />
                                    </div>
                                    <div className="profile-actions-bar">
                                        <button className="btn-profile-secondary" onClick={() => setIsChangingPassword(false)}>Cancel</button>
                                        <button className="btn-profile-primary" onClick={handleSavePassword}>Update Password</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Profile;