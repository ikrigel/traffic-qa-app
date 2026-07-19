# Contributing to Traffic Laws Q&A App

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing.

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Help others learn and grow
- Report issues responsibly

## Getting Started

### 1. Fork and Clone

```bash
git clone https://github.com/yourusername/traffic-qa-app.git
cd traffic-qa-app
npm install
```

### 2. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
```

Use descriptive names:
- `feature/add-spaced-repetition`
- `fix/auth-session-bug`
- `docs/update-readme`
- `refactor/optimize-queries`

## Development Workflow

### Before You Start

1. Check [Issues](https://github.com/yourusername/traffic-qa-app/issues) for existing work
2. Create an issue for your feature/bug if one doesn't exist
3. Comment on the issue to indicate you're working on it

### While Developing

1. **Follow the 250-line rule**: Keep files under 250 lines
   ```bash
   # Check file sizes
   wc -l src/**/*.tsx src/**/*.ts
   ```

2. **Follow code style**:
   ```bash
   npm run format
   npm run lint
   ```

3. **Type safety**:
   ```bash
   npm run type-check
   ```

4. **Test your changes**:
   ```bash
   npm run test
   ```

### Code Standards

#### TypeScript
- Use strict type checking
- No implicit `any`
- Export type definitions
- Document complex types

```typescript
// ✅ Good
interface Question {
  id: number;
  hebrew: string;
  answer: string;
}

export const getQuestion = (id: number): Question | undefined => {
  // implementation
};

// ❌ Bad
export const getQuestion = (id) => {
  // implementation
};
```

#### React Components
- Functional components only
- Use TypeScript for props
- Keep components under 250 lines
- Extract logic to custom hooks

```typescript
// ✅ Good
interface QuestionCardProps {
  question: Question;
  showAnswer: boolean;
  onToggle: (id: number) => void;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  showAnswer,
  onToggle,
}) => {
  // implementation
};

// ❌ Bad
export const QuestionCard = ({ question, showAnswer, onToggle }) => {
  // implementation
};
```

#### Commits
- Use clear, descriptive messages
- Reference issues when applicable
- Keep commits atomic and logical

```bash
# ✅ Good commits
git commit -m "feat: add spaced repetition algorithm (fixes #123)"
git commit -m "fix: resolve session expiry issue"
git commit -m "docs: update installation instructions"

# ❌ Bad commits
git commit -m "fix stuff"
git commit -m "WIP"
```

### Testing

Write tests for:
- Utility functions
- Custom hooks
- Component interactions
- API routes

```bash
# Run specific test file
npm run test -- QuestionCard.test.tsx

# Watch mode
npm run test -- --watch

# Coverage
npm run test:coverage
```

Test file naming: `ComponentName.test.tsx` or `utils.test.ts`

### Documentation

- Update README.md if adding features
- Add JSDoc comments for complex functions
- Update CLAUDE.md for architecture changes
- Add inline comments only for "why", not "what"

```typescript
// ✅ Good: Explains why
// Check device legitimacy before creating session
// to prevent unauthorized access (security requirement)
const isLegitimateDevice = validateDeviceFingerprint(deviceId);

// ❌ Bad: Explains what (code is self-documenting)
// Check if device is legitimate
const isLegitimateDevice = validateDeviceFingerprint(deviceId);
```

## Pull Request Process

### Before Submitting

1. **Update from main**:
   ```bash
   git fetch origin
   git rebase origin/main
   ```

2. **Run full test suite**:
   ```bash
   npm run lint
   npm run type-check
   npm run test
   npm run build
   ```

3. **Check file sizes**:
   ```bash
   wc -l src/**/*.tsx src/**/*.ts
   ```

### Submitting PR

1. Push to your fork
2. Open Pull Request with descriptive title
3. Fill out PR template
4. Link related issues

### PR Template

```markdown
## Description
Briefly describe what this PR does.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Related Issues
Fixes #123

## Testing
- [ ] Added tests
- [ ] Tests pass locally
- [ ] No console errors

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Updated documentation
- [ ] No new warnings generated
- [ ] Tested on mobile
- [ ] Tested on desktop
```

## Project Structure Guidelines

### Adding a New Component

```
components/
├── MyComponent.tsx          # Main component (< 250 lines)
├── MyComponent.test.tsx     # Tests
└── useMyLogic.ts           # Extracted logic (if needed)
```

### Adding a New Feature

1. Create feature branch
2. Add components in `src/components/`
3. Add hooks in `src/hooks/`
4. Add utilities in `src/lib/`
5. Add types in `src/types/`
6. Add tests in `__tests__/`
7. Update documentation
8. Submit PR

## Performance Considerations

- Minimize re-renders with `memo()` and `useCallback()`
- Lazy load heavy components
- Optimize images
- Code-split where possible
- Monitor bundle size

## Accessibility

- Use semantic HTML
- Add ARIA labels
- Support keyboard navigation
- Maintain color contrast (WCAG AA)
- Test with screen readers

## Security

- Never commit secrets or API keys
- Validate all user input
- Use environment variables for sensitive data
- Follow OWASP guidelines
- Report security issues privately

## Questions or Need Help?

- Comment on related issues
- Start a discussion in GitHub Discussions
- Email: support@traffic-qa-app.example.com

## Recognition

Contributors are recognized in:
- CONTRIBUTORS.md file
- GitHub contributors page
- Release notes

Thank you for contributing to making driving test preparation better! 🚗
