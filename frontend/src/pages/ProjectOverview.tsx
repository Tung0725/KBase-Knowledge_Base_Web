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

  // Description Expand State
  const [isDescExpanded, setIsDescExpanded] = useState(false);

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



  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="h-full flex flex-col gap-3">
      <div className="bg-surface-container-lowest border border-outline-variant/30 p-6 rounded-2xl shadow-sm relative group shrink-0">
        <div className="flex justify-between items-start">
          <div className="w-full flex-1 pr-40">
            <div className="flex items-center gap-3 mb-2 relative">
              <span className="material-symbols-outlined text-primary text-3xl">workspaces</span>
              {isEditing ? (
                <div className="w-full relative">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    maxLength={100}
                    className="text-2xl font-bold bg-transparent border-b-2 border-primary outline-none w-full pb-1 pr-12"
                    autoFocus
                    placeholder="Nhập tên dự án..."
                  />
                  <span className="absolute right-2 bottom-2 text-[10px] text-outline font-medium">
                    {editName.length}/100
                  </span>
                </div>
              ) : (
                <h3 className="text-2xl font-bold">{overview.name}</h3>
              )}
            </div>
            {isEditing ? (
              <textarea
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                rows={10}
                placeholder="Nhập mô tả dự án..."
                className="w-full bg-transparent border-b border-outline-variant/50 focus:border-b-2 focus:border-primary outline-none resize-y mt-2 pb-2 text-on-surface-variant text-base"
              ></textarea>
            ) : (
              <div className="text-on-surface-variant">
                <span className="whitespace-pre-line">
                  {!isDescExpanded && overview.description && overview.description.length > 600
                    ? overview.description.substring(0, overview.description.lastIndexOf(' ', 600)) + '...'
                    : (overview.description || 'Chưa có mô tả')}
                </span>
                {overview.description && overview.description.length > 600 && (
                  <button
                    onClick={() => setIsDescExpanded(!isDescExpanded)}
                    className="text-primary hover:underline text-sm font-semibold ml-2 inline-flex items-center"
                  >
                    {isDescExpanded ? 'Thu gọn' : 'Xem thêm'}
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="absolute top-6 right-6 flex items-center gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-2 rounded-lg text-sm font-semibold text-on-surface-variant hover:bg-outline-variant/20 transition-colors"
                  disabled={isSaving}
                >
                  Hủy
                </button>
                <button
                  onClick={handleSaveProjectInfo}
                  disabled={isSaving || !editName.trim()}
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-1 shadow-sm"
                >
                  {isSaving ? <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span> : <span className="material-symbols-outlined text-[16px]">save</span>}
                  Lưu
                </button>
              </>
            ) : (
              <button
                onClick={handleEditClick}
                className="opacity-0 group-hover:opacity-100 transition-opacity px-3 py-1.5 text-sm font-medium text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-lg flex items-center justify-center gap-1"
                title="Sửa thông tin dự án"
              >
                <span className="material-symbols-outlined text-[18px]">edit</span>

              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
        <div className="bg-surface-container-lowest border border-outline-variant/30 p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-2xl">description</span>
          </div>
          <div className="shrink-0">
            <p className="text-sm font-medium text-on-surface-variant">Tổng tài liệu</p>
            <p className="text-2xl font-bold">{overview.totalDocuments}</p>
          </div>

          <div className="h-10 w-px bg-outline-variant/30 mx-2 shrink-0"></div>

          <div className="flex flex-col gap-1 w-full flex-1 justify-center">
            {[
              { key: '[Tài liệu]', label: 'Tài liệu', color: 'text-blue-600' },
              { key: '[Ảnh]', label: 'Ảnh', color: 'text-green-600' },
              { key: '[Video]', label: 'Video', color: 'text-purple-600' }
            ].map(type => {
              const count = overview.documentTypeDistribution[type.key] || 0;
              const percent = overview.totalDocuments > 0 ? Math.round((count / overview.totalDocuments) * 100) : 0;
              return (
                <div key={type.key} className="flex items-center justify-between">
                  <span className={`text-xs font-semibold ${type.color}`}>{type.label}</span>
                  <span className="text-xs font-bold">{count} <span className="text-[11px] font-normal text-on-surface-variant">({percent}%)</span></span>
                </div>
              );
            })}
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
        
        <div className="bg-surface-container-lowest border border-outline-variant/30 p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-2xl">group</span>
          </div>
          <div>
            <p className="text-sm font-medium text-on-surface-variant">Thành viên</p>
            <p className="text-2xl font-bold">{overview.totalMembers}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        {/* Recent Documents */}
        <div className="bg-surface-container-lowest border border-outline-variant/30 p-6 rounded-2xl shadow-sm flex flex-col h-full">
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
                        {doc.tag === '[Ảnh]' ? 'image' : doc.tag === '[Video]' ? 'movie' : doc.tag === '[Tài liệu]' ? 'description' : 'draft'}
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
