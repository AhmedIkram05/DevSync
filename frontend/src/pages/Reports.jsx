import React, { useState, useEffect } from 'react';
import { dashboardService } from '../services/utils/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ReportTable from '../components/ReportTable';

const Reports = () => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reportType, setReportType] = useState('tasks'); // tasks, github, developers
  const [dateRange, setDateRange] = useState('week'); // week, month, quarter, year
  
  useEffect(() => {
    const fetchReportData = async () => {
      try {
        setLoading(true);
        
        // Fetch report data based on selected type and date range
        const data = await dashboardService.getReportData(reportType, dateRange);
        setReportData(data);
        
      } catch (err) {
        console.error('Failed to fetch report data:', err);
        setError('Failed to load report data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchReportData();
  }, [reportType, dateRange]);
  
  // Render different charts based on the report type
  const renderCharts = () => {
    if (!reportData) return null;
    
    const { summary, details } = reportData;
    
    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {reportType === 'tasks' && (
            <>
              <SummaryCard 
                title="Total Tasks" 
                value={summary.total || 0} 
                color="blue"
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                }
              />
              <SummaryCard 
                title="Completed" 
                value={summary.completed || 0} 
                color="green"
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                }
              />
              <SummaryCard 
                title="In Progress" 
                value={summary.in_progress || 0} 
                color="yellow"
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              />
              <SummaryCard 
                title="Overdue" 
                value={summary.overdue || 0} 
                color="red"
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              />
            </>
          )}
          
          {reportType === 'github' && (
            <>
              <SummaryCard 
                title="Connected Repos" 
                value={summary.repos || 0} 
                color="purple"
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                }
              />
              <SummaryCard 
                title="Open Issues" 
                value={summary.open_issues || 0} 
                color="blue"
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                }
              />
              <SummaryCard 
                title="Open PRs" 
                value={summary.open_prs || 0} 
                color="green"
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
                }
              />
              <SummaryCard 
                title="Recent Commits" 
                value={summary.recent_commits || 0} 
                color="yellow"
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                }
              />
            </>
          )}
          
          {reportType === 'developers' && (
            <>
              <SummaryCard 
                title="Team Members" 
                value={summary.team_members || 0} 
                color="blue"
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                }
              />
              <SummaryCard 
                title="Avg. Tasks Per Dev" 
                value={summary.avg_tasks || 0} 
                color="purple"
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                }
              />
              <SummaryCard 
                title="Avg. Completion Rate" 
                value={`${summary.avg_completion || 0}%`} 
                color="green"
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                }
              />
              <SummaryCard 
                title="Active Developers" 
                value={summary.active_devs || 0} 
                color="yellow"
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              />
            </>
          )}
        </div>
        
        {/* Visual Charts - In a real app, you would use a charting library like Chart.js or Recharts */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="h-64 flex items-center justify-center border border-dashed border-gray-300 rounded">
            <p className="text-gray-500 italic">
              Charts would be displayed here using a library like Chart.js or Recharts
            </p>
          </div>
        </div>
        
        {/* Detailed Report Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <ReportTable 
            data={details || []} 
            type={reportType}
          />
        </div>
      </div>
    );
  };
  
  // Summary card component for data visualization
  const SummaryCard = ({ title, value, color, icon }) => {
    const colorClasses = {
      blue: 'bg-blue-100 text-blue-500 border-blue-200',
      green: 'bg-green-100 text-green-500 border-green-200',
      yellow: 'bg-yellow-100 text-yellow-500 border-yellow-200',
      red: 'bg-red-100 text-red-500 border-red-200',
      purple: 'bg-purple-100 text-purple-500 border-purple-200',
    };
    
    return (
      <div className={`border rounded-lg p-4 ${colorClasses[color] || 'bg-gray-100 text-gray-500 border-gray-200'}`}>
        <div className="flex items-center">
          <div className="mr-4">
            {icon}
          </div>
          <div>
            <p className="text-sm font-medium opacity-75">{title}</p>
            <p className="text-2xl font-semibold">{value}</p>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-screen items-center justify-center p-6">
        <div className="text-xl text-red-600 mb-4">{error}</div>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Reports & Analytics</h1>
      
      {/* Report Controls */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="tasks">Task Reports</option>
              <option value="github">GitHub Activity</option>
              <option value="developers">Developer Performance</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="quarter">Last Quarter</option>
              <option value="year">Last Year</option>
            </select>
          </div>
        </div>
        
        <div className="mt-4 flex justify-end">
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Generate Report
          </button>
        </div>
      </div>
      
      {/* Report Content */}
      {renderCharts()}
    </div>
  );
};

export default Reports;