import { Phone, Mail, MapPin, Instagram, Facebook, Twitter, ShieldCheck, Truck, Clock } from 'lucide-react';
import logo from '../assets/logo.png';

export default function Footer() {
    return (
        <footer style={{
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(10px)',
            borderTop: '1px solid var(--glass-border)',
            padding: '60px 20px 20px',
            marginTop: '80px',
            color: 'var(--text-main)',
            fontFamily: 'var(--font-main)',
            direction: 'rtl'
        }}>
            <div className="container" style={{
                maxWidth: '1200px',
                margin: '0 auto',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '40px',
                marginBottom: '40px'
            }}>
                {/* Brand Section */}
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
                        <img src={logo} alt="متجر السعيدة" style={{ width: '70px', height: '70px', borderRadius: '50%' }} />
                        <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>
                            <span style={{ color: 'var(--primary)' }}>السعيدة</span> 
                        </h2>
                    </div>
                    <p style={{ color: 'var(--text-dim)', lineHeight: '1.8', fontSize: '1rem' }}>
                        نحن في متجر السعيدة نؤمن أن الساعة ليست مجرد أداة لمعرفة الوقت، بل هي قطعة فنية تعبر عن شخصيتك وفخامتك. نوفر لك أرقى الساعات العالمية بأفضل الأسعار.
                    </p>

                </div>

                {/* Quick Links */}
                <div>
                    <h3 style={{ color: 'var(--text-main)', marginBottom: '25px', position: 'relative', paddingBottom: '10px' }}>
                        روابط سريعة
                        <span style={{ position: 'absolute', bottom: 0, right: 0, width: '40px', height: '2px', background: 'var(--primary)' }}></span>
                    </h3>
                    <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <li><a href="#" style={{ color: 'var(--text-dim)', textDecoration: 'none', transition: '0.3s' }}>الرئيسية</a></li>
                        <li><a href="#products" style={{ color: 'var(--text-dim)', textDecoration: 'none' }}>تسوق الساعات</a></li>
                    </ul>
                </div>

                {/* Contact Info */}
                <div>
                    <h3 style={{ color: 'var(--text-main)', marginBottom: '25px', position: 'relative', paddingBottom: '10px' }}>
                        تواصل معنا
                        <span style={{ position: 'absolute', bottom: 0, right: 0, width: '40px', height: '2px', background: 'var(--primary)' }}></span>
                    </h3>
                    <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <li style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-dim)' }}>
                            <Phone size={20} color="var(--primary)" />
                            <span dir="ltr" style={{lineHeight: '1.5'}}>+967 772 754 414<br/>+967 775 055 319</span>
                        </li>
                        <li style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-dim)' }}>
                            <Mail size={20} color="var(--primary)" />
                            <span>alsaeedah8@gmail.com</span>
                        </li>
                        <li style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-dim)' }}>
                            <MapPin size={20} color="var(--primary)" />
                            <span style={{direction: 'ltr'}}>حضرموت / المكلا / الشرج</span>
                        </li>
                    </ul>
                </div>

                {/* Trust Section */}
                <div>
                    <h3 style={{ color: 'var(--text-main)', marginBottom: '25px', position: 'relative', paddingBottom: '10px' }}>
                        لماذا متجر السعيدة؟
                        <span style={{ position: 'absolute', bottom: 0, right: 0, width: '40px', height: '2px', background: 'var(--primary)' }}></span>
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-dim)', fontSize: '0.9rem' }}>
                            <ShieldCheck size={18} color="var(--primary)" />
                            <span>ضمان ذهبي حقيقي</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-dim)', fontSize: '0.9rem' }}>
                            <Truck size={18} color="var(--primary)" />
                            <span>توصيل سريع لكافة المحافظات</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-dim)', fontSize: '0.9rem' }}>
                            <Clock size={18} color="var(--primary)" />
                            <span>دعم فني على مدار الساعة</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div style={{
                borderTop: '1px solid var(--glass-border)',
                paddingTop: '20px',
                textAlign: 'center',
                color: 'var(--text-dim)',
                fontSize: '0.9rem'
            }}>
                <p>© 2026 متجر السعيدة - جميع الحقوق محفوظة لـ متجر السعيدة</p>
                <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center', gap: '20px', fontSize: '0.8rem' }}>
                </div>
            </div>

            <style>{`
                footer a:not(.social-icon):hover {
                    color: var(--primary) !important;
                    transform: translateX(-5px);
                }
                .social-icon {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 45px;
                    height: 45px;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid var(--glass-border);
                    color: var(--primary);
                    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    text-decoration: none;
                }
                .social-icon:hover {
                    background: var(--primary);
                    color: black !important;
                    transform: translateY(-8px) rotate(360deg) scale(1.1);
                    box-shadow: 0 10px 20px rgba(212, 175, 55, 0.4);
                    border-color: var(--primary);
                }
                @media (max-width: 768px) {
                    footer { padding: 40px 20px 20px; }
                    .container { gap: 30px; }
                }
            `}</style>
        </footer>
    );
}
