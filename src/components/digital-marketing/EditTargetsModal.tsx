import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Video, Image, Target } from 'lucide-react';

interface EditTargetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoTarget: number;
  posterTarget: number;
  monthName: string;
  year: number;
  onSave: (targets: { videoTarget: number; posterTarget: number }) => Promise<void>;
}

export const EditTargetsModal: React.FC<EditTargetsModalProps> = ({
  isOpen,
  onClose,
  videoTarget: initialVideoTarget,
  posterTarget: initialPosterTarget,
  monthName,
  year,
  onSave,
}) => {
  const [videoTarget, setVideoTarget] = useState(initialVideoTarget);
  const [posterTarget, setPosterTarget] = useState(initialPosterTarget);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setVideoTarget(initialVideoTarget);
    setPosterTarget(initialPosterTarget);
    setError(null);
  }, [initialVideoTarget, initialPosterTarget, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (videoTarget < 0 || posterTarget < 0) {
      setError('Targets must be 0 or greater');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      await onSave({
        videoTarget: Number(videoTarget) || 0,
        posterTarget: Number(posterTarget) || 0,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update targets. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Set Monthly Targets"
      subtitle={`Configure planned production goals for ${monthName} ${year}`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium">
            {error}
          </div>
        )}

        {/* Video Target Input */}
        <div className="p-4 rounded-2xl bg-orange-50/60 border border-orange-200/80">
          <label className="flex items-center gap-2 text-xs font-bold text-orange-950 uppercase tracking-wider mb-2">
            <Video className="w-4 h-4 text-orange-600" />
            Video / Reels Planned Target
          </label>
          <input
            type="number"
            min="0"
            max="1000"
            value={videoTarget}
            onChange={(e) => setVideoTarget(Math.max(0, parseInt(e.target.value, 10) || 0))}
            className="w-full px-3.5 py-2.5 rounded-xl border border-orange-300 bg-white text-slate-900 text-base font-bold font-mono focus:outline-none focus:ring-2 focus:ring-orange-500/40"
          />
          <p className="text-xs text-orange-800/80 mt-1.5 font-medium">
            Number of videos/reels planned for this calendar month.
          </p>
        </div>

        {/* Poster Target Input */}
        <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80">
          <label className="flex items-center gap-2 text-xs font-bold text-emerald-950 uppercase tracking-wider mb-2">
            <Image className="w-4 h-4 text-emerald-600" />
            Poster / Static Creatives Planned Target
          </label>
          <input
            type="number"
            min="0"
            max="1000"
            value={posterTarget}
            onChange={(e) => setPosterTarget(Math.max(0, parseInt(e.target.value, 10) || 0))}
            className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-300 bg-white text-slate-900 text-base font-bold font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          />
          <p className="text-xs text-emerald-800/80 mt-1.5 font-medium">
            Number of posters/banners planned for this calendar month.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isLoading}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            Save Targets
          </Button>
        </div>
      </form>
    </Modal>
  );
};
