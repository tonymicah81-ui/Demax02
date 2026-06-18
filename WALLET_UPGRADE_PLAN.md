# Wallet Upgrade Plan — Multi-Method Payment System

## Objective
Allow the super admin to configure multiple payment channels (bank transfer by country, crypto, third-party apps), and let users pick the right method for their location when adding funds.

---

## Super Admin Side — Platform Settings → "Payments" Tab

Super admin manages three categories of payment methods stored in `platform_settings/payment_methods`.

### 1. Bank Transfer
Each bank entry has:
- **Country** — dropdown (Nigeria, Ghana, South Africa, Kenya, Uganda, Tanzania, Rwanda, Zimbabwe, Zambia, USA, UK, Canada, Australia, Germany, France, UAE, Saudi Arabia, India, Other)
- **Bank Name** — text (e.g. "GTBank", "Zenith", "Standard Bank")
- **Account Name** — text
- **Account Number** — text
- **Sort Code / Routing / IBAN** — optional text
- **Note** — optional instruction for the user

### 2. Crypto
Each crypto entry has:
- **Coin** — Bitcoin, Ethereum, USDT, USDC, Litecoin, BNB
- **Network** — auto-populated based on coin:
  - Bitcoin → Bitcoin
  - Ethereum → ERC20
  - USDT → ERC20 | TRC20 | BEP20
  - USDC → ERC20 | BEP20
  - Litecoin → Litecoin
  - BNB → BEP20
- **Wallet Address** — text
- **Note** — optional

### 3. Third Party
Each entry has:
- **Platform** — PayPal, Skrill, Cash App, Zelle, Venmo, Wise, Western Union, MoneyGram, Remitly, WorldRemit, Payoneer, Neteller, Perfect Money, Other
- **Handle / Username / Email / Phone** — text
- **Note** — optional

---

## Firestore Data Structure

```
platform_settings/payment_methods {
  banks: [
    { id, country, bankName, accountName, accountNumber, sortCode, note }
  ],
  crypto: [
    { id, coin, network, address, note }
  ],
  thirdParty: [
    { id, platform, handle, note }
  ]
}
```

**Firestore rules:** `payment_methods` added to the public-readable list so unauthenticated/user visitors can read it.

---

## User Wallet Side — Add Funds Modal Upgrade

### Step 1 — Choose Payment Method
Three tabs: **Bank Transfer** | **Crypto** | **Third Party**

- **Bank Transfer**: user selects their country from a dropdown → only banks for that country are shown → user clicks one to select it
- **Crypto**: all configured wallets shown as cards → user clicks one
- **Third Party**: all configured platforms shown as cards → user clicks one

If no methods are configured for a category, that tab shows a "not available" message.

### Step 2 — Payment Details + Submit
- Shows the selected method's details in a copyable card (tap any field to copy)
- Amount input
- Payment proof upload (optional)
- Submit button → creates `transactions` doc with `paymentMethodType` and `paymentMethodName` fields

### "Payment Instructions" sidebar card
Replaced with a cleaner "Available Methods" summary card showing icons for each active category.

---

## Files Changed

| File | Change |
|---|---|
| `src/pages/superadmin/PlatformSettings.tsx` | New `PaymentMethodsPanel` component + `'payments'` tab |
| `src/pages/user/Wallet.tsx` | Upgraded Add Funds modal with country → method → submit flow |
| `firestore.rules` | Add `payment_methods` to public-readable list |
| `old_firestore.rules` | Sync |
| `easy-setup/firestore.rules` | Sync |

---

## Status: ✅ IMPLEMENTED
