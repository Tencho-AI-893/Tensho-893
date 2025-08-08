import React, { createContext, useContext, useState, useCallback } from 'react';
import { useDebounce } from '../hooks/useDebounce';
import { useToast } from './ToastContext';

interface LoadingState {
  [key: string]: boolean;
}

interface LoadingContextType {
  // Loading state management
  isLoading: (key: string) => boolean;
  setLoading: (key: string, loading: boolean, message?: string) => void;
  clearLoading: (key: string) => void;
  clearAllLoading: () => void;
  
  // Debounced actions to prevent duplicate taps
  debouncedAction: <T extends any[]>(
    key: string,
    action: (...args: T) => Promise<void> | void,
    options?: {
      loadingMessage?: string;
      successMessage?: string;
      errorMessage?: string;
      delay?: number;
    }
  ) => (...args: T) => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export const useLoading = (): LoadingContextType => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};

export const LoadingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loadingStates, setLoadingStates] = useState<LoadingState>({});
  const [activeToasts, setActiveToasts] = useState<{ [key: string]: string }>({});
  const { showToast, hideToast, showLoadingToast, hideLoadingToast } = useToast();

  const isLoading = useCallback((key: string): boolean => {
    return loadingStates[key] || false;
  }, [loadingStates]);

  const setLoading = useCallback((key: string, loading: boolean, message?: string) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: loading,
    }));

    // Handle toast notifications for loading states
    if (loading && message) {
      const toastId = showLoadingToast(message);
      setActiveToasts(prev => ({
        ...prev,
        [key]: toastId,
      }));
    } else if (!loading && activeToasts[key]) {
      hideLoadingToast(activeToasts[key]);
      setActiveToasts(prev => {
        const { [key]: removed, ...rest } = prev;
        return rest;
      });
    }
  }, [showLoadingToast, hideLoadingToast, activeToasts]);

  const clearLoading = useCallback((key: string) => {
    setLoadingStates(prev => {
      const { [key]: removed, ...rest } = prev;
      return rest;
    });

    if (activeToasts[key]) {
      hideLoadingToast(activeToasts[key]);
      setActiveToasts(prev => {
        const { [key]: removed, ...rest } = prev;
        return rest;
      });
    }
  }, [hideLoadingToast, activeToasts]);

  const clearAllLoading = useCallback(() => {
    // Hide all loading toasts
    Object.values(activeToasts).forEach(toastId => {
      hideLoadingToast(toastId);
    });

    setLoadingStates({});
    setActiveToasts({});
  }, [hideLoadingToast, activeToasts]);

  const debouncedAction = useCallback(<T extends any[]>(
    key: string,
    action: (...args: T) => Promise<void> | void,
    options?: {
      loadingMessage?: string;
      successMessage?: string;
      errorMessage?: string;
      delay?: number;
    }
  ) => {
    const { debouncedCallback } = useDebounce(async (...args: T) => {
      // Prevent duplicate actions if already loading
      if (isLoading(key)) {
        return;
      }

      try {
        // Set loading state with optional message
        setLoading(key, true, options?.loadingMessage);

        // Execute the action
        await Promise.resolve(action(...args));

        // Show success message if provided
        if (options?.successMessage) {
          showToast('success', options.successMessage);
        }
      } catch (error) {
        console.error(`Error in debounced action (${key}):`, error);
        
        // Show error message
        const errorMessage = options?.errorMessage || 
          (error instanceof Error ? error.message : 'アクションの実行中にエラーが発生しました');
        showToast('error', errorMessage);
      } finally {
        // Clear loading state
        setLoading(key, false);
      }
    }, options?.delay || 300);

    return debouncedCallback;
  }, [isLoading, setLoading, showToast, useDebounce]);

  return (
    <LoadingContext.Provider
      value={{
        isLoading,
        setLoading,
        clearLoading,
        clearAllLoading,
        debouncedAction,
      }}
    >
      {children}
    </LoadingContext.Provider>
  );
};