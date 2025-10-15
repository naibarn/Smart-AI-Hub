---
title: "Common UI Components"
author: "Frontend Team"
created_date: "2025-10-14"
last_updated: "2025-10-14"
version: "1.0"
status: "Draft"
priority: "P1 - High"
related_specs: ["FR-010-UI-Components", "FR-011-Design-System", "FR-012-Accessibility"]
---

# Common UI Components

## 1. ภาพรวม (Overview)

Common UI components provide a comprehensive set of reusable interface elements for the Smart AI Hub platform. These components ensure consistency, accessibility, and maintainability across all user interfaces while following modern design principles.

## 2. วัตถุประสงค์ (Objectives)

- ให้ชุดคอมโพเนนต์ UI ที่สม่ำเสมอและนำกลับมาใช้ใหม่ได้
- รับประกันความสอดคล้องของการออกแบบทั่วทั้งแพลตฟอร์ม
- ให้การเข้าถึงได้สูงและปฏิบัติตามมาตรฐาน WCAG
- รองรับธีมและการปรับแต่ง
- ให้ประสบการณ์ผู้ใช้ที่ยอดเยี่ยมและเป็นมิตร

## 3. Component Hierarchy

```
UIProvider
├── Buttons
│   ├── Button
│   ├── IconButton
│   ├── ButtonGroup
│   ├── FloatingActionButton
│   └── ToggleButton
├── Forms
│   ├── FormField
│   ├── TextInput
│   ├── PasswordInput
│   ├── EmailInput
│   ├── NumberInput
│   ├── PhoneInput
│   ├── TextArea
│   ├── Select
│   ├── MultiSelect
│   ├── Checkbox
│   ├── RadioGroup
│   ├── Switch
│   ├── Slider
│   ├── DatePicker
│   ├── TimePicker
│   ├── FileUpload
│   └── FormValidation
├── Cards
│   ├── Card
│   ├── MediaCard
│   ├── StatsCard
│   ├── ActivityCard
│   └── NotificationCard
├── Lists
│   ├── List
│   ├── ListItem
│   ├── ListSubheader
│   ├── ListDivider
│   └── VirtualList
├── Modals
│   ├── Modal
│   ├── Dialog
│   ├── Alert
│   ├── ConfirmDialog
│   └── Drawer
├── Display
│   ├── Avatar
│   ├── Badge
│   ├── Chip
│   ├── Tag
│   ├── Label
│   ├── Progress
│   ├── Skeleton
│   └── Divider
├── Feedback
│   ├── Alert
│   ├── Toast
│   ├── Tooltip
│   ├── Popover
│   └── Spinner
└── Navigation
    ├── Tabs
    ├── Pagination
    ├── Breadcrumbs
    ├── Stepper
    └── Accordion
```

## 4. Component Specifications

### 4.1 Button

**Purpose**: Standard button component with multiple variants

**Props**:
```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  rounded?: boolean;
  onClick?: (event: React.MouseEvent) => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  children: React.ReactNode;
}
```

**Variants**:
- Primary: Main action buttons
- Secondary: Secondary actions
- Outline: Bordered buttons
- Ghost: Minimal buttons
- Danger: Destructive actions

**Features**:
- Loading states
- Icon support
- Full width option
- Accessibility support
- Keyboard navigation

### 4.2 TextInput

**Purpose**: Text input field with validation

**Props**:
```typescript
interface TextInputProps {
  label?: string;
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  size?: 'small' | 'medium' | 'large';
  variant?: 'outlined' | 'filled' | 'standard';
  startAdornment?: React.ReactNode;
  endAdornment?: React.ReactNode;
  onChange?: (value: string) => void;
  onBlur?: (event: React.FocusEvent) => void;
  onFocus?: (event: React.FocusEvent) => void;
  className?: string;
}
```

**Features**:
- Real-time validation
- Error states
- Helper text
- Adornments (icons, buttons)
- Accessibility support

### 4.3 Select

**Purpose**: Dropdown selection component

**Props**:
```typescript
interface SelectProps<T = string> {
  label?: string;
  placeholder?: string;
  value?: T;
  defaultValue?: T;
  options: Option<T>[];
  error?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  multiple?: boolean;
  searchable?: boolean;
  clearable?: boolean;
  loading?: boolean;
  size?: 'small' | 'medium' | 'large';
  onChange?: (value: T | T[]) => void;
  className?: string;
}

interface Option<T = string> {
  label: string;
  value: T;
  disabled?: boolean;
  group?: string;
  icon?: React.ReactNode;
}
```

