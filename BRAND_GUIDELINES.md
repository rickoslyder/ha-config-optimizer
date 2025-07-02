# Branding & Styling Guidelines
## LLM-Powered Home Assistant Config Optimizer

### Visual Identity

#### Brand Personality
- **Trustworthy**: Users feel confident making configuration changes
- **Intelligent**: Clear indication of AI-powered capabilities  
- **Precise**: Clean, technical aesthetic matching developer tools
- **Integrated**: Seamlessly blends with Home Assistant's design system

#### Logo & Icon Design
- **Primary Icon**: Gear/cog with subtle AI elements (neural network pattern or gradient)
- **Color**: Use HA primary color with subtle accent for AI indication
- **Style**: Line-based, minimal, scalable for various sizes
- **Usage**: Must work on light/dark backgrounds

### Color Palette

#### Primary Colors (Home Assistant Integration)
```css
/* Core HA Colors - Use as base */
--ha-primary-color: var(--primary-color, #03a9f4)
--ha-accent-color: var(--accent-color, #ff9800)
--ha-text-primary: var(--primary-text-color, #212121)
--ha-text-secondary: var(--secondary-text-color, #727272)

/* Background Colors */
--ha-card-background: var(--card-background-color, #ffffff)
--ha-primary-background: var(--primary-background-color, #fafafa)
--ha-secondary-background: var(--secondary-background-color, #e5e5e5)
```

#### Semantic Colors (Optimizer-Specific)
```css
/* Status & Feedback Colors */
--optimizer-success: #00c875      /* Green for accepted suggestions */
--optimizer-warning: #f57f17      /* Orange for moderate impact */
--optimizer-error: #d32f2f        /* Red for high-risk changes */
--optimizer-info: #1976d2         /* Blue for informational */
--optimizer-pending: #757575      /* Gray for pending actions */

/* Impact Level Colors */
--impact-high: #d32f2f           /* Red - requires attention */
--impact-medium: #f57f17         /* Orange - moderate importance */
--impact-low: #00c875            /* Green - safe improvements */

/* AI/LLM Indication Colors */
--ai-primary: #6366f1            /* Purple for AI-generated content */
--ai-secondary: #8b5cf6          /* Lighter purple for accents */
--ai-background: rgba(99, 102, 241, 0.1)  /* Subtle purple background */
```

#### Dark Theme Support
```css
/* Dark Theme Overrides */
@media (prefers-color-scheme: dark) {
  --optimizer-success: #4caf50
  --optimizer-warning: #ff9800
  --optimizer-error: #f44336
  --optimizer-info: #2196f3
  --ai-background: rgba(99, 102, 241, 0.15)
}
```

### Typography

#### Font Stack
```css
/* Primary Font - Inherit from HA */
--font-family-primary: 'Roboto', 'Noto', sans-serif;

/* Monospace for Code */
--font-family-code: 'Roboto Mono', 'Consolas', 'Monaco', monospace;

/* System Fonts Fallback */
--font-family-system: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui;
```

#### Font Sizes & Hierarchy
```css
/* Text Scale */
--text-xs: 0.75rem;     /* 12px - Helper text, captions */
--text-sm: 0.875rem;    /* 14px - Body text, labels */
--text-base: 1rem;      /* 16px - Default body text */
--text-lg: 1.125rem;    /* 18px - Emphasized text */
--text-xl: 1.25rem;     /* 20px - Card titles */
--text-2xl: 1.5rem;     /* 24px - Section headers */
--text-3xl: 1.875rem;   /* 30px - Page titles */

/* Line Heights */
--leading-tight: 1.25;   /* For headings */
--leading-normal: 1.5;   /* For body text */
--leading-relaxed: 1.625; /* For long-form content */
```

#### Font Weights
```css
--font-thin: 100;
--font-light: 300;
--font-normal: 400;      /* Default body text */
--font-medium: 500;      /* Emphasized text */
--font-semibold: 600;    /* Section headers */
--font-bold: 700;        /* Important headings */
```

