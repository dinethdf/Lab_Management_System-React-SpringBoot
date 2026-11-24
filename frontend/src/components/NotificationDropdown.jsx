import React, { useState, useEffect, useRef } from 'react';
import { Bell, AlertTriangle, CheckCircle, XCircle, CheckCheck, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { notificationService } from '../services/notificationService';

/**
 * In-App Notification Bell & Dropdown Component (FR-8.3, FR-8.6).
 *
 * Features:
 * - Polls unread notification count every 30 seconds.
 * - Displays unread badge counter in red.
 * - Drops down interactive list of recent notifications with type-specific icons:
 *   * ⚠️ Critical Panic Alert (Red)
 *   * ✅ Result Approved (Green)
 *   * ❌ Result Rejected (Amber/Rose)
 * - Allows marking individual notifications as read or 1-click "Mark all as read".
 * - Navigates to relevant result / workbench on click.
 */
const NotificationDropdown = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // 1. Fetch unread count for badge counter
  const fetchCount = async () => {
    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (err) {
      console.debug('Failed to poll notification count:', err);
    }
  };

  // 2. Fetch full list of notifications when dropdown is opened
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const data = await notificationService.getMyNotifications();
      setNotifications(data || []);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  // 3. Set up 30-second polling interval
  useEffect(() => {
    fetchCount();
    const interval = setInterval(fetchCount, 30000); // 30 seconds
    return () => clearInterval(interval);
  }, []);

  // 4. Close dropdown on clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 5. Toggle dropdown open/close
  const handleToggle = () => {
    if (!isOpen) {
      fetchNotifications();
    }
    setIsOpen((prev) => !prev);
  };

  // 6. Mark a single notification as read and handle navigation
  const handleItemClick = async (notification) => {
    if (!notification.isRead) {
      try {
        await notificationService.markAsRead(notification.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (err) {
        console.error('Failed to mark notification as read:', err);
      }
    }

    setIsOpen(false);

    // Contextual navigation based on notification type and user role
    const role = localStorage.getItem('role');
    if (notification.type === 'CRITICAL_RESULT') {
      if (role === 'SENIOR_LAB_TECHNICIAN') {
        navigate('/senior-tech/verification-queue');
      } else {
        navigate('/technician/results');
      }
    } else if (notification.type === 'RESULT_APPROVED' || notification.type === 'RESULT_REJECTED') {
      navigate('/technician/my-results');
    }
  };

  // 7. Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  // Helper to format timestamps into friendly relative strings
  const formatTimeAgo = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  // Render notification icon based on type
  const renderIcon = (type) => {
    switch (type) {
      case 'CRITICAL_RESULT':
        return (
          <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={16} />
          </div>
        );
      case 'RESULT_APPROVED':
        return (
          <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0">
            <CheckCircle size={16} />
          </div>
        );
      case 'RESULT_REJECTED':
        return (
          <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
            <XCircle size={16} />
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
            <Bell size={16} />
          </div>
        );
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Top Navbar Bell Button */}
      <button
        type="button"
        onClick={handleToggle}
        className="relative p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors focus:outline-none"
        title="In-App Notifications & Alerts"
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-xs animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden animate-in fade-in duration-150">
          {/* Header */}
          <div className="px-4 py-3 bg-gray-50/80 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-800 text-sm">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 bg-red-100 text-red-700 font-medium text-xs rounded-full">
                  {unreadCount} unread
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 transition-colors"
              >
                <CheckCheck size={14} />
                Mark all read
              </button>
            )}
          </div>

          {/* Notification List Body */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-gray-100">
            {loading ? (
              <div className="py-8 text-center text-xs text-gray-400">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-10 px-4 text-center text-gray-400 flex flex-col items-center justify-center gap-2">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                  <Bell size={18} />
                </div>
                <p className="text-xs font-medium text-gray-600">No notifications yet</p>
                <p className="text-[11px] text-gray-400">
                  You'll be alerted when critical results occur or status updates happen.
                </p>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={`
                    p-3.5 flex items-start gap-3 cursor-pointer transition-colors text-left
                    ${item.isRead ? 'bg-white hover:bg-gray-50/80' : 'bg-blue-50/40 hover:bg-blue-50/70'}
                  `}
                >
                  {renderIcon(item.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <p className={`text-xs truncate ${item.isRead ? 'font-medium text-gray-800' : 'font-semibold text-gray-900'}`}>
                        {item.title}
                      </p>
                      <span className="text-[10px] text-gray-400 whitespace-nowrap flex items-center gap-0.5">
                        <Clock size={10} />
                        {formatTimeAgo(item.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 leading-snug line-clamp-2">
                      {item.message}
                    </p>
                  </div>
                  {!item.isRead && (
                    <span className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0 mt-1.5" />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 text-center">
            <span className="text-[11px] text-gray-400">
              Updates automatically every 30 seconds
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
