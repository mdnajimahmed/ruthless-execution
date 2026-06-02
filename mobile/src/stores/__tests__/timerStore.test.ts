import { useTimerStore } from '../timerStore';

const INITIAL_STATE = {
  activeTaskId: null,
  activeTaskType: null,
  activeTaskTitle: '',
  allocatedMinutes: null,
  startedAt: null,
  hasBeepedAtFive: false,
  hasBeepedAtEnd: false,
};

beforeEach(() => {
  useTimerStore.setState(INITIAL_STATE);
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('timerStore — start()', () => {
  it('sets task fields and resets beep flags', () => {
    useTimerStore.setState({ hasBeepedAtFive: true, hasBeepedAtEnd: true });

    useTimerStore.getState().start({
      taskId: 'abc',
      taskType: 'goal',
      taskTitle: 'Write tests',
      allocatedMinutes: 25,
    });

    const state = useTimerStore.getState();
    expect(state.activeTaskId).toBe('abc');
    expect(state.activeTaskType).toBe('goal');
    expect(state.activeTaskTitle).toBe('Write tests');
    expect(state.allocatedMinutes).toBe(25);
    expect(state.startedAt).not.toBeNull();
    expect(state.hasBeepedAtFive).toBe(false);
    expect(state.hasBeepedAtEnd).toBe(false);
  });

  it('records startedAt as the current timestamp', () => {
    const before = Date.now();
    useTimerStore.getState().start({ taskId: 'x', taskType: 'goal', taskTitle: 'T', allocatedMinutes: 10 });
    const after = Date.now();

    const { startedAt } = useTimerStore.getState();
    expect(startedAt).toBeGreaterThanOrEqual(before);
    expect(startedAt).toBeLessThanOrEqual(after);
  });
});

describe('timerStore — stop()', () => {
  it('clears all task state and returns elapsed minutes', () => {
    useTimerStore.getState().start({ taskId: 'y', taskType: 'eisenhower', taskTitle: 'Focus', allocatedMinutes: 30 });

    jest.advanceTimersByTime(90 * 1000); // 90 seconds = 1.5 minutes → rounds to 2

    const { elapsedMinutes } = useTimerStore.getState().stop();
    expect(elapsedMinutes).toBe(2);

    const state = useTimerStore.getState();
    expect(state.activeTaskId).toBeNull();
    expect(state.startedAt).toBeNull();
    expect(state.allocatedMinutes).toBeNull();
    expect(state.hasBeepedAtFive).toBe(false);
  });
});

describe('timerStore — getElapsedSeconds()', () => {
  it('returns 0 when timer is not running', () => {
    expect(useTimerStore.getState().getElapsedSeconds()).toBe(0);
  });

  it('returns seconds elapsed since start', () => {
    useTimerStore.getState().start({ taskId: 'z', taskType: 'goal', taskTitle: 'T', allocatedMinutes: 5 });

    jest.advanceTimersByTime(45 * 1000);
    expect(useTimerStore.getState().getElapsedSeconds()).toBe(45);

    jest.advanceTimersByTime(15 * 1000);
    expect(useTimerStore.getState().getElapsedSeconds()).toBe(60);
  });
});

describe('timerStore — isRunning()', () => {
  it('returns false before start', () => {
    expect(useTimerStore.getState().isRunning()).toBe(false);
  });

  it('returns true after start and false after stop', () => {
    useTimerStore.getState().start({ taskId: 'r', taskType: 'goal', taskTitle: 'T', allocatedMinutes: 10 });
    expect(useTimerStore.getState().isRunning()).toBe(true);

    useTimerStore.getState().stop();
    expect(useTimerStore.getState().isRunning()).toBe(false);
  });
});