### Spacing System

#### Grid-Based Spacing
```css
/* Base unit: 4px */
--space-1: 0.25rem;    /* 4px */
--space-2: 0.5rem;     /* 8px */
--space-3: 0.75rem;    /* 12px */
--space-4: 1rem;       /* 16px - Default spacing */
--space-5: 1.25rem;    /* 20px */
--space-6: 1.5rem;     /* 24px */
--space-8: 2rem;       /* 32px */
--space-10: 2.5rem;    /* 40px */
--space-12: 3rem;      /* 48px */
--space-16: 4rem;      /* 64px */
```

#### Component Spacing
```css
/* Card Spacing */
--card-padding: var(--space-4);
--card-margin: var(--space-4);
--card-gap: var(--space-3);

/* Button Spacing */
--button-padding-x: var(--space-4);
--button-padding-y: var(--space-2);
--button-gap: var(--space-2);

/* Form Spacing */
--form-gap: var(--space-4);
--input-padding: var(--space-3);
--label-margin: var(--space-1);
```

### Component Library

#### Buttons

##### Primary Button
```css
.btn-primary {
  background: var(--ha-primary-color);
  color: white;
  border: none;
  border-radius: 4px;
  padding: var(--button-padding-y) var(--button-padding-x);
  font-weight: var(--font-medium);
  transition: all 0.2s ease;
}

.btn-primary:hover {
  opacity: 0.9;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}
```

##### Secondary Button
```css
.btn-secondary {
  background: transparent;
  color: var(--ha-primary-color);
  border: 1px solid var(--ha-primary-color);
  border-radius: 4px;
  padding: var(--button-padding-y) var(--button-padding-x);
  font-weight: var(--font-medium);
}
```

##### Action Buttons (Context-Specific)
```css
.btn-accept {
  background: var(--optimizer-success);
  color: white;
}

.btn-reject {
  background: var(--optimizer-error);
  color: white;
}

.btn-ai {
  background: var(--ai-primary);
  color: white;
  position: relative;
}

.btn-ai::before {
  content: "🤖";
  margin-right: var(--space-1);
}
```

#### Cards & Containers

##### Base Card
```css
.card {
  background: var(--ha-card-background);
  border-radius: 8px;
  padding: var(--card-padding);
  margin: var(--card-margin);
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  border: 1px solid var(--ha-secondary-background);
}
```

##### Suggestion Card
```css
.suggestion-card {
  border-left: 4px solid var(--impact-medium);
  position: relative;
}

.suggestion-card.impact-high {
  border-left-color: var(--impact-high);
}

.suggestion-card.impact-low {
  border-left-color: var(--impact-low);
}

.suggestion-card.ai-generated::after {
  content: "AI";
  position: absolute;
  top: var(--space-2);
  right: var(--space-2);
  background: var(--ai-background);
  color: var(--ai-primary);
  padding: var(--space-1) var(--space-2);
  border-radius: 12px;
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
}
```

#### Form Elements

##### Input Fields
```css
.input {
  width: 100%;
  padding: var(--input-padding);
  border: 1px solid var(--ha-secondary-background);
  border-radius: 4px;
  background: var(--ha-card-background);
  color: var(--ha-text-primary);
  font-family: var(--font-family-primary);
}

.input:focus {
  outline: none;
  border-color: var(--ha-primary-color);
  box-shadow: 0 0 0 2px rgba(3, 169, 244, 0.2);
}
```

##### Select Dropdowns
```css
.select {
  appearance: none;
  background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E");
  background-position: right 8px center;
  background-repeat: no-repeat;
  background-size: 16px;
  padding-right: var(--space-8);
}
```

#### Status Indicators

##### Progress Bars
```css
.progress {
  width: 100%;
  height: 8px;
  background: var(--ha-secondary-background);
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: var(--ha-primary-color);
  transition: width 0.3s ease;
}

.progress-bar.ai-processing {
  background: linear-gradient(90deg, var(--ai-primary), var(--ai-secondary));
  animation: pulse 2s infinite;
}
```

