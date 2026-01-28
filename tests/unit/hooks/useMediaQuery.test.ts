import { renderHook, act } from '@testing-library/react';
import { useMediaQuery, useIsMobile, useIsTablet, useIsDesktop } from '@/hooks/useMediaQuery';

describe('useMediaQuery', () => {
  let matchMediaMock: jest.Mock;

  beforeEach(() => {
    matchMediaMock = window.matchMedia as jest.Mock;
  });

  it('should return initial match state', () => {
    matchMediaMock.mockReturnValue({
      matches: true,
      media: '(max-width: 767px)',
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    });

    const { result } = renderHook(() => useMediaQuery('(max-width: 767px)'));
    expect(result.current).toBe(true);
  });

  it('should update on media query change', () => {
    let listener: ((event: MediaQueryListEvent) => void) | null = null;

    matchMediaMock.mockImplementation((query) => ({
      matches: false,
      media: query,
      addEventListener: jest.fn((event, callback) => {
        if (event === 'change') listener = callback as never;
      }),
      removeEventListener: jest.fn(),
    }));

    const { result } = renderHook(() => useMediaQuery('(max-width: 767px)'));
    expect(result.current).toBe(false);

    act(() => {
      listener?.({ matches: true, media: '(max-width: 767px)' } as MediaQueryListEvent);
    });

    expect(result.current).toBe(true);
  });
});

describe('useIsMobile', () => {
  it('should return true for mobile viewport', () => {
    (window.matchMedia as jest.Mock).mockReturnValue({
      matches: true,
      media: '(max-width: 767px)',
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    });

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });
});

describe('useIsTablet', () => {
  it('should return true for tablet viewport', () => {
    (window.matchMedia as jest.Mock).mockReturnValue({
      matches: true,
      media: '(min-width: 768px) and (max-width: 1023px)',
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    });

    const { result } = renderHook(() => useIsTablet());
    expect(result.current).toBe(true);
  });
});

describe('useIsDesktop', () => {
  it('should return true for desktop viewport', () => {
    (window.matchMedia as jest.Mock).mockReturnValue({
      matches: true,
      media: '(min-width: 1024px)',
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    });

    const { result } = renderHook(() => useIsDesktop());
    expect(result.current).toBe(true);
  });
});
