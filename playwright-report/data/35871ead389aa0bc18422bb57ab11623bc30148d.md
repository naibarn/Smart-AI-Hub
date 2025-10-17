# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - heading "Dashboard" [level=1] [ref=e2]
  - paragraph [ref=e4]:
    - text: Welcome,
    - strong [ref=e5]: org-a1@example.com
    - text: (Organization)
  - generic [ref=e6]:
    - generic [ref=e7] [cursor=pointer]: Dashboard
    - generic [ref=e8] [cursor=pointer]: Profile
    - generic [ref=e9] [cursor=pointer]: Points
    - generic [ref=e10] [cursor=pointer]: Referrals
    - generic [ref=e11] [cursor=pointer]: Members
    - generic [ref=e12] [cursor=pointer]: Transfer
    - generic [ref=e13] [cursor=pointer]: Block Users
    - generic [ref=e14] [cursor=pointer]: Organization Settings
  - generic [ref=e15]:
    - heading "Members" [level=3] [ref=e16]
    - generic [ref=e17]:
      - generic [ref=e18]: org-a1@example.com (Organization)
      - generic [ref=e19]: admin-a1@example.com (Admin)
      - generic [ref=e20]: general-a1-1@example.com (General)
      - generic [ref=e21]: general-a1-2@example.com (General)
      - generic [ref=e22]: blocked-general@example.com (General)
      - generic [ref=e23]: blocked-admin@example.com (Admin)
  - generic [ref=e24]:
    - heading "Points & Credits" [level=3] [ref=e25]
    - paragraph [ref=e26]: "Points: 100"
    - paragraph [ref=e27]: "Credits: 50"
    - button "Claim Daily Reward" [ref=e28]
  - generic [ref=e29]:
    - heading "Referral" [level=3] [ref=e30]
    - paragraph [ref=e31]: "Your referral code: MOCK123"
    - paragraph [ref=e32]: "Referral link: http://localhost:3000/register?code=MOCK123"
```