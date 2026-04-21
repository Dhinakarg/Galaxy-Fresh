import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../hooks/useAuth';
import { provisionUser } from '../services/authService';
import { ALL_ROLES, ROLE_LABELS, ROLE_COLORS, ROLE_DESCRIPTIONS, getPermissions } from '../utils/permissions';
import { useToast } from '../hooks/useToast.jsx';

/**
 * ManagePermissions Component
 * ----------------------------
 * Central administrative hub for user management.
 * Fully optimized for Light and Dark themes.
 */
export default function ManagePermissions() {
  const { user, role } = useAuth();
  const perms = getPermissions(role);
  const { showToast, ToastComponent } = useToast();
  
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(null); 
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMember, setNewMember] = useState({ email: '', password: '', role: 'chef' });
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [showPass, setShowPass] = useState(false);

  if (!perms.canManageUsers) return (
     <div className="p-12 text-center text-red-500 font-bold">
       Access Denied: You do not have administrative privileges to manage team credentials.
     </div>
  );

  useEffect(() => {
    if (!user) return;

    setLoading(true);
    const usersRef = collection(db, 'users');

    // 1. Initial Fetch (Fast Path)
    let hasFirstSnapshot = false;
    const fetchInitial = async () => {
      try {
        const { getDocs } = await import('firebase/firestore');
        const snap = await getDocs(usersRef);
        if (!hasFirstSnapshot) {
          const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          setUsers(list.sort((a, b) => (a.email || '').localeCompare(b.email || '')));
        }
      } catch (err) {
        console.error('[ManagePermissions] Initial load failed:', err);
      } finally {
        if (!hasFirstSnapshot) setLoading(false);
      }
    };
    fetchInitial();

    // 2. Real-time Subscription (Background Path)
    const unsubscribe = onSnapshot(
      usersRef,
      (snapshot) => {
        hasFirstSnapshot = true;
        const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        list.sort((a, b) => {
          if (a.uid === user?.uid) return -1;
          if (b.uid === user?.uid) return 1;
          return (a.email || '').localeCompare(b.email || '');
        });
        setUsers(list);
        setLoading(false);
      },
      (err) => {
        console.error('[ManagePermissions] Real-time Sync Error:', err);
        if (!hasFirstSnapshot) setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [user]);

  const handleRoleChange = async (uid, newRole) => {
    setSaving(uid);
    try {
      await updateDoc(doc(db, 'users', uid), { role: newRole });
      showToast(`Privileges updated for ${uid.slice(0,5)}...`, 'success');
    } catch (err) {
      showToast('Role update failed: ' + err.message, 'error');
    } finally {
      setSaving(null);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!newMember.email || !newMember.password) return;
    
    setIsProvisioning(true);
    try {
      await provisionUser(newMember.email, newMember.password, newMember.role);
      setShowAddModal(false);
      setNewMember({ email: '', password: '', role: 'chef' });
      showToast('Employee account provisioned successfully.', 'success');
    } catch (err) {
      showToast('Provisioning failed: ' + err.message, 'error');
    } finally {
      setIsProvisioning(false);
    }
  };

  if (loading) return (
    <div className="p-12 flex flex-col items-center justify-center min-h-[60vh]">
      <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      <p className="mt-6 text-gray-400 dark:text-zinc-500 font-black uppercase tracking-widest text-[10px]">Scanning Team Network...</p>
    </div>
  );

  return (
    <div className="p-6 md:p-12 max-w-6xl mx-auto transition-colors">
      <ToastComponent />
      
      {/* Page Header Container */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">Team Protocol</h1>
          <p className="text-gray-500 dark:text-zinc-400 mt-2 font-medium">Manage employee identities and access privileges.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg transition-transform hover:-translate-y-0.5 flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
          Add New Employee
        </button>
      </div>

      {/* Permission Matrix Legend */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        {ALL_ROLES.map((r) => (
          <div key={r} className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 p-6 shadow-sm transition-colors">
            <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-black uppercase border mb-4 tracking-widest ${ROLE_COLORS[r]}`}>
              {ROLE_LABELS[r]}
            </span>
            <p className="text-xs text-gray-400 dark:text-zinc-500 font-bold leading-relaxed">{ROLE_DESCRIPTIONS[r]}</p>
          </div>
        ))}
      </div>

      {/* Team Roster List */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-gray-100 dark:border-zinc-800 overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100 dark:divide-zinc-800">
            <thead className="bg-gray-50/50 dark:bg-zinc-800/50 text-left">
              <tr>
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Team Member</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Role</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Induction Date</th>
                <th className="px-8 py-6 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-zinc-800">
              {users.map((u) => {
                const isCurrentUser = u.uid === user?.uid;
                const joinedDate = u.createdAt?.toDate ? u.createdAt.toDate().toLocaleDateString() : 'Initial Setup';

                return (
                  <tr key={u.id} className={`hover:bg-gray-50/50 dark:hover:bg-zinc-800/50 transition-colors ${isCurrentUser ? 'bg-indigo-50/20 dark:bg-indigo-900/10' : ''}`}>
                    <td className="px-8 py-7">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-md">
                          {(u.email || '?')[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">{u.email}</p>
                          {isCurrentUser && <span className="text-[10px] font-black text-indigo-500 uppercase">Primary Session</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-7">
                      <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase border ${ROLE_COLORS[u.role] || ROLE_COLORS.chef}`}>
                        {ROLE_LABELS[u.role]}
                      </span>
                    </td>
                    <td className="px-8 py-7 text-sm text-gray-400 dark:text-zinc-500 font-bold">{joinedDate}</td>
                    <td className="px-8 py-7 text-right">
                      {!isCurrentUser && (
                        <select
                          value={u.role || 'chef'}
                          onChange={(e) => handleRoleChange(u.uid, e.target.value)}
                          disabled={saving === u.uid}
                          className="bg-gray-100 dark:bg-zinc-800 border-none text-gray-700 dark:text-zinc-300 text-xs font-black rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer disabled:opacity-50"
                        >
                          {ALL_ROLES.map((r) => (
                            <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                          ))}
                        </select>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Employee Modal Portal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden transform animate-in slide-in-from-bottom-4 duration-300 transition-colors">
            <div className="bg-indigo-600 p-8 text-white">
               <h2 className="text-2xl font-black">Induct Member</h2>
               <p className="text-indigo-100 text-sm mt-1 font-medium">Provision a secure identity for a new employee.</p>
            </div>
            
            <form onSubmit={handleAddMember} className="p-8 space-y-6">
              <div>
                <label className="block text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest mb-1.5">Email Address</label>
                <input required type="email" value={newMember.email} onChange={e => setNewMember({...newMember, email: e.target.value})} className="w-full border border-gray-100 dark:border-zinc-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 dark:bg-zinc-800 dark:text-white transition-colors" placeholder="employee@galaxyfresh.com" />
              </div>
              
              <div>
                <label className="block text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest mb-1.5">Starting Credentials</label>
                <div className="relative">
                  <input 
                    required 
                    type={showPass ? 'text' : 'password'} 
                    minLength={6} 
                    value={newMember.password} 
                    onChange={e => setNewMember({...newMember, password: e.target.value})} 
                    className="w-full border border-gray-100 dark:border-zinc-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 dark:bg-zinc-800 dark:text-white font-bold text-sm transition-colors" 
                    placeholder="Temporary Secret" 
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                  >
                    {showPass ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest mb-1.5">Access Level</label>
                <select value={newMember.role} onChange={e => setNewMember({...newMember, role: e.target.value})} className="w-full border border-gray-100 dark:border-zinc-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 dark:bg-zinc-800 dark:text-white transition-colors capitalize">
                  {ALL_ROLES.map(r => (
                    <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                  ))}
                </select>
              </div>

              <div className="pt-6 flex space-x-3">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-3 border border-gray-100 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 font-bold rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors">Cancel</button>
                <button type="submit" disabled={isProvisioning} className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl shadow-lg transition-transform hover:-translate-y-0.5 disabled:opacity-50">
                  {isProvisioning ? 'Provisioning...' : 'Confirm Induction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
