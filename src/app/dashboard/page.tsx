'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  LineElement,
  PointElement,
  Title, 
  Tooltip, 
  Legend,
  ChartData
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import MainLayout from '@/components/layout/MainLayout';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

export default function Dashboard() {
  // Sample data for charts
  const barChartData: ChartData<'bar'> = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Completed',
        data: [12, 8, 15, 25, 12, 20, 10],
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
      },
      {
        label: 'Pending',
        data: [8, 12, 5, 18, 25, 15, 22],
        backgroundColor: 'rgba(251, 191, 136, 0.8)',
      }
    ],
  };
  
  const lineChartData: ChartData<'line'> = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Task Progress',
        data: [30, 20, 25, 40, 50, 35, 30],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
      }
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <MainLayout>
      <div className="p-8">
        <h2 className="text-xl font-semibold mb-6">Your teams progress</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Task Status Card */}
          <div className="bg-[var(--card-background)] border border-[var(--card-border)] p-6 rounded-lg shadow-sm">
            <div className="flex justify-between mb-4">
              <h3 className="text-lg font-medium">Task Status</h3>
              <button className="text-sm text-[var(--text-secondary)]">Show more details</button>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-orange-50 p-3 rounded-md text-center">
                <div className="text-xl font-semibold">12</div>
                <div className="text-sm text-[var(--text-secondary)]">To do</div>
              </div>
              
              <div className="bg-blue-50 p-3 rounded-md text-center">
                <div className="text-xl font-semibold">23</div>
                <div className="text-sm text-[var(--text-secondary)]">In progress</div>
              </div>
              
              <div className="bg-indigo-50 p-3 rounded-md text-center">
                <div className="text-xl font-semibold">64</div>
                <div className="text-sm text-[var(--text-secondary)]">Done</div>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="text-sm text-[var(--text-secondary)]">Last 7 days</div>
              <button className="text-sm text-blue-500 font-medium">PROGRESS REPORT</button>
            </div>
          </div>
          
          {/* Upcoming Tasks Card */}
          <div className="bg-[var(--card-background)] border border-[var(--card-border)] p-6 rounded-lg shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center">
                <div className="bg-gray-100 p-2 rounded-md mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <div className="text-2xl font-bold">40</div>
                  <div className="text-sm text-[var(--text-secondary)]">Upcoming Task</div>
                </div>
              </div>
              <div className="text-green-500 text-sm font-medium">
                ↑ 42.5%
              </div>
            </div>
            
            <div className="flex justify-between text-sm mb-4">
              <div>Completed Task: <span className="font-medium">30</span></div>
              <div>On Progress: <span className="font-medium">20</span></div>
            </div>
            
            <div className="h-48">
              <Bar data={barChartData} options={chartOptions} height={200} />
            </div>
            
            <div className="flex justify-between items-center mt-4">
              <div className="text-sm text-[var(--text-secondary)]">Last 7 days</div>
              <button className="text-sm text-blue-500 font-medium">LEADS REPORT</button>
            </div>
          </div>
          
          {/* Weekly Tasks Card */}
          <div className="bg-[var(--card-background)] border border-[var(--card-border)] p-6 rounded-lg shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <div>
                <div className="text-2xl font-bold">30</div>
                <div className="text-sm text-[var(--text-secondary)]">Task this week</div>
              </div>
              <div className="text-green-500 text-sm font-medium">
                12% ↑
              </div>
            </div>
            
            <div className="h-48">
              <Line data={lineChartData} options={chartOptions} height={200} />
            </div>
            
            <div className="flex justify-between items-center mt-4">
              <div className="text-sm text-[var(--text-secondary)]">Last 7 days</div>
              <button className="text-sm text-blue-500 font-medium">USERS REPORT</button>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}