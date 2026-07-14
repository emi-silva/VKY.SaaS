'use client';

import { BillingStats } from '@/lib/billing';
import { formatCurrency } from '@/lib/utils';

interface StatsCardsProps {
  stats: BillingStats;
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    { label: 'Ingresos del mes', value: formatCurrency(stats.monthlyRevenue), color: 'text-green-600', iconBg: 'bg-green-50', icon: '💰' },
    { label: 'Pendiente de cobro', value: formatCurrency(stats.pendingAmount), color: 'text-amber-600', iconBg: 'bg-amber-50', icon: '⏳' },
    { label: 'Facturas pagadas', value: stats.paidInvoices.toString(), color: 'text-blue-600', iconBg: 'bg-blue-50', icon: '📄' },
    { label: 'Vencidas', value: stats.overdueInvoices.toString(), color: 'text-red-600', iconBg: 'bg-red-50', icon: '⚠️' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div key={card.label} className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className={`w-10 h-10 ${card.iconBg} rounded-xl flex items-center justify-center text-lg mb-3`}>
            {card.icon}
          </div>
          <p className="text-xs font-medium text-gray-500">{card.label}</p>
          <p className={`text-xl font-bold mt-1 ${card.color}`}>{card.value}</p>
        </div>
      ))}
    </div>
  );
}
