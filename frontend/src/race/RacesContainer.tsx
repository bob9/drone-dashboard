import { useAtomValue } from 'jotai';
import { LapsView } from './LapsView.tsx';
import RaceTime from './RaceTime.tsx';
import { currentRaceAtom, lastRaceAtom } from './race-atoms.ts';
import { NextRaceCompact } from './NextRaceCompact.tsx';
import { nextRaceEntriesAtom } from './next-race-entries.ts';
import { RaceNumber } from './RaceNumber.tsx';
import { FinalsRacePanel } from './FinalsRacePanel.tsx';
import { computeRaceStatus } from './race-types.ts';

export function RacesContainer() {
	const currentRace = useAtomValue(currentRaceAtom);
	const rawLastRace = useAtomValue(lastRaceAtom);
	const nextRaces = useAtomValue(nextRaceEntriesAtom);

	// If the current race has been stopped (ended), surface it as the "last race"
	// and hide the current-race panel until the next race starts.
	const currentRaceEnded = currentRace ? computeRaceStatus(currentRace).isCompleted : false;
	const lastRace = currentRaceEnded ? currentRace : rawLastRace;
	const showCurrentRace = !!currentRace && !currentRaceEnded && !(lastRace && currentRace.id === lastRace.id);

	return (
		<div className='races-container'>
			<FinalsRacePanel />
			{lastRace && (
				<div className='race-box last-race'>
					<div className='race-header'>
						<h3>Last Race</h3>
						<RaceNumber raceId={lastRace.id} />
					</div>
					<LapsView
						key={lastRace.id}
						raceId={lastRace.id}
					/>
				</div>
			)}
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
