import React from 'react';
import { useAtomValue } from 'jotai';
import { Link } from '@tanstack/react-router';
import { channelsDataAtom, overallBestTimesAtom, pilotsAtom } from '../state/index.ts';
import {
	raceMaxLapNumberAtom,
	racePilotChannelsAtom,
	racePilotTotalTimeAtom,
	raceProcessedLapsAtom,
	raceSortedRowsAtom,
} from './race-atoms.ts';
import { raceBracketSlotsAtom } from '../bracket/eliminationState.ts';
import { favoritePilotIdsSetAtom } from '../state/favorites-atoms.ts';
import type { PBRaceRecord } from '../api/pbTypes.ts';
import { getLapClassName, getPositionWithSuffix } from '../common/index.ts';
import { ChannelSquare } from '../common/ChannelSquare.tsx';
import './LapsCardView.css';
import '../common/patterns.css';

interface LapsCardViewProps {
	raceId: string;
}

export function LapsCardView({ raceId }: LapsCardViewProps) {
	const race = useAtomValue(raceMaxLapNumberAtom(raceId));
	if (race <= 0) return null;

	return <LapsCards raceId={raceId} />;
}

function LapsCards({ raceId }: { raceId: string }) {
	const baseRows = useAtomValue(raceSortedRowsAtom(raceId));
	const bracketSlots = useAtomValue(raceBracketSlotsAtom(raceId));
	const favoritePilotIdsSet = useAtomValue(favoritePilotIdsSetAtom);

	const existingPilotIds = new Set(
		baseRows.map((row) => row.pilotChannel.pilotId).filter(Boolean),
	);
	const predictedRows = bracketSlots
		.filter((slot) => slot.isPredicted && slot.pilotId && !existingPilotIds.has(slot.pilotId))
		.map((slot, idx) => ({
			raceId,
			pilotChannel: {
				id: slot.id,
				pilotId: slot.pilotId ?? `predicted-${slot.id}`,
				channelId: slot.channelId ?? '',
			},
			position: baseRows.length + idx + 1,
			isPredicted: true,
			displayName: slot.name,
			channelLabel: slot.channelLabel || '—',
		}));

	const rows = [
		...baseRows.map((row) => ({ ...row, isPredicted: false, displayName: undefined, channelLabel: undefined })),
		...predictedRows,
	];

	return (
		<div className='laps-cards'>
			{rows.map((row) => (
				<PilotCard
					key={row.pilotChannel.id}
					raceId={raceId}
					pilotChannel={row.pilotChannel}
					position={row.position}
					isPredicted={row.isPredicted}
					displayName={row.displayName}
					channelLabel={row.channelLabel}
					isFavorite={favoritePilotIdsSet.has(row.pilotChannel.pilotId)}
				/>
			))}
		</div>
	);
}

interface PilotCardProps {
	raceId: string;
	pilotChannel: { id: string; pilotId: string; channelId: string };
	position: number;
	isPredicted: boolean;
	displayName?: string;
	channelLabel?: string;
	isFavorite: boolean;
}

function PilotCard({ raceId, pilotChannel, position, isPredicted, displayName, channelLabel, isFavorite }: PilotCardProps) {
	const pilots = useAtomValue(pilotsAtom);
	const channels = useAtomValue(channelsDataAtom);
	const processedLaps = useAtomValue(raceProcessedLapsAtom(raceId));
	const overallBestTimes = useAtomValue(overallBestTimesAtom);
	const totalTime = useAtomValue(racePilotTotalTimeAtom([raceId, pilotChannel.pilotId]));

	const pilot = pilots.find((p) => p.id === pilotChannel.pilotId);
	const name = pilot?.name ?? displayName ?? '—';
	const channel = channels.find((c) => c.id === pilotChannel.channelId);
	const chanLabel = channel ? `${channel.shortBand ?? ''}${channel.number ?? ''}` : channelLabel ?? '—';

	const pilotLaps = processedLaps.filter((lap) => lap.pilotId === pilotChannel.pilotId);
	const holeshot = pilotLaps.find((lap) => lap.isHoleshot);
	const racingLaps = pilotLaps.filter((lap) => !lap.isHoleshot);
	const fastestPilotLap = racingLaps.length > 0 ? Math.min(...racingLaps.map((l) => l.lengthSeconds)) : Infinity;
	const allRacingLaps = processedLaps.filter((lap) => !lap.isHoleshot);
	const fastestRaceLap = allRacingLaps.length > 0 ? Math.min(...allRacingLaps.map((l) => l.lengthSeconds)) : Infinity;

	let cardClass = 'pilot-card';
	if (isPredicted) cardClass += ' predicted';
	if (isFavorite) cardClass += ' favorite';

	return (
		<div className={cardClass}>
			<div className='pilot-card-header'>
				<span className='pilot-card-pos'>{getPositionWithSuffix(position)}</span>
				{pilot ? (
					// @ts-ignore - TanStack Router type issue
					<Link to='/pilots/$pilotId' params={{ pilotId: pilot.sourceId }} className='pilot-card-name'>
						{name}
					</Link>
				) : (
					<span className='pilot-card-name'>{name}</span>
				)}
				<span className='pilot-card-channel'>
					{chanLabel}
					{pilotChannel.channelId ? <ChannelSquare channelID={pilotChannel.channelId} /> : null}
				</span>
			</div>
			{!isPredicted && (
				<div className='pilot-card-laps'>
					{holeshot && (
						<LapBadge
							label='HS'
							lap={holeshot}
							overallBestTimes={overallBestTimes}
							pilotId={pilotChannel.pilotId}
							fastestRaceLap={fastestRaceLap}
							fastestPilotLap={fastestPilotLap}
						/>
					)}
					{racingLaps.map((lap) => (
						<LapBadge
							key={lap.id}
							label={`L${lap.lapNumber}`}
							lap={lap}
							overallBestTimes={overallBestTimes}
							pilotId={pilotChannel.pilotId}
							fastestRaceLap={fastestRaceLap}
							fastestPilotLap={fastestPilotLap}
						/>
					))}
					{totalTime != null && (
						<div className='lap-badge total-badge'>
							<span className='lap-badge-label'>Total</span>
							<span className='lap-badge-value'>{totalTime.toFixed(3)}</span>
						</div>
					)}
				</div>
			)}
		</div>
	);
}

interface LapBadgeProps {
	label: string;
	lap: { id: string; lengthSeconds: number; isHoleshot: boolean; pilotId: string; lapNumber: number; valid: boolean; startTime: string; endTime: string; detectionId: string; detectionTime: string };
	overallBestTimes: { overallFastestLap: number; pilotBestLaps: Map<string, number> };
	pilotId: string;
	fastestRaceLap: number;
	fastestPilotLap: number;
}

function LapBadge({ label, lap, overallBestTimes, pilotId, fastestRaceLap, fastestPilotLap }: LapBadgeProps) {
	const className = getLapClassName(
		lap,
		overallBestTimes.overallFastestLap,
		overallBestTimes.pilotBestLaps.get(pilotId),
		fastestRaceLap,
		fastestPilotLap,
	);

	let badgeClass = 'lap-badge';
	if (className) badgeClass += ` ${className}`;

	return (
		<div className={badgeClass}>
			<span className='lap-badge-label'>{label}</span>
			<span className='lap-badge-value'>{lap.lengthSeconds.toFixed(3)}</span>
		</div>
	);
}
