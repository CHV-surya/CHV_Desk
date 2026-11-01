import React from 'react';
import { Video, Image, Edit3, Target, CheckCircle2 } from 'lucide-react';
import { DigitalMarketingStats } from '../../types';

interface TargetCardsProps {
  stats: DigitalMarketingStats;
  onEditTargets: () => void;
  isLoading?: boolean;
}

export const TargetCards: React.FC<TargetCardsProps> = ({
  stats,
  onEditTargets,
  isLoading = false,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
      {/* 1. Video Targets Card */}
      <div className="glass-card rounded-2xl p-5 border border-slate-200/80 bg-white shadow-xs hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center shadow-2xs">
              <Video className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base uppercase tracking-wider">
                Video Targets
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Reels & Video production for this month
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onEditTargets}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:text-orange-600 hover:bg-orange-50/70 border border-slate-200 hover:border-orange-200 transition-colors cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            Edit Target
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-4 text-center">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
              Monthly Target
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 mt-1 block">
              {stats.videoTarget}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100">
            <span className="block text-xs font-bold text-blue-600 uppercase tracking-wider">
              Videos Added
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold font-mono text-blue-700 mt-1 block">
              {stats.videosAdded}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100">
            <span className="block text-xs font-bold text-emerald-600 uppercase tracking-wider">
              Scheduled
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-700 mt-1 block">
              {stats.videosCompleted}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4 pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs font-bold mb-1.5">
            <span className="text-slate-600 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-orange-500" />
              Target Progress
            </span>
            <span className="text-orange-600 font-mono text-sm">
              {stats.videoProgress}%
            </span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-orange-400 to-orange-600 transition-all duration-300"
              style={{ width: `${Math.min(100, stats.videoProgress)}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. Poster Targets Card */}
      <div className="glass-card rounded-2xl p-5 border border-slate-200/80 bg-white shadow-xs hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shadow-2xs">
              <Image className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base uppercase tracking-wider">
                Poster Targets
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Posters & Static creatives for this month
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onEditTargets}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:text-emerald-600 hover:bg-emerald-50/70 border border-slate-200 hover:border-emerald-200 transition-colors cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            Edit Target
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-4 text-center">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
              Monthly Target
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 mt-1 block">
              {stats.posterTarget}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-purple-50/60 border border-purple-100">
            <span className="block text-xs font-bold text-purple-600 uppercase tracking-wider">
              Posters Added
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold font-mono text-purple-700 mt-1 block">
              {stats.postersAdded}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100">
            <span className="block text-xs font-bold text-emerald-600 uppercase tracking-wider">
              Scheduled
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-700 mt-1 block">
              {stats.postersCompleted}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4 pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs font-bold mb-1.5">
            <span className="text-slate-600 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              Target Progress
            </span>
            <span className="text-emerald-600 font-mono text-sm">
              {stats.posterProgress}%
            </span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-300"
              style={{ width: `${Math.min(100, stats.posterProgress)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
