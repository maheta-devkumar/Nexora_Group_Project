import React, { useEffect, useState, useCallback } from 'react';
import { useSystemContext } from '../../../../context/SystemContext';
import { 
  FiUsers, 
  FiKey, 
  FiLink, 
  FiTrash2,
  FiSearch,
  FiRefreshCw,
  FiCheck,
  FiX
} from 'react-icons/fi';
import './RolePermissionsView.css';

const RolePermissionsView = () => {
  const {
    fetchAllPermissions,
    fetchPermissionUsageSummary,
    assignPermissionToRole,
    removePermissionFromRole,
    fetchPermissionsByRole,
    fetchRolesByPermission,
    permissions,
    rolePermissions,
    loading,
    error,
    clearError
  } = useSystemContext();

  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [selectedPermissionId, setSelectedPermissionId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleSearch, setRoleSearch] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

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

  const handleAssignPermission = async () => {
    if (!selectedRoleId || !selectedPermissionId) {
      alert('Please select both a role and a permission');
      return;
    }

    setIsAssigning(true);
    setSuccessMessage('');

    try {
      const result = await assignPermissionToRole(parseInt(selectedRoleId), parseInt(selectedPermissionId));
      if (result.success) {
        setSuccessMessage('Permission assigned to role successfully!');
        // Refresh the permissions for this role
        await fetchPermissionsByRole(parseInt(selectedRoleId));
        await fetchRolesByPermission(parseInt(selectedPermissionId));
        setSelectedRoleId('');
        setSelectedPermissionId('');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        alert(`Failed to assign permission: ${result.message}`);
      }
    } catch (err) {
      console.error('Error assigning permission:', err);
      alert('Failed to assign permission. Please try again.');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleRemovePermission = async (roleId, permissionId) => {
    if (window.confirm('Are you sure you want to remove this permission from the role?')) {
      try {
        const result = await removePermissionFromRole(roleId, permissionId);
        if (result.success) {
          await fetchPermissionsByRole(roleId);
          await fetchRolesByPermission(permissionId);
          setSuccessMessage('Permission removed from role successfully!');
          setTimeout(() => setSuccessMessage(''), 3000);
        } else {
          alert(`Failed to remove permission: ${result.message}`);
        }
      } catch (err) {
        console.error('Error removing permission:', err);
        alert('Failed to remove permission. Please try again.');
      }
    }
  };

  const loadRolePermissions = async (roleId) => {
    if (!roleId) return;
    setSelectedRoleId(roleId);
    try {
      await fetchPermissionsByRole(parseInt(roleId));
    } catch (err) {
      console.error('Error loading role permissions:', err);
    }
  };

  const loadPermissionRoles = async (permissionId) => {
    if (!permissionId) return;
    setSelectedPermissionId(permissionId);
    try {
      await fetchRolesByPermission(parseInt(permissionId));
    } catch (err) {
      console.error('Error loading permission roles:', err);
    }
  };

  const filteredPermissions = (permissions.allPermissions || []).filter(permission => 
    permission.permission_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    permission.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const usageSummary = permissions.permissionUsageSummary || [];

  const permissionsByRole = rolePermissions.permissionsByRole[selectedRoleId] || [];
  const rolesByPermission = rolePermissions.rolesByPermission[selectedPermissionId] || [];

  return (
    <div className="role-permissions-container">
      {/* Header */}
      <div className="role-permissions-header">
        <div>
          <h1>Role-Permission Mapping</h1>
          <p>Manage which permissions are assigned to which roles</p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          <FiRefreshCw className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="role-permissions-messages">
        {error && (
          <div className="role-permissions-error">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FiKey className="text-red-500 mr-2" />
                <span>{error}</span>
              </div>
              <button onClick={clearError} className="text-red-600 hover:text-red-800">
                Dismiss
              </button>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="role-permissions-success">
            <FiLink className="text-green-500" />
            <span>{successMessage}</span>
          </div>
        )}
      </div>

      {/* Assignment Interface */}
      <div className="role-permissions-assignment">
        <h3>Assign Permission to Role</h3>
        
        <div className="role-permissions-selection">
          {/* Role Selection */}
          <div className="role-permissions-select-group">
            <label>Select Role</label>
            <div className="space-y-3">
              <input
                type="number"
                placeholder="Enter role ID..."
                value={selectedRoleId}
                onChange={(e) => setSelectedRoleId(e.target.value)}
                className="role-permissions-input"
              />
              <div className="role-permissions-input-info">
                <p>Enter a role ID to view and manage its permissions.</p>
                <p>Common roles: 1 (Admin), 2 (Manager), 3 (User)</p>
              </div>
              {selectedRoleId && (
                <div className="role-permissions-input-actions">
                  <button
                    onClick={() => loadRolePermissions(selectedRoleId)}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    Load Role Permissions
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Permission Selection */}
          <div className="role-permissions-select-group">
            <label>Select Permission</label>
            <div className="space-y-3">
              <input
                type="number"
                placeholder="Enter permission ID..."
                value={selectedPermissionId}
                onChange={(e) => setSelectedPermissionId(e.target.value)}
                className="role-permissions-input"
              />
              <div className="role-permissions-input-info">
                <p>Enter a permission ID to view which roles have it.</p>
              </div>
              {selectedPermissionId && (
                <div className="role-permissions-input-actions">
                  <button
                    onClick={() => loadPermissionRoles(selectedPermissionId)}
                    disabled={loading}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
                  >
                    Load Permission Roles
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Assign Button */}
        {selectedRoleId && selectedPermissionId && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={handleAssignPermission}
              disabled={loading || isAssigning}
              className={`role-permissions-assign-btn ${isAssigning ? 'loading' : ''}`}
            >
              <FiLink className="icon" />
              {isAssigning ? 'Assigning...' : 'Assign Permission to Role'}
            </button>
          </div>
        )}
      </div>

      {/* Role Permissions Display */}
      {selectedRoleId && permissionsByRole.length > 0 && (
        <div className="role-permissions-listing">
          <div className="role-permissions-listing-header">
            <h3>Permissions for Role ID: {selectedRoleId}</h3>
            <span className="role-permissions-listing-count blue">
              {permissionsByRole.length} permission{permissionsByRole.length !== 1 ? 's' : ''}
            </span>
          </div>
          
          <ul className="role-permissions-listing-items">
            {permissionsByRole.map((permission, index) => (
              <li key={index} className="role-permissions-listing-item">
                <div className="role-permissions-listing-content">
                  <div className="role-permissions-listing-info">
                    <div className="role-permissions-listing-icon blue">
                      <FiKey />
                    </div>
                    <div className="role-permissions-listing-details">
                      <h4>{permission.permission_name || 'Unnamed Permission'}</h4>
                      <p>{permission.description || 'No description'}</p>
                    </div>
                  </div>
                  <div className="role-permissions-listing-meta">
                    <span className={`role-permissions-listing-status ${permission.is_active ? 'active' : 'inactive'}`}>
                      {permission.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <button
                      onClick={() => handleRemovePermission(selectedRoleId, permission.id)}
                      className="role-permissions-listing-action"
                      title="Remove permission from role"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Permission Roles Display */}
      {selectedPermissionId && rolesByPermission.length > 0 && (
        <div className="role-permissions-listing">
          <div className="role-permissions-listing-header">
            <h3>Roles with Permission ID: {selectedPermissionId}</h3>
            <span className="role-permissions-listing-count purple">
              {rolesByPermission.length} role{rolesByPermission.length !== 1 ? 's' : ''}
            </span>
          </div>
          
          <ul className="role-permissions-listing-items">
            {rolesByPermission.map((role, index) => (
              <li key={index} className="role-permissions-listing-item">
                <div className="role-permissions-listing-content">
                  <div className="role-permissions-listing-info">
                    <div className="role-permissions-listing-icon purple">
                      <FiUsers />
                    </div>
                    <div className="role-permissions-listing-details">
                      <h4>Role ID: {role.role_id}</h4>
                      <p>{role.role_name || 'Unnamed Role'}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemovePermission(role.role_id, selectedPermissionId)}
                    className="role-permissions-listing-action"
                    title="Remove permission from role"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* All Permissions with Usage */}
      <div className="role-permissions-table-container">
        <div className="role-permissions-table-header">
          <h3>All Permissions</h3>
          <div className="role-permissions-search">
            <FiSearch className="icon" />
            <input
              type="text"
              placeholder="Search permissions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="role-permissions-table">
            <thead>
              <tr>
                <th>Permission</th>
                <th>Assigned to Roles</th>
                <th>Users with Access</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPermissions.map((permission) => {
                const usage = usageSummary.find(u => u.permission_id === permission.id);
                
                return (
                  <tr key={permission.id}>
                    <td>
                      <div>
                        <div className="font-medium text-gray-900">
                          {permission.permission_name || 'Unnamed Permission'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {permission.description || 'No description'}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="role-permissions-table-stats">
                        {usage ? (
                          <div className="role-permissions-table-stat">
                            <span className="value">{usage.role_count || 0}</span>
                            <span className="label">roles</span>
                          </div>
                        ) : (
                          <span className="text-gray-500">No data</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="role-permissions-table-stats">
                        {usage ? (
                          <div className="role-permissions-table-stat">
                            <span className="value">{usage.user_count || 0}</span>
                            <span className="label">users</span>
                          </div>
                        ) : (
                          <span className="text-gray-500">No data</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <button
                        onClick={() => loadPermissionRoles(permission.id)}
                        className="role-permissions-table-action"
                      >
                        <FiUsers />
                        View Roles
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RolePermissionsView;