/**
 * Toast Notification System
 * Simple, reusable toast notifications to replace alert() calls
 */

class Toast {
  constructor() {
    this.container = null;
    this.init();
  }

  init() {
    // Inject CSS animations if not already present
    if (!document.getElementById('toast-styles')) {
      const style = document.createElement('style');
      style.id = 'toast-styles';
      style.textContent = `
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes slide-out {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(100%);
            opacity: 0;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
        .animate-slide-out {
          animation: slide-out 0.3s ease-in;
        }
      `;
      document.head.appendChild(style);
    }

    // Create toast container if it doesn't exist
    if (!document.getElementById('toast-container')) {
      this.container = document.createElement('div');
      this.container.id = 'toast-container';
      this.container.className = 'fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md';
      document.body.appendChild(this.container);
    } else {
      this.container = document.getElementById('toast-container');
    }
  }

  show(message, type = 'info', duration = 5000) {
    const toast = document.createElement('div');
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    toast.id = id;

    // Determine colors based on type
    const typeStyles = {
      success: 'bg-emerald-500/90 text-white border-emerald-400',
      error: 'bg-rose-500/90 text-white border-rose-400',
      warning: 'bg-amber-500/90 text-white border-amber-400',
      info: 'bg-indigo-500/90 text-white border-indigo-400'
    };

    const iconStyles = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    };

    toast.className = `${typeStyles[type] || typeStyles.info} border rounded-2xl px-4 py-3 shadow-lg backdrop-blur-sm flex items-start gap-3 animate-slide-in`;
    toast.innerHTML = `
      <span class="flex-shrink-0 text-lg font-bold">${iconStyles[type] || iconStyles.info}</span>
      <p class="flex-1 text-sm font-medium">${this.escapeHtml(message)}</p>
      <button class="flex-shrink-0 text-white/80 hover:text-white" onclick="toast.remove('${id}')" aria-label="Close">
        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    `;

    this.container.appendChild(toast);

    // Auto-remove after duration
    if (duration > 0) {
      setTimeout(() => {
        this.remove(id);
      }, duration);
    }

    return id;
  }

  success(message, duration = 5000) {
    return this.show(message, 'success', duration);
  }

  error(message, duration = 5000) {
    return this.show(message, 'error', duration);
  }

  warning(message, duration = 5000) {
    return this.show(message, 'warning', duration);
  }

  info(message, duration = 5000) {
    return this.show(message, 'info', duration);
  }

  remove(id) {
    const toast = document.getElementById(id);
    if (toast) {
      toast.classList.add('animate-slide-out');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }
  }

  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}

// Create global instance
const toast = new Toast();

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = toast;
}

