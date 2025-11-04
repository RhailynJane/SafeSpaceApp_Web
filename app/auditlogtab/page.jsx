import React, { useState, useMemo } from 'react';
import { FileText, Filter, Download, Search, ChevronDown, ChevronUp, User, Calendar, Activity, Shield } from 'lucide-react';

const AuditLogTab = ({ auditLogs = [], currentUser = null }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortOrder, setSortOrder] = useState('desc');
  const [expandedLog, setExpandedLog] = useState(null);

  // Get unique entity types for filter
  const entityTypes = useMemo(() => {
    const types = new Set(auditLogs.map(log => log.entity_type));
    return ['all', ...Array.from(types)];
  }, [auditLogs]);

  // Calculate user statistics
  const userStats = useMemo(() => {
    const stats = {
      totalActions: auditLogs.length,
      creates: 0,
      updates: 0,
      deletes: 0,
      logins: 0,
      lastActivity: null
    };

    auditLogs.forEach(log => {
      const action = log.action.toLowerCase();
      if (action.includes('create') || action.includes('add')) stats.creates++;
      if (action.includes('update') || action.includes('edit') || action.includes('modify')) stats.updates++;
      if (action.includes('delete') || action.includes('remove')) stats.deletes++;
      if (action.includes('login') || action.includes('signin')) stats.logins++;
    });

    if (auditLogs.length > 0) {
      const sortedByDate = [...auditLogs].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      stats.lastActivity = sortedByDate[0].created_at;
    }

    return stats;
  }, [auditLogs]);

  // Filter and sort logs
  const filteredLogs = useMemo(() => {
    let filtered = auditLogs.filter(log => {
      const matchesSearch = 
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.entity_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFilter = filterType === 'all' || log.entity_type === filterType;
      
      return matchesSearch && matchesFilter;
    });

    return filtered.sort((a, b) => {
      const dateA = new Date(a.created_at);
      const dateB = new Date(b.created_at);
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });
  }, [auditLogs, searchTerm, filterType, sortOrder]);

  // Get badge color based on action type
  const getBadgeColor = (action) => {
    const actionLower = action.toLowerCase();
    if (actionLower.includes('delete') || actionLower.includes('remove')) return 'bg-red-100 text-red-800';
    if (actionLower.includes('create') || actionLower.includes('add')) return 'bg-green-100 text-green-800';
    if (actionLower.includes('update') || actionLower.includes('edit')) return 'bg-blue-100 text-blue-800';
    if (actionLower.includes('login') || actionLower.includes('auth')) return 'bg-purple-100 text-purple-800';
    return 'bg-gray-100 text-gray-800';
  };

  const exportLogs = () => {
    const csv = [
      ['Timestamp', 'User', 'Action', 'Entity Type', 'Details'],
      ...filteredLogs.map(log => [
        new Date(log.created_at).toISOString(),
        log.actor_id,
        log.action,
        log.entity_type,
        log.details || ''
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `my-activity-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* User Activity Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-4 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Activities</p>
              <p className="text-3xl font-bold mt-1">{userStats.totalActions}</p>
            </div>
            <Activity className="w-10 h-10 text-blue-200 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-4 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Created</p>
              <p className="text-3xl font-bold mt-1">{userStats.creates}</p>
            </div>
            <ChevronUp className="w-10 h-10 text-green-200 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white rounded-lg p-4 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm">Updated</p>
              <p className="text-3xl font-bold mt-1">{userStats.updates}</p>
            </div>
            <Filter className="w-10 h-10 text-yellow-200 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 text-white rounded-lg p-4 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm">Deleted</p>
              <p className="text-3xl font-bold mt-1">{userStats.deletes}</p>
            </div>
            <ChevronDown className="w-10 h-10 text-red-200 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg p-4 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Logins</p>
              <p className="text-3xl font-bold mt-1">{userStats.logins}</p>
            </div>
            <Shield className="w-10 h-10 text-purple-200 opacity-80" />
          </div>
        </div>
      </div>

      {/* User Info Card */}
      {currentUser && (
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <div className="flex items-start gap-4">
            <div className="bg-blue-100 rounded-full p-3">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">Your Activity Profile</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                <div>
                  <p className="text-sm text-gray-600">User ID</p>
                  <p className="font-medium">{currentUser.id || currentUser.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Last Activity</p>
                  <p className="font-medium">
                    {userStats.lastActivity 
                      ? new Date(userStats.lastActivity).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : 'No activity yet'}
                  </p>
                </div>
                {currentUser.name && (
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-medium">{currentUser.name}</p>
                  </div>
                )}
                {currentUser.role && (
                  <div>
                    <p className="text-sm text-gray-600">Role</p>
                    <p className="font-medium capitalize">{currentUser.role}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Logs Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold">My Activity Log</h2>
              <p className="text-gray-600 mt-1">Your complete activity history</p>
            </div>
            <button
              onClick={exportLogs}
              disabled={filteredLogs.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search your activities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Entity Type Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
              >
                {entityTypes.map(type => (
                  <option key={type} value={type}>
                    {type === 'all' ? 'All Types' : type}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Order */}
            <button
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              className="flex items-center justify-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 transition"
            >
              {sortOrder === 'desc' ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              {sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}
            </button>
          </div>

          {/* Results count */}
          <div className="mt-4 text-sm text-gray-600">
            Showing {filteredLogs.length} of {auditLogs.length} activities
          </div>
        </div>

        <div className="p-6">
          <div className="space-y-3">
            {filteredLogs.length > 0 ? (
              filteredLogs.map((log) => (
                <div key={log.id} className="border rounded-lg hover:shadow-md transition">
                  <div 
                    className="p-4 cursor-pointer"
                    onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{log.action}</h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getBadgeColor(log.action)}`}>
                            {log.entity_type}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(log.created_at).toLocaleString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                          })}</span>
                        </div>
                      </div>
                      <button className="text-gray-400 hover:text-gray-600">
                        {expandedLog === log.id ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                    
                    {expandedLog === log.id && log.details && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-sm font-medium text-gray-700 mb-2">Details:</p>
                        <pre className="text-sm text-gray-600 bg-gray-50 p-3 rounded overflow-x-auto whitespace-pre-wrap">
                          {typeof log.details === 'string' ? log.details : JSON.stringify(log.details, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-16">
                <FileText className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm || filterType !== 'all' ? 'No matching activities found' : 'No activities yet'}
                </h3>
                <p className="text-sm text-gray-500">
                  {searchTerm || filterType !== 'all' 
                    ? 'Try adjusting your filters or search terms' 
                    : 'Your activities will appear here as you use the system'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditLogTab;