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
- **test_menu.jpg** (180KB) - Real menu image for multimodal testing
- Mock data files
- Test fixtures

### `multimodal/`
Tests specifically for multimodal functionality:
- ✅ **Direct image analysis** with Gemini's multimodal API (recommended)
- ⚠️ OCR text extraction validation (deprecated)
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
# Text-only Gemini API integration test
node tests/integration/testGemini.js
```

### Multimodal Tests (Recommended)
```bash
# Multimodal Gemini API integration test (image + text)
node tests/multimodal/testGeminiMultimodal.js

# Note: Jest tests have React Native compatibility issues
# Use Node.js integration tests for reliable testing
```

### Test Results
Recent multimodal test results:
- **Vegan Analysis**: 24 items detected (5 good, 6 careful, 13 avoid)
- **Vegetarian Analysis**: 18 items detected (16 good, 2 careful, 0 avoid)
- **Processing**: Direct image analysis without OCR preprocessing

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
- `tests/integration/testGemini.js` - Integration test for Gemini API (text-only)
- `tests/multimodal/testGeminiMultimodal.js` - **Multimodal integration test** (image + text)
- `tests/multimodal/geminiMultimodal.test.ts` - Jest tests for multimodal API (TypeScript)

## Multimodal vs OCR Approach

### 🚀 New Multimodal Approach (Recommended)
- **Direct image analysis** with Gemini's multimodal API
- **Better accuracy** - AI sees layout, formatting, and visual context
- **Faster processing** - Single API call
- **No OCR preprocessing** required
- **Test**: `node tests/multimodal/testGeminiMultimodal.js`

### 📜 Legacy OCR Approach (Deprecated)
- Image → OCR → Text → Analysis pipeline
- **Deprecated** in favor of multimodal approach
- See `src/services/ocr/DEPRECATED.md` for migration guide

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