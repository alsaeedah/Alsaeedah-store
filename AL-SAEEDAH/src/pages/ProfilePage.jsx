import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import OrdersHistory from './OrdersHistory';

import { motion, AnimatePresence } from 'framer-motion';
import {
    User, Package, ArrowRight, Edit2, Save, X, Phone, MapPin, MessageCircle,
    Lock, Eye, EyeOff, Clock, CheckCircle2, XCircle, ChevronDown, ChevronUp,
    Camera as CameraIcon, ZoomIn, ZoomOut, Check, AlertCircle
} from 'lucide-react';
import { useLoader } from '../context/LoaderContext';
import ToastNotification from '../components/ToastNotification';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '../utils/cropImage';
import { uploadToCloudinary } from '../utils/cloudinary';
import { Camera, CameraResultType } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import logo from '../assets/logo.png';

export default function ProfilePage({ initialTab = 'profile' }) {
    const { currentUser, updateUser, updatePassword, openLogoutConfirm } = useAuth();
    const { showLoader, hideLoader } = useLoader();
    const navigate = useNavigate();

    const [activeSection, setActiveSection] = useState(initialTab); // 'profile' | 'orders' | 'password'
    const [isEditing, setIsEditing] = useState(false);
    const [toastMessage, setToastMessage] = useState(null);

    const [formData, setFormData] = useState({
        name: '', image: '', whatsapp: '', governorate: '', district: '', neighborhood: '',
    });

    const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [showCurrentPw, setShowCurrentPw] = useState(false);
    const [showNewPw, setShowNewPw] = useState(false);
    const [pwError, setPwError] = useState('');
    const [pwLoading, setPwLoading] = useState(false);

    // Cropper
    const [imageSrc, setImageSrc] = useState(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [isCropping, setIsCropping] = useState(false);



    useEffect(() => {
        if (currentUser) {
            setFormData({
                name: currentUser.name || '',
                image: currentUser.image || '',
                whatsapp: currentUser.whatsapp || '',
                governorate: currentUser.governorate || '',
                district: currentUser.district || '',
                neighborhood: currentUser.neighborhood || '',
            });
        }
    }, [currentUser]);



    const handleImageUpload = async (e) => {
        if (Capacitor.isNativePlatform()) {
            try {
                const image = await Camera.getPhoto({ quality: 90, allowEditing: false, resultType: CameraResultType.DataUrl });
                if (image?.dataUrl) { setImageSrc(image.dataUrl); setIsCropping(true); }
            } catch (err) { console.error('Camera error:', err); }
            return;
        }
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.addEventListener('load', () => { setImageSrc(reader.result); setIsCropping(true); });
            reader.readAsDataURL(file);
        }
    };

    const onCropComplete = (_, px) => setCroppedAreaPixels(px);

    const handleCropConfirm = async () => {
        try {
            const blob = await getCroppedImg(imageSrc, croppedAreaPixels);
            const file = new File([blob], 'profile.jpg', { type: 'image/jpeg' });
            showLoader('جاري رفع الصورة...');
            const url = await uploadToCloudinary(file);
            hideLoader();
            setFormData(prev => ({ ...prev, image: url }));
            setIsCropping(false);
            setImageSrc(null);
        } catch (err) { hideLoader(); console.error(err); }
    };

    const handleSaveProfile = async () => {
        showLoader('جاري الحفظ...');
        try {
            await updateUser(formData);
            setIsEditing(false);
            setToastMessage({ message: 'تم حفظ التغييرات بنجاح ✓', type: 'success' });
        } catch (err) {
            setToastMessage({ message: err.name === 'OfflineError' ? err.message : 'حدث خطأ أثناء الحفظ', type: 'error' });
        } finally { hideLoader(); }
    };

    const handlePasswordChange = async () => {
        setPwError('');
        if (!passwordData.currentPassword || !passwordData.newPassword) { setPwError('يرجى ملء جميع الحقول'); return; }
        if (passwordData.newPassword !== passwordData.confirmPassword) { setPwError('كلمة المرور الجديدة غير متطابقة'); return; }
        if (passwordData.newPassword.length < 6) { setPwError('يجب أن تتكون كلمة المرور من 6 أحرف على الأقل'); return; }
        setPwLoading(true);
        try {
            await updatePassword(passwordData.currentPassword, passwordData.newPassword);
            setToastMessage({ message: 'تم تغيير كلمة المرور بنجاح ✓', type: 'success' });
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) {
            setPwError(err.message || 'حدث خطأ');
        } finally { setPwLoading(false); }
    };



    const inputStyle = (disabled = false) => ({
        width: '100%', background: disabled ? 'transparent' : 'var(--bg-main)',
        border: `1px solid ${disabled ? 'transparent' : 'var(--border-color)'}`,
        borderRadius: '10px', padding: '12px 16px', color: 'var(--text-main)',
        fontFamily: 'var(--font-main)', fontSize: '0.95rem', outline: 'none',
        transition: 'border-color 0.2s', cursor: disabled ? 'default' : 'text',
        textAlign: 'right'
    });

    const tabs = [
        { id: 'profile', label: 'الملف الشخصي', icon: <User size={18} /> },
        { id: 'orders',  label: 'سجل الطلبات',  icon: <Package size={18} /> },
        { id: 'password', label: 'كلمة المرور', icon: <Lock size={18} /> },
    ];

    if (!currentUser) return null;

    return (
        <>
            {toastMessage && <ToastNotification message={toastMessage.message} type={toastMessage.type} onDone={() => setToastMessage(null)} />}

            {/* Image Cropper Overlay */}
            <AnimatePresence>
                {isCropping && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 9999, display: 'flex', flexDirection: 'column' }}
                    >
                        <div style={{ flex: 1, position: 'relative' }}>
                            <Cropper image={imageSrc} crop={crop} zoom={zoom} aspect={1}
                                onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={onCropComplete} />
                        </div>
                        <div style={{ padding: '20px', display: 'flex', gap: '12px', justifyContent: 'center', background: 'rgba(0,0,0,0.8)' }}>
                            <input type="range" min={1} max={3} step={0.1} value={zoom} onChange={e => setZoom(Number(e.target.value))} style={{ flex: 1, maxWidth: '200px', accentColor: 'var(--primary)' }} />
                            <button onClick={handleCropConfirm} className="btn-primary"><Check size={18} /> قص وحفظ</button>
                            <button onClick={() => setIsCropping(false)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '10px', padding: '10px 20px', color: '#fff', cursor: 'pointer' }}>إلغاء</button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div style={{ minHeight: '100dvh', background: 'var(--bg-main)', padding: '32px 20px 80px' }}>
                <div style={{ maxWidth: '800px', margin: '0 auto' }}>

                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '36px' }}>
                        <button onClick={() => navigate('/')} style={{ background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '50%', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-main)', flexShrink: 0 }}>
                            <ArrowRight size={20} />
                        </button>
                        <div>
                            <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--primary)', marginBottom: '4px', fontWeight: 500 }}>ALSAEEDAH</p>
                            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: 700, color: 'var(--text-main)', margin: 0, lineHeight: 1.1 }}>حسابي</h1>
                        </div>
                    </div>

                    {/* Profile Summary */}
                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '20px', padding: '24px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div style={{ position: 'relative', flexShrink: 0 }}>
                            <img src={formData.image || logo} alt={currentUser.name} style={{ width: '72px', height: '72px', borderRadius: '50%', border: '2px solid var(--primary)', objectFit: 'cover' }} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', fontWeight: 600, color: 'var(--text-main)', margin: '0 0 4px' }}>{currentUser.name}</h2>
                            <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem', color: 'var(--primary)', margin: 0, fontWeight: 500 }}>عضو مميز</p>
                        </div>
                        <button onClick={openLogoutConfirm} style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#ef4444', borderRadius: '10px', padding: '8px 16px', cursor: 'pointer', fontFamily: 'var(--font-main)', fontSize: '0.85rem', fontWeight: 600 }}>
                            تسجيل الخروج
                        </button>
                    </div>

                    {/* Tabs */}
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', background: 'var(--bg-card)', padding: '6px', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
                        {tabs.map(tab => (
                            <button key={tab.id} onClick={() => setActiveSection(tab.id)} style={{
                                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                padding: '10px 8px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-main)', fontSize: '0.85rem', fontWeight: 600, transition: 'all 0.25s',
                                background: activeSection === tab.id ? 'var(--primary)' : 'transparent',
                                color: activeSection === tab.id ? '#000' : 'var(--text-dim)',
                            }}>
                                {tab.icon} {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* TAB: Profile */}
                    <AnimatePresence mode="wait">
                        {activeSection === 'profile' && (
                            <motion.div key="profile" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '20px', padding: '28px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>البيانات الشخصية</h2>
                                        {!isEditing ? (
                                            <button onClick={() => setIsEditing(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)', color: 'var(--primary)', borderRadius: '10px', padding: '8px 16px', cursor: 'pointer', fontFamily: 'var(--font-main)', fontSize: '0.85rem', fontWeight: 600 }}>
                                                <Edit2 size={15} /> تعديل
                                            </button>
                                        ) : (
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button onClick={handleSaveProfile} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--primary)', border: 'none', color: '#000', borderRadius: '10px', padding: '8px 16px', cursor: 'pointer', fontFamily: 'var(--font-main)', fontSize: '0.85rem', fontWeight: 700 }}>
                                                    <Save size={15} /> حفظ
                                                </button>
                                                <button onClick={() => setIsEditing(false)} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', color: 'var(--text-dim)', borderRadius: '10px', padding: '8px 16px', cursor: 'pointer', fontFamily: 'var(--font-main)', fontSize: '0.85rem' }}>
                                                    <X size={15} /> إلغاء
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Avatar */}
                                    {isEditing && (
                                        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                                            <div style={{ position: 'relative', display: 'inline-block' }}>
                                                <img src={formData.image || logo} alt="avatar" style={{ width: '90px', height: '90px', borderRadius: '50%', border: '2px solid var(--primary)', objectFit: 'cover' }} />
                                                <label htmlFor="profile-img-upload" style={{ position: 'absolute', bottom: 0, right: 0, width: '28px', height: '28px', background: 'var(--primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '2px solid var(--bg-card)' }}>
                                                    <CameraIcon size={14} color="#000" />
                                                </label>
                                                {!Capacitor.isNativePlatform() && <input id="profile-img-upload" type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />}
                                                {Capacitor.isNativePlatform() && <input id="profile-img-upload" type="button" onClick={handleImageUpload} style={{ display: 'none' }} />}
                                            </div>
                                        </div>
                                    )}

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                        {[
                                            { label: 'الاسم الكامل', field: 'name', icon: <User size={16} /> },
                                            { label: 'رقم الواتساب', field: 'whatsapp', icon: <MessageCircle size={16} /> },
                                            { label: 'المحافظة', field: 'governorate', icon: <MapPin size={16} /> },
                                            { label: 'المديرية', field: 'district', icon: <MapPin size={16} /> },
                                            { label: 'الحي / المنطقة', field: 'neighborhood', icon: <MapPin size={16} /> },
                                        ].map(({ label, field, icon }) => (
                                            <div key={field} style={{ gridColumn: field === 'neighborhood' ? 'span 2' : 'span 1' }}>
                                                <label style={{ fontFamily: 'var(--font-main)', fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    {icon} {label}
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData[field]}
                                                    onChange={e => setFormData(prev => ({ ...prev, [field]: e.target.value }))}
                                                    disabled={!isEditing}
                                                    style={inputStyle(!isEditing)}
                                                />
                                            </div>
                                        ))}
                                    </div>

                                    <div style={{ marginTop: '16px' }}>
                                        <label style={{ fontFamily: 'var(--font-main)', fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Phone size={16} /> رقم الهاتف
                                        </label>
                                        <input type="text" value={currentUser.phone || 'غير محدد'} disabled style={inputStyle(true)} />
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* TAB: Orders */}
                        {activeSection === 'orders' && (
                            <motion.div key="orders" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '20px', padding: '28px' }}>
                                    <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '24px' }}>سجل الطلبات</h2>
                                    <OrdersHistory />
                                </div>
                            </motion.div>
                        )}

                        {/* TAB: Password */}
                        {activeSection === 'password' && (
                            <motion.div key="password" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '20px', padding: '28px' }}>
                                    <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '24px' }}>تغيير كلمة المرور</h2>

                                    {[
                                        { label: 'كلمة المرور الحالية', field: 'currentPassword', show: showCurrentPw, toggle: () => setShowCurrentPw(v => !v) },
                                        { label: 'كلمة المرور الجديدة', field: 'newPassword', show: showNewPw, toggle: () => setShowNewPw(v => !v) },
                                        { label: 'تأكيد كلمة المرور الجديدة', field: 'confirmPassword', show: showNewPw, toggle: () => setShowNewPw(v => !v) },
                                    ].map(({ label, field, show, toggle }) => (
                                        <div key={field} style={{ marginBottom: '16px' }}>
                                            <label style={{ fontFamily: 'var(--font-main)', fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: '6px', display: 'block' }}>{label}</label>
                                            <div style={{ position: 'relative' }}>
                                                <input
                                                    type={show ? 'text' : 'password'}
                                                    value={passwordData[field]}
                                                    onChange={e => setPasswordData(prev => ({ ...prev, [field]: e.target.value }))}
                                                    style={{ ...inputStyle(false), paddingLeft: '44px' }}
                                                />
                                                <button onClick={toggle} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-dim)' }}>
                                                    {show ? <EyeOff size={18} /> : <Eye size={18} />}
                                                </button>
                                            </div>
                                        </div>
                                    ))}

                                    {pwError && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', fontFamily: 'var(--font-main)', fontSize: '0.85rem', marginBottom: '16px' }}>
                                            <AlertCircle size={16} /> {pwError}
                                        </div>
                                    )}

                                    <button onClick={handlePasswordChange} disabled={pwLoading} className="btn-primary" style={{ width: '100%', justifyContent: 'center', opacity: pwLoading ? 0.7 : 1 }}>
                                        {pwLoading ? 'جاري التغيير...' : 'تغيير كلمة المرور'}
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </>
    );
}
