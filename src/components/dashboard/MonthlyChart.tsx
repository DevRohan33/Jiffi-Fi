import { useMemo, useState } from 'react';
import { useBill } from '@/contexts/BillContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

type ChartType = 'bar' | 'line' | 'area';

const MonthlyChart = () => {
  const { bills } = useBill();
  const [chartType, setChartType] = useState<ChartType>('bar');

  // Format and group bills by month
  const monthlyData = useMemo(() => {
    const grouped: Record<string, { income: number; expense: number }> = {};

    bills.forEach((bill) => {
      const date = new Date(bill.date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!grouped[key]) {
        grouped[key] = { income: 0, expense: 0 };
      }

      if (bill.type === 'income') {
        grouped[key].income += bill.amount;
      } else if (bill.type === 'expense') {
        grouped[key].expense += bill.amount;
      }
    });

    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([monthKey, values]) => {
        const [year, month] = monthKey.split('-');
        return {
          month: `${MONTH_NAMES[parseInt(month) - 1]} ${year}`,
          ...values,
        };
      });
  }, [bills]);

  const renderChart = () => {
    const commonProps = {
      data: monthlyData,
      margin: { top: 20, right: 30, left: 10, bottom: 20 },
    };

    switch (chartType) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} angle={-15} textAnchor="end" height={50} />
            <YAxis />
            <Tooltip
              wrapperStyle={{ borderRadius: '10px' }}
              contentStyle={{ backgroundColor: '#fff', borderColor: '#ccc' }}
            />
            <Legend verticalAlign="top" height={36} />
            <Line type="monotone" dataKey="income" stroke="#22c55e" strokeWidth={2} name="Income" />
            <Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} name="Expenses" />
          </LineChart>
        );
      case 'area':
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} angle={-15} textAnchor="end" height={50} />
            <YAxis />
            <Tooltip
              wrapperStyle={{ borderRadius: '10px' }}
              contentStyle={{ backgroundColor: '#fff', borderColor: '#ccc' }}
            />
            <Legend verticalAlign="top" height={36} />
            <Area type="monotone" dataKey="income" fill="#22c55e" stroke="#22c55e" name="Income" />
            <Area type="monotone" dataKey="expense" fill="#ef4444" stroke="#ef4444" name="Expenses" />
          </AreaChart>
        );
      case 'bar':
      default:
        return (
          <BarChart {...commonProps} barSize={40}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} angle={-15} textAnchor="end" height={50} />
            <YAxis />
            <Tooltip
              wrapperStyle={{ borderRadius: '10px' }}
              contentStyle={{ backgroundColor: '#fff', borderColor: '#ccc' }}
            />
            <Legend verticalAlign="top" height={36} />
            <Bar dataKey="income" fill="#22c55e" radius={[10, 10, 0, 0]} name="Income" />
            <Bar dataKey="expense" fill="#ef4444" radius={[10, 10, 0, 0]} name="Expenses" />
          </BarChart>
        );
    }
  };

  return (
    <Card className="shadow-xl rounded-2xl border border-muted p-4">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            📊 Monthly Summary
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant={chartType === 'bar' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChartType('bar')}
            >
              Bar
            </Button>
            <Button
              variant={chartType === 'line' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChartType('line')}
            >
              Line
            </Button>
            <Button
              variant={chartType === 'area' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChartType('area')}
            >
              Area
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default MonthlyChart;