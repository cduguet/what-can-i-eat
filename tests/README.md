# Test Suite

This directory contains both unit tests (Jest) and manual integration tests (Node scripts) for the "What Can I Eat" application.

## Structure

```
tests/
├── assets/                      # Test images and fixtures
├── manual/
│   └── comprehensive-integration-test.js  # Canonical integration runner
├── integration/                 # (Legacy) Jest-style integration tests (not run by default)
└── README.md
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

### Unit Tests (Jest)
```bash
# Run all unit tests (limited to src/**)
npm test
# Run with coverage
npm run test:coverage
```

### Manual Integration Tests
Canonical runner: `tests/manual/comprehensive-integration-test.js`

Usage examples:
```bash
# Default run (text + image, all providers/backends)
node tests/manual/comprehensive-integration-test.js

# Use strict app SYSTEM_PROMPT for image tests against Vertex via Supabase
node tests/manual/comprehensive-integration-test.js \
  --provider=vertex --backend=supabase --mode=image --strict-system-prompt \
  --image=tests/assets/test_menu.jpg

# Run only text mode for Gemini via Supabase
node tests/manual/comprehensive-integration-test.js --provider=gemini --backend=supabase --mode=text
```

Flags:
- `--provider=gemini|vertex|all` (default: all)
- `--backend=local|supabase|all` (default: all)
- `--mode=text|image|both` (default: both)
- `--image=/path/to/image` (default: `tests/assets/test_menu.jpg`)
- `--strict-system-prompt` Include the app’s SYSTEM_PROMPT + dietary context + analysis instructions in image requests (matches production behavior)

### Test Results
Typical outcomes on the bundled test image:
- Vertex+Supabase (strict prompt): ~30 items detected from image

## Test Configuration
Jest is configured in `jest.config.js` and limited to `src/**`.
React Native/Expo shims are provided in `jest.setup.js`.

## Mock Data

The test suite uses mock data to simulate:
- Camera image captures
- OCR text extraction results
- Gemini API responses
- Database interactions

Mock data is stored in the `utils/` directory and can be customized for different test scenarios.

## Test Framework Usage

### Jest Tests (Unit Tests)
- **Location**: `src/**/__tests__/` directories
- **Purpose**: Unit testing for services, utilities, and components
- **Framework**: Jest with TypeScript support (ts-jest)
- **Run with**: `npm test`

### Manual Integration Scripts
- **Location**: `tests/manual/`
- **Purpose**: Real API testing and integration validation against Supabase/Gemini/Vertex
- **Framework**: Plain Node.js
- **Run with**: `node tests/manual/comprehensive-integration-test.js`

This dual approach allows:
- Fast, mocked unit tests for development
- Real API integration tests for validation
- Flexibility in testing different scenarios

## Best Practices

1. **Test Organization**: Place tests close to the code they test, using the `__tests__/` directory pattern for unit tests
2. **Mocking**: Use mocks for external dependencies (APIs, databases, file system)
3. **Fixtures**: Use test fixtures for consistent test data
4. **Coverage**: Aim for high test coverage, especially for critical paths
5. **Isolation**: Ensure tests are independent and can run in any order

## Existing Test Files
- `src/services/api/__tests__/*` (unit tests)
- `tests/manual/comprehensive-integration-test.js` (integration)

## Multimodal vs OCR Approach

### 🚀 New Multimodal Approach (Recommended)
- **Direct image analysis** with Gemini's multimodal API
- **Better accuracy** - AI sees layout, formatting, and visual context
- **Faster processing** - Single API call
- **No OCR preprocessing** required
- **Test**: `node tests/multimodal/testGeminiMultimodal.js`

### 📜 Legacy OCR Approach (Deprecated)
Image → OCR → Text → Analysis is deprecated in favor of multimodal.
See `src/services/ocr/DEPRECATED.md` for the migration notes.

## Adding New Tests

When adding new tests:

1. Follow the existing naming convention: `*.test.(js|ts|tsx)`
2. Place unit tests in `__tests__/` directories next to the code they test
3. Place integration tests in `tests/integration/`
4. Place multimodal tests in `tests/multimodal/`
5. Add test assets to `tests/assets/`
6. Update this README if the structure changes

## Consolidation Notes
- Deprecated/duplicated scripts removed:
  - `tests/manual/comprehensive-ai-test.js`
  - `tests/manual/test-image-analysis.js`
  - `tests/manual/test-vertex-credentials.js`

## Continuous Integration

Tests are designed to run in CI/CD pipelines with:
- Automated test execution on code changes
- Coverage reporting
- Test result notifications
- Parallel test execution where possible
