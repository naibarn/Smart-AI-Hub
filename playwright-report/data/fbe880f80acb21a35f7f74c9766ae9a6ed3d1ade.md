# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - heading "Dashboard" [level=1] [ref=e2]
  - paragraph [ref=e4]:
    - text: Welcome,
    - strong [ref=e5]: general-a1-1@example.com
    - text: (General)
  - generic [ref=e6]:
    - generic [ref=e7] [cursor=pointer]: Dashboard
    - generic [ref=e8] [cursor=pointer]: Profile
    - generic [ref=e9] [cursor=pointer]: Points
    - generic [ref=e10] [cursor=pointer]: Referrals
  - generic [ref=e11]:
    - heading "Points & Credits" [level=3] [ref=e12]
    - paragraph [ref=e13]: "Points: 100"
    - paragraph [ref=e14]: "Credits: 50"
    - button "Claim Daily Reward" [ref=e15]
  - generic [ref=e16]:
    - heading "Referral" [level=3] [ref=e17]
    - paragraph [ref=e18]: "Your referral code: MOCK123"
    - paragraph [ref=e19]: "Referral link: http://localhost:3000/register?code=MOCK123"
```