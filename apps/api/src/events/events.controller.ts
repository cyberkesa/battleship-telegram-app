import { Controller, Sse, Param, UseGuards, Req } from '@nestjs/common';
import { interval, map, Observable } from 'rxjs';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

interface MessageEvent {
	data: unknown;
	id?: string;
	event?: string;
	retry?: number;
}

@Controller()
export class EventsController {
	@UseGuards(JwtAuthGuard)
	@Sse('events/:matchId/subscribe')
	sseSubscribe(@Param('matchId') matchId: string, @Req() req: any): Observable<MessageEvent> {
		const playerId = req.user.sub as string;
		return interval(15000).pipe(map(() => ({ data: { type: 'heartbeat', matchId, playerId, ts: Date.now() } })));
	}

	@UseGuards(JwtAuthGuard)
	@Sse('game/:matchId/events')
	sseGameEvents(@Param('matchId') matchId: string, @Req() req: any): Observable<MessageEvent> {
		const playerId = req.user.sub as string;
		return interval(15000).pipe(map(() => ({ data: { type: 'heartbeat', matchId, playerId, ts: Date.now() } })));
	}
}