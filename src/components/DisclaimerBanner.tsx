import React from 'react';
import { AlertCircle } from 'lucide-react';

export function DisclaimerBanner() {
  return (
    <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg shadow-sm mb-6 text-amber-900">
      <div className="flex items-start space-x-3">
        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm leading-relaxed">
          <strong className="font-semibold text-amber-950">Official Competition Authenticity Notice: </strong>
          Automated analysis is probabilistic and may produce false positives and false negatives. This result is intended to assist competition organizers and does not constitute definitive proof of AI generation or authenticity. The system operates on a 2-of-3 majority screening rule with deadband gating, and no photograph is ever automatically disqualified. Final competition decisions are made solely by the human judging committee.
        </div>
      </div>
    </div>
  );
}
