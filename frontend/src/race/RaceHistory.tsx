import { useAtom, useAtomValue } from 'jotai';
import { Link } from '@tanstack/react-router';
import { LapsView } from './LapsView.tsx';
import { RaceNumber } from './RaceNumber.tsx';
import { filteredCompletedRacesAtom, raceHistoryPilotFilterAtom } from './race-history-atoms.ts';
import { pilotsAtom } from '../state/pbAtoms.ts';
import { GenericSuspense } from '../common/GenericSuspense.tsx';
import './RaceHistory.css';

function PilotFilter() {
	const pilots = useAtomValue(pilotsAtom);
	const [selectedPilotIds, setSelectedPilotIds] = useAtom(raceHistoryPilotFilterAtom);
	const selectedSet = new Set(selectedPilotIds);

	const sortedPilots = [...pilots].sort((a, b) => a.name.localeCompare(b.name));

	const toggle = (pilotId: string) => {
		const next = new Set(selectedSet);
		if (next.has(pilotId)) {
			next.delete(pilotId);
		} else {
			next.add(pilotId);
		}
		setSelectedPilotIds(Array.from(next).sort());
	};

	return (
		<div className='race-history-filter'>
			<div className='race-history-filter-label'>Filter by pilot:</div>
			<div className='race-history-filter-chips'>
				{sortedPilots.map((pilot) => (
					<button
						key={pilot.id}
						type='button'
						className={'race-history-chip' + (selectedSet.has(pilot.id) ? ' active' : '')}
						onClick={() => toggle(pilot.id)}
					>
						{pilot.name}
					</button>
				))}
				{selectedSet.size > 0 && (
					<button
						type='button'
						className='race-history-chip clear'
						onClick={() => setSelectedPilotIds([])}
					>
						Clear
					</button>
				)}
			</div>
		</div>
	);
}

function RaceList() {
	const races = useAtomValue(filteredCompletedRacesAtom);

	if (races.length === 0) {
		return <div className='race-history-empty'>No completed races found.</div>;
	}

	return (
		<div className='race-history-list'>
			{races.map((race) => (
				<div key={race.id} className='race-box last-race'>
					<div className='race-header'>
						<RaceNumber raceId={race.id} />
					</div>
					<LapsView raceId={race.id} />
				</div>
			))}
		</div>
	);
}

export function RaceHistory() {
	return (
		<div className='race-history-page'>
			<div className='race-history-header'>
				{/* @ts-ignore - TanStack Router type issue, see https://github.com/denoland/deno/issues/30444 */}
				<Link to='/' className='race-history-back'>
					&larr; Dashboard
				</Link>
				<h2>Race History</h2>
			</div>
			<GenericSuspense id='race-history-filter'>
				<PilotFilter />
			</GenericSuspense>
			<GenericSuspense id='race-history-list'>
				<RaceList />
			</GenericSuspense>
		</div>
	);
}
