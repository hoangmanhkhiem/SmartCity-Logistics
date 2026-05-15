## Main issue
Chúng ta đang tạo tracking link để nhận hoa hồng khi user mua hàng qua link.

Shopee có 2 loại tracking link:
1. Dynamic link
    Pattern: `https://s.shopee.vn/an_redir?affiliate_id={affiliate ID}&utm_medium=affiliates&sub_id={sub1}-{sub2}-{sub3}-{sub4}-{sub5}&origin_link={encoded original link}}`
2. Shortlink
    Pattern: https://s.shopee.vn/5AmFu7JJs8?sub_id={value1}-{value2}-{value3}-{value4}-{value5}

Shopee yêu cầu chuyển hết các tracking link sang định dạng shortlink.

Nhiệm vụ của bạn:
- Run nhiều sub-agent, mỗi sub-agent explore một submodules để tìm những chỗ đang tạo tracking link shopee
- Sau đó lệt kê cách tạo ra file, mỗi submodule một file trong folder này với tên file là tên submodule.