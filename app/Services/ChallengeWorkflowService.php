<?php

namespace App\Services;

use App\Models\ChallengeRequest;
use App\Models\IndustryChallenge;
use App\Models\Project;
use App\Models\StudentNotification;
use App\Models\Team;
use App\Models\TeamMember;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class ChallengeWorkflowService
{
    /** Milestone + {@see IndustryChallenge::$published_to_students_at} gate student listings and team requests. */
    public const COMPANY_CHALLENGE_VISIBLE_TO_STUDENTS_MILESTONE = 'Approved for students';

    /** Set after HoD accepts the challenge; students only see it after publication timestamp is set. */
    public const COMPANY_CHALLENGE_APPROVED_AWAITING_PUBLISH_MILESTONE = 'HoD approved — awaiting publication to students';

    public const COMPANY_CHALLENGE_PENDING_HOD_MILESTONE = 'Pending HoD approval';

    /** company_status: awaiting supervisor decision (student submitted). */
    public const CS_WAITING_SUPERVISOR = 'waiting_supervisor';

    /** company_status: supervisor approved — pool visible to company. */
    public const CS_AWAITING_COMPANY = 'awaiting_company';

    /** company_status: company selected a team; HoD must confirm. */
    public const CS_HOD_NOMINATION_PENDING = 'hod_nomination_pending';

    /** company_status: corporate rejection for this team's application row. */
    public const CS_REJECTED_BY_COMPANY = 'rejected_by_company';

    /** company_status: HoD finalized this team as winner. */
    public const CS_FINALIZED_WON = 'finalized_won';

    /** company_status: pipeline closed — another team took the challenge / HoD finalized elsewhere. */
    public const CS_FINALIZED_LOST = 'finalized_lost';

    public const HOD_NOM_PENDING = 'pending';

    public const HOD_NOM_APPROVED = 'approved';

    public const HOD_NOM_REJECTED = 'rejected';

    public function __construct(
        private readonly GroupManagementService $groupManagementService,
    ) {}

    /** Milestone + {@see IndustryChallenge::$published_to_students_at} gate student listings and team requests. */
    public function scopedStudentIdsForSupervisor(User $user): array
    {
        if (($user->role ?? null) !== 'supervisor') {
            return [];
        }

        return TeamMember::query()
            ->join('teams', 'teams.id', '=', 'team_members.team_id')
            ->where('teams.supervisor_id', $user->id)
            ->pluck('team_members.user_id')
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values()
            ->all();
    }

    public function queryCompanyChallengesApproved(): Builder
    {
        return IndustryChallenge::query()
            ->withoutVectorEmbedding()
            ->with('postedBy:id,name')
            ->where('kind', 'company_challenge')
            ->where('review_status', 'approved')
            ->whereNotNull('published_to_students_at')
            ->whereDoesntHave('projects')
            ->latest();
    }

    public function queryCompanyChallengesAwaitingStudentPublication(): Builder
    {
        return IndustryChallenge::query()
            ->withoutVectorEmbedding()
            ->with('postedBy:id,name,email')
            ->where('kind', 'company_challenge')
            ->where('review_status', 'approved')
            ->whereNull('published_to_students_at')
            ->latest();
    }

    public function queryCompanyChallengesPendingHoD(): Builder
    {
        return IndustryChallenge::query()
            ->withoutVectorEmbedding()
            ->with('postedBy:id,name,email')
            ->where('kind', 'company_challenge')
            ->where('review_status', 'pending_action')
            ->latest();
    }

    public function createCompanyChallenge(User $industryUser, array $validated): array
    {
        if (! in_array($industryUser->role, ['industry', 'admin'], true)) {
            return ['ok' => false, 'message' => 'Forbidden'];
        }

        $challenge = IndustryChallenge::create([
            'title' => trim((string) $validated['title']),
            'description' => trim((string) $validated['description']),
            'deadline' => $validated['deadline'] ?? null,
            'posted_by_user_id' => $industryUser->id,
            'kind' => 'company_challenge',
            'posted_date' => now(),
            'review_status' => 'pending_action',
            'progress' => 0,
            'current_milestone' => self::COMPANY_CHALLENGE_PENDING_HOD_MILESTONE,
        ]);

        return [
            'ok' => true,
            'message' => 'Challenge submitted — awaiting Head of Department approval before students can view it.',
            'data' => $challenge,
        ];
    }

    public function hodReviewCompanyChallenge(User $hod, IndustryChallenge $challenge, string $decision, ?string $notes): array
    {
        if (! in_array($hod->role, ['hod', 'admin'], true)) {
            return ['ok' => false, 'message' => 'Forbidden'];
        }
        if ($challenge->kind !== 'company_challenge') {
            return ['ok' => false, 'message' => 'Not a company challenge'];
        }
        if ($challenge->review_status !== 'pending_action') {
            return ['ok' => false, 'message' => 'This challenge is not awaiting HoD approval'];
        }

        $decision = $decision === 'approve' ? 'approved' : 'rejected';
        $challenge->update([
            'review_status' => $decision,
            'current_milestone' => $decision === 'approved'
                ? self::COMPANY_CHALLENGE_APPROVED_AWAITING_PUBLISH_MILESTONE
                : 'Rejected by HoD',
            'published_to_students_at' => $decision === 'approved' ? null : $challenge->published_to_students_at,
        ]);
        if ($notes) {
            $challenge->feedbacks()->create([
                'comment' => "HoD Notes:\n".trim($notes),
            ]);
        }

        return ['ok' => true, 'message' => $decision === 'approved'
            ? 'Challenge accepted. Publish it to students when you are ready.'
            : 'Decision saved'];
    }

    public function hodPublishCompanyChallengeToStudents(User $hod, IndustryChallenge $challenge): array
    {
        if (! in_array($hod->role, ['hod', 'admin'], true)) {
            return ['ok' => false, 'message' => 'Forbidden'];
        }
        if ($challenge->kind !== 'company_challenge') {
            return ['ok' => false, 'message' => 'Not a company challenge'];
        }
        if ($challenge->review_status !== 'approved') {
            return ['ok' => false, 'message' => 'Challenge is not approved'];
        }
        if ($challenge->published_to_students_at !== null) {
            return ['ok' => false, 'message' => 'Already visible to students'];
        }

        $challenge->update([
            'published_to_students_at' => now(),
            'current_milestone' => self::COMPANY_CHALLENGE_VISIBLE_TO_STUDENTS_MILESTONE,
        ]);

        return ['ok' => true, 'message' => 'Challenge is now visible to students.'];
    }

    public function createChallengeRequest(User $student, int $industryChallengeId): array
    {
        if ($student->role !== 'student') {
            return ['ok' => false, 'message' => 'Forbidden'];
        }

        $challenge = IndustryChallenge::query()
            ->withoutVectorEmbedding()
            ->where('id', $industryChallengeId)
            ->where('kind', 'company_challenge')
            ->where('review_status', 'approved')
            ->whereNotNull('published_to_students_at')
            ->first();

        if (! $challenge) {
            return ['ok' => false, 'message' => 'Challenge not available'];
        }

        $teamId = TeamMember::query()
            ->where('user_id', $student->id)
            ->value('team_id');

        if (! $teamId) {
            return ['ok' => false, 'message' => 'You are not assigned to a group'];
        }

        $team = Team::find((int) $teamId);
        if ($team && ($team->review_status ?? 'pending') !== 'approved') {
            return ['ok' => false, 'message' => 'Your group is pending HoD approval'];
        }
        if (! $team || ! $team->supervisor_id) {
            return ['ok' => false, 'message' => 'Your group has no assigned supervisor'];
        }

        if ($team->industry_project_id) {
            return ['ok' => false, 'message' => 'Your group already has an assigned industry challenge project'];
        }

        $blockingOther = ChallengeRequest::query()
            ->where('team_id', $team->id)
            ->where(function (Builder $q): void {
                $q->where('status', 'pending')
                    ->orWhere(function (Builder $q2): void {
                        $q2->where('status', 'approved')
                            ->whereIn('company_status', [
                                self::CS_AWAITING_COMPANY,
                                self::CS_HOD_NOMINATION_PENDING,
                            ]);
                    });
            })
            ->exists();
        if ($blockingOther) {
            return ['ok' => false, 'message' => 'Your group already has an active industry challenge application'];
        }

        $duplicateThisChallenge = ChallengeRequest::query()
            ->where('team_id', $team->id)
            ->where('industry_challenge_id', $challenge->id)
            ->where(function (Builder $q): void {
                $q->where('status', 'pending')
                    ->orWhere(function (Builder $q2): void {
                        $q2->where('status', 'approved')
                            ->whereNotIn('company_status', [
                                self::CS_REJECTED_BY_COMPANY,
                                self::CS_FINALIZED_LOST,
                                self::CS_FINALIZED_WON,
                            ]);
                    });
            })
            ->exists();
        if ($duplicateThisChallenge) {
            return ['ok' => false, 'message' => 'A request already exists for this challenge'];
        }

        $req = ChallengeRequest::create([
            'team_id' => $team->id,
            'industry_challenge_id' => $challenge->id,
            'requested_by_student_id' => $student->id,
            'supervisor_id' => $team->supervisor_id,
            'status' => 'pending',
            'company_status' => self::CS_WAITING_SUPERVISOR,
        ]);

        return ['ok' => true, 'message' => 'Request submitted', 'data' => $req];
    }

    public function supervisorPendingRequests(User $supervisor): Collection
    {
        if (! in_array($supervisor->role, ['supervisor', 'admin'], true)) {
            return collect();
        }

        $query = ChallengeRequest::query()
            ->with([
                'team:id,name,leader_id,supervisor_id,project_id,industry_project_id',
                'team.leader:id,name',
                'industryChallenge:id,title,description,posted_by_user_id,deadline',
                'industryChallenge.postedBy:id,name',
                'requestedByStudent:id,name',
            ])
            ->where('status', 'pending')
            ->latest();

        if ($supervisor->role === 'supervisor') {
            $query->where('supervisor_id', $supervisor->id);
        }

        return $query->get();
    }

    public function supervisorDecideRequest(User $supervisor, ChallengeRequest $request, string $decision, ?string $notes): array
    {
        if (! in_array($supervisor->role, ['supervisor', 'admin'], true)) {
            return ['ok' => false, 'message' => 'Forbidden'];
        }

        if ($request->status !== 'pending') {
            return ['ok' => false, 'message' => 'Request already decided'];
        }

        if ($supervisor->role === 'supervisor' && (int) $request->supervisor_id !== (int) $supervisor->id) {
            return ['ok' => false, 'message' => 'Forbidden'];
        }

        $decision = $decision === 'approve' ? 'approved' : 'rejected';

        return DB::transaction(function () use ($request, $decision, $notes, $supervisor) {
            $team = Team::lockForUpdate()->findOrFail((int) $request->team_id);
            if ($supervisor->role === 'supervisor' && (int) $team->supervisor_id !== (int) $supervisor->id) {
                return ['ok' => false, 'message' => 'Forbidden'];
            }

            if ($decision === 'approved' && Project::where('industry_challenge_id', (int) $request->industry_challenge_id)->exists()) {
                $request->update([
                    'status' => 'rejected',
                    'supervisor_notes' => 'Industry challenge already finalized for another path.',
                    'decided_at' => now(),
                ]);

                return ['ok' => false, 'message' => 'Challenge is no longer available for new assignments'];
            }

            $request->update([
                'status' => $decision,
                'supervisor_notes' => $notes ? trim($notes) : null,
                'decided_at' => now(),
                'company_status' => $decision === 'approved' ? self::CS_AWAITING_COMPANY : self::CS_REJECTED_BY_COMPANY,
                'presented_to_company_at' => $decision === 'approved' ? now() : null,
            ]);

            return ['ok' => true, 'message' => 'Decision saved'];
        });
    }

    public function hodAssignChallengeToTeam(User $hod, Team $team, IndustryChallenge $challenge): array
    {
        if (! in_array($hod->role, ['hod', 'admin'], true)) {
            return ['ok' => false, 'message' => 'Forbidden'];
        }
        if ($challenge->kind !== 'company_challenge' || $challenge->review_status !== 'approved') {
            return ['ok' => false, 'message' => 'Challenge not assignable'];
        }
        if ($challenge->published_to_students_at === null) {
            return ['ok' => false, 'message' => 'Challenge not assignable'];
        }

        return DB::transaction(function () use ($team, $challenge) {
            $team = Team::lockForUpdate()->findOrFail($team->id);

            $project = Project::create([
                'title' => $challenge->title,
                'abstract' => $challenge->description,
                'type' => 'industry_sponsored',
                'industry_challenge_id' => $challenge->id,
                'owner_user_id' => $team->leader_id,
                'status' => 'approved',
                'current_progress' => 0,
                'start_date' => now()->toDateString(),
            ]);

            $team->update([
                'industry_project_id' => $project->id,
            ]);

            return ['ok' => true, 'message' => 'Challenge assigned'];
        });
    }

    public function industryRequestsForCompany(User $industryUser)
    {
        if (! in_array($industryUser->role, ['industry', 'admin'], true)) {
            return collect();
        }

        return ChallengeRequest::query()
            ->with([
                'team:id,name,leader_id,project_id,industry_project_id,supervisor_id',
                'team.leader:id,name',
                'team.supervisor:id,name',
                'industryChallenge:id,title,posted_by_user_id',
                'requestedByStudent:id,name',
            ])
            ->where('status', 'approved')
            ->whereHas('industryChallenge', fn ($q) => $q->where('posted_by_user_id', $industryUser->id))
            ->latest()
            ->get();
    }

    /** @deprecated Prefer {@see companyNominateForHoD} via route; kept for API compat (accept→nominate, reject→reject). */
    public function industryDecide(User $industryUser, ChallengeRequest $request, string $decision, ?string $notes): array
    {
        $decision = strtolower($decision);
        if (in_array($decision, ['accept', 'nominate'], true)) {
            return $this->companyNominateForHoD($industryUser, $request, $notes);
        }

        return $this->companyRejectCandidate($industryUser, $request, $notes);
    }

    public function companyNominateForHoD(User $industryUser, ChallengeRequest $request, ?string $notes): array
    {
        if (! in_array($industryUser->role, ['industry', 'admin'], true)) {
            return ['ok' => false, 'message' => 'Forbidden'];
        }

        $challenge = IndustryChallenge::find((int) $request->industry_challenge_id);
        if (! $challenge || (int) $challenge->posted_by_user_id !== (int) $industryUser->id) {
            return ['ok' => false, 'message' => 'Forbidden'];
        }

        if ($request->status !== 'approved') {
            return ['ok' => false, 'message' => 'Request is not supervisor-approved'];
        }
        if ($request->company_status !== self::CS_AWAITING_COMPANY) {
            return ['ok' => false, 'message' => 'This application is not awaiting company selection'];
        }

        if (Project::where('industry_challenge_id', $challenge->id)->exists()) {
            return ['ok' => false, 'message' => 'This challenge already has an assigned industry project'];
        }

        return DB::transaction(function () use ($request, $notes, $challenge) {
            $locked = ChallengeRequest::lockForUpdate()->findOrFail($request->id);

            $pendingNomination = ChallengeRequest::query()
                ->where('industry_challenge_id', $challenge->id)
                ->where('hod_nomination_status', self::HOD_NOM_PENDING)
                ->exists();
            if ($pendingNomination) {
                return ['ok' => false, 'message' => 'Another team nomination is awaiting HoD approval for this challenge'];
            }

            $locked->update([
                'company_status' => self::CS_HOD_NOMINATION_PENDING,
                'company_notes' => $notes ? trim($notes) : null,
                'company_nominated_for_hod_at' => now(),
                'hod_nomination_status' => self::HOD_NOM_PENDING,
                'hod_nomination_notes' => null,
                'hod_nomination_decided_at' => null,
                'hod_nomination_template_key' => null,
            ]);

            return ['ok' => true, 'message' => 'Team selection sent to Head of Department for confirmation'];
        });
    }

    public function companyRejectCandidate(User $industryUser, ChallengeRequest $request, ?string $notes): array
    {
        if (! in_array($industryUser->role, ['industry', 'admin'], true)) {
            return ['ok' => false, 'message' => 'Forbidden'];
        }

        $challenge = IndustryChallenge::find((int) $request->industry_challenge_id);
        if (! $challenge || (int) $challenge->posted_by_user_id !== (int) $industryUser->id) {
            return ['ok' => false, 'message' => 'Forbidden'];
        }

        if ($request->company_status !== self::CS_AWAITING_COMPANY) {
            return ['ok' => false, 'message' => 'Nothing to reject in the current workflow step'];
        }

        $request->update([
            'company_status' => self::CS_REJECTED_BY_COMPANY,
            'company_notes' => $notes ? trim($notes) : null,
            'company_decided_at' => now(),
        ]);

        return ['ok' => true, 'message' => 'Candidate rejected'];
    }

    public function hodPendingIndustryNominations(User $hod)
    {
        if (! in_array($hod->role, ['hod', 'admin'], true)) {
            return collect();
        }

        $query = ChallengeRequest::query()
            ->with([
                'team:id,name,leader_id,department,supervisor_id',
                'team.leader:id,name',
                'team.supervisor:id,name',
                'industryChallenge:id,title,posted_by_user_id',
                'industryChallenge.postedBy:id,name',
                'requestedByStudent:id,name',
                'supervisor:id,name',
            ])
            ->where('hod_nomination_status', self::HOD_NOM_PENDING)
            ->latest('company_nominated_for_hod_at');

        if ($hod->role === 'hod') {
            $query->whereHas('team', function (Builder $teamQ) use ($hod): void {
                $this->groupManagementService->applyHodDepartmentScopeToTeamsQuery($teamQ, $hod);
            });
        }

        return $query->get();
    }

    public function hodPendingIndustryNominationsCount(User $hod): int
    {
        if (! $hod || ! in_array($hod->role, ['hod', 'admin'], true)) {
            return 0;
        }

        $query = ChallengeRequest::query()->where('hod_nomination_status', self::HOD_NOM_PENDING);

        if ($hod->role === 'hod') {
            $query->whereHas('team', function (Builder $teamQ) use ($hod): void {
                $this->groupManagementService->applyHodDepartmentScopeToTeamsQuery($teamQ, $hod);
            });
        }

        return (int) $query->count();
    }

    public function hodApologyTemplateChoices(): array
    {
        $templates = config('industry_challenge_flow.hod_apologies', []);

        $out = [];
        foreach ($templates as $key => $row) {
            if (! is_array($row)) {
                continue;
            }
            $out[] = [
                'key' => (string) $key,
                'ar' => (string) ($row['ar'] ?? ''),
                'en' => (string) ($row['en'] ?? ''),
            ];
        }

        return $out;
    }

    public function hodFinalizeIndustryNomination(
        User $hod,
        ChallengeRequest $nominationRequest,
        string $decision,
        ?string $templateKeyForLosers,
        ?string $notes,
    ): array {
        if (! in_array($hod->role, ['hod', 'admin'], true)) {
            return ['ok' => false, 'message' => 'Forbidden'];
        }

        if ($nominationRequest->hod_nomination_status !== self::HOD_NOM_PENDING) {
            return ['ok' => false, 'message' => 'This nomination is not pending'];
        }

        $nominationRequest->loadMissing('team');
        if ($hod->role === 'hod' && ! $this->groupManagementService->hodMayAccessTeamModel($hod, $nominationRequest->team)) {
            return ['ok' => false, 'message' => 'Forbidden'];
        }

        $decision = $decision === 'approve' ? 'approve' : 'reject';

        if ($decision === 'reject') {
            $nominationRequest->update([
                'company_status' => self::CS_AWAITING_COMPANY,
                'hod_nomination_status' => self::HOD_NOM_REJECTED,
                'hod_nomination_notes' => $notes ? trim($notes) : null,
                'hod_nomination_decided_at' => now(),
                'hod_nomination_template_key' => null,
                'company_nominated_for_hod_at' => null,
            ]);

            return ['ok' => true, 'message' => 'Returned to company for a different selection'];
        }

        $templateKey = $templateKeyForLosers ?: 'company_picked_other';

        return DB::transaction(function () use ($hod, $nominationRequest, $notes, $templateKey) {
            $request = ChallengeRequest::lockForUpdate()->findOrFail($nominationRequest->id);

            if ($request->hod_nomination_status !== self::HOD_NOM_PENDING) {
                return ['ok' => false, 'message' => 'This nomination is no longer pending'];
            }

            $challenge = IndustryChallenge::lockForUpdate()->findOrFail((int) $request->industry_challenge_id);

            if (Project::where('industry_challenge_id', $challenge->id)->exists()) {
                return ['ok' => false, 'message' => 'Challenge already finalized'];
            }

            $team = Team::lockForUpdate()->findOrFail((int) $request->team_id);

            $project = Project::create([
                'title' => $challenge->title,
                'abstract' => $challenge->description,
                'type' => 'industry_sponsored',
                'industry_challenge_id' => $challenge->id,
                'owner_user_id' => $team->leader_id,
                'status' => 'approved',
                'current_progress' => 0,
                'start_date' => now()->toDateString(),
            ]);

            $team->update([
                'industry_project_id' => $project->id,
            ]);

            $request->update([
                'company_status' => self::CS_FINALIZED_WON,
                'hod_nomination_status' => self::HOD_NOM_APPROVED,
                'hod_nomination_notes' => $notes ? trim($notes) : null,
                'hod_nomination_decided_at' => now(),
                'hod_nomination_template_key' => $templateKey,
            ]);

            $this->finalizeLosersOtherTeams($hod, $challenge, $request, $templateKey);

            return ['ok' => true, 'message' => 'Industry assignment confirmed'];
        });
    }

    public function apologyTextForStudent(string $templateKey, User $recipient): string
    {
        $templates = config('industry_challenge_flow.hod_apologies', []);

        /** @var array<string, mixed>|mixed $bundle */
        $bundle = $templates[$templateKey] ?? null;
        if (! is_array($bundle)) {
            return '';
        }

        $locale = ($recipient->locale ?? null) === 'en' ? 'en' : 'ar';

        return (string) ($bundle[$locale] ?? $bundle['ar'] ?? '');
    }

    public function supervisorDesignatedWorkspace(User $supervisor, Team $team, string $workspace): array
    {
        if (! in_array($supervisor->role, ['supervisor', 'admin'], true)) {
            return ['ok' => false, 'message' => 'Forbidden'];
        }
        if (! in_array($workspace, ['student', 'industry'], true)) {
            return ['ok' => false, 'message' => 'Invalid workspace'];
        }
        if ($supervisor->role === 'supervisor' && (int) $team->supervisor_id !== (int) $supervisor->id) {
            return ['ok' => false, 'message' => 'Forbidden'];
        }

        $team->update([
            'supervisor_designated_workspace' => $workspace,
        ]);

        return ['ok' => true, 'message' => 'Workspace preference saved'];
    }

    /** @internal */
    private function finalizeLosersOtherTeams(User $hod, IndustryChallenge $challenge, ChallengeRequest $winnerRequest, string $templateKey): void
    {
        $losers = ChallengeRequest::query()
            ->where('industry_challenge_id', $challenge->id)
            ->where('id', '<>', $winnerRequest->id)
            ->whereNotIn('company_status', [self::CS_REJECTED_BY_COMPANY])
            ->with(['team.members'])
            ->get();

        $msgAr = $this->apologyTextForTemplateKey($templateKey, 'ar');
        $body = $msgAr !== '' ? $msgAr : 'نعتذر لكم، لقد اختارت الشركة فريقاً آخر لهذا التحدي، وتم إلغاء الطلب من طرفكم.';
        $titleAr = $hod->role === 'hod' ? 'تحديث من رئيس القسم' : 'تحديث';

        foreach ($losers as $loser) {
            $wasPendingSupervisor = $loser->status === 'pending';
            $wasHodPending = $loser->hod_nomination_status === self::HOD_NOM_PENDING;
            $note = $wasPendingSupervisor
                ? 'تم إغلاق طلب التحدي؛ اختارت الشركة فريقاً آخر لهذا التحدي.'
                : $body;

            $loser->update([
                'status' => 'rejected',
                'supervisor_notes' => $note,
                'decided_at' => $wasPendingSupervisor ? now() : $loser->decided_at,
                'company_status' => self::CS_FINALIZED_LOST,
                'hod_nomination_status' => $wasHodPending ? self::HOD_NOM_REJECTED : $loser->hod_nomination_status,
                'hod_nomination_decided_at' => $wasHodPending ? now() : $loser->hod_nomination_decided_at,
            ]);

            $teamForNotify = $loser->team;
            if ($teamForNotify && filled($teamForNotify->supervisor_id)) {
                $this->notifyTeamStudentsTemplate($teamForNotify, $titleAr, $body, (int) $teamForNotify->supervisor_id);
            }
        }
    }

    private function apologyTextForTemplateKey(string $templateKey, string $locale): string
    {
        $templates = config('industry_challenge_flow.hod_apologies', []);

        /** @var array<string, mixed>|mixed $bundle */
        $bundle = $templates[$templateKey] ?? null;
        if (! is_array($bundle)) {
            return '';
        }

        return (string) ($bundle[$locale] ?? $bundle['ar'] ?? '');
    }

    private function notifyTeamStudentsTemplate(Team $team, string $title, string $messageBody, int $supervisorFk): void
    {
        $ids = TeamMember::query()->where('team_id', $team->id)->pluck('user_id')->map(fn ($id) => (int) $id)->unique()->filter()->values();
        foreach ($ids as $studentId) {
            StudentNotification::create([
                'supervisor_id' => $supervisorFk,
                'student_id' => $studentId,
                'title' => $title,
                'message' => $messageBody,
                'sent_at' => now(),
            ]);
        }
    }
}
