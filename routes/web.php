<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ChallengeController; // <--- أضف هذا السطر ضروري جداً
use App\Http\Controllers\PreferenceController;
use App\Http\Controllers\SupervisorGroupChatController;
use App\Http\Controllers\SupervisorNotificationController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

// التعديل هنا: جعل الرابط يذهب للكنترولر لجلب البيانات
Route::get('/dashboard', [ChallengeController::class, 'index'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard');

// إضافة رابط حفظ التحديات الجديدة
Route::post('/challenges', [ChallengeController::class, 'store'])
    ->middleware(['auth'])
    ->name('challenges.store');

Route::patch('/challenges/{id}/progress', [ChallengeController::class, 'updateProgress'])
    ->middleware(['auth'])
    ->name('challenges.updateProgress');
Route::patch('/challenges/{id}/resubmit', [ChallengeController::class, 'resubmitAfterRevision'])
    ->middleware(['auth'])
    ->name('challenges.resubmit');
Route::get('/student/uploads', [ChallengeController::class, 'studentUploads'])
    ->middleware(['auth'])
    ->name('student.uploads');
Route::post('/student/uploads', [ChallengeController::class, 'uploadStudentSubmission'])
    ->middleware(['auth'])
    ->name('student.uploads.store');

Route::get('/supervisor/requests', [ChallengeController::class, 'supervisorRequests'])
    ->middleware(['auth'])
    ->name('supervisor.requests');
Route::get('/supervisor/students', [ChallengeController::class, 'supervisorStudents'])
    ->middleware(['auth'])
    ->name('supervisor.students');
Route::patch('/supervisor/students/{challenge}/plan', [ChallengeController::class, 'changeStudentPlan'])
    ->middleware(['auth'])
    ->name('supervisor.students.plan.update');
Route::get('/supervisor/milestones', [ChallengeController::class, 'supervisorMilestones'])
    ->middleware(['auth'])
    ->name('supervisor.milestones');
Route::post('/supervisor/milestones', [ChallengeController::class, 'createMilestoneTemplate'])
    ->middleware(['auth'])
    ->name('supervisor.milestones.store');
Route::patch('/supervisor/milestones/{milestone}', [ChallengeController::class, 'updateMilestoneTemplate'])
    ->middleware(['auth'])
    ->name('supervisor.milestones.update');
Route::delete('/supervisor/milestones/{milestone}', [ChallengeController::class, 'deleteMilestoneTemplate'])
    ->middleware(['auth'])
    ->name('supervisor.milestones.destroy');
Route::put('/supervisor/milestone-plans/{plan}/milestones/sync', [ChallengeController::class, 'syncMilestoneTemplates'])
    ->middleware(['auth'])
    ->name('supervisor.milestones.sync');
Route::post('/supervisor/milestone-plans', [ChallengeController::class, 'createMilestonePlan'])
    ->middleware(['auth'])
    ->name('supervisor.milestone-plans.store');
Route::post('/supervisor/milestone-plans/bundle-save', [ChallengeController::class, 'saveMilestonePlanBundle'])
    ->middleware(['auth'])
    ->name('supervisor.milestone-plans.bundle-save');
Route::patch('/supervisor/milestone-plans/{plan}', [ChallengeController::class, 'updateMilestonePlan'])
    ->middleware(['auth'])
    ->name('supervisor.milestone-plans.update');
Route::delete('/supervisor/milestone-plans/{plan}', [ChallengeController::class, 'deleteMilestonePlan'])
    ->middleware(['auth'])
    ->name('supervisor.milestone-plans.destroy');
Route::get('/supervisor/notifications', [SupervisorNotificationController::class, 'index'])
    ->middleware(['auth'])
    ->name('supervisor.notifications');
Route::get('/supervisor/groups', [SupervisorGroupChatController::class, 'index'])
    ->middleware(['auth'])
    ->name('supervisor.groups.index');
Route::get('/supervisor/groups/{group}/chat', [SupervisorGroupChatController::class, 'show'])
    ->middleware(['auth'])
    ->name('supervisor.groups.chat');
Route::post('/supervisor/groups/{group}/chat/messages', [SupervisorGroupChatController::class, 'store'])
    ->middleware(['auth'])
    ->name('supervisor.groups.messages.store');
Route::patch('/supervisor/groups/{group}', [SupervisorGroupChatController::class, 'update'])
    ->middleware(['auth'])
    ->name('supervisor.groups.update');
Route::patch('/supervisor/groups/{group}/members', [SupervisorGroupChatController::class, 'syncMembers'])
    ->middleware(['auth'])
    ->name('supervisor.groups.members.sync');
Route::patch('/supervisor/groups/{group}/admins', [SupervisorGroupChatController::class, 'syncAdmins'])
    ->middleware(['auth'])
    ->name('supervisor.groups.admins.sync');
Route::delete('/supervisor/groups/{group}', [SupervisorGroupChatController::class, 'destroy'])
    ->middleware(['auth'])
    ->name('supervisor.groups.destroy');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
    Route::patch('/preferences', [PreferenceController::class, 'update'])->name('preferences.update');
    Route::post('/supervisor/groups', [SupervisorNotificationController::class, 'createGroup'])->name('supervisor.groups.create');
    Route::post('/supervisor/notify-student', [SupervisorNotificationController::class, 'notifyStudent'])->name('supervisor.notify.student');
    Route::post('/supervisor/notify-group', [SupervisorNotificationController::class, 'notifyGroup'])->name('supervisor.notify.group');
});

require __DIR__.'/auth.php';

Route::get('/research', function () {
    return Inertia::render('Research');
})->middleware(['auth', 'verified'])->name('research');

Route::get('/milestones', [ChallengeController::class, 'milestones'])->name('milestones.index');