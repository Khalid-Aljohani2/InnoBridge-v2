<?php

namespace App\Http\Controllers;

use App\Models\ChallengeRequest;
use App\Models\IndustryChallenge;
use App\Models\SupervisorGroup;
use App\Models\Team;
use App\Models\User;
use App\Services\ChallengeWorkflowService;
use App\Services\GroupManagementService;
use App\Services\TeamJoinPolicyService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;

class PortalController extends Controller
{
    public function __construct(
        private readonly ChallengeWorkflowService $challengeWorkflowService,
        private readonly GroupManagementService $groupManagementService,
        private readonly TeamJoinPolicyService $teamJoinPolicyService,
    ) {}

    private function hodDepartmentRequired(User $user): bool
    {
        return ($user->role ?? null) === 'hod' && empty($user->department);
    }

    private function hodMayAccessTeam(User $user, Team $team): bool
    {
        if (($user->role ?? null) !== 'hod') {
            return true;
        }
        if (empty($user->department)) {
            return false;
        }

        return $team->department && (string) $team->department === (string) $user->department;
    }

    public function studentIndustryChallenges()
    {
        return Inertia::render('Student/IndustryChallenges', [
            'challenges' => $this->challengeWorkflowService->queryCompanyChallengesApproved()->get(),
        ]);
    }

    public function studentRequestChallenge(Request $request)
    {
        $request->validate([
            'industry_challenge_id' => 'required|integer|exists:industry_challenges,id',
        ]);

        $result = $this->challengeWorkflowService->createChallengeRequest($request->user(), (int) $request->industry_challenge_id);

        return back()->with(($result['ok'] ?? false) ? 'success' : 'error', (string) ($result['message'] ?? 'Error'));
    }

    public function supervisorPendingChallengeRequests(Request $request)
    {
        return Inertia::render('Supervisor/ChallengeRequests', [
            'requests' => $this->challengeWorkflowService->supervisorPendingRequests($request->user()),
        ]);
    }

    public function supervisorDecideChallengeRequest(Request $request, ChallengeRequest $challengeRequest)
    {
        $request->validate([
            'decision' => 'required|in:approve,reject',
            'notes' => 'nullable|string|max:2000',
        ]);

        $result = $this->challengeWorkflowService->supervisorDecideRequest(
            $request->user(),
            $challengeRequest,
            (string) $request->decision,
            $request->notes
        );

        return back()->with(($result['ok'] ?? false) ? 'success' : 'error', (string) ($result['message'] ?? 'Error'));
    }

    public function hodPanel(Request $request)
    {
        return Inertia::render('Supervisor/HodPanel', [
            'supervisors' => $this->groupManagementService->supervisorsForHoD($request->user()),
            'groups' => $this->groupManagementService->teamsForUser($request->user()),
            'teamJoinEnabled' => $this->teamJoinPolicyService->isEnabled(),
        ]);
    }

    public function hodToggleTeamJoin(Request $request)
    {
        $user = $request->user();
        if (! in_array($user?->role, ['hod', 'admin'], true)) {
            return back()->with('error', 'Forbidden');
        }
        if ($this->hodDepartmentRequired($user)) {
            return back()->with('error', 'HoD account has no department; action denied.');
        }

        $validated = $request->validate([
            'enabled' => 'required|boolean',
        ]);

        $this->teamJoinPolicyService->setEnabled((bool) $validated['enabled']);

        return back()->with('success', (bool) $validated['enabled']
            ? 'تم فتح الانضمام للفرق للطلاب.'
            : 'تم إغلاق الانضمام للفرق للطلاب.');
    }

    public function hodTeamsMonitor(Request $request)
    {
        return Inertia::render('Supervisor/HodTeamsMonitor', [
            'teams' => $this->groupManagementService->teamsMonitorForUser($request->user()),
        ]);
    }

    public function hodAssignSupervisor(Request $request, Team $team)
    {
        $request->validate([
            'supervisor_id' => 'required|integer|exists:users,id',
        ]);
        $result = $this->groupManagementService->assignTeamToSupervisor($request->user(), $team, (int) $request->supervisor_id);
        return back()->with(($result['ok'] ?? false) ? 'success' : 'error', (string) ($result['message'] ?? 'Error'));
    }

    public function hodReviewTeam(Request $request, Team $team)
    {
        $request->validate([
            'decision' => 'required|in:approve,reject',
            'notes' => 'nullable|string|max:2000',
        ]);

        $user = $request->user();
        if (! in_array($user?->role, ['hod', 'admin'], true)) {
            return back()->with('error', 'Forbidden');
        }
        if (! $this->hodMayAccessTeam($user, $team)) {
            return back()->with('error', 'Forbidden');
        }

        $decision = $request->decision === 'approve' ? 'approved' : 'rejected';
        $team->update([
            'review_status' => $decision,
            'review_notes' => $request->notes ? trim((string) $request->notes) : null,
            'reviewed_by_user_id' => $user->id,
            'reviewed_at' => now(),
            'is_active' => $decision === 'approved',
        ]);

        return back()->with('success', $decision === 'approved' ? 'Team approved' : 'Team rejected');
    }

