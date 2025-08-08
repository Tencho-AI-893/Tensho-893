import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export type ToastType = 'success' | 'error' | 'info' | 'loading';

interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  action?: {
    label: string;
    onPress: () => void;
  };
  duration?: number;
}

interface ToastContextType {
  showToast: (type: ToastType, message: string, options?: {
    action?: { label: string; onPress: () => void };
    duration?: number;
  }) => string;
  hideToast: (id: string) => void;
  showLoadingToast: (message: string) => string;
  hideLoadingToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

const Toast: React.FC<{
  toast: ToastItem;
  onHide: (id: string) => void;
}> = ({ toast, onHide }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-100)).current;

  React.useEffect(() => {
    // Show animation
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto hide timer (only if not loading)
    if (toast.type !== 'loading') {
      const timer = setTimeout(() => {
        hideToast();
      }, toast.duration || 4000);

      return () => clearTimeout(timer);
    }
  }, []);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide(toast.id);
    });
  };

  const getToastStyle = () => {
    switch (toast.type) {
      case 'success':
        return styles.successToast;
      case 'error':
        return styles.errorToast;
      case 'loading':
        return styles.loadingToast;
      default:
        return styles.infoToast;
    }
  };

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return 'checkmark-circle';
      case 'error':
        return 'close-circle';
      case 'loading':
        return 'hourglass';
      default:
        return 'information-circle';
    }
  };

  const getIconColor = () => {
    switch (toast.type) {
      case 'success':
        return '#4ade80';
      case 'error':
        return '#ef4444';
      case 'loading':
        return '#60a5fa';
      default:
        return '#60a5fa';
    }
  };

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        getToastStyle(),
        {
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <View style={styles.toastContent}>
        <Ionicons 
          name={getIcon()} 
          size={20} 
          color={getIconColor()} 
          style={styles.toastIcon}
        />
        <Text style={styles.toastMessage} numberOfLines={2}>
          {toast.message}
        </Text>
      </View>
      
      {toast.action && (
        <TouchableOpacity
          style={styles.toastAction}
          onPress={toast.action.onPress}
        >
          <Text style={styles.toastActionText}>{toast.action.label}</Text>
        </TouchableOpacity>
      )}
      
      {toast.type !== 'loading' && (
        <TouchableOpacity
          style={styles.closeButton}
          onPress={hideToast}
        >
          <Ionicons name="close" size={16} color="#666" />
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((
    type: ToastType,
    message: string,
    options?: {
      action?: { label: string; onPress: () => void };
      duration?: number;
    }
  ): string => {
    const id = `toast_${Date.now()}_${Math.random()}`;
    const newToast: ToastItem = {
      id,
      type,
      message,
      action: options?.action,
      duration: options?.duration,
    };

    setToasts(prev => {
      // Limit to 3 toasts max
      const updated = [...prev, newToast];
      return updated.slice(-3);
    });

    return id;
  }, []);

  const hideToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const showLoadingToast = useCallback((message: string): string => {
    return showToast('loading', message);
  }, [showToast]);

  const hideLoadingToast = useCallback((id: string) => {
    hideToast(id);
  }, [hideToast]);

  return (
    <ToastContext.Provider
      value={{
        showToast,
        hideToast,
        showLoadingToast,
        hideLoadingToast,
      }}
    >
      {children}
      
      {/* Toast Container */}
      <SafeAreaView style={styles.toastOverlay} pointerEvents="box-none">
        <View style={styles.toastList}>
          {toasts.map(toast => (
            <Toast
              key={toast.id}
              toast={toast}
              onHide={hideToast}
            />
          ))}
        </View>
      </SafeAreaView>
    </ToastContext.Provider>
  );
};

const styles = StyleSheet.create({
  toastOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    pointerEvents: 'box-none',
  },
  toastList: {
    paddingTop: 10,
    paddingHorizontal: 16,
    gap: 8,
  },
  toastContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(17, 17, 17, 0.95)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  successToast: {
    borderLeftWidth: 4,
    borderLeftColor: '#4ade80',
  },
  errorToast: {
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  loadingToast: {
    borderLeftWidth: 4,
    borderLeftColor: '#60a5fa',
  },
  infoToast: {
    borderLeftWidth: 4,
    borderLeftColor: '#60a5fa',
  },
  toastContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  toastIcon: {
    marginRight: 12,
  },
  toastMessage: {
    flex: 1,
    fontSize: 14,
    color: '#fff',
    lineHeight: 20,
  },
  toastAction: {
    marginLeft: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(96, 165, 250, 0.2)',
  },
  toastActionText: {
    fontSize: 12,
    color: '#60a5fa',
    fontWeight: '600',
  },
  closeButton: {
    marginLeft: 8,
    padding: 4,
  },
});