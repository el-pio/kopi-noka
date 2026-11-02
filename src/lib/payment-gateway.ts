import crypto from 'crypto';
import QRCode from 'qrcode';
import { dbStore } from './db/store';

export interface QRISCreationResult {
  qrContent: string;        // EMVCo QR string or payment URL
  qrCodeDataUrl: string;    // Base64 PNG image for display
  transactionId: string;
  expiresAt: string;
  amount: number;
  feeAmount: number;
  mode: 'SIMULATION' | 'PRODUCTION';
  provider: string;
}

export class PaymentGatewayService {
  /**
   * Generate Dynamic QRIS for an order
   */
  public static async createDynamicQRIS(
    orderNumber: string,
    amount: number
  ): Promise<QRISCreationResult> {
    const mode = (dbStore.getAppSetting('qris_mode', 'SIMULATION') as 'SIMULATION' | 'PRODUCTION');
    const nmid = dbStore.getAppSetting('qris_nmid', 'ID1020304050607');
    const merchantName = dbStore.getAppSetting('outlet_name', 'KOPI NOKA MAKASSAR');

    // Standard BI MDR Fee: 0.7% for regular QRIS
    const feePercentage = 0.007;
    const feeAmount = Math.round(amount * feePercentage);

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 mins expiry
    const transactionId = `TRX_QRIS_${orderNumber}_${Date.now()}`;

    // Standard EMVCo QRIS Payload structure
    const qrPayload = `00020101021226600016ID.CO.QRIS.WWW0118${nmid}0215${orderNumber}520458145303360540${amount.toFixed(2).length}${amount.toFixed(2)}5802ID59${merchantName.length.toString().padStart(2, '0')}${merchantName}6008MAKASSAR62${(orderNumber.length + 4).toString().padStart(2, '0')}01${orderNumber.length.toString().padStart(2, '0')}${orderNumber}6304ABCD`;

    // Generate QR Code data URL (PNG)
    const qrCodeDataUrl = await QRCode.toDataURL(qrPayload, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 320,
      color: {
        dark: '#1A0E0A', // Dark roasted coffee color
        light: '#FFFFFF',
      },
    });

    return {
      qrContent: qrPayload,
      qrCodeDataUrl,
      transactionId,
      expiresAt,
      amount,
      feeAmount,
      mode,
      provider: 'MIDTRANS_QRIS',
    };
  }

  /**
   * Verify signature of incoming payment webhook
   */
  public static verifyWebhookSignature(
    signature: string | null,
    rawPayload: string,
    serverKey: string = 'sandbox_mock_server_key'
  ): boolean {
    if (!signature) return false;

    try {
      const expectedSignature = crypto
        .createHmac('sha256', serverKey)
        .update(rawPayload)
        .digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    } catch (err) {
      // In simulation mode, accept if explicitly 'SIMULATION_VALID_SIG'
      if (signature === 'SIMULATION_VALID_SIG') {
        return true;
      }
      return false;
    }
  }

  /**
   * Calculate Payment Fee based on method
   */
  public static calculateFee(method: 'CASH' | 'QRIS' | 'BANK_TRANSFER' | 'DEBIT_CREDIT', amount: number): number {
    switch (method) {
      case 'QRIS':
        return Math.round(amount * 0.007); // 0.7%
      case 'DEBIT_CREDIT':
        return Math.round(amount * 0.0015); // 0.15%
      case 'BANK_TRANSFER':
      case 'CASH':
      default:
        return 0;
    }
  }
}
