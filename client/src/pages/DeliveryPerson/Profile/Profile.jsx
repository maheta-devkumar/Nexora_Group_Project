import React, { useEffect } from 'react';
import { useDeliveryProfileContext } from '../../../context/delivery_panel/DeliveryProfileContext';
import DeliveryLayout from '../../../components/DeliveryPerson/Layout/DeliveryLayout';
import ProfileDetails from '../../../components/DeliveryPerson/Profile/ProfileDetails';
import DocumentsSection from '../../../components/DeliveryPerson/Profile/DocumentsSection';
import PasswordChange from '../../../components/DeliveryPerson/Profile/PasswordChange';
import './Profile.css';
import { toast } from 'react-toastify';

const Profile = () => {
    const {
        fetchAllProfileData,
        profileOverview,
        personalInfo,
        verificationStatus,
        profileStatistics,
        quickStats,
        loading,
        error,
        clearError
    } = useDeliveryProfileContext();

    useEffect(() => {
        fetchAllProfileData();
    }, [fetchAllProfileData]);

    // Function to combine first and last name
    const getFullName = () => {
        if (!personalInfo) return 'Delivery Partner';

        const firstName = personalInfo.first_name || '';
        const lastName = personalInfo.last_name || '';

        // Combine first and last name, trim extra spaces
        const fullName = `${firstName} ${lastName}`.trim();

        // If no name is available, return default
        return fullName || 'Delivery Partner';
    };

    // Function to get initials for avatar fallback
    const getInitials = () => {
        const fullName = getFullName();
        if (fullName === 'Delivery Partner') return 'DP';

        // Get first letters of first and last name
        const names = fullName.split(' ');
        if (names.length >= 2) {
            return `${names[0].charAt(0)}${names[1].charAt(0)}`.toUpperCase();
        }
        return fullName.charAt(0).toUpperCase();
    };



    const handleEditProfile = () => {
        // Implementation for edit profile
        console.log('Edit profile clicked');
        toast.info("Edit profile functionality coming soon");
    };

    const handleAvatarEdit = async (file) => {
        // Implementation for avatar edit
        console.log('Avatar edit:', file);
        // Here you would call uploadProfileImage from context
        // await uploadProfileImage(file);
        toast.info("Avatar upload functionality coming soon");
    };

    if (loading && !profileOverview) {
        return (
            <DeliveryLayout>
                <div className="profile-loading">
                    <div className="loading-spinner"></div>
                    <p>Loading profile...</p>
                </div>
            </DeliveryLayout>
        );
    }

    const fullName = getFullName();
    const initials = getInitials();

    return (
        <DeliveryLayout>
            <div className="profile-page">
                {/* Page Header */}
                <div className="page-header">
                    <h2>My Profile</h2>
                    <button className="btn-primary" onClick={handleEditProfile}>
                        <i data-lucide="edit"></i>
                        Edit Profile
                    </button>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="error-alert">
                        <i data-lucide="alert-circle"></i>
                        <span>{typeof error === 'string' ? error : JSON.stringify(error)}</span>
                        <button onClick={clearError} className="close-error">
                            <i data-lucide="x"></i>
                        </button>
                    </div>
                )}

                {/* Profile Overview */}
                <div className="profile-overview">
                    <div className="profile-card">
                        <div className="profile-header">
                            <div className="profile-avatar">
                                <img
                                    src={profileOverview?.image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=3b82f6&color=fff&size=120`}
                                    alt="Profile"
                                    onError={(e) => {
                                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=3b82f6&color=fff&size=120`;
                                    }}
                                />
                                <button className="avatar-edit" onClick={() => document.getElementById('avatarInput')?.click()}>
                                    <i data-lucide="camera"></i>
                                </button>
                                <input
                                    type="file"
                                    id="avatarInput"
                                    accept="image/*"
                                    style={{ display: 'none' }}
                                    onChange={(e) => {
                                        if (e.target.files[0]) {
                                            handleAvatarEdit(e.target.files[0]);
                                        }
                                    }}
                                />
                            </div>
                            <div className="profile-info">
                                <h3>{fullName}</h3>
                                <span className="profile-role">Delivery Partner</span>
                                <div className="profile-stats">
                                    <div className="profile-stat">
                                        <strong>{profileStatistics?.total_deliveries || 0}</strong>
                                        <span>Deliveries</span>
                                    </div>
                                    <div className="profile-stat">
                                        <strong>{quickStats?.rating || '4.8'}</strong>
                                        <span>Rating</span>
                                    </div>
                                    <div className="profile-stat">
                                        <strong>{profileStatistics?.on_time_rate || '92%'}</strong>
                                        <span>On-time</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Personal Information */}
                <ProfileDetails
                    personalInfo={personalInfo}
                    joiningDate={profileOverview?.joined_at}
                    loading={loading}
                    getFullName={getFullName}
                />

                {/* Documents & Verification */}
                <DocumentsSection
                    verificationStatus={verificationStatus}
                    loading={loading}
                />

                {/* Password Change Section */}
                <PasswordChange
                    loading={loading}
                />

                {/* Account Settings Section (from HTML) */}
                <div className="settings-card">
                    <div className="card-header">
                        <h3>Account Settings</h3>
                    </div>
                    <div className="settings-list">
                        <div className="setting-item">
                            <div className="setting-info">
                                <i data-lucide="shield"></i>
                                <div>
                                    <strong>Change Password</strong>
                                    <span>Update your account password</span>
                                </div>
                            </div>
                            <button className="btn-text">
                                <i data-lucide="chevron-right"></i>
                            </button>
                        </div>

                        <div className="setting-item">
                            <div className="setting-info">
                                <i data-lucide="bell"></i>
                                <div>
                                    <strong>Notification Settings</strong>
                                    <span>Manage your notification preferences</span>
                                </div>
                            </div>
                            <button className="btn-text">
                                <i data-lucide="chevron-right"></i>
                            </button>
                        </div>

                        <div className="setting-item">
                            <div className="setting-info">
                                <i data-lucide="globe"></i>
                                <div>
                                    <strong>Language</strong>
                                    <span>English (US)</span>
                                </div>
                            </div>
                            <button className="btn-text">
                                <i data-lucide="chevron-right"></i>
                            </button>
                        </div>

                        <div className="setting-item">
                            <div className="setting-info">
                                <i data-lucide="moon"></i>
                                <div>
                                    <strong>Dark Mode</strong>
                                    <span>Switch between light and dark theme</span>
                                </div>
                            </div>
                            <div className="toggle-switch">
                                <input type="checkbox" id="darkModeToggle" />
                                <label htmlFor="darkModeToggle" className="toggle-slider"></label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DeliveryLayout>
    );
};

export default Profile;