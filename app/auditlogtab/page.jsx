"use client";

import React, { useState, useMemo } from 'react';
import { FileText, Filter, Download, Search, ChevronDown, ChevronUp, User, Calendar, CalendarDays } from 'lucide-react';

const AuditLogTab = ({ auditLogs = [], currentUser = null }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortOrder, setSortOrder] = useState('desc');
  const [expandedLog, setExpandedLog] = useState(null);
  const [dateFilter, setDateFilter] = useState('all');
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');

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
      
      // Date filtering
      const logDate = new Date(log.created_at);
      let matchesDate = true;
      
      if (dateFilter === 'today') {
        const today = new Date();
        matchesDate = logDate.toDateString() === today.toDateString();
      } else if (dateFilter === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        matchesDate = logDate >= weekAgo;
      } else if (dateFilter === 'month') {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        matchesDate = logDate >= monthAgo;
      } else if (dateFilter === 'custom') {
        if (customDateFrom && customDateTo) {
          // Validate date range
          if (customDateFrom > customDateTo) {
            matchesDate = false; // Invalid range, show no results
          } else {
            const fromDate = new Date(customDateFrom);
            const toDate = new Date(customDateTo);
            fromDate.setHours(0, 0, 0, 0); // Start of day
            toDate.setHours(23, 59, 59, 999); // End of day
            matchesDate = logDate >= fromDate && logDate <= toDate;
          }
        } else if (customDateFrom && !customDateTo) {
          const fromDate = new Date(customDateFrom);
          fromDate.setHours(0, 0, 0, 0); // Start of day
          matchesDate = logDate >= fromDate;
        } else if (!customDateFrom && customDateTo) {
          const toDate = new Date(customDateTo);
          toDate.setHours(23, 59, 59, 999); // End of day
          matchesDate = logDate <= toDate;
        }
        // If both are empty, show all (matchesDate stays true)
      }
      
      return matchesSearch && matchesFilter && matchesDate;
    });

    return filtered.sort((a, b) => {
      const dateA = new Date(a.created_at);
      const dateB = new Date(b.created_at);
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });
  }, [auditLogs, searchTerm, filterType, sortOrder, dateFilter, customDateFrom, customDateTo]);

  // Get badge color based on action type (with dark mode support)
  const getBadgeColor = (action) => {
    const actionLower = action.toLowerCase();
    if (actionLower.includes('delete') || actionLower.includes('remove')) 
      return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200';
    if (actionLower.includes('create') || actionLower.includes('add')) 
      return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200';
    if (actionLower.includes('update') || actionLower.includes('edit')) 
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200';
    if (actionLower.includes('login') || actionLower.includes('auth')) 
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200';
    return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
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
    <div className="space-y-6 min-h-screen bg-white dark:bg-gray-900 p-6">


      {/* User Info Card */}
      {currentUser && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border-l-4 border-blue-500 dark:border-blue-400">
          <div className="flex items-start gap-4">
            <div className="bg-blue-100 dark:bg-blue-900/50 rounded-full p-3">
              <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Your Activity Profile</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">User ID</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{currentUser.id || currentUser.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Last Activity</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
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
                    <p className="text-sm text-gray-600 dark:text-gray-400">Name</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{currentUser.name}</p>
                  </div>
                )}
                {currentUser.role && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Role</p>
                    <p className="font-medium capitalize text-gray-900 dark:text-gray-100">{currentUser.role}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Logs Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">My Activity Log</h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Your complete activity history</p>
            </div>
            <button
              onClick={exportLogs}
              disabled={filteredLogs.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
              <input
                type="text"
                placeholder="Search your activities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>

            {/* Entity Type Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {entityTypes.map(type => (
                  <option key={type} value={type}>
                    {type === 'all' ? 'All Types' : type}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Filter */}
            <div className="relative">
              <CalendarDays className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">All Dates</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            {/* Sort Order */}
            <button
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {sortOrder === 'desc' ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              {sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}
            </button>
          </div>

          {/* Custom Date Range */}
          {dateFilter === 'custom' && (
            <div className="mt-4 space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Select date range to filter activities. Leave fields empty to show all dates from/to that point.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">From Date (optional)</label>
                  <input
                    type="date"
                    value={customDateFrom}
                    onChange={(e) => setCustomDateFrom(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Select start date"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">To Date (optional)</label>
                  <input
                    type="date"
                    value={customDateTo}
                    onChange={(e) => setCustomDateTo(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Select end date"
                  />
                </div>
              </div>
              {customDateFrom && customDateTo && customDateFrom > customDateTo && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  ⚠️ Start date cannot be later than end date
                </p>
              )}
            </div>
          )}

          {/* Clear Filters and Results count */}
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Showing {filteredLogs.length} of {auditLogs.length} activities
              {(searchTerm || filterType !== 'all' || dateFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilterType('all');
                    setDateFilter('all');
                    setCustomDateFrom('');
                    setCustomDateTo('');
                  }}
                  className="ml-3 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline text-xs"
                >
                  Clear all filters
                </button>
              )}
            </div>
            {dateFilter === 'custom' && (customDateFrom || customDateTo) && (
              <button
                onClick={() => {
                  setCustomDateFrom('');
                  setCustomDateTo('');
                }}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 underline"
              >
                Clear date range
              </button>
            )}
          </div>
        </div>

        <div className="p-6">
          <div className="space-y-3">
            {filteredLogs.length > 0 ? (
              filteredLogs.map((log) => (
                <div key={log.id} className="border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md dark:hover:shadow-xl transition bg-white dark:bg-gray-700/50">
                  <div 
                    className="p-4 cursor-pointer"
                    onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{log.action}</h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getBadgeColor(log.action)}`}>
                            {log.entity_type}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
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
                      <button className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
                        {expandedLog === log.id ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                    
                    {expandedLog === log.id && log.details && (
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Details:</p>
                        <pre className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 p-3 rounded overflow-x-auto whitespace-pre-wrap">
                          {typeof log.details === 'string' ? log.details : JSON.stringify(log.details, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-16">
                <FileText className="mx-auto h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {searchTerm || filterType !== 'all' ? 'No matching activities found' : 'No activities yet'}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
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