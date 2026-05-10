<?php

namespace App\Http\Middleware;

use App\Models\GroupChatNotification;
use App\Models\ChallengeRequest;
use App\Models\IndustryChallenge;
use App\Models\User;
use App\Services\NotificationFeedService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user(),
            ],
            'passwordlessLoginEnabled' => fn () => (bool) config('auth.passwordless_login'),
            'impersonation' => static function () use ($request) {
                if (! $request->session()->has('impersonator_id')) {
                    return null;
                }

                $impersonator = User::query()->find($request->session()->get('impersonator_id'));

                return [
                    'active' => true,
                    'adminName' => $impersonator?->name,
                ];
            },
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
                'originality' => fn () => $request->session()->get('originality'),
            ],
            'supervisorMeta' => fn () => (function () use ($request) {
                $user = $request->user();
                if (! $user || ! in_array($user->role, ['supervisor', 'admin'], true)) {
                    return null;
                }

                // Keep current counts lightweight and consistent with existing UI.
                // (Student-idea review queue counts; supervisor scoping is applied in service-layer pages.)
                $pending = 0;
                $awaitingRevision = 0;

                $canScopeByStudentIdea = Schema::hasTable('industry_challenges')
                    && Schema::hasColumn('industry_challenges', 'kind')
                    && Schema::hasColumn('industry_challenges', 'review_status');

                if ($canScopeByStudentIdea) {
                    $pending = IndustryChallenge::where('kind', 'student_idea')->where('review_status', 'pending_action')->count();
                    $awaitingRevision = IndustryChallenge::where('kind', 'student_idea')->where('review_status', 'awaiting_revision')->count();
                }

                $pendingChallengeRequestsQuery = ChallengeRequest::query()->where('status', 'pending');
                if ($user->role === 'supervisor') {
                    $pendingChallengeRequestsQuery->where('supervisor_id', $user->id);
                }
                $pendingChallengeRequests = $pendingChallengeRequestsQuery->count();

                return [
                    'pending_count' => $pending,
                    'awaiting_revision_count' => $awaitingRevision,
                    'review_queue_count' => $pending + $awaitingRevision,
                    'notification_count' => $awaitingRevision,
                    'pending_challenge_requests_count' => $pendingChallengeRequests,
                ];
            })(),
            'groupChatUnreadCount' => fn () => (function () use ($request) {
                $user = $request->user();
                if (! $user || ! Schema::hasTable('group_chat_notifications')) {
                    return 0;
                }

                return GroupChatNotification::where('user_id', $user->id)->where('is_read', false)->count();
            })(),
            'facultyModules' => fn () => (function () use ($request) {
                $user = $request->user();
                if (! $user) {
                    return [
                        'canExportReports' => false,
                        'canSupervisorGantt' => false,
                    ];
                }

                return [
                    'canExportReports' => in_array($user->role, ['supervisor', 'hod', 'admin'], true),
                    'canSupervisorGantt' => in_array($user->role, ['supervisor', 'admin'], true),
                ];
            })(),
            'inboxUnreadTotal' => fn () => (function () use ($request) {
                $user = $request->user();
                if (! $user) {
                    return 0;
                }

                $gc = 0;
                if (Schema::hasTable('group_chat_notifications') && in_array(($user->role ?? null), ['student', 'supervisor', 'admin', 'hod'], true)) {
                    $gc = (int) GroupChatNotification::where('user_id', $user->id)->where('is_read', false)->count();
                }

                $feed = 0;
                if (Schema::hasTable('user_notification_reads')) {
                    $feed = (int) app(NotificationFeedService::class)->feedUnreadEstimate($user);
                }

                return min(99, $gc + $feed);
            })(),
        ];
    }
}
