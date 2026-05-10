<?php

namespace App\Services;

use App\Models\Team;
use App\Models\TeamMember;
use App\Models\User;
use App\Models\SupervisorGroup;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Schema;

class GroupManagementService
{
    public function studentTeam(User $student): ?Team
    {
        $teamId = TeamMember::query()
            ->where('user_id', $student->id)
            ->value('team_id');

        return $teamId ? Team::with(['members.user:id,name,role', 'leader:id,name', 'supervisor:id,name,role', 'project'])
            ->find((int) $teamId) : null;
    }

    /**
     * Supervisor scope: only teams assigned to them.
     * HoD/Admin scope: all teams.
     */
    public function teamsForUser(User $user): Collection
    {
        $query = Team::query()
            ->withCount('members')
            ->with(['leader:id,name', 'supervisor:id,name,role', 'project:id,title,industry_challenge_id,status']);

        if ($user->role === 'supervisor') {
            $query->where('supervisor_id', $user->id);
        } elseif (! in_array($user->role, ['hod', 'admin'], true)) {
            return collect();
        }

        // HoD: fail-closed — no department set means no visibility (previously matched all rows).
        if ($user->role === 'hod') {
            if (empty($user->department)) {
                return collect();
            }
            $query->where('department', $user->department);
        }

        return $query->latest()->get();
    }

    /**
     * Read-only snapshot of teams for HoD / admin monitoring (same scope as teamsForUser).
     */
    public function teamsMonitorForUser(User $user): Collection
    {
        if (! in_array($user->role, ['hod', 'admin'], true)) {
            return collect();
        }

        if ($user->role === 'hod' && empty($user->department)) {
            return collect();
        }

        $query = Team::query()
            ->withCount('members')
            ->with([
                'leader:id,name,email',
                'supervisor:id,name,email,role',
                'project' => fn ($q) => $q->with([
                    'industryChallenge:id,title,deadline',
                    'milestonePlan:id,name',
                    'milestones' => fn ($mq) => $mq->orderBy('sequence'),
                ]),
                'challengeRequests' => fn ($q) => $q->with([
                    'industryChallenge:id,title',
                    'supervisor:id,name',
                    'requestedByStudent:id,name',
                ])->latest()->limit(5),
            ]);

        if ($user->role === 'hod') {
            $query->where('department', $user->department);
        }

        return $query->latest('id')->get();
    }

    /**
     * @return \Illuminate\Database\Eloquent\Builder<\App\Models\Team>
     */
    private function hodScopedTeamsQuery(User $user): \Illuminate\Database\Eloquent\Builder
    {
        $q = Team::query();
        if (($user->role ?? null) === 'hod') {
            if (empty($user->department)) {
                $q->whereRaw('1 = 0');
            } else {
                $q->where('department', $user->department);
            }
        }

        return $q;
    }

    /**
     * Compact stats and samples for the HoD home dashboard (preview cards).
     */
    public function hodDashboardSummary(User $user): array
    {
        if (($user->role ?? null) !== 'hod') {
            return [];
        }

        $pendingCount = $this->hodScopedTeamsQuery($user)->where('review_status', 'pending')->count();
        $approvedCount = $this->hodScopedTeamsQuery($user)->where('review_status', 'approved')->count();
        $rejectedCount = $this->hodScopedTeamsQuery($user)->where('review_status', 'rejected')->count();
        $totalTeams = $this->hodScopedTeamsQuery($user)->count();
        $withProject = $this->hodScopedTeamsQuery($user)->whereNotNull('project_id')->count();

        $supervisorsCount = $this->supervisorsForHoD($user)->count();

        $pendingSamples = $this->hodScopedTeamsQuery($user)->where('review_status', 'pending')
            ->latest('id')
            ->limit(3)
            ->get(['id', 'name']);

        $monitorSamples = $this->hodScopedTeamsQuery($user)->whereNotNull('project_id')
            ->with(['project:id,title,current_progress'])
            ->latest('id')
            ->limit(3)
            ->get();

        $notificationPreview = $this->hodScopedTeamsQuery($user)->where('review_status', 'pending')
            ->with(['leader:id,name'])
            ->latest('id')
            ->limit(5)
            ->get()
            ->map(function (Team $team) {
                $leader = $team->leader?->name ?? 'Student';

                return [
                    'title' => 'Team approval needed',
                    'message' => "Team \"{$team->name}\" · {$leader}",
                    'sent_at' => optional($team->created_at ?? $team->updated_at)->toIso8601String(),
                ];
            })
            ->values()
            ->all();

        return [
            'panel' => [
                'pending_team_count' => $pendingCount,
                'approved_team_count' => $approvedCount,
                'rejected_team_count' => $rejectedCount,
                'supervisor_count' => $supervisorsCount,
                'pending_samples' => $pendingSamples->map(fn (Team $t) => [
                    'id' => (int) $t->id,
                    'name' => $t->name,
                ])->values()->all(),
            ],
            'monitor' => [
                'teams_total' => $totalTeams,
                'teams_with_project' => $withProject,
                'samples' => $monitorSamples->map(fn (Team $t) => [
                    'team_name' => $t->name,
                    'project_title' => $t->project?->title,
                    'progress' => min(100, max(0, (int) ($t->project?->current_progress ?? 0))),
                ])->values()->all(),
            ],
            'notifications' => [
                'preview' => $notificationPreview,
            ],
        ];
    }

