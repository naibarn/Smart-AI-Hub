# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - heading "Transfer" [level=1] [ref=e2]
  - generic [ref=e3]:
    - generic [ref=e4]:
      - generic [ref=e5]: "Recipient:"
      - combobox "Recipient:" [ref=e6]:
        - option "Select a user" [selected]
        - option "General A1-1"
        - option "General A1-2"
        - option "General A2-1"
        - option "General B1-1"
    - generic [ref=e7]:
      - generic [ref=e8]: "Amount:"
      - spinbutton "Amount:" [ref=e9]: "10"
    - generic [ref=e10]:
      - generic [ref=e11]: "Type:"
      - combobox "Type:" [ref=e12]:
        - option "Credits" [selected]
        - option "Points"
    - button "Transfer" [ref=e13] [cursor=pointer]
```