import React, { useState } from 'react';

export default function SuppliersView({ suppliers, setSuppliers, notify, appearance }) {
  const [search,   setSearch]   = useState('');
  const [showModal,setShowModal]= useState(false);
  const [editSup,  setEditSup]  = useState(null);
  const [form,     setForm]     = useState({});
  const accent = appearance?.accentColor || '#4f46e5';

  const filtered = suppliers.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.contact.includes(search) ||
    (s.email || '').toLowerCase().includes(search.toLowerCase())
  );

  const openAdd  = ()    => { setEditSup(null); setForm({ name:'', contact:'', email:'', address:'', notes:'' }); setShowModal(true); };
  const openEdit = (sup) => { setEditSup(sup); setForm({ ...sup }); setShowModal(true); };

  const handleSave = () => {
    if (!form.name || !form.contact) { notify('Name and contact number are required.', 'error'); return; }
    if (editSup) {
      setSuppliers(p => p.map(s => s.id === editSup.id ? { ...s, ...form } : s));
      notify('Supplier updated.');
    } else {
      const id = `SUP${String(suppliers.length + 1).padStart(3, '0')}`;
      setSuppliers(p => [...p, { ...form, id }]);
      notify('Supplier added.');
    }
    setShowModal(false);
  };

  const handleDelete = id => {
    setSuppliers(p => p.filter(s => s.id !== id));
    notify('Supplier removed.');
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <div className="text-lg font-black text-gray-900 dark:text-white">Suppliers</div>
          <div className="text-xs text-gray-400">{suppliers.length} registered suppliers</div>
        </div>
        <button onClick={openAdd} className="btn-primary text-sm">+ Add Supplier</button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search suppliers..."
          className="inp pl-9"
        />
      </div>

      {/* Supplier cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map(sup => (
          <div key={sup.id} className="card p-4">
            <div className="flex justify-between items-start mb-3">
              <div className="flex gap-3 items-center">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 flex items-center justify-center font-black text-base flex-shrink-0">
                  {sup.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-bold text-sm text-gray-900 dark:text-white">{sup.name}</div>
                  <div className="text-[10px] text-gray-400 font-mono">{sup.id}</div>
                </div>
              </div>
              <div className="flex gap-1.5">
                <button onClick={() => openEdit(sup)} className="btn-secondary text-[11px] px-2.5 min-h-[32px]">Edit</button>
                <button onClick={() => handleDelete(sup.id)} className="btn-danger text-[11px] px-2 min-h-[32px]">Del</button>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
                  <div className="text-[9px] text-gray-400 font-bold uppercase tracking-wide mb-0.5">Phone</div>
                  <div className="text-xs font-semibold text-gray-900 dark:text-white truncate">{sup.contact}</div>
                </div>
                {sup.email && (
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
                    <div className="text-[9px] text-gray-400 font-bold uppercase tracking-wide mb-0.5">Email</div>
                    <div className="text-xs font-semibold text-gray-900 dark:text-white truncate">{sup.email}</div>
                  </div>
                )}
              </div>
              {sup.address && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
                  <div className="text-[9px] text-gray-400 font-bold uppercase tracking-wide mb-0.5">Address</div>
                  <div className="text-xs text-gray-600 dark:text-gray-300">{sup.address}</div>
                </div>
              )}
              {sup.notes && (
                <div className="text-xs text-gray-400 italic">{sup.notes}</div>
              )}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-400 text-sm">No suppliers found.</div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-40 flex items-end justify-center">
          <div className="bg-white dark:bg-gray-900 rounded-t-3xl w-full max-w-lg max-h-[92vh] overflow-y-auto slide-up">
            <div className="flex justify-center pt-3">
              <div className="w-10 h-1 bg-gray-200 dark:bg-gray-700 rounded-full" />
            </div>
            <div className="flex justify-between items-center px-5 py-4">
              <div className="font-black text-base text-gray-900 dark:text-white">
                {editSup ? 'Edit Supplier' : 'Add Supplier'}
              </div>
              <button onClick={() => setShowModal(false)} className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500">✕</button>
            </div>
            <div className="px-5 pb-8 space-y-3">
              {[
                ['name',    'Company Name *', 'text'],
                ['contact', 'Phone Number *', 'tel'],
                ['email',   'Email Address',  'email'],
                ['address', 'Address',        'text'],
                ['notes',   'Notes',          'text'],
              ].map(([k, l, t]) => (
                <div key={k}>
                  <label className="lbl">{l}</label>
                  <input
                    type={t}
                    value={form[k] || ''}
                    onChange={e => setForm(p => ({ ...p, [k]: e.target.value }))}
                    className="inp"
                  />
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={handleSave} className="btn-primary flex-1">Save</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
