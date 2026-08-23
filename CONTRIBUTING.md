# Contributing to Rust Architecture Builder

Thank you for your interest in contributing! This document provides guidelines and information for contributors.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone <your-fork-url>`
3. Install dependencies: `npm install`
4. Create a new branch: `git checkout -b feature/your-feature-name`
5. Make your changes
6. Test your changes: `npm run dev`
7. Commit your changes: `git commit -m "Add your feature"`
8. Push to your fork: `git push origin feature/your-feature-name`
9. Open a Pull Request

## Development Guidelines

### Code Style

- Follow the existing code style
- Use TypeScript for type safety
- Write meaningful commit messages
- Add comments for complex logic
- Keep components small and focused

### Component Structure

```
components/
  ├── ComponentName.tsx    # Component logic and JSX
  └── README.md           # Component documentation (optional)
```

### Adding New Block Types

To add a new Rust block type:

1. Add the type to `RustBlockType` in `types/rust-blocks.ts`
2. Add a template to `BLOCK_TEMPLATES` array
3. Update the code generator in `utils/codeGenerator.ts`
4. Add rendering logic to `RustBlockNode.tsx` if needed

### Testing Changes

Before submitting a PR:

1. Run the development server and test manually
2. Check for TypeScript errors: `npm run build`
3. Check for linting errors: `npm run lint`
4. Test the code generation feature
5. Verify all block types work correctly

## Areas for Contribution

Here are some areas where contributions are especially welcome:

### Features

- [ ] Add undo/redo functionality
- [ ] Add keyboard shortcuts
- [ ] Support for multiple files/modules
- [ ] Import existing Rust code to visualize
- [ ] Export to Cargo.toml format
- [ ] Add templates for common patterns
- [ ] Add zoom and pan controls
- [ ] Add search functionality
- [ ] Add comments/notes to canvas
- [ ] Support for generics in types

### Code Quality

- [ ] Add unit tests
- [ ] Add integration tests
- [ ] Improve error handling
- [ ] Add loading states
- [ ] Improve accessibility
- [ ] Add dark mode support
- [ ] Optimize performance

### Documentation

- [ ] Add video tutorials
- [ ] Add more examples
- [ ] Improve API documentation
- [ ] Add troubleshooting guide
- [ ] Translate documentation

## Code Review Process

1. All PRs require at least one review
2. Address review comments promptly
3. Keep PRs focused on a single feature/fix
4. Update documentation as needed
5. Ensure CI passes before requesting review

## Questions?

Feel free to open an issue for:

- Bug reports
- Feature requests
- Questions about implementation
- General feedback

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
