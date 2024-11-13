import { stripePricingTableId, stripePublishableKey } from '@repo/dally/auth';
import * as React from 'react';

declare global {
    namespace JSX {
      interface IntrinsicElements {
        'stripe-pricing-table': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      }
    }
  }

function PricingPage() {
  return (
    <stripe-pricing-table
      pricing-table-id={stripePricingTableId}
      publishable-key={stripePublishableKey}
    >
    </stripe-pricing-table>
  );
}

export default PricingPage;