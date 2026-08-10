# CodeSync --- Premium UI/UX Redesign Specification

## Design Direction

Redesign CodeSync as a **premium, calm, editorial-quality collaborative
coding workspace**.

The product should feel closer to Apple's software design philosophy
than a typical developer dashboard:

-   Minimal
-   Spacious
-   Precise
-   Fast-looking
-   Sophisticated
-   Extremely readable
-   Almost no decorative UI
-   Strong visual hierarchy
-   Subtle interaction feedback
-   High-quality typography
-   Restrained use of color

The redesign must **not look AI/vibe-coded**, generic SaaS,
gaming-themed, cyberpunk, or overly neon.

------------------------------------------------------------------------

## 1. Core Visual Language

### Color System

Use a warm neutral foundation with restrained saffron/orange accents.

#### Primary surfaces

``` text
Background:        #FAFAF8
Surface:           #FFFFFF
Secondary surface: #F5F5F2
Border:            #E8E6E1
Border subtle:     #F0EFEC
Text primary:      #171717
Text secondary:    #6B6B67
Text muted:        #989894
```

#### Accent

Use saffron/orange only for important actions and active states.

``` text
Accent:            #E87924
Accent hover:      #D96818
Accent soft:       #FFF1E6
```

#### Status

``` text
Success:           #34A853
Success soft:      #EAF7EE
Error:             #D64545
Warning:           #C88A18
```

Do NOT use:

-   Neon purple
-   Neon blue
-   Gradients
-   Glowing borders
-   Glassmorphism
-   Excessive shadows
-   Dark dashboard styling
-   Excessive colored badges

------------------------------------------------------------------------

## 2. Typography

Use a modern system-first typography stack.

Preferred:

``` css
font-family:
  -apple-system,
  BlinkMacSystemFont,
  "SF Pro Display",
  "SF Pro Text",
  "Inter",
  sans-serif;
```

Code editor:

``` css
font-family:
  "SFMono-Regular",
  "SF Mono",
  "JetBrains Mono",
  Menlo,
  Monaco,
  Consolas,
  monospace;
```

### Typography hierarchy

-   Product name: 17--20px, 600 weight
-   Navigation labels: 13--14px
-   Primary buttons: 14px, 600
-   Panel headings: 12--13px, 600, slightly tracked
-   Editor: 14--15px
-   Terminal: 13--14px
-   Secondary text: 13px
-   Micro labels: 11--12px

Avoid oversized headings.

------------------------------------------------------------------------

# 3. Overall Layout

Use a three-region workspace:

``` text
┌──────────────────────────────────────────────────────────────┐
│                         TOP NAVBAR                           │
├──────┬──────────────────────────────────────────────┬───────┤
│      │                                              │       │
│ SIDE │                  CODE EDITOR                 │ CHAT  │
│ BAR  │                                              │       │
│      │                                              │       │
│      ├──────────────────────────┬───────────────────┤       │
│      │       STDIN              │ OUTPUT TERMINAL   │       │
│      │                          │                   │       │
└──────┴──────────────────────────┴───────────────────┴───────┘
```

### Proportions

-   Top navigation: 68--72px
-   Left navigation: 72--84px
-   Chat: approximately 28--30% of content width
-   Editor/input region: approximately 70--72%
-   Bottom panels: approximately 25--30% of workspace height

The editor must remain the visual center of the product.

------------------------------------------------------------------------

# 4. Top Navigation

The top bar should be extremely clean.

### Left

``` text
[CodeSync icon] CodeSync   [9439149C] [copy]
```

The session ID should look like a small neutral identifier rather than a
large badge.

Example:

``` text
CodeSync   9439149C  ⧉
```

### Center

Language selector:

``` text
[ JS ] JavaScript  ˅
```

Theme selector:

``` text
[ ☼ ] Light  ˅
```

Keep selectors compact.

### Right

Sync indicator:

``` text
● Sync: ON
```

Use a tiny green dot.

Primary action:

``` text
Run Code
```

This is the only strong filled button in the navbar.

Secondary action:

``` text
↗ Share URL
```

Use an outlined/neutral button.

------------------------------------------------------------------------

# 5. Left Navigation Rail

The sidebar should be narrow and quiet.

Suggested icons:

``` text
Code
Chat
Files
Settings
Collaborators
```

Do not show text labels by default.

Use:

