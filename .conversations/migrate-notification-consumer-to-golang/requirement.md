# Mục tiêu
Migrate notification consumer (sender job) to golang

## Hiện tại
Luồng notification hiện tại:
- cms-api get userIds > Gọi sang api-notification truyền theo notification & userids
- api-notification find devices theo userIds > Send vào queue theo batch
- consumer consume notification request để thực hiện send theo batch


## Yêu cầu
Hãy đọc api-notification/src/worker/[worker.service.ts](../../api-notification/src/worker/worker.service.ts) để migrate worker send FCM & APN đó sang api-portal-golang