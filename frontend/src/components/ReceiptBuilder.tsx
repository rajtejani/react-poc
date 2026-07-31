import React, { useState, useEffect } from "react";
import type { ReceiptData, ReceiptItem } from "../api/printerApi";
import { usePrinter } from "../context/PrinterContext";
import { ReceiptPreview } from "./ReceiptPreview";

export const ReceiptBuilder: React.FC = () => {
  const { printReceipt, isPrinting, connected } = usePrinter();

  // Active form state
  const [storeName, setStoreName] = useState("Aroma Coffee Shop");
  const [address, setAddress] = useState("102, Park Lane, Connaught Place, New Delhi");
  const [phone, setPhone] = useState("+91 11 2345 6789");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [date, setDate] = useState("");
  const [cashier, setCashier] = useState("Aman Sharma");
  const [customerName, setCustomerName] = useState("Rohit Verma");
  const [footer, setFooter] = useState("GST IN: 07AAAAA1111A1Z1\nThank you! Visit us again.");

  // Codes
  const [qrCode, setQrCode] = useState("https://upi-payment-gateway.example");
  const [barcode, setBarcode] = useState("A102B903C");

  // Receipt items list state
  const [items, setItems] = useState<ReceiptItem[]>([
    { name: "Cappuccino Double", quantity: 2, price: 180, total: 360 },
    { name: "Choco Chip Cookie", quantity: 1, price: 90, total: 90 },
    { name: "Blueberry Muffin", quantity: 1, price: 150, total: 150 }
  ]);

  // Form inputs for a new item
  const [newItemName, setNewItemName] = useState("");
  const [newItemQty, setNewItemQty] = useState(1);
  const [newItemPrice, setNewItemPrice] = useState(0);

  // Financial fields
  const [discount, setDiscount] = useState<number>(50);
  const [taxRate, setTaxRate] = useState<number>(18); // 18% GST

  // Generate default metadata on mount
  useEffect(() => {
    const today = new Date();
    const formattedDate = today.toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      hour12: true
    });
    setDate(formattedDate);
    setInvoiceNumber(`INV-${today.getFullYear()}${(today.getMonth() + 1).toString().padStart(2, "0")}-${Math.floor(1000 + Math.random() * 9000)}`);
  }, []);

  // Handle adding an item
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim() || newItemQty <= 0 || newItemPrice <= 0) return;

    const total = newItemQty * newItemPrice;
    const newItem: ReceiptItem = {
      name: newItemName.trim(),
      quantity: newItemQty,
      price: newItemPrice,
      total
    };

    setItems([...items, newItem]);
    setNewItemName("");
    setNewItemQty(1);
    setNewItemPrice(0);
  };

  // Handle deleting an item
  const handleDeleteItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // Calculations
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const tax = Math.max(0, (subtotal - discount) * (taxRate / 100));
  const total = Math.max(0, subtotal - discount + tax);

  const receiptData: ReceiptData = {
    storeName,
    address,
    phone,
    invoiceNumber,
    date,
    cashier,
    customerName,
    items,
    subtotal,
    discount,
    tax,
    total,
    footer,
    qrCode,
    barcode
  };

  // Load sample template data
  const handleLoadSample = () => {
    setStoreName("Royal Indian Diner");
    setAddress("Block H, Sector 15, Noida, UP");
    setPhone("+91 120 4455 6677");
    setCashier("Priya Patel");
    setCustomerName("Vikram Singh");
    setDiscount(120);
    setTaxRate(5); // 5% GST on Restaurant
    setQrCode("https://payment.upi.in/scan/royal-diner");
    setBarcode("DINER9876");
    setFooter("GST IN: 09BCDE1234F1Z9\nFeedback? Email: feedback@royalindian.in");

    setItems([
      { name: "Paneer Butter Masala", quantity: 1, price: 340, total: 340 },
      { name: "Butter Naan", quantity: 3, price: 60, total: 180 },
      { name: "Dal Makhani Large", quantity: 1, price: 290, total: 290 },
      { name: "Sweet Lassi", quantity: 2, price: 80, total: 160 }
    ]);
  };

  // Clear builder
  const handleClear = () => {
    setItems([]);
    setDiscount(0);
    setTaxRate(0);
    setQrCode("");
    setBarcode("");
  };

  // Trigger print job
  const handlePrint = async () => {
    if (items.length === 0) return;
    await printReceipt(receiptData);
  };

  return (
    <div className="receipt-builder-grid">
      {/* Editor Panel */}
      <div className="builder-panel card">
        <div className="panel-header">
          <h2>Receipt Editor</h2>
          <div className="panel-actions">
            <button type="button" className="btn btn-secondary btn-sm" onClick={handleLoadSample}>
              Load Sample
            </button>
            <button type="button" className="btn btn-danger btn-sm" onClick={handleClear}>
              Clear All
            </button>
          </div>
        </div>

        <form onSubmit={handleAddItem} className="builder-form">
          <div className="form-section">
            <h4>Store Information</h4>
            <div className="form-row">
              <div className="input-group">
                <label>Store Name</label>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="input-group">
                <label>Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
              <div className="input-group">
                <label>Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h4>Receipt Meta Info</h4>
            <div className="form-row">
              <div className="input-group">
                <label>Invoice Number</label>
                <input
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                />
              </div>
              <div className="input-group">
                <label>Cashier</label>
                <input
                  type="text"
                  value={cashier}
                  onChange={(e) => setCashier(e.target.value)}
                />
              </div>
              <div className="input-group">
                <label>Customer Name</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h4>Transaction Items</h4>

            {/* Add Item form */}
            <div className="add-item-row">
              <div className="input-group flex-grow">
                <label>Item Name</label>
                <input
                  type="text"
                  placeholder="e.g. Vanilla Latte"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                />
              </div>
              <div className="input-group w-20">
                <label>Qty</label>
                <input
                  type="number"
                  min="1"
                  value={newItemQty}
                  onChange={(e) => setNewItemQty(parseInt(e.target.value) || 1)}
                />
              </div>
              <div className="input-group w-30">
                <label>Unit Price (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newItemPrice || ""}
                  onChange={(e) => setNewItemPrice(parseFloat(e.target.value) || 0)}
                />
              </div>
              <button type="submit" className="btn btn-primary add-item-btn">
                Add
              </button>
            </div>

            {/* Added items list */}
            <div className="items-list-table">
              <div className="list-header">
                <div>Item Name</div>
                <div className="text-center">Qty</div>
                <div className="text-right">Price</div>
                <div className="text-right">Total</div>
                <div></div>
              </div>
              <div className="list-body">
                {items.length === 0 ? (
                  <div className="list-empty-msg">No items in receipt. Use the form above to add items.</div>
                ) : (
                  items.map((item, idx) => (
                    <div key={idx} className="list-row">
                      <div className="item-cell-name">{item.name}</div>
                      <div className="text-center">{item.quantity}</div>
                      <div className="text-right">₹{item.price.toFixed(2)}</div>
                      <div className="text-right receipt-bold">₹{item.total.toFixed(2)}</div>
                      <div className="text-center">
                        <button
                          type="button"
                          className="btn-text-danger"
                          onClick={() => handleDeleteItem(idx)}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="form-section">
            <h4>Billing Adjustments</h4>
            <div className="form-row">
              <div className="input-group">
                <label>Discount (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={discount || ""}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="input-group">
                <label>GST Rate (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={taxRate || ""}
                  onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h4>Codes & Footer</h4>
            <div className="form-row">
              <div className="input-group">
                <label>QR Code Data (UPI/URL)</label>
                <input
                  type="text"
                  placeholder="e.g. UPI ID or Website Link"
                  value={qrCode}
                  onChange={(e) => setQrCode(e.target.value)}
                />
              </div>
              <div className="input-group">
                <label>Barcode Text</label>
                <input
                  type="text"
                  placeholder="e.g. Serial or Member Code"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="input-group">
                <label>Footer Message</label>
                <textarea
                  rows={2}
                  value={footer}
                  onChange={(e) => setFooter(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="builder-submit-actions">
            <button
              type="button"
              className="btn btn-success btn-large btn-full-width"
              onClick={handlePrint}
              disabled={isPrinting || items.length === 0 || !connected}
            >
              {isPrinting ? (
                <>
                  <span className="spinner"></span> Printing...
                </>
              ) : !connected ? (
                "Printer Offline (Cannot Print)"
              ) : (
                "Print Receipt"
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Preview Panel */}
      <div className="preview-panel">
        <ReceiptPreview data={receiptData} />
      </div>
    </div>
  );
};
