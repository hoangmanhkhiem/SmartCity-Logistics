-- Platform API clients + order fields for logistics-as-a-service

CREATE TABLE "platform_api_clients" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "key_prefix" TEXT NOT NULL,
    "key_hash" TEXT NOT NULL,
    "scopes" TEXT[] DEFAULT ARRAY['orders:create']::TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_api_clients_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "platform_api_clients_key_hash_key" ON "platform_api_clients"("key_hash");

ALTER TABLE "orders" ADD COLUMN "pickup_phone" TEXT;
ALTER TABLE "orders" ADD COLUMN "delivery_phone" TEXT;
ALTER TABLE "orders" ADD COLUMN "source_url" TEXT;
ALTER TABLE "orders" ADD COLUMN "external_ref" TEXT;
ALTER TABLE "orders" ADD COLUMN "fulfillment_channel" TEXT;
ALTER TABLE "orders" ADD COLUMN "platform_api_client_id" TEXT;

CREATE INDEX "orders_platform_api_client_id_external_ref_idx" ON "orders"("platform_api_client_id", "external_ref");

ALTER TABLE "orders" ADD CONSTRAINT "orders_platform_api_client_id_fkey" FOREIGN KEY ("platform_api_client_id") REFERENCES "platform_api_clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;
