import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams } from 'react-router-dom';
import { projectService, type InviteLinkInfo } from '../services/projectService';
import { websocketService } from '../services/websocketService';
import type { ProjectMember, ProjectRole } from '../types/project';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

/**
 * ProjectMembers page — quản lý thành viên dự án.
 *
 * Props: none (lấy projectId từ URL params)
 * Key States:
 *  - members: danh sách thành viên
 *  - isInviteLinkModalOpen: hiển thị modal invite link (Google Docs style)
 *  - inviteLink: trạng thái link mời (isActive, inviteUrl, inviteRole)
 *  - isAddModalOpen: modal mời thủ công qua email
 */
const ProjectMembers: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { user } = useAuth();

  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);

  const isAdmin = user?.role === 'ADMIN';
  const canManage = isOwner || isAdmin;

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addEmail, setAddEmail] = useState('');
  const [addRole, setAddRole] = useState<ProjectRole>('VIEWER');
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Invite link modal state
  const [isInviteLinkModalOpen, setIsInviteLinkModalOpen] = useState(false);
  const [inviteLink, setInviteLink] = useState<InviteLinkInfo | null>(null);
  const [isLinkLoading, setIsLinkLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (projectId) {
      loadMembers();

      websocketService.connect(projectId, () => {
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
      toast.error(error.response?.data?.message || 'Lỗi khi tải thành viên', { id: 'load-members-err' });
    } finally {
      setLoading(false);
    }
  };

  const openInviteLinkModal = async () => {
    setIsInviteLinkModalOpen(true);
    if (!inviteLink) {
      try {
        setIsLinkLoading(true);
        const data = await projectService.getInviteLink(projectId!);
        setInviteLink(data);
      } catch (error: any) {
        toast.error('Lỗi khi tải thông tin link mời', { id: 'get-link-err' });
      } finally {
        setIsLinkLoading(false);
      }
    }
  };

  const handleToggleLink = async () => {
    if (!inviteLink) return;
    try {
      setIsLinkLoading(true);
      const updated = await projectService.toggleInviteLink(projectId!, !inviteLink.isActive);
      setInviteLink(updated);
      toast.success(updated.isActive ? 'Đã bật link mời' : 'Đã tắt link mời', { id: 'toggle-link' });
    } catch {
      toast.error('Lỗi khi bật/tắt link', { id: 'toggle-link-err' });
    } finally {
      setIsLinkLoading(false);
    }
  };

  const handleUpdateInviteRole = async (role: ProjectRole) => {
    try {
      const updated = await projectService.updateInviteRole(projectId!, role);
      setInviteLink(updated);
      toast.success(`Quyền mặc định: ${role === 'EDITOR' ? 'Người chỉnh sửa' : 'Người xem'}`, { id: 'update-invite-role' });
    } catch {
      toast.error('Lỗi khi cập nhật quyền', { id: 'update-invite-role-err' });
    }
  };

  const handleRegenerateLink = async () => {
    if (!window.confirm('Link cũ sẽ bị vô hiệu hóa ngay lập tức. Tiếp tục?')) return;
    try {
      setIsLinkLoading(true);
      const updated = await projectService.regenerateInviteCode(projectId!);
      setInviteLink(updated);
      toast.success('Đã tạo link mới', { id: 'regen-link' });
    } catch {
      toast.error('Lỗi khi tạo link', { id: 'regen-link-err' });
    } finally {
      setIsLinkLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (!inviteLink?.inviteUrl) return;
    navigator.clipboard.writeText(inviteLink.inviteUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
    toast.success('Đã copy link', { id: 'copy-link' });
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
      setAddError(error.response?.data?.message || 'Lỗi khi thêm thành viên');
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!projectId) return;
    if (!window.confirm('Bạn có chắc chắn muốn xóa thành viên này khỏi dự án?')) return;

    try {
      await projectService.removeMember(projectId, userId);
      toast.success('Xóa thành viên thành công', { id: 'remove-member' });
      loadMembers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi khi xóa thành viên', { id: 'remove-member-err' });
    }
  };

  const handleUpdateRole = async (userId: string, newRole: ProjectRole) => {
    if (!projectId) return;
    try {
      await projectService.updateMemberRole(projectId, userId, newRole);
      toast.success('Đã cập nhật quyền thành viên', { id: 'update-role' });
      loadMembers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi khi cập nhật quyền', { id: 'update-role-err' });
    }
  };

  const handleBulkUpdateRole = async (newRole: ProjectRole) => {
    if (!projectId) return;
    if (!window.confirm(`Chuyển TẤT CẢ thành viên (trừ chủ sở hữu) thành ${newRole === 'EDITOR' ? 'Người chỉnh sửa' : 'Người xem'}?`)) return;

    try {
      await projectService.updateAllMembersRole(projectId, newRole);
      toast.success('Đã cập nhật quyền cho tất cả thành viên', { id: 'bulk-update' });
      loadMembers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi khi cập nhật quyền hàng loạt', { id: 'bulk-update-err' });
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="h-full flex flex-col gap-3">

      {/* Header toolbar */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">group</span>
          Thành viên
        </h3>

        {canManage && (
          <div className="flex gap-2">
            {/* Bulk role buttons */}
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

            {/* Invite link button */}
            <button
              onClick={openInviteLinkModal}
              className="flex items-center gap-2 px-4 py-2 bg-surface-container hover:bg-outline-variant/20 text-on-surface rounded-xl text-sm font-semibold transition-colors border border-outline-variant/40"
            >
              <span className="material-symbols-outlined text-[18px]">link</span>
              Link mời
            </button>

            {/* Add by email button */}
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary-container text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">person_add</span>
              Mời thành viên
            </button>
          </div>
        )}
      </div>

      {/* Members table */}
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
                  {canManage && member.role !== 'OWNER' ? (
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
                  {canManage && member.role !== 'OWNER' && (
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

      {/* ── INVITE LINK MODAL (Google Docs style) ── */}
      <AnimatePresence>
        {isInviteLinkModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.2 }}
              className="bg-surface-container-lowest w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
            >
              {/* Modal header */}
              <div className="px-6 pt-6 pb-4 flex items-center justify-between border-b border-outline-variant/20">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-xl">link</span>
                  </div>
                  <h2 className="text-lg font-bold text-on-surface">Link mời tham gia</h2>
                </div>
                <button
                  onClick={() => setIsInviteLinkModalOpen(false)}
                  className="text-on-surface-variant hover:text-on-surface hover:bg-surface-container p-1.5 rounded-lg transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              <div className="p-6 flex flex-col gap-5">

                {isLinkLoading && !inviteLink ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
                  </div>
                ) : (
                  <>
                    {/* Toggle row */}
                    <div className="flex items-center justify-between p-4 bg-surface-container rounded-xl">
                      <div>
                        <p className="font-semibold text-on-surface text-sm">Cho phép truy cập bằng link</p>
                        <p className="text-xs text-on-surface-variant mt-0.5">
                          {inviteLink?.isActive
                            ? 'Bất kỳ ai có link đều có thể tham gia dự án'
                            : 'Link mời hiện đang bị tắt'}
                        </p>
                      </div>
                      <button
                        onClick={handleToggleLink}
                        disabled={isLinkLoading}
                        className={`relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none disabled:opacity-60 ${
                          inviteLink?.isActive ? 'bg-primary' : 'bg-outline-variant/40'
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                            inviteLink?.isActive ? 'translate-x-6' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Link + copy */}
                    <AnimatePresence>
                      {inviteLink?.isActive && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="flex flex-col gap-3 overflow-hidden"
                        >
                          {/* Default role selector */}
                          <div>
                            <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">Quyền khi tham gia qua link</p>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                onClick={() => handleUpdateInviteRole('VIEWER')}
                                className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all ${
                                  inviteLink?.inviteRole === 'VIEWER'
                                    ? 'border-primary bg-primary/8 ring-1 ring-primary/30'
                                    : 'border-outline-variant/40 hover:bg-surface-container'
                                }`}
                              >
                                <span className={`material-symbols-outlined text-xl ${inviteLink?.inviteRole === 'VIEWER' ? 'text-primary' : 'text-on-surface-variant'}`}>visibility</span>
                                <div>
                                  <div className="font-semibold text-sm text-on-surface">Người xem</div>
                                  <div className="text-xs text-on-surface-variant">Chỉ đọc tài liệu</div>
                                </div>
                                {inviteLink?.inviteRole === 'VIEWER' && (
                                  <span className="material-symbols-outlined text-primary text-[18px] ml-auto">check_circle</span>
                                )}
                              </button>
                              <button
                                onClick={() => handleUpdateInviteRole('EDITOR')}
                                className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all ${
                                  inviteLink?.inviteRole === 'EDITOR'
                                    ? 'border-primary bg-primary/8 ring-1 ring-primary/30'
                                    : 'border-outline-variant/40 hover:bg-surface-container'
                                }`}
                              >
                                <span className={`material-symbols-outlined text-xl ${inviteLink?.inviteRole === 'EDITOR' ? 'text-primary' : 'text-on-surface-variant'}`}>edit</span>
                                <div>
                                  <div className="font-semibold text-sm text-on-surface">Người sửa</div>
                                  <div className="text-xs text-on-surface-variant">Thêm, sửa tài liệu</div>
                                </div>
                                {inviteLink?.inviteRole === 'EDITOR' && (
                                  <span className="material-symbols-outlined text-primary text-[18px] ml-auto">check_circle</span>
                                )}
                              </button>
                            </div>
                          </div>

                          {/* URL display */}
                          <div className="flex items-center gap-2 p-3 bg-surface-container rounded-xl border border-outline-variant/30">
                            <span className="text-xs font-mono text-on-surface-variant flex-1 truncate">
                              {inviteLink?.inviteUrl ?? 'Đang tạo...'}
                            </span>
                            <button
                              onClick={handleCopyLink}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                                isCopied
                                  ? 'bg-primary/10 text-primary'
                                  : 'bg-surface-container-high hover:bg-outline-variant/20 text-on-surface'
                              }`}
                            >
                              <span className="material-symbols-outlined text-[16px]">{isCopied ? 'check' : 'content_copy'}</span>
                              {isCopied ? 'Đã copy!' : 'Copy'}
                            </button>
                          </div>

                          {/* Regenerate */}
                          <button
                            onClick={handleRegenerateLink}
                            disabled={isLinkLoading}
                            className="flex items-center justify-center gap-2 w-full py-2 text-xs font-medium text-on-surface-variant hover:text-error hover:bg-error/5 rounded-lg transition-colors disabled:opacity-50"
                          >
                            <span className={`material-symbols-outlined text-[16px] ${isLinkLoading ? 'animate-spin' : ''}`}>refresh</span>
                            Đổi link mới (link cũ sẽ hết hiệu lực)
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── ADD MEMBER BY EMAIL MODAL ── */}
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
                  onClick={() => { setIsAddModalOpen(false); setAddError(null); }}
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
                    onChange={e => { setAddEmail(e.target.value); setAddError(null); }}
                    placeholder="vidu@gmail.com"
                    className="w-full px-4 py-3 rounded-xl bg-surface-container text-on-surface border border-outline-variant/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  />
                  <p className="text-xs text-on-surface-variant">Người dùng phải có tài khoản KBase từ trước.</p>
                </div>

                {addError && (
                  <div className="p-3 bg-error-container/20 text-error rounded-xl text-sm font-medium border border-error/20">
                    {addError}
                  </div>
                )}

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
                    disabled={isAdding || !addEmail.trim() || !!addError}
                    className="flex-1 py-3 px-4 bg-primary hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