**Features**:
- Single/multiple selection
- Search functionality
- Grouping support
- Clearable option
- Keyboard navigation

### 4.4 Card

**Purpose**: Flexible content container component

**Props**:
```typescript
interface CardProps {
  title?: string;
  subtitle?: string;
  image?: string;
  actions?: React.ReactNode;
  elevation?: number;
  variant?: 'outlined' | 'elevated' | 'filled';
  padding?: number;
  hoverable?: boolean;
  clickable?: boolean;
  onClick?: () => void;
  className?: string;
  children?: React.ReactNode;
}
```

**Features**:
- Multiple variants
- Elevation control
- Hover effects
- Click handling
- Responsive design

### 4.5 Modal

**Purpose**: Modal dialog overlay component

**Props**:
```typescript
interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  size?: 'small' | 'medium' | 'large' | 'fullscreen';
  closable?: boolean;
  maskClosable?: boolean;
  centered?: boolean;
  footer?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}
```

**Features**:
- Size variants
- Close on overlay click
- Centered positioning
- Custom footer
- Focus management
- Escape key handling

### 4.6 Alert

**Purpose**: Alert message component

**Props**:
```typescript
interface AlertProps {
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  closable?: boolean;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  onClose?: () => void;
  className?: string;
  children: React.ReactNode;
}
```

**Variants**:
- Info: General information
- Success: Success messages
- Warning: Warning messages
- Error: Error messages

**Features**:
- Color-coded variants
- Dismissible option
- Custom icons
- Action buttons
- Accessibility support

### 4.7 Avatar

**Purpose**: User avatar component

**Props**:
```typescript
interface AvatarProps {
  src?: string;
  alt?: string;
  size?: number | 'small' | 'medium' | 'large';
  name?: string;
  variant?: 'circular' | 'rounded' | 'square';
  fallback?: string;
  status?: 'online' | 'offline' | 'away' | 'busy';
  onClick?: () => void;
  className?: string;
}
```

**Features**:
- Image and fallback support
- Multiple sizes
- Shape variants
- Online status indicator
- Click handling

### 4.8 Badge

**Purpose**: Badge component for notifications and counts

**Props**:
```typescript
interface BadgeProps {
  count?: number;
  maxCount?: number;
  dot?: boolean;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  size?: 'small' | 'medium' | 'large';
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  showZero?: boolean;
  className?: string;
  children?: React.ReactNode;
}
```

**Features**:
- Count display
- Dot indicator
- Color variants
- Position control
- Overflow handling

### 4.9 Tabs

**Purpose**: Tab navigation component

**Props**:
```typescript
interface TabsProps {
  activeKey: string;
  onChange: (key: string) => void;
  tabs: TabItem[];
  variant?: 'default' | 'card' | 'pills';
  size?: 'small' | 'medium' | 'large';
  centered?: boolean;
  scrollable?: boolean;
  className?: string;
}

interface TabItem {
  key: string;
  label: React.ReactNode;
  content: React.ReactNode;
  disabled?: boolean;
  icon?: React.ReactNode;
  badge?: number | string;
}
```

**Features**:
- Multiple variants
- Icon support
- Badge support
- Scrollable tabs
- Keyboard navigation

### 4.10 Tooltip

**Purpose**: Tooltip component for additional information

**Props**:
```typescript
interface TooltipProps {
  title: React.ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'top-start' | 'top-end' | 'bottom-start' | 'bottom-end';
  trigger?: 'hover' | 'click' | 'focus';
  delay?: number;
  arrow?: boolean;
  className?: string;
  children: React.ReactNode;
}
```

**Features**:
- Multiple positions
- Trigger options
- Delay control
- Arrow indicator
- Accessibility support

## 5. Design System Integration

### 5.1 Theme System

```typescript
interface Theme {
  colors: {
    primary: ColorPalette;
    secondary: ColorPalette;
    success: ColorPalette;
    warning: ColorPalette;
    error: ColorPalette;
    info: ColorPalette;
    neutral: ColorPalette;
    background: BackgroundColors;
    text: TextColors;
  };
  typography: {
    fontFamily: FontFamily;
    fontSize: FontSizes;
    fontWeight: FontWeights;
    lineHeight: LineHeights;
  };
  spacing: SpacingScale;
  borderRadius: BorderRadiusScale;
  shadows: ShadowScale;
  breakpoints: Breakpoints;
  zIndex: ZIndexScale;
}
```

### 5.2 Color Palette

