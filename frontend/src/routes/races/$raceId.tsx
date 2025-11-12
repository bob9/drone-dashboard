import { createFileRoute, Link, useRouter } from '@tanstack/react-router';
import { useAtomValue } from 'jotai';
import { raceDataAtom } from '../../race/race-atoms.ts';
import { LapsView } from '../../race/LapsView.tsx';
import { RaceNumber } from '../../race/RaceNumber.tsx';
import { GenericSuspense } from '../../common/GenericSuspense.tsx';

/* @ts-ignore - TanStack Router type issue, see https://github.com/denoland/deno/issues/30444 */
export const Route = createFileRoute('/races/$raceId')({
	component: RaceRouteComponent,
	/* @ts-ignore - TanStack Router type issue, see https://github.com/denoland/deno/issues/30444 */
	params: { parse: (params) => ({ raceId: params.raceId }) },
});

function RaceRouteComponent() {
	const { raceId } = Route.useParams();
	const race = useAtomValue(raceDataAtom(raceId));
	const router = useRouter();

	if (!race) {
		return (
			<div style={{ padding: '2rem', textAlign: 'center' }}>
				<h2>Race not found</h2>
				<p>Race ID: {raceId}</p>
				<button onClick={() => router.history.back()} style={{ marginTop: '1rem', cursor: 'pointer' }}>
					← Back
				</button>
			</div>
		);
	}

	return (
		<div style={{ padding: '1rem', maxWidth: '1400px', margin: '0 auto' }}>
			<div style={{ marginBottom: '1rem' }}>
				<button
					onClick={() => router.history.back()}
					style={{
						background: 'none',
						border: 'none',
						color: '#888',
						cursor: 'pointer',
						fontSize: '1rem',
						padding: '0.5rem',
					}}
				>
					← Back
				</button>
			</div>
			<div className='race-box'>
				<div className='race-header'>
					<h2>Race Details</h2>
					<RaceNumber raceId={raceId} />
				</div>
				<GenericSuspense id={`race-${raceId}`}>
					<LapsView key={raceId} raceId={raceId} />
				</GenericSuspense>
			</div>
		</div>
	);
}
