# Application Architecture

This document explains the internal architecture of the Rust Architecture Builder application itself.

## Technology Stack

```
┌─────────────────────────────────────────┐
│           Next.js 14 (App Router)       │
│                                         │
│  ┌────────────┐      ┌────────────┐   │
│  │   React    │◄────►│ TypeScript │   │
│  └────────────┘      └────────────┘   │
└─────────────────────────────────────────┘
         │                    │
         ▼                    ▼
┌──────────────┐    ┌──────────────────┐
│  React Flow  │    │  Zustand Store   │
│ (Canvas/UI)  │    │ (State Mgmt)     │
└──────────────┘    └──────────────────┘
         │                    │
         ▼                    ▼
┌─────────────────────────────────────────┐
│          Tailwind CSS + Lucide          │
│              (Styling + Icons)          │
└─────────────────────────────────────────┘
```

## Project Structure

```
rust_builder/
│
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout with metadata
│   ├── page.tsx           # Main page component
│   └── globals.css        # Global styles and React Flow overrides
│
├── components/            # React components
│   ├── Header.tsx         # Top navigation bar
│   ├── BlockPalette.tsx   # Left sidebar with draggable blocks
│   ├── BuilderCanvas.tsx  # Main React Flow canvas
│   ├── RustBlockNode.tsx  # Custom node component
│   ├── NodeDetailsPanel.tsx # Right sidebar for editing
│   └── CodePreview.tsx    # Code preview panel
│
├── types/                 # TypeScript definitions
│   └── rust-blocks.ts     # Block types and templates
│
├── store/                 # State management
│   └── useBuilderStore.ts # Zustand store
│
├── utils/                 # Utility functions
│   └── codeGenerator.ts   # Rust code generation
│
├── public/                # Static assets
│   └── robots.txt
│
└── config files           # Configuration
    ├── package.json
    ├── tsconfig.json
    ├── tailwind.config.ts
    ├── next.config.js
    ├── postcss.config.js
    └── .eslintrc.json
```

## Component Hierarchy

```
App (page.tsx)
├── Header
│   └── Action Buttons (Export, Clear, Preview)
│
├── BlockPalette (Left Sidebar)
│   └── Draggable Block Templates
│
├── BuilderCanvas (Main Area)
│   ├── React Flow
│   │   ├── Background
│   │   ├── Controls
│   │   ├── MiniMap
│   │   └── Multiple RustBlockNodes
│   │       └── Handles (connection points)
│   │
│   └── NodeDetailsPanel (Conditional)
│       ├── Tabs (Basic, Fields, Methods, Advanced)
│       └── Form inputs
│
└── CodePreview (Right Sidebar - Conditional)
    ├── Generated Code Display
    └── Copy Button
```

## Data Flow

### 1. Adding a Block

```
User drags block from palette
        ↓
onDrop event in BuilderCanvas
        ↓
addNode() in Zustand store
        ↓
nodes array updated
        ↓
React Flow re-renders with new node
```

### 2. Editing a Block

```
User clicks on node
        ↓
setSelectedNode() in store
        ↓
NodeDetailsPanel renders
        ↓
User edits fields
        ↓
updateNode() in store
        ↓
Node data updated
        ↓
RustBlockNode re-renders
```

### 3. Code Generation

```
User clicks "Preview Code"
        ↓
CodePreview component renders
        ↓
generateRustCode(nodes, edges)
        ↓
Code generated from templates
        ↓
Display in preview panel
```

### 4. Connecting Blocks

```
User drags from handle
        ↓
onConnect() in React Flow
        ↓
Edge added to store
        ↓
Visual connection drawn
        ↓
Used in code generation for relationships
```

## State Management (Zustand)

```typescript
BuilderStore {
  // State
  nodes: Node<RustBlock>[]     // All blocks on canvas
  edges: Edge[]                // Connections between blocks
  selectedNode: Node | null    // Currently selected block

  // Actions
  addNode()         // Add new block
  updateNode()      // Update block data
  deleteNode()      // Remove block
  setSelectedNode() // Select/deselect block
  onNodesChange()   // Handle React Flow node changes
  onEdgesChange()   // Handle React Flow edge changes
  onConnect()       // Handle new connections
  clearAll()        // Reset everything
}
```

## React Flow Integration

React Flow provides:

- **Canvas**: Infinite panning/zooming canvas
- **Nodes**: Custom components (RustBlockNode)
- **Edges**: Connections with handles
- **Controls**: Zoom, pan, fit view
- **MiniMap**: Overview of canvas
- **Background**: Grid/dots background

Custom node type:

```typescript
const nodeTypes = {
  rustBlock: RustBlockNode, // Maps to our custom component
}
```

## Code Generation Strategy

### Template-Based Generation

1. **Group by Type**: Separate nodes by Rust construct type
2. **Generate Headers**: Add common imports and comments
3. **Generate Each Type**: Use specific generators for each
4. **Handle Relationships**: Use edges to determine impl connections
5. **Format Output**: Pretty-print with proper indentation

### Generators

- `generateStruct()` - Struct definitions with fields
- `generateEnum()` - Enum definitions with variants
- `generateTrait()` - Trait definitions with methods
- `generateImpl()` - Implementation blocks
- `generateFunction()` - Free functions
- `generateConst()` - Constant declarations
- `generateTypeAlias()` - Type aliases
- `generateMacro()` - Macro definitions
- `generateModule()` - Module declarations

## Styling Approach

### Tailwind CSS Utility Classes

- Rapid prototyping
- Consistent design system
- Responsive by default
- Small bundle size

### Custom CSS for React Flow

Global overrides in `app/globals.css`:

- Node styling
- Handle styling
- Edge styling
- Selection states

## Type Safety

TypeScript ensures:

- Valid block types
- Correct data structures
- Type-safe props
- IntelliSense support

Key type definitions:

```typescript
RustBlockType // Union of valid block types
RustBlock // Main block data structure
BlockTemplate // Block palette item
;(Field, Method, etc) // Sub-structures
```

## Performance Considerations

### Optimizations

1. **React.memo**: RustBlockNode memoized to prevent unnecessary re-renders
2. **Zustand**: Efficient state updates with selective subscriptions
3. **React Flow**: Built-in optimization for large graphs
4. **Tailwind**: Purged CSS for production builds

### Scalability

The application can handle:

- Hundreds of blocks on canvas
- Complex connection graphs
- Real-time code generation
- Large generated code outputs

## Extension Points

To extend the application:

### Add New Block Type

1. Add to `RustBlockType` in `types/rust-blocks.ts`
2. Add template to `BLOCK_TEMPLATES`
3. Create generator in `utils/codeGenerator.ts`
4. Update UI if special rendering needed

### Add New Feature

1. Add state to `useBuilderStore.ts` if needed
2. Create/modify components
3. Add UI controls
4. Update code generator if affects output

### Customize Styling

1. Modify `tailwind.config.ts` for theme
2. Update component classes
3. Add custom CSS in `globals.css`

## Security Considerations

- No backend/database (client-only)
- No user data stored remotely
- Code generated locally
- No external API calls
- Safe for sensitive projects

## Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- ES2017+ JavaScript features
- CSS Grid and Flexbox
- Drag and Drop API

## Future Architecture Ideas

- [ ] WebAssembly for faster code generation
- [ ] IndexedDB for local project storage
- [ ] Web Workers for background processing
- [ ] Service Worker for offline support
- [ ] WebRTC for collaborative editing

---

**Last Updated**: November 2024  
**Version**: 0.1.0
