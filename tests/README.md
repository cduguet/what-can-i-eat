# Test Suite

This directory contains the test suite for the "What Can I Eat" application, with a focus on testing the multimodal Gemini API approach and related functionality.

## Test Structure

```
tests/
├── assets/           # Test images and data files
├── multimodal/       # Multimodal-specific tests (OCR, image analysis)
├── integration/      # Integration tests (API calls, service interactions)
├── utils/           # Test utilities and helper functions
└── README.md        # This file
```

## Directory Purposes

### `assets/`
Contains test data files including:
- Sample images for OCR testing
- Mock data files
- Test fixtures

### `multimodal/`
Tests specifically for multimodal functionality:
- OCR text extraction validation
- Image analysis capabilities
- Gemini API multimodal responses
- Camera integration tests

### `integration/`
Integration tests that validate:
- API service interactions
- End-to-end workflows
- Service layer integration
- External API calls (Gemini, Supabase)

### `utils/`
Shared test utilities and helpers:
- Mock data generators
- Test setup functions
- Custom matchers
- Common test configurations

## Running Tests

### Prerequisites
- Node.js installed
- Project dependencies installed (`npm install`)
- Environment variables configured (see `.env.example`)

### Unit Tests
```bash
# Run all unit tests
npm test

# Run specific test file
npm test -- tests/multimodal/ocr.test.js

# Run with coverage
npm run test:coverage
```

### Integration Tests
```bash
# Run integration tests only
npm run test:integration

# Run specific integration test
npm test -- tests/integration/testGemini.js
```

### Multimodal Tests
```bash
# Run multimodal-specific tests
npm run test:multimodal
```

## Test Configuration

Tests are configured via `jest.config.js` in the project root. Key settings:
- Test environment: Node.js
- Test files pattern: `**/__tests__/**/*.test.(js|ts|tsx)`
- Setup file: `jest.setup.js`
- Coverage thresholds: 80% for statements, branches, functions, and lines

## Mock Data

The test suite uses mock data to simulate:
- Camera image captures
- OCR text extraction results
- Gemini API responses
- Database interactions

Mock data is stored in the `utils/` directory and can be customized for different test scenarios.

## Best Practices

1. **Test Organization**: Place tests close to the code they test, using the `__tests__/` directory pattern for unit tests
2. **Mocking**: Use mocks for external dependencies (APIs, databases, file system)
3. **Fixtures**: Use test fixtures for consistent test data
4. **Coverage**: Aim for high test coverage, especially for critical paths
5. **Isolation**: Ensure tests are independent and can run in any order

## Existing Test Files

The following test files are currently available:
- `src/services/api/__tests__/geminiService.test.ts` - Unit tests for Gemini service
- `src/services/api/__tests__/supabaseService.test.ts` - Unit tests for Supabase service
- `src/components/results/__tests__/ResultCard.test.tsx` - Component tests for ResultCard
- `src/components/results/__tests__/ResultsSummary.test.tsx` - Component tests for ResultsSummary
- `tests/integration/testGemini.js` - Integration test for Gemini API

## Adding New Tests

When adding new tests:

1. Follow the existing naming convention: `*.test.(js|ts|tsx)`
2. Place unit tests in `__tests__/` directories next to the code they test
3. Place integration tests in `tests/integration/`
4. Place multimodal tests in `tests/multimodal/`
5. Add test assets to `tests/assets/`
6. Update this README if the structure changes

## Continuous Integration

Tests are designed to run in CI/CD pipelines with:
- Automated test execution on code changes
- Coverage reporting
- Test result notifications
- Parallel test execution where possible