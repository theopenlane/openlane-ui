'use client';

import { stripePricingTableId, stripePublishableKey } from '@repo/dally/auth';
import React, { useEffect, useState } from "react";
import { useSession } from 'next-auth/react'

declare global {
    namespace JSX {
      interface IntrinsicElements {
        'stripe-pricing-table': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      }
    }
  }

const PricingPage = () => {
  const { data: session } = useSession()
  const currentOrgId = session?.user.organization
  const [customerSessionClientSecret, setCustomerSessionClientSecret] = useState<string | null>(null)


  useEffect(() => {
    const getCustomerSessionClientSecret = async () => {
          try {
            const response = await fetch(`/api/stripe/customerSession`)
            if (!response.ok) {
              throw new Error("Failed to fetch customer session");
            }
            const stripedata = await response.json();
            setCustomerSessionClientSecret(stripedata.clientSecret);
          } catch (error) { 
            console.error("Error fetching customer session:", error);
          }
      }
      getCustomerSessionClientSecret()
    }, []);

    return (
      <stripe-pricing-table
        pricing-table-id={stripePricingTableId}
        publishable-key={stripePublishableKey}
        client-reference-id={currentOrgId}
        customer-session-client-secret={customerSessionClientSecret}
      >
      </stripe-pricing-table>
    );
  }

export { PricingPage }