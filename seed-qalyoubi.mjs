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
    name: 'وليد القليوبي',
    phone: '',
    balance: 7350,
    ownerId: uid,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  await setDoc(doc(db, 'users', uid, 'customers', customerId), customer);
  console.log("Created customer:", customer.name);

  const transactions = [
    // 2026-08-04 SA-INV-1236 (14000 total, 3000 paid)
    {
      id: crypto.randomUUID(),
      invoiceNumber: "SA-INV-1236",
      date: new Date("2026-08-04T10:00:00Z").toISOString(),
      customerId,
      items: [
         { id: crypto.randomUUID(), name: "زرجينه سوست BM هيدروليك + حامل ماتور مسطره", quantity: 1, sellPrice: 14000, total: 14000 }
      ],
      total: 14000,
      paid: 3000,
      ownerId: uid,
      createdAt: new Date("2026-08-04T10:00:00Z").getTime(),
      updatedAt: new Date("2026-08-04T10:00:00Z").getTime()
    },

    createInvoice(customerId, customer.name, "2026-08-08T12:00:00Z", 1000, [], false, "payment"),

    // 2026-08-16 SA-INV-1281 (950 total)
    {
      id: crypto.randomUUID(),
      invoiceNumber: "SA-INV-1281",
      date: new Date("2026-08-16T10:00:00Z").toISOString(),
      customerId,
      items: [
         { id: crypto.randomUUID(), name: "خرطوم 15 م*12 م سوسته", quantity: 1, sellPrice: 950, total: 950 }
      ],
      total: 950,
      paid: 0,
      ownerId: uid,
      createdAt: new Date("2026-08-16T10:00:00Z").getTime(),
      updatedAt: new Date("2026-08-16T10:00:00Z").getTime()
    },

    createInvoice(customerId, customer.name, "2026-08-16T14:00:00Z", 2000, [], false, "payment"),

    // 2026-08-26 SA-INV-1352 (650 total)
    {
      id: crypto.randomUUID(),
      invoiceNumber: "SA-INV-1352",
      date: new Date("2026-08-26T10:00:00Z").toISOString(),
      customerId,
      items: [
         { id: crypto.randomUUID(), name: "مغناطيس تقيل A-1", quantity: 1, sellPrice: 650, total: 650 }
      ],
      total: 650,
      paid: 0,
      ownerId: uid,
      createdAt: new Date("2026-08-26T10:00:00Z").getTime(),
      updatedAt: new Date("2026-08-26T10:00:00Z").getTime()
    },

    createInvoice(customerId, customer.name, "2026-08-26T14:00:00Z", 1000, [], false, "payment"),

    // 2026-09-04 SA-INV-1366 (2850 total)
    {
      id: crypto.randomUUID(),
      invoiceNumber: "SA-INV-1366",
      date: new Date("2026-09-04T10:00:00Z").toISOString(),
      customerId,
      items: [
         { id: crypto.randomUUID(), name: "لقمه فلتر 16\\86 + طقم pump سمكري + لقمه ستترك دينامو", quantity: 1, sellPrice: 2850, total: 2850 }
      ],
      total: 2850,
      paid: 0,
      ownerId: uid,
      createdAt: new Date("2026-09-04T10:00:00Z").getTime(),
      updatedAt: new Date("2026-09-04T10:00:00Z").getTime()
    },

    createInvoice(customerId, customer.name, "2026-09-04T14:00:00Z", 4000, [], false, "payment"),
    createInvoice(customerId, customer.name, "2026-09-10T12:00:00Z", 1000, [], false, "payment"),

    // 2026-09-12 SA-INV-1418 (900 total)
    {
      id: crypto.randomUUID(),
      invoiceNumber: "SA-INV-1418",
      date: new Date("2026-09-12T10:00:00Z").toISOString(),
      customerId,
      items: [
         { id: crypto.randomUUID(), name: "لقمه وش سلندر 12 E", quantity: 1, sellPrice: 900, total: 900 }
      ],
      total: 900,
      paid: 0,
      ownerId: uid,
      createdAt: new Date("2026-09-12T10:00:00Z").getTime(),
      updatedAt: new Date("2026-09-12T10:00:00Z").getTime()
    },
  ];

  for (const t of transactions) {
    await setDoc(doc(db, 'users', uid, 'invoices', t.id), t);
    console.log("Inserted transaction on", t.date, "total:", t.total, "paid:", t.paid);
  }

  console.log("All done!");
}

seed().then(() => process.exit(0)).catch(console.error);
