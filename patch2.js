const fs = require('fs');
let content = fs.readFileSync('src/pages/Invoices.tsx', 'utf8');

content = content.replace(/subtotal\.toLocaleString\(\)/g, 'Number(subtotal || 0).toLocaleString()');
content = content.replace(/discountAmount\.toLocaleString\(\)/g, 'Number(discountAmount || 0).toLocaleString()');
content = content.replace(/finalTotal\.toLocaleString\(\)/g, 'Number(finalTotal || 0).toLocaleString()');
content = content.replace(/item\.sellPrice\.toLocaleString\(\)/g, 'Number(item.sellPrice || 0).toLocaleString()');
content = content.replace(/qtyTotal\.toLocaleString\(\)/g, 'Number(qtyTotal || 0).toLocaleString()');
content = content.replace(/inv\.total\.toLocaleString\(\)/g, 'Number(inv.total || 0).toLocaleString()');
content = content.replace(/inv\.paid\.toLocaleString\(\)/g, 'Number(inv.paid || 0).toLocaleString()');
content = content.replace(/remaining\.toLocaleString\(\)/g, 'Number(remaining || 0).toLocaleString()');
content = content.replace(/targetInvoiceToDelete\.total\.toLocaleString\(\)/g, 'Number(targetInvoiceToDelete.total || 0).toLocaleString()');
content = content.replace(/targetInvoiceToDelete\.paid\.toLocaleString\(\)/g, 'Number(targetInvoiceToDelete.paid || 0).toLocaleString()');

fs.writeFileSync('src/pages/Invoices.tsx', content);
console.log('Patched Invoices');
