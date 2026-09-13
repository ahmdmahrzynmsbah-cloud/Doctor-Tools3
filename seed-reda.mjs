import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import crypto from 'crypto';

const firebaseConfig = {
  projectId: "pos1-d562e",
  appId: "1:607061495520:web:86e73b21063ba9c494ca85",
  apiKey: "AIzaSyCmeCCutt5Q9NLuILm8i_XtM1QCSV4_aUo",
  authDomain: "pos1-d562e.firebaseapp.com",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, "ai-studio-remixremixdoctor-f0577ee1-2a87-41e0-87d5-9d60e34ff5bd");
const uid = 'main_store';

function createInvoice(customerId, customerName, date, amount, items, isInitial = false, type = "invoice", invoiceNumber = null) {
  const id = crypto.randomUUID();
  const invNumber = invoiceNumber || (type === "payment" ? "PAY-" + Math.floor(Math.random() * 10000) : (isInitial ? "INIT-" : "INV-") + Math.floor(Math.random() * 10000));
  const invoice = {
    id,
    invoiceNumber: invNumber,
    date: new Date(date).toISOString(),
    customerId,
    items,
    total: type === "payment" ? 0 : amount,
    paid: type === "payment" ? amount : 0,
    ownerId: uid,
    createdAt: new Date(date).getTime(),
    updatedAt: new Date(date).getTime()
  };
  return invoice;
}

async function seed() {
  const customerId = crypto.randomUUID();
  const customer = {
    id: customerId,
    serialNumber: 'CUST-' + Math.floor(Math.random() * 100000),
    name: 'محمد رضا الشرقاوي',
    phone: '01151196562',
    balance: 154900,
    ownerId: uid,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  await setDoc(doc(db, 'users', uid, 'customers', customerId), customer);
  console.log("Created customer:", customer.name);

  const transactions = [
    createInvoice(customerId, customer.name, "2026-06-18T10:00:00Z", 71225, [{ id: "temp", name: "رصيد مرحل (افتتاحي)", quantity: 1, sellPrice: 71225, total: 71225 }], true, "invoice"),
    createInvoice(customerId, customer.name, "2026-06-25T12:00:00Z", 4000, [], false, "payment"),
    createInvoice(customerId, customer.name, "2026-07-09T12:00:00Z", 8000, [], false, "payment"),
    
    // 2026-07-26 SA-QT-1002 (166825 total, 60000 paid)
    {
      id: crypto.randomUUID(),
      invoiceNumber: "SA-QT-1002",
      date: new Date("2026-07-26T10:00:00Z").toISOString(),
      customerId,
      items: [
         { id: crypto.randomUUID(), name: "كوريك 2 عمود وصله سفلي 4طن", quantity: 1, sellPrice: 40000, total: 40000 },
         { id: crypto.randomUUID(), name: "جهاز كشف بالدخان 2D + كاميره Endoscope", quantity: 1, sellPrice: 15000, total: 15000 },
         { id: crypto.randomUUID(), name: "باقي المعدات (زرجينة، دريل، مسدسات، طقم لقم)", quantity: 1, sellPrice: 111825, total: 111825 }
      ],
      total: 166825,
      paid: 60000,
      ownerId: uid,
      createdAt: new Date("2026-07-26T10:00:00Z").getTime(),
      updatedAt: new Date("2026-07-26T10:00:00Z").getTime()
    },
    
    // 2026-07-31 SA-INV-1206 (3350 total)
    {
      id: crypto.randomUUID(),
      invoiceNumber: "SA-INV-1206",
      date: new Date("2026-07-31T10:00:00Z").toISOString(),
      customerId,
      items: [
         { id: crypto.randomUUID(), name: "طقم حمايه جلد 3قطع", quantity: 2, sellPrice: 1000, total: 2000 },
         { id: crypto.randomUUID(), name: "شاكوش 1 كيلو", quantity: 1, sellPrice: 1350, total: 1350 }
      ],
      total: 3350,
      paid: 0,
      ownerId: uid,
      createdAt: new Date("2026-07-31T10:00:00Z").getTime(),
      updatedAt: new Date("2026-07-31T10:00:00Z").getTime()
    },

    // 2026-08-26 SA-INV-1332 (5500 total)
    {
      id: crypto.randomUUID(),
      invoiceNumber: "SA-INV-1332",
      date: new Date("2026-08-26T10:00:00Z").toISOString(),
      customerId,
      items: [
         { id: crypto.randomUUID(), name: "جهاز اختبار دهان Uni-t", quantity: 1, sellPrice: 5500, total: 5500 }
      ],
      total: 5500,
      paid: 0,
      ownerId: uid,
      createdAt: new Date("2026-08-26T10:00:00Z").getTime(),
      updatedAt: new Date("2026-08-26T10:00:00Z").getTime()
    },
    
    createInvoice(customerId, customer.name, "2026-08-26T12:00:00Z", 20000, [], false, "payment")
  ];

  for (const t of transactions) {
    await setDoc(doc(db, 'users', uid, 'invoices', t.id), t);
    console.log("Inserted transaction on", t.date, "total:", t.total, "paid:", t.paid);
  }

  console.log("All done!");
}

seed().then(() => process.exit(0)).catch(console.error);
