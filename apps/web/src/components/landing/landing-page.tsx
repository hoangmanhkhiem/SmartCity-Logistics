'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Icon, type IconName } from './icons';

const stats = [
    { value: '18.6K', label: 'đơn hàng hôm nay', note: '+12.4%', icon: 'box' as IconName },
    { value: '96.8%', label: 'giao đúng cam kết', note: '+2.1%', icon: 'clock' as IconName },
    { value: '1,284', label: 'tài xế đang hoạt động', note: 'Trực tuyến', icon: 'truck' as IconName },
    { value: '32 phút', label: 'thời gian giao trung bình', note: '-8 phút', icon: 'route' as IconName },
];

const features = [
    {
        icon: 'route' as IconName,
        title: 'Tối ưu tuyến đường',
        text: 'AI phân tích mật độ giao thông và gom đơn theo vùng để đề xuất hành trình nhanh, tiết kiệm nhất.',
        meta: 'Giảm đến 22% quãng đường',
    },
    {
        icon: 'location' as IconName,
        title: 'Theo dõi thời gian thực',
        text: 'Quan sát toàn bộ đội xe trên một bản đồ trực quan, cập nhật vị trí và trạng thái theo từng phút.',
        meta: 'Cập nhật mỗi 10 giây',
    },
    {
        icon: 'chart' as IconName,
        title: 'Phân tích vận hành',
        text: 'Dashboard thông minh giúp nhận biết điểm nghẽn, đối soát SLA và dự báo nhu cầu giao nhận.',
        meta: 'Hơn 40 chỉ số chuyên sâu',
    },
    {
        icon: 'shield' as IconName,
        title: 'Đối soát minh bạch',
        text: 'Lưu vết hành trình, bằng chứng giao hàng và chi phí, giúp mọi giao dịch rõ ràng, chính xác.',
        meta: 'Bảo mật chuẩn doanh nghiệp',
    },
];

const orders = [
    { id: '#GH-2406', area: 'Cầu Giấy → Ba Đình', driver: 'Nguyễn Hoàng', time: '18 phút', status: 'Đang giao' },
    { id: '#GH-2398', area: 'Hai Bà Trưng → Đống Đa', driver: 'Minh Tuấn', time: '24 phút', status: 'Đang lấy' },
    { id: '#GH-2387', area: 'Nam Từ Liêm → Hoàn Kiếm', driver: 'Đức Anh', time: '31 phút', status: 'Đang giao' },
];

function MapPanel() {
    const [period, setPeriod] = useState('Hôm nay');
    return (
        <div className="control-panel">
            <div className="panel-top">
                <div>
                    <span className="eyebrow light">LIVE CONTROL TOWER</span>
                    <h2>Vận hành theo thời gian thực</h2>
                </div>
                <div className="panel-actions">
                    {['Hôm nay', '7 ngày'].map((item) => (
                        <button key={item} className={period === item ? 'active' : ''} onClick={() => setPeriod(item)}>
                            {item}
                        </button>
                    ))}
                </div>
            </div>
            <div className="map-area" aria-label="Bản đồ vận hành nội đô">
                <div className="map-grid" />
                <div className="water water-one" />
                <div className="water water-two" />
                <div className="map-road road-one" />
                <div className="map-road road-two" />
                <div className="map-road road-three" />
                <svg className="route-line" viewBox="0 0 620 380" preserveAspectRatio="none">
                    <path d="M25 285 C95 270 108 190 174 198 S245 298 315 238 S375 104 449 142 S505 238 602 69" />
                </svg>
                <span className="map-label label-one">CẦU GIẤY</span>
                <span className="map-label label-two">ĐỐNG ĐA</span>
                <span className="map-label label-three">HOÀN KIẾM</span>
                <span className="map-label label-four">HAI BÀ TRƯNG</span>
                <div className="map-pin pin-one"><span><Icon name="truck" size={15} /></span></div>
                <div className="map-pin pin-two"><span><Icon name="box" size={15} /></span></div>
                <div className="map-pin pin-three"><span><Icon name="truck" size={15} /></span></div>
                <div className="map-pin pin-four"><span><Icon name="location" size={15} /></span></div>
                <div className="delivery-card">
                    <div className="delivery-head">
                        <span className="driver-avatar">NH</span>
                        <div>
                            <b>Nguyễn Hoàng</b>
                            <small>Đơn #GH-2406</small>
                        </div>
                        <span className="live-dot">LIVE</span>
                    </div>
                    <div className="delivery-progress"><span /></div>
                    <div className="delivery-meta">
                        <span>2.8 km còn lại</span>
                        <strong>~ 18 phút</strong>
                    </div>
                </div>
                <div className="map-legend">
                    <span><i className="available" /> Sẵn sàng</span>
                    <span><i className="delivering" /> Đang giao</span>
                    <span><i className="busy" /> Điểm nóng</span>
                </div>
            </div>
        </div>
    );
}

