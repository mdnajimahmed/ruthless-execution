import { renderHook, act } from '@testing-library/react-native';
import { useTimer } from '../useTimer';
import { useTimerStore } from '@/stores/timerStore';

const mockPlay = jest.fn();
const mockSeekTo = jest.fn();

jest.mock('expo-audio', () => ({
  useAudioPlayer: jest.fn(() => ({ seekTo: mockSeekTo, play: mockPlay })),
}));

jest.mock('expo-keep-awake', () => ({
  activateKeepAwakeAsync: jest.fn(),
  deactivateKeepAwake: jest.fn(),
}));

const INITIAL_STATE = {
  activeTaskId: null,
  activeTaskType: null,
  activeTaskTitle: '',
  allocatedMinutes: null,
  startedAt: null,
  hasBeepedAtFive: false,
  hasBeepedAtEnd: false,
};

function startTimer(allocatedMinutes: number) {
  useTimerStore.getState().start({
    taskId: 'test-task',
    taskType: 'goal',
    taskTitle: 'Test Goal',
    allocatedMinutes,
  });
}

beforeEach(() => {
  jest.useFakeTimers();
  mockPlay.mockClear();
  mockSeekTo.mockClear();
  useTimerStore.setState(INITIAL_STATE);
});

afterEach(() => {
  jest.useRealTimers();
});

describe('useTimer — beep/alert feature', () => {
  it('does not play alert before the 2-minute threshold', () => {
    startTimer(10);
    const { unmount } = renderHook(() => useTimer());

    // 10 min timer: threshold at 480s. Advance to 479s — should be silent.
    act(() => jest.advanceTimersByTime(479 * 1000));

    expect(mockPlay).not.toHaveBeenCalled();
    unmount();
  });

  it('plays alert when elapsed time reaches the 2-minute threshold', () => {
    startTimer(10); // threshold = 10*60 - 120 = 480s
    const { unmount } = renderHook(() => useTimer());

    act(() => jest.advanceTimersByTime(480 * 1000));

    expect(mockSeekTo).toHaveBeenCalledWith(0);
    expect(mockPlay).toHaveBeenCalledTimes(1);
    unmount();
  });

  it('plays alert exactly once — not on every subsequent tick', () => {
    startTimer(10);
    const { unmount } = renderHook(() => useTimer());

    // Cross the threshold
    act(() => jest.advanceTimersByTime(480 * 1000));
    expect(mockPlay).toHaveBeenCalledTimes(1);

    // Advance 60 more seconds — should NOT play again
    act(() => jest.advanceTimersByTime(60 * 1000));
    expect(mockPlay).toHaveBeenCalledTimes(1);

    unmount();
  });

  it('does not play alert when no allocatedMinutes is set', () => {
    useTimerStore.getState().start({
      taskId: 'no-alloc',
      taskType: 'goal',
      taskTitle: 'No Alloc',
      allocatedMinutes: null,
    });
    const { unmount } = renderHook(() => useTimer());

    act(() => jest.advanceTimersByTime(600 * 1000));

    expect(mockPlay).not.toHaveBeenCalled();
    unmount();
  });

  it('does not play alert when timer has not started', () => {
    // startedAt is null — effect bails out early
    const { unmount } = renderHook(() => useTimer());

    act(() => jest.advanceTimersByTime(600 * 1000));

    expect(mockPlay).not.toHaveBeenCalled();
    unmount();
  });

  it('does not play alert when threshold would be <= 0 (allocatedMinutes <= 2)', () => {
    startTimer(2); // threshold = 2*60 - 120 = 0, condition requires > 0
    const { unmount } = renderHook(() => useTimer());

    act(() => jest.advanceTimersByTime(200 * 1000));

    expect(mockPlay).not.toHaveBeenCalled();
    unmount();
  });

  it('sets hasBeepedAtFive in the store after the alert fires', () => {
    startTimer(10);
    const { unmount } = renderHook(() => useTimer());

    act(() => jest.advanceTimersByTime(480 * 1000));

    expect(useTimerStore.getState().hasBeepedAtFive).toBe(true);
    unmount();
  });

  it('activates keep-awake on start and deactivates on unmount', () => {
    const { activateKeepAwakeAsync, deactivateKeepAwake } = require('expo-keep-awake');

    startTimer(10);
    const { unmount } = renderHook(() => useTimer());

    expect(activateKeepAwakeAsync).toHaveBeenCalled();

    unmount();
    expect(deactivateKeepAwake).toHaveBeenCalled();
  });

  it('clears interval and deactivates keep-awake when unmounted mid-run', () => {
    const { deactivateKeepAwake } = require('expo-keep-awake');

    startTimer(10);
    const { unmount } = renderHook(() => useTimer());

    act(() => jest.advanceTimersByTime(100 * 1000));
    unmount();

    // Advance more time after unmount — no additional beeps
    act(() => jest.advanceTimersByTime(400 * 1000));
    expect(mockPlay).not.toHaveBeenCalled();
    expect(deactivateKeepAwake).toHaveBeenCalled();
  });
});
