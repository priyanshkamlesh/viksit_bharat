import React, { useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { useLocation } from 'react-router-dom';

const actionPattern = /sign in|login|register|save|connect|send|recalculate|refresh|upload|submit|start|finish|accept|decline|logout|switch account/i;

const getButtonLabel = (button) => {
  const label = button.getAttribute('aria-label') || button.getAttribute('title') || button.textContent || 'Action';
  return label.replace(/\s+/g, ' ').trim().slice(0, 80) || 'Action';
};

const ToastFeedback = ({ theme }) => {
  const location = useLocation();

  useEffect(() => {
    const handleButtonClick = (event) => {
      if (location.pathname === '/home') {
        return;
      }

      const button = event.target.closest('button');
      if (!button || button.disabled || button.dataset.toastHandled === 'true') {
        return;
      }

      const label = getButtonLabel(button);
      if (button.type !== 'submit' && !actionPattern.test(label)) {
        return;
      }

      toast.success(`${label} started`, {
        duration: 2000,
        position: 'top-right',
      });
    };

    document.addEventListener('click', handleButtonClick);
    return () => document.removeEventListener('click', handleButtonClick);
  }, [location.pathname]);

  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 2000,
        style: {
          background: theme === 'dark' ? '#0b1711' : '#ffffff',
          color: theme === 'dark' ? '#d1fae5' : '#172554',
          border: theme === 'dark' ? '1px solid rgba(52, 211, 153, 0.35)' : '1px solid #a7f3d0',
          borderRadius: '16px',
          boxShadow: theme === 'dark' ? '0 14px 35px rgba(0, 0, 0, 0.28)' : '0 14px 35px rgba(16, 185, 129, 0.16)',
          fontSize: '13px',
          fontWeight: 800,
          padding: '12px 16px',
        },
      }}
    />
  );
};

export default ToastFeedback;
