import React, { useState, useEffect, useMemo } from 'react';
import { taxonomyStore, TAXONOMY_TYPES } from 'shared/taxonomy';
import { taxonomyRepository, initTaxonomyStore } from '../../services/taxonomyService';
import TaxonomyTabs from './TaxonomyTabs';
import TaxonomyList from './TaxonomyList';
import TaxonomyForm from './TaxonomyForm';
import BrandForm from './BrandForm';
import { useLoading } from '../../context/LoadingContext';
import Swal from 'sweetalert2';
import { Plus } from 'lucide-react';
import { useStore } from 'zustand';

export default function TaxonomyManager() {
  const [activeTab, setActiveTab] = useState(TAXONOMY_TYPES.CATEGORY);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  
  const { startLoading, stopLoading } = useLoading();
  const { initialized, error, categories, brands, collections, addEntity, updateEntity } = useStore(taxonomyStore);

  useEffect(() => {
    if (!initialized) {
      startLoading();
      initTaxonomyStore().finally(() => stopLoading());
    }
  }, [initialized, startLoading, stopLoading]);

  const activeItems = useMemo(() => {
    let items = [];
    if (activeTab === TAXONOMY_TYPES.CATEGORY) items = categories;
    else if (activeTab === TAXONOMY_TYPES.BRAND) items = brands;
    else if (activeTab === TAXONOMY_TYPES.COLLECTION) items = collections;
    
    // Ensure items are sorted by order
    return [...items].sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [activeTab, categories, brands, collections]);

  const handleSave = async (data) => {
    startLoading();
    
    // For Edits, we can do optimistic update + rollback
    if (editingItem) {
      // Optimistic update
      updateEntity(activeTab, data.id, data);
      setIsFormOpen(false);
      setEditingItem(null);
      
      try {
        const updated = await taxonomyRepository.update(activeTab, data.id, data);
        // Ensure server timestamps are synced back
        updateEntity(activeTab, data.id, updated);
        Swal.fire({ icon: 'success', title: 'تم التحديث', text: 'تم تحديث العنصر بنجاح', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, background: '#141414', color: '#fff' });
      } catch (err) {
        // Rollback
        updateEntity(activeTab, data.id, editingItem);
        console.error(err);
        Swal.fire({ icon: 'error', title: 'خطأ', text: err.message || 'حدث خطأ أثناء الحفظ', background: '#141414', color: '#fff' });
      } finally {
        stopLoading();
      }
    } else {
      // For Create, pessimistic update since we need the generated ID
      try {
        const created = await taxonomyRepository.create(activeTab, data);
        addEntity(activeTab, created);
        Swal.fire({ icon: 'success', title: 'تمت الإضافة', text: 'تمت إضافة العنصر بنجاح', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, background: '#141414', color: '#fff' });
        setIsFormOpen(false);
        setEditingItem(null);
      } catch (err) {
        console.error(err);
        Swal.fire({ icon: 'error', title: 'خطأ', text: err.message || 'حدث خطأ أثناء الإضافة', background: '#141414', color: '#fff' });
      } finally {
        stopLoading();
      }
    }
  };

  const handleDeactivate = async (id) => {
    const result = await Swal.fire({
      title: 'هل أنت متأكد؟',
      text: 'سيتم تعطيل هذا العنصر ولن يظهر في الواجهة الرئيسية. (لن يتم حذفه نهائياً حفاظاً على بيانات المنتجات المرتبطة به).',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: 'rgba(255,255,255,0.1)',
      confirmButtonText: 'نعم، قم بالتعطيل',
      cancelButtonText: 'إلغاء',
      background: '#141414',
      color: '#fff'
    });

    if (result.isConfirmed) {
      startLoading();
      // Optimistic deactivation
      updateEntity(activeTab, id, { active: false });
      
      try {
        await taxonomyRepository.deactivate(activeTab, id);
        Swal.fire({ icon: 'success', title: 'تم التعطيل', text: 'تم تعطيل العنصر بنجاح', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, background: '#141414', color: '#fff' });
      } catch (err) {
        // Rollback
        updateEntity(activeTab, id, { active: true });
        console.error(err);
        Swal.fire({ icon: 'error', title: 'خطأ', text: err.message || 'حدث خطأ أثناء التعطيل', background: '#141414', color: '#fff' });
      } finally {
        stopLoading();
      }
    }
  };

  const handleMove = async (item, index, direction) => {
    const newItems = [...activeItems];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= newItems.length) return;
    
    const previousCurrentOrder = newItems[index].order || index + 1;
    const previousTargetOrder = newItems[targetIndex].order || targetIndex + 1;
    
    const targetOrder = previousCurrentOrder; // we swap their values
    const tempOrder = previousTargetOrder;
    
    const updatedCurrent = { ...newItems[index], order: tempOrder };
    const updatedTarget = { ...newItems[targetIndex], order: targetOrder };
    
    // Optimistic UI update
    updateEntity(activeTab, updatedCurrent.id, { order: tempOrder });
    updateEntity(activeTab, updatedTarget.id, { order: targetOrder });
    
    // Persist to DB in background
    try {
      await Promise.all([
        taxonomyRepository.update(activeTab, updatedCurrent.id, { order: tempOrder }),
        taxonomyRepository.update(activeTab, updatedTarget.id, { order: targetOrder })
      ]);
    } catch (err) {
      // Rollback
      updateEntity(activeTab, updatedCurrent.id, { order: previousCurrentOrder });
      updateEntity(activeTab, updatedTarget.id, { order: previousTargetOrder });
      console.error(err);
      Swal.fire({ icon: 'error', title: 'خطأ في الترتيب', text: 'حدث خطأ أثناء حفظ الترتيب الجديد، تمت استعادة الترتيب السابق.', toast: true, position: 'top-end', showConfirmButton: false, timer: 4000, background: '#141414', color: '#fff' });
    }
  };

  const openAddForm = () => {
    setEditingItem(null);
    setIsFormOpen(true);
  };

  if (!initialized && !error) return null; // Let the global loader handle this initially

  return (
    <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '32px', padding: '32px', border: '1px solid var(--border-color)', backdropFilter: 'blur(10px)' }}>
      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '16px', borderRadius: '16px', marginBottom: '24px' }}>
          {error.message || 'فشل تحميل بيانات الأقسام'}
        </div>
      )}
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <TaxonomyTabs activeTab={activeTab} onTabChange={setActiveTab} />
        
        <button 
          onClick={openAddForm}
          style={{ padding: '12px 24px', background: 'var(--primary)', color: '#000', border: 'none', borderRadius: '14px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 10px 20px rgba(212, 175, 55, 0.2)' }}
        >
          <Plus size={20} /> إضافة جديد
        </button>
      </div>
      
      <TaxonomyList 
        items={activeItems}
        onEdit={(item) => { setEditingItem(item); setIsFormOpen(true); }}
        onDeactivate={handleDeactivate}
        onMoveUp={(item, idx) => handleMove(item, idx, 'up')}
        onMoveDown={(item, idx) => handleMove(item, idx, 'down')}
      />

      {isFormOpen && activeTab === TAXONOMY_TYPES.BRAND && (
        <BrandForm 
          item={editingItem}
          onSave={handleSave}
          onCancel={() => { setIsFormOpen(false); setEditingItem(null); }}
        />
      )}

      {isFormOpen && activeTab !== TAXONOMY_TYPES.BRAND && (
        <TaxonomyForm 
          item={editingItem}
          type={activeTab}
          onSave={handleSave}
          onCancel={() => { setIsFormOpen(false); setEditingItem(null); }}
        />
      )}
    </div>
  );
}