- Primary colors for main branding
- Secondary colors for accents
- Semantic colors for states
- Neutral colors for text and backgrounds
- System colors for interfaces

### 5.3 Typography Scale

- Consistent font sizes
- Line height ratios
- Font weight variations
- Font family hierarchy

## 6. Accessibility Features

### 6.1 WCAG 2.1 Level AA Compliance

- Semantic HTML elements
- ARIA attributes
- Keyboard navigation
- Focus management
- Screen reader support

### 6.2 Keyboard Navigation

- Tab order management
- Focus indicators
- Shortcut keys
- Skip navigation links

### 6.3 Screen Reader Support

- Alternative text
- ARIA labels
- Live regions
- Context information

## 7. Form Validation

### 7.1 Validation Schema

```typescript
interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean | string;
}

interface ValidationSchema {
  [fieldName: string]: ValidationRule;
}
```

### 7.2 Error Handling

- Real-time validation
- Error message display
- Field highlighting
- Form-level errors

## 8. Animation and Transitions

### 8.1 Motion Principles

- Purposeful animations
- Consistent timing
- Smooth transitions
- Reduced motion support

### 8.2 Transition Library

```typescript
interface Transitions {
  easing: {
    easeIn: string;
    easeOut: string;
    easeInOut: string;
  };
  duration: {
    fast: string;
    normal: string;
    slow: string;
  };
}
```

## 9. Responsive Design

### 9.1 Breakpoint System

```typescript
interface Breakpoints {
  xs: number;  // 0px
  sm: number;  // 600px
  md: number;  // 960px
  lg: number;  // 1280px
  xl: number;  // 1920px
}
```

### 9.2 Responsive Utilities

- Container components
- Grid system
- Spacing utilities
- Display utilities

## 10. Performance Considerations

### 10.1 Optimization Strategies

- Lazy loading
- Code splitting
- Tree shaking
- Bundle optimization

### 10.2 Render Optimization

- Memoization
- Virtual scrolling
- Efficient re-renders
- Minimal DOM manipulation

## 11. Testing Strategy

### 11.1 Unit Testing

- Component rendering
- Props handling
- State changes
- Event handling

### 11.2 Integration Testing

- Component interactions
- Form submissions
- Navigation flows
- User workflows

### 11.3 Accessibility Testing

- Keyboard navigation
- Screen reader compatibility
- Color contrast
- Focus management

## 12. Implementation Guidelines

### 12.1 Component Development

- Consistent API design
- Prop validation
- Default values
- TypeScript support

### 12.2 Documentation

- Prop documentation
- Usage examples
- Design guidelines
- Best practices

## 13. Wireframes

### 13.1 Button Variants

```
Primary Button: [  Click me  ]
Secondary Button: [ Click me ]
Outline Button: [ Click me ]
Ghost Button:  Click me
Danger Button: [  Delete  ]
```

### 13.2 Form Layout

```
Form Field
┌─────────────────────────────────┐
│ Label                          │
│ ┌─────────────────────────────┐ │
│ │ Input field                 │ │
│ └─────────────────────────────┘ │
│ Helper text                   │
└─────────────────────────────────┘

Form Field with Error
┌─────────────────────────────────┐
│ Label *                        │
│ ┌─────────────────────────────┐ │
│ │ Input field                 │ │
│ └─────────────────────────────┘ │
│ Error message                 │
└─────────────────────────────────┘
```

### 13.3 Card Layout

```
┌─────────────────────────────────┐
│ ┌───┐ Title                    │
│ │Img│ Subtitle                 │
│ └───┘                         │
│                                 │
│ Card content goes here          │
│                                 │
│                [Action] [Action]│
└─────────────────────────────────┘
```

## 14. Implementation Checklist

- [ ] Create UIProvider with theme context
- [ ] Implement Button component
- [ ] Implement TextInput component
- [ ] Implement Select component
- [ ] Implement Card component
- [ ] Implement Modal component
- [ ] Implement Alert component
- [ ] Implement Avatar component
- [ ] Implement Badge component
- [ ] Implement Tabs component
- [ ] Implement Tooltip component
- [ ] Create theme system
- [ ] Add form validation
- [ ] Implement animations
- [ ] Ensure accessibility compliance
- [ ] Write unit tests
- [ ] Write integration tests
- [ ] Create Storybook stories
- [ ] Performance optimization
- [ ] Cross-browser testing

---

**หมายเหตุ:** เอกสารนี้เป็นส่วนหนึ่งของ Frontend Specifications และจะถูกอัปเดตตามความจำเป็น