import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useData } from '../../context/DataContext';
import { getFormattedDate } from '../../data/mockData';

export const ActivityChart: React.FC = () => {
  const { departments, employees, activities } = useData();
  const [viewMode, setViewMode] = useState<'attendance' | 'workload'>('attendance');

  const today = getFormattedDate();

  // Aggregate today's data per department
  const attendanceData = departments.map((dept) => {
    const deptEmployees = employees.filter((e) => e.assignedDepartments.includes(dept.id));
    const deptActivities = activities.filter((a) => a.date === today && a.departmentId === dept.id);

    const working = deptActivities.filter((a) => a.status === 'working').length;
    const completed = deptActivities.filter((a) => a.status === 'completed').length;
    const notJoined = Math.max(0, deptEmployees.length - (working + completed));

    return {
      department: dept.name,
      Working: working,
      Completed: completed,
      'Not Joined': notJoined,
      Total: deptEmployees.length,
    };
  });

  const workloadData = [
    { day: 'Mon', Software: 28, 'Video Editor': 19, 'Digital Marketing': 22 },
    { day: 'Tue', Software: 32, 'Video Editor': 24, 'Digital Marketing': 26 },
    { day: 'Wed', Software: 30, 'Video Editor': 22, 'Digital Marketing': 25 },
    { day: 'Thu', Software: 34, 'Video Editor': 26, 'Digital Marketing': 28 },
    { day: 'Fri', Software: 31, 'Video Editor': 25, 'Digital Marketing': 27 },
  ];

  const tooltipStyle = {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(12px)',
    borderRadius: '12px',
    boxShadow: '0 8px 30px rgba(20, 38, 83, 0.1)',
    border: '1px solid rgba(226, 232, 240, 0.8)',
    fontSize: '12px',
    padding: '8px 14px',
  };

  return (
    <div className="glass-card rounded-2xl p-5 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-4 border-b border-slate-100/80">
        <div>
          <h3 className="text-sm sm:text-base font-extrabold text-slate-900 uppercase tracking-wider">
            Operational Workload & Attendance Distribution
          </h3>
          <p className="text-xs sm:text-[13px] text-slate-500 mt-0.5 font-medium">
            Cross-department employee participation breakdown
          </p>
        </div>

        {/* Toggle View Mode */}
        <div className="flex items-center p-1 bg-slate-100/80 rounded-xl text-xs sm:text-[13px] self-start sm:self-auto border border-slate-200/60">
          <button
            onClick={() => setViewMode('attendance')}
            className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-[13px] font-bold transition-all ${
              viewMode === 'attendance'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Today's Attendance
          </button>
          <button
            onClick={() => setViewMode('workload')}
            className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-[13px] font-bold transition-all ${
              viewMode === 'workload'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Weekly Hours (h)
          </button>
        </div>
      </div>

      <div className="h-68 w-full">
        {viewMode === 'attendance' ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={attendanceData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              barGap={5}
            >
              <CartesianGrid strokeDasharray="2 2" vertical={false} stroke="#F1F5F9" />
              <XAxis
                dataKey="department"
                tick={{ fontSize: 12, fill: '#64748B', fontWeight: 600 }}
                axisLine={{ stroke: '#E2E8F0' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#64748B' }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend
                wrapperStyle={{ fontSize: '12px', paddingTop: '10px', fontWeight: 600 }}
                iconType="circle"
                iconSize={8}
              />
              <Bar dataKey="Working" fill="#2563EB" radius={[4, 4, 0, 0]} maxBarSize={32} />
              <Bar dataKey="Completed" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={32} />
              <Bar dataKey="Not Joined" fill="#94A3B8" radius={[4, 4, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={workloadData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              barGap={5}
            >
              <CartesianGrid strokeDasharray="2 2" vertical={false} stroke="#F1F5F9" />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 12, fill: '#64748B', fontWeight: 600 }}
                axisLine={{ stroke: '#E2E8F0' }}
                tickLine={false}
              />
              <YAxis
                unit="h"
                tick={{ fontSize: 12, fill: '#64748B' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend
                wrapperStyle={{ fontSize: '12px', paddingTop: '10px', fontWeight: 600 }}
                iconType="circle"
                iconSize={8}
              />
              <Bar dataKey="Software" fill="#2563EB" radius={[4, 4, 0, 0]} maxBarSize={26} />
              <Bar dataKey="Video Editor" fill="#8B5CF6" radius={[4, 4, 0, 0]} maxBarSize={26} />
              <Bar dataKey="Digital Marketing" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={26} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
