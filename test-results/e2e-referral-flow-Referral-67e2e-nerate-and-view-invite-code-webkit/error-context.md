# Page snapshot

```yaml
- generic [active] [ref=e1]:
    - heading "Login" [level=1] [ref=e2]
    - generic [ref=e3]:
        - generic [ref=e4]:
            - generic [ref=e5]: 'Email:'
            - combobox "Email:" [ref=e6]:
                - option "Administrator" [selected]
                - option "Agency A"
                - option "Agency B"
                - option "Organization A1"
                - option "Organization A2"
                - option "Organization B1"
                - option "Admin A1"
                - option "Admin A2"
                - option "Admin B1"
                - option "General A1-1"
                - option "General A1-2"
                - option "General A2-1"
                - option "General B1-1"
                - option "Blocked General"
                - option "Blocked Admin"
        - generic [ref=e7]:
            - generic [ref=e8]: 'Password:'
            - textbox "Password:" [ref=e9]: password123
        - button "Login" [ref=e10] [cursor=pointer]
```
