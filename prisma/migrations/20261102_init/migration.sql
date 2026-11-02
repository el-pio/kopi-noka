-- Kopi Noka PostgreSQL Initial Migration DDL

-- Create Enums
CREATE TYPE "Role" AS ENUM ('ADMIN', 'CASHIER', 'BARISTA');
CREATE TYPE "ShiftStatus" AS ENUM ('OPEN', 'CLOSED');
CREATE TYPE "OrderSource" AS ENUM ('POS', 'ONLINE');
CREATE TYPE "OrderStatus" AS ENUM ('PENDING_PAYMENT', 'QUEUED', 'BREWING', 'READY', 'COMPLETED', 'CANCELLED');
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'EXPIRED', 'CANCELLED', 'REFUNDED');
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'QRIS', 'BANK_TRANSFER', 'DEBIT_CREDIT');
CREATE TYPE "RefundApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE "RefundExecutionStatus" AS ENUM ('PENDING', 'EXECUTED', 'FAILED');
CREATE TYPE "PrinterType" AS ENUM ('CUSTOMER_RECEIPT', 'BARISTA_TICKET');
CREATE TYPE "PrintJobStatus" AS ENUM ('PENDING', 'PRINTED', 'FAILED');
CREATE TYPE "StockMovementType" AS ENUM ('SALE', 'RESTOCK', 'ADJUSTMENT', 'WASTE', 'REFUND_RESTOCK');

-- Users Table
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "username" TEXT NOT NULL UNIQUE,
    "email" TEXT UNIQUE,
    "password_hash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'CASHIER',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Shifts Table
CREATE TABLE "shifts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Shift Sessions Table
CREATE TABLE "shift_sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shift_id" TEXT NOT NULL REFERENCES "shifts"("id") ON DELETE RESTRICT,
    "cashier_id" TEXT NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
    "opened_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closed_at" TIMESTAMP(3),
    "opening_cash" INTEGER NOT NULL DEFAULT 0,
    "expected_cash" INTEGER NOT NULL DEFAULT 0,
    "actual_cash" INTEGER,
    "cash_difference" INTEGER,
    "status" "ShiftStatus" NOT NULL DEFAULT 'OPEN',
    "closing_note" TEXT
);

-- Categories Table
CREATE TABLE "categories" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL UNIQUE,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Products Table
CREATE TABLE "products" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "category_id" TEXT NOT NULL REFERENCES "categories"("id") ON DELETE RESTRICT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" INTEGER NOT NULL,
    "image_url" TEXT,
    "stock_quantity" INTEGER NOT NULL DEFAULT 0,
    "minimum_stock" INTEGER NOT NULL DEFAULT 5,
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Product Variants Table
CREATE TABLE "product_variants" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "product_id" TEXT NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
    "name" TEXT NOT NULL,
    "additional_price" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true
);

-- Orders Table
CREATE TABLE "orders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "order_number" TEXT NOT NULL UNIQUE,
    "source" "OrderSource" NOT NULL DEFAULT 'POS',
    "cashier_id" TEXT REFERENCES "users"("id") ON DELETE SET NULL,
    "shift_session_id" TEXT REFERENCES "shift_sessions"("id") ON DELETE SET NULL,
    "customer_name" TEXT,
    "customer_contact" TEXT,
    "table_number" TEXT,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "payment_status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "subtotal" INTEGER NOT NULL DEFAULT 0,
    "discount_amount" INTEGER NOT NULL DEFAULT 0,
    "total_amount" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "orders_order_number_idx" ON "orders"("order_number");
CREATE INDEX "orders_created_at_idx" ON "orders"("created_at");
CREATE INDEX "orders_status_idx" ON "orders"("status");

-- Order Items Table
CREATE TABLE "order_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "order_id" TEXT NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,
    "product_id" TEXT NOT NULL REFERENCES "products"("id") ON DELETE RESTRICT,
    "product_name_snapshot" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price_snapshot" INTEGER NOT NULL,
    "discount_amount" INTEGER NOT NULL DEFAULT 0,
    "line_total" INTEGER NOT NULL,
    "variant_snapshot" TEXT,
    "customization_snapshot" TEXT,
    "notes" TEXT
);

-- Payments Table
CREATE TABLE "payments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "order_id" TEXT NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,
    "method" "PaymentMethod" NOT NULL,
    "provider" TEXT,
    "provider_transaction_id" TEXT,
    "idempotency_key" TEXT NOT NULL UNIQUE,
    "amount" INTEGER NOT NULL,
    "fee_amount" INTEGER NOT NULL DEFAULT 0,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paid_at" TIMESTAMP(3),
    "received_amount" INTEGER,
    "change_amount" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Payment Events Table
CREATE TABLE "payment_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "payment_id" TEXT NOT NULL REFERENCES "payments"("id") ON DELETE CASCADE,
    "provider_event_id" TEXT,
    "event_type" TEXT NOT NULL,
    "signature_verified" BOOLEAN NOT NULL DEFAULT false,
    "processing_status" TEXT NOT NULL DEFAULT 'PROCESSED',
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMP(3),
    CONSTRAINT "payment_events_payment_event_unique" UNIQUE ("payment_id", "provider_event_id")
);

-- Refunds Table
CREATE TABLE "refunds" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "order_id" TEXT NOT NULL REFERENCES "orders"("id") ON DELETE RESTRICT,
    "payment_id" TEXT NOT NULL REFERENCES "payments"("id") ON DELETE RESTRICT,
    "requested_by" TEXT NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
    "approved_by" TEXT REFERENCES "users"("id") ON DELETE RESTRICT,
    "amount" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "approval_status" "RefundApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "provider_refund_id" TEXT,
    "execution_status" "RefundExecutionStatus" NOT NULL DEFAULT 'PENDING',
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approved_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3)
);

-- Print Jobs Table
CREATE TABLE "print_jobs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "order_id" TEXT NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,
    "printer_type" "PrinterType" NOT NULL,
    "printer_identifier" TEXT,
    "job_type" TEXT NOT NULL DEFAULT 'INITIAL',
    "status" "PrintJobStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "idempotency_key" TEXT NOT NULL UNIQUE,
    "error_message" TEXT,
    "reprinted_by" TEXT,
    "reprint_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "printed_at" TIMESTAMP(3)
);

-- Stock Movements Table
CREATE TABLE "stock_movements" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "product_id" TEXT NOT NULL REFERENCES "products"("id") ON DELETE RESTRICT,
    "order_id" TEXT REFERENCES "orders"("id") ON DELETE SET NULL,
    "movement_type" "StockMovementType" NOT NULL,
    "quantity_change" INTEGER NOT NULL,
    "reason" TEXT,
    "performed_by" TEXT REFERENCES "users"("id") ON DELETE SET NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Audit Logs Table
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT REFERENCES "users"("id") ON DELETE SET NULL,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT,
    "details" TEXT,
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- Payment Provider Configs Table
CREATE TABLE "payment_provider_configs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "provider_name" TEXT NOT NULL UNIQUE,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "is_sandbox" BOOLEAN NOT NULL DEFAULT true,
    "fee_percentage" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- App Settings Table
CREATE TABLE "app_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL UNIQUE,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
