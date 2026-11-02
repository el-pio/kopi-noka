// TypeScript Definitions for Kopi Noka Database Schema

export type Role = 'ADMIN' | 'CASHIER' | 'BARISTA';
export type ShiftStatus = 'OPEN' | 'CLOSED';
export type OrderSource = 'POS' | 'ONLINE';
export type OrderStatus = 'PENDING_PAYMENT' | 'QUEUED' | 'BREWING' | 'READY' | 'COMPLETED' | 'CANCELLED';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED' | 'CANCELLED' | 'REFUNDED';
export type PaymentMethod = 'CASH' | 'QRIS' | 'BANK_TRANSFER' | 'DEBIT_CREDIT';
export type RefundApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type RefundExecutionStatus = 'PENDING' | 'EXECUTED' | 'FAILED';
export type PrinterType = 'CUSTOMER_RECEIPT' | 'BARISTA_TICKET';
export type PrintJobStatus = 'PENDING' | 'PRINTED' | 'FAILED';
export type StockMovementType = 'SALE' | 'RESTOCK' | 'ADJUSTMENT' | 'WASTE' | 'REFUND_RESTOCK';

export interface User {
  id: string;
  name: string;
  username: string;
  email?: string;
  passwordHash: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Shift {
  id: string;
  name: string;
  startTime: string; // e.g. "07:00"
  endTime: string;   // e.g. "15:00"
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ShiftSession {
  id: string;
  shiftId: string;
  cashierId: string;
  openedAt: string;
  closedAt?: string;
  openingCash: number;
  expectedCash: number;
  actualCash?: number;
  cashDifference?: number;
  status: ShiftStatus;
  closingNote?: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  categoryId: string;
  name: string;
  description?: string;
  price: number; // in IDR
  imageUrl?: string;
  stockQuantity: number;
  minimumStock: number;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  additionalPrice: number;
  isActive: boolean;
}

export interface OrderCustomization {
  size?: 'Regular' | 'Large';
  sugarLevel?: 'Normal 100%' | 'Less Sugar 70%' | 'Low Sugar 50%' | 'No Sugar 0%';
  iceLevel?: 'Normal Ice' | 'Less Ice' | 'No Ice';
  toppings?: string[];
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productNameSnapshot: string;
  quantity: number;
  unitPriceSnapshot: number;
  discountAmount: number;
  lineTotal: number;
  variantSnapshot?: string;
  customizationSnapshot?: OrderCustomization | string;
  notes?: string;
}

export interface Order {
  id: string;
  orderNumber: string; // e.g. "KN-261102-001"
  source: OrderSource;
  cashierId?: string;
  shiftSessionId?: string;
  customerName?: string;
  customerContact?: string;
  tableNumber?: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  items?: OrderItem[];
  payments?: Payment[];
}

export interface Payment {
  id: string;
  orderId: string;
  method: PaymentMethod;
  provider?: string;
  providerTransactionId?: string;
  idempotencyKey: string;
  amount: number;
  feeAmount: number;
  status: PaymentStatus;
  paidAt?: string;
  receivedAmount?: number;
  changeAmount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentEvent {
  id: string;
  paymentId: string;
  providerEventId?: string;
  eventType: string;
  signatureVerified: boolean;
  processingStatus: string;
  receivedAt: string;
  processedAt?: string;
}

export interface Refund {
  id: string;
  orderId: string;
  paymentId: string;
  requestedBy: string;
  approvedBy?: string;
  amount: number;
  reason: string;
  approvalStatus: RefundApprovalStatus;
  providerRefundId?: string;
  executionStatus: RefundExecutionStatus;
  requestedAt: string;
  approvedAt?: string;
  completedAt?: string;
}

export interface PrintJob {
  id: string;
  orderId: string;
  printerType: PrinterType;
  printerIdentifier?: string;
  jobType: 'INITIAL' | 'REPRINT';
  status: PrintJobStatus;
  attempts: number;
  idempotencyKey: string;
  errorMessage?: string;
  reprintedBy?: string;
  reprintReason?: string;
  createdAt: string;
  printedAt?: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  orderId?: string;
  movementType: StockMovementType;
  quantityChange: number;
  reason?: string;
  performedBy?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  details?: string;
  ipAddress?: string;
  createdAt: string;
}

export interface PaymentProviderConfig {
  id: string;
  providerName: string;
  isEnabled: boolean;
  isSandbox: boolean;
  feePercentage: number;
  createdAt: string;
  updatedAt: string;
}

export interface AppSetting {
  id: string;
  key: string;
  value: string;
  description?: string;
  updatedAt: string;
}
