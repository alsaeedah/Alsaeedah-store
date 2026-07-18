import { Phone, Mail, MapPin, ShieldCheck, Truck, Clock, RefreshCw, FileText, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';

export default function Footer() {
    const navigate = useNavigate();

    const Link = ({ to, children }) => (
        <li>
            <button
                onClick={() => navigate(to)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontFamily: 'var(--font-main)', fontSize: '0.9rem', padding: 0, transition: 'color 0.2s', textAlign: 'right', display: 'block', width: '100%' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--primary)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-dim)'}
            >
                {children}
            </button>
        </li>
    );

    return (
        <footer style={{
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(10px)',
            borderTop: '1px solid var(--glass-border)',
            padding: '60px 20px 28px',
            marginTop: '80px',
            color: 'var(--text-main)',
            fontFamily: 'var(--font-main)',
            direction: 'rtl'
        }}>
            <div style={{
                maxWidth: '1200px',
                margin: '0 auto',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '40px',
                marginBottom: '48px'
            }}>
                {/* Brand Section */}
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
                        <img src={logo} alt="متجر السعيدة" style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover' }} />
                        <div>
                            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>
                                <span style={{ color: 'var(--primary)' }}>السعيدة</span>
                            </h2>
                            <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.7rem', letterSpacing: '1.5px', color: 'var(--text-dim)', margin: 0, textTransform: 'uppercase' }}>Luxury Watch Store</p>
                        </div>
                    </div>
                    <p style={{ color: 'var(--text-dim)', lineHeight: '1.9', fontSize: '0.9rem', maxWidth: '260px' }}>
                        نحن نؤمن أن الساعة ليست مجرد أداة لمعرفة الوقت، بل هي قطعة فنية تعبر عن شخصيتك وفخامتك.
                    </p>
                </div>

                {/* Quick Links */}
                <div>
                    <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '20px', position: 'relative', paddingBottom: '10px' }}>
                        روابط سريعة
                        <span style={{ position: 'absolute', bottom: 0, right: 0, width: '32px', height: '2px', background: 'var(--primary)' }} />
                    </h3>
                    <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <Link to="/">الرئيسية</Link>
                        <Link to="/cart">سلة المشتريات</Link>
                        <Link to="/wishlist">المفضلة</Link>
                        <Link to="/profile">حسابي</Link>
                        <Link to="/about">من نحن</Link>
                        <Link to="/contact">تواصل معنا</Link>
                    </ul>
                </div>

                {/* Policies */}
                <div>
                    <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '20px', position: 'relative', paddingBottom: '10px' }}>
                        سياساتنا
                        <span style={{ position: 'absolute', bottom: 0, right: 0, width: '32px', height: '2px', background: 'var(--primary)' }} />
                    </h3>
                    <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <Link to="/shipping">سياسة الشحن والتوصيل</Link>
                        <Link to="/returns">سياسة الإرجاع والاستبدال</Link>
                        <Link to="/terms">الشروط والأحكام</Link>
                        <Link to="/privacy">سياسة الخصوصية</Link>
                    </ul>
                </div>

                {/* Contact & Trust */}
                <div>
                    <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '20px', position: 'relative', paddingBottom: '10px' }}>
                        تواصل معنا
                        <span style={{ position: 'absolute', bottom: 0, right: 0, width: '32px', height: '2px', background: 'var(--primary)' }} />
                    </h3>
                    <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', color: 'var(--text-dim)', fontSize: '0.88rem' }}>
                            <Phone size={17} color="var(--primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                            <span dir="ltr" style={{ lineHeight: '1.7' }}>+967 772 754 414<br />+967 775 055 319</span>
                        </li>
                        <li style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-dim)', fontSize: '0.88rem' }}>
                            <Mail size={17} color="var(--primary)" style={{ flexShrink: 0 }} />
                            <span>alsaeedah8@gmail.com</span>
                        </li>
                        <li style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-dim)', fontSize: '0.88rem' }}>
                            <MapPin size={17} color="var(--primary)" style={{ flexShrink: 0 }} />
                            <span>حضرموت / المكلا / الشرج</span>
                        </li>
                    </ul>

                    {/* Trust badges */}
                    <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {[
                            { icon: <ShieldCheck size={15} />, text: 'ضمان ذهبي حقيقي' },
                            { icon: <Truck size={15} />, text: 'توصيل لكافة المحافظات' },
                            { icon: <RefreshCw size={15} />, text: 'إرجاع خلال 7 أيام' },
                        ].map(({ icon, text }) => (
                            <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-dim)', fontSize: '0.82rem' }}>
                                <span style={{ color: 'var(--primary)' }}>{icon}</span>
                                {text}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '20px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                <p style={{ color: 'var(--text-dim)', fontSize: '0.82rem', margin: 0, fontFamily: 'var(--font-body)' }}>
                    © 2026 متجر السعيدة — جميع الحقوق محفوظة
                </p>
                <div style={{ display: 'flex', gap: '16px' }}>
                    {[
                        { to: '/terms', label: 'الشروط' },
                        { to: '/privacy', label: 'الخصوصية' },
                    ].map(({ to, label }) => (
                        <button key={to} onClick={() => navigate(to)} style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '0.8rem', transition: 'color 0.2s', padding: 0 }}
                            onMouseEnter={e => e.currentTarget.style.color = 'var(--primary)'}
                            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-dim)'}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>
        </footer>
    );
}
