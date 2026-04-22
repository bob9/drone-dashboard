import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { completedRacesAtom } from './race-atoms.ts';
import { racePilotChannelsAtom } from '../state/pb/raceAtoms.ts';
import type { PBRaceRecord } from '../api/pbTypes.ts';

const STORAGE_KEY = 'drone-dashboard:race-history-pilot-filter';

export const raceHistoryPilotFilterAtom = atomWithStorage<string[]>(
	STORAGE_KEY,
	[],
	undefined,
	{ getOnInit: true },
);

export const raceHistoryPilotFilterSetAtom = atom((get) => {
	return new Set(get(raceHistoryPilotFilterAtom));
});

export const filteredCompletedRacesAtom = atom((get): PBRaceRecord[] => {
	const races = get(completedRacesAtom);
	const filterIds = get(raceHistoryPilotFilterSetAtom);

	if (filterIds.size === 0) return races;

	return races.filter((race) => {
		const pilotChannels = get(racePilotChannelsAtom(race.id));
		return pilotChannels.some((pc) => filterIds.has(pc.pilotId));
	});
});
