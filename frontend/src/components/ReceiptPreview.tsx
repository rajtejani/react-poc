import React from "react";
import { type ReceiptData } from "../api/printerApi";
import { usePrinter } from "../context/PrinterContext";

interface ReceiptPreviewProps {
  data: ReceiptData;
}

export const ReceiptPreview: React.FC<ReceiptPreviewProps> = ({ data }) => {
  const { settings } = usePrinter();
  const is58mm = settings?.width === "58mm";

  // Formats price to standard currency
  const formatVal = (val: number) => {
    return `₹${parseFloat(val.toString()).toFixed(2)}`;
  };

  return (
    <div className="receipt-preview-container">
      <div className="receipt-preview-header">
        <h3>Live Receipt Preview ({settings?.width || "80mm"})</h3>
        <p className="preview-subtitle">Matches the actual layout that will be printed</p>
      </div>

      <div className={`receipt-paper ${is58mm ? "paper-58mm" : "paper-80mm"}`}>
        {/* Jagged top edge effect */}
        <div className="paper-edge-top"></div>

        <div className="receipt-content">
          {/* Header */}
          <div className="receipt-align-center receipt-bold receipt-title">
            {data.storeName || "STORE NAME"}
          </div>
          {data.address && (
            <div className="receipt-align-center receipt-address">
              {data.address}
            </div>
          )}
          {data.phone && (
            <div className="receipt-align-center receipt-phone">
              Tel: {data.phone}
            </div>
          )}

          <div className="receipt-divider"></div>

          {/* Metadata */}
          <div className="receipt-metadata">
            {data.invoiceNumber && (
              <div>Invoice: <span className="receipt-bold">{data.invoiceNumber}</span></div>
            )}
            {data.date && <div>Date: {data.date}</div>}
            {data.cashier && <div>Cashier: {data.cashier}</div>}
            {data.customerName && <div>Customer: {data.customerName}</div>}
          </div>

          <div className="receipt-divider"></div>

          {/* Table Header */}
          <div className="receipt-item-row receipt-bold">
            <div>Description</div>
            <div className="receipt-align-right">Total</div>
          </div>
          <div className="receipt-divider"></div>

          {/* Items */}
          {data.items.length === 0 ? (
            <div className="receipt-align-center receipt-empty-items">
              (No items added yet)
            </div>
          ) : (
            data.items.map((item, index) => (
              <div key={index} className="receipt-item-row">
                <div className="receipt-item-name">
                  {item.name}
                  {item.quantity > 1 && (
                    <span className="receipt-qty-badge"> x{item.quantity}</span>
                  )}
                </div>
                <div className="receipt-align-right receipt-bold">
                  {formatVal(item.total)}
                </div>
              </div>
            ))
          )}

          <div className="receipt-divider"></div>

          {/* Totals */}
          <div className="receipt-totals-panel">
            <div className="receipt-item-row">
              <div>Subtotal:</div>
              <div className="receipt-align-right">{formatVal(data.subtotal)}</div>
            </div>
            {data.discount > 0 && (
              <div className="receipt-item-row receipt-discount-text">
                <div>Discount:</div>
                <div className="receipt-align-right">-{formatVal(data.discount)}</div>
              </div>
            )}
            <div className="receipt-item-row">
              <div>GST/Tax:</div>
              <div className="receipt-align-right">{formatVal(data.tax)}</div>
            </div>
            <div className="receipt-divider-thin"></div>
            <div className="receipt-item-row receipt-bold receipt-grand-total">
              <div>GRAND TOTAL:</div>
              <div className="receipt-align-right">{formatVal(data.total)}</div>
            </div>
          </div>

          <div className="receipt-divider"></div>

          {/* Barcode & QR Code simulation */}
          {data.qrCode && (
            <div className="receipt-align-center receipt-code-container">
              <div className="mock-qrcode">
                <svg width="70" height="70" viewBox="0 0 100 100">
                  {/* Mock QR pattern */}
                  <rect x="0" y="0" width="30" height="30" fill="black" />
                  <rect x="5" y="5" width="20" height="20" fill="white" />
                  <rect x="10" y="10" width="10" height="10" fill="black" />

                  <rect x="70" y="0" width="30" height="30" fill="black" />
                  <rect x="75" y="5" width="20" height="20" fill="white" />
                  <rect x="80" y="10" width="10" height="10" fill="black" />

                  <rect x="0" y="70" width="30" height="30" fill="black" />
                  <rect x="5" y="75" width="20" height="20" fill="white" />
                  <rect x="10" y="80" width="10" height="10" fill="black" />

                  <rect x="40" y="40" width="20" height="20" fill="black" />
                  <rect x="45" y="45" width="10" height="10" fill="white" />

                  <rect x="70" y="70" width="10" height="10" fill="black" />
                  <rect x="80" y="80" width="20" height="10" fill="black" />
                  <rect x="90" y="90" width="10" height="10" fill="black" />
                  <rect x="50" y="70" width="10" height="20" fill="black" />
                  <rect x="70" y="50" width="20" height="10" fill="black" />
                </svg>
              </div>
              <div className="receipt-code-label">{data.qrCode}</div>
            </div>
          )}

          {data.barcode && (
            <div className="receipt-align-center receipt-code-container">
              <div className="mock-barcode">
                <div className="barcode-line w-2"></div>
                <div className="barcode-line w-1"></div>
                <div className="barcode-line w-3"></div>
                <div className="barcode-line w-1"></div>
                <div className="barcode-line w-2"></div>
                <div className="barcode-line w-4"></div>
                <div className="barcode-line w-1"></div>
                <div className="barcode-line w-3"></div>
                <div className="barcode-line w-2"></div>
                <div className="barcode-line w-1"></div>
                <div className="barcode-line w-4"></div>
                <div className="barcode-line w-2"></div>
                <div className="barcode-line w-1"></div>
              </div>
              <div className="receipt-code-label">{data.barcode}</div>
            </div>
          )}

          {/* Footer */}
          <div className="receipt-align-center receipt-footer-msg">
            {data.footer || "Thank you for shopping with us!"}
          </div>
        </div>

        {/* Jagged bottom edge effect */}
        <div className="paper-edge-bottom"></div>
      </div>
    </div>
  );
};
