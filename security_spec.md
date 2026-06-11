# Security Specification - Theresa's Celebration Portal

## Data Invariants
1. A Wish cannot be posted without a sender name or a non-empty message.
2. The `recipient` field must be either "theresa" or "therese" representing the guest of honor.
3. The `createdAt` timestamp must be set to the server's execution request time.
4. Anonymous guests or authenticated family members are allowed to append wishes to the database, but updates or deletes of guest wishes are strictly disabled to protect standard wishes from spoofing, deletion, or editing by other clients.

## The "Dirty Dozen" Payloads (Denial Tests)
We define twelve adversarial payloads attempting to bypass these gates:
1. **Empty Name**: `{ "name": "", "message": "Best wishes!", "recipient": "theresa", "createdAt": "request.time" }` -> `PERMISSION_DENIED`
2. **Empty Message**: `{ "name": "Sister Maria", "message": "", "recipient": "theresa", "createdAt": "request.time" }` -> `PERMISSION_DENIED`
3. **Mismatched Recipient**: `{ "name": "Sister Maria", "message": "Joy!", "recipient": "bob", "createdAt": "request.time" }` -> `PERMISSION_DENIED`
4. **Spoofed CreatedAt**: `{ "name": "Sister Maria", "message": "Joy!", "recipient": "theresa", "createdAt": 10000000 }` (client timestamp) -> `PERMISSION_DENIED`
5. **No Recipient**: `{ "name": "Sister Maria", "message": "Joy!", "createdAt": "request.time" }` -> `PERMISSION_DENIED`
6. **No CreatedAt**: `{ "name": "Sister Maria", "message": "Joy!", "recipient": "theresa" }` -> `PERMISSION_DENIED`
7. **Extravagant Name Length**: `{ "name": "A".repeat(200), "message": "Joy!", "recipient": "theresa", "createdAt": "request.time" }` -> `PERMISSION_DENIED`
8. **Extravagant Message Length**: `{ "name": "Maria", "message": "A".repeat(10000), "recipient": "theresa", "createdAt": "request.time" }` -> `PERMISSION_DENIED`
9. **Injecting Extra Fields (Shadow Write)**: `{ "name": "Maria", "message": "Joy!", "recipient": "theresa", "createdAt": "request.time", "isAdmin": true }` -> `PERMISSION_DENIED`
10. **Malicious Client Delete Operation**: Attempting to delete `artifacts/theresa-celebration-portal/public/data/wishes/someWishId` -> `PERMISSION_DENIED`
11. **Malicious Client Update Operation**: Attempting to edit `artifacts/theresa-celebration-portal/public/data/wishes/someWishId` -> `PERMISSION_DENIED`
12. **Id Poisoning (Invalid ID Character)**: Attempting to write to `artifacts/theresa-celebration-portal/public/data/wishes/Poisoned#Id%` -> `PERMISSION_DENIED`
