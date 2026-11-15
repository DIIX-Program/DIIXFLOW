let attemptCount = 0;

/**
 * Test executor used for validating Step Functions retry behavior in integration tests.
 * Fails twice with 'TemporaryNetworkGlitch', succeeds on the 3rd invocation.
 */
export async function handler(event: { resetAttempts?: boolean }) {
  if (event.resetAttempts) {
    attemptCount = 0;
    return { status: 'RESET', attemptCount: 0 };
  }

  attemptCount++;
  console.log(`[TestRetryExecutor] Invocation attempt #${attemptCount}`);

  if (attemptCount < 3) {
    const error = new Error(`Simulated temporary transient error (attempt #${attemptCount})`);
    error.name = 'TemporaryNetworkGlitch';
    throw error;
  }

  return {
    status: 'SUCCEEDED',
    totalAttempts: attemptCount,
    message: 'Successfully recovered after retries.',
  };
}
