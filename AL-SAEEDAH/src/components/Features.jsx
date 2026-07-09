import { Truck, ShieldCheck, Headphones } from 'lucide-react';

export default function Features() {
    const features = [
        {
            icon: <Headphones size={40} color="var(--primary)" />,
            title: "دعم على مدار الساعة",
            desc: "فريق متخصص لخدمتك في أي وقت"
        }
    ];

    return (
        <div className="container" style={{ marginBottom: '80px' }}>
            <div className="glass-panel" style={{
                display: 'grid',
                gridTemplateColumns: window.innerWidth < 480 ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '20px',
                padding: window.innerWidth < 480 ? '20px' : '40px',
                textAlign: 'center'
            }}>
                {features.map((feature, index) => (
                    <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
                        <div style={{
                            background: 'rgba(212, 175, 55, 0.1)',
                            padding: '20px',
                            borderRadius: '50%',
                            marginBottom: '10px'
                        }}>
                            {feature.icon}
                        </div>
                        <h3 style={{ fontSize: '1.2rem', marginBottom: '5px' }}>{feature.title}</h3>
                        <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>{feature.desc}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
