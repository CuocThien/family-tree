'use client';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CreditCard, Check, Crown } from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  price: string;
  period: string;
  features: string[];
  popular?: boolean;
}

const plans: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: 'forever',
    features: [
      'Up to 3 family trees',
      'Up to 100 members per tree',
      'Basic storage (100 MB)',
      'Standard support',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '$9.99',
    period: 'per month',
    popular: true,
    features: [
      'Unlimited family trees',
      'Unlimited members per tree',
      'Advanced storage (10 GB)',
      'Priority support',
      'DNA matching features',
      'Advanced search filters',
      'Export to PDF/GEDCOM',
    ],
  },
  {
    id: 'family',
    name: 'Family',
    price: '$19.99',
    period: 'per month',
    features: [
      'Everything in Premium',
      'Up to 5 family members',
      'Collaborative editing',
      'Family chat',
      'Shared storage (50 GB)',
      'Dedicated support',
    ],
  },
];

export function SubscriptionSection() {
  // Static billing dates for demo purposes
  // In a real app, these would come from an API
  const billingDates = [
    new Date('2024-01-15'),
    new Date('2023-12-15'),
    new Date('2023-11-15'),
  ];
  return (
    <div className="space-y-8">
      {/* Current Plan */}
      <div className="bg-white dark:bg-white/5 rounded-2xl p-8 shadow-sm border border-[#e7f1f3] dark:border-white/10">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <CreditCard className="text-primary" size={20} />
          Current Subscription
        </h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold">Free Plan</p>
            <p className="text-[#4c8d9a] mt-1">
              Your subscription renews on December 31, 2024
            </p>
          </div>
          <Button variant="ghost">Manage Subscription</Button>
        </div>
      </div>

      {/* Available Plans */}
      <div>
        <h2 className="text-xl font-bold mb-6">Upgrade Your Plan</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`relative p-6 ${
                plan.popular
                  ? 'border-2 border-primary shadow-lg'
                  : 'border border-[#e7f1f3] dark:border-white/10'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                    <Crown size={12} />
                    POPULAR
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-3xl font-black">{plan.price}</span>
                  <span className="text-sm text-[#4c8d9a]">{plan.period}</span>
                </div>
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Check className="text-primary flex-shrink-0 mt-0.5" size={16} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                variant={plan.popular ? 'primary' : 'outline'}
                className="w-full"
                disabled={plan.id === 'free'}
              >
                {plan.id === 'free' ? 'Current Plan' : 'Upgrade'}
              </Button>
            </Card>
          ))}
        </div>
      </div>

      {/* Billing History */}
      <div className="bg-white dark:bg-white/5 rounded-2xl p-8 shadow-sm border border-[#e7f1f3] dark:border-white/10">
        <h2 className="text-xl font-bold mb-6">Billing History</h2>
        <div className="space-y-4">
          {billingDates.map((date, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-3 border-b border-[#e7f1f3] dark:border-white/10 last:border-0"
            >
              <div>
                <p className="font-semibold">Premium Subscription</p>
                <p className="text-sm text-[#4c8d9a]">
                  {date.toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold">$9.99</p>
                <p className="text-sm text-green-500">Paid</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