    public function supervisorsForHoD(User $user): Collection
    {
        if (! in_array($user->role, ['hod', 'admin'], true)) {
            return collect();
        }

        if ($user->role === 'hod' && empty($user->department)) {
            return collect();
        }

        $query = User::query()
            ->where('role', 'supervisor')
            ->orderBy('name');

        if ($user->role === 'hod' && Schema::hasColumn('users', 'department')) {
            $query->where('department', $user->department);
        }

        $hasIsActiveColumn = Schema::hasColumn('users', 'is_active');
        if ($hasIsActiveColumn) {
            $query->orderByDesc('is_active');
        }

        $rows = $query->get($hasIsActiveColumn ? ['id', 'name', 'email', 'role', 'is_active'] : ['id', 'name', 'email', 'role']);

        if (! $hasIsActiveColumn) {
            return $rows->map(function (User $u) {
                $u->is_active = true;

                return $u;
            });
        }

        return $rows;
    }

    /**
     * HoD assigns a team to a supervisor (strict).
     */
    public function assignTeamToSupervisor(User $actor, Team $team, int $supervisorId): array
    {
        if (! in_array($actor->role, ['hod', 'admin'], true)) {
            return ['ok' => false, 'message' => 'Forbidden'];
        }

        if ($actor->role === 'hod') {
            if (empty($actor->department)) {
                return ['ok' => false, 'message' => 'Forbidden'];
            }
            if (empty($team->department) || $team->department !== $actor->department) {
                return ['ok' => false, 'message' => 'Forbidden'];
            }
        }

        $supervisorQuery = User::query()
            ->where('id', $supervisorId)
            ->where('role', 'supervisor');

        if (Schema::hasColumn('users', 'is_active')) {
            $supervisorQuery->where('is_active', true);
        }

        $supervisor = $supervisorQuery->first();

        if (! $supervisor) {
            return ['ok' => false, 'message' => 'Invalid supervisor'];
        }

        $team->update(['supervisor_id' => $supervisor->id]);

        // Auto-create chats after assignment. For pending teams, chats are delayed
        // until approval to avoid exposing unapproved groups.
        $this->ensureTeamChats($team, $supervisor->id);

        return ['ok' => true, 'message' => 'Team assigned successfully'];
    }

    private function ensureTeamChats(Team $team, int $supervisorId): void
    {
        if (! $team->id) return;
        if (($team->review_status ?? 'pending') !== 'approved') return;
        if (! $supervisorId) return;

        $memberIds = TeamMember::query()
            ->where('team_id', $team->id)
            ->pluck('user_id')
            ->map(fn ($id) => (int) $id)
            ->values()
            ->all();

        if (count($memberIds) === 0) return;

        $team->refresh();

        if (! $team->supervisor_group_id) {
            $group = SupervisorGroup::create([
                'supervisor_id' => $supervisorId,
                'name' => $team->name.' - Supervisor Chat',
                'description' => 'Team + supervisor group chat',
                'kind' => 'with_supervisor',
            ]);
            foreach ($memberIds as $sid) {
                $group->members()->firstOrCreate(['student_id' => $sid]);
            }
            $team->update(['supervisor_group_id' => $group->id]);
        }

        if (! $team->students_group_id) {
            $group = SupervisorGroup::create([
                'supervisor_id' => $supervisorId,
                'name' => $team->name.' - Students Only',
                'description' => 'Students-only group chat (supervisor cannot access)',
                'kind' => 'students_only',
            ]);
            foreach ($memberIds as $sid) {
                $group->members()->firstOrCreate(['student_id' => $sid]);
            }
            $team->update(['students_group_id' => $group->id]);
        }
    }

    /**
     * Enforce 2-4 members rule when syncing members.
     */
    public function validateTeamSizeOrFail(int $membersCount): array
    {
        if ($membersCount < 2 || $membersCount > 4) {
            return ['ok' => false, 'message' => 'Group size must be between 2 and 4 students'];
        }

        return ['ok' => true, 'message' => 'ok'];
    }
}

