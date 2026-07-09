import { useState, useEffect } from 'react';
import { X, User, Save, Edit2, Camera as CameraIcon, ZoomIn, ZoomOut, Check, Phone, Lock, Eye, EyeOff, MapPin, MessageCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLoader } from '../context/LoaderContext';
import ToastNotification from './ToastNotification';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '../utils/cropImage';
import { uploadToCloudinary } from '../utils/cloudinary';
import { Camera, CameraResultType } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

export default function ProfileModal() {
    const { isProfileModalOpen, closeProfileModal, currentUser, updateUser, updatePassword } = useAuth();
    const { showLoader, hideLoader } = useLoader();

    // Form & UI State
    const [isEditing, setIsEditing] = useState(false);
    const [toastMessage, setToastMessage] = useState(null);
    const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'password'
    const [formData, setFormData] = useState({
        name: '',
        image: '',
        whatsapp: '',
        governorate: '',
        district: '',
        neighborhood: '',
    });

    // Password Change State
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [showCurrentPw, setShowCurrentPw] = useState(false);
    const [showNewPw, setShowNewPw] = useState(false);
    const [pwError, setPwError] = useState('');
    const [pwLoading, setPwLoading] = useState(false);

    // Cropper State
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
    }, [currentUser, isProfileModalOpen]);

    useEffect(() => {
        if (!isProfileModalOpen) {
            setIsEditing(false);
            setActiveTab('profile');
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            setPwError('');
        }
    }, [isProfileModalOpen]);

    if (!isProfileModalOpen || !currentUser) return null;

    const handleImageUpload = async (e) => {
        if (Capacitor.isNativePlatform()) {
            try {
                const image = await Camera.getPhoto({
                    quality: 90,
                    allowEditing: false,
                    resultType: CameraResultType.DataUrl
                });
                if (image?.dataUrl) {
                    setImageSrc(image.dataUrl);
                    setIsCropping(true);
                }
            } catch (error) {
                console.error('Camera error:', error);
            }
            return;
        }
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.addEventListener('load', () => {
                setImageSrc(reader.result);
                setIsCropping(true);
            });
            reader.readAsDataURL(file);
        }
    };

    const onCropComplete = (_, croppedAreaPx) => setCroppedAreaPixels(croppedAreaPx);

    const confirmCrop = async () => {
        try {
            const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
            setFormData(prev => ({ ...prev, image: croppedImage }));
            setIsCropping(false);
            setImageSrc(null);
            setZoom(1);
        } catch (e) {
            console.error('Crop failed', e);
        }
    };

    const cancelCrop = () => { setIsCropping(false); setImageSrc(null); setZoom(1); };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        // Validate required address fields
        if (!formData.whatsapp || !formData.governorate || !formData.district) {
            alert('يرجى ملء جميع حقول العنوان ورقم الواتساب');
            return;
        }
        try {
            showLoader('جاري حفظ التعديلات...');
            let finalData = { ...formData };
            if (finalData.image?.startsWith('data:image')) {
                finalData.image = await uploadToCloudinary(finalData.image, 'image');
            }
            await updateUser(finalData);
            setFormData(finalData);
            setIsEditing(false);
            setToastMessage('تم حفظ التعديلات بنجاح ✅');
        } catch (error) {
            console.error('Save error:', error);
            alert(`حدث خطأ: ${error.message || 'خطأ غير معروف'}`);
        } finally {
            hideLoader();
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setPwError('');

        if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
            setPwError('يرجى ملء جميع الحقول');
            return;
        }
        if (passwordData.newPassword.length < 6) {
            setPwError('كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل');
            return;
        }
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setPwError('كلمة المرور الجديدة وتأكيدها لا يتطابقان');
            return;
        }

        setPwLoading(true);
        try {
            await updatePassword(passwordData.currentPassword, passwordData.newPassword);
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            setToastMessage('تم تغيير كلمة المرور بنجاح ✅');
        } catch (err) {
            setPwError(err.message || 'حدث خطأ أثناء تغيير كلمة المرور');
        } finally {
            setPwLoading(false);
        }
    };

    // ── Cropper Overlay ──────────────────────────────────────────────────
    if (isCropping) {
        return (
            <div style={{
                position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                background: '#000', zIndex: 2000, touchAction: 'none',
                display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'
            }}>
                <div style={{ position: 'relative', width: '100%', height: '80%', background: '#333' }}>
                    <Cropper
                        image={imageSrc}
                        crop={crop}
                        zoom={zoom}
                        aspect={1}
                        onCropChange={setCrop}
                        onCropComplete={onCropComplete}
                        onZoomChange={setZoom}
                        showGrid={false}
                        cropShape="round"
                    />
                </div>
                <div style={{ padding: '20px', width: '100%', display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center', background: '#141414' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', width: '90%', maxWidth: '400px' }}>
                        <ZoomOut size={20} color="#fff" />
                        <input type="range" value={zoom} min={1} max={3} step={0.1}
                            onChange={(e) => setZoom(e.target.value)}
                            style={{ flex: 1, cursor: 'pointer' }} />
                        <ZoomIn size={20} color="#fff" />
                    </div>
                    <div style={{ display: 'flex', gap: '20px' }}>
                        <button onClick={cancelCrop} style={{ padding: '10px 30px', borderRadius: '10px', border: '1px solid #666', background: 'transparent', color: '#fff', cursor: 'pointer' }}>إلغاء</button>
                        <button onClick={confirmCrop} style={{ padding: '10px 30px', borderRadius: '10px', background: 'var(--primary)', color: '#000', border: 'none', fontWeight: 'bold', cursor: 'pointer', display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <Check size={18} /> تأكيد وقص
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ── Styles ───────────────────────────────────────────────────────────
    const inputStyle = {
        width: '100%', padding: '12px 15px', borderRadius: '10px',
        border: '1px solid rgba(255,255,255,0.12)',
        background: 'rgba(255,255,255,0.05)', color: 'var(--text-main)',
        fontSize: '0.95rem', fontFamily: "'Cairo', sans-serif", outline: 'none', transition: 'all 0.3s'
    };
    const readonlyStyle = {
        ...inputStyle, opacity: 0.5, cursor: 'not-allowed',
        background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)'
    };
    const labelStyle = { display: 'block', color: 'var(--text-dim)', marginBottom: '8px', fontSize: '0.85rem', fontWeight: '600' };
    const tabActive = {
        background: 'var(--primary)', color: '#000', fontWeight: '900',
        border: 'none', padding: '9px 22px', borderRadius: '10px', cursor: 'pointer',
        fontSize: '0.9rem', transition: 'all 0.25s', fontFamily: "'Cairo', sans-serif"
    };
    const tabInactive = {
        background: 'transparent', color: 'var(--text-dim)', fontWeight: '600',
        border: '1px solid rgba(255,255,255,0.1)', padding: '9px 22px', borderRadius: '10px', cursor: 'pointer',
        fontSize: '0.9rem', transition: 'all 0.25s', fontFamily: "'Cairo', sans-serif"
    };

    // ── Main Modal ───────────────────────────────────────────────────────
    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(10px)',
            zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: isProfileModalOpen ? 1 : 0,
            pointerEvents: isProfileModalOpen ? 'auto' : 'none', transition: 'opacity 0.3s ease'
        }}>
            {toastMessage && (
                <ToastNotification message={toastMessage} onClose={() => setToastMessage(null)} />
            )}

            <div className="glass-panel" style={{
                width: '90%', maxWidth: '500px', padding: '40px',
                position: 'relative', maxHeight: '90vh', overflowY: 'auto',
                borderRadius: '20px', border: '1px solid rgba(212,175,55,0.2)'
            }}>
                {/* Close */}
                <button onClick={() => { closeProfileModal(); setIsEditing(false); }} style={{
                    position: 'absolute', top: '16px', left: '16px',
                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                    color: 'var(--text-dim)', cursor: 'pointer', width: '36px', height: '36px',
                    borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <X size={18} />
                </button>

                {/* Avatar */}
                <div style={{ textAlign: 'center', marginBottom: '24px', position: 'relative' }}>
                    <div style={{
                        width: '90px', height: '90px', borderRadius: '50%',
                        background: 'rgba(212,175,55,0.1)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 12px', border: '2px solid var(--primary)',
                        position: 'relative', overflow: 'hidden'
                    }}>
                        {formData.image ? (
                            <img src={formData.image} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <User size={44} color="var(--primary)" />
                        )}
                        {isEditing && (
                            <label onClick={(e) => { if (Capacitor.isNativePlatform()) { e.preventDefault(); handleImageUpload(); } }}
                                style={{
                                    position: 'absolute', bottom: 0, left: 0, width: '100%', height: '30px',
                                    background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', cursor: 'pointer'
                                }}>
                                <CameraIcon size={14} color="white" />
                                <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                            </label>
                        )}
                    </div>
                    <h2 style={{ color: 'var(--primary)', marginBottom: '2px', fontSize: '1.3rem', fontWeight: '800' }}>{currentUser.name}</h2>
                    <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.82rem' }}>عضو في متجر السعيدة</p>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '10px', marginBottom: '28px', justifyContent: 'center', direction: 'rtl' }}>
                    <button id="profile-tab-btn" onClick={() => setActiveTab('profile')} style={activeTab === 'profile' ? tabActive : tabInactive}>الملف الشخصي</button>
                    <button id="password-tab-btn" onClick={() => setActiveTab('password')} style={activeTab === 'password' ? tabActive : tabInactive}>تغيير كلمة المرور</button>
                </div>

                {/* ── PROFILE TAB ── */}
                {activeTab === 'profile' && (
                    <>
                        {/* Edit toggle */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
                            <button onClick={() => setIsEditing(!isEditing)} style={{
                                background: isEditing ? 'rgba(239,68,68,0.08)' : 'rgba(212,175,55,0.08)',
                                border: `1px solid ${isEditing ? '#ef4444' : 'var(--primary)'}`,
                                color: isEditing ? '#ef4444' : 'var(--primary)',
                                padding: '8px 18px', borderRadius: '10px', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: '8px',
                                fontSize: '0.88rem', fontFamily: "'Cairo', sans-serif", fontWeight: '700'
                            }}>
                                <Edit2 size={14} />
                                {isEditing ? 'إلغاء التعديل' : 'تعديل البيانات'}
                            </button>
                        </div>

                        <form onSubmit={handleProfileSubmit} dir="rtl" style={{ display: 'grid', gap: '18px' }}>
                            {/* Incomplete profile warning */}
                            {(!currentUser.whatsapp || !currentUser.governorate || !currentUser.district) && (
                                <div style={{
                                    background: 'rgba(245, 158, 11, 0.08)',
                                    border: '1px solid rgba(245, 158, 11, 0.3)',
                                    borderRadius: '12px',
                                    padding: '12px 16px',
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: '10px',
                                    textAlign: 'right'
                                }}>
                                    <AlertCircle size={18} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
                                    <p style={{ color: '#f59e0b', fontSize: '0.82rem', lineHeight: '1.6', margin: 0 }}>
                                        يجب تعبئة بيانات العنوان ورقم الواتساب قبل إتمام أي طلب.
                                    </p>
                                </div>
                            )}

                            {/* Name */}
                            <div>
                                <label style={labelStyle}>الاسم الكامل</label>
                                <input
                                    id="profile-name-input"
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    disabled={!isEditing}
                                    style={isEditing ? inputStyle : readonlyStyle}
                                />
                            </div>

                            {/* Phone — always read-only */}
                            <div>
                                <label style={labelStyle}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Phone size={13} /> رقم الهاتف
                                        <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.25)', marginRight: 'auto' }}>
                                            (لا يمكن تغييره)
                                        </span>
                                    </span>
                                </label>
                                <input
                                    type="tel"
                                    value={currentUser.phone || '---'}
                                    disabled
                                    dir="ltr"
                                    style={{ ...readonlyStyle, textAlign: 'right' }}
                                />
                            </div>

                            {/* WhatsApp Number */}
                            <div>
                                <label style={labelStyle}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <MessageCircle size={13} color="#25D366" /> رقم الواتساب
                                        <span style={{ fontSize: '0.7rem', color: '#ef4444', marginRight: 'auto' }}>*مطلوب</span>
                                    </span>
                                </label>
                                <input
                                    id="profile-whatsapp-input"
                                    type="tel"
                                    dir="ltr"
                                    value={formData.whatsapp}
                                    onChange={e => setFormData(prev => ({ ...prev, whatsapp: e.target.value }))}
                                    disabled={!isEditing}
                                    placeholder="مثال: 9677XXXXXXX"
                                    style={isEditing ? { ...inputStyle, textAlign: 'right' } : { ...readonlyStyle, textAlign: 'right' }}
                                />
                            </div>

                            {/* Address Section */}
                            <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '16px' }}>
                                <p style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '14px', fontSize: '0.9rem', color: 'var(--text-main)' }}>
                                    <MapPin size={14} color="var(--primary)" /> عنوان التوصيل
                                </p>
                                <div style={{ display: 'grid', gap: '14px' }}>
                                    {/* Governorate */}
                                    <div>
                                        <label style={labelStyle}>
                                            المحافظة
                                            <span style={{ fontSize: '0.7rem', color: '#ef4444', marginRight: '6px' }}>*مطلوب</span>
                                        </label>
                                        <input
                                            id="profile-governorate-input"
                                            type="text"
                                            value={formData.governorate}
                                            onChange={e => setFormData(prev => ({ ...prev, governorate: e.target.value }))}
                                            disabled={!isEditing}
                                            placeholder="مثال: حضرموت"
                                            style={isEditing ? inputStyle : readonlyStyle}
                                        />
                                    </div>
                                    {/* District */}
                                    <div>
                                        <label style={labelStyle}>
                                            المديرية
                                            <span style={{ fontSize: '0.7rem', color: '#ef4444', marginRight: '6px' }}>*مطلوب</span>
                                        </label>
                                        <input
                                            id="profile-district-input"
                                            type="text"
                                            value={formData.district}
                                            onChange={e => setFormData(prev => ({ ...prev, district: e.target.value }))}
                                            disabled={!isEditing}
                                            placeholder="مثال: المكلا"
                                            style={isEditing ? inputStyle : readonlyStyle}
                                        />
                                    </div>
                                    {/* Neighborhood */}
                                    <div>
                                        <label style={labelStyle}>الحي / تفاصيل إضافية</label>
                                        <input
                                            id="profile-neighborhood-input"
                                            type="text"
                                            value={formData.neighborhood}
                                            onChange={e => setFormData(prev => ({ ...prev, neighborhood: e.target.value }))}
                                            disabled={!isEditing}
                                            placeholder="مثال: حي النور"
                                            style={isEditing ? inputStyle : readonlyStyle}
                                        />
                                    </div>
                                </div>
                            </div>

                            {isEditing && (
                                <button type="submit" style={{
                                    width: '100%', padding: '13px',
                                    borderRadius: '12px', border: 'none',
                                    background: 'linear-gradient(135deg, var(--primary) 0%, #b8860b 100%)',
                                    color: '#000', fontWeight: '900', fontSize: '1rem',
                                    cursor: 'pointer', display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', gap: '10px', marginTop: '6px',
                                    fontFamily: "'Cairo', sans-serif",
                                    boxShadow: '0 8px 24px rgba(212,175,55,0.25)'
                                }}>
                                    <Save size={18} /> حفظ التغييرات
                                </button>
                            )}
                        </form>
                    </>
                )}

                {/* ── PASSWORD TAB ── */}
                {activeTab === 'password' && (
                    <form onSubmit={handlePasswordSubmit} dir="rtl" style={{ display: 'grid', gap: '18px' }}>
                        {pwError && (
                            <div style={{
                                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
                                color: '#f87171', padding: '12px 16px', borderRadius: '12px',
                                textAlign: 'center', fontSize: '0.9rem'
                            }}>
                                {pwError}
                            </div>
                        )}

                        {/* Current Password */}
                        <div>
                            <label style={labelStyle}>كلمة المرور الحالية</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    id="current-password-input"
                                    type={showCurrentPw ? 'text' : 'password'}
                                    value={passwordData.currentPassword}
                                    onChange={e => setPasswordData(p => ({ ...p, currentPassword: e.target.value }))}
                                    style={{ ...inputStyle, paddingLeft: '44px' }}
                                    placeholder="••••••••"
                                />
                                <button type="button" onClick={() => setShowCurrentPw(p => !p)} style={{
                                    position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
                                    background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.35)', cursor: 'pointer'
                                }}>
                                    {showCurrentPw ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        {/* New Password */}
                        <div>
                            <label style={labelStyle}>كلمة المرور الجديدة</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    id="new-password-input"
                                    type={showNewPw ? 'text' : 'password'}
                                    value={passwordData.newPassword}
                                    onChange={e => setPasswordData(p => ({ ...p, newPassword: e.target.value }))}
                                    style={{ ...inputStyle, paddingLeft: '44px' }}
                                    placeholder="••••••••"
                                />
                                <button type="button" onClick={() => setShowNewPw(p => !p)} style={{
                                    position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
                                    background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.35)', cursor: 'pointer'
                                }}>
                                    {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        {/* Confirm New Password */}
                        <div>
                            <label style={labelStyle}>تأكيد كلمة المرور الجديدة</label>
                            <input
                                id="confirm-password-input"
                                type="password"
                                value={passwordData.confirmPassword}
                                onChange={e => setPasswordData(p => ({ ...p, confirmPassword: e.target.value }))}
                                style={inputStyle}
                                placeholder="••••••••"
                            />
                        </div>

                        <button type="submit" disabled={pwLoading} style={{
                            width: '100%', padding: '13px', borderRadius: '12px', border: 'none',
                            background: pwLoading
                                ? 'rgba(212,175,55,0.35)'
                                : 'linear-gradient(135deg, var(--primary) 0%, #b8860b 100%)',
                            color: '#000', fontWeight: '900', fontSize: '1rem',
                            cursor: pwLoading ? 'not-allowed' : 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                            marginTop: '4px', fontFamily: "'Cairo', sans-serif",
                            boxShadow: pwLoading ? 'none' : '0 8px 24px rgba(212,175,55,0.25)'
                        }}>
                            <Lock size={18} />
                            {pwLoading ? 'جاري الحفظ...' : 'تغيير كلمة المرور'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
