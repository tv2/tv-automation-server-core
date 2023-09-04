export class ExhaustiveCaseChecker {
	/*
	 * This is one of the rare methods that are allowed to be static.
	 *
	 * It's allowed to be static since it verifies at compile time that we are not missing e.g. a switch case for an enum.
	 * Since this happens at compile time we would never need to substitute this method, not even in tests, which is what allows this to be static.
	 */
	static assertAllCases(_never: never): void {
		// Type guard
	}
}
