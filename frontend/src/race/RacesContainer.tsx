import { useAtomValue } from 'jotai';
// @ts-ignore - TanStack Router type issue, see https://github.com/denoland/deno/issues/30444
import { Link } from '@tanstack/react-router';
import { LapsView } from './LapsView.tsx';
import RaceTime from './RaceTime.tsx';
import { currentRaceAtom, lastRacesAtom } from './race-atoms.ts';
import { NextRaceCompact } from './NextRaceCompact.tsx';
import { nextRaceEntriesAtom } from './next-race-entries.ts';
import { RaceNumber } from './RaceNumber.tsx';
import { FinalsRacePanel } from './FinalsRacePanel.tsx';
import { computeRaceStatus } from './race-types.ts';

export function RacesContainer() {
	const currentRace = useAtomValue(currentRaceAtom);
	const rawLastRaces = useAtomValue(lastRacesAtom);
	const nextRaces = useAtomValue(nextRaceEntriesAtom);

	// If the current race has been stopped (ended), surface it as the first "last race"
	// and hide the current-race panel until the next race starts.
	const currentRaceEnded = currentRace ? computeRaceStatus(currentRace).isCompleted : false;
	const showCurrentRace = !!currentRace && !currentRaceEnded;

	// Build the list of previous races to show (up to 3).
	// When the current race has ended, prepend it so it appears first.
	const lastRaces = currentRaceEnded && currentRace
		? [currentRace, ...rawLastRaces.filter((r) => r.id !== currentRace.id)].slice(0, 3)
		: rawLastRaces.filter((r) => !currentRace || r.id !== currentRace.id);

	return (
		<div className='races-container'>
			<FinalsRacePanel />
			{showCurrentRace && (
				<div className='race-box current-race'>
					<div className='race-header'>
						<h3>Current Race</h3>
						<RaceNumber raceId={currentRace.id} />
						<div className='race-timer'>
							<RaceTime />
						</div>
					</div>
					<LapsView
						key={currentRace.id}
						raceId={currentRace.id}
					/>
				</div>
			)}
			{lastRaces.map((race, idx) => (
				<div key={race.id} className='race-box last-race'>
					<div className='race-header'>
						<h3>{idx === 0 ? 'Last Race' : 'Previous Race'}</h3>
						<RaceNumber raceId={race.id} />
					</div>
					<LapsView
						key={race.id}
						raceId={race.id}
					/>
				</div>
			))}
			{lastRaces.length > 0 && (
				<div className='race-history-link-container'>
					{/* @ts-ignore - TanStack Router type issue */}
					<Link to='/races' className='race-history-link'>
						View All Races &rarr;
					</Link>
				</div>
			)}
			<div className='race-box next-races'>
				<div className='race-header'>
					<h3>Next Races</h3>
				</div>
				{nextRaces.map((entry) => (
					<NextRaceCompact
						key={entry.raceId}
						entry={entry}
					/>
				))}
			</div>
		</div>
	);
}