function Brand({ dark = false }: { dark?: boolean }) {
    return (
        <Link className={`brand${dark ? ' dark-brand' : ''}`} href="/" aria-label="Nội Thành Logistics">
            <img
                className="brand-mark"
                src={dark ? '/landing/brand-mark-dark.svg' : '/landing/brand-mark.svg'}
                alt=""
                width={dark ? 64 : 32}
                height={dark ? 64 : 32}
            />
            <span className="brand-name">
                NỘI THÀNH<small>LOGISTICS PLATFORM</small>
            </span>
        </Link>
    );
}

export function LandingPage() {
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <main>
            <section className="hero" id="home">
                <nav className="nav container">
                    <Brand />
                    <button className="menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Mở trình đơn">
                        <Icon name="menu" />
                    </button>
                    <div className={`nav-links ${menuOpen ? 'open' : ''}`}>
                        <a href="#solutions">Giải pháp</a>
                        <a href="#operations">Vận hành</a>
                        <a href="#network">Mạng lưới</a>
                        <a href="#about">Về chúng tôi</a>
                    </div>
                    <div className="nav-cta">
                        <Link href="/cong-khai">Tra cứu đơn hàng</Link>
                        <Link href="/login">
                            Đăng nhập <Icon name="arrow" size={16} />
                        </Link>
                    </div>
                </nav>

                <div className="hero-content container">
                    <div className="hero-copy">
                        <div className="hero-badge">
                            <span />
                            <Icon name="spark" size={15} /> Hệ điều hành logistics nội đô
                        </div>
                        <h1>
                            Giao nhanh hơn.
                            <br />
                            <em>Vận hành thông minh hơn.</em>
                        </h1>
                        <p>
                            Kết nối doanh nghiệp, tài xế và mọi điểm giao trên một nền tảng duy nhất. Tối ưu từng tuyến đường, kiểm soát từng đơn hàng.
                        </p>
                        <div className="hero-buttons">
                            <Link className="primary" href="/login">
                                Bắt đầu vận hành <Icon name="arrow" size={18} />
                            </Link>
                            <a className="secondary" href="#operations">
                                <span><Icon name="chart" size={17} /></span> Khám phá nền tảng
                            </a>
                        </div>
                        <div className="hero-proof">
                            <div className="avatars">
                                <span>NH</span>
                                <span>MT</span>
                                <span>DA</span>
                                <b>+2K</b>
                            </div>
                            <div>
                                <strong>2,000+ doanh nghiệp</strong>
                                <small>đang tối ưu giao nhận mỗi ngày</small>
                            </div>
                        </div>
                    </div>
                    <MapPanel />
                </div>
            </section>

            <section className="stats-wrap" aria-label="Chỉ số vận hành">
                <div className="stats container">
                    {stats.map((stat) => (
                        <article className="stat" key={stat.label}>
                            <div className="stat-icon"><Icon name={stat.icon} /></div>
                            <div>
                                <strong>{stat.value}</strong>
                                <span>{stat.label}</span>
                            </div>
                            <small>{stat.note}</small>
                        </article>
                    ))}
                </div>
            </section>

            <section className="section solutions" id="solutions">
                <div className="container">
                    <div className="section-head">
                        <div>
                            <span className="eyebrow">NỀN TẢNG TOÀN DIỆN</span>
                            <h2>
                                Mọi chuyển động.
                                <br />
                                Một trung tâm điều hành.
                            </h2>
                        </div>
                        <p>Từ lúc tạo đơn đến khi giao thành công, mọi quy trình được số hóa, tự động hóa và đo lường chính xác.</p>
                    </div>
                    <div className="features-grid">
                        {features.map((feature, index) => (
                            <article className={`feature-card feature-${index + 1}`} key={feature.title}>
                                <div className="feature-top">
                                    <span className="feature-icon"><Icon name={feature.icon} /></span>
                                    <span>0{index + 1}</span>
                                </div>
                                <h3>{feature.title}</h3>
                                <p>{feature.text}</p>
                                <div className="feature-meta">
                                    <Icon name="check" size={16} /> {feature.meta}
                                </div>
                                {index === 1 && (
                                    <div className="mini-map">
                                        <i /><i /><i />
                                        <svg viewBox="0 0 240 88">
                                            <path d="M6 65 C40 10 77 73 118 42 S185 7 234 28" />
                                        </svg>
                                    </div>
                                )}
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <section className="section operations" id="operations">
                <div className="container operation-grid">
                    <div className="operation-visual" id="tracking">
                        <div className="visual-header">
                            <div>
                                <span className="status-pulse" /> Đang vận hành
                            </div>
                            <button type="button" aria-label="Tùy chọn">
                                <Icon name="menu" size={16} />
                            </button>
                        </div>
                        <div className="visual-title">
                            <div>
                                <small>Tổng đơn đang giao</small>
                                <strong>1,284</strong>
                            </div>
                            <span>+18.2%</span>
                        </div>
                        <div className="order-list">
                            {orders.map((order, i) => (
                                <div className="order" key={order.id}>
                                    <span className={`order-icon order-icon-${i + 1}`}>
                                        <Icon name={i === 1 ? 'box' : 'truck'} size={18} />
                                    </span>
                                    <div className="order-route">
                                        <strong>{order.area}</strong>
                                        <small>{order.id} · {order.driver}</small>
                                    </div>
                                    <div className="order-time">
                                        <strong>{order.time}</strong>
                                        <small>{order.status}</small>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="visual-footer">
                            <span>
                                <Icon name="check" size={14} /> 4,892 đơn hoàn tất hôm nay
                            </span>
                            <Link href="/cong-khai">
                                Xem chi tiết <Icon name="arrow" size={14} />
                            </Link>
                        </div>
                    </div>
                    <div className="operation-copy">
                        <span className="eyebrow">QUY TRÌNH LIỀN MẠCH</span>
                        <h2>Từ điểm lấy đến điểm giao, luôn trong tầm kiểm soát.</h2>
                        <p>
                            Một luồng vận hành xuyên suốt giúp đội ngũ phản ứng nhanh hơn, giảm thao tác thủ công và nâng cao trải nghiệm khách hàng.
                        </p>
                        <div className="steps">
                            {[
                                ['01', 'Tạo & phân bổ đơn', 'Nhập đơn hàng loạt, tự động gán tài xế phù hợp theo khu vực và tải trọng.'],
                                ['02', 'Điều phối thông minh', 'Lộ trình tối ưu theo thời gian thực, chủ động né điểm nghẽn giao thông.'],
                                ['03', 'Theo dõi & đối soát', 'Cập nhật trạng thái, bằng chứng giao hàng và báo cáo trên một màn hình.'],
                            ].map(([number, title, text]) => (
                                <div className="step" key={number}>
                                    <span>{number}</span>
                                    <div>
                                        <h3>{title}</h3>
                                        <p>{text}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <section className="network" id="network">
                <div className="container network-inner">
                    <div className="network-copy">
                        <span className="eyebrow light">MẠNG LƯỚI NỘI ĐÔ</span>
                        <h2>
                            Phủ rộng từng quận.
                            <br />
                            Kết nối mọi nhu cầu.
                        </h2>
                        <p>
                            Hạ tầng vận hành được thiết kế riêng cho nhịp độ đô thị: linh hoạt vào giờ cao điểm, chính xác đến từng địa chỉ.
                        </p>
                        <div className="network-numbers">
                            <div>
                                <strong>12</strong>
                                <span>quận trung tâm</span>
                            </div>
                            <div>
                                <strong>1,284</strong>
                                <span>tài xế đối tác</span>
                            </div>
                            <div>
                                <strong>99.2%</strong>
                                <span>độ phủ khu vực</span>
                            </div>
                        </div>
                    </div>
                    <div className="city-orbit">
                        <div className="orbit orbit-a" />
                        <div className="orbit orbit-b" />
                        <div className="orbit orbit-c" />
                        <div className="city-core">
                            <img src="/landing/brand-mark-dark.svg" alt="" width="64" height="64" />
                            <span>
                                HÀ NỘI<small>CONTROL HUB</small>
                            </span>
                        </div>
                        {['Cầu Giấy', 'Hoàn Kiếm', 'Đống Đa', 'Hai Bà Trưng', 'Tây Hồ'].map((district, i) => (
                            <span className={`district district-${i + 1}`} key={district}>
                                <i />
                                {district}
                            </span>
                        ))}
                    </div>
                </div>
            </section>

            <section className="cta-section" id="about">
                <div className="cta container">
                    <div>
                        <span className="eyebrow">SẴN SÀNG BẮT ĐẦU?</span>
                        <h2>
                            Đưa vận hành logistics
                            <br />
                            lên một tầm cao mới.
                        </h2>
                    </div>
                    <div className="cta-action">
                        <p>Trải nghiệm nền tảng cùng chuyên gia vận hành của chúng tôi.</p>
                        <Link href="/studio/doi-tac">
                            Đăng ký tư vấn <Icon name="arrow" size={18} />
                        </Link>
                    </div>
                </div>
            </section>

            <footer>
                <div className="container footer-top">
                    <Brand dark />
                    <p>Nền tảng vận hành giao nhận nội đô dành cho doanh nghiệp hiện đại.</p>
                    <div className="footer-links">
                        <a href="#solutions">Giải pháp</a>
                        <a href="#operations">Vận hành</a>
                        <a href="#network">Mạng lưới</a>
                        <Link href="/cong-khai">Hỗ trợ</Link>
                    </div>
                </div>
                <div className="container footer-bottom">
                    <span>© 2025 Nội Thành Logistics. Bảo lưu mọi quyền.</span>
                    <span>Hà Nội, Việt Nam · 1900 6868</span>
                </div>
            </footer>
        </main>
    );
}
