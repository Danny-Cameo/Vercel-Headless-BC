'use client';

import { useEffect, useRef, useState } from 'react';

interface CustomerPortalProps {
  /** Customer ID to load portal for */
  customerId?: number;
  /** Portal height in pixels */
  height?: number;
  /** Portal width (100% by default) */
  width?: string;
  /** Custom CSS classes */
  className?: string;
  /** Callback when portal is loaded */
  onLoad?: () => void;
  /** Callback when portal encounters an error */
  onError?: (error: string) => void;
}

declare global {
  interface Window {
    RCAInterface?: {
      account: {
        getCustomerData: (
          store_hash: string,
          params: { email?: string; platform_id?: number }
        ) => Promise<{
          email: string | null;
          name: string | null;
          platform_id: number | null;
          recharge: {
            id?: string;
            hash?: string;
            base_url?: string;
            customer_hash?: string;
            expires_at?: string;
            portal_url?: string;
            temp_token?: string;
          };
        }>;
      };
    };
    RCA_store_objects?: {
      store_hash: string;
      customer: {
        email: string | null;
        id: number | null;
      };
    };
  }
}

export default function RechargeCustomerPortal({
  customerId,
  height = 600,
  width = '100%',
  className = '',
  onLoad,
  onError
}: CustomerPortalProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [portalUrl, setPortalUrl] = useState<string | null>(null);

  useEffect(() => {
    const initializePortal = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Wait for RCAInterface and RCA_store_objects to be available
        let attempts = 0;
        const maxAttempts = 50; // 5 seconds max wait

        while ((!window.RCAInterface || !window.RCA_store_objects) && attempts < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          attempts++;
        }

        if (!window.RCAInterface) {
          throw new Error(
            'RCAInterface not available. Make sure RechargeAdapter scripts are loaded.'
          );
        }

        if (!window.RCA_store_objects) {
          throw new Error(
            'RCA_store_objects not available. Make sure store objects are initialized.'
          );
        }

        // Get customer data from RCAInterface
        const customerData = await window.RCAInterface.account.getCustomerData(
          window.RCA_store_objects.store_hash,
          {
            email: window.RCA_store_objects.customer?.email || undefined,
            platform_id: window.RCA_store_objects.customer?.id || undefined
          }
        );

        if (!customerData?.recharge?.portal_url) {
          throw new Error('No portal URL available. Customer may not have an active subscription.');
        }

        // Use the portal URL directly from the response
        setPortalUrl(customerData.recharge.portal_url);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to initialize customer portal';
        setError(errorMessage);
        onError?.(errorMessage);
        console.error('Recharge Customer Portal Error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initializePortal();
  }, [customerId, onError]);

  const handleIframeLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleIframeError = () => {
    const errorMessage = 'Failed to load customer portal iframe';
    setError(errorMessage);
    onError?.(errorMessage);
    setIsLoading(false);
  };

  if (error) {
    return (
      <div className={`recharge-portal-error ${className}`} style={{ height, width }}>
        <div className="error-content rounded-lg border-2 border-red-200 bg-red-50 p-8 text-center">
          <div className="mb-2 text-lg font-medium text-red-600">Customer Portal Error</div>
          <div className="mb-4 text-sm text-red-500">{error}</div>
          <button
            onClick={() => window.location.reload()}
            className="rounded bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`recharge-portal-container ${className}`} style={{ height, width }}>
      {isLoading && (
        <div className="loading-overlay absolute inset-0 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
            <div className="text-gray-600">Loading Customer Portal...</div>
          </div>
        </div>
      )}

      {portalUrl && (
        <iframe
          ref={iframeRef}
          src={portalUrl}
          width="100%"
          height={height}
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          className="recharge-portal-iframe"
          title="Recharge Customer Portal"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
          style={{
            display: isLoading ? 'none' : 'block',
            border: 'none',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            overflow: 'auto'
          }}
        />
      )}
    </div>
  );
}

// Utility function to check if customer is logged in
export function useCustomerPortalStatus() {
  const [isReady, setIsReady] = useState(false);
  const [customerData, setCustomerData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        // Wait for RCAInterface and RCA_store_objects
        let attempts = 0;
        while ((!window.RCAInterface || !window.RCA_store_objects) && attempts < 50) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          attempts++;
        }

        if (!window.RCAInterface) {
          throw new Error('RCAInterface not available');
        }

        if (!window.RCA_store_objects) {
          throw new Error('RCA_store_objects not available');
        }

        const data = await window.RCAInterface.account.getCustomerData(
          window.RCA_store_objects.store_hash,
          {
            email: window.RCA_store_objects.customer?.email || undefined,
            platform_id: window.RCA_store_objects.customer?.id || undefined
          }
        );
        setCustomerData(data);
        setIsReady(!!data?.recharge?.portal_url);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to check customer status');
      }
    };

    checkStatus();
  }, []);

  return { isReady, customerData, error };
}