-   44px icon buttons
-   generous vertical spacing
-   subtle hover background
-   one active state

Active icon:

``` text
background: #FFF1E6
icon: #E87924
```

Avoid colored glowing active states.

------------------------------------------------------------------------

# 6. Code Editor

The editor is the most important component.

### Container

Use a white surface with a very subtle border.

``` css
border: 1px solid #E8E6E1;
border-radius: 16px;
background: #FFFFFF;
```

Shadow should be almost imperceptible:

``` css
box-shadow: 0 4px 20px rgba(0,0,0,0.035);
```

### Editor header

Create a lightweight tab bar:

``` text
[ JS ] main.js   ●   ×     [+]
```

The active tab should not look like a browser tab.

Use a subtle bottom border or slightly darker surface.

### Editor utilities

Top right:

``` text
[settings] [more] [fullscreen]
```

Use icon-only controls.

### Code area

Keep the editor extremely spacious.

Example:

``` text
  1 │ // Start typing your code here...
    │
    │
    │
    │
```

Line numbers should be muted.

Cursor should use the saffron accent.

Do not add:

-   Huge colored syntax backgrounds
-   Glowing cursor
-   Decorative gradients
-   Excessive minimaps
-   Fake AI widgets

------------------------------------------------------------------------

# 7. Standard Input / Output Terminal

Place the two panels below the editor.

``` text
┌──────────────────────────┬──────────────────────────────┐
│ STANDARD INPUT (STDIN)   │ OUTPUT TERMINAL              │
│                          │                              │
│ Enter your input here... │ No output yet...             │
│                          │                              │
└──────────────────────────┴──────────────────────────────┘
```

Both should visually belong to the same workspace.

### Panel header

Use:

``` text
STDIN
OUTPUT
```

rather than overly technical decorative labels.

Possible expanded labels:

``` text
Standard Input
Output
```

### Output states

Empty:

``` text
No output yet
```

Success:

``` text
✓ Program completed successfully
```

Error:

``` text
Program exited with an error
```

Keep status colors subtle.

------------------------------------------------------------------------

# 8. Peer Chat

The chat should feel like a native collaboration panel rather than a
messaging app.

Header:

``` text
PEER CHAT                         ● 2 Online
```

The online indicator should be small and green.

### Empty state

Do NOT use a large illustration.

Instead:

``` text
No messages yet

Say hello and start coding together.
```

Keep it centered but understated.

### Message design

Messages should be compact.

Example:

``` text
Alex                         18:42

I updated the sorting logic.
```

Avoid oversized speech bubbles.

Use simple sender/time metadata.

### Composer

Bottom anchored:

``` text
┌──────────────────────────────────────┐
│ Type a message...                  → │
└──────────────────────────────────────┘
```

The send button should be compact.

------------------------------------------------------------------------

# 9. Buttons

Buttons should feel tactile and expensive.

### Primary

``` css
background: #E87924;
color: #FFFFFF;
border-radius: 10px;
```

Hover:

``` css
background: #D96818;
```

Do not use gradients.

### Secondary

``` css
background: #FFFFFF;
border: 1px solid #DEDCD7;
color: #222222;
```

### Icon button

``` css
background: transparent;
border-radius: 9px;
```

Hover:

``` css
background: #F5F5F2;
```

------------------------------------------------------------------------

# 10. Border Radius

Use a restrained radius system:

``` text
Large panels: 16px
Buttons:       10px
Inputs:        10px
Icon buttons:   9px
Pills:         999px
```

Do not make every element extremely rounded.

The design should feel engineered rather than playful.

------------------------------------------------------------------------

# 11. Shadows

Use almost invisible shadows.

Preferred:

``` css
box-shadow:
  0 2px 8px rgba(0, 0, 0, 0.025),
  0 8px 24px rgba(0, 0, 0, 0.025);
```

Panels should primarily be separated through:

-   spacing
-   borders
-   tonal contrast

not shadows.

------------------------------------------------------------------------

# 12. Spacing System

Use an 8px base grid.

``` text
4px
8px
12px
16px
20px
24px
32px
40px
48px
```

The UI should breathe.

Prefer more whitespace over adding decorative elements.

------------------------------------------------------------------------

# 13. Interaction Design

Every interactive element needs subtle feedback.

### Hover

-   Slight background change
-   No scaling
-   No glow

### Active

-   Slightly darker surface
-   Accent where appropriate

### Focus

