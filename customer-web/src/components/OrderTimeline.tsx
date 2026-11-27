import React from 'react';
import { CheckCircle2, Clock, ChefHat, Bike, Home, AlertCircle } from 'lucide-react';
import type { OrderStatus } from '../types';

interface OrderTimelineProps {
  status: OrderStatus;
}

const STEPS = [
  { key: 'pending', label: 'Order Placed', icon: Clock },
  { key: 'accepted', label: 'Confirmed', icon: CheckCircle2 },
  { key: 'preparing', label: 'Preparing', icon: ChefHat },
  { key: 'on_the_way', label: 'On The Way', icon: Bike },
  { key: 'delivered', label: 'Delivered', icon: Home },
];

export const OrderTimeline: React.FC<OrderTimelineProps> = ({ status }) => {
  if (status === 'cancelled') {
    return (
      <div className="p-4 rounded-2xl bg-red-50 border border-red-200 flex items-center gap-3 text-red-700">
        <AlertCircle className="w-5 h-5 shrink-0" />
        <div>
          <h4 className="text-sm font-bold">This order was cancelled</h4>
          <p className="text-xs text-red-600 mt-0.5">
            If you have questions, please contact customer support or the restaurant.
          </p>
        </div>
      </div>
    );
  }

  const getStepIndex = (s: OrderStatus) => {
    switch (s) {
      case 'pending':
        return 0;
      case 'accepted':
        return 1;
      case 'preparing':
      case 'ready_for_pickup':
        return 2;
      case 'picked_up':
      case 'on_the_way':
        return 3;
      case 'delivered':
        return 4;
      default:
        return 0;
    }
  };

  const currentIndex = getStepIndex(status);

  return (
    <div className="w-full py-4">
      <div className="flex items-center justify-between relative">
        {/* Connecting Line */}
        <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-1 bg-slate-100 -z-0">
          <div
            className="h-full bg-blue-600 transition-all duration-500"
            style={{
              width: `${(currentIndex / (STEPS.length - 1)) * 100}%`,
            }}
          />
        </div>

        {/* Steps */}
        {STEPS.map((step, index) => {
          const isDone = index < currentIndex;
          const isCurrent = index === currentIndex;
          const Icon = step.icon;

          return (
            <div
              key={step.key}
              className="relative z-10 flex flex-col items-center group"
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  isDone
                    ? 'bg-blue-600 text-white shadow-sm'
                    : isCurrent
                    ? 'bg-blue-700 text-white ring-4 ring-blue-100 shadow-md scale-110'
                    : 'bg-white border-2 border-slate-200 text-slate-400'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>

              <span
                className={`text-xs mt-2 font-medium text-center max-w-[70px] ${
                  isCurrent
                    ? 'text-blue-700 font-bold'
                    : isDone
                    ? 'text-slate-800'
                    : 'text-slate-400'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
