import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from '@/hooks/useLocalStorage';

describe('useLocalStorage', () => {
  const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value;
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        store = {};
      },
    };
  })();

  beforeEach(() => {
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });
    localStorageMock.clear();
  });

  it('should return initial value when localStorage is empty', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'default'));
    const [value] = result.current;

    expect(value).toBe('default');
  });

  it('should return stored value from localStorage', () => {
    localStorageMock.setItem('test-key', JSON.stringify('stored'));
    const { result } = renderHook(() => useLocalStorage('test-key', 'default'));
    const [value] = result.current;

    expect(value).toBe('stored');
  });

  it('should update localStorage when value changes', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'default'));
    const [, setValue] = result.current;

    act(() => {
      setValue('updated');
    });

    const [value] = result.current;
    expect(value).toBe('updated');
    expect(localStorageMock.getItem('test-key')).toBe(JSON.stringify('updated'));
  });

  it('should support functional updates', () => {
    const { result } = renderHook(() => useLocalStorage('count', 0));
    const [, setValue] = result.current;

    act(() => {
      setValue((prev) => prev + 1);
    });

    const [value] = result.current;
    expect(value).toBe(1);
  });

  it('should remove value from localStorage', () => {
    localStorageMock.setItem('test-key', JSON.stringify('stored'));
    const { result } = renderHook(() => useLocalStorage('test-key', 'default'));
    const [, , removeValue] = result.current;

    act(() => {
      removeValue();
    });

    const [value] = result.current;
    expect(value).toBe('default');
    expect(localStorageMock.getItem('test-key')).toBeNull();
  });

  it('should handle complex objects', () => {
    const obj = { name: 'test', count: 42 };
    const { result } = renderHook(() => useLocalStorage('obj-key', { name: '', count: 0 }));
    const [, setValue] = result.current;

    act(() => {
      setValue(obj);
    });

    const [value] = result.current;
    expect(value).toEqual(obj);
  });

  it('should handle parse errors gracefully', () => {
    localStorageMock.setItem('test-key', 'invalid-json');
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const { result } = renderHook(() => useLocalStorage('test-key', 'default'));
    const [value] = result.current;

    expect(value).toBe('default');
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
