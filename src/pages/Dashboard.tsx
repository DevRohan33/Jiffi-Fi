import React, { useState } from 'react';
import { useBill } from '@/contexts/BillContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SummaryCard from '@/components/dashboard/SummaryCard';
import { TrendingUp, TrendingDown, Clock, AlertCircle } from 'lucide-react';
import { FaRupeeSign } from 'react-icons/fa';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import ExcelJS from 'exceljs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import TransactionDetail from '@/components/dashboard/TransactionDetail';
import MonthlyChart from '@/components/dashboard/MonthlyChart';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, startOfToday, startOfWeek, endOfWeek, isWithinInterval, subMonths, eachMonthOfInterval, startOfMonth, endOfMonth, startOfYear, endOfYear, startOfDay, endOfDay } from 'date-fns';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";


const Dashboard = () => {
  const { totalIncome, totalExpenses, profit, bills } = useBill();
  const [timeFilter, setTimeFilter] = useState<'all' | 'yearly' | 'monthly' | 'custom'>('all');
  const [selectedBill, setSelectedBill] = useState<string | null>(null);
  const [customDateRange, setCustomDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({ from: undefined, to: undefined });
  
  const [transactionFilter, setTransactionFilter] = useState<'all' | 'today' | 'week' | 'month' | 'custom'>('all');
  const [selectedMonth, setSelectedMonth] = useState<Date | null>(null);
  const [sortOption, setSortOption] = useState<'newest' | 'oldest' | 'high' | 'low'>('newest');

  // Format currency using INR locale
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(value);

  // Filter bills based on selected time period
  const filterBillsByTime = () => {
    const now = new Date();
    
    if (timeFilter === 'all') return bills;
    if (timeFilter === 'yearly') {
      return bills.filter(bill => new Date(bill.date).getFullYear() === now.getFullYear());
    }
    if (timeFilter === 'monthly') {
      return bills.filter(
        bill =>
          new Date(bill.date).getMonth() === now.getMonth() &&
          new Date(bill.date).getFullYear() === now.getFullYear()
      );
    }
    if (timeFilter === 'custom' && customDateRange.from && customDateRange.to) {
      return bills.filter(bill => {
        const billDate = new Date(bill.date);
        return billDate >= customDateRange.from! && billDate <= customDateRange.to!;
      });
    }
    return bills;
  };

  const filteredBills = filterBillsByTime();

  // Calculate due amount (assuming bills have a 'due' property)
  const totalDue = filteredBills.reduce((sum, bill) => sum + (bill.due || 0), 0);


  const filteredIncome = filteredBills
    .filter(bill => bill.type === 'income')
    .reduce((sum, bill) => sum + bill.amount, 0);
  
  const filteredExpenses = filteredBills
    .filter(bill => bill.type === 'expense')
    .reduce((sum, bill) => sum + bill.amount, 0);

  const filteredProfit = filteredIncome - filteredExpenses;
  
  // Get today's bills
  const today = startOfToday();
  const todayBills = bills.filter(bill => 
    format(new Date(bill.date), 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')
  );

  // Calculate today's values
  const todaysIncome = todayBills
    .filter(bill => bill.type === 'income')
    .reduce((sum, bill) => sum + bill.amount, 0);

  const todaysExpenses = todayBills
    .filter(bill => bill.type === 'expense')
    .reduce((sum, bill) => sum + bill.amount, 0);

  const todaysDue = todayBills
    .reduce((sum, bill) => sum + (bill.due || 0), 0);

  // Calculate today's maximum values
  const todaysMaxIncome = todayBills
    .filter(bill => bill.type === 'income')
    .reduce((max, bill) => Math.max(max, bill.amount), 0);

  const todaysMaxExpense = todayBills
    .filter(bill => bill.type === 'expense')
    .reduce((max, bill) => Math.max(max, bill.amount), 0);

  const todaysMaxDue = todayBills
    .filter(bill => bill.due && bill.due > 0)
    .reduce((max, bill) => Math.max(max, bill.due || 0), 0);

  // Today's pie chart data
  const todaysPieData = [
    { name: 'Income', value: todaysIncome, color: '#4CAF50' },
    { name: 'Expenses', value: todaysExpenses, color: '#F44336' }
  ];

  // Apply transaction filters
  const applyTransactionFilters = (billsToFilter: typeof filteredBills) => {
    const today = startOfToday();
        const weekStart = startOfWeek(new Date());
        const weekEnd = endOfWeek(new Date());
        
        let filtered = billsToFilter;
        
        // Apply time filter
        if (transactionFilter === 'today') {
          filtered = filtered.filter(bill => {
            const billDate = new Date(bill.date);
            return format(billDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
          });
        } else if (transactionFilter === 'week') {
          filtered = filtered.filter(bill => {
            const billDate = new Date(bill.date);
            return isWithinInterval(billDate, { start: weekStart, end: weekEnd });
          });
        } else if (transactionFilter === 'month' && selectedMonth) {
          const monthStart = startOfMonth(selectedMonth);
          const monthEnd = endOfMonth(selectedMonth);
          filtered = filtered.filter(bill => {
            const billDate = new Date(bill.date);
            return isWithinInterval(billDate, { start: monthStart, end: monthEnd });
          });
        } else if (transactionFilter === 'custom' && customDateRange.from && customDateRange.to) {
          filtered = filtered.filter(bill => {
            const billDate = new Date(bill.date);
            return billDate >= customDateRange.from! && billDate <= customDateRange.to!;
          });
        }
        
        // Apply sorting
        switch (sortOption) {
          case 'newest':
            return [...filtered].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          case 'oldest':
            return [...filtered].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
          case 'high':
            return [...filtered].sort((a, b) => b.amount - a.amount);
          case 'low':
            return [...filtered].sort((a, b) => a.amount - b.amount);
          default:
            return filtered;
        }
      };

  const transactionFilteredBills = applyTransactionFilters(filteredBills);



  // Generate months for the month selector
  const months = eachMonthOfInterval({
    start: subMonths(new Date(), 12),
    end: new Date()
  }).reverse();

  const [downloadDialogOpen, setDownloadDialogOpen] = useState(false);
  const [downloadOptions, setDownloadOptions] = useState({
    includeSummary: true,
    includeCharts: true,
    includeTransactions: true,
    includeImages: true,
    timePeriod: 'all'
  });

 const handleDownload = async () => {
  setDownloadDialogOpen(false);

  let filteredBills = bills;
  let timePeriodText = 'All Time';
  const today = new Date();

  switch (downloadOptions.timePeriod) {
    case 'year':
      filteredBills = bills.filter(bill =>
        isWithinInterval(new Date(bill.date), {
          start: startOfYear(today),
          end: endOfYear(today)
        })
      );
      timePeriodText = `Year ${format(today, 'yyyy')}`;
      break;
    case 'month':
      filteredBills = bills.filter(bill =>
        isWithinInterval(new Date(bill.date), {
          start: startOfMonth(today),
          end: endOfMonth(today)
        })
      );
      timePeriodText = format(today, 'MMMM yyyy');
      break;
    case 'day':
      filteredBills = bills.filter(bill =>
        isWithinInterval(new Date(bill.date), {
          start: startOfDay(today),
          end: endOfDay(today)
        })
      );
      timePeriodText = format(today, 'MMMM d, yyyy');
      break;
    case 'custom':
      if (customDateRange.from && customDateRange.to) {
        filteredBills = bills.filter(bill =>
          isWithinInterval(new Date(bill.date), {
            start: customDateRange.from,
            end: customDateRange.to
          })
        );
        timePeriodText = `Custom Range: ${format(customDateRange.from, 'MMM d, yyyy')} - ${format(customDateRange.to, 'MMM d, yyyy')}`;
      }
      break;
    default:
      break;
  }

  const income = filteredBills
    .filter(bill => bill.type === 'income')
    .reduce((sum, bill) => sum + bill.amount, 0);

  const expenses = filteredBills
    .filter(bill => bill.type === 'expense')
    .reduce((sum, bill) => sum + bill.amount, 0);

  const profit = income - expenses;
  const due = filteredBills.reduce((sum, bill) => sum + (bill.due || 0), 0);

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Financial Report');

  // Title styling
  const titleRow = worksheet.addRow(['Financial Report']);
  titleRow.font = { bold: true, size: 18, color: { argb: 'FF2F5496' } };
  titleRow.height = 30;
  worksheet.mergeCells('A1:E1');
  titleRow.alignment = { horizontal: 'center' };

  // Time period styling
  const periodRow = worksheet.addRow([timePeriodText]);
  periodRow.font = { size: 14, italic: true };
  worksheet.mergeCells('A2:E2');
  periodRow.alignment = { horizontal: 'center' };
  worksheet.addRow([]);

  // Track current row position
  let currentRow = 4;

  if (downloadOptions.includeSummary) {
    // Summary header
    const summaryHeader = worksheet.addRow(['Financial Summary']);
    summaryHeader.font = { bold: true, size: 14, color: { argb: 'FF2F5496' } };
    worksheet.mergeCells(`A${currentRow}:E${currentRow}`);
    summaryHeader.alignment = { horizontal: 'center' };
    currentRow++;
    
    // Summary data
    const summaryRows = [
      ['Total Income:', income],
      ['Total Expenses:', expenses],
      ['Profit/Loss:', profit],
      ['Total Due:', due]
    ];
    
    summaryRows.forEach(([label, value]) => {
      const row = worksheet.addRow([label, value]);
      const labelCell = row.getCell(1);
      const valueCell = row.getCell(2);
      
      labelCell.font = { bold: true };
      valueCell.numFmt = '₹#,##0.00';
      valueCell.alignment = { horizontal: 'right' };
      
      if (label === 'Profit/Loss:') {
        valueCell.font = {
          bold: true,
          color: { argb: Number(value) >= 0 ? 'FF00B050' : 'FFC00000' }
        };
      }
      currentRow++;
    });
    
    // Set column widths
    worksheet.getColumn(1).width = 20;
    worksheet.getColumn(2).width = 20;
    
    worksheet.addRow([]);
    currentRow++;
  }

  if (downloadOptions.includeCharts) {
    // Monthly breakdown header
    const monthlyHeader = worksheet.addRow(['Monthly Financial Overview']);
    monthlyHeader.font = { bold: true, size: 14, color: { argb: 'FF2F5496' } };
    worksheet.mergeCells(`A${currentRow}:E${currentRow}`);
    monthlyHeader.alignment = { horizontal: 'center' };
    currentRow++;
    
    // Monthly data
    const monthsData = eachMonthOfInterval({
      start: subMonths(today, 11),
      end: today
    }).map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      const monthBills = filteredBills.filter(bill =>
        isWithinInterval(new Date(bill.date), { start: monthStart, end: monthEnd })
      );
      const monthIncome = monthBills
        .filter(bill => bill.type === 'income')
        .reduce((sum, bill) => sum + bill.amount, 0);
      const monthExpenses = monthBills
        .filter(bill => bill.type === 'expense')
        .reduce((sum, bill) => sum + bill.amount, 0);
      return {
        month: format(month, 'MMM yyyy'),
        income: monthIncome,
        expenses: monthExpenses,
        profit: monthIncome - monthExpenses
      };
    });

    // Add headers
    const monthlyTableHeader = worksheet.addRow(['Month', 'Income', 'Expenses', 'Profit/Loss']);
    monthlyTableHeader.eachCell(cell => {
      cell.font = { bold: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD9E1F2' }
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
    currentRow++;

    // Add data rows
    monthsData.forEach(item => {
      const row = worksheet.addRow([
        item.month,
        item.income,
        item.expenses,
        item.profit
      ]);
      
      // Format numbers
      row.getCell(2).numFmt = '₹#,##0.00';
      row.getCell(3).numFmt = '₹#,##0.00';
      const profitCell = row.getCell(4);
      profitCell.numFmt = '₹#,##0.00';
      
      // Color profit cells
      if (item.profit >= 0) {
        profitCell.font = { color: { argb: 'FF00B050' } };
      } else {
        profitCell.font = { color: { argb: 'FFC00000' } };
      }
      
      // Add borders
      row.eachCell(cell => {
        cell.border = {
          left: { style: 'thin' },
          right: { style: 'thin' },
          bottom: { style: 'thin' }
        };
      });
      currentRow++;
    });
    
    // Set column widths
    worksheet.getColumn(1).width = 15;
    worksheet.getColumn(2).width = 15;
    worksheet.getColumn(3).width = 15;
    worksheet.getColumn(4).width = 15;
    
    worksheet.addRow([]);
    currentRow++;
  }

  if (downloadOptions.includeTransactions && filteredBills.length > 0) {
    // Transactions header
    const transactionsHeader = worksheet.addRow(['Transaction Details']);
    transactionsHeader.font = { bold: true, size: 14, color: { argb: 'FF2F5496' } };
    worksheet.mergeCells(`A${currentRow}:E${currentRow}`);
    transactionsHeader.alignment = { horizontal: 'center' };
    currentRow++;
    
    // Add headers
    const headers = ['Title', 'Date', 'Type', 'Amount', 'Due'];
    const headerRow = worksheet.addRow(headers);
    headerRow.eachCell(cell => {
      cell.font = { bold: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD9E1F2' }
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
    currentRow++;

    // Add data rows
    filteredBills.forEach(bill => {
      const row = worksheet.addRow([
        bill.title,
        format(new Date(bill.date), 'yyyy-MM-dd'),
        bill.type.charAt(0).toUpperCase() + bill.type.slice(1),
        bill.amount,
        bill.due || 0
      ]);
      
      // Format numbers
      const amountCell = row.getCell(4);
      const dueCell = row.getCell(5);
      amountCell.numFmt = '₹#,##0.00';
      dueCell.numFmt = '₹#,##0.00';
      
      // Color amount cells based on type
      if (bill.type === 'income') {
        amountCell.font = { color: { argb: 'FF00B050' } };
      } else {
        amountCell.font = { color: { argb: 'FFC00000' } };
      }
      
      // Add borders
      row.eachCell(cell => {
        cell.border = {
          left: { style: 'thin' },
          right: { style: 'thin' },
          bottom: { style: 'thin' }
        };
      });
      currentRow++;
    });
    
    // Set column widths
    worksheet.getColumn(1).width = 25;
    worksheet.getColumn(2).width = 12;
    worksheet.getColumn(3).width = 10;
    worksheet.getColumn(4).width = 15;
    worksheet.getColumn(5).width = 15;
    
    // Auto filter
    if (filteredBills.length > 0) {
      worksheet.autoFilter = {
        from: {
          row: currentRow - filteredBills.length - 1,
          column: 1
        },
        to: {
          row: currentRow - 1,
          column: 5
        }
      };
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `Financial_Report_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`;
  link.click();
};

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Financial Overview</h1>
          <p className="text-muted-foreground">Track your income and expenses</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Select 
              value={timeFilter} 
              onValueChange={(value) => setTimeFilter(value as 'all' | 'yearly' | 'monthly' | 'custom')}
            >
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="Time Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="yearly">This Year</SelectItem>
                <SelectItem value="monthly">This Month</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>   
            {timeFilter === 'custom' && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    {customDateRange.from ? (
                      customDateRange.to ? (
                        <>
                          {format(customDateRange.from, 'MMM d')} - {format(customDateRange.to, 'MMM d')}
                        </>
                      ) : (
                        format(customDateRange.from, 'MMM d, yyyy')
                      )
                    ) : (
                      'Select date range'
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="range"
                    selected={{ from: customDateRange.from, to: customDateRange.to }}
                    onSelect={(range) => {
                      if (range) {
                        setCustomDateRange({ from: range.from, to: range.to });
                      }
                    }}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            )}  
        <Dialog open={downloadDialogOpen} onOpenChange={setDownloadDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
            >
              <Download size={16} />
              <span>Download</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Download Options</DialogTitle>
            </DialogHeader>
                  
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label htmlFor="timePeriod">Time Period</Label>
                <Select 
                  value={downloadOptions.timePeriod}
                  onValueChange={(value) => setDownloadOptions({
                    ...downloadOptions,
                    timePeriod: value
                  })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select time period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Records</SelectItem>
                    <SelectItem value="year">This Year</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="day">Today</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
                
                {downloadOptions.timePeriod === 'custom' && (
                  <div className="mt-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full">
                          {customDateRange.from ? (
                            customDateRange.to ? (
                              `${format(customDateRange.from, 'MMM d')} - ${format(customDateRange.to, 'MMM d')}`
                            ) : (
                              format(customDateRange.from, 'MMM d, yyyy')
                            )
                          ) : 'Select date range'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="range"
                          selected={{ from: customDateRange.from, to: customDateRange.to }}
                          onSelect={(range) => {
                            if (range) {
                              setCustomDateRange({ from: range.from, to: range.to });
                            }
                          }}
                          numberOfMonths={2}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label>Include in Report</Label>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="includeSummary" 
                      checked={downloadOptions.includeSummary}
                      onCheckedChange={(checked) => setDownloadOptions({
                        ...downloadOptions,
                        includeSummary: Boolean(checked)
                      })}
                    />
                    <Label htmlFor="includeSummary">Summary</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="includeCharts" 
                      checked={downloadOptions.includeCharts}
                      onCheckedChange={(checked) => setDownloadOptions({
                        ...downloadOptions,
                        includeCharts: Boolean(checked)
                      })}
                    />
                    <Label htmlFor="includeCharts">Charts Data</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="includeTransactions" 
                      checked={downloadOptions.includeTransactions}
                      onCheckedChange={(checked) => setDownloadOptions({
                        ...downloadOptions,
                        includeTransactions: Boolean(checked)
                      })}
                    />
                    <Label htmlFor="includeTransactions">Transactions</Label>
                  </div>
                </div>
              </div>
                    
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setDownloadDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleDownload}>
                  Download Report
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Summary Cards - Added Due Amount Card */}
      <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-4">
        <SummaryCard
          title="Total Income"
          amount={filteredIncome}
          icon={<TrendingUp size={24} className="text-income" />}
          variant="income"
        />
        <SummaryCard
          title="Total Expenses"
          amount={filteredExpenses}
          icon={<TrendingDown size={24} className="text-expense" />}
          variant="expense"
        />
        <SummaryCard
          title="Profit / Loss"
          amount={filteredProfit}
          icon={
            <FaRupeeSign
              size={20}
              className={filteredProfit >= 0 ? 'text-profit' : 'text-expense'}
            />
          }
          variant="profit"
        />
        <SummaryCard
          title="Total Due"
          amount={totalDue}
          icon={<AlertCircle size={24} className="text-warning" />}
          variant="warning"
        />
      </div>

      {/* Today's Overview Section */}
<div className="grid gap-4 md:grid-cols-3 sm:grid-cols-1">
  {/* Pie Chart */}
  <Card className="h-full">
    <CardHeader className="pb-2">
      <CardTitle className="text-base font-semibold">Income vs Expenses</CardTitle>
      <p className="text-xs text-muted-foreground">{format(today, 'MMMM d, yyyy')}</p>
    </CardHeader>
    <CardContent className="h-[220px] p-0">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={todaysPieData}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={70}
            dataKey="value"
            label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
          >
            {todaysPieData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => formatCurrency(Number(value))} />
          <Legend verticalAlign="bottom" height={36} />
        </PieChart>
      </ResponsiveContainer>
    </CardContent>
  </Card>

  {/* Max Bills Summary */}
  <Card className="h-full">
    <CardHeader className="pb-2">
      <CardTitle className="text-base font-semibold">Today's Max Bills</CardTitle>
      <p className="text-xs text-muted-foreground">{format(today, 'MMMM d, yyyy')}</p>
    </CardHeader>
    <CardContent className="space-y-2">
      {[
        { label: "Income", value: todaysMaxIncome, color: "green" },
        { label: "Expenses", value: todaysMaxExpense, color: "red" },
        { label: "Due Amount", value: todaysMaxDue, color: "orange" }
      ].map((item, i) => (
        <div
          key={i}
          className={`flex justify-between items-center px-3 py-2 rounded-md bg-${item.color}-50`}
        >
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full bg-${item.color}-500`} />
            <span className="text-sm font-medium">{item.label}</span>
          </div>
          <span className="text-sm font-bold">{formatCurrency(item.value)}</span>
        </div>
      ))}
    </CardContent>
  </Card>

  {/* Today's Due */}
  <Card className="h-full">
    <CardHeader className="pb-2">
      <CardTitle className="text-base font-semibold">Today's Due</CardTitle>
      <p className="text-xs text-muted-foreground">{format(today, 'MMMM d, yyyy')}</p>
    </CardHeader>
    <CardContent className="flex flex-col items-center justify-center h-[120px]">
      <div className="text-3xl font-bold text-orange-600">
        {formatCurrency(todaysDue)}
      </div>
      <p className="text-sm text-muted-foreground mt-1">Unpaid amount for today</p>
    </CardContent>
  </Card>
</div>


      <MonthlyChart />

      {/* Recent Transactions */}
    <Card>
      <CardHeader className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <CardTitle>Recent Transactions</CardTitle>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Select 
              value={transactionFilter} 
              onValueChange={(value) => setTransactionFilter(value as 'all' | 'today' | 'week' | 'month' | 'custom')}
            >
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="Filter by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">By Month</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>

            {transactionFilter === 'month' && (
              <Select
                value={selectedMonth ? selectedMonth.toISOString() : ''}
                onValueChange={(value) => setSelectedMonth(value ? new Date(value) : null)}
              >
                <SelectTrigger className="w-full sm:w-[140px]">
                  <SelectValue placeholder="Select month">
                    {selectedMonth ? format(selectedMonth, 'MMM yyyy') : 'Select month'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month.toISOString()} value={month.toISOString()}>
                      {format(month, 'MMM yyyy')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Select 
              value={sortOption} 
              onValueChange={(value) => setSortOption(value as 'newest' | 'oldest' | 'high' | 'low')}
            >
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="high">Amount (High-Low)</SelectItem>
                <SelectItem value="low">Amount (Low-High)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <span className="text-sm text-muted-foreground">
          {transactionFilteredBills.length} {transactionFilteredBills.length === 1 ? 'transaction' : 'transactions'}
        </span>
      </CardHeader>
      <CardContent>
        {transactionFilteredBills.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">
            No transactions found for the selected filters.
          </p>
        ) : (
          <div className="max-h-80 overflow-y-auto space-y-1 pr-2">
            {transactionFilteredBills.map((bill) => (
              <div
                key={bill.id}
                className="flex justify-between py-2 border-b last:border-0 hover:bg-gray-50 cursor-pointer p-2 rounded-md transition-colors"
                onClick={() => setSelectedBill(bill.id)}
              >
                <div>
                  <span className="font-medium">{bill.title || 'Untitled'}</span>
                  <p className="text-sm text-muted-foreground">
                    {new Date(bill.date).toLocaleDateString()}
                  </p>
                </div>
                <div className={`font-semibold ${bill.type === 'income' ? 'text-income' : 'text-expense'}`}>
                  {bill.type === 'income' ? '+' : '-'}₹{bill.amount.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>

      {/* Transaction Detail Modal */}
      {selectedBill && (
        <TransactionDetail
          billId={selectedBill}
          onClose={() => setSelectedBill(null)}
        />
      )}
    </div>
  );
};

export default Dashboard;