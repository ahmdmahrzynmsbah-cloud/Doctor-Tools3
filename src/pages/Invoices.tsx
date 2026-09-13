import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Plus, Search, FileText, X, Printer, Edit, Trash2, ListStart, List, Barcode, Receipt, Save, Download, MessageCircle, Share2, Loader2 } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { useAppData } from '@/src/context/AppDataContext';
import InvoicePrint from '../components/InvoicePrint';
import VoiceFeatureBanner from '../components/VoiceFeatureBanner';
import { captureElementToCanvas } from '../utils/canvasCapture';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';

export default function Invoices() {
  const { invoices, customers, inventory, businessProfile, createInvoice, updateInvoice, deleteInvoice, addCustomer } = useAppData();
  
  const [viewMode, setViewMode] = useState<'create' | 'list'>('create');
  
  const [searchTerm, setSearchTerm] = useState('');
  
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);
  const [printingInvoiceId, setPrintingInvoiceId] = useState<string | null>(null);
  const [isPrintDirect, setIsPrintDirect] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form State
  const [isQuote, setIsQuote] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customerNameInput, setCustomerNameInput] = useState('');
  const [isCustomCustomer, setIsCustomCustomer] = useState(false);
  const [customerPhoneInput, setCustomerPhoneInput] = useState('');
  const [invoiceItems, setInvoiceItems] = useState<{ inventoryId: string, qty: number, price: number }[]>([]);
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [discountValue, setDiscountValue] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "deferred" | "partial">("cash");
  const [paidAmount, setPaidAmount] = useState(0);
  const [notes, setNotes] = useState('');  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Item Search
  const [itemSearchText, setItemSearchText] = useState('');

  const [showDetailsAndPrices, setShowDetailsAndPrices] = useState(true);
  const [autoScannerActive, setAutoScannerActive] = useState(true);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [sharingInvoiceId, setSharingInvoiceId] = useState<string | null>(null);
  const [isSharingImage, setIsSharingImage] = useState(false);
  const [downloadPreviewUrl, setDownloadPreviewUrl] = useState<string | null>(null);
  const [downloadPreviewFilename, setDownloadPreviewFilename] = useState<string>('');
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const sharingPrintRef = useRef<HTMLDivElement>(null);

  const printingInvoice = printingInvoiceId ? invoices.find(i => i.id === printingInvoiceId) : null;
  const printingCustomer = printingInvoice ? customers.find(c => c.id === printingInvoice.customerId) : undefined;

  const dataURLtoBlob = (dataurl: string) => {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  };

  const captureInvoiceCanvas = async (containerEl: HTMLElement, isPdf = false): Promise<HTMLCanvasElement> => {
    const card = (containerEl.querySelector('#invoice-card') as HTMLElement) || 
                 (containerEl.firstElementChild as HTMLElement) || 
                 containerEl;

    return await captureElementToCanvas(card, 850, isPdf);
  };

  const downloadAsImage = async () => {
    if (!printRef.current || !printingInvoice) return;
    
    try {
      setIsSharingImage(true);
      const element = (printRef.current.firstElementChild || printRef.current) as HTMLElement;
      const canvas = await captureInvoiceCanvas(element);
      
      const image = canvas.toDataURL('image/png');
      const blob = dataURLtoBlob(image);
      const blobUrl = URL.createObjectURL(blob);
      const prefix = printingInvoice.isQuote ? 'quote_' : 'invoice_';
      const filename = `${prefix}${printingInvoice.invoiceNumber}.png`;
      
      setDownloadPreviewUrl(blobUrl);
      setDownloadPreviewFilename(filename);

      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setIsSharingImage(false);
    } catch (err) {
      console.error('Error downloading invoice image:', err?.message || String(err));
      setIsSharingImage(false);
      alert('حدث خطأ أثناء محاولة حفظ المستند كصورة');
    }
  };

  const generateInvoicePdf = async (element: HTMLElement, filename: string) => {
    const canvas = await captureInvoiceCanvas(element, true);

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    const imgData = canvas.toDataURL('image/png', 1.0);
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pdfHeight;

    while (heightLeft > 2) {
      position -= pdfHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pdfHeight;
    }

    pdf.save(filename);
  };

  const downloadAsPdf = async () => {
    if (!printRef.current || !printingInvoice) return;
    
    try {
      setIsSharingImage(true);
      const element = (printRef.current.firstElementChild || printRef.current) as HTMLElement;
      const prefix = printingInvoice.isQuote ? 'quote_' : 'invoice_';
      await generateInvoicePdf(element, `${prefix}${printingInvoice.invoiceNumber}.pdf`);
      setIsSharingImage(false);
    } catch (err) {
      console.error('Error downloading invoice as PDF:', err?.message || String(err));
      setIsSharingImage(false);
      alert('حدث خطأ أثناء محاولة حفظ المستند كملف PDF');
    }
  };

  const handleMobileShare = async () => {
    if (!downloadPreviewUrl) return;
    try {
      const response = await fetch(downloadPreviewUrl);
      const blob = await response.blob();
      const file = new File([blob], downloadPreviewFilename || 'document.png', { type: 'image/png' });
      if (navigator.share) {
        await navigator.share({
          files: [file],
          title: 'مستند مبيعات / عرض سعر',
          text: `مشاركة المستند ${downloadPreviewFilename}`
        });
      } else {
        alert('المشاركة المحلية غير مدعومة في هذا المتصفح. يرجى استخدام زر التحميل العادي بالأسفل.');
      }
    } catch (err) {
      console.error('Error sharing image file:', err?.message || String(err));
    }
  };

  const handleDownloadAsImageFromList = async (inv: any) => {
    try {
      setIsSharingImage(true);
      setSharingInvoiceId(inv.id);

      // Wait for React to mount the hidden preview element
      await new Promise((resolve) => setTimeout(resolve, 300));

      const element = document.getElementById('hidden-share-invoice-print') || sharingPrintRef.current;
      if (!element) {
        setIsSharingImage(false);
        setSharingInvoiceId(null);
        alert("حدث خطأ أثناء تحديد المستند في النظام.");
        return;
      }

      const canvas = await captureInvoiceCanvas(element);

      const image = canvas.toDataURL('image/png');
      const blob = dataURLtoBlob(image);
      const blobUrl = URL.createObjectURL(blob);
      const prefix = inv.isQuote ? 'quote_' : 'invoice_';
      const filename = `${prefix}${inv.invoiceNumber}.png`;

      setDownloadPreviewUrl(blobUrl);
      setDownloadPreviewFilename(filename);

      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setIsSharingImage(false);
      setSharingInvoiceId(null);
    } catch (err: any) {
      console.error(err?.message || String(err));
      setIsSharingImage(false);
      setSharingInvoiceId(null);
      alert("حدث خطأ أثناء محاولة المعالجة وحفظ المستند كصورة: " + (err?.message || String(err)));
    }
  };

  const handleDownloadAsPdfFromList = async (inv: any) => {
    try {
      setIsSharingImage(true);
      setSharingInvoiceId(inv.id);

      // Wait for React to mount the hidden preview element
      await new Promise((resolve) => setTimeout(resolve, 300));

      const element = document.getElementById('hidden-share-invoice-print') || sharingPrintRef.current;
      if (!element) {
        setIsSharingImage(false);
        setSharingInvoiceId(null);
        alert("حدث خطأ أثناء تحديد المستند في النظام.");
        return;
      }

      const printTarget = (element.firstElementChild || element) as HTMLElement;
      const prefix = inv.isQuote ? 'quote_' : 'invoice_';
      await generateInvoicePdf(printTarget, `${prefix}${inv.invoiceNumber}.pdf`);

      setIsSharingImage(false);
      setSharingInvoiceId(null);
    } catch (err: any) {
      console.error(err?.message || String(err));
      setIsSharingImage(false);
      setSharingInvoiceId(null);
      alert("حدث خطأ أثناء محاولة المعالجة وحفظ المستند كملف PDF: " + (err?.message || String(err)));
    }
  };

  const customerMap = useMemo(() => {
    const map = new Map<string, string>();
    customers.forEach(c => map.set(c.id, c.name));
    return map;
  }, [customers]);

  const inventoryMap = useMemo(() => {
    const map = new Map<string, any>();
    inventory.forEach(i => map.set(i.id, i));
    return map;
  }, [inventory]);

  const filteredInvoices = useMemo(() => {
    if (!searchTerm.trim()) return invoices;
    const lowerSearch = searchTerm.toLowerCase();
    return invoices.filter(inv => {
      const custName = customerMap.get(inv.customerId) || inv.customCustomerName || '';
      return inv.invoiceNumber.toLowerCase().includes(lowerSearch) || custName.toLowerCase().includes(lowerSearch);
    });
  }, [invoices, customerMap, searchTerm]);

  const searchResults = useMemo(() => {
    if (!itemSearchText.trim()) return [];
    const term = itemSearchText.toLowerCase();
    
    // Auto-select if auto scanner is active and exact match with code
    if (autoScannerActive) {
       const exactMatch = inventory.find(i => i.code && i.code.toLowerCase() === term);
       if (exactMatch) {
         return [exactMatch];
       }
    }
    
    return inventory.filter(i => 
      (i.name && i.name.toLowerCase().includes(term)) || 
      (i.code && i.code.toLowerCase().includes(term)) ||
      (i.brand && i.brand.toLowerCase().includes(term))
    );
  }, [itemSearchText, inventory, autoScannerActive]);

  useEffect(() => {
     if (autoScannerActive && searchResults.length === 1 && searchResults[0].code && searchResults[0].code.toLowerCase() === itemSearchText.trim().toLowerCase()) {
        const item = searchResults[0];
        setInvoiceItems(prev => {
          const existing = prev.find(i => i.inventoryId === item.id);
          if (existing) {
            return prev.map(i => i.inventoryId === item.id ? { ...i, qty: i.qty + 1 } : i);
          }
          return [...prev, { inventoryId: item.id, qty: 1, price: item.sellPrice }];
        });
        setItemSearchText('');
        
        setTimeout(() => {
           if (searchInputRef.current) {
             searchInputRef.current.focus();
           }
        }, 50);
     }
  }, [searchResults, autoScannerActive, itemSearchText]);

  const getInventoryItem = (id: string) => inventoryMap.get(id) || inventory.find(i => i.id === id);
  
  const subtotal = useMemo(() => {
    return invoiceItems.reduce((acc, item) => {
      return acc + (item.price * item.qty);
    }, 0);
  }, [invoiceItems]);
  
  const discountAmount = useMemo(() => {
    if (discountType === 'percentage') {
      return subtotal * (discountValue / 100);
    }
    return discountValue;
  }, [subtotal, discountType, discountValue]);

  const finalTotal = Math.max(0, subtotal - discountAmount);
  
  useEffect(() => {
    if (paymentMethod === 'cash') {
      setPaidAmount(finalTotal);
    } else if (paymentMethod === 'deferred') {
      setPaidAmount(0);
    setInvoiceDate(new Date().toISOString().split('T')[0]);
    }
  }, [paymentMethod, finalTotal]);

  useEffect(() => {
    if (printingInvoiceId && isPrintDirect) {
      const handleAfterPrint = () => {
        setPrintingInvoiceId(null);
        setIsPrintDirect(false);
      };
      window.addEventListener('afterprint', handleAfterPrint);
      
      const timer = setTimeout(() => {
        window.print();
      }, 500);
      
      return () => {
        window.removeEventListener('afterprint', handleAfterPrint);
        clearTimeout(timer);
      };
    }
  }, [printingInvoiceId, isPrintDirect]);

  const handleEditClick = (invoiceId: string) => {
    const inv = invoices.find(i => i.id === invoiceId);
    if (!inv) return;
    
    setEditingInvoiceId(invoiceId);
    setIsQuote(inv.isQuote || false);
    if (inv.isQuote && inv.customCustomerName) {
      setSelectedCustomerId('');
      setCustomerNameInput(inv.customCustomerName);
      setCustomerPhoneInput('');
    } else {
      const c = customers.find(c => c.id === inv.customerId);
      if (c) {
        setSelectedCustomerId(c.id);
        setCustomerNameInput(c.name);
        setCustomerPhoneInput(c.phone);
      } else {
        setSelectedCustomerId('');
        setCustomerNameInput('');
        setCustomerPhoneInput('');
      }
    }
    setInvoiceItems(inv.items.map(item => ({ inventoryId: item.itemId, qty: item.quantity, price: item.price })));
    setDiscountValue(inv.discountValue || 0);
    setDiscountType(inv.discountType || 'percentage');
    
    if (inv.paid >= inv.total) {
      setPaymentMethod('cash');
    } else if (inv.paid === 0) {
      setPaymentMethod('deferred');
    } else {
      setPaymentMethod('partial');
    }
    setPaidAmount(inv.paid);
    setInvoiceDate(inv.date ? new Date(inv.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
    
    setViewMode('create');
  };

  const handleDeleteClick = (invoiceId: string) => {
    setInvoiceToDelete(invoiceId);
  };

  const targetInvoiceToDelete = useMemo(() => {
    if (!invoiceToDelete) return null;
    return invoices.find(i => i.id === invoiceToDelete) || null;
  }, [invoiceToDelete, invoices]);

  const confirmDelete = async () => {
    if (!invoiceToDelete) return;
    setIsDeleting(true);
    try {
      await deleteInvoice(invoiceToDelete);
      setInvoiceToDelete(null);
    } catch (err: any) {
      console.error(err);
      alert('حدث خطأ أثناء حذف الفاتورة: ' + (err?.message || String(err)));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddItem = (itemId: string) => {
    const item = getInventoryItem(itemId);
    if (!item) return;
    const existing = invoiceItems.find(i => i.inventoryId === itemId);
    if (existing) {
      setInvoiceItems(invoiceItems.map(i => i.inventoryId === itemId ? { ...i, qty: i.qty + 1 } : i));
    } else {
      setInvoiceItems([...invoiceItems, { inventoryId: itemId, qty: 1, price: item.sellPrice }]);
    }
    setItemSearchText('');
  };

  const handleCreateOrUpdateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (invoiceItems.length === 0) {
      alert('الفاتورة فارغة. يرجى إضافة عناصر.');
      return;
    }
    
    let targetCustomerId = selectedCustomerId;
    let customCustomerName = '';

    if (isQuote) {
      customCustomerName = customerNameInput.trim() || 'عميل نقدي/عرض سعر';
      targetCustomerId = '';
    } else {
      // Auto-create customer if name entered but no selected id
      const finalCustName = customerNameInput.trim() || 'عميل نقدي';
      
      if (!targetCustomerId) {
        // Find if a customer with this name already exists
        const existingCId = customers.find(c => c.name.trim().toLowerCase() === finalCustName.toLowerCase());
        if (existingCId) {
          targetCustomerId = existingCId.id;
        } else {
          // Create the customer automatically via AppDataContext!
          try {
            const newCustId = await addCustomer({
              name: finalCustName,
              phone: customerPhoneInput.trim(),
              balance: 0
            });
            targetCustomerId = newCustId;
          } catch (custErr) {
            console.warn('Auto customer creation completed locally:', custErr);
            targetCustomerId = `cust_${Date.now()}`;
          }
        }
      }
    }

    const activeInvoice = editingInvoiceId ? invoices.find(i => i.id === editingInvoiceId) : null;
    let hasStockIssues = false;
    
    if (!isQuote) {
      for (const vItem of invoiceItems) {
        const invItem = getInventoryItem(vItem.inventoryId);
        const oldQty = activeInvoice ? (activeInvoice.items.find(i => i.itemId === vItem.inventoryId)?.quantity || 0) : 0;
        const available = invItem ? invItem.quantity + oldQty : 0;

        if (!invItem || available < vItem.qty) {
          hasStockIssues = true;
          alert(`عذراً، الكمية المتوفرة من ${invItem?.name || ''} غير كافية (المتاح: ${available})`);
          break;
        }
      }
    }

    if (hasStockIssues) return;

    const mappedItems = invoiceItems.map(item => ({
      itemId: item.inventoryId,
      quantity: item.qty,
      price: item.price
    }));

    try {
      const isEdit = !!(editingInvoiceId && activeInvoice);
      const invoicePayload: any = {
        date: invoiceDate ? new Date(invoiceDate).toISOString() : new Date().toISOString(),
        customerId: targetCustomerId,
        items: mappedItems,
        total: finalTotal,
        paid: isQuote ? 0 : paidAmount,
        discountType,
        discountValue,
        isQuote
      };

      if (isQuote && customCustomerName) {
        invoicePayload.customCustomerName = customCustomerName;
      }

      if (isEdit) {
        await updateInvoice(editingInvoiceId!, invoicePayload);
      } else {
        await createInvoice(invoicePayload);
      }

      alert(editingInvoiceId ? 'تم تحديث الفاتورة بنجاح!' : 'تم إصدار الفاتورة أو عرض السعر بنجاح!');
      resetForm();
      setViewMode('list');
    } catch (err: any) {
      alert(err?.message || 'حدث خطأ غير متوقع أثناء معالجة الفاتورة.');
    }
  };

  const resetForm = () => {
    setEditingInvoiceId(null);
    setIsQuote(false);
    setSelectedCustomerId('');
    setCustomerNameInput('');
    setIsCustomCustomer(false);
    setCustomerPhoneInput('');
    setInvoiceItems([]);
    setDiscountValue(0);
    setPaymentMethod('cash');
    setPaidAmount(0);
    setInvoiceDate(new Date().toISOString().split('T')[0]);
    setItemSearchText('');
  };

  return (
    <>
      {printingInvoice && (
        <div className={`fixed inset-0 z-50 overflow-y-auto print:bg-transparent print:backdrop-blur-none print:p-0 bg-[#F1F5F9] print:static print:h-auto print:overflow-visible print:block`}>
          <div className="p-3 sm:p-4 flex flex-wrap sm:flex-nowrap gap-2 sm:gap-4 justify-center items-center border-b border-[#E2E8F0] print:hidden bg-white shadow-sm sticky top-0 z-10">
            <button 
              onClick={() => {
                setTimeout(() => window.print(), 100);
              }}
              className="px-4 sm:px-6 py-2 bg-[#2180B2] text-white rounded-lg text-sm font-bold hover:bg-[#1A6B94] flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Printer className="w-4 h-4 sm:w-5 sm:h-5" />
              طباعة {printingInvoice.isQuote ? 'عرض السعر' : 'الفاتورة'}
            </button>
            {printingInvoice.items.length <= 8 && (
              <button 
                onClick={downloadAsImage}
                disabled={isSharingImage}
                className="px-4 sm:px-6 py-2 bg-[#16A34A] text-white rounded-lg text-sm font-bold hover:bg-[#15803D] flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-75 disabled:cursor-wait"
              >
                {isSharingImage ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> : <Download className="w-4 h-4 sm:w-5 sm:h-5" />}
                {isSharingImage ? 'جاري المعالجة...' : 'تحميل كصورة'}
              </button>
            )}
            <button 
              onClick={downloadAsPdf}
              disabled={isSharingImage}
              className="px-4 sm:px-6 py-2 bg-[#DC2626] text-white rounded-lg text-sm font-bold hover:bg-[#B91C1C] flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-75 disabled:cursor-wait"
            >
              {isSharingImage ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> : <FileText className="w-4 h-4 sm:w-5 sm:h-5" />}
              {isSharingImage ? 'جاري المعالجة...' : 'تحميل PDF'}
            </button>
            {downloadPreviewUrl && (
              <button 
                onClick={handleMobileShare}
                className="px-4 sm:px-6 py-2 bg-[#8B5CF6] text-white rounded-lg text-sm font-bold hover:bg-[#7C3AED] flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
                مشاركة
              </button>
            )}
            <button 
              onClick={() => setPrintingInvoiceId(null)}
              className="px-4 sm:px-6 py-2 bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0] rounded-lg text-sm font-bold hover:bg-[#E2E8F0] cursor-pointer"
            >
              عودة
            </button>
          </div>
          <div id="invoice-print-area" className="p-2 sm:p-8 flex justify-start sm:justify-center overflow-x-auto print:p-0 print:overflow-visible" ref={printRef}>
            <InvoicePrint 
              invoice={printingInvoice} 
              customer={printingCustomer} 
              inventory={inventory} 
              profile={businessProfile} 
            />
          </div>
        </div>
      )}

      <div className="space-y-6 print:hidden">
        
        {/* Voice Feature Announcement Banner */}
        <VoiceFeatureBanner />
        
        {/* Top Toggle Bar */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 p-1.5 sm:p-2 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0]">
          <button 
            onClick={() => { resetForm(); setViewMode('create'); }}
            className={`flex-1 py-2.5 sm:py-3 px-4 sm:px-6 rounded-xl font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${viewMode === 'create' ? 'bg-[#2180B2] text-white shadow-md' : 'text-[#475569] hover:bg-white hover:shadow-sm bg-transparent border-none'}`}
          >
            <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>إنشاء فاتورة بيع جديدة</span>
          </button>
          <button 
            onClick={() => setViewMode('list')}
            className={`flex-1 py-2.5 sm:py-3 px-4 sm:px-6 rounded-xl font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${viewMode === 'list' ? 'bg-[#2180B2] text-white shadow-md' : 'text-[#475569] hover:bg-white hover:shadow-sm bg-transparent border-none'}`}
          >
            <List className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>سجل المبيعات وقائمة الفواتير</span>
          </button>
        </div>

        {viewMode === 'create' && (
          <form onSubmit={handleCreateOrUpdateInvoice} className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            
            {/* Account & Payment Column (On mobile appears after items or neatly stacked without sticky overlap) */}
            <div className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-4 sm:p-6 flex flex-col h-fit lg:sticky lg:top-20 order-2 lg:order-1">
               <div className="flex items-center gap-2 mb-4 sm:mb-6 text-[#1E293B]">
                  <Receipt className="w-5 h-5 sm:w-6 sm:h-6 text-[#2180B2]" />
                  <h3 className="font-bold text-base sm:text-lg">الحساب وإتمام الدفعية</h3>
               </div>

               <div className="space-y-4">
                  {/* نوع المعاملة / الفاتورة */}
                  <div className="space-y-1.5 mb-2">
                    <label className="text-xs font-bold text-[#475569] block">نوع الفاتورة أو المستند</label>
                    <div className="grid grid-cols-2 gap-2 p-1 bg-[#F1F5F9] rounded-xl border border-[#E2E8F0]">
                      <button
                        type="button"
                        onClick={() => {
                          setIsQuote(false);
                        }}
                        className={`py-2 px-2 sm:px-3 text-xs font-bold rounded-lg transition-all border-none cursor-pointer text-center truncate ${!isQuote ? 'bg-[#2180B2] text-white shadow-sm' : 'bg-transparent text-[#64748B] hover:text-[#334155]'}`}
                      >
                        فاتورة مبيعات
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsQuote(true);
                        }}
                        className={`py-2 px-2 sm:px-3 text-xs font-bold rounded-lg transition-all border-none cursor-pointer text-center truncate ${isQuote ? 'bg-[#D97706] text-white shadow-sm' : 'bg-transparent text-[#64748B] hover:text-[#334155]'}`}
                      >
                        عرض سعر
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs sm:text-sm font-bold text-[#475569] block">تاريخ الفاتورة</label>
                    <input type="date" required value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#2180B2] focus:outline-none bg-white font-mono" dir="ltr" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs sm:text-sm font-bold text-[#475569] block">اسم العميل</label>
                    {isQuote ? (
                      <input 
                        type="text"
                        placeholder="اكتب اسم العميل يدوياً..."
                        value={customerNameInput}
                        onChange={e => setCustomerNameInput(e.target.value)}
                        className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#D97706] focus:outline-none bg-white font-bold text-right"
                        required
                      />
                    ) : (
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 min-w-0">
                            {isCustomCustomer ? (
                              <input 
                                type="text"
                                placeholder="اكتب اسم العميل يدوياً..."
                                value={customerNameInput}
                                onChange={e => setCustomerNameInput(e.target.value)}
                                className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#2180B2] focus:outline-none bg-white font-bold text-right"
                                required
                              />
                            ) : (
                              <select 
                                value={selectedCustomerId}
                                onChange={e => {
                                  setSelectedCustomerId(e.target.value);
                                  const c = customers.find(c => c.id === e.target.value);
                                  if (c) {
                                    setCustomerNameInput(c.name);
                                    setCustomerPhoneInput(c.phone);
                                  } else {
                                    setCustomerNameInput('');
                                    setCustomerPhoneInput('');
                                  }
                                }}
                                className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#2180B2] focus:outline-none bg-white truncate"
                              >
                                <option key="default-empty-customer" value="">اختيار عميل مسجل...</option>
                                {customers.map((c, idx) => (
                                  <option key={c.id ? `customer-${c.id}-${idx}` : `customer-idx-${idx}`} value={c.id || ''}>
                                    {c.name || 'عميل بدون اسم'}
                                  </option>
                                ))}
                              </select>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setIsCustomCustomer(!isCustomCustomer);
                              setSelectedCustomerId('');
                              setCustomerNameInput('');
                              setCustomerPhoneInput('');
                            }}
                            className="shrink-0 px-3 py-2 bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg text-xs font-bold text-[#475569] hover:bg-[#E2E8F0] whitespace-nowrap cursor-pointer transition-colors"
                          >
                            {isCustomCustomer ? 'اختر مسجل' : 'كتابة يدوي'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-xs sm:text-sm font-bold text-[#475569]">رقم الهاتف (جوال)</label>
                    {isQuote || isCustomCustomer ? (
                      <input 
                        type="text" 
                        placeholder="مثال: 055xxxxxxx" 
                        value={customerPhoneInput} 
                        onChange={e => setCustomerPhoneInput(e.target.value)}
                        className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#2180B2] focus:outline-none bg-white font-mono" dir="ltr"
                      />
                    ) : (
                      <input 
                        type="text" placeholder="مثال: 055xxxxxxx" value={customerPhoneInput} readOnly
                        className="w-full border border-[#E2E8F0] rounded-lg px-4 py-2 text-sm bg-[#F8FAFC]" dir="ltr"
                      />
                    )}
                  </div>

                  <div className="pt-4 border-t border-[#E2E8F0]">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-[#475569]">المجموع الأولي:</span>
                      <span className="font-bold text-lg">{Number(subtotal || 0).toLocaleString()} <span className="text-sm text-[#94A3B8]">ج.م</span></span>
                    </div>

                    <div className="flex items-center justify-between mb-4 gap-2">
                       <span className="font-bold text-[#475569] text-sm shrink-0">تطبيق خصم:</span>
                       <div className="flex w-full max-w-[180px]">
                         <input 
                           type="number" min="0" value={discountValue} onChange={e => setDiscountValue(Number(e.target.value))}
                           className="w-full min-w-0 border border-l-0 border-[#E2E8F0] rounded-r-lg px-3 py-1 text-sm focus:outline-none"
                         />
                         <select 
                           value={discountType} onChange={e => setDiscountType(e.target.value as "percentage" | "fixed")}
                           className="border border-[#E2E8F0] rounded-l-lg px-2 py-1 text-xs sm:text-sm bg-[#F8FAFC] focus:outline-none shrink-0"
                         >
                           <option key="discount-percentage" value="percentage">% نسبة مئوية</option>
                           <option key="discount-fixed" value="fixed">مبلغ ثابت</option>
                         </select>
                       </div>
                    </div>

                    {discountAmount > 0 && (
                      <div className="flex justify-between items-center mb-2 px-3 py-1.5 text-[#DC2626] font-bold text-sm bg-[#FEF2F2] rounded-lg border border-[#FCA5A5]/30">
                        <span className="flex items-center gap-1.5">
                          <span>المبلغ المخصوم</span>
                          <span className="text-xs bg-[#FCA5A5]/40 text-[#B91C1C] px-1.5 py-0.5 rounded-md font-mono">
                            ({discountType === 'percentage' ? `${discountValue}%` : 'ثابت'})
                          </span>
                          :
                        </span>
                        <span className="font-mono" dir="ltr">-{Number(discountAmount || 0).toLocaleString()} ج.م</span>
                      </div>
                    )}

                    <div className="flex justify-between items-center mt-6 pt-4 border-t border-[#E2E8F0]">
                      <span className="font-bold text-[#1E293B] text-lg sm:text-xl">الإجمالي النهائي:</span>
                      <span className="font-bold text-xl sm:text-2xl text-[#2180B2]">{Number(finalTotal || 0).toLocaleString()} <span className="text-sm sm:text-base text-[#94A3B8]">ج.م</span></span>
                    </div>
                  </div>

                  {!isQuote ? (
                    <div className="pt-4 space-y-3">
                      <label className="text-xs sm:text-sm font-bold text-[#475569]">طريقة الدفع للفاتورة:</label>
                      <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                        <button type="button" onClick={() => setPaymentMethod('cash')} className={`py-2 px-1 rounded-lg font-bold text-xs sm:text-sm border-none cursor-pointer truncate ${paymentMethod === 'cash' ? 'bg-[#16A34A] text-white' : 'bg-[#F1F5F9] text-[#475569]'}`}>نقدي</button>
                        <button type="button" onClick={() => setPaymentMethod('deferred')} className={`py-2 px-1 rounded-lg font-bold text-xs sm:text-sm border-none cursor-pointer truncate ${paymentMethod === 'deferred' ? 'bg-[#DC2626] text-white' : 'bg-[#F1F5F9] text-[#475569]'}`}>آجل</button>
                        <button type="button" onClick={() => setPaymentMethod('partial')} className={`py-2 px-1 rounded-lg font-bold text-xs sm:text-sm border-none cursor-pointer truncate ${paymentMethod === 'partial' ? 'bg-[#D97706] text-white' : 'bg-[#F1F5F9] text-[#475569]'}`}>جزئي</button>
                      </div>

                      {paymentMethod === 'partial' && (
                        <div className="mt-2">
                          <label className="text-xs font-bold text-[#475569] block mb-1">المبلغ المدفوع (المحصل الآن)</label>
                          <input 
                             type="number" min="0" max={finalTotal} required
                             value={paidAmount} onChange={e => setPaidAmount(Number(e.target.value))}
                             className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#2180B2] focus:outline-none"
                           />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="pt-4 px-4 py-3 bg-[#FFFDF5] text-[#D97706] border border-[#FDE68A] rounded-xl text-xs font-semibold leading-relaxed">
                      <strong>تنبيه عرض السعر:</strong> لن يتم خصم السلع من المخزون، ولن يتم تسجيل أي ديون أو معاملات مالية باسم العميل. هذا المستند مخصص كعرض سعر ورقي فقط.
                    </div>
                  )}

                  <div className="pt-4">
                     <button type="submit" className={`w-full py-3.5 sm:py-4 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer border-none shadow-md ${isQuote ? 'bg-[#D97706] hover:bg-[#B45309]' : 'bg-[#2180B2] hover:bg-[#1A6B94]'}`}>
                       <Save className="w-5 h-5" />
                       {isQuote ? (editingInvoiceId ? 'حفظ عرض السعر المعدّل' : 'إصدار عرض السعر وتأكيد') : (editingInvoiceId ? 'حفظ التعديلات' : 'إصدار الفاتورة وتأكيد')}
                     </button>
                  </div>
               </div>
            </div>

            {/* Right Column: Items (On mobile appears first so user easily picks items) */}
            <div className="lg:col-span-2 space-y-6 order-1 lg:order-2">
               
               {/* Search Box */}
               <div className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-4 sm:mb-6">
                    <h3 className="font-bold text-base sm:text-lg text-[#1E293B]">إضافة السلع بالاسم أو الباركود</h3>
                    <div className="flex flex-wrap items-center gap-2">
                       <button
                         type="button"
                         onClick={() => setShowDetailsAndPrices(!showDetailsAndPrices)}
                         className={`px-2.5 sm:px-3 py-1.5 rounded-lg border text-xs sm:text-sm font-bold cursor-pointer transition-colors ${showDetailsAndPrices ? 'bg-[#F1F5F9] text-[#475569] border-[#E2E8F0]' : 'bg-white text-[#94A3B8] border-[#E2E8F0]'}`}
                       >
                         عرض التفاصيل والأسعار
                       </button>
                       <button
                         type="button"
                         onClick={() => setAutoScannerActive(!autoScannerActive)}
                         className={`px-2.5 sm:px-3 py-1.5 rounded-lg border text-xs sm:text-sm font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${autoScannerActive ? 'bg-[#F0FDF4] text-[#16A34A] border-[#BBF7D0]' : 'bg-white text-[#94A3B8] border-[#E2E8F0]'}`}
                       >
                         <span className={`w-2 h-2 rounded-full ${autoScannerActive ? 'bg-[#16A34A]' : 'bg-[#94A3B8]'}`}></span>
                         <span>القارئ الآلي {autoScannerActive ? 'نشط' : ''}</span>
                       </button>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                     <button
                       type="button"
                       onClick={() => searchInputRef.current?.focus()}
                       className="shrink-0 px-3.5 sm:px-4 py-2.5 sm:py-3 bg-[#16A34A] text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 cursor-pointer border-none hover:bg-[#15803D] transition-colors"
                     >
                       <Barcode className="w-4 h-4 sm:w-5 sm:h-5" />
                       <span>توجيه قارئ الباركود</span>
                     </button>
                     <div className="relative flex-1">
                       <div className="absolute inset-y-0 right-3 flex items-center pr-1 pointer-events-none text-[#94A3B8]">
                         <Search className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
                       </div>
                       <input
                         ref={searchInputRef}
                         type="text"
                         value={itemSearchText}
                         onChange={(e) => setItemSearchText(e.target.value)}
                         className="block w-full border border-[#E2E8F0] rounded-xl pr-10 sm:pr-12 pl-4 py-2.5 sm:py-3 text-xs sm:text-sm focus:ring-2 focus:ring-[#2180B2] focus:outline-none placeholder:text-xs sm:placeholder:text-sm"
                         placeholder="ابحث بمسح الباركود، أدخل الرقم أو اسم القطعة..."
                       />
                       
                       {/* Search Results Dropdown */}
                       {itemSearchText && searchResults.length > 0 && (
                         <div className="absolute top-full right-0 left-0 mt-2 bg-white rounded-xl shadow-xl border border-[#E2E8F0] z-20 max-h-60 overflow-y-auto">
                           {searchResults.map(item => (
                             <button
                               key={item.id} type="button"
                               onClick={() => handleAddItem(item.id)}
                               className="w-full text-right px-4 py-3 border-b border-[#E2E8F0] last:border-0 hover:bg-[#F8FAFC] flex justify-between items-center cursor-pointer bg-transparent"
                             >
                               <div>
                                 <p className="font-bold text-[#1E293B]">{item.name}</p>
                                 {showDetailsAndPrices && <p className="text-xs text-[#94A3B8]">كود: {item.code} | متاح: {item.quantity}</p>}
                               </div>
                               {showDetailsAndPrices && <span className="font-bold text-[#2180B2]">{Number(item.sellPrice || 0).toLocaleString()} ج.م</span>}
                             </button>
                           ))}
                         </div>
                       )}
                       {itemSearchText && searchResults.length === 0 && (
                         <div className="absolute top-full right-0 left-0 mt-2 bg-white rounded-xl shadow-xl border border-[#E2E8F0] z-20 p-4 text-center text-[#94A3B8]">
                           لا توجد نتائج مطابقة
                         </div>
                       )}
                     </div>
                  </div>
               </div>

               {/* Invoice Items List */}
               <div className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-4 sm:p-6 min-h-[300px] sm:min-h-[400px]">
                 <h3 className="font-bold text-base sm:text-lg text-[#1E293B] mb-4 sm:mb-6 border-b border-[#E2E8F0] pb-3 sm:pb-4">مكونات الفاتورة الحالية</h3>
                 
                 {invoiceItems.length === 0 ? (
                   <div className="flex flex-col items-center justify-center h-48 sm:h-64 text-[#94A3B8]">
                     <Receipt className="w-12 h-12 sm:w-16 sm:h-16 mb-3 sm:mb-4 opacity-20" />
                     <p className="font-bold text-xs sm:text-sm text-center">الفاتورة فارغة حالياً. ابحث عن منتج بالمنشور أعلاه وأضفه.</p>
                   </div>
                 ) : (
                   <div className="overflow-x-auto">
                     <table className="w-full text-right text-xs sm:text-sm">
                        <thead className="bg-[#F8FAFC] text-[#475569]">
                          <tr>
                            <th className="py-2.5 px-3 sm:py-3 sm:px-4 font-bold">اسم المنتج / الصنف</th>
                            {showDetailsAndPrices && <th className="py-2.5 px-2 sm:py-3 sm:px-4 font-bold w-24 sm:w-32">السعر (ج.م)</th>}
                            <th className="py-2.5 px-2 sm:py-3 sm:px-4 font-bold w-20 sm:w-32">الكمية</th>
                            {showDetailsAndPrices && <th className="py-2.5 px-2 sm:py-3 sm:px-4 font-bold w-24 sm:w-32">الإجمالي (ج.م)</th>}
                            <th className="py-2.5 px-2 sm:py-3 sm:px-4 w-12 sm:w-16"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E2E8F0]">
                          {invoiceItems.map((item, idx) => {
                            const invItem = getInventoryItem(item.inventoryId);
                            if (!invItem) return null;
                            const qtyTotal = item.price * item.qty;
                            return (
                              <tr key={`invoice-item-${idx}`} className="hover:bg-[#F8FAFC] transition-colors">
                                <td className="py-3 px-4">
                                  <p className="font-bold text-[#1E293B]">{invItem.name}</p>
                                  {showDetailsAndPrices && <p className="text-xs text-[#94A3B8]">كود: {invItem.code}</p>}
                                </td>
                                {showDetailsAndPrices && (
                                  <td className="py-3 px-4">
                                    <input 
                                      type="number" min="0" required
                                      value={item.price}
                                      onChange={e => {
                                        const val = Number(e.target.value);
                                        if (val >= 0) {
                                          const newItems = [...invoiceItems];
                                          newItems[idx].price = val;
                                          setInvoiceItems(newItems);
                                        }
                                      }}
                                      className="w-24 border border-[#E2E8F0] rounded-lg px-2 py-1 text-center font-bold focus:ring-2 focus:ring-[#2180B2] focus:outline-none"
                                    />
                                  </td>
                                )}
                                <td className="py-3 px-4">
                                  <input 
                                    type="number" min="1" required
                                    value={item.qty}
                                    onChange={e => {
                                      const val = Number(e.target.value);
                                      if (val > 0) {
                                        const newItems = [...invoiceItems];
                                        newItems[idx].qty = val;
                                        setInvoiceItems(newItems);
                                      }
                                    }}
                                    className="w-20 border border-[#E2E8F0] rounded-lg px-2 py-1 text-center font-bold focus:ring-2 focus:ring-[#2180B2] focus:outline-none"
                                  />
                                </td>
                                {showDetailsAndPrices && <td className="py-3 px-4 font-bold text-[#2180B2]">{Number(qtyTotal || 0).toLocaleString()}</td>}
                                <td className="py-3 px-4 text-center">
                                  <button
                                    type="button" 
                                    onClick={() => {
                                      const newItems = [...invoiceItems];
                                      newItems.splice(idx, 1);
                                      setInvoiceItems(newItems);
                                    }}
                                    className="p-2 text-[#DC2626] hover:bg-[#FEF2F2] rounded-lg transition-colors cursor-pointer border-none bg-transparent"
                                  >
                                    <Trash2 className="w-5 h-5" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </form>
          )}

        {/* List View */}
        {viewMode === 'list' && (
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm flex flex-col">
            <div className="p-5 border-b border-[#E2E8F0] flex flex-col sm:flex-row gap-4 justify-between items-center">
              <div className="relative w-full sm:max-w-md">
                <div className="absolute inset-y-0 right-3 flex items-center pr-1 pointer-events-none text-[#94A3B8]">
                  <Search className="h-4 w-4" aria-hidden="true" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full bg-[#F1F5F9] border-none rounded-lg pr-10 pl-4 py-2 text-sm focus:ring-2 focus:ring-[#2180B2] focus:outline-none"
                  placeholder="بحث برقم الفاتورة أو العميل..."
                />
              </div>
            </div>

            {/* Mobile View: Invoice Cards */}
            <div className="block md:hidden px-3 py-3 space-y-3">
              {filteredInvoices.length === 0 ? (
                <div className="text-center py-8 text-[#94A3B8]">
                  لا توجد فواتير سابقة مسجلة
                </div>
              ) : (
                filteredInvoices.map((inv, idx) => {
                  const customer = customers.find(c => c.id === inv.customerId);
                  const isFullyPaid = inv.paid >= inv.total;
                  const customerName = inv.isQuote && inv.customCustomerName ? inv.customCustomerName : (customer?.name || 'عميل نقدي');
                  const remaining = Math.max(0, inv.total - inv.paid);

                  return (
                    <div 
                      key={inv.id ? `invoice-${inv.id}` : `invoice-idx-${idx}`}
                      className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3.5 space-y-3 shadow-xs"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono font-black text-sm text-[#2180B2] bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                              #{inv.invoiceNumber}
                            </span>
                            {inv.isQuote ? (
                              <span className="text-[11px] bg-[#FEF3C7] text-[#D97706] px-2 py-0.5 rounded-md font-bold border border-[#FDE68A]">
                                عرض سعر
                              </span>
                            ) : isFullyPaid ? (
                              <span className="text-[11px] bg-[#F0FDF4] text-[#16A34A] px-2 py-0.5 rounded-md font-bold border border-[#BBF7D0]">
                                مدفوعة بالكامل
                              </span>
                            ) : inv.paid > 0 ? (
                              <span className="text-[11px] bg-[#FFFBEB] text-[#D97706] px-2 py-0.5 rounded-md font-bold border border-[#FDE68A]">
                                مدفوعة جزئياً
                              </span>
                            ) : (
                              <span className="text-[11px] bg-[#FEF2F2] text-[#DC2626] px-2 py-0.5 rounded-md font-bold border border-[#FECACA]">
                                آجل بالكامل
                              </span>
                            )}
                          </div>
                          <h4 className="font-bold text-[#1E293B] text-base mt-1">
                            {customerName}
                          </h4>
                          <p className="text-xs text-[#64748B] mt-0.5 font-mono">
                            {new Date(inv.date).toLocaleDateString('ar-EG')}
                          </p>
                        </div>

                        <div className="text-left">
                          <span className="block text-[10px] text-slate-500 font-medium">الإجمالي</span>
                          <span className="font-black text-base text-[#1E293B] font-mono">
                            {Number(inv.total || 0).toLocaleString()} <span className="text-[11px] font-normal">ج.م</span>
                          </span>
                        </div>
                      </div>

                      {/* Payment summary grid */}
                      {!inv.isQuote && (
                        <div className="grid grid-cols-2 gap-2 bg-white p-2 rounded-lg border border-[#E2E8F0] text-xs">
                          <div>
                            <span className="text-[#94A3B8] block text-[10px]">المدفوع:</span>
                            <span className="font-bold text-[#16A34A] font-mono">{Number(inv.paid || 0).toLocaleString()} ج.م</span>
                          </div>
                          <div className="text-left">
                            <span className="text-[#94A3B8] block text-[10px]">المتبقي:</span>
                            <span className={`font-bold font-mono ${remaining > 0 ? 'text-[#DC2626]' : 'text-slate-600'}`}>
                              {Number(remaining || 0).toLocaleString()} ج.م
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center justify-between pt-1 border-t border-[#E2E8F0]/70">
                        <button 
                          type="button"
                          onClick={() => setPrintingInvoiceId(inv.id)}
                          className="px-3 py-1.5 bg-[#2180B2] text-white rounded-lg text-xs font-bold hover:bg-[#1A6B94] flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>معاينة وطباعة</span>
                        </button>

                        <div className="flex items-center gap-1.5">
                          <button 
                            onClick={() => handleEditClick(inv.id)}
                            className="p-1.5 text-[#475569] bg-white border border-[#E2E8F0] rounded-lg hover:text-[#10B981] hover:border-[#10B981] transition-colors cursor-pointer"
                            title="تعديل"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteClick(inv.id)}
                            className="p-1.5 text-[#DC2626] bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors cursor-pointer"
                            title="حذف"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Desktop View: Full Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-right">
                <thead className="bg-[#F7FAFC] text-xs font-bold text-[#475569] uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">رقم الفاتورة</th>
                    <th className="px-6 py-4">التاريخ</th>
                    <th className="px-6 py-4">العميل</th>
                    <th className="px-6 py-4">الإجمالي (ج.م)</th>
                    <th className="px-6 py-4">المدفوع (ج.م)</th>
                    <th className="px-6 py-4">الحالة</th>
                    <th className="px-6 py-4 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0] text-sm">
                  {filteredInvoices.length === 0 ? (
                    <tr>
                       <td colSpan={7} className="px-6 py-8 text-center text-[#94A3B8]">لا توجد فواتير سابقة مسجلة</td>
                    </tr>
                  ) : (
                    filteredInvoices.map((inv, idx) => {
                      const customer = customers.find(c => c.id === inv.customerId);
                      const isFullyPaid = inv.paid >= inv.total;
                      const customerName = inv.isQuote && inv.customCustomerName ? inv.customCustomerName : (customer?.name || 'عميل نقدي');
                      return (
                        <tr key={inv.id ? `invoice-${inv.id}` : `invoice-idx-${idx}`} className="hover:bg-[#F8FAFC]">
                          <td className="px-6 py-4 font-mono font-bold text-[#2180B2]">{inv.invoiceNumber}</td>
                          <td className="px-6 py-4 text-[#475569]">{new Date(inv.date).toLocaleDateString()}</td>
                          <td className="px-6 py-4 font-bold text-[#1E293B]">
                            {customerName}
                            {inv.isQuote && <span className="mr-2 text-[10px] bg-[#FEF3C7] text-[#D97706] px-1.5 py-0.5 rounded font-bold">عرض سعر</span>}
                          </td>
                          <td className="px-6 py-4 font-bold">{Number(inv.total || 0).toLocaleString()}</td>
                          <td className="px-6 py-4 text-[#16A34A]">{inv.isQuote ? '---' : Number(inv.paid || 0).toLocaleString()}</td>
                          <td className="px-6 py-4">
                            {inv.isQuote ? (
                              <span className="px-2 py-1 rounded-md text-[11px] font-bold bg-[#FFFBEB] text-[#D97706] whitespace-nowrap border border-[#FDE68A]">عرض سعر معتمد</span>
                            ) : (
                              <>
                                {isFullyPaid && <span className="px-2 py-1 rounded-md text-[11px] font-bold bg-[#F0FDF4] text-[#16A34A] whitespace-nowrap">مدفوعة بالكامل</span>}
                                {(!isFullyPaid && inv.paid > 0) && <span className="px-2 py-1 rounded-md text-[11px] font-bold bg-[#FFFBEB] text-[#D97706] whitespace-nowrap">مدفوعة جزئياً</span>}
                                {inv.paid === 0 && <span className="px-2 py-1 rounded-md text-[11px] font-bold bg-[#FEF2F2] text-[#DC2626] whitespace-nowrap">آجل بالكامل</span>}
                              </>
                            )}
                          </td>
                          <td className="px-6 py-4 flex items-center justify-center gap-2">
                            <button 
                              type="button"
                              onClick={() => {
                                setPrintingInvoiceId(inv.id);
                              }}
                              className="p-1.5 text-[#475569] bg-white border border-[#E2E8F0] rounded-md hover:text-[#2180B2] hover:border-[#2180B2] transition-colors cursor-pointer"
                              title="طباعة ومعاينة الفاتورة"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleEditClick(inv.id)}
                              className="p-1.5 text-[#475569] bg-white border border-[#E2E8F0] rounded-md hover:text-[#10B981] hover:border-[#10B981] transition-colors cursor-pointer"
                              title="تعديل"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteClick(inv.id)}
                              className="p-1.5 text-[#475569] bg-white border border-[#E2E8F0] rounded-md hover:text-[#DC2626] hover:border-[#DC2626] transition-colors cursor-pointer"
                              title="حذف"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        <ConfirmDeleteModal
          isOpen={!!invoiceToDelete}
          onClose={() => !isDeleting && setInvoiceToDelete(null)}
          onConfirm={confirmDelete}
          isDeleting={isDeleting}
          title={targetInvoiceToDelete?.isQuote ? "تأكيد حذف عرض السعر" : "تأكيد حذف الفاتورة"}
          message={
            targetInvoiceToDelete?.isQuote
              ? "هل أنت متأكد من رغبتك في حذف عرض السعر هذا نهائياً؟"
              : "هل أنت متأكد من رغبتك في حذف هذه الفاتورة نهائياً من النظام؟"
          }
          itemName={targetInvoiceToDelete ? `رقم: ${targetInvoiceToDelete.invoiceNumber}` : undefined}
          itemDetails={
            targetInvoiceToDelete ? (
              <div className="grid grid-cols-2 gap-2 mt-1 text-xs">
                <div>النوع: {targetInvoiceToDelete.isQuote ? 'عرض سعر' : 'فاتورة بيع'}</div>
                <div>الإجمالي: {Number(targetInvoiceToDelete.total || 0).toLocaleString()} ج.م</div>
                <div>المدفوع: {Number(targetInvoiceToDelete.paid || 0).toLocaleString()} ج.م</div>
                <div>عدد الأصناف: {targetInvoiceToDelete.items?.length || 0}</div>
              </div>
            ) : undefined
          }
          warningNote={
            targetInvoiceToDelete?.isQuote
              ? "تنبيه: سيتم مسح عرض السعر نهائياً من قائمة الفواتير والعروض."
              : "تنبيه: سيتم مسح الفاتورة نهائياً، واسترجاع كميات الأصناف المباعة إلى رصيد المخزن تلقائياً، وتحديث كشف حساب العميل."
          }
          confirmText={targetInvoiceToDelete?.isQuote ? "نعم، حذف عرض السعر" : "نعم، حذف الفاتورة"}
        />

      </div>
    </>
  );
}