    public function hodDismantleTeam(Request $request, Team $team)
    {
        $user = $request->user();
        if (! in_array($user?->role, ['hod', 'admin'], true)) {
            return back()->with('error', 'Forbidden');
        }
        if (! $this->hodMayAccessTeam($user, $team)) {
            return back()->with('error', 'Forbidden');
        }

        DB::transaction(function () use ($team) {
            $team = Team::lockForUpdate()->findOrFail($team->id);

            $supervisorGroupId = (int) ($team->supervisor_group_id ?? 0);
            $studentsGroupId = (int) ($team->students_group_id ?? 0);

            if ($supervisorGroupId) {
                SupervisorGroup::whereKey($supervisorGroupId)->delete();
            }
            if ($studentsGroupId) {
                SupervisorGroup::whereKey($studentsGroupId)->delete();
            }

            // Deleting the team will cascade delete team_members, team_invitations, and the linked project (teams.project_id).
            $team->delete();
        });

        return back()->with('success', 'Team dismantled');
    }

    public function hodDeleteSupervisor(Request $request, User $supervisor)
    {
        $user = $request->user();
        if (! in_array($user?->role, ['hod', 'admin'], true)) {
            return back()->with('error', 'Forbidden');
        }

        if ($supervisor->role !== 'supervisor') {
            return back()->with('error', 'Selected account is not a supervisor.');
        }

        if ((int) $supervisor->id === (int) $user->id) {
            return back()->with('error', 'You cannot delete your own account.');
        }

        if ($user->role === 'hod') {
            if (empty($user->department)) {
                return back()->with('error', 'Forbidden');
            }
            if (empty($supervisor->department) || (string) $supervisor->department !== (string) $user->department) {
                return back()->with('error', 'Forbidden');
            }
        }

        if (! Schema::hasColumn('users', 'is_active')) {
            return back()->with('error', 'System is not ready yet. Please run migrations first.');
        }

        if ((bool) $supervisor->is_active === false) {
            return back()->with('success', 'Supervisor account is already deactivated.');
        }

        $supervisor->update([
            'is_active' => false,
        ]);

        return back()->with('success', 'Supervisor account has been deactivated.');
    }

    public function hodActivateSupervisor(Request $request, User $supervisor)
    {
        $user = $request->user();
        if (! in_array($user?->role, ['hod', 'admin'], true)) {
            return back()->with('error', 'Forbidden');
        }

        if ($supervisor->role !== 'supervisor') {
            return back()->with('error', 'Selected account is not a supervisor.');
        }

        if ($user->role === 'hod') {
            if (empty($user->department)) {
                return back()->with('error', 'Forbidden');
            }
            if (empty($supervisor->department) || (string) $supervisor->department !== (string) $user->department) {
                return back()->with('error', 'Forbidden');
            }
        }

        if (! Schema::hasColumn('users', 'is_active')) {
            return back()->with('error', 'System is not ready yet. Please run migrations first.');
        }

        if ((bool) $supervisor->is_active === true) {
            return back()->with('success', 'Supervisor account is already active.');
        }

        $supervisor->update([
            'is_active' => true,
        ]);

        return back()->with('success', 'Supervisor account has been reactivated.');
    }

    public function industryPortal(Request $request)
    {
        $user = $request->user();

        $myChallenges = IndustryChallenge::query()
            ->where('kind', 'company_challenge')
            ->where('posted_by_user_id', $user->id)
            ->latest()
            ->get();

        $requests = $this->challengeWorkflowService->industryRequestsForCompany($user);

        return Inertia::render('Industry/Portal', [
            'challenges' => $myChallenges,
            'requests' => $requests,
        ]);
    }

    public function industryCreateChallenge(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'deadline' => 'nullable|date',
        ]);

        $result = $this->challengeWorkflowService->createCompanyChallenge($request->user(), $validated);
        return back()->with(($result['ok'] ?? false) ? 'success' : 'error', (string) ($result['message'] ?? 'Error'));
    }

    public function industryDecide(Request $request, ChallengeRequest $challengeRequest)
    {
        $request->validate([
            'decision' => 'required|in:accept,reject',
            'notes' => 'nullable|string|max:2000',
        ]);

        $result = $this->challengeWorkflowService->industryDecide($request->user(), $challengeRequest, (string) $request->decision, $request->notes);
        return back()->with(($result['ok'] ?? false) ? 'success' : 'error', (string) ($result['message'] ?? 'Error'));
    }
}

