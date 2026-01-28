import { renderHook, act } from '@testing-library/react';
import { useClickOutside } from '@/hooks/useClickOutside';
import React from 'react';

describe('useClickOutside', () => {
  it('should return a ref', () => {
    const handler = jest.fn();
    const { result } = renderHook(() => useClickOutside(handler));

    expect(result.current).toHaveProperty('current');
  });

  it('should call handler when clicking outside', () => {
    const handler = jest.fn();
    const { result } = renderHook(() => useClickOutside(handler));

    // Create a div and attach the ref
    const div = document.createElement('div');
    result.current.current = div;

    act(() => {
      const event = new MouseEvent('mousedown', { bubbles: true });
      document.dispatchEvent(event);
    });

    expect(handler).toHaveBeenCalled();
  });

  it('should not call handler when clicking inside', () => {
    const handler = jest.fn();
    const { result } = renderHook(() => useClickOutside(handler));

    const div = document.createElement('div');
    result.current.current = div;

    act(() => {
      const event = new MouseEvent('mousedown', { bubbles: true });
      div.dispatchEvent(event);
    });

    expect(handler).not.toHaveBeenCalled();
  });

  it('should use mouseup when specified', () => {
    const handler = jest.fn();
    const { result } = renderHook(() => useClickOutside(handler, 'mouseup'));

    const div = document.createElement('div');
    result.current.current = div;

    act(() => {
      const event = new MouseEvent('mouseup', { bubbles: true });
      document.dispatchEvent(event);
    });

    expect(handler).toHaveBeenCalled();
  });

  it('should handle touch events', () => {
    const handler = jest.fn();
    const { result } = renderHook(() => useClickOutside(handler));

    // Create a div and attach the ref
    const div = document.createElement('div');
    result.current.current = div;

    act(() => {
      const event = new TouchEvent('touchstart', { bubbles: true });
      document.body.appendChild(div);
      // Make sure target is outside the ref
      Object.defineProperty(event, 'target', { value: document.body, writable: false });
      document.dispatchEvent(event);
      document.body.removeChild(div);
    });

    expect(handler).toHaveBeenCalled();
  });

  it('should cleanup listeners on unmount', () => {
    const handler = jest.fn();
    const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');

    const { unmount } = renderHook(() => useClickOutside(handler));

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('touchstart', expect.any(Function));
  });
});