Use a clean orange focus ring:

``` css
outline: 2px solid rgba(232, 121, 36, 0.22);
outline-offset: 2px;
```

### Loading

Use restrained skeletons or small activity indicators.

Never use large spinning loaders.

------------------------------------------------------------------------

# 14. Responsive Behavior

### Desktop

Full three-column workspace.

### Tablet

Collapse left rail and reduce chat width.

### Mobile

Use a single workspace.

Suggested navigation:

``` text
Editor | Terminal | Chat
```

The chat becomes a slide-over panel.

STDIN and Output become stacked cards.

------------------------------------------------------------------------

# 15. Performance Requirements

The interface should feel extremely fast.

Avoid unnecessary animations.

Target:

-   Instant navigation
-   No layout jumps
-   Minimal JavaScript for visual effects
-   CSS transitions under 180ms
-   Lazy-load secondary features
-   Avoid large decorative assets

Preferred transition:

``` css
transition:
  background-color 140ms ease,
  border-color 140ms ease,
  color 140ms ease,
  opacity 140ms ease;
```

Do not animate entire panels unnecessarily.

------------------------------------------------------------------------

# 16. Animation Philosophy

Animation should communicate state, not decorate the interface.

Allowed:

-   Button press feedback
-   Panel transitions
-   Chat message appearance
-   Connection status transition
-   Dropdown opening
-   Tooltip fade

Avoid:

-   Floating elements
-   Gradient animations
-   Neon pulses
-   Constant moving backgrounds
-   Parallax
-   Excessive spring animations

------------------------------------------------------------------------

# 17. Dark Mode

Dark mode can exist, but it should be a separate carefully designed
theme.

Do NOT simply invert the light theme.

Dark mode should use near-black charcoal surfaces:

``` text
Background: #11110F
Surface:    #181815
Border:     #2A2925
Text:       #F5F4EF
Secondary:  #A8A59E
Accent:     #E87924
```

No purple/blue neon.

------------------------------------------------------------------------

# 18. UX Principles

The redesign must follow these rules:

### 1. Code first

The editor gets the most visual weight.

### 2. Collaboration second

Chat is always available but should not compete with the editor.

### 3. Actions are obvious

There should be one obvious primary action:

**Run Code**

### 4. Remove visual noise

If an element does not help the user code, collaborate, execute, or
share, question whether it belongs.

### 5. No dashboard feeling

CodeSync is a workspace, not an analytics dashboard.

### 6. No fake complexity

Do not add:

-   AI assistants
-   Floating command centers
-   Decorative metrics
-   Fake activity feeds
-   Unnecessary badges

unless they provide real functionality.

------------------------------------------------------------------------

# 19. Component Architecture

Suggested UI components:

``` text
CodeSyncApp
├── TopBar
│   ├── Brand
│   ├── SessionId
│   ├── LanguageSelector
│   ├── ThemeSelector
│   ├── SyncStatus
│   ├── RunButton
│   └── ShareButton
│
├── Sidebar
│   ├── EditorNav
│   ├── ChatNav
│   ├── FilesNav
│   ├── SettingsNav
│   └── CollaboratorsNav
│
├── Workspace
│   ├── EditorPanel
│   │   ├── EditorTabs
│   │   ├── EditorToolbar
│   │   └── CodeEditor
│   │
│   └── BottomPanels
│       ├── StdinPanel
│       └── OutputPanel
│
└── ChatPanel
    ├── ChatHeader
    ├── MessageList
    └── ChatComposer
```

Keep components modular and replaceable.

------------------------------------------------------------------------

# 20. Final Design Test

Before considering the redesign complete, ask:

-   Does it look premium without relying on gradients?
-   Does it look good in a screenshot?
-   Is the editor immediately recognizable as the primary workspace?
-   Can a user understand Run, Share, Sync, Chat and Input within
    seconds?
-   Is the orange/saffron accent restrained?
-   Does it feel closer to Apple than a generic SaaS template?
-   Is there enough whitespace?
-   Are borders and shadows subtle?
-   Does anything feel unnecessarily decorative?
-   Would the UI still look good with all icons removed?
-   Does it feel fast?

If the answer to any of these is no, simplify.

------------------------------------------------------------------------

# Design North Star

> **CodeSync should feel like a beautifully engineered tool, not a
> website.**

The visual identity should come from **spacing, typography, hierarchy,
precision and restraint**, not effects.
