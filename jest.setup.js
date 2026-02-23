// Enable Immer plugins for Map/Set support
const { enableMapSet } = require('immer');
enableMapSet();

// Import jest-dom matchers
require('@testing-library/jest-dom');

// Mock CSS modules for reactflow
jest.mock('reactflow/dist/style.css', () => ({}), { virtual: true });

// Mock localStorage for zustand persist middleware
const localStorageMock ={
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Reset mocks before each test
beforeEach(() => {
  localStorageMock.getItem.mockClear();
  localStorageMock.setItem.mockClear();
  localStorageMock.removeItem.mockClear();
  localStorageMock.clear.mockClear();
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock Web API Request and Response for Next.js server components
class MockHeaders {
  constructor(init = {}) {
    this._headers = new Map();
    if (typeof init === 'object') {
      Object.entries(init).forEach(([key, value]) => {
        this._headers.set(key, value);
      });
    }
  }

  append(name, value) {
    this._headers.set(name, value);
  }

  delete(name) {
    this._headers.delete(name);
  }

  get(name) {
    return this._headers.get(name) || null;
  }

  has(name) {
    return this._headers.has(name);
  }

  set(name, value) {
    this._headers.set(name, value);
  }

  entries() {
    return this._headers.entries();
  }

  keys() {
    return this._headers.keys();
  }

  values() {
    return this._headers.values();
  }

  forEach(callback, thisArg) {
    this._headers.forEach((value, key) => {
      callback.call(thisArg, value, key, this);
    });
  }

  get [Symbol.iterator]() {
    return this._headers[Symbol.iterator];
  }
}

class MockRequest {
  constructor(info, init) {
    this.url = typeof info === 'string' ? info : info.url;
    this.method = init?.method || 'GET';
    this.headers = init?.headers instanceof MockHeaders ? init.headers : new MockHeaders(init?.headers);
    this.body = init?.body;
    this._jsonBody = null;
  }

  async json() {
    if (this._jsonBody) return this._jsonBody;
    if (typeof this.body === 'string') {
      this._jsonBody = JSON.parse(this.body);
    } else {
      this._jsonBody = this.body;
    }
    return this._jsonBody;
  }

  async text() {
    if (typeof this.body === 'string') return this.body;
    return JSON.stringify(this.body);
  }

  async blob() {
    return new Blob([this.body]);
  }

  async arrayBuffer() {
    return new TextEncoder().encode(await this.text()).buffer;
  }

  clone() {
    const clone = new MockRequest(this.url, {
      method: this.method,
      headers: this.headers,
      body: this.body,
    });
    clone._jsonBody = this._jsonBody;
    return clone;
  }
}

class MockResponse {
  constructor(body, init = {}) {
    this.status = init.status || 200;
    this.statusText = init.statusText || 'OK';
    this.headers = init?.headers instanceof MockHeaders ? init.headers : new MockHeaders(init?.headers);
    this._body = body;
    this._bodyUsed = false;
  }

  async json() {
    this._bodyUsed = true;
    if (typeof this._body === 'string') {
      return JSON.parse(this._body);
    }
    return this._body;
  }

  async text() {
    this._bodyUsed = true;
    if (typeof this._body === 'string') return this._body;
    return JSON.stringify(this._body);
  }

  async blob() {
    this._bodyUsed = true;
    return new Blob([this._body]);
  }

  async arrayBuffer() {
    this._bodyUsed = true;
    return new TextEncoder().encode(await this.text()).buffer;
  }

  get bodyUsed() {
    return this._bodyUsed;
  }

  clone() {
    return new MockResponse(this._body, {
      status: this.status,
      statusText: this.statusText,
      headers: this.headers,
    });
  }

  static redirect(url, status = 302) {
    return new MockResponse(null, {
      status,
      headers: { Location: url },
    });
  }

  static json(data, init = {}) {
    return new MockResponse(JSON.stringify(data), {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...init.headers,
      },
    });
  }
}

global.Request = MockRequest;
global.Response = MockResponse;
global.Headers = MockHeaders;

// Mock next/server to use our mocks
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, init) => MockResponse.json(data, init)),
    redirect: jest.fn((url, status) => MockResponse.redirect(url, status)),
  },
  NextRequest: MockRequest,
}));
