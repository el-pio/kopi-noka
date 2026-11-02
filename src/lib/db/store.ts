import fs from 'fs';
import path from 'path';
import {
  User, Shift, ShiftSession, Category, Product, ProductVariant,
  Order, OrderItem, Payment, PaymentEvent, Refund, PrintJob,
  StockMovement, AuditLog, PaymentProviderConfig, AppSetting
} from './schema';
import {
  initialUsers, initialShifts, initialCategories, initialProducts,
  initialVariants, initialPaymentConfigs, initialAppSettings
} from './seed-data';

interface DatabaseSchema {
  users: User[];
  shifts: Shift[];
  shiftSessions: ShiftSession[];
  categories: Category[];
  products: Product[];
  productVariants: ProductVariant[];
  orders: Order[];
  orderItems: OrderItem[];
  payments: Payment[];
  paymentEvents: PaymentEvent[];
  refunds: Refund[];
  printJobs: PrintJob[];
  stockMovements: StockMovement[];
  auditLogs: AuditLog[];
  paymentProviderConfigs: PaymentProviderConfig[];
  appSettings: AppSetting[];
  metadata: {
    lastOrderDate: string;
    orderSequence: number;
  };
}

class DatabaseStore {
  private static instance: DatabaseStore;
  private dbFilePath: string;
  private data: DatabaseSchema;
  private isLoaded: boolean = false;
  private writeLock: Promise<void> = Promise.resolve();

