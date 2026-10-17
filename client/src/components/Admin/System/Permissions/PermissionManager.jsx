import React, { useEffect, useState, useCallback } from 'react';
import { useSystemContext } from '../../../../context/SystemContext';
import {
  FiKey,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiSearch,
  FiFilter,
  FiRefreshCw,
  FiLock,
  FiUnlock,
  FiEye,
  FiEyeOff
} from 'react-icons/fi';
import './PermissionManager.css';
import AdminLayout from '../../../Layout/AdminLayout';

const PermissionManager = () => {
  const {
    fetchAllPermissions,
    createPermission,
    updatePermission,
    deletePermission,
    fetchPermissionUsageSummary,
    permissions,
    loading,
    error,
    clearError
  } = useSystemContext();

  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPermission, setSelectedPermission] = useState(null);
  const [formData, setFormData] = useState({
    permission_name: '',
    description: '',
    category: '',
    is_active: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const loadData = useCallback(async () => {
    try {
      await Promise.all([
        fetchAllPermissions(),
        fetchPermissionUsageSummary()
      ]);
    } catch (err) {
      console.error('Error loading permissions:', err);
    }
  }, [fetchAllPermissions, fetchPermissionUsageSummary]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredPermissions = (permissions.allPermissions || []).filter(permission =>
    permission.permission_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    permission.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    permission.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreate = async () => {
    if (!formData.permission_name.trim()) {
      alert('Permission name is required');
      return;
    }

    setIsSubmitting(true);
    setSuccessMessage('');
    setDeleteError('');

    try {
      const result = await createPermission(formData);
      if (result.success) {
        setSuccessMessage('Permission created successfully!');
        setShowCreateModal(false);
        setFormData({
          permission_name: '',
          description: '',
          category: '',
          is_active: true
        });
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        alert(`Failed to create permission: ${result.message}`);
      }
    } catch (err) {
      console.error('Error creating permission:', err);
      alert('Failed to create permission. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (permission) => {
    setSelectedPermission(permission);
    setFormData({
      permission_name: permission.permission_name || '',
      description: permission.description || '',
      category: permission.category || '',
      is_active: permission.is_active !== undefined ? permission.is_active : true
    });
    setShowEditModal(true);
  };

  const handleUpdate = async () => {
    if (!formData.permission_name.trim()) {
      alert('Permission name is required');
      return;
    }

    if (!selectedPermission) return;

    setIsSubmitting(true);
    setSuccessMessage('');
    setDeleteError('');

    try {
      // Use the correct ID field from selectedPermission
      const permissionId = selectedPermission.id || selectedPermission._id || selectedPermission.permission_id;
      if (!permissionId) {
        alert('Cannot update: Permission ID not found');
        return;
      }

      const result = await updatePermission(permissionId, formData);
      if (result.success) {
        setSuccessMessage('Permission updated successfully!');
        setShowEditModal(false);
        setSelectedPermission(null);
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        alert(`Failed to update permission: ${result.message}`);
      }
    } catch (err) {
      console.error('Error updating permission:', err);
      alert('Failed to update permission. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (permission, permissionName) => {
    // Get the ID from permission object - check multiple possible fields
    const permissionId = permission.id || permission._id || permission.permission_id;

    // Debug logging
    console.log('Permission object:', permission);
    console.log('Extracted permissionId:', permissionId);

    if (!permissionId) {
      alert('Cannot delete: Permission ID not found');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete permission "${permissionName}"? This action cannot be undone.`)) {
      return;
    }

    setDeleteError('');
    setIsDeleting(true);
    setDeletingId(permissionId);

    try {
      const result = await deletePermission(permissionId);

      if (result.success) {
        setSuccessMessage(`Permission "${permissionName}" deleted successfully!`);
        setTimeout(() => setSuccessMessage(''), 3000);
        // Refresh the data
        await loadData();
      } else {
        let errorMsg = result.message || 'Failed to delete permission';

        if (result.data?.detail) {
          if (Array.isArray(result.data.detail)) {
            errorMsg = result.data.detail.map(d => d.msg || d.message).join(', ');
          } else if (typeof result.data.detail === 'string') {
            errorMsg = result.data.detail;
          }
        }

        setDeleteError(errorMsg);
        console.error('Delete permission error from context:', result);
      }
    } catch (err) {
      console.error('Error deleting permission:', err);

      let errorMessage = 'Failed to delete permission. Please try again.';

      if (err.response?.data) {
        const errorData = err.response.data;

        if (errorData.detail) {
          if (Array.isArray(errorData.detail)) {
            errorMessage = errorData.detail.map(d => {
              if (typeof d === 'string') return d;
              if (typeof d === 'object') return d.msg || d.message || JSON.stringify(d);
              return String(d);
            }).join(', ');
          } else if (typeof errorData.detail === 'string') {
            errorMessage = errorData.detail;
          } else if (typeof errorData.detail === 'object') {
            errorMessage = errorData.detail.message || errorData.detail.msg || JSON.stringify(errorData.detail);
          }
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (typeof errorData === 'string') {
          errorMessage = errorData;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }

      setDeleteError(errorMessage);
      alert(`Delete failed: ${errorMessage}`);
    } finally {
      setIsDeleting(false);
      setDeletingId(null);
    }
  };

  const refreshData = () => {
    loadData();
  };

  const formatErrorMessage = (error) => {
    if (!error) return '';

    if (typeof error === 'string') return error;

    if (typeof error === 'object') {
      if (error.detail) {
        if (Array.isArray(error.detail)) {
          return error.detail.map(d => {
            if (typeof d === 'string') return d;
            if (typeof d === 'object') return d.msg || d.message || JSON.stringify(d);
            return String(d);
          }).join(', ');
        } else if (typeof error.detail === 'string') {
          return error.detail;
        }
      }
      if (error.message) return error.message;
      return JSON.stringify(error);
    }

    return String(error);
  };

  // Get unique key for each permission
  const getPermissionKey = (permission, index) => {
    // Try multiple possible ID fields
    const id = permission.id || permission._id || permission.permission_id;
    if (id) {
      return `permission-${id}`;
    }
    // Fallback to index if no ID found
    return `permission-index-${index}`;
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--admin-text-primary)]">Permission Management</h1>
            <p className="text-[var(--admin-text-secondary)] mt-1">Create, update, and manage system permissions</p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={refreshData}
              disabled={loading}
              className="admin-btn admin-btn-secondary flex items-center gap-2"
            >
              <FiRefreshCw className={`${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="admin-btn admin-btn-primary flex items-center gap-2"
            >
              <FiPlus />
              Create Permission
            </button>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex justify-between items-center">
              <div className="flex items-center gap-2">
                <FiLock className="text-red-500" />
                <span>{formatErrorMessage(error)}</span>
              </div>
              <button onClick={clearError} className="hover:bg-red-100 p-1 rounded text-sm">
                Dismiss
              </button>
            </div>
          )}

          {deleteError && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex justify-between items-center">
              <div className="flex items-center gap-2">
                <FiTrash2 className="text-red-500" />
                <span>{formatErrorMessage(deleteError)}</span>
              </div>
              <button onClick={() => setDeleteError('')} className="hover:bg-red-100 p-1 rounded text-sm">
                Dismiss
              </button>
            </div>
          )}

          {successMessage && (
            <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg flex items-center gap-2">
              <FiKey className="text-green-500" />
              <span>{successMessage}</span>
            </div>
          )}
        </div>

        {/* Search and Table */}
        <div className="admin-card">
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <h3 className="text-lg font-bold text-[var(--admin-text-primary)]">Permissions</h3>
            <div className="relative w-full md:w-64">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--admin-text-secondary)]" />
              <input
                type="text"
                placeholder="Search permissions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="admin-input pl-10"
              />
            </div>
          </div>

          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Permission</th>
                  <th>Description</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Usage</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="text-center py-12">
                      <div className="spinner mx-auto"></div>
                    </td>
                  </tr>
                ) : filteredPermissions.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-12 text-[var(--admin-text-muted)]">
                      {searchTerm ? 'No permissions found matching your search' : 'No permissions found'}
                    </td>
                  </tr>
                ) : (
                  filteredPermissions.map((permission, index) => {
                    const usage = (permissions.permissionUsageSummary || []).find(
                      u => u.permission_id === (permission.id || permission._id || permission.permission_id)
                    );

                    return (
                      <tr key={getPermissionKey(permission, index)}>
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[var(--admin-bg-hover)] text-[var(--admin-text-primary)] flex items-center justify-center">
                              <FiKey size={14} />
                            </div>
                            <div>
                              <h4 className="font-medium text-[var(--admin-text-primary)]">{permission.permission_name || 'Unnamed Permission'}</h4>
                              <p className="text-xs text-[var(--admin-text-secondary)]">ID: {permission.id || permission._id || permission.permission_id || 'N/A'}</p>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="text-sm text-[var(--admin-text-secondary)] max-w-xs truncate" title={permission.description}>
                            {permission.description || 'No description'}
                          </div>
                        </td>
                        <td>
                          {permission.category && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full font-medium border border-gray-200">
                              {permission.category}
                            </span>
                          )}
                        </td>
                        <td>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${permission.is_active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                            }`}>
                            {permission.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>
                          {usage ? (
                            <div className="flex gap-2 text-xs">
                              <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-100">{usage.role_count || 0} roles</span>
                              <span className="bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded border border-purple-100">{usage.user_count || 0} users</span>
                            </div>
                          ) : (
                            <span className="text-xs text-[var(--admin-text-secondary)] italic">No usage data</span>
                          )}
                        </td>
                        <td>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(permission)}
                              disabled={isDeleting || loading}
                              className="admin-btn admin-btn-secondary p-1.5"
                              title="Edit permission"
                            >
                              <FiEdit2 size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(permission, permission.permission_name)}
                              disabled={isDeleting && deletingId === (permission.id || permission._id || permission.permission_id)}
                              className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded border border-red-200 transition-colors"
                              title="Delete permission"
                            >
                              {isDeleting && deletingId === (permission.id || permission._id || permission.permission_id) ? (
                                <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-red-600"></div>
                              ) : (
                                <FiTrash2 size={14} />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create Permission Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden animate-scale-in">
              <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                <h3 className="font-bold text-lg text-gray-800">Create New Permission</h3>
                <button onClick={() => setShowCreateModal(false)} className="text-gray-500 hover:text-gray-700">×</button>
              </div>
              <div className="p-6">
                <form className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Permission Name <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={formData.permission_name}
                      onChange={(e) => setFormData({ ...formData, permission_name: e.target.value })}
                      placeholder="e.g., users.create"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Describe what this permission allows"
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      placeholder="e.g., Users, Settings, Reports"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                      disabled={isSubmitting}
                    />
                    <label htmlFor="is_active" className="text-sm text-gray-700">
                      Active (permission will be available immediately)
                    </label>
                  </div>
                </form>
              </div>
              <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 ml-auto"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={isSubmitting || !formData.permission_name.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : 'Create Permission'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Permission Modal */}
        {showEditModal && selectedPermission && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden animate-scale-in">
              <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                <h3 className="font-bold text-lg text-gray-800">Edit Permission</h3>
                <p className="text-xs text-gray-500">ID: {selectedPermission.id || selectedPermission._id || selectedPermission.permission_id || 'N/A'}</p>
              </div>
              <div className="p-6">
                <form className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Permission Name <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={formData.permission_name}
                      onChange={(e) => setFormData({ ...formData, permission_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="edit_is_active"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                      disabled={isSubmitting}
                    />
                    <label htmlFor="edit_is_active" className="text-sm text-gray-700">Active</label>
                  </div>
                </form>
              </div>
              <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedPermission(null);
                  }}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 ml-auto"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdate}
                  disabled={isSubmitting || !formData.permission_name.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Updating...' : 'Update Permission'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default PermissionManager;