##### Status Badges
```css
.badge {
  display: inline-block;
  padding: var(--space-1) var(--space-2);
  border-radius: 12px;
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.badge.pending { background: var(--optimizer-pending); color: white; }
.badge.accepted { background: var(--optimizer-success); color: white; }
.badge.rejected { background: var(--optimizer-error); color: white; }
.badge.applied { background: var(--ha-primary-color); color: white; }
```

### Iconography

#### Icon Style Guidelines
- **Style**: Use Material Design icons for consistency with HA
- **Size**: 24px standard, 16px for inline use, 32px for emphasis
- **Weight**: 400 (regular) for most cases, 300 (light) for large icons
- **Color**: Inherit text color unless used for status indication

#### Semantic Icons
```css
/* Action Icons */
.icon-scan::before { content: "🔍"; }
.icon-apply::before { content: "✅"; }
.icon-reject::before { content: "❌"; }
.icon-edit::before { content: "✏️"; }
.icon-ai::before { content: "🤖"; }

/* Status Icons */
.icon-success::before { content: "✅"; color: var(--optimizer-success); }
.icon-warning::before { content: "⚠️"; color: var(--optimizer-warning); }
.icon-error::before { content: "🚫"; color: var(--optimizer-error); }
.icon-pending::before { content: "⏳"; color: var(--optimizer-pending); }
```

### Animation & Interactions

#### Micro-Interactions
```css
/* Hover Effects */
.interactive:hover {
  transform: translateY(-2px);
  transition: transform 0.2s ease;
}

/* Loading States */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.loading {
  animation: pulse 2s infinite;
}

.spinning {
  animation: spin 1s linear infinite;
}
```

#### Page Transitions
```css
/* Smooth tab switching */
.tab-content {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.tab-content.entering {
  opacity: 0;
  transform: translateX(20px);
}

.tab-content.active {
  opacity: 1;
  transform: translateX(0);
}
```

### Responsive Design

#### Breakpoints
```css
/* Mobile First Approach */
--breakpoint-sm: 640px;   /* Small tablets */
--breakpoint-md: 768px;   /* Tablets */
--breakpoint-lg: 1024px;  /* Desktop */
--breakpoint-xl: 1280px;  /* Large desktop */
```

#### Grid System
```css
.container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 var(--space-4);
}

.grid {
  display: grid;
  gap: var(--space-4);
  grid-template-columns: 1fr;
}

@media (min-width: 768px) {
  .grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

### Accessibility Guidelines

#### Color Contrast
- **Minimum**: 4.5:1 for normal text
- **Large Text**: 3:1 for text 18px+ or 14px+ bold
- **UI Elements**: 3:1 for interactive components

#### Focus Management
```css
/* Focus Indicators */
.focusable:focus {
  outline: 2px solid var(--ha-primary-color);
  outline-offset: 2px;
}

/* Skip to Content */
.skip-link {
  position: absolute;
  top: -40px;
  left: 6px;
  background: var(--ha-primary-color);
  color: white;
  padding: 8px;
  text-decoration: none;
  transition: top 0.3s;
}

.skip-link:focus {
  top: 6px;
}
```

#### Screen Reader Support
- Use semantic HTML elements
- Provide `aria-label` for icon-only buttons
- Use `aria-live` regions for dynamic content updates
- Ensure all interactive elements are keyboard accessible

### Implementation Guidelines

#### CSS Architecture
- Use CSS Custom Properties for theming
- Follow BEM methodology for class naming
- Implement CSS-in-JS for component-specific styles
- Use PostCSS for autoprefixing and optimization

#### Component Development
- Build with LitElement and follow Lit conventions
- Ensure all components support both light and dark themes
- Test with Home Assistant's default themes
- Provide fallbacks for unsupported CSS features

#### Performance Considerations
- Minimize CSS bundle size through purging
- Use `will-change` sparingly for animations
- Implement CSS containment for large lists
- Optimize for 60fps interactions