# Security Specification for AutoServ Pro

## 1. Data Invariants
- All business records must belong to a single shared workspace instance identified by `userId` / `ownerId` = `main_store`.
- Core entity types (Customers, Suppliers, InventoryItems, Invoices, PurchaseOrders, Notifications, Categories) must match specific JSON shapes with type and size validations.
- Immutability: Once created, fields like `ownerId` and `createdAt` cannot be modified under any circumstances.
- String keys and IDs must be string-valid, less than 128 characters, and follow regex: `^[a-zA-Z0-9_\-]+$`.

## 2. The "Dirty Dozen" Payloads
These payloads attempt to break Identity, Integrity, and State constraints. They must all be strictly rejected by our rules:

1. **Payload 1: Injecting Ghost Fields into Customer Profile (Shadow Update)**
   ```json
   {
     "ownerId": "main_store",
     "serialNumber": "CUST-1001",
     "name": "Ali Hassan",
     "phone": "0123456789",
     "balance": 150,
     "createdAt": 1781234567,
     "updatedAt": 1781234567,
     "isAdmin": true
   }
   ```

2. **Payload 2: Identity Spoofing (Changing ownerId to a foreign tenant)**
   ```json
   {
     "ownerId": "attacker_store",
     "name": "AutoServ Pro Copy",
     "phone": "0112223334",
     "address": "Cairo, Egypt",
     "createdAt": 1781234567,
     "updatedAt": 1781234567
   }
   ```

3. **Payload 3: Value Poisoning (Booleans or giant string on numeric purchase price)**
   ```json
   {
     "ownerId": "main_store",
     "code": "PART-999",
     "name": "Malicious Part",
     "brand": "Toyota",
     "compatibleCars": "All",
     "category": "فلاتر",
     "storageLocation": "Rack A",
     "quantity": "NOT_A_NUMBER",
     "purchasePrice": true,
     "sellPrice": 250,
     "createdAt": 1781234567,
     "updatedAt": 1781234567
   }
   ```

4. **Payload 4: Resource Poisoning (Giant string as ID)**
   - Target ID: `ITEM_ID_SPAM_SPAM_SPAM_..._1MB_LONG`

5. **Payload 5: Bypassing Validation in Category Creation (Zero keys/Empty Schema)**
   ```json
   {}
   ```

6. **Payload 6: Modifying Invariant `ownerId` on Inventory Update**
   ```json
   {
     "ownerId": "hacker_store",
     "updatedAt": 1781234567
   }
   ```

7. **Payload 7: State Shortcutting (Negative client balance manipulation)**
   ```json
   {
     "ownerId": "main_store",
     "serialNumber": "CUST-1001",
     "name": "Ali Hassan",
     "phone": "0123456789",
     "balance": -9999999,
     "createdAt": 1781234567,
     "updatedAt": 1781234567
   }
   ```

8. **Payload 8: Injecting Malicious Script into Category Name**
   ```json
   {
     "ownerId": "main_store",
     "name": "<script>alert('xss')</script>",
     "createdAt": 1781234567,
     "updatedAt": 1781234567
   }
   ```

9. **Payload 9: Missing Required Primary Keys on Supplier**
   ```json
   {
     "ownerId": "main_store",
     "phone": "12345",
     "balance": 0
   }
   ```

10. **Payload 10: Modifying original `createdAt` timestamp**
    ```json
    {
      "createdAt": 10000000,
      "updatedAt": 1781234567
    }
    ```

10. **Payload 11: Attempting to write a notification with size exceeding threshold**
    ```json
    {
      "ownerId": "main_store",
      "message": "A VERY LOOOOOOOOOOOONG STRING ... exceeding 500 characters",
      "date": "2026-06-17T12:00:00Z",
      "read": false,
      "createdAt": 1781234567,
      "updatedAt": 1781234567
    }
    ```

12. **Payload 12: Injecting non-array items structure into Invoice**
    ```json
    {
      "ownerId": "main_store",
      "invoiceNumber": "INV-1001",
      "date": "2026-06-17T12:00:00Z",
      "customerId": "CUST-1",
      "items": "NOT_AN_ARRAY",
      "total": 100,
      "paid": 100,
      "createdAt": 1781234567,
      "updatedAt": 1781234567
    }
    ```

## 3. Test Runner Schema
Our verification tests verify that these operations return `PERMISSION_DENIED` on Firestore.
