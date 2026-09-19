import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams } from 'react-router-dom';
import { projectService } from '../services/projectService';
import { websocketService } from '../services/websocketService';
import type { ProjectMember, ProjectRole } from '../types/project';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

const ProjectMembers: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { user } = useAuth();
  
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addEmail, setAddEmail] = useState('');
  const [addRole, setAddRole] = useState<ProjectRole>('VIEWER');
  const [isAdding, setIsAdding] = useState(false);
  
  // Fake invite state since we don't have getProjectById yet, we will just use a fake invite code or fetch it differently
  // Actually, we can fetch project details or we can manage invite links in a separate tab or here.
  // For now, let's assume we can fetch the project to get inviteCode and isInviteLinkActive.
  // We'll mock it if not available.
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [isLinkActive, setIsLinkActive] = useState(false);

  useEffect(() => {
    if (projectId) {
      loadMembers();
      
      websocketService.connect(projectId, () => {
        // Triggered when a STOMP message is received
        loadMembers();
      });
    }

    return () => {
      websocketService.disconnect();
    };
  }, [projectId]);

  const loadMembers = async () => {
    try {
      setLoading(true);
      const data = await projectService.getProjectMembers(projectId!);
      setMembers(data);
      
      const owner = data.find(m => m.role === 'OWNER');
      if (owner && owner.userId === user?.userId) {
        setIsOwner(true);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi khi tải thành viên');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !addEmail) return;
    
    try {
      setIsAdding(true);
      await projectService.addMember(projectId, { email: addEmail, role: addRole });
      toast.success('Thêm thành viên thành công');
      setIsAddModalOpen(false);
      setAddEmail('');
      loadMembers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi khi thêm thành viên');
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!projectId) return;
    if (!window.confirm('Bạn có chắc chắn muốn xóa thành viên này khỏi dự án?')) return;
    
    try {
      await projectService.removeMember(projectId, userId);
      toast.success('Xóa thành viên thành công');
      loadMembers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi khi xóa thành viên');
    }
  };

  const handleToggleLink = async () => {
    if (!projectId) return;
    try {
      const newState = !isLinkActive;
      await projectService.toggleInviteLink(projectId, newState);
      setIsLinkActive(newState);
      toast.success(newState ? 'Đã bật link chia sẻ' : 'Đã tắt link chia sẻ');
      if (newState && !inviteCode) {
        handleRegenerateLink();
      }
    } catch (error: any) {
      toast.error('Lỗi khi bật/tắt link');
    }
  };

  const handleRegenerateLink = async () => {
    if (!projectId) return;
    try {
      const newCode = await projectService.regenerateInviteCode(projectId);
      setInviteCode(newCode);
      setIsLinkActive(true);
      toast.success('Đã tạo link mới');
    } catch (error: any) {
      toast.error('Lỗi khi tạo link');
    }
  };

  const handleUpdateRole = async (userId: string, newRole: ProjectRole) => {
    if (!projectId) return;
    try {
      await projectService.updateMemberRole(projectId, userId, newRole);
      toast.success('Đã cập nhật quyền thành viên');
      loadMembers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi khi cập nhật quyền');
    }
  };

  const handleBulkUpdateRole = async (newRole: ProjectRole) => {
    if (!projectId) return;
    if (!window.confirm(`Bạn có chắc muốn chuyển TẤT CẢ thành viên (trừ chủ sở hữu) thành ${newRole === 'EDITOR' ? 'Người chỉnh sửa' : 'Người xem'}?`)) return;
    
    try {
      await projectService.updateAllMembersRole(projectId, newRole);
      toast.success('Đã cập nhật quyền cho tất cả thành viên');
      loadMembers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi khi cập nhật quyền hàng loạt');
    }
  };
  
  const inviteUrl = inviteCode ? `${window.location.origin}/join/${inviteCode}` : '';

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="h-full flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">group</span>
          Thành viên
        </h3>
        {isOwner && (
          <div className="flex gap-2">
            <button 
              onClick={() => handleBulkUpdateRole('VIEWER')}
              className="flex items-center gap-1 px-3 py-2 bg-surface-container hover:bg-outline-variant/20 text-on-surface rounded-xl text-sm font-semibold transition-colors"
              title="Chuyển tất cả thành Người xem"
            >
              <span className="material-symbols-outlined text-[18px]">visibility</span>
              Tất cả thành Viewer
            </button>
            <button 
              onClick={() => handleBulkUpdateRole('EDITOR')}
              className="flex items-center gap-1 px-3 py-2 bg-surface-container hover:bg-outline-variant/20 text-on-surface rounded-xl text-sm font-semibold transition-colors"
              title="Chuyển tất cả thành Người chỉnh sửa"
            >
              <span className="material-symbols-outlined text-[18px]">edit</span>
              Tất cả thành Editor
            </button>
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary-container text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors ml-2"
            >
              <span className="material-symbols-outlined text-[18px]">person_add</span>
              Mời thành viên
            </button>
          </div>
        )}
      </div>

      {isOwner && (
        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">link</span>
                Link mời tham gia dự án
              </h4>
              <p className="text-sm text-on-surface-variant mt-1">Bất kỳ ai có tài khoản KBase khi bấm vào link này sẽ được tham gia dự án (Quyền Người xem).</p>
            </div>
            
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={isLinkActive} onChange={handleToggleLink} />
              <div className="w-11 h-6 bg-outline-variant/30 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
          
          <AnimatePresence>
            {isLinkActive && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }} 
                animate={{ opacity: 1, height: 'auto' }} 
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-3 mt-2 overflow-hidden"
              >
                <div className="flex-1 bg-surface-container py-2 px-4 rounded-xl border border-outline-variant/50 text-sm font-mono overflow-hidden text-ellipsis whitespace-nowrap">
                  {inviteUrl || 'Đang tạo link...'}
                </div>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(inviteUrl);
                    toast.success('Đã copy link');
                  }}
                  className="px-4 py-2 bg-surface-container hover:bg-outline-variant/30 text-on-surface rounded-xl text-sm font-semibold transition-colors flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">content_copy</span>
                  Copy
                </button>
                <button 
                  onClick={handleRegenerateLink}
                  className="px-4 py-2 bg-surface-container hover:bg-error/10 hover:text-error text-on-surface rounded-xl text-sm font-semibold transition-colors flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">refresh</span>
                  Đổi mã mới
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl shadow-sm overflow-hidden flex-1">
        <div className="p-4 border-b border-outline-variant/30 bg-surface-container/30">
          <div className="grid grid-cols-12 gap-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
            <div className="col-span-7">Người dùng</div>
            <div className="col-span-3">Vai trò</div>
            <div className="col-span-2 text-right">Thao tác</div>
          </div>
        </div>
        
        {loading && (
          <div className="p-4 flex items-center justify-center text-sm text-on-surface-variant py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent"></div>
          </div>
        )}
        
        {!loading && members.length === 0 && (
          <div className="p-4 flex flex-col items-center justify-center text-sm text-on-surface-variant py-12">
            <span className="material-symbols-outlined text-4xl mb-2 text-outline-variant">group_off</span>
            Chưa có thành viên nào
          </div>
        )}
        
        {!loading && members.length > 0 && (
          <div className="divide-y divide-outline-variant/20">
            {members.map(member => (
              <div key={member.userId} className="p-4 grid grid-cols-12 items-center gap-4 hover:bg-surface-container/10 transition-colors">
                <div className="col-span-7 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm uppercase">
                    {member.email.charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-on-surface">{member.email}</div>
                    <div className="text-xs text-on-surface-variant">Tham gia: {new Date(member.joinedAt).toLocaleDateString()}</div>
                  </div>
                </div>
                <div className="col-span-3">
                  {isOwner && member.role !== 'OWNER' ? (
                    <select
                      value={member.role}
                      onChange={(e) => handleUpdateRole(member.userId, e.target.value as ProjectRole)}
                      className={`text-xs font-medium rounded-md px-2 py-1 outline-none cursor-pointer border ${
                        member.role === 'EDITOR' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-outline-variant/10 text-on-surface-variant border-outline-variant/20'
                      }`}
                    >
                      <option value="VIEWER">Người xem</option>
                      <option value="EDITOR">Người chỉnh sửa</option>
                    </select>
                  ) : (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${
                      member.role === 'OWNER' ? 'bg-error/10 text-error' :
                      member.role === 'EDITOR' ? 'bg-primary/10 text-primary' :
                      'bg-outline-variant/20 text-on-surface-variant'
                    }`}>
                      {member.role === 'OWNER' ? 'Chủ sở hữu' : member.role === 'EDITOR' ? 'Người chỉnh sửa' : 'Người xem'}
                    </span>
                  )}
                </div>
                <div className="col-span-2 text-right flex justify-end">
                  {isOwner && member.role !== 'OWNER' && (
                    <button 
                      onClick={() => handleRemoveMember(member.userId)}
                      className="p-2 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-lg transition-colors"
                      title="Xóa thành viên"
                    >
                      <span className="material-symbols-outlined text-[18px]">person_remove</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface-container-lowest w-full max-w-md rounded-2xl shadow-xl overflow-hidden"
            >
              <div className="p-6 border-b border-outline-variant/30 flex items-center justify-between">
                <h2 className="text-xl font-bold">Mời thành viên</h2>
                <button 
                  onClick={() => setIsAddModalOpen(false)}
                  className="text-on-surface-variant hover:text-on-surface transition-colors"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <form onSubmit={handleAddMember} className="p-6 flex flex-col gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-on-surface">Email người dùng KBase</label>
                  <input
                    type="email"
                    required
                    value={addEmail}
                    onChange={e => setAddEmail(e.target.value)}
                    placeholder="vidu@gmail.com"
                    className="w-full px-4 py-3 rounded-xl bg-surface-container text-on-surface border border-outline-variant/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  />
                  <p className="text-xs text-on-surface-variant">Người dùng phải có tài khoản KBase từ trước.</p>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-semibold text-on-surface">Quyền hạn (Vai trò)</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setAddRole('VIEWER')}
                      className={`p-3 rounded-xl border text-left transition-colors ${addRole === 'VIEWER' ? 'border-primary bg-primary/10' : 'border-outline-variant/50 hover:bg-surface-container'}`}
                    >
                      <div className="font-semibold text-sm">Người xem</div>
                      <div className="text-xs text-on-surface-variant mt-1">Chỉ được xem tài liệu</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAddRole('EDITOR')}
                      className={`p-3 rounded-xl border text-left transition-colors ${addRole === 'EDITOR' ? 'border-primary bg-primary/10' : 'border-outline-variant/50 hover:bg-surface-container'}`}
                    >
                      <div className="font-semibold text-sm">Người sửa</div>
                      <div className="text-xs text-on-surface-variant mt-1">Được thêm, xóa file</div>
                    </button>
                  </div>
                </div>

                <div className="mt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="flex-1 py-3 px-4 bg-surface-container hover:bg-surface-container-high text-on-surface rounded-xl font-semibold transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isAdding}
                    className="flex-1 py-3 px-4 bg-primary hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isAdding ? (
                      <span className="material-symbols-outlined animate-spin">refresh</span>
                    ) : (
                      'Thêm ngay'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ProjectMembers;
