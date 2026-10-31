import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  FolderKanban,
  Activity,
  ArrowRight,
  Code2,
  Film,
  TrendingUp,
  Building,
  Clock,
  Sparkles,
  MessageSquare,
} from 'lucide-react';
import { Department, Employee } from '../../types';
import { Button } from '../common/Button';
import { Avatar } from '../common/Avatar';

interface DepartmentCardProps {
  department: Department;
  employeeCount: number;
  projectCount: number;
  currentlyWorkingCount: number;
  recentActivityNote?: string;
  projectTags?: string[];
  departmentEmployees?: Employee[];
}

export const DepartmentCard: React.FC<DepartmentCardProps> = ({
  department,
  employeeCount,
  projectCount,
  currentlyWorkingCount,
  recentActivityNote,
  projectTags = [],
  departmentEmployees = [],
}) => {
  const navigate = useNavigate();

  const getDeptConfig = (slug: string) => {
    switch (slug) {
      case 'software':
        return {
          icon: <Code2 className="w-5 h-5 text-blue-600" />,
          domain: 'Engineering & Systems',
          accentColor: '#2563EB',
          accentBg: 'bg-blue-50 text-blue-700 border-blue-200/60',
          cardGlow: 'hover:border-blue-400/50 hover:shadow-blue-500/5',
          btnHover: 'hover:bg-blue-600 hover:text-white hover:border-blue-600',
        };
      case 'video-editor':
        return {
          icon: <Film className="w-5 h-5 text-purple-600" />,
          domain: 'Creative & Video Production',
          accentColor: '#8B5CF6',
          accentBg: 'bg-purple-50 text-purple-700 border-purple-200/60',
          cardGlow: 'hover:border-purple-400/50 hover:shadow-purple-500/5',
          btnHover: 'hover:bg-purple-600 hover:text-white hover:border-purple-600',
        };
      case 'digital-marketing':
        return {
          icon: <TrendingUp className="w-5 h-5 text-emerald-600" />,
          domain: 'Growth & Demand Generation',
          accentColor: '#10B981',
          accentBg: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
          cardGlow: 'hover:border-emerald-400/50 hover:shadow-emerald-500/5',
          btnHover: 'hover:bg-emerald-600 hover:text-white hover:border-emerald-600',
        };
      default:
        return {
          icon: <Building className="w-5 h-5 text-slate-600" />,
          domain: 'Operations Unit',
          accentColor: '#64748B',
          accentBg: 'bg-slate-50 text-slate-700 border-slate-200/60',
          cardGlow: 'hover:border-slate-400/50',
          btnHover: 'hover:bg-slate-800 hover:text-white',
        };
    }
  };

  const config = getDeptConfig(department.slug);

  return (
    <div
      className={`glass-card glass-card-hover rounded-2xl p-5 sm:p-6 transition-all flex flex-col justify-between border-t-4 h-full min-w-0 overflow-hidden ${config.cardGlow}`}
      style={{ borderTopColor: config.accentColor }}
    >
      <div className="min-w-0 flex flex-col flex-1">
        {/* 1. Department Icon and Name */}
        <div className="flex items-start justify-between pb-3.5 border-b border-slate-100 min-w-0">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center border font-bold shadow-2xs flex-shrink-0"
              style={{
                backgroundColor: `${department.color}15`,
                borderColor: `${department.color}30`,
              }}
            >
              {config.icon}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-extrabold text-slate-900 text-base sm:text-[17px] tracking-tight truncate">
                {department.name}
              </h4>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider truncate mt-0.5">
                {config.domain}
              </p>
            </div>
          </div>

          <span
            className="w-3 h-3 rounded-full mt-1.5 flex-shrink-0 ring-4 ring-slate-100"
            style={{ backgroundColor: department.color }}
            title={`${department.name} Active`}
          />
        </div>

        {/* 2. Department Description */}
        <div className="py-2.5 min-w-0">
          <p className="text-xs sm:text-[13px] text-slate-500 font-medium leading-relaxed line-clamp-2">
            {department.description || config.domain}
          </p>
        </div>

        {/* 3. Operational Statistics (Staff, Projects, Active Now) */}
        <div className="grid grid-cols-3 gap-2 my-2 py-2.5 px-3 bg-slate-50/80 rounded-xl border border-slate-100 text-center min-w-0">
          <div className="min-w-0">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block truncate">
              Staff
            </span>
            <span className="text-lg sm:text-xl font-extrabold font-mono text-slate-900 mt-0.5 block truncate">
              {employeeCount}
            </span>
          </div>

          <div className="border-x border-slate-200/80 px-1 min-w-0">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block truncate">
              Projects
            </span>
            <span className="text-lg sm:text-xl font-extrabold font-mono text-slate-900 mt-0.5 block truncate">
              {projectCount}
            </span>
          </div>

          <div className="min-w-0">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block truncate">
              Active Now
            </span>
            <span className="text-lg sm:text-xl font-extrabold font-mono text-emerald-600 flex items-center justify-center gap-1.5 mt-0.5 truncate">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
              {currentlyWorkingCount}
            </span>
          </div>
        </div>

        {/* 4. Assigned Team with small 36px circular avatars */}
        <div className="my-2.5 py-2 border-t border-slate-100/80 flex items-center justify-between min-w-0">
          <div className="flex items-center gap-1.5 min-w-0 flex-shrink-0">
            <Users className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Assigned Team:
            </span>
          </div>

          <div className="flex items-center -space-x-2.5 overflow-hidden p-0.5 flex-shrink-0">
            {departmentEmployees.slice(0, 4).map((emp) => (
              <Avatar
                key={emp.id}
                name={emp.fullName}
                size="sm"
                className="w-9 h-9 border-2 border-white ring-1 ring-slate-200/70 shadow-2xs flex-shrink-0"
              />
            ))}
            {departmentEmployees.length > 4 && (
              <div
                className="w-9 h-9 rounded-full bg-slate-100 border-2 border-white ring-1 ring-slate-200/70 flex items-center justify-center text-xs font-bold text-slate-700 shadow-2xs flex-shrink-0"
                title={`${departmentEmployees.length - 4} more members`}
              >
                +{departmentEmployees.length - 4}
              </div>
            )}
            {departmentEmployees.length === 0 && (
              <span className="text-xs text-slate-400 italic">None assigned</span>
            )}
          </div>
        </div>

        {/* 5. Active Projects */}
        <div className="my-2 min-w-0">
          <div className="flex items-center gap-1.5 mb-1.5">
            <FolderKanban className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Active Projects:
            </span>
          </div>
          {projectTags.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 min-w-0">
              {projectTags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white border border-slate-200/90 text-slate-700 shadow-2xs truncate max-w-[130px]"
                >
                  {tag}
                </span>
              ))}
              {projectTags.length > 3 && (
                <span className="px-2 py-1 rounded-lg text-xs font-semibold text-slate-400 bg-slate-100 flex-shrink-0">
                  +{projectTags.length - 3}
                </span>
              )}
            </div>
          ) : (
            <span className="text-xs text-slate-400 italic">No active projects yet</span>
          )}
        </div>

        {/* 6. Latest Pulse / Daily Update */}
        <div className="pt-2.5 mt-auto border-t border-slate-100 flex items-start gap-2.5 min-w-0">
          <MessageSquare className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
              Latest Pulse:
            </span>
            <p className="text-xs sm:text-[13px] text-slate-600 line-clamp-1 italic leading-relaxed font-medium truncate">
              {recentActivityNote ? `"${recentActivityNote}"` : 'No activity logged today yet'}
            </p>
          </div>
        </div>
      </div>

      {/* 7. View Department Button */}
      <div className="pt-3.5 mt-3 border-t border-slate-100">
        <Button
          variant="outline"
          size="md"
          className={`w-full justify-between text-sm font-bold transition-all shadow-2xs ${config.btnHover}`}
          onClick={() => navigate(`/admin/department/${department.id}`)}
          icon={<ArrowRight className="w-4 h-4" />}
          iconPosition="right"
        >
          View Department
        </Button>
      </div>
    </div>
  );
};
