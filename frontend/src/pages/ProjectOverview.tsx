import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { projectService } from '../services/projectService';
import type { ProjectOverviewResponse, Document } from '../types/project';
import { toast } from 'react-hot-toast';

const formatBytes = (bytes: number, decimals = 2) => {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

const ProjectOverview: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [overview, setOverview] = useState<ProjectOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit Project Info State
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchOverview = async () => {
      if (!projectId) return;
      try {
        setLoading(true);
        const data = await projectService.getProjectOverview(projectId);
        setOverview(data);
      } catch (error) {
        console.error('Failed to fetch overview', error);
      } finally {
        setLoading(false);
      }
    };
    fetchOverview();
  }, [projectId]);

  const handleEditClick = () => {
    if (overview) {
      setEditName(overview.name);
      setEditDesc(overview.description);
      setIsEditing(true);
    }
  };

  const handleSaveProjectInfo = async () => {
    if (!projectId || !overview) return;
    try {
      setIsSaving(true);
      await projectService.updateProject(projectId, {
        name: editName,
        description: editDesc,
        isPublic: overview.isPublic
      });
      setOverview({ ...overview, name: editName, description: editDesc });
      setIsEditing(false);
      toast.success('Đã cập nhật thông tin dự án');
    } catch (error) {
      toast.error('Không thể cập nhật thông tin dự án');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!overview) {
    return <div className="text-center p-8 text-on-surface-variant">Không thể tải dữ liệu tổng quan.</div>;
  }

  const storagePercentage = Math.min(100, (overview.usedStorageBytes / overview.storageQuotaBytes) * 100);

  // SVG Doughnut logic
  let cumulativePercent = 0;
  const colors = ['#4f46e5', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];
  const distributionArray = Object.entries(overview.documentTypeDistribution);
  
  const getCoordinatesForPercent = (percent: number) => {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="h-full flex flex-col gap-6">
      <div className="bg-surface-container-lowest border border-outline-variant/30 p-6 rounded-2xl shadow-sm relative group">
        {!isEditing ? (
          <>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-2xl font-bold mb-2 flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary text-3xl">workspaces</span>
                  {overview.name}
                </h3>
                <p className="text-on-surface-variant whitespace-pre-line">{overview.description || 'Chưa có mô tả'}</p>
              </div>
              <button 
                onClick={handleEditClick}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-lg flex items-center justify-center"
                title="Sửa thông tin dự án"
              >
                <span className="material-symbols-outlined">edit</span>
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1 text-on-surface">Tên dự án</label>
              <input 
                type="text" 
                value={editName} 
                onChange={(e) => setEditName(e.target.value)}
                className="w-full bg-surface-container border border-outline-variant/50 rounded-md px-4 py-2 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1 text-on-surface">Mô tả</label>
              <textarea 
                value={editDesc} 
                onChange={(e) => setEditDesc(e.target.value)}
                rows={3}
                className="w-full bg-surface-container border border-outline-variant/50 rounded-md px-4 py-2 outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-y"
              ></textarea>
            </div>
            <div className="flex justify-end gap-2 mt-2">
              <button 
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-on-surface-variant hover:bg-outline-variant/20 transition-colors"
              >
                Hủy
              </button>
              <button 
                onClick={handleSaveProjectInfo}
                disabled={isSaving || !editName.trim()}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isSaving ? <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span> : 'Lưu'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface-container-lowest border border-outline-variant/30 p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-2xl">description</span>
          </div>
          <div>
            <p className="text-sm font-medium text-on-surface-variant">Tổng tài liệu</p>
            <p className="text-2xl font-bold">{overview.totalDocuments}</p>
          </div>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant/30 p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-2xl">group</span>
          </div>
          <div>
            <p className="text-sm font-medium text-on-surface-variant">Thành viên</p>
            <p className="text-2xl font-bold">{overview.totalMembers}</p>
          </div>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant/30 p-5 rounded-2xl shadow-sm flex flex-col justify-center">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-on-surface-variant">Dung lượng sử dụng</p>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
              {storagePercentage.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-outline-variant/30 rounded-full h-2.5 overflow-hidden">
            <div 
              className="bg-primary h-2.5 rounded-full transition-all duration-1000 ease-out" 
              style={{ width: `${storagePercentage}%` }}
            ></div>
          </div>
          <p className="text-xs text-on-surface-variant mt-2 text-right">
            {formatBytes(overview.usedStorageBytes)} / {formatBytes(overview.storageQuotaBytes)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Doughnut Chart */}
        <div className="bg-surface-container-lowest border border-outline-variant/30 p-6 rounded-2xl shadow-sm lg:col-span-1">
          <h4 className="font-bold mb-6 flex items-center gap-2 text-on-surface">
            <span className="material-symbols-outlined text-primary text-lg">pie_chart</span>
            Phân bổ loại tài liệu
          </h4>
          {distributionArray.length > 0 ? (
            <div className="flex flex-col items-center">
              <div className="relative w-40 h-40">
                <svg viewBox="-1 -1 2 2" className="transform -rotate-90">
                  {distributionArray.map((item, index) => {
                    const count = item[1];
                    const percent = count / overview.totalDocuments;
                    
                    const [startX, startY] = getCoordinatesForPercent(cumulativePercent);
                    cumulativePercent += percent;
                    const [endX, endY] = getCoordinatesForPercent(cumulativePercent);
                    const largeArcFlag = percent > 0.5 ? 1 : 0;
                    
                    const pathData = [
                      `M ${startX} ${startY}`,
                      `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
                      `L 0 0`,
                    ].join(' ');

                    return (
                      <path 
                        key={item[0]} 
                        d={pathData} 
                        fill={colors[index % colors.length]}
                        className="hover:opacity-80 transition-opacity cursor-pointer"
                      >
                        <title>{`${item[0]}: ${count}`}</title>
                      </path>
                    );
                  })}
                  {/* Inner circle for doughnut */}
                  <circle cx="0" cy="0" r="0.6" className="fill-surface-container-lowest" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className="text-2xl font-bold">{overview.totalDocuments}</span>
                  <span className="text-xs text-on-surface-variant font-medium">Tài liệu</span>
                </div>
              </div>
              <div className="mt-6 w-full flex flex-col gap-2">
                {distributionArray.map((item, index) => (
                  <div key={item[0]} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: colors[index % colors.length] }}></div>
                      <span className="text-on-surface truncate max-w-[120px]">{item[0]}</span>
                    </div>
                    <span className="font-semibold">{item[1]}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center text-on-surface-variant text-sm">
              Chưa có tài liệu nào.
            </div>
          )}
        </div>

        {/* Recent Documents */}
        <div className="bg-surface-container-lowest border border-outline-variant/30 p-6 rounded-2xl shadow-sm lg:col-span-2 flex flex-col">
          <h4 className="font-bold mb-4 flex items-center gap-2 text-on-surface">
            <span className="material-symbols-outlined text-primary text-lg">history</span>
            Tài liệu mới nhất
          </h4>
          <div className="flex-1 overflow-auto -mx-2 px-2">
            {overview.recentDocuments.length > 0 ? (
              <div className="flex flex-col gap-2">
                {overview.recentDocuments.map((doc: Document) => (
                  <div key={doc.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface transition-colors border border-transparent hover:border-outline-variant/30 group">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined">
                        {doc.tag === '[Tài liệu]' ? 'description' : doc.tag === '[Media]' ? 'perm_media' : 'draft'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-on-surface truncate">{doc.fileName}</p>
                      <div className="flex items-center gap-2 text-xs text-on-surface-variant mt-0.5">
                        <span>{formatBytes(doc.fileSizeBytes)}</span>
                        <span>•</span>
                        <span>{new Date(doc.createdAt).toLocaleDateString('vi-VN')}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-on-surface-variant text-sm py-10">
                <span className="material-symbols-outlined text-4xl mb-2 text-outline-variant">folder_off</span>
                <p>Chưa có tài liệu nào trong dự án.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProjectOverview;
