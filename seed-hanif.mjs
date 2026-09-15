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
    name: 'احمد حنيف',
    phone: '01114111133',
    balance: 34525,
    ownerId: uid,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  await setDoc(doc(db, 'users', uid, 'customers', customerId), customer);
  console.log("Created customer:", customer.name);

  const transactions = [
    createInvoice(customerId, customer.name, "2026-06-18T10:00:00Z", 24500, [{ id: "temp", name: "رصيد مرحل (افتتاحي)", quantity: 1, sellPrice: 24500, total: 24500 }], true, "invoice"),
    createInvoice(customerId, customer.name, "2026-06-27T12:00:00Z", 2000, [], false, "payment"),
    
    // 2026-07-04 SA-INV-1072 (1000 total)
    {
      id: crypto.randomUUID(),
      invoiceNumber: "SA-INV-1072",
      date: new Date("2026-07-04T10:00:00Z").toISOString(),
      customerId,
      items: [
         { id: crypto.randomUUID(), name: "يد سيستم 1/2 بوصه APT", quantity: 2, sellPrice: 500, total: 1000 }
      ],
      total: 1000,
      paid: 0,
      ownerId: uid,
      createdAt: new Date("2026-07-04T10:00:00Z").getTime(),
      updatedAt: new Date("2026-07-04T10:00:00Z").getTime()
    },
    
    createInvoice(customerId, customer.name, "2026-07-04T12:00:00Z", 2000, [], false, "payment"),
    
    // 2026-07-12 SA-INV-1120 (1950 total)
    {
      id: crypto.randomUUID(),
      invoiceNumber: "SA-INV-1120",
      date: new Date("2026-07-12T10:00:00Z").toISOString(),
      customerId,
      items: [
         { id: crypto.randomUUID(), name: "مفك ظبط الماني (2) + مسدسات هواء وغسيل + زرجينه بلي + مغناطيس لاقط", quantity: 1, sellPrice: 1950, total: 1950 }
      ],
      total: 1950,
      paid: 0,
      ownerId: uid,
      createdAt: new Date("2026-07-12T10:00:00Z").getTime(),
      updatedAt: new Date("2026-07-12T10:00:00Z").getTime()
    },
    
    createInvoice(customerId, customer.name, "2026-07-12T12:00:00Z", 2000, [], false, "payment"),
    createInvoice(customerId, customer.name, "2026-07-30T12:00:00Z", 2000, [], false, "payment"),
    createInvoice(customerId, customer.name, "2026-08-04T12:00:00Z", 2000, [], false, "payment"),
    
    // 2026-08-13 SA-INV-1249 (4825 total)
    {
      id: crypto.randomUUID(),
      invoiceNumber: "SA-INV-1249",
      date: new Date("2026-08-13T10:00:00Z").toISOString(),
      customerId,
      items: [
         { id: crypto.randomUUID(), name: "طقم لقم مشرشر 94قطعه", quantity: 1, sellPrice: 4000, total: 4000 },
         { id: crypto.randomUUID(), name: "لقمه 16 سودا طويله", quantity: 1, sellPrice: 425, total: 425 },
         { id: crypto.randomUUID(), name: "لقمه 16 طويله بيضا", quantity: 1, sellPrice: 400, total: 400 }
      ],
      total: 4825,
      paid: 0,
      ownerId: uid,
      createdAt: new Date("2026-08-13T10:00:00Z").getTime(),
      updatedAt: new Date("2026-08-13T10:00:00Z").getTime()
    },
    
    createInvoice(customerId, customer.name, "2026-08-13T12:00:00Z", 2000, [], false, "payment"),
    createInvoice(customerId, customer.name, "2026-08-16T12:00:00Z", 2000, [], false, "payment"),
    
    // 2026-09-04 SA-INV-1364 (15950 total)
    {
      id: crypto.randomUUID(),
      invoiceNumber: "SA-INV-1364",
      date: new Date("2026-09-04T10:00:00Z").toISOString(),
      customerId,
      items: [
         { id: crypto.randomUUID(), name: "دريل هواء 1300N", quantity: 1, sellPrice: 7000, total: 7000 },
         { id: crypto.randomUUID(), name: "دريل بطاريه APT 2A 500N", quantity: 1, sellPrice: 5000, total: 5000 },
         { id: crypto.randomUUID(), name: "لقم ومفكات ومفاتيح وبنس وصيانه دريلات", quantity: 1, sellPrice: 3950, total: 3950 }
      ],
      total: 15950,
      paid: 0,
      ownerId: uid,
      createdAt: new Date("2026-09-04T10:00:00Z").getTime(),
      updatedAt: new Date("2026-09-04T10:00:00Z").getTime()
    },
    
    // 2026-09-10 SA-INV-1393 (2300 total)
    {
      id: crypto.randomUUID(),
      invoiceNumber: "SA-INV-1393",
      date: new Date("2026-09-10T10:00:00Z").toISOString(),
      customerId,
      items: [
         { id: crypto.randomUUID(), name: "فلتر 2 كوابيه هواء + زيت", quantity: 1, sellPrice: 1500, total: 1500 },
         { id: crypto.randomUUID(), name: "جيركن زيت دريل", quantity: 1, sellPrice: 500, total: 500 },
         { id: crypto.randomUUID(), name: "فلتر مزيته دريل", quantity: 5, sellPrice: 60, total: 300 }
      ],
      total: 2300,
      paid: 0,
      ownerId: uid,
      createdAt: new Date("2026-09-10T10:00:00Z").getTime(),
      updatedAt: new Date("2026-09-10T10:00:00Z").getTime()
    },
    
    createInvoice(customerId, customer.name, "2026-09-10T12:00:00Z", 2000, [], false, "payment")
  ];

  for (const t of transactions) {
    await setDoc(doc(db, 'users', uid, 'invoices', t.id), t);
    console.log("Inserted transaction on", t.date, "total:", t.total, "paid:", t.paid);
  }

  console.log("All done!");
}

seed().then(() => process.exit(0)).catch(console.error);