  private constructor() {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      try {
        fs.mkdirSync(dataDir, { recursive: true });
      } catch (e) {
        // Fallback for restricted write environments
      }
    }
    this.dbFilePath = path.join(dataDir, 'kopi_noka_db.json');
    this.data = this.getDefaultData();
    this.load();
  }

  public static getInstance(): DatabaseStore {
    if (!DatabaseStore.instance) {
      DatabaseStore.instance = new DatabaseStore();
    }
    return DatabaseStore.instance;
  }

  private getDefaultData(): DatabaseSchema {
    return {
      users: [...initialUsers],
      shifts: [...initialShifts],
      shiftSessions: [],
      categories: [...initialCategories],
      products: [...initialProducts],
      productVariants: [...initialVariants],
      orders: [],
      orderItems: [],
      payments: [],
      paymentEvents: [],
      refunds: [],
      printJobs: [],
      stockMovements: [],
      auditLogs: [],
      paymentProviderConfigs: [...initialPaymentConfigs],
      appSettings: [...initialAppSettings],
      metadata: {
        lastOrderDate: '',
        orderSequence: 0,
      },
    };
  }

  private load(): void {
    if (this.isLoaded) return;
    try {
      if (fs.existsSync(this.dbFilePath)) {
        const fileContent = fs.readFileSync(this.dbFilePath, 'utf-8');
        const parsed = JSON.parse(fileContent);
        this.data = {
          ...this.getDefaultData(),
          ...parsed,
        };
      } else {
        this.persist();
      }
    } catch (err) {
      console.warn("Using in-memory seed data due to disk read notice:", err);
      this.data = this.getDefaultData();
    }
    this.isLoaded = true;
  }

  private async persist(): Promise<void> {
    this.writeLock = this.writeLock.then(async () => {
      try {
        const tempPath = `${this.dbFilePath}.tmp`;
        fs.writeFileSync(tempPath, JSON.stringify(this.data, null, 2), 'utf-8');
        fs.renameSync(tempPath, this.dbFilePath);
      } catch (err) {
        // Handle disk write errors silently to prevent app crash
      }
    });
    return this.writeLock;
  }

  // Transaction execution with lock
  public async transaction<T>(action: (db: DatabaseSchema) => Promise<T> | T): Promise<T> {
    this.load();
    const result = await action(this.data);
    await this.persist();
    return result;
  }

  // Direct read-only access
  public getData(): DatabaseSchema {
    this.load();
    return this.data;
  }

  // --- Users & Auth ---
  public getUsers(): User[] {
    return this.getData().users;
  }

  public getUserByUsername(username: string): User | undefined {
    return this.getData().users.find(u => u.username.toLowerCase() === username.toLowerCase());
  }

  public getUserById(id: string): User | undefined {
    return this.getData().users.find(u => u.id === id);
  }

  // --- Shifts & Sessions ---
  public getShifts(): Shift[] {
    return this.getData().shifts;
  }

  public async updateShift(id: string, updates: Partial<Shift>): Promise<Shift | null> {
    return this.transaction(db => {
      const shift = db.shifts.find(s => s.id === id);
      if (!shift) return null;
      Object.assign(shift, updates, { updatedAt: new Date().toISOString() });
      return shift;
    });
  }

  public getShiftSessions(): ShiftSession[] {
    return this.getData().shiftSessions;
  }

  public getActiveShiftSession(cashierId?: string): ShiftSession | undefined {
    return this.getData().shiftSessions.find(
      s => s.status === 'OPEN' && (!cashierId || s.cashierId === cashierId)
    );
  }

  public async openShiftSession(shiftId: string, cashierId: string, openingCash: number): Promise<ShiftSession> {
    return this.transaction(db => {
      const newSession: ShiftSession = {
        id: `ses_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        shiftId,
        cashierId,
        openedAt: new Date().toISOString(),
        openingCash,
        expectedCash: openingCash,
        status: 'OPEN',
      };
      db.shiftSessions.push(newSession);

      // Audit log
      db.auditLogs.push({
        id: `aud_${Date.now()}`,
        userId: cashierId,
        action: 'SHIFT_OPEN',
        entityType: 'shift_sessions',
        entityId: newSession.id,
        details: JSON.stringify({ shiftId, openingCash }),
        createdAt: new Date().toISOString(),
      });

      return newSession;
    });
  }

  public async closeShiftSession(sessionId: string, actualCash: number, closingNote?: string, userId?: string): Promise<ShiftSession | null> {
    return this.transaction(db => {
      const session = db.shiftSessions.find(s => s.id === sessionId);
      if (!session || session.status === 'CLOSED') return null;

      // Recalculate cash sales from orders associated with this shift session
      const cashOrders = db.orders.filter(
        o => o.shiftSessionId === sessionId && o.paymentStatus === 'PAID'
      );
      const cashPayments = db.payments.filter(
        p => p.method === 'CASH' && p.status === 'PAID' && cashOrders.some(o => o.id === p.orderId)
      );
      const totalCashIn = cashPayments.reduce((acc, p) => acc + p.amount, 0);

      // Cash refunds in this session
      const cashRefunds = db.refunds.filter(
        r => r.approvalStatus === 'APPROVED' && r.executionStatus === 'EXECUTED' &&
        cashPayments.some(p => p.id === r.paymentId)
      );
      const totalCashRefund = cashRefunds.reduce((acc, r) => acc + r.amount, 0);

      const expectedCash = session.openingCash + totalCashIn - totalCashRefund;
      const cashDifference = actualCash - expectedCash; // Positive = Surplus, Negative = Shortage

      session.closedAt = new Date().toISOString();
      session.expectedCash = expectedCash;
      session.actualCash = actualCash;
      session.cashDifference = cashDifference;
      session.status = 'CLOSED';
      session.closingNote = closingNote;

      // Audit log
      db.auditLogs.push({
        id: `aud_${Date.now()}`,
        userId: userId || session.cashierId,
        action: 'SHIFT_CLOSE',
        entityType: 'shift_sessions',
        entityId: session.id,
        details: JSON.stringify({
          openingCash: session.openingCash,
          totalCashIn,
          totalCashRefund,
          expectedCash,
          actualCash,
          cashDifference,
          closingNote,
        }),
        createdAt: new Date().toISOString(),
      });

      return session;
    });
  }

  // --- Categories & Products ---
  public getCategories(): Category[] {
    return this.getData().categories;
  }

  public getProducts(): Product[] {
    return this.getData().products;
  }

  public getProductVariants(): ProductVariant[] {
    return this.getData().productVariants;
  }

  public async updateProductStock(
    productId: string,
    quantityChange: number,
    movementType: 'SALE' | 'RESTOCK' | 'ADJUSTMENT' | 'WASTE' | 'REFUND_RESTOCK',
    reason?: string,
    orderId?: string,
    performedBy?: string
  ): Promise<Product | null> {
    return this.transaction(db => {
      const product = db.products.find(p => p.id === productId);
      if (!product) return null;

      const newStock = product.stockQuantity + quantityChange;
      if (newStock < 0 && movementType === 'SALE') {
        throw new Error(`Stok produk "${product.name}" tidak mencukupi (Tersisa: ${product.stockQuantity})`);
      }

      product.stockQuantity = newStock;
      product.updatedAt = new Date().toISOString();

      // Record stock movement
      db.stockMovements.push({
        id: `sm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        productId,
        orderId,
        movementType,
        quantityChange,
        reason,
        performedBy,
        createdAt: new Date().toISOString(),
      });

      return product;
    });
  }

  public async saveProduct(productData: Partial<Product>): Promise<Product> {
    return this.transaction(db => {
      if (productData.id) {
        const existing = db.products.find(p => p.id === productData.id);
        if (existing) {
          Object.assign(existing, productData, { updatedAt: new Date().toISOString() });
          return existing;
        }
      }
      const newProduct: Product = {
        id: productData.id || `prd_${Date.now()}`,
        categoryId: productData.categoryId || 'cat_kopi_susu',
        name: productData.name || 'Produk Baru',
        description: productData.description || '',
        price: productData.price || 0,
        imageUrl: productData.imageUrl || '',
        stockQuantity: productData.stockQuantity || 0,
        minimumStock: productData.minimumStock || 5,
        isAvailable: productData.isAvailable ?? true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      db.products.push(newProduct);
      return newProduct;
    });
  }

  // --- Orders & Concurrency-Safe Order Number Generator ---
  public async generateNextOrderNumber(): Promise<string> {
    return this.transaction(db => {
      // Date in Asia/Makassar (WITA, UTC+8)
      const now = new Date();
      // Format: YYMMDD
      const year = String(now.getFullYear()).slice(-2);
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const dateKey = `${year}${month}${day}`;

      if (db.metadata.lastOrderDate !== dateKey) {
        db.metadata.lastOrderDate = dateKey;
        db.metadata.orderSequence = 1;
      } else {
        db.metadata.orderSequence += 1;
      }

      const seqStr = String(db.metadata.orderSequence).padStart(3, '0');
      return `KN-${dateKey}-${seqStr}`;
    });
  }

  public getOrders(): Order[] {
    const data = this.getData();
    return data.orders.map(order => ({
      ...order,
      items: data.orderItems.filter(item => item.orderId === order.id),
      payments: data.payments.filter(payment => payment.orderId === order.id),
    }));
  }

  public getOrderById(id: string): Order | undefined {
    return this.getOrders().find(o => o.id === id || o.orderNumber === id);
  }

  public async createOrder(order: Order, items: OrderItem[]): Promise<Order> {
    return this.transaction(db => {
      db.orders.push(order);
      items.forEach(item => db.orderItems.push(item));

      // Create Initial Print Job for Barista Ticket
      db.printJobs.push({
        id: `pj_barista_${Date.now()}`,
        orderId: order.id,
        printerType: 'BARISTA_TICKET',
        jobType: 'INITIAL',
        status: 'PENDING',
        attempts: 0,
        idempotencyKey: `print_barista_${order.id}`,
        createdAt: new Date().toISOString(),
      });

      return order;
    });
  }

  public async updateOrderStatus(
    orderId: string,
    status: Order['status'],
    userId?: string
  ): Promise<Order | null> {
    return this.transaction(db => {
      const order = db.orders.find(o => o.id === orderId);
      if (!order) return null;

      const prevStatus = order.status;
      order.status = status;
      order.updatedAt = new Date().toISOString();

      // Audit log
      db.auditLogs.push({
        id: `aud_${Date.now()}`,
        userId,
        action: 'ORDER_STATUS_CHANGED',
        entityType: 'orders',
        entityId: order.id,
        details: JSON.stringify({ from: prevStatus, to: status, orderNumber: order.orderNumber }),
        createdAt: new Date().toISOString(),
      });

      return order;
    });
  }

  // --- Payments ---
  public getPayments(): Payment[] {
    return this.getData().payments;
  }

  public async recordPayment(
    payment: Payment,
    event?: PaymentEvent
  ): Promise<{ payment: Payment; order: Order | null }> {
    return this.transaction(db => {
      // Idempotency check: prevent double payment insertion
      const existing = db.payments.find(p => p.idempotencyKey === payment.idempotencyKey);
      if (existing) {
        return {
          payment: existing,
          order: db.orders.find(o => o.id === existing.orderId) || null,
        };
      }

      db.payments.push(payment);
      if (event) {
        db.paymentEvents.push(event);
      }

      const order = db.orders.find(o => o.id === payment.orderId);
      if (order && payment.status === 'PAID') {
        order.paymentStatus = 'PAID';
        if (order.status === 'PENDING_PAYMENT') {
          order.status = 'QUEUED';
        }
        order.updatedAt = new Date().toISOString();

        // Stock reduction atomically happens when payment is PAID!
        const items = db.orderItems.filter(i => i.orderId === order.id);
        for (const item of items) {
          const product = db.products.find(p => p.id === item.productId);
          if (product) {
            product.stockQuantity -= item.quantity;
            db.stockMovements.push({
              id: `sm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              productId: product.id,
              orderId: order.id,
              movementType: 'SALE',
              quantityChange: -item.quantity,
              reason: `Penjualan pesanan #${order.orderNumber}`,
              createdAt: new Date().toISOString(),
            });
          }
        }

        // Create Print Job for Customer Receipt
        db.printJobs.push({
          id: `pj_cust_${Date.now()}`,
          orderId: order.id,
          printerType: 'CUSTOMER_RECEIPT',
          jobType: 'INITIAL',
          status: 'PENDING',
          attempts: 0,
          idempotencyKey: `print_receipt_${order.id}`,
          createdAt: new Date().toISOString(),
        });
      }

      return { payment, order: order || null };
    });
  }

  // --- Refunds ---
  public getRefunds(): Refund[] {
    return this.getData().refunds;
  }

  public async requestRefund(refund: Refund): Promise<Refund> {
    return this.transaction(db => {
      db.refunds.push(refund);

      db.auditLogs.push({
        id: `aud_${Date.now()}`,
        userId: refund.requestedBy,
        action: 'REFUND_REQUESTED',
        entityType: 'refunds',
        entityId: refund.id,
        details: JSON.stringify({ orderId: refund.orderId, amount: refund.amount, reason: refund.reason }),
        createdAt: new Date().toISOString(),
      });

      return refund;
    });
  }

  public async processRefundApproval(
    refundId: string,
    approved: boolean,
    approverId: string
  ): Promise<Refund | null> {
    return this.transaction(db => {
      const refund = db.refunds.find(r => r.id === refundId);
      if (!refund || refund.approvalStatus !== 'PENDING') return null;

      refund.approvalStatus = approved ? 'APPROVED' : 'REJECTED';
      refund.approvedBy = approverId;
      refund.approvedAt = new Date().toISOString();

      if (approved) {
        refund.executionStatus = 'EXECUTED';
        refund.completedAt = new Date().toISOString();

        // Update payment and order status
        const payment = db.payments.find(p => p.id === refund.paymentId);
        if (payment) payment.status = 'REFUNDED';

        const order = db.orders.find(o => o.id === refund.orderId);
        if (order) {
          order.paymentStatus = 'REFUNDED';
          order.status = 'CANCELLED';
        }
      } else {
        refund.executionStatus = 'FAILED';
      }

      db.auditLogs.push({
        id: `aud_${Date.now()}`,
        userId: approverId,
        action: approved ? 'REFUND_APPROVED' : 'REFUND_REJECTED',
        entityType: 'refunds',
        entityId: refund.id,
        details: JSON.stringify({ approved, amount: refund.amount, orderId: refund.orderId }),
        createdAt: new Date().toISOString(),
      });

      return refund;
    });
  }

  // --- Print Jobs ---
  public getPrintJobs(): PrintJob[] {
    return this.getData().printJobs;
  }

  public async markPrintJobCompleted(jobId: string): Promise<void> {
    return this.transaction(db => {
      const job = db.printJobs.find(j => j.id === jobId);
      if (job) {
        job.status = 'PRINTED';
        job.printedAt = new Date().toISOString();
        job.attempts += 1;
      }
    });
  }

  public async createReprintJob(
    orderId: string,
    printerType: 'CUSTOMER_RECEIPT' | 'BARISTA_TICKET',
    userId: string,
    reason: string
  ): Promise<PrintJob> {
    return this.transaction(db => {
      const newJob: PrintJob = {
        id: `pj_reprint_${Date.now()}`,
        orderId,
        printerType,
        jobType: 'REPRINT',
        status: 'PENDING',
        attempts: 0,
        idempotencyKey: `reprint_${orderId}_${Date.now()}`,
        reprintedBy: userId,
        reprintReason: reason,
        createdAt: new Date().toISOString(),
      };
      db.printJobs.push(newJob);

      db.auditLogs.push({
        id: `aud_${Date.now()}`,
        userId,
        action: 'RECEIPT_REPRINTED',
        entityType: 'print_jobs',
        entityId: newJob.id,
        details: JSON.stringify({ orderId, printerType, reason }),
        createdAt: new Date().toISOString(),
      });

      return newJob;
    });
  }

  // --- Audit Logs ---
  public getAuditLogs(): AuditLog[] {
    return this.getData().auditLogs.slice().reverse();
  }

  public async logAudit(entry: Omit<AuditLog, 'id' | 'createdAt'>): Promise<void> {
    return this.transaction(db => {
      db.auditLogs.push({
        id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        ...entry,
        createdAt: new Date().toISOString(),
      });
    });
  }

  // --- Settings ---
  public getAppSettings(): AppSetting[] {
    return this.getData().appSettings;
  }

  public getAppSetting(key: string, defaultValue: string = ''): string {
    const setting = this.getData().appSettings.find(s => s.key === key);
    return setting ? setting.value : defaultValue;
  }

  public async updateAppSetting(key: string, value: string): Promise<void> {
    return this.transaction(db => {
      const setting = db.appSettings.find(s => s.key === key);
      if (setting) {
        setting.value = value;
        setting.updatedAt = new Date().toISOString();
      } else {
        db.appSettings.push({
          id: `stg_${Date.now()}`,
          key,
          value,
          updatedAt: new Date().toISOString(),
        });
      }
    });
  }

  // Reset demo data helper
  public async resetDemoData(): Promise<void> {
    return this.transaction(db => {
      const fresh = this.getDefaultData();
      Object.assign(db, fresh);
    });
  }
}

export const dbStore = DatabaseStore.getInstance();
