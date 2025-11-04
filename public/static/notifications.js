// Notification System for Student Game
// Provides toast notifications for game events

// Notification types
const NotificationType = {
  SUCCESS: 'success',
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  ACHIEVEMENT: 'achievement',
  BONUS: 'bonus',
  WONDER: 'wonder',
  RELIGION: 'religion'
};

// Active notifications tracking
let activeNotifications = [];
let notificationId = 0;

// Create notification container if it doesn't exist
function ensureNotificationContainer() {
  let container = document.getElementById('notification-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'notification-container';
    container.className = 'fixed top-4 right-4 z-50 space-y-2 max-w-md';
    document.body.appendChild(container);
  }
  return container;
}

// Show notification
function showNotification(message, type = NotificationType.INFO, duration = 5000, options = {}) {
  const container = ensureNotificationContainer();
  const id = ++notificationId;
  
  // Determine styling based on type
  const styles = getNotificationStyles(type);
  
  // Create notification element
  const notification = document.createElement('div');
  notification.id = `notification-${id}`;
  notification.className = `${styles.bg} ${styles.border} ${styles.text} px-4 py-3 rounded-lg shadow-lg border-l-4 transform transition-all duration-300 ease-in-out`;
  notification.style.animation = 'slideInRight 0.3s ease-out';
  
  // Build notification content
  const icon = styles.icon;
  const title = options.title || styles.defaultTitle;
  
  notification.innerHTML = `
    <div class="flex items-start">
      <div class="flex-shrink-0 text-2xl mr-3">${icon}</div>
      <div class="flex-1">
        ${title ? `<p class="font-bold text-sm mb-1">${title}</p>` : ''}
        <p class="text-sm">${message}</p>
      </div>
      <button onclick="dismissNotification(${id})" class="flex-shrink-0 ml-3 text-xl opacity-70 hover:opacity-100 transition">
        ×
      </button>
    </div>
  `;
  
  // Add to container
  container.appendChild(notification);
  activeNotifications.push(id);
  
  // Auto-dismiss after duration
  if (duration > 0) {
    setTimeout(() => {
      dismissNotification(id);
    }, duration);
  }
  
  return id;
}

// Get notification styles based on type
function getNotificationStyles(type) {
  switch (type) {
    case NotificationType.SUCCESS:
      return {
        bg: 'bg-green-50',
        border: 'border-green-500',
        text: 'text-green-800',
        icon: '✅',
        defaultTitle: 'Success'
      };
    case NotificationType.WARNING:
      return {
        bg: 'bg-yellow-50',
        border: 'border-yellow-500',
        text: 'text-yellow-800',
        icon: '⚠️',
        defaultTitle: 'Warning'
      };
    case NotificationType.ERROR:
      return {
        bg: 'bg-red-50',
        border: 'border-red-500',
        text: 'text-red-800',
        icon: '❌',
        defaultTitle: 'Error'
      };
    case NotificationType.ACHIEVEMENT:
      return {
        bg: 'bg-yellow-100',
        border: 'border-yellow-600',
        text: 'text-yellow-900',
        icon: '🏆',
        defaultTitle: 'Achievement Unlocked!'
      };
    case NotificationType.BONUS:
      return {
        bg: 'bg-pink-50',
        border: 'border-pink-500',
        text: 'text-pink-800',
        icon: '💎',
        defaultTitle: 'Cultural Bonus Unlocked!'
      };
    case NotificationType.WONDER:
      return {
        bg: 'bg-purple-50',
        border: 'border-purple-500',
        text: 'text-purple-800',
        icon: '🏛️',
        defaultTitle: 'Wonder Built!'
      };
    case NotificationType.RELIGION:
      return {
        bg: 'bg-yellow-50',
        border: 'border-yellow-400',
        text: 'text-yellow-900',
        icon: '⭐',
        defaultTitle: 'Religion Event'
      };
    default: // INFO
      return {
        bg: 'bg-blue-50',
        border: 'border-blue-500',
        text: 'text-blue-800',
        icon: 'ℹ️',
        defaultTitle: 'Info'
      };
  }
}

// Dismiss notification
function dismissNotification(id) {
  const notification = document.getElementById(`notification-${id}`);
  if (notification) {
    notification.style.animation = 'slideOutRight 0.3s ease-in';
    setTimeout(() => {
      notification.remove();
      activeNotifications = activeNotifications.filter(n => n !== id);
    }, 300);
  }
}

// Dismiss all notifications
function dismissAllNotifications() {
  activeNotifications.forEach(id => dismissNotification(id));
}

// Convenience methods
function notifySuccess(message, duration = 5000, options = {}) {
  return showNotification(message, NotificationType.SUCCESS, duration, options);
}

function notifyError(message, duration = 5000, options = {}) {
  return showNotification(message, NotificationType.ERROR, duration, options);
}

function notifyWarning(message, duration = 5000, options = {}) {
  return showNotification(message, NotificationType.WARNING, duration, options);
}

function notifyInfo(message, duration = 5000, options = {}) {
  return showNotification(message, NotificationType.INFO, duration, options);
}

function notifyAchievement(achievementName, description, duration = 8000) {
  return showNotification(description, NotificationType.ACHIEVEMENT, duration, {
    title: `🏆 ${achievementName}`
  });
}

function notifyBonus(bonusName, description, duration = 6000) {
  return showNotification(description, NotificationType.BONUS, duration, {
    title: `💎 ${bonusName}`
  });
}

function notifyWonder(wonderName, effects, duration = 6000) {
  return showNotification(effects, NotificationType.WONDER, duration, {
    title: `🏛️ ${wonderName}`
  });
}

function notifyReligion(message, duration = 6000, options = {}) {
  return showNotification(message, NotificationType.RELIGION, duration, options);
}

// Add animation styles
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes slideInRight {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOutRight {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }
  
  @keyframes bounce {
    0%, 100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-10px);
    }
  }
  
  .animate-bounce-slow {
    animation: bounce 2s ease-in-out infinite;
  }
`;
document.head.appendChild(styleSheet);

// Export for use in other files
window.NotificationType = NotificationType;
window.showNotification = showNotification;
window.dismissNotification = dismissNotification;
window.dismissAllNotifications = dismissAllNotifications;
window.notifySuccess = notifySuccess;
window.notifyError = notifyError;
window.notifyWarning = notifyWarning;
window.notifyInfo = notifyInfo;
window.notifyAchievement = notifyAchievement;
window.notifyBonus = notifyBonus;
window.notifyWonder = notifyWonder;
window.notifyReligion = notifyReligion;
