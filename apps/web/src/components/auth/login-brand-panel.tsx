export function LoginBrandPanel() {
    return (
        <aside className="relative hidden min-h-[calc(100vh-32px)] w-[min(100%,660px)] flex-col overflow-hidden rounded-[24px] bg-[#0d1d3c] text-white lg:flex">
            <div className="flex items-start justify-between px-10 pt-7">
                <div className="flex items-center gap-4">
                    <img src="/login/logo.svg" alt="" width={72} height={72} />
                    <div>
                        <p className="text-[25px] font-bold leading-[1.4] tracking-[2px]">NỘI THÀNH</p>
                        <p className="text-[10px] font-semibold tracking-[1.3px] text-[#a9b6cb]">TRƯỜNG ĐẠI HỌC GIAO THÔNG VẬN TẢI</p>
                    </div>
                </div>
                <span className="mt-2 h-[3px] w-12 rounded-[1px] bg-[#99bbff]" />
            </div>

            <div className="px-10 pt-10">
                <h1 className="max-w-[590px] text-[39px] font-semibold leading-[1.23]">
                    Kết nối dữ liệu.
                    <br />
                    Kiến tạo đô thị thông minh.
                </h1>
                <p className="mt-6 text-base font-medium text-[#99bbff]">Nền tảng Logistics Đô thị thông minh</p>
                <p className="mt-3 max-w-[530px] text-sm leading-[1.4] text-[#a9b6cb]">
                    Dữ liệu giao hàng chặng cuối nội đô Hà Nội cho cơ quan quản lý, doanh nghiệp và nhóm nghiên cứu.
                </p>
            </div>

            <div className="relative mt-8 min-h-0 flex-1">
                <div className="absolute inset-x-0 bottom-0 h-[min(500px,52%)] overflow-hidden">
                    <img src="/login/map-city.svg" alt="" className="pointer-events-none absolute left-0 top-0 h-[470px] w-[620px] max-w-none" />
                    <img src="/login/map-roads.svg" alt="" className="pointer-events-none absolute left-0 top-0 h-[470px] w-[620px] max-w-none" />
                    <img src="/login/map-river.svg" alt="" className="pointer-events-none absolute right-0 top-0 h-[470px] w-[160px] max-w-none" />
                    <img src="/login/map-route.svg" alt="" className="pointer-events-none absolute left-[14%] top-[24%] h-[207px] w-[344px] max-w-none" />
                    <img src="/login/map-hub.svg" alt="" className="pointer-events-none absolute left-[14.7%] top-[63%] size-[48px]" />
                    <img src="/login/map-node.svg" alt="" className="pointer-events-none absolute left-[46%] top-[43%] size-[16px]" />
                    <img src="/login/map-hub.svg" alt="" className="pointer-events-none absolute left-[66%] top-[19%] size-[48px]" />

                    <div className="absolute left-8 top-4 flex h-[35px] items-center">
                        <img src="/login/map-chip.svg" alt="" width={170} height={35} className="absolute inset-0" />
                        <p className="relative z-[1] pl-[26px] text-[10px] font-semibold tracking-[1px] text-[#eaf0ff]">HÀ NỘI · VIỆT NAM</p>
                    </div>

                    <div className="absolute bottom-[88px] right-10 w-[243px] rounded-[14px] bg-white px-5 py-4 shadow-[0px_8px_24px_0px_rgba(0,0,0,0.15)]">
                        <p className="text-sm font-semibold text-[#0d1d3c]">Kết nối dữ liệu đô thị</p>
                        <p className="mt-1 text-[11px] text-[#68778d]">Một nền tảng. Nhiều góc nhìn.</p>
                    </div>
                </div>
            </div>

            <div className="mt-auto px-10 pb-6 pt-4">
                <div className="h-px bg-[#304768]" />
                <div className="mt-5 flex items-center justify-between text-[10px] font-medium tracking-[1.2px] text-[#a9b6cb]">
                    <span>DÀNH CHO NGHIÊN CỨU &amp; GIẢNG DẠY</span>
                    <span className="tracking-normal text-[11px] font-normal">01 / 01</span>
                </div>
            </div>
        </aside>
    );
}
