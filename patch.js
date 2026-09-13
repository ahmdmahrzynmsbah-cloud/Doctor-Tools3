const fs = require('fs');
let content = fs.readFileSync('src/pages/Invoices.tsx', 'utf8');

const target = `                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs sm:text-sm font-bold text-[#475569] block">اسم العميل</label>`;

const replacement = `                    </div>
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-xs sm:text-sm font-bold text-[#475569] block">تاريخ الفاتورة</label>
                    <input 
                      type="date"
                      required
                      value={invoiceDate}
                      onChange={e => setInvoiceDate(e.target.value)}
                      className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#2180B2] focus:outline-none bg-white font-mono text-left"
                      dir="ltr"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs sm:text-sm font-bold text-[#475569] block">اسم العميل</label>`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync('src/pages/Invoices.tsx', content);
  console.log('Patched');
} else {
  console.log('Target not found');
}
