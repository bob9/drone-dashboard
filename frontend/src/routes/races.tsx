import { createFileRoute } from '@tanstack/react-router';
import { RaceHistory } from '../race/RaceHistory.tsx';

// @ts-ignore - TanStack Router type issue, see https://github.com/denoland/deno/issues/30444
export const Route = createFileRoute('/races')({
	component: RaceHistory,
});